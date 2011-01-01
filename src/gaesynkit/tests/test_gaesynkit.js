/*
 * test_gaesynkit.js - Unit tests for the gaesynkit Javascript library.
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

  test("db.ValueType", function()
  {
    expect(10);

    // Test the basic property value type object
    ok(data = new gaesynkit.db.ValueType("foo"),
       "creating a value type instance");

    // Check the value
    equals(data.value(), "foo", "checking the value");

    // Check JSON output
    equals(JSON.stringify(data.toJSON()),
           "{\"type\":\"string\",\"value\":\"foo\"}",
           "checking JSON output");

    // Create a datetime object
    ok(date = new gaesynkit.db.Datetime("2010-12-30T15:38:00"),
       "creating a datetime object")

    // Check if the given type is inherited from base type
    ok((date instanceof gaesynkit.db.ValueType),
       "checking if datetime is inherited from our base type");

    // Get denormalized date value
    equals(date.value().getFullYear(), 2010, "getting denormalized value");

    // Check JSON output
    equals(JSON.stringify(date.toJSON()),
           "{\"type\":\"gd:when\",\"value\":\"2010-12-30T15:38:00\"}",
           "checking JSON output for datetime");

    // Create byte string
    ok(bytestring = new gaesynkit.db.ByteString("Très bien"),
       "creating byte string")

    // Get byte string value
    equals(bytestring.value(), "Très bien", "getting byte string value");

    // Check JSON output
    equals(JSON.stringify(bytestring.toJSON()),
           "{\"type\":\"byte_string\",\"value\":\"VHLDqHMgYmllbg==\"}",
           "checking JSON output for byte string");

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
    expect(20);

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

    equals(entity["birthdate"].getFullYear(), 1982, "getting another value");

    // Update a single property
    ok(entity.birthdate = new gaesynkit.db.Datetime("1982-10-04 13:00:00"),
       "updating a single property");

    equals(entity["birthdate"].getHours(), 13, "getting updated value");

    // Try to update properties with an invalid data type
    raises(function() {entity.update("foobar");},
           "trying to update with invalid properties");

    // Delete a property
    ok(entity.deleteProperty("tags"), "deleting a property");

    raises(function() {entity.deleteProperty("foobar");},
           "trying to delete unknown property");

    raises(function() {entity.deleteProperty(42);},
           "trying to delete property with name of wrong type");

    raises(function() {entity.deleteProperty();},
           "trying to delete property without name");

    // Dump JSON
    equals(JSON.stringify(entity.toJSON()),
           "{\"kind\":\"Person\",\"key\":\"ZGVmYXVsdCEhUGVyc29uCGpvaG4=\",\"name\":\"john\",\"properties\":{\"name\":{\"type\":\"string\",\"value\":\"John Dowe\"},\"birthdate\":{\"type\":\"gd:when\",\"value\":\"1982-10-04 13:00:00\"}}}",
           "getting properties as JSON");

  });

  test("db.Storage", function()
  {
    expect(21);

    // Create an entity
    ok(entity = new gaesynkit.db.Entity("Book"), "creating entity");

    // Update properties
    ok(entity.update({"title":"The Adventures Of Tom Sawyer"}),
       "update properties");

    // Add another property
    var date = new Date("1876/06/01 00:00:00");

    ok(entity.update({"date": new gaesynkit.db.Datetime(date)}),
       "adding another property");

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

    // Get property type
    equals(entity.getProperty("title").type(), "string",
           "getting property type");

    // Get property value
    equals(entity.title, "The Adventures Of Tom Sawyer",
           "getting property value");

    // Get another property value
    equals(entity.date.getFullYear(), 1876, "getting another property value");

    // Get original property with invalid property name
    raises(function() {entity.getProperty("foo")},
           "trying to get non-existent property");

    // Delete entity
    ok(storage.deleteEntityWithKey(key), "deleting entity");

    // Try to retrieve an entity by an invalid key
    raises(function() {
        storage.get(gaesynkit.db.Key.from_path("Foo", "foo"));
      }, "trying to retrieve an entity by an invalid key");

    // Test ancestors; create root entity
    ok(entity_a = new gaesynkit.db.Entity("A", "a"), "creating root entity");

    // Store root entity
    ok(key_a = storage.put(entity_a), "putting root entity");

    // Create child entity
    ok(entity_b = new gaesynkit.db.Entity("B", "b", 0, key_a),
       "creating child entity");

    // Put child entity
    ok(key_b = storage.put(entity_b), "putting child entity");

    // Get the child entity and ask for the parent key
    equals(storage.get(key_b).key().parent().name(), "a",
           "getting ancestor");

    // Clean up
    ok(storage.deleteEntityWithKey(key_a), "deleting root entity");

    ok(storage.deleteEntityWithKey(key_b), "deleting child entity");

    // Clean up local storage
    delete localStorage["_NextId"];
    
  });

});
