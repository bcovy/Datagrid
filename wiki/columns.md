# Columns
A `columns` object is used to define which fields from the data source should be loaded into the table, and how it should be displayed.  Each column can include configuration options to change how data will appear, or enable filtering.

## Column definition
Column definitions are provided in the `columns` property of the grid constructor object and should take the format of an array of objects, with each object representing the configuration of one column.

```js
const grid = new DataGrids("grid_element", {
    columns: [  //column ordinal position will match object.
        { field: "id", label: "ID" type: "number" }, 
        { field: "name", type: "string" },
        { field: "location", type: "string" }
    ]
});  
```

### Required
| attribute | type | description |
| --------- | ---- | ----------- |
| field | string | Dataset property name to use for column.  Can be left blank if adding an icon column. |

### General
| attribute | type | description |
| --------- | ---- | ----------- |
| label | string | Title of column.  If empty, library will use *field* name, capitalizing first letter. |
| type | string | Used to determine how to sort data for column.  Valid input types: number, string, date, datetime.  Will use string as default value. |
| headerCss | string | CSS class used on cells in header row.  Value should be a string containing space separated class names. |
| filterCss | string | Overrides parent `tablefilterCss` property setting.  Will apply CSS class for target column's input element. |
| columnSize | number | For use when you want to apply 12 columns system.  Will convert column size to associated CSS rule `datagrid-col-{size}`, and add to class list of header's `th` element. |
| width | number | Will apply `width` style rule to header's `th` element. |
| headerFilterEmpty | bool/string | A value of `true` will apply a style rule to match the height of the other headers that are using filtering. A string value to a style rule will also enable this property.  |

### Tooltip
| attribute | type | description |
| --------- | ---- | ----------- |
| tooltipField | string | Name of column to derive data for tooltip text. |
| tooltipLayout | string | Direction of tooltip pop out, relative to parent object.  Settings are: left or right.  Default is left. |

### Data manipulation

| attribute | type | description |
| --------- | ---- | ----------- |
| formatter | string/function | Will apply formatting or function to column's cells.  See **Formatters** |
| formatterParams | object | Additional parameters you can pass to the formatter.  See **Formatters** |
| filterType | string | Adds filter to header row.  Available condition: **equals**, **like**, **in**, **>**, **>=**, **<**, **<=**, **!=**, `function()`.  In addition, you can also provide a function type to implement custom behavior.  *Note: If grid is setup for remote processing, filter condition logic will be deferred to the remote server for processing and ignore internal logic.* |
| filterParams | object | Optional.  Additional parameters you can pass to the header filter function. |
| filterValues | object | Adding either a URL `string` or an `Object` of key/value pairs to this property will change the filter to a `select` element.  Expects an array of objects with a model type of: `{ value: "the key", text: "description" }`.  An object with key/value pairs can also be used, with the `key` value as the option property.  Example: `{ 1: "opt1", 2: "opt2" }`.  If a URL `string` value is supplied, an Ajax call will be used to retrieve and populate select option values. |
| filterMultiSelect | bool/Object | Optional.  A value of `true` will turn the Select filter into a multi-selection input.  To add control with settings, pass an object: `{ listAll: false }` |
| filterRealTime | bool/numeric | Will apply real time filtering if an input element is used.  Set property to `true` to enable function with default filter wait time of 500ms between keystrokes.  Or provide a numeric value to add your own wait time. |