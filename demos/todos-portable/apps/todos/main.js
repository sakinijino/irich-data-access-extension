// ==========================================================================
// Project:   Todos
// Copyright: ©2010 My Company, Inc.
// ==========================================================================
/*globals Todos */

sc_require('persistence_config')

// This is the function that will start your app running.  The default
// implementation will load any fixtures you have created then instantiate
// your controllers and awake the elements on your page.
//
// As you develop your application you will probably want to override this.
// See comments for some pointers on what to do next.
//
Todos.openStorage = function openStorage() {
  if (!iRich.portableStorage) throw SC.Error.create({message:"Not Support Portable Storage!"})

  var path = ""
  while (SC.empty(path)) path = prompt("Portable Storage Location:")
  iRich.portableStorage.open(path)
}

Todos.main = function main() {

  Todos.store.loadPersistenceConfig();
  Todos.store.dataSource.loadPersistenceConfig();

  // Step 1: Instantiate Your Views
  // The default code here will make the mainPane for your application visible
  // on screen.  If you app gets any level of complexity, you will probably 
  // create multiple pages and panes.  
  Todos.getPath('mainPage.mainPane').append() ;

  // Step 2. Set the content property on your primary controller.
  // This will make your app come alive!

  // TODO: Set the content property on your primary controller
  // ex: Todos.contactsController.set('content',Todos.contacts);

  Todos.tasksController.loadTasks();
} ;

function main() {
  window.addEventListener("iRichPortableStorageReady", Todos.openStorage, false)
  window.addEventListener("iRichPortableStorageOpenError", Todos.openStorage, false)
  window.addEventListener("iRichPortableStorageOpened", Todos.main, false)
}
