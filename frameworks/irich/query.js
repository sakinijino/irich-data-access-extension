SC.Query.mixin({
  EXPIRED_ENTRY_TIME: new Date(-1, 0, 0),

  __create : SC.Query.create,
  create: function(){
    var ret = SC.Query.__create.apply(this, arguments);
    ret.cacheStratgy = {};
    SC.mixin(ret.cacheStratgy, SC.Query.prototype.cacheStratgy)
    return ret;   
  }
});

SC.Query.prototype.mixin({
  _name: null,

  getName: function(){
    return (this._name!=null) ? this._name : SC.guidFor(this);
  },

  setName: function(n){
    if (this._name==null) this._name = n;
  },
  
  cacheStratgy: {
    maxAge: 0,
    useCache: false
  },

  setMaxAge: function(maxAge){
    if (maxAge!=null && maxAge > 0) {
      this.cacheStratgy.maxAge = maxAge;
      this.cacheStratgy.useCache = true;
    } else {
      this.cacheStratgy.maxAge = 0;
      this.cacheStratgy.useCache = false;
    }
  }
});
