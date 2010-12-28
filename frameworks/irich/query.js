SC.Query.mixin({
  EXPIRED_ENTRY_TIME: new Date(-1, 0, 0),

  __create : SC.Query.create,
  create: function(){
    var ret = SC.Query.__create.apply(this, arguments);
    ret.cacheStratgy = {};
    SC.mixin(ret.cacheStratgy, SC.Query.prototype.cacheStratgy)
    return ret;   
  },

  _registry_with_name: {},
  register: function(query, name){
    if (this._registry_with_name[name]!=null &&
      this._registry_with_name[name] !== query)
      throw new Error("Query name %@ is conflicted".fmt(name));
    this._registry_with_name[name] = query;
  },
  unregister: function(name){
    delete this._registry_with_name[name]
  },
  getWithName: function(name){
    return this._registry_with_name[name]
  }
});

SC.Query.prototype.mixin({
  cacheStratgy: {
    maxAge: 0,
    useCache: false
  },

  setCacheStratgy: function(stratgy){
    var maxAge = stratgy.maxAge;
    if (maxAge!=null && maxAge > 0) {
      this.cacheStratgy.maxAge = maxAge;
      this.cacheStratgy.useCache = true;
    } else {
      this.cacheStratgy.maxAge = 0;
      this.cacheStratgy.useCache = false;
    }
  }
});
