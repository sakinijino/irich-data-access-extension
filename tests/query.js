sc_require('../irich_require')

iRichApp = SC.Application.create({
  NAMESPACE: 'Irich',
  VERSION: 'CachedStore Test',
  store: SC.Store.create().from(SC.Record.fixtures)
});

module("iRich.Query", {
  setup: function() {
    q2 = SC.Record.extend({isDone: SC.Record.attr(Boolean), description: SC.Record.attr(String)});
  },
  teardown: function() {
    delete q2;
  }
});

test("Query Name", function() {
  var q = SC.Query.build(SC.Query.REMOTE, q2);
  equals(q.getName(), SC.guidFor(q), "Default GUID")
  q.setName("All Task")
  equals(q.getName(), "All Task", "Set Name")
});

test("Set Unchanged Name", function() {
  var q = SC.Query.build(SC.Query.REMOTE, q2);
  equals(q.getName(), SC.guidFor(q), "Default GUID")
  q.setName("All Task")
  equals(q.getName(), "All Task", "Set Name")
  q.setName("Changed")
  equals(q.getName(), "All Task", "Unchanged Name")
});

test("Query init", function(){
  var q1 = SC.Query.build(SC.Query.REMOTE, q2);
  var q2 = SC.Query.build(SC.Query.LOCAL, q2);

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
