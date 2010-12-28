iRichApp = SC.Application.create({
  NAMESPACE: 'Irich',
  VERSION: 'CachedStore Test',
  store: SC.Store.create().from(SC.Record.fixtures)
});

test("Record Stragy Extend", function(){
  iRichApp.User = SC.Record.extend({
    email: SC.Record.attr(String),
    description: SC.Record.attr(String)
  });
  
  equals(SC.Record.persistenceStratgy.location, SC.Record.REMOTE, "SC Record location remote")
  ok(!SC.Record.persistenceStratgy.useCache, "SC Record does not use Cache")
  equals(SC.Record.persistenceStratgy.maxAge, 0, "SC Record maxAge 0")
  ok(!SC.Record.persistenceStratgy.localCache, "SC Record does not cache local")

  equals(iRichApp.User.persistenceStratgy.location, SC.Record.REMOTE, "iRichApp User location remote")
  ok(!iRichApp.User.persistenceStratgy.useCache, "iRichApp User does not use Cache")
  equals(iRichApp.User.persistenceStratgy.maxAge, 0, "iRichApp User maxAge 0")
  ok(!iRichApp.User.persistenceStratgy.localCache, "iRichApp User does not cache local")
  
  iRichApp.User.setPersistenceStratgy({location:SC.Record.REMOTE, maxAge:100, localCache:true});

  equals(SC.Record.persistenceStratgy.location, SC.Record.REMOTE, "SC Record location remote")
  ok(!SC.Record.persistenceStratgy.useCache, "SC Record still does not use Cache")
  equals(SC.Record.persistenceStratgy.maxAge, 0, "SC Record maxAge 0")
  ok(!SC.Record.persistenceStratgy.localCache, "SC Record does not cache local")

  equals(iRichApp.User.persistenceStratgy.location, SC.Record.REMOTE, "iRichApp User location remote")
  ok(iRichApp.User.persistenceStratgy.useCache, "iRichApp User uses Cache")
  equals(iRichApp.User.persistenceStratgy.maxAge, 100, "iRichApp User maxAge 100")
  ok(iRichApp.User.persistenceStratgy.localCache, "iRichApp User cache local")
})

test("Set Record Cache Stragy", function() {
  iRichApp.User = SC.Record.extend({email: SC.Record.attr(String), description: SC.Record.attr(String)});
  iRichApp.Task = SC.Record.extend({isDone: SC.Record.attr(Boolean), description: SC.Record.attr(String)});

  ok(!iRichApp.User.persistenceStratgy.useCache, "iRichApp User does not use Cache")
  equals(iRichApp.User.persistenceStratgy.maxAge, 0, "iRichApp User maxAge 0")
  ok(!iRichApp.User.persistenceStratgy.localCache, "iRichApp User does not cache local")

  ok(!iRichApp.Task.persistenceStratgy.useCache, "iRichApp Task does not use Cache")
  equals(iRichApp.Task.persistenceStratgy.maxAge, 0, "iRichApp Task maxAge 0")
  ok(!iRichApp.Task.persistenceStratgy.localCache, "iRichApp Task does not cache local")
  
  iRichApp.User.setPersistenceStratgy({maxAge:100, localCache:true});

  ok(iRichApp.User.persistenceStratgy.useCache, "iRichApp User use Cache")
  equals(iRichApp.User.persistenceStratgy.maxAge, 100, "iRichApp User maxAge 100")
  ok(iRichApp.User.persistenceStratgy.localCache, "iRichApp User cache local")

  iRichApp.Task.setPersistenceStratgy({});
  ok(!iRichApp.Task.persistenceStratgy.useCache, "iRichApp Task still does not use Cache")
  equals(iRichApp.Task.persistenceStratgy.maxAge, 0, "iRichApp Task maxAge still 0")
  ok(!iRichApp.Task.persistenceStratgy.localCache, "iRichApp Task does not cache local")


  iRichApp.Task.setPersistenceStratgy({localCache:true});
  ok(iRichApp.Task.persistenceStratgy.useCache, "iRichApp Task uses Cache")
  equals(iRichApp.Task.persistenceStratgy.maxAge, 0, "iRichApp Task maxAge still 0")
  ok(iRichApp.Task.persistenceStratgy.localCache, "iRichApp Task cache local")

  iRichApp.Task.setPersistenceStratgy({maxAge:100});
  ok(iRichApp.Task.persistenceStratgy.useCache, "iRichApp Task uses Cache")
  equals(iRichApp.Task.persistenceStratgy.maxAge, 100, "iRichApp Task maxAge 100")
  ok(!iRichApp.Task.persistenceStratgy.localCache, "iRichApp Task does not cache local")
});

test("Set Record Persistence Stragy", function() {
  iRichApp.Task = SC.Record.extend({isDone: SC.Record.attr(Boolean), description: SC.Record.attr(String)});

  equals(iRichApp.Task.persistenceStratgy.location, SC.Record.REMOTE, "iRichApp Task location remote")
  ok(!iRichApp.Task.persistenceStratgy.useCache, "iRichApp Task does not use Cache")
  equals(iRichApp.Task.persistenceStratgy.maxAge, 0, "iRichApp Task maxAge 0")
  ok(!iRichApp.Task.persistenceStratgy.localCache, "iRichApp Task does not cache local")
  
  iRichApp.Task.setPersistenceStratgy({location:SC.Record.REMOTE, maxAge:100, localCache:true});

  equals(iRichApp.Task.persistenceStratgy.location, SC.Record.REMOTE, "iRichApp Task location remote")
  ok(iRichApp.Task.persistenceStratgy.useCache, "iRichApp Task use Cache")
  equals(iRichApp.Task.persistenceStratgy.maxAge, 100, "iRichApp Task maxAge 100")
  ok(iRichApp.Task.persistenceStratgy.localCache, "iRichApp Task cache local")

  iRichApp.Task.setPersistenceStratgy({location:SC.Record.LOCAL, maxAge:100, localCache:true});

  equals(iRichApp.Task.persistenceStratgy.location, SC.Record.LOCAL, "iRichApp Task location local")
  ok(iRichApp.Task.persistenceStratgy.useCache, "iRichApp Task still uses Cache")
  equals(iRichApp.Task.persistenceStratgy.maxAge, 100, "iRichApp Task maxAge 100")
  ok(!iRichApp.Task.persistenceStratgy.localCache, "iRichApp Task should not cache local")
});
