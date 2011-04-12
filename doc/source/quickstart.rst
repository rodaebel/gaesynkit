.. gaesynkit quickstart guide.

==========
Quickstart
==========

The gaesynkit framework aims at providing a Client Storage API which enables
Google App Engine application developers to create entities in the client's
`Web Storage <http://dev.w3.org/html5/webstorage>`_ and synchronize them with
the server-side Datastore at a later point of time.

It mainly consists of these components:

* Javascript Client Storage API
* Python Request Handler module for providing a JSON-RPC endpoint
* Synchronization logic (Python)

The Client Storage API utilizes the HTML5 Local Storage for persisting JSON
encoded entities *client-side*.


Installation
============

The easiest way to install gaesynkit is (provided that you have setuptools
installed) to use::

  $ easy_install gaesynkit

You can now make a symbolik link to it in the root directory of your Google App
Engine Python application.

Usage
=====

In order to set up gaesynkit for a GAE Python application, just download the
package and copy its contents to the application directory. Add the following
URL handler definition to the app.yaml file::

  - url: /gaesynkit/.*
    script: gaesynkit/handlers.py
    login: required

This URL handler provides the static Javascript library and handles JSON-RPC
requests. The URL handler should have a ``login`` setting to restrict visitors
to only those users who have signed in, or just those users who are
administrators for the application.

We make the Javascript Client Storage API available for our web application by
adding the following line to the `head` section of the application's HTML::

  <script type="text/javascript" src="gaesynkit/gaesynkit.js"></script>

Here is a brief example which shows how to initialize, store and synchronize an
entity in the client's Javascrtipt code::

  var entity = new gaesynkit.db.Entity("Person");

  var phone = new gaesynkit.db.PhoneNumber("+4420260199");

  entity.update({"name": "Arthur Dent", "planet": "Earth", "phone": phone});

  var storage = new gaesynkit.db.Storage;

  var key = storage.put(entity);

  entity = storage.sync(key);

The entitie's properties are accessible as follows::

  entity["name"];   // "Arthur Dent"

It's also possible to directly access properties as they were attributes::

  entity.phone;     // "+4420260199"

And both notations can be used to assign new values::

  entity.planet = "Beteigeuze 5";

After assigning a new value, the entity must be stored again before
synchronizing::

  key = storage.put(entity);

  entity = storage.sync(key);


Developing
==========

If you want to tinker with the most recent development version of gaesynkit,
install the development environment by typing following commands::

  $ hg clone https://gaesynkit.googlecode.com/hg gaesynkit-dev
  $ cd gaesynkit-dev
  $ ./configure
  $ make

The :command:`configure` command takes a number of options::

  Usage: configure [options]

  Options:
     -h,--help                display this message
        --gae-sdk=PATH        path to the Google App Engine SDK
        --with-python=PATH    use this Python interpreter


Running Tests
=============

If you have checked out the development sources, you can run all unit tests
with the following commands.

Running the Python unit tests::

  $ make test

Getting a test coverage report::

  $ make coverage

An HTML coverage report will be placed into the :file:`htmlcov` directory.

In order to run the Javascript unit tests, enter following command and open
http://localhost:8080 with your web browser::

  $ make testjs
