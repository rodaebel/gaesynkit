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

    def test_main(self):
        """Testing the main application."""

        from gaesynkit import handlers
        from webtest import AppError, TestApp

        app = TestApp(handlers.app)

        res = app.get('/gaesynkit/gaesynkit.js')
 
        self.assertEqual("200 OK", res.status)

        self.assertRaises(AppError, app.get, '/gaesynkit/unknown')

    def test_JsonRpcHandler(self):
        """Testing the JSON-RPC handler."""

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
            '"key":"ZGVmYXVsdCEhQm9vawhjYXRjaGVy","name":"catcher","propertie'
            's":{"title":{"type":"string","value":"The Catcher in the Rye"},"'
            'date":{"type":"gd:when","value":"1951/7/16 0:0:0"},"classic":{"t'
            'ype":"bool","value":true},"pages":{"type":"int","value":288},"ta'
            'gs":{"type":"string","value":["novel","identity"]}}},'
            '"47eebabbdb1e1852d419618cea5dfca3"],"id":3}')
 
        self.assertEqual("200 OK", res.status)
        self.assertEqual(
            '{"jsonrpc": "2.0", "result": {"status": 3}, "id": 3}', res.body)
