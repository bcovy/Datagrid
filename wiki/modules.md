# Modules
The **DataGrid** library is designed to add data manipulation logic (sorting, filtering, paging, etc.) functionality in a modular fashion.  As such, this allows you to tailor the application for your exact needs, as well as introduce customization.  By creating a custom module from a pre-define template, you can subscribe to internal events and registering functions on the grid and its components, allowing you to extend **DataGrid** to your needs.  

When using the `datagrid.js` distribution, the default behavior will use the setting supplied in the constructor to register the associated modules.  Custom modules can be added using the `addModules` function. 

## Basic structure
To implement a custom module, you will need to create a class with two required functions: `constructor()` and the `initialize()`.  In addition, a `moduleName` property with a name identifier is also required.

```js
class CustomModule {
    constructor(context) {
        this.context = context;
        //REQUIRED.  Perform setup tasks
    }

    initialize() {
        //REQUIRED.  Subscribe to internal events and/or register data handlers.
    }

    postInitialize = () => {
        //OPTIONAL.  Function that is called after the initialization of all modules.  
        //Requires a subscription to the `postInitMod` event in the `initialize()` method.
        //Example: this.context.events.subscribe("postInitMod", this.postInitialize);
    }
    /**
     * //OPTIONAL.  Use this method to apply custom formatting logic to a column's cell, or it's parent row.  Will be passed the following arguments:
     * @param {Object} rowData Row data for the current row.
     * @param {Column} column `Column` class model with column settings.
     * @param {HTMLTableRowElement} row Table row `tr` element currently being built.  This allows you to format the current row being processed.
     * @returns {string | HTMLElement} should return a string or HTML element.
     */
    apply(rowData, column, row) {
        //OPTIONAL.  Apply custom formatting logic.  Should return a string or element.
    }
}
//REQUIRED.  Used to identify module.
CustomModule.moduleName = "custom";
```
### constructor
Required.  The `constructor` is called as the module is being instantiated and takes one argument, `context`, which is of type `GridContext`. The `GridContext` represents the core functionality, resources, and settings for the grid.  Any setup logic, element creation, and/or property setting should take place here.

### initialize
Required.  The `initialize` function is called on each module before the grid's table row elements are created for the first time.  Use this function to subscribe to grid events and/or additional handlers.

### postInitialize
Optional.   An arrow function that is executed after each module's `initialize` method has been called.  Provides a means for modules to interact with each other.  Requires a subscription to the `postInitMod` event.

### apply
Optional.  The `apply` function is used to apply custom formatting to a cell.  Function is executed in the `Cell` class.

### moduleName
`moduleName` property must be declared on the class, and be a camelCase name for the module.  This is used internally to act as a unique identifier for the module.

## Register the module
Custom modules can be registered in the `DataGrids` class using the `addModules` function.  The order of when modules are added has no effect on the overall behavior of the grid.

```js
class DataGrids {
    // constructor...

    addModules(...module){
    }
}
```

## Overriding the default behavior
If you want to override the default module registration behavior of the `DataGrid` class, you'll need to create your own class that extends the `GridCore` class.  *Be aware the super function needs be called in the constructor with the container ID, settings object, and dataset (if applicable)*.  Modules will be instantiated and initialize in the order they were registered.

```js
import { GridCore } from "datagrid/src/grid/gridCore.js";
import { RowModule } from "datagrid/src/modules/row/rowModule.js";

class CustomGrid extends GridCore {
    constructor(container, settings) {
        super(container, settings, data);
        //register modules
        
        this.addModules(RowModule, CustomModule);

        if (this.context.columnMgr.hasHeaderFilters) {
            this.addModules(FilterModule);
        }
    }
}
```

## Built in modules
| Name | Parameter setting | Description |
| --------- | -------- | ----------- |
| `CsvModule` | `csvExportId: {html button id}` | Will apply event to target button that, when clicked, converts the grid's data into a downloadable CSV file. |
| `FilterModule` | `filterType: {filter condition}` | Adds input elements to grid's header row to allow user to filter grid's client side data source.  If using remote processing, set property `remoteProcessing: true`, which will filter grid's data server-side, via Ajax call. |
| `PagerModule` | `enablePaging: true` |  Will display data as a series of pages rather than a scrolling list.  Will override the default `rowModule` module to create grid's rows.  |
| `RefreshModule` | `refreshableId: {html button id}` | Will apply event to target button that, when clicked, will re-load the grid's data from its target source (local or remote). |
| `RowCountModule` | `rowCountId: {html label id}` | Updates target label with a count of rows in grid. |
| `RowModule` | Default module if paging is not active. | Creates grid rows.  This should be the default module to create row data if paging is not enabled. |
| `SortModule` | Default module. | Sorts grid's rows using client side data source.  If using remote processing, set property `remoteProcessing: true`, which will sort grid's data server-side, via Ajax call. |