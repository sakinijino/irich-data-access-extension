iRich.PortableStorageAdapter = SCUDS.LocalStorageAdapter.extend({
 
  localStorageKey: 'irich.portable',
  contentItemKey: 'id',

  _deserializeHash: function(key) {
    var results;
    if (SC.empty(key)) key = this.localStorageKey;
    try {
      var data = window.iRich.portableStorage.getItem(key) || '{}'
      results = SC.json.decode(data) || {};
    } catch(e) {
      SC.Logger.warn('Error during deserialization of records as hash. data: '+data);
      this.nuke();
      results = {};
    }
    return results;
  },

  _serializeHash: function(data, key) {
    if (SC.empty(key)) key = this.localStorageKey;
    return window.iRich.portableStorage.setItem(key, SC.json.encode(data));
  },

  save: function(obj, key) {
    if (obj instanceof Array) {
      return this._saveAll(obj, key);
    } else if (!obj) {
      SC.Logger.error('Error writing record to cache: Record is null or undefined.');
      return NO;
    }

    if (SC.empty(key)) key = obj[this.contentItemKey];
    
    if (key) {
      var id, data = this._deserializeHash();
      data[key] = obj
      this._serializeHash(data);
      return YES;
    } else {
      SC.Logger.error('Error writing record to cache: Invalid key.');
      return NO;
    }
  },

  _saveAll: function(objs, keys) {
    var i, key, length = objs.length || 0;

    var data = this._deserializeHash() || {};

    for (i = 0; i < length; i++) {
       key = (keys && keys.length) ? keys[i] : this.contentItemKey;
       data[objs[i][key]] = objs[i];
    }
    this._serializeHash(data);
  },

  get: function(id) {
    var data = this._deserializeHash() || {};
    var rec = data[id];
    return rec ? rec : null;
  },

  getAll: function() {
    var data =  this._deserializeHash() || {};
    var ret = []
    for (var n in data) {
      ret.push(data[n])
    }
    return ret
  },

  remove: function(id) {
    var data = this._deserializeHash() || {};
    delete data[id];
    this._serializeHash(data);
  },

  nuke: function() {
    window.iRich.portableStorage.removeItem(this.localStorageKey);
    window.iRich.portableStorage.removeItem(this._bufferKey);
  }
});
