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

from django.utils import simplejson
import os
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
            "key": db.Key.from_path("Kind", "name")
        })
        datastore.Put(entity)
        self.assertEqual(
            handlers.json_data_from_entity(entity),
            {'kind': u'Test', 'properties': {'string': {'type': 'string', 'value': 'A string.'}, 'int': {'type': 'int', 'value': 42}, 'float': {'type': 'float', 'value': 1.8200000000000001}, 'list': {'type': 'int', 'value': [1, 2, 3, 4]}, 'boolean': {'type': 'bool', 'value': True}, 'byte_string': {'type': 'byte_string', 'value': 'Byte String'}, 'key': {'type': 'key', 'value': 'agR0ZXN0cg4LEgRLaW5kIgRuYW1lDA'}, 'date': {'type': 'gd:when', 'value': '2011/01/06 00:00:00'}}, 'id': 3}
        )

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
            '{"jsonrpc":"2.0","method":"syncEntity","params":[{"kind":"Book",'
            '"key":"ZGVmYXVsdCEhQm9vawhjYXRjaGVy","version":0,"name":"catcher'
            '","properties":{"title":{"type":"string","value":"The Catcher in'
            ' the Rye"},"date":{"type":"gd:when","value":"1951/7/16 0:0:0"},"'
            'classic":{"type":"bool","value":true},"pages":{"type":"int","val'
            'ue":288},"tags":{"type":"string","value":["novel","identity"]}}}'
            ',"47eebabbdb1e1852d419618cea5dfca3"],"id":3}')
 
        self.assertEqual("200 OK", res.status)
        self.assertEqual(
            simplejson.loads(res.body),
            {u'jsonrpc': u'2.0', u'result': {u'status': 3, u'version': 1, u'key': u'ZGVmYXVsdCEhQm9vawhjYXRjaGVy'}, u'id': 3})

        res = app.post(
            '/gaesynkit/rpc/',
            '{"jsonrpc":"2.0","method":"syncEntity","params":[{"kind":"Book",'
            '"key":"ZGVmYXVsdCEhQm9vawhjYXRjaGVy","version":1,"name":"catcher'
            '","properties":{"title":{"type":"string","value":"The Catcher in'
            ' the Rye"},"date":{"type":"gd:when","value":"1951/7/16 0:0:0"},"'
            'classic":{"type":"bool","value":true},"pages":{"type":"int","val'
            'ue":287},"tags":{"type":"string","value":["novel","identity"]}}}'
            ',"568cd6b9ec85fb7ca24e3f7f98f5c456"],"id":4}')

        self.assertEqual("200 OK", res.status)
        self.assertEqual(
            simplejson.loads(res.body),
            {u'jsonrpc': u'2.0', u'result': {u'status': 2, u'entity': {u'kind': u'Book', u'version': 2, u'properties': {u'date': {u'type': u'gd:when', u'value': u'1951/07/16 00:00:00'}, u'classic': {u'type': u'bool', u'value': True}, u'pages': {u'type': u'int', u'value': 287}, u'tags': {u'type': u'string', u'value': [u'novel', u'identity']}, u'title': {u'type': u'string', u'value': u'The Catcher in the Rye'}}, u'key': u'ZGVmYXVsdCEhQm9vawhjYXRjaGVy', u'name': u'catcher'}}, u'id': 4})

        res = app.post(
            '/gaesynkit/rpc/',
            '{"jsonrpc":"2.0","method":"syncEntity","params":[{"kind":"Book",'
            '"key":"ZGVmYXVsdCEhQm9vawhjYXRjaGVy","version":0,"name":"catcher'
            '","properties":{"title":{"type":"string","value":"The Catcher in'
            ' the Rye"},"date":{"type":"gd:when","value":"1951/7/16 0:0:0"},"'
            'classic":{"type":"bool","value":true},"pages":{"type":"int","val'
            'ue":288},"tags":{"type":"string","value":["novel","identity"]}}}'
            ',"568cd6b9ec85fb7ca24e3f7f98f5c456"],"id":4}')

        self.assertEqual("200 OK", res.status)

        res = app.post(
            '/gaesynkit/rpc/',
            '{"jsonrpc":"2.0","method":"syncEntity","params":[{"kind":"Book",'
            '"key":"ZGVmYXVsdCEhQm9vawhjYXRjaGVy","version":0,"name":"catcher'
            '","properties":{"title":{"type":"string","value":"The Catcher in'
            ' the Rye"},"date":{"type":"gd:when","value":"1951/7/16 0:0:0"},"'
            'classic":{"type":"bool","value":true},"pages":{"type":"int","val'
            'ue":288},"tags":{"type":"string","value":["novel","identity"]}}}'
            ',"568cd6b9ec85fb7ca24e3f7p98f5c456"],"id":4}')

        self.assertEqual("200 OK", res.status)

        res = app.post(
            '/gaesynkit/rpc/',
            '{"jsonrpc":"2.0","method":"syncEntity","params":[{"kind":"Book",'
            '"key":"ZGVmYXVsdCEhQm9vawhjYXRjaGVy","version":1,"name":"catcher'
            '","properties":{"title":{"type":"string","value":"The Catcher in'
            ' the Rye"},"date":{"type":"gd:when","value":"1951/7/16 0:0:0"},"'
            'classic":{"type":"bool","value":true},"pages":{"type":"int","val'
            'ue":287},"tags":{"type":"string","value":["novel","identity"]}}}'
            ',"568cd6b9ec85fb7ca24e3f7f98f5c456"],"id":4}')

        self.assertEqual("200 OK", res.status)

    def test_decode_remote_key(self):
        """Decode a remote key string."""

        from gaesynkit import handlers
        from google.appengine.api import datastore_types

        self.assertEqual(
            handlers.decode_remote_key("ZGVmYXVsdCEhQQhhCUIIYg=="),
            datastore_types.Key.from_path(u'A', u'a', _app=u'test'))

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
            '{"jsonrpc":"2.0","method":"syncEntity","params":[{"kind":"A","ke'
            'y":"ZGVmYXVsdCEhQQhh","version":0,"name":"a","properties":{}},"b'
            '5c6689f064b6a0683f4d5b5c1939bee"],"id":6}')

        self.assertEqual("200 OK", res.status)

        self.assertEqual(A.get_by_key_name('a').kind(), 'A')

        res = app.post(
            '/gaesynkit/rpc/',
            '{"jsonrpc":"2.0","method":"syncEntity","params":[{"kind":"B","ke'
            'y":"ZGVmYXVsdCEhQQhhCUIIYg==","version":0,"name":"b","properties'
            '":{}},"fb1b335564b0155f839c16a4073eefa3"],"id":7}')

        self.assertEqual("200 OK", res.status)

        self.assertEqual(
            B.all().get().parent().key().name(),
            A.get_by_key_name('a').key().name())

        res = app.post(
            '/gaesynkit/rpc/',
            '{"jsonrpc":"2.0","method":"syncEntity","params":[{"kind":"A","ke'
            'y":"ZGVmYXVsdCEhQQoz","version":0,"id":3,"properties":{}},"cd0f1'
            'dd6b4ea5de20d95ffac4db8f29d"],"id":8}')

        self.assertEqual("200 OK", res.status)

        res = app.post(
            '/gaesynkit/rpc/',
            '{"jsonrpc":"2.0","method":"syncEntity","params":[{"kind":"B","ke'
            'y":"ZGVmYXVsdCEhQQozCUIKNA==","version":0,"id":4,"properties":{}'
            '},"b038fa4e11677b02f58aa83a1da103f0"],"id":9}')

        self.assertEqual("200 OK", res.status)

        self.assertEqual(
            set([b.parent().key().id_or_name() for b in B.all().fetch(2)]),
            set([a.key().id_or_name() for a in A.all().fetch(2)]))

        res = app.post(
            '/gaesynkit/rpc/',
            '{"jsonrpc":"2.0","method":"syncDeletedEntity","params":["ZGVmYXV'
            'sdCEhQQozCUIKNA=="],"id":9}')
