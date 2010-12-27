sc_require('../irich_require')

iRichApp = SC.Application.create({
  NAMESPACE: 'Irich',
  VERSION: 'CachedStore Test',
  store: SC.Store.create().from(SC.Record.fixtures)
});

test("Record Cache Stragy Extend", function() {
  iRichApp.User = SC.Record.extend({email: SC.Record.attr(String), description: SC.Record.attr(String)});
  iRichApp.Task = SC.Record.extend({isDone: SC.Record.attr(Boolean), description: SC.Record.attr(String)});

  ok(!SC.Record.cacheStratgy.useCache, "SC Record does not use Cache")
  ok(!iRichApp.User.cacheStratgy.useCache, "iRichApp User does not use Cache")
  ok(!iRichApp.Task.cacheStratgy.useCache, "iRichApp Task does not use Cache")
  equals(SC.Record.cacheStratgy.maxAge, 0, "SC Record maxAge 0")
  equals(iRichApp.User.cacheStratgy.maxAge, 0, "iRichApp User maxAge 0")
  equals(iRichApp.Task.cacheStratgy.maxAge, 0, "iRichApp Task maxAge 0")

  iRichApp.User.setMaxAge(100);

  ok(!SC.Record.cacheStratgy.useCache, "SC Record still does not use Cache")
  ok(iRichApp.User.cacheStratgy.useCache, "iRichApp User use Cache")
  ok(!iRichApp.Task.cacheStratgy.useCache, "iRichApp Task still does not use Cache")
  equals(SC.Record.cacheStratgy.maxAge, 0, "SC Record maxAge still 0")
  equals(iRichApp.User.cacheStratgy.maxAge, 100, "iRichApp User maxAge 100")
  equals(iRichApp.Task.cacheStratgy.maxAge, 0, "iRichApp Task maxAge still 0")
 
});
