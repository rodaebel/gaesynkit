.. gaesynkit documentation.

========
Overview
========

The gaesynkit library provides an API to create entities and synchronize data
between a web client and the `server-side` Datastore.


Storing Entities
----------------

The gaesynkit Client Storage API is mostly designed after the low-level GAE
Datastore API. The following sample shows how to create, put and get an entity
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
dumped output of the `Protocol Buffers` encoded entity::

  key <
    app: "test"
    path <
      Element {
        type: "Person"
        id: 3
      }
    >
  >
  entity_group <
    Element {
      type: "Person"
      id: 3
    }
  >
  property <
    name: "age"
    value <
      int64Value: 42
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

We choose JSON as format for representing the above entity::

  {
    "kind": "Person",
    "key": "ZGVmYXVsdCEhUGVyc29uCjE=",
    "id": 3,
    "properties": {
      "name": {"type":"string","value":"John Dowe"},
      "age": {"type":"int","value":42}
    }
  }

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


Property Value Types
--------------------

Property values are normalized. Most of the types are based on XML elements
from Atom and GData elements from the atom and gd namespaces. For more
information, see:

 * http://www.atomenabled.org/developers/syndication/
 * http://code.google.com/apis/gdata/common-elements.html

The namespace schemas are:

 * http://www.w3.org/2005/Atom
 * http://schemas.google.com/g/2005

The following example instantiates a
:class:`google.appengine.api.datastore.Entity` which stores one of each
available property values::

  from datetime import datetime
  from google.appengine.api import blobstore
  from google.appengine.api import datastore
  from google.appengine.api import datastore_types
  from google.appengine.api import users
  from google.appengine.ext import db

  entity = datastore.Entity("Test")

  entity.update({
    "tring": "A string.",
    "byte_string": datastore_types.ByteString("Byte String"),
    "boolean": True,
    "int": 42,
    "float": 1.82,
    "date": datetime.datetime.now(),
    "list": [1,2,3,4],
    "key": db.Key.from_path("Kind", "name"),
    "blob_key": blobstore.BlobKey("foobar"),
    "user": users.User("test@example.com"),
    "blob": db.Blob("foobar"),
    "text": db.Text("foobar"),
    "category": db.Category("category"),
    "link": db.Link("http://www.apple.com"),
    "email": db.Email("test@example.com"),
    "geopt": db.GeoPt("52.518,13.408"),
    "im": db.IM("http://example.com/", "Larry97"),
    "phone": db.PhoneNumber("1 (206) 555-1212"),
    "address": db.PostalAddress("1 Infinite Loop, Cupertino, CA"),
    "rating": db.Rating(97)
  })


Client-Server Communication
---------------------------

The gaesynkit framework uses `JSON-RPC 2.0
<http://groups.google.com/group/json-rpc/web/json-rpc-1-2-proposal>`_ for
client-server communication.


Synchronization
---------------

Multiple web clients can concurrently create, modify and delete Datastore
entities.
