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
"""Application for running the Javascript Unit Tests."""

from google.appengine.ext import webapp
from google.appengine.ext.webapp import util


TEST_HTML = """
<!DOCTYPE HTML>
<html>
  <head>
    <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
    <title>Unit Tests for gaesynkit</title>
    <link rel="stylesheet" href="qunit/qunit.css" type="text/css" />
    <script type="text/javascript" src="qunit/jquery-1.4.4.js"></script>
    <script type="text/javascript" src="qunit/qunit.js"></script>
    <script type="text/javascript" src="gaesynkit/gaesynkit.js"></script>
    <script type="text/javascript" src="tests/test_gaesynkit.js"></script>
  <body>
    <h1 id="qunit-header">Unit Tests</h1>  
    <h2 id="qunit-banner"></h2>  
    <div id="qunit-testrunner-toolbar"></div>
    <h2 id="qunit-userAgent"></h2>  
    <ol id="qunit-tests"></ol>
  </body>
</html>
"""


class MainHandler(webapp.RequestHandler):
    """Request handler for running our JS unit tests."""

    def get(self):
        self.response.out.write(TEST_HTML)


app = webapp.WSGIApplication([('.*', MainHandler),], debug=True)


def main():
    util.run_bare_wsgi_app(app)


if __name__ == "__main__":
    main()
