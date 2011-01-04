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
"""Python implementation of the gaesynkit handlers JSON-RPC endpoint."""

from datetime import datetime
from google.appengine.api import datastore
from google.appengine.api import datastore_types
from google.appengine.ext import webapp
from google.appengine.ext.webapp import util
import email
import json_rpc as rpc
import logging
import mimetypes
import os
import time

ENTITY_NOT_CHANGED = 1

_PROPERTY_TYPES_MAP = {
  "byte_string": datastore_types.ByteString,
  "bool": bool,
  "gd:when": lambda v: datetime.strptime(v, "%Y/%m/%d %H:%M:%S"),
  "int": int,
  "key": datastore_types.Key,
  "string": unicode,
}


class JsonRpcHandler(rpc.JsonRpcHandler):
    """Handles JSON Remote Procedure Calls.

    This request handler is the main JSON-RPC endpoint.
    """

    @rpc.ServiceMethod
    def syncEntity(self, entity_dict, content_hash):
        """Synchronize entity.

        :param dictionary entity_dict: Dictionary from decoded JSON entity.
        :param string content_hash: MD5 checksum of the entity.
        """

        # Create new entity
        entity = datastore.Entity(
            entity_dict["kind"],
            name=entity_dict.get("name"),
            namespace=entity_dict.get("namespace")
        )

        # Generator for converting properties
        def convertProps():
            properties = entity_dict["properties"]

            for prop in properties:
                value = properties[prop]
                if isinstance(value["value"], list):
                    type_ = list
                else:
                    type_ = _PROPERTY_TYPES_MAP[value["type"]]

                yield (prop, type_(value["value"]))

        # Populate entity
        entity.update(dict(convertProps()))

        # Store entity
        key = datastore.Put(entity)

        return ENTITY_NOT_CHANGED

    @rpc.ServiceMethod
    def test(self, param):
        """For testing only.

        This method basically *echoes* the given parameter.

        :param object param: Arbitrary parameter.
        """
        return param


class StaticHandler(webapp.RequestHandler):
    """Request handler to serve static files."""

    def get(self):
        path = self.request.path
        filename = path[path.rfind('gaesynkit/')+10:]
        filename = os.path.join(os.path.dirname(__file__), 'static', filename)
        content_type, encoding = mimetypes.guess_type(filename)
        try:
            assert content_type and '/' in content_type, repr(content_type)
            fp = open(filename, 'rb')
        except (IOError, AssertionError):
            self.response.set_status(404)
            return
        expiration = email.Utils.formatdate(time.time()+3600, usegmt=True)
        self.response.headers['Content-type'] = content_type
        self.response.headers['Cache-Control'] = 'public, max-age=expiry'
        self.response.headers['Expires'] = expiration
        try:
            self.response.out.write(fp.read())
        finally:
            fp.close()


app = webapp.WSGIApplication([
    ('.*/gaesynkit/rpc/.*', JsonRpcHandler),
    ('.*/gaesynkit/.*', StaticHandler),
], debug=True)


def main():                 # pragma: no cover
    """The main function."""

    util.run_bare_wsgi_app(app)


if __name__ == "__main__":  # pragma: no cover
    main()
