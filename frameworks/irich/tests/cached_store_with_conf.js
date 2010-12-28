iRichApp = SC.Application.create({
  NAMESPACE: 'Irich',
  VERSION: 'CachedStore Test',
  store: SC.Store.create().from(SC.Record.fixtures)
});

module("iRich.CachedStoreWithConf", {
  setup: function() {
    iRichApp.Task = SC.Record.extend({isDone: SC.Record.attr(Boolean), description: SC.Record.attr(String)});
    iRichApp.User = SC.Record.extend({isDone: SC.Record.attr(Boolean), description: SC.Record.attr(String)});

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
    delete iRichApp.Task.FIXTURES;
    delete iRichApp.Task.CONSTS;
    delete iRichApp.Task;
    delete iRichApp.TaskDataSource;
    delete iRichApp.sleep;
  }
});

test("Cache Config Load", function(){
  var store = iRich.CachedStore.create()

  var qt = SC.Query.build(SC.Query.REMOTE, iRichApp.Task);
  SC.Query.register(qt, "All Task")
  var qu = SC.Query.build(SC.Query.REMOTE, iRichApp.User);
  SC.Query.register(qu, "All User")

  CACHE_STRATGY_CONFIG = {
    Record: {
      "iRichApp.Task": {
        useCache: true,
        maxAge: 50
      },
      "iRichApp.User": {
      }
    },

    Query: {
      "All Task": {
        useCache: true,
        maxAge: 50
      },
      "All User": {
      }
    }
  }
  store.loadCacheConfig();
  delete CACHE_STRATGY_CONFIG;

  ok(!iRichApp.User.cacheStratgy.useCache, "iRichApp User does not use Cache")
  ok(iRichApp.Task.cacheStratgy.useCache, "iRichApp Task uses Cache")
  equals(iRichApp.User.cacheStratgy.maxAge, 0, "iRichApp User maxAge 0")
  equals(iRichApp.Task.cacheStratgy.maxAge, 50, "iRichApp Task maxAge 50")

  ok(!qu.cacheStratgy.useCache, "All User Query does not use Cache")
  ok(qt.cacheStratgy.useCache, "All Task Query uses Cache")
  equals(qu.cacheStratgy.maxAge, 0, "All User Query maxAge 0")
  equals(qt.cacheStratgy.maxAge, 50, "All Task Query maxAge 50")

  store.loadCacheConfig({
    Record: {
      "iRichApp.User": {
        maxAge: 50
      }
    }
  });

  ok(iRichApp.User.cacheStratgy.useCache, "iRichApp User uses Cache")
  equals(iRichApp.User.cacheStratgy.maxAge, 50, "iRichApp User maxAge 50")

  store.loadCacheConfig({
    Record: {
      "iRichApp.NoClass": {
        maxAge: 50
      }
    },

    Query: {
      "All NoClass": {
        useCache: true,
        maxAge: 50
      }
    }
  });

  SC.Query.unregister("All Task")
  SC.Query.unregister("All User")
  delete SC.Query._scq_recordTypeCache.remote
  delete SC.Query._scq_recordTypeCache.local
})

test("Record Cache", function() {
  var store = iRich.CachedStore.create().from(iRichApp.TaskDataSource.create());
  var fixtures = iRichApp.Task.FIXTURES;

  var r = store.find(iRichApp.Task, "task-1");
  equals(r.get('description'), iRichApp.Task.CONSTS.OLD.description, "Item Loaded.");

  fixtures["task-1"] = SC.clone(iRichApp.Task.CONSTS.ND);
  var r = store.find(iRichApp.Task, "task-1");
  store.flush();
  equals(r.get('description'), iRichApp.Task.CONSTS.ND.description, "Item Updated.");

  CACHE_STRATGY_CONFIG = {
    Record: {
      "iRichApp.Task": {
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
  store.loadCacheConfig();
  delete CACHE_STRATGY_CONFIG;

  fixtures["task-1"] = SC.clone(iRichApp.Task.CONSTS.ND2);
  var r = store.find(iRichApp.Task, "task-1");
  store.flush();
  equals(r.get('description'), iRichApp.Task.CONSTS.ND.description, "Cached!");

  iRichApp.sleep(60);
  var r = store.find(iRichApp.Task, "task-1");
  store.flush();
  equals(r.get('description'), iRichApp.Task.CONSTS.ND2.description, "Refreshed!");
});

test("Query Cache", function() {
  var store = iRich.CachedStore.create().from(iRichApp.TaskDataSource.create());
  var fixtures = iRichApp.Task.FIXTURES;
  var qc = SC.Query.build(SC.Query.REMOTE, iRichApp.Task);
  SC.Query.register(qc, "All Task")

  var t = store.find(qc);
  equals(t.objectAt(0).get('description'), iRichApp.Task.CONSTS.OLD.description, "Item Loaded.");

  fixtures["task-1"] = SC.clone(iRichApp.Task.CONSTS.ND);
  var t = store.find(qc);
  equals(t.objectAt(0).get('description'), iRichApp.Task.CONSTS.ND.description, "Item Updated.");

  store.loadCacheConfig({
    Record: {
      "iRichApp.Task": {
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
  });

  fixtures["task-1"] = SC.clone(iRichApp.Task.CONSTS.ND2);
  var t = store.find(qc);
  t.flush();
  equals(t.objectAt(0).get('description'), iRichApp.Task.CONSTS.ND.description, "Cached!");

  iRichApp.sleep(60);
  var t = store.find(qc);
  t.flush();
  equals(t.objectAt(0).get('description'), iRichApp.Task.CONSTS.ND2.description, "Refreshed!");

  SC.Query.unregister("All Task")
  delete SC.Query._scq_recordTypeCache.remote
  delete SC.Query._scq_recordTypeCache.local
});