iRichPortableStorage.onFirefoxLoad = function(event) {
  document.getElementById("contentAreaContextMenu")
          .addEventListener("popupshowing", function (e){ iRichPortableStorage.showFirefoxContextMenu(e); }, false);
};

iRichPortableStorage.showFirefoxContextMenu = function(event) {
  // show or hide the menuitem based on what the context menu is on
  document.getElementById("context-iRichPortableStorage").hidden = gContextMenu.onImage;
};

window.addEventListener("load", iRichPortableStorage.onFirefoxLoad, false);
