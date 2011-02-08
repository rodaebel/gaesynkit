=====================================================================
gaesynkit - Google App Engine Datastore/Local Storage Synchronization
=====================================================================

The gaesynkit framework enables Google App Engine application developers to
create entities in the client's Web Storage and synchronize them with the
server-side Datastore at a later point of time. So, offline editing becomes
easier and more secure through a higher level API.


Copyright and License
---------------------

Copyright 2011 Tobias Rodaebel

This software is released under the Apache License, Version 2.0. You may obtain
a copy of the License at

  http://www.apache.org/licenses/LICENSE-2.0

Google App Engine is a trademark of Google Inc.


Installation
------------

The easiest way to install gaesynkit is (provided that you have setuptools
installed) to use::

  $ easy_install gaesynkit


Developing
----------

If you want to tinker with the most recent development version of gaesynkit,
install the development environment by typing following commands::

  $ hg clone https://gaesynkit.googlecode.com/hg gaesynkit-dev
  $ cd gaesynkit-dev
  $ ./configure
  $ make

The ``configure`` command takes a number of options::

  Usage: configure [options]

  Options:
     -h,--help                display this message
        --gae-sdk=PATH        path to the Google App Engine SDK
        --with-python=PATH    use this Python interpreter


Running Tests
-------------

If you have checked out the development sources, you can run all unit tests
with the following commands.

Running the Python unit tests::

  $ make test

Getting a test coverage report::

  $ make coverage

The coverage HTML report will be placed into the ``htmlcov`` directory.

In order to run the Javascript unit tests, enter following command and open
http://localhost:8080 with your web browser::

  $ make testjs
