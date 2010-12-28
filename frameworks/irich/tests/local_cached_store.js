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
        for (var n in iRichApp.Task.FIXTURES)
          hashes.push(iRichApp.Task.FIXTURES[n])
        hashes = hashes.sort(function(i,j){return i.guid>j.guid});
        store.loadRecords(iRichApp.Task, hashes);

        var storeKeys = []
        for (var n in iRichApp.Task.FIXTURES)
          storeKeys.push(iRichApp.Task.storeKeyFor(iRichApp.Task.FIXTURES[n].guid))
        store.loadQueryResults(query, storeKeys);
        return YES;
      },
      retrieveRecord: function(store, storeKey) {
        var id = store.idFor(storeKey);
        var recordTypeStr = SC._object_className(SC.Store.recordTypeFor(storeKey))

        if (recordTypeStr == iRichApp.Task._object_className)
          store.dataSourceDidComplete(storeKey, iRichApp.FIXTURES[id]);
        else if (recordTypeStr == iRichApp.User._object_className)
          store.dataSourceDidComplete(storeKey, iRichApp.FIXTURES[id]);
        return YES;
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

  store_with_ds.loadCacheConfig();
  var r = store_with_ds.find(iRichApp.Task, "task-1");
  equals(r.get('description'), iRichApp.Task.CONSTS.OLD.description, "Item Loaded.");
  
  fixtures["task-1"] = SC.clone(iRichApp.Task.CONSTS.ND);
  var r = store_with_ds.find(iRichApp.Task, "task-1");
  store_with_ds.flush();
  equals(r.get('description'), iRichApp.Task.CONSTS.OLD.description, "Cached!");

  var store_with_ds2 = iRich.CachedStore.create().from(iRichApp.RichAppDataSource.create());
  store_with_ds2.loadCacheConfig();
  var r = store_with_ds2.find(iRichApp.Task, "task-1");
  store_with_ds2.flush();
  equals(r.get('description'), iRichApp.Task.CONSTS.OLD.description, "Local Shared Cached!");

  iRichApp.sleep(iRichApp.Task.persistenceStratgy.maxAge);
  var r = store_with_ds2.find(iRichApp.Task, "task-1");
  store_with_ds2.flush();
  equals(r.get('description'), iRichApp.Task.CONSTS.ND.description, "Refreshed!");

  store_with_ds.clearLocalCache();

  var store_with_ds3 = iRich.CachedStore.create().from(iRichApp.RichAppDataSource.create());
  store_with_ds3.loadCacheConfig();
  
  fixtures["task-1"] = SC.clone(iRichApp.Task.CONSTS.ND2);
  var r = store_with_ds3.find(iRichApp.Task, "task-1");
  store_with_ds3.flush();
  equals(r.get('description'), iRichApp.Task.CONSTS.ND2.description, "Cleared!");

  store_with_ds.clearLocalCache();
});

test("Multiple Records Local Cache", function() {
  var s1 = iRich.CachedStore.create().from(iRichApp.RichAppDataSource.create());
  var fixtures = iRichApp.FIXTURES;

  s1.loadCacheConfig();
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
  s2.loadCacheConfig();

  SC.Logger.info(s2.recordCaches)
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
  s3.loadCacheConfig();
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
  s4.loadCacheConfig();
  var u1 = s4.find(iRichApp.User, "user-1");
  var u2 = s4.find(iRichApp.User, "user-2");
  s3.flush();
  equals(u1.get('description'), iRichApp.User.CONSTS.ND2.description, "U1 Refreshed!");
  equals(u2.get('description'), iRichApp.User.CONSTS.T5.description, "U2 Refreshed!");

  s1.clearLocalCache();
});