.. gaesynkit API reference guide.

=============
API Reference
=============


Javascript Client
=================

The gaesynkit.js file contains the complete client-side implementation. It has
no dependencies to any other Javascript library and defines its own Javascript
namesapce.

Add the following resource tag to the head section of your HTML file::

  <script type="text/javascript" src="gaesynkit/gaesynkit.js"></script>


Common
------

.. js:data:: gaesynkit.api.VERSION

   The current version of the gaesynkit Javascript library.


JSON-RPC
--------

.. js:data:: gaesynkit.rpc.ENDPOINT

   JSON-RPC service endpoint.

.. js:function:: gaesynkit.rpc.makeRpc(request, callback, async)

   Makes an (a)synchronous JSON Remote Procedure Call.

   :param object request: The JSON-RPC request object.
   :param function callback: Callback function to handle the JSON-RPC response.
   :param boolean async: Flag for asynchronous JSON-RPC.


Utilities
---------

.. js:function:: gaesynkit.util.base64.encode(string)

   Encode given string use Base64.

   :param string string: An input string.
   :returns: Encoded string.

.. js:function:: gaesynkit.util.base64.decode(string)

   Decode Base64 decoded string.

   :param string string: Encoded string.
   :returns: Decoded string.

.. js:function:: gaesynkit.util.md5(string)

   Calculate MD5 hexdigest for the given string.

   :param string string: An input string.
   :returns: Hexadecimal MD5 digest.


Value Types
-----------

Google App Engine Datastore types. See **Supported Value Types** in the API
documentation.

Most of these types are based on XML elements from Atom and GData elements from
the atom and gd namespaces. For more information, see:

* http://www.atomenabled.org/developers/syndication/
* http://code.google.com/apis/gdata/common-elements.html

The namespace schemas are:

* http://www.w3.org/2005/Atom
* http://schemas.google.com/g/2005

Base Value Type
+++++++++++++++

.. js:class:: gaesynkit.db.ValueType(value)

   Constuctor for the value type base class. All other value types are
   inherited from this class, and thus, provide the same methods.

   :param value: The value.

.. js:function:: gaesynkit.db.ValueType.type()

   :returns: The value type as string.

.. js:function:: gaesynkit.db.ValueType.value()

   :returns: Denormalized value.

ByteString
++++++++++

.. js:class:: gaesynkit.db.ByteString(value)

   Byte strings are comparable to *short blob values*.

.. js:function:: gaesynkit.db.ByteString.value()

   :returns: The decoded value.

Bool
++++

.. js:class:: gaesynkit.db.Bool(value)

   A boolean value, ``true`` or ``false``.

Integer
+++++++

.. js:class:: gaesynkit.db.Integer(value)

   An integer value.

Float
+++++

.. js:class:: gaesynkit.db.Float(value)

   A float value.

Datetime
++++++++

.. js:class:: gaesynkit.db.Datetime(value)

   Date and time object.

List
++++

.. js:class:: gaesynkit.db.List(value)

   A list of values, each of which is of one of the supported data types.

Key
+++

.. js:class:: gaesynkit.db.Key(encoded)

   Keys represent unique keys for datastore entities.

   A key is a Base64 encoded string containing the namespace and the path.
   The path consists of one or more path elements where each represents an
   entity. Every path begins with the key of the root entity which may be the
   current entity itself.

.. js:function:: gaesynkit.db.Key.from_path(kind, id_or_name, parent, namespace)

   Classmethod to create a key from the given path parameters.

   :param string kind: The entity kind.
   :param string|integer id_or_name: Either string or numerical id.
   :param string|Key parent: The parent key.
   :param string namespace: The namespace identifier.
   :returns: A Key object.

.. js:function:: gaesynkit.db.Key.has_id_or_name()

   :returns: Boolean which indicates whether the entity has either a name or
             a numeric id.

.. js:function:: gaesynkit.db.Key.id()

   :returns: The numeric id, as an integer, or undefined if the entity does
             not have a numeric id.

.. js:function:: gaesynkit.db.Key.id_or_name()

   :returns: The name or numeric id, whichever it has, or undefined.

.. js:function:: gaesynkit.db.Key.kind()

   :returns: The kind as a string.

.. js:function:: gaesynkit.db.Key.name()

   :returns: The name or undefined.

.. js:function:: gaesynkit.db.Key.namespace()

   :returns: The namespace or undefined.

.. js:function:: gaesynkit.db.Key.parent()

   :returns: Key of the parent entity.


Entities
--------

.. js:class:: gaesynkit.db.Entity(kind, name, id, parent, namespace, version)

   :param string kind: The entity kind.
   :param string name: If provided, this entity's name.
   :param number id: If provided, this entity's numerical id.
   :param Entity|Key parent: If provided, this entity's parent.
   :param string namespace: Overrides the default namespace.
   :param number version: This entity's version, default is 0.

.. js:function:: gaesynkit.db.Entity.key()

   :returns: This entity's key.

.. js:function:: gaesynkit.db.Entity.kind()

   :returns: The entity kind.

.. js:function:: gaesynkit.db.Entity.keys()

   :returns: Array of the entity's property names.

.. js:function:: gaesynkit.db.Entity.update(properties)

   :param object properies: Key-value pairs of properties where the key is
                            the property name and the value type may be one of
                            value types listed above.
   :returns: Array of the entity's property names.

.. js:function:: gaesynkit.db.Entity.toJSON()

   :returns: A JSON object of this entity.

.. js:function:: gaesynkit.db.Entity.vesion()

   :returns: This entity's version.

.. js:function:: gaesynkit.db.Entity.set_version(version)

   :param number version: Use this as new version number.


Storage
-------

.. js:class:: gaesynkit.db.Storage

   Wraps the HTML5 Local Storage.

.. js:function:: gaesynkit.db.Storage.put(entity)

   Put an entity into the storage.

   :param Entity entity: An entity object.

.. js:function:: gaesynkit.db.Storage.get(key)

   Retrieve entity from the storage.

   :param Key|string key: A key object or encoded key string.
   :returns: An entity object.
   :raises: An "Entity not found" error.

.. js:function:: gaesynkit.db.Storage.deleteEntityWithKey(key)

   Delete an entity from the storage.

   :param Key|string key: A key object or encoded key string.

.. js:function:: gaesynkit.db.Storage.sync(key_or_entity, async)

   Synchronize entity between client-side storage and the Google App Engine
   Datastore.

   :param Key|Entity key_or_entity: A key object or an entity object.
   :param boolean async: Flag to specify if the synchronization is done
                         asynchronously or not.


Python Server
=============


Handlers
--------

.. automodule:: gaesynkit.handlers
   :members:


Synchronization
---------------

.. automodule:: gaesynkit.sync
   :members:


JSON-RPC
--------

.. automodule:: gaesynkit.json_rpc
   :members:
