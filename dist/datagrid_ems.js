class DateHelper {
    static timeReGex = new RegExp("[0-9]:[0-9]");
    /**
     * Convert string to Date object type.  Expects string format of year-month-day.
     * @param {string} value String date with format of year-month-day.
     * @returns {Date | string} Date if conversion is successful.  Otherwise, empty string.
     */
    static parseDate(value) {
        //Check if string is date only by looking for missing time component.  
        //If missing, add it so date is interpreted as local time.
        if (!this.timeReGex.test(value)) {
            value = `${value}T00:00`;
        }

        const date = new Date(value);
        
        return (Number.isNaN(date.valueOf())) ? "" : date;
    }
    /**
     * Convert string to Date object type, setting the time component to midnight.  Expects string format of year-month-day.
     * @param {string} value String date with format of year-month-day.
     * @returns {Date | string} Date if conversion is successful.  Otherwise, empty string.
     */
    static parseDateOnly(value) {
        const date = this.parseDate(value);

        if (date === "") return "";  //Invalid date.

        date.setHours(0, 0, 0, 0); //Set time to midnight to remove time component.

        return date;
    }
    /**
     * Returns `true` if value is a Date object type.
     * @param {object} value 
     * @returns {boolean} Returns `true` if value is a Date object type, otherwise `false`.
     */
    static isDate(value) { 
        return Object.prototype.toString.call(value) === "[object Date]";

    }
}

/**
 * Provides methods to format date and time strings.  Expects date string in format of year-month-day.
 */
class FormatDateTime {
    static monthsLong = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    static monthsShort = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

    static leadingZero(num) {
        return num < 10 ? "0" + num : num;
    }
    /**
     * Returns a formatted date time string.  Expects date string in format of year-month-day.  If `formatterParams` is empty, 
     * function will revert to default values. Expected property values in `formatterParams` object:
     * - dateField: field to convert date time.
     * - format: string format template.
     * @param {Object} rowData Row data.
     * @param {Column} column Column class object.
     * @param {string} defaultFormat Default string format: MM/dd/yyyy
     * @param {boolean} [addTime=false] Apply date time formatting?
     * @returns {string}
     */
    static apply(rowData, column, defaultFormat = "MM/dd/yyyy", addTime = false) {
        let result = column?.formatterParams?.format ?? defaultFormat;
        let field = column?.formatterParams?.dateField 
            ? rowData[column.formatterParams.dateField]
            : rowData[column.field];

        if (field === null) {
            return "";
        }

        const date = DateHelper.parseDate(field);

        if (date === "") {
            return "";
        }

        let formats = {
            d: date.getDate(),
            dd: this.leadingZero(date.getDate()),

            M: date.getMonth() + 1,
            MM: this.leadingZero(date.getMonth() + 1),
            MMM: this.monthsShort[date.getMonth()],
            MMMM: this.monthsLong[date.getMonth()],

            yy: date.getFullYear().toString().slice(-2),
            yyyy: date.getFullYear()
        };

        if (addTime) {
            let hours = date.getHours();
            let hours12 = hours % 12 === 0 ? 12 : hours % 12;

            formats.s = date.getSeconds();
            formats.ss = this.leadingZero(date.getSeconds());
            formats.m = date.getMinutes();
            formats.mm = this.leadingZero(date.getMinutes());
            formats.h = hours12;
            formats.hh =  this.leadingZero(hours12);
            formats.H = hours;
            formats.HH = this.leadingZero(hours);
            formats.hp = hours < 12 ? "AM" : "PM";
        }

        const targets = result.split(/\/|-|\s|:/);

        for (let item of targets) {
            result = result.replace(item, formats[item]);
        }
    
        return result;
    }
}

/**
 * Provides method to format a link as an anchor tag element.
 */
class FormatLink {
    /**
     * Formatter that create an anchor tag element. href and other attributes can be modified with properties in the 
     * 'formatterParams' parameter.  Expected property values: 
     * - urlPrefix: Base url address.
     * - routeField: Route value.
     * - queryField: Field name from dataset to build query sting key/value input.
     * - fieldText: Use field name to set inner text to associated dataset value.
     * - innerText: Raw inner text value or function.  If function is provided, it will be called with rowData and formatterParams as parameters.
     * - target: How target document should be opened.
     * @param {Object} rowData Row data.
     * @param {{ urlPrefix: string, queryField: string, fieldText: string, innerText: string | Function, target: string }} formatterParams Settings.
     * @return {HTMLAnchorElement} anchor tag element.
     * */
    static apply(rowData, formatterParams) {
        const el = document.createElement("a");

        let url = formatterParams.urlPrefix;
        //Apply route value before query string.
        if (formatterParams.routeField) {
            url += "/" + encodeURIComponent(rowData[formatterParams.routeField]);
        }

        if (formatterParams.queryField) {
            const qryValue = encodeURIComponent(rowData[formatterParams.queryField]);

            url = `${url}?${formatterParams.queryField}=${qryValue}`;
        }

        el.href = url;

        if (formatterParams.fieldText) {
            el.innerHTML = rowData[formatterParams.fieldText];
        } else if ((typeof formatterParams.innerText === "function")) {
            el.innerHTML = formatterParams.innerText(rowData, formatterParams);
        } else if (formatterParams.innerText) {
            el.innerHTML = formatterParams.innerText;
        }

        if (formatterParams.target) {
            el.setAttribute("target", formatterParams.target);
            el.setAttribute("rel", "noopener");
        }

        return el;
    }
}

/**
 * Provides method to format numeric values into strings with specified styles of decimal, currency, or percent.
 */
class FormatNumeric {
    static validStyles = ["decimal", "currency", "percent"];
    /**
     * Returns a formatted numeric string.  Expected property values: 
     * - precision: rounding precision.
     * - style: formatting style to use.
     * @param {Object} rowData Row data.
     * @param {Column} column Column class object.
     * @param {string} [style="decimal"] Formatting style to use. Default is "decimal".
     * @param {number} [precision=2] Rounding precision. Default is 2.
     * @returns {string}
     */
    static apply(rowData, column, style = "decimal", precision = 2) {
        const floatVal = rowData[column.field];

        if (isNaN(floatVal)) return floatVal;

        if (!this.validStyles.includes(style)) {
            style = "decimal";
        }

        return new Intl.NumberFormat("en-US", {
            style: style,
            maximumFractionDigits: precision,
            currency: "USD"
        }).format(floatVal);
    }
}

class FormatStar {
    /**
     * Returns an element of star ratings based on integer values.  Expected property values: 
     * - stars: number of stars to display.
     * @param {Object} rowData row data.
     * @param {Column} column column class object.
     * @returns {HTMLDivElement}
     */
    static apply(rowData, column) {
        let value = rowData[column.field];
        const maxStars = column.formatterParams?.stars ? column.formatterParams.stars : 5;
        const container = document.createElement("div");
        const stars = document.createElement("span");
        const star = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        const starActive = '<polygon fill="#FFEA00" stroke="#C1AB60" stroke-width="37.6152" stroke-linecap="round" stroke-linejoin="round" stroke-miterlimit="10" points="259.216,29.942 330.27,173.919 489.16,197.007 374.185,309.08 401.33,467.31 259.216,392.612 117.104,467.31 144.25,309.08 29.274,197.007 188.165,173.919 "/>';
        const starInactive = '<polygon fill="#D2D2D2" stroke="#686868" stroke-width="37.6152" stroke-linecap="round" stroke-linejoin="round" stroke-miterlimit="10" points="259.216,29.942 330.27,173.919 489.16,197.007 374.185,309.08 401.33,467.31 259.216,392.612 117.104,467.31 144.25,309.08 29.274,197.007 188.165,173.919 "/>';

        //style stars holder
        stars.style.verticalAlign = "middle";
        //style star
        star.setAttribute("width", "14");
        star.setAttribute("height", "14");
        star.setAttribute("viewBox", "0 0 512 512");
        star.setAttribute("xml:space", "preserve");
        star.style.padding = "0 1px";

        value = value && !isNaN(value) ? parseInt(value) : 0;
        value = Math.max(0, Math.min(value, maxStars));

        for(let i = 1; i <= maxStars; i++){
            const nextStar = star.cloneNode(true);

            nextStar.innerHTML = i <= value ? starActive : starInactive;

            stars.appendChild(nextStar);
        }

        container.style.whiteSpace = "nowrap";
        container.style.overflow = "hidden";
        container.style.textOverflow = "ellipsis";
        container.setAttribute("aria-label", value);
        container.append(stars);

        return container;
    }
}

class CssHelper {
    static between = {
        button: "datagrids-between-button",
        label: "datagrids-between-input-label"
    };

    static noHeader = "datagrids-no-header";

    static input = "datagrids-input";

    static multiSelect = {
        parentClass: "datagrids-multi-select",
        header: "datagrids-multi-select-header",
        headerActive: "datagrids-multi-select-header-active",
        headerOption: "datagrids-multi-select-header-option",
        options: "datagrids-multi-select-options",
        option: "datagrids-multi-select-option",
        optionText: "datagrids-multi-select-option-text",
        optionRadio: "datagrids-multi-select-option-radio",
        selected: "datagrids-multi-select-selected"
    };

    static tooltip = { 
        parentClass: "datagrids-tooltip",
        right: "datagrids-tooltip-right",
        left: "datagrids-tooltip-left"
    };
}

class Cell {
    /**
     * Create cell object that represents the `td` table body element.
     * @param {Array<object>} rowData Row data.
     * @param {Column} column Column object.
     * @param {Object} modules Grid module(s) added by user for custom formatting.
     * @param {HTMLTableRowElement} row Table row `tr` element.
     */
    constructor(rowData, column, modules, row) {
        this.element = document.createElement("td");

        if (column.formatter) {
            this.#init(rowData, column, modules, row);
        } else {
            this.element.innerText = rowData[column.field];
        }

        if (column.tooltipField) {
            this.#applyTooltip(rowData[column.tooltipField], column.tooltipLayout);
        }
    }
    /**
     * Applies tooltip functionality to the cell.  If the cell's content contains text only, it will create a tooltip 
     * `span` element and apply the content to it.
     * @param {string | number | Date | null} content Tooltip content to be displayed.
     * @param {string} layout CSS class for tooltip layout, either "datagrids-tooltip-right" or "datagrids-tooltip-left".
     */
    #applyTooltip(content, layout) {
        if (content === null || content === "") return;
        
        let tooltipElement = this.element.firstElementChild;

        if (tooltipElement === null) {
            tooltipElement = document.createElement("span");
            tooltipElement.innerText = this.element.innerText;
            this.element.replaceChildren(tooltipElement);
        }

        tooltipElement.dataset.tooltip = content;
        tooltipElement.classList.add(CssHelper.tooltip, layout);
    }

    #init(rowData, column, modules, row) {
        if (typeof column.formatter === "function") {
            this.element.append(column.formatter(rowData, column.formatterParams, this.element, row));
            return;
        }
  
        switch (column.formatter) {
            case "link":
                this.element.append(FormatLink.apply(rowData, column.formatterParams));
                break;
            case "date":
                this.element.innerText = FormatDateTime.apply(rowData, column, column.settings.dateFormat, false);
                break;
            case "datetime":
                this.element.innerText = FormatDateTime.apply(rowData, column, column.settings.dateTimeFormat, true);
                break;
            case "money":
                this.element.innerText = FormatNumeric.apply(rowData, column, "currency", 2);
                break;
            case "numeric":
                this.element.innerText = FormatNumeric.apply(rowData, column, column.formatterParams?.style ?? "decimal", column.formatterParams?.precision ?? 2);
                break;
            case "star":
                this.element.append(FormatStar.apply(rowData, column));
                break;
            case "module":
                this.element.append(modules[column.formatterParams.name].apply(rowData, column, row, this.element));
                break;
            default:
                this.element.innerText = rowData[column.field];
        }
    }
}

/**
 * Defines a single header cell 'th' element.
 */
class HeaderCell {
    /**
     * Create header object that represents the `th` table header element.  Class will persist column sort and order user input.
     * @param {Column} column column object.
     */
    constructor(column) {
        this.column = column;
        this.settings = column.settings;
        this.element = document.createElement("th");
        this.span = document.createElement("span");
        this.name = column.field;
        this.direction = "desc";
        this.directionNext = "desc";
        this.type = column.type;

        if (column.headerCss) {
            this.element.classList.add(column.headerCss);
        }

        if (this.settings.tableHeaderThCss) {
            this.element.classList.add(this.settings.tableHeaderThCss);
        }

        if (column.columnSize) {
            this.element.classList.add(column.columnSize);
        }

        if (column.width) {
            this.element.style.width = column.width;
        }

        if (column.headerFilterEmpty) {
            this.span.classList.add(column.headerFilterEmpty);
        }

        this.element.appendChild(this.span);
        this.element.context = this;
        this.span.innerText = column.label;
        this.span.context = this;
    }
    /**
     * Set the sort flag for the header cell.
     */
    setSortFlag() {
        if (this.icon === undefined) {
            this.icon = document.createElement("i");
            this.span.append(this.icon);
        }

        if (this.directionNext === "desc") {
            this.icon.classList = this.settings.tableCssSortDesc;
            this.direction = "desc";
            this.directionNext = "asc";
        } else {
            this.icon.classList = this.settings.tableCssSortAsc;
            this.direction = "asc";
            this.directionNext = "desc";
        }
    }
    /**
     * Remove the sort flag for the header cell.
     */
    removeSortFlag() {
        this.direction = "desc";
        this.directionNext = "desc";
        this.icon = this.icon.remove();
    }

    get isCurrentSort() {
        return this.icon !== undefined;
    }
}

/**
 * Defines a single column for the grid.  Transforms user's column definition into Class properties.
 * @class
 */
class Column {
    /**
     * Create column object which transforms user's column definition into Class properties.
     * @param {Object} column User's column definition/settings.
     * @param {SettingsGrid} settings grid settings.
     * @param {number} index column index number.
     */
    constructor(column, settings, index = 0) {
        this.settings = settings;
        this.index = index;

        if (column.field === undefined) {
            this.field = `column${index}`;  //associated data field name.
            this.type = "icon";  //icon type.
            this.label = "";
        } else {
            this.field = column.field;  //associated data field name.
            this.type = column.type ? column.type : "string";  //value type.
            this.label = column.label 
                ? column.label 
                : column.field[0].toUpperCase() + column.field.slice(1);  //column title.
        }

        if (column?.formatterModuleName) { 
            this.formatter = "module";
            this.formatterModuleName = column.formatterModuleName;  //formatter module name.
        } else {
            this.formatter = column.formatter;  //formatter type or function.
            this.formatterParams = column.formatterParams;
        }

        this.headerCss = column.headerCss;
        this.columnSize = column?.columnSize ? `datagrids-col-${column.columnSize}` : "";
        this.width = column?.width ?? undefined;
        this.hasFilter = this.type !== "icon" && column.filterType ? true : false;
        this.headerCell = undefined;  //HeaderCell class.
        this.headerFilter = undefined;  //HeaderFilter class.

        if (this.hasFilter) {
            this.#initializeFilter(column, settings);
        } else if (column?.headerFilterEmpty) {
            this.headerFilterEmpty = (typeof column.headerFilterEmpty === "string") 
                ? column.headerFilterEmpty : CssHelper.noHeader;
        }
        //Tooltip setting.
        if (column.tooltipField) {
            this.tooltipField = column.tooltipField;
            this.tooltipLayout = column?.tooltipLayout === "right" ? CssHelper.tooltip.right : CssHelper.tooltip.left;
        }
    }
    /**
     * Initializes filter properties.
     * @param {Object} column 
     * @param {Settings} settings 
     */
    #initializeFilter(column, settings) {
        this.filterElement = column.filterType === "between" ? "between" : "input";
        this.filterType = column.filterType;  //filter type descriptor, such as: equals, like, <, etc; can also be a function.
        this.filterParams = column.filterParams;
        this.filterCss = column?.filterCss ?? settings.tableFilterCss;
        this.filterRealTime = column?.filterRealTime ?? false;

        if (column.filterValues) {
            this.filterValues = column.filterValues;  //select option filter value.
            this.filterValuesRemoteSource = typeof column.filterValues === "string" ? column.filterValues : undefined;  //select option filter value ajax source.
            this.filterElement = column.filterMultiSelect ? "multi" : "select";
            this.filterMultiSelect = column.filterMultiSelect;
        }
    }
}

/**
 * Creates and manages the columns for the grid.  Will create a `Column` object for each column definition provided by the user.
 */
class ColumnManager {
    #columns;
    #indexCounter = 0;
    /**
     * Transforms user's column definitions into concrete `Column` class objects.  Will also create `HeaderCell` objects 
     * for each column.
     * @param {Array<Object>} columns Column definitions from user.
     * @param {SettingsGrid} settings Grid settings.
     */
    constructor(columns, settings) {
        this.#columns = [];
        this.settings = settings;
        this.tableEvenColumnWidths = settings.tableEvenColumnWidths;
        this.hasHeaderFilters = false;

        for (const c of columns) {
            const col = new Column(c, settings, this.#indexCounter);
          
            col.headerCell = new HeaderCell(col);

            this.#columns.push(col);
            this.#indexCounter++;
        }
        // Check if any column has a filter defined
        if (this.#columns.some((c) => c.hasFilter)) {
            this.hasHeaderFilters = true;
        }

        if (settings.tableEvenColumnWidths) {
            this.#setEvenColumnWidths();
        }
    }

    #setEvenColumnWidths() { 
        const count = (this.#indexCounter + 1);
        const width = 100 / count;

        this.#columns.forEach((h) => h.headerCell.element.style.width = `${width}%`);
    }
    /**
     * Get array of `Column` objects.
     * @returns {Array<Column>} array of `Column` objects.
     */
    get columns() {
        return this.#columns;
    }
    /**
     * Adds a new column to the columns collection.
     * @param {Object} column Column definition object.
     * @param {number} [index=null] Index to insert the column at. If null, appends to the end.
     */
    addColumn(column, index = null) { 
        const col = new Column(column, this.settings, this.#indexCounter);
        col.headerCell = new HeaderCell(col);

        if (index !== null && index >= 0 && index < this.#columns.length) {
            this.#columns.splice(index, 0, col);
        } else {
            this.#columns.push(col);
        }

        this.#indexCounter++;

        if (this.tableEvenColumnWidths) {
            this.#setEvenColumnWidths();
        }
    }
}

const settingsDefaults = {
    baseIdName: "datagrid",  //base name for all element ID's.
    data: [],  //row data.
    columns: [],  //column definitions.
    enablePaging: true,  //enable paging of data.
    pagerPagesToDisplay: 5,  //max number of pager buttons to display.
    pagerRowsPerPage: 25,  //rows per page.
    dateFormat: "MM/dd/yyyy",  //row level date format.
    dateTimeFormat: "MM/dd/yyyy HH:mm:ss", //row level date format.
    remoteUrl: "",  //get data from url endpoint via Ajax.
    remoteParams: "",  //parameters to be passed on Ajax request.
    remoteProcessing: false,  //truthy sets grid to process filter/sort on remote server.
    tableCss: "datagrids", 
    tableHeaderThCss: "",
    pagerCss: "datagrids-pager", 
    tableFilterCss: "datagrids-input",  //css class for header filter input elements.
    tableEvenColumnWidths: false,  //should all columns be equal width?
    tableCssSortAsc: "datagrids-sort-icon datagrids-sort-asc",
    tableCssSortDesc: "datagrids-sort-icon datagrids-sort-desc",
    refreshableId: "",  //refresh remote data sources for grid and/or filter values.
    rowCountId: "",
    csvExportId: "",
    csvExportRemoteSource: "" //get export data from url endpoint via Ajax; useful to get non-paged data.
};

class MergeOptions {
    /**
     * Returns an object based on the merged results of the default and user provided settings.
     * User provided settings will override defaults.
     * @param {Object} source user supplied settings.
     * @returns {Object} settings merged from default and user values.
     */
    static merge(source) {
        //copy default key/value items.
        let result = JSON.parse(JSON.stringify(settingsDefaults));

        if (source === undefined || Object.keys(source).length === 0) {
            return result;
        }
        
        for (let [key, value] of Object.entries(source)) {
            let targetType = result[key] !== undefined ? result[key].toString() : undefined;
            let sourceType = value.toString();

            if (targetType !== undefined && targetType !== sourceType) {
                result[key] = value;
            }
        }

        return result;
    }
}

/**
 * Implements the property settings for the grid.
 */
class SettingsGrid {
    /**
     * Translates settings from merged user/default options into a definition of grid settings.
     * @param {Object} options Merged user/default options.
     */
    constructor(options) {
        this.baseIdName = options.baseIdName;
        this.enablePaging = options.enablePaging;
        this.pagerPagesToDisplay = options.pagerPagesToDisplay;
        this.pagerRowsPerPage = options.pagerRowsPerPage;
        this.dateFormat = options.dateFormat;
        this.dateTimeFormat = options.dateTimeFormat;
        this.remoteUrl = options.remoteUrl;  
        this.remoteParams = options.remoteParams;
        this.remoteProcessing = false;
        
        this.ajaxUrl = (this.remoteUrl && this.remoteParams) ? this._buildAjaxUrl(this.remoteUrl, this.remoteParams) : this.remoteUrl;

        if (typeof options.remoteProcessing === "boolean" && options.remoteProcessing) {
            // Remote processing set to `on`; use first column with field as default sort.
            const first = options.columns.find((item) => item.field !== undefined);

            this.remoteProcessing = true;
            this.remoteSortDefaultColumn = first.field;
            this.remoteSortDefaultDirection = "desc";
        } else if (Object.keys(options.remoteProcessing).length > 0) {
            // Remote processing set to `on` using key/value parameter inputs for default sort column.
            this.remoteProcessing = true;
            this.remoteSortDefaultColumn = options.remoteProcessing.column;
            this.remoteSortDefaultDirection = options.remoteProcessing.direction ?? "desc";
        } 

        this.tableCss = options.tableCss;
        this.tableHeaderThCss = options.tableHeaderThCss;
        this.pagerCss = options.pagerCss;
        this.tableFilterCss = options.tableFilterCss;
        this.tableEvenColumnWidths = options.tableEvenColumnWidths;
        this.tableCssSortAsc = options.tableCssSortAsc;
        this.tableCssSortDesc = options.tableCssSortDesc;
        this.refreshableId = options.refreshableId;
        this.rowCountId = options.rowCountId;
        this.csvExportId = options.csvExportId;
        this.csvExportRemoteSource = options.csvExportRemoteSource;
    }
    /**
     * Compiles the key/value query parameters into a fully qualified url with query string.
     * @param {string} url base url.
     * @param {object} params query string parameters.
     * @returns {string} url with query parameters.
     */
    _buildAjaxUrl(url, params) {
        const p = Object.keys(params);

        if (p.length > 0) {
            const query = p.map(k => `${encodeURIComponent(k)}=${encodeURIComponent(params[k])}`)
                .join("&");

            return `${url}?${query}`;
        }
        
        return url;
    }
}

class DataLoader {
    /**
     * Create class to retrieve data via an Ajax call.
     * @param {SettingsGrid} settings grid settings.
     */
    constructor(settings) {
        this.ajaxUrl = settings.ajaxUrl;
    }
    /***
     * Uses input parameter's key/value paris to build a fully qualified url with query string values.
     * @param {string} url Target url.
     * @param {object} [parameters={}] Input parameters.
     * @returns {string} Fully qualified url.
     */
    buildUrl(url, parameters = {}) {
        const p = Object.keys(parameters);
  
        if (p.length === 0) {
            return url;
        }

        let result = [];

        for (const key of p) {
            if (Array.isArray(parameters[key])) {
                const multi = parameters[key].map(k => `${key}=${encodeURIComponent(k)}`);

                result = result.concat(multi);
            } else {
                result.push(`${key}=${encodeURIComponent(parameters[key])}`);
            }
        }

        return url.indexOf("?") !== -1 ? `${url}&${result.join("&")}` : `${url}?${result.join("&")}`;
    }
    /**
     * Makes an Ajax call to target resource, and returns the results as a JSON array.
     * @param {string} url url.
     * @param {Object} parameters key/value query string pairs.
     * @returns {Array | Object}
     */
    async requestData(url, parameters = {}) {
        let result = [];
        const targetUrl = this.buildUrl(url, parameters);

        try {
            const response = await fetch(targetUrl, { 
                method: "GET", 
                mode: "cors",
                headers: { Accept: "application/json" } 
            });
            
            if (response.ok) {
                result = await response.json();
            } 
        } catch (err) {
            window.alert(err.message);
            console.log(err.message);
            result = [];
        }
  
        return result;
    }
    /**
     * Makes an Ajax call to target resource identified in the `ajaxUrl` Settings property, and returns the results as a JSON array.
     * @param {Object} [parameters={}] key/value query string pairs.
     * @returns {Array | Object}
     */
    async requestGridData(parameters = {}) {
        return this.requestData(this.ajaxUrl, parameters);
    }
}

/**
 * Provides methods to store and persist data for the grid.
 */
class DataPersistence {
    /**
     * Creates class object to store and persist grid data.
     * @param {Array<Object>} data row data.
     */
    constructor(data) {
        this.data = data;
        this.dataCache = data.length > 0 ? structuredClone(data) : [];
    }
    /**
     * Returns the row data.
     * @returns {number} Count of rows in the data.
     */
    get rowCount() {
        return this.data.length;
    }
    /**
     * Saves the data to the class object.  Will also cache a copy of the data for later restoration if filtering or sorting is applied.
     * @param {Array<object>} data Data set.
     */
    setData = (data) => {
        if (!Array.isArray(data)) {
            this.data = [];
            this.dataCache = [];
            return;
        }

        this.data = data;
        this.dataCache = data.length > 0 ? structuredClone(data) : [];
    };
    /**
     * Resets the data to the original state when the class was created.
     */
    restoreData() {
        this.data = structuredClone(this.dataCache);
    }
}

/**
 * Class to build a data-processing pipeline that invokes an async function to retrieve data from a remote source, 
 * and pass the results to an associated handler function.  Will execute steps in the order they are added to the class.
 * 
 * The main purpose of this class is to retrieve remote data for select input controls, but can be used for any handling 
 * of remote data retrieval and processing.
 */
class DataPipeline {
    #pipelines;
    /**
     * Creates data-processing pipeline class.  Will internally build a key/value pair of events and associated
     * callback functions.  Value will be an array to accommodate multiple callbacks assigned to the same event 
     * key name.
     * @param {SettingsGrid} settings 
     */
    constructor(settings) {
        this.#pipelines = {}; 
        this.ajaxUrl = settings.ajaxUrl;
    }

    countEventSteps(eventName) {
        if (!this.#pipelines[eventName]) return 0;

        return this.#pipelines[eventName].length;
    }
    /**
     * Returns `true` if steps are registered for the associated event name, or `false` if no matching results are found.
     * @param {string} eventName Event name.
     * @returns {boolean} `true` if results are found for event name, otherwise `false`.
     */
    hasPipeline(eventName) {
        if (!this.#pipelines[eventName]) return false;

        return this.#pipelines[eventName].length > 0;
    }
    /**
     * Register an asynchronous callback step to the pipeline.  More than one callback can be registered to the same event name.
     * 
     * If a duplicate/matching event name and callback function has already been registered, method will skip the 
     * registration process.
     * @param {string} eventName Event name.
     * @param {Function} callback An async function.
     * @param {string} [url=""] Target url.  Will use `ajaxUrl` property default if argument is empty.
     */
    addStep(eventName, callback, url = "") {
        if (!this.#pipelines[eventName]) {
            this.#pipelines[eventName] = [];
        } else if (this.#pipelines[eventName].some((x) => x.callback === callback)) {
            console.warn("Callback function already found for: " + eventName);
            return;  // If event name and callback already exist, don't add.
        }

        if (url === "") {
            url = this.ajaxUrl;
        }

        this.#pipelines[eventName].push({url: url, callback: callback});
    }
    /**
     * Executes the HTTP request(s) for the given event name, and passes the results to the associated callback function.  
     * Method expects return type of request to be a JSON response.
     * @param {string} eventName 
     */
    async execute(eventName) {
        for (let item of this.#pipelines[eventName]) {
            try {
                const response = await fetch(item.url, { 
                    method: "GET", 
                    mode: "cors",
                    headers: { Accept: "application/json" } 
                });
                
                if (response.ok) {
                    const data = await response.json();

                    item.callback(data);
                } 
            } catch (err) {
                window.alert(err.message);
                console.log(err.message);
                break;
            }
        }
    }
}

class ElementHelper {
    /**
     * Creates an HTML element with the specified tag and properties.
     * @param {string} tag The tag name of the element to create.
     * @param {Object} [properties={}] An object containing properties to assign to the element.
     * @param {Object} [dataset={}] An object containing dataset attributes to assign to the element.
     * @returns {HTMLElement} The created HTML element.
     */
    static create(tag, properties = {}, dataset = {}) {
        const element = Object.assign(document.createElement(tag), properties);

        if (dataset) { 
            Object.assign(element.dataset, dataset);
        }

        return element;
    }
    /**
     * Creates a `div` element with the specified properties and dataset.
     * @param {Object} [properties={}] An object containing properties to assign to the element.
     * @param {Object} [dataset={}] An object containing dataset attributes to assign to the element.
     * @returns {HTMLDivElement} The created HTML element.
     */
    static div(properties = {}, dataset = {}) {
        return this.create("div", properties, dataset);
    }
    /**
     * Creates a `input` element with the specified properties and dataset.
     * @param {Object} [properties={}] An object containing properties to assign to the element.
     * @param {Object} [dataset={}] An object containing dataset attributes to assign to the element.
     * @returns {HTMLInputElement} The created HTML element.
     */
    static input(properties = {}, dataset = {}) {
        return this.create("input", properties, dataset);
    }
    /**
     * Creates a `span` element with the specified properties and dataset.
     * @param {Object} [properties={}] An object containing properties to assign to the element.
     * @param {Object} [dataset={}] An object containing dataset attributes to assign to the element.
     * @returns {HTMLSpanElement} The created HTML element.
     */
    static span(properties = {}, dataset = {}) {
        return this.create("span", properties, dataset);
    }
}

/**
 * Class that allows the subscription and publication of grid related events.
 * @class
 */
class GridEvents {
    #events;

    constructor() {
        this.#events = {};
    }

    #guard(eventName) {
        if (!this.#events) return false;

        return (this.#events[eventName]);
    }
    /**
     * Adds an event to publisher collection.
     * @param {string} eventName Event name.
     * @param {Function} handler Callback function.
     * @param {boolean} [isAsync=false] True if callback should execute with await operation.
     * @param {number} [priority=0] Order in which event should be executed.
     */
    subscribe(eventName, handler, isAsync = false, priority = 0) {
        if (!this.#events[eventName]) {
            this.#events[eventName] = [{ handler, priority, isAsync }];
            return;
        }
        
        this.#events[eventName].push({ handler, priority, isAsync });
        this.#events[eventName].sort((a, b) => {
            return a.priority - b.priority;
        });
    }
    /**
     * Removes the target event from the publication chain.
     * @param {string} eventName Event name.
     * @param {Function} handler Event handler.
     */
    unsubscribe(eventName, handler) {
        if (!this.#guard(eventName)) return;

        this.#events[eventName] = this.#events[eventName].filter(h => h !== handler);
    }
    /**
     * Takes the result of each subscriber's callback function and chains them into one result.
     * Used to create a list of parameters from multiple modules: i.e. sort, filter, and paging inputs.
     * @param {string} eventName event name
     * @param {Object} [initialValue={}] initial value
     * @returns {Object}
     */
    chain(eventName, initialValue = {}) {
        if (!this.#guard(eventName)) return;

        let result = initialValue;

        this.#events[eventName].forEach((h) => {
            result = h.handler(result);
        });

        return result;
    }
    /**
     * Trigger callback function for subscribers of the `eventName`.
     * @param {string} eventName Event name.
     * @param  {...any} args Arguments.
     */
    async trigger(eventName, ...args) {
        if (!this.#guard(eventName)) return;

        for (let h of this.#events[eventName]) {
            if (h.isAsync) {
                await h.handler(...args);
            } else {
                h.handler(...args);
            }
        }
    }
}

/**
 * Class to manage the table element and its rows and cells.
 */
class Table {
    #rowCount;
    /**
     * Create `Table` class to manage the table element and its rows and cells.
     * @param {GridContext} context Grid context.
     */
    constructor(context) {
        this.context = context;
        this.table = document.createElement("table");
        this.thead = document.createElement("thead");
        this.tbody = document.createElement("tbody");
        this.#rowCount = 0;

        this.table.id = `${context.settings.baseIdName}_table`;
        this.table.append(this.thead, this.tbody);
        this.table.className = context.settings.tableCss;
    }
    /**
     * Initializes the table header row element by creating a row and appending each column's header cell.
     */
    initializeHeader() {
        const tr = document.createElement("tr");

        for (const column of this.context.columnManager.columns) {
            tr.appendChild(column.headerCell.element);
        }

        this.thead.appendChild(tr);
    }
    /**
     * Render table body rows.  Will remove any prior table body results and build new rows and cells.
     * @param {Array<Object>} dataset Data set to build table rows.
     * @param {number | null} [rowCount=null] Set the row count parameter to a specific value if 
     * remote processing is being used, otherwise will use the length of the dataset.
     */
    renderRows(dataset, rowCount = null) {
        //Clear body of previous data.
        this.tbody.replaceChildren();
        
        if (!Array.isArray(dataset)) {
            this.#rowCount = 0;
            return;
        }

        this.#rowCount = rowCount ?? dataset.length;

        for (const data of dataset) {
            const tr = document.createElement("tr");

            for (let column of this.context.columnManager.columns) {
                const cell = new Cell(data, column, this.context.modules, tr);

                tr.appendChild(cell.element);
            }

            this.tbody.appendChild(tr);
        }
    }

    get rowCount() {
        return this.#rowCount;
    }
}

/**
 * Provides the context for the grid, including settings, data, and modules.  This class is responsible for managing 
 * the grid's core state and behavior.
 */
class GridContext {
    /**
     * Create grid context, which represents the core logic and functionality of the data grid.
     * @param {Array<object>} columns Column definition.
     * @param {SettingsGrid} settings Grid settings.
     * @param {any[]} [data=[]] Grid data.
     */
    constructor(columns, settings, data = []) {
        this.settings = settings;
        this.events = new GridEvents();
        this.pipeline = new DataPipeline(this.settings);
        this.dataloader = new DataLoader(this.settings);
        this.persistence = new DataPersistence(data);
        this.columnManager = new ColumnManager(columns, this.settings);
        this.grid = new Table(this);
        this.modules = {};
    }
}

/**
 * Provides logic to convert grid data into a downloadable CSV file.
 * Module will provide limited formatting of data.  Only columns with a formatter type 
 * of `module` or `function` will be processed.  All other columns will be returned as
 * their raw data type.  If a column's value contains a comma, the value will be double quoted.
 */
class CsvModule {
    /**
     * Allows grid's data to be converted into a downloadable CSV file.  If grid is 
     * set to a local data source, the data cache in the persistence class is used.
     * Otherwise, class will make an Ajax call to remote target set in data loader
     * class.
     * @param {GridContext} context Grid context class.
     */
    constructor(context) {
        this.context = context;
        this.delimiter = ",";
        this.button = context.settings.csvExportId;
        this.dataUrl = context.settings.csvExportRemoteSource;
    }

    initialize() {
        const btn = document.getElementById(this.button);
        
        btn.addEventListener("click", this.handleDownload);
    }

    handleDownload = async () => {
        let csvData = [];
        const fileName = `${document.title}.csv`;

        if (this.dataUrl) {
            const data = await this.context.dataloader.requestData(this.dataUrl);

            csvData = this.buildFileContent(data).join("\r\n");
        } else {
            csvData = this.buildFileContent(this.context.persistence.dataCache).join("\r\n");
        }

        const blob = new Blob([csvData], { type: "text/csv;charset=utf-8;" });
        const element = document.createElement("a");

        element.setAttribute("href", window.URL.createObjectURL(blob));
        //set file title
        element.setAttribute("download", fileName);
        //trigger download
        element.style.display = "none";
        document.body.appendChild(element);
        element.click();
        //remove temporary link element
        document.body.removeChild(element);

        window.alert(`Downloaded ${fileName}`);
    };
    /**
     * Returns an object that represents the columns and header names that should be used
     * to create the CSV results.  Will exclude columns with a type of `icon`.
     * @param {Object} columnMgrColumns Column Manager Columns collection.
     * @returns {{ headers: Array<string>, columns: Array<Column> }}
     */
    identifyColumns(columnMgrColumns) {
        const headers = [];
        const columns = [];

        for (const column of columnMgrColumns) {
            if (column.type === "icon") continue;

            headers.push(column.label);
            columns.push(column);
        }

        return { headers: headers, columns: columns }; 
    }
    /**
     * Converts grid data in DataPersistence class into a single dimensional array of
     * string delimited values that represents a row of data in a csv file. 
     * @param {Array<Object>} dataset data set to build csv rows.
     * @returns {Array<string>}
     */
    buildFileContent(dataset) {
        const fileContents = [];
        const columns = this.identifyColumns(this.context.columnManager.columns);
        //create delimited header.
        fileContents.push(columns.headers.join(this.delimiter));
        //create row data
        for (const rowData of dataset) {
            const result = columns.columns.map((c) => this.formatValue(c, rowData));

            fileContents.push(result.join(this.delimiter));
        }

        return fileContents;
    }
    /**
     * Returns a formatted string based on the Column's formatter setting.
     * Will double quote string if comma character is found in value.
     * @param {Column} column column model.
     * @param {Object} rowData row data.
     * @returns {string}
     */
    formatValue(column, rowData) {
        let value = String(rowData[column.field]);
        //apply limited formatting; csv results should be 'raw' data.
        if (column.formatter) {
            if (typeof column.formatter === "function") {
                value = String(column.formatter(rowData, column.formatterParams));
            } else if (column.formatter === "module") {
                value = String(this.context.modules[column.formatterParams.name].apply(rowData, column, "csv"));
            }
        }
        //check for strings that may need to be quoted.
        if (value.includes(",")) {
            value = `"${value}"`;
        }

        return value;
    }
}

CsvModule.moduleName = "csv";

/**
 * Create filter object that represents a element to filter between two values.  Creates a dropdown with a two input boxes 
 * to enter start and end values.
 */
class ElementBetween {
    /**
     * Create filter object that represents a between element.
     * @param {Column} column Column class object.
     * @param {GridContext} context Grid context object.
     */
    constructor(column, context) {
        this.context = context;
        this.element = ElementHelper.div({ name: column.field, className: CssHelper.multiSelect.parentClass });
        this.header = ElementHelper.div({ className: CssHelper.multiSelect.header });
        this.optionsContainer = ElementHelper.div({ className: CssHelper.multiSelect.options });
        this.field = column.field;
        this.fieldType = column.type;  //field value type.
        this.filterType = "between";  //condition type.

        this.element.id = `${this.context.settings.baseIdName}_${this.field}`;
        this.element.append(this.header, this.optionsContainer);
        this.header.id = `header_${this.context.settings.baseIdName}_${this.field}`;
        this.optionsContainer.style.minWidth = "185px";

        this.#templateBetween();
        this.header.addEventListener("click", this.handleClick);
    }

    #templateBetween() {
        this.elementStart = ElementHelper.input({ className: CssHelper.input, id: `start_${this.context.settings.baseIdName}_${this.field}` });

        this.elementEnd = ElementHelper.input({ className: CssHelper.input, id: `end_${this.context.settings.baseIdName}_${this.field}` });
        this.elementEnd.style.marginBottom = "10px";

        const start = ElementHelper.span({ innerText: "Start", className: CssHelper.betweenLabel });
        const end =  ElementHelper.span({ innerText: "End", className: CssHelper.betweenLabel });
 
        const btnApply = ElementHelper.create("button", { innerText: "Apply", className: CssHelper.betweenButton });
        btnApply.style.marginRight = "10px";
        btnApply.addEventListener("click", this.handlerClick);

        const btnClear = ElementHelper.create("button", { innerText: "Clear", className: CssHelper.betweenButton });
        btnClear.addEventListener("click", this.handleButtonClear);

        this.optionsContainer.append(start, this.elementStart, end, this.elementEnd, btnApply, btnClear);
    }

    handleButtonClear = () => {
        this.elementStart.value = "";
        this.elementEnd.value = "";

        if (this.countLabel !== undefined) {
            this.countLabel.remove();
            this.countLabel = undefined;
        }
    };

    createCountLabel = () => {
        //update count label.
        if (this.countLabel === undefined) {
            this.countLabel = document.createElement("span");
            this.countLabel.className = CssHelper.multiSelect.headerOption;
            this.header.append(this.countLabel);
        }

        if (this.elementStart.value !== "" && this.elementEnd.value !== "") {
            this.countLabel.innerText = `${this.elementStart.value} to ${this.elementEnd.value}`;
        } else {
            this.countLabel.remove();
            this.countLabel = undefined;
        }
    };

    handleClick = async () => {
        const status = this.header.classList.toggle(CssHelper.multiSelect.headerActive);

        if (!status) {
            //Close window and apply filter value.
            this.createCountLabel();
            await this.context.events.trigger("render");
            document.removeEventListener("click", this.handleDocument);
        } else {
            document.addEventListener("click", this.handleDocument);
        }
    };
    /**
     * Handler event to close dropdown when user clicks outside the multi-select control.  Event is removed when multi-select is 
     * not active so that it's not firing on redundant events.
     * @param {Object} e Object that triggered event.
     */
    handleDocument = async (e) => {
        if (!e.target.closest(`.${CssHelper.input}`) && !e.target.closest(`#${this.header.id}`)) {
            this.header.classList.remove(CssHelper.multiSelect.headerActive);

            await this.context.events.trigger("render");

            document.removeEventListener("click", this.handleDocument);
        }
    };
    /**
     * Returns an array of the start and end values from input source.  If either input source is empty, an empty string will be returned.
     * @returns {Array | string} Array of start and end values or empty string.
     */
    get value() {
        if (this.elementStart.value === "" || this.elementEnd.value === "") return "";

        return [this.elementStart.value, this.elementEnd.value];
    }
}

/**
 * Represents a columns filter control.  Creates a `HTMLInputElement` that is added to the header row of 
 * the grid to filter data specific to its defined column. 
 */
class ElementInput {
    /**
     * Create filter object that represents a `HTMLSelectElement` element in the table's header row.
     * @param {Column} column Column class object.
     * @param {GridContext} context Grid context.
    */
    constructor(column, context) {
        this.element = document.createElement("input");
        this.context = context;
        this.field = column.field;
        this.fieldType = column.type;  //field value type.
        this.filterType = column.filterType;  //condition type.
        this.filterIsFunction = (typeof column?.filterType === "function");
        this.filterParams = column.filterParams;
        this.element.name = this.field;
        this.element.id = this.field;
        this.element.addEventListener("change", async () => await this.context.events.trigger("render"));

        if (column.filterCss) {
            this.element.className = column.filterCss;
        }

        if (!this.context.settings.remoteProcessing && column.filterRealTime) {
            this.realTimeTimeout = (typeof this.filterRealTime === "number") 
                ? this.filterRealTime 
                : 500;

            this.element.addEventListener("keyup", this.handleLiveFilter);
        }
    }

    handleLiveFilter = async () => {
        setTimeout(async () => await this.context.events.trigger("render"), this.realTimeTimeout);
    };
    /**
     * Returns the value of the input element.  Will return a string value.
     * @returns {string}
     */
    get value() {
        return this.element.value;
    }
}

/**
 * Represents a columns filter control.  Creates a `HTMLSelectElement` that is added to the header row of the grid to filter data 
 * specific to its defined column.  If `filterValuesRemoteSource` is defined, the select options will be populated by the data returned 
 * from the remote source by registering to the grid pipeline's `init` and `refresh` events.
 */
class ElementSelect {
    /**
     * Create filter object that represents a `HTMLSelectElement` element in the table's header row.
     * @param {Column} column Column class object.
     * @param {GridContext} context Grid context. 
     */
    constructor(column, context) {
        this.element = ElementHelper.create("select", { name: column.field });
        this.field = column.field;
        this.fieldType = column.type;  //field value type.
        this.filterType = column.filterType;  //condition type.
        this.filterIsFunction = (typeof column?.filterType === "function");
        this.filterParams = column.filterParams;
        this.pipeline = context.pipeline;
        this.context = context;

        this.element.id = `${column.settings.baseIdName}_${this.field}`;
        this.element.addEventListener("change", async () => await this.context.events.trigger("render"));

        if (column.filterCss) {
            this.element.className = column.filterCss;
        }

        if (column.filterValuesRemoteSource) {
            //set up pipeline to retrieve option data when init pipeline is called.
            this.pipeline.addStep("init", this.createSelectOptions, column.filterValuesRemoteSource);
            this.pipeline.addStep("refresh", this.refreshSelectOptions, column.filterValuesRemoteSource);
            return;
        } 
        //use user supplied values to create select options.
        const opts = Array.isArray(column.filterValues) 
            ? column.filterValues
            : Object.entries(column.filterValues).map(([key, value]) => ({ value: key, text: value}));

        this.createSelectOptions(opts);
    }
    /**
     * Builds option elements for class's `select` input.  Expects an array of objects with key/value pairs of:
     *  * `value`: option value.  should be a primary key type value with no blank spaces.
     *  * `text`: option text value
     * @param {Array<object>} data key/value array of values.
     */
    createSelectOptions = (data) => {
        const first = ElementHelper.create("option", { value: "", text: "Select all" });

        this.element.append(first);

        for (const item of data) {
            const option = ElementHelper.create("option", { value: item.value, text: item.text });

            this.element.append(option);
        }
    };
    /**
     * Replaces/updates option elements for class's `select` input.  Will persist the current select value, if any.  
     * Expects an array of objects with key/value pairs of:
     *  * `value`: Option value.  Should be a primary key type value with no blank spaces.
     *  * `text`: Option text.
     * @param {Array<object>} data key/value array of values.
     */
    refreshSelectOptions = (data) => {
        const selectedValue = this.element.value;

        this.element.replaceChildren();
        this.createSelectOptions(data);
        this.element.value = selectedValue;
    };

    get value() {
        return this.element.value;
    }
}

/**
 * Create filter object that represents a multi-select element.  Creates a dropdown with a list of options that can be 
 * selected or deselected.  If `filterValuesRemoteSource` is defined, the select options will be populated by the data returned 
 * from the remote source by registering to  the grid pipeline's `init` and `refresh` events.
 */
class ElementMultiSelect {
    /**
     * Create filter object that represents a multi-select element.
     * @param {Column} column Column class object.
     * @param {GridContext} context Grid context object.
     */
    constructor(column, context) {
        this.context = context;
        this.element = ElementHelper.div({ name: column.field, className: CssHelper.multiSelect.parentClass });
        this.header = ElementHelper.div({ className: CssHelper.multiSelect.header });
        this.optionsContainer = ElementHelper.div({ className: CssHelper.multiSelect.options });
        this.field = column.field;
        this.fieldType = column.type;  //field value type.
        this.filterType = "in";  //condition type.
        this.filterIsFunction = (typeof column?.filterType === "function");
        this.filterParams = column.filterParams;
        this.listAll = false;
        this.selectedValues = [];

        if (typeof column.filterMultiSelect === "object") {
            this.listAll = column.filterMultiSelect.listAll;
        }

        this.header.id = `header_${this.context.settings.baseIdName}_${this.field}`;
        this.element.id = `${this.context.settings.baseIdName}_${this.field}`;
        this.element.append(this.header, this.optionsContainer);

        if (column.filterValuesRemoteSource) {
            //set up pipeline to retrieve option data when init pipeline is called.
            this.context.pipeline.addStep("init", this.templateContainer, column.filterValuesRemoteSource);
            this.context.pipeline.addStep("refresh", this.refreshSelectOptions, column.filterValuesRemoteSource);
        } else {
            //use user supplied values to create select options.
            const data = Array.isArray(column.filterValues) 
                ? column.filterValues
                : Object.entries(column.filterValues).map(([key, value]) => ({ value: key, text: value}));

            this.templateContainer(data);
        }

        this.header.addEventListener("click", this.handleClick);
    }

    handleClick = async () => {
        const status = this.header.classList.toggle(CssHelper.multiSelect.headerActive);

        if (!status) {
            await this.context.events.trigger("render");
            document.removeEventListener("click", this.handleDocument);
        } else {
            document.addEventListener("click", this.handleDocument);
        }
    };
    /**
     * Handler event to close dropdown when user clicks outside the multi-select control.  Event is removed when multi-select 
     * is not active so that it's not firing on redundant events.
     * @param {Object} e Object that triggered event.
     */
    handleDocument = async (e) => {
        if (!e.target.closest("." + CssHelper.multiSelect.option) && !e.target.closest(`#${this.header.id}`)) {
            this.header.classList.remove(CssHelper.multiSelect.headerActive);

            await this.context.events.trigger("render");

            document.removeEventListener("click", this.handleDocument);
        }
    };
    /**
     * Creates a count label that displays the number of selected items in the multi-select control.
     */
    createCountLabel = () => {
        //update count label.
        if (this.countLabel === undefined) {
            this.countLabel = document.createElement("span");
            this.countLabel.className = CssHelper.multiSelect.headerOption;
            this.header.append(this.countLabel);
        }

        if (this.selectedValues.length > 0) {
            this.countLabel.innerText = `${this.selectedValues.length} selected`;
        } else {
            this.countLabel.remove();
            this.countLabel = undefined;
        }
    };
    /**
     * Handle click event for each option in the multi-select control.  Toggles the selected state of the option and updates the 
     * header if `listAll` is `true`.
     * @param {Object} o Object that triggered the event.
     */
    handleOption = (o) => {
        if (!o.currentTarget.classList.contains(CssHelper.multiSelect.selected)) {
            //select item.
            o.currentTarget.classList.add(CssHelper.multiSelect.selected);
            o.currentTarget.dataset.selected = "true";
            
            this.selectedValues.push(o.currentTarget.dataset.value);

            if (this.listAll) {
                const span = ElementHelper.span({ className: CssHelper.multiSelect.headerOption, innerText: o.currentTarget.dataset.value }, { value: o.currentTarget.dataset.value });
                this.header.append(span);
            }
        } else {
            //deselect item.
            o.currentTarget.classList.remove(CssHelper.multiSelect.selected);
            o.currentTarget.dataset.selected = "false";

            this.selectedValues = this.selectedValues.filter(f => f !== o.currentTarget.dataset.value);

            if (this.listAll) {
                const item = this.header.querySelector(`[data-value='${o.currentTarget.dataset.value}']`);

                if (item !== null) {
                    item.remove();
                }
            }
        }

        if (this.listAll === false) {
            this.createCountLabel();
        }
    };
    /**
     * Helper function to create an option element for the multi-select control.
     * @param {Object} item key/value pair object that contains the value and text for the option.
     * @returns {HTMLDivElement} Returns a div element that represents the option in the multi-select control.
     */
    createOption(item) { 
        const option = ElementHelper.div({ className: CssHelper.multiSelect.option }, { value: item.value, selected: "false" });
        const radio = ElementHelper.span({ className: CssHelper.multiSelect.optionRadio });
        const text = ElementHelper.span({ className: CssHelper.multiSelect.optionText, innerHTML: item.text });

        option.addEventListener("click", this.handleOption);
        option.append(radio, text);

        return option;
    }

    templateContainer = (data) => {
        for (const item of data) {
            const option = this.createOption(item);
            this.optionsContainer.append(option);
        }
    };
    /**
     * Called when the grid pipeline's `refresh` event is triggered.  It clears the current options and
     * recreates them based on the data provided.  It also updates the selected values based on the current state of the options.
     * @param {Array} data Array of objects that represent the options to be displayed in the multi-select control.
     */
    refreshSelectOptions = (data) => {
        this.optionsContainer.replaceChildren();
        this.header.replaceChildren();
        this.countLabel = undefined;  //set to undefined so it can be recreated later.
        const newSelected = [];

        for (const item of data) {
            const option = this.createOption(item);
            //check if item is selected.
            if (this.selectedValues.includes(item.value)) {
                //select item.
                option.classList.add(CssHelper.multiSelect.selected);
                option.dataset.selected = "true";
                newSelected.push(item.value);

                if (this.listAll) {
                    const span = ElementHelper.span({ className: CssHelper.multiSelect.headerOption, innerText: item.value }, { value: item.value });
                    this.header.append(span);
                }
            }

            this.optionsContainer.append(option);
        }
        //set new selected values as items may have been removed on refresh.
        this.selectedValues = newSelected;

        if (this.listAll === false) {
            this.createCountLabel();
        }
    };

    get value() {
        return this.selectedValues;
    }
}

/**
 * Class that defines a single filter condition for a column.
 */
class FilterTarget {
    /**
     * Creates filter target object that defines a single filter condition.  Expects an object with the following properties:
     * * `value`: The value to filter against.  Expects that value matches the type of the field being filtered.  Should be null if 
     * value type cannot be converted to the field type.
     * * `field`: The field name of the column being filtered.  This is used to identify the column in the data set.
     * * `fieldType`: The type of field being filtered (e.g., "string", "number", "date", "object").  This is used to determine how to compare the value.
     * * `filterType`: The type of filter to apply (e.g., "equals", "like", "<", "<=", ">", ">=", "!=", "between", "in").
     * @param {{ value: (string | number | Date | Object | null), field: string, fieldType: string, filterType: string }} target 
     */
    constructor(target) {
        this.value = target.value;
        this.field = target.field;
        this.fieldType = target.fieldType || "string"; // Default to string if not provided
        this.filterType = target.filterType;
        this.filters = this.#init();
    }

    #init() {
        return {
            //equal to
            "equals": function(filterVal, rowVal) {
                return filterVal === rowVal;
            },
            //like
            "like": function(filterVal, rowVal) {
                if (rowVal === undefined || rowVal === null || rowVal === "") {
                    return false;
                }
        
                return String(rowVal).toLowerCase().indexOf(filterVal.toLowerCase()) > -1;
            },
            //less than
            "<": function(filterVal, rowVal) {
                return filterVal < rowVal;
            },
            //less than or equal to
            "<=": function(filterVal, rowVal) {
                return filterVal <= rowVal;
            },
            //greater than
            ">": function(filterVal, rowVal) {
                return filterVal > rowVal;
            },
            //greater than or equal to
            ">=": function(filterVal, rowVal) {
                return filterVal >= rowVal;
            },
            //not equal to
            "!=": function(filterVal, rowVal) {
                return rowVal !== filterVal;
            },
            // between.  expects filterVal to be an array of: [ {start value}, { end value } ] 
            "between": function(filterVal, rowVal) {
                return rowVal >= filterVal[0] && rowVal <= filterVal[1];
            },
            //in array.
            "in": function(filterVal, rowVal) {
                if (Array.isArray(filterVal)) {
                    return filterVal.length ? filterVal.indexOf(rowVal) > -1 : true;
                } else {
                    console.warn("Filter Error - filter value is not an array:", filterVal);
                    return false;
                }
            }
        };
    }
    /**
     * Executes an internal function to indicate if the current row values matches the filter criteria's value.  
     * @param {Object} rowVal Row column value.  Expects a value that matches the type identified by the column.
     * @param {Object<Array>} row Current data set row.
     * @returns {boolean} Returns true if row value matches filter value.  Otherwise, false indicating no match.
     */
    execute(rowVal, row) {
        return this.filters[this.filterType](this.value, rowVal);
    }
}

/**
 * Class that defines a single filter condition for a date column.
 */
class FilterDate {
    /**
     * Creates filter target object that defines a single filter condition for a date data type.  Expects an object with the following properties:
     * * `value`: The value to filter against.  Expects that value matches the type of the field being filtered.  Should be null if 
     * value type cannot be converted to the field type.
     * * `field`: The field name of the column being filtered.  This is used to identify the column in the data set.
     * * `filterType`: The type of filter to apply (e.g., "equals", "like", "<", "<=", ">", ">=", "!=", "between", "in").
     * @param {{ value: (Date | Array<Date>), field: string, filterType: string }} target 
     */
    constructor(target) {
        this.value = target.value;
        this.field = target.field;
        this.fieldType = "date";
        this.filterType = target.filterType;
        this.filters = this.#init();
    }
    /**
     * Returns a new date object for each date passed in, setting the time to midnight.  This is used to ensure that the date objects are not modified
     * when comparing dates in the filter functions, and to ensure that the time portion of the date does not affect the comparison.
     * @param {Date} date1 
     * @param {Date} date2 
     * @returns {Array<Date>} Returns an array of two date objects, each set to midnight of the respective date passed in.
     */
    cloneDates = (date1, date2) => { 
        const d1 = new Date(date1);
        const d2 = new Date(date2);

        d1.setHours(0, 0, 0, 0);
        d2.setHours(0, 0, 0, 0);
        
        return [d1, d2];
    };

    #init() { 
        return { 
            "equals": function(filterVal, rowVal) {
                return filterVal.getFullYear() === rowVal.getFullYear() && filterVal.getMonth() === rowVal.getMonth() && filterVal.getDate() === rowVal.getDate();
            },
            //less than
            "<": (filterVal, rowVal) => {
                const dates = this.cloneDates(filterVal, rowVal);
 
                return dates[0].getTime() < dates[1].getTime();
            },
            //less than or equal to
            "<=": (filterVal, rowVal) => {
                const dates = this.cloneDates(filterVal, rowVal);

                return dates[0].getTime() < dates[1].getTime();
            },
            //greater than
            ">": (filterVal, rowVal) => {
                const dates = this.cloneDates(filterVal, rowVal);

                return dates[0].getTime() > dates[1].getTime();
            },
            //greater than or equal to
            ">=": (filterVal, rowVal) => {
                const dates = this.cloneDates(filterVal, rowVal);

                return dates[0].getTime() >= dates[1].getTime();
            },
            //not equal to
            "!=": function(filterVal, rowVal) {
                return filterVal.getFullYear() !== rowVal.getFullYear() && filterVal.getMonth() !== rowVal.getMonth() && filterVal.getDate() !== rowVal.getDate();
            },
            // between.  expects filterVal to be an array of: [ {start value}, { end value } ] 
            "between": (filterVal, rowVal)  => {
                const filterDates = this.cloneDates(filterVal[0], filterVal[1]);
                const rowDates = this.cloneDates(rowVal, rowVal);

                return rowDates[0] >= filterDates[0] && rowDates[0] <= filterDates[1];
            }
        };
    }
    /**
     * Executes an internal function to indicate if the current row value matches the filter criteria's value.  
     * @param {Date} rowVal Row column value.  Expects a Date object.
     * @param {Object<Array>} row Current data set row.
     * @returns {boolean} Returns true if row value matches filter value.  Otherwise, false indicating no match.
     */
    execute(rowVal, row) {
        if (rowVal === null || !DateHelper.isDate(rowVal)) {
            return false; // If rowVal is null or not a date, return false.
        }

        return this.filters[this.filterType](this.value, rowVal);
    }
}

/**
 * Represents a concrete implementation of a filter that uses a user supplied function.
 */
class FilterFunction {
    /**
     * Creates a filter function instance.  Expects an object with the following properties:
     * * `value`: The value to filter against.  Does not need to match the type of the field being filtered.
     * * `field`: The field name of the column being filtered.  This is used to identify the column in the data set.
     * * `filterType`: The function to use for filtering.
     * * `params`: Optional parameters to pass to the filter function.
     * @param {{ value: Object, field: string, filterType: Function, params: Object }} target 
     */
    constructor(target) {
        this.value = target.value;
        this.field = target.field;
        this.filterFunction = target.filterType;
        this.params = target.params ?? {};
    }
    /**
     * Executes an user supplied function to indicate if the current row values matches the filter criteria's value.  
     * @param {Object} rowVal Row column value.  Expects a value that matches the type identified by the column.
     * @param {Object<Array>} row Current data set row.
     * @returns {boolean} Returns true if row value matches filter value.  Otherwise, false indicating no match.
     */
    execute(rowVal, row) {
        return this.filterFunction(this.value, rowVal, row, this.params);
    }
}

/**
 * Provides a means to filter data in the grid.  This module creates header filter controls for each column that has 
 * a `hasFilter` attribute set to `true`.
 * 
 * Class subscribes to the `render` event to update the filter control when the grid is rendered.  It also calls the chain 
 * event `remoteParams` to compile a list of parameters to be passed to the remote data source when using remote processing.
 */
class FilterModule {
    /**
     * Creates a new filter module object.
     * @param {GridContext} context Grid context.
     */
    constructor(context) {
        this.context = context;
        this.headerFilters = [];
        this.gridFilters = [];
    }

    initialize() {
        if (this.context.settings.remoteProcessing) {
            this.context.events.subscribe("remoteParams", this.remoteParams, true);
        } else {
            this.context.events.subscribe("render", this.renderLocal, false, 8);
        }

        this._init();
    }
    /**
     * Create `HeaderFilter` Class for grid columns with a `hasFilter` attribute of `true`.
     */
    _init() {
        for (const col of this.context.columnManager.columns) {
            if (!col.hasFilter) continue;

            if (col.filterElement === "multi") {
                col.headerFilter = new ElementMultiSelect(col, this.context);
            } else if (col.filterElement === "between") {
                col.headerFilter = new ElementBetween(col, this.context);
            } else if (col.filterElement === "select") {
                col.headerFilter = new ElementSelect(col, this.context);
            } else {
                col.headerFilter = new ElementInput(col, this.context);
            }

            col.headerCell.element.appendChild(col.headerFilter.element);
            this.headerFilters.push(col.headerFilter);
        }
    }
    /**
     * Compiles header and grid filter values into a single object of key/value pairs that can be used to send to the remote data source.
     * @param {Object} params Object of key/value pairs to be sent to the remote data source.
     * @returns {Object} Returns the modified params object with filter values added.
     */
    remoteParams = (params) => {
        this.headerFilters.forEach((f) => {
            if (f.value !== "") {
                params[f.field] = f.value;
            }
        });

        if (this.gridFilters.length > 0) {
            for (const item of this.gridFilters) {
                params[item.field] = item.value;
            }
        }

        return params;
    };
    /**
     * Convert value type to column type.  If value cannot be converted, `null` is returned.
     * @param {object | string | number} value Raw filter value.
     * @param {string} type Field type.
     * @returns {number | Date | string | null | Object} input value or `null` if empty.
     */
    convertToType(value, type) {
        if (value === "" || value === null) return value;

        if (Array.isArray(value)) {
            if (type === "date" || type === "datetime")  { 
                const result = value.map((v) => DateHelper.parseDate(v)); 

                return result.includes("") ? null : result;
            }

            if (type === "number") {
                const value1 = this.convertToType(value[0], type);
                const value2 = this.convertToType(value[1], type);  

                return value1 === null || value2 === null ? null : [value1, value2];
            }

            return value;
        }

        if (type === "number") {
            value = Number(value);
            return Number.isNaN(value) ? null : value;
        } 
        
        if (type === "date" || type === "datetime") {
            value = DateHelper.parseDateOnly(value);
            return value === "" ? null : value;
        } 
        //assuming it's a string value or Object at this point.
        return value;
    }
    /**
     * Wraps the filter input value in a `FilterTarget` object, which defines a single filter condition for a column.
     * @param {string | Date | number | Object} value Filter value to apply to the column.
     * @param {string} field The field name of the column being filtered. This is used to identify the column in the data set.
     * @param {string | Function} filterType The type of filter to apply (e.g., "equals", "like", "<", "<=", ">", ">=", "!=", "between", "in").
     * Can also be a function.
     * @param {string} fieldType The type of field being filtered (e.g., "string", "number", "date", "object").
     * @param {boolean} filterIsFunction Indicates if the filter type is a function.
     * @param {Object} filterParams Optional parameters to pass to the filter function.
     * @returns {FilterTarget | FilterDate | FilterFunction | null} Returns a filter target object that defines a single filter condition for a column, 
     * or null if the value cannot be converted to the field type. 
     */
    createFilterTarget(value, field, filterType, fieldType, filterIsFunction, filterParams) { 
        if (filterIsFunction) { 
            return new FilterFunction({ value: value, field: field, filterType: filterType, params: filterParams });
        }

        const convertedValue = this.convertToType(value, fieldType);

        if (convertedValue === null) return null;

        if (fieldType === "date" || fieldType === "datetime") {
            return new FilterDate({ value: convertedValue, field: field, filterType: filterType });
        }

        return new FilterTarget({ value: convertedValue, field: field, fieldType: fieldType, filterType: filterType });
    }
    /**
     * Compiles an array of filter type objects that contain a filter value that matches its column type.  Column type matching 
     * is necessary when processing data locally, so that filter value matches associated row type value for comparison.
     * @returns {Array} array of filter type objects with valid value.
     */
    compileFilters() {
        let results = [];

        for (const item of this.headerFilters) {
            if (item.value === "") continue;

            const filter = this.createFilterTarget(item.value, item.field, item.filterType, item.fieldType, item.filterIsFunction, item?.filterParams);

            if (filter !== null) {
                results.push(filter);
            }
        }

        if (this.gridFilters.length > 0) {
            results = results.concat(this.gridFilters);
        }

        return results;
    }
    /**
     * Use target filters to create a new data set in the persistence data provider.
     * @param {Array<FilterTarget>} targets Array of FilterTarget objects.
     */
    applyFilters(targets) {
        this.context.persistence.data = [];
        this.context.persistence.dataCache.forEach((row) => {
            let match = true;

            for (let item of targets) {
                const rowVal = this.convertToType(row[item.field], item.fieldType);
                const result = item.execute(rowVal, row);

                if (!result) {
                    match = false;
                }
            }

            if (match) {
                this.context.persistence.data.push(row);
            }
        });
    }
    /**
     * Renders the local data set by applying the compiled filters to the persistence data provider.
     */
    renderLocal = () => {
        const targets = this.compileFilters();

        if (Object.keys(targets).length > 0) {
            this.applyFilters(targets);
        } else {
            this.context.persistence.restoreData();
        }
    };
    /**
     * Provides a means to apply a condition outside the header filter controls.  Will add condition
     * to grid's `gridFilters` collection, and raise `render` event to filter data set.
     * @param {string} field field name.
     * @param {object} value value.
     * @param {string | Function} type condition type.
     * @param {string} [fieldType="string"] field type.
     * @param {object} [filterParams={}] additional filter parameters.
     */
    setFilter(field, value, type = "equals", fieldType = "string", filterParams = {}) {
        const convertedValue = this.convertToType(value, fieldType);

        if (this.gridFilters.length > 0) {
            const index = this.gridFilters.findIndex((i) => i.field === field);
            //If field already exists, just update the value.
            if (index > -1) {
                this.gridFilters[index].value = convertedValue;
                return;
            }
        }

        const filter = this.createFilterTarget(convertedValue, field, type, fieldType, (typeof type === "function"), filterParams);
        this.gridFilters.push(filter);
    }
    /**
     * Removes filter condition from grid's `gridFilters` collection.
     * @param {string} field field name.
     */
    removeFilter(field) {
        this.gridFilters = this.gridFilters.filter(f => f.field !== field);
    }
}

FilterModule.moduleName = "filter";

class PagerButtons {
    /**
     * Returns start button for pager element.
     * @param {number} currentPage Current page.
     * @param {Function} callback Button click handler.
     * @returns {HTMLLinkElement}
     */
    static start(currentPage, callback) {
        const li = document.createElement("li");
        const btn = document.createElement("button");

        li.append(btn);
        btn.innerHTML = "&lsaquo;";
        btn.addEventListener("click", callback);

        if (currentPage > 1) {
            btn.dataset.page = "1";
        } else {
            btn.tabIndex = -1;
            btn.disabled = true;
            li.className = "disabled";
        }

        return li;
    }
    /**
     * Returns end button for pager element.
     * @param {number} totalPages last page number in group set.
     * @param {number} currentPage current page.
     * @param {Function} callback button click handler.
     * @returns {HTMLLIElement}
     */
    static end(totalPages, currentPage, callback) {
        const li = document.createElement("li");
        const btn = document.createElement("button");

        li.append(btn);
        btn.innerHTML = "&rsaquo;";
        btn.addEventListener("click", callback);

        if (currentPage < totalPages) {
            btn.dataset.page = totalPages;
        } else {
            btn.tabIndex = -1;
            btn.disabled = true;
            li.className = "disabled";
        }

        return li;
    }
    /**
     * Returns pager button for associated page.
     * @param {number} page page number.
     * @param {number} currentPage current page.
     * @param {Function} callback button click handler.
     * @returns {HTMLLIElement}
     */
    static pageNumber(page, currentPage, callback) {
        const li = document.createElement("li");
        const btn = document.createElement("button");

        li.append(btn);
        btn.innerText = page;
        btn.dataset.page = page;
        btn.addEventListener("click", callback);

        if (page === currentPage) {
            li.className = "active";
        }

        return li;
    }
}

/**
 * Formats grid's rows as a series of pages rather that a scrolling list.  If paging is not desired, register the `RowModule` instead.
 * 
 * Class subscribes to the `render` event to update the pager control when the grid is rendered.  It also calls the chain event 
 * `remoteParams` to compile a list of parameters to be passed to the remote data source when using remote processing.
 */
class PagerModule {
    /**
     * Formats grid's rows as a series of pages rather that a scrolling list.  Module can be used with both local and remote data sources.  
     * @param {GridContext} context Grid context.
     */
    constructor(context) {
        this.context = context;
        this.totalRows = this.context.persistence.rowCount;
        this.pagesToDisplay = this.context.settings.pagerPagesToDisplay;
        this.rowsPerPage = this.context.settings.pagerRowsPerPage;
        this.currentPage = 1;
        //create div container for pager
        this.container = document.createElement("div");
        this.elPager = document.createElement("ul");

        this.container.id = `${this.context.settings.baseIdName}_pager`;
        this.container.className = this.context.settings.pagerCss;
        this.container.append(this.elPager);
        this.context.grid.table.insertAdjacentElement("afterend", this.container);
    }
    /**
     * Sets handler events for rendering/updating grid body rows and pager control.
     */
    initialize() {
        if (this.context.settings.remoteProcessing) {
            this.context.events.subscribe("render", this.renderRemote, true, 10);
        } else {
            this.context.events.subscribe("render", this.renderLocal, false, 10);
        }
    }
    /**
     * Returns the total number of possible pages based on the total rows, and rows per page setting.
     * @returns {Number}
     */
    totalPages() {
        const totalRows = isNaN(this.totalRows) ? 1 : this.totalRows;

        return this.rowsPerPage === 0 ? 1 : Math.ceil(totalRows / this.rowsPerPage);
    }
    /**
     * Returns a validated page number input by making sure value is numeric, and within the bounds of the total pages.  
     * An invalid input will return a value of 1.
     * @param {string | number} currentPage Page number to validate.
     * @returns {Number} Returns a valid page number between 1 and the total number of pages.  If the input is invalid, returns 1.
     */
    validatePage(currentPage) {
        if (!Number.isInteger(currentPage)) {
            currentPage = parseInt(currentPage);
        }

        const total = this.totalPages();
        const result = total < currentPage ? total : currentPage;

        return result <= 0 ? 1 : result;
    }
    /**
     * Returns the first page number to display in the button control set based on the page number position in the dataset.  
     * Page numbers outside of this range are represented by an arrow.
     * @param {Number} currentPage Current page number.
     * @returns {Number}
     */
    firstDisplayPage(currentPage) {
        const middle = Math.floor(this.pagesToDisplay / 2 + this.pagesToDisplay % 2);

        if (currentPage < middle) return 1;

        if (this.totalPages() < (currentPage + this.pagesToDisplay - middle)) {
            return Math.max(this.totalPages() - this.pagesToDisplay + 1, 1);
        }

        return currentPage - middle + 1;
    }
    /**
     * Creates the html list item and button elements for the pager container's ul element.  Will also set the 
     * `this.currentPage` property to the current page number.
     * @param {Number} currentPage Current page number.  Assumes a valid page number is provided.
     * @param {Function} callback Button click handler.
     */
    render(currentPage, callback) {
        const totalPages = this.totalPages();
        // Clear the prior li elements.
        this.elPager.replaceChildren();

        if (totalPages <= 1) return;
        
        const firstDisplay = this.firstDisplayPage(currentPage);
        const maxPages = firstDisplay + this.pagesToDisplay;
        
        this.currentPage = currentPage;
        this.elPager.appendChild(PagerButtons.start(currentPage, callback));

        for (let page = firstDisplay; page <= totalPages && page < maxPages; page++) {
            this.elPager.appendChild(PagerButtons.pageNumber(page, currentPage, callback));
        }

        this.elPager.appendChild(PagerButtons.end(totalPages, currentPage, callback));
    }

    handlePaging = async (e) => {
        const validPage = { page: this.validatePage(e.currentTarget.dataset.page) };

        if (this.context.settings.remoteProcessing) {
            await this.renderRemote(validPage);
        } else {
            this.renderLocal(validPage);
        }
    };
    /**
     * Handler for rendering rows using local data source.  Will slice the data array based on the current page and rows per page settings,
     * then call `render` to update the pager control.  Optional argument `params` is an object that can contain the following properties:
     * * `page`:Page number to render.  If not provided, defaults to 1.
     * @param {{ page: number } | null} params 
     */
    renderLocal = (params = {}) => {
        const page = !params.page ? 1 : this.validatePage(params.page);
        const begin = (page - 1) * this.rowsPerPage;
        const end = begin + this.rowsPerPage;
        const data = this.context.persistence.data.slice(begin, end);

        this.context.grid.renderRows(data, this.context.persistence.rowCount);
        this.totalRows = this.context.persistence.rowCount;
        this.render(page, this.handlePaging);
    };
    /**
     * Handler for rendering rows using remote data source.  Will call the `dataloader` to request data based on the provided params,
     * then call `render` to update the pager control.  Optional argument `params` is an object that can contain the following properties:
     * * `page`: Page number to render.  If not provided, defaults to 1.
     * @param {{ page: number } | null} params 
     */
    renderRemote = async (params = {}) => {
        if (!params.page) params.page = 1;
        
        params = this.context.events.chain("remoteParams", params);

        const data = await this.context.dataloader.requestGridData(params);
        const rowCount = data.rowCount ?? 0;

        this.context.grid.renderRows(data.data, rowCount);
        this.totalRows = rowCount;
        this.render(params.page, this.handlePaging);
    };
}

PagerModule.moduleName = "pager";

/**
 * Will re-load the grid's data from its target source (local or remote).
 */
class RefreshModule {
    /**
     * Will apply event to target button that, when clicked, will re-load the 
     * grid's data from its target source (local or remote).
     * @param {GridContext} context Grid context class.
     */
    constructor(context) {
        this.context = context;
    }

    initialize() {
        if (!this.context.settings.remoteProcessing && this.context.settings.remoteUrl) {
            this.context.pipeline.addStep("refresh", this.context.persistence.setData);
        }

        const btn = document.getElementById(this.context.settings.refreshableId);
        
        btn.addEventListener("click", this.handleRefresh);
    }

    handleRefresh = async () => {
        if (this.context.pipeline.hasPipeline("refresh")) {
            await this.context.pipeline.execute("refresh");
        }

        await this.context.events.trigger("render");
    };
}

RefreshModule.moduleName = "refresh";

/**
 * Responsible for rendering the grids rows using either local or remote data.  This should be the default module to 
 * create row data if paging is not enabled.  Subscribes to the `render` event to create the grid's rows and the `remoteParams` 
 * event for remote processing.
 * 
 * Class will call the 'remoteParams' event to concatenate parameters for remote data requests.
 */
class RowModule {
    /**
     * Creates grid rows.  This should be the default module to create row data if paging is not enabled.
     * @param {GridContext} context Grid context class.
     */
    constructor(context) {
        this.context = context;
    }

    initialize() {
        if (this.context.settings.remoteProcessing) {
            this.context.events.subscribe("render", this.renderRemote, true, 10);
        } else {
            this.context.events.subscribe("render", this.renderLocal, false, 10);
        }
    }
    /**
     * Renders the grid rows using local data.  This is the default method to render rows when remote processing is not enabled.
     */
    renderLocal = () => {
        this.context.grid.renderRows(this.context.persistence.data);
    };
    /**
     * Renders the grid rows using remote data.  This method will call the `remoteParams` event to get the parameters for the remote request.
     */
    renderRemote = async () => {
        const params = this.context.events.chain("remoteParams", {});
        const data = await this.context.dataloader.requestGridData(params);

        this.context.grid.renderRows(data);
    };
}

RowModule.moduleName = "row";

/**
 * Updates target label with a count of rows in grid.
 */
class RowCountModule {
    /**
     * Updates target label supplied in settings with a count of rows in grid.
     * @param {GridContext} context Grid context class.
     */
    constructor(context) {
        this.context = context;
        this.element = document.getElementById(context.settings.rowCountId);
    }

    initialize() {
        this.context.events.subscribe("render", this.handleCount, false, 20);
    }

    handleCount = () => {
        this.element.innerText = this.context.grid.rowCount;
    };
}

RowCountModule.moduleName = "rowcount";

/**
 * Class to manage sorting functionality in a grid context.  For remote processing, will subscribe to the `remoteParams` event.
 * For local processing, will subscribe to the `render` event.
 * 
 * Class will trigger the `render` event after sorting is applied, allowing the grid to re-render with the sorted data.
 */
class SortModule {
    /**
     * Creates a new SortModule object.
     * @param {GridContext} context 
     */
    constructor(context) {
        this.context = context;
        this.headerCells = [];
        this.currentSortColumn = "";
        this.currentDirection = "";
        this.currentType = "";
    }

    initialize() {
        if (this.context.settings.remoteProcessing) {
            this.currentSortColumn = this.context.settings.remoteSortDefaultColumn;
            this.currentDirection = this.context.settings.remoteSortDefaultDirection;
            this.context.events.subscribe("remoteParams", this.remoteParams, true);
            this._init(this.handleRemote);
        } else {
            this.context.events.subscribe("render", this.renderLocal, false, 9);
            //this.sorters = { number: sortNumber, string: sortString, date: sortDate, datetime: sortDate };
            this.sorters = this.#setLocalFilters();
            this._init(this.handleLocal);
        }
    }

    _init(callback) {
        //bind listener for non-icon columns; add css sort tag.
        for (const col of this.context.columnManager.columns) {
            if (col.type !== "icon") {
                this.headerCells.push(col.headerCell);
                col.headerCell.span.classList.add("sort");
                col.headerCell.span.addEventListener("click", callback);
            }
        }
    }

    #setLocalFilters() {
        return {
            date: (a, b, direction) => {
                let comparison = 0;
                let dateA = new Date(a);
                let dateB = new Date(b);

                if (Number.isNaN(dateA.valueOf())) {
                    dateA = null;
                }

                if (Number.isNaN(dateB.valueOf())) {
                    dateB = null;
                }
                //handle empty values.
                if (!dateA) {
                    comparison = !dateB ? 0 : -1;
                } else if (!dateB) {
                    comparison = 1;
                } else if (dateA > dateB) {    
                    comparison = 1;
                } else if (dateA < dateB) {
                    comparison = -1;
                }

                return direction === "desc" ? (comparison * -1) : comparison;
            },
            number: (a, b, direction) => {
                let comparison = 0;

                if (a > b) {
                    comparison = 1;
                } else if (a < b) {
                    comparison = -1;
                }

                return direction === "desc" ? (comparison * -1) : comparison;
            }, 
            string: (a, b, direction) => {
                let comparison = 0;
                //handle empty values.
                if (!a) {
                    comparison = !b ? 0 : -1;
                } else if (!b) {
                    comparison = 1;
                } else {
                    const varA = a.toUpperCase();
                    const varB = b.toUpperCase();
                
                    if (varA > varB) {
                        comparison = 1;
                    } else if (varA < varB) {
                        comparison = -1;
                    }
                }

                return direction === "desc" ? (comparison * -1) : comparison;
            }
        };
    }

    remoteParams = (params) => {
        params.sort = this.currentSortColumn;
        params.direction = this.currentDirection;

        return params;
    };

    handleRemote = async (c) => {
        this.currentSortColumn = c.currentTarget.context.name;
        this.currentDirection = c.currentTarget.context.directionNext.valueOf();
        this.currentType = c.currentTarget.context.type;

        if (!c.currentTarget.context.isCurrentSort) {
            this.resetSort();
        }

        c.currentTarget.context.setSortFlag();

        await this.context.events.trigger("render");
    };

    resetSort() {
        const cell = this.headerCells.find(e => e.isCurrentSort);

        if (cell !== undefined) {
            cell.removeSortFlag();
        }
    }

    renderLocal = () => {
        if (!this.currentSortColumn) return;

        this.context.persistence.data.sort((a, b) => {
            return this.sorters[this.currentType](a[this.currentSortColumn], b[this.currentSortColumn], this.currentDirection);
        });
    };

    handleLocal = async (c) => {
        this.currentSortColumn = c.currentTarget.context.name;
        this.currentDirection = c.currentTarget.context.directionNext.valueOf();
        this.currentType = c.currentTarget.context.type;

        if (!c.currentTarget.context.isCurrentSort) {
            this.resetSort();
        }

        c.currentTarget.context.setSortFlag();

        await this.context.events.trigger("render");
    };
}

SortModule.moduleName = "sort";

/**
 * Creates grid's core properties and objects, and allows for registration of modules used to build functionality.
 * Use this class as a base class to create a grid with custom modular functionality using the `extends` class reference.
 */
class GridCore {
    #moduleTypes;
    #modulesCreated;
    /**
    * Creates grid's core properties and objects and identifies div element which grid will be built.  After instantiation, 
    * use the `addModules` method to register desired modules to complete the setup process.  Module registration is kept 
    * separate from constructor to allow customization of modules used to build grid.
    * @param {string} container div element ID to build grid in.
    * @param {object} settings User settings; key/value pairs.
    */
    constructor(container, settings) {
        const source = MergeOptions.merge(settings);

        this.settings = new SettingsGrid(source);
        this.container = document.getElementById(container);
        this.enablePaging = this.settings.enablePaging;
        this.isValid = true;
        this.#moduleTypes = [];
        this.#modulesCreated = false;
        this.modules = {};

        if (Object.values(source.columns).length === 0) {
            console.log("Missing required columns definition.");
            this.isValid = false;
        } else {
            const data = source.data ?? [];
            this.#init(source.columns, data);
        }
    }

    #init(columns, data) {
        this.context = new GridContext(columns, this.settings, data);

        this.container.append(this.context.grid.table);
    }
    /**
     * Register modules to be used in the building and operation of the grid.  
     * 
     * NOTE: This method should be called before the `init()` method.
     * @param {class} modules Class module(s).
     */
    addModules(...modules) {
        modules.forEach((m) => this.#moduleTypes.push(m));
    }
    /**
     * Adds a new column to the grid.  The column will be added to the end of the columns collection by default, but can 
     * be inserted at a specific index.  
     * 
     * NOTE: This method should be called before the `init()` method.
     * @param {Object} column Column object definition.
     * @param {number} [indexPosition=null] Index to insert the column at. If null, appends to the end.
     */
    addColumn(column, indexPosition = null) {
        this.context.columnManager.addColumn(column, indexPosition);
    }
    /**
     * Iterates though a list of modules to instantiate and initialize start up and/or build behavior.  Should be called after 
     * all modules have been registered using the `addModules` method, and only needs to be called once.
     */
    #initModules = async () => {
        if (this.#modulesCreated)
            return;

        //Verify if base required row related module has been added to the grid.
        if (this.settings.enablePaging && !this.#moduleTypes.some((x) => x.moduleName === "page")) {
            this.#moduleTypes.push(PagerModule);
        } else if (!this.#moduleTypes.some((x) => x.moduleName === "row")) {
             this.#moduleTypes.push(RowModule);
        }

        this.#moduleTypes.forEach((m) => {
            this.context.modules[m.moduleName] = new m(this.context);
            this.context.modules[m.moduleName].initialize();
        });

        this.#modulesCreated = true;
        await this.context.events.trigger("postInitMod");
    };
    /**
     * Instantiates the creation of the grid.  Method will create the grid's elements, run all registered modules, data processing 
     * pipelines and events.  If grid is being built using the modular approach, be sure to call the `addModules` method before 
     * calling this one to ensure all modules are registered and initialized in their proper order.
     * 
     * NOTE: Method will automatically register the `PagerModule` if paging is enabled, or the `RowModule` if paging is not enabled.
     */
    async init() {
        if (!this.isValid) {
            console.log("Missing required columns definition.");
            return;
        }

        this.context.grid.initializeHeader();

        await this.#initModules();

        if (!this.settings.remoteProcessing && this.settings.remoteUrl) {
            //local data source processing; set pipeline actions.
            this.context.pipeline.addStep("init", this.context.persistence.setData);
        }
        //execute data pipeline before building elements.
        if (this.context.pipeline.hasPipeline("init")) {
            await this.context.pipeline.execute("init");
        }

        await this.context.events.trigger("render");
    }
    /**
     * Apply filter condition for target column.  Method provides a means to apply condition outside of header filter controls.
     * @param {string} field Target field.
     * @param {object} value Filter value.
     * @param {string | Function} [type="equals"] Filter type.  If a function is provided, it will be used as the filter condition.
     * Otherwise, use the associated string value type to determine the filter condition.  i.e. "equals", "contains", etc.
     * @param {string} [fieldType="string"] Field type.
     * @param {object} [filterParams={}] Additional filter parameters.
     */
    setFilter = async (field, value, type = "equals", fieldType = "string", filterParams = {}) => {
        if (this.context.modules.filter) {
            this.context.modules.filter.setFilter(field, value, type, fieldType, filterParams);

            await this.context.events.trigger("render");
        } else {
            console.warn("Filter module is not enabled.  Set `DataGrid.defaultOptions.enableFilter` to true in order to enable this function.");
        }
    };
    /**
     * Remove filter condition for target field.
     * @param {string} field Target field.
     */
    removeFilter = async (field) => {
        if (this.context.modules.filter) {
            this.context.modules.filter.removeFilter(field);

            await this.context.events.trigger("render");
        } else {
            console.warn("Filter module is not enabled.  Set `DataGrid.defaultOptions.enableFilter` to true in order to enable this function.");
        }
    };
}

class DataGrid extends GridCore {
    constructor(container, settings) {
        super(container, settings);

        if (DataGrid.defaultOptions.enableFilter) {
            this.addModules(FilterModule);
        }

        if (DataGrid.defaultOptions.enableSort) {
            this.addModules(SortModule);
        }

        if (this.settings.rowCountId) {
            this.addModules(RowCountModule);
        }

        if (this.settings.refreshableId) {
            this.addModules(RefreshModule);
        }

        if (this.settings.csvExportId) {
            this.addModules(CsvModule);
        }
    }
}

DataGrid.defaultOptions = {
    enableSort: true,
    enableFilter: true
};

export { Cell, Column, ColumnManager, CssHelper, CsvModule, DataGrid, DataLoader, DataPersistence, DataPipeline, DateHelper, ElementBetween, ElementHelper, ElementInput, ElementMultiSelect, ElementSelect, FilterModule, FormatDateTime, FormatLink, FormatNumeric, FormatStar, GridContext, GridCore, GridEvents, HeaderCell, MergeOptions, PagerButtons, PagerModule, RefreshModule, RowCountModule, RowModule, SettingsGrid, SortModule, Table, settingsDefaults as settingsDefault };
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGF0YWdyaWRfZW1zLmpzIiwic291cmNlcyI6WyIuLi9zcmMvY29tcG9uZW50cy9oZWxwZXJzL2RhdGVIZWxwZXIuanMiLCIuLi9zcmMvY29tcG9uZW50cy9jZWxsL2Zvcm1hdHRlcnMvZGF0ZXRpbWUuanMiLCIuLi9zcmMvY29tcG9uZW50cy9jZWxsL2Zvcm1hdHRlcnMvbGluay5qcyIsIi4uL3NyYy9jb21wb25lbnRzL2NlbGwvZm9ybWF0dGVycy9udW1lcmljLmpzIiwiLi4vc3JjL2NvbXBvbmVudHMvY2VsbC9mb3JtYXR0ZXJzL3N0YXIuanMiLCIuLi9zcmMvY29tcG9uZW50cy9oZWxwZXJzL2Nzc0hlbHBlci5qcyIsIi4uL3NyYy9jb21wb25lbnRzL2NlbGwvY2VsbC5qcyIsIi4uL3NyYy9jb21wb25lbnRzL2NlbGwvaGVhZGVyQ2VsbC5qcyIsIi4uL3NyYy9jb21wb25lbnRzL2NvbHVtbi9jb2x1bW4uanMiLCIuLi9zcmMvY29tcG9uZW50cy9jb2x1bW4vY29sdW1uTWFuYWdlci5qcyIsIi4uL3NyYy9zZXR0aW5ncy9zZXR0aW5nc0RlZmF1bHQuanMiLCIuLi9zcmMvc2V0dGluZ3MvbWVyZ2VPcHRpb25zLmpzIiwiLi4vc3JjL3NldHRpbmdzL3NldHRpbmdzR3JpZC5qcyIsIi4uL3NyYy9jb21wb25lbnRzL2RhdGEvZGF0YUxvYWRlci5qcyIsIi4uL3NyYy9jb21wb25lbnRzL2RhdGEvZGF0YVBlcnNpc3RlbmNlLmpzIiwiLi4vc3JjL2NvbXBvbmVudHMvZGF0YS9kYXRhUGlwZWxpbmUuanMiLCIuLi9zcmMvY29tcG9uZW50cy9oZWxwZXJzL2VsZW1lbnRIZWxwZXIuanMiLCIuLi9zcmMvY29tcG9uZW50cy9ldmVudHMvZ3JpZEV2ZW50cy5qcyIsIi4uL3NyYy9jb21wb25lbnRzL3RhYmxlL3RhYmxlLmpzIiwiLi4vc3JjL2NvbXBvbmVudHMvY29udGV4dC9ncmlkQ29udGV4dC5qcyIsIi4uL3NyYy9tb2R1bGVzL2Rvd25sb2FkL2Nzdk1vZHVsZS5qcyIsIi4uL3NyYy9tb2R1bGVzL2ZpbHRlci9lbGVtZW50cy9lbGVtZW50QmV0d2Vlbi5qcyIsIi4uL3NyYy9tb2R1bGVzL2ZpbHRlci9lbGVtZW50cy9lbGVtZW50SW5wdXQuanMiLCIuLi9zcmMvbW9kdWxlcy9maWx0ZXIvZWxlbWVudHMvZWxlbWVudFNlbGVjdC5qcyIsIi4uL3NyYy9tb2R1bGVzL2ZpbHRlci9lbGVtZW50cy9lbGVtZW50TXVsdGlTZWxlY3QuanMiLCIuLi9zcmMvbW9kdWxlcy9maWx0ZXIvdHlwZXMvZmlsdGVyVGFyZ2V0LmpzIiwiLi4vc3JjL21vZHVsZXMvZmlsdGVyL3R5cGVzL2ZpbHRlckRhdGUuanMiLCIuLi9zcmMvbW9kdWxlcy9maWx0ZXIvdHlwZXMvZmlsdGVyRnVuY3Rpb24uanMiLCIuLi9zcmMvbW9kdWxlcy9maWx0ZXIvZmlsdGVyTW9kdWxlLmpzIiwiLi4vc3JjL21vZHVsZXMvcGFnZXIvcGFnZXJCdXR0b25zLmpzIiwiLi4vc3JjL21vZHVsZXMvcGFnZXIvcGFnZXJNb2R1bGUuanMiLCIuLi9zcmMvbW9kdWxlcy9yZWZyZXNoL3JlZnJlc2hNb2R1bGUuanMiLCIuLi9zcmMvbW9kdWxlcy9yb3cvcm93TW9kdWxlLmpzIiwiLi4vc3JjL21vZHVsZXMvcm93L3Jvd0NvdW50TW9kdWxlLmpzIiwiLi4vc3JjL21vZHVsZXMvc29ydC9zb3J0TW9kdWxlLmpzIiwiLi4vc3JjL2NvcmUvZ3JpZENvcmUuanMiLCIuLi9zcmMvZGF0YWdyaWQuanMiXSwic291cmNlc0NvbnRlbnQiOlsiY2xhc3MgRGF0ZUhlbHBlciB7XG4gICAgc3RhdGljIHRpbWVSZUdleCA9IG5ldyBSZWdFeHAoXCJbMC05XTpbMC05XVwiKTtcbiAgICAvKipcbiAgICAgKiBDb252ZXJ0IHN0cmluZyB0byBEYXRlIG9iamVjdCB0eXBlLiAgRXhwZWN0cyBzdHJpbmcgZm9ybWF0IG9mIHllYXItbW9udGgtZGF5LlxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSB2YWx1ZSBTdHJpbmcgZGF0ZSB3aXRoIGZvcm1hdCBvZiB5ZWFyLW1vbnRoLWRheS5cbiAgICAgKiBAcmV0dXJucyB7RGF0ZSB8IHN0cmluZ30gRGF0ZSBpZiBjb252ZXJzaW9uIGlzIHN1Y2Nlc3NmdWwuICBPdGhlcndpc2UsIGVtcHR5IHN0cmluZy5cbiAgICAgKi9cbiAgICBzdGF0aWMgcGFyc2VEYXRlKHZhbHVlKSB7XG4gICAgICAgIC8vQ2hlY2sgaWYgc3RyaW5nIGlzIGRhdGUgb25seSBieSBsb29raW5nIGZvciBtaXNzaW5nIHRpbWUgY29tcG9uZW50LiAgXG4gICAgICAgIC8vSWYgbWlzc2luZywgYWRkIGl0IHNvIGRhdGUgaXMgaW50ZXJwcmV0ZWQgYXMgbG9jYWwgdGltZS5cbiAgICAgICAgaWYgKCF0aGlzLnRpbWVSZUdleC50ZXN0KHZhbHVlKSkge1xuICAgICAgICAgICAgdmFsdWUgPSBgJHt2YWx1ZX1UMDA6MDBgO1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc3QgZGF0ZSA9IG5ldyBEYXRlKHZhbHVlKTtcbiAgICAgICAgXG4gICAgICAgIHJldHVybiAoTnVtYmVyLmlzTmFOKGRhdGUudmFsdWVPZigpKSkgPyBcIlwiIDogZGF0ZTtcbiAgICB9XG4gICAgLyoqXG4gICAgICogQ29udmVydCBzdHJpbmcgdG8gRGF0ZSBvYmplY3QgdHlwZSwgc2V0dGluZyB0aGUgdGltZSBjb21wb25lbnQgdG8gbWlkbmlnaHQuICBFeHBlY3RzIHN0cmluZyBmb3JtYXQgb2YgeWVhci1tb250aC1kYXkuXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IHZhbHVlIFN0cmluZyBkYXRlIHdpdGggZm9ybWF0IG9mIHllYXItbW9udGgtZGF5LlxuICAgICAqIEByZXR1cm5zIHtEYXRlIHwgc3RyaW5nfSBEYXRlIGlmIGNvbnZlcnNpb24gaXMgc3VjY2Vzc2Z1bC4gIE90aGVyd2lzZSwgZW1wdHkgc3RyaW5nLlxuICAgICAqL1xuICAgIHN0YXRpYyBwYXJzZURhdGVPbmx5KHZhbHVlKSB7XG4gICAgICAgIGNvbnN0IGRhdGUgPSB0aGlzLnBhcnNlRGF0ZSh2YWx1ZSk7XG5cbiAgICAgICAgaWYgKGRhdGUgPT09IFwiXCIpIHJldHVybiBcIlwiOyAgLy9JbnZhbGlkIGRhdGUuXG5cbiAgICAgICAgZGF0ZS5zZXRIb3VycygwLCAwLCAwLCAwKTsgLy9TZXQgdGltZSB0byBtaWRuaWdodCB0byByZW1vdmUgdGltZSBjb21wb25lbnQuXG5cbiAgICAgICAgcmV0dXJuIGRhdGU7XG4gICAgfVxuICAgIC8qKlxuICAgICAqIFJldHVybnMgYHRydWVgIGlmIHZhbHVlIGlzIGEgRGF0ZSBvYmplY3QgdHlwZS5cbiAgICAgKiBAcGFyYW0ge29iamVjdH0gdmFsdWUgXG4gICAgICogQHJldHVybnMge2Jvb2xlYW59IFJldHVybnMgYHRydWVgIGlmIHZhbHVlIGlzIGEgRGF0ZSBvYmplY3QgdHlwZSwgb3RoZXJ3aXNlIGBmYWxzZWAuXG4gICAgICovXG4gICAgc3RhdGljIGlzRGF0ZSh2YWx1ZSkgeyBcbiAgICAgICAgcmV0dXJuIE9iamVjdC5wcm90b3R5cGUudG9TdHJpbmcuY2FsbCh2YWx1ZSkgPT09IFwiW29iamVjdCBEYXRlXVwiO1xuXG4gICAgfVxufVxuXG5leHBvcnQgeyBEYXRlSGVscGVyIH07IiwiaW1wb3J0IHsgRGF0ZUhlbHBlciB9IGZyb20gXCIuLi8uLi9oZWxwZXJzL2RhdGVIZWxwZXIuanNcIjtcbi8qKlxuICogUHJvdmlkZXMgbWV0aG9kcyB0byBmb3JtYXQgZGF0ZSBhbmQgdGltZSBzdHJpbmdzLiAgRXhwZWN0cyBkYXRlIHN0cmluZyBpbiBmb3JtYXQgb2YgeWVhci1tb250aC1kYXkuXG4gKi9cbmNsYXNzIEZvcm1hdERhdGVUaW1lIHtcbiAgICBzdGF0aWMgbW9udGhzTG9uZyA9IFtcIkphbnVhcnlcIiwgXCJGZWJydWFyeVwiLCBcIk1hcmNoXCIsIFwiQXByaWxcIiwgXCJNYXlcIiwgXCJKdW5lXCIsIFwiSnVseVwiLCBcIkF1Z3VzdFwiLCBcIlNlcHRlbWJlclwiLCBcIk9jdG9iZXJcIiwgXCJOb3ZlbWJlclwiLCBcIkRlY2VtYmVyXCJdO1xuICAgIHN0YXRpYyBtb250aHNTaG9ydCA9IFtcIkphblwiLCBcIkZlYlwiLCBcIk1hclwiLCBcIkFwclwiLCBcIk1heVwiLCBcIkp1blwiLCBcIkp1bFwiLCBcIkF1Z1wiLCBcIlNlcFwiLCBcIk9jdFwiLCBcIk5vdlwiLCBcIkRlY1wiXTtcblxuICAgIHN0YXRpYyBsZWFkaW5nWmVybyhudW0pIHtcbiAgICAgICAgcmV0dXJuIG51bSA8IDEwID8gXCIwXCIgKyBudW0gOiBudW07XG4gICAgfVxuICAgIC8qKlxuICAgICAqIFJldHVybnMgYSBmb3JtYXR0ZWQgZGF0ZSB0aW1lIHN0cmluZy4gIEV4cGVjdHMgZGF0ZSBzdHJpbmcgaW4gZm9ybWF0IG9mIHllYXItbW9udGgtZGF5LiAgSWYgYGZvcm1hdHRlclBhcmFtc2AgaXMgZW1wdHksIFxuICAgICAqIGZ1bmN0aW9uIHdpbGwgcmV2ZXJ0IHRvIGRlZmF1bHQgdmFsdWVzLiBFeHBlY3RlZCBwcm9wZXJ0eSB2YWx1ZXMgaW4gYGZvcm1hdHRlclBhcmFtc2Agb2JqZWN0OlxuICAgICAqIC0gZGF0ZUZpZWxkOiBmaWVsZCB0byBjb252ZXJ0IGRhdGUgdGltZS5cbiAgICAgKiAtIGZvcm1hdDogc3RyaW5nIGZvcm1hdCB0ZW1wbGF0ZS5cbiAgICAgKiBAcGFyYW0ge09iamVjdH0gcm93RGF0YSBSb3cgZGF0YS5cbiAgICAgKiBAcGFyYW0ge0NvbHVtbn0gY29sdW1uIENvbHVtbiBjbGFzcyBvYmplY3QuXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IGRlZmF1bHRGb3JtYXQgRGVmYXVsdCBzdHJpbmcgZm9ybWF0OiBNTS9kZC95eXl5XG4gICAgICogQHBhcmFtIHtib29sZWFufSBbYWRkVGltZT1mYWxzZV0gQXBwbHkgZGF0ZSB0aW1lIGZvcm1hdHRpbmc/XG4gICAgICogQHJldHVybnMge3N0cmluZ31cbiAgICAgKi9cbiAgICBzdGF0aWMgYXBwbHkocm93RGF0YSwgY29sdW1uLCBkZWZhdWx0Rm9ybWF0ID0gXCJNTS9kZC95eXl5XCIsIGFkZFRpbWUgPSBmYWxzZSkge1xuICAgICAgICBsZXQgcmVzdWx0ID0gY29sdW1uPy5mb3JtYXR0ZXJQYXJhbXM/LmZvcm1hdCA/PyBkZWZhdWx0Rm9ybWF0O1xuICAgICAgICBsZXQgZmllbGQgPSBjb2x1bW4/LmZvcm1hdHRlclBhcmFtcz8uZGF0ZUZpZWxkIFxuICAgICAgICAgICAgPyByb3dEYXRhW2NvbHVtbi5mb3JtYXR0ZXJQYXJhbXMuZGF0ZUZpZWxkXVxuICAgICAgICAgICAgOiByb3dEYXRhW2NvbHVtbi5maWVsZF07XG5cbiAgICAgICAgaWYgKGZpZWxkID09PSBudWxsKSB7XG4gICAgICAgICAgICByZXR1cm4gXCJcIjtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IGRhdGUgPSBEYXRlSGVscGVyLnBhcnNlRGF0ZShmaWVsZCk7XG5cbiAgICAgICAgaWYgKGRhdGUgPT09IFwiXCIpIHtcbiAgICAgICAgICAgIHJldHVybiBcIlwiO1xuICAgICAgICB9XG5cbiAgICAgICAgbGV0IGZvcm1hdHMgPSB7XG4gICAgICAgICAgICBkOiBkYXRlLmdldERhdGUoKSxcbiAgICAgICAgICAgIGRkOiB0aGlzLmxlYWRpbmdaZXJvKGRhdGUuZ2V0RGF0ZSgpKSxcblxuICAgICAgICAgICAgTTogZGF0ZS5nZXRNb250aCgpICsgMSxcbiAgICAgICAgICAgIE1NOiB0aGlzLmxlYWRpbmdaZXJvKGRhdGUuZ2V0TW9udGgoKSArIDEpLFxuICAgICAgICAgICAgTU1NOiB0aGlzLm1vbnRoc1Nob3J0W2RhdGUuZ2V0TW9udGgoKV0sXG4gICAgICAgICAgICBNTU1NOiB0aGlzLm1vbnRoc0xvbmdbZGF0ZS5nZXRNb250aCgpXSxcblxuICAgICAgICAgICAgeXk6IGRhdGUuZ2V0RnVsbFllYXIoKS50b1N0cmluZygpLnNsaWNlKC0yKSxcbiAgICAgICAgICAgIHl5eXk6IGRhdGUuZ2V0RnVsbFllYXIoKVxuICAgICAgICB9O1xuXG4gICAgICAgIGlmIChhZGRUaW1lKSB7XG4gICAgICAgICAgICBsZXQgaG91cnMgPSBkYXRlLmdldEhvdXJzKCk7XG4gICAgICAgICAgICBsZXQgaG91cnMxMiA9IGhvdXJzICUgMTIgPT09IDAgPyAxMiA6IGhvdXJzICUgMTI7XG5cbiAgICAgICAgICAgIGZvcm1hdHMucyA9IGRhdGUuZ2V0U2Vjb25kcygpO1xuICAgICAgICAgICAgZm9ybWF0cy5zcyA9IHRoaXMubGVhZGluZ1plcm8oZGF0ZS5nZXRTZWNvbmRzKCkpO1xuICAgICAgICAgICAgZm9ybWF0cy5tID0gZGF0ZS5nZXRNaW51dGVzKCk7XG4gICAgICAgICAgICBmb3JtYXRzLm1tID0gdGhpcy5sZWFkaW5nWmVybyhkYXRlLmdldE1pbnV0ZXMoKSk7XG4gICAgICAgICAgICBmb3JtYXRzLmggPSBob3VyczEyO1xuICAgICAgICAgICAgZm9ybWF0cy5oaCA9ICB0aGlzLmxlYWRpbmdaZXJvKGhvdXJzMTIpO1xuICAgICAgICAgICAgZm9ybWF0cy5IID0gaG91cnM7XG4gICAgICAgICAgICBmb3JtYXRzLkhIID0gdGhpcy5sZWFkaW5nWmVybyhob3Vycyk7XG4gICAgICAgICAgICBmb3JtYXRzLmhwID0gaG91cnMgPCAxMiA/IFwiQU1cIiA6IFwiUE1cIjtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IHRhcmdldHMgPSByZXN1bHQuc3BsaXQoL1xcL3wtfFxcc3w6Lyk7XG5cbiAgICAgICAgZm9yIChsZXQgaXRlbSBvZiB0YXJnZXRzKSB7XG4gICAgICAgICAgICByZXN1bHQgPSByZXN1bHQucmVwbGFjZShpdGVtLCBmb3JtYXRzW2l0ZW1dKTtcbiAgICAgICAgfVxuICAgIFxuICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgIH1cbn1cblxuZXhwb3J0IHsgRm9ybWF0RGF0ZVRpbWUgfTsiLCIvKipcbiAqIFByb3ZpZGVzIG1ldGhvZCB0byBmb3JtYXQgYSBsaW5rIGFzIGFuIGFuY2hvciB0YWcgZWxlbWVudC5cbiAqL1xuY2xhc3MgRm9ybWF0TGluayB7XG4gICAgLyoqXG4gICAgICogRm9ybWF0dGVyIHRoYXQgY3JlYXRlIGFuIGFuY2hvciB0YWcgZWxlbWVudC4gaHJlZiBhbmQgb3RoZXIgYXR0cmlidXRlcyBjYW4gYmUgbW9kaWZpZWQgd2l0aCBwcm9wZXJ0aWVzIGluIHRoZSBcbiAgICAgKiAnZm9ybWF0dGVyUGFyYW1zJyBwYXJhbWV0ZXIuICBFeHBlY3RlZCBwcm9wZXJ0eSB2YWx1ZXM6IFxuICAgICAqIC0gdXJsUHJlZml4OiBCYXNlIHVybCBhZGRyZXNzLlxuICAgICAqIC0gcm91dGVGaWVsZDogUm91dGUgdmFsdWUuXG4gICAgICogLSBxdWVyeUZpZWxkOiBGaWVsZCBuYW1lIGZyb20gZGF0YXNldCB0byBidWlsZCBxdWVyeSBzdGluZyBrZXkvdmFsdWUgaW5wdXQuXG4gICAgICogLSBmaWVsZFRleHQ6IFVzZSBmaWVsZCBuYW1lIHRvIHNldCBpbm5lciB0ZXh0IHRvIGFzc29jaWF0ZWQgZGF0YXNldCB2YWx1ZS5cbiAgICAgKiAtIGlubmVyVGV4dDogUmF3IGlubmVyIHRleHQgdmFsdWUgb3IgZnVuY3Rpb24uICBJZiBmdW5jdGlvbiBpcyBwcm92aWRlZCwgaXQgd2lsbCBiZSBjYWxsZWQgd2l0aCByb3dEYXRhIGFuZCBmb3JtYXR0ZXJQYXJhbXMgYXMgcGFyYW1ldGVycy5cbiAgICAgKiAtIHRhcmdldDogSG93IHRhcmdldCBkb2N1bWVudCBzaG91bGQgYmUgb3BlbmVkLlxuICAgICAqIEBwYXJhbSB7T2JqZWN0fSByb3dEYXRhIFJvdyBkYXRhLlxuICAgICAqIEBwYXJhbSB7eyB1cmxQcmVmaXg6IHN0cmluZywgcXVlcnlGaWVsZDogc3RyaW5nLCBmaWVsZFRleHQ6IHN0cmluZywgaW5uZXJUZXh0OiBzdHJpbmcgfCBGdW5jdGlvbiwgdGFyZ2V0OiBzdHJpbmcgfX0gZm9ybWF0dGVyUGFyYW1zIFNldHRpbmdzLlxuICAgICAqIEByZXR1cm4ge0hUTUxBbmNob3JFbGVtZW50fSBhbmNob3IgdGFnIGVsZW1lbnQuXG4gICAgICogKi9cbiAgICBzdGF0aWMgYXBwbHkocm93RGF0YSwgZm9ybWF0dGVyUGFyYW1zKSB7XG4gICAgICAgIGNvbnN0IGVsID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImFcIik7XG5cbiAgICAgICAgbGV0IHVybCA9IGZvcm1hdHRlclBhcmFtcy51cmxQcmVmaXg7XG4gICAgICAgIC8vQXBwbHkgcm91dGUgdmFsdWUgYmVmb3JlIHF1ZXJ5IHN0cmluZy5cbiAgICAgICAgaWYgKGZvcm1hdHRlclBhcmFtcy5yb3V0ZUZpZWxkKSB7XG4gICAgICAgICAgICB1cmwgKz0gXCIvXCIgKyBlbmNvZGVVUklDb21wb25lbnQocm93RGF0YVtmb3JtYXR0ZXJQYXJhbXMucm91dGVGaWVsZF0pO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKGZvcm1hdHRlclBhcmFtcy5xdWVyeUZpZWxkKSB7XG4gICAgICAgICAgICBjb25zdCBxcnlWYWx1ZSA9IGVuY29kZVVSSUNvbXBvbmVudChyb3dEYXRhW2Zvcm1hdHRlclBhcmFtcy5xdWVyeUZpZWxkXSk7XG5cbiAgICAgICAgICAgIHVybCA9IGAke3VybH0/JHtmb3JtYXR0ZXJQYXJhbXMucXVlcnlGaWVsZH09JHtxcnlWYWx1ZX1gO1xuICAgICAgICB9XG5cbiAgICAgICAgZWwuaHJlZiA9IHVybDtcblxuICAgICAgICBpZiAoZm9ybWF0dGVyUGFyYW1zLmZpZWxkVGV4dCkge1xuICAgICAgICAgICAgZWwuaW5uZXJIVE1MID0gcm93RGF0YVtmb3JtYXR0ZXJQYXJhbXMuZmllbGRUZXh0XTtcbiAgICAgICAgfSBlbHNlIGlmICgodHlwZW9mIGZvcm1hdHRlclBhcmFtcy5pbm5lclRleHQgPT09IFwiZnVuY3Rpb25cIikpIHtcbiAgICAgICAgICAgIGVsLmlubmVySFRNTCA9IGZvcm1hdHRlclBhcmFtcy5pbm5lclRleHQocm93RGF0YSwgZm9ybWF0dGVyUGFyYW1zKTtcbiAgICAgICAgfSBlbHNlIGlmIChmb3JtYXR0ZXJQYXJhbXMuaW5uZXJUZXh0KSB7XG4gICAgICAgICAgICBlbC5pbm5lckhUTUwgPSBmb3JtYXR0ZXJQYXJhbXMuaW5uZXJUZXh0O1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKGZvcm1hdHRlclBhcmFtcy50YXJnZXQpIHtcbiAgICAgICAgICAgIGVsLnNldEF0dHJpYnV0ZShcInRhcmdldFwiLCBmb3JtYXR0ZXJQYXJhbXMudGFyZ2V0KTtcbiAgICAgICAgICAgIGVsLnNldEF0dHJpYnV0ZShcInJlbFwiLCBcIm5vb3BlbmVyXCIpO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIGVsO1xuICAgIH1cbn1cblxuZXhwb3J0IHsgRm9ybWF0TGluayB9OyIsIi8qKlxuICogUHJvdmlkZXMgbWV0aG9kIHRvIGZvcm1hdCBudW1lcmljIHZhbHVlcyBpbnRvIHN0cmluZ3Mgd2l0aCBzcGVjaWZpZWQgc3R5bGVzIG9mIGRlY2ltYWwsIGN1cnJlbmN5LCBvciBwZXJjZW50LlxuICovXG5jbGFzcyBGb3JtYXROdW1lcmljIHtcbiAgICBzdGF0aWMgdmFsaWRTdHlsZXMgPSBbXCJkZWNpbWFsXCIsIFwiY3VycmVuY3lcIiwgXCJwZXJjZW50XCJdO1xuICAgIC8qKlxuICAgICAqIFJldHVybnMgYSBmb3JtYXR0ZWQgbnVtZXJpYyBzdHJpbmcuICBFeHBlY3RlZCBwcm9wZXJ0eSB2YWx1ZXM6IFxuICAgICAqIC0gcHJlY2lzaW9uOiByb3VuZGluZyBwcmVjaXNpb24uXG4gICAgICogLSBzdHlsZTogZm9ybWF0dGluZyBzdHlsZSB0byB1c2UuXG4gICAgICogQHBhcmFtIHtPYmplY3R9IHJvd0RhdGEgUm93IGRhdGEuXG4gICAgICogQHBhcmFtIHtDb2x1bW59IGNvbHVtbiBDb2x1bW4gY2xhc3Mgb2JqZWN0LlxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBbc3R5bGU9XCJkZWNpbWFsXCJdIEZvcm1hdHRpbmcgc3R5bGUgdG8gdXNlLiBEZWZhdWx0IGlzIFwiZGVjaW1hbFwiLlxuICAgICAqIEBwYXJhbSB7bnVtYmVyfSBbcHJlY2lzaW9uPTJdIFJvdW5kaW5nIHByZWNpc2lvbi4gRGVmYXVsdCBpcyAyLlxuICAgICAqIEByZXR1cm5zIHtzdHJpbmd9XG4gICAgICovXG4gICAgc3RhdGljIGFwcGx5KHJvd0RhdGEsIGNvbHVtbiwgc3R5bGUgPSBcImRlY2ltYWxcIiwgcHJlY2lzaW9uID0gMikge1xuICAgICAgICBjb25zdCBmbG9hdFZhbCA9IHJvd0RhdGFbY29sdW1uLmZpZWxkXTtcblxuICAgICAgICBpZiAoaXNOYU4oZmxvYXRWYWwpKSByZXR1cm4gZmxvYXRWYWw7XG5cbiAgICAgICAgaWYgKCF0aGlzLnZhbGlkU3R5bGVzLmluY2x1ZGVzKHN0eWxlKSkge1xuICAgICAgICAgICAgc3R5bGUgPSBcImRlY2ltYWxcIjtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBuZXcgSW50bC5OdW1iZXJGb3JtYXQoXCJlbi1VU1wiLCB7XG4gICAgICAgICAgICBzdHlsZTogc3R5bGUsXG4gICAgICAgICAgICBtYXhpbXVtRnJhY3Rpb25EaWdpdHM6IHByZWNpc2lvbixcbiAgICAgICAgICAgIGN1cnJlbmN5OiBcIlVTRFwiXG4gICAgICAgIH0pLmZvcm1hdChmbG9hdFZhbCk7XG4gICAgfVxufVxuXG5leHBvcnQgeyBGb3JtYXROdW1lcmljIH07IiwiY2xhc3MgRm9ybWF0U3RhciB7XG4gICAgLyoqXG4gICAgICogUmV0dXJucyBhbiBlbGVtZW50IG9mIHN0YXIgcmF0aW5ncyBiYXNlZCBvbiBpbnRlZ2VyIHZhbHVlcy4gIEV4cGVjdGVkIHByb3BlcnR5IHZhbHVlczogXG4gICAgICogLSBzdGFyczogbnVtYmVyIG9mIHN0YXJzIHRvIGRpc3BsYXkuXG4gICAgICogQHBhcmFtIHtPYmplY3R9IHJvd0RhdGEgcm93IGRhdGEuXG4gICAgICogQHBhcmFtIHtDb2x1bW59IGNvbHVtbiBjb2x1bW4gY2xhc3Mgb2JqZWN0LlxuICAgICAqIEByZXR1cm5zIHtIVE1MRGl2RWxlbWVudH1cbiAgICAgKi9cbiAgICBzdGF0aWMgYXBwbHkocm93RGF0YSwgY29sdW1uKSB7XG4gICAgICAgIGxldCB2YWx1ZSA9IHJvd0RhdGFbY29sdW1uLmZpZWxkXTtcbiAgICAgICAgY29uc3QgbWF4U3RhcnMgPSBjb2x1bW4uZm9ybWF0dGVyUGFyYW1zPy5zdGFycyA/IGNvbHVtbi5mb3JtYXR0ZXJQYXJhbXMuc3RhcnMgOiA1O1xuICAgICAgICBjb25zdCBjb250YWluZXIgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiZGl2XCIpO1xuICAgICAgICBjb25zdCBzdGFycyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJzcGFuXCIpO1xuICAgICAgICBjb25zdCBzdGFyID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudE5TKFwiaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmdcIiwgXCJzdmdcIik7XG4gICAgICAgIGNvbnN0IHN0YXJBY3RpdmUgPSAnPHBvbHlnb24gZmlsbD1cIiNGRkVBMDBcIiBzdHJva2U9XCIjQzFBQjYwXCIgc3Ryb2tlLXdpZHRoPVwiMzcuNjE1MlwiIHN0cm9rZS1saW5lY2FwPVwicm91bmRcIiBzdHJva2UtbGluZWpvaW49XCJyb3VuZFwiIHN0cm9rZS1taXRlcmxpbWl0PVwiMTBcIiBwb2ludHM9XCIyNTkuMjE2LDI5Ljk0MiAzMzAuMjcsMTczLjkxOSA0ODkuMTYsMTk3LjAwNyAzNzQuMTg1LDMwOS4wOCA0MDEuMzMsNDY3LjMxIDI1OS4yMTYsMzkyLjYxMiAxMTcuMTA0LDQ2Ny4zMSAxNDQuMjUsMzA5LjA4IDI5LjI3NCwxOTcuMDA3IDE4OC4xNjUsMTczLjkxOSBcIi8+JztcbiAgICAgICAgY29uc3Qgc3RhckluYWN0aXZlID0gJzxwb2x5Z29uIGZpbGw9XCIjRDJEMkQyXCIgc3Ryb2tlPVwiIzY4Njg2OFwiIHN0cm9rZS13aWR0aD1cIjM3LjYxNTJcIiBzdHJva2UtbGluZWNhcD1cInJvdW5kXCIgc3Ryb2tlLWxpbmVqb2luPVwicm91bmRcIiBzdHJva2UtbWl0ZXJsaW1pdD1cIjEwXCIgcG9pbnRzPVwiMjU5LjIxNiwyOS45NDIgMzMwLjI3LDE3My45MTkgNDg5LjE2LDE5Ny4wMDcgMzc0LjE4NSwzMDkuMDggNDAxLjMzLDQ2Ny4zMSAyNTkuMjE2LDM5Mi42MTIgMTE3LjEwNCw0NjcuMzEgMTQ0LjI1LDMwOS4wOCAyOS4yNzQsMTk3LjAwNyAxODguMTY1LDE3My45MTkgXCIvPic7XG5cbiAgICAgICAgLy9zdHlsZSBzdGFycyBob2xkZXJcbiAgICAgICAgc3RhcnMuc3R5bGUudmVydGljYWxBbGlnbiA9IFwibWlkZGxlXCI7XG4gICAgICAgIC8vc3R5bGUgc3RhclxuICAgICAgICBzdGFyLnNldEF0dHJpYnV0ZShcIndpZHRoXCIsIFwiMTRcIik7XG4gICAgICAgIHN0YXIuc2V0QXR0cmlidXRlKFwiaGVpZ2h0XCIsIFwiMTRcIik7XG4gICAgICAgIHN0YXIuc2V0QXR0cmlidXRlKFwidmlld0JveFwiLCBcIjAgMCA1MTIgNTEyXCIpO1xuICAgICAgICBzdGFyLnNldEF0dHJpYnV0ZShcInhtbDpzcGFjZVwiLCBcInByZXNlcnZlXCIpO1xuICAgICAgICBzdGFyLnN0eWxlLnBhZGRpbmcgPSBcIjAgMXB4XCI7XG5cbiAgICAgICAgdmFsdWUgPSB2YWx1ZSAmJiAhaXNOYU4odmFsdWUpID8gcGFyc2VJbnQodmFsdWUpIDogMDtcbiAgICAgICAgdmFsdWUgPSBNYXRoLm1heCgwLCBNYXRoLm1pbih2YWx1ZSwgbWF4U3RhcnMpKTtcblxuICAgICAgICBmb3IobGV0IGkgPSAxOyBpIDw9IG1heFN0YXJzOyBpKyspe1xuICAgICAgICAgICAgY29uc3QgbmV4dFN0YXIgPSBzdGFyLmNsb25lTm9kZSh0cnVlKTtcblxuICAgICAgICAgICAgbmV4dFN0YXIuaW5uZXJIVE1MID0gaSA8PSB2YWx1ZSA/IHN0YXJBY3RpdmUgOiBzdGFySW5hY3RpdmU7XG5cbiAgICAgICAgICAgIHN0YXJzLmFwcGVuZENoaWxkKG5leHRTdGFyKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnRhaW5lci5zdHlsZS53aGl0ZVNwYWNlID0gXCJub3dyYXBcIjtcbiAgICAgICAgY29udGFpbmVyLnN0eWxlLm92ZXJmbG93ID0gXCJoaWRkZW5cIjtcbiAgICAgICAgY29udGFpbmVyLnN0eWxlLnRleHRPdmVyZmxvdyA9IFwiZWxsaXBzaXNcIjtcbiAgICAgICAgY29udGFpbmVyLnNldEF0dHJpYnV0ZShcImFyaWEtbGFiZWxcIiwgdmFsdWUpO1xuICAgICAgICBjb250YWluZXIuYXBwZW5kKHN0YXJzKTtcblxuICAgICAgICByZXR1cm4gY29udGFpbmVyO1xuICAgIH1cbn1cblxuZXhwb3J0IHsgRm9ybWF0U3RhciB9OyIsImNsYXNzIENzc0hlbHBlciB7XG4gICAgc3RhdGljIGJldHdlZW4gPSB7XG4gICAgICAgIGJ1dHRvbjogXCJkYXRhZ3JpZHMtYmV0d2Vlbi1idXR0b25cIixcbiAgICAgICAgbGFiZWw6IFwiZGF0YWdyaWRzLWJldHdlZW4taW5wdXQtbGFiZWxcIlxuICAgIH07XG5cbiAgICBzdGF0aWMgbm9IZWFkZXIgPSBcImRhdGFncmlkcy1uby1oZWFkZXJcIjtcblxuICAgIHN0YXRpYyBpbnB1dCA9IFwiZGF0YWdyaWRzLWlucHV0XCI7XG5cbiAgICBzdGF0aWMgbXVsdGlTZWxlY3QgPSB7XG4gICAgICAgIHBhcmVudENsYXNzOiBcImRhdGFncmlkcy1tdWx0aS1zZWxlY3RcIixcbiAgICAgICAgaGVhZGVyOiBcImRhdGFncmlkcy1tdWx0aS1zZWxlY3QtaGVhZGVyXCIsXG4gICAgICAgIGhlYWRlckFjdGl2ZTogXCJkYXRhZ3JpZHMtbXVsdGktc2VsZWN0LWhlYWRlci1hY3RpdmVcIixcbiAgICAgICAgaGVhZGVyT3B0aW9uOiBcImRhdGFncmlkcy1tdWx0aS1zZWxlY3QtaGVhZGVyLW9wdGlvblwiLFxuICAgICAgICBvcHRpb25zOiBcImRhdGFncmlkcy1tdWx0aS1zZWxlY3Qtb3B0aW9uc1wiLFxuICAgICAgICBvcHRpb246IFwiZGF0YWdyaWRzLW11bHRpLXNlbGVjdC1vcHRpb25cIixcbiAgICAgICAgb3B0aW9uVGV4dDogXCJkYXRhZ3JpZHMtbXVsdGktc2VsZWN0LW9wdGlvbi10ZXh0XCIsXG4gICAgICAgIG9wdGlvblJhZGlvOiBcImRhdGFncmlkcy1tdWx0aS1zZWxlY3Qtb3B0aW9uLXJhZGlvXCIsXG4gICAgICAgIHNlbGVjdGVkOiBcImRhdGFncmlkcy1tdWx0aS1zZWxlY3Qtc2VsZWN0ZWRcIlxuICAgIH07XG5cbiAgICBzdGF0aWMgdG9vbHRpcCA9IHsgXG4gICAgICAgIHBhcmVudENsYXNzOiBcImRhdGFncmlkcy10b29sdGlwXCIsXG4gICAgICAgIHJpZ2h0OiBcImRhdGFncmlkcy10b29sdGlwLXJpZ2h0XCIsXG4gICAgICAgIGxlZnQ6IFwiZGF0YWdyaWRzLXRvb2x0aXAtbGVmdFwiXG4gICAgfTtcbn1cblxuZXhwb3J0IHsgQ3NzSGVscGVyIH07IiwiaW1wb3J0IHsgRm9ybWF0RGF0ZVRpbWUgfSBmcm9tIFwiLi9mb3JtYXR0ZXJzL2RhdGV0aW1lLmpzXCI7XG5pbXBvcnQgeyBGb3JtYXRMaW5rIH0gZnJvbSBcIi4vZm9ybWF0dGVycy9saW5rLmpzXCI7XG5pbXBvcnQgeyBGb3JtYXROdW1lcmljIH0gZnJvbSBcIi4vZm9ybWF0dGVycy9udW1lcmljLmpzXCI7XG5pbXBvcnQgeyBGb3JtYXRTdGFyIH0gZnJvbSBcIi4vZm9ybWF0dGVycy9zdGFyLmpzXCI7XG5pbXBvcnQgeyBDc3NIZWxwZXIgfSBmcm9tIFwiLi4vaGVscGVycy9jc3NIZWxwZXIuanNcIjtcblxuY2xhc3MgQ2VsbCB7XG4gICAgLyoqXG4gICAgICogQ3JlYXRlIGNlbGwgb2JqZWN0IHRoYXQgcmVwcmVzZW50cyB0aGUgYHRkYCB0YWJsZSBib2R5IGVsZW1lbnQuXG4gICAgICogQHBhcmFtIHtBcnJheTxvYmplY3Q+fSByb3dEYXRhIFJvdyBkYXRhLlxuICAgICAqIEBwYXJhbSB7Q29sdW1ufSBjb2x1bW4gQ29sdW1uIG9iamVjdC5cbiAgICAgKiBAcGFyYW0ge09iamVjdH0gbW9kdWxlcyBHcmlkIG1vZHVsZShzKSBhZGRlZCBieSB1c2VyIGZvciBjdXN0b20gZm9ybWF0dGluZy5cbiAgICAgKiBAcGFyYW0ge0hUTUxUYWJsZVJvd0VsZW1lbnR9IHJvdyBUYWJsZSByb3cgYHRyYCBlbGVtZW50LlxuICAgICAqL1xuICAgIGNvbnN0cnVjdG9yKHJvd0RhdGEsIGNvbHVtbiwgbW9kdWxlcywgcm93KSB7XG4gICAgICAgIHRoaXMuZWxlbWVudCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJ0ZFwiKTtcblxuICAgICAgICBpZiAoY29sdW1uLmZvcm1hdHRlcikge1xuICAgICAgICAgICAgdGhpcy4jaW5pdChyb3dEYXRhLCBjb2x1bW4sIG1vZHVsZXMsIHJvdyk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB0aGlzLmVsZW1lbnQuaW5uZXJUZXh0ID0gcm93RGF0YVtjb2x1bW4uZmllbGRdO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKGNvbHVtbi50b29sdGlwRmllbGQpIHtcbiAgICAgICAgICAgIHRoaXMuI2FwcGx5VG9vbHRpcChyb3dEYXRhW2NvbHVtbi50b29sdGlwRmllbGRdLCBjb2x1bW4udG9vbHRpcExheW91dCk7XG4gICAgICAgIH1cbiAgICB9XG4gICAgLyoqXG4gICAgICogQXBwbGllcyB0b29sdGlwIGZ1bmN0aW9uYWxpdHkgdG8gdGhlIGNlbGwuICBJZiB0aGUgY2VsbCdzIGNvbnRlbnQgY29udGFpbnMgdGV4dCBvbmx5LCBpdCB3aWxsIGNyZWF0ZSBhIHRvb2x0aXAgXG4gICAgICogYHNwYW5gIGVsZW1lbnQgYW5kIGFwcGx5IHRoZSBjb250ZW50IHRvIGl0LlxuICAgICAqIEBwYXJhbSB7c3RyaW5nIHwgbnVtYmVyIHwgRGF0ZSB8IG51bGx9IGNvbnRlbnQgVG9vbHRpcCBjb250ZW50IHRvIGJlIGRpc3BsYXllZC5cbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gbGF5b3V0IENTUyBjbGFzcyBmb3IgdG9vbHRpcCBsYXlvdXQsIGVpdGhlciBcImRhdGFncmlkcy10b29sdGlwLXJpZ2h0XCIgb3IgXCJkYXRhZ3JpZHMtdG9vbHRpcC1sZWZ0XCIuXG4gICAgICovXG4gICAgI2FwcGx5VG9vbHRpcChjb250ZW50LCBsYXlvdXQpIHtcbiAgICAgICAgaWYgKGNvbnRlbnQgPT09IG51bGwgfHwgY29udGVudCA9PT0gXCJcIikgcmV0dXJuO1xuICAgICAgICBcbiAgICAgICAgbGV0IHRvb2x0aXBFbGVtZW50ID0gdGhpcy5lbGVtZW50LmZpcnN0RWxlbWVudENoaWxkO1xuXG4gICAgICAgIGlmICh0b29sdGlwRWxlbWVudCA9PT0gbnVsbCkge1xuICAgICAgICAgICAgdG9vbHRpcEVsZW1lbnQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwic3BhblwiKTtcbiAgICAgICAgICAgIHRvb2x0aXBFbGVtZW50LmlubmVyVGV4dCA9IHRoaXMuZWxlbWVudC5pbm5lclRleHQ7XG4gICAgICAgICAgICB0aGlzLmVsZW1lbnQucmVwbGFjZUNoaWxkcmVuKHRvb2x0aXBFbGVtZW50KTtcbiAgICAgICAgfVxuXG4gICAgICAgIHRvb2x0aXBFbGVtZW50LmRhdGFzZXQudG9vbHRpcCA9IGNvbnRlbnQ7XG4gICAgICAgIHRvb2x0aXBFbGVtZW50LmNsYXNzTGlzdC5hZGQoQ3NzSGVscGVyLnRvb2x0aXAsIGxheW91dCk7XG4gICAgfVxuXG4gICAgI2luaXQocm93RGF0YSwgY29sdW1uLCBtb2R1bGVzLCByb3cpIHtcbiAgICAgICAgaWYgKHR5cGVvZiBjb2x1bW4uZm9ybWF0dGVyID09PSBcImZ1bmN0aW9uXCIpIHtcbiAgICAgICAgICAgIHRoaXMuZWxlbWVudC5hcHBlbmQoY29sdW1uLmZvcm1hdHRlcihyb3dEYXRhLCBjb2x1bW4uZm9ybWF0dGVyUGFyYW1zLCB0aGlzLmVsZW1lbnQsIHJvdykpO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gIFxuICAgICAgICBzd2l0Y2ggKGNvbHVtbi5mb3JtYXR0ZXIpIHtcbiAgICAgICAgICAgIGNhc2UgXCJsaW5rXCI6XG4gICAgICAgICAgICAgICAgdGhpcy5lbGVtZW50LmFwcGVuZChGb3JtYXRMaW5rLmFwcGx5KHJvd0RhdGEsIGNvbHVtbi5mb3JtYXR0ZXJQYXJhbXMpKTtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIGNhc2UgXCJkYXRlXCI6XG4gICAgICAgICAgICAgICAgdGhpcy5lbGVtZW50LmlubmVyVGV4dCA9IEZvcm1hdERhdGVUaW1lLmFwcGx5KHJvd0RhdGEsIGNvbHVtbiwgY29sdW1uLnNldHRpbmdzLmRhdGVGb3JtYXQsIGZhbHNlKTtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIGNhc2UgXCJkYXRldGltZVwiOlxuICAgICAgICAgICAgICAgIHRoaXMuZWxlbWVudC5pbm5lclRleHQgPSBGb3JtYXREYXRlVGltZS5hcHBseShyb3dEYXRhLCBjb2x1bW4sIGNvbHVtbi5zZXR0aW5ncy5kYXRlVGltZUZvcm1hdCwgdHJ1ZSk7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICBjYXNlIFwibW9uZXlcIjpcbiAgICAgICAgICAgICAgICB0aGlzLmVsZW1lbnQuaW5uZXJUZXh0ID0gRm9ybWF0TnVtZXJpYy5hcHBseShyb3dEYXRhLCBjb2x1bW4sIFwiY3VycmVuY3lcIiwgMik7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICBjYXNlIFwibnVtZXJpY1wiOlxuICAgICAgICAgICAgICAgIHRoaXMuZWxlbWVudC5pbm5lclRleHQgPSBGb3JtYXROdW1lcmljLmFwcGx5KHJvd0RhdGEsIGNvbHVtbiwgY29sdW1uLmZvcm1hdHRlclBhcmFtcz8uc3R5bGUgPz8gXCJkZWNpbWFsXCIsIGNvbHVtbi5mb3JtYXR0ZXJQYXJhbXM/LnByZWNpc2lvbiA/PyAyKTtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIGNhc2UgXCJzdGFyXCI6XG4gICAgICAgICAgICAgICAgdGhpcy5lbGVtZW50LmFwcGVuZChGb3JtYXRTdGFyLmFwcGx5KHJvd0RhdGEsIGNvbHVtbikpO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgY2FzZSBcIm1vZHVsZVwiOlxuICAgICAgICAgICAgICAgIHRoaXMuZWxlbWVudC5hcHBlbmQobW9kdWxlc1tjb2x1bW4uZm9ybWF0dGVyUGFyYW1zLm5hbWVdLmFwcGx5KHJvd0RhdGEsIGNvbHVtbiwgcm93LCB0aGlzLmVsZW1lbnQpKTtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgICAgICAgdGhpcy5lbGVtZW50LmlubmVyVGV4dCA9IHJvd0RhdGFbY29sdW1uLmZpZWxkXTtcbiAgICAgICAgfVxuICAgIH1cbn1cblxuZXhwb3J0IHsgQ2VsbCB9OyIsIi8qKlxuICogRGVmaW5lcyBhIHNpbmdsZSBoZWFkZXIgY2VsbCAndGgnIGVsZW1lbnQuXG4gKi9cbmNsYXNzIEhlYWRlckNlbGwge1xuICAgIC8qKlxuICAgICAqIENyZWF0ZSBoZWFkZXIgb2JqZWN0IHRoYXQgcmVwcmVzZW50cyB0aGUgYHRoYCB0YWJsZSBoZWFkZXIgZWxlbWVudC4gIENsYXNzIHdpbGwgcGVyc2lzdCBjb2x1bW4gc29ydCBhbmQgb3JkZXIgdXNlciBpbnB1dC5cbiAgICAgKiBAcGFyYW0ge0NvbHVtbn0gY29sdW1uIGNvbHVtbiBvYmplY3QuXG4gICAgICovXG4gICAgY29uc3RydWN0b3IoY29sdW1uKSB7XG4gICAgICAgIHRoaXMuY29sdW1uID0gY29sdW1uO1xuICAgICAgICB0aGlzLnNldHRpbmdzID0gY29sdW1uLnNldHRpbmdzO1xuICAgICAgICB0aGlzLmVsZW1lbnQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwidGhcIik7XG4gICAgICAgIHRoaXMuc3BhbiA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJzcGFuXCIpO1xuICAgICAgICB0aGlzLm5hbWUgPSBjb2x1bW4uZmllbGQ7XG4gICAgICAgIHRoaXMuZGlyZWN0aW9uID0gXCJkZXNjXCI7XG4gICAgICAgIHRoaXMuZGlyZWN0aW9uTmV4dCA9IFwiZGVzY1wiO1xuICAgICAgICB0aGlzLnR5cGUgPSBjb2x1bW4udHlwZTtcblxuICAgICAgICBpZiAoY29sdW1uLmhlYWRlckNzcykge1xuICAgICAgICAgICAgdGhpcy5lbGVtZW50LmNsYXNzTGlzdC5hZGQoY29sdW1uLmhlYWRlckNzcyk7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAodGhpcy5zZXR0aW5ncy50YWJsZUhlYWRlclRoQ3NzKSB7XG4gICAgICAgICAgICB0aGlzLmVsZW1lbnQuY2xhc3NMaXN0LmFkZCh0aGlzLnNldHRpbmdzLnRhYmxlSGVhZGVyVGhDc3MpO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKGNvbHVtbi5jb2x1bW5TaXplKSB7XG4gICAgICAgICAgICB0aGlzLmVsZW1lbnQuY2xhc3NMaXN0LmFkZChjb2x1bW4uY29sdW1uU2l6ZSk7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoY29sdW1uLndpZHRoKSB7XG4gICAgICAgICAgICB0aGlzLmVsZW1lbnQuc3R5bGUud2lkdGggPSBjb2x1bW4ud2lkdGg7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoY29sdW1uLmhlYWRlckZpbHRlckVtcHR5KSB7XG4gICAgICAgICAgICB0aGlzLnNwYW4uY2xhc3NMaXN0LmFkZChjb2x1bW4uaGVhZGVyRmlsdGVyRW1wdHkpO1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5lbGVtZW50LmFwcGVuZENoaWxkKHRoaXMuc3Bhbik7XG4gICAgICAgIHRoaXMuZWxlbWVudC5jb250ZXh0ID0gdGhpcztcbiAgICAgICAgdGhpcy5zcGFuLmlubmVyVGV4dCA9IGNvbHVtbi5sYWJlbDtcbiAgICAgICAgdGhpcy5zcGFuLmNvbnRleHQgPSB0aGlzO1xuICAgIH1cbiAgICAvKipcbiAgICAgKiBTZXQgdGhlIHNvcnQgZmxhZyBmb3IgdGhlIGhlYWRlciBjZWxsLlxuICAgICAqL1xuICAgIHNldFNvcnRGbGFnKCkge1xuICAgICAgICBpZiAodGhpcy5pY29uID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgIHRoaXMuaWNvbiA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJpXCIpO1xuICAgICAgICAgICAgdGhpcy5zcGFuLmFwcGVuZCh0aGlzLmljb24pO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHRoaXMuZGlyZWN0aW9uTmV4dCA9PT0gXCJkZXNjXCIpIHtcbiAgICAgICAgICAgIHRoaXMuaWNvbi5jbGFzc0xpc3QgPSB0aGlzLnNldHRpbmdzLnRhYmxlQ3NzU29ydERlc2M7XG4gICAgICAgICAgICB0aGlzLmRpcmVjdGlvbiA9IFwiZGVzY1wiO1xuICAgICAgICAgICAgdGhpcy5kaXJlY3Rpb25OZXh0ID0gXCJhc2NcIjtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHRoaXMuaWNvbi5jbGFzc0xpc3QgPSB0aGlzLnNldHRpbmdzLnRhYmxlQ3NzU29ydEFzYztcbiAgICAgICAgICAgIHRoaXMuZGlyZWN0aW9uID0gXCJhc2NcIjtcbiAgICAgICAgICAgIHRoaXMuZGlyZWN0aW9uTmV4dCA9IFwiZGVzY1wiO1xuICAgICAgICB9XG4gICAgfVxuICAgIC8qKlxuICAgICAqIFJlbW92ZSB0aGUgc29ydCBmbGFnIGZvciB0aGUgaGVhZGVyIGNlbGwuXG4gICAgICovXG4gICAgcmVtb3ZlU29ydEZsYWcoKSB7XG4gICAgICAgIHRoaXMuZGlyZWN0aW9uID0gXCJkZXNjXCI7XG4gICAgICAgIHRoaXMuZGlyZWN0aW9uTmV4dCA9IFwiZGVzY1wiO1xuICAgICAgICB0aGlzLmljb24gPSB0aGlzLmljb24ucmVtb3ZlKCk7XG4gICAgfVxuXG4gICAgZ2V0IGlzQ3VycmVudFNvcnQoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmljb24gIT09IHVuZGVmaW5lZDtcbiAgICB9XG59XG5cbmV4cG9ydCB7IEhlYWRlckNlbGwgfTsiLCJpbXBvcnQgeyBDc3NIZWxwZXIgfSBmcm9tIFwiLi4vaGVscGVycy9jc3NIZWxwZXIuanNcIjtcbi8qKlxuICogRGVmaW5lcyBhIHNpbmdsZSBjb2x1bW4gZm9yIHRoZSBncmlkLiAgVHJhbnNmb3JtcyB1c2VyJ3MgY29sdW1uIGRlZmluaXRpb24gaW50byBDbGFzcyBwcm9wZXJ0aWVzLlxuICogQGNsYXNzXG4gKi9cbmNsYXNzIENvbHVtbiB7XG4gICAgLyoqXG4gICAgICogQ3JlYXRlIGNvbHVtbiBvYmplY3Qgd2hpY2ggdHJhbnNmb3JtcyB1c2VyJ3MgY29sdW1uIGRlZmluaXRpb24gaW50byBDbGFzcyBwcm9wZXJ0aWVzLlxuICAgICAqIEBwYXJhbSB7T2JqZWN0fSBjb2x1bW4gVXNlcidzIGNvbHVtbiBkZWZpbml0aW9uL3NldHRpbmdzLlxuICAgICAqIEBwYXJhbSB7U2V0dGluZ3NHcmlkfSBzZXR0aW5ncyBncmlkIHNldHRpbmdzLlxuICAgICAqIEBwYXJhbSB7bnVtYmVyfSBpbmRleCBjb2x1bW4gaW5kZXggbnVtYmVyLlxuICAgICAqL1xuICAgIGNvbnN0cnVjdG9yKGNvbHVtbiwgc2V0dGluZ3MsIGluZGV4ID0gMCkge1xuICAgICAgICB0aGlzLnNldHRpbmdzID0gc2V0dGluZ3M7XG4gICAgICAgIHRoaXMuaW5kZXggPSBpbmRleDtcblxuICAgICAgICBpZiAoY29sdW1uLmZpZWxkID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgIHRoaXMuZmllbGQgPSBgY29sdW1uJHtpbmRleH1gOyAgLy9hc3NvY2lhdGVkIGRhdGEgZmllbGQgbmFtZS5cbiAgICAgICAgICAgIHRoaXMudHlwZSA9IFwiaWNvblwiOyAgLy9pY29uIHR5cGUuXG4gICAgICAgICAgICB0aGlzLmxhYmVsID0gXCJcIjtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHRoaXMuZmllbGQgPSBjb2x1bW4uZmllbGQ7ICAvL2Fzc29jaWF0ZWQgZGF0YSBmaWVsZCBuYW1lLlxuICAgICAgICAgICAgdGhpcy50eXBlID0gY29sdW1uLnR5cGUgPyBjb2x1bW4udHlwZSA6IFwic3RyaW5nXCI7ICAvL3ZhbHVlIHR5cGUuXG4gICAgICAgICAgICB0aGlzLmxhYmVsID0gY29sdW1uLmxhYmVsIFxuICAgICAgICAgICAgICAgID8gY29sdW1uLmxhYmVsIFxuICAgICAgICAgICAgICAgIDogY29sdW1uLmZpZWxkWzBdLnRvVXBwZXJDYXNlKCkgKyBjb2x1bW4uZmllbGQuc2xpY2UoMSk7ICAvL2NvbHVtbiB0aXRsZS5cbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChjb2x1bW4/LmZvcm1hdHRlck1vZHVsZU5hbWUpIHsgXG4gICAgICAgICAgICB0aGlzLmZvcm1hdHRlciA9IFwibW9kdWxlXCI7XG4gICAgICAgICAgICB0aGlzLmZvcm1hdHRlck1vZHVsZU5hbWUgPSBjb2x1bW4uZm9ybWF0dGVyTW9kdWxlTmFtZTsgIC8vZm9ybWF0dGVyIG1vZHVsZSBuYW1lLlxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdGhpcy5mb3JtYXR0ZXIgPSBjb2x1bW4uZm9ybWF0dGVyOyAgLy9mb3JtYXR0ZXIgdHlwZSBvciBmdW5jdGlvbi5cbiAgICAgICAgICAgIHRoaXMuZm9ybWF0dGVyUGFyYW1zID0gY29sdW1uLmZvcm1hdHRlclBhcmFtcztcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMuaGVhZGVyQ3NzID0gY29sdW1uLmhlYWRlckNzcztcbiAgICAgICAgdGhpcy5jb2x1bW5TaXplID0gY29sdW1uPy5jb2x1bW5TaXplID8gYGRhdGFncmlkcy1jb2wtJHtjb2x1bW4uY29sdW1uU2l6ZX1gIDogXCJcIjtcbiAgICAgICAgdGhpcy53aWR0aCA9IGNvbHVtbj8ud2lkdGggPz8gdW5kZWZpbmVkO1xuICAgICAgICB0aGlzLmhhc0ZpbHRlciA9IHRoaXMudHlwZSAhPT0gXCJpY29uXCIgJiYgY29sdW1uLmZpbHRlclR5cGUgPyB0cnVlIDogZmFsc2U7XG4gICAgICAgIHRoaXMuaGVhZGVyQ2VsbCA9IHVuZGVmaW5lZDsgIC8vSGVhZGVyQ2VsbCBjbGFzcy5cbiAgICAgICAgdGhpcy5oZWFkZXJGaWx0ZXIgPSB1bmRlZmluZWQ7ICAvL0hlYWRlckZpbHRlciBjbGFzcy5cblxuICAgICAgICBpZiAodGhpcy5oYXNGaWx0ZXIpIHtcbiAgICAgICAgICAgIHRoaXMuI2luaXRpYWxpemVGaWx0ZXIoY29sdW1uLCBzZXR0aW5ncyk7XG4gICAgICAgIH0gZWxzZSBpZiAoY29sdW1uPy5oZWFkZXJGaWx0ZXJFbXB0eSkge1xuICAgICAgICAgICAgdGhpcy5oZWFkZXJGaWx0ZXJFbXB0eSA9ICh0eXBlb2YgY29sdW1uLmhlYWRlckZpbHRlckVtcHR5ID09PSBcInN0cmluZ1wiKSBcbiAgICAgICAgICAgICAgICA/IGNvbHVtbi5oZWFkZXJGaWx0ZXJFbXB0eSA6IENzc0hlbHBlci5ub0hlYWRlcjtcbiAgICAgICAgfVxuICAgICAgICAvL1Rvb2x0aXAgc2V0dGluZy5cbiAgICAgICAgaWYgKGNvbHVtbi50b29sdGlwRmllbGQpIHtcbiAgICAgICAgICAgIHRoaXMudG9vbHRpcEZpZWxkID0gY29sdW1uLnRvb2x0aXBGaWVsZDtcbiAgICAgICAgICAgIHRoaXMudG9vbHRpcExheW91dCA9IGNvbHVtbj8udG9vbHRpcExheW91dCA9PT0gXCJyaWdodFwiID8gQ3NzSGVscGVyLnRvb2x0aXAucmlnaHQgOiBDc3NIZWxwZXIudG9vbHRpcC5sZWZ0O1xuICAgICAgICB9XG4gICAgfVxuICAgIC8qKlxuICAgICAqIEluaXRpYWxpemVzIGZpbHRlciBwcm9wZXJ0aWVzLlxuICAgICAqIEBwYXJhbSB7T2JqZWN0fSBjb2x1bW4gXG4gICAgICogQHBhcmFtIHtTZXR0aW5nc30gc2V0dGluZ3MgXG4gICAgICovXG4gICAgI2luaXRpYWxpemVGaWx0ZXIoY29sdW1uLCBzZXR0aW5ncykge1xuICAgICAgICB0aGlzLmZpbHRlckVsZW1lbnQgPSBjb2x1bW4uZmlsdGVyVHlwZSA9PT0gXCJiZXR3ZWVuXCIgPyBcImJldHdlZW5cIiA6IFwiaW5wdXRcIjtcbiAgICAgICAgdGhpcy5maWx0ZXJUeXBlID0gY29sdW1uLmZpbHRlclR5cGU7ICAvL2ZpbHRlciB0eXBlIGRlc2NyaXB0b3IsIHN1Y2ggYXM6IGVxdWFscywgbGlrZSwgPCwgZXRjOyBjYW4gYWxzbyBiZSBhIGZ1bmN0aW9uLlxuICAgICAgICB0aGlzLmZpbHRlclBhcmFtcyA9IGNvbHVtbi5maWx0ZXJQYXJhbXM7XG4gICAgICAgIHRoaXMuZmlsdGVyQ3NzID0gY29sdW1uPy5maWx0ZXJDc3MgPz8gc2V0dGluZ3MudGFibGVGaWx0ZXJDc3M7XG4gICAgICAgIHRoaXMuZmlsdGVyUmVhbFRpbWUgPSBjb2x1bW4/LmZpbHRlclJlYWxUaW1lID8/IGZhbHNlO1xuXG4gICAgICAgIGlmIChjb2x1bW4uZmlsdGVyVmFsdWVzKSB7XG4gICAgICAgICAgICB0aGlzLmZpbHRlclZhbHVlcyA9IGNvbHVtbi5maWx0ZXJWYWx1ZXM7ICAvL3NlbGVjdCBvcHRpb24gZmlsdGVyIHZhbHVlLlxuICAgICAgICAgICAgdGhpcy5maWx0ZXJWYWx1ZXNSZW1vdGVTb3VyY2UgPSB0eXBlb2YgY29sdW1uLmZpbHRlclZhbHVlcyA9PT0gXCJzdHJpbmdcIiA/IGNvbHVtbi5maWx0ZXJWYWx1ZXMgOiB1bmRlZmluZWQ7ICAvL3NlbGVjdCBvcHRpb24gZmlsdGVyIHZhbHVlIGFqYXggc291cmNlLlxuICAgICAgICAgICAgdGhpcy5maWx0ZXJFbGVtZW50ID0gY29sdW1uLmZpbHRlck11bHRpU2VsZWN0ID8gXCJtdWx0aVwiIDogXCJzZWxlY3RcIjtcbiAgICAgICAgICAgIHRoaXMuZmlsdGVyTXVsdGlTZWxlY3QgPSBjb2x1bW4uZmlsdGVyTXVsdGlTZWxlY3Q7XG4gICAgICAgIH1cbiAgICB9XG59XG5cbmV4cG9ydCB7IENvbHVtbiB9OyIsImltcG9ydCB7IEhlYWRlckNlbGwgfSBmcm9tIFwiLi4vY2VsbC9oZWFkZXJDZWxsLmpzXCI7XG5pbXBvcnQgeyBDb2x1bW4gfSBmcm9tIFwiLi9jb2x1bW4uanNcIjtcbi8qKlxuICogQ3JlYXRlcyBhbmQgbWFuYWdlcyB0aGUgY29sdW1ucyBmb3IgdGhlIGdyaWQuICBXaWxsIGNyZWF0ZSBhIGBDb2x1bW5gIG9iamVjdCBmb3IgZWFjaCBjb2x1bW4gZGVmaW5pdGlvbiBwcm92aWRlZCBieSB0aGUgdXNlci5cbiAqL1xuY2xhc3MgQ29sdW1uTWFuYWdlciB7XG4gICAgI2NvbHVtbnM7XG4gICAgI2luZGV4Q291bnRlciA9IDA7XG4gICAgLyoqXG4gICAgICogVHJhbnNmb3JtcyB1c2VyJ3MgY29sdW1uIGRlZmluaXRpb25zIGludG8gY29uY3JldGUgYENvbHVtbmAgY2xhc3Mgb2JqZWN0cy4gIFdpbGwgYWxzbyBjcmVhdGUgYEhlYWRlckNlbGxgIG9iamVjdHMgXG4gICAgICogZm9yIGVhY2ggY29sdW1uLlxuICAgICAqIEBwYXJhbSB7QXJyYXk8T2JqZWN0Pn0gY29sdW1ucyBDb2x1bW4gZGVmaW5pdGlvbnMgZnJvbSB1c2VyLlxuICAgICAqIEBwYXJhbSB7U2V0dGluZ3NHcmlkfSBzZXR0aW5ncyBHcmlkIHNldHRpbmdzLlxuICAgICAqL1xuICAgIGNvbnN0cnVjdG9yKGNvbHVtbnMsIHNldHRpbmdzKSB7XG4gICAgICAgIHRoaXMuI2NvbHVtbnMgPSBbXTtcbiAgICAgICAgdGhpcy5zZXR0aW5ncyA9IHNldHRpbmdzO1xuICAgICAgICB0aGlzLnRhYmxlRXZlbkNvbHVtbldpZHRocyA9IHNldHRpbmdzLnRhYmxlRXZlbkNvbHVtbldpZHRocztcbiAgICAgICAgdGhpcy5oYXNIZWFkZXJGaWx0ZXJzID0gZmFsc2U7XG5cbiAgICAgICAgZm9yIChjb25zdCBjIG9mIGNvbHVtbnMpIHtcbiAgICAgICAgICAgIGNvbnN0IGNvbCA9IG5ldyBDb2x1bW4oYywgc2V0dGluZ3MsIHRoaXMuI2luZGV4Q291bnRlcik7XG4gICAgICAgICAgXG4gICAgICAgICAgICBjb2wuaGVhZGVyQ2VsbCA9IG5ldyBIZWFkZXJDZWxsKGNvbCk7XG5cbiAgICAgICAgICAgIHRoaXMuI2NvbHVtbnMucHVzaChjb2wpO1xuICAgICAgICAgICAgdGhpcy4jaW5kZXhDb3VudGVyKys7XG4gICAgICAgIH1cbiAgICAgICAgLy8gQ2hlY2sgaWYgYW55IGNvbHVtbiBoYXMgYSBmaWx0ZXIgZGVmaW5lZFxuICAgICAgICBpZiAodGhpcy4jY29sdW1ucy5zb21lKChjKSA9PiBjLmhhc0ZpbHRlcikpIHtcbiAgICAgICAgICAgIHRoaXMuaGFzSGVhZGVyRmlsdGVycyA9IHRydWU7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoc2V0dGluZ3MudGFibGVFdmVuQ29sdW1uV2lkdGhzKSB7XG4gICAgICAgICAgICB0aGlzLiNzZXRFdmVuQ29sdW1uV2lkdGhzKCk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICAjc2V0RXZlbkNvbHVtbldpZHRocygpIHsgXG4gICAgICAgIGNvbnN0IGNvdW50ID0gKHRoaXMuI2luZGV4Q291bnRlciArIDEpO1xuICAgICAgICBjb25zdCB3aWR0aCA9IDEwMCAvIGNvdW50O1xuXG4gICAgICAgIHRoaXMuI2NvbHVtbnMuZm9yRWFjaCgoaCkgPT4gaC5oZWFkZXJDZWxsLmVsZW1lbnQuc3R5bGUud2lkdGggPSBgJHt3aWR0aH0lYCk7XG4gICAgfVxuICAgIC8qKlxuICAgICAqIEdldCBhcnJheSBvZiBgQ29sdW1uYCBvYmplY3RzLlxuICAgICAqIEByZXR1cm5zIHtBcnJheTxDb2x1bW4+fSBhcnJheSBvZiBgQ29sdW1uYCBvYmplY3RzLlxuICAgICAqL1xuICAgIGdldCBjb2x1bW5zKCkge1xuICAgICAgICByZXR1cm4gdGhpcy4jY29sdW1ucztcbiAgICB9XG4gICAgLyoqXG4gICAgICogQWRkcyBhIG5ldyBjb2x1bW4gdG8gdGhlIGNvbHVtbnMgY29sbGVjdGlvbi5cbiAgICAgKiBAcGFyYW0ge09iamVjdH0gY29sdW1uIENvbHVtbiBkZWZpbml0aW9uIG9iamVjdC5cbiAgICAgKiBAcGFyYW0ge251bWJlcn0gW2luZGV4PW51bGxdIEluZGV4IHRvIGluc2VydCB0aGUgY29sdW1uIGF0LiBJZiBudWxsLCBhcHBlbmRzIHRvIHRoZSBlbmQuXG4gICAgICovXG4gICAgYWRkQ29sdW1uKGNvbHVtbiwgaW5kZXggPSBudWxsKSB7IFxuICAgICAgICBjb25zdCBjb2wgPSBuZXcgQ29sdW1uKGNvbHVtbiwgdGhpcy5zZXR0aW5ncywgdGhpcy4jaW5kZXhDb3VudGVyKTtcbiAgICAgICAgY29sLmhlYWRlckNlbGwgPSBuZXcgSGVhZGVyQ2VsbChjb2wpO1xuXG4gICAgICAgIGlmIChpbmRleCAhPT0gbnVsbCAmJiBpbmRleCA+PSAwICYmIGluZGV4IDwgdGhpcy4jY29sdW1ucy5sZW5ndGgpIHtcbiAgICAgICAgICAgIHRoaXMuI2NvbHVtbnMuc3BsaWNlKGluZGV4LCAwLCBjb2wpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdGhpcy4jY29sdW1ucy5wdXNoKGNvbCk7XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLiNpbmRleENvdW50ZXIrKztcblxuICAgICAgICBpZiAodGhpcy50YWJsZUV2ZW5Db2x1bW5XaWR0aHMpIHtcbiAgICAgICAgICAgIHRoaXMuI3NldEV2ZW5Db2x1bW5XaWR0aHMoKTtcbiAgICAgICAgfVxuICAgIH1cbn1cblxuZXhwb3J0IHsgQ29sdW1uTWFuYWdlciB9OyIsImV4cG9ydCBkZWZhdWx0IHtcbiAgICBiYXNlSWROYW1lOiBcImRhdGFncmlkXCIsICAvL2Jhc2UgbmFtZSBmb3IgYWxsIGVsZW1lbnQgSUQncy5cbiAgICBkYXRhOiBbXSwgIC8vcm93IGRhdGEuXG4gICAgY29sdW1uczogW10sICAvL2NvbHVtbiBkZWZpbml0aW9ucy5cbiAgICBlbmFibGVQYWdpbmc6IHRydWUsICAvL2VuYWJsZSBwYWdpbmcgb2YgZGF0YS5cbiAgICBwYWdlclBhZ2VzVG9EaXNwbGF5OiA1LCAgLy9tYXggbnVtYmVyIG9mIHBhZ2VyIGJ1dHRvbnMgdG8gZGlzcGxheS5cbiAgICBwYWdlclJvd3NQZXJQYWdlOiAyNSwgIC8vcm93cyBwZXIgcGFnZS5cbiAgICBkYXRlRm9ybWF0OiBcIk1NL2RkL3l5eXlcIiwgIC8vcm93IGxldmVsIGRhdGUgZm9ybWF0LlxuICAgIGRhdGVUaW1lRm9ybWF0OiBcIk1NL2RkL3l5eXkgSEg6bW06c3NcIiwgLy9yb3cgbGV2ZWwgZGF0ZSBmb3JtYXQuXG4gICAgcmVtb3RlVXJsOiBcIlwiLCAgLy9nZXQgZGF0YSBmcm9tIHVybCBlbmRwb2ludCB2aWEgQWpheC5cbiAgICByZW1vdGVQYXJhbXM6IFwiXCIsICAvL3BhcmFtZXRlcnMgdG8gYmUgcGFzc2VkIG9uIEFqYXggcmVxdWVzdC5cbiAgICByZW1vdGVQcm9jZXNzaW5nOiBmYWxzZSwgIC8vdHJ1dGh5IHNldHMgZ3JpZCB0byBwcm9jZXNzIGZpbHRlci9zb3J0IG9uIHJlbW90ZSBzZXJ2ZXIuXG4gICAgdGFibGVDc3M6IFwiZGF0YWdyaWRzXCIsIFxuICAgIHRhYmxlSGVhZGVyVGhDc3M6IFwiXCIsXG4gICAgcGFnZXJDc3M6IFwiZGF0YWdyaWRzLXBhZ2VyXCIsIFxuICAgIHRhYmxlRmlsdGVyQ3NzOiBcImRhdGFncmlkcy1pbnB1dFwiLCAgLy9jc3MgY2xhc3MgZm9yIGhlYWRlciBmaWx0ZXIgaW5wdXQgZWxlbWVudHMuXG4gICAgdGFibGVFdmVuQ29sdW1uV2lkdGhzOiBmYWxzZSwgIC8vc2hvdWxkIGFsbCBjb2x1bW5zIGJlIGVxdWFsIHdpZHRoP1xuICAgIHRhYmxlQ3NzU29ydEFzYzogXCJkYXRhZ3JpZHMtc29ydC1pY29uIGRhdGFncmlkcy1zb3J0LWFzY1wiLFxuICAgIHRhYmxlQ3NzU29ydERlc2M6IFwiZGF0YWdyaWRzLXNvcnQtaWNvbiBkYXRhZ3JpZHMtc29ydC1kZXNjXCIsXG4gICAgcmVmcmVzaGFibGVJZDogXCJcIiwgIC8vcmVmcmVzaCByZW1vdGUgZGF0YSBzb3VyY2VzIGZvciBncmlkIGFuZC9vciBmaWx0ZXIgdmFsdWVzLlxuICAgIHJvd0NvdW50SWQ6IFwiXCIsXG4gICAgY3N2RXhwb3J0SWQ6IFwiXCIsXG4gICAgY3N2RXhwb3J0UmVtb3RlU291cmNlOiBcIlwiIC8vZ2V0IGV4cG9ydCBkYXRhIGZyb20gdXJsIGVuZHBvaW50IHZpYSBBamF4OyB1c2VmdWwgdG8gZ2V0IG5vbi1wYWdlZCBkYXRhLlxufTsiLCJpbXBvcnQgc2V0dGluZ3NEZWZhdWx0cyBmcm9tIFwiLi9zZXR0aW5nc0RlZmF1bHQuanNcIjtcblxuY2xhc3MgTWVyZ2VPcHRpb25zIHtcbiAgICAvKipcbiAgICAgKiBSZXR1cm5zIGFuIG9iamVjdCBiYXNlZCBvbiB0aGUgbWVyZ2VkIHJlc3VsdHMgb2YgdGhlIGRlZmF1bHQgYW5kIHVzZXIgcHJvdmlkZWQgc2V0dGluZ3MuXG4gICAgICogVXNlciBwcm92aWRlZCBzZXR0aW5ncyB3aWxsIG92ZXJyaWRlIGRlZmF1bHRzLlxuICAgICAqIEBwYXJhbSB7T2JqZWN0fSBzb3VyY2UgdXNlciBzdXBwbGllZCBzZXR0aW5ncy5cbiAgICAgKiBAcmV0dXJucyB7T2JqZWN0fSBzZXR0aW5ncyBtZXJnZWQgZnJvbSBkZWZhdWx0IGFuZCB1c2VyIHZhbHVlcy5cbiAgICAgKi9cbiAgICBzdGF0aWMgbWVyZ2Uoc291cmNlKSB7XG4gICAgICAgIC8vY29weSBkZWZhdWx0IGtleS92YWx1ZSBpdGVtcy5cbiAgICAgICAgbGV0IHJlc3VsdCA9IEpTT04ucGFyc2UoSlNPTi5zdHJpbmdpZnkoc2V0dGluZ3NEZWZhdWx0cykpO1xuXG4gICAgICAgIGlmIChzb3VyY2UgPT09IHVuZGVmaW5lZCB8fCBPYmplY3Qua2V5cyhzb3VyY2UpLmxlbmd0aCA9PT0gMCkge1xuICAgICAgICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgZm9yIChsZXQgW2tleSwgdmFsdWVdIG9mIE9iamVjdC5lbnRyaWVzKHNvdXJjZSkpIHtcbiAgICAgICAgICAgIGxldCB0YXJnZXRUeXBlID0gcmVzdWx0W2tleV0gIT09IHVuZGVmaW5lZCA/IHJlc3VsdFtrZXldLnRvU3RyaW5nKCkgOiB1bmRlZmluZWQ7XG4gICAgICAgICAgICBsZXQgc291cmNlVHlwZSA9IHZhbHVlLnRvU3RyaW5nKCk7XG5cbiAgICAgICAgICAgIGlmICh0YXJnZXRUeXBlICE9PSB1bmRlZmluZWQgJiYgdGFyZ2V0VHlwZSAhPT0gc291cmNlVHlwZSkge1xuICAgICAgICAgICAgICAgIHJlc3VsdFtrZXldID0gdmFsdWU7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgIH1cbn1cblxuZXhwb3J0IHsgTWVyZ2VPcHRpb25zIH07IiwiLyoqXG4gKiBJbXBsZW1lbnRzIHRoZSBwcm9wZXJ0eSBzZXR0aW5ncyBmb3IgdGhlIGdyaWQuXG4gKi9cbmNsYXNzIFNldHRpbmdzR3JpZCB7XG4gICAgLyoqXG4gICAgICogVHJhbnNsYXRlcyBzZXR0aW5ncyBmcm9tIG1lcmdlZCB1c2VyL2RlZmF1bHQgb3B0aW9ucyBpbnRvIGEgZGVmaW5pdGlvbiBvZiBncmlkIHNldHRpbmdzLlxuICAgICAqIEBwYXJhbSB7T2JqZWN0fSBvcHRpb25zIE1lcmdlZCB1c2VyL2RlZmF1bHQgb3B0aW9ucy5cbiAgICAgKi9cbiAgICBjb25zdHJ1Y3RvcihvcHRpb25zKSB7XG4gICAgICAgIHRoaXMuYmFzZUlkTmFtZSA9IG9wdGlvbnMuYmFzZUlkTmFtZTtcbiAgICAgICAgdGhpcy5lbmFibGVQYWdpbmcgPSBvcHRpb25zLmVuYWJsZVBhZ2luZztcbiAgICAgICAgdGhpcy5wYWdlclBhZ2VzVG9EaXNwbGF5ID0gb3B0aW9ucy5wYWdlclBhZ2VzVG9EaXNwbGF5O1xuICAgICAgICB0aGlzLnBhZ2VyUm93c1BlclBhZ2UgPSBvcHRpb25zLnBhZ2VyUm93c1BlclBhZ2U7XG4gICAgICAgIHRoaXMuZGF0ZUZvcm1hdCA9IG9wdGlvbnMuZGF0ZUZvcm1hdDtcbiAgICAgICAgdGhpcy5kYXRlVGltZUZvcm1hdCA9IG9wdGlvbnMuZGF0ZVRpbWVGb3JtYXQ7XG4gICAgICAgIHRoaXMucmVtb3RlVXJsID0gb3B0aW9ucy5yZW1vdGVVcmw7ICBcbiAgICAgICAgdGhpcy5yZW1vdGVQYXJhbXMgPSBvcHRpb25zLnJlbW90ZVBhcmFtcztcbiAgICAgICAgdGhpcy5yZW1vdGVQcm9jZXNzaW5nID0gZmFsc2U7XG4gICAgICAgIFxuICAgICAgICB0aGlzLmFqYXhVcmwgPSAodGhpcy5yZW1vdGVVcmwgJiYgdGhpcy5yZW1vdGVQYXJhbXMpID8gdGhpcy5fYnVpbGRBamF4VXJsKHRoaXMucmVtb3RlVXJsLCB0aGlzLnJlbW90ZVBhcmFtcykgOiB0aGlzLnJlbW90ZVVybDtcblxuICAgICAgICBpZiAodHlwZW9mIG9wdGlvbnMucmVtb3RlUHJvY2Vzc2luZyA9PT0gXCJib29sZWFuXCIgJiYgb3B0aW9ucy5yZW1vdGVQcm9jZXNzaW5nKSB7XG4gICAgICAgICAgICAvLyBSZW1vdGUgcHJvY2Vzc2luZyBzZXQgdG8gYG9uYDsgdXNlIGZpcnN0IGNvbHVtbiB3aXRoIGZpZWxkIGFzIGRlZmF1bHQgc29ydC5cbiAgICAgICAgICAgIGNvbnN0IGZpcnN0ID0gb3B0aW9ucy5jb2x1bW5zLmZpbmQoKGl0ZW0pID0+IGl0ZW0uZmllbGQgIT09IHVuZGVmaW5lZCk7XG5cbiAgICAgICAgICAgIHRoaXMucmVtb3RlUHJvY2Vzc2luZyA9IHRydWU7XG4gICAgICAgICAgICB0aGlzLnJlbW90ZVNvcnREZWZhdWx0Q29sdW1uID0gZmlyc3QuZmllbGQ7XG4gICAgICAgICAgICB0aGlzLnJlbW90ZVNvcnREZWZhdWx0RGlyZWN0aW9uID0gXCJkZXNjXCI7XG4gICAgICAgIH0gZWxzZSBpZiAoT2JqZWN0LmtleXMob3B0aW9ucy5yZW1vdGVQcm9jZXNzaW5nKS5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICAvLyBSZW1vdGUgcHJvY2Vzc2luZyBzZXQgdG8gYG9uYCB1c2luZyBrZXkvdmFsdWUgcGFyYW1ldGVyIGlucHV0cyBmb3IgZGVmYXVsdCBzb3J0IGNvbHVtbi5cbiAgICAgICAgICAgIHRoaXMucmVtb3RlUHJvY2Vzc2luZyA9IHRydWU7XG4gICAgICAgICAgICB0aGlzLnJlbW90ZVNvcnREZWZhdWx0Q29sdW1uID0gb3B0aW9ucy5yZW1vdGVQcm9jZXNzaW5nLmNvbHVtbjtcbiAgICAgICAgICAgIHRoaXMucmVtb3RlU29ydERlZmF1bHREaXJlY3Rpb24gPSBvcHRpb25zLnJlbW90ZVByb2Nlc3NpbmcuZGlyZWN0aW9uID8/IFwiZGVzY1wiO1xuICAgICAgICB9IFxuXG4gICAgICAgIHRoaXMudGFibGVDc3MgPSBvcHRpb25zLnRhYmxlQ3NzO1xuICAgICAgICB0aGlzLnRhYmxlSGVhZGVyVGhDc3MgPSBvcHRpb25zLnRhYmxlSGVhZGVyVGhDc3M7XG4gICAgICAgIHRoaXMucGFnZXJDc3MgPSBvcHRpb25zLnBhZ2VyQ3NzO1xuICAgICAgICB0aGlzLnRhYmxlRmlsdGVyQ3NzID0gb3B0aW9ucy50YWJsZUZpbHRlckNzcztcbiAgICAgICAgdGhpcy50YWJsZUV2ZW5Db2x1bW5XaWR0aHMgPSBvcHRpb25zLnRhYmxlRXZlbkNvbHVtbldpZHRocztcbiAgICAgICAgdGhpcy50YWJsZUNzc1NvcnRBc2MgPSBvcHRpb25zLnRhYmxlQ3NzU29ydEFzYztcbiAgICAgICAgdGhpcy50YWJsZUNzc1NvcnREZXNjID0gb3B0aW9ucy50YWJsZUNzc1NvcnREZXNjO1xuICAgICAgICB0aGlzLnJlZnJlc2hhYmxlSWQgPSBvcHRpb25zLnJlZnJlc2hhYmxlSWQ7XG4gICAgICAgIHRoaXMucm93Q291bnRJZCA9IG9wdGlvbnMucm93Q291bnRJZDtcbiAgICAgICAgdGhpcy5jc3ZFeHBvcnRJZCA9IG9wdGlvbnMuY3N2RXhwb3J0SWQ7XG4gICAgICAgIHRoaXMuY3N2RXhwb3J0UmVtb3RlU291cmNlID0gb3B0aW9ucy5jc3ZFeHBvcnRSZW1vdGVTb3VyY2U7XG4gICAgfVxuICAgIC8qKlxuICAgICAqIENvbXBpbGVzIHRoZSBrZXkvdmFsdWUgcXVlcnkgcGFyYW1ldGVycyBpbnRvIGEgZnVsbHkgcXVhbGlmaWVkIHVybCB3aXRoIHF1ZXJ5IHN0cmluZy5cbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gdXJsIGJhc2UgdXJsLlxuICAgICAqIEBwYXJhbSB7b2JqZWN0fSBwYXJhbXMgcXVlcnkgc3RyaW5nIHBhcmFtZXRlcnMuXG4gICAgICogQHJldHVybnMge3N0cmluZ30gdXJsIHdpdGggcXVlcnkgcGFyYW1ldGVycy5cbiAgICAgKi9cbiAgICBfYnVpbGRBamF4VXJsKHVybCwgcGFyYW1zKSB7XG4gICAgICAgIGNvbnN0IHAgPSBPYmplY3Qua2V5cyhwYXJhbXMpO1xuXG4gICAgICAgIGlmIChwLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgIGNvbnN0IHF1ZXJ5ID0gcC5tYXAoayA9PiBgJHtlbmNvZGVVUklDb21wb25lbnQoayl9PSR7ZW5jb2RlVVJJQ29tcG9uZW50KHBhcmFtc1trXSl9YClcbiAgICAgICAgICAgICAgICAuam9pbihcIiZcIik7XG5cbiAgICAgICAgICAgIHJldHVybiBgJHt1cmx9PyR7cXVlcnl9YDtcbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgcmV0dXJuIHVybDtcbiAgICB9XG59XG5cbmV4cG9ydCB7IFNldHRpbmdzR3JpZCB9OyIsImNsYXNzIERhdGFMb2FkZXIge1xuICAgIC8qKlxuICAgICAqIENyZWF0ZSBjbGFzcyB0byByZXRyaWV2ZSBkYXRhIHZpYSBhbiBBamF4IGNhbGwuXG4gICAgICogQHBhcmFtIHtTZXR0aW5nc0dyaWR9IHNldHRpbmdzIGdyaWQgc2V0dGluZ3MuXG4gICAgICovXG4gICAgY29uc3RydWN0b3Ioc2V0dGluZ3MpIHtcbiAgICAgICAgdGhpcy5hamF4VXJsID0gc2V0dGluZ3MuYWpheFVybDtcbiAgICB9XG4gICAgLyoqKlxuICAgICAqIFVzZXMgaW5wdXQgcGFyYW1ldGVyJ3Mga2V5L3ZhbHVlIHBhcmlzIHRvIGJ1aWxkIGEgZnVsbHkgcXVhbGlmaWVkIHVybCB3aXRoIHF1ZXJ5IHN0cmluZyB2YWx1ZXMuXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IHVybCBUYXJnZXQgdXJsLlxuICAgICAqIEBwYXJhbSB7b2JqZWN0fSBbcGFyYW1ldGVycz17fV0gSW5wdXQgcGFyYW1ldGVycy5cbiAgICAgKiBAcmV0dXJucyB7c3RyaW5nfSBGdWxseSBxdWFsaWZpZWQgdXJsLlxuICAgICAqL1xuICAgIGJ1aWxkVXJsKHVybCwgcGFyYW1ldGVycyA9IHt9KSB7XG4gICAgICAgIGNvbnN0IHAgPSBPYmplY3Qua2V5cyhwYXJhbWV0ZXJzKTtcbiAgXG4gICAgICAgIGlmIChwLmxlbmd0aCA9PT0gMCkge1xuICAgICAgICAgICAgcmV0dXJuIHVybDtcbiAgICAgICAgfVxuXG4gICAgICAgIGxldCByZXN1bHQgPSBbXTtcblxuICAgICAgICBmb3IgKGNvbnN0IGtleSBvZiBwKSB7XG4gICAgICAgICAgICBpZiAoQXJyYXkuaXNBcnJheShwYXJhbWV0ZXJzW2tleV0pKSB7XG4gICAgICAgICAgICAgICAgY29uc3QgbXVsdGkgPSBwYXJhbWV0ZXJzW2tleV0ubWFwKGsgPT4gYCR7a2V5fT0ke2VuY29kZVVSSUNvbXBvbmVudChrKX1gKTtcblxuICAgICAgICAgICAgICAgIHJlc3VsdCA9IHJlc3VsdC5jb25jYXQobXVsdGkpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICByZXN1bHQucHVzaChgJHtrZXl9PSR7ZW5jb2RlVVJJQ29tcG9uZW50KHBhcmFtZXRlcnNba2V5XSl9YCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gdXJsLmluZGV4T2YoXCI/XCIpICE9PSAtMSA/IGAke3VybH0mJHtyZXN1bHQuam9pbihcIiZcIil9YCA6IGAke3VybH0/JHtyZXN1bHQuam9pbihcIiZcIil9YDtcbiAgICB9XG4gICAgLyoqXG4gICAgICogTWFrZXMgYW4gQWpheCBjYWxsIHRvIHRhcmdldCByZXNvdXJjZSwgYW5kIHJldHVybnMgdGhlIHJlc3VsdHMgYXMgYSBKU09OIGFycmF5LlxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSB1cmwgdXJsLlxuICAgICAqIEBwYXJhbSB7T2JqZWN0fSBwYXJhbWV0ZXJzIGtleS92YWx1ZSBxdWVyeSBzdHJpbmcgcGFpcnMuXG4gICAgICogQHJldHVybnMge0FycmF5IHwgT2JqZWN0fVxuICAgICAqL1xuICAgIGFzeW5jIHJlcXVlc3REYXRhKHVybCwgcGFyYW1ldGVycyA9IHt9KSB7XG4gICAgICAgIGxldCByZXN1bHQgPSBbXTtcbiAgICAgICAgY29uc3QgdGFyZ2V0VXJsID0gdGhpcy5idWlsZFVybCh1cmwsIHBhcmFtZXRlcnMpO1xuXG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICBjb25zdCByZXNwb25zZSA9IGF3YWl0IGZldGNoKHRhcmdldFVybCwgeyBcbiAgICAgICAgICAgICAgICBtZXRob2Q6IFwiR0VUXCIsIFxuICAgICAgICAgICAgICAgIG1vZGU6IFwiY29yc1wiLFxuICAgICAgICAgICAgICAgIGhlYWRlcnM6IHsgQWNjZXB0OiBcImFwcGxpY2F0aW9uL2pzb25cIiB9IFxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIGlmIChyZXNwb25zZS5vaykge1xuICAgICAgICAgICAgICAgIHJlc3VsdCA9IGF3YWl0IHJlc3BvbnNlLmpzb24oKTtcbiAgICAgICAgICAgIH0gXG4gICAgICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgICAgICAgd2luZG93LmFsZXJ0KGVyci5tZXNzYWdlKTtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKGVyci5tZXNzYWdlKTtcbiAgICAgICAgICAgIHJlc3VsdCA9IFtdO1xuICAgICAgICB9XG4gIFxuICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgIH1cbiAgICAvKipcbiAgICAgKiBNYWtlcyBhbiBBamF4IGNhbGwgdG8gdGFyZ2V0IHJlc291cmNlIGlkZW50aWZpZWQgaW4gdGhlIGBhamF4VXJsYCBTZXR0aW5ncyBwcm9wZXJ0eSwgYW5kIHJldHVybnMgdGhlIHJlc3VsdHMgYXMgYSBKU09OIGFycmF5LlxuICAgICAqIEBwYXJhbSB7T2JqZWN0fSBbcGFyYW1ldGVycz17fV0ga2V5L3ZhbHVlIHF1ZXJ5IHN0cmluZyBwYWlycy5cbiAgICAgKiBAcmV0dXJucyB7QXJyYXkgfCBPYmplY3R9XG4gICAgICovXG4gICAgYXN5bmMgcmVxdWVzdEdyaWREYXRhKHBhcmFtZXRlcnMgPSB7fSkge1xuICAgICAgICByZXR1cm4gdGhpcy5yZXF1ZXN0RGF0YSh0aGlzLmFqYXhVcmwsIHBhcmFtZXRlcnMpO1xuICAgIH1cbn1cblxuZXhwb3J0IHsgRGF0YUxvYWRlciB9OyIsIi8qKlxuICogUHJvdmlkZXMgbWV0aG9kcyB0byBzdG9yZSBhbmQgcGVyc2lzdCBkYXRhIGZvciB0aGUgZ3JpZC5cbiAqL1xuY2xhc3MgRGF0YVBlcnNpc3RlbmNlIHtcbiAgICAvKipcbiAgICAgKiBDcmVhdGVzIGNsYXNzIG9iamVjdCB0byBzdG9yZSBhbmQgcGVyc2lzdCBncmlkIGRhdGEuXG4gICAgICogQHBhcmFtIHtBcnJheTxPYmplY3Q+fSBkYXRhIHJvdyBkYXRhLlxuICAgICAqL1xuICAgIGNvbnN0cnVjdG9yKGRhdGEpIHtcbiAgICAgICAgdGhpcy5kYXRhID0gZGF0YTtcbiAgICAgICAgdGhpcy5kYXRhQ2FjaGUgPSBkYXRhLmxlbmd0aCA+IDAgPyBzdHJ1Y3R1cmVkQ2xvbmUoZGF0YSkgOiBbXTtcbiAgICB9XG4gICAgLyoqXG4gICAgICogUmV0dXJucyB0aGUgcm93IGRhdGEuXG4gICAgICogQHJldHVybnMge251bWJlcn0gQ291bnQgb2Ygcm93cyBpbiB0aGUgZGF0YS5cbiAgICAgKi9cbiAgICBnZXQgcm93Q291bnQoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmRhdGEubGVuZ3RoO1xuICAgIH1cbiAgICAvKipcbiAgICAgKiBTYXZlcyB0aGUgZGF0YSB0byB0aGUgY2xhc3Mgb2JqZWN0LiAgV2lsbCBhbHNvIGNhY2hlIGEgY29weSBvZiB0aGUgZGF0YSBmb3IgbGF0ZXIgcmVzdG9yYXRpb24gaWYgZmlsdGVyaW5nIG9yIHNvcnRpbmcgaXMgYXBwbGllZC5cbiAgICAgKiBAcGFyYW0ge0FycmF5PG9iamVjdD59IGRhdGEgRGF0YSBzZXQuXG4gICAgICovXG4gICAgc2V0RGF0YSA9IChkYXRhKSA9PiB7XG4gICAgICAgIGlmICghQXJyYXkuaXNBcnJheShkYXRhKSkge1xuICAgICAgICAgICAgdGhpcy5kYXRhID0gW107XG4gICAgICAgICAgICB0aGlzLmRhdGFDYWNoZSA9IFtdO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5kYXRhID0gZGF0YTtcbiAgICAgICAgdGhpcy5kYXRhQ2FjaGUgPSBkYXRhLmxlbmd0aCA+IDAgPyBzdHJ1Y3R1cmVkQ2xvbmUoZGF0YSkgOiBbXTtcbiAgICB9O1xuICAgIC8qKlxuICAgICAqIFJlc2V0cyB0aGUgZGF0YSB0byB0aGUgb3JpZ2luYWwgc3RhdGUgd2hlbiB0aGUgY2xhc3Mgd2FzIGNyZWF0ZWQuXG4gICAgICovXG4gICAgcmVzdG9yZURhdGEoKSB7XG4gICAgICAgIHRoaXMuZGF0YSA9IHN0cnVjdHVyZWRDbG9uZSh0aGlzLmRhdGFDYWNoZSk7XG4gICAgfVxufVxuXG5leHBvcnQgeyBEYXRhUGVyc2lzdGVuY2UgfTsiLCIvKipcbiAqIENsYXNzIHRvIGJ1aWxkIGEgZGF0YS1wcm9jZXNzaW5nIHBpcGVsaW5lIHRoYXQgaW52b2tlcyBhbiBhc3luYyBmdW5jdGlvbiB0byByZXRyaWV2ZSBkYXRhIGZyb20gYSByZW1vdGUgc291cmNlLCBcbiAqIGFuZCBwYXNzIHRoZSByZXN1bHRzIHRvIGFuIGFzc29jaWF0ZWQgaGFuZGxlciBmdW5jdGlvbi4gIFdpbGwgZXhlY3V0ZSBzdGVwcyBpbiB0aGUgb3JkZXIgdGhleSBhcmUgYWRkZWQgdG8gdGhlIGNsYXNzLlxuICogXG4gKiBUaGUgbWFpbiBwdXJwb3NlIG9mIHRoaXMgY2xhc3MgaXMgdG8gcmV0cmlldmUgcmVtb3RlIGRhdGEgZm9yIHNlbGVjdCBpbnB1dCBjb250cm9scywgYnV0IGNhbiBiZSB1c2VkIGZvciBhbnkgaGFuZGxpbmcgXG4gKiBvZiByZW1vdGUgZGF0YSByZXRyaWV2YWwgYW5kIHByb2Nlc3NpbmcuXG4gKi9cbmNsYXNzIERhdGFQaXBlbGluZSB7XG4gICAgI3BpcGVsaW5lcztcbiAgICAvKipcbiAgICAgKiBDcmVhdGVzIGRhdGEtcHJvY2Vzc2luZyBwaXBlbGluZSBjbGFzcy4gIFdpbGwgaW50ZXJuYWxseSBidWlsZCBhIGtleS92YWx1ZSBwYWlyIG9mIGV2ZW50cyBhbmQgYXNzb2NpYXRlZFxuICAgICAqIGNhbGxiYWNrIGZ1bmN0aW9ucy4gIFZhbHVlIHdpbGwgYmUgYW4gYXJyYXkgdG8gYWNjb21tb2RhdGUgbXVsdGlwbGUgY2FsbGJhY2tzIGFzc2lnbmVkIHRvIHRoZSBzYW1lIGV2ZW50IFxuICAgICAqIGtleSBuYW1lLlxuICAgICAqIEBwYXJhbSB7U2V0dGluZ3NHcmlkfSBzZXR0aW5ncyBcbiAgICAgKi9cbiAgICBjb25zdHJ1Y3RvcihzZXR0aW5ncykge1xuICAgICAgICB0aGlzLiNwaXBlbGluZXMgPSB7fTsgXG4gICAgICAgIHRoaXMuYWpheFVybCA9IHNldHRpbmdzLmFqYXhVcmw7XG4gICAgfVxuXG4gICAgY291bnRFdmVudFN0ZXBzKGV2ZW50TmFtZSkge1xuICAgICAgICBpZiAoIXRoaXMuI3BpcGVsaW5lc1tldmVudE5hbWVdKSByZXR1cm4gMDtcblxuICAgICAgICByZXR1cm4gdGhpcy4jcGlwZWxpbmVzW2V2ZW50TmFtZV0ubGVuZ3RoO1xuICAgIH1cbiAgICAvKipcbiAgICAgKiBSZXR1cm5zIGB0cnVlYCBpZiBzdGVwcyBhcmUgcmVnaXN0ZXJlZCBmb3IgdGhlIGFzc29jaWF0ZWQgZXZlbnQgbmFtZSwgb3IgYGZhbHNlYCBpZiBubyBtYXRjaGluZyByZXN1bHRzIGFyZSBmb3VuZC5cbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gZXZlbnROYW1lIEV2ZW50IG5hbWUuXG4gICAgICogQHJldHVybnMge2Jvb2xlYW59IGB0cnVlYCBpZiByZXN1bHRzIGFyZSBmb3VuZCBmb3IgZXZlbnQgbmFtZSwgb3RoZXJ3aXNlIGBmYWxzZWAuXG4gICAgICovXG4gICAgaGFzUGlwZWxpbmUoZXZlbnROYW1lKSB7XG4gICAgICAgIGlmICghdGhpcy4jcGlwZWxpbmVzW2V2ZW50TmFtZV0pIHJldHVybiBmYWxzZTtcblxuICAgICAgICByZXR1cm4gdGhpcy4jcGlwZWxpbmVzW2V2ZW50TmFtZV0ubGVuZ3RoID4gMDtcbiAgICB9XG4gICAgLyoqXG4gICAgICogUmVnaXN0ZXIgYW4gYXN5bmNocm9ub3VzIGNhbGxiYWNrIHN0ZXAgdG8gdGhlIHBpcGVsaW5lLiAgTW9yZSB0aGFuIG9uZSBjYWxsYmFjayBjYW4gYmUgcmVnaXN0ZXJlZCB0byB0aGUgc2FtZSBldmVudCBuYW1lLlxuICAgICAqIFxuICAgICAqIElmIGEgZHVwbGljYXRlL21hdGNoaW5nIGV2ZW50IG5hbWUgYW5kIGNhbGxiYWNrIGZ1bmN0aW9uIGhhcyBhbHJlYWR5IGJlZW4gcmVnaXN0ZXJlZCwgbWV0aG9kIHdpbGwgc2tpcCB0aGUgXG4gICAgICogcmVnaXN0cmF0aW9uIHByb2Nlc3MuXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IGV2ZW50TmFtZSBFdmVudCBuYW1lLlxuICAgICAqIEBwYXJhbSB7RnVuY3Rpb259IGNhbGxiYWNrIEFuIGFzeW5jIGZ1bmN0aW9uLlxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBbdXJsPVwiXCJdIFRhcmdldCB1cmwuICBXaWxsIHVzZSBgYWpheFVybGAgcHJvcGVydHkgZGVmYXVsdCBpZiBhcmd1bWVudCBpcyBlbXB0eS5cbiAgICAgKi9cbiAgICBhZGRTdGVwKGV2ZW50TmFtZSwgY2FsbGJhY2ssIHVybCA9IFwiXCIpIHtcbiAgICAgICAgaWYgKCF0aGlzLiNwaXBlbGluZXNbZXZlbnROYW1lXSkge1xuICAgICAgICAgICAgdGhpcy4jcGlwZWxpbmVzW2V2ZW50TmFtZV0gPSBbXTtcbiAgICAgICAgfSBlbHNlIGlmICh0aGlzLiNwaXBlbGluZXNbZXZlbnROYW1lXS5zb21lKCh4KSA9PiB4LmNhbGxiYWNrID09PSBjYWxsYmFjaykpIHtcbiAgICAgICAgICAgIGNvbnNvbGUud2FybihcIkNhbGxiYWNrIGZ1bmN0aW9uIGFscmVhZHkgZm91bmQgZm9yOiBcIiArIGV2ZW50TmFtZSk7XG4gICAgICAgICAgICByZXR1cm47ICAvLyBJZiBldmVudCBuYW1lIGFuZCBjYWxsYmFjayBhbHJlYWR5IGV4aXN0LCBkb24ndCBhZGQuXG4gICAgICAgIH1cblxuICAgICAgICBpZiAodXJsID09PSBcIlwiKSB7XG4gICAgICAgICAgICB1cmwgPSB0aGlzLmFqYXhVcmw7XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLiNwaXBlbGluZXNbZXZlbnROYW1lXS5wdXNoKHt1cmw6IHVybCwgY2FsbGJhY2s6IGNhbGxiYWNrfSk7XG4gICAgfVxuICAgIC8qKlxuICAgICAqIEV4ZWN1dGVzIHRoZSBIVFRQIHJlcXVlc3QocykgZm9yIHRoZSBnaXZlbiBldmVudCBuYW1lLCBhbmQgcGFzc2VzIHRoZSByZXN1bHRzIHRvIHRoZSBhc3NvY2lhdGVkIGNhbGxiYWNrIGZ1bmN0aW9uLiAgXG4gICAgICogTWV0aG9kIGV4cGVjdHMgcmV0dXJuIHR5cGUgb2YgcmVxdWVzdCB0byBiZSBhIEpTT04gcmVzcG9uc2UuXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IGV2ZW50TmFtZSBcbiAgICAgKi9cbiAgICBhc3luYyBleGVjdXRlKGV2ZW50TmFtZSkge1xuICAgICAgICBmb3IgKGxldCBpdGVtIG9mIHRoaXMuI3BpcGVsaW5lc1tldmVudE5hbWVdKSB7XG4gICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgIGNvbnN0IHJlc3BvbnNlID0gYXdhaXQgZmV0Y2goaXRlbS51cmwsIHsgXG4gICAgICAgICAgICAgICAgICAgIG1ldGhvZDogXCJHRVRcIiwgXG4gICAgICAgICAgICAgICAgICAgIG1vZGU6IFwiY29yc1wiLFxuICAgICAgICAgICAgICAgICAgICBoZWFkZXJzOiB7IEFjY2VwdDogXCJhcHBsaWNhdGlvbi9qc29uXCIgfSBcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICBpZiAocmVzcG9uc2Uub2spIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgZGF0YSA9IGF3YWl0IHJlc3BvbnNlLmpzb24oKTtcblxuICAgICAgICAgICAgICAgICAgICBpdGVtLmNhbGxiYWNrKGRhdGEpO1xuICAgICAgICAgICAgICAgIH0gXG4gICAgICAgICAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgICAgICAgICAgICB3aW5kb3cuYWxlcnQoZXJyLm1lc3NhZ2UpO1xuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKGVyci5tZXNzYWdlKTtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cbn1cblxuZXhwb3J0IHsgRGF0YVBpcGVsaW5lIH07IiwiY2xhc3MgRWxlbWVudEhlbHBlciB7XG4gICAgLyoqXG4gICAgICogQ3JlYXRlcyBhbiBIVE1MIGVsZW1lbnQgd2l0aCB0aGUgc3BlY2lmaWVkIHRhZyBhbmQgcHJvcGVydGllcy5cbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gdGFnIFRoZSB0YWcgbmFtZSBvZiB0aGUgZWxlbWVudCB0byBjcmVhdGUuXG4gICAgICogQHBhcmFtIHtPYmplY3R9IFtwcm9wZXJ0aWVzPXt9XSBBbiBvYmplY3QgY29udGFpbmluZyBwcm9wZXJ0aWVzIHRvIGFzc2lnbiB0byB0aGUgZWxlbWVudC5cbiAgICAgKiBAcGFyYW0ge09iamVjdH0gW2RhdGFzZXQ9e31dIEFuIG9iamVjdCBjb250YWluaW5nIGRhdGFzZXQgYXR0cmlidXRlcyB0byBhc3NpZ24gdG8gdGhlIGVsZW1lbnQuXG4gICAgICogQHJldHVybnMge0hUTUxFbGVtZW50fSBUaGUgY3JlYXRlZCBIVE1MIGVsZW1lbnQuXG4gICAgICovXG4gICAgc3RhdGljIGNyZWF0ZSh0YWcsIHByb3BlcnRpZXMgPSB7fSwgZGF0YXNldCA9IHt9KSB7XG4gICAgICAgIGNvbnN0IGVsZW1lbnQgPSBPYmplY3QuYXNzaWduKGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQodGFnKSwgcHJvcGVydGllcyk7XG5cbiAgICAgICAgaWYgKGRhdGFzZXQpIHsgXG4gICAgICAgICAgICBPYmplY3QuYXNzaWduKGVsZW1lbnQuZGF0YXNldCwgZGF0YXNldCk7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gZWxlbWVudDtcbiAgICB9XG4gICAgLyoqXG4gICAgICogQ3JlYXRlcyBhIGBkaXZgIGVsZW1lbnQgd2l0aCB0aGUgc3BlY2lmaWVkIHByb3BlcnRpZXMgYW5kIGRhdGFzZXQuXG4gICAgICogQHBhcmFtIHtPYmplY3R9IFtwcm9wZXJ0aWVzPXt9XSBBbiBvYmplY3QgY29udGFpbmluZyBwcm9wZXJ0aWVzIHRvIGFzc2lnbiB0byB0aGUgZWxlbWVudC5cbiAgICAgKiBAcGFyYW0ge09iamVjdH0gW2RhdGFzZXQ9e31dIEFuIG9iamVjdCBjb250YWluaW5nIGRhdGFzZXQgYXR0cmlidXRlcyB0byBhc3NpZ24gdG8gdGhlIGVsZW1lbnQuXG4gICAgICogQHJldHVybnMge0hUTUxEaXZFbGVtZW50fSBUaGUgY3JlYXRlZCBIVE1MIGVsZW1lbnQuXG4gICAgICovXG4gICAgc3RhdGljIGRpdihwcm9wZXJ0aWVzID0ge30sIGRhdGFzZXQgPSB7fSkge1xuICAgICAgICByZXR1cm4gdGhpcy5jcmVhdGUoXCJkaXZcIiwgcHJvcGVydGllcywgZGF0YXNldCk7XG4gICAgfVxuICAgIC8qKlxuICAgICAqIENyZWF0ZXMgYSBgaW5wdXRgIGVsZW1lbnQgd2l0aCB0aGUgc3BlY2lmaWVkIHByb3BlcnRpZXMgYW5kIGRhdGFzZXQuXG4gICAgICogQHBhcmFtIHtPYmplY3R9IFtwcm9wZXJ0aWVzPXt9XSBBbiBvYmplY3QgY29udGFpbmluZyBwcm9wZXJ0aWVzIHRvIGFzc2lnbiB0byB0aGUgZWxlbWVudC5cbiAgICAgKiBAcGFyYW0ge09iamVjdH0gW2RhdGFzZXQ9e31dIEFuIG9iamVjdCBjb250YWluaW5nIGRhdGFzZXQgYXR0cmlidXRlcyB0byBhc3NpZ24gdG8gdGhlIGVsZW1lbnQuXG4gICAgICogQHJldHVybnMge0hUTUxJbnB1dEVsZW1lbnR9IFRoZSBjcmVhdGVkIEhUTUwgZWxlbWVudC5cbiAgICAgKi9cbiAgICBzdGF0aWMgaW5wdXQocHJvcGVydGllcyA9IHt9LCBkYXRhc2V0ID0ge30pIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuY3JlYXRlKFwiaW5wdXRcIiwgcHJvcGVydGllcywgZGF0YXNldCk7XG4gICAgfVxuICAgIC8qKlxuICAgICAqIENyZWF0ZXMgYSBgc3BhbmAgZWxlbWVudCB3aXRoIHRoZSBzcGVjaWZpZWQgcHJvcGVydGllcyBhbmQgZGF0YXNldC5cbiAgICAgKiBAcGFyYW0ge09iamVjdH0gW3Byb3BlcnRpZXM9e31dIEFuIG9iamVjdCBjb250YWluaW5nIHByb3BlcnRpZXMgdG8gYXNzaWduIHRvIHRoZSBlbGVtZW50LlxuICAgICAqIEBwYXJhbSB7T2JqZWN0fSBbZGF0YXNldD17fV0gQW4gb2JqZWN0IGNvbnRhaW5pbmcgZGF0YXNldCBhdHRyaWJ1dGVzIHRvIGFzc2lnbiB0byB0aGUgZWxlbWVudC5cbiAgICAgKiBAcmV0dXJucyB7SFRNTFNwYW5FbGVtZW50fSBUaGUgY3JlYXRlZCBIVE1MIGVsZW1lbnQuXG4gICAgICovXG4gICAgc3RhdGljIHNwYW4ocHJvcGVydGllcyA9IHt9LCBkYXRhc2V0ID0ge30pIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuY3JlYXRlKFwic3BhblwiLCBwcm9wZXJ0aWVzLCBkYXRhc2V0KTtcbiAgICB9XG59XG5cbmV4cG9ydCB7IEVsZW1lbnRIZWxwZXIgfTsiLCIvKipcbiAqIENsYXNzIHRoYXQgYWxsb3dzIHRoZSBzdWJzY3JpcHRpb24gYW5kIHB1YmxpY2F0aW9uIG9mIGdyaWQgcmVsYXRlZCBldmVudHMuXG4gKiBAY2xhc3NcbiAqL1xuY2xhc3MgR3JpZEV2ZW50cyB7XG4gICAgI2V2ZW50cztcblxuICAgIGNvbnN0cnVjdG9yKCkge1xuICAgICAgICB0aGlzLiNldmVudHMgPSB7fTtcbiAgICB9XG5cbiAgICAjZ3VhcmQoZXZlbnROYW1lKSB7XG4gICAgICAgIGlmICghdGhpcy4jZXZlbnRzKSByZXR1cm4gZmFsc2U7XG5cbiAgICAgICAgcmV0dXJuICh0aGlzLiNldmVudHNbZXZlbnROYW1lXSk7XG4gICAgfVxuICAgIC8qKlxuICAgICAqIEFkZHMgYW4gZXZlbnQgdG8gcHVibGlzaGVyIGNvbGxlY3Rpb24uXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IGV2ZW50TmFtZSBFdmVudCBuYW1lLlxuICAgICAqIEBwYXJhbSB7RnVuY3Rpb259IGhhbmRsZXIgQ2FsbGJhY2sgZnVuY3Rpb24uXG4gICAgICogQHBhcmFtIHtib29sZWFufSBbaXNBc3luYz1mYWxzZV0gVHJ1ZSBpZiBjYWxsYmFjayBzaG91bGQgZXhlY3V0ZSB3aXRoIGF3YWl0IG9wZXJhdGlvbi5cbiAgICAgKiBAcGFyYW0ge251bWJlcn0gW3ByaW9yaXR5PTBdIE9yZGVyIGluIHdoaWNoIGV2ZW50IHNob3VsZCBiZSBleGVjdXRlZC5cbiAgICAgKi9cbiAgICBzdWJzY3JpYmUoZXZlbnROYW1lLCBoYW5kbGVyLCBpc0FzeW5jID0gZmFsc2UsIHByaW9yaXR5ID0gMCkge1xuICAgICAgICBpZiAoIXRoaXMuI2V2ZW50c1tldmVudE5hbWVdKSB7XG4gICAgICAgICAgICB0aGlzLiNldmVudHNbZXZlbnROYW1lXSA9IFt7IGhhbmRsZXIsIHByaW9yaXR5LCBpc0FzeW5jIH1dO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICB0aGlzLiNldmVudHNbZXZlbnROYW1lXS5wdXNoKHsgaGFuZGxlciwgcHJpb3JpdHksIGlzQXN5bmMgfSk7XG4gICAgICAgIHRoaXMuI2V2ZW50c1tldmVudE5hbWVdLnNvcnQoKGEsIGIpID0+IHtcbiAgICAgICAgICAgIHJldHVybiBhLnByaW9yaXR5IC0gYi5wcmlvcml0eTtcbiAgICAgICAgfSk7XG4gICAgfVxuICAgIC8qKlxuICAgICAqIFJlbW92ZXMgdGhlIHRhcmdldCBldmVudCBmcm9tIHRoZSBwdWJsaWNhdGlvbiBjaGFpbi5cbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gZXZlbnROYW1lIEV2ZW50IG5hbWUuXG4gICAgICogQHBhcmFtIHtGdW5jdGlvbn0gaGFuZGxlciBFdmVudCBoYW5kbGVyLlxuICAgICAqL1xuICAgIHVuc3Vic2NyaWJlKGV2ZW50TmFtZSwgaGFuZGxlcikge1xuICAgICAgICBpZiAoIXRoaXMuI2d1YXJkKGV2ZW50TmFtZSkpIHJldHVybjtcblxuICAgICAgICB0aGlzLiNldmVudHNbZXZlbnROYW1lXSA9IHRoaXMuI2V2ZW50c1tldmVudE5hbWVdLmZpbHRlcihoID0+IGggIT09IGhhbmRsZXIpO1xuICAgIH1cbiAgICAvKipcbiAgICAgKiBUYWtlcyB0aGUgcmVzdWx0IG9mIGVhY2ggc3Vic2NyaWJlcidzIGNhbGxiYWNrIGZ1bmN0aW9uIGFuZCBjaGFpbnMgdGhlbSBpbnRvIG9uZSByZXN1bHQuXG4gICAgICogVXNlZCB0byBjcmVhdGUgYSBsaXN0IG9mIHBhcmFtZXRlcnMgZnJvbSBtdWx0aXBsZSBtb2R1bGVzOiBpLmUuIHNvcnQsIGZpbHRlciwgYW5kIHBhZ2luZyBpbnB1dHMuXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IGV2ZW50TmFtZSBldmVudCBuYW1lXG4gICAgICogQHBhcmFtIHtPYmplY3R9IFtpbml0aWFsVmFsdWU9e31dIGluaXRpYWwgdmFsdWVcbiAgICAgKiBAcmV0dXJucyB7T2JqZWN0fVxuICAgICAqL1xuICAgIGNoYWluKGV2ZW50TmFtZSwgaW5pdGlhbFZhbHVlID0ge30pIHtcbiAgICAgICAgaWYgKCF0aGlzLiNndWFyZChldmVudE5hbWUpKSByZXR1cm47XG5cbiAgICAgICAgbGV0IHJlc3VsdCA9IGluaXRpYWxWYWx1ZTtcblxuICAgICAgICB0aGlzLiNldmVudHNbZXZlbnROYW1lXS5mb3JFYWNoKChoKSA9PiB7XG4gICAgICAgICAgICByZXN1bHQgPSBoLmhhbmRsZXIocmVzdWx0KTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICB9XG4gICAgLyoqXG4gICAgICogVHJpZ2dlciBjYWxsYmFjayBmdW5jdGlvbiBmb3Igc3Vic2NyaWJlcnMgb2YgdGhlIGBldmVudE5hbWVgLlxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBldmVudE5hbWUgRXZlbnQgbmFtZS5cbiAgICAgKiBAcGFyYW0gIHsuLi5hbnl9IGFyZ3MgQXJndW1lbnRzLlxuICAgICAqL1xuICAgIGFzeW5jIHRyaWdnZXIoZXZlbnROYW1lLCAuLi5hcmdzKSB7XG4gICAgICAgIGlmICghdGhpcy4jZ3VhcmQoZXZlbnROYW1lKSkgcmV0dXJuO1xuXG4gICAgICAgIGZvciAobGV0IGggb2YgdGhpcy4jZXZlbnRzW2V2ZW50TmFtZV0pIHtcbiAgICAgICAgICAgIGlmIChoLmlzQXN5bmMpIHtcbiAgICAgICAgICAgICAgICBhd2FpdCBoLmhhbmRsZXIoLi4uYXJncyk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGguaGFuZGxlciguLi5hcmdzKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cbn1cblxuZXhwb3J0IHsgR3JpZEV2ZW50cyB9OyIsImltcG9ydCB7IENlbGwgfSBmcm9tIFwiLi4vY2VsbC9jZWxsLmpzXCI7XG4vKipcbiAqIENsYXNzIHRvIG1hbmFnZSB0aGUgdGFibGUgZWxlbWVudCBhbmQgaXRzIHJvd3MgYW5kIGNlbGxzLlxuICovXG5jbGFzcyBUYWJsZSB7XG4gICAgI3Jvd0NvdW50O1xuICAgIC8qKlxuICAgICAqIENyZWF0ZSBgVGFibGVgIGNsYXNzIHRvIG1hbmFnZSB0aGUgdGFibGUgZWxlbWVudCBhbmQgaXRzIHJvd3MgYW5kIGNlbGxzLlxuICAgICAqIEBwYXJhbSB7R3JpZENvbnRleHR9IGNvbnRleHQgR3JpZCBjb250ZXh0LlxuICAgICAqL1xuICAgIGNvbnN0cnVjdG9yKGNvbnRleHQpIHtcbiAgICAgICAgdGhpcy5jb250ZXh0ID0gY29udGV4dDtcbiAgICAgICAgdGhpcy50YWJsZSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJ0YWJsZVwiKTtcbiAgICAgICAgdGhpcy50aGVhZCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJ0aGVhZFwiKTtcbiAgICAgICAgdGhpcy50Ym9keSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJ0Ym9keVwiKTtcbiAgICAgICAgdGhpcy4jcm93Q291bnQgPSAwO1xuXG4gICAgICAgIHRoaXMudGFibGUuaWQgPSBgJHtjb250ZXh0LnNldHRpbmdzLmJhc2VJZE5hbWV9X3RhYmxlYDtcbiAgICAgICAgdGhpcy50YWJsZS5hcHBlbmQodGhpcy50aGVhZCwgdGhpcy50Ym9keSk7XG4gICAgICAgIHRoaXMudGFibGUuY2xhc3NOYW1lID0gY29udGV4dC5zZXR0aW5ncy50YWJsZUNzcztcbiAgICB9XG4gICAgLyoqXG4gICAgICogSW5pdGlhbGl6ZXMgdGhlIHRhYmxlIGhlYWRlciByb3cgZWxlbWVudCBieSBjcmVhdGluZyBhIHJvdyBhbmQgYXBwZW5kaW5nIGVhY2ggY29sdW1uJ3MgaGVhZGVyIGNlbGwuXG4gICAgICovXG4gICAgaW5pdGlhbGl6ZUhlYWRlcigpIHtcbiAgICAgICAgY29uc3QgdHIgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwidHJcIik7XG5cbiAgICAgICAgZm9yIChjb25zdCBjb2x1bW4gb2YgdGhpcy5jb250ZXh0LmNvbHVtbk1hbmFnZXIuY29sdW1ucykge1xuICAgICAgICAgICAgdHIuYXBwZW5kQ2hpbGQoY29sdW1uLmhlYWRlckNlbGwuZWxlbWVudCk7XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLnRoZWFkLmFwcGVuZENoaWxkKHRyKTtcbiAgICB9XG4gICAgLyoqXG4gICAgICogUmVuZGVyIHRhYmxlIGJvZHkgcm93cy4gIFdpbGwgcmVtb3ZlIGFueSBwcmlvciB0YWJsZSBib2R5IHJlc3VsdHMgYW5kIGJ1aWxkIG5ldyByb3dzIGFuZCBjZWxscy5cbiAgICAgKiBAcGFyYW0ge0FycmF5PE9iamVjdD59IGRhdGFzZXQgRGF0YSBzZXQgdG8gYnVpbGQgdGFibGUgcm93cy5cbiAgICAgKiBAcGFyYW0ge251bWJlciB8IG51bGx9IFtyb3dDb3VudD1udWxsXSBTZXQgdGhlIHJvdyBjb3VudCBwYXJhbWV0ZXIgdG8gYSBzcGVjaWZpYyB2YWx1ZSBpZiBcbiAgICAgKiByZW1vdGUgcHJvY2Vzc2luZyBpcyBiZWluZyB1c2VkLCBvdGhlcndpc2Ugd2lsbCB1c2UgdGhlIGxlbmd0aCBvZiB0aGUgZGF0YXNldC5cbiAgICAgKi9cbiAgICByZW5kZXJSb3dzKGRhdGFzZXQsIHJvd0NvdW50ID0gbnVsbCkge1xuICAgICAgICAvL0NsZWFyIGJvZHkgb2YgcHJldmlvdXMgZGF0YS5cbiAgICAgICAgdGhpcy50Ym9keS5yZXBsYWNlQ2hpbGRyZW4oKTtcbiAgICAgICAgXG4gICAgICAgIGlmICghQXJyYXkuaXNBcnJheShkYXRhc2V0KSkge1xuICAgICAgICAgICAgdGhpcy4jcm93Q291bnQgPSAwO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy4jcm93Q291bnQgPSByb3dDb3VudCA/PyBkYXRhc2V0Lmxlbmd0aDtcblxuICAgICAgICBmb3IgKGNvbnN0IGRhdGEgb2YgZGF0YXNldCkge1xuICAgICAgICAgICAgY29uc3QgdHIgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwidHJcIik7XG5cbiAgICAgICAgICAgIGZvciAobGV0IGNvbHVtbiBvZiB0aGlzLmNvbnRleHQuY29sdW1uTWFuYWdlci5jb2x1bW5zKSB7XG4gICAgICAgICAgICAgICAgY29uc3QgY2VsbCA9IG5ldyBDZWxsKGRhdGEsIGNvbHVtbiwgdGhpcy5jb250ZXh0Lm1vZHVsZXMsIHRyKTtcblxuICAgICAgICAgICAgICAgIHRyLmFwcGVuZENoaWxkKGNlbGwuZWxlbWVudCk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHRoaXMudGJvZHkuYXBwZW5kQ2hpbGQodHIpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgZ2V0IHJvd0NvdW50KCkge1xuICAgICAgICByZXR1cm4gdGhpcy4jcm93Q291bnQ7XG4gICAgfVxufVxuXG5leHBvcnQgeyBUYWJsZSB9OyIsImltcG9ydCB7IENvbHVtbk1hbmFnZXIgfSBmcm9tIFwiLi4vY29sdW1uL2NvbHVtbk1hbmFnZXIuanNcIjtcbmltcG9ydCB7IERhdGFQaXBlbGluZSB9IGZyb20gXCIuLi9kYXRhL2RhdGFQaXBlbGluZS5qc1wiO1xuaW1wb3J0IHsgRGF0YUxvYWRlciB9IGZyb20gXCIuLi9kYXRhL2RhdGFMb2FkZXIuanNcIjtcbmltcG9ydCB7IERhdGFQZXJzaXN0ZW5jZSB9IGZyb20gXCIuLi9kYXRhL2RhdGFQZXJzaXN0ZW5jZS5qc1wiO1xuaW1wb3J0IHsgR3JpZEV2ZW50cyB9IGZyb20gXCIuLi9ldmVudHMvZ3JpZEV2ZW50cy5qc1wiO1xuaW1wb3J0IHsgVGFibGUgfSBmcm9tIFwiLi4vdGFibGUvdGFibGUuanNcIjtcbi8qKlxuICogUHJvdmlkZXMgdGhlIGNvbnRleHQgZm9yIHRoZSBncmlkLCBpbmNsdWRpbmcgc2V0dGluZ3MsIGRhdGEsIGFuZCBtb2R1bGVzLiAgVGhpcyBjbGFzcyBpcyByZXNwb25zaWJsZSBmb3IgbWFuYWdpbmcgXG4gKiB0aGUgZ3JpZCdzIGNvcmUgc3RhdGUgYW5kIGJlaGF2aW9yLlxuICovXG5jbGFzcyBHcmlkQ29udGV4dCB7XG4gICAgLyoqXG4gICAgICogQ3JlYXRlIGdyaWQgY29udGV4dCwgd2hpY2ggcmVwcmVzZW50cyB0aGUgY29yZSBsb2dpYyBhbmQgZnVuY3Rpb25hbGl0eSBvZiB0aGUgZGF0YSBncmlkLlxuICAgICAqIEBwYXJhbSB7QXJyYXk8b2JqZWN0Pn0gY29sdW1ucyBDb2x1bW4gZGVmaW5pdGlvbi5cbiAgICAgKiBAcGFyYW0ge1NldHRpbmdzR3JpZH0gc2V0dGluZ3MgR3JpZCBzZXR0aW5ncy5cbiAgICAgKiBAcGFyYW0ge2FueVtdfSBbZGF0YT1bXV0gR3JpZCBkYXRhLlxuICAgICAqL1xuICAgIGNvbnN0cnVjdG9yKGNvbHVtbnMsIHNldHRpbmdzLCBkYXRhID0gW10pIHtcbiAgICAgICAgdGhpcy5zZXR0aW5ncyA9IHNldHRpbmdzO1xuICAgICAgICB0aGlzLmV2ZW50cyA9IG5ldyBHcmlkRXZlbnRzKCk7XG4gICAgICAgIHRoaXMucGlwZWxpbmUgPSBuZXcgRGF0YVBpcGVsaW5lKHRoaXMuc2V0dGluZ3MpO1xuICAgICAgICB0aGlzLmRhdGFsb2FkZXIgPSBuZXcgRGF0YUxvYWRlcih0aGlzLnNldHRpbmdzKTtcbiAgICAgICAgdGhpcy5wZXJzaXN0ZW5jZSA9IG5ldyBEYXRhUGVyc2lzdGVuY2UoZGF0YSk7XG4gICAgICAgIHRoaXMuY29sdW1uTWFuYWdlciA9IG5ldyBDb2x1bW5NYW5hZ2VyKGNvbHVtbnMsIHRoaXMuc2V0dGluZ3MpO1xuICAgICAgICB0aGlzLmdyaWQgPSBuZXcgVGFibGUodGhpcyk7XG4gICAgICAgIHRoaXMubW9kdWxlcyA9IHt9O1xuICAgIH1cbn1cblxuZXhwb3J0IHsgR3JpZENvbnRleHQgfTsiLCIvKipcbiAqIFByb3ZpZGVzIGxvZ2ljIHRvIGNvbnZlcnQgZ3JpZCBkYXRhIGludG8gYSBkb3dubG9hZGFibGUgQ1NWIGZpbGUuXG4gKiBNb2R1bGUgd2lsbCBwcm92aWRlIGxpbWl0ZWQgZm9ybWF0dGluZyBvZiBkYXRhLiAgT25seSBjb2x1bW5zIHdpdGggYSBmb3JtYXR0ZXIgdHlwZSBcbiAqIG9mIGBtb2R1bGVgIG9yIGBmdW5jdGlvbmAgd2lsbCBiZSBwcm9jZXNzZWQuICBBbGwgb3RoZXIgY29sdW1ucyB3aWxsIGJlIHJldHVybmVkIGFzXG4gKiB0aGVpciByYXcgZGF0YSB0eXBlLiAgSWYgYSBjb2x1bW4ncyB2YWx1ZSBjb250YWlucyBhIGNvbW1hLCB0aGUgdmFsdWUgd2lsbCBiZSBkb3VibGUgcXVvdGVkLlxuICovXG5jbGFzcyBDc3ZNb2R1bGUge1xuICAgIC8qKlxuICAgICAqIEFsbG93cyBncmlkJ3MgZGF0YSB0byBiZSBjb252ZXJ0ZWQgaW50byBhIGRvd25sb2FkYWJsZSBDU1YgZmlsZS4gIElmIGdyaWQgaXMgXG4gICAgICogc2V0IHRvIGEgbG9jYWwgZGF0YSBzb3VyY2UsIHRoZSBkYXRhIGNhY2hlIGluIHRoZSBwZXJzaXN0ZW5jZSBjbGFzcyBpcyB1c2VkLlxuICAgICAqIE90aGVyd2lzZSwgY2xhc3Mgd2lsbCBtYWtlIGFuIEFqYXggY2FsbCB0byByZW1vdGUgdGFyZ2V0IHNldCBpbiBkYXRhIGxvYWRlclxuICAgICAqIGNsYXNzLlxuICAgICAqIEBwYXJhbSB7R3JpZENvbnRleHR9IGNvbnRleHQgR3JpZCBjb250ZXh0IGNsYXNzLlxuICAgICAqL1xuICAgIGNvbnN0cnVjdG9yKGNvbnRleHQpIHtcbiAgICAgICAgdGhpcy5jb250ZXh0ID0gY29udGV4dDtcbiAgICAgICAgdGhpcy5kZWxpbWl0ZXIgPSBcIixcIjtcbiAgICAgICAgdGhpcy5idXR0b24gPSBjb250ZXh0LnNldHRpbmdzLmNzdkV4cG9ydElkO1xuICAgICAgICB0aGlzLmRhdGFVcmwgPSBjb250ZXh0LnNldHRpbmdzLmNzdkV4cG9ydFJlbW90ZVNvdXJjZTtcbiAgICB9XG5cbiAgICBpbml0aWFsaXplKCkge1xuICAgICAgICBjb25zdCBidG4gPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCh0aGlzLmJ1dHRvbik7XG4gICAgICAgIFxuICAgICAgICBidG4uYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsIHRoaXMuaGFuZGxlRG93bmxvYWQpO1xuICAgIH1cblxuICAgIGhhbmRsZURvd25sb2FkID0gYXN5bmMgKCkgPT4ge1xuICAgICAgICBsZXQgY3N2RGF0YSA9IFtdO1xuICAgICAgICBjb25zdCBmaWxlTmFtZSA9IGAke2RvY3VtZW50LnRpdGxlfS5jc3ZgO1xuXG4gICAgICAgIGlmICh0aGlzLmRhdGFVcmwpIHtcbiAgICAgICAgICAgIGNvbnN0IGRhdGEgPSBhd2FpdCB0aGlzLmNvbnRleHQuZGF0YWxvYWRlci5yZXF1ZXN0RGF0YSh0aGlzLmRhdGFVcmwpO1xuXG4gICAgICAgICAgICBjc3ZEYXRhID0gdGhpcy5idWlsZEZpbGVDb250ZW50KGRhdGEpLmpvaW4oXCJcXHJcXG5cIik7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBjc3ZEYXRhID0gdGhpcy5idWlsZEZpbGVDb250ZW50KHRoaXMuY29udGV4dC5wZXJzaXN0ZW5jZS5kYXRhQ2FjaGUpLmpvaW4oXCJcXHJcXG5cIik7XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCBibG9iID0gbmV3IEJsb2IoW2NzdkRhdGFdLCB7IHR5cGU6IFwidGV4dC9jc3Y7Y2hhcnNldD11dGYtODtcIiB9KTtcbiAgICAgICAgY29uc3QgZWxlbWVudCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJhXCIpO1xuXG4gICAgICAgIGVsZW1lbnQuc2V0QXR0cmlidXRlKFwiaHJlZlwiLCB3aW5kb3cuVVJMLmNyZWF0ZU9iamVjdFVSTChibG9iKSk7XG4gICAgICAgIC8vc2V0IGZpbGUgdGl0bGVcbiAgICAgICAgZWxlbWVudC5zZXRBdHRyaWJ1dGUoXCJkb3dubG9hZFwiLCBmaWxlTmFtZSk7XG4gICAgICAgIC8vdHJpZ2dlciBkb3dubG9hZFxuICAgICAgICBlbGVtZW50LnN0eWxlLmRpc3BsYXkgPSBcIm5vbmVcIjtcbiAgICAgICAgZG9jdW1lbnQuYm9keS5hcHBlbmRDaGlsZChlbGVtZW50KTtcbiAgICAgICAgZWxlbWVudC5jbGljaygpO1xuICAgICAgICAvL3JlbW92ZSB0ZW1wb3JhcnkgbGluayBlbGVtZW50XG4gICAgICAgIGRvY3VtZW50LmJvZHkucmVtb3ZlQ2hpbGQoZWxlbWVudCk7XG5cbiAgICAgICAgd2luZG93LmFsZXJ0KGBEb3dubG9hZGVkICR7ZmlsZU5hbWV9YCk7XG4gICAgfTtcbiAgICAvKipcbiAgICAgKiBSZXR1cm5zIGFuIG9iamVjdCB0aGF0IHJlcHJlc2VudHMgdGhlIGNvbHVtbnMgYW5kIGhlYWRlciBuYW1lcyB0aGF0IHNob3VsZCBiZSB1c2VkXG4gICAgICogdG8gY3JlYXRlIHRoZSBDU1YgcmVzdWx0cy4gIFdpbGwgZXhjbHVkZSBjb2x1bW5zIHdpdGggYSB0eXBlIG9mIGBpY29uYC5cbiAgICAgKiBAcGFyYW0ge09iamVjdH0gY29sdW1uTWdyQ29sdW1ucyBDb2x1bW4gTWFuYWdlciBDb2x1bW5zIGNvbGxlY3Rpb24uXG4gICAgICogQHJldHVybnMge3sgaGVhZGVyczogQXJyYXk8c3RyaW5nPiwgY29sdW1uczogQXJyYXk8Q29sdW1uPiB9fVxuICAgICAqL1xuICAgIGlkZW50aWZ5Q29sdW1ucyhjb2x1bW5NZ3JDb2x1bW5zKSB7XG4gICAgICAgIGNvbnN0IGhlYWRlcnMgPSBbXTtcbiAgICAgICAgY29uc3QgY29sdW1ucyA9IFtdO1xuXG4gICAgICAgIGZvciAoY29uc3QgY29sdW1uIG9mIGNvbHVtbk1nckNvbHVtbnMpIHtcbiAgICAgICAgICAgIGlmIChjb2x1bW4udHlwZSA9PT0gXCJpY29uXCIpIGNvbnRpbnVlO1xuXG4gICAgICAgICAgICBoZWFkZXJzLnB1c2goY29sdW1uLmxhYmVsKTtcbiAgICAgICAgICAgIGNvbHVtbnMucHVzaChjb2x1bW4pO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHsgaGVhZGVyczogaGVhZGVycywgY29sdW1uczogY29sdW1ucyB9OyBcbiAgICB9XG4gICAgLyoqXG4gICAgICogQ29udmVydHMgZ3JpZCBkYXRhIGluIERhdGFQZXJzaXN0ZW5jZSBjbGFzcyBpbnRvIGEgc2luZ2xlIGRpbWVuc2lvbmFsIGFycmF5IG9mXG4gICAgICogc3RyaW5nIGRlbGltaXRlZCB2YWx1ZXMgdGhhdCByZXByZXNlbnRzIGEgcm93IG9mIGRhdGEgaW4gYSBjc3YgZmlsZS4gXG4gICAgICogQHBhcmFtIHtBcnJheTxPYmplY3Q+fSBkYXRhc2V0IGRhdGEgc2V0IHRvIGJ1aWxkIGNzdiByb3dzLlxuICAgICAqIEByZXR1cm5zIHtBcnJheTxzdHJpbmc+fVxuICAgICAqL1xuICAgIGJ1aWxkRmlsZUNvbnRlbnQoZGF0YXNldCkge1xuICAgICAgICBjb25zdCBmaWxlQ29udGVudHMgPSBbXTtcbiAgICAgICAgY29uc3QgY29sdW1ucyA9IHRoaXMuaWRlbnRpZnlDb2x1bW5zKHRoaXMuY29udGV4dC5jb2x1bW5NYW5hZ2VyLmNvbHVtbnMpO1xuICAgICAgICAvL2NyZWF0ZSBkZWxpbWl0ZWQgaGVhZGVyLlxuICAgICAgICBmaWxlQ29udGVudHMucHVzaChjb2x1bW5zLmhlYWRlcnMuam9pbih0aGlzLmRlbGltaXRlcikpO1xuICAgICAgICAvL2NyZWF0ZSByb3cgZGF0YVxuICAgICAgICBmb3IgKGNvbnN0IHJvd0RhdGEgb2YgZGF0YXNldCkge1xuICAgICAgICAgICAgY29uc3QgcmVzdWx0ID0gY29sdW1ucy5jb2x1bW5zLm1hcCgoYykgPT4gdGhpcy5mb3JtYXRWYWx1ZShjLCByb3dEYXRhKSk7XG5cbiAgICAgICAgICAgIGZpbGVDb250ZW50cy5wdXNoKHJlc3VsdC5qb2luKHRoaXMuZGVsaW1pdGVyKSk7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gZmlsZUNvbnRlbnRzO1xuICAgIH1cbiAgICAvKipcbiAgICAgKiBSZXR1cm5zIGEgZm9ybWF0dGVkIHN0cmluZyBiYXNlZCBvbiB0aGUgQ29sdW1uJ3MgZm9ybWF0dGVyIHNldHRpbmcuXG4gICAgICogV2lsbCBkb3VibGUgcXVvdGUgc3RyaW5nIGlmIGNvbW1hIGNoYXJhY3RlciBpcyBmb3VuZCBpbiB2YWx1ZS5cbiAgICAgKiBAcGFyYW0ge0NvbHVtbn0gY29sdW1uIGNvbHVtbiBtb2RlbC5cbiAgICAgKiBAcGFyYW0ge09iamVjdH0gcm93RGF0YSByb3cgZGF0YS5cbiAgICAgKiBAcmV0dXJucyB7c3RyaW5nfVxuICAgICAqL1xuICAgIGZvcm1hdFZhbHVlKGNvbHVtbiwgcm93RGF0YSkge1xuICAgICAgICBsZXQgdmFsdWUgPSBTdHJpbmcocm93RGF0YVtjb2x1bW4uZmllbGRdKTtcbiAgICAgICAgLy9hcHBseSBsaW1pdGVkIGZvcm1hdHRpbmc7IGNzdiByZXN1bHRzIHNob3VsZCBiZSAncmF3JyBkYXRhLlxuICAgICAgICBpZiAoY29sdW1uLmZvcm1hdHRlcikge1xuICAgICAgICAgICAgaWYgKHR5cGVvZiBjb2x1bW4uZm9ybWF0dGVyID09PSBcImZ1bmN0aW9uXCIpIHtcbiAgICAgICAgICAgICAgICB2YWx1ZSA9IFN0cmluZyhjb2x1bW4uZm9ybWF0dGVyKHJvd0RhdGEsIGNvbHVtbi5mb3JtYXR0ZXJQYXJhbXMpKTtcbiAgICAgICAgICAgIH0gZWxzZSBpZiAoY29sdW1uLmZvcm1hdHRlciA9PT0gXCJtb2R1bGVcIikge1xuICAgICAgICAgICAgICAgIHZhbHVlID0gU3RyaW5nKHRoaXMuY29udGV4dC5tb2R1bGVzW2NvbHVtbi5mb3JtYXR0ZXJQYXJhbXMubmFtZV0uYXBwbHkocm93RGF0YSwgY29sdW1uLCBcImNzdlwiKSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgLy9jaGVjayBmb3Igc3RyaW5ncyB0aGF0IG1heSBuZWVkIHRvIGJlIHF1b3RlZC5cbiAgICAgICAgaWYgKHZhbHVlLmluY2x1ZGVzKFwiLFwiKSkge1xuICAgICAgICAgICAgdmFsdWUgPSBgXCIke3ZhbHVlfVwiYDtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiB2YWx1ZTtcbiAgICB9XG59XG5cbkNzdk1vZHVsZS5tb2R1bGVOYW1lID0gXCJjc3ZcIjtcblxuZXhwb3J0IHsgQ3N2TW9kdWxlIH07IiwiaW1wb3J0IHsgQ3NzSGVscGVyIH0gZnJvbSBcIi4uLy4uLy4uL2NvbXBvbmVudHMvaGVscGVycy9jc3NIZWxwZXIuanNcIjtcbmltcG9ydCB7IEVsZW1lbnRIZWxwZXIgfSBmcm9tIFwiLi4vLi4vLi4vY29tcG9uZW50cy9oZWxwZXJzL2VsZW1lbnRIZWxwZXIuanNcIjtcbi8qKlxuICogQ3JlYXRlIGZpbHRlciBvYmplY3QgdGhhdCByZXByZXNlbnRzIGEgZWxlbWVudCB0byBmaWx0ZXIgYmV0d2VlbiB0d28gdmFsdWVzLiAgQ3JlYXRlcyBhIGRyb3Bkb3duIHdpdGggYSB0d28gaW5wdXQgYm94ZXMgXG4gKiB0byBlbnRlciBzdGFydCBhbmQgZW5kIHZhbHVlcy5cbiAqL1xuY2xhc3MgRWxlbWVudEJldHdlZW4ge1xuICAgIC8qKlxuICAgICAqIENyZWF0ZSBmaWx0ZXIgb2JqZWN0IHRoYXQgcmVwcmVzZW50cyBhIGJldHdlZW4gZWxlbWVudC5cbiAgICAgKiBAcGFyYW0ge0NvbHVtbn0gY29sdW1uIENvbHVtbiBjbGFzcyBvYmplY3QuXG4gICAgICogQHBhcmFtIHtHcmlkQ29udGV4dH0gY29udGV4dCBHcmlkIGNvbnRleHQgb2JqZWN0LlxuICAgICAqL1xuICAgIGNvbnN0cnVjdG9yKGNvbHVtbiwgY29udGV4dCkge1xuICAgICAgICB0aGlzLmNvbnRleHQgPSBjb250ZXh0O1xuICAgICAgICB0aGlzLmVsZW1lbnQgPSBFbGVtZW50SGVscGVyLmRpdih7IG5hbWU6IGNvbHVtbi5maWVsZCwgY2xhc3NOYW1lOiBDc3NIZWxwZXIubXVsdGlTZWxlY3QucGFyZW50Q2xhc3MgfSk7XG4gICAgICAgIHRoaXMuaGVhZGVyID0gRWxlbWVudEhlbHBlci5kaXYoeyBjbGFzc05hbWU6IENzc0hlbHBlci5tdWx0aVNlbGVjdC5oZWFkZXIgfSk7XG4gICAgICAgIHRoaXMub3B0aW9uc0NvbnRhaW5lciA9IEVsZW1lbnRIZWxwZXIuZGl2KHsgY2xhc3NOYW1lOiBDc3NIZWxwZXIubXVsdGlTZWxlY3Qub3B0aW9ucyB9KTtcbiAgICAgICAgdGhpcy5maWVsZCA9IGNvbHVtbi5maWVsZDtcbiAgICAgICAgdGhpcy5maWVsZFR5cGUgPSBjb2x1bW4udHlwZTsgIC8vZmllbGQgdmFsdWUgdHlwZS5cbiAgICAgICAgdGhpcy5maWx0ZXJUeXBlID0gXCJiZXR3ZWVuXCI7ICAvL2NvbmRpdGlvbiB0eXBlLlxuXG4gICAgICAgIHRoaXMuZWxlbWVudC5pZCA9IGAke3RoaXMuY29udGV4dC5zZXR0aW5ncy5iYXNlSWROYW1lfV8ke3RoaXMuZmllbGR9YDtcbiAgICAgICAgdGhpcy5lbGVtZW50LmFwcGVuZCh0aGlzLmhlYWRlciwgdGhpcy5vcHRpb25zQ29udGFpbmVyKTtcbiAgICAgICAgdGhpcy5oZWFkZXIuaWQgPSBgaGVhZGVyXyR7dGhpcy5jb250ZXh0LnNldHRpbmdzLmJhc2VJZE5hbWV9XyR7dGhpcy5maWVsZH1gO1xuICAgICAgICB0aGlzLm9wdGlvbnNDb250YWluZXIuc3R5bGUubWluV2lkdGggPSBcIjE4NXB4XCI7XG5cbiAgICAgICAgdGhpcy4jdGVtcGxhdGVCZXR3ZWVuKCk7XG4gICAgICAgIHRoaXMuaGVhZGVyLmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCB0aGlzLmhhbmRsZUNsaWNrKTtcbiAgICB9XG5cbiAgICAjdGVtcGxhdGVCZXR3ZWVuKCkge1xuICAgICAgICB0aGlzLmVsZW1lbnRTdGFydCA9IEVsZW1lbnRIZWxwZXIuaW5wdXQoeyBjbGFzc05hbWU6IENzc0hlbHBlci5pbnB1dCwgaWQ6IGBzdGFydF8ke3RoaXMuY29udGV4dC5zZXR0aW5ncy5iYXNlSWROYW1lfV8ke3RoaXMuZmllbGR9YCB9KTtcblxuICAgICAgICB0aGlzLmVsZW1lbnRFbmQgPSBFbGVtZW50SGVscGVyLmlucHV0KHsgY2xhc3NOYW1lOiBDc3NIZWxwZXIuaW5wdXQsIGlkOiBgZW5kXyR7dGhpcy5jb250ZXh0LnNldHRpbmdzLmJhc2VJZE5hbWV9XyR7dGhpcy5maWVsZH1gIH0pO1xuICAgICAgICB0aGlzLmVsZW1lbnRFbmQuc3R5bGUubWFyZ2luQm90dG9tID0gXCIxMHB4XCI7XG5cbiAgICAgICAgY29uc3Qgc3RhcnQgPSBFbGVtZW50SGVscGVyLnNwYW4oeyBpbm5lclRleHQ6IFwiU3RhcnRcIiwgY2xhc3NOYW1lOiBDc3NIZWxwZXIuYmV0d2VlbkxhYmVsIH0pO1xuICAgICAgICBjb25zdCBlbmQgPSAgRWxlbWVudEhlbHBlci5zcGFuKHsgaW5uZXJUZXh0OiBcIkVuZFwiLCBjbGFzc05hbWU6IENzc0hlbHBlci5iZXR3ZWVuTGFiZWwgfSk7XG4gXG4gICAgICAgIGNvbnN0IGJ0bkFwcGx5ID0gRWxlbWVudEhlbHBlci5jcmVhdGUoXCJidXR0b25cIiwgeyBpbm5lclRleHQ6IFwiQXBwbHlcIiwgY2xhc3NOYW1lOiBDc3NIZWxwZXIuYmV0d2VlbkJ1dHRvbiB9KTtcbiAgICAgICAgYnRuQXBwbHkuc3R5bGUubWFyZ2luUmlnaHQgPSBcIjEwcHhcIjtcbiAgICAgICAgYnRuQXBwbHkuYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsIHRoaXMuaGFuZGxlckNsaWNrKTtcblxuICAgICAgICBjb25zdCBidG5DbGVhciA9IEVsZW1lbnRIZWxwZXIuY3JlYXRlKFwiYnV0dG9uXCIsIHsgaW5uZXJUZXh0OiBcIkNsZWFyXCIsIGNsYXNzTmFtZTogQ3NzSGVscGVyLmJldHdlZW5CdXR0b24gfSk7XG4gICAgICAgIGJ0bkNsZWFyLmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCB0aGlzLmhhbmRsZUJ1dHRvbkNsZWFyKTtcblxuICAgICAgICB0aGlzLm9wdGlvbnNDb250YWluZXIuYXBwZW5kKHN0YXJ0LCB0aGlzLmVsZW1lbnRTdGFydCwgZW5kLCB0aGlzLmVsZW1lbnRFbmQsIGJ0bkFwcGx5LCBidG5DbGVhcik7XG4gICAgfVxuXG4gICAgaGFuZGxlQnV0dG9uQ2xlYXIgPSAoKSA9PiB7XG4gICAgICAgIHRoaXMuZWxlbWVudFN0YXJ0LnZhbHVlID0gXCJcIjtcbiAgICAgICAgdGhpcy5lbGVtZW50RW5kLnZhbHVlID0gXCJcIjtcblxuICAgICAgICBpZiAodGhpcy5jb3VudExhYmVsICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgIHRoaXMuY291bnRMYWJlbC5yZW1vdmUoKTtcbiAgICAgICAgICAgIHRoaXMuY291bnRMYWJlbCA9IHVuZGVmaW5lZDtcbiAgICAgICAgfVxuICAgIH07XG5cbiAgICBjcmVhdGVDb3VudExhYmVsID0gKCkgPT4ge1xuICAgICAgICAvL3VwZGF0ZSBjb3VudCBsYWJlbC5cbiAgICAgICAgaWYgKHRoaXMuY291bnRMYWJlbCA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICB0aGlzLmNvdW50TGFiZWwgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwic3BhblwiKTtcbiAgICAgICAgICAgIHRoaXMuY291bnRMYWJlbC5jbGFzc05hbWUgPSBDc3NIZWxwZXIubXVsdGlTZWxlY3QuaGVhZGVyT3B0aW9uO1xuICAgICAgICAgICAgdGhpcy5oZWFkZXIuYXBwZW5kKHRoaXMuY291bnRMYWJlbCk7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAodGhpcy5lbGVtZW50U3RhcnQudmFsdWUgIT09IFwiXCIgJiYgdGhpcy5lbGVtZW50RW5kLnZhbHVlICE9PSBcIlwiKSB7XG4gICAgICAgICAgICB0aGlzLmNvdW50TGFiZWwuaW5uZXJUZXh0ID0gYCR7dGhpcy5lbGVtZW50U3RhcnQudmFsdWV9IHRvICR7dGhpcy5lbGVtZW50RW5kLnZhbHVlfWA7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB0aGlzLmNvdW50TGFiZWwucmVtb3ZlKCk7XG4gICAgICAgICAgICB0aGlzLmNvdW50TGFiZWwgPSB1bmRlZmluZWQ7XG4gICAgICAgIH1cbiAgICB9O1xuXG4gICAgaGFuZGxlQ2xpY2sgPSBhc3luYyAoKSA9PiB7XG4gICAgICAgIGNvbnN0IHN0YXR1cyA9IHRoaXMuaGVhZGVyLmNsYXNzTGlzdC50b2dnbGUoQ3NzSGVscGVyLm11bHRpU2VsZWN0LmhlYWRlckFjdGl2ZSk7XG5cbiAgICAgICAgaWYgKCFzdGF0dXMpIHtcbiAgICAgICAgICAgIC8vQ2xvc2Ugd2luZG93IGFuZCBhcHBseSBmaWx0ZXIgdmFsdWUuXG4gICAgICAgICAgICB0aGlzLmNyZWF0ZUNvdW50TGFiZWwoKTtcbiAgICAgICAgICAgIGF3YWl0IHRoaXMuY29udGV4dC5ldmVudHMudHJpZ2dlcihcInJlbmRlclwiKTtcbiAgICAgICAgICAgIGRvY3VtZW50LnJlbW92ZUV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCB0aGlzLmhhbmRsZURvY3VtZW50KTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCB0aGlzLmhhbmRsZURvY3VtZW50KTtcbiAgICAgICAgfVxuICAgIH07XG4gICAgLyoqXG4gICAgICogSGFuZGxlciBldmVudCB0byBjbG9zZSBkcm9wZG93biB3aGVuIHVzZXIgY2xpY2tzIG91dHNpZGUgdGhlIG11bHRpLXNlbGVjdCBjb250cm9sLiAgRXZlbnQgaXMgcmVtb3ZlZCB3aGVuIG11bHRpLXNlbGVjdCBpcyBcbiAgICAgKiBub3QgYWN0aXZlIHNvIHRoYXQgaXQncyBub3QgZmlyaW5nIG9uIHJlZHVuZGFudCBldmVudHMuXG4gICAgICogQHBhcmFtIHtPYmplY3R9IGUgT2JqZWN0IHRoYXQgdHJpZ2dlcmVkIGV2ZW50LlxuICAgICAqL1xuICAgIGhhbmRsZURvY3VtZW50ID0gYXN5bmMgKGUpID0+IHtcbiAgICAgICAgaWYgKCFlLnRhcmdldC5jbG9zZXN0KGAuJHtDc3NIZWxwZXIuaW5wdXR9YCkgJiYgIWUudGFyZ2V0LmNsb3Nlc3QoYCMke3RoaXMuaGVhZGVyLmlkfWApKSB7XG4gICAgICAgICAgICB0aGlzLmhlYWRlci5jbGFzc0xpc3QucmVtb3ZlKENzc0hlbHBlci5tdWx0aVNlbGVjdC5oZWFkZXJBY3RpdmUpO1xuXG4gICAgICAgICAgICBhd2FpdCB0aGlzLmNvbnRleHQuZXZlbnRzLnRyaWdnZXIoXCJyZW5kZXJcIik7XG5cbiAgICAgICAgICAgIGRvY3VtZW50LnJlbW92ZUV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCB0aGlzLmhhbmRsZURvY3VtZW50KTtcbiAgICAgICAgfVxuICAgIH07XG4gICAgLyoqXG4gICAgICogUmV0dXJucyBhbiBhcnJheSBvZiB0aGUgc3RhcnQgYW5kIGVuZCB2YWx1ZXMgZnJvbSBpbnB1dCBzb3VyY2UuICBJZiBlaXRoZXIgaW5wdXQgc291cmNlIGlzIGVtcHR5LCBhbiBlbXB0eSBzdHJpbmcgd2lsbCBiZSByZXR1cm5lZC5cbiAgICAgKiBAcmV0dXJucyB7QXJyYXkgfCBzdHJpbmd9IEFycmF5IG9mIHN0YXJ0IGFuZCBlbmQgdmFsdWVzIG9yIGVtcHR5IHN0cmluZy5cbiAgICAgKi9cbiAgICBnZXQgdmFsdWUoKSB7XG4gICAgICAgIGlmICh0aGlzLmVsZW1lbnRTdGFydC52YWx1ZSA9PT0gXCJcIiB8fCB0aGlzLmVsZW1lbnRFbmQudmFsdWUgPT09IFwiXCIpIHJldHVybiBcIlwiO1xuXG4gICAgICAgIHJldHVybiBbdGhpcy5lbGVtZW50U3RhcnQudmFsdWUsIHRoaXMuZWxlbWVudEVuZC52YWx1ZV07XG4gICAgfVxufVxuXG5leHBvcnQgeyBFbGVtZW50QmV0d2VlbiB9OyIsIi8qKlxuICogUmVwcmVzZW50cyBhIGNvbHVtbnMgZmlsdGVyIGNvbnRyb2wuICBDcmVhdGVzIGEgYEhUTUxJbnB1dEVsZW1lbnRgIHRoYXQgaXMgYWRkZWQgdG8gdGhlIGhlYWRlciByb3cgb2YgXG4gKiB0aGUgZ3JpZCB0byBmaWx0ZXIgZGF0YSBzcGVjaWZpYyB0byBpdHMgZGVmaW5lZCBjb2x1bW4uIFxuICovXG5jbGFzcyBFbGVtZW50SW5wdXQge1xuICAgIC8qKlxuICAgICAqIENyZWF0ZSBmaWx0ZXIgb2JqZWN0IHRoYXQgcmVwcmVzZW50cyBhIGBIVE1MU2VsZWN0RWxlbWVudGAgZWxlbWVudCBpbiB0aGUgdGFibGUncyBoZWFkZXIgcm93LlxuICAgICAqIEBwYXJhbSB7Q29sdW1ufSBjb2x1bW4gQ29sdW1uIGNsYXNzIG9iamVjdC5cbiAgICAgKiBAcGFyYW0ge0dyaWRDb250ZXh0fSBjb250ZXh0IEdyaWQgY29udGV4dC5cbiAgICAqL1xuICAgIGNvbnN0cnVjdG9yKGNvbHVtbiwgY29udGV4dCkge1xuICAgICAgICB0aGlzLmVsZW1lbnQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiaW5wdXRcIik7XG4gICAgICAgIHRoaXMuY29udGV4dCA9IGNvbnRleHQ7XG4gICAgICAgIHRoaXMuZmllbGQgPSBjb2x1bW4uZmllbGQ7XG4gICAgICAgIHRoaXMuZmllbGRUeXBlID0gY29sdW1uLnR5cGU7ICAvL2ZpZWxkIHZhbHVlIHR5cGUuXG4gICAgICAgIHRoaXMuZmlsdGVyVHlwZSA9IGNvbHVtbi5maWx0ZXJUeXBlOyAgLy9jb25kaXRpb24gdHlwZS5cbiAgICAgICAgdGhpcy5maWx0ZXJJc0Z1bmN0aW9uID0gKHR5cGVvZiBjb2x1bW4/LmZpbHRlclR5cGUgPT09IFwiZnVuY3Rpb25cIik7XG4gICAgICAgIHRoaXMuZmlsdGVyUGFyYW1zID0gY29sdW1uLmZpbHRlclBhcmFtcztcbiAgICAgICAgdGhpcy5lbGVtZW50Lm5hbWUgPSB0aGlzLmZpZWxkO1xuICAgICAgICB0aGlzLmVsZW1lbnQuaWQgPSB0aGlzLmZpZWxkO1xuICAgICAgICB0aGlzLmVsZW1lbnQuYWRkRXZlbnRMaXN0ZW5lcihcImNoYW5nZVwiLCBhc3luYyAoKSA9PiBhd2FpdCB0aGlzLmNvbnRleHQuZXZlbnRzLnRyaWdnZXIoXCJyZW5kZXJcIikpO1xuXG4gICAgICAgIGlmIChjb2x1bW4uZmlsdGVyQ3NzKSB7XG4gICAgICAgICAgICB0aGlzLmVsZW1lbnQuY2xhc3NOYW1lID0gY29sdW1uLmZpbHRlckNzcztcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICghdGhpcy5jb250ZXh0LnNldHRpbmdzLnJlbW90ZVByb2Nlc3NpbmcgJiYgY29sdW1uLmZpbHRlclJlYWxUaW1lKSB7XG4gICAgICAgICAgICB0aGlzLnJlYWxUaW1lVGltZW91dCA9ICh0eXBlb2YgdGhpcy5maWx0ZXJSZWFsVGltZSA9PT0gXCJudW1iZXJcIikgXG4gICAgICAgICAgICAgICAgPyB0aGlzLmZpbHRlclJlYWxUaW1lIFxuICAgICAgICAgICAgICAgIDogNTAwO1xuXG4gICAgICAgICAgICB0aGlzLmVsZW1lbnQuYWRkRXZlbnRMaXN0ZW5lcihcImtleXVwXCIsIHRoaXMuaGFuZGxlTGl2ZUZpbHRlcik7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBoYW5kbGVMaXZlRmlsdGVyID0gYXN5bmMgKCkgPT4ge1xuICAgICAgICBzZXRUaW1lb3V0KGFzeW5jICgpID0+IGF3YWl0IHRoaXMuY29udGV4dC5ldmVudHMudHJpZ2dlcihcInJlbmRlclwiKSwgdGhpcy5yZWFsVGltZVRpbWVvdXQpO1xuICAgIH07XG4gICAgLyoqXG4gICAgICogUmV0dXJucyB0aGUgdmFsdWUgb2YgdGhlIGlucHV0IGVsZW1lbnQuICBXaWxsIHJldHVybiBhIHN0cmluZyB2YWx1ZS5cbiAgICAgKiBAcmV0dXJucyB7c3RyaW5nfVxuICAgICAqL1xuICAgIGdldCB2YWx1ZSgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuZWxlbWVudC52YWx1ZTtcbiAgICB9XG59XG5cbmV4cG9ydCB7IEVsZW1lbnRJbnB1dCB9OyIsImltcG9ydCB7IEVsZW1lbnRIZWxwZXIgfSBmcm9tIFwiLi4vLi4vLi4vY29tcG9uZW50cy9oZWxwZXJzL2VsZW1lbnRIZWxwZXIuanNcIjtcbi8qKlxuICogUmVwcmVzZW50cyBhIGNvbHVtbnMgZmlsdGVyIGNvbnRyb2wuICBDcmVhdGVzIGEgYEhUTUxTZWxlY3RFbGVtZW50YCB0aGF0IGlzIGFkZGVkIHRvIHRoZSBoZWFkZXIgcm93IG9mIHRoZSBncmlkIHRvIGZpbHRlciBkYXRhIFxuICogc3BlY2lmaWMgdG8gaXRzIGRlZmluZWQgY29sdW1uLiAgSWYgYGZpbHRlclZhbHVlc1JlbW90ZVNvdXJjZWAgaXMgZGVmaW5lZCwgdGhlIHNlbGVjdCBvcHRpb25zIHdpbGwgYmUgcG9wdWxhdGVkIGJ5IHRoZSBkYXRhIHJldHVybmVkIFxuICogZnJvbSB0aGUgcmVtb3RlIHNvdXJjZSBieSByZWdpc3RlcmluZyB0byB0aGUgZ3JpZCBwaXBlbGluZSdzIGBpbml0YCBhbmQgYHJlZnJlc2hgIGV2ZW50cy5cbiAqL1xuY2xhc3MgRWxlbWVudFNlbGVjdCB7XG4gICAgLyoqXG4gICAgICogQ3JlYXRlIGZpbHRlciBvYmplY3QgdGhhdCByZXByZXNlbnRzIGEgYEhUTUxTZWxlY3RFbGVtZW50YCBlbGVtZW50IGluIHRoZSB0YWJsZSdzIGhlYWRlciByb3cuXG4gICAgICogQHBhcmFtIHtDb2x1bW59IGNvbHVtbiBDb2x1bW4gY2xhc3Mgb2JqZWN0LlxuICAgICAqIEBwYXJhbSB7R3JpZENvbnRleHR9IGNvbnRleHQgR3JpZCBjb250ZXh0LiBcbiAgICAgKi9cbiAgICBjb25zdHJ1Y3Rvcihjb2x1bW4sIGNvbnRleHQpIHtcbiAgICAgICAgdGhpcy5lbGVtZW50ID0gRWxlbWVudEhlbHBlci5jcmVhdGUoXCJzZWxlY3RcIiwgeyBuYW1lOiBjb2x1bW4uZmllbGQgfSk7XG4gICAgICAgIHRoaXMuZmllbGQgPSBjb2x1bW4uZmllbGQ7XG4gICAgICAgIHRoaXMuZmllbGRUeXBlID0gY29sdW1uLnR5cGU7ICAvL2ZpZWxkIHZhbHVlIHR5cGUuXG4gICAgICAgIHRoaXMuZmlsdGVyVHlwZSA9IGNvbHVtbi5maWx0ZXJUeXBlOyAgLy9jb25kaXRpb24gdHlwZS5cbiAgICAgICAgdGhpcy5maWx0ZXJJc0Z1bmN0aW9uID0gKHR5cGVvZiBjb2x1bW4/LmZpbHRlclR5cGUgPT09IFwiZnVuY3Rpb25cIik7XG4gICAgICAgIHRoaXMuZmlsdGVyUGFyYW1zID0gY29sdW1uLmZpbHRlclBhcmFtcztcbiAgICAgICAgdGhpcy5waXBlbGluZSA9IGNvbnRleHQucGlwZWxpbmU7XG4gICAgICAgIHRoaXMuY29udGV4dCA9IGNvbnRleHQ7XG5cbiAgICAgICAgdGhpcy5lbGVtZW50LmlkID0gYCR7Y29sdW1uLnNldHRpbmdzLmJhc2VJZE5hbWV9XyR7dGhpcy5maWVsZH1gO1xuICAgICAgICB0aGlzLmVsZW1lbnQuYWRkRXZlbnRMaXN0ZW5lcihcImNoYW5nZVwiLCBhc3luYyAoKSA9PiBhd2FpdCB0aGlzLmNvbnRleHQuZXZlbnRzLnRyaWdnZXIoXCJyZW5kZXJcIikpO1xuXG4gICAgICAgIGlmIChjb2x1bW4uZmlsdGVyQ3NzKSB7XG4gICAgICAgICAgICB0aGlzLmVsZW1lbnQuY2xhc3NOYW1lID0gY29sdW1uLmZpbHRlckNzcztcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChjb2x1bW4uZmlsdGVyVmFsdWVzUmVtb3RlU291cmNlKSB7XG4gICAgICAgICAgICAvL3NldCB1cCBwaXBlbGluZSB0byByZXRyaWV2ZSBvcHRpb24gZGF0YSB3aGVuIGluaXQgcGlwZWxpbmUgaXMgY2FsbGVkLlxuICAgICAgICAgICAgdGhpcy5waXBlbGluZS5hZGRTdGVwKFwiaW5pdFwiLCB0aGlzLmNyZWF0ZVNlbGVjdE9wdGlvbnMsIGNvbHVtbi5maWx0ZXJWYWx1ZXNSZW1vdGVTb3VyY2UpO1xuICAgICAgICAgICAgdGhpcy5waXBlbGluZS5hZGRTdGVwKFwicmVmcmVzaFwiLCB0aGlzLnJlZnJlc2hTZWxlY3RPcHRpb25zLCBjb2x1bW4uZmlsdGVyVmFsdWVzUmVtb3RlU291cmNlKTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfSBcbiAgICAgICAgLy91c2UgdXNlciBzdXBwbGllZCB2YWx1ZXMgdG8gY3JlYXRlIHNlbGVjdCBvcHRpb25zLlxuICAgICAgICBjb25zdCBvcHRzID0gQXJyYXkuaXNBcnJheShjb2x1bW4uZmlsdGVyVmFsdWVzKSBcbiAgICAgICAgICAgID8gY29sdW1uLmZpbHRlclZhbHVlc1xuICAgICAgICAgICAgOiBPYmplY3QuZW50cmllcyhjb2x1bW4uZmlsdGVyVmFsdWVzKS5tYXAoKFtrZXksIHZhbHVlXSkgPT4gKHsgdmFsdWU6IGtleSwgdGV4dDogdmFsdWV9KSk7XG5cbiAgICAgICAgdGhpcy5jcmVhdGVTZWxlY3RPcHRpb25zKG9wdHMpO1xuICAgIH1cbiAgICAvKipcbiAgICAgKiBCdWlsZHMgb3B0aW9uIGVsZW1lbnRzIGZvciBjbGFzcydzIGBzZWxlY3RgIGlucHV0LiAgRXhwZWN0cyBhbiBhcnJheSBvZiBvYmplY3RzIHdpdGgga2V5L3ZhbHVlIHBhaXJzIG9mOlxuICAgICAqICAqIGB2YWx1ZWA6IG9wdGlvbiB2YWx1ZS4gIHNob3VsZCBiZSBhIHByaW1hcnkga2V5IHR5cGUgdmFsdWUgd2l0aCBubyBibGFuayBzcGFjZXMuXG4gICAgICogICogYHRleHRgOiBvcHRpb24gdGV4dCB2YWx1ZVxuICAgICAqIEBwYXJhbSB7QXJyYXk8b2JqZWN0Pn0gZGF0YSBrZXkvdmFsdWUgYXJyYXkgb2YgdmFsdWVzLlxuICAgICAqL1xuICAgIGNyZWF0ZVNlbGVjdE9wdGlvbnMgPSAoZGF0YSkgPT4ge1xuICAgICAgICBjb25zdCBmaXJzdCA9IEVsZW1lbnRIZWxwZXIuY3JlYXRlKFwib3B0aW9uXCIsIHsgdmFsdWU6IFwiXCIsIHRleHQ6IFwiU2VsZWN0IGFsbFwiIH0pO1xuXG4gICAgICAgIHRoaXMuZWxlbWVudC5hcHBlbmQoZmlyc3QpO1xuXG4gICAgICAgIGZvciAoY29uc3QgaXRlbSBvZiBkYXRhKSB7XG4gICAgICAgICAgICBjb25zdCBvcHRpb24gPSBFbGVtZW50SGVscGVyLmNyZWF0ZShcIm9wdGlvblwiLCB7IHZhbHVlOiBpdGVtLnZhbHVlLCB0ZXh0OiBpdGVtLnRleHQgfSk7XG5cbiAgICAgICAgICAgIHRoaXMuZWxlbWVudC5hcHBlbmQob3B0aW9uKTtcbiAgICAgICAgfVxuICAgIH07XG4gICAgLyoqXG4gICAgICogUmVwbGFjZXMvdXBkYXRlcyBvcHRpb24gZWxlbWVudHMgZm9yIGNsYXNzJ3MgYHNlbGVjdGAgaW5wdXQuICBXaWxsIHBlcnNpc3QgdGhlIGN1cnJlbnQgc2VsZWN0IHZhbHVlLCBpZiBhbnkuICBcbiAgICAgKiBFeHBlY3RzIGFuIGFycmF5IG9mIG9iamVjdHMgd2l0aCBrZXkvdmFsdWUgcGFpcnMgb2Y6XG4gICAgICogICogYHZhbHVlYDogT3B0aW9uIHZhbHVlLiAgU2hvdWxkIGJlIGEgcHJpbWFyeSBrZXkgdHlwZSB2YWx1ZSB3aXRoIG5vIGJsYW5rIHNwYWNlcy5cbiAgICAgKiAgKiBgdGV4dGA6IE9wdGlvbiB0ZXh0LlxuICAgICAqIEBwYXJhbSB7QXJyYXk8b2JqZWN0Pn0gZGF0YSBrZXkvdmFsdWUgYXJyYXkgb2YgdmFsdWVzLlxuICAgICAqL1xuICAgIHJlZnJlc2hTZWxlY3RPcHRpb25zID0gKGRhdGEpID0+IHtcbiAgICAgICAgY29uc3Qgc2VsZWN0ZWRWYWx1ZSA9IHRoaXMuZWxlbWVudC52YWx1ZTtcblxuICAgICAgICB0aGlzLmVsZW1lbnQucmVwbGFjZUNoaWxkcmVuKCk7XG4gICAgICAgIHRoaXMuY3JlYXRlU2VsZWN0T3B0aW9ucyhkYXRhKTtcbiAgICAgICAgdGhpcy5lbGVtZW50LnZhbHVlID0gc2VsZWN0ZWRWYWx1ZTtcbiAgICB9O1xuXG4gICAgZ2V0IHZhbHVlKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5lbGVtZW50LnZhbHVlO1xuICAgIH1cbn1cblxuZXhwb3J0IHsgRWxlbWVudFNlbGVjdCB9OyIsImltcG9ydCB7IENzc0hlbHBlciB9IGZyb20gXCIuLi8uLi8uLi9jb21wb25lbnRzL2hlbHBlcnMvY3NzSGVscGVyLmpzXCI7XG5pbXBvcnQgeyBFbGVtZW50SGVscGVyIH0gZnJvbSBcIi4uLy4uLy4uL2NvbXBvbmVudHMvaGVscGVycy9lbGVtZW50SGVscGVyLmpzXCI7XG4vKipcbiAqIENyZWF0ZSBmaWx0ZXIgb2JqZWN0IHRoYXQgcmVwcmVzZW50cyBhIG11bHRpLXNlbGVjdCBlbGVtZW50LiAgQ3JlYXRlcyBhIGRyb3Bkb3duIHdpdGggYSBsaXN0IG9mIG9wdGlvbnMgdGhhdCBjYW4gYmUgXG4gKiBzZWxlY3RlZCBvciBkZXNlbGVjdGVkLiAgSWYgYGZpbHRlclZhbHVlc1JlbW90ZVNvdXJjZWAgaXMgZGVmaW5lZCwgdGhlIHNlbGVjdCBvcHRpb25zIHdpbGwgYmUgcG9wdWxhdGVkIGJ5IHRoZSBkYXRhIHJldHVybmVkIFxuICogZnJvbSB0aGUgcmVtb3RlIHNvdXJjZSBieSByZWdpc3RlcmluZyB0byAgdGhlIGdyaWQgcGlwZWxpbmUncyBgaW5pdGAgYW5kIGByZWZyZXNoYCBldmVudHMuXG4gKi9cbmNsYXNzIEVsZW1lbnRNdWx0aVNlbGVjdCB7XG4gICAgLyoqXG4gICAgICogQ3JlYXRlIGZpbHRlciBvYmplY3QgdGhhdCByZXByZXNlbnRzIGEgbXVsdGktc2VsZWN0IGVsZW1lbnQuXG4gICAgICogQHBhcmFtIHtDb2x1bW59IGNvbHVtbiBDb2x1bW4gY2xhc3Mgb2JqZWN0LlxuICAgICAqIEBwYXJhbSB7R3JpZENvbnRleHR9IGNvbnRleHQgR3JpZCBjb250ZXh0IG9iamVjdC5cbiAgICAgKi9cbiAgICBjb25zdHJ1Y3Rvcihjb2x1bW4sIGNvbnRleHQpIHtcbiAgICAgICAgdGhpcy5jb250ZXh0ID0gY29udGV4dDtcbiAgICAgICAgdGhpcy5lbGVtZW50ID0gRWxlbWVudEhlbHBlci5kaXYoeyBuYW1lOiBjb2x1bW4uZmllbGQsIGNsYXNzTmFtZTogQ3NzSGVscGVyLm11bHRpU2VsZWN0LnBhcmVudENsYXNzIH0pO1xuICAgICAgICB0aGlzLmhlYWRlciA9IEVsZW1lbnRIZWxwZXIuZGl2KHsgY2xhc3NOYW1lOiBDc3NIZWxwZXIubXVsdGlTZWxlY3QuaGVhZGVyIH0pO1xuICAgICAgICB0aGlzLm9wdGlvbnNDb250YWluZXIgPSBFbGVtZW50SGVscGVyLmRpdih7IGNsYXNzTmFtZTogQ3NzSGVscGVyLm11bHRpU2VsZWN0Lm9wdGlvbnMgfSk7XG4gICAgICAgIHRoaXMuZmllbGQgPSBjb2x1bW4uZmllbGQ7XG4gICAgICAgIHRoaXMuZmllbGRUeXBlID0gY29sdW1uLnR5cGU7ICAvL2ZpZWxkIHZhbHVlIHR5cGUuXG4gICAgICAgIHRoaXMuZmlsdGVyVHlwZSA9IFwiaW5cIjsgIC8vY29uZGl0aW9uIHR5cGUuXG4gICAgICAgIHRoaXMuZmlsdGVySXNGdW5jdGlvbiA9ICh0eXBlb2YgY29sdW1uPy5maWx0ZXJUeXBlID09PSBcImZ1bmN0aW9uXCIpO1xuICAgICAgICB0aGlzLmZpbHRlclBhcmFtcyA9IGNvbHVtbi5maWx0ZXJQYXJhbXM7XG4gICAgICAgIHRoaXMubGlzdEFsbCA9IGZhbHNlO1xuICAgICAgICB0aGlzLnNlbGVjdGVkVmFsdWVzID0gW107XG5cbiAgICAgICAgaWYgKHR5cGVvZiBjb2x1bW4uZmlsdGVyTXVsdGlTZWxlY3QgPT09IFwib2JqZWN0XCIpIHtcbiAgICAgICAgICAgIHRoaXMubGlzdEFsbCA9IGNvbHVtbi5maWx0ZXJNdWx0aVNlbGVjdC5saXN0QWxsO1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5oZWFkZXIuaWQgPSBgaGVhZGVyXyR7dGhpcy5jb250ZXh0LnNldHRpbmdzLmJhc2VJZE5hbWV9XyR7dGhpcy5maWVsZH1gO1xuICAgICAgICB0aGlzLmVsZW1lbnQuaWQgPSBgJHt0aGlzLmNvbnRleHQuc2V0dGluZ3MuYmFzZUlkTmFtZX1fJHt0aGlzLmZpZWxkfWA7XG4gICAgICAgIHRoaXMuZWxlbWVudC5hcHBlbmQodGhpcy5oZWFkZXIsIHRoaXMub3B0aW9uc0NvbnRhaW5lcik7XG5cbiAgICAgICAgaWYgKGNvbHVtbi5maWx0ZXJWYWx1ZXNSZW1vdGVTb3VyY2UpIHtcbiAgICAgICAgICAgIC8vc2V0IHVwIHBpcGVsaW5lIHRvIHJldHJpZXZlIG9wdGlvbiBkYXRhIHdoZW4gaW5pdCBwaXBlbGluZSBpcyBjYWxsZWQuXG4gICAgICAgICAgICB0aGlzLmNvbnRleHQucGlwZWxpbmUuYWRkU3RlcChcImluaXRcIiwgdGhpcy50ZW1wbGF0ZUNvbnRhaW5lciwgY29sdW1uLmZpbHRlclZhbHVlc1JlbW90ZVNvdXJjZSk7XG4gICAgICAgICAgICB0aGlzLmNvbnRleHQucGlwZWxpbmUuYWRkU3RlcChcInJlZnJlc2hcIiwgdGhpcy5yZWZyZXNoU2VsZWN0T3B0aW9ucywgY29sdW1uLmZpbHRlclZhbHVlc1JlbW90ZVNvdXJjZSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAvL3VzZSB1c2VyIHN1cHBsaWVkIHZhbHVlcyB0byBjcmVhdGUgc2VsZWN0IG9wdGlvbnMuXG4gICAgICAgICAgICBjb25zdCBkYXRhID0gQXJyYXkuaXNBcnJheShjb2x1bW4uZmlsdGVyVmFsdWVzKSBcbiAgICAgICAgICAgICAgICA/IGNvbHVtbi5maWx0ZXJWYWx1ZXNcbiAgICAgICAgICAgICAgICA6IE9iamVjdC5lbnRyaWVzKGNvbHVtbi5maWx0ZXJWYWx1ZXMpLm1hcCgoW2tleSwgdmFsdWVdKSA9PiAoeyB2YWx1ZToga2V5LCB0ZXh0OiB2YWx1ZX0pKTtcblxuICAgICAgICAgICAgdGhpcy50ZW1wbGF0ZUNvbnRhaW5lcihkYXRhKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMuaGVhZGVyLmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCB0aGlzLmhhbmRsZUNsaWNrKTtcbiAgICB9XG5cbiAgICBoYW5kbGVDbGljayA9IGFzeW5jICgpID0+IHtcbiAgICAgICAgY29uc3Qgc3RhdHVzID0gdGhpcy5oZWFkZXIuY2xhc3NMaXN0LnRvZ2dsZShDc3NIZWxwZXIubXVsdGlTZWxlY3QuaGVhZGVyQWN0aXZlKTtcblxuICAgICAgICBpZiAoIXN0YXR1cykge1xuICAgICAgICAgICAgYXdhaXQgdGhpcy5jb250ZXh0LmV2ZW50cy50cmlnZ2VyKFwicmVuZGVyXCIpO1xuICAgICAgICAgICAgZG9jdW1lbnQucmVtb3ZlRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsIHRoaXMuaGFuZGxlRG9jdW1lbnQpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsIHRoaXMuaGFuZGxlRG9jdW1lbnQpO1xuICAgICAgICB9XG4gICAgfTtcbiAgICAvKipcbiAgICAgKiBIYW5kbGVyIGV2ZW50IHRvIGNsb3NlIGRyb3Bkb3duIHdoZW4gdXNlciBjbGlja3Mgb3V0c2lkZSB0aGUgbXVsdGktc2VsZWN0IGNvbnRyb2wuICBFdmVudCBpcyByZW1vdmVkIHdoZW4gbXVsdGktc2VsZWN0IFxuICAgICAqIGlzIG5vdCBhY3RpdmUgc28gdGhhdCBpdCdzIG5vdCBmaXJpbmcgb24gcmVkdW5kYW50IGV2ZW50cy5cbiAgICAgKiBAcGFyYW0ge09iamVjdH0gZSBPYmplY3QgdGhhdCB0cmlnZ2VyZWQgZXZlbnQuXG4gICAgICovXG4gICAgaGFuZGxlRG9jdW1lbnQgPSBhc3luYyAoZSkgPT4ge1xuICAgICAgICBpZiAoIWUudGFyZ2V0LmNsb3Nlc3QoXCIuXCIgKyBDc3NIZWxwZXIubXVsdGlTZWxlY3Qub3B0aW9uKSAmJiAhZS50YXJnZXQuY2xvc2VzdChgIyR7dGhpcy5oZWFkZXIuaWR9YCkpIHtcbiAgICAgICAgICAgIHRoaXMuaGVhZGVyLmNsYXNzTGlzdC5yZW1vdmUoQ3NzSGVscGVyLm11bHRpU2VsZWN0LmhlYWRlckFjdGl2ZSk7XG5cbiAgICAgICAgICAgIGF3YWl0IHRoaXMuY29udGV4dC5ldmVudHMudHJpZ2dlcihcInJlbmRlclwiKTtcblxuICAgICAgICAgICAgZG9jdW1lbnQucmVtb3ZlRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsIHRoaXMuaGFuZGxlRG9jdW1lbnQpO1xuICAgICAgICB9XG4gICAgfTtcbiAgICAvKipcbiAgICAgKiBDcmVhdGVzIGEgY291bnQgbGFiZWwgdGhhdCBkaXNwbGF5cyB0aGUgbnVtYmVyIG9mIHNlbGVjdGVkIGl0ZW1zIGluIHRoZSBtdWx0aS1zZWxlY3QgY29udHJvbC5cbiAgICAgKi9cbiAgICBjcmVhdGVDb3VudExhYmVsID0gKCkgPT4ge1xuICAgICAgICAvL3VwZGF0ZSBjb3VudCBsYWJlbC5cbiAgICAgICAgaWYgKHRoaXMuY291bnRMYWJlbCA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICB0aGlzLmNvdW50TGFiZWwgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwic3BhblwiKTtcbiAgICAgICAgICAgIHRoaXMuY291bnRMYWJlbC5jbGFzc05hbWUgPSBDc3NIZWxwZXIubXVsdGlTZWxlY3QuaGVhZGVyT3B0aW9uO1xuICAgICAgICAgICAgdGhpcy5oZWFkZXIuYXBwZW5kKHRoaXMuY291bnRMYWJlbCk7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAodGhpcy5zZWxlY3RlZFZhbHVlcy5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICB0aGlzLmNvdW50TGFiZWwuaW5uZXJUZXh0ID0gYCR7dGhpcy5zZWxlY3RlZFZhbHVlcy5sZW5ndGh9IHNlbGVjdGVkYDtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHRoaXMuY291bnRMYWJlbC5yZW1vdmUoKTtcbiAgICAgICAgICAgIHRoaXMuY291bnRMYWJlbCA9IHVuZGVmaW5lZDtcbiAgICAgICAgfVxuICAgIH07XG4gICAgLyoqXG4gICAgICogSGFuZGxlIGNsaWNrIGV2ZW50IGZvciBlYWNoIG9wdGlvbiBpbiB0aGUgbXVsdGktc2VsZWN0IGNvbnRyb2wuICBUb2dnbGVzIHRoZSBzZWxlY3RlZCBzdGF0ZSBvZiB0aGUgb3B0aW9uIGFuZCB1cGRhdGVzIHRoZSBcbiAgICAgKiBoZWFkZXIgaWYgYGxpc3RBbGxgIGlzIGB0cnVlYC5cbiAgICAgKiBAcGFyYW0ge09iamVjdH0gbyBPYmplY3QgdGhhdCB0cmlnZ2VyZWQgdGhlIGV2ZW50LlxuICAgICAqL1xuICAgIGhhbmRsZU9wdGlvbiA9IChvKSA9PiB7XG4gICAgICAgIGlmICghby5jdXJyZW50VGFyZ2V0LmNsYXNzTGlzdC5jb250YWlucyhDc3NIZWxwZXIubXVsdGlTZWxlY3Quc2VsZWN0ZWQpKSB7XG4gICAgICAgICAgICAvL3NlbGVjdCBpdGVtLlxuICAgICAgICAgICAgby5jdXJyZW50VGFyZ2V0LmNsYXNzTGlzdC5hZGQoQ3NzSGVscGVyLm11bHRpU2VsZWN0LnNlbGVjdGVkKTtcbiAgICAgICAgICAgIG8uY3VycmVudFRhcmdldC5kYXRhc2V0LnNlbGVjdGVkID0gXCJ0cnVlXCI7XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIHRoaXMuc2VsZWN0ZWRWYWx1ZXMucHVzaChvLmN1cnJlbnRUYXJnZXQuZGF0YXNldC52YWx1ZSk7XG5cbiAgICAgICAgICAgIGlmICh0aGlzLmxpc3RBbGwpIHtcbiAgICAgICAgICAgICAgICBjb25zdCBzcGFuID0gRWxlbWVudEhlbHBlci5zcGFuKHsgY2xhc3NOYW1lOiBDc3NIZWxwZXIubXVsdGlTZWxlY3QuaGVhZGVyT3B0aW9uLCBpbm5lclRleHQ6IG8uY3VycmVudFRhcmdldC5kYXRhc2V0LnZhbHVlIH0sIHsgdmFsdWU6IG8uY3VycmVudFRhcmdldC5kYXRhc2V0LnZhbHVlIH0pO1xuICAgICAgICAgICAgICAgIHRoaXMuaGVhZGVyLmFwcGVuZChzcGFuKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIC8vZGVzZWxlY3QgaXRlbS5cbiAgICAgICAgICAgIG8uY3VycmVudFRhcmdldC5jbGFzc0xpc3QucmVtb3ZlKENzc0hlbHBlci5tdWx0aVNlbGVjdC5zZWxlY3RlZCk7XG4gICAgICAgICAgICBvLmN1cnJlbnRUYXJnZXQuZGF0YXNldC5zZWxlY3RlZCA9IFwiZmFsc2VcIjtcblxuICAgICAgICAgICAgdGhpcy5zZWxlY3RlZFZhbHVlcyA9IHRoaXMuc2VsZWN0ZWRWYWx1ZXMuZmlsdGVyKGYgPT4gZiAhPT0gby5jdXJyZW50VGFyZ2V0LmRhdGFzZXQudmFsdWUpO1xuXG4gICAgICAgICAgICBpZiAodGhpcy5saXN0QWxsKSB7XG4gICAgICAgICAgICAgICAgY29uc3QgaXRlbSA9IHRoaXMuaGVhZGVyLnF1ZXJ5U2VsZWN0b3IoYFtkYXRhLXZhbHVlPScke28uY3VycmVudFRhcmdldC5kYXRhc2V0LnZhbHVlfSddYCk7XG5cbiAgICAgICAgICAgICAgICBpZiAoaXRlbSAhPT0gbnVsbCkge1xuICAgICAgICAgICAgICAgICAgICBpdGVtLnJlbW92ZSgpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIGlmICh0aGlzLmxpc3RBbGwgPT09IGZhbHNlKSB7XG4gICAgICAgICAgICB0aGlzLmNyZWF0ZUNvdW50TGFiZWwoKTtcbiAgICAgICAgfVxuICAgIH07XG4gICAgLyoqXG4gICAgICogSGVscGVyIGZ1bmN0aW9uIHRvIGNyZWF0ZSBhbiBvcHRpb24gZWxlbWVudCBmb3IgdGhlIG11bHRpLXNlbGVjdCBjb250cm9sLlxuICAgICAqIEBwYXJhbSB7T2JqZWN0fSBpdGVtIGtleS92YWx1ZSBwYWlyIG9iamVjdCB0aGF0IGNvbnRhaW5zIHRoZSB2YWx1ZSBhbmQgdGV4dCBmb3IgdGhlIG9wdGlvbi5cbiAgICAgKiBAcmV0dXJucyB7SFRNTERpdkVsZW1lbnR9IFJldHVybnMgYSBkaXYgZWxlbWVudCB0aGF0IHJlcHJlc2VudHMgdGhlIG9wdGlvbiBpbiB0aGUgbXVsdGktc2VsZWN0IGNvbnRyb2wuXG4gICAgICovXG4gICAgY3JlYXRlT3B0aW9uKGl0ZW0pIHsgXG4gICAgICAgIGNvbnN0IG9wdGlvbiA9IEVsZW1lbnRIZWxwZXIuZGl2KHsgY2xhc3NOYW1lOiBDc3NIZWxwZXIubXVsdGlTZWxlY3Qub3B0aW9uIH0sIHsgdmFsdWU6IGl0ZW0udmFsdWUsIHNlbGVjdGVkOiBcImZhbHNlXCIgfSk7XG4gICAgICAgIGNvbnN0IHJhZGlvID0gRWxlbWVudEhlbHBlci5zcGFuKHsgY2xhc3NOYW1lOiBDc3NIZWxwZXIubXVsdGlTZWxlY3Qub3B0aW9uUmFkaW8gfSk7XG4gICAgICAgIGNvbnN0IHRleHQgPSBFbGVtZW50SGVscGVyLnNwYW4oeyBjbGFzc05hbWU6IENzc0hlbHBlci5tdWx0aVNlbGVjdC5vcHRpb25UZXh0LCBpbm5lckhUTUw6IGl0ZW0udGV4dCB9KTtcblxuICAgICAgICBvcHRpb24uYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsIHRoaXMuaGFuZGxlT3B0aW9uKTtcbiAgICAgICAgb3B0aW9uLmFwcGVuZChyYWRpbywgdGV4dCk7XG5cbiAgICAgICAgcmV0dXJuIG9wdGlvbjtcbiAgICB9XG5cbiAgICB0ZW1wbGF0ZUNvbnRhaW5lciA9IChkYXRhKSA9PiB7XG4gICAgICAgIGZvciAoY29uc3QgaXRlbSBvZiBkYXRhKSB7XG4gICAgICAgICAgICBjb25zdCBvcHRpb24gPSB0aGlzLmNyZWF0ZU9wdGlvbihpdGVtKTtcbiAgICAgICAgICAgIHRoaXMub3B0aW9uc0NvbnRhaW5lci5hcHBlbmQob3B0aW9uKTtcbiAgICAgICAgfVxuICAgIH07XG4gICAgLyoqXG4gICAgICogQ2FsbGVkIHdoZW4gdGhlIGdyaWQgcGlwZWxpbmUncyBgcmVmcmVzaGAgZXZlbnQgaXMgdHJpZ2dlcmVkLiAgSXQgY2xlYXJzIHRoZSBjdXJyZW50IG9wdGlvbnMgYW5kXG4gICAgICogcmVjcmVhdGVzIHRoZW0gYmFzZWQgb24gdGhlIGRhdGEgcHJvdmlkZWQuICBJdCBhbHNvIHVwZGF0ZXMgdGhlIHNlbGVjdGVkIHZhbHVlcyBiYXNlZCBvbiB0aGUgY3VycmVudCBzdGF0ZSBvZiB0aGUgb3B0aW9ucy5cbiAgICAgKiBAcGFyYW0ge0FycmF5fSBkYXRhIEFycmF5IG9mIG9iamVjdHMgdGhhdCByZXByZXNlbnQgdGhlIG9wdGlvbnMgdG8gYmUgZGlzcGxheWVkIGluIHRoZSBtdWx0aS1zZWxlY3QgY29udHJvbC5cbiAgICAgKi9cbiAgICByZWZyZXNoU2VsZWN0T3B0aW9ucyA9IChkYXRhKSA9PiB7XG4gICAgICAgIHRoaXMub3B0aW9uc0NvbnRhaW5lci5yZXBsYWNlQ2hpbGRyZW4oKTtcbiAgICAgICAgdGhpcy5oZWFkZXIucmVwbGFjZUNoaWxkcmVuKCk7XG4gICAgICAgIHRoaXMuY291bnRMYWJlbCA9IHVuZGVmaW5lZDsgIC8vc2V0IHRvIHVuZGVmaW5lZCBzbyBpdCBjYW4gYmUgcmVjcmVhdGVkIGxhdGVyLlxuICAgICAgICBjb25zdCBuZXdTZWxlY3RlZCA9IFtdO1xuXG4gICAgICAgIGZvciAoY29uc3QgaXRlbSBvZiBkYXRhKSB7XG4gICAgICAgICAgICBjb25zdCBvcHRpb24gPSB0aGlzLmNyZWF0ZU9wdGlvbihpdGVtKTtcbiAgICAgICAgICAgIC8vY2hlY2sgaWYgaXRlbSBpcyBzZWxlY3RlZC5cbiAgICAgICAgICAgIGlmICh0aGlzLnNlbGVjdGVkVmFsdWVzLmluY2x1ZGVzKGl0ZW0udmFsdWUpKSB7XG4gICAgICAgICAgICAgICAgLy9zZWxlY3QgaXRlbS5cbiAgICAgICAgICAgICAgICBvcHRpb24uY2xhc3NMaXN0LmFkZChDc3NIZWxwZXIubXVsdGlTZWxlY3Quc2VsZWN0ZWQpO1xuICAgICAgICAgICAgICAgIG9wdGlvbi5kYXRhc2V0LnNlbGVjdGVkID0gXCJ0cnVlXCI7XG4gICAgICAgICAgICAgICAgbmV3U2VsZWN0ZWQucHVzaChpdGVtLnZhbHVlKTtcblxuICAgICAgICAgICAgICAgIGlmICh0aGlzLmxpc3RBbGwpIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc3Qgc3BhbiA9IEVsZW1lbnRIZWxwZXIuc3Bhbih7IGNsYXNzTmFtZTogQ3NzSGVscGVyLm11bHRpU2VsZWN0LmhlYWRlck9wdGlvbiwgaW5uZXJUZXh0OiBpdGVtLnZhbHVlIH0sIHsgdmFsdWU6IGl0ZW0udmFsdWUgfSk7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuaGVhZGVyLmFwcGVuZChzcGFuKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHRoaXMub3B0aW9uc0NvbnRhaW5lci5hcHBlbmQob3B0aW9uKTtcbiAgICAgICAgfVxuICAgICAgICAvL3NldCBuZXcgc2VsZWN0ZWQgdmFsdWVzIGFzIGl0ZW1zIG1heSBoYXZlIGJlZW4gcmVtb3ZlZCBvbiByZWZyZXNoLlxuICAgICAgICB0aGlzLnNlbGVjdGVkVmFsdWVzID0gbmV3U2VsZWN0ZWQ7XG5cbiAgICAgICAgaWYgKHRoaXMubGlzdEFsbCA9PT0gZmFsc2UpIHtcbiAgICAgICAgICAgIHRoaXMuY3JlYXRlQ291bnRMYWJlbCgpO1xuICAgICAgICB9XG4gICAgfTtcblxuICAgIGdldCB2YWx1ZSgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuc2VsZWN0ZWRWYWx1ZXM7XG4gICAgfVxufVxuXG5leHBvcnQgeyBFbGVtZW50TXVsdGlTZWxlY3QgfTsiLCIvKipcbiAqIENsYXNzIHRoYXQgZGVmaW5lcyBhIHNpbmdsZSBmaWx0ZXIgY29uZGl0aW9uIGZvciBhIGNvbHVtbi5cbiAqL1xuY2xhc3MgRmlsdGVyVGFyZ2V0IHtcbiAgICAvKipcbiAgICAgKiBDcmVhdGVzIGZpbHRlciB0YXJnZXQgb2JqZWN0IHRoYXQgZGVmaW5lcyBhIHNpbmdsZSBmaWx0ZXIgY29uZGl0aW9uLiAgRXhwZWN0cyBhbiBvYmplY3Qgd2l0aCB0aGUgZm9sbG93aW5nIHByb3BlcnRpZXM6XG4gICAgICogKiBgdmFsdWVgOiBUaGUgdmFsdWUgdG8gZmlsdGVyIGFnYWluc3QuICBFeHBlY3RzIHRoYXQgdmFsdWUgbWF0Y2hlcyB0aGUgdHlwZSBvZiB0aGUgZmllbGQgYmVpbmcgZmlsdGVyZWQuICBTaG91bGQgYmUgbnVsbCBpZiBcbiAgICAgKiB2YWx1ZSB0eXBlIGNhbm5vdCBiZSBjb252ZXJ0ZWQgdG8gdGhlIGZpZWxkIHR5cGUuXG4gICAgICogKiBgZmllbGRgOiBUaGUgZmllbGQgbmFtZSBvZiB0aGUgY29sdW1uIGJlaW5nIGZpbHRlcmVkLiAgVGhpcyBpcyB1c2VkIHRvIGlkZW50aWZ5IHRoZSBjb2x1bW4gaW4gdGhlIGRhdGEgc2V0LlxuICAgICAqICogYGZpZWxkVHlwZWA6IFRoZSB0eXBlIG9mIGZpZWxkIGJlaW5nIGZpbHRlcmVkIChlLmcuLCBcInN0cmluZ1wiLCBcIm51bWJlclwiLCBcImRhdGVcIiwgXCJvYmplY3RcIikuICBUaGlzIGlzIHVzZWQgdG8gZGV0ZXJtaW5lIGhvdyB0byBjb21wYXJlIHRoZSB2YWx1ZS5cbiAgICAgKiAqIGBmaWx0ZXJUeXBlYDogVGhlIHR5cGUgb2YgZmlsdGVyIHRvIGFwcGx5IChlLmcuLCBcImVxdWFsc1wiLCBcImxpa2VcIiwgXCI8XCIsIFwiPD1cIiwgXCI+XCIsIFwiPj1cIiwgXCIhPVwiLCBcImJldHdlZW5cIiwgXCJpblwiKS5cbiAgICAgKiBAcGFyYW0ge3sgdmFsdWU6IChzdHJpbmcgfCBudW1iZXIgfCBEYXRlIHwgT2JqZWN0IHwgbnVsbCksIGZpZWxkOiBzdHJpbmcsIGZpZWxkVHlwZTogc3RyaW5nLCBmaWx0ZXJUeXBlOiBzdHJpbmcgfX0gdGFyZ2V0IFxuICAgICAqL1xuICAgIGNvbnN0cnVjdG9yKHRhcmdldCkge1xuICAgICAgICB0aGlzLnZhbHVlID0gdGFyZ2V0LnZhbHVlO1xuICAgICAgICB0aGlzLmZpZWxkID0gdGFyZ2V0LmZpZWxkO1xuICAgICAgICB0aGlzLmZpZWxkVHlwZSA9IHRhcmdldC5maWVsZFR5cGUgfHwgXCJzdHJpbmdcIjsgLy8gRGVmYXVsdCB0byBzdHJpbmcgaWYgbm90IHByb3ZpZGVkXG4gICAgICAgIHRoaXMuZmlsdGVyVHlwZSA9IHRhcmdldC5maWx0ZXJUeXBlO1xuICAgICAgICB0aGlzLmZpbHRlcnMgPSB0aGlzLiNpbml0KCk7XG4gICAgfVxuXG4gICAgI2luaXQoKSB7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAvL2VxdWFsIHRvXG4gICAgICAgICAgICBcImVxdWFsc1wiOiBmdW5jdGlvbihmaWx0ZXJWYWwsIHJvd1ZhbCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBmaWx0ZXJWYWwgPT09IHJvd1ZhbDtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAvL2xpa2VcbiAgICAgICAgICAgIFwibGlrZVwiOiBmdW5jdGlvbihmaWx0ZXJWYWwsIHJvd1ZhbCkge1xuICAgICAgICAgICAgICAgIGlmIChyb3dWYWwgPT09IHVuZGVmaW5lZCB8fCByb3dWYWwgPT09IG51bGwgfHwgcm93VmFsID09PSBcIlwiKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICAgICAgICAgIHJldHVybiBTdHJpbmcocm93VmFsKS50b0xvd2VyQ2FzZSgpLmluZGV4T2YoZmlsdGVyVmFsLnRvTG93ZXJDYXNlKCkpID4gLTE7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgLy9sZXNzIHRoYW5cbiAgICAgICAgICAgIFwiPFwiOiBmdW5jdGlvbihmaWx0ZXJWYWwsIHJvd1ZhbCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBmaWx0ZXJWYWwgPCByb3dWYWw7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgLy9sZXNzIHRoYW4gb3IgZXF1YWwgdG9cbiAgICAgICAgICAgIFwiPD1cIjogZnVuY3Rpb24oZmlsdGVyVmFsLCByb3dWYWwpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gZmlsdGVyVmFsIDw9IHJvd1ZhbDtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAvL2dyZWF0ZXIgdGhhblxuICAgICAgICAgICAgXCI+XCI6IGZ1bmN0aW9uKGZpbHRlclZhbCwgcm93VmFsKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGZpbHRlclZhbCA+IHJvd1ZhbDtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAvL2dyZWF0ZXIgdGhhbiBvciBlcXVhbCB0b1xuICAgICAgICAgICAgXCI+PVwiOiBmdW5jdGlvbihmaWx0ZXJWYWwsIHJvd1ZhbCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBmaWx0ZXJWYWwgPj0gcm93VmFsO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIC8vbm90IGVxdWFsIHRvXG4gICAgICAgICAgICBcIiE9XCI6IGZ1bmN0aW9uKGZpbHRlclZhbCwgcm93VmFsKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJvd1ZhbCAhPT0gZmlsdGVyVmFsO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIC8vIGJldHdlZW4uICBleHBlY3RzIGZpbHRlclZhbCB0byBiZSBhbiBhcnJheSBvZjogWyB7c3RhcnQgdmFsdWV9LCB7IGVuZCB2YWx1ZSB9IF0gXG4gICAgICAgICAgICBcImJldHdlZW5cIjogZnVuY3Rpb24oZmlsdGVyVmFsLCByb3dWYWwpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcm93VmFsID49IGZpbHRlclZhbFswXSAmJiByb3dWYWwgPD0gZmlsdGVyVmFsWzFdO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIC8vaW4gYXJyYXkuXG4gICAgICAgICAgICBcImluXCI6IGZ1bmN0aW9uKGZpbHRlclZhbCwgcm93VmFsKSB7XG4gICAgICAgICAgICAgICAgaWYgKEFycmF5LmlzQXJyYXkoZmlsdGVyVmFsKSkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gZmlsdGVyVmFsLmxlbmd0aCA/IGZpbHRlclZhbC5pbmRleE9mKHJvd1ZhbCkgPiAtMSA6IHRydWU7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS53YXJuKFwiRmlsdGVyIEVycm9yIC0gZmlsdGVyIHZhbHVlIGlzIG5vdCBhbiBhcnJheTpcIiwgZmlsdGVyVmFsKTtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcbiAgICB9XG4gICAgLyoqXG4gICAgICogRXhlY3V0ZXMgYW4gaW50ZXJuYWwgZnVuY3Rpb24gdG8gaW5kaWNhdGUgaWYgdGhlIGN1cnJlbnQgcm93IHZhbHVlcyBtYXRjaGVzIHRoZSBmaWx0ZXIgY3JpdGVyaWEncyB2YWx1ZS4gIFxuICAgICAqIEBwYXJhbSB7T2JqZWN0fSByb3dWYWwgUm93IGNvbHVtbiB2YWx1ZS4gIEV4cGVjdHMgYSB2YWx1ZSB0aGF0IG1hdGNoZXMgdGhlIHR5cGUgaWRlbnRpZmllZCBieSB0aGUgY29sdW1uLlxuICAgICAqIEBwYXJhbSB7T2JqZWN0PEFycmF5Pn0gcm93IEN1cnJlbnQgZGF0YSBzZXQgcm93LlxuICAgICAqIEByZXR1cm5zIHtib29sZWFufSBSZXR1cm5zIHRydWUgaWYgcm93IHZhbHVlIG1hdGNoZXMgZmlsdGVyIHZhbHVlLiAgT3RoZXJ3aXNlLCBmYWxzZSBpbmRpY2F0aW5nIG5vIG1hdGNoLlxuICAgICAqL1xuICAgIGV4ZWN1dGUocm93VmFsLCByb3cpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuZmlsdGVyc1t0aGlzLmZpbHRlclR5cGVdKHRoaXMudmFsdWUsIHJvd1ZhbCk7XG4gICAgfVxufVxuXG5leHBvcnQgeyBGaWx0ZXJUYXJnZXQgfTsiLCJpbXBvcnQgeyBEYXRlSGVscGVyIH0gZnJvbSBcIi4uLy4uLy4uL2NvbXBvbmVudHMvaGVscGVycy9kYXRlSGVscGVyLmpzXCI7XG4vKipcbiAqIENsYXNzIHRoYXQgZGVmaW5lcyBhIHNpbmdsZSBmaWx0ZXIgY29uZGl0aW9uIGZvciBhIGRhdGUgY29sdW1uLlxuICovXG5jbGFzcyBGaWx0ZXJEYXRlIHtcbiAgICAvKipcbiAgICAgKiBDcmVhdGVzIGZpbHRlciB0YXJnZXQgb2JqZWN0IHRoYXQgZGVmaW5lcyBhIHNpbmdsZSBmaWx0ZXIgY29uZGl0aW9uIGZvciBhIGRhdGUgZGF0YSB0eXBlLiAgRXhwZWN0cyBhbiBvYmplY3Qgd2l0aCB0aGUgZm9sbG93aW5nIHByb3BlcnRpZXM6XG4gICAgICogKiBgdmFsdWVgOiBUaGUgdmFsdWUgdG8gZmlsdGVyIGFnYWluc3QuICBFeHBlY3RzIHRoYXQgdmFsdWUgbWF0Y2hlcyB0aGUgdHlwZSBvZiB0aGUgZmllbGQgYmVpbmcgZmlsdGVyZWQuICBTaG91bGQgYmUgbnVsbCBpZiBcbiAgICAgKiB2YWx1ZSB0eXBlIGNhbm5vdCBiZSBjb252ZXJ0ZWQgdG8gdGhlIGZpZWxkIHR5cGUuXG4gICAgICogKiBgZmllbGRgOiBUaGUgZmllbGQgbmFtZSBvZiB0aGUgY29sdW1uIGJlaW5nIGZpbHRlcmVkLiAgVGhpcyBpcyB1c2VkIHRvIGlkZW50aWZ5IHRoZSBjb2x1bW4gaW4gdGhlIGRhdGEgc2V0LlxuICAgICAqICogYGZpbHRlclR5cGVgOiBUaGUgdHlwZSBvZiBmaWx0ZXIgdG8gYXBwbHkgKGUuZy4sIFwiZXF1YWxzXCIsIFwibGlrZVwiLCBcIjxcIiwgXCI8PVwiLCBcIj5cIiwgXCI+PVwiLCBcIiE9XCIsIFwiYmV0d2VlblwiLCBcImluXCIpLlxuICAgICAqIEBwYXJhbSB7eyB2YWx1ZTogKERhdGUgfCBBcnJheTxEYXRlPiksIGZpZWxkOiBzdHJpbmcsIGZpbHRlclR5cGU6IHN0cmluZyB9fSB0YXJnZXQgXG4gICAgICovXG4gICAgY29uc3RydWN0b3IodGFyZ2V0KSB7XG4gICAgICAgIHRoaXMudmFsdWUgPSB0YXJnZXQudmFsdWU7XG4gICAgICAgIHRoaXMuZmllbGQgPSB0YXJnZXQuZmllbGQ7XG4gICAgICAgIHRoaXMuZmllbGRUeXBlID0gXCJkYXRlXCI7XG4gICAgICAgIHRoaXMuZmlsdGVyVHlwZSA9IHRhcmdldC5maWx0ZXJUeXBlO1xuICAgICAgICB0aGlzLmZpbHRlcnMgPSB0aGlzLiNpbml0KCk7XG4gICAgfVxuICAgIC8qKlxuICAgICAqIFJldHVybnMgYSBuZXcgZGF0ZSBvYmplY3QgZm9yIGVhY2ggZGF0ZSBwYXNzZWQgaW4sIHNldHRpbmcgdGhlIHRpbWUgdG8gbWlkbmlnaHQuICBUaGlzIGlzIHVzZWQgdG8gZW5zdXJlIHRoYXQgdGhlIGRhdGUgb2JqZWN0cyBhcmUgbm90IG1vZGlmaWVkXG4gICAgICogd2hlbiBjb21wYXJpbmcgZGF0ZXMgaW4gdGhlIGZpbHRlciBmdW5jdGlvbnMsIGFuZCB0byBlbnN1cmUgdGhhdCB0aGUgdGltZSBwb3J0aW9uIG9mIHRoZSBkYXRlIGRvZXMgbm90IGFmZmVjdCB0aGUgY29tcGFyaXNvbi5cbiAgICAgKiBAcGFyYW0ge0RhdGV9IGRhdGUxIFxuICAgICAqIEBwYXJhbSB7RGF0ZX0gZGF0ZTIgXG4gICAgICogQHJldHVybnMge0FycmF5PERhdGU+fSBSZXR1cm5zIGFuIGFycmF5IG9mIHR3byBkYXRlIG9iamVjdHMsIGVhY2ggc2V0IHRvIG1pZG5pZ2h0IG9mIHRoZSByZXNwZWN0aXZlIGRhdGUgcGFzc2VkIGluLlxuICAgICAqL1xuICAgIGNsb25lRGF0ZXMgPSAoZGF0ZTEsIGRhdGUyKSA9PiB7IFxuICAgICAgICBjb25zdCBkMSA9IG5ldyBEYXRlKGRhdGUxKTtcbiAgICAgICAgY29uc3QgZDIgPSBuZXcgRGF0ZShkYXRlMik7XG5cbiAgICAgICAgZDEuc2V0SG91cnMoMCwgMCwgMCwgMCk7XG4gICAgICAgIGQyLnNldEhvdXJzKDAsIDAsIDAsIDApO1xuICAgICAgICBcbiAgICAgICAgcmV0dXJuIFtkMSwgZDJdO1xuICAgIH07XG5cbiAgICAjaW5pdCgpIHsgXG4gICAgICAgIHJldHVybiB7IFxuICAgICAgICAgICAgXCJlcXVhbHNcIjogZnVuY3Rpb24oZmlsdGVyVmFsLCByb3dWYWwpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gZmlsdGVyVmFsLmdldEZ1bGxZZWFyKCkgPT09IHJvd1ZhbC5nZXRGdWxsWWVhcigpICYmIGZpbHRlclZhbC5nZXRNb250aCgpID09PSByb3dWYWwuZ2V0TW9udGgoKSAmJiBmaWx0ZXJWYWwuZ2V0RGF0ZSgpID09PSByb3dWYWwuZ2V0RGF0ZSgpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIC8vbGVzcyB0aGFuXG4gICAgICAgICAgICBcIjxcIjogKGZpbHRlclZhbCwgcm93VmFsKSA9PiB7XG4gICAgICAgICAgICAgICAgY29uc3QgZGF0ZXMgPSB0aGlzLmNsb25lRGF0ZXMoZmlsdGVyVmFsLCByb3dWYWwpO1xuIFxuICAgICAgICAgICAgICAgIHJldHVybiBkYXRlc1swXS5nZXRUaW1lKCkgPCBkYXRlc1sxXS5nZXRUaW1lKCk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgLy9sZXNzIHRoYW4gb3IgZXF1YWwgdG9cbiAgICAgICAgICAgIFwiPD1cIjogKGZpbHRlclZhbCwgcm93VmFsKSA9PiB7XG4gICAgICAgICAgICAgICAgY29uc3QgZGF0ZXMgPSB0aGlzLmNsb25lRGF0ZXMoZmlsdGVyVmFsLCByb3dWYWwpO1xuXG4gICAgICAgICAgICAgICAgcmV0dXJuIGRhdGVzWzBdLmdldFRpbWUoKSA8IGRhdGVzWzFdLmdldFRpbWUoKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAvL2dyZWF0ZXIgdGhhblxuICAgICAgICAgICAgXCI+XCI6IChmaWx0ZXJWYWwsIHJvd1ZhbCkgPT4ge1xuICAgICAgICAgICAgICAgIGNvbnN0IGRhdGVzID0gdGhpcy5jbG9uZURhdGVzKGZpbHRlclZhbCwgcm93VmFsKTtcblxuICAgICAgICAgICAgICAgIHJldHVybiBkYXRlc1swXS5nZXRUaW1lKCkgPiBkYXRlc1sxXS5nZXRUaW1lKCk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgLy9ncmVhdGVyIHRoYW4gb3IgZXF1YWwgdG9cbiAgICAgICAgICAgIFwiPj1cIjogKGZpbHRlclZhbCwgcm93VmFsKSA9PiB7XG4gICAgICAgICAgICAgICAgY29uc3QgZGF0ZXMgPSB0aGlzLmNsb25lRGF0ZXMoZmlsdGVyVmFsLCByb3dWYWwpO1xuXG4gICAgICAgICAgICAgICAgcmV0dXJuIGRhdGVzWzBdLmdldFRpbWUoKSA+PSBkYXRlc1sxXS5nZXRUaW1lKCk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgLy9ub3QgZXF1YWwgdG9cbiAgICAgICAgICAgIFwiIT1cIjogZnVuY3Rpb24oZmlsdGVyVmFsLCByb3dWYWwpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gZmlsdGVyVmFsLmdldEZ1bGxZZWFyKCkgIT09IHJvd1ZhbC5nZXRGdWxsWWVhcigpICYmIGZpbHRlclZhbC5nZXRNb250aCgpICE9PSByb3dWYWwuZ2V0TW9udGgoKSAmJiBmaWx0ZXJWYWwuZ2V0RGF0ZSgpICE9PSByb3dWYWwuZ2V0RGF0ZSgpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIC8vIGJldHdlZW4uICBleHBlY3RzIGZpbHRlclZhbCB0byBiZSBhbiBhcnJheSBvZjogWyB7c3RhcnQgdmFsdWV9LCB7IGVuZCB2YWx1ZSB9IF0gXG4gICAgICAgICAgICBcImJldHdlZW5cIjogKGZpbHRlclZhbCwgcm93VmFsKSAgPT4ge1xuICAgICAgICAgICAgICAgIGNvbnN0IGZpbHRlckRhdGVzID0gdGhpcy5jbG9uZURhdGVzKGZpbHRlclZhbFswXSwgZmlsdGVyVmFsWzFdKTtcbiAgICAgICAgICAgICAgICBjb25zdCByb3dEYXRlcyA9IHRoaXMuY2xvbmVEYXRlcyhyb3dWYWwsIHJvd1ZhbCk7XG5cbiAgICAgICAgICAgICAgICByZXR1cm4gcm93RGF0ZXNbMF0gPj0gZmlsdGVyRGF0ZXNbMF0gJiYgcm93RGF0ZXNbMF0gPD0gZmlsdGVyRGF0ZXNbMV07XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG4gICAgfVxuICAgIC8qKlxuICAgICAqIEV4ZWN1dGVzIGFuIGludGVybmFsIGZ1bmN0aW9uIHRvIGluZGljYXRlIGlmIHRoZSBjdXJyZW50IHJvdyB2YWx1ZSBtYXRjaGVzIHRoZSBmaWx0ZXIgY3JpdGVyaWEncyB2YWx1ZS4gIFxuICAgICAqIEBwYXJhbSB7RGF0ZX0gcm93VmFsIFJvdyBjb2x1bW4gdmFsdWUuICBFeHBlY3RzIGEgRGF0ZSBvYmplY3QuXG4gICAgICogQHBhcmFtIHtPYmplY3Q8QXJyYXk+fSByb3cgQ3VycmVudCBkYXRhIHNldCByb3cuXG4gICAgICogQHJldHVybnMge2Jvb2xlYW59IFJldHVybnMgdHJ1ZSBpZiByb3cgdmFsdWUgbWF0Y2hlcyBmaWx0ZXIgdmFsdWUuICBPdGhlcndpc2UsIGZhbHNlIGluZGljYXRpbmcgbm8gbWF0Y2guXG4gICAgICovXG4gICAgZXhlY3V0ZShyb3dWYWwsIHJvdykge1xuICAgICAgICBpZiAocm93VmFsID09PSBudWxsIHx8ICFEYXRlSGVscGVyLmlzRGF0ZShyb3dWYWwpKSB7XG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7IC8vIElmIHJvd1ZhbCBpcyBudWxsIG9yIG5vdCBhIGRhdGUsIHJldHVybiBmYWxzZS5cbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiB0aGlzLmZpbHRlcnNbdGhpcy5maWx0ZXJUeXBlXSh0aGlzLnZhbHVlLCByb3dWYWwpO1xuICAgIH1cbn1cblxuZXhwb3J0IHsgRmlsdGVyRGF0ZSB9OyIsIi8qKlxuICogUmVwcmVzZW50cyBhIGNvbmNyZXRlIGltcGxlbWVudGF0aW9uIG9mIGEgZmlsdGVyIHRoYXQgdXNlcyBhIHVzZXIgc3VwcGxpZWQgZnVuY3Rpb24uXG4gKi9cbmNsYXNzIEZpbHRlckZ1bmN0aW9uIHtcbiAgICAvKipcbiAgICAgKiBDcmVhdGVzIGEgZmlsdGVyIGZ1bmN0aW9uIGluc3RhbmNlLiAgRXhwZWN0cyBhbiBvYmplY3Qgd2l0aCB0aGUgZm9sbG93aW5nIHByb3BlcnRpZXM6XG4gICAgICogKiBgdmFsdWVgOiBUaGUgdmFsdWUgdG8gZmlsdGVyIGFnYWluc3QuICBEb2VzIG5vdCBuZWVkIHRvIG1hdGNoIHRoZSB0eXBlIG9mIHRoZSBmaWVsZCBiZWluZyBmaWx0ZXJlZC5cbiAgICAgKiAqIGBmaWVsZGA6IFRoZSBmaWVsZCBuYW1lIG9mIHRoZSBjb2x1bW4gYmVpbmcgZmlsdGVyZWQuICBUaGlzIGlzIHVzZWQgdG8gaWRlbnRpZnkgdGhlIGNvbHVtbiBpbiB0aGUgZGF0YSBzZXQuXG4gICAgICogKiBgZmlsdGVyVHlwZWA6IFRoZSBmdW5jdGlvbiB0byB1c2UgZm9yIGZpbHRlcmluZy5cbiAgICAgKiAqIGBwYXJhbXNgOiBPcHRpb25hbCBwYXJhbWV0ZXJzIHRvIHBhc3MgdG8gdGhlIGZpbHRlciBmdW5jdGlvbi5cbiAgICAgKiBAcGFyYW0ge3sgdmFsdWU6IE9iamVjdCwgZmllbGQ6IHN0cmluZywgZmlsdGVyVHlwZTogRnVuY3Rpb24sIHBhcmFtczogT2JqZWN0IH19IHRhcmdldCBcbiAgICAgKi9cbiAgICBjb25zdHJ1Y3Rvcih0YXJnZXQpIHtcbiAgICAgICAgdGhpcy52YWx1ZSA9IHRhcmdldC52YWx1ZTtcbiAgICAgICAgdGhpcy5maWVsZCA9IHRhcmdldC5maWVsZDtcbiAgICAgICAgdGhpcy5maWx0ZXJGdW5jdGlvbiA9IHRhcmdldC5maWx0ZXJUeXBlO1xuICAgICAgICB0aGlzLnBhcmFtcyA9IHRhcmdldC5wYXJhbXMgPz8ge307XG4gICAgfVxuICAgIC8qKlxuICAgICAqIEV4ZWN1dGVzIGFuIHVzZXIgc3VwcGxpZWQgZnVuY3Rpb24gdG8gaW5kaWNhdGUgaWYgdGhlIGN1cnJlbnQgcm93IHZhbHVlcyBtYXRjaGVzIHRoZSBmaWx0ZXIgY3JpdGVyaWEncyB2YWx1ZS4gIFxuICAgICAqIEBwYXJhbSB7T2JqZWN0fSByb3dWYWwgUm93IGNvbHVtbiB2YWx1ZS4gIEV4cGVjdHMgYSB2YWx1ZSB0aGF0IG1hdGNoZXMgdGhlIHR5cGUgaWRlbnRpZmllZCBieSB0aGUgY29sdW1uLlxuICAgICAqIEBwYXJhbSB7T2JqZWN0PEFycmF5Pn0gcm93IEN1cnJlbnQgZGF0YSBzZXQgcm93LlxuICAgICAqIEByZXR1cm5zIHtib29sZWFufSBSZXR1cm5zIHRydWUgaWYgcm93IHZhbHVlIG1hdGNoZXMgZmlsdGVyIHZhbHVlLiAgT3RoZXJ3aXNlLCBmYWxzZSBpbmRpY2F0aW5nIG5vIG1hdGNoLlxuICAgICAqL1xuICAgIGV4ZWN1dGUocm93VmFsLCByb3cpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuZmlsdGVyRnVuY3Rpb24odGhpcy52YWx1ZSwgcm93VmFsLCByb3csIHRoaXMucGFyYW1zKTtcbiAgICB9XG59XG5cbmV4cG9ydCB7IEZpbHRlckZ1bmN0aW9uIH07IiwiaW1wb3J0IHsgRGF0ZUhlbHBlciB9IGZyb20gXCIuLi8uLi9jb21wb25lbnRzL2hlbHBlcnMvZGF0ZUhlbHBlci5qc1wiO1xuaW1wb3J0IHsgRmlsdGVyVGFyZ2V0IH0gZnJvbSBcIi4vdHlwZXMvZmlsdGVyVGFyZ2V0LmpzXCI7XG5pbXBvcnQgeyBGaWx0ZXJEYXRlIH0gZnJvbSBcIi4vdHlwZXMvZmlsdGVyRGF0ZS5qc1wiO1xuaW1wb3J0IHsgRmlsdGVyRnVuY3Rpb24gfSBmcm9tIFwiLi90eXBlcy9maWx0ZXJGdW5jdGlvbi5qc1wiO1xuaW1wb3J0IHsgRWxlbWVudEJldHdlZW4gfSBmcm9tIFwiLi9lbGVtZW50cy9lbGVtZW50QmV0d2Vlbi5qc1wiO1xuaW1wb3J0IHsgRWxlbWVudElucHV0IH0gZnJvbSBcIi4vZWxlbWVudHMvZWxlbWVudElucHV0LmpzXCI7XG5pbXBvcnQgeyBFbGVtZW50TXVsdGlTZWxlY3QgfSBmcm9tIFwiLi9lbGVtZW50cy9lbGVtZW50TXVsdGlTZWxlY3QuanNcIjtcbmltcG9ydCB7IEVsZW1lbnRTZWxlY3QgfSBmcm9tIFwiLi9lbGVtZW50cy9lbGVtZW50U2VsZWN0LmpzXCI7XG4vKipcbiAqIFByb3ZpZGVzIGEgbWVhbnMgdG8gZmlsdGVyIGRhdGEgaW4gdGhlIGdyaWQuICBUaGlzIG1vZHVsZSBjcmVhdGVzIGhlYWRlciBmaWx0ZXIgY29udHJvbHMgZm9yIGVhY2ggY29sdW1uIHRoYXQgaGFzIFxuICogYSBgaGFzRmlsdGVyYCBhdHRyaWJ1dGUgc2V0IHRvIGB0cnVlYC5cbiAqIFxuICogQ2xhc3Mgc3Vic2NyaWJlcyB0byB0aGUgYHJlbmRlcmAgZXZlbnQgdG8gdXBkYXRlIHRoZSBmaWx0ZXIgY29udHJvbCB3aGVuIHRoZSBncmlkIGlzIHJlbmRlcmVkLiAgSXQgYWxzbyBjYWxscyB0aGUgY2hhaW4gXG4gKiBldmVudCBgcmVtb3RlUGFyYW1zYCB0byBjb21waWxlIGEgbGlzdCBvZiBwYXJhbWV0ZXJzIHRvIGJlIHBhc3NlZCB0byB0aGUgcmVtb3RlIGRhdGEgc291cmNlIHdoZW4gdXNpbmcgcmVtb3RlIHByb2Nlc3NpbmcuXG4gKi9cbmNsYXNzIEZpbHRlck1vZHVsZSB7XG4gICAgLyoqXG4gICAgICogQ3JlYXRlcyBhIG5ldyBmaWx0ZXIgbW9kdWxlIG9iamVjdC5cbiAgICAgKiBAcGFyYW0ge0dyaWRDb250ZXh0fSBjb250ZXh0IEdyaWQgY29udGV4dC5cbiAgICAgKi9cbiAgICBjb25zdHJ1Y3Rvcihjb250ZXh0KSB7XG4gICAgICAgIHRoaXMuY29udGV4dCA9IGNvbnRleHQ7XG4gICAgICAgIHRoaXMuaGVhZGVyRmlsdGVycyA9IFtdO1xuICAgICAgICB0aGlzLmdyaWRGaWx0ZXJzID0gW107XG4gICAgfVxuXG4gICAgaW5pdGlhbGl6ZSgpIHtcbiAgICAgICAgaWYgKHRoaXMuY29udGV4dC5zZXR0aW5ncy5yZW1vdGVQcm9jZXNzaW5nKSB7XG4gICAgICAgICAgICB0aGlzLmNvbnRleHQuZXZlbnRzLnN1YnNjcmliZShcInJlbW90ZVBhcmFtc1wiLCB0aGlzLnJlbW90ZVBhcmFtcywgdHJ1ZSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB0aGlzLmNvbnRleHQuZXZlbnRzLnN1YnNjcmliZShcInJlbmRlclwiLCB0aGlzLnJlbmRlckxvY2FsLCBmYWxzZSwgOCk7XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLl9pbml0KCk7XG4gICAgfVxuICAgIC8qKlxuICAgICAqIENyZWF0ZSBgSGVhZGVyRmlsdGVyYCBDbGFzcyBmb3IgZ3JpZCBjb2x1bW5zIHdpdGggYSBgaGFzRmlsdGVyYCBhdHRyaWJ1dGUgb2YgYHRydWVgLlxuICAgICAqL1xuICAgIF9pbml0KCkge1xuICAgICAgICBmb3IgKGNvbnN0IGNvbCBvZiB0aGlzLmNvbnRleHQuY29sdW1uTWFuYWdlci5jb2x1bW5zKSB7XG4gICAgICAgICAgICBpZiAoIWNvbC5oYXNGaWx0ZXIpIGNvbnRpbnVlO1xuXG4gICAgICAgICAgICBpZiAoY29sLmZpbHRlckVsZW1lbnQgPT09IFwibXVsdGlcIikge1xuICAgICAgICAgICAgICAgIGNvbC5oZWFkZXJGaWx0ZXIgPSBuZXcgRWxlbWVudE11bHRpU2VsZWN0KGNvbCwgdGhpcy5jb250ZXh0KTtcbiAgICAgICAgICAgIH0gZWxzZSBpZiAoY29sLmZpbHRlckVsZW1lbnQgPT09IFwiYmV0d2VlblwiKSB7XG4gICAgICAgICAgICAgICAgY29sLmhlYWRlckZpbHRlciA9IG5ldyBFbGVtZW50QmV0d2Vlbihjb2wsIHRoaXMuY29udGV4dCk7XG4gICAgICAgICAgICB9IGVsc2UgaWYgKGNvbC5maWx0ZXJFbGVtZW50ID09PSBcInNlbGVjdFwiKSB7XG4gICAgICAgICAgICAgICAgY29sLmhlYWRlckZpbHRlciA9IG5ldyBFbGVtZW50U2VsZWN0KGNvbCwgdGhpcy5jb250ZXh0KTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgY29sLmhlYWRlckZpbHRlciA9IG5ldyBFbGVtZW50SW5wdXQoY29sLCB0aGlzLmNvbnRleHQpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBjb2wuaGVhZGVyQ2VsbC5lbGVtZW50LmFwcGVuZENoaWxkKGNvbC5oZWFkZXJGaWx0ZXIuZWxlbWVudCk7XG4gICAgICAgICAgICB0aGlzLmhlYWRlckZpbHRlcnMucHVzaChjb2wuaGVhZGVyRmlsdGVyKTtcbiAgICAgICAgfVxuICAgIH1cbiAgICAvKipcbiAgICAgKiBDb21waWxlcyBoZWFkZXIgYW5kIGdyaWQgZmlsdGVyIHZhbHVlcyBpbnRvIGEgc2luZ2xlIG9iamVjdCBvZiBrZXkvdmFsdWUgcGFpcnMgdGhhdCBjYW4gYmUgdXNlZCB0byBzZW5kIHRvIHRoZSByZW1vdGUgZGF0YSBzb3VyY2UuXG4gICAgICogQHBhcmFtIHtPYmplY3R9IHBhcmFtcyBPYmplY3Qgb2Yga2V5L3ZhbHVlIHBhaXJzIHRvIGJlIHNlbnQgdG8gdGhlIHJlbW90ZSBkYXRhIHNvdXJjZS5cbiAgICAgKiBAcmV0dXJucyB7T2JqZWN0fSBSZXR1cm5zIHRoZSBtb2RpZmllZCBwYXJhbXMgb2JqZWN0IHdpdGggZmlsdGVyIHZhbHVlcyBhZGRlZC5cbiAgICAgKi9cbiAgICByZW1vdGVQYXJhbXMgPSAocGFyYW1zKSA9PiB7XG4gICAgICAgIHRoaXMuaGVhZGVyRmlsdGVycy5mb3JFYWNoKChmKSA9PiB7XG4gICAgICAgICAgICBpZiAoZi52YWx1ZSAhPT0gXCJcIikge1xuICAgICAgICAgICAgICAgIHBhcmFtc1tmLmZpZWxkXSA9IGYudmFsdWU7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuXG4gICAgICAgIGlmICh0aGlzLmdyaWRGaWx0ZXJzLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgIGZvciAoY29uc3QgaXRlbSBvZiB0aGlzLmdyaWRGaWx0ZXJzKSB7XG4gICAgICAgICAgICAgICAgcGFyYW1zW2l0ZW0uZmllbGRdID0gaXRlbS52YWx1ZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBwYXJhbXM7XG4gICAgfTtcbiAgICAvKipcbiAgICAgKiBDb252ZXJ0IHZhbHVlIHR5cGUgdG8gY29sdW1uIHR5cGUuICBJZiB2YWx1ZSBjYW5ub3QgYmUgY29udmVydGVkLCBgbnVsbGAgaXMgcmV0dXJuZWQuXG4gICAgICogQHBhcmFtIHtvYmplY3QgfCBzdHJpbmcgfCBudW1iZXJ9IHZhbHVlIFJhdyBmaWx0ZXIgdmFsdWUuXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IHR5cGUgRmllbGQgdHlwZS5cbiAgICAgKiBAcmV0dXJucyB7bnVtYmVyIHwgRGF0ZSB8IHN0cmluZyB8IG51bGwgfCBPYmplY3R9IGlucHV0IHZhbHVlIG9yIGBudWxsYCBpZiBlbXB0eS5cbiAgICAgKi9cbiAgICBjb252ZXJ0VG9UeXBlKHZhbHVlLCB0eXBlKSB7XG4gICAgICAgIGlmICh2YWx1ZSA9PT0gXCJcIiB8fCB2YWx1ZSA9PT0gbnVsbCkgcmV0dXJuIHZhbHVlO1xuXG4gICAgICAgIGlmIChBcnJheS5pc0FycmF5KHZhbHVlKSkge1xuICAgICAgICAgICAgaWYgKHR5cGUgPT09IFwiZGF0ZVwiIHx8IHR5cGUgPT09IFwiZGF0ZXRpbWVcIikgIHsgXG4gICAgICAgICAgICAgICAgY29uc3QgcmVzdWx0ID0gdmFsdWUubWFwKCh2KSA9PiBEYXRlSGVscGVyLnBhcnNlRGF0ZSh2KSk7IFxuXG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc3VsdC5pbmNsdWRlcyhcIlwiKSA/IG51bGwgOiByZXN1bHQ7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmICh0eXBlID09PSBcIm51bWJlclwiKSB7XG4gICAgICAgICAgICAgICAgY29uc3QgdmFsdWUxID0gdGhpcy5jb252ZXJ0VG9UeXBlKHZhbHVlWzBdLCB0eXBlKTtcbiAgICAgICAgICAgICAgICBjb25zdCB2YWx1ZTIgPSB0aGlzLmNvbnZlcnRUb1R5cGUodmFsdWVbMV0sIHR5cGUpOyAgXG5cbiAgICAgICAgICAgICAgICByZXR1cm4gdmFsdWUxID09PSBudWxsIHx8IHZhbHVlMiA9PT0gbnVsbCA/IG51bGwgOiBbdmFsdWUxLCB2YWx1ZTJdO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICByZXR1cm4gdmFsdWU7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAodHlwZSA9PT0gXCJudW1iZXJcIikge1xuICAgICAgICAgICAgdmFsdWUgPSBOdW1iZXIodmFsdWUpO1xuICAgICAgICAgICAgcmV0dXJuIE51bWJlci5pc05hTih2YWx1ZSkgPyBudWxsIDogdmFsdWU7XG4gICAgICAgIH0gXG4gICAgICAgIFxuICAgICAgICBpZiAodHlwZSA9PT0gXCJkYXRlXCIgfHwgdHlwZSA9PT0gXCJkYXRldGltZVwiKSB7XG4gICAgICAgICAgICB2YWx1ZSA9IERhdGVIZWxwZXIucGFyc2VEYXRlT25seSh2YWx1ZSk7XG4gICAgICAgICAgICByZXR1cm4gdmFsdWUgPT09IFwiXCIgPyBudWxsIDogdmFsdWU7XG4gICAgICAgIH0gXG4gICAgICAgIC8vYXNzdW1pbmcgaXQncyBhIHN0cmluZyB2YWx1ZSBvciBPYmplY3QgYXQgdGhpcyBwb2ludC5cbiAgICAgICAgcmV0dXJuIHZhbHVlO1xuICAgIH1cbiAgICAvKipcbiAgICAgKiBXcmFwcyB0aGUgZmlsdGVyIGlucHV0IHZhbHVlIGluIGEgYEZpbHRlclRhcmdldGAgb2JqZWN0LCB3aGljaCBkZWZpbmVzIGEgc2luZ2xlIGZpbHRlciBjb25kaXRpb24gZm9yIGEgY29sdW1uLlxuICAgICAqIEBwYXJhbSB7c3RyaW5nIHwgRGF0ZSB8IG51bWJlciB8IE9iamVjdH0gdmFsdWUgRmlsdGVyIHZhbHVlIHRvIGFwcGx5IHRvIHRoZSBjb2x1bW4uXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IGZpZWxkIFRoZSBmaWVsZCBuYW1lIG9mIHRoZSBjb2x1bW4gYmVpbmcgZmlsdGVyZWQuIFRoaXMgaXMgdXNlZCB0byBpZGVudGlmeSB0aGUgY29sdW1uIGluIHRoZSBkYXRhIHNldC5cbiAgICAgKiBAcGFyYW0ge3N0cmluZyB8IEZ1bmN0aW9ufSBmaWx0ZXJUeXBlIFRoZSB0eXBlIG9mIGZpbHRlciB0byBhcHBseSAoZS5nLiwgXCJlcXVhbHNcIiwgXCJsaWtlXCIsIFwiPFwiLCBcIjw9XCIsIFwiPlwiLCBcIj49XCIsIFwiIT1cIiwgXCJiZXR3ZWVuXCIsIFwiaW5cIikuXG4gICAgICogQ2FuIGFsc28gYmUgYSBmdW5jdGlvbi5cbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gZmllbGRUeXBlIFRoZSB0eXBlIG9mIGZpZWxkIGJlaW5nIGZpbHRlcmVkIChlLmcuLCBcInN0cmluZ1wiLCBcIm51bWJlclwiLCBcImRhdGVcIiwgXCJvYmplY3RcIikuXG4gICAgICogQHBhcmFtIHtib29sZWFufSBmaWx0ZXJJc0Z1bmN0aW9uIEluZGljYXRlcyBpZiB0aGUgZmlsdGVyIHR5cGUgaXMgYSBmdW5jdGlvbi5cbiAgICAgKiBAcGFyYW0ge09iamVjdH0gZmlsdGVyUGFyYW1zIE9wdGlvbmFsIHBhcmFtZXRlcnMgdG8gcGFzcyB0byB0aGUgZmlsdGVyIGZ1bmN0aW9uLlxuICAgICAqIEByZXR1cm5zIHtGaWx0ZXJUYXJnZXQgfCBGaWx0ZXJEYXRlIHwgRmlsdGVyRnVuY3Rpb24gfCBudWxsfSBSZXR1cm5zIGEgZmlsdGVyIHRhcmdldCBvYmplY3QgdGhhdCBkZWZpbmVzIGEgc2luZ2xlIGZpbHRlciBjb25kaXRpb24gZm9yIGEgY29sdW1uLCBcbiAgICAgKiBvciBudWxsIGlmIHRoZSB2YWx1ZSBjYW5ub3QgYmUgY29udmVydGVkIHRvIHRoZSBmaWVsZCB0eXBlLiBcbiAgICAgKi9cbiAgICBjcmVhdGVGaWx0ZXJUYXJnZXQodmFsdWUsIGZpZWxkLCBmaWx0ZXJUeXBlLCBmaWVsZFR5cGUsIGZpbHRlcklzRnVuY3Rpb24sIGZpbHRlclBhcmFtcykgeyBcbiAgICAgICAgaWYgKGZpbHRlcklzRnVuY3Rpb24pIHsgXG4gICAgICAgICAgICByZXR1cm4gbmV3IEZpbHRlckZ1bmN0aW9uKHsgdmFsdWU6IHZhbHVlLCBmaWVsZDogZmllbGQsIGZpbHRlclR5cGU6IGZpbHRlclR5cGUsIHBhcmFtczogZmlsdGVyUGFyYW1zIH0pO1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc3QgY29udmVydGVkVmFsdWUgPSB0aGlzLmNvbnZlcnRUb1R5cGUodmFsdWUsIGZpZWxkVHlwZSk7XG5cbiAgICAgICAgaWYgKGNvbnZlcnRlZFZhbHVlID09PSBudWxsKSByZXR1cm4gbnVsbDtcblxuICAgICAgICBpZiAoZmllbGRUeXBlID09PSBcImRhdGVcIiB8fCBmaWVsZFR5cGUgPT09IFwiZGF0ZXRpbWVcIikge1xuICAgICAgICAgICAgcmV0dXJuIG5ldyBGaWx0ZXJEYXRlKHsgdmFsdWU6IGNvbnZlcnRlZFZhbHVlLCBmaWVsZDogZmllbGQsIGZpbHRlclR5cGU6IGZpbHRlclR5cGUgfSk7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gbmV3IEZpbHRlclRhcmdldCh7IHZhbHVlOiBjb252ZXJ0ZWRWYWx1ZSwgZmllbGQ6IGZpZWxkLCBmaWVsZFR5cGU6IGZpZWxkVHlwZSwgZmlsdGVyVHlwZTogZmlsdGVyVHlwZSB9KTtcbiAgICB9XG4gICAgLyoqXG4gICAgICogQ29tcGlsZXMgYW4gYXJyYXkgb2YgZmlsdGVyIHR5cGUgb2JqZWN0cyB0aGF0IGNvbnRhaW4gYSBmaWx0ZXIgdmFsdWUgdGhhdCBtYXRjaGVzIGl0cyBjb2x1bW4gdHlwZS4gIENvbHVtbiB0eXBlIG1hdGNoaW5nIFxuICAgICAqIGlzIG5lY2Vzc2FyeSB3aGVuIHByb2Nlc3NpbmcgZGF0YSBsb2NhbGx5LCBzbyB0aGF0IGZpbHRlciB2YWx1ZSBtYXRjaGVzIGFzc29jaWF0ZWQgcm93IHR5cGUgdmFsdWUgZm9yIGNvbXBhcmlzb24uXG4gICAgICogQHJldHVybnMge0FycmF5fSBhcnJheSBvZiBmaWx0ZXIgdHlwZSBvYmplY3RzIHdpdGggdmFsaWQgdmFsdWUuXG4gICAgICovXG4gICAgY29tcGlsZUZpbHRlcnMoKSB7XG4gICAgICAgIGxldCByZXN1bHRzID0gW107XG5cbiAgICAgICAgZm9yIChjb25zdCBpdGVtIG9mIHRoaXMuaGVhZGVyRmlsdGVycykge1xuICAgICAgICAgICAgaWYgKGl0ZW0udmFsdWUgPT09IFwiXCIpIGNvbnRpbnVlO1xuXG4gICAgICAgICAgICBjb25zdCBmaWx0ZXIgPSB0aGlzLmNyZWF0ZUZpbHRlclRhcmdldChpdGVtLnZhbHVlLCBpdGVtLmZpZWxkLCBpdGVtLmZpbHRlclR5cGUsIGl0ZW0uZmllbGRUeXBlLCBpdGVtLmZpbHRlcklzRnVuY3Rpb24sIGl0ZW0/LmZpbHRlclBhcmFtcyk7XG5cbiAgICAgICAgICAgIGlmIChmaWx0ZXIgIT09IG51bGwpIHtcbiAgICAgICAgICAgICAgICByZXN1bHRzLnB1c2goZmlsdGVyKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIGlmICh0aGlzLmdyaWRGaWx0ZXJzLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgIHJlc3VsdHMgPSByZXN1bHRzLmNvbmNhdCh0aGlzLmdyaWRGaWx0ZXJzKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiByZXN1bHRzO1xuICAgIH1cbiAgICAvKipcbiAgICAgKiBVc2UgdGFyZ2V0IGZpbHRlcnMgdG8gY3JlYXRlIGEgbmV3IGRhdGEgc2V0IGluIHRoZSBwZXJzaXN0ZW5jZSBkYXRhIHByb3ZpZGVyLlxuICAgICAqIEBwYXJhbSB7QXJyYXk8RmlsdGVyVGFyZ2V0Pn0gdGFyZ2V0cyBBcnJheSBvZiBGaWx0ZXJUYXJnZXQgb2JqZWN0cy5cbiAgICAgKi9cbiAgICBhcHBseUZpbHRlcnModGFyZ2V0cykge1xuICAgICAgICB0aGlzLmNvbnRleHQucGVyc2lzdGVuY2UuZGF0YSA9IFtdO1xuICAgICAgICB0aGlzLmNvbnRleHQucGVyc2lzdGVuY2UuZGF0YUNhY2hlLmZvckVhY2goKHJvdykgPT4ge1xuICAgICAgICAgICAgbGV0IG1hdGNoID0gdHJ1ZTtcblxuICAgICAgICAgICAgZm9yIChsZXQgaXRlbSBvZiB0YXJnZXRzKSB7XG4gICAgICAgICAgICAgICAgY29uc3Qgcm93VmFsID0gdGhpcy5jb252ZXJ0VG9UeXBlKHJvd1tpdGVtLmZpZWxkXSwgaXRlbS5maWVsZFR5cGUpO1xuICAgICAgICAgICAgICAgIGNvbnN0IHJlc3VsdCA9IGl0ZW0uZXhlY3V0ZShyb3dWYWwsIHJvdyk7XG5cbiAgICAgICAgICAgICAgICBpZiAoIXJlc3VsdCkge1xuICAgICAgICAgICAgICAgICAgICBtYXRjaCA9IGZhbHNlO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKG1hdGNoKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5jb250ZXh0LnBlcnNpc3RlbmNlLmRhdGEucHVzaChyb3cpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICB9XG4gICAgLyoqXG4gICAgICogUmVuZGVycyB0aGUgbG9jYWwgZGF0YSBzZXQgYnkgYXBwbHlpbmcgdGhlIGNvbXBpbGVkIGZpbHRlcnMgdG8gdGhlIHBlcnNpc3RlbmNlIGRhdGEgcHJvdmlkZXIuXG4gICAgICovXG4gICAgcmVuZGVyTG9jYWwgPSAoKSA9PiB7XG4gICAgICAgIGNvbnN0IHRhcmdldHMgPSB0aGlzLmNvbXBpbGVGaWx0ZXJzKCk7XG5cbiAgICAgICAgaWYgKE9iamVjdC5rZXlzKHRhcmdldHMpLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgIHRoaXMuYXBwbHlGaWx0ZXJzKHRhcmdldHMpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdGhpcy5jb250ZXh0LnBlcnNpc3RlbmNlLnJlc3RvcmVEYXRhKCk7XG4gICAgICAgIH1cbiAgICB9O1xuICAgIC8qKlxuICAgICAqIFByb3ZpZGVzIGEgbWVhbnMgdG8gYXBwbHkgYSBjb25kaXRpb24gb3V0c2lkZSB0aGUgaGVhZGVyIGZpbHRlciBjb250cm9scy4gIFdpbGwgYWRkIGNvbmRpdGlvblxuICAgICAqIHRvIGdyaWQncyBgZ3JpZEZpbHRlcnNgIGNvbGxlY3Rpb24sIGFuZCByYWlzZSBgcmVuZGVyYCBldmVudCB0byBmaWx0ZXIgZGF0YSBzZXQuXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IGZpZWxkIGZpZWxkIG5hbWUuXG4gICAgICogQHBhcmFtIHtvYmplY3R9IHZhbHVlIHZhbHVlLlxuICAgICAqIEBwYXJhbSB7c3RyaW5nIHwgRnVuY3Rpb259IHR5cGUgY29uZGl0aW9uIHR5cGUuXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IFtmaWVsZFR5cGU9XCJzdHJpbmdcIl0gZmllbGQgdHlwZS5cbiAgICAgKiBAcGFyYW0ge29iamVjdH0gW2ZpbHRlclBhcmFtcz17fV0gYWRkaXRpb25hbCBmaWx0ZXIgcGFyYW1ldGVycy5cbiAgICAgKi9cbiAgICBzZXRGaWx0ZXIoZmllbGQsIHZhbHVlLCB0eXBlID0gXCJlcXVhbHNcIiwgZmllbGRUeXBlID0gXCJzdHJpbmdcIiwgZmlsdGVyUGFyYW1zID0ge30pIHtcbiAgICAgICAgY29uc3QgY29udmVydGVkVmFsdWUgPSB0aGlzLmNvbnZlcnRUb1R5cGUodmFsdWUsIGZpZWxkVHlwZSk7XG5cbiAgICAgICAgaWYgKHRoaXMuZ3JpZEZpbHRlcnMubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgY29uc3QgaW5kZXggPSB0aGlzLmdyaWRGaWx0ZXJzLmZpbmRJbmRleCgoaSkgPT4gaS5maWVsZCA9PT0gZmllbGQpO1xuICAgICAgICAgICAgLy9JZiBmaWVsZCBhbHJlYWR5IGV4aXN0cywganVzdCB1cGRhdGUgdGhlIHZhbHVlLlxuICAgICAgICAgICAgaWYgKGluZGV4ID4gLTEpIHtcbiAgICAgICAgICAgICAgICB0aGlzLmdyaWRGaWx0ZXJzW2luZGV4XS52YWx1ZSA9IGNvbnZlcnRlZFZhbHVlO1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IGZpbHRlciA9IHRoaXMuY3JlYXRlRmlsdGVyVGFyZ2V0KGNvbnZlcnRlZFZhbHVlLCBmaWVsZCwgdHlwZSwgZmllbGRUeXBlLCAodHlwZW9mIHR5cGUgPT09IFwiZnVuY3Rpb25cIiksIGZpbHRlclBhcmFtcyk7XG4gICAgICAgIHRoaXMuZ3JpZEZpbHRlcnMucHVzaChmaWx0ZXIpO1xuICAgIH1cbiAgICAvKipcbiAgICAgKiBSZW1vdmVzIGZpbHRlciBjb25kaXRpb24gZnJvbSBncmlkJ3MgYGdyaWRGaWx0ZXJzYCBjb2xsZWN0aW9uLlxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBmaWVsZCBmaWVsZCBuYW1lLlxuICAgICAqL1xuICAgIHJlbW92ZUZpbHRlcihmaWVsZCkge1xuICAgICAgICB0aGlzLmdyaWRGaWx0ZXJzID0gdGhpcy5ncmlkRmlsdGVycy5maWx0ZXIoZiA9PiBmLmZpZWxkICE9PSBmaWVsZCk7XG4gICAgfVxufVxuXG5GaWx0ZXJNb2R1bGUubW9kdWxlTmFtZSA9IFwiZmlsdGVyXCI7XG5cbmV4cG9ydCB7IEZpbHRlck1vZHVsZSB9OyIsImNsYXNzIFBhZ2VyQnV0dG9ucyB7XG4gICAgLyoqXG4gICAgICogUmV0dXJucyBzdGFydCBidXR0b24gZm9yIHBhZ2VyIGVsZW1lbnQuXG4gICAgICogQHBhcmFtIHtudW1iZXJ9IGN1cnJlbnRQYWdlIEN1cnJlbnQgcGFnZS5cbiAgICAgKiBAcGFyYW0ge0Z1bmN0aW9ufSBjYWxsYmFjayBCdXR0b24gY2xpY2sgaGFuZGxlci5cbiAgICAgKiBAcmV0dXJucyB7SFRNTExpbmtFbGVtZW50fVxuICAgICAqL1xuICAgIHN0YXRpYyBzdGFydChjdXJyZW50UGFnZSwgY2FsbGJhY2spIHtcbiAgICAgICAgY29uc3QgbGkgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwibGlcIik7XG4gICAgICAgIGNvbnN0IGJ0biA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJidXR0b25cIik7XG5cbiAgICAgICAgbGkuYXBwZW5kKGJ0bik7XG4gICAgICAgIGJ0bi5pbm5lckhUTUwgPSBcIiZsc2FxdW87XCI7XG4gICAgICAgIGJ0bi5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgY2FsbGJhY2spO1xuXG4gICAgICAgIGlmIChjdXJyZW50UGFnZSA+IDEpIHtcbiAgICAgICAgICAgIGJ0bi5kYXRhc2V0LnBhZ2UgPSBcIjFcIjtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGJ0bi50YWJJbmRleCA9IC0xO1xuICAgICAgICAgICAgYnRuLmRpc2FibGVkID0gdHJ1ZTtcbiAgICAgICAgICAgIGxpLmNsYXNzTmFtZSA9IFwiZGlzYWJsZWRcIjtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBsaTtcbiAgICB9XG4gICAgLyoqXG4gICAgICogUmV0dXJucyBlbmQgYnV0dG9uIGZvciBwYWdlciBlbGVtZW50LlxuICAgICAqIEBwYXJhbSB7bnVtYmVyfSB0b3RhbFBhZ2VzIGxhc3QgcGFnZSBudW1iZXIgaW4gZ3JvdXAgc2V0LlxuICAgICAqIEBwYXJhbSB7bnVtYmVyfSBjdXJyZW50UGFnZSBjdXJyZW50IHBhZ2UuXG4gICAgICogQHBhcmFtIHtGdW5jdGlvbn0gY2FsbGJhY2sgYnV0dG9uIGNsaWNrIGhhbmRsZXIuXG4gICAgICogQHJldHVybnMge0hUTUxMSUVsZW1lbnR9XG4gICAgICovXG4gICAgc3RhdGljIGVuZCh0b3RhbFBhZ2VzLCBjdXJyZW50UGFnZSwgY2FsbGJhY2spIHtcbiAgICAgICAgY29uc3QgbGkgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwibGlcIik7XG4gICAgICAgIGNvbnN0IGJ0biA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJidXR0b25cIik7XG5cbiAgICAgICAgbGkuYXBwZW5kKGJ0bik7XG4gICAgICAgIGJ0bi5pbm5lckhUTUwgPSBcIiZyc2FxdW87XCI7XG4gICAgICAgIGJ0bi5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgY2FsbGJhY2spO1xuXG4gICAgICAgIGlmIChjdXJyZW50UGFnZSA8IHRvdGFsUGFnZXMpIHtcbiAgICAgICAgICAgIGJ0bi5kYXRhc2V0LnBhZ2UgPSB0b3RhbFBhZ2VzO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgYnRuLnRhYkluZGV4ID0gLTE7XG4gICAgICAgICAgICBidG4uZGlzYWJsZWQgPSB0cnVlO1xuICAgICAgICAgICAgbGkuY2xhc3NOYW1lID0gXCJkaXNhYmxlZFwiO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIGxpO1xuICAgIH1cbiAgICAvKipcbiAgICAgKiBSZXR1cm5zIHBhZ2VyIGJ1dHRvbiBmb3IgYXNzb2NpYXRlZCBwYWdlLlxuICAgICAqIEBwYXJhbSB7bnVtYmVyfSBwYWdlIHBhZ2UgbnVtYmVyLlxuICAgICAqIEBwYXJhbSB7bnVtYmVyfSBjdXJyZW50UGFnZSBjdXJyZW50IHBhZ2UuXG4gICAgICogQHBhcmFtIHtGdW5jdGlvbn0gY2FsbGJhY2sgYnV0dG9uIGNsaWNrIGhhbmRsZXIuXG4gICAgICogQHJldHVybnMge0hUTUxMSUVsZW1lbnR9XG4gICAgICovXG4gICAgc3RhdGljIHBhZ2VOdW1iZXIocGFnZSwgY3VycmVudFBhZ2UsIGNhbGxiYWNrKSB7XG4gICAgICAgIGNvbnN0IGxpID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImxpXCIpO1xuICAgICAgICBjb25zdCBidG4gPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiYnV0dG9uXCIpO1xuXG4gICAgICAgIGxpLmFwcGVuZChidG4pO1xuICAgICAgICBidG4uaW5uZXJUZXh0ID0gcGFnZTtcbiAgICAgICAgYnRuLmRhdGFzZXQucGFnZSA9IHBhZ2U7XG4gICAgICAgIGJ0bi5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgY2FsbGJhY2spO1xuXG4gICAgICAgIGlmIChwYWdlID09PSBjdXJyZW50UGFnZSkge1xuICAgICAgICAgICAgbGkuY2xhc3NOYW1lID0gXCJhY3RpdmVcIjtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBsaTtcbiAgICB9XG59XG5cbmV4cG9ydCB7IFBhZ2VyQnV0dG9ucyB9OyIsImltcG9ydCB7IFBhZ2VyQnV0dG9ucyB9IGZyb20gXCIuL3BhZ2VyQnV0dG9ucy5qc1wiO1xuLyoqXG4gKiBGb3JtYXRzIGdyaWQncyByb3dzIGFzIGEgc2VyaWVzIG9mIHBhZ2VzIHJhdGhlciB0aGF0IGEgc2Nyb2xsaW5nIGxpc3QuICBJZiBwYWdpbmcgaXMgbm90IGRlc2lyZWQsIHJlZ2lzdGVyIHRoZSBgUm93TW9kdWxlYCBpbnN0ZWFkLlxuICogXG4gKiBDbGFzcyBzdWJzY3JpYmVzIHRvIHRoZSBgcmVuZGVyYCBldmVudCB0byB1cGRhdGUgdGhlIHBhZ2VyIGNvbnRyb2wgd2hlbiB0aGUgZ3JpZCBpcyByZW5kZXJlZC4gIEl0IGFsc28gY2FsbHMgdGhlIGNoYWluIGV2ZW50IFxuICogYHJlbW90ZVBhcmFtc2AgdG8gY29tcGlsZSBhIGxpc3Qgb2YgcGFyYW1ldGVycyB0byBiZSBwYXNzZWQgdG8gdGhlIHJlbW90ZSBkYXRhIHNvdXJjZSB3aGVuIHVzaW5nIHJlbW90ZSBwcm9jZXNzaW5nLlxuICovXG5jbGFzcyBQYWdlck1vZHVsZSB7XG4gICAgLyoqXG4gICAgICogRm9ybWF0cyBncmlkJ3Mgcm93cyBhcyBhIHNlcmllcyBvZiBwYWdlcyByYXRoZXIgdGhhdCBhIHNjcm9sbGluZyBsaXN0LiAgTW9kdWxlIGNhbiBiZSB1c2VkIHdpdGggYm90aCBsb2NhbCBhbmQgcmVtb3RlIGRhdGEgc291cmNlcy4gIFxuICAgICAqIEBwYXJhbSB7R3JpZENvbnRleHR9IGNvbnRleHQgR3JpZCBjb250ZXh0LlxuICAgICAqL1xuICAgIGNvbnN0cnVjdG9yKGNvbnRleHQpIHtcbiAgICAgICAgdGhpcy5jb250ZXh0ID0gY29udGV4dDtcbiAgICAgICAgdGhpcy50b3RhbFJvd3MgPSB0aGlzLmNvbnRleHQucGVyc2lzdGVuY2Uucm93Q291bnQ7XG4gICAgICAgIHRoaXMucGFnZXNUb0Rpc3BsYXkgPSB0aGlzLmNvbnRleHQuc2V0dGluZ3MucGFnZXJQYWdlc1RvRGlzcGxheTtcbiAgICAgICAgdGhpcy5yb3dzUGVyUGFnZSA9IHRoaXMuY29udGV4dC5zZXR0aW5ncy5wYWdlclJvd3NQZXJQYWdlO1xuICAgICAgICB0aGlzLmN1cnJlbnRQYWdlID0gMTtcbiAgICAgICAgLy9jcmVhdGUgZGl2IGNvbnRhaW5lciBmb3IgcGFnZXJcbiAgICAgICAgdGhpcy5jb250YWluZXIgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiZGl2XCIpO1xuICAgICAgICB0aGlzLmVsUGFnZXIgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwidWxcIik7XG5cbiAgICAgICAgdGhpcy5jb250YWluZXIuaWQgPSBgJHt0aGlzLmNvbnRleHQuc2V0dGluZ3MuYmFzZUlkTmFtZX1fcGFnZXJgO1xuICAgICAgICB0aGlzLmNvbnRhaW5lci5jbGFzc05hbWUgPSB0aGlzLmNvbnRleHQuc2V0dGluZ3MucGFnZXJDc3M7XG4gICAgICAgIHRoaXMuY29udGFpbmVyLmFwcGVuZCh0aGlzLmVsUGFnZXIpO1xuICAgICAgICB0aGlzLmNvbnRleHQuZ3JpZC50YWJsZS5pbnNlcnRBZGphY2VudEVsZW1lbnQoXCJhZnRlcmVuZFwiLCB0aGlzLmNvbnRhaW5lcik7XG4gICAgfVxuICAgIC8qKlxuICAgICAqIFNldHMgaGFuZGxlciBldmVudHMgZm9yIHJlbmRlcmluZy91cGRhdGluZyBncmlkIGJvZHkgcm93cyBhbmQgcGFnZXIgY29udHJvbC5cbiAgICAgKi9cbiAgICBpbml0aWFsaXplKCkge1xuICAgICAgICBpZiAodGhpcy5jb250ZXh0LnNldHRpbmdzLnJlbW90ZVByb2Nlc3NpbmcpIHtcbiAgICAgICAgICAgIHRoaXMuY29udGV4dC5ldmVudHMuc3Vic2NyaWJlKFwicmVuZGVyXCIsIHRoaXMucmVuZGVyUmVtb3RlLCB0cnVlLCAxMCk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB0aGlzLmNvbnRleHQuZXZlbnRzLnN1YnNjcmliZShcInJlbmRlclwiLCB0aGlzLnJlbmRlckxvY2FsLCBmYWxzZSwgMTApO1xuICAgICAgICB9XG4gICAgfVxuICAgIC8qKlxuICAgICAqIFJldHVybnMgdGhlIHRvdGFsIG51bWJlciBvZiBwb3NzaWJsZSBwYWdlcyBiYXNlZCBvbiB0aGUgdG90YWwgcm93cywgYW5kIHJvd3MgcGVyIHBhZ2Ugc2V0dGluZy5cbiAgICAgKiBAcmV0dXJucyB7TnVtYmVyfVxuICAgICAqL1xuICAgIHRvdGFsUGFnZXMoKSB7XG4gICAgICAgIGNvbnN0IHRvdGFsUm93cyA9IGlzTmFOKHRoaXMudG90YWxSb3dzKSA/IDEgOiB0aGlzLnRvdGFsUm93cztcblxuICAgICAgICByZXR1cm4gdGhpcy5yb3dzUGVyUGFnZSA9PT0gMCA/IDEgOiBNYXRoLmNlaWwodG90YWxSb3dzIC8gdGhpcy5yb3dzUGVyUGFnZSk7XG4gICAgfVxuICAgIC8qKlxuICAgICAqIFJldHVybnMgYSB2YWxpZGF0ZWQgcGFnZSBudW1iZXIgaW5wdXQgYnkgbWFraW5nIHN1cmUgdmFsdWUgaXMgbnVtZXJpYywgYW5kIHdpdGhpbiB0aGUgYm91bmRzIG9mIHRoZSB0b3RhbCBwYWdlcy4gIFxuICAgICAqIEFuIGludmFsaWQgaW5wdXQgd2lsbCByZXR1cm4gYSB2YWx1ZSBvZiAxLlxuICAgICAqIEBwYXJhbSB7c3RyaW5nIHwgbnVtYmVyfSBjdXJyZW50UGFnZSBQYWdlIG51bWJlciB0byB2YWxpZGF0ZS5cbiAgICAgKiBAcmV0dXJucyB7TnVtYmVyfSBSZXR1cm5zIGEgdmFsaWQgcGFnZSBudW1iZXIgYmV0d2VlbiAxIGFuZCB0aGUgdG90YWwgbnVtYmVyIG9mIHBhZ2VzLiAgSWYgdGhlIGlucHV0IGlzIGludmFsaWQsIHJldHVybnMgMS5cbiAgICAgKi9cbiAgICB2YWxpZGF0ZVBhZ2UoY3VycmVudFBhZ2UpIHtcbiAgICAgICAgaWYgKCFOdW1iZXIuaXNJbnRlZ2VyKGN1cnJlbnRQYWdlKSkge1xuICAgICAgICAgICAgY3VycmVudFBhZ2UgPSBwYXJzZUludChjdXJyZW50UGFnZSk7XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCB0b3RhbCA9IHRoaXMudG90YWxQYWdlcygpO1xuICAgICAgICBjb25zdCByZXN1bHQgPSB0b3RhbCA8IGN1cnJlbnRQYWdlID8gdG90YWwgOiBjdXJyZW50UGFnZTtcblxuICAgICAgICByZXR1cm4gcmVzdWx0IDw9IDAgPyAxIDogcmVzdWx0O1xuICAgIH1cbiAgICAvKipcbiAgICAgKiBSZXR1cm5zIHRoZSBmaXJzdCBwYWdlIG51bWJlciB0byBkaXNwbGF5IGluIHRoZSBidXR0b24gY29udHJvbCBzZXQgYmFzZWQgb24gdGhlIHBhZ2UgbnVtYmVyIHBvc2l0aW9uIGluIHRoZSBkYXRhc2V0LiAgXG4gICAgICogUGFnZSBudW1iZXJzIG91dHNpZGUgb2YgdGhpcyByYW5nZSBhcmUgcmVwcmVzZW50ZWQgYnkgYW4gYXJyb3cuXG4gICAgICogQHBhcmFtIHtOdW1iZXJ9IGN1cnJlbnRQYWdlIEN1cnJlbnQgcGFnZSBudW1iZXIuXG4gICAgICogQHJldHVybnMge051bWJlcn1cbiAgICAgKi9cbiAgICBmaXJzdERpc3BsYXlQYWdlKGN1cnJlbnRQYWdlKSB7XG4gICAgICAgIGNvbnN0IG1pZGRsZSA9IE1hdGguZmxvb3IodGhpcy5wYWdlc1RvRGlzcGxheSAvIDIgKyB0aGlzLnBhZ2VzVG9EaXNwbGF5ICUgMik7XG5cbiAgICAgICAgaWYgKGN1cnJlbnRQYWdlIDwgbWlkZGxlKSByZXR1cm4gMTtcblxuICAgICAgICBpZiAodGhpcy50b3RhbFBhZ2VzKCkgPCAoY3VycmVudFBhZ2UgKyB0aGlzLnBhZ2VzVG9EaXNwbGF5IC0gbWlkZGxlKSkge1xuICAgICAgICAgICAgcmV0dXJuIE1hdGgubWF4KHRoaXMudG90YWxQYWdlcygpIC0gdGhpcy5wYWdlc1RvRGlzcGxheSArIDEsIDEpO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIGN1cnJlbnRQYWdlIC0gbWlkZGxlICsgMTtcbiAgICB9XG4gICAgLyoqXG4gICAgICogQ3JlYXRlcyB0aGUgaHRtbCBsaXN0IGl0ZW0gYW5kIGJ1dHRvbiBlbGVtZW50cyBmb3IgdGhlIHBhZ2VyIGNvbnRhaW5lcidzIHVsIGVsZW1lbnQuICBXaWxsIGFsc28gc2V0IHRoZSBcbiAgICAgKiBgdGhpcy5jdXJyZW50UGFnZWAgcHJvcGVydHkgdG8gdGhlIGN1cnJlbnQgcGFnZSBudW1iZXIuXG4gICAgICogQHBhcmFtIHtOdW1iZXJ9IGN1cnJlbnRQYWdlIEN1cnJlbnQgcGFnZSBudW1iZXIuICBBc3N1bWVzIGEgdmFsaWQgcGFnZSBudW1iZXIgaXMgcHJvdmlkZWQuXG4gICAgICogQHBhcmFtIHtGdW5jdGlvbn0gY2FsbGJhY2sgQnV0dG9uIGNsaWNrIGhhbmRsZXIuXG4gICAgICovXG4gICAgcmVuZGVyKGN1cnJlbnRQYWdlLCBjYWxsYmFjaykge1xuICAgICAgICBjb25zdCB0b3RhbFBhZ2VzID0gdGhpcy50b3RhbFBhZ2VzKCk7XG4gICAgICAgIC8vIENsZWFyIHRoZSBwcmlvciBsaSBlbGVtZW50cy5cbiAgICAgICAgdGhpcy5lbFBhZ2VyLnJlcGxhY2VDaGlsZHJlbigpO1xuXG4gICAgICAgIGlmICh0b3RhbFBhZ2VzIDw9IDEpIHJldHVybjtcbiAgICAgICAgXG4gICAgICAgIGNvbnN0IGZpcnN0RGlzcGxheSA9IHRoaXMuZmlyc3REaXNwbGF5UGFnZShjdXJyZW50UGFnZSk7XG4gICAgICAgIGNvbnN0IG1heFBhZ2VzID0gZmlyc3REaXNwbGF5ICsgdGhpcy5wYWdlc1RvRGlzcGxheTtcbiAgICAgICAgXG4gICAgICAgIHRoaXMuY3VycmVudFBhZ2UgPSBjdXJyZW50UGFnZTtcbiAgICAgICAgdGhpcy5lbFBhZ2VyLmFwcGVuZENoaWxkKFBhZ2VyQnV0dG9ucy5zdGFydChjdXJyZW50UGFnZSwgY2FsbGJhY2spKTtcblxuICAgICAgICBmb3IgKGxldCBwYWdlID0gZmlyc3REaXNwbGF5OyBwYWdlIDw9IHRvdGFsUGFnZXMgJiYgcGFnZSA8IG1heFBhZ2VzOyBwYWdlKyspIHtcbiAgICAgICAgICAgIHRoaXMuZWxQYWdlci5hcHBlbmRDaGlsZChQYWdlckJ1dHRvbnMucGFnZU51bWJlcihwYWdlLCBjdXJyZW50UGFnZSwgY2FsbGJhY2spKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMuZWxQYWdlci5hcHBlbmRDaGlsZChQYWdlckJ1dHRvbnMuZW5kKHRvdGFsUGFnZXMsIGN1cnJlbnRQYWdlLCBjYWxsYmFjaykpO1xuICAgIH1cblxuICAgIGhhbmRsZVBhZ2luZyA9IGFzeW5jIChlKSA9PiB7XG4gICAgICAgIGNvbnN0IHZhbGlkUGFnZSA9IHsgcGFnZTogdGhpcy52YWxpZGF0ZVBhZ2UoZS5jdXJyZW50VGFyZ2V0LmRhdGFzZXQucGFnZSkgfTtcblxuICAgICAgICBpZiAodGhpcy5jb250ZXh0LnNldHRpbmdzLnJlbW90ZVByb2Nlc3NpbmcpIHtcbiAgICAgICAgICAgIGF3YWl0IHRoaXMucmVuZGVyUmVtb3RlKHZhbGlkUGFnZSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB0aGlzLnJlbmRlckxvY2FsKHZhbGlkUGFnZSk7XG4gICAgICAgIH1cbiAgICB9O1xuICAgIC8qKlxuICAgICAqIEhhbmRsZXIgZm9yIHJlbmRlcmluZyByb3dzIHVzaW5nIGxvY2FsIGRhdGEgc291cmNlLiAgV2lsbCBzbGljZSB0aGUgZGF0YSBhcnJheSBiYXNlZCBvbiB0aGUgY3VycmVudCBwYWdlIGFuZCByb3dzIHBlciBwYWdlIHNldHRpbmdzLFxuICAgICAqIHRoZW4gY2FsbCBgcmVuZGVyYCB0byB1cGRhdGUgdGhlIHBhZ2VyIGNvbnRyb2wuICBPcHRpb25hbCBhcmd1bWVudCBgcGFyYW1zYCBpcyBhbiBvYmplY3QgdGhhdCBjYW4gY29udGFpbiB0aGUgZm9sbG93aW5nIHByb3BlcnRpZXM6XG4gICAgICogKiBgcGFnZWA6UGFnZSBudW1iZXIgdG8gcmVuZGVyLiAgSWYgbm90IHByb3ZpZGVkLCBkZWZhdWx0cyB0byAxLlxuICAgICAqIEBwYXJhbSB7eyBwYWdlOiBudW1iZXIgfSB8IG51bGx9IHBhcmFtcyBcbiAgICAgKi9cbiAgICByZW5kZXJMb2NhbCA9IChwYXJhbXMgPSB7fSkgPT4ge1xuICAgICAgICBjb25zdCBwYWdlID0gIXBhcmFtcy5wYWdlID8gMSA6IHRoaXMudmFsaWRhdGVQYWdlKHBhcmFtcy5wYWdlKTtcbiAgICAgICAgY29uc3QgYmVnaW4gPSAocGFnZSAtIDEpICogdGhpcy5yb3dzUGVyUGFnZTtcbiAgICAgICAgY29uc3QgZW5kID0gYmVnaW4gKyB0aGlzLnJvd3NQZXJQYWdlO1xuICAgICAgICBjb25zdCBkYXRhID0gdGhpcy5jb250ZXh0LnBlcnNpc3RlbmNlLmRhdGEuc2xpY2UoYmVnaW4sIGVuZCk7XG5cbiAgICAgICAgdGhpcy5jb250ZXh0LmdyaWQucmVuZGVyUm93cyhkYXRhLCB0aGlzLmNvbnRleHQucGVyc2lzdGVuY2Uucm93Q291bnQpO1xuICAgICAgICB0aGlzLnRvdGFsUm93cyA9IHRoaXMuY29udGV4dC5wZXJzaXN0ZW5jZS5yb3dDb3VudDtcbiAgICAgICAgdGhpcy5yZW5kZXIocGFnZSwgdGhpcy5oYW5kbGVQYWdpbmcpO1xuICAgIH07XG4gICAgLyoqXG4gICAgICogSGFuZGxlciBmb3IgcmVuZGVyaW5nIHJvd3MgdXNpbmcgcmVtb3RlIGRhdGEgc291cmNlLiAgV2lsbCBjYWxsIHRoZSBgZGF0YWxvYWRlcmAgdG8gcmVxdWVzdCBkYXRhIGJhc2VkIG9uIHRoZSBwcm92aWRlZCBwYXJhbXMsXG4gICAgICogdGhlbiBjYWxsIGByZW5kZXJgIHRvIHVwZGF0ZSB0aGUgcGFnZXIgY29udHJvbC4gIE9wdGlvbmFsIGFyZ3VtZW50IGBwYXJhbXNgIGlzIGFuIG9iamVjdCB0aGF0IGNhbiBjb250YWluIHRoZSBmb2xsb3dpbmcgcHJvcGVydGllczpcbiAgICAgKiAqIGBwYWdlYDogUGFnZSBudW1iZXIgdG8gcmVuZGVyLiAgSWYgbm90IHByb3ZpZGVkLCBkZWZhdWx0cyB0byAxLlxuICAgICAqIEBwYXJhbSB7eyBwYWdlOiBudW1iZXIgfSB8IG51bGx9IHBhcmFtcyBcbiAgICAgKi9cbiAgICByZW5kZXJSZW1vdGUgPSBhc3luYyAocGFyYW1zID0ge30pID0+IHtcbiAgICAgICAgaWYgKCFwYXJhbXMucGFnZSkgcGFyYW1zLnBhZ2UgPSAxO1xuICAgICAgICBcbiAgICAgICAgcGFyYW1zID0gdGhpcy5jb250ZXh0LmV2ZW50cy5jaGFpbihcInJlbW90ZVBhcmFtc1wiLCBwYXJhbXMpO1xuXG4gICAgICAgIGNvbnN0IGRhdGEgPSBhd2FpdCB0aGlzLmNvbnRleHQuZGF0YWxvYWRlci5yZXF1ZXN0R3JpZERhdGEocGFyYW1zKTtcbiAgICAgICAgY29uc3Qgcm93Q291bnQgPSBkYXRhLnJvd0NvdW50ID8/IDA7XG5cbiAgICAgICAgdGhpcy5jb250ZXh0LmdyaWQucmVuZGVyUm93cyhkYXRhLmRhdGEsIHJvd0NvdW50KTtcbiAgICAgICAgdGhpcy50b3RhbFJvd3MgPSByb3dDb3VudDtcbiAgICAgICAgdGhpcy5yZW5kZXIocGFyYW1zLnBhZ2UsIHRoaXMuaGFuZGxlUGFnaW5nKTtcbiAgICB9O1xufVxuXG5QYWdlck1vZHVsZS5tb2R1bGVOYW1lID0gXCJwYWdlclwiO1xuXG5leHBvcnQgeyBQYWdlck1vZHVsZSB9OyIsIi8qKlxuICogV2lsbCByZS1sb2FkIHRoZSBncmlkJ3MgZGF0YSBmcm9tIGl0cyB0YXJnZXQgc291cmNlIChsb2NhbCBvciByZW1vdGUpLlxuICovXG5jbGFzcyBSZWZyZXNoTW9kdWxlIHtcbiAgICAvKipcbiAgICAgKiBXaWxsIGFwcGx5IGV2ZW50IHRvIHRhcmdldCBidXR0b24gdGhhdCwgd2hlbiBjbGlja2VkLCB3aWxsIHJlLWxvYWQgdGhlIFxuICAgICAqIGdyaWQncyBkYXRhIGZyb20gaXRzIHRhcmdldCBzb3VyY2UgKGxvY2FsIG9yIHJlbW90ZSkuXG4gICAgICogQHBhcmFtIHtHcmlkQ29udGV4dH0gY29udGV4dCBHcmlkIGNvbnRleHQgY2xhc3MuXG4gICAgICovXG4gICAgY29uc3RydWN0b3IoY29udGV4dCkge1xuICAgICAgICB0aGlzLmNvbnRleHQgPSBjb250ZXh0O1xuICAgIH1cblxuICAgIGluaXRpYWxpemUoKSB7XG4gICAgICAgIGlmICghdGhpcy5jb250ZXh0LnNldHRpbmdzLnJlbW90ZVByb2Nlc3NpbmcgJiYgdGhpcy5jb250ZXh0LnNldHRpbmdzLnJlbW90ZVVybCkge1xuICAgICAgICAgICAgdGhpcy5jb250ZXh0LnBpcGVsaW5lLmFkZFN0ZXAoXCJyZWZyZXNoXCIsIHRoaXMuY29udGV4dC5wZXJzaXN0ZW5jZS5zZXREYXRhKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IGJ0biA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKHRoaXMuY29udGV4dC5zZXR0aW5ncy5yZWZyZXNoYWJsZUlkKTtcbiAgICAgICAgXG4gICAgICAgIGJ0bi5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgdGhpcy5oYW5kbGVSZWZyZXNoKTtcbiAgICB9XG5cbiAgICBoYW5kbGVSZWZyZXNoID0gYXN5bmMgKCkgPT4ge1xuICAgICAgICBpZiAodGhpcy5jb250ZXh0LnBpcGVsaW5lLmhhc1BpcGVsaW5lKFwicmVmcmVzaFwiKSkge1xuICAgICAgICAgICAgYXdhaXQgdGhpcy5jb250ZXh0LnBpcGVsaW5lLmV4ZWN1dGUoXCJyZWZyZXNoXCIpO1xuICAgICAgICB9XG5cbiAgICAgICAgYXdhaXQgdGhpcy5jb250ZXh0LmV2ZW50cy50cmlnZ2VyKFwicmVuZGVyXCIpO1xuICAgIH07XG59XG5cblJlZnJlc2hNb2R1bGUubW9kdWxlTmFtZSA9IFwicmVmcmVzaFwiO1xuXG5leHBvcnQgeyBSZWZyZXNoTW9kdWxlIH07IiwiLyoqXG4gKiBSZXNwb25zaWJsZSBmb3IgcmVuZGVyaW5nIHRoZSBncmlkcyByb3dzIHVzaW5nIGVpdGhlciBsb2NhbCBvciByZW1vdGUgZGF0YS4gIFRoaXMgc2hvdWxkIGJlIHRoZSBkZWZhdWx0IG1vZHVsZSB0byBcbiAqIGNyZWF0ZSByb3cgZGF0YSBpZiBwYWdpbmcgaXMgbm90IGVuYWJsZWQuICBTdWJzY3JpYmVzIHRvIHRoZSBgcmVuZGVyYCBldmVudCB0byBjcmVhdGUgdGhlIGdyaWQncyByb3dzIGFuZCB0aGUgYHJlbW90ZVBhcmFtc2AgXG4gKiBldmVudCBmb3IgcmVtb3RlIHByb2Nlc3NpbmcuXG4gKiBcbiAqIENsYXNzIHdpbGwgY2FsbCB0aGUgJ3JlbW90ZVBhcmFtcycgZXZlbnQgdG8gY29uY2F0ZW5hdGUgcGFyYW1ldGVycyBmb3IgcmVtb3RlIGRhdGEgcmVxdWVzdHMuXG4gKi9cbmNsYXNzIFJvd01vZHVsZSB7XG4gICAgLyoqXG4gICAgICogQ3JlYXRlcyBncmlkIHJvd3MuICBUaGlzIHNob3VsZCBiZSB0aGUgZGVmYXVsdCBtb2R1bGUgdG8gY3JlYXRlIHJvdyBkYXRhIGlmIHBhZ2luZyBpcyBub3QgZW5hYmxlZC5cbiAgICAgKiBAcGFyYW0ge0dyaWRDb250ZXh0fSBjb250ZXh0IEdyaWQgY29udGV4dCBjbGFzcy5cbiAgICAgKi9cbiAgICBjb25zdHJ1Y3Rvcihjb250ZXh0KSB7XG4gICAgICAgIHRoaXMuY29udGV4dCA9IGNvbnRleHQ7XG4gICAgfVxuXG4gICAgaW5pdGlhbGl6ZSgpIHtcbiAgICAgICAgaWYgKHRoaXMuY29udGV4dC5zZXR0aW5ncy5yZW1vdGVQcm9jZXNzaW5nKSB7XG4gICAgICAgICAgICB0aGlzLmNvbnRleHQuZXZlbnRzLnN1YnNjcmliZShcInJlbmRlclwiLCB0aGlzLnJlbmRlclJlbW90ZSwgdHJ1ZSwgMTApO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdGhpcy5jb250ZXh0LmV2ZW50cy5zdWJzY3JpYmUoXCJyZW5kZXJcIiwgdGhpcy5yZW5kZXJMb2NhbCwgZmFsc2UsIDEwKTtcbiAgICAgICAgfVxuICAgIH1cbiAgICAvKipcbiAgICAgKiBSZW5kZXJzIHRoZSBncmlkIHJvd3MgdXNpbmcgbG9jYWwgZGF0YS4gIFRoaXMgaXMgdGhlIGRlZmF1bHQgbWV0aG9kIHRvIHJlbmRlciByb3dzIHdoZW4gcmVtb3RlIHByb2Nlc3NpbmcgaXMgbm90IGVuYWJsZWQuXG4gICAgICovXG4gICAgcmVuZGVyTG9jYWwgPSAoKSA9PiB7XG4gICAgICAgIHRoaXMuY29udGV4dC5ncmlkLnJlbmRlclJvd3ModGhpcy5jb250ZXh0LnBlcnNpc3RlbmNlLmRhdGEpO1xuICAgIH07XG4gICAgLyoqXG4gICAgICogUmVuZGVycyB0aGUgZ3JpZCByb3dzIHVzaW5nIHJlbW90ZSBkYXRhLiAgVGhpcyBtZXRob2Qgd2lsbCBjYWxsIHRoZSBgcmVtb3RlUGFyYW1zYCBldmVudCB0byBnZXQgdGhlIHBhcmFtZXRlcnMgZm9yIHRoZSByZW1vdGUgcmVxdWVzdC5cbiAgICAgKi9cbiAgICByZW5kZXJSZW1vdGUgPSBhc3luYyAoKSA9PiB7XG4gICAgICAgIGNvbnN0IHBhcmFtcyA9IHRoaXMuY29udGV4dC5ldmVudHMuY2hhaW4oXCJyZW1vdGVQYXJhbXNcIiwge30pO1xuICAgICAgICBjb25zdCBkYXRhID0gYXdhaXQgdGhpcy5jb250ZXh0LmRhdGFsb2FkZXIucmVxdWVzdEdyaWREYXRhKHBhcmFtcyk7XG5cbiAgICAgICAgdGhpcy5jb250ZXh0LmdyaWQucmVuZGVyUm93cyhkYXRhKTtcbiAgICB9O1xufVxuXG5Sb3dNb2R1bGUubW9kdWxlTmFtZSA9IFwicm93XCI7XG5cbmV4cG9ydCB7IFJvd01vZHVsZSB9OyIsIi8qKlxuICogVXBkYXRlcyB0YXJnZXQgbGFiZWwgd2l0aCBhIGNvdW50IG9mIHJvd3MgaW4gZ3JpZC5cbiAqL1xuY2xhc3MgUm93Q291bnRNb2R1bGUge1xuICAgIC8qKlxuICAgICAqIFVwZGF0ZXMgdGFyZ2V0IGxhYmVsIHN1cHBsaWVkIGluIHNldHRpbmdzIHdpdGggYSBjb3VudCBvZiByb3dzIGluIGdyaWQuXG4gICAgICogQHBhcmFtIHtHcmlkQ29udGV4dH0gY29udGV4dCBHcmlkIGNvbnRleHQgY2xhc3MuXG4gICAgICovXG4gICAgY29uc3RydWN0b3IoY29udGV4dCkge1xuICAgICAgICB0aGlzLmNvbnRleHQgPSBjb250ZXh0O1xuICAgICAgICB0aGlzLmVsZW1lbnQgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChjb250ZXh0LnNldHRpbmdzLnJvd0NvdW50SWQpO1xuICAgIH1cblxuICAgIGluaXRpYWxpemUoKSB7XG4gICAgICAgIHRoaXMuY29udGV4dC5ldmVudHMuc3Vic2NyaWJlKFwicmVuZGVyXCIsIHRoaXMuaGFuZGxlQ291bnQsIGZhbHNlLCAyMCk7XG4gICAgfVxuXG4gICAgaGFuZGxlQ291bnQgPSAoKSA9PiB7XG4gICAgICAgIHRoaXMuZWxlbWVudC5pbm5lclRleHQgPSB0aGlzLmNvbnRleHQuZ3JpZC5yb3dDb3VudDtcbiAgICB9O1xufVxuXG5Sb3dDb3VudE1vZHVsZS5tb2R1bGVOYW1lID0gXCJyb3djb3VudFwiO1xuXG5leHBvcnQgeyBSb3dDb3VudE1vZHVsZSB9OyIsIi8qKlxuICogQ2xhc3MgdG8gbWFuYWdlIHNvcnRpbmcgZnVuY3Rpb25hbGl0eSBpbiBhIGdyaWQgY29udGV4dC4gIEZvciByZW1vdGUgcHJvY2Vzc2luZywgd2lsbCBzdWJzY3JpYmUgdG8gdGhlIGByZW1vdGVQYXJhbXNgIGV2ZW50LlxuICogRm9yIGxvY2FsIHByb2Nlc3NpbmcsIHdpbGwgc3Vic2NyaWJlIHRvIHRoZSBgcmVuZGVyYCBldmVudC5cbiAqIFxuICogQ2xhc3Mgd2lsbCB0cmlnZ2VyIHRoZSBgcmVuZGVyYCBldmVudCBhZnRlciBzb3J0aW5nIGlzIGFwcGxpZWQsIGFsbG93aW5nIHRoZSBncmlkIHRvIHJlLXJlbmRlciB3aXRoIHRoZSBzb3J0ZWQgZGF0YS5cbiAqL1xuY2xhc3MgU29ydE1vZHVsZSB7XG4gICAgLyoqXG4gICAgICogQ3JlYXRlcyBhIG5ldyBTb3J0TW9kdWxlIG9iamVjdC5cbiAgICAgKiBAcGFyYW0ge0dyaWRDb250ZXh0fSBjb250ZXh0IFxuICAgICAqL1xuICAgIGNvbnN0cnVjdG9yKGNvbnRleHQpIHtcbiAgICAgICAgdGhpcy5jb250ZXh0ID0gY29udGV4dDtcbiAgICAgICAgdGhpcy5oZWFkZXJDZWxscyA9IFtdO1xuICAgICAgICB0aGlzLmN1cnJlbnRTb3J0Q29sdW1uID0gXCJcIjtcbiAgICAgICAgdGhpcy5jdXJyZW50RGlyZWN0aW9uID0gXCJcIjtcbiAgICAgICAgdGhpcy5jdXJyZW50VHlwZSA9IFwiXCI7XG4gICAgfVxuXG4gICAgaW5pdGlhbGl6ZSgpIHtcbiAgICAgICAgaWYgKHRoaXMuY29udGV4dC5zZXR0aW5ncy5yZW1vdGVQcm9jZXNzaW5nKSB7XG4gICAgICAgICAgICB0aGlzLmN1cnJlbnRTb3J0Q29sdW1uID0gdGhpcy5jb250ZXh0LnNldHRpbmdzLnJlbW90ZVNvcnREZWZhdWx0Q29sdW1uO1xuICAgICAgICAgICAgdGhpcy5jdXJyZW50RGlyZWN0aW9uID0gdGhpcy5jb250ZXh0LnNldHRpbmdzLnJlbW90ZVNvcnREZWZhdWx0RGlyZWN0aW9uO1xuICAgICAgICAgICAgdGhpcy5jb250ZXh0LmV2ZW50cy5zdWJzY3JpYmUoXCJyZW1vdGVQYXJhbXNcIiwgdGhpcy5yZW1vdGVQYXJhbXMsIHRydWUpO1xuICAgICAgICAgICAgdGhpcy5faW5pdCh0aGlzLmhhbmRsZVJlbW90ZSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB0aGlzLmNvbnRleHQuZXZlbnRzLnN1YnNjcmliZShcInJlbmRlclwiLCB0aGlzLnJlbmRlckxvY2FsLCBmYWxzZSwgOSk7XG4gICAgICAgICAgICAvL3RoaXMuc29ydGVycyA9IHsgbnVtYmVyOiBzb3J0TnVtYmVyLCBzdHJpbmc6IHNvcnRTdHJpbmcsIGRhdGU6IHNvcnREYXRlLCBkYXRldGltZTogc29ydERhdGUgfTtcbiAgICAgICAgICAgIHRoaXMuc29ydGVycyA9IHRoaXMuI3NldExvY2FsRmlsdGVycygpO1xuICAgICAgICAgICAgdGhpcy5faW5pdCh0aGlzLmhhbmRsZUxvY2FsKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIF9pbml0KGNhbGxiYWNrKSB7XG4gICAgICAgIC8vYmluZCBsaXN0ZW5lciBmb3Igbm9uLWljb24gY29sdW1uczsgYWRkIGNzcyBzb3J0IHRhZy5cbiAgICAgICAgZm9yIChjb25zdCBjb2wgb2YgdGhpcy5jb250ZXh0LmNvbHVtbk1hbmFnZXIuY29sdW1ucykge1xuICAgICAgICAgICAgaWYgKGNvbC50eXBlICE9PSBcImljb25cIikge1xuICAgICAgICAgICAgICAgIHRoaXMuaGVhZGVyQ2VsbHMucHVzaChjb2wuaGVhZGVyQ2VsbCk7XG4gICAgICAgICAgICAgICAgY29sLmhlYWRlckNlbGwuc3Bhbi5jbGFzc0xpc3QuYWRkKFwic29ydFwiKTtcbiAgICAgICAgICAgICAgICBjb2wuaGVhZGVyQ2VsbC5zcGFuLmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCBjYWxsYmFjayk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICAjc2V0TG9jYWxGaWx0ZXJzKCkge1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgZGF0ZTogKGEsIGIsIGRpcmVjdGlvbikgPT4ge1xuICAgICAgICAgICAgICAgIGxldCBjb21wYXJpc29uID0gMDtcbiAgICAgICAgICAgICAgICBsZXQgZGF0ZUEgPSBuZXcgRGF0ZShhKTtcbiAgICAgICAgICAgICAgICBsZXQgZGF0ZUIgPSBuZXcgRGF0ZShiKTtcblxuICAgICAgICAgICAgICAgIGlmIChOdW1iZXIuaXNOYU4oZGF0ZUEudmFsdWVPZigpKSkge1xuICAgICAgICAgICAgICAgICAgICBkYXRlQSA9IG51bGw7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgaWYgKE51bWJlci5pc05hTihkYXRlQi52YWx1ZU9mKCkpKSB7XG4gICAgICAgICAgICAgICAgICAgIGRhdGVCID0gbnVsbDtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgLy9oYW5kbGUgZW1wdHkgdmFsdWVzLlxuICAgICAgICAgICAgICAgIGlmICghZGF0ZUEpIHtcbiAgICAgICAgICAgICAgICAgICAgY29tcGFyaXNvbiA9ICFkYXRlQiA/IDAgOiAtMTtcbiAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKCFkYXRlQikge1xuICAgICAgICAgICAgICAgICAgICBjb21wYXJpc29uID0gMTtcbiAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKGRhdGVBID4gZGF0ZUIpIHsgICAgXG4gICAgICAgICAgICAgICAgICAgIGNvbXBhcmlzb24gPSAxO1xuICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAoZGF0ZUEgPCBkYXRlQikge1xuICAgICAgICAgICAgICAgICAgICBjb21wYXJpc29uID0gLTE7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgcmV0dXJuIGRpcmVjdGlvbiA9PT0gXCJkZXNjXCIgPyAoY29tcGFyaXNvbiAqIC0xKSA6IGNvbXBhcmlzb247XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgbnVtYmVyOiAoYSwgYiwgZGlyZWN0aW9uKSA9PiB7XG4gICAgICAgICAgICAgICAgbGV0IGNvbXBhcmlzb24gPSAwO1xuXG4gICAgICAgICAgICAgICAgaWYgKGEgPiBiKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbXBhcmlzb24gPSAxO1xuICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAoYSA8IGIpIHtcbiAgICAgICAgICAgICAgICAgICAgY29tcGFyaXNvbiA9IC0xO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIHJldHVybiBkaXJlY3Rpb24gPT09IFwiZGVzY1wiID8gKGNvbXBhcmlzb24gKiAtMSkgOiBjb21wYXJpc29uO1xuICAgICAgICAgICAgfSwgXG4gICAgICAgICAgICBzdHJpbmc6IChhLCBiLCBkaXJlY3Rpb24pID0+IHtcbiAgICAgICAgICAgICAgICBsZXQgY29tcGFyaXNvbiA9IDA7XG4gICAgICAgICAgICAgICAgLy9oYW5kbGUgZW1wdHkgdmFsdWVzLlxuICAgICAgICAgICAgICAgIGlmICghYSkge1xuICAgICAgICAgICAgICAgICAgICBjb21wYXJpc29uID0gIWIgPyAwIDogLTE7XG4gICAgICAgICAgICAgICAgfSBlbHNlIGlmICghYikge1xuICAgICAgICAgICAgICAgICAgICBjb21wYXJpc29uID0gMTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCB2YXJBID0gYS50b1VwcGVyQ2FzZSgpO1xuICAgICAgICAgICAgICAgICAgICBjb25zdCB2YXJCID0gYi50b1VwcGVyQ2FzZSgpO1xuICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgICAgICBpZiAodmFyQSA+IHZhckIpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbXBhcmlzb24gPSAxO1xuICAgICAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKHZhckEgPCB2YXJCKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb21wYXJpc29uID0gLTE7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICByZXR1cm4gZGlyZWN0aW9uID09PSBcImRlc2NcIiA/IChjb21wYXJpc29uICogLTEpIDogY29tcGFyaXNvbjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcbiAgICB9XG5cbiAgICByZW1vdGVQYXJhbXMgPSAocGFyYW1zKSA9PiB7XG4gICAgICAgIHBhcmFtcy5zb3J0ID0gdGhpcy5jdXJyZW50U29ydENvbHVtbjtcbiAgICAgICAgcGFyYW1zLmRpcmVjdGlvbiA9IHRoaXMuY3VycmVudERpcmVjdGlvbjtcblxuICAgICAgICByZXR1cm4gcGFyYW1zO1xuICAgIH07XG5cbiAgICBoYW5kbGVSZW1vdGUgPSBhc3luYyAoYykgPT4ge1xuICAgICAgICB0aGlzLmN1cnJlbnRTb3J0Q29sdW1uID0gYy5jdXJyZW50VGFyZ2V0LmNvbnRleHQubmFtZTtcbiAgICAgICAgdGhpcy5jdXJyZW50RGlyZWN0aW9uID0gYy5jdXJyZW50VGFyZ2V0LmNvbnRleHQuZGlyZWN0aW9uTmV4dC52YWx1ZU9mKCk7XG4gICAgICAgIHRoaXMuY3VycmVudFR5cGUgPSBjLmN1cnJlbnRUYXJnZXQuY29udGV4dC50eXBlO1xuXG4gICAgICAgIGlmICghYy5jdXJyZW50VGFyZ2V0LmNvbnRleHQuaXNDdXJyZW50U29ydCkge1xuICAgICAgICAgICAgdGhpcy5yZXNldFNvcnQoKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGMuY3VycmVudFRhcmdldC5jb250ZXh0LnNldFNvcnRGbGFnKCk7XG5cbiAgICAgICAgYXdhaXQgdGhpcy5jb250ZXh0LmV2ZW50cy50cmlnZ2VyKFwicmVuZGVyXCIpO1xuICAgIH07XG5cbiAgICByZXNldFNvcnQoKSB7XG4gICAgICAgIGNvbnN0IGNlbGwgPSB0aGlzLmhlYWRlckNlbGxzLmZpbmQoZSA9PiBlLmlzQ3VycmVudFNvcnQpO1xuXG4gICAgICAgIGlmIChjZWxsICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgIGNlbGwucmVtb3ZlU29ydEZsYWcoKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHJlbmRlckxvY2FsID0gKCkgPT4ge1xuICAgICAgICBpZiAoIXRoaXMuY3VycmVudFNvcnRDb2x1bW4pIHJldHVybjtcblxuICAgICAgICB0aGlzLmNvbnRleHQucGVyc2lzdGVuY2UuZGF0YS5zb3J0KChhLCBiKSA9PiB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5zb3J0ZXJzW3RoaXMuY3VycmVudFR5cGVdKGFbdGhpcy5jdXJyZW50U29ydENvbHVtbl0sIGJbdGhpcy5jdXJyZW50U29ydENvbHVtbl0sIHRoaXMuY3VycmVudERpcmVjdGlvbik7XG4gICAgICAgIH0pO1xuICAgIH07XG5cbiAgICBoYW5kbGVMb2NhbCA9IGFzeW5jIChjKSA9PiB7XG4gICAgICAgIHRoaXMuY3VycmVudFNvcnRDb2x1bW4gPSBjLmN1cnJlbnRUYXJnZXQuY29udGV4dC5uYW1lO1xuICAgICAgICB0aGlzLmN1cnJlbnREaXJlY3Rpb24gPSBjLmN1cnJlbnRUYXJnZXQuY29udGV4dC5kaXJlY3Rpb25OZXh0LnZhbHVlT2YoKTtcbiAgICAgICAgdGhpcy5jdXJyZW50VHlwZSA9IGMuY3VycmVudFRhcmdldC5jb250ZXh0LnR5cGU7XG5cbiAgICAgICAgaWYgKCFjLmN1cnJlbnRUYXJnZXQuY29udGV4dC5pc0N1cnJlbnRTb3J0KSB7XG4gICAgICAgICAgICB0aGlzLnJlc2V0U29ydCgpO1xuICAgICAgICB9XG5cbiAgICAgICAgYy5jdXJyZW50VGFyZ2V0LmNvbnRleHQuc2V0U29ydEZsYWcoKTtcblxuICAgICAgICBhd2FpdCB0aGlzLmNvbnRleHQuZXZlbnRzLnRyaWdnZXIoXCJyZW5kZXJcIik7XG4gICAgfTtcbn1cblxuU29ydE1vZHVsZS5tb2R1bGVOYW1lID0gXCJzb3J0XCI7XG5cbmV4cG9ydCB7IFNvcnRNb2R1bGUgfTsiLCJpbXBvcnQgeyBHcmlkQ29udGV4dCB9IGZyb20gXCIuLi9jb21wb25lbnRzL2NvbnRleHQvZ3JpZENvbnRleHQuanNcIjtcbmltcG9ydCB7IE1lcmdlT3B0aW9ucyB9IGZyb20gXCIuLi9zZXR0aW5ncy9tZXJnZU9wdGlvbnMuanNcIjtcbmltcG9ydCB7IFNldHRpbmdzR3JpZCB9IGZyb20gXCIuLi9zZXR0aW5ncy9zZXR0aW5nc0dyaWQuanNcIjtcbmltcG9ydCB7IFJvd01vZHVsZSB9IGZyb20gXCIuLi9tb2R1bGVzL3Jvdy9yb3dNb2R1bGUuanNcIjtcbmltcG9ydCB7IFBhZ2VyTW9kdWxlIH0gZnJvbSBcIi4uL21vZHVsZXMvcGFnZXIvcGFnZXJNb2R1bGUuanNcIjtcbi8qKlxuICogQ3JlYXRlcyBncmlkJ3MgY29yZSBwcm9wZXJ0aWVzIGFuZCBvYmplY3RzLCBhbmQgYWxsb3dzIGZvciByZWdpc3RyYXRpb24gb2YgbW9kdWxlcyB1c2VkIHRvIGJ1aWxkIGZ1bmN0aW9uYWxpdHkuXG4gKiBVc2UgdGhpcyBjbGFzcyBhcyBhIGJhc2UgY2xhc3MgdG8gY3JlYXRlIGEgZ3JpZCB3aXRoIGN1c3RvbSBtb2R1bGFyIGZ1bmN0aW9uYWxpdHkgdXNpbmcgdGhlIGBleHRlbmRzYCBjbGFzcyByZWZlcmVuY2UuXG4gKi9cbmNsYXNzIEdyaWRDb3JlIHtcbiAgICAjbW9kdWxlVHlwZXM7XG4gICAgI21vZHVsZXNDcmVhdGVkO1xuICAgIC8qKlxuICAgICogQ3JlYXRlcyBncmlkJ3MgY29yZSBwcm9wZXJ0aWVzIGFuZCBvYmplY3RzIGFuZCBpZGVudGlmaWVzIGRpdiBlbGVtZW50IHdoaWNoIGdyaWQgd2lsbCBiZSBidWlsdC4gIEFmdGVyIGluc3RhbnRpYXRpb24sIFxuICAgICogdXNlIHRoZSBgYWRkTW9kdWxlc2AgbWV0aG9kIHRvIHJlZ2lzdGVyIGRlc2lyZWQgbW9kdWxlcyB0byBjb21wbGV0ZSB0aGUgc2V0dXAgcHJvY2Vzcy4gIE1vZHVsZSByZWdpc3RyYXRpb24gaXMga2VwdCBcbiAgICAqIHNlcGFyYXRlIGZyb20gY29uc3RydWN0b3IgdG8gYWxsb3cgY3VzdG9taXphdGlvbiBvZiBtb2R1bGVzIHVzZWQgdG8gYnVpbGQgZ3JpZC5cbiAgICAqIEBwYXJhbSB7c3RyaW5nfSBjb250YWluZXIgZGl2IGVsZW1lbnQgSUQgdG8gYnVpbGQgZ3JpZCBpbi5cbiAgICAqIEBwYXJhbSB7b2JqZWN0fSBzZXR0aW5ncyBVc2VyIHNldHRpbmdzOyBrZXkvdmFsdWUgcGFpcnMuXG4gICAgKi9cbiAgICBjb25zdHJ1Y3Rvcihjb250YWluZXIsIHNldHRpbmdzKSB7XG4gICAgICAgIGNvbnN0IHNvdXJjZSA9IE1lcmdlT3B0aW9ucy5tZXJnZShzZXR0aW5ncyk7XG5cbiAgICAgICAgdGhpcy5zZXR0aW5ncyA9IG5ldyBTZXR0aW5nc0dyaWQoc291cmNlKTtcbiAgICAgICAgdGhpcy5jb250YWluZXIgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChjb250YWluZXIpO1xuICAgICAgICB0aGlzLmVuYWJsZVBhZ2luZyA9IHRoaXMuc2V0dGluZ3MuZW5hYmxlUGFnaW5nO1xuICAgICAgICB0aGlzLmlzVmFsaWQgPSB0cnVlO1xuICAgICAgICB0aGlzLiNtb2R1bGVUeXBlcyA9IFtdO1xuICAgICAgICB0aGlzLiNtb2R1bGVzQ3JlYXRlZCA9IGZhbHNlO1xuICAgICAgICB0aGlzLm1vZHVsZXMgPSB7fTtcblxuICAgICAgICBpZiAoT2JqZWN0LnZhbHVlcyhzb3VyY2UuY29sdW1ucykubGVuZ3RoID09PSAwKSB7XG4gICAgICAgICAgICBjb25zb2xlLmxvZyhcIk1pc3NpbmcgcmVxdWlyZWQgY29sdW1ucyBkZWZpbml0aW9uLlwiKTtcbiAgICAgICAgICAgIHRoaXMuaXNWYWxpZCA9IGZhbHNlO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgY29uc3QgZGF0YSA9IHNvdXJjZS5kYXRhID8/IFtdO1xuICAgICAgICAgICAgdGhpcy4jaW5pdChzb3VyY2UuY29sdW1ucywgZGF0YSk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICAjaW5pdChjb2x1bW5zLCBkYXRhKSB7XG4gICAgICAgIHRoaXMuY29udGV4dCA9IG5ldyBHcmlkQ29udGV4dChjb2x1bW5zLCB0aGlzLnNldHRpbmdzLCBkYXRhKTtcblxuICAgICAgICB0aGlzLmNvbnRhaW5lci5hcHBlbmQodGhpcy5jb250ZXh0LmdyaWQudGFibGUpO1xuICAgIH1cbiAgICAvKipcbiAgICAgKiBSZWdpc3RlciBtb2R1bGVzIHRvIGJlIHVzZWQgaW4gdGhlIGJ1aWxkaW5nIGFuZCBvcGVyYXRpb24gb2YgdGhlIGdyaWQuICBcbiAgICAgKiBcbiAgICAgKiBOT1RFOiBUaGlzIG1ldGhvZCBzaG91bGQgYmUgY2FsbGVkIGJlZm9yZSB0aGUgYGluaXQoKWAgbWV0aG9kLlxuICAgICAqIEBwYXJhbSB7Y2xhc3N9IG1vZHVsZXMgQ2xhc3MgbW9kdWxlKHMpLlxuICAgICAqL1xuICAgIGFkZE1vZHVsZXMoLi4ubW9kdWxlcykge1xuICAgICAgICBtb2R1bGVzLmZvckVhY2goKG0pID0+IHRoaXMuI21vZHVsZVR5cGVzLnB1c2gobSkpO1xuICAgIH1cbiAgICAvKipcbiAgICAgKiBBZGRzIGEgbmV3IGNvbHVtbiB0byB0aGUgZ3JpZC4gIFRoZSBjb2x1bW4gd2lsbCBiZSBhZGRlZCB0byB0aGUgZW5kIG9mIHRoZSBjb2x1bW5zIGNvbGxlY3Rpb24gYnkgZGVmYXVsdCwgYnV0IGNhbiBcbiAgICAgKiBiZSBpbnNlcnRlZCBhdCBhIHNwZWNpZmljIGluZGV4LiAgXG4gICAgICogXG4gICAgICogTk9URTogVGhpcyBtZXRob2Qgc2hvdWxkIGJlIGNhbGxlZCBiZWZvcmUgdGhlIGBpbml0KClgIG1ldGhvZC5cbiAgICAgKiBAcGFyYW0ge09iamVjdH0gY29sdW1uIENvbHVtbiBvYmplY3QgZGVmaW5pdGlvbi5cbiAgICAgKiBAcGFyYW0ge251bWJlcn0gW2luZGV4UG9zaXRpb249bnVsbF0gSW5kZXggdG8gaW5zZXJ0IHRoZSBjb2x1bW4gYXQuIElmIG51bGwsIGFwcGVuZHMgdG8gdGhlIGVuZC5cbiAgICAgKi9cbiAgICBhZGRDb2x1bW4oY29sdW1uLCBpbmRleFBvc2l0aW9uID0gbnVsbCkge1xuICAgICAgICB0aGlzLmNvbnRleHQuY29sdW1uTWFuYWdlci5hZGRDb2x1bW4oY29sdW1uLCBpbmRleFBvc2l0aW9uKTtcbiAgICB9XG4gICAgLyoqXG4gICAgICogSXRlcmF0ZXMgdGhvdWdoIGEgbGlzdCBvZiBtb2R1bGVzIHRvIGluc3RhbnRpYXRlIGFuZCBpbml0aWFsaXplIHN0YXJ0IHVwIGFuZC9vciBidWlsZCBiZWhhdmlvci4gIFNob3VsZCBiZSBjYWxsZWQgYWZ0ZXIgXG4gICAgICogYWxsIG1vZHVsZXMgaGF2ZSBiZWVuIHJlZ2lzdGVyZWQgdXNpbmcgdGhlIGBhZGRNb2R1bGVzYCBtZXRob2QsIGFuZCBvbmx5IG5lZWRzIHRvIGJlIGNhbGxlZCBvbmNlLlxuICAgICAqL1xuICAgICNpbml0TW9kdWxlcyA9IGFzeW5jICgpID0+IHtcbiAgICAgICAgaWYgKHRoaXMuI21vZHVsZXNDcmVhdGVkKVxuICAgICAgICAgICAgcmV0dXJuO1xuXG4gICAgICAgIC8vVmVyaWZ5IGlmIGJhc2UgcmVxdWlyZWQgcm93IHJlbGF0ZWQgbW9kdWxlIGhhcyBiZWVuIGFkZGVkIHRvIHRoZSBncmlkLlxuICAgICAgICBpZiAodGhpcy5zZXR0aW5ncy5lbmFibGVQYWdpbmcgJiYgIXRoaXMuI21vZHVsZVR5cGVzLnNvbWUoKHgpID0+IHgubW9kdWxlTmFtZSA9PT0gXCJwYWdlXCIpKSB7XG4gICAgICAgICAgICB0aGlzLiNtb2R1bGVUeXBlcy5wdXNoKFBhZ2VyTW9kdWxlKTtcbiAgICAgICAgfSBlbHNlIGlmICghdGhpcy4jbW9kdWxlVHlwZXMuc29tZSgoeCkgPT4geC5tb2R1bGVOYW1lID09PSBcInJvd1wiKSkge1xuICAgICAgICAgICAgIHRoaXMuI21vZHVsZVR5cGVzLnB1c2goUm93TW9kdWxlKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMuI21vZHVsZVR5cGVzLmZvckVhY2goKG0pID0+IHtcbiAgICAgICAgICAgIHRoaXMuY29udGV4dC5tb2R1bGVzW20ubW9kdWxlTmFtZV0gPSBuZXcgbSh0aGlzLmNvbnRleHQpO1xuICAgICAgICAgICAgdGhpcy5jb250ZXh0Lm1vZHVsZXNbbS5tb2R1bGVOYW1lXS5pbml0aWFsaXplKCk7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIHRoaXMuI21vZHVsZXNDcmVhdGVkID0gdHJ1ZTtcbiAgICAgICAgYXdhaXQgdGhpcy5jb250ZXh0LmV2ZW50cy50cmlnZ2VyKFwicG9zdEluaXRNb2RcIik7XG4gICAgfTtcbiAgICAvKipcbiAgICAgKiBJbnN0YW50aWF0ZXMgdGhlIGNyZWF0aW9uIG9mIHRoZSBncmlkLiAgTWV0aG9kIHdpbGwgY3JlYXRlIHRoZSBncmlkJ3MgZWxlbWVudHMsIHJ1biBhbGwgcmVnaXN0ZXJlZCBtb2R1bGVzLCBkYXRhIHByb2Nlc3NpbmcgXG4gICAgICogcGlwZWxpbmVzIGFuZCBldmVudHMuICBJZiBncmlkIGlzIGJlaW5nIGJ1aWx0IHVzaW5nIHRoZSBtb2R1bGFyIGFwcHJvYWNoLCBiZSBzdXJlIHRvIGNhbGwgdGhlIGBhZGRNb2R1bGVzYCBtZXRob2QgYmVmb3JlIFxuICAgICAqIGNhbGxpbmcgdGhpcyBvbmUgdG8gZW5zdXJlIGFsbCBtb2R1bGVzIGFyZSByZWdpc3RlcmVkIGFuZCBpbml0aWFsaXplZCBpbiB0aGVpciBwcm9wZXIgb3JkZXIuXG4gICAgICogXG4gICAgICogTk9URTogTWV0aG9kIHdpbGwgYXV0b21hdGljYWxseSByZWdpc3RlciB0aGUgYFBhZ2VyTW9kdWxlYCBpZiBwYWdpbmcgaXMgZW5hYmxlZCwgb3IgdGhlIGBSb3dNb2R1bGVgIGlmIHBhZ2luZyBpcyBub3QgZW5hYmxlZC5cbiAgICAgKi9cbiAgICBhc3luYyBpbml0KCkge1xuICAgICAgICBpZiAoIXRoaXMuaXNWYWxpZCkge1xuICAgICAgICAgICAgY29uc29sZS5sb2coXCJNaXNzaW5nIHJlcXVpcmVkIGNvbHVtbnMgZGVmaW5pdGlvbi5cIik7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLmNvbnRleHQuZ3JpZC5pbml0aWFsaXplSGVhZGVyKCk7XG5cbiAgICAgICAgYXdhaXQgdGhpcy4jaW5pdE1vZHVsZXMoKTtcblxuICAgICAgICBpZiAoIXRoaXMuc2V0dGluZ3MucmVtb3RlUHJvY2Vzc2luZyAmJiB0aGlzLnNldHRpbmdzLnJlbW90ZVVybCkge1xuICAgICAgICAgICAgLy9sb2NhbCBkYXRhIHNvdXJjZSBwcm9jZXNzaW5nOyBzZXQgcGlwZWxpbmUgYWN0aW9ucy5cbiAgICAgICAgICAgIHRoaXMuY29udGV4dC5waXBlbGluZS5hZGRTdGVwKFwiaW5pdFwiLCB0aGlzLmNvbnRleHQucGVyc2lzdGVuY2Uuc2V0RGF0YSk7XG4gICAgICAgIH1cbiAgICAgICAgLy9leGVjdXRlIGRhdGEgcGlwZWxpbmUgYmVmb3JlIGJ1aWxkaW5nIGVsZW1lbnRzLlxuICAgICAgICBpZiAodGhpcy5jb250ZXh0LnBpcGVsaW5lLmhhc1BpcGVsaW5lKFwiaW5pdFwiKSkge1xuICAgICAgICAgICAgYXdhaXQgdGhpcy5jb250ZXh0LnBpcGVsaW5lLmV4ZWN1dGUoXCJpbml0XCIpO1xuICAgICAgICB9XG5cbiAgICAgICAgYXdhaXQgdGhpcy5jb250ZXh0LmV2ZW50cy50cmlnZ2VyKFwicmVuZGVyXCIpO1xuICAgIH1cbiAgICAvKipcbiAgICAgKiBBcHBseSBmaWx0ZXIgY29uZGl0aW9uIGZvciB0YXJnZXQgY29sdW1uLiAgTWV0aG9kIHByb3ZpZGVzIGEgbWVhbnMgdG8gYXBwbHkgY29uZGl0aW9uIG91dHNpZGUgb2YgaGVhZGVyIGZpbHRlciBjb250cm9scy5cbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gZmllbGQgVGFyZ2V0IGZpZWxkLlxuICAgICAqIEBwYXJhbSB7b2JqZWN0fSB2YWx1ZSBGaWx0ZXIgdmFsdWUuXG4gICAgICogQHBhcmFtIHtzdHJpbmcgfCBGdW5jdGlvbn0gW3R5cGU9XCJlcXVhbHNcIl0gRmlsdGVyIHR5cGUuICBJZiBhIGZ1bmN0aW9uIGlzIHByb3ZpZGVkLCBpdCB3aWxsIGJlIHVzZWQgYXMgdGhlIGZpbHRlciBjb25kaXRpb24uXG4gICAgICogT3RoZXJ3aXNlLCB1c2UgdGhlIGFzc29jaWF0ZWQgc3RyaW5nIHZhbHVlIHR5cGUgdG8gZGV0ZXJtaW5lIHRoZSBmaWx0ZXIgY29uZGl0aW9uLiAgaS5lLiBcImVxdWFsc1wiLCBcImNvbnRhaW5zXCIsIGV0Yy5cbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gW2ZpZWxkVHlwZT1cInN0cmluZ1wiXSBGaWVsZCB0eXBlLlxuICAgICAqIEBwYXJhbSB7b2JqZWN0fSBbZmlsdGVyUGFyYW1zPXt9XSBBZGRpdGlvbmFsIGZpbHRlciBwYXJhbWV0ZXJzLlxuICAgICAqL1xuICAgIHNldEZpbHRlciA9IGFzeW5jIChmaWVsZCwgdmFsdWUsIHR5cGUgPSBcImVxdWFsc1wiLCBmaWVsZFR5cGUgPSBcInN0cmluZ1wiLCBmaWx0ZXJQYXJhbXMgPSB7fSkgPT4ge1xuICAgICAgICBpZiAodGhpcy5jb250ZXh0Lm1vZHVsZXMuZmlsdGVyKSB7XG4gICAgICAgICAgICB0aGlzLmNvbnRleHQubW9kdWxlcy5maWx0ZXIuc2V0RmlsdGVyKGZpZWxkLCB2YWx1ZSwgdHlwZSwgZmllbGRUeXBlLCBmaWx0ZXJQYXJhbXMpO1xuXG4gICAgICAgICAgICBhd2FpdCB0aGlzLmNvbnRleHQuZXZlbnRzLnRyaWdnZXIoXCJyZW5kZXJcIik7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBjb25zb2xlLndhcm4oXCJGaWx0ZXIgbW9kdWxlIGlzIG5vdCBlbmFibGVkLiAgU2V0IGBEYXRhR3JpZC5kZWZhdWx0T3B0aW9ucy5lbmFibGVGaWx0ZXJgIHRvIHRydWUgaW4gb3JkZXIgdG8gZW5hYmxlIHRoaXMgZnVuY3Rpb24uXCIpO1xuICAgICAgICB9XG4gICAgfTtcbiAgICAvKipcbiAgICAgKiBSZW1vdmUgZmlsdGVyIGNvbmRpdGlvbiBmb3IgdGFyZ2V0IGZpZWxkLlxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBmaWVsZCBUYXJnZXQgZmllbGQuXG4gICAgICovXG4gICAgcmVtb3ZlRmlsdGVyID0gYXN5bmMgKGZpZWxkKSA9PiB7XG4gICAgICAgIGlmICh0aGlzLmNvbnRleHQubW9kdWxlcy5maWx0ZXIpIHtcbiAgICAgICAgICAgIHRoaXMuY29udGV4dC5tb2R1bGVzLmZpbHRlci5yZW1vdmVGaWx0ZXIoZmllbGQpO1xuXG4gICAgICAgICAgICBhd2FpdCB0aGlzLmNvbnRleHQuZXZlbnRzLnRyaWdnZXIoXCJyZW5kZXJcIik7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBjb25zb2xlLndhcm4oXCJGaWx0ZXIgbW9kdWxlIGlzIG5vdCBlbmFibGVkLiAgU2V0IGBEYXRhR3JpZC5kZWZhdWx0T3B0aW9ucy5lbmFibGVGaWx0ZXJgIHRvIHRydWUgaW4gb3JkZXIgdG8gZW5hYmxlIHRoaXMgZnVuY3Rpb24uXCIpO1xuICAgICAgICB9XG4gICAgfTtcbn1cblxuZXhwb3J0IHsgR3JpZENvcmUgfTsiLCJpbXBvcnQgeyBHcmlkQ29yZSB9IGZyb20gXCIuL2NvcmUvZ3JpZENvcmUuanNcIjtcbmltcG9ydCB7IENzdk1vZHVsZSB9IGZyb20gXCIuL21vZHVsZXMvZG93bmxvYWQvY3N2TW9kdWxlLmpzXCI7XG5pbXBvcnQgeyBGaWx0ZXJNb2R1bGUgfSBmcm9tIFwiLi9tb2R1bGVzL2ZpbHRlci9maWx0ZXJNb2R1bGUuanNcIjtcbmltcG9ydCB7IFJlZnJlc2hNb2R1bGUgfSBmcm9tIFwiLi9tb2R1bGVzL3JlZnJlc2gvcmVmcmVzaE1vZHVsZS5qc1wiO1xuaW1wb3J0IHsgUm93Q291bnRNb2R1bGUgfSBmcm9tIFwiLi9tb2R1bGVzL3Jvdy9yb3dDb3VudE1vZHVsZS5qc1wiO1xuaW1wb3J0IHsgU29ydE1vZHVsZSB9IGZyb20gXCIuL21vZHVsZXMvc29ydC9zb3J0TW9kdWxlLmpzXCI7XG5cbmNsYXNzIERhdGFHcmlkIGV4dGVuZHMgR3JpZENvcmUge1xuICAgIGNvbnN0cnVjdG9yKGNvbnRhaW5lciwgc2V0dGluZ3MpIHtcbiAgICAgICAgc3VwZXIoY29udGFpbmVyLCBzZXR0aW5ncyk7XG5cbiAgICAgICAgaWYgKERhdGFHcmlkLmRlZmF1bHRPcHRpb25zLmVuYWJsZUZpbHRlcikge1xuICAgICAgICAgICAgdGhpcy5hZGRNb2R1bGVzKEZpbHRlck1vZHVsZSk7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoRGF0YUdyaWQuZGVmYXVsdE9wdGlvbnMuZW5hYmxlU29ydCkge1xuICAgICAgICAgICAgdGhpcy5hZGRNb2R1bGVzKFNvcnRNb2R1bGUpO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHRoaXMuc2V0dGluZ3Mucm93Q291bnRJZCkge1xuICAgICAgICAgICAgdGhpcy5hZGRNb2R1bGVzKFJvd0NvdW50TW9kdWxlKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICh0aGlzLnNldHRpbmdzLnJlZnJlc2hhYmxlSWQpIHtcbiAgICAgICAgICAgIHRoaXMuYWRkTW9kdWxlcyhSZWZyZXNoTW9kdWxlKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICh0aGlzLnNldHRpbmdzLmNzdkV4cG9ydElkKSB7XG4gICAgICAgICAgICB0aGlzLmFkZE1vZHVsZXMoQ3N2TW9kdWxlKTtcbiAgICAgICAgfVxuICAgIH1cbn1cblxuRGF0YUdyaWQuZGVmYXVsdE9wdGlvbnMgPSB7XG4gICAgZW5hYmxlU29ydDogdHJ1ZSxcbiAgICBlbmFibGVGaWx0ZXI6IHRydWVcbn07XG5cbmV4cG9ydCB7IERhdGFHcmlkIH07Il0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLE1BQU0sVUFBVSxDQUFDO0FBQ2pCLElBQUksT0FBTyxTQUFTLEdBQUcsSUFBSSxNQUFNLENBQUMsYUFBYSxDQUFDO0FBQ2hEO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxJQUFJ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
