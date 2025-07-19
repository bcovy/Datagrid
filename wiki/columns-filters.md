# Column filters
## Header filters
Setting the `filterType` property will allow for the filtering of data from the header section of the grid.  Available conditions are: **equals**, **like**, **between**, **>**, **>=**, **<**, **<=**, **!=**, `function()`.  By default, an `input` element will be added below the column title for the associated column.  **If grid is set to use remote processing, fitter setting will be ignored in favor of server filtering.**

### Input element
The default element type.  Will apply an `input` element in the table header to allow for user input.  Include the `filterRealTime` property with a value of `true` if you want to add real time filtering as the user types in the element.  The default filter wait time is 500ms between keystrokes.  Provide a numeric value to add your own wait time.  Real time filtering only works with local data at this time.

### Select element
If you want to change the input type to a `select` element, supply an object of key/value pairs or JSON array in the `filterValues` property.  If remote source is to be used, supply a URL string with a JSON response model type of: `{ value: "the key", text: "description" }`.  *The default filter condition of the select element is: equals.*

Examples:
```js
//Object
filterValues: { 1: "opt1", 2: "opt2" }
//Remote source
filterValues: "/hello/world/items"
//JSON object
filterValues: [{ key: 1, value: "opt1" }, { key: 2, value: "opt2" }]
```
### Multi-select element
To apply multi-select behavior to a `select` element, set the `filterMultiSelect` property to `true`.  If you want to add the control with additional settings, pass an object with the properties listed below:

| attribute | type | description |
| --------- | ---- | ----------- |
| listAll | bool | Will list all selected items in the input element.  Default will show a count of selected items. |

### Between element
Setting the `filterType` to `between` will allow for the filtering of data using a start and end value on the target column.  For remote filtering, the library will transform the input values into an array of length two.  The first value being the start value, and the second the end value.

### Custom filter
You can also provide a function type to implement custom behavior.  A function type will be passed the following arguments, and should return a boolean result:
1. **filterVal** - Value of column's associated filter element.
2. **rowVal** - Row value of associated column.
3. **rowData** - Object/row data set of current row being processed.
4. **filterParams** - Additional parameters you can pass to the header filter function.

 **Note: If grid is setup for remote processing, filter condition logic will be deferred to the remote server for processing and ignore internal logic.**

 ### Complex filtering
 If you want to implement more complex filtering, like applying an OR condition, use the `setFilter` method on the `GridCore` class to supply a function with your logic.  Example:
 ```js
 class Grid extends GridCore {
    constructor(settings) {
        super("grid", settings, []);

        this.addModules(FilterModule, SortModule, PagerModule);
    }

    filterOR = (filterVal, rowVal, rowData, filterParams) => {
        const subject = String(rowData.subject).indexOf(filterVal) > -1;
        const message = String(rowData.message).indexOf(filterVal) > -1;

        return subject || message;
    };

    this.setFilter("message", value, this.filterOR, "string", {});
}
 ```