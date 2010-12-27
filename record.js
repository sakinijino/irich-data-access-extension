SC.Record.mixin({
  EXPIRED_ENTRY_TIME: new Date(-1, 0, 0),

  cacheStratgy: {
    maxAge: 0,
    useCache: false
  },

  __extend: SC.Record.extend,
  extend: function(){
    var ret = SC.Record.__extend.apply(this, arguments);
    ret.cacheStratgy = {};
    SC.mixin(ret.cacheStratgy, SC.Record.cacheStratgy)
    return ret;    
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
