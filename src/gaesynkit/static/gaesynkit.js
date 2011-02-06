/*
 * gaesynkit.js - Client Storage/GAE Datastore Synchronisation Javascript API
 *
 * Copyright 2011 Tobias Rodaebel
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

  // Private constants

  // String to separate entity kind from numerical id
  var _KIND_ID_SEP = "\n";

  // String to separate entity kind from key name
  var _KIND_NAME_SEP = "\b";

  // Application id separator
  var _APP_ID_SEP = "@";

  // The namespace separator
  var _NAMESPACE_SEP = "!!";

  // This is the default namespace for entities
  var _DEFAULT_NAMESPACE = "default";

  // String to separate path elements
  var _PATH_SEP = "\t";

  // Local Storage key to store the next numerical id
  var _NEXT_ID = "_NextId";

  // Local Storage key to store the next JSON-RPC id
  var _NEXT_RPC_ID = "_NextRpcId";

  // Entity has not changed
  var _ENTITY_NOT_CHANGED = 1;

  // Entity has been updated
  var _ENTITY_UPDATED = 2;

  // Entity has been stored
  var _ENTITY_STORED = 3;

  // Entity not found on server
  var _ENTITY_NOT_FOUND = 4;

  // Entity has been deleted
  var _ENTITY_DELETED = 5;


  /* Internal API */
  gaesynkit.exportSymbol = function(name, opt_object, opt_objectToExportTo) {

    var parts = name.split("."), cur = opt_objectToExportTo || gaesynkit.global;

    !(parts[0] in cur) && cur.execScript && cur.execScript("var " + parts[0]);

    for(var part; parts.length && (part = parts.shift());) {
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

  // The application id
  gaesynkit.api.APPLICATION_ID = "$APPLICATION_ID";

  // The gaesynkit.rpc namespace defines RPC objects to communicate with
  // the backend
  gaesynkit.rpc = {};

  // JSON-RPC service endpoint
  gaesynkit.rpc.ENDPOINT = "/gaesynkit/rpc/";

  // Low-level method to make a JSON-RPC
  gaesynkit.rpc.makeRpc = function(request, callback, async) {

    var async = async || false;

    if (request.jsonrpc != "2.0") throw new Error("Invalid JSON-RPC");

    var http = new XMLHttpRequest();

    http.open("POST", gaesynkit.rpc.ENDPOINT, async);
    http.setRequestHeader("Content-Type", "application/json-rpc");

    http.onreadystatechange = function() {
      if(http.readyState == 4 && http.status == 200) {
        callback(JSON.parse(http.responseText));
      }
    };

    http.send(JSON.stringify(request));

    return true;
  };

  // Obtain the next RPC-JSON id
  gaesynkit.rpc.getNextRpcId = function() {

    var id = 1;
    var next_id = window.localStorage[_NEXT_RPC_ID];

    if (next_id) id = parseInt(next_id);

    window.localStorage[_NEXT_RPC_ID] = id + 1;
    
    return id;
  };

  // The gaesynkit.util namespace
  gaesynkit.util = {};

  // Base64 encode/decode
  // TODO This should rather belong to the internal API
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

      str = str.replace(/\r\n/g, "\n");
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
  };

  // MD5 checksum
  // TODO This should rather belong to the internal API
  gaesynkit.util.md5 = function (string) {
 
    function _rotateLeft(value, shift_bits) {
      return (value << shift_bits) | (value >>> (32-shift_bits));
    }
 
    function _addUnsigned(x, y) {

      var result;

      var x4 = (x & 0x40000000);
      var y4 = (y & 0x40000000);
      var x8 = (x & 0x80000000);
      var y8 = (y & 0x80000000);

      result = (x & 0x3FFFFFFF) + (y & 0x3FFFFFFF);

      if (x4 & y4) {
        return (result ^ 0x80000000 ^ x8 ^ y8);
      }

      if (x4 | y4) {
        if (result & 0x40000000) {
          return (result ^ 0xC0000000 ^ x8 ^ y8);
        }
        else {
          return (result ^ 0x40000000 ^ x8 ^ y8);
        }
      }
      else {
        return (result ^ x8 ^ y8);
      }
    }
 
    function F(x, y, z) { return (x & y) | ((~x) & z); }
    function G(x, y, z) { return (x & z) | (y & (~z)); }
    function H(x, y, z) { return (x ^ y ^ z); }
    function I(x, y, z) { return (y ^ (x | (~z))); }
 
    function FF(a, b, c, d, x, s, ac) {
      a = _addUnsigned(a, _addUnsigned(_addUnsigned(F(b, c, d), x), ac));
      return _addUnsigned(_rotateLeft(a, s), b);
    }
 
    function GG(a, b, c, d, x, s, ac) {
      a = _addUnsigned(a, _addUnsigned(_addUnsigned(G(b, c, d), x), ac));
      return _addUnsigned(_rotateLeft(a, s), b);
    }
 
    function HH(a, b, c, d, x, s, ac) {
      a = _addUnsigned(a, _addUnsigned(_addUnsigned(H(b, c, d), x), ac));
      return _addUnsigned(_rotateLeft(a, s), b);
    }
 
    function II(a, b, c, d, x, s, ac) {
      a = _addUnsigned(a, _addUnsigned(_addUnsigned(I(b, c, d), x), ac));
      return _addUnsigned(_rotateLeft(a, s), b);
    }
 
    function _convertToWordArray(string) {

      var word_count;
      var msg_len = string.length;
      var temp = msg_len + 8;
      var num_words = (((temp-(temp % 64))/64)+1)*16;
      var word_array = new Array(num_words-1);
      var byte_pos = 0;
      var byte_count = 0;

      while (byte_count < msg_len) {

        word_count = (byte_count-(byte_count % 4))/4;
        byte_pos = (byte_count % 4)*8;

        word_array[word_count] = (word_array[word_count] |
                                  (string.charCodeAt(byte_count) << byte_pos));
        byte_count++;

      }

      word_count = (byte_count-(byte_count % 4))/4;
      byte_pos = (byte_count % 4)*8;

      word_array[word_count] = word_array[word_count] | (0x80 << byte_pos);
      word_array[num_words-2] = msg_len << 3;
      word_array[num_words-1] = msg_len >>> 29;

      return word_array;
    }
 
    function _wordToHex(value) {

      var hex_value="", temp="", byte_, count;

      for (count = 0; count<=3; count++) {
        byte_ = (value >>> (count*8)) & 255;
        temp = "0" + byte_.toString(16);
        hex_value = hex_value + temp.substr(temp.length-2,2);
      }

      return hex_value;
    }
 
    function _utf8encode(string) {

      var utftext = "";

      string = string.replace(/\r\n/g,"\n");
 
      for (var n = 0; n < string.length; n++) {
 
        var c = string.charCodeAt(n);
 
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
    }
 
    var x = Array();
    var k, AA, BB, CC, DD, a, b, c, d;
    var S11=7, S12=12, S13=17, S14=22;
    var S21=5, S22=9 , S23=14, S24=20;
    var S31=4, S32=11, S33=16, S34=23;
    var S41=6, S42=10, S43=15, S44=21;
 
    string = _utf8encode(string);
 
    x = _convertToWordArray(string);
 
    a = 0x67452301; b = 0xEFCDAB89; c = 0x98BADCFE; d = 0x10325476;
 
    for (k=0;k<x.length;k+=16) {
      AA=a; BB=b; CC=c; DD=d;
      a=FF(a,b,c,d,x[k+0], S11,0xD76AA478);
      d=FF(d,a,b,c,x[k+1], S12,0xE8C7B756);
      c=FF(c,d,a,b,x[k+2], S13,0x242070DB);
      b=FF(b,c,d,a,x[k+3], S14,0xC1BDCEEE);
      a=FF(a,b,c,d,x[k+4], S11,0xF57C0FAF);
      d=FF(d,a,b,c,x[k+5], S12,0x4787C62A);
      c=FF(c,d,a,b,x[k+6], S13,0xA8304613);
      b=FF(b,c,d,a,x[k+7], S14,0xFD469501);
      a=FF(a,b,c,d,x[k+8], S11,0x698098D8);
      d=FF(d,a,b,c,x[k+9], S12,0x8B44F7AF);
      c=FF(c,d,a,b,x[k+10],S13,0xFFFF5BB1);
      b=FF(b,c,d,a,x[k+11],S14,0x895CD7BE);
      a=FF(a,b,c,d,x[k+12],S11,0x6B901122);
      d=FF(d,a,b,c,x[k+13],S12,0xFD987193);
      c=FF(c,d,a,b,x[k+14],S13,0xA679438E);
      b=FF(b,c,d,a,x[k+15],S14,0x49B40821);
      a=GG(a,b,c,d,x[k+1], S21,0xF61E2562);
      d=GG(d,a,b,c,x[k+6], S22,0xC040B340);
      c=GG(c,d,a,b,x[k+11],S23,0x265E5A51);
      b=GG(b,c,d,a,x[k+0], S24,0xE9B6C7AA);
      a=GG(a,b,c,d,x[k+5], S21,0xD62F105D);
      d=GG(d,a,b,c,x[k+10],S22,0x2441453);
      c=GG(c,d,a,b,x[k+15],S23,0xD8A1E681);
      b=GG(b,c,d,a,x[k+4], S24,0xE7D3FBC8);
      a=GG(a,b,c,d,x[k+9], S21,0x21E1CDE6);
      d=GG(d,a,b,c,x[k+14],S22,0xC33707D6);
      c=GG(c,d,a,b,x[k+3], S23,0xF4D50D87);
      b=GG(b,c,d,a,x[k+8], S24,0x455A14ED);
      a=GG(a,b,c,d,x[k+13],S21,0xA9E3E905);
      d=GG(d,a,b,c,x[k+2], S22,0xFCEFA3F8);
      c=GG(c,d,a,b,x[k+7], S23,0x676F02D9);
      b=GG(b,c,d,a,x[k+12],S24,0x8D2A4C8A);
      a=HH(a,b,c,d,x[k+5], S31,0xFFFA3942);
      d=HH(d,a,b,c,x[k+8], S32,0x8771F681);
      c=HH(c,d,a,b,x[k+11],S33,0x6D9D6122);
      b=HH(b,c,d,a,x[k+14],S34,0xFDE5380C);
      a=HH(a,b,c,d,x[k+1], S31,0xA4BEEA44);
      d=HH(d,a,b,c,x[k+4], S32,0x4BDECFA9);
      c=HH(c,d,a,b,x[k+7], S33,0xF6BB4B60);
      b=HH(b,c,d,a,x[k+10],S34,0xBEBFBC70);
      a=HH(a,b,c,d,x[k+13],S31,0x289B7EC6);
      d=HH(d,a,b,c,x[k+0], S32,0xEAA127FA);
      c=HH(c,d,a,b,x[k+3], S33,0xD4EF3085);
      b=HH(b,c,d,a,x[k+6], S34,0x4881D05);
      a=HH(a,b,c,d,x[k+9], S31,0xD9D4D039);
      d=HH(d,a,b,c,x[k+12],S32,0xE6DB99E5);
      c=HH(c,d,a,b,x[k+15],S33,0x1FA27CF8);
      b=HH(b,c,d,a,x[k+2], S34,0xC4AC5665);
      a=II(a,b,c,d,x[k+0], S41,0xF4292244);
      d=II(d,a,b,c,x[k+7], S42,0x432AFF97);
      c=II(c,d,a,b,x[k+14],S43,0xAB9423A7);
      b=II(b,c,d,a,x[k+5], S44,0xFC93A039);
      a=II(a,b,c,d,x[k+12],S41,0x655B59C3);
      d=II(d,a,b,c,x[k+3], S42,0x8F0CCC92);
      c=II(c,d,a,b,x[k+10],S43,0xFFEFF47D);
      b=II(b,c,d,a,x[k+1], S44,0x85845DD1);
      a=II(a,b,c,d,x[k+8], S41,0x6FA87E4F);
      d=II(d,a,b,c,x[k+15],S42,0xFE2CE6E0);
      c=II(c,d,a,b,x[k+6], S43,0xA3014314);
      b=II(b,c,d,a,x[k+13],S44,0x4E0811A1);
      a=II(a,b,c,d,x[k+4], S41,0xF7537E82);
      d=II(d,a,b,c,x[k+11],S42,0xBD3AF235);
      c=II(c,d,a,b,x[k+2], S43,0x2AD7D2BB);
      b=II(b,c,d,a,x[k+9], S44,0xEB86D391);
      a=_addUnsigned(a,AA);
      b=_addUnsigned(b,BB);
      c=_addUnsigned(c,CC);
      d=_addUnsigned(d,DD);
    }
 
    var temp = _wordToHex(a)+_wordToHex(b)+_wordToHex(c)+_wordToHex(d);
 
    return temp.toLowerCase();
  };


  // The gaesynkit.db namespace
  gaesynkit.db = {};

  // Google App Engine Datastore types. See "Supported Value Types" in the
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

  // Base type
  gaesynkit.db.ValueType = function(value) {
    this._type = undefined;
    this._value = value;
  };

  // Declare constructor
  gaesynkit.db.ValueType.prototype.constructor = gaesynkit.db.ValueType;

  // Generate JSON output
  gaesynkit.db.ValueType.prototype.toJSON = function() {
    return {"type": this.type(), "value": this._value};
  };

  // Return the type string
  gaesynkit.db.ValueType.prototype.type = function() {
    return (this._type) ? this._type : typeof(this._value);
  };

  // Return the value
  gaesynkit.db.ValueType.prototype.value = function() {
    return this._value;
  };

  // Byte string
  gaesynkit.db.ByteString = function(value) {
    
    // http://code.google.com/appengine/docs/python/datastore/typesandpropertyclasses.html#ByteString
    this._type = "byte_string";
    this._value = this._encode(value);
  };

  gaesynkit.db.ByteString.prototype = new gaesynkit.db.ValueType;

  // Declare constructor
  gaesynkit.db.ByteString.prototype.constructor = gaesynkit.db.ByteString;

  // Encode value
  gaesynkit.db.ByteString.prototype._encode = function(value) {
    return gaesynkit.util.base64.encode(value);
  };

  // Decode encoded value
  gaesynkit.db.ByteString.prototype._decode = function(encoded) {
    return gaesynkit.util.base64.decode(encoded);
  };

  // Return the decoded value
  gaesynkit.db.ByteString.prototype.value = function() {
    return this._decode(this._value);
  };

  // Bool
  gaesynkit.db.Bool = function(value) {

    // http://code.google.com/appengine/docs/python/datastore/typesandpropertyclasses.html#bool
    this._type = "bool"
    this._value = value;
  };

  gaesynkit.db.Bool.prototype = new gaesynkit.db.ValueType;

  // Declare constructor
  gaesynkit.db.Bool.prototype.constructor = gaesynkit.db.Bool;

  // Integer
  gaesynkit.db.Integer = function(value) {

    // http://code.google.com/appengine/docs/python/datastore/typesandpropertyclasses.html#int
    this._type = "int"
    this._value = value;
  };

  gaesynkit.db.Integer.prototype = new gaesynkit.db.ValueType;

  // Declare constructor
  gaesynkit.db.Integer.prototype.constructor = gaesynkit.db.Integer;

  // Float
  gaesynkit.db.Float = function(value) {

    // http://code.google.com/appengine/docs/python/datastore/typesandpropertyclasses.html#float
    this._type = "float"
    this._value = value;
  };

  gaesynkit.db.Float.prototype = new gaesynkit.db.ValueType;

  // Declare constructor
  gaesynkit.db.Float.prototype.constructor = gaesynkit.db.Float;

  // Date
  gaesynkit.db.Datetime = function(value) {
    
    // http://code.google.com/apis/gdata/docs/1.0/elements.html#gdWhen
    this._type = "gd:when";
    this._value = this._encode(value);
  };

  gaesynkit.db.Datetime.prototype = new gaesynkit.db.ValueType;

  // Declare constructor
  gaesynkit.db.Datetime.prototype.constructor = gaesynkit.db.Datetime;

  // Encode date value
  gaesynkit.db.Datetime.prototype._encode = function(val) {

    if (val instanceof Date) {
      return (val.getFullYear()+"/"+(val.getMonth()+1)+"/"+val.getDate()+" "+
              val.getHours()+":"+val.getMinutes()+":"+val.getSeconds());
    }

    return val;
  };

  // Decode encoded date value
  gaesynkit.db.Datetime.prototype._decode = function(encoded) {
    return new Date(encoded);
  };

  // Return the decoded value
  gaesynkit.db.Datetime.prototype.value = function() {
    return this._decode(this._value);
  };

  // List (Array)
  gaesynkit.db.List = function(value) {

    // http://code.google.com/appengine/docs/python/datastore/typesandpropertyclasses.html#list
    this._type = this._getType(value);
    this._value = this._encode(value);
  };

  gaesynkit.db.List.prototype = new gaesynkit.db.ValueType;

  // Declare constructor
  gaesynkit.db.List.prototype.constructor = gaesynkit.db.Datetime;

  // Get type of list values
  gaesynkit.db.List.prototype._getType = function(value) {

    if (value[0] instanceof gaesynkit.db.ValueType) {
      return value[0].type();
    }
    else {
      return _evalValueType(value[0]);
    }
  };

  // Encode list values
  gaesynkit.db.List.prototype._encode = function(value) {

    var values = new Array;

    for (var i in value) {

      var v = value[i];

      if (v instanceof gaesynkit.db.ValueType) {
        values.push(v.value());
      }
      else {
        values.push(v);
      }
    }

    return values;
  };


  // Keys represent unique keys for datastore entities.
  //
  // Every entity that has been put in the storage has a unique key that
  // represents it. The key() method of an entity returns the Key object for
  // the entity. If the entity has never been put() in the storage, key()
  // raises an Error.
  //
  // When the application creates an entity, it can assign another entity as
  // the parent of the new entity, using the parent argument in the Entity
  // constructor.
  //
  // A key is a base64 encoded string containing the namespace and the path.
  // The path consists of one or more path elements where each represents an
  // entity. Every path begins with the key of the root entity which may be
  // the current entity itself.
  //
  // Example:
  //   app_id@namespace!!RootEntityKind\n50001\tMyEntityKind\bmy_key_name
  //      |       |             |          |          |           |
  //    AppId Namespace       Parent    Num.ID      Entity     Key name
  //
  // The first component of a key is the entity kind. The next component is a
  // numerical ID or key name. Note that entities can have a numerical ID or
  // key name but not both.
  gaesynkit.db.Key = function(encoded) {
    this._type = "key";
    this._value = encoded;
  };

  gaesynkit.db.Key.prototype = new gaesynkit.db.ValueType;

  // Declare constructor
  gaesynkit.db.Key.prototype.constructor = gaesynkit.db.Key;

  // Classmethod to create key from path
  gaesynkit.db.Key.from_path = function(kind, id_or_name, parent_, namespace) {

    var path, p;

    var _app_id = gaesynkit.api.APPLICATION_ID;

    var _namespace = namespace || _DEFAULT_NAMESPACE;

    var _id_or_name = id_or_name || 0;

    if (typeof(_id_or_name) == "number") {
      path = kind + _KIND_ID_SEP + id_or_name;
    }
    else if (typeof(_id_or_name) == "string") {
      path = kind + _KIND_NAME_SEP + id_or_name;
    }
    else {
      throw new Error("Id or name of wrong type; expected number or string");
    }

    if (parent_ && parent_ instanceof gaesynkit.db.Key) {
      p = parent_.value();
    }
    else if (parent_ && typeof(parent_) == "string") {
      p = parent_;
    }

    path = ((p) ? gaesynkit.util.base64.decode(p) + _PATH_SEP + path
                : _app_id + _APP_ID_SEP + _namespace + _NAMESPACE_SEP + path);

    if (_namespace != path.split(_NAMESPACE_SEP)[0].split(_APP_ID_SEP)[1])
      throw new Error("Parent uses different namespace");

    return new gaesynkit.db.Key(gaesynkit.util.base64.encode(path));
  };

  // Return true if the key has either a name or a numeric ID
  gaesynkit.db.Key.prototype.has_id_or_name = function() {
    return ((this.id() || this.name()) != undefined) ? true : false;
  };

  // Return the id
  gaesynkit.db.Key.prototype.toJSON = function() {

    var key = new Object;
    var decoded_key = gaesynkit.util.base64.decode(this._value);
    var parts = decoded_key.split(_NAMESPACE_SEP);
    var path_elems = parts[1].split(_PATH_SEP);

    key.namespace = parts[0].split(_APP_ID_SEP)[1];
    key.elements = new Array;

    function pushPathElem(elems, str) {

      var e = new Object;
     
      var elem_parts = str.split(_KIND_ID_SEP)

      if (elem_parts.length == 2) {
        e.id = parseInt(elem_parts[1]);
      }
      else {
        elem_parts = str.split(_KIND_NAME_SEP)
        if (elem_parts.length == 2) {
          e.name = elem_parts[1];
        }
      }

      e.kind = elem_parts[0];

      elems.push(e);
    }

    for (var i in path_elems) pushPathElem(key.elements, path_elems[i]);

    return key;
  };

  // Return the id
  gaesynkit.db.Key.prototype.id = function() {
    return this.toJSON().elements.pop().id;
  };

  // Return the kind
  gaesynkit.db.Key.prototype.kind = function() {
    return this.toJSON().elements.pop().kind;
  };

  // Return the key name
  gaesynkit.db.Key.prototype.name = function() {
    return this.toJSON().elements.pop().name;
  };

  // Return the namespace
  gaesynkit.db.Key.prototype.namespace = function() {
    return this.toJSON().namespace;
  };

  // Return the parent
  gaesynkit.db.Key.prototype.parent = function() {

    var decoded_key = gaesynkit.util.base64.decode(this._value);
    var parts = decoded_key.split(_PATH_SEP);

    if (parts.length == 1)
      return null;

    var parent_str = parts.slice(0, parts.length-1).join(_PATH_SEP);

    return new gaesynkit.db.Key(gaesynkit.util.base64.encode(parent_str));
  };

  // User
  gaesynkit.db.User = function(value) {

    // http://code.google.com/appengine/docs/python/users/userclass.html
    this._type = "user"
    this._value = value;
  };

  gaesynkit.db.User.prototype = new gaesynkit.db.ValueType;

  // Declare constructor
  gaesynkit.db.User.prototype.constructor = gaesynkit.db.User;

  // TODO More types

  // Property value types
  var _PROPERTY_VALUE_TYPES = {
    "string": gaesynkit.db.ValueType,
    "byte_string": gaesynkit.db.ByteString,
    "bool": gaesynkit.db.Bool,
    "int": gaesynkit.db.Integer,
    "float": gaesynkit.db.Float,
    "gd:when": gaesynkit.db.Datetime,
    "list": gaesynkit.db.List,
    "key": gaesynkit.db.Key,
    "user": gaesynkit.db.User
  };

  // Evaluate value type
  function _evalValueType(val) {

    var t = typeof(val);

    if (t == "number")
      return ((val+"").search(/\./) != -1) ? "float" : "int";
    else if (t == "boolean")
      return "bool";

    return t;
  }

  // An Entity holds the client-side representation of a GAE Datastore
  // entity and can be dumped as a JSON.

  // Entity constructor
  gaesynkit.db.Entity = function(kind, name, id, parent_, namespace, version) {

    if (!kind || typeof(kind) != "string")
      throw new Error("Entity kind missing or not a string");

    if (name && id)
      throw new Error("An Entity can have either a name or an id; not both");

    // Create entity key
    var name = (name || id) ? name || id : 0;
    this._key = gaesynkit.db.Key.from_path(kind, name, parent_, namespace);

    // Entity version
    this._version = version || 0;

    // Private attribute to store properties
    this._properties = new Object;
  };

  // Declare constructor
  gaesynkit.db.Entity.prototype.constructor = gaesynkit.db.Entity;

  // Delete property
  gaesynkit.db.Entity.prototype.deleteProperty = function(name) {

    if (!name || typeof(name) != "string")
      throw new Error("Property name missing or not a string");

    if (!this._properties[name])
      throw new Error("Unknown property");

    delete this._properties[name];
    delete this[name];

    return true;
  };

  // Get original property
  gaesynkit.db.Entity.prototype.getProperty = function(name) {

    if (!name || typeof(name) != "string")
      throw new Error("Property name missing or not a string");

    if (!this._properties[name])
      throw new Error("Unknown property");

    return this._properties[name];
  };

  // Return this entity's primary key, a Key instance
  gaesynkit.db.Entity.prototype.key = function() {
    return this._key;
  };

  // Return the entity kind
  gaesynkit.db.Entity.prototype.kind = function() {
    return this._key.kind();
  };

  // Return an array of property names
  // We're aware of the fact that 'keys' might be confusing, but we try to be
  // consistent with the google.appengine.api.datastore.Entity API.
  gaesynkit.db.Entity.prototype.keys = function() {

    var names = new Array;

    for (var n in this._properties) {
      names.push(n);
    }

    return names;
  };

  // Return JSON representation of this entity
  gaesynkit.db.Entity.prototype.toJSON = function() {

    var entity = new Object;

    entity["kind"] = this._key.kind();

    entity["key"] = this._key.value();

    entity["version"] = this._version;

    if (this._key.name()) {
      entity["name"] = this._key.name();
    }
    else if (this._key.id()) {
      entity["id"] = this._key.id();
    }

    entity["properties"] = new Object;

    for (var key in this._properties) {
      entity.properties[key] = this._properties[key];
    }

    return entity;
  };

  // Update entity properties
  gaesynkit.db.Entity.prototype.update = function(obj) {

    if (typeof(obj) != "object") throw new Error("Argumend must be an object");

    // Using closures as setter and getter factories
    function makeSetter(key) {

      var func = function(val) {

        if (val instanceof gaesynkit.db.ValueType) {
          this._properties[key] = val;
        }
        else if (val instanceof Array) {
          this._properties[key] = new gaesynkit.db.List(val);
        }
        else {

          var type = _PROPERTY_VALUE_TYPES[_evalValueType(val)];

          if (!type)
            throw Error("Unknown value type");

          this._properties[key] = new type(val);
        }
      };

      return func;
    }

    function makeGetter(key) {

      var func = function() {

        var prop = this._properties[key];
        return prop.value();
      };

      return func;
    }

    for (var key in obj) {
      // Define setter and getter for new property
      this.__defineSetter__(key, makeSetter(key));
      this.__defineGetter__(key, makeGetter(key));
      this[key] = obj[key];
    }

    return this;
  };

  // Set the entity version
  gaesynkit.db.Entity.prototype.set_version = function(version) {
    this._version = version;
  };

  // Get the entity version
  gaesynkit.db.Entity.prototype.version = function() {
    return this._version;
  };

  // Storage constructor
  gaesynkit.db.Storage = function() {
    this._storage = window.localStorage;
  };

  // Declare constructor
  gaesynkit.db.Storage.prototype.constructor = Storage;

  // Delete entity by a given key
  gaesynkit.db.Storage.prototype.deleteEntityWithKey = function(k) {

    var key = (k instanceof gaesynkit.db.Key) ? k : new gaesynkit.db.Key(k);

    delete this._storage[key.value()];

    return true;
  };

  // Obtain the next numerical id
  gaesynkit.db.Storage.prototype.getNextId = function() {

    var id = 1;
    var next_id = this._storage[_NEXT_ID];

    if (next_id) id = parseInt(next_id);

    this._storage[_NEXT_ID] = id + 1;
    
    return id;
  };

  // Get a new Entity from a given key and JSON data
  var _getEntityFromKeyAndJSON = function(k, json) {

    var entity = new gaesynkit.db.Entity(
      k.kind(), k.name(), k.id(), k.parent(), k.namespace(), json["version"]);

    var prop, type, value;

    for (var key in json.properties) {

      prop = new Object;
      if (json.properties[key].value instanceof Array) {
        type = gaesynkit.db.List;
      }
      else {
        type = _PROPERTY_VALUE_TYPES[json.properties[key].type];
      }

      if (type == "string") {
        value = json.properties[key].value;
      }
      else if (!type) {
        throw Error("Unknown property value type");
      }
      else {
        value = new type(json.properties[key].value);
      }

      prop[key] = value;

      entity.update(prop);
    }

  return entity;
  };


  // Get entity by a given key or encoded key string
  gaesynkit.db.Storage.prototype.get = function(k) {

    var key, json;

    key = (k instanceof gaesynkit.db.Key) ? k : new gaesynkit.db.Key(k);

    try {
      json = JSON.parse(this._storage[key.value()]);
    }
    catch (e) {
      throw Error("Entity not found");
    }

    return _getEntityFromKeyAndJSON(key, json);
  };

  // Put a given entity
  gaesynkit.db.Storage.prototype.put = function(entity) {

    var key, id_or_name;

    key = entity.key();
    id_or_name = key.id();

    if (!id_or_name) {
      id_or_name = (key.name()) ? key.name() : this.getNextId();
    }

    var new_key = gaesynkit.db.Key.from_path(
                        key.kind(), id_or_name, key.parent(), key.namespace());

    delete entity._key;
    entity._key = new_key;

    this._storage[new_key.value()] = JSON.stringify(entity.toJSON());

    return new_key;
  };

  // Synchronize entity
  gaesynkit.db.Storage.prototype.sync = function(key_or_entity, async) {

    var async = async || false;
    var entity, content_hash, id, request;

    // Retrieve entity from local storage
    entity = ((key_or_entity instanceof gaesynkit.db.Key)
              ? this.get(key_or_entity) : key_or_entity);

    // Calculate content hash
    function getContentHash(entity) {

      var s, keys;

      s = entity.key().value();
      keys = entity.keys();
      keys.sort();

      for (var i in keys) {
        s += JSON.stringify(entity.getProperty(keys[i]).toJSON());
      }

      return gaesynkit.util.md5(s);
    }

    content_hash = getContentHash(entity);

    id = gaesynkit.rpc.getNextRpcId();

    request = {"jsonrpc": "2.0",
               "method": "syncEntity",
               "params": [entity, content_hash],
               "id": id};

    function callback(response) {

      var entity;
      var storage = new gaesynkit.db.Storage;

      switch (response.result["status"]) {

        case _ENTITY_NOT_CHANGED: {

          entity = storage.get(response.result["key"]);
          entity.set_version(response.result["version"]);
          storage.put(entity);  

          break;
        };

        case _ENTITY_UPDATED: {

          var json = response.result["entity"];
          var key = new gaesynkit.db.Key(json["key"]);

          entity = _getEntityFromKeyAndJSON(key, json);
          storage.put(entity);

          break;
        };

        case _ENTITY_STORED: {

          entity = storage.get(response.result["key"]);
          entity.set_version(response.result["version"]);
          storage.put(entity);

          break;
        };

        default: throw Error("Unknown synchronization status");
      }
    }

    gaesynkit.rpc.makeRpc(request, callback, async);

    if (!async) {
      // Retrieve entity from local storage again
      entity = ((key_or_entity instanceof gaesynkit.db.Key)
                ? this.get(key_or_entity) : key_or_entity);

      return entity;
    }

    return true;
  };

  // Synchronize deleted entity
  gaesynkit.db.Storage.prototype.syncDeleted = function(key, async) {

    var async = async || false;

    var id = gaesynkit.rpc.getNextRpcId();

    request = {"jsonrpc": "2.0",
               "method": "syncDeletedEntity",
               "params": [key.value()],
               "id": id};

    function callback(response) {
      switch (response.result["status"]) {
        case _ENTITY_NOT_FOUND: break;
        case _ENTITY_DELETED: break;
        default: throw Error("Unknown synchronization status");
      }
    }

    gaesynkit.rpc.makeRpc(request, callback, async);

    return true;
  };

  /* Exporting the public API */
  gaesynkit.exportSymbol("gaesynkit.api", gaesynkit.api);  
  gaesynkit.exportSymbol("gaesynkit.rpc", gaesynkit.rpc);  
  gaesynkit.exportSymbol("gaesynkit.util", gaesynkit.util);  
  gaesynkit.exportSymbol("gaesynkit.db", gaesynkit.db);  

})();
