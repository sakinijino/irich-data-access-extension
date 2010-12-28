iRichApp = SC.Application.create({
  NAMESPACE: 'Irich',
  VERSION: 'CachedStore Test',
  store: SC.Store.create().from(SC.Record.fixtures)
});

module("iRich.Query", {
  setup: function() {
    iRichApp.Task = SC.Record.extend({isDone: SC.Record.attr(Boolean), description: SC.Record.attr(String)});
    iRichApp.User = SC.Record.extend({isDone: SC.Record.attr(Boolean), description: SC.Record.attr(String)});
  },
  teardown: function() {
    delete iRichApp.Task;
    delete iRichApp.User;
  }
});

test("Query Registy", function(){
  var store = iRich.CachedStore.create()
  
  var qt = SC.Query.build(SC.Query.REMOTE, iRichApp.Task);
  SC.Query.register(qt, "All Task")
  SC.Query.register(qt, "All Task") // Register Same Query
  ok(qt===SC.Query.getWithName("All Task"), "get with name");

  var qu = SC.Query.build(SC.Query.REMOTE, iRichApp.User);
  SC.Query.register(qu, "All User")
  ok(qu===SC.Query.getWithName("All User"), "get with name");
})

test("Query Registy Conflict", function(){
  var store = iRich.CachedStore.create()

  var throwed = false;
  try {
    var qt = SC.Query.build(SC.Query.REMOTE, iRichApp.Task);
    SC.Query.register(qt, "All Task")

    var qu = SC.Query.build(SC.Query.REMOTE, iRichApp.User);
    SC.Query.register(qu, "All Task")
  }
  catch(e) {
    throwed = true;
  }
  ok(throwed, "conflicted query name error throwed");

  SC.Query.unregister("All Task")
  SC.Query.register(qu, "All Task")
  ok(qu===SC.Query.getWithName("All Task"), "get with name");
})

test("Query init", function(){
  var q1 = SC.Query.build(SC.Query.REMOTE, iRichApp.Task);
  var q2 = SC.Query.build(SC.Query.LOCAL, iRichApp.Task);

  ok(!q1.cacheStratgy.useCache, "q1 does not use Cache")
  ok(!q2.cacheStratgy.useCache, "q2 does not use Cache")
  equals(q1.cacheStratgy.maxAge, 0, "q1 maxAge 0")
  equals(q2.cacheStratgy.maxAge, 0, "q2 maxAge 0")

  q1.setMaxAge(100);

  ok(q1.cacheStratgy.useCache, "q1 use Cache")
  ok(!q2.cacheStratgy.useCache, "q2 still does not use Cache")
  equals(q1.cacheStratgy.maxAge, 100, "q1 maxAge 100")
  equals(q2.cacheStratgy.maxAge, 0, "q2 maxAge still 0")
})
