/*
 * test_gaesynkit.js - Unit tests for the gaesynkit Javascript library.
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

$(document).ready(function(){

  module("gaesynkit");

  test("api", function()
  {
    expect(1);
    equals(gaesynkit.api.VERSION, "1.0.0a1", "getting gaesynkit version");
  });

  test("rpc", function()
  {
    expect(4);

    // Get the JSON-RPC endpoint
    equals(gaesynkit.rpc.ENDPOINT, "/gaesynkit/rpc/",
           "JSON-RPC service endpoint");

    stop();

    // The callback function for our asynchronous JSON-RPC
    function callback(response) {
      equals(response.result, 42, "getting JSON-RPC result");
      start();
    }

    // Make asynchronous JSON-RPC
    ok(gaesynkit.rpc.makeAsyncCall(
         {"jsonrpc": "2.0", "method": "test", "params": [42], "id": 1},
         callback),
       "making asynchronous JSON-RPC"
    )

    // Try to make a JSON-RPC with invalid data
    raises(function() {gaesynkit.rpc.makeAsyncCall(["foobar", 7], callback)},
           "invalid JSON-RPC request throws an error")
  });

  test("util.base64", function()
  {
    expect(2);

    // Encode string
    equals(gaesynkit.util.base64.encode("foobar"), "Zm9vYmFy",
           "encoding string");

    // Encode string
    equals(gaesynkit.util.base64.decode("Zm9vYmFy"), "foobar",
           "decoding string");

  });

  test("db.Entity", function()
  {
    expect(17);

    // Create a Person entity
    ok(entity = new gaesynkit.db.Entity("Person", name="john"),
       "creating entity");

    // Check entity instance
    ok(entity instanceof gaesynkit.db.Entity, "checking entity instance");

    // Try to construct an entity without a kind
    raises(function() {new gaesynkit.db.Entity;},
           "trying to construct an entity without kind");

    // Try to construct an entity with kind of wrong type
    raises(function() {new gaesynkit.db.Entity(1);},
           "trying to construct an entity with kind of wrong type");

    // Try to construct an entity with name and id
    raises(function() {new gaesynkit.db.Entity("Foo", "foo", 1);},
           "trying to construct an entity with name and id");

    // Retrieve the kind
    equals(entity.kind(), "Person", "getting entity kind");

    // Update entity properties
    ok(entity.update({"name": "John Dowe", "birthdate": new gaesynkit.db.Datetime("1982-10-04 00:00:00")}),
       "updating entitiy properties");

    // Update entity with a list property
    ok(entity.update({"tags": ["nice", "educated"]}), "more properties");
    equals(entity.tags[0], "nice", "getting property value");

    // Retrieve a property value
    equals(entity.name, "John Dowe", "getting property value");

    equals(entity["birthdate"], "1982-10-04 00:00:00", "getting another value");

    // Try to update properties with an invalid data type
    raises(function() {entity.update("foobar");},
           "trying to update with invalid properties");

    // Delete a property
    ok(entity.deleteProperty("birthdate"), "deleting a property");

    raises(function() {entity.deleteProperty("foobar");},
           "trying to delete unknown property");

    raises(function() {entity.deleteProperty(42);},
           "trying to delete property with name of wrong type");

    raises(function() {entity.deleteProperty();},
           "trying to delete property without name");

    // Dump JSON
    equals(JSON.stringify(entity.toJSON()),
           "{\"kind\":\"Person\",\"name\":\"john\",\"properties\":[{\"name\":\"name\",\"value\":\"John Dowe\"},{\"name\":\"tags\",\"value\":[\"nice\",\"educated\"]}]}",
           "getting properties as JSON");
  });

  test("db.Storage", function()
  {
    expect(4);

    // Create an entity
    ok(entity = new gaesynkit.db.Entity("Book"), "creating entity");

    // Create properties
    ok(entity.update({"title":"The Adventures Of Tom Sawyer"}),
       "update properties");

    // Instantiate storage
    ok(storage = new gaesynkit.db.Storage, "instantiate Storage");

    // Put entity
    ok(key = storage.put(entity), "put entity");
    
  });

});
