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
"""Unit tests for syncables."""

import unittest


class test_syncable(unittest.TestCase):
    """Testing syncables."""

    def test_Syncable(self):
        """Testing the Syncable class."""

        from django.utils import simplejson
        from gaesynkit import syncable
        from google.appengine.api import blobstore
        from google.appengine.api import datastore
        from google.appengine.api import datastore_types
        from google.appengine.api import users
        from google.appengine.ext import db
        import datetime
        import os

        os.environ['APPLICATION_ID'] = "test"
        os.environ['AUTH_DOMAIN'] = "example.com"

        entity = datastore.Entity("Test")

        entity.update({
            "tring": "A string.",
            "byte_string": datastore_types.ByteString("Byte String"),
            "boolean": True,
            "int": 42,
            "float": 1.82,
            "date": datetime.datetime.now(),
            "list": [1,2,3,4],
            "key": db.Key.from_path("Kind", "name"),
            "blob_key": blobstore.BlobKey("foobar"),
            "user": users.User("test@example.com"),
            "blob": db.Blob("foobar"),
            "text": db.Text("foobar"),
            "category": db.Category("category"),
            "link": db.Link("http://www.apple.com"),
            "email": db.Email("test@example.com"),
            "geopt": db.GeoPt("52.518,13.408"),
            "im": db.IM("http://example.com/", "Larry97"),
            "phone": db.PhoneNumber("1 (206) 555-1212"),
            "address": db.PostalAddress("1 Infinite Loop, Cupertino, CA"),
            "rating": db.Rating(97)
        })

        syncable = syncable.Syncable(entity)
