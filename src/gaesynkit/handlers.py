# -*- coding: utf-8 -*-
#
# Copyright 2010 Tobias Rodäbel
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
"""Python implementation for the server-side gaesynkit library part."""

from google.appengine.ext import webapp
from google.appengine.ext.webapp import util
import email
import json_rpc as RPC
import logging
import mimetypes
import os
import time


class JsonRpcHandler(RPC.JsonRpcHandler):
    """Handles JSON Remote Procedure Calls.

    No need to define the post(self) method. Variable arguments *args and **kw
    are not allowed for service methods.
    """

    @RPC.ServiceMethod
    def test(self, param):
        """For testing only.

        Args:
            param: Arbitrary parameter.
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
