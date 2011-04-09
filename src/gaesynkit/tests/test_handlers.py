# -*- coding: utf-8 -*-
#
# Copyright 2011 Tobias Rodäbel
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.
"""Unit tests for the gaesynkit handlers and JSON-RPC endpoint."""

import os
import simplejson
import unittest


class test_handlers(unittest.TestCase):
    """Testing gaesynkit webapp handlers."""

    def setUp(self):
        """Set up test environment."""

        from google.appengine.api import apiproxy_stub_map
        from google.appengine.api import datastore_file_stub

        os.environ['APPLICATION_ID'] = 'test'
        os.environ['AUTH_DOMAIN'] = "example.com"

        self.path = os.path.join(
            os.environ.get('TMPDIR', ''), 'test_datastore.db')

        if not apiproxy_stub_map.apiproxy.GetStub('datastore_v3'):
            # Initialize Datastore
            datastore = datastore_file_stub.DatastoreFileStub('test', self.path)
            apiproxy_stub_map.apiproxy.RegisterStub('datastore_v3', datastore)

    def tearDown(self):
        """Clean up."""

        try:
            os.unlink(self.path)
        except OSError:
            pass

    def test_entity_to_dict(self):
        """Converts a datastore.Entity instance to a JSON encodable dict."""

        from datetime import datetime
        from gaesynkit import handlers
        from google.appengine.api import datastore
        from google.appengine.api import datastore_types
        from google.appengine.api import users
        from google.appengine.ext import db

        entity = datastore.Entity("Test")
        entity.update({
            "string": "A string.",
            "byte_string": datastore_types.ByteString("Byte String"),
            "boolean": True,
            "int": 42,
            "float": 1.82,
            "date": datetime(2011, 01, 06),
            "list": [1,2,3,4],
            "key": db.Key.from_path("Kind", "name"),
            "user": users.User("tester@example.com"),
            "email": db.Email("tester@example.com"),
            "location": db.GeoPt(52.500556, 13.398889),
        })
        datastore.Put(entity)
        self.assertEqual(
            handlers.json_data_from_entity(entity),
            {'kind': u'Test', 'properties': {'string': {'type': 'string', 'value': 'A string.'}, 'int': {'type': 'int', 'value': 42}, 'float': {'type': 'float', 'value': 1.8200000000000001}, 'list': {'type': 'int', 'value': [1, 2, 3, 4]}, 'boolean': {'type': 'bool', 'value': True}, 'byte_string': {'type': 'byte_string', 'value': 'Byte String'}, 'key': {'type': 'key', 'value': 'agR0ZXN0cg4LEgRLaW5kIgRuYW1lDA'}, 'date': {'type': 'gd:when', 'value': '2011/01/06 00:00:00'}, 'email': {'type': 'gd:email', 'value': u'tester@example.com'}, 'user': {'type': 'user', 'value': 'tester'}, 'location': {'type': 'georss:point', 'value': datastore_types.GeoPt(52.500556000000003, 13.398889)}}, 'id': 2}
        )

        entity = datastore.Entity("A", name="a")
        self.assertEqual(
            handlers.json_data_from_entity(entity),
            {'kind': u'A', 'properties': {}, 'name': u'a'})

    def test_entity_from_json_data(self):
        """Create a datastore.Entity instance from JSON data."""

        from datetime import datetime
        from gaesynkit import handlers
        from google.appengine.api import datastore_types

        data = {
            'kind': u'A',
            'key': u'dGVzdEBkZWZhdWx0ISFBCGE=',
            'id': 2,
            'properties':{
                'string':{'type':'string','value':'A string.'},
                'boolean':{'type':'bool','value':True},
                'int':{'type':'int','value':42},
                'float':{'type':'float','value':1.8200000000000001},
                'key':{'type':'key','value':'agR0ZXN0cg4LEgRLaW5kIgRuYW1lDA'},
                'byte_string':{'type':'byte_string','value':'Byte String'}, 
                'date':{'type':'gd:when','value':'2011/01/06 00:00:00'},
                'list':{'type':'int','value':[1, 2, 3, 4]},
                'email':{'type':'gd:email','value':u'tester@example.com'},
                'location':{'type':'georss:point','value':u'52.5,13.3'},
            }
        }

        entity = handlers.entity_from_json_data(data)

        self.assertEqual(entity['string'], u'A string.')
        self.assertEqual(entity['boolean'], True)
        self.assertEqual(entity['int'], 42)
        self.assertEqual(entity['float'], 1.8200000000000001)
        self.assertEqual(
            entity['key'],
            datastore_types.Key.from_path(u'Kind', u'name', _app=u'test'))
        self.assertEqual(entity['byte_string'], 'Byte String')
        self.assertEqual(entity['date'], datetime(2011, 1, 6, 0, 0))
        self.assertEqual(entity['list'], [1, 2, 3, 4])
        self.assertEqual(entity['email'], u'tester@example.com')
        self.assertEqual(
            entity['location'],
            datastore_types.GeoPt(52.5, 13.300000000000001))

    def test_main(self):
        """Testing the main application."""

        from gaesynkit import handlers
        from webtest import AppError, TestApp

        app = TestApp(handlers.app)

        res = app.get('/gaesynkit/gaesynkit.js')
 
        self.assertEqual("200 OK", res.status)

        self.assertRaises(AppError, app.get, '/gaesynkit/unknown')

    def test_SyncHandler(self):
        """Testing the synchronization JSON-RPC handler."""

        from gaesynkit import handlers
        from webtest import AppError, TestApp

        app = TestApp(handlers.app)

        res = app.post(
            '/gaesynkit/rpc/',
            '{"jsonrpc": "2.0", "method": "test", "params": [true], "id": 1}')
 
        self.assertEqual("200 OK", res.status)
        self.assertEqual(
            '{"jsonrpc": "2.0", "result": true, "id": 1}',
            res.body)

    def test_SyncEntity(self):
        """Synchronizing an entity."""

        from gaesynkit import handlers
        from webtest import AppError, TestApp

        # Initialize app
        app = TestApp(handlers.app)

        # Make a request
        res = app.post(
            '/gaesynkit/rpc/',
            '{"jsonrpc":"2.0","method":"syncEntity","params":[{"kind":"Book","key":"dGVzdEBkZWZhdWx0ISFCb29rCjI=","version":0,"id":2,"properties":{"title":{"type":"string","value":"The Catcher in the Rye"},"date":{"type":"gd:when","value":"1951/7/16 0:0:0"},"classic":{"type":"bool","value":true},"pages":{"type":"int","value":288},"tags":{"type":"string","value":["novel","identity"]}}},"6eb9a4d405f3ee6c67e965b7693108d2"],"id":3}')
 
        self.assertEqual("200 OK", res.status)
        self.assertEqual(
            simplejson.loads(res.body),
            {u'jsonrpc': u'2.0', u'result': {u'status': 3, u'version': 1, u'key': u'dGVzdEBkZWZhdWx0ISFCb29rCjI='}, u'id': 3})

        res = app.post(
            '/gaesynkit/rpc/',
            '{"jsonrpc":"2.0","method":"syncEntity","params":[{"kind":"Book","key":"dGVzdEBkZWZhdWx0ISFCb29rCjI=","version":1,"id":2,"properties":{"title":{"type":"string","value":"The Catcher in the Rye"},"date":{"type":"gd:when","value":"1951/7/16 0:0:0"},"classic":{"type":"bool","value":true},"pages":{"type":"int","value":287},"tags":{"type":"string","value":["novel","identity"]}}},"7ec49827a52b56fdd24b07410c9bf0d6"],"id":4}')

        self.assertEqual("200 OK", res.status)
        self.assertEqual(
            simplejson.loads(res.body),
            {u'jsonrpc': u'2.0', u'result': {u'status': 2, u'entity': {u'kind': u'Book', u'version': 2, u'properties': {u'date': {u'type': u'gd:when', u'value': u'1951/07/16 00:00:00'}, u'classic': {u'type': u'bool', u'value': True}, u'pages': {u'type': u'int', u'value': 287}, u'tags': {u'type': u'string', u'value': [u'novel', u'identity']}, u'title': {u'type': u'string', u'value': u'The Catcher in the Rye'}}, u'key': u'dGVzdEBkZWZhdWx0ISFCb29rCjI=', u'id': 1}}, u'id': 4})

        res = app.post(
            '/gaesynkit/rpc/',
            '{"jsonrpc":"2.0","method":"syncEntity","params":[{"kind":"Book","key":"dGVzdEBkZWZhdWx0ISFCb29rCjI=","version":0,"id":2,"properties":{"title":{"type":"string","value":"The Catcher in the Rye"},"date":{"type":"gd:when","value":"1951/7/16 0:0:0"},"classic":{"type":"bool","value":true},"pages":{"type":"int","value":287},"tags":{"type":"string","value":["novel","identity"]}}},"7ec49827a52b56fdd24b07410c9bf0d6"],"id":4}')

        self.assertEqual("200 OK", res.status)

    def test_parent_from_remote_key(self):
        """Extract parent from a remote key string."""

        from gaesynkit import handlers
        from google.appengine.api import datastore_types

        self.assertEqual(
            handlers.parent_from_remote_key("dGVzdEBkZWZhdWx0ISFBCGEJQghi"),
            datastore_types.Key.from_path(u'A', u'a', _app=u'test'))

        self.assertEqual(
            handlers.parent_from_remote_key("dGVzdEBkZWZhdWx0ISFBCGE="),
            None)

        self.assertRaises(
            Exception,
            handlers.parent_from_remote_key, "dVzdEBkZdWx0ISFBCGE=")

        self.assertRaises(
            handlers.NotAllowedError,
            handlers.parent_from_remote_key, "Z2Flc3lua2l0QGRlZmF1bHQhIUEIYQ==")

    def test_SyncAncestorEntity(self):
        """Synchronizing an ancestor relationship."""

        from gaesynkit import handlers
        from google.appengine.ext import db
        from webtest import AppError, TestApp

        # Models for verifying out test results
        class A(db.Model):
            pass

        class B(db.Model):
            pass

        # Initialize app
        app = TestApp(handlers.app)

        res = app.post(
            '/gaesynkit/rpc/',
            '{"jsonrpc":"2.0","method":"syncEntity","params":[{"kind":"A","key":"dGVzdEBkZWZhdWx0ISFBCGE=","version":0,"name":"a","properties":{}},"66b18b82cb6a183d4d91316027426a39"],"id":5}')

        self.assertEqual("200 OK", res.status)

        self.assertEqual(A.get_by_key_name('a').kind(), 'A')

        res = app.post(
            '/gaesynkit/rpc/',
            '{"jsonrpc":"2.0","method":"syncEntity","params":[{"kind":"B","key":"dGVzdEBkZWZhdWx0ISFBCGEJQghi","version":0,"name":"b","properties":{}},"cb9594c64733d11e131643cfd8689d82"],"id":6}')

        self.assertEqual("200 OK", res.status)

        self.assertEqual(
            B.all().get().parent().key().name(),
            A.get_by_key_name('a').key().name())

        res = app.post(
            '/gaesynkit/rpc/',
            '{"jsonrpc":"2.0","method":"syncDeletedEntity","params":["dGVzdEBkZWZhdWx0ISFBCGEJQghi"],"id":7}')
