# DataGrid: An interactive JavaScript table
**DataGrid** is a JavaScript library that allows you to create an interactive HTML table element from either a JavaScript Array, or JSON data from a remote server.  

## Features
* Cell formatters for common data types: date, datetime, numeric.  In addition, you can also supply a custom function.
* Sort and filter by column.
* Customizable table and column layout using CSS or style properties.
* Ability to page data.
* Client-side data processing to eliminate repeated callbacks to a remote server, or remote server side processing via AJAX for larger data sets.
* Modular design of library allows for customization of data manipulation options and table rendering.

## Quick start

Include a reference to the JavaScript and CSS files.
```html
 <link rel="stylesheet" href="./css/datagrid.css" />

 <script src="./scripts/datagrid.js"></script>
```

Create a container on the page where the **DataGrid** output should reside.
```html
 <div id="grid_element"></div>
```

Instantiate a new `DataGrid` object, passing container ID and desired settings.  Settings can be set in the object's constructor, or passed as an object.  Call the `init()` method to render the grid.  Please note that since they grid may be making calls to an external data source, the `init()` is wrapped in the `async/await` syntax, and should be called using the `await` keyword.
```js
const grid = new DataGrid("grid_element", //container element
    {
        enablePaging: true,
        pagerPagesToDisplay: 5,
        columns: [  //column ordinal position will match object.
            { field: "id", label: "ID" type: "number" }, 
            { field: "name", type: "string" },
            { field: "location", type: "string" }
        ], 
        data: [
            { id: 18, name: "Hello", location: "Westminster" },
            { id: 11, name: "World", location: "Irvine" }
        ]
    });  

await grid.init();
```