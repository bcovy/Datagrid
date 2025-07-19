# Setup options
The following is a list of available options to modify the default behavior of the grid.  Any one of these options can be set in the constructor object when you define your `datagrid`.  It is not necessary to supply a complete list of options, as the library will use the defaults for any missing items.

```js
const grid = new DataGrid("grid_element", {
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
```

## Settings

| attribute | type | default | description |
| --------- | ---- | ------- | ----------- |
| baseIdName | string | `datagrid` | Base name to use on element IDs. |
| columns | array of objects | null | Defines how data loaded into the table should be displayed.  Each column should represent a field from the row data that's loaded into the grid. |
| data | array of objects | null | An array of objects or json data to be used to build the table rows.  Setting can be omitted if AJAX method will be used to acquire data. |
| enablePaging | bool | true | Enable paging of grid data. |
| pagerPagesToDisplay | int | 5 | Maximum number of named pager buttons to display in pager control. |
| pagerRowsPerPage | int | 25 | Number of rows per page of each paged dataset. |
| dateFormat | string | MM/dd/yyyy | Date to string format template.  Expects separators of ` / - ` or empty space.  |
| dateTimeFormat | string | MM/dd/yyyy HH:mm:ss | Date and time string format template.  Expects separators of ` / - ` or empty space. |
| remoteUrl | string | null | URL for remote Ajax data loading.  If a URL `string` value is supplied, the library will overwrite data that was added using the `data` attribute. |
| remoteParams | object | null | Parameters to be used in the remote Ajax data request.  Expects and object of key/value pairs, which will be used to create query string value. |
| remoteProcessing | bool/object | false | If `true`, filter, sorting, and paging requests will be sent to the remote server for processing.  To set default sort column, provide an object with the following key/value pairs: `{ column: "column", direction: "asc" }`. |
| tableCss | string | datagrid | CSS class for table. |
| tableHeaderThCss | string | null | Will apply class to each `th` element in header row.  Expects a single class name. |
| pagerCss | string | datagrid-pager | CSS class for pager element. |
| tableEvenColumnWidths | bool | false | Will set column widths to a equal/shared size based on the number of columns in the table. |
| tableFilterCss | string | datagrid-input | CSS class for header filter input elements. |
| tableCssSortAsc | string | datagrid-sort-icon datagrid-sort-asc | CSS icon for asc sort direction. |
| tableCssSortDesc | string | datagrid-sort-icon datagrid-sort-desc | CSS icon for desc sort direction. |
| refreshableId | string | null | Will refresh the grid, and its underlying data source.  Expects the ID of a button element for which a handler method can be attached. |
| rowCountId | string | null | Expects reference to a user created element with an `innerText` property.  Will apply and updated item with grid's record count value. |
| csvExportId | string | null | Will allow for grid's data to be downloaded into a CSV file.  Expects the ID of a button element for which a handler method can be attached. |
| csvExportRemoteSource | string | null | URL for remote data source grid can use to format and export results.  Expects un-paged data set. |

## Remote data source 
When data needs to be load from a remote source, setting the `remoteUrl` property with the target URL will instruct the **datagrid** to asynchronously retrieve data in the form of a JSON response type.  Additional query string parameters can be added using the `remoteParams` property in the form of key/value pairs.
```js
const grid = new DataGrid("grid_example", {
    remoteUrl: "/api/data",
    remoteParams: { location: "ca" },
    columns: [
        { field: "id", type: "number" }, 
        { field: "name", type: "string" },
        { field: "location", type: "string" }
    ]
});
```

## Remote processing
If you are loading a lot of data from a remote source, or your data requires complex filtering by a SQL server, set the `remoteProcessing` property to either `true` or a key/value pair of the default sort column.  This will enable the grid to query the remote server for all data manipulation events.
```js
const grid = new DataGrid("grid_example", {
    remoteUrl: "/api/data",
    remoteProcessing: { sort: "id", direction: "asc" },
    columns: [
        { field: "id", type: "number" }, 
        { field: "name", type: "string" },
        { field: "location", type: "string" }
    ]
});
```

If `enablePaging` is set to `true`, the remote server will be responsible for providing the correct paged dataset.  The JSON response will need to be formatted to include a `rowCount` property with the number of un-filtered records, and a `data` property with the paged dataset.  
```js
// JSON response.
{
    "rowCount": 15,  //total number of un-filtered records in data set.
    "data": [  //an array of row data objects.
        { "id": 1, "address": "hello world" }
    ]
}
```

## Overriding default options
By default, the `datagrid` class will apply the `SortModule` and `FilterModule` modules.  If you want to modify this behavior in order to remove unnecessary processing steps, you can do this by updating the `defaultOptions` property on the `datagrid` class:

```js
//override default setup of modules.
datagrid.defaultOptions.enableFilter = false;
datagrid.defaultOptions.enableSort = false;
```