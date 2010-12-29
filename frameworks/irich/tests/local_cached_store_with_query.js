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
      maxAge: 50
    }
  },

  Query: {
    "All Task": {
      useCache: true,
      maxAge: 50
    }
  }
}

MOZILLA_PERSISTENCE_CONFIG = {
  Record: {
    "iRichApp.Task": {
      localCache: true,
      useCache: true,
      maxAge: 1000
    }
  },

  Query: {
    "All Task": {
      useCache: true,
      maxAge: 1000
    }
  }
}

if (SC.browser.isMozilla) PERSISTENCE_CONFIG = MOZILLA_PERSISTENCE_CONFIG
else PERSISTENCE_CONFIG = WEBKIT_PERSISTENCE_CONFIG

module("iRich.CachedStore", {
  setup: function() {
    iRichApp.Task = SC.Record.extend({isDone: SC.Record.attr(Boolean), description: SC.Record.attr(String)});
    iRichApp.Task._object_className = "iRichApp.Task";

    iRichApp.Task.CONSTS = {
      OLD:  { "guid": "task-1", "description": "Item OLD", "isDone": false },
      ND: { "guid": "task-1", "description": "Item ND", "isDone": false },
      ND2: { "guid": "task-1", "description": "Item ND2", "isDone": false },
      T4: { "guid": "task-4", "description": "Item T4", "isDone": false },
      T42: { "guid": "task-4", "description": "Item T42", "isDone": false },
      T5: { "guid": "task-5", "description": "Item T5", "isDone": false }
    }

    iRichApp.Task.FIXTURES = {
      "task-1": SC.clone(iRichApp.Task.CONSTS.OLD),
      "task-2": { "guid": "task-2", "description": "Build a really awesome SproutCore app", "isDone": false }, 
      "task-3": { "guid": "task-3", "description": "Next, the world!", "isDone": false }
    };

    iRichApp.TaskDataSource = SC.DataSource.extend({
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
        store.dataSourceDidComplete(storeKey, iRichApp.Task.FIXTURES[id]);
        return YES;
      }
    });

    iRichApp.sleep = function(milliSeconds){
      var startTime = new Date().getTime();
      while (new Date().getTime() < startTime + milliSeconds);
    };
  },
  teardown: function() {
    delete iRichApp.User;
    delete iRichApp.Task.FIXTURES;
    delete iRichApp.Task.CONSTS;
    delete iRichApp.Task;
    delete iRichApp.TaskDataSource;
    delete iRichApp.sleep;
  }
});

// Test Local Cache does not affect normal Query-Record Relationship
test("Normal Query-Record Local Cache", function() {
  var store = iRich.CachedStore.create().from(iRichApp.TaskDataSource.create());
  var fixtures = iRichApp.Task.FIXTURES;
  var qc = SC.Query.build(SC.Query.REMOTE, iRichApp.Task);

  var r = store.find(iRichApp.Task, "task-1");
  var t = store.find(qc);
  equals(r.get('description'), iRichApp.Task.CONSTS.OLD.description, "Item Loaded.");
  equals(t.objectAt(0).get('description'), iRichApp.Task.CONSTS.OLD.description, "Item in Array Loaded.");

  qc.setCacheStratgy({maxAge:5000})
  iRichApp.Task.setPersistenceStratgy({maxAge:0, localCache:true})
  fixtures["task-1"] = SC.clone(iRichApp.Task.CONSTS.ND);
  var r = store.find(iRichApp.Task, "task-1");
  store.flush();
  equals(r.get('description'), iRichApp.Task.CONSTS.ND.description, "Item Updated.");
  equals(t.objectAt(0).get('description'), iRichApp.Task.CONSTS.ND.description, "Item in Array Updated.");

  qc.setCacheStratgy({maxAge:0})
  iRichApp.Task.setPersistenceStratgy({maxAge:5000, localCache:true})
  fixtures["task-1"] = SC.clone(iRichApp.Task.CONSTS.ND2);
  var t = store.find(qc);
  equals(r.get('description'), iRichApp.Task.CONSTS.ND2.description, "Item Updated.");
  equals(t.objectAt(0).get('description'), iRichApp.Task.CONSTS.ND2.description, "Item in Array Updated.");

  qc.setCacheStratgy({maxAge:0})
  iRichApp.Task.setPersistenceStratgy({maxAge:5000, localCache:true})
  fixtures["task-4"] = SC.clone(iRichApp.Task.CONSTS.T4);
  var t = store.find(qc);
  equals(t.get('length'), 4, "New item Loaded.");
  fixtures["task-4"] = SC.clone(iRichApp.Task.CONSTS.T42);
  var r = store.find(iRichApp.Task, "task-4");
  equals(r.get('description'), iRichApp.Task.CONSTS.T4.description, "Item Loaded by Array Cached.");

  iRichApp.Task.setPersistenceStratgy({maxAge:50, localCache:true})
  iRichApp.sleep(60);
  var r = store.find(iRichApp.Task, "task-4");
  store.flush();
  equals(r.get('description'), iRichApp.Task.CONSTS.T42.description, "Refreshed!");

  qc.setCacheStratgy({maxAge:0})
  iRichApp.Task.setPersistenceStratgy({maxAge:0, localCache:true})
  fixtures["task-1"] = SC.clone(iRichApp.Task.CONSTS.OLD);
  delete fixtures["task-4"];

  store.clearLocalCache();
});

test("Query-Record Local Cache", function() {
  var store = iRich.CachedStore.create().from(iRichApp.TaskDataSource.create());
  var fixtures = iRichApp.Task.FIXTURES;

  var qc = SC.Query.build(SC.Query.REMOTE, iRichApp.Task);
  SC.Query.register(qc, "All Task")

  store.loadPersistenceConfig();

  fixtures["task-4"] = SC.clone(iRichApp.Task.CONSTS.T4);

  var t = store.find(qc);
  equals(t.get('length'), 4, "Query Loaded.");
  fixtures["task-4"] = SC.clone(iRichApp.Task.CONSTS.T42);
  var r = store.find(iRichApp.Task, "task-4");
  equals(r.get('description'), iRichApp.Task.CONSTS.T4.description, "Item Loaded by Array Cached.");

  var store2 = iRich.CachedStore.create().from(iRichApp.TaskDataSource.create());
  store2.loadPersistenceConfig();
  var r = store2.find(iRichApp.Task, "task-4");
  equals(r.get('description'), iRichApp.Task.CONSTS.T4.description, "Item Loaded by Array Local Shared Cached.");

  iRichApp.sleep(iRichApp.Task.persistenceStratgy.maxAge);
  var r = store.find(iRichApp.Task, "task-4");
  store.flush();
  equals(r.get('description'), iRichApp.Task.CONSTS.T42.description, "Refreshed!");

  var r = store2.find(iRichApp.Task, "task-4");
  store2.flush();
  equals(r.get('description'), iRichApp.Task.CONSTS.T42.description, "Refreshed!");

  store.clearLocalCache();
});
