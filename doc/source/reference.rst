.. gaesynkit API reference guide.

=============
API Reference
=============


Javascript Client
=================

The gaesynkit.js file contains the complete client-side implementation. It has
no dependencies to any other Javascript library and defines its own namesapce.

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

.. js:function:: gaesynkit.rpc.makeAsyncCall(request, callback)

   Makes an asynchronous JSON Remote Procedure Call.

   :param object request: The JSON-RPC request object.
   :param callback: Callback function to handle the JSON-RPC response.


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

.. js:class:: gaesynkit.db.ValueType(value)

   Constuctor for the value type base class. All other value types are
   inherited from this class, and thus, provide the same methods.

   :param value: The value.

.. js:function:: gaesynkit.db.ValueType.type()

   :returns: The value type name.

.. js:function:: gaesynkit.db.ValueType.value()

   :returns: Denormalized value.

.. js:class:: gaesynkit.db.ByteString(value)

   Byte strings are comparable to *short blob values*.

.. js:function:: gaesynkit.db.ByteString.value()

   :returns: The decoded value.

.. js:class:: gaesynkit.db.Datetime(value)

   Date and time object.

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


Python Server
=============


Handlers
--------

.. automodule:: gaesynkit.handlers
   :members:


Synchronization
---------------

.. automodule:: gaesynkit.syncable
   :members:


JSON-RPC
--------

.. automodule:: gaesynkit.json_rpc
   :members:
