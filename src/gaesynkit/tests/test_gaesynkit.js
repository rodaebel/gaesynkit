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

    // Check gaesynkit version
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

  test("db.Key", function()
  {
    expect(12);

    // Create root key
    ok(john = gaesynkit.db.Key.from_path("Person", 42), "creating root key");

    // Create child key
    ok(song = gaesynkit.db.Key.from_path("Song", "imagine", john),
       "creating child key");

    equals(gaesynkit.util.base64.decode(song.value()),
           "default!!Person\n42\tSong\bimagine", "checking key value");

    // Check if the key has either a numeric id or a name
    equals(john.has_id_or_name(), true,
           "checking if the key has either an id or a name");

    // Obtain the key id
    equals(john.id(), 42, "obtaining the root key id");

    // Get the kind
    equals(song.kind(), "Song", "getting the kind");

    // Obtain the key name
    equals(song.name(), "imagine", "obtaining the key name");

    // Get the namespace 
    equals(song.namespace(), "default", "getting the namespace");

    // try to get the parent 
    equals(john.parent(), null, "getting the parent");

    // try to get the parent 
    equals(song.parent().id(), john.id(), "getting the parent");

    // Use an invalid id
    raises(function() {gaesynkit.db.Key.from_path("Person", ["bar"]);},
           "trying to create a key with an invalid id");

    // Try to add a parent with a different namespace
    raises(function() {gaesynkit.db.Key.from_path("Song", "Ram", john, "foo");},
           "trying to add a parent with a different namespace");

  });

  test("db.Entity", function()
  {
    expect(18);

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
    ok(entity.update({
        "name": "John Dowe",
        "birthdate": new gaesynkit.db.Datetime("1982-10-04 00:00:00")}
      ), "updating entitiy properties");

    // Get property names
    equals(entity.keys().join(','), "name,birthdate", "getting property names");

    // Update entity with a list property
    ok(entity.update({"tags": ["nice", "educated"]}), "more properties");
    equals(entity.tags.join(','), "nice,educated", "getting property value");

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
    expect(10);

    // Create an entity
    ok(entity = new gaesynkit.db.Entity("Book"), "creating entity");

    // Create properties
    ok(entity.update({"title":"The Adventures Of Tom Sawyer"}),
       "update properties");

    // Instantiate storage
    ok(storage = new gaesynkit.db.Storage, "instantiating storage");

    // Get next numerical id
    equals(storage.getNextId(), 1, "getting next numerical id");

    // Put entity
    ok(key = storage.put(entity), "putting entity");

    // Get entity
    ok(entity = storage.get(key), "getting entity");

    // Get the entity's kind
    equals(entity.kind(), "Book", "getting the entity's kind");

    // Get property value
    equals(entity.title, "The Adventures Of Tom Sawyer",
           "getting property value");

    // Delete entity
    ok(storage.delete(key), "deleting entity");

    // Try to retrieve an entity by an invalid key
    raises(function() {
        storage.get(gaesynkit.db.Key.from_path("Foo", "foo"));
      }, "trying to retrieve an entity by an invalid key");

    // Clean up loacal storage
    delete localStorage["_NextId"];
    
  });

});
