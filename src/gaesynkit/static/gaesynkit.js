/*
 * gaesynkit.js - Local Storage/GAE Datastore Synchronisation Javascript API
 *
 * Copyright 2010 Tobias Rodaebel
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

(function() {

  // The gaesynkit namespace
  var gaesynkit = gaesynkit || {};
  gaesynkit.global = this;

  /* Internal API */
  gaesynkit.exportSymbol = function(name, opt_object, opt_objectToExportTo) {

    var parts = name.split("."), cur = opt_objectToExportTo || gaesynkit.global;

    !(parts[0] in cur) && cur.execScript && cur.execScript("var " + parts[0]);

    for(var part;parts.length && (part = parts.shift());) {
      if(!parts.length && gaesynkit.isDef(opt_object)) {
        cur[part] = opt_object
      } else {
        cur = cur[part] ? cur[part] : cur[part] = {}
      }
    }
  };

  gaesynkit.isDef = function(val) {
    return val !== undefined;
  };

  /* External API */

  // The gaesynkit.api namespace holds general information about the api
  // version
  gaesynkit.api = {};

  // The API version string
  gaesynkit.api.VERSION = '1.0.0a1';

  // The gaesynkit.rpc namespace defines RPC objects to communicate with
  // the backend
  gaesynkit.rpc = {};

  // JSON-RPC service endpoint
  gaesynkit.rpc.ENDPOINT = "/gaesynkit/rpc/";

  // Low-level method to make an asynchronous JSON-RPC
  gaesynkit.rpc.makeAsyncCall = function(request, callback) {

    if (request.jsonrpc != "2.0") throw new Error("Invalid JSON-RPC");

    var http = new XMLHttpRequest();

    http.open("POST", gaesynkit.rpc.ENDPOINT, true);
    http.setRequestHeader("Content-Type", "application/json-rpc");

    http.onreadystatechange = function() {
      if(http.readyState == 4 && http.status == 200) {
        callback(JSON.parse(http.responseText));
      }
    };

    http.send(JSON.stringify(request));

    return true;
  };

  // The gaesynkit.util namespace
  gaesynkit.util = {};

  // Base64 encode/decode
  gaesynkit.util.base64 = {

    // Private property
    _keyStr: "ABCDEFGHIJKLMNOPQRSTUVWXYZ" +
             "abcdefghijklmnopqrstuvwxyz" +
             "0123456789+/=",

    // Public method for encoding
    encode: function(input) {
      var output = "";
      var chr1, chr2, chr3, enc1, enc2, enc3, enc4;
      var i = 0;
 
      input = gaesynkit.util.base64._utf8_encode(input);
 
      while (i < input.length) {
        chr1 = input.charCodeAt(i++);
        chr2 = input.charCodeAt(i++);
        chr3 = input.charCodeAt(i++);
 
        enc1 = chr1 >> 2;
        enc2 = ((chr1 & 3) << 4) | (chr2 >> 4);
        enc3 = ((chr2 & 15) << 2) | (chr3 >> 6);
        enc4 = chr3 & 63;
 
        if (isNaN(chr2)) {
          enc3 = enc4 = 64;
        }
        else if (isNaN(chr3)) {
          enc4 = 64;
        }
 
        output = output +
        this._keyStr.charAt(enc1) + this._keyStr.charAt(enc2) +
        this._keyStr.charAt(enc3) + this._keyStr.charAt(enc4);
      }
 
      return output;
    },
 
    // Public method for decoding
    decode: function(input) {
      var output = "";
      var chr1, chr2, chr3;
      var enc1, enc2, enc3, enc4;
      var i = 0;
 
      input = input.replace(/[^A-Za-z0-9\+\/\=]/g, "");
 
      while (i < input.length) {
        enc1 = this._keyStr.indexOf(input.charAt(i++));
        enc2 = this._keyStr.indexOf(input.charAt(i++));
        enc3 = this._keyStr.indexOf(input.charAt(i++));
        enc4 = this._keyStr.indexOf(input.charAt(i++));
 
        chr1 = (enc1 << 2) | (enc2 >> 4);
        chr2 = ((enc2 & 15) << 4) | (enc3 >> 2);
        chr3 = ((enc3 & 3) << 6) | enc4;
 
        output = output + String.fromCharCode(chr1);
 
        if (enc3 != 64) {
          output = output + String.fromCharCode(chr2);
        }
        if (enc4 != 64) {
          output = output + String.fromCharCode(chr3);
        }
      }
 
      output = gaesynkit.util.base64._utf8_decode(output);
 
      return output;
    },
 
    // Private method for UTF-8 encoding
    _utf8_encode: function(str) {
      str = str.replace(/\r\n/g,"\n");
      var utftext = "";
 
      for (var n = 0; n < str.length; n++) {
        var c = str.charCodeAt(n);
 
        if (c < 128) {
          utftext += String.fromCharCode(c);
        }
        else if((c > 127) && (c < 2048)) {
          utftext += String.fromCharCode((c >> 6) | 192);
          utftext += String.fromCharCode((c & 63) | 128);
        }
        else {
          utftext += String.fromCharCode((c >> 12) | 224);
          utftext += String.fromCharCode(((c >> 6) & 63) | 128);
          utftext += String.fromCharCode((c & 63) | 128);
        }
      }
 
      return utftext;
    },
 
    // Private method for UTF-8 decoding
    _utf8_decode: function(utftext) {
      var str = "";
      var i = 0;
      var c = c1 = c2 = 0;
 
      while (i < utftext.length) {
        c = utftext.charCodeAt(i);
 
        if (c < 128) {
          str += String.fromCharCode(c);
          i++;
        }
        else if((c > 191) && (c < 224)) {
          c2 = utftext.charCodeAt(i+1);
          str += String.fromCharCode(((c & 31) << 6) | (c2 & 63));
          i += 2;
        }
        else {
          c2 = utftext.charCodeAt(i+1);
          c3 = utftext.charCodeAt(i+2);
          str += String.fromCharCode(
            ((c & 15) << 12) | ((c2 & 63) << 6) | (c3 & 63));
          i += 3;
        }
      }
 
      return str;
    }
  }

  // The gaesynkit.db namespace
  gaesynkit.db = {};

  // Google App Engine Datastore types. See "Supported Data Types" in the
  // API documentation.
  //
  // Most of these types are based on XML elements from Atom and GData
  // elements from the atom and gd namespaces. For more information, see:
  // 
  //   http://www.atomenabled.org/developers/syndication/
  //   http://code.google.com/apis/gdata/common-elements.html
  //
  // The namespace schemas are:
  //
  //   http://www.w3.org/2005/Atom
  //   http://schemas.google.com/g/2005

  // Date
  gaesynkit.db.Datetime = function(value) {
    
    // http://code.google.com/apis/gdata/docs/1.0/elements.html#gdWhen
    this.type = "gd:when";
    this.value = value;
  }

  // TODO: More types

  // An Entity holds the client-side representation of a GAE Datastore
  // entity. It can be dumped as a JSON string.

  // Entity constructor
  gaesynkit.db.Entity = function(kind, name, id, namespace) {

    if (!kind || typeof(kind) != "string")
      throw "Entity kind missing or not a string";

    if (name && id)
      throw "An Entity can have either a name or an id; not both";

    this._kind = kind;
    this._name = name;
    this._id = id;
    this._namespace = namespace;

    // Private attribute to store properties
    this._properties = new Object;
  };

  // Delete property
  gaesynkit.db.Entity.prototype.deleteProperty = function(name) {

    if (!name || typeof(name) != "string")
      throw "Property name missing or not a string";

    if (!this._properties[name])
      throw "Unknown property";

    delete this._properties[name];
    delete this[name];

    return true;
  }

  // Return the entity kind
  gaesynkit.db.Entity.prototype.kind = function() {
    return this._kind;
  };

  // Return an array of entity keys
  gaesynkit.db.Entity.prototype.keys = function() {

    var keys = new Array;

    for (var key in this._properties) {
      keys.push(key);
    }

    return keys;
  };

  // Return JSON representation of this entity
  gaesynkit.db.Entity.prototype.toJSON = function() {

    var entity = new Object;

    entity["kind"] = this._kind;

    if (this._name) {
      entity["name"] = this._name;
    }
    else if (this._id) {
      entity["id"] = this._id;
    }

    entity["properties"] = new Array;

    for (var key in this._properties) {
      var prop = new Object;
      prop["name"] = key;
      prop["value"] = this._properties[key];
      entity.properties.push(prop);
    }

    return entity;
  };

  // Update entity properties
  gaesynkit.db.Entity.prototype.update = function(obj) {

    if (typeof(obj) != "object") throw new Error("Argumend must be an object");

    // Using closures as setter and getter factories
    function makeSetter(key) {
      return function(val) { this._properties[key]=val; };
    }

    function makeGetter(key) {
      func = function() {
        prop = this._properties[key];
        return prop.value || prop;
      };
      return func;
    }

    for (key in obj) {
      // Store property
      this._properties[key] = obj[key];
      // Define setter and getter for new property
      this.__defineSetter__(key, makeSetter(key));
      this.__defineGetter__(key, makeGetter(key));
    }

    return this;
  };

  // Storage constructor
  gaesynkit.db.Storage = function() {
    this._storage = window.localStorage;
  };

  // Put a given entity
  gaesynkit.db.Storage.prototype.put = function(entity) {
    return "key";
  }

  /* Exporting the public API */
  gaesynkit.exportSymbol("gaesynkit.api", gaesynkit.api);  
  gaesynkit.exportSymbol("gaesynkit.rpc", gaesynkit.rpc);  
  gaesynkit.exportSymbol("gaesynkit.util", gaesynkit.util);  
  gaesynkit.exportSymbol("gaesynkit.db", gaesynkit.db);  

})();
