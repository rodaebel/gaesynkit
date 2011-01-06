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
from django.utils import simplejson
from google.appengine.api import datastore
from google.appengine.api import datastore_types
from google.appengine.api import users
from google.appengine.ext import webapp
from google.appengine.ext.webapp import util
from sync import SyncInfo
import email
import json_rpc as rpc
import logging
import mimetypes
import os
import time

ENTITY_NOT_CHANGED = 1
ENTITY_UPDATED = 2
ENTITY_STORED = 3

_PROPERTY_TYPES_MAP = {
    "string":       unicode,
    "bool":         bool,
    "int":          int,
    "float":        float,
    "key":          datastore_types.Key,
    "byte_string":  datastore_types.ByteString,
    "gd:when":      lambda v: datetime.strptime(v, "%Y/%m/%d %H:%M:%S"),
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


def entity_from_json_data(entity_dict):
    """Creates a new entity.

    :param dictionary entity_dict: JSON data.
    :returns: A `datastore.Entity` instance.
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


def compare_merge_sync(entity_dict, sync_info):
    """Make a compare-merge-sync between the given entities.

    :param dictionary entity_dict: The remote entity dictionary.
    :param sync.SyncInfo sync_info: A synchronization info instance.
    :returns: A new `datastore.Entity` instance.
    """

    remote_version = entity_dict["version"]
    remote_entity = entity_from_json_data(entity_dict)
    stored_version = sync_info.version()
    stored_entity = sync_info.target()

    assert remote_entity.key() == stored_entity.key(), "Key must not differ"

    assert remote_version <= stored_version, "Version conflict"

    if remote_version < stored_version:
        return stored_entity
    if remote_version == stored_version:
        return remote_entity


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

        sync_info = SyncInfo.get_by_key_name(remote_key)

        if sync_info:
            # The entity has been synced before; check whether its contents
            # have been changed

            if sync_info.content_hash() == content_hash:
                # The entity contents haven't change
                return {"status": ENTITY_NOT_CHANGED}

            new_entity = compare_merge_sync(entity_dict, sync_info)

            json_data = json_data_from_entity(new_entity)
            json_data["key"] = remote_key
            json_data["version"] = sync_info.incr_version()

            datastore.Put(new_entity)
            sync_info.put()

            return {"status": ENTITY_UPDATED, "entity": json_data}

        # Create and put new entity
        entity = entity_from_json_data(entity_dict)
        key = datastore.Put(entity)

        # Create and put synchronization info
        entity_dict["version"] += 1
        version = entity_dict["version"]
        sync_info = SyncInfo.from_params(remote_key, version, content_hash, key)
        sync_info.put()

        return {"status": ENTITY_STORED, "key":remote_key, "version": version}

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
    ('.*/gaesynkit/rpc/.*', SyncHandler),
    ('.*/gaesynkit/.*', StaticHandler),
], debug=True)


def main():                 # pragma: no cover
    """The main function."""

    util.run_bare_wsgi_app(app)


if __name__ == "__main__":  # pragma: no cover
    main()
