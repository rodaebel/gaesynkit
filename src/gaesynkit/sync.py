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
"""Module for synchronization support.

A SyncInfo is a wrapper class for entities which holds the synchronization
status of a user's entity.
"""

from google.appengine.api import datastore
from google.appengine.api import datastore_types
from google.appengine.api import datastore_errors

__all__ = ['SYNC_INFO_KIND', 'SyncInfo']

SYNC_INFO_KIND = "SyncInfo"


class SyncInfo(object):
    """Wrapper class for synchronization info entities.

    :param Entity entity: A datastore.Entity instance.
    """

    def __init__(self, entity):
        """Constructor."""

        if not isinstance(entity, datastore.Entity):
            raise TypeError("Expected datastore.Entity instance")

        self.__entity = entity

    @classmethod
    def from_params(cls, remote_key, version, content_hash, target_key=None,
            user=None):
        """Retrieve or create a SyncInfo entity from the given parameters.

        :param string remote_key: Remote entity key.
        :param int version: Remote entity version.
        :param string content_hash: MD5 hex digest.
        :param datastore_types.Key target_key: Key of the sync target entity.
        :param datastore_types.User user: A user.
        """

        entity = datastore.Entity(SYNC_INFO_KIND, name=remote_key)
        entity.update({"version": version, "content_hash": content_hash})

        if target_key:
            entity.update({"target_key": target_key})

        if user:
            entity.update({"user": user})

        return cls(entity)

    def entity(self):
        """Get raw entity.

        :returns: A datastore.Entity instance.
        """
        return self.__entity

    def user(self):
        """Get the user, if provided."""

        return self.__entity.get("user")

    def version(self):
        """Get the entity version."""

        return self.__entity["version"]

    def incr_version(self):
        """Increment the entity version."""

        self.__entity["version"] += 1
        return self.__entity["version"]

    def content_hash(self):
        """Get the content hash as MD5 hex digest."""

        return self.__entity["content_hash"]

    def set_content_hash(self, content_hash):
        """Set the content hash.

        :param str content_hash: MD5 hex digest.
        """
        self.__entity["content_hash"] = content_hash

    def target_key(self):
        """Get the sync target key."""

        return self.__entity.get("target_key")

    def target(self):
        """Get the sync target entity."""

        key = self.__entity.get("target_key")
        return datastore.Get(key)

    @classmethod
    def get(cls, keys):
        """Get one or more synchronization info entities.

        :param key|list keys: One or a list of `datastore_types.Key` instances.
        """

        if isinstance(keys, datastore_types.Key):
            keys_ = [keys]
        elif isinstance(keys, list):
            keys_ = keys
        else:
            raise TypeError("SyncInfo.get(keys) takes a key or list of keys")

        results = []

        for key in keys_:
            try:
                results.append(cls(datastore.Get(key)))
            except datastore_errors.EntityNotFoundError:
                results.append(None)

        if isinstance(keys, datastore_types.Key):
            return results[0]
        elif isinstance(keys, list):
            return results

    @classmethod
    def get_by_key_name(cls, key_names, parent=None):
        """Get one or more synchronization info entities.

        :param string|list key_names: A key name, or a list of key names.
        :param Entity|Key parent: The parent.
        """

        if isinstance(key_names, basestring):
            return cls.get(datastore_types.Key.from_path(
                SYNC_INFO_KIND, key_names, parent=parent))
        elif isinstance(key_names, list):
            return cls.get([datastore_types.Key.from_path(
                SYNC_INFO_KIND, name, parent=parent) for name in key_names])
        else:
            raise TypeError("SyncInfo.get_by_key_name(key_name, parent) takes "
                            "a key name or a list of key names")

    def key(self):
        """Get the key for this synchronization info entity."""

        return self.__entity.key()

    @staticmethod
    def kind():
        """Get the entity kind for synchronization info entities."""

        return SYNC_INFO_KIND

    def put(self):
        """Put the synchronization info entity."""

        return datastore.Put(self.__entity)
