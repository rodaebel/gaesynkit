# Copyright 2011 Tobias Rodaebel
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
"""Setup script for the gaesynkit package."""

from distutils.cmd import Command
from distutils.core import setup
from setuptools import setup, find_packages
from unittest import TestLoader, TextTestRunner

import os
import sys


class test(Command):
    """Runs the unit tests for gaesynkit."""

    description = "Runs unit tests for gaesynkit."

    user_options = [
        ('gae-sdk=', None, 'path to the Google App Engine SDK')
    ]

    def initialize_options(self):
        self.gae_sdk = None

    def finalize_options(self):
        pass

    def run(self):
        gae_sdk = self.gae_sdk or '/'
        extra_paths = [
            gae_sdk,
            os.path.join(gae_sdk, 'lib', 'antlr3'),
            os.path.join(gae_sdk, 'lib', 'django'),
            os.path.join(gae_sdk, 'lib', 'fancy_urllib'),
            os.path.join(gae_sdk, 'lib', 'ipaddr'),
            os.path.join(gae_sdk, 'lib', 'webob'),
            os.path.join(gae_sdk, 'lib', 'yaml', 'lib'),
        ]
        sys.path.extend(extra_paths)

        import gaesynkit.tests

        loader = TestLoader()
        t = TextTestRunner()
        t.run(loader.loadTestsFromModule(gaesynkit.tests))

# 'test' is the parameter as it gets added to setup.py
cmdclasses = {'test': test}


def read(*rnames):
    return open(os.path.join(os.path.dirname(__file__), *rnames)).read()


setup(
    name='gaesynkit',
    version='1.0.0a1',
    author="Tobias Rodaebel",
    author_email="tobias.rodaebel@googlemail.com",
    description=("Google App Engine Datastore/Local Storage Synchronization "
                 "Framework"),
    long_description=(
        read('README.txt')
        + '\n\n' +
        read('CHANGES.txt')
        ),
    license="Apache License 2.0",
    keywords="google app engine gae javascript datastore",
    classifiers=[
        'Development Status :: 3 - Alpha',
        'Environment :: Web Environment',
        'Intended Audience :: Developers',
        'License :: OSI Approved :: Apache Software License',
        'Natural Language :: English',
        'Operating System :: OS Independent',
        'Programming Language :: JavaScript',
        'Programming Language :: Python',
        'Topic :: Internet :: WWW/HTTP',
        'Topic :: Internet :: WWW/HTTP :: WSGI :: Server',
        ],
    url='http://code.google.com/p/gaesynkit',
    packages=find_packages('src'),
    package_dir={'': 'src'},
    include_package_data=True,
    install_requires=[
        'setuptools',
    ],
    zip_safe=False,
    cmdclass=cmdclasses
)
