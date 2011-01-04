.. gaesynkit quickstart guide.

==========
Quickstart
==========

The gaesynkit framework aims at providing a Client Storage API which enables
Google App Engine application developers to create entities in the local
storage of a web client and synchronize them with the server-side Datastore at
a later point of time.

It mainly consists of these components:

* Javascript Client Storage API library
* Python Request Handler module for providing the JSON-RPC endpoint

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

This URL handler provides the static Javascript library and handles JSON-RPC
requests. Add this line to the `head` of the application's HTML to include the
geasynkit Javascript library::

  <script type="text/javascript" src="gaesynkit/gaesynkit.js"></script>

The following example shows how to initialize, store and synchronize an entity
in the client's Javascrtipt code::

  var entity = new gaesynkit.db.Entity("Person");
  entity.update({"name": "Arthur Dent", "planet": "Earth"});
  var storage = new gaesynkit.db.Storage;
  var key = storage.put(entity);
  storage.sync(key);


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
