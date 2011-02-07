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

try:
    from gaesynkit import json_rpc as rpc
except ImportError:
    import json_rpc as rpc

try:
    from gaesynkit.sync import SyncInfo
except ImportError:
    from sync import SyncInfo

from datetime import datetime
from google.appengine.api import datastore
from google.appengine.api import datastore_types
from google.appengine.api import users
from google.appengine.ext import webapp
from google.appengine.ext.webapp import util
import base64
import email
import itertools
import logging
import mimetypes
import os
import re
import simplejson
import time


ENTITY_NOT_CHANGED = 1

ENTITY_UPDATED = 2

ENTITY_STORED = 3

ENTITY_NOT_FOUND = 4

ENTITY_DELETED = 5

_APP_ID_SEP = "@"

_NAMESPACE_SEP = "!!"

_DEFAULT_NAMESPACE = "default"

_KIND_ID_SEP = "\n"

_KIND_NAME_SEP = "\b"

_PATH_SEP = "\t"

_PROPERTY_TYPES_MAP = {
    "string":       unicode,
    "bool":         bool,
    "int":          int,
    "float":        float,
    "key":          datastore_types.Key,
    "byte_string":  datastore_types.ByteString,
    "gd:when":      lambda v: datetime.strptime(v, "%Y/%m/%d %H:%M:%S"),
    "user":         users.User,
}

_PROPERTY_TYPES_STRINGS = {
    unicode:                        'string',
    str:                            'string',
    bool:                           'bool',
    int:                            'int',
    long:                           'int',
    type(None):                     'null',
    float:                          'float',
    datastore_types.Key:            'key',
    datastore_types.Blob:           'blob',
    datastore_types.ByteString:     'byte_string',
    datastore_types.Text:           'text',
    users.User:                     'user',
    datastore_types.Category:       'atom:category',
    datastore_types.Link:           'atom:link',
    datastore_types.Email:          'gd:email',
    datetime:                       'gd:when',
    datastore_types.GeoPt:          'georss:point',
    datastore_types.IM:             'gd:im',
    datastore_types.PhoneNumber:    'gd:phonenumber',
    datastore_types.PostalAddress:  'gd:psotaladdress',
    datastore_types.Rating:         'gd:rating',
    datastore_types.BlobKey:        'blobkey',
}

DECODED_KEY_PATTERN = re.compile(r'([a-z\-0-9]+?)%s([a-zA-Z0-9\-\_]+?)%s(.*)' %
                                 (_APP_ID_SEP, _NAMESPACE_SEP))


class NotAllowedError(Exception):
    """Error to be raised when synchronization is not allowed."""


def parent_from_remote_key(key_string):
    """Extracts parent key from remote key string.

    :param str key_string: The remote key string.
    :returns: A `datastore_types.Key` instance.
    """

    decoded = base64.b64decode(key_string)

    m = re.match(DECODED_KEY_PATTERN, decoded)

    if not m:
        raise Exception("Corrupted key")

    app_id, namespace, path = m.groups()

    if app_id != os.environ['APPLICATION_ID']:
        raise NotAllowedError(
            "Not allowed to access data of another application")

    if namespace == _DEFAULT_NAMESPACE:
        namespace = None

    def split_elem(elem):
        if _KIND_NAME_SEP in elem:
            return elem.split(_KIND_NAME_SEP, 1)
        else:
            raise StopIteration
 
    try:
        path_elements = list(
            itertools.chain(*map(split_elem, path.split(_PATH_SEP))))
    except StopIteration:
        sync_info = SyncInfo.get_by_key_name(
            base64.b64encode((namespace or _DEFAULT_NAMESPACE) +
            _NAMESPACE_SEP+(_PATH_SEP.join(path.split(_PATH_SEP)[:-1]))))
        if sync_info:
            return sync_info.target_key()
        else:
            return None

    if len(path_elements) == 2:
        return None

    kw = dict(namespace=namespace)

    return datastore_types.Key.from_path(*path_elements[:-2], **kw)


def entity_from_json_data(entity_dict):
    """Creates a new entity.

    :param dictionary entity_dict: JSON data.
    :returns: A `datastore.Entity` instance.
    """

    # Create new entity
    entity = datastore.Entity(
        entity_dict["kind"],
        name=entity_dict.get("name"),
        parent=parent_from_remote_key(entity_dict["key"]),
        namespace=entity_dict.get("namespace")
    )

    # Generator for converting properties
    def convertProps():
        properties = entity_dict["properties"]

        for prop in properties:
            value = properties[prop]
            if isinstance(value["value"], list):
                prop_t = list
            else:
                prop_t = _PROPERTY_TYPES_MAP[value["type"]]

            yield (prop, prop_t(value["value"]))

    # Populate entity
    entity.update(dict(convertProps()))

    return entity


def encode_properties(entity):
    """Encode entity properties to JSON serializable dictionary.

    :param datastore.Entity entity: An entity.
    :returns: Dictionary.
    """

    def encode(obj):
        if isinstance(obj, datetime):
            return obj.isoformat().replace('T', ' ').replace('-', '/')
        elif isinstance(obj, datastore_types.Key):
            return str(obj)
        elif isinstance(obj, users.User):
            return str(obj)

        return obj

    def encode_props():
        for key in entity.keys():
            prop = entity[key]

            prop_t = type(prop)
            if prop_t == list:
                prop_t = type(prop[0])

            type_str = _PROPERTY_TYPES_STRINGS[prop_t]

            yield (key, {"type": type_str, "value": encode(prop)})

    return dict(encode_props())


def json_data_from_entity(entity):
    """Get the JSON encodable entity dictionary.

    :param datastore.Entity entity: The entity.
    :returns: JSON encodable dictionary.
    """

    result_dict = dict(properties=encode_properties(entity))

    result_dict["kind"] = entity.kind()

    id_or_name = entity.key().id_or_name()
    if isinstance(id_or_name, basestring):
        result_dict["name"] = id_or_name
    else:
        result_dict["id"] = id_or_name

    return result_dict


def compare_replace_sync(entity_dict, sync_info, content_hash):
    """Make a compare-replace-sync between the stored and the remote entity.

    :param dictionary entity_dict: The remote entity dictionary.
    :param sync.SyncInfo sync_info: A synchronization info instance.
    :param string content_hash: MD5 checksum of the remote entity.
    :returns: A `datastore.Entity` instance.
    """

    # The remote entity
    remote_version = entity_dict["version"]
    remote_entity = entity_from_json_data(entity_dict)

    # The stored entity
    version = sync_info.version()
    entity = sync_info.target()

    assert remote_version <= version, "Version conflict"

    if remote_version < version:
        # If the remote version is older, just return the stored entity
        return entity

    # Merge entities
    for prop in remote_entity.keys():
        entity[prop] = remote_entity[prop]

    sync_info.incr_version()
    sync_info.set_content_hash(content_hash)

    return entity


class SyncHandler(rpc.JsonRpcHandler):
    """Handles JSON-RPC sync requests.

    This request handler is the main JSON-RPC endpoint.
    """

    @rpc.ServiceMethod
    def syncEntity(self, entity_dict, content_hash):
        """Synchronize entity.

        :param dictionary entity_dict: Dictionary from decoded JSON entity.
        :param string content_hash: MD5 checksum of the entity.
        """

        assert "key" in entity_dict, "Remote entity key missing"

        remote_key = entity_dict["key"]
        version = entity_dict["version"]
        user = users.get_current_user()

        sync_info = SyncInfo.get_by_key_name(remote_key)

        if sync_info:
            # Check whether user is allowed to synchronize the requested
            # entity
            if user != sync_info.user():
                raise NotAllowedError("Synchronization not allowed")

            # The entity has been synced before; check whether its contents
            # have been changed
            if sync_info.content_hash() == content_hash:
                # The entity contents haven't change
                result = {
                  "status": ENTITY_NOT_CHANGED,
                  "key": remote_key,
                  "version": sync_info.version()
                }
                return result

            entity = compare_replace_sync(entity_dict, sync_info, content_hash)

            json_data = json_data_from_entity(entity)
            json_data["key"] = remote_key
            json_data["version"] = sync_info.version()

            datastore.Put(entity)

            sync_info.put()

            return {"status": ENTITY_UPDATED, "entity": json_data}

        # Create and put new entity
        entity = entity_from_json_data(entity_dict)
        key = datastore.Put(entity)

        # Get a new version number
        version = entity_dict["version"] + 1

        # Create and put synchronization info
        sync_info = SyncInfo.from_params(
            remote_key, version, content_hash, key, user=user)
        sync_info.put()

        return {"status": ENTITY_STORED, "key": remote_key, "version": version}

    @rpc.ServiceMethod
    def syncDeletedEntity(self, key):
        """Delete entity.

        :param string key: The remote key.
        """

        sync_info = SyncInfo.get_by_key_name(key)
        datastore.Delete(sync_info.target_key())
        datastore.Delete(sync_info.key())

        return {"status": ENTITY_DELETED}

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
            data = fp.read().replace("$APPLICATION_ID",
                                     os.environ['APPLICATION_ID'])
            self.response.out.write(data)
        finally:
            fp.close()


app = webapp.WSGIApplication([
    ('.*/gaesynkit/rpc/.*', SyncHandler),
    ('.*/gaesynkit/.*', StaticHandler),
], debug=True)


def main():                 # pragma: no cover
    """The main function."""

    util.run_bare_wsgi_app(app)


if __name__ == "__main__":  # pragma: no cover
    main()
