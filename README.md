iRich Data Access Extension 
============

Summary
-------
The iRich is a [Sproutcore](https://github.com/sproutcore/sproutcore)'s data source extension.  The sproutcore is a javaScript MVC framework. The iRich extends its data source by:

* Providing client-side fine-grained cache strategy support, so that the developers can determine whether an object should be cached or not and its expired time.
* Providing automatic local storage support, that the developers can claim that a class should be stored at client-side in the configuration file, and then the framework will save all objects into HTML5 local storage automatically. 
* Providing a experimental portable storage support, with firefox plugin, the objects can be saved in the disk and be shared between browsers through maybe USB disk but not network.

How to use
----------
* Import iRich source code into your project
* See the templates/Buildfile.template, add necessary dependences into your Buildfile
* Add persistence_config.js in your app folder, a template also in templates folder.
* Define the classes' storage locations and cache strategies in the configuration file.
*  In the core.js, use iRich's DataSource to replate Sproutcore's default DataSource.
* If you use portable storage, add firefox plugin or phonegap extension into your browser. (The feature is highly experimental)
* Enjoy the magic.

Examples
--------
Demos folder includes two apps. Both are modified from Sproutcore official tutorial [Todo List](http://wiki.sproutcore.com/w/page/12413071/Todos%C2%A0Intro).
You can check the persistence_config.js and core.js in demos/{app}/apps/todos to see how the iRich works.

More Information
----------------
Unit tests in frameworks/irich/tests. You can find more sample code there.
