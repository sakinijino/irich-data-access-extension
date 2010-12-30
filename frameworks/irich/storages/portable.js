iRich.PortableStorageAdapter = SCUDS.LocalStorageAdapter.extend({ 
  localStorageKey: 'irich.portable',

  save: function(obj, key) {
    if (SC.empty(key) || !obj) return NO;
    window.iRich.portableStorage.setItem(key, obj);
    return YES
  },

  get: function(key) {
    return window.iRich.portableStorage.getItem(key)
  },

  getAll: function() {
    return window.iRich.portableStorage.getItems()
  },

  remove: function(key) {
    if (SC.empty(key)) return NO;
    window.iRich.portableStorage.removeItem(key)
    return YES
  },

  nuke: function() {
    window.iRich.portableStorage.removeItems();
    return YES
  }
});
