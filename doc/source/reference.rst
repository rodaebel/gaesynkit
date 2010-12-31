.. gaesynkit API reference guide.

=============
API Reference
=============


Javascript Client
=================


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




Python Server
=============


Handlers
--------

.. automodule:: gaesynkit.handlers
   :members:


JSON-RPC
--------

.. automodule:: gaesynkit.json_rpc
   :members:
