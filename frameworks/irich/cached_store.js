// ==========================================================================
// sakinijino.com 
// ==========================================================================
sc_require("record")
sc_require("query")

var iRich = iRich || {} ; 

iRich.CachedStore = SC.Store.extend({

  // ..........................................................
  // QUERY CACHE
  // 
  
  /* { entryTime : new Date() */
  queryCaches: null,

  readQueryCacheInfo: function(query) {
    return this.queryCaches[SC.guidFor(query)] || {}
  },

  refreshQueryCacheInfo: function(query) {
    var guid = SC.guidFor(query)
    var now = new Date();
    this.queryCaches[guid] ? 
      this.queryCaches[guid].entryTime =now:
      this.queryCaches[guid] = {entryTime: now};
    return this;
  },

  isQueryExpired: function(query) {
    var entryTime = this.readQueryCacheInfo(query).entryTime || SC.Query.EXPIRED_ENTRY_TIME, now = new Date();
    return !query.cacheStratgy.useCache || entryTime.getTime() + query.cacheStratgy.maxAge < now.getTime();
  },

  _findQuery: function(query, createIfNeeded, refreshIfNew, checkCache) {
    var cache = this._scst_recordArraysByQuery, 
        key   = SC.guidFor(query),
        ret, ra ;
    if (!cache) cache = this._scst_recordArraysByQuery = {};
    ret = cache[key];
      
    if (!ret && createIfNeeded) {
      cache[key] = ret = SC.RecordArray.create({ store: this, query: query });

      ra = this.get('recordArrays');
      if (!ra) this.set('recordArrays', ra = SC.Set.create());
      ra.add(ret);

      if (refreshIfNew) this.refreshQuery(query);
    } 
    else if (checkCache && ret && this.isQueryExpired(query)) { // check cache if necessary
      ret.refresh();
    }
    
    this.flush();
    return ret ;
  },

  _scstore_dataSourceDidFetchQuery: function(query, createIfNeeded) {
    var ret = this.superclass();
    this.refreshQueryCacheInfo(query);
    return ret;
  },

  // ..........................................................
  // RECORD CACHE
  // 

  /* { entryTime : new Date() */
  recordCaches: null, 

  readRecordCacheInfo :function(storeKey) {
    return this.recordCaches[storeKey] || {}
  },

  refreshRecordCacheInfo: function(storeKey) {
    var now = new Date();
    this.recordCaches[storeKey] ? 
      this.recordCaches[storeKey].entryTime =now:
      this.recordCaches[storeKey] = {entryTime: now};
    return this;
  },

  isRecordExpired: function(recordType, id, storeKey) {
    if (storeKey === undefined) storeKey = recordType.storeKeyFor(id);

    var status = this.readStatus(storeKey), 
      entryTime = this.readRecordCacheInfo(storeKey).entryTime || SC.Record.EXPIRED_ENTRY_TIME,
      K = SC.Record,
      now = new Date();

      return (!recordType.cacheStratgy.useCache) || 
          ((status === K.READY_CLEAN) && (entryTime.getTime() + recordType.cacheStratgy.maxAge < now.getTime() )) 
  },

  _findRecord: function(recordType, id) {
    var storeKey ; 
    
    if (recordType && recordType.get && recordType.get('isRecord')) {
      storeKey = recordType.get('storeKey');
      
    } else storeKey = id ? recordType.storeKeyFor(id) : null;
    
    if (storeKey && (this.readStatus(storeKey) === SC.Record.EMPTY)) {
      storeKey = this.retrieveRecord(recordType, id);
    }
    else if (storeKey && this.isRecordExpired(recordType, id, storeKey)) {
      storeKey = this.retrieveRecord(recordType, id, storeKey, YES);// refresh record if cache runs out
    }
    
    return storeKey ? this.materializeRecord(storeKey) : null ;
  },

  dataSourceDidComplete: function(storeKey, dataHash, newId) {
    var status = this.readStatus(storeKey), K = SC.Record, statusOnly;
    
    if (!(status & K.BUSY)) {
      throw K.BAD_STATE_ERROR;
    }
    
    if(status===K.BUSY_DESTROYING) {
      throw K.BAD_STATE_ERROR ;
    } else status = K.READY_CLEAN ;

    this.writeStatus(storeKey, status) ;
    if (dataHash) this.writeDataHash(storeKey, dataHash, status) ;
    if (newId) SC.Store.replaceIdFor(storeKey, newId);
    
    statusOnly = dataHash || newId ? NO : YES;
    this.refreshRecordCacheInfo(storeKey); //refresh record entry time
    this.dataHashDidChange(storeKey, null, statusOnly);
    
    return this ;
  },

  pushRetrieve: function(recordType, id, dataHash, storeKey) {
    var K = SC.Record, status;
    
    if(storeKey===undefined) storeKey = recordType.storeKeyFor(id);
    status = this.readStatus(storeKey);
    if(status==K.EMPTY || status==K.ERROR || status==K.READY_CLEAN || status==K.DESTROYED_CLEAN) {
      
      status = K.READY_CLEAN;
      if(dataHash===undefined) this.writeStatus(storeKey, status) ;
      else this.writeDataHash(storeKey, dataHash, status) ;

      this.refreshRecordCacheInfo(storeKey); //refresh record entry time
      this.dataHashDidChange(storeKey);
      
      return storeKey;
    }
    return NO;
  },

  // ..........................................................
  // Infrastructure
  // 

  reset: function() {
    this.recordCaches = {};
    this.queryCaches = {};
    this.queryRegistry = {};
    
    this.superclass();
  },

  find: function(recordType, id) {
    if (SC.typeOf(recordType)===SC.T_STRING) {
      recordType = SC.objectForPropertyPath(recordType);
    }
    
    if ((arguments.length === 1) && !(recordType && recordType.get && recordType.get('isRecord'))) {
      if (!recordType) throw new Error("SC.Store#find() must pass recordType or query");
      if (!recordType.isQuery) {
        recordType = SC.Query.local(recordType);
      }
      return this._findQuery(recordType, YES, YES, YES);
      
    } else {
      return this._findRecord(recordType, id);
    }
  },

  loadCacheConfig: function(conf) {
    conf = conf ? conf : CACHE_STRATGY_CONFIG
    if (conf.Record) {
      for (var rname in conf.Record) {
        var r = SC.objectForPropertyPath(rname)
        if (r) r.setMaxAge(conf.Record[rname].maxAge)
      }
    }

    if (conf.Query) {
      for (var qname in conf.Query) {
        var q = SC.Query.getWithName(qname)
        if (q) q.setMaxAge(conf.Query[qname].maxAge)
      }
    }
  }
});
