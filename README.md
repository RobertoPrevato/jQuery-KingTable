# jQuery-KingTable
Table widget for administrative tables that are able to build themselves, on the basis of their input data.
Supports client and server side pagination; client and server side search.

## Objectives of the plugin
* Allow the implementation of administrative tables with the smallest amount of code possible.
* Being smart and propositive: even without configuration, the table must be able to built itself on the basis of its input data.
* Allow for easy configuration of generated HTML, to adapt to different needs: e.g. displaying pictures thumbnails, anchor tags, etc.
* Support both collections that require server side pagination, and collections that doesn't require server side pagination, but may still benefit from client side pagination.

[Live demo](http://ugrose.com/content/demos/kingtable/index.html)

## Modes
The jQuery-KingTable implements two working modes:
1. fixed
2. normal
### Fixed mode
A fixed table is one displaying a collection that doesn't require server pagination, but may still benefit from client side pagination.
When working on applications, it commonly happens to deal with collections that are not meant to grow over time, and they have a small size.
For example, a table of *categories* in a e-commerce website to sell clothes, or a table of *user roles* in most applications.
In these cases, it makes sense to return whole collections to the client.
There are two ways to define a fixed KingTable:
1. instantiating a KingTable with **fixed** option with value *true*, and **url** from where to fetch a collection
2. instantiating a KingTable passing a **data** option with an instance of array: in this case, it is assumed that the collection is fixed
```js
var table = new $.KingTable({
  data: [{...},{...},{...}]
});
//or...
var table = new $.KingTable({
  url: "/api/categories",
  fixed: true // the first ajax call will return a full collection of items
});
```
Fixed tables perform search and pagination on the client side, offering this feature out of the box.
### Normal mode
A normal table is one displaying a collection that requires server side pagination, since it is meant to grow over time.
This is true in most cases, for example tables of *products* and *customers* in a e-commerce website.
```js
var table = new $.KingTable({
  url: "/api/profiles"
});
```
## About usability
The jQuery-KingTable widget is designed to follow good design principles
1. the user should be able to immediately understand the size of the collection, so the pagination bar is designed to display the total amount of rows; of pages, and the number of results currently displayed
2. keyboard navigation: the KingTable controls can be navigated using the TAB; it is possible to navigate through pages using the left, right, A and D keys
3. filters are stored in the page url, so that if the user hit the refresh button, or send a url to another person, the page loads the right results
4. support for browser navigation buttons
5. the table logic handles ajax errors and displays a preloader while fetching data

### Inline editing feature
Currently the jQuery-KingTable widget doesn't offer, out of the box, inline editing feature.
This is intentional, since the good old-school design principles state that a tables should be readonly and offer a link to a editable details view.
I personally agree with this scholastic principle, especially because in most situations we deal with complex objects that cannot be easily edited inline.
In any case, the provided plugin makes it easy to configure HTML and event handlers to implement inline editing feature,
for example:
```js
//example of custom logic to implement inline-editing feature
$("#table-container").kingtable({
  url: "/api/colors",
  events: {
    "click .color-row": function (e) {
      //e.currentTarget is the clicked element
      //implement here your logic to change the readonly template into an editable template
    }
  },
  columns: {
    color: {
      template: "<div class='color-row'>...</div>"
    }
  }
});
```
### How to implement links to detail views
The KingTable offers two configuration options to generate automatically links to 

## About localization
The KingTable widget requires an utility to implement client side localization, which is used to display proper names of buttons (_refresh, page number, results per page, etc.).
Currently only the included utility function, inside the file _i.js_, is supported; but soon I will add support for a more complex i18n js implementation.

## Themes
The jQuery-KingTable offers few themes, out of the box and included in the provided **kingtable.css** file.
* ![Flat white](http://ugrose.com/content/demos/kingtable/images/theme-flatwhite.png)
* ![Flat black](http://ugrose.com/content/demos/kingtable/images/theme-flatblack.png)
* ![Clear](http://ugrose.com/content/demos/kingtable/images/theme-clear.png)
* ![Dark](http://ugrose.com/content/demos/kingtable/images/theme-dark.png)
* ![Midnight](http://ugrose.com/content/demos/kingtable/images/theme-midnight.png)
* ![Olive](http://ugrose.com/content/demos/kingtable/images/theme-olive.png)
* ![Bronze](http://ugrose.com/content/demos/kingtable/images/theme-bronze.png)
* ![Ultramarine](http://ugrose.com/content/demos/kingtable/images/theme-ultramarine.png)
## How to use
In order to use the jQuery-KingTable plugin, there are two options:
1. download the source code, and work with the R.js modules, like in the provided index.html page
2. download only the bundled source code (/dist/jquery.kingtable.js); or the minified source (/dist/jquery.kingtable.min.js)
It is also necessary to download the .css code: once again it is possible to use the .less source code; or download only the compiled .css.

### How to integrate with server side code
The KingTable logic defines an interface, in order to offer pagination and search out of the box.
When performing AJAX calls to fetch data that requires server side pagination (and therefore, server side sorting and searching),
it sends the following information:
```js
{
  fixed: [boolean],//whether the table requires server side pagination or not
  page: [number],  //page number
  size: [number],  //results per page
  orderBy: [string],
  sortOrder: [string],
  search: [string],
  timestamp: [number]//the timestamp of the first time the table was rendered: useful for fast growing collections
}
```
When receiving an AJAX response, it expects the following structure:
```js
{
  subset: [array],// array of items that respect the given filters
  total: [number] //the total count of items that respect the given filters: for example 13000
}
```
## Repository structure
* The *servers* folder contains an implementation of a development server written in Python, using the wonderful [Flask framework](http://flask.pocoo.org/)
* The *source* folder contains the client side source code, and the htmls pages returne
* The *tools* folder contains a gruntfile to build Less code into CSS; and to bundle and minify the JavaScript source code
* The *dist* folder contains the bundled source code (/dist/jquery.kingtable.js); and the minified source (/dist/jquery.kingtable.min.js)

### How to run the provided development server
In order to run the provided development server it is necessary to install Python and Flask (either Python 2.x or 3.x).
The recommended way is to install a version of Python, then its **pip** (a package management system for Python), then to use pip to install Flask.
Then, simply run the server:
```py
python server.py
```

## Code organization
* The source code is organized in modules, defined using the library [R.js](https://github.com/RobertoPrevato/R.js), of my creation.
* The core business logic of the KingTable is abstracted from DOM manipulation logic and also from jQuery.fn function.
* The DOM manipulation logic can be implemented in different ways: currently the plugin offers an implementation that uses Lodash *template* function.
### Dependencies
* [jQuery](https://jquery.com/)
* [Lodash](https://lodash.com/)
* [R.js](https://github.com/RobertoPrevato/R.js)
* [OPEN iconic](https://useiconic.com/open/)
* A function to implement client side localization: simple as the provided _i.js_, file; or a more complex [i18n implementation](http://i18next.com/)

## Development tools
The source code makes use of the following two tools, of my creation:
1. [Knight, html templates packer](https://github.com/RobertoPrevato/Knight)
2. [Base64, pictures to base64 bulk converter](https://github.com/RobertoPrevato/Base64)

## Examples
The following demos show fixed tables:
[Live demo](http://ugrose.com/content/demos/kingtable/index.html)
[Double table](http://ugrose.com/content/demos/kingtable/double.html)
The double table example shows how two tables can be displayed in the same page.