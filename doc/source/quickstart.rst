.. gaesynkit quickstart guide.

==========
Quickstart
==========


Installation
============

The easiest way to install gaesynkit is (provided that you have setuptools
installed) to use::

  $ easy_install gaesynkit


Usage
=====

In order to set up gaesynkit for a GAE Python application, just download the
package and copy its contents to the application directory. Add the following
URL handler definition to the app.yaml file::

  - url: /gaesynkit/.*
    script: gaesynkit/handlers.py


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
