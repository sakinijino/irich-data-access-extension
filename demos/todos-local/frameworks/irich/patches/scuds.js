SCUDS.DOMStorageAdapter.prototype.nuke = function() {
    window.localStorage.removeItem(this.localStorageKey);
    window.localStorage.removeItem(this._bufferKey);
    this._buffer = {} // fix nuke
};
