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
    expect(2);

    // Check gaesynkit version
    equals(gaesynkit.api.VERSION, "1.0.0a1", "getting gaesynkit version");

    //Configure application id
    equals(gaesynkit.api.APPLICATION_ID, "gaesynkit",
           "checking application id");

  });

  test("rpc", function()
  {
    expect(7);

    ok(id = gaesynkit.rpc.getNextRpcId(), "getting next JSON-RPC id");

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
    ok(gaesynkit.rpc.makeRpc(
         {"jsonrpc": "2.0", "method": "test", "params": [42], "id": 1},
         callback, true),
       "making asynchronous JSON-RPC"
    )

    // The callback function for our asynchronous JSON-RPC
    function callback2(response) {
      equals(response.result, "foo", "getting JSON-RPC result");
    }

    // Make synchronous JSON-RPC
    ok(gaesynkit.rpc.makeRpc(
         {"jsonrpc": "2.0", "method": "test", "params": ["foo"], "id": 2},
         callback2),
       "making synchronous JSON-RPC"
    )

    // Try to make a JSON-RPC with invalid data
    raises(function() {gaesynkit.rpc.makeRpc(["foobar", 7], callback)},
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

  test("util.md5", function()
  {
    expect(1);

    // Generate md5 checksum
    equals(gaesynkit.util.md5("foobar"), "3858f62230ac3c915f300c664312c63f",
           "generating md5 checksum");

  });

  test("db.ValueType", function()
  {
    expect(3);

    // Test the basic property value type object
    ok(data = new gaesynkit.db.ValueType("foo"),
       "creating a value type instance");

    // Check the value
    equals(data.value(), "foo", "checking the value");

    // Check JSON output
    equals(JSON.stringify(data.toJSON()),
           "{\"type\":\"string\",\"value\":\"foo\"}",
           "checking JSON output");

  });

  test("db.ByteString", function()
  {
    expect(3);

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

  test("db.Bool", function()
  {
    expect(6);

    // Create boolean
    ok(bool = new gaesynkit.db.Bool(true), "creating boolean")

    // Get boolean value
    equals(bool.value(), true, "getting boolean value");

    // Check JSON output
    equals(JSON.stringify(bool.toJSON()), "{\"type\":\"bool\",\"value\":true}",
           "checking JSON output for boolean");

    // Create plain entity
    ok(entity = new gaesynkit.db.Entity("Foo"), "creating plain entity");

    // Update entity with boolean value
    ok(entity.update({"value": true}), "updating entity with boolean value");

    // Check boolean value
    equals(entity.value, true, "checking boolean value");

  });

  test("db.Integer", function()
  {
    expect(6);

    // Create integer
    ok(integer = new gaesynkit.db.Integer(42), "creating integer")

    // Get integer value
    equals(integer.value(), 42, "getting integer value");

    // Check JSON output
    equals(JSON.stringify(integer.toJSON()), "{\"type\":\"int\",\"value\":42}",
           "checking JSON output for integer");

    // Create plain entity
    ok(entity = new gaesynkit.db.Entity("Foo"), "creating plain entity");

    // Update entity with integer value
    ok(entity.update({"value": 42}), "updating entity with integer value");

    // Check integer value
    equals(entity.value, 42, "checking integer value");

  });

  test("db.Float", function()
  {
    expect(6);

    // Create float
    ok(float_value = new gaesynkit.db.Float(0.34), "creating float")

    // Get float value
    equals(float_value.value(), 0.34, "getting float value");

    // Check JSON output
    equals(JSON.stringify(float_value.toJSON()),
           "{\"type\":\"float\",\"value\":0.34}",
           "checking JSON output for float");

    // Create entity with float value
    ok(entity = new gaesynkit.db.Entity("Dummy"),
       "creating entity with float property");

    // Update entity with float property
    ok(entity.update({"float": 0.42}), "updating entity with float property");

    // Get JSON output for our entity
    equals(JSON.stringify(entity.toJSON()),
           "{\"kind\":\"Dummy\",\"key\":\"Z2Flc3lua2l0QGRlZmF1bHQhIUR1bW15CjA=\",\"version\":0,\"properties\":{\"float\":{\"type\":\"float\",\"value\":0.42}}}",
           "getting JSON output for an entity with float property");

  });

  test("db.Datetime", function()
  {
    expect(7);

    // Create a datetime value
    ok(date = new gaesynkit.db.Datetime("2010/12/30 15:38:00"),
       "creating a datetime value")

    // Check if the newly created value inherits from our base value type
    ok((date instanceof gaesynkit.db.ValueType), "checking class hierarchy");

    // Get denormalized datetime value
    equals(date.value().getFullYear(), 2010, "getting denormalized value");

    // Check JSON output
    equals(JSON.stringify(date.toJSON()),
           "{\"type\":\"gd:when\",\"value\":\"2010/12/30 15:38:00\"}",
           "checking JSON output for datetime");

    // Create plain entity
    ok(entity = new gaesynkit.db.Entity("Foo"), "creating plain entity");

    // Update entity with date value
    ok(entity.update({"value": date}), "updating entity with date value");

    // Check integer value
    equals(entity.value.getFullYear(), 2010, "checking date value");

  });

  test("db.List", function()
  {
    expect(13);

    // Create a string list value
    ok(list = new gaesynkit.db.List(["foo", "bar"]),
       "creating a string list value")

    // Check if the newly created value is inherited from our base value type
    ok((list instanceof gaesynkit.db.ValueType),
       "checking if the newly created value inherits from our base value type");

    // Get string list value
    equals(list.value().join(','), "foo,bar", "getting list value");

    // Check JSON output
    equals(JSON.stringify(list.toJSON()),
           "{\"type\":\"string\",\"value\":[\"foo\",\"bar\"]}",
           "checking JSON output for our list");

    // Create an integer list value
    ok(list = new gaesynkit.db.List([42, 7]), "creating an integer list value")

    // Get integer list value
    equals(list.value().join(','), "42,7", "getting integer list value");

    // Check JSON output
    equals(JSON.stringify(list.toJSON()),
           "{\"type\":\"int\",\"value\":[42,7]}",
           "checking JSON output for our integer list value");

    // Create a list of booleans value
    var values = [new gaesynkit.db.Bool(true), new gaesynkit.db.Bool(false)];
    ok(bools = new gaesynkit.db.List(values), "creating a bool list value")

    // Get bool list value
    equals(bools.value().join(','), "true,false", "getting bool list value");

    // Check JSON output
    equals(JSON.stringify(bools.toJSON()),
           "{\"type\":\"bool\",\"value\":[true,false]}",
           "checking JSON output for our integer list value");

    // Create plain entity
    ok(entity = new gaesynkit.db.Entity("Foo"), "creating plain entity");

    // Update entity with list value
    ok(entity.update({"value": values}), "updating entity with list value");

    // Check integer value
    equals(entity.value.join(','), "true,false", "checking list value");

  });

  test("db.Key", function()
  {
    expect(14);

    // Create key
    ok(paul = gaesynkit.db.Key.from_path("Person", "paul"), "creating key");

    // Get the key name
    equals(paul.name(), "paul", "getting the key name");

    // Create root key
    ok(john = gaesynkit.db.Key.from_path("Person", 42), "creating root key");

    // Create child key
    ok(song = gaesynkit.db.Key.from_path("Song", "imagine", john),
       "creating child key");

    equals(gaesynkit.util.base64.decode(song.value()),
           "gaesynkit@default!!Person\n42\tSong\bimagine",
           "checking key value");

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

  test("db.User", function()
  {
    expect(3);

    // Create user
    ok(user = new gaesynkit.db.User("john@example.com"), "creating user")

    // Get user value
    equals(user.value(), "john@example.com", "getting user value");

    // Check JSON output
    equals(JSON.stringify(user.toJSON()),
           "{\"type\":\"user\",\"value\":\"john@example.com\"}",
           "checking JSON output for user");

  });

  test("db.Email", function()
  {
    expect(3);

    // Create user
    ok(email = new gaesynkit.db.Email("john@example.com"), "creating email")

    // Get email value
    equals(email.value(), "john@example.com", "getting email value");

    // Check JSON output
    equals(JSON.stringify(email.toJSON()),
           "{\"type\":\"gd:email\",\"value\":\"john@example.com\"}",
           "checking JSON output for email");

  });

  test("db.GeoPt", function()
  {
    expect(5);

    // Create a geographical point
    ok(point = new gaesynkit.db.GeoPt(52.500556, 13.398889), "creating a point")

    // Get GeoPt value
    equals(point.value().join(','), "52.500556,13.398889",
           "getting the point's value");

    // Get latitude
    equals(point.latitude(), 52.500556, "getting the latitude");

    // Get longitude
    equals(point.longitude(), 13.398889, "getting the longitude");

    // Check JSON output
    equals(JSON.stringify(point.toJSON()),
           "{\"type\":\"georss:point\",\"value\":\"52.500556,13.398889\"}",
           "checking JSON output for a geographical point");

  });

  test("db.Entity", function()
  {
    expect(24);

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

    // Get the entity version
    equals(entity.version(), 0, "getting the current entity version");

    // Update entity properties
    ok(entity.update({
         "name": "John Dowe",
         "birthdate": new gaesynkit.db.Datetime("1982/10/04 00:00:00")}),
       "updating entitiy properties");

    // Get property names
    equals(entity.keys().join(','), "name,birthdate", "getting property names");

    // Update entity with a list property
    ok(entity.update({"tags": ["nice", "educated"]}), "more properties");
    equals(entity.tags.join(','), "nice,educated", "getting property value");

    // Retrieve a property value
    equals(entity.name, "John Dowe", "getting property value");

    equals(entity["birthdate"].getFullYear(), 1982, "getting another value");

    // Update a single property
    ok(entity.birthdate = new gaesynkit.db.Datetime("1982/10/04 13:00:00"),
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
           "{\"kind\":\"Person\",\"key\":\"Z2Flc3lua2l0QGRlZmF1bHQhIVBlcnNvbghqb2hu\",\"version\":0,\"name\":\"john\",\"properties\":{\"name\":{\"type\":\"string\",\"value\":\"John Dowe\"},\"birthdate\":{\"type\":\"gd:when\",\"value\":\"1982/10/04 13:00:00\"}}}",
           "encoding entity to JSON");

    // Create a new Person entity
    ok(entity = new gaesynkit.db.Entity("Person"),
       "creating new entity");

    // Add property
    ok(entity.update({"name": "John Appleseed"}), "adding property");

    // Dump JSON
    equals(JSON.stringify(entity.toJSON()),
           "{\"kind\":\"Person\",\"key\":\"Z2Flc3lua2l0QGRlZmF1bHQhIVBlcnNvbgow\",\"version\":0,\"properties\":{\"name\":{\"type\":\"string\",\"value\":\"John Appleseed\"}}}",
           "encoding entity to JSON");

  });

  test("db.Storage", function()
  {
    expect(44);

    // Create an entity
    ok(entity = new gaesynkit.db.Entity("Book"), "creating entity");

    // Update properties
    ok(entity.update({"title": "The Catcher in the Rye"}), "update properties");

    // Add datetime property value
    var date = new Date("1951/07/16 00:00:00");

    ok(entity.update({"date": new gaesynkit.db.Datetime(date)}),
       "adding datetime property");

    // Add boolean property value
    ok(entity.update({"classic": new gaesynkit.db.Bool(true)}),
       "adding boolean property");

    // Add integer property value
    ok(entity.update({"pages": new gaesynkit.db.Integer(288)}),
       "adding integer property");

    // Add list property values
    ok(entity.update({"tags": new gaesynkit.db.List(["novel", "identity"])}),
       "adding list property values");

    // Instantiate storage
    ok(storage = new gaesynkit.db.Storage, "instantiating storage");

    // Get next numerical id
    equals(storage.getNextId(), 1, "getting next numerical id");

    // Get the entity version
    equals(entity.version(), 0, "getting the current entity version");

    // Put entity
    ok(key = storage.put(entity), "putting entity");

    // Get entity
    ok(entity = storage.get(key), "getting entity");

    // Get entity's key
    ok(key = entity.key(), "getting entity's key");

    // Get the entity id
    equals(key.id(), 2, "getting the entity id");

    // Get the entity's kind
    equals(entity.kind(), "Book", "getting the entity's kind");

    // Get property type
    equals(entity.getProperty("title").type(), "string",
           "getting property type");

    // Get property value
    equals(entity.title, "The Catcher in the Rye",
           "getting property value");

    // Get datetime property value
    equals(entity.date.getFullYear(), 1951, "getting datetime property value");

    // Get boolean property value
    equals(entity.classic, true, "getting boolean property value");

    // Get integer property value
    equals(entity.pages, 288, "getting integer property value");

    // Get original property with invalid property name
    raises(function() {entity.getProperty("foo")},
           "trying to get non-existent property");

    // Synchronize entity
    ok(storage.sync(entity), "synchronizing entity");

    // Get entity
    ok(entity = storage.get(key), "getting synchronized entity");

    // Get the new entity version
    equals(entity.version(), 1, "getting the modified entity version");

    // Modify entity
    ok(entity.update({"pages": 287}), "modifying entity properties");

    // Put modified entity
    ok(key = storage.put(entity), "putting modified entity");

    // Get modified entity
    ok(entity = storage.get(key), "getting modified entity");

    // Synchronize modified entity by key
    ok(storage.sync(key), "synchronizing modified entity by key");

    // Get entity
    ok(entity = storage.get(key), "getting modified entity after sync");

    // Get the modified entity version
    equals(entity.version(), 2, "getting the modified entity version");

    // Delete entity
    ok(storage.deleteEntityWithKey(key), "deleting entity");

    // Synchronize deleted entity
    ok(storage.syncDeleted(key), "synchronizing deleted entity");

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

    // Synchronize root entity
    ok(storage.sync(entity_a), "synchronizing root entity");    

    // Synchronize child entity by key
    ok(entity = storage.sync(key_b), "synchronizing child entity by key");    

    // Check new version
    equals(entity.version(), 1, "checking new version");

    // Clean up
    ok(storage.deleteEntityWithKey(key_a), "deleting root entity");

    ok(storage.deleteEntityWithKey(key_b), "deleting child entity");

    // Synchronize deleted child entity
    ok(storage.syncDeleted(key_b), "synchronizing deleted child entity");

    // Synchronize deleted root entity
    ok(storage.syncDeleted(key_a), "synchronizing deleted root entity");

    // Clean up local storage
    delete window.localStorage["_NextId"];
    delete window.localStorage["_NextRpcId"];
    
  });

});
