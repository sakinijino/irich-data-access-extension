SC.Record.mixin({
  EXPIRED_ENTRY_TIME: new Date(-1, 0, 0),

  cacheStratgy: {
    maxAge: 0,
    useCache: false
  },

  setMaxAge: function(maxAge){
    if (maxAge > 0) {
      this.cacheStratgy.maxAge = maxAge;
      this.cacheStratgy.useCache = true;
    } else {
      this.cacheStratgy.maxAge = 0;
      this.cacheStratgy.useCache = false;
    }
  }
});
