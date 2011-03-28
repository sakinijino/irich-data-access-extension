iRichApp = SC.Application.create({
  NAMESPACE: 'Irich',
  VERSION: 'CachedStore Test',
  store: SC.Store.create().from(SC.Record.fixtures)
});

PERSISTENCE_CONFIG = {
  Record: {
    "iRichApp.Task": {
      location: SC.Record.LOCAL
    },

    "iRichApp.User": {
      localCache: false,
      useCache: true,
      maxAge: 300
    }
  }
}

iRichApp.Task = SC.Record.extend({
  isDone: SC.Record.attr(Boolean), 
  description: SC.Record.attr(String)
});
iRichApp.Task._object_className = "iRichApp.Task";

iRichApp.User = SC.Record.extend({
  isDone: SC.Record.attr(Boolean), 
  description: SC.Record.attr(String)
});
iRichApp.User._object_className = "iRichApp.User";

iRichApp.User.newId = 10;
iRichApp.User.CONSTS = {
  OLD:  { "guid": "user-1", "description": "Item OLD", "isDone": false },
  ND: { "guid": "user-1", "description": "Item ND", "isDone": false },
  ND2: { "guid": "user-1", "description": "Item ND2", "isDone": false },
  T4: { "guid": "user-2", "description": "Item T4", "isDone": false },
  T42: { "guid": "user-2", "description": "Item T42", "isDone": false },
  T5: { "guid": "user-2", "description": "Item T5", "isDone": false }
}
   

iRichApp.FIXTURES = {
  "user-1": SC.clone(iRichApp.User.CONSTS.OLD),
  "user-2": SC.clone(iRichApp.User.CONSTS.T4),
  "user-3": { "guid": "user-3", "description": "Next, the world!", "isDone": false }
};

iRichApp.RichAppDataSource = SC.DataSource.extend({
  fetch: function(store, query) {
    var recordTypeStr = SC._object_className(query.get('recordType'))
    if (recordTypeStr != iRichApp.User._object_className) return NO

    var hashes = [];
    for (var n in iRichApp.FIXTURES)
      hashes.push(iRichApp.FIXTURES[n])
    hashes = hashes.sort(function(i,j){return i.guid>j.guid});
    store.loadRecords(iRichApp.User, hashes);

    var storeKeys = []
    for (var n in iRichApp.FIXTURES)
      storeKeys.push(iRichApp.User.storeKeyFor(iRichApp.FIXTURES[n].guid))
    store.loadQueryResults(query, storeKeys);
    return YES;
  },
  retrieveRecord: function(store, storeKey) {
    var recordTypeStr = SC._object_className(SC.Store.recordTypeFor(storeKey))
    if (recordTypeStr != iRichApp.User._object_className) return NO

    var id = store.idFor(storeKey);
    if (iRichApp.FIXTURES[id])
      store.dataSourceDidComplete(storeKey, iRichApp.FIXTURES[id]);
    else 
      store.dataSourceDidError(storeKey, null);
    return YES;
  },
  createRecord: function(store, storeKey) {
    var recordTypeStr = SC._object_className(SC.Store.recordTypeFor(storeKey))
    if (recordTypeStr != iRichApp.User._object_className) return NO

    var newId="user-"+iRichApp.User.newId++;
    iRichApp.FIXTURES[newId] = { "guid": newId, "description": "New User "+newId, "isDone": false }
    store.dataSourceDidComplete(storeKey, iRichApp.FIXTURES[newId], newId);
    return YES
  },
  updateRecord: function(store, storeKey) {
    var recordTypeStr = SC._object_className(SC.Store.recordTypeFor(storeKey))
    if (recordTypeStr != iRichApp.User._object_className) return NO

    var id = store.idFor(storeKey);
    var hash = store.readDataHash(storeKey)
    iRichApp.FIXTURES[id].description = hash.description;
    iRichApp.FIXTURES[id].isDone = hash.isDone;
    store.dataSourceDidComplete(storeKey, iRichApp.FIXTURES[id]);
    return YES
  },
  destroyRecord: function(store, storeKey) {
    var recordTypeStr = SC._object_className(SC.Store.recordTypeFor(storeKey))
    if (recordTypeStr != iRichApp.User._object_className) return NO

    var id = store.idFor(storeKey);
    delete iRichApp.FIXTURES[id]
    store.dataSourceDidDestroy(storeKey);
  }
});

test("Local DS Config Load", function(){
  var lds = iRich.LocalDataSource.create();
  lds.loadPersistenceConfig()
  equals(lds._local_storage_record_types.length, 1, "Config Load")
  equals(lds._local_storage_record_types[0], iRichApp.Task, "Config Load")
})

test("CRUD Local Storage", function() {
  var store = iRich.CachedStore.create();
  store.loadPersistenceConfig()
  var lds = iRich.LocalDataSource.create();
  lds.loadPersistenceConfig()
  lds._sync_model = true // for test
  store.from(lds);
  
  var t1 = store.createRecord(iRichApp.Task, {"description": "Task 1", "isDone": false})
  var t2 = store.createRecord(iRichApp.Task, {"description": "Task 2", "isDone": true})
  store.commitRecords()

  var guid1 = t1.get("guid")
  var guid2 = t2.get("guid")

  store.reset();
  var t1 = store.find(iRichApp.Task, guid1)
  var t2 = store.find(iRichApp.Task, guid2)
  ok(t1!=null, "Task1 Loaded")
  ok(t2!=null, "Task2 Loaded")

  equals(t1.get("guid"), guid1, "Task1 save and load")
  equals(t1.get("description"), "Task 1", "Task1 save and load")
  equals(t1.get("isDone"), false, "Task1 save and load")
  equals(t2.get("guid"), guid2, "Task2 save and load")
  equals(t2.get("description"), "Task 2", "Task2 save and load")
  equals(t2.get("isDone"), true, "Task2 save and load")

  t1.set("description", "Update Task 1")
  t2.set("description", "Update Task 2")
  t1.set("isDone", true)
  store.commitRecords()

  store.reset();
  var t1 = store.find(iRichApp.Task, guid1)
  var t2 = store.find(iRichApp.Task, guid2)
  ok(t1!=null, "Task1 Loaded")
  ok(t2!=null, "Task2 Loaded")

  equals(t1.get("guid"), guid1, "Task1 load")
  equals(t1.get("description"), "Update Task 1", "Task1 update")
  equals(t1.get("isDone"), true, "Task1 finished")
  equals(t2.get("guid"), guid2, "Task2 load")
  equals(t2.get("description"), "Update Task 2", "Task2 update")

  store.destroyRecord(iRichApp.Task, guid1)
  store.commitRecords()

  store.reset();
  var t1 = store.find(iRichApp.Task, guid1)
  var t2 = store.find(iRichApp.Task, guid2)
  equals(store.readStatus(t1.storeKey), SC.Record.ERROR, "Task1 Destroyed")
  ok(t2!=null, "Task2 Loaded")
  equals(t2.get("guid"), guid2, "Task2 load")

  store.destroyRecord(iRichApp.Task, guid2)
  store.commitRecords()

  store.reset();
  var t2 = store.find(iRichApp.Task, guid2)
  equals(store.readStatus(t2.storeKey), SC.Record.ERROR, "Task1 Destroyed")

  lds.clearlocalStorage();
})


test("Cascade Data Sources", function() {
  var store = iRich.CachedStore.create();
  store.loadPersistenceConfig()
  
  var lds = iRich.LocalDataSource.create();
  lds.loadPersistenceConfig()
  lds._sync_model = true // for test

  var appds = iRichApp.RichAppDataSource.create();
  store.cascade(lds, appds)

  var t1 = store.createRecord(iRichApp.Task, {"description": "Task 1", "isDone": false})
  var t2 = store.createRecord(iRichApp.Task, {"description": "Task 2", "isDone": true})
  var u1 = store.createRecord(iRichApp.User, {"description": "User 1", "isDone": false})
  var u2 = store.createRecord(iRichApp.User, {"description": "User 2", "isDone": true})
  store.commitRecords()

  var guid1 = t1.get("guid")
  var guid2 = t2.get("guid")
  var guid3 = u1.get("guid")
  var guid4 = u2.get("guid")

  store.reset();
  var t1 = store.find(iRichApp.Task, guid1)
  var t2 = store.find(iRichApp.Task, guid2)
  var u1 = store.find(iRichApp.User, guid3)
  var u2 = store.find(iRichApp.User, guid4)

  equals(t1.get("guid"), guid1, "Task1 save and load")
  equals(t2.get("guid"), guid2, "Task2 save and load")
  equals(u1.get("guid"), guid3, "User1 save and load")
  equals(u2.get("guid"), guid4, "User2 save and load")

  t1.set("description", "Update Task 1")
  t2.set("description", "Update Task 2")
  t1.set("isDone", true)
  u1.set("description", "Update User 1")
  u2.set("description", "Update User 2")
  u1.set("isDone", true)
  store.commitRecords()

  store.reset();
  var t1 = store.find(iRichApp.Task, guid1)
  var t2 = store.find(iRichApp.Task, guid2)
  var u1 = store.find(iRichApp.User, guid3)
  var u2 = store.find(iRichApp.User, guid4)

  equals(t1.get("description"), "Update Task 1", "Task1 update")
  equals(t1.get("isDone"), true, "Task1 finished")
  equals(t2.get("description"), "Update Task 2", "Task2 update")
  equals(u1.get("description"), "Update User 1", "User1 update")
  equals(u1.get("isDone"), true, "User1 finished")
  equals(u2.get("description"), "Update User 2", "User2 update")

  store.destroyRecord(iRichApp.Task, guid1)
  store.destroyRecord(iRichApp.Task, guid2)
  store.destroyRecord(iRichApp.User, guid3)
  store.destroyRecord(iRichApp.User, guid4)
  store.commitRecords()

  store.reset();
  var t1 = store.find(iRichApp.Task, guid1)
  var t2 = store.find(iRichApp.Task, guid2)
  var u1 = store.find(iRichApp.User, guid3)
  var u2 = store.find(iRichApp.User, guid4)
  equals(store.readStatus(t1.storeKey), SC.Record.ERROR, "Task1 Destroyed")
  equals(store.readStatus(t2.storeKey), SC.Record.ERROR, "Task2 Destroyed")
  equals(store.readStatus(u1.storeKey), SC.Record.ERROR, "User1 Destroyed")
  equals(store.readStatus(u2.storeKey), SC.Record.ERROR, "User2 Destroyed")

  lds.clearlocalStorage();
})

test("Cascade Data Sources Query", function() {
  var store = iRich.CachedStore.create();
  store.loadPersistenceConfig()
  
  var lds = iRich.LocalDataSource.create();
  lds.loadPersistenceConfig()
  lds._sync_model = true // for test

  var appds = iRichApp.RichAppDataSource.create();
  store.cascade(lds, appds)

  var t1 = store.createRecord(iRichApp.Task, {"description": "Task 1", "isDone": false})
  var t2 = store.createRecord(iRichApp.Task, {"description": "Task 2", "isDone": true})
  var u1 = store.createRecord(iRichApp.User, {"description": "User 1", "isDone": false})
  var u2 = store.createRecord(iRichApp.User, {"description": "User 2", "isDone": true})
  store.commitRecords()

  var guid1 = t1.get("guid")
  var guid2 = t2.get("guid")
  var guid3 = u1.get("guid")
  var guid4 = u2.get("guid")

  store.reset();
  var qt = SC.Query.build(SC.Query.LOCAL, iRichApp.Task);
  var qu = SC.Query.build(SC.Query.REMOTE, iRichApp.User);

  var ts = store.find(qt);
  var us = store.find(qu);

  equals(ts.length(), 2, "Local Query Tasks Loaded")
  equals(ts.objectAt(0).get("guid"), guid1, "Task1 save and load")
  equals(ts.objectAt(1).get("guid"), guid2, "Task2 save and load")
  equals(us.length(), 5, "Users Loaded")
  equals(us.objectAt(us.length()-2).get("guid"), guid3, "User1 save and load")
  equals(us.objectAt(us.length()-1).get("guid"), guid4, "User2 save and load")

  store.reset();
  var qt = SC.Query.build(SC.Query.REMOTE, iRichApp.Task);
  var ts = store.find(qt);

  equals(ts.length(), 2, "Remote Query Tasks Loaded")
  equals(ts.objectAt(0).get("guid"), guid1, "Task1 save and load")
  equals(ts.objectAt(1).get("guid"), guid2, "Task2 save and load")

  lds.clearlocalStorage();
})
