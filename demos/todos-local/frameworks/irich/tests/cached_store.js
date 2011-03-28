iRichApp = SC.Application.create({
  NAMESPACE: 'Irich',
  VERSION: 'CachedStore Test',
  store: SC.Store.create().from(SC.Record.fixtures)
});

module("iRich.CachedStore", {
  setup: function() {
    iRichApp.User = SC.Record.extend({email: SC.Record.attr(String), description: SC.Record.attr(String)});
    iRichApp.Task = SC.Record.extend({isDone: SC.Record.attr(Boolean), description: SC.Record.attr(String)});

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

test("Record Cache", function() {
  var store = iRich.CachedStore.create().from(iRichApp.TaskDataSource.create());
  var fixtures = iRichApp.Task.FIXTURES;

  iRichApp.Task.setPersistenceStratgy({maxAge:0})

  var r = store.find(iRichApp.Task, "task-1");
  equals(r.get('description'), iRichApp.Task.CONSTS.OLD.description, "Item Loaded.");

  fixtures["task-1"] = SC.clone(iRichApp.Task.CONSTS.ND);
  var r = store.find(iRichApp.Task, "task-1");
  store.flush();
  equals(r.get('description'), iRichApp.Task.CONSTS.ND.description, "Item Updated.");

  iRichApp.Task.setPersistenceStratgy({maxAge:5000})
  fixtures["task-1"] = SC.clone(iRichApp.Task.CONSTS.ND2);
  var r = store.find(iRichApp.Task, "task-1");
  store.flush();
  equals(r.get('description'), iRichApp.Task.CONSTS.ND.description, "Cached!");

  iRichApp.Task.setPersistenceStratgy({maxAge:50})
  iRichApp.sleep(60);
  var r = store.find(iRichApp.Task, "task-1");
  store.flush();
  equals(r.get('description'), iRichApp.Task.CONSTS.ND2.description, "Refreshed!");

  iRichApp.Task.setPersistenceStratgy({maxAge:0})
  fixtures["task-1"] = SC.clone(iRichApp.Task.CONSTS.OLD);
});

test("Query Cache", function() {
  var store = iRich.CachedStore.create().from(iRichApp.TaskDataSource.create());
  var fixtures = iRichApp.Task.FIXTURES;
  var qc = SC.Query.build(SC.Query.REMOTE, iRichApp.Task);

  // Single Item Modification
  qc.setCacheStratgy({maxAge:0})

  var t = store.find(qc);
  equals(t.objectAt(0).get('description'), iRichApp.Task.CONSTS.OLD.description, "Item Loaded.");

  fixtures["task-1"] = SC.clone(iRichApp.Task.CONSTS.ND);
  var t = store.find(qc);
  equals(t.objectAt(0).get('description'), iRichApp.Task.CONSTS.ND.description, "Item Updated.");

  qc.setCacheStratgy({maxAge:5000})
  fixtures["task-1"] = SC.clone(iRichApp.Task.CONSTS.ND2);
  var t = store.find(qc);
  t.flush();
  equals(t.objectAt(0).get('description'), iRichApp.Task.CONSTS.ND.description, "Cached!");

  qc.setCacheStratgy({maxAge:50})
  iRichApp.sleep(60);
  var t = store.find(qc);
  t.flush();
  equals(t.objectAt(0).get('description'), iRichApp.Task.CONSTS.ND2.description, "Refreshed!");

  // Array Modification
  qc.setCacheStratgy({maxAge:0})

  var t = store.find(qc);
  equals(t.get('length'), 3, "Three items Loaded.");

  fixtures["task-4"] = SC.clone(iRichApp.Task.CONSTS.T4);
  var t = store.find(qc);
  equals(t.get('length'), 4, "New item Loaded.");

  qc.setCacheStratgy({maxAge:5000})
  fixtures["task-5"] = SC.clone(iRichApp.Task.CONSTS.T5);
  var t = store.find(qc);
  equals(t.get('length'), 4, "Cached!");

  qc.setCacheStratgy({maxAge:50})
  iRichApp.sleep(60);
  var t = store.find(qc);
  equals(t.get('length'), 5, "Refreshed!");

  qc.setCacheStratgy({maxAge:5000})
  delete fixtures["task-4"];
  var t = store.find(qc);
  equals(t.get('length'), 5, "Cached!");

  qc.setCacheStratgy({maxAge:50})
  iRichApp.sleep(60);
  var t = store.find(qc);
  equals(t.get('length'), 4, "Refreshed!");

  qc.setCacheStratgy({maxAge:0})
  fixtures["task-1"] = SC.clone(iRichApp.Task.CONSTS.OLD);
  delete fixtures["task-5"];
});

test("Query-Record Cache", function() {
  var store = iRich.CachedStore.create().from(iRichApp.TaskDataSource.create());
  var fixtures = iRichApp.Task.FIXTURES;
  var qc = SC.Query.build(SC.Query.REMOTE, iRichApp.Task);

  var r = store.find(iRichApp.Task, "task-1");
  var t = store.find(qc);
  equals(r.get('description'), iRichApp.Task.CONSTS.OLD.description, "Item Loaded.");
  equals(t.objectAt(0).get('description'), iRichApp.Task.CONSTS.OLD.description, "Item in Array Loaded.");

  qc.setCacheStratgy({maxAge:5000})
  iRichApp.Task.setPersistenceStratgy({maxAge:0})
  fixtures["task-1"] = SC.clone(iRichApp.Task.CONSTS.ND);
  var r = store.find(iRichApp.Task, "task-1");
  store.flush();
  equals(r.get('description'), iRichApp.Task.CONSTS.ND.description, "Item Updated.");
  equals(t.objectAt(0).get('description'), iRichApp.Task.CONSTS.ND.description, "Item in Array Updated.");

  qc.setCacheStratgy({maxAge:0})
  iRichApp.Task.setPersistenceStratgy({maxAge:5000})
  fixtures["task-1"] = SC.clone(iRichApp.Task.CONSTS.ND2);
  var t = store.find(qc);
  equals(r.get('description'), iRichApp.Task.CONSTS.ND2.description, "Item Updated.");
  equals(t.objectAt(0).get('description'), iRichApp.Task.CONSTS.ND2.description, "Item in Array Updated.");

  qc.setCacheStratgy({maxAge:0})
  iRichApp.Task.setPersistenceStratgy({maxAge:5000})
  fixtures["task-4"] = SC.clone(iRichApp.Task.CONSTS.T4);
  var t = store.find(qc);
  equals(t.get('length'), 4, "New item Loaded.");
  fixtures["task-4"] = SC.clone(iRichApp.Task.CONSTS.T42);
  var r = store.find(iRichApp.Task, "task-4");
  equals(r.get('description'), iRichApp.Task.CONSTS.T4.description, "Item Loaded by Array Cached.");

  iRichApp.Task.setPersistenceStratgy({maxAge:50})
  iRichApp.sleep(60);
  var r = store.find(iRichApp.Task, "task-4");
  store.flush();
  equals(r.get('description'), iRichApp.Task.CONSTS.T42.description, "Refreshed!");

  qc.setCacheStratgy({maxAge:0})
  iRichApp.Task.setPersistenceStratgy({maxAge:0})
  fixtures["task-1"] = SC.clone(iRichApp.Task.CONSTS.OLD);
  delete fixtures["task-4"];
});
