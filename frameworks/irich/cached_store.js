// ==========================================================================
// sakinijino.com 
// ==========================================================================
sc_require("patches/scuds")

sc_require("record")
sc_require("query")

var iRich = iRich || {} ; 

iRich.CachedStore = SC.Store.extend({
  // ..........................................................
  // LOCAL ADAPTER
  //
  //

  LOCAL_CACHE_KEY: "irich.cache",
  _local_version: "",
  _local_cache_record_types: [],

  _lscKey: function(recordTypeStr){
    var prefix = this.LOCAL_CACHE_KEY+"."+recordTypeStr
    if (SC.empty(this._local_version)) return prefix;
    return prefix+".v."+_local_version;
  },

  _recordTypeLocalCacheAdapter: function(recordTypeStr){
    var key = this._lscKey(recordTypeStr)
    return SCUDS.LocalStorageAdapterFactory.getAdapter(key);
  },

  loadLocalCachedRecords: function(){
    for (var i=0; i<this._local_cache_record_types.length; ++i) {
      var recordType = this._local_cache_record_types[i]
      var recordTypeStr = SC._object_className(recordType)
      var adp = this._recordTypeLocalCacheAdapter(recordTypeStr)
      this.loadRecords(recordType, this._getHashesFromLocalCache(recordTypeStr));
    }
  },

  _getHashesFromLocalCache: function(recordTypeStr) {
    return this._recordTypeLocalCacheAdapter(recordTypeStr).getAll();
  },

  _saveRecordToLocalCache: function(recordTypeStr, storeKey, entryTime) {
    var adapter = this._recordTypeLocalCacheAdapter(recordTypeStr)
    var et = {}
    et[this.LOCAL_CACHE_KEY + ".entryTime"] = entryTime.getTime();
    adapter.save(
      SC.mixin(et, this.readDataHash(storeKey)), 
      this.idFor(storeKey)
    );
  },

  clearLocalCache: function(){
    for (var i=0; i<this._local_cache_record_types.length; ++i) {
      var r = this._local_cache_record_types[i]
      var adp = this._recordTypeLocalCacheAdapter(SC._object_className(r));
      adp.nuke();
    }
  },

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

  refreshRecordCacheInfo: function(storeKey, et) {
    var entryTime = et ? et : new Date();
    this.recordCaches[storeKey] ? 
      this.recordCaches[storeKey].entryTime =entryTime:
      this.recordCaches[storeKey] = {entryTime: entryTime};

    var r =  SC.Store.recordTypeFor(storeKey);
    if (r!=null && r.persistenceStratgy.localCache) {
      this._saveRecordToLocalCache(SC._object_className(r), storeKey, entryTime)   
    }
    return this;
  },

  isRecordExpired: function(recordType, id, storeKey) {
    if (storeKey === undefined) storeKey = recordType.storeKeyFor(id);

    var status = this.readStatus(storeKey), 
      entryTime = this.readRecordCacheInfo(storeKey).entryTime || SC.Record.EXPIRED_ENTRY_TIME,
      K = SC.Record,
      now = new Date();

      return (!recordType.persistenceStratgy.useCache) || 
          ((status === K.READY_CLEAN) && (entryTime.getTime() + recordType.persistenceStratgy.maxAge < now.getTime() )) 
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

    var localCacheEntryTime = null
    if (dataHash[this.LOCAL_CACHE_KEY+".entryTime"]) {
      localCacheEntryTime = new Date(dataHash[this.LOCAL_CACHE_KEY+".entryTime"])
      delete dataHash[this.LOCAL_CACHE_KEY+".entryTime"]
    }

    this.writeStatus(storeKey, status) ;
    if (dataHash) this.writeDataHash(storeKey, dataHash, status) ;
    if (newId) SC.Store.replaceIdFor(storeKey, newId);
    
    statusOnly = dataHash || newId ? NO : YES;
    this.refreshRecordCacheInfo(storeKey, localCacheEntryTime); //refresh record entry time
    this.dataHashDidChange(storeKey, null, statusOnly);
    
    return this ;
  },

  pushRetrieve: function(recordType, id, dataHash, storeKey) {
    var K = SC.Record, status;
    
    if(storeKey===undefined) storeKey = recordType.storeKeyFor(id);
    status = this.readStatus(storeKey);
    if(status==K.EMPTY || status==K.ERROR || status==K.READY_CLEAN || status==K.DESTROYED_CLEAN) {

      var localCacheEntryTime = null
      if (dataHash[this.LOCAL_CACHE_KEY+".entryTime"]) {
        localCacheEntryTime = new Date(dataHash[this.LOCAL_CACHE_KEY+".entryTime"])
        delete dataHash[this.LOCAL_CACHE_KEY+".entryTime"]
      }

      status = K.READY_CLEAN;
      if(dataHash===undefined) this.writeStatus(storeKey, status) ;
      else this.writeDataHash(storeKey, dataHash, status) ;

      this.refreshRecordCacheInfo(storeKey, localCacheEntryTime); //refresh record entry time
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
    this._local_cache_record_types = [];
    
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
    conf = conf ? conf : PERSISTENCE_CONFIG

    if (conf.Record) {
      for (var rname in conf.Record) {
        var r = SC.objectForPropertyPath(rname)
        if (r) {
          r.setPersistenceStratgy(conf.Record[rname])
          if (conf.Record[rname].localCache) this._local_cache_record_types.push(r)
        }
      }
    }
    this.loadLocalCachedRecords();

    if (conf.Query) {
      for (var qname in conf.Query) {
        var q = SC.Query.getWithName(qname)
        if (q) q.setCacheStratgy(conf.Query[qname])
      }
    }
  }
});
