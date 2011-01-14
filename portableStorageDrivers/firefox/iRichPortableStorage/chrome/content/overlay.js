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
    var converter, fostream;
    try {
      var data = JSON.stringify(this._content)

      var file = Components.classes["@mozilla.org/file/local;1"].createInstance(Components.interfaces.nsILocalFile);  
      file.initWithPath(this._currentPath);

      var foStream = Components.classes["@mozilla.org/network/file-output-stream;1"].createInstance(Components.interfaces.nsIFileOutputStream);

      foStream.init(file, 0x02 | 0x08 | 0x20, 0666, 0); 
      
      var converter = Components.classes["@mozilla.org/intl/converter-output-stream;1"].createInstance(Components.interfaces.nsIConverterOutputStream);
      converter.init(foStream, "UTF-8", 0, 0);
      converter.writeString(data);
      converter.close(); // this closes foStream

      this._flag = false

      return true
    }
    catch (e) {
      if (converter) converter.close();
      if (fostream) fostream.close();
      throw "PortableStorage Sync Failed"
    }
  },

  syncInterval: 60*1000, // 1 minute

  open: function(path) {
    var file, fstream, ostream;
    try {
      var file = Components.classes["@mozilla.org/file/local;1"].createInstance(Components.interfaces.nsILocalFile);  
      file.initWithPath(path);
      if(file.exists()) {
        var data = "";
        var fstream = Components.classes["@mozilla.org/network/file-input-stream;1"].createInstance(Components.interfaces.nsIFileInputStream);  
        var cstream = Components.classes["@mozilla.org/intl/converter-input-stream;1"].createInstance(Components.interfaces.nsIConverterInputStream);  
        fstream.init(file, -1, 0, 0);  
        cstream.init(fstream, "UTF-8", 0, 0);
        var str = {}  
        var read = 0;  
        do {   
          read = cstream.readString(0xffffffff, str);
          data += str.value;  
        } while (read != 0);
        cstream.close();

        if (data == "") data = "{}"
        this._content = JSON.parse(data)
        this._currentPath = path

        var _this = this
        this._syncInstance = setInterval(function(){
          _this._sync()
        }, this.syncInterval)

        var evt = document.createEvent("Events");
        evt.initEvent("iRichPortableStorageOpened", true, true);
        this.mainWindows.dispatchEvent(evt);

        return true
      }
      else {
        var evt = document.createEvent("Events");
        evt.initEvent("iRichPortableStorageOpenError", true, true);
        this.mainWindows.dispatchEvent(evt);

        return false
      }
    }
    catch (e) {
      if (cstream) cstream.close();

      var evt = document.createEvent("Events");
      evt.initEvent("iRichPortableStorageOpenError", true, true);
      this.mainWindows.dispatchEvent(evt);

      return false
    }
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
    for (var n in this._content)
      ret.push(iRichPortableStorage._deepCopy(this._content[n]))
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
   document.getElementById("appcontent").addEventListener(
    "DOMContentLoaded", 
    function(e){
      try {
        var win = e.target.defaultView.wrappedJSObject
        win.iRich = win.iRich || {}
        win.iRich.portableStorage = new iRichPortableStorage(win)
        win.addEventListener("unload", function(){win.iRich.portableStorage.close()}, false)

        var evt = document.createEvent("Events");
        evt.initEvent("iRichPortableStorageReady", true, true);
        win.dispatchEvent(evt);
      } catch (err) {}
    },
    false
  );
};

window.addEventListener("load", iRichPortableStorage.onLoad, false);
