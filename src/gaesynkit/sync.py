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
"""The Google App Engine Python Synchronization API."""

from google.appengine.api import datastore
from google.appengine.api import datastore_types
from google.appengine.api import datastore_errors

__all__ = ['SYNC_INFO_KIND', 'SyncInfo']

SYNC_INFO_KIND = "SyncInfo"


class SyncInfo(object):
    """Wrapper class for synchronization info entities.

    :param Entity|Key entity_or_key: Datastore sync info entity or key.
    :param dictionary value: Synchronization info data.
    """

    def __init__(self, entity_or_key, data=None):
        """Constructor."""

        if isinstance(entity_or_key, datastore.Entity):
            self.__entity = entity_or_key
            self.__key = entity_or_key.key()
        elif isinstance(entity_or_key, datastore_types.Key):
            self.__entity = data
            self.__key = entity_or_key
        else:
            TypeError('Must provide Entity or Key')

    @classmethod
    def from_params(cls, remote_key, version, content_hash, target_key=None):
        """Retrieve or create a SyncInfo entity from the given parameters.

        :param string remote_key: Remote entity key.
        :param int version: Remote entity version.
        :param string content_hash: MD5 hex digest.
        :param datastore_types.Key target_key: Key of the sync target entity.
        """

        entity = datastore.Entity(SYNC_INFO_KIND, name=remote_key)
        entity.update({"version": version, "content_hash": content_hash})

        if target_key:
            entity.update({"target_key": target_key})

        return cls(entity)

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

        try:
            if isinstance(keys, list):
                return [cls(entity) for entity in datastore.Get(keys)]
            elif isinstance(keys, datastore_types.Key):
                return cls(datastore.Get(keys))
        except datastore_errors.EntityNotFoundError:
            return None

    @classmethod
    def get_by_key_name(cls, key_names):
        """Get one or more synchronization info entities.

        :param string|list key_names: A key name, or a list of key names.
        """

        try:
            if isinstance(key_names, list):
                keys = [datastore_types.Key.from_path(SYNC_INFO_KIND, name)
                        for name in key_names]
                return [cls(entity) for entity in datastore.Get(keys)]
            elif isinstance(key_names, basestring):
                keys = datastore_types.Key.from_path(SYNC_INFO_KIND, key_names)
                return cls(datastore.Get(keys))
            else:
                raise TypeError("SyncInfo.get_by_key_name(key_name) takes a "
                                "key name or a list of key names")
        except datastore_errors.EntityNotFoundError:
            return None

    def key(self):
        """Get the key for this synchronization info entity."""

        return self.__key

    def kind(self):
        """Get the entity kind for synchronization info entities."""

        return SYNC_INFO_KIND

    def put(self):
        """Put the synchronization info entity."""

        return datastore.Put(self.__entity)
