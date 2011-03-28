// ==========================================================================
// sakinijino.com 
// ==========================================================================
//

sc_require("core")

iRich.LocalDataSource = SC.DataSource.extend({
  LOCAL_STORAGE_KEY: "irich.local",
  _local_version: "",
  _local_storage_record_types: [],
  _storage_adapter_class: null,
  _support_type: SC.Record.LOCAL,
  _sync_model: false,

  _lscKey: function(recordTypeStr){
    var prefix = this.LOCAL_STORAGE_KEY+"."+recordTypeStr
    if (SC.empty(this._local_version)) return prefix;
    return prefix+".v."+this._local_version;
  },

  _recordTypeLocalStorageAdapter: function(recordTypeStr){
    var key = this._lscKey(recordTypeStr)
    SCUDS.LocalStorageAdapterFactory._adapterClass = this._storage_adapter_class
    var adp =  SCUDS.LocalStorageAdapterFactory.getAdapter(key);
    SCUDS.LocalStorageAdapterFactory._adapterClass = null
    return adp;
  },

  loadPersistenceConfig: function(conf) {
    conf = conf ? conf : PERSISTENCE_CONFIG
    if (conf.Version) this._local_version = conf.Version
    if (conf.Record)
      for (var rname in conf.Record) {
        var r = SC.objectForPropertyPath(rname)
        if (r &&conf.Record[rname].location == this._support_type) 
          this._local_storage_record_types.push(r)
      }
  },

  clearlocalStorage: function(){
    for (var i=0; i<this._local_storage_record_types.length; ++i) {
      var r = this._local_storage_record_types[i]
      var adp = this._recordTypeLocalStorageAdapter(SC._object_className(r));
      adp.nuke();
    }
  },

  // Copy and modify from SCUDS.LocalDataSource.fetch
  fetch: function(store, query) {
    var recordType = query.get('recordType')
    if (SC.typeOf(recordType) !== SC.T_CLASS ||
      recordType.persistenceStratgy.location != this._support_type) return NO;
    
    var recordTypeStr = SC._object_className(recordType)

    if (this._sync_model) {
      this._fetch.apply(this, [store, query, recordType, recordTypeStr])
    } else {
      var _this = this;
      this.invokeLater(function(){
        _this._fetch.apply(_this, [store, query, recordType, recordTypeStr])
      }, 250);
    }
    
    return YES;
  },

  _fetch: function(store, query, recordType, recordTypeStr) {
    var adp = this._recordTypeLocalStorageAdapter(recordTypeStr)
    var tmp = adp.getAll();
    var records = []
    var storeKeys = []
    for (var i=0; i< tmp.length; ++i) {
      if (SC.typeOf(tmp[i]) === SC.T_HASH) {
        records.push(tmp[i])
        storeKeys.push(recordType.storeKeyFor(tmp[i][recordType.prototype.primaryKey]))
      }
    }

    if (query.get("location")==SC.Query.LOCAL) {
      store.loadRecords(recordType, records);
      store.dataSourceDidFetchQuery(query);
    }
    else {
      store.loadRecords(recordType, records);
      store.loadQueryResults(query, storeKeys);
    }
  },

  _isLocalStorageRequest: function(store, storeKey){
    return (store.recordTypeFor(storeKey).persistenceStratgy.location == this._support_type)
  },

  _localStorageRequestDispatcher: function(store, storeKey, action){
    var recordType = store.recordTypeFor(storeKey)
    var recordTypeStr = SC._object_className(recordType)
    var id = store.idFor(storeKey)
    var args = [store, storeKey, recordType, recordTypeStr, id]

    if (this._sync_model) {
      action.apply(this, args)
    } else {
      var _this = this;
      this.invokeLater(function(){
        action.apply(_this, args)
      }, 250);
    }

  },

  retrieveRecord: function(store, storeKey) {
    if (!this._isLocalStorageRequest(store, storeKey)) return NO
    this._localStorageRequestDispatcher(store, storeKey, this._retrieveRecord)    
    return YES
  },

  _retrieveRecord: function(store, storeKey, recordType, recordTypeStr, id) {
    var hash = this._recordTypeLocalStorageAdapter(recordTypeStr).get(id)
    if (hash) store.dataSourceDidComplete(storeKey, hash)
    else store.dataSourceDidError(storeKey)
  },

  createRecord: function(store, storeKey) {  
    if (!this._isLocalStorageRequest(store, storeKey)) return NO
    this._localStorageRequestDispatcher(store, storeKey, this._createRecord)    
    return YES
  },

  _guidKeyGenerator: function(storeKey, recordType, recordTypeStr) {
    // Simple auto-increment id generator
    // Should replace by robust id generator in real application
    var adp = this._recordTypeLocalStorageAdapter(recordTypeStr)
    var nextId = adp.get("nextId")
    nextId = nextId!=null ? nextId : 1;
    var id = nextId++;
    adp.save(nextId, "nextId")
    return id
  },

  _createRecord: function(store, storeKey, recordType, recordTypeStr, id) {
    var adp = this._recordTypeLocalStorageAdapter(recordTypeStr)
    var id = this._guidKeyGenerator(storeKey, recordType, recordTypeStr)

    var hash = store.readDataHash(storeKey)
    var key = {}
    key[recordType.prototype.primaryKey] = id
    SC.mixin(hash, key)

    if (adp.save(hash, id)) store.dataSourceDidComplete(storeKey, hash, id)
    else store.dataSourceDidError(storeKey)
  },

  updateRecord: function(store, storeKey) {  
    if (!this._isLocalStorageRequest(store, storeKey)) return NO
    this._localStorageRequestDispatcher(store, storeKey, this._updateRecord)    
    return YES
  },

  _updateRecord: function(store, storeKey, recordType, recordTypeStr, id) {
    var adp = this._recordTypeLocalStorageAdapter(recordTypeStr)
    var hash = store.readDataHash(storeKey)
    
    if (adp.save(hash, id)) store.dataSourceDidComplete(storeKey, hash)
    else store.dataSourceDidError(storeKey)
  },

  destroyRecord: function(store, storeKey) {  
    if (!this._isLocalStorageRequest(store, storeKey)) return NO
    this._localStorageRequestDispatcher(store, storeKey, this._destroyRecord)    
    return YES
  },

  _destroyRecord: function(store, storeKey, recordType, recordTypeStr, id) {
    var adp = this._recordTypeLocalStorageAdapter(recordTypeStr)
    adp.remove(id)
    store.dataSourceDidDestroy(storeKey)
  }
})
