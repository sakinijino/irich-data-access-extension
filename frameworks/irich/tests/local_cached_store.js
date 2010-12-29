iRichApp = SC.Application.create({
  NAMESPACE: 'Irich',
  VERSION: 'CachedStore Test',
  store: SC.Store.create().from(SC.Record.fixtures)
});

WEBKIT_PERSISTENCE_CONFIG = {
  Record: {
    "iRichApp.Task": {
      localCache: true,
      useCache: true,
      maxAge: 200
    },

    "iRichApp.User": {
      localCache: true,
      useCache: true,
      maxAge: 300
    }
  }
}

MOZILLA_PERSISTENCE_CONFIG = {
  Record: {
    "iRichApp.Task": {
      localCache: true,
      useCache: true,
      maxAge: 4000
    },

    "iRichApp.User": {
      localCache: true,
      useCache: true,
      maxAge: 6000
    }
  }
}

if (SC.browser.isMozilla) PERSISTENCE_CONFIG = MOZILLA_PERSISTENCE_CONFIG
else PERSISTENCE_CONFIG = WEBKIT_PERSISTENCE_CONFIG

module("iRich.CachedStoreWithConf", {
  setup: function() {
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

    iRichApp.Task.newId = 10;
    iRichApp.Task.CONSTS = {
      OLD:  { "guid": "task-1", "description": "Item OLD", "isDone": false },
      ND: { "guid": "task-1", "description": "Item ND", "isDone": false },
      ND2: { "guid": "task-1", "description": "Item ND2", "isDone": false },
      T4: { "guid": "task-2", "description": "Item T4", "isDone": false },
      T42: { "guid": "task-2", "description": "Item T42", "isDone": false },
      T5: { "guid": "task-2", "description": "Item T5", "isDone": false }
    }

    iRichApp.User.CONSTS = {
      OLD:  { "guid": "user-1", "description": "Item OLD", "isDone": false },
      ND: { "guid": "user-1", "description": "Item ND", "isDone": false },
      ND2: { "guid": "user-1", "description": "Item ND2", "isDone": false },
      T4: { "guid": "user-2", "description": "Item T4", "isDone": false },
      T42: { "guid": "user-2", "description": "Item T42", "isDone": false },
      T5: { "guid": "user-2", "description": "Item T5", "isDone": false }
    }
   
    iRichApp.FIXTURES = {
      "task-1": SC.clone(iRichApp.Task.CONSTS.OLD),
      "task-2": SC.clone(iRichApp.Task.CONSTS.T4),
      "task-3": { "guid": "task-3", "description": "Next, the world!", "isDone": false },
      "user-1": SC.clone(iRichApp.User.CONSTS.OLD),
      "user-2": SC.clone(iRichApp.User.CONSTS.T4),
      "user-3": { "guid": "user-3", "description": "Next, the world!", "isDone": false }
    };

    iRichApp.RichAppDataSource = SC.DataSource.extend({
      fetch: function(store, query) {
        var hashes = [];
        for (var n in iRichApp.FIXTURES)
          hashes.push(iRichApp.FIXTURES[n])
        hashes = hashes.sort(function(i,j){return i.guid>j.guid});
        store.loadRecords(iRichApp.Task, hashes);

        var storeKeys = []
        for (var n in iRichApp.FIXTURES)
          storeKeys.push(iRichApp.Task.storeKeyFor(iRichApp.FIXTURES[n].guid))
        store.loadQueryResults(query, storeKeys);
        return YES;
      },
      retrieveRecord: function(store, storeKey) {
        var id = store.idFor(storeKey);
        var recordTypeStr = SC._object_className(SC.Store.recordTypeFor(storeKey))

        if (recordTypeStr == iRichApp.Task._object_className && iRichApp.FIXTURES[id])
          store.dataSourceDidComplete(storeKey, iRichApp.FIXTURES[id]);
        else if (recordTypeStr == iRichApp.User._object_className && iRichApp.FIXTURES[id])
          store.dataSourceDidComplete(storeKey, iRichApp.FIXTURES[id]);
        else 
          store.dataSourceDidError(storeKey, null);
        return YES;
      },
      createRecord: function(store, storeKey) {
        var newId="task-"+iRichApp.Task.newId++;
        iRichApp.FIXTURES[newId] = { "guid": newId, "description": "New Item "+newId, "isDone": false }
        store.dataSourceDidComplete(storeKey, iRichApp.FIXTURES[newId], newId);
        return YES
      },
      updateRecord: function(store, storeKey) {
        var id = store.idFor(storeKey);
        var hash = store.readDataHash(storeKey)
        iRichApp.FIXTURES[id].description = hash.description;
        iRichApp.FIXTURES[id].isDone = hash.isDone;
        store.dataSourceDidComplete(storeKey, iRichApp.FIXTURES[id]);
        return YES
      },
      destroyRecord: function(store, storeKey) {
        var id = store.idFor(storeKey);
        delete iRichApp.FIXTURES[id]
        store.dataSourceDidDestroy(storeKey);
      }
    });

    iRichApp.sleep = function(milliSeconds){
      var startTime = new Date().getTime();
      while (new Date().getTime() < startTime + milliSeconds);
    };
  },
  teardown: function() {
    delete iRichApp.Task.CONSTS;
    delete iRichApp.Task;
    delete iRichApp.User.CONSTS;
    delete iRichApp.User;
    delete iRichApp.FIXTURES;
    delete iRichApp.RichAppDataSource;
    delete iRichApp.sleep;
  }
});

test("Record Local Cache", function() {
  var store_with_ds = iRich.CachedStore.create().from(iRichApp.RichAppDataSource.create());
  var fixtures = iRichApp.FIXTURES;

  store_with_ds.loadPersistenceConfig();
  var r = store_with_ds.find(iRichApp.Task, "task-1");
  equals(r.get('description'), iRichApp.Task.CONSTS.OLD.description, "Item Loaded.");
  
  fixtures["task-1"] = SC.clone(iRichApp.Task.CONSTS.ND);
  var r = store_with_ds.find(iRichApp.Task, "task-1");
  store_with_ds.flush();
  equals(r.get('description'), iRichApp.Task.CONSTS.OLD.description, "Cached!");

  var store_with_ds2 = iRich.CachedStore.create().from(iRichApp.RichAppDataSource.create());
  store_with_ds2.loadPersistenceConfig();
  var r = store_with_ds2.find(iRichApp.Task, "task-1");
  store_with_ds2.flush();
  equals(r.get('description'), iRichApp.Task.CONSTS.OLD.description, "Local Shared Cached!");

  iRichApp.sleep(iRichApp.Task.persistenceStratgy.maxAge);
  var r = store_with_ds2.find(iRichApp.Task, "task-1");
  store_with_ds2.flush();
  equals(r.get('description'), iRichApp.Task.CONSTS.ND.description, "Refreshed!");

  store_with_ds.clearLocalCache();

  var store_with_ds3 = iRich.CachedStore.create().from(iRichApp.RichAppDataSource.create());
  store_with_ds3.loadPersistenceConfig();
  
  fixtures["task-1"] = SC.clone(iRichApp.Task.CONSTS.ND2);
  var r = store_with_ds3.find(iRichApp.Task, "task-1");
  store_with_ds3.flush();
  equals(r.get('description'), iRichApp.Task.CONSTS.ND2.description, "Cleared!");

  store_with_ds.clearLocalCache();
});

test("CUD Record Local Cache", function() {
  var store = iRich.CachedStore.create().from(iRichApp.RichAppDataSource.create());
  store.loadPersistenceConfig();
  var fixtures = iRichApp.FIXTURES;

  var r = store.createRecord(iRichApp.Task, {});
  store.commitRecord(iRichApp.Task, null, r.storeKey)
  store.flush();
  ok(r.get('guid')!=null, "Item Created.")
  equals(r.get('description'), "New Item "+r.get('guid'), "Item Desp Set.");
 
  fixtures[r.get('guid')] = SC.clone(iRichApp.Task.CONSTS.ND);
  fixtures[r.get('guid')].guid = r.get('guid')
  var r = store.find(iRichApp.Task, r.get('guid'));
  store.flush();
  equals(r.get('description'), "New Item "+r.get('guid'), "Item Cached.");
  var store2 = iRich.CachedStore.create().from(iRichApp.RichAppDataSource.create());
  store2.loadPersistenceConfig();
  var r2 = store2.find(iRichApp.Task, r.get('guid'));
  store2.flush();
  equals(r2.get('description'), "New Item "+r2.get('guid'), "Local Shared Cached!");

  iRichApp.sleep(iRichApp.Task.persistenceStratgy.maxAge);
  var r = store.find(iRichApp.Task, r.get('guid'));
  store.flush();
  equals(r.get('description'), iRichApp.Task.CONSTS.ND.description, "Refreshed!");
  var r2 = store2.find(iRichApp.Task, r.get('guid'));
  store2.flush();
  equals(r2.get('description'), iRichApp.Task.CONSTS.ND.description, "Local Shared Refreshed!");

  r.set("description", "Updated")
  store.commitRecord(iRichApp.Task, null, r.storeKey)
  store.flush();
  equals(r.get('description'), "Updated", "Item Updated");

  fixtures[r.get('guid')] = SC.clone(iRichApp.Task.CONSTS.ND);
  fixtures[r.get('guid')].guid = r.get('guid')
  var r = store.find(iRichApp.Task, r.get('guid'));
  store.flush();
  equals(r.get('description'), "Updated", "Item Cached.");
  var store2 = iRich.CachedStore.create().from(iRichApp.RichAppDataSource.create());
  store2.loadPersistenceConfig();
  var r2 = store2.find(iRichApp.Task, r.get('guid'));
  store2.flush();
  equals(r2.get('description'), "Updated", "Local Shared Cached!");

  iRichApp.sleep(iRichApp.Task.persistenceStratgy.maxAge);
  var r = store.find(iRichApp.Task, r.get('guid'));
  store.flush();
  equals(r.get('description'), iRichApp.Task.CONSTS.ND.description, "Refreshed!");
  var r2 = store2.find(iRichApp.Task, r.get('guid'));
  store2.flush();
  equals(r2.get('description'), iRichApp.Task.CONSTS.ND.description, "Local Shared Refreshed!");

  var guid = r.get('guid')
  var storeKey = r.storeKey
  ok(!store.isRecordExpired(iRichApp.Task, null, r.storeKey), "Not Expired before destroyed")
  store.destroyRecord(iRichApp.Task, r.get('guid'))
  store.commitRecord(iRichApp.Task, null, storeKey)
  equals(store.readStatus(r.storeKey), SC.Record.DESTROYED_CLEAN, "Destroyed!")
  ok(store.isRecordExpired(iRichApp.Task, null, storeKey), "Expired after destroyed")

  var r = store.find(iRichApp.Task, guid);
  equals(store.readStatus(r.storeKey), SC.Record.ERROR, "Find Destroyed Record")
  var store2 = iRich.CachedStore.create().from(iRichApp.RichAppDataSource.create());
  store2.loadPersistenceConfig();
  ok(store2.isRecordExpired(iRichApp.Task, null, storeKey), "Expired after destroyed")
  var r2 = store2.find(iRichApp.Task, guid);
  equals(store2.readStatus(r2.storeKey), SC.Record.ERROR, "Find Destroyed Record")

  store.clearLocalCache();
});

test("Multiple Records Local Cache", function() {
  var s1 = iRich.CachedStore.create().from(iRichApp.RichAppDataSource.create());
  var fixtures = iRichApp.FIXTURES;

  s1.loadPersistenceConfig();
  var r = s1.find(iRichApp.Task, "task-1");
  equals(r.get('description'), iRichApp.Task.CONSTS.OLD.description, "Task1 Loaded.");
  var r = s1.find(iRichApp.Task, "task-2");
  equals(r.get('description'), iRichApp.Task.CONSTS.T4.description, "Task2 Loaded.");
  var r = s1.find(iRichApp.User, "user-1");
  equals(r.get('description'), iRichApp.User.CONSTS.OLD.description, "User1 Loaded.");
  var r = s1.find(iRichApp.User, "user-2");
  equals(r.get('description'), iRichApp.User.CONSTS.T4.description, "User2 Loaded.");
 
  fixtures["task-1"] = SC.clone(iRichApp.Task.CONSTS.ND);
  fixtures["task-2"] = SC.clone(iRichApp.Task.CONSTS.T42);
  fixtures["user-1"] = SC.clone(iRichApp.User.CONSTS.ND);
  fixtures["user-2"] = SC.clone(iRichApp.User.CONSTS.T42);

  var t1 = s1.find(iRichApp.Task, "task-1");
  var t2 = s1.find(iRichApp.Task, "task-2");
  var u1 = s1.find(iRichApp.User, "user-1");
  var u2 = s1.find(iRichApp.User, "user-2");
  s1.flush();
  equals(t1.get('description'), iRichApp.Task.CONSTS.OLD.description, "T1 Cached!");
  equals(t2.get('description'), iRichApp.Task.CONSTS.T4.description, "T2 Cached!");
  equals(u1.get('description'), iRichApp.User.CONSTS.OLD.description, "U1 Cached!");
  equals(u2.get('description'), iRichApp.User.CONSTS.T4.description, "U2 Cached!");

  iRichApp.sleep(iRichApp.Task.persistenceStratgy.maxAge)
  var s2 = iRich.CachedStore.create().from(iRichApp.RichAppDataSource.create());
  s2.loadPersistenceConfig();

  var t1 = s2.find(iRichApp.Task, "task-1");
  var t2 = s2.find(iRichApp.Task, "task-2");
  var u1 = s2.find(iRichApp.User, "user-1");
  var u2 = s2.find(iRichApp.User, "user-2");
  s2.flush();
  equals(t1.get('description'), iRichApp.Task.CONSTS.ND.description, "T1 Refreshed!");
  equals(t2.get('description'), iRichApp.Task.CONSTS.T42.description, "T2 Refreshed!");
  equals(u1.get('description'), iRichApp.User.CONSTS.OLD.description, "U1 Cached!");
  equals(u2.get('description'), iRichApp.User.CONSTS.T4.description, "U2 Cached!");

  fixtures["task-1"] = SC.clone(iRichApp.Task.CONSTS.ND2);
  fixtures["task-2"] = SC.clone(iRichApp.Task.CONSTS.T5);

  iRichApp.sleep(iRichApp.User.persistenceStratgy.maxAge - iRichApp.Task.persistenceStratgy.maxAge)
  var s3 = iRich.CachedStore.create().from(iRichApp.RichAppDataSource.create());
  s3.loadPersistenceConfig();
  var t1 = s3.find(iRichApp.Task, "task-1");
  var t2 = s3.find(iRichApp.Task, "task-2");
  var u1 = s3.find(iRichApp.User, "user-1");
  var u2 = s3.find(iRichApp.User, "user-2");
  s3.flush();
  equals(t1.get('description'), iRichApp.Task.CONSTS.ND.description, "T1 Cached again!");
  equals(t2.get('description'), iRichApp.Task.CONSTS.T42.description, "T2 Cached again!");
  equals(u1.get('description'), iRichApp.User.CONSTS.ND.description, "U1 Refreshed!");
  equals(u2.get('description'), iRichApp.User.CONSTS.T42.description, "U2 Refreshed!");

  s1.clearLocalCache();

  fixtures["user-1"] = SC.clone(iRichApp.User.CONSTS.ND2);
  fixtures["user-2"] = SC.clone(iRichApp.User.CONSTS.T5);

  var s4 = iRich.CachedStore.create().from(iRichApp.RichAppDataSource.create());
  s4.loadPersistenceConfig();
  var u1 = s4.find(iRichApp.User, "user-1");
  var u2 = s4.find(iRichApp.User, "user-2");
  s3.flush();
  equals(u1.get('description'), iRichApp.User.CONSTS.ND2.description, "U1 Refreshed!");
  equals(u2.get('description'), iRichApp.User.CONSTS.T5.description, "U2 Refreshed!");

  s1.clearLocalCache();
});
