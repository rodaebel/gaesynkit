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

import unittest


class test_handlers(unittest.TestCase):
    """Testing gaesynkit webapp handlers."""

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

        app = TestApp(handlers.app)

        res = app.post(
            '/gaesynkit/rpc/',
            '{"jsonrpc":"2.0","method":"syncEntity","params":[{"kind":"Book","key":"ZGVmYXVsdCEhQm9vawoy","id":2,"properties":{"title":{"type":"string","value":"The Adventures Of Tom Sawyer"},"date":{"type":"gd:when","value":"1876/6/1 0:0:0"},"classic":{"type":"bool","value":true},"pages":{"type":"int","value":275}}},"64b21971454e17acaad9cc72b143763e"],"id":3}')
 
        self.assertEqual("200 OK", res.status)
        self.assertEqual(
            '{"jsonrpc": "2.0", "result": 1, "id": 3}',
            res.body)
