// ==========================================================================
// Project:   Todos.Task
// Copyright: ©2010 My Company, Inc.
// ==========================================================================
/*globals Todos */

/** @class

  (Document your Model here)

  @extends SC.Record
  @version 0.1
*/
Todos.Task = SC.Record.extend(
/** @scope Todos.Task.prototype */ {

  // TODO: Add your own code here.

  isDone: SC.Record.attr(Boolean),
  description: SC.Record.attr(String)

}) ;

Todos.Task._object_className = "Todos.Task";
