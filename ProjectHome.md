## Google App Engine Datastore/Client Storage Synchronization ##

The gaesynkit framework enables [Google App Engine](http://code.google.com/appengine) application developers to create entities in the client's [Web Storage](http://dev.w3.org/html5/webstorage) and synchronize them with the server-side Datastore at a later point of time. So, offline editing becomes easier and more secure through a higher level API.

The framework mainly consists of these components:

  * Javascript Client Storage API
  * Python Request Handler module for providing a JSON-RPC endpoint
  * Synchronization logic (Python)

The [Client Storage API](http://gaesynkit.appspot.com/docs/index.html) requires a browser capable of HTML5 Web Storage for persisting JSON serialized entities.

### Copyright and License ###

Copyright © 2011 Tobias Rodäbel

This software is released under the Apache License, Version 2.0. You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0

Google App Engine is a trademark of Google Inc.

### For Further Reading ###

[Offline: What does it mean and why should I care?](http://www.html5rocks.com/tutorials/offline/whats-offline/)

### Sample Code ###

The [Instant List](http://github.com/rodaebel/instantlist) application is a tiny demo using the Client Storage API.