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
"""Unit tests for synchronization."""

import os
import unittest


class test_synchronization(unittest.TestCase):
    """Testing synchronization."""

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

    def test_SyncInfo(self):
        """Testing synchronization info entities."""

        from gaesynkit import sync

        remote_key = "ZGVmYXVsdCEhQm9vawhjYXRjaGVy"
        version = 1
        content_hash = "47eebabbdb1e1852d419618cea5dfca3"

        info = sync.SyncInfo.from_params(remote_key, version, content_hash)

        info_key = info.put()

        self.assertEqual(
            sync.SyncInfo.get(info_key).kind(), sync.SYNC_INFO_KIND)

        self.assertEqual(
            sync.SyncInfo.get(info_key).content_hash(), content_hash)

        self.assertEqual(
            sync.SyncInfo.get_by_key_name(remote_key).content_hash(),
            content_hash)

        self.assertEqual(
            sync.SyncInfo.get([info_key])[0].content_hash(), content_hash)

        self.assertEqual(
            sync.SyncInfo.get_by_key_name([remote_key])[0].content_hash(),
            content_hash)

    def test_exceptions(self):
        """Testing exceptions."""

        from gaesynkit import sync
        from google.appengine.api import datastore
        from google.appengine.api import datastore_errors
        from google.appengine.api import datastore_types

        remote_key = "ZGVmYXVsdCEhQm9vawhjYXRjaGVy"
        version = 1
        content_hash = "47eebabbdb1e1852d419618cea5dfca3"

        entity = datastore.Entity(sync.SYNC_INFO_KIND, name=remote_key)
        entity.update({"content_hash": content_hash, "version": version})
        info = sync.SyncInfo(entity.key())

        self.assertRaises(TypeError, sync.SyncInfo, "foo")

        self.assertEqual(
            info.get(datastore_types.Key.from_path("Something", "foo")), None)

        self.assertRaises(TypeError, info.get_by_key_name, 1)
