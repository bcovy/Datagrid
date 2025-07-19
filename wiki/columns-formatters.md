# Column formatters
### date
Renders cell with date component. **Expects an input format of: [{YYYY}-{MM}-{DD}](https://tc39.es/ecma262/multipage/numbers-and-dates.html#sec-date-time-string-format).**  May produce unexpected results if a non-standard input format is supplied.  Will return empty string if value is null, or is not a valid date type.  Use the ```formatterParams``` property to specify the target column and format:
```js
{
    field: "pcoe", formatter: "date", type: "date", formatterParams: {
        dateField: "pcoe",
        format: "MM/dd/yyyy"
    }
}
```
- **dateField** - Field to apply formatting.  Will default to ```field``` if ```formatterParams``` is not supplied.  String date should be formatted as: `{year}-{month}-{date}`
- **format** - Format template to use.  Expects a separator either of ` / - ` or empty space.  Will default to ```dateFormat``` setting if ```formatterParams``` is not supplied.

If you omit the ```formatterParams``` property, the current field and default format will be used to render the output:
```js
{ field: "pcoe", formatter: "date", type: "date" }
```

### datetime
Renders cell with date and time components.  **Expects an input format of: [{YYYY}-{MM}-{DD}](https://tc39.es/ecma262/multipage/numbers-and-dates.html#sec-date-time-string-format).**  May produce unexpected results if a non-standard input format is supplied. Will return empty string if value is null, or is not a valid date type.
```js
{
    field: "pcoe", formatter: "datetime", type: "datetime", formatterParams: {
        dateField: "pcoe",
        format: "MM/dd/yyyy HH:mm:ss"
    }
}
```
- **dateField** - Field to apply formatting.  Will default to ```field``` if ```formatterParams``` is not supplied.  String date should be formatted as: `{year}-{month}-{date}`
- **format** - Format template to use.  Expects a separator either of ` / - : ` or empty space.  Will default to ```dateTimeFormat``` setting if ```formatterParams``` is not supplied.

Format specifiers:
- d: two digit date.
- dd: removes leading zero from date.
- M: two digit month.
- MM: removes leading zero from month.
- MMM: abbreviated month name.
- MMMM: full month name.
- yy: two digit year.
- yyyy: four digit year.
- s: seconds.
- ss: removes leading zero from seconds.
- m: minutes.
- mm: removes leading zero from minutes.
- h: hours in AM/PM.
- hh: removes leading zero from hours in AM/PM.
- hp: AM/PM part.
- H: hours in 24 clock time.
- HH: removes leading zero from hours in 24 clock time.


If you omit the ```formatterParams``` property, the current field and default format will be used to render the output:
```js
{ field: "pcoe", formatter: "datetime", type: "date" }
```

### link
Creates an anchor element with a link to a given value.  Will apply the result to the target cell using JavaScript's `append()` method.
```js
{
    field: "name", formatter: "link", formatterParams: {
        urlPrefix: "/work/profile",
        routeField: "id",
        fieldText: "name", 
        target: "_blank"
    }
}
```
- **urlPrefix** - Prefix to put before URL value.
- **routeField** - Field value to use to append route value to URL.
- **queryField** - Field value to use to append query value to URL.
- **fieldText** - Field value to use for anchor inner HTML.
- **innerText** - A string that represents the inner text, or a function which returns a string.  Function is passed the following arguments: `rowData`, `formatterParams`.
- **target** - Will apply target attribute to anchor element if value is supplied.

### money
Formats a numeric value to a currency string template.
```js
{
    field: "sales", formatter: "money", formatterParams: { precision: 2 }
}
```
- **precision** - Number of decimals to display.  Default is 2.  Will round up.

### numeric
Formats a numeric value to a string template.
```js
{
    field: "sales", formatter: "numeric", formatterParams: {
        precision: 2,
        style: "decimal"
    }
}
```
- **precision** - Number of decimals to display.  Default is 2.  Will round up.
- **style** - Formatting style to use: decimal(default), currency, percent.

### star
Displays a graphical star rating based on integer values.
```js
{
    field: "rating", formatter: "star", formatterParams: { stars: 5 }
}
```
- **stars** - Max number of stars to display.  Default is 5.

### icon
By omitting the `field` property, you can add column consisting of icons with no column header title.
```js
{
    width: "1%",
    formatter: function (rowData, formatterParams) {
        const a = document.createElement("a");

        a.href = "/someurl";
        a.innerHTML = '<span class="mdi mdi-comment-outline mdi-18px"></span>';

        return a;
    }
},
```

### function
Applies a user defined function to render the cell output.  Grid will apply three arguments: 
- *rowData* for the current row being processed.
- *formatterParams* option from the column definition.
- *element* reference to the associated `td` element.

*Note*: Formatter will apply function result to cell using ``Element.append()`` method.
```js
const funcField = function(rowData, formatterParams, element) {
    const anchor = document.createElement("a");
    const value = encodeURIComponent(rowData[formatterParams.queryField]);

    anchor.href = `${formatterParams.urlPrefix}?${formatterParams.queryField}=${value}`;
    anchor.innerHTML = '<span class="icon"><span class="mdi mdi-plus-circle"></span></span>';
    
    element.className = 'has-text-danger';

    return anchor;
};

const columns = {
    field: "city", 
    formatter: funcField,
    formatterParams: { urlPrefix: "./basicpage.html", fieldText: "id", queryField: "id" } 
}
```

### module
A custom module can be defined to apply formatting that may involve multiple columns, complex logic, or encapsulate shared formatting beyond current offerings.  Module must conform to template outlined below, using `apply` function to implement logic.  In addition, name of module must be identified in column's `formatterParams` property.
```js
//Module template
class CustomModule {
    constructor(context) {
        super(context);
        //REQUIRED perform setup tasks
    }

    initialize() {
        //REQUIRED.  Subscribe to internal events and/or register data handlers.
    }
    /**
     * Apply custom formatting logic.  Method called in `Cell` class.
     * @param {Array<object>} rowData Current row of data set being processed.
     * @param {Column} column `Column` class model with column settings.
     * @param {HTMLTableRowElement} row name of module where function is being called.
     * @returns {string | HTMLElement} should return a string or HTML element.
     */
    apply(rowData, column, row) {
        //Formatting logic, should return a string or element.
    }
}

CustomModule.moduleName = "custom";

//column setup
{
    field: "openDate",
    formatter: "module",
    formatterParams: { name: CustomModule.moduleName }
}
```