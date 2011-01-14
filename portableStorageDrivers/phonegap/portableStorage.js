var iRichPortableStorage = function(w){
  this.mainWindows = w;
}

iRichPortableStorage._deepCopy = function (object) {
  var ret = object, idx ;
  if (typeof object == "object") {
    if (object instanceof Array) {
      ret = object.slice() ;
      idx = ret.length;
      while (idx--) ret[idx] = iRichPortableStorage._deepCopy(ret[idx]);
    }
    else {
      ret = {};
      for (var key in object)
        ret[key] = iRichPortableStorage._deepCopy(object[key]);
    }
  }
  return ret;
}
  
iRichPortableStorage.prototype = {
  _currentPath: null,
  _content: {},
  _flag: false,
  _syncInstance: null,

  _sync: function(){
    if (this._currentPath == null || !this._flag) return true;
    try {
      var _this = this;
      var data = JSON.stringify(this._content)
      navigator.fileMgr.writeAsText(
        navigator.fileMgr.getRootPaths()[0]+this._currentPath, 
    	data,
    	false,
    	function(){
    	  _this._flag = false
    	},
    	function(e){
    	  throw "PortableStorage Sync Failed"
    	});
      return true
    }
    catch (e) {
      throw "PortableStorage Sync Failed"
    }
  },

  syncInterval: 60*1000, // 1 minute

  open: function(path) {
    try {
      var reader = new FileReader();
      var _this = this;
      reader.onload = function(evt) {
      	var data = evt.target.result;
      	if (data == "") data = "{}"
          _this._content = JSON.parse(data)
        _this._currentPath = path

        _this._syncInstance = setInterval(function(){
          _this._sync()
        }, _this.syncInterval)
        	
      	var evt = document.createEvent("Events");
        evt.initEvent("iRichPortableStorageOpened", true, true);
        window.dispatchEvent(evt);
      };
      reader.onerror= function(evt) {
     	var evt = document.createEvent("Events");
        evt.initEvent("iRichPortableStorageOpenError", true, true);
        window.dispatchEvent(evt);
      };
      reader.readAsText(navigator.fileMgr.getRootPaths()[0]+path, "UTF-8");
    }
    catch (e) {
      var evt = document.createEvent("Events");
      evt.initEvent("iRichPortableStorageOpenError", true, true);
      window.dispatchEvent(evt);

      return false
    }
    return true
  },
  close: function(){
    this._sync()
    this._currentPath = null
    this._content = {}
    this._flag = false
    this._syncInstance = false
    clearInterval(this._syncInstance)
  },

  getItem: function(key){
    return iRichPortableStorage._deepCopy(this._content[key]);
  },
  getItems: function(){
    var ret = []
    for (var n in this._content) {
      ret.push(iRichPortableStorage._deepCopy(this._content[n]))
    }
    return ret
  },
  setItem: function(key, value){
    this._flag = true;
    this._content[key] = iRichPortableStorage._deepCopy(value)
  },
  removeItem: function(key){
    this._flag = true;
    delete this._content[key]
  },
  removeItems: function(){
    this._flag = true;
    this._content = {}
  }
}

iRichPortableStorage.onLoad = function() {
  try {
    if (typeof navigator.fileMgr == "undefined") navigator.fileMgr = new FileMgr();
    
    window.iRich = window.iRich || {}
    iRich.portableStorage = new iRichPortableStorage(window)
    window.addEventListener("unload", function(){iRich.portableStorage.close()}, false)

    var evt = document.createEvent("Events");
    evt.initEvent("iRichPortableStorageReady", true, true);
    window.dispatchEvent(evt);
  } catch (err) {}
};

window.addEventListener("load", iRichPortableStorage.onLoad, false);