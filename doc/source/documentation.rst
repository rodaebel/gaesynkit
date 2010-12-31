.. gaesynkit documentation.

=============
Documentation
=============

The gaesynkit library provides an API to create entities and synchronize data
between a web client and the `server-side` Datastore.


Storing Entities
----------------

The gaesynkit Client Storage API is mostly designed after the low-level GAE
Datastore API. The follwing sample shows how to create, put and get an entity
with Javascript::

  var entity, db, key

  entity = new gaesynkit.db.Entity("Person");

  entity.update({"name": "John Dowe", "age": 42});

  db = new gaesynkit.db.Storage;

  key = db.put(entity);

  entity = db.get(key);

  entity["name"]; // -> "John Dowe"

The equivalent GAE Python API looks like this::

  from google.appengine.api import datastore

  entity = datastore.Entity("Person")

  entity.update({"name": "John Dowe", "age": 42})

  key = datastore.Put(entity)

  entity = datastore.Get(key)

  entity["name"] # -> "John Dowe"

Nearly identical, isn't it. In order to understand how we store entities, let's now take a look at some lower level details of the GAE Datastore.

Unlike a relational database, Google App Engine implements a `schemaless`
Datastore that stores and performs queries over data objects, known as
entities, which have one or more properties. The following example shows the
XML representation of such an entity::

  <entity kind="Person" key="ag5nYWVzeW5raXR0ZXN0c3IMCxIGUGVyc29uGAQM">
    <key>tag:gaesynkittests.gmail.com,2010-12-26:Person[ag5nYWVzeW5raXR0ZXN0c3IMCxIGUGVyc29uGAQM]</key>
    <property name="birthday" type="gd:when">1982-10-04 00:00:00</property>
    <property name="description" type="text">This is a description.</property>
    <property name="email" type="gd:email"><gd:email address="john@example.com" /></property>
    <property name="height" type="float">1.82</property>
    <property name="name" type="string">John Dowe</property>
    <property name="tags" type="string">nice</property>
    <property name="tags" type="string">educated</property>
  </entity>

For the curious, this is the string output of the `Protocol Buffers` encoded
version of the same entity::

  key <
    app: "gaesynkittests"
    path <
      Element {
        type: "Person"
        id: 4
      }
    >
  >
  entity_group <
    Element {
      type: "Person"
      id: 4
    }
  >
  property <
    meaning: 7
    name: "birthday"
    value <
      int64Value: 0x16e1b16a82000
    >
    multiple: false
  >
  property <
    meaning: 8
    name: "email"
    value <
      stringValue: "john@example.com"
    >
    multiple: false
  >
  property <
    name: "height"
    value <
      doubleValue: 1.82
    >
    multiple: false
  >
  property <
    name: "name"
    value <
      stringValue: "John Dowe"
    >
    multiple: false
  >
  property <
    name: "tags"
    value <
      stringValue: "nice"
    >
    multiple: true
  >
  property <
    name: "tags"
    value <
      stringValue: "educated"
    >
    multiple: true
  >
  raw_property <
    meaning: 15
    name: "description"
    value <
      stringValue: "This is a description."
    >
    multiple: false
  >

We choose JSON as format for representing the above entity::

  {
    "kind": "Person",
    "key": "ag5nYWVzeW5raXR0ZXN0c3IMCxIGUGVyc29uGAQM",
    "properties": [
      {"name": "birthday", "type": "gd:when", "value": "1982-10-04 00:00:00"},
      {"name": "description", "type": "text", "value": "Some description."},
      {"name": "email", "type": "gd:email", "value": "john@example.com"},
      {"name": "height", "type": "float", "value": "1.82"},
      {"name": "name", "type": "string", "value": "John Dowe"},
      {"name": "tags", "type": "string", "value": "nice"},
      {"name": "tags", "type": "string", "value": "educated"}
    ]
  }

Property values are normalized. Most of the types are based on XML elements
from Atom and GData elements from the atom and gd namespaces. For more
information, see:

 * http://www.atomenabled.org/developers/syndication/
 * http://code.google.com/apis/gdata/common-elements.html

The namespace schemas are:

 * http://www.w3.org/2005/Atom
 * http://schemas.google.com/g/2005

Serializing an entity to JSON is fairly easy. The following Python program
shows a simplified version of how we do it::

  from datetime import datetime
  from google.appengine.api import datastore
  from google.appengine.api import datastore_types
  from django.utils import simplejson
  import re

  entity = datastore.Entity("Person")

  splitdate = lambda s: map(int, re.split('[^\d]', s)[:-1])

  entity.update({
    "name": "John",
    "email": datastore_types.Email("john@example.com"),
    "birthday": datetime(*splitdate("1978-04-01 00:00:00"))
  })

  class JSONEncoder(simplejson.JSONEncoder):
    def default(self, obj):
      if isinstance(obj, datetime):
        return obj.isoformat().replace('T', ' ')
      super(JSONEncoder, self).default(obj)

  json_entity = simplejson.dumps(entity, cls=JSONEncoder)


Synchronization
---------------

Multiple web clients can concurrently create, modify and delete Datastore
entities.
