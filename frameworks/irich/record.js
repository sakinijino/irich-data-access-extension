SC.Record.REMOTE = "remote"
SC.Record.LOCAL = "local"

SC.Record.mixin({
  EXPIRED_ENTRY_TIME: new Date(-1, 0, 0),

  persistenceStratgy: {
    location: SC.Record.REMOTE,
    localCache: false,
    maxAge: 0,
    useCache: false
  },

  __extend: SC.Record.extend,
  extend: function(){
    var ret = SC.Record.__extend.apply(this, arguments);

    ret.persistenceStratgy = {};
    SC.mixin(ret.persistenceStratgy, SC.Record.persistenceStratgy)

    return ret;    
  },

  setPersistenceStratgy: function(stratgy){
    var loc = stratgy.location!=null ? stratgy.location : SC.Record.REMOTE
    this.persistenceStratgy.location = loc

    var maxAge = (stratgy.maxAge!=null && stratgy.maxAge>0) ? stratgy.maxAge : 0;
    var localCache = (stratgy.localCache && loc == SC.Record.REMOTE) ? true : false;

    if ((maxAge > 0) || localCache) {
      this.persistenceStratgy.maxAge = maxAge;
      this.persistenceStratgy.useCache = true;
      this.persistenceStratgy.localCache = localCache;
    } else {
      this.persistenceStratgy.maxAge = 0;
      this.persistenceStratgy.useCache = false;
      this.persistenceStratgy.localCache = false;
    }
  }
});
