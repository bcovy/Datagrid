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

const cssHelper = {
    tooltip: "datagrids-tooltip",
    multiSelect: {
        parentClass: "datagrids-multi-select",
        header: "datagrids-multi-select-header",
        headerActive: "datagrids-multi-select-header-active",
        headerOption: "datagrids-multi-select-header-option",
        options: "datagrids-multi-select-options",
        option: "datagrids-multi-select-option",
        optionText: "datagrids-multi-select-option-text",
        optionRadio: "datagrids-multi-select-option-radio",
        selected: "datagrids-multi-select-selected"
    },
    input: "datagrids-input",
    betweenButton: "datagrids-between-button",
    betweenLabel: "datagrids-between-input-label",
};

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
        tooltipElement.classList.add(cssHelper.tooltip, layout);
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
                this.element.append(modules[column.formatterParams.name].apply(rowData, column, row));
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

        this.formatter = column.formatter;  //formatter type or function.
        this.formatterParams = column.formatterParams;
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
                ? column.headerFilterEmpty : "datagrids-no-header";
        }
        //Tooltip setting.
        if (column.tooltipField) {
            this.tooltipField = column.tooltipField;
            this.tooltipLayout = column?.tooltipLayout === "right" ? "datagrids-tooltip-right" : "datagrids-tooltip-left";
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
            this.filterElement = column.filterMultiSelect ? "multi" :"select";
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
        this.element = ElementHelper.div({ name: column.field, className: cssHelper.multiSelect.parentClass });
        this.header = ElementHelper.div({ className: cssHelper.multiSelect.header });
        this.optionsContainer = ElementHelper.div({ className: cssHelper.multiSelect.options });
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
        this.elementStart = ElementHelper.input({ className: cssHelper.input, id: `start_${this.context.settings.baseIdName}_${this.field}` });

        this.elementEnd = ElementHelper.input({ className: cssHelper.input, id: `end_${this.context.settings.baseIdName}_${this.field}` });
        this.elementEnd.style.marginBottom = "10px";

        const start = ElementHelper.span({ innerText: "Start", className: cssHelper.betweenLabel });
        const end =  ElementHelper.span({ innerText: "End", className: cssHelper.betweenLabel });
 
        const btnApply = ElementHelper.create("button", { innerText: "Apply", className: cssHelper.betweenButton });
        btnApply.style.marginRight = "10px";
        btnApply.addEventListener("click", this.handlerClick);

        const btnClear = ElementHelper.create("button", { innerText: "Clear", className: cssHelper.betweenButton });
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
            this.countLabel.className = cssHelper.multiSelect.headerOption;
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
        const status = this.header.classList.toggle(cssHelper.multiSelect.headerActive);

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
        if (!e.target.closest(".datagrids-input") && !e.target.closest(`#${this.header.id}`)) {
            this.header.classList.remove(cssHelper.multiSelect.headerActive);

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
        this.element = ElementHelper.div({ name: column.field, className: cssHelper.multiSelect.parentClass });
        this.header = ElementHelper.div({ className: cssHelper.multiSelect.header });
        this.optionsContainer = ElementHelper.div({ className: cssHelper.multiSelect.options });
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
        const status = this.header.classList.toggle(cssHelper.multiSelect.headerActive);

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
        if (!e.target.closest("." + cssHelper.multiSelect.option) && !e.target.closest(`#${this.header.id}`)) {
            this.header.classList.remove(cssHelper.multiSelect.headerActive);

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
            this.countLabel.className = cssHelper.multiSelect.headerOption;
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
        if (!o.currentTarget.classList.contains(cssHelper.multiSelect.selected)) {
            //select item.
            o.currentTarget.classList.add(cssHelper.multiSelect.selected);
            o.currentTarget.dataset.selected = "true";
            
            this.selectedValues.push(o.currentTarget.dataset.value);

            if (this.listAll) {
                const span = ElementHelper.span({ className: cssHelper.multiSelect.headerOption, innerText: o.currentTarget.dataset.value }, { value: o.currentTarget.dataset.value });
                this.header.append(span);
            }
        } else {
            //deselect item.
            o.currentTarget.classList.remove(cssHelper.multiSelect.selected);
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

    templateContainer = (data) => {
        for (const item of data) {
            const option = ElementHelper.div({ className: cssHelper.multiSelect.option }, { value: item.value, selected: "false" });
            const radio = ElementHelper.span({ className: cssHelper.multiSelect.optionRadio });
            const text = ElementHelper.span({ className: cssHelper.multiSelect.optionText, innerHTML: item.text });

            option.addEventListener("click", this.handleOption);
            option.append(radio, text);

            this.optionsContainer.append(option);
        }
    };

    refreshSelectOptions = (data) => {
        this.optionsContainer.replaceChildren();
        this.header.replaceChildren();
        this.countLabel = undefined;  //set to undefined so it can be recreated later.
        const newSelected = [];

        for (const item of data) {
            const option = ElementHelper.div({ className: cssHelper.multiSelect.option }, { value: item.value, selected: "false" });
            const radio = ElementHelper.span({ className: cssHelper.multiSelect.optionRadio });
            const text = ElementHelper.span({ className: cssHelper.multiSelect.optionText, innerHTML: item.text });

            option.addEventListener("click", this.handleOption);
            //check if item is selected.
            if (this.selectedValues.includes(item.value)) {
                //select item.
                option.classList.add(cssHelper.multiSelect.selected);
                option.dataset.selected = "true";
                newSelected.push(item.value);

                if (this.listAll) {
                    const span = ElementHelper.span({ className: cssHelper.multiSelect.headerOption, innerText: item.value }, { value: item.value });

                    this.header.append(span);
                }
            }

            option.append(radio, text);

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

export { Cell, Column, ColumnManager, CsvModule, DataGrid, DataLoader, DataPersistence, DataPipeline, DateHelper, ElementBetween, ElementHelper, ElementInput, ElementMultiSelect, ElementSelect, FilterModule, FormatDateTime, FormatLink, FormatNumeric, FormatStar, GridContext, GridCore, GridEvents, HeaderCell, MergeOptions, PagerButtons, PagerModule, RefreshModule, RowCountModule, RowModule, SettingsGrid, SortModule, Table, cssHelper, settingsDefaults as settingsDefault };
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGF0YWdyaWRfZW1zLmpzIiwic291cmNlcyI6WyIuLi9zcmMvY29tcG9uZW50cy9oZWxwZXJzL2RhdGVIZWxwZXIuanMiLCIuLi9zcmMvY29tcG9uZW50cy9jZWxsL2Zvcm1hdHRlcnMvZGF0ZXRpbWUuanMiLCIuLi9zcmMvY29tcG9uZW50cy9jZWxsL2Zvcm1hdHRlcnMvbGluay5qcyIsIi4uL3NyYy9jb21wb25lbnRzL2NlbGwvZm9ybWF0dGVycy9udW1lcmljLmpzIiwiLi4vc3JjL2NvbXBvbmVudHMvY2VsbC9mb3JtYXR0ZXJzL3N0YXIuanMiLCIuLi9zcmMvY29tcG9uZW50cy9oZWxwZXJzL2Nzc0hlbHBlci5qcyIsIi4uL3NyYy9jb21wb25lbnRzL2NlbGwvY2VsbC5qcyIsIi4uL3NyYy9jb21wb25lbnRzL2NlbGwvaGVhZGVyQ2VsbC5qcyIsIi4uL3NyYy9jb21wb25lbnRzL2NvbHVtbi9jb2x1bW4uanMiLCIuLi9zcmMvY29tcG9uZW50cy9jb2x1bW4vY29sdW1uTWFuYWdlci5qcyIsIi4uL3NyYy9zZXR0aW5ncy9zZXR0aW5nc0RlZmF1bHQuanMiLCIuLi9zcmMvc2V0dGluZ3MvbWVyZ2VPcHRpb25zLmpzIiwiLi4vc3JjL3NldHRpbmdzL3NldHRpbmdzR3JpZC5qcyIsIi4uL3NyYy9jb21wb25lbnRzL2RhdGEvZGF0YUxvYWRlci5qcyIsIi4uL3NyYy9jb21wb25lbnRzL2RhdGEvZGF0YVBlcnNpc3RlbmNlLmpzIiwiLi4vc3JjL2NvbXBvbmVudHMvZGF0YS9kYXRhUGlwZWxpbmUuanMiLCIuLi9zcmMvY29tcG9uZW50cy9oZWxwZXJzL2VsZW1lbnRIZWxwZXIuanMiLCIuLi9zcmMvY29tcG9uZW50cy9ldmVudHMvZ3JpZEV2ZW50cy5qcyIsIi4uL3NyYy9jb21wb25lbnRzL3RhYmxlL3RhYmxlLmpzIiwiLi4vc3JjL2NvbXBvbmVudHMvY29udGV4dC9ncmlkQ29udGV4dC5qcyIsIi4uL3NyYy9tb2R1bGVzL2Rvd25sb2FkL2Nzdk1vZHVsZS5qcyIsIi4uL3NyYy9tb2R1bGVzL2ZpbHRlci9lbGVtZW50cy9lbGVtZW50QmV0d2Vlbi5qcyIsIi4uL3NyYy9tb2R1bGVzL2ZpbHRlci9lbGVtZW50cy9lbGVtZW50SW5wdXQuanMiLCIuLi9zcmMvbW9kdWxlcy9maWx0ZXIvZWxlbWVudHMvZWxlbWVudFNlbGVjdC5qcyIsIi4uL3NyYy9tb2R1bGVzL2ZpbHRlci9lbGVtZW50cy9lbGVtZW50TXVsdGlTZWxlY3QuanMiLCIuLi9zcmMvbW9kdWxlcy9maWx0ZXIvdHlwZXMvZmlsdGVyVGFyZ2V0LmpzIiwiLi4vc3JjL21vZHVsZXMvZmlsdGVyL3R5cGVzL2ZpbHRlckRhdGUuanMiLCIuLi9zcmMvbW9kdWxlcy9maWx0ZXIvdHlwZXMvZmlsdGVyRnVuY3Rpb24uanMiLCIuLi9zcmMvbW9kdWxlcy9maWx0ZXIvZmlsdGVyTW9kdWxlLmpzIiwiLi4vc3JjL21vZHVsZXMvcGFnZXIvcGFnZXJCdXR0b25zLmpzIiwiLi4vc3JjL21vZHVsZXMvcGFnZXIvcGFnZXJNb2R1bGUuanMiLCIuLi9zcmMvbW9kdWxlcy9yb3cvcmVmcmVzaE1vZHVsZS5qcyIsIi4uL3NyYy9tb2R1bGVzL3Jvdy9yb3dNb2R1bGUuanMiLCIuLi9zcmMvbW9kdWxlcy9yb3cvcm93Q291bnRNb2R1bGUuanMiLCIuLi9zcmMvbW9kdWxlcy9zb3J0L3NvcnRNb2R1bGUuanMiLCIuLi9zcmMvY29yZS9ncmlkQ29yZS5qcyIsIi4uL3NyYy9kYXRhZ3JpZC5qcyJdLCJzb3VyY2VzQ29udGVudCI6WyJjbGFzcyBEYXRlSGVscGVyIHtcbiAgICBzdGF0aWMgdGltZVJlR2V4ID0gbmV3IFJlZ0V4cChcIlswLTldOlswLTldXCIpO1xuICAgIC8qKlxuICAgICAqIENvbnZlcnQgc3RyaW5nIHRvIERhdGUgb2JqZWN0IHR5cGUuICBFeHBlY3RzIHN0cmluZyBmb3JtYXQgb2YgeWVhci1tb250aC1kYXkuXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IHZhbHVlIFN0cmluZyBkYXRlIHdpdGggZm9ybWF0IG9mIHllYXItbW9udGgtZGF5LlxuICAgICAqIEByZXR1cm5zIHtEYXRlIHwgc3RyaW5nfSBEYXRlIGlmIGNvbnZlcnNpb24gaXMgc3VjY2Vzc2Z1bC4gIE90aGVyd2lzZSwgZW1wdHkgc3RyaW5nLlxuICAgICAqL1xuICAgIHN0YXRpYyBwYXJzZURhdGUodmFsdWUpIHtcbiAgICAgICAgLy9DaGVjayBpZiBzdHJpbmcgaXMgZGF0ZSBvbmx5IGJ5IGxvb2tpbmcgZm9yIG1pc3NpbmcgdGltZSBjb21wb25lbnQuICBcbiAgICAgICAgLy9JZiBtaXNzaW5nLCBhZGQgaXQgc28gZGF0ZSBpcyBpbnRlcnByZXRlZCBhcyBsb2NhbCB0aW1lLlxuICAgICAgICBpZiAoIXRoaXMudGltZVJlR2V4LnRlc3QodmFsdWUpKSB7XG4gICAgICAgICAgICB2YWx1ZSA9IGAke3ZhbHVlfVQwMDowMGA7XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCBkYXRlID0gbmV3IERhdGUodmFsdWUpO1xuICAgICAgICBcbiAgICAgICAgcmV0dXJuIChOdW1iZXIuaXNOYU4oZGF0ZS52YWx1ZU9mKCkpKSA/IFwiXCIgOiBkYXRlO1xuICAgIH1cbiAgICAvKipcbiAgICAgKiBDb252ZXJ0IHN0cmluZyB0byBEYXRlIG9iamVjdCB0eXBlLCBzZXR0aW5nIHRoZSB0aW1lIGNvbXBvbmVudCB0byBtaWRuaWdodC4gIEV4cGVjdHMgc3RyaW5nIGZvcm1hdCBvZiB5ZWFyLW1vbnRoLWRheS5cbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gdmFsdWUgU3RyaW5nIGRhdGUgd2l0aCBmb3JtYXQgb2YgeWVhci1tb250aC1kYXkuXG4gICAgICogQHJldHVybnMge0RhdGUgfCBzdHJpbmd9IERhdGUgaWYgY29udmVyc2lvbiBpcyBzdWNjZXNzZnVsLiAgT3RoZXJ3aXNlLCBlbXB0eSBzdHJpbmcuXG4gICAgICovXG4gICAgc3RhdGljIHBhcnNlRGF0ZU9ubHkodmFsdWUpIHtcbiAgICAgICAgY29uc3QgZGF0ZSA9IHRoaXMucGFyc2VEYXRlKHZhbHVlKTtcblxuICAgICAgICBpZiAoZGF0ZSA9PT0gXCJcIikgcmV0dXJuIFwiXCI7ICAvL0ludmFsaWQgZGF0ZS5cblxuICAgICAgICBkYXRlLnNldEhvdXJzKDAsIDAsIDAsIDApOyAvL1NldCB0aW1lIHRvIG1pZG5pZ2h0IHRvIHJlbW92ZSB0aW1lIGNvbXBvbmVudC5cblxuICAgICAgICByZXR1cm4gZGF0ZTtcbiAgICB9XG5cbiAgICBzdGF0aWMgaXNEYXRlKHZhbHVlKSB7IFxuICAgICAgICByZXR1cm4gT2JqZWN0LnByb3RvdHlwZS50b1N0cmluZy5jYWxsKHZhbHVlKSA9PT0gXCJbb2JqZWN0IERhdGVdXCI7XG5cbiAgICB9XG5cbn1cblxuZXhwb3J0IHsgRGF0ZUhlbHBlciB9OyIsImltcG9ydCB7IERhdGVIZWxwZXIgfSBmcm9tIFwiLi4vLi4vaGVscGVycy9kYXRlSGVscGVyLmpzXCI7XG4vKipcbiAqIFByb3ZpZGVzIG1ldGhvZHMgdG8gZm9ybWF0IGRhdGUgYW5kIHRpbWUgc3RyaW5ncy4gIEV4cGVjdHMgZGF0ZSBzdHJpbmcgaW4gZm9ybWF0IG9mIHllYXItbW9udGgtZGF5LlxuICovXG5jbGFzcyBGb3JtYXREYXRlVGltZSB7XG4gICAgc3RhdGljIG1vbnRoc0xvbmcgPSBbXCJKYW51YXJ5XCIsIFwiRmVicnVhcnlcIiwgXCJNYXJjaFwiLCBcIkFwcmlsXCIsIFwiTWF5XCIsIFwiSnVuZVwiLCBcIkp1bHlcIiwgXCJBdWd1c3RcIiwgXCJTZXB0ZW1iZXJcIiwgXCJPY3RvYmVyXCIsIFwiTm92ZW1iZXJcIiwgXCJEZWNlbWJlclwiXTtcbiAgICBzdGF0aWMgbW9udGhzU2hvcnQgPSBbXCJKYW5cIiwgXCJGZWJcIiwgXCJNYXJcIiwgXCJBcHJcIiwgXCJNYXlcIiwgXCJKdW5cIiwgXCJKdWxcIiwgXCJBdWdcIiwgXCJTZXBcIiwgXCJPY3RcIiwgXCJOb3ZcIiwgXCJEZWNcIl07XG5cbiAgICBzdGF0aWMgbGVhZGluZ1plcm8obnVtKSB7XG4gICAgICAgIHJldHVybiBudW0gPCAxMCA/IFwiMFwiICsgbnVtIDogbnVtO1xuICAgIH1cbiAgICAvKipcbiAgICAgKiBSZXR1cm5zIGEgZm9ybWF0dGVkIGRhdGUgdGltZSBzdHJpbmcuICBFeHBlY3RzIGRhdGUgc3RyaW5nIGluIGZvcm1hdCBvZiB5ZWFyLW1vbnRoLWRheS4gIElmIGBmb3JtYXR0ZXJQYXJhbXNgIGlzIGVtcHR5LCBcbiAgICAgKiBmdW5jdGlvbiB3aWxsIHJldmVydCB0byBkZWZhdWx0IHZhbHVlcy4gRXhwZWN0ZWQgcHJvcGVydHkgdmFsdWVzIGluIGBmb3JtYXR0ZXJQYXJhbXNgIG9iamVjdDpcbiAgICAgKiAtIGRhdGVGaWVsZDogZmllbGQgdG8gY29udmVydCBkYXRlIHRpbWUuXG4gICAgICogLSBmb3JtYXQ6IHN0cmluZyBmb3JtYXQgdGVtcGxhdGUuXG4gICAgICogQHBhcmFtIHtPYmplY3R9IHJvd0RhdGEgUm93IGRhdGEuXG4gICAgICogQHBhcmFtIHtDb2x1bW59IGNvbHVtbiBDb2x1bW4gY2xhc3Mgb2JqZWN0LlxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBkZWZhdWx0Rm9ybWF0IERlZmF1bHQgc3RyaW5nIGZvcm1hdDogTU0vZGQveXl5eVxuICAgICAqIEBwYXJhbSB7Ym9vbGVhbn0gW2FkZFRpbWU9ZmFsc2VdIEFwcGx5IGRhdGUgdGltZSBmb3JtYXR0aW5nP1xuICAgICAqIEByZXR1cm5zIHtzdHJpbmd9XG4gICAgICovXG4gICAgc3RhdGljIGFwcGx5KHJvd0RhdGEsIGNvbHVtbiwgZGVmYXVsdEZvcm1hdCA9IFwiTU0vZGQveXl5eVwiLCBhZGRUaW1lID0gZmFsc2UpIHtcbiAgICAgICAgbGV0IHJlc3VsdCA9IGNvbHVtbj8uZm9ybWF0dGVyUGFyYW1zPy5mb3JtYXQgPz8gZGVmYXVsdEZvcm1hdDtcbiAgICAgICAgbGV0IGZpZWxkID0gY29sdW1uPy5mb3JtYXR0ZXJQYXJhbXM/LmRhdGVGaWVsZCBcbiAgICAgICAgICAgID8gcm93RGF0YVtjb2x1bW4uZm9ybWF0dGVyUGFyYW1zLmRhdGVGaWVsZF1cbiAgICAgICAgICAgIDogcm93RGF0YVtjb2x1bW4uZmllbGRdO1xuXG4gICAgICAgIGlmIChmaWVsZCA9PT0gbnVsbCkge1xuICAgICAgICAgICAgcmV0dXJuIFwiXCI7XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCBkYXRlID0gRGF0ZUhlbHBlci5wYXJzZURhdGUoZmllbGQpO1xuXG4gICAgICAgIGlmIChkYXRlID09PSBcIlwiKSB7XG4gICAgICAgICAgICByZXR1cm4gXCJcIjtcbiAgICAgICAgfVxuXG4gICAgICAgIGxldCBmb3JtYXRzID0ge1xuICAgICAgICAgICAgZDogZGF0ZS5nZXREYXRlKCksXG4gICAgICAgICAgICBkZDogdGhpcy5sZWFkaW5nWmVybyhkYXRlLmdldERhdGUoKSksXG5cbiAgICAgICAgICAgIE06IGRhdGUuZ2V0TW9udGgoKSArIDEsXG4gICAgICAgICAgICBNTTogdGhpcy5sZWFkaW5nWmVybyhkYXRlLmdldE1vbnRoKCkgKyAxKSxcbiAgICAgICAgICAgIE1NTTogdGhpcy5tb250aHNTaG9ydFtkYXRlLmdldE1vbnRoKCldLFxuICAgICAgICAgICAgTU1NTTogdGhpcy5tb250aHNMb25nW2RhdGUuZ2V0TW9udGgoKV0sXG5cbiAgICAgICAgICAgIHl5OiBkYXRlLmdldEZ1bGxZZWFyKCkudG9TdHJpbmcoKS5zbGljZSgtMiksXG4gICAgICAgICAgICB5eXl5OiBkYXRlLmdldEZ1bGxZZWFyKClcbiAgICAgICAgfTtcblxuICAgICAgICBpZiAoYWRkVGltZSkge1xuICAgICAgICAgICAgbGV0IGhvdXJzID0gZGF0ZS5nZXRIb3VycygpO1xuICAgICAgICAgICAgbGV0IGhvdXJzMTIgPSBob3VycyAlIDEyID09PSAwID8gMTIgOiBob3VycyAlIDEyO1xuXG4gICAgICAgICAgICBmb3JtYXRzLnMgPSBkYXRlLmdldFNlY29uZHMoKTtcbiAgICAgICAgICAgIGZvcm1hdHMuc3MgPSB0aGlzLmxlYWRpbmdaZXJvKGRhdGUuZ2V0U2Vjb25kcygpKTtcbiAgICAgICAgICAgIGZvcm1hdHMubSA9IGRhdGUuZ2V0TWludXRlcygpO1xuICAgICAgICAgICAgZm9ybWF0cy5tbSA9IHRoaXMubGVhZGluZ1plcm8oZGF0ZS5nZXRNaW51dGVzKCkpO1xuICAgICAgICAgICAgZm9ybWF0cy5oID0gaG91cnMxMjtcbiAgICAgICAgICAgIGZvcm1hdHMuaGggPSAgdGhpcy5sZWFkaW5nWmVybyhob3VyczEyKTtcbiAgICAgICAgICAgIGZvcm1hdHMuSCA9IGhvdXJzO1xuICAgICAgICAgICAgZm9ybWF0cy5ISCA9IHRoaXMubGVhZGluZ1plcm8oaG91cnMpO1xuICAgICAgICAgICAgZm9ybWF0cy5ocCA9IGhvdXJzIDwgMTIgPyBcIkFNXCIgOiBcIlBNXCI7XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCB0YXJnZXRzID0gcmVzdWx0LnNwbGl0KC9cXC98LXxcXHN8Oi8pO1xuXG4gICAgICAgIGZvciAobGV0IGl0ZW0gb2YgdGFyZ2V0cykge1xuICAgICAgICAgICAgcmVzdWx0ID0gcmVzdWx0LnJlcGxhY2UoaXRlbSwgZm9ybWF0c1tpdGVtXSk7XG4gICAgICAgIH1cbiAgICBcbiAgICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICB9XG59XG5cbmV4cG9ydCB7IEZvcm1hdERhdGVUaW1lIH07IiwiLyoqXG4gKiBQcm92aWRlcyBtZXRob2QgdG8gZm9ybWF0IGEgbGluayBhcyBhbiBhbmNob3IgdGFnIGVsZW1lbnQuXG4gKi9cbmNsYXNzIEZvcm1hdExpbmsge1xuICAgIC8qKlxuICAgICAqIEZvcm1hdHRlciB0aGF0IGNyZWF0ZSBhbiBhbmNob3IgdGFnIGVsZW1lbnQuIGhyZWYgYW5kIG90aGVyIGF0dHJpYnV0ZXMgY2FuIGJlIG1vZGlmaWVkIHdpdGggcHJvcGVydGllcyBpbiB0aGUgXG4gICAgICogJ2Zvcm1hdHRlclBhcmFtcycgcGFyYW1ldGVyLiAgRXhwZWN0ZWQgcHJvcGVydHkgdmFsdWVzOiBcbiAgICAgKiAtIHVybFByZWZpeDogQmFzZSB1cmwgYWRkcmVzcy5cbiAgICAgKiAtIHJvdXRlRmllbGQ6IFJvdXRlIHZhbHVlLlxuICAgICAqIC0gcXVlcnlGaWVsZDogRmllbGQgbmFtZSBmcm9tIGRhdGFzZXQgdG8gYnVpbGQgcXVlcnkgc3Rpbmcga2V5L3ZhbHVlIGlucHV0LlxuICAgICAqIC0gZmllbGRUZXh0OiBVc2UgZmllbGQgbmFtZSB0byBzZXQgaW5uZXIgdGV4dCB0byBhc3NvY2lhdGVkIGRhdGFzZXQgdmFsdWUuXG4gICAgICogLSBpbm5lclRleHQ6IFJhdyBpbm5lciB0ZXh0IHZhbHVlIG9yIGZ1bmN0aW9uLiAgSWYgZnVuY3Rpb24gaXMgcHJvdmlkZWQsIGl0IHdpbGwgYmUgY2FsbGVkIHdpdGggcm93RGF0YSBhbmQgZm9ybWF0dGVyUGFyYW1zIGFzIHBhcmFtZXRlcnMuXG4gICAgICogLSB0YXJnZXQ6IEhvdyB0YXJnZXQgZG9jdW1lbnQgc2hvdWxkIGJlIG9wZW5lZC5cbiAgICAgKiBAcGFyYW0ge09iamVjdH0gcm93RGF0YSBSb3cgZGF0YS5cbiAgICAgKiBAcGFyYW0ge3sgdXJsUHJlZml4OiBzdHJpbmcsIHF1ZXJ5RmllbGQ6IHN0cmluZywgZmllbGRUZXh0OiBzdHJpbmcsIGlubmVyVGV4dDogc3RyaW5nIHwgRnVuY3Rpb24sIHRhcmdldDogc3RyaW5nIH19IGZvcm1hdHRlclBhcmFtcyBTZXR0aW5ncy5cbiAgICAgKiBAcmV0dXJuIHtIVE1MQW5jaG9yRWxlbWVudH0gYW5jaG9yIHRhZyBlbGVtZW50LlxuICAgICAqICovXG4gICAgc3RhdGljIGFwcGx5KHJvd0RhdGEsIGZvcm1hdHRlclBhcmFtcykge1xuICAgICAgICBjb25zdCBlbCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJhXCIpO1xuXG4gICAgICAgIGxldCB1cmwgPSBmb3JtYXR0ZXJQYXJhbXMudXJsUHJlZml4O1xuICAgICAgICAvL0FwcGx5IHJvdXRlIHZhbHVlIGJlZm9yZSBxdWVyeSBzdHJpbmcuXG4gICAgICAgIGlmIChmb3JtYXR0ZXJQYXJhbXMucm91dGVGaWVsZCkge1xuICAgICAgICAgICAgdXJsICs9IFwiL1wiICsgZW5jb2RlVVJJQ29tcG9uZW50KHJvd0RhdGFbZm9ybWF0dGVyUGFyYW1zLnJvdXRlRmllbGRdKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChmb3JtYXR0ZXJQYXJhbXMucXVlcnlGaWVsZCkge1xuICAgICAgICAgICAgY29uc3QgcXJ5VmFsdWUgPSBlbmNvZGVVUklDb21wb25lbnQocm93RGF0YVtmb3JtYXR0ZXJQYXJhbXMucXVlcnlGaWVsZF0pO1xuXG4gICAgICAgICAgICB1cmwgPSBgJHt1cmx9PyR7Zm9ybWF0dGVyUGFyYW1zLnF1ZXJ5RmllbGR9PSR7cXJ5VmFsdWV9YDtcbiAgICAgICAgfVxuXG4gICAgICAgIGVsLmhyZWYgPSB1cmw7XG5cbiAgICAgICAgaWYgKGZvcm1hdHRlclBhcmFtcy5maWVsZFRleHQpIHtcbiAgICAgICAgICAgIGVsLmlubmVySFRNTCA9IHJvd0RhdGFbZm9ybWF0dGVyUGFyYW1zLmZpZWxkVGV4dF07XG4gICAgICAgIH0gZWxzZSBpZiAoKHR5cGVvZiBmb3JtYXR0ZXJQYXJhbXMuaW5uZXJUZXh0ID09PSBcImZ1bmN0aW9uXCIpKSB7XG4gICAgICAgICAgICBlbC5pbm5lckhUTUwgPSBmb3JtYXR0ZXJQYXJhbXMuaW5uZXJUZXh0KHJvd0RhdGEsIGZvcm1hdHRlclBhcmFtcyk7XG4gICAgICAgIH0gZWxzZSBpZiAoZm9ybWF0dGVyUGFyYW1zLmlubmVyVGV4dCkge1xuICAgICAgICAgICAgZWwuaW5uZXJIVE1MID0gZm9ybWF0dGVyUGFyYW1zLmlubmVyVGV4dDtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChmb3JtYXR0ZXJQYXJhbXMudGFyZ2V0KSB7XG4gICAgICAgICAgICBlbC5zZXRBdHRyaWJ1dGUoXCJ0YXJnZXRcIiwgZm9ybWF0dGVyUGFyYW1zLnRhcmdldCk7XG4gICAgICAgICAgICBlbC5zZXRBdHRyaWJ1dGUoXCJyZWxcIiwgXCJub29wZW5lclwiKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBlbDtcbiAgICB9XG59XG5cbmV4cG9ydCB7IEZvcm1hdExpbmsgfTsiLCIvKipcbiAqIFByb3ZpZGVzIG1ldGhvZCB0byBmb3JtYXQgbnVtZXJpYyB2YWx1ZXMgaW50byBzdHJpbmdzIHdpdGggc3BlY2lmaWVkIHN0eWxlcyBvZiBkZWNpbWFsLCBjdXJyZW5jeSwgb3IgcGVyY2VudC5cbiAqL1xuY2xhc3MgRm9ybWF0TnVtZXJpYyB7XG4gICAgc3RhdGljIHZhbGlkU3R5bGVzID0gW1wiZGVjaW1hbFwiLCBcImN1cnJlbmN5XCIsIFwicGVyY2VudFwiXTtcbiAgICAvKipcbiAgICAgKiBSZXR1cm5zIGEgZm9ybWF0dGVkIG51bWVyaWMgc3RyaW5nLiAgRXhwZWN0ZWQgcHJvcGVydHkgdmFsdWVzOiBcbiAgICAgKiAtIHByZWNpc2lvbjogcm91bmRpbmcgcHJlY2lzaW9uLlxuICAgICAqIC0gc3R5bGU6IGZvcm1hdHRpbmcgc3R5bGUgdG8gdXNlLlxuICAgICAqIEBwYXJhbSB7T2JqZWN0fSByb3dEYXRhIFJvdyBkYXRhLlxuICAgICAqIEBwYXJhbSB7Q29sdW1ufSBjb2x1bW4gQ29sdW1uIGNsYXNzIG9iamVjdC5cbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gW3N0eWxlPVwiZGVjaW1hbFwiXSBGb3JtYXR0aW5nIHN0eWxlIHRvIHVzZS4gRGVmYXVsdCBpcyBcImRlY2ltYWxcIi5cbiAgICAgKiBAcGFyYW0ge251bWJlcn0gW3ByZWNpc2lvbj0yXSBSb3VuZGluZyBwcmVjaXNpb24uIERlZmF1bHQgaXMgMi5cbiAgICAgKiBAcmV0dXJucyB7c3RyaW5nfVxuICAgICAqL1xuICAgIHN0YXRpYyBhcHBseShyb3dEYXRhLCBjb2x1bW4sIHN0eWxlID0gXCJkZWNpbWFsXCIsIHByZWNpc2lvbiA9IDIpIHtcbiAgICAgICAgY29uc3QgZmxvYXRWYWwgPSByb3dEYXRhW2NvbHVtbi5maWVsZF07XG5cbiAgICAgICAgaWYgKGlzTmFOKGZsb2F0VmFsKSkgcmV0dXJuIGZsb2F0VmFsO1xuXG4gICAgICAgIGlmICghdGhpcy52YWxpZFN0eWxlcy5pbmNsdWRlcyhzdHlsZSkpIHtcbiAgICAgICAgICAgIHN0eWxlID0gXCJkZWNpbWFsXCI7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gbmV3IEludGwuTnVtYmVyRm9ybWF0KFwiZW4tVVNcIiwge1xuICAgICAgICAgICAgc3R5bGU6IHN0eWxlLFxuICAgICAgICAgICAgbWF4aW11bUZyYWN0aW9uRGlnaXRzOiBwcmVjaXNpb24sXG4gICAgICAgICAgICBjdXJyZW5jeTogXCJVU0RcIlxuICAgICAgICB9KS5mb3JtYXQoZmxvYXRWYWwpO1xuICAgIH1cbn1cblxuZXhwb3J0IHsgRm9ybWF0TnVtZXJpYyB9OyIsImNsYXNzIEZvcm1hdFN0YXIge1xuICAgIC8qKlxuICAgICAqIFJldHVybnMgYW4gZWxlbWVudCBvZiBzdGFyIHJhdGluZ3MgYmFzZWQgb24gaW50ZWdlciB2YWx1ZXMuICBFeHBlY3RlZCBwcm9wZXJ0eSB2YWx1ZXM6IFxuICAgICAqIC0gc3RhcnM6IG51bWJlciBvZiBzdGFycyB0byBkaXNwbGF5LlxuICAgICAqIEBwYXJhbSB7T2JqZWN0fSByb3dEYXRhIHJvdyBkYXRhLlxuICAgICAqIEBwYXJhbSB7Q29sdW1ufSBjb2x1bW4gY29sdW1uIGNsYXNzIG9iamVjdC5cbiAgICAgKiBAcmV0dXJucyB7SFRNTERpdkVsZW1lbnR9XG4gICAgICovXG4gICAgc3RhdGljIGFwcGx5KHJvd0RhdGEsIGNvbHVtbikge1xuICAgICAgICBsZXQgdmFsdWUgPSByb3dEYXRhW2NvbHVtbi5maWVsZF07XG4gICAgICAgIGNvbnN0IG1heFN0YXJzID0gY29sdW1uLmZvcm1hdHRlclBhcmFtcz8uc3RhcnMgPyBjb2x1bW4uZm9ybWF0dGVyUGFyYW1zLnN0YXJzIDogNTtcbiAgICAgICAgY29uc3QgY29udGFpbmVyID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImRpdlwiKTtcbiAgICAgICAgY29uc3Qgc3RhcnMgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwic3BhblwiKTtcbiAgICAgICAgY29uc3Qgc3RhciA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnROUyhcImh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnXCIsIFwic3ZnXCIpO1xuICAgICAgICBjb25zdCBzdGFyQWN0aXZlID0gJzxwb2x5Z29uIGZpbGw9XCIjRkZFQTAwXCIgc3Ryb2tlPVwiI0MxQUI2MFwiIHN0cm9rZS13aWR0aD1cIjM3LjYxNTJcIiBzdHJva2UtbGluZWNhcD1cInJvdW5kXCIgc3Ryb2tlLWxpbmVqb2luPVwicm91bmRcIiBzdHJva2UtbWl0ZXJsaW1pdD1cIjEwXCIgcG9pbnRzPVwiMjU5LjIxNiwyOS45NDIgMzMwLjI3LDE3My45MTkgNDg5LjE2LDE5Ny4wMDcgMzc0LjE4NSwzMDkuMDggNDAxLjMzLDQ2Ny4zMSAyNTkuMjE2LDM5Mi42MTIgMTE3LjEwNCw0NjcuMzEgMTQ0LjI1LDMwOS4wOCAyOS4yNzQsMTk3LjAwNyAxODguMTY1LDE3My45MTkgXCIvPic7XG4gICAgICAgIGNvbnN0IHN0YXJJbmFjdGl2ZSA9ICc8cG9seWdvbiBmaWxsPVwiI0QyRDJEMlwiIHN0cm9rZT1cIiM2ODY4NjhcIiBzdHJva2Utd2lkdGg9XCIzNy42MTUyXCIgc3Ryb2tlLWxpbmVjYXA9XCJyb3VuZFwiIHN0cm9rZS1saW5lam9pbj1cInJvdW5kXCIgc3Ryb2tlLW1pdGVybGltaXQ9XCIxMFwiIHBvaW50cz1cIjI1OS4yMTYsMjkuOTQyIDMzMC4yNywxNzMuOTE5IDQ4OS4xNiwxOTcuMDA3IDM3NC4xODUsMzA5LjA4IDQwMS4zMyw0NjcuMzEgMjU5LjIxNiwzOTIuNjEyIDExNy4xMDQsNDY3LjMxIDE0NC4yNSwzMDkuMDggMjkuMjc0LDE5Ny4wMDcgMTg4LjE2NSwxNzMuOTE5IFwiLz4nO1xuXG4gICAgICAgIC8vc3R5bGUgc3RhcnMgaG9sZGVyXG4gICAgICAgIHN0YXJzLnN0eWxlLnZlcnRpY2FsQWxpZ24gPSBcIm1pZGRsZVwiO1xuICAgICAgICAvL3N0eWxlIHN0YXJcbiAgICAgICAgc3Rhci5zZXRBdHRyaWJ1dGUoXCJ3aWR0aFwiLCBcIjE0XCIpO1xuICAgICAgICBzdGFyLnNldEF0dHJpYnV0ZShcImhlaWdodFwiLCBcIjE0XCIpO1xuICAgICAgICBzdGFyLnNldEF0dHJpYnV0ZShcInZpZXdCb3hcIiwgXCIwIDAgNTEyIDUxMlwiKTtcbiAgICAgICAgc3Rhci5zZXRBdHRyaWJ1dGUoXCJ4bWw6c3BhY2VcIiwgXCJwcmVzZXJ2ZVwiKTtcbiAgICAgICAgc3Rhci5zdHlsZS5wYWRkaW5nID0gXCIwIDFweFwiO1xuXG4gICAgICAgIHZhbHVlID0gdmFsdWUgJiYgIWlzTmFOKHZhbHVlKSA/IHBhcnNlSW50KHZhbHVlKSA6IDA7XG4gICAgICAgIHZhbHVlID0gTWF0aC5tYXgoMCwgTWF0aC5taW4odmFsdWUsIG1heFN0YXJzKSk7XG5cbiAgICAgICAgZm9yKGxldCBpID0gMTsgaSA8PSBtYXhTdGFyczsgaSsrKXtcbiAgICAgICAgICAgIGNvbnN0IG5leHRTdGFyID0gc3Rhci5jbG9uZU5vZGUodHJ1ZSk7XG5cbiAgICAgICAgICAgIG5leHRTdGFyLmlubmVySFRNTCA9IGkgPD0gdmFsdWUgPyBzdGFyQWN0aXZlIDogc3RhckluYWN0aXZlO1xuXG4gICAgICAgICAgICBzdGFycy5hcHBlbmRDaGlsZChuZXh0U3Rhcik7XG4gICAgICAgIH1cblxuICAgICAgICBjb250YWluZXIuc3R5bGUud2hpdGVTcGFjZSA9IFwibm93cmFwXCI7XG4gICAgICAgIGNvbnRhaW5lci5zdHlsZS5vdmVyZmxvdyA9IFwiaGlkZGVuXCI7XG4gICAgICAgIGNvbnRhaW5lci5zdHlsZS50ZXh0T3ZlcmZsb3cgPSBcImVsbGlwc2lzXCI7XG4gICAgICAgIGNvbnRhaW5lci5zZXRBdHRyaWJ1dGUoXCJhcmlhLWxhYmVsXCIsIHZhbHVlKTtcbiAgICAgICAgY29udGFpbmVyLmFwcGVuZChzdGFycyk7XG5cbiAgICAgICAgcmV0dXJuIGNvbnRhaW5lcjtcbiAgICB9XG59XG5cbmV4cG9ydCB7IEZvcm1hdFN0YXIgfTsiLCJleHBvcnQgY29uc3QgY3NzSGVscGVyID0ge1xuICAgIHRvb2x0aXA6IFwiZGF0YWdyaWRzLXRvb2x0aXBcIixcbiAgICBtdWx0aVNlbGVjdDoge1xuICAgICAgICBwYXJlbnRDbGFzczogXCJkYXRhZ3JpZHMtbXVsdGktc2VsZWN0XCIsXG4gICAgICAgIGhlYWRlcjogXCJkYXRhZ3JpZHMtbXVsdGktc2VsZWN0LWhlYWRlclwiLFxuICAgICAgICBoZWFkZXJBY3RpdmU6IFwiZGF0YWdyaWRzLW11bHRpLXNlbGVjdC1oZWFkZXItYWN0aXZlXCIsXG4gICAgICAgIGhlYWRlck9wdGlvbjogXCJkYXRhZ3JpZHMtbXVsdGktc2VsZWN0LWhlYWRlci1vcHRpb25cIixcbiAgICAgICAgb3B0aW9uczogXCJkYXRhZ3JpZHMtbXVsdGktc2VsZWN0LW9wdGlvbnNcIixcbiAgICAgICAgb3B0aW9uOiBcImRhdGFncmlkcy1tdWx0aS1zZWxlY3Qtb3B0aW9uXCIsXG4gICAgICAgIG9wdGlvblRleHQ6IFwiZGF0YWdyaWRzLW11bHRpLXNlbGVjdC1vcHRpb24tdGV4dFwiLFxuICAgICAgICBvcHRpb25SYWRpbzogXCJkYXRhZ3JpZHMtbXVsdGktc2VsZWN0LW9wdGlvbi1yYWRpb1wiLFxuICAgICAgICBzZWxlY3RlZDogXCJkYXRhZ3JpZHMtbXVsdGktc2VsZWN0LXNlbGVjdGVkXCJcbiAgICB9LFxuICAgIGlucHV0OiBcImRhdGFncmlkcy1pbnB1dFwiLFxuICAgIGJldHdlZW5CdXR0b246IFwiZGF0YWdyaWRzLWJldHdlZW4tYnV0dG9uXCIsXG4gICAgYmV0d2VlbkxhYmVsOiBcImRhdGFncmlkcy1iZXR3ZWVuLWlucHV0LWxhYmVsXCIsXG59OyIsImltcG9ydCB7IEZvcm1hdERhdGVUaW1lIH0gZnJvbSBcIi4vZm9ybWF0dGVycy9kYXRldGltZS5qc1wiO1xuaW1wb3J0IHsgRm9ybWF0TGluayB9IGZyb20gXCIuL2Zvcm1hdHRlcnMvbGluay5qc1wiO1xuaW1wb3J0IHsgRm9ybWF0TnVtZXJpYyB9IGZyb20gXCIuL2Zvcm1hdHRlcnMvbnVtZXJpYy5qc1wiO1xuaW1wb3J0IHsgRm9ybWF0U3RhciB9IGZyb20gXCIuL2Zvcm1hdHRlcnMvc3Rhci5qc1wiO1xuaW1wb3J0IHsgY3NzSGVscGVyIH0gZnJvbSBcIi4uL2hlbHBlcnMvY3NzSGVscGVyLmpzXCI7XG5cbmNsYXNzIENlbGwge1xuICAgIC8qKlxuICAgICAqIENyZWF0ZSBjZWxsIG9iamVjdCB0aGF0IHJlcHJlc2VudHMgdGhlIGB0ZGAgdGFibGUgYm9keSBlbGVtZW50LlxuICAgICAqIEBwYXJhbSB7QXJyYXk8b2JqZWN0Pn0gcm93RGF0YSBSb3cgZGF0YS5cbiAgICAgKiBAcGFyYW0ge0NvbHVtbn0gY29sdW1uIENvbHVtbiBvYmplY3QuXG4gICAgICogQHBhcmFtIHtPYmplY3R9IG1vZHVsZXMgR3JpZCBtb2R1bGUocykgYWRkZWQgYnkgdXNlciBmb3IgY3VzdG9tIGZvcm1hdHRpbmcuXG4gICAgICogQHBhcmFtIHtIVE1MVGFibGVSb3dFbGVtZW50fSByb3cgVGFibGUgcm93IGB0cmAgZWxlbWVudC5cbiAgICAgKi9cbiAgICBjb25zdHJ1Y3Rvcihyb3dEYXRhLCBjb2x1bW4sIG1vZHVsZXMsIHJvdykge1xuICAgICAgICB0aGlzLmVsZW1lbnQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwidGRcIik7XG5cbiAgICAgICAgaWYgKGNvbHVtbi5mb3JtYXR0ZXIpIHtcbiAgICAgICAgICAgIHRoaXMuI2luaXQocm93RGF0YSwgY29sdW1uLCBtb2R1bGVzLCByb3cpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdGhpcy5lbGVtZW50LmlubmVyVGV4dCA9IHJvd0RhdGFbY29sdW1uLmZpZWxkXTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChjb2x1bW4udG9vbHRpcEZpZWxkKSB7XG4gICAgICAgICAgICB0aGlzLiNhcHBseVRvb2x0aXAocm93RGF0YVtjb2x1bW4udG9vbHRpcEZpZWxkXSwgY29sdW1uLnRvb2x0aXBMYXlvdXQpO1xuICAgICAgICB9XG4gICAgfVxuICAgIC8qKlxuICAgICAqIEFwcGxpZXMgdG9vbHRpcCBmdW5jdGlvbmFsaXR5IHRvIHRoZSBjZWxsLiAgSWYgdGhlIGNlbGwncyBjb250ZW50IGNvbnRhaW5zIHRleHQgb25seSwgaXQgd2lsbCBjcmVhdGUgYSB0b29sdGlwIFxuICAgICAqIGBzcGFuYCBlbGVtZW50IGFuZCBhcHBseSB0aGUgY29udGVudCB0byBpdC5cbiAgICAgKiBAcGFyYW0ge3N0cmluZyB8IG51bWJlciB8IERhdGUgfCBudWxsfSBjb250ZW50IFRvb2x0aXAgY29udGVudCB0byBiZSBkaXNwbGF5ZWQuXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IGxheW91dCBDU1MgY2xhc3MgZm9yIHRvb2x0aXAgbGF5b3V0LCBlaXRoZXIgXCJkYXRhZ3JpZHMtdG9vbHRpcC1yaWdodFwiIG9yIFwiZGF0YWdyaWRzLXRvb2x0aXAtbGVmdFwiLlxuICAgICAqL1xuICAgICNhcHBseVRvb2x0aXAoY29udGVudCwgbGF5b3V0KSB7XG4gICAgICAgIGlmIChjb250ZW50ID09PSBudWxsIHx8IGNvbnRlbnQgPT09IFwiXCIpIHJldHVybjtcbiAgICAgICAgXG4gICAgICAgIGxldCB0b29sdGlwRWxlbWVudCA9IHRoaXMuZWxlbWVudC5maXJzdEVsZW1lbnRDaGlsZDtcblxuICAgICAgICBpZiAodG9vbHRpcEVsZW1lbnQgPT09IG51bGwpIHtcbiAgICAgICAgICAgIHRvb2x0aXBFbGVtZW50ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcInNwYW5cIik7XG4gICAgICAgICAgICB0b29sdGlwRWxlbWVudC5pbm5lclRleHQgPSB0aGlzLmVsZW1lbnQuaW5uZXJUZXh0O1xuICAgICAgICAgICAgdGhpcy5lbGVtZW50LnJlcGxhY2VDaGlsZHJlbih0b29sdGlwRWxlbWVudCk7XG4gICAgICAgIH1cblxuICAgICAgICB0b29sdGlwRWxlbWVudC5kYXRhc2V0LnRvb2x0aXAgPSBjb250ZW50O1xuICAgICAgICB0b29sdGlwRWxlbWVudC5jbGFzc0xpc3QuYWRkKGNzc0hlbHBlci50b29sdGlwLCBsYXlvdXQpO1xuICAgIH1cblxuICAgICNpbml0KHJvd0RhdGEsIGNvbHVtbiwgbW9kdWxlcywgcm93KSB7XG4gICAgICAgIGlmICh0eXBlb2YgY29sdW1uLmZvcm1hdHRlciA9PT0gXCJmdW5jdGlvblwiKSB7XG4gICAgICAgICAgICB0aGlzLmVsZW1lbnQuYXBwZW5kKGNvbHVtbi5mb3JtYXR0ZXIocm93RGF0YSwgY29sdW1uLmZvcm1hdHRlclBhcmFtcywgdGhpcy5lbGVtZW50LCByb3cpKTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICBcbiAgICAgICAgc3dpdGNoIChjb2x1bW4uZm9ybWF0dGVyKSB7XG4gICAgICAgICAgICBjYXNlIFwibGlua1wiOlxuICAgICAgICAgICAgICAgIHRoaXMuZWxlbWVudC5hcHBlbmQoRm9ybWF0TGluay5hcHBseShyb3dEYXRhLCBjb2x1bW4uZm9ybWF0dGVyUGFyYW1zKSk7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICBjYXNlIFwiZGF0ZVwiOlxuICAgICAgICAgICAgICAgIHRoaXMuZWxlbWVudC5pbm5lclRleHQgPSBGb3JtYXREYXRlVGltZS5hcHBseShyb3dEYXRhLCBjb2x1bW4sIGNvbHVtbi5zZXR0aW5ncy5kYXRlRm9ybWF0LCBmYWxzZSk7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICBjYXNlIFwiZGF0ZXRpbWVcIjpcbiAgICAgICAgICAgICAgICB0aGlzLmVsZW1lbnQuaW5uZXJUZXh0ID0gRm9ybWF0RGF0ZVRpbWUuYXBwbHkocm93RGF0YSwgY29sdW1uLCBjb2x1bW4uc2V0dGluZ3MuZGF0ZVRpbWVGb3JtYXQsIHRydWUpO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgY2FzZSBcIm1vbmV5XCI6XG4gICAgICAgICAgICAgICAgdGhpcy5lbGVtZW50LmlubmVyVGV4dCA9IEZvcm1hdE51bWVyaWMuYXBwbHkocm93RGF0YSwgY29sdW1uLCBcImN1cnJlbmN5XCIsIDIpO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgY2FzZSBcIm51bWVyaWNcIjpcbiAgICAgICAgICAgICAgICB0aGlzLmVsZW1lbnQuaW5uZXJUZXh0ID0gRm9ybWF0TnVtZXJpYy5hcHBseShyb3dEYXRhLCBjb2x1bW4sIGNvbHVtbi5mb3JtYXR0ZXJQYXJhbXM/LnN0eWxlID8/IFwiZGVjaW1hbFwiLCBjb2x1bW4uZm9ybWF0dGVyUGFyYW1zPy5wcmVjaXNpb24gPz8gMik7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICBjYXNlIFwic3RhclwiOlxuICAgICAgICAgICAgICAgIHRoaXMuZWxlbWVudC5hcHBlbmQoRm9ybWF0U3Rhci5hcHBseShyb3dEYXRhLCBjb2x1bW4pKTtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIGNhc2UgXCJtb2R1bGVcIjpcbiAgICAgICAgICAgICAgICB0aGlzLmVsZW1lbnQuYXBwZW5kKG1vZHVsZXNbY29sdW1uLmZvcm1hdHRlclBhcmFtcy5uYW1lXS5hcHBseShyb3dEYXRhLCBjb2x1bW4sIHJvdykpO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICAgICAgICB0aGlzLmVsZW1lbnQuaW5uZXJUZXh0ID0gcm93RGF0YVtjb2x1bW4uZmllbGRdO1xuICAgICAgICB9XG4gICAgfVxufVxuXG5leHBvcnQgeyBDZWxsIH07IiwiLyoqXG4gKiBEZWZpbmVzIGEgc2luZ2xlIGhlYWRlciBjZWxsICd0aCcgZWxlbWVudC5cbiAqL1xuY2xhc3MgSGVhZGVyQ2VsbCB7XG4gICAgLyoqXG4gICAgICogQ3JlYXRlIGhlYWRlciBvYmplY3QgdGhhdCByZXByZXNlbnRzIHRoZSBgdGhgIHRhYmxlIGhlYWRlciBlbGVtZW50LiAgQ2xhc3Mgd2lsbCBwZXJzaXN0IGNvbHVtbiBzb3J0IGFuZCBvcmRlciB1c2VyIGlucHV0LlxuICAgICAqIEBwYXJhbSB7Q29sdW1ufSBjb2x1bW4gY29sdW1uIG9iamVjdC5cbiAgICAgKi9cbiAgICBjb25zdHJ1Y3Rvcihjb2x1bW4pIHtcbiAgICAgICAgdGhpcy5jb2x1bW4gPSBjb2x1bW47XG4gICAgICAgIHRoaXMuc2V0dGluZ3MgPSBjb2x1bW4uc2V0dGluZ3M7XG4gICAgICAgIHRoaXMuZWxlbWVudCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJ0aFwiKTtcbiAgICAgICAgdGhpcy5zcGFuID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcInNwYW5cIik7XG4gICAgICAgIHRoaXMubmFtZSA9IGNvbHVtbi5maWVsZDtcbiAgICAgICAgdGhpcy5kaXJlY3Rpb24gPSBcImRlc2NcIjtcbiAgICAgICAgdGhpcy5kaXJlY3Rpb25OZXh0ID0gXCJkZXNjXCI7XG4gICAgICAgIHRoaXMudHlwZSA9IGNvbHVtbi50eXBlO1xuXG4gICAgICAgIGlmIChjb2x1bW4uaGVhZGVyQ3NzKSB7XG4gICAgICAgICAgICB0aGlzLmVsZW1lbnQuY2xhc3NMaXN0LmFkZChjb2x1bW4uaGVhZGVyQ3NzKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICh0aGlzLnNldHRpbmdzLnRhYmxlSGVhZGVyVGhDc3MpIHtcbiAgICAgICAgICAgIHRoaXMuZWxlbWVudC5jbGFzc0xpc3QuYWRkKHRoaXMuc2V0dGluZ3MudGFibGVIZWFkZXJUaENzcyk7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoY29sdW1uLmNvbHVtblNpemUpIHtcbiAgICAgICAgICAgIHRoaXMuZWxlbWVudC5jbGFzc0xpc3QuYWRkKGNvbHVtbi5jb2x1bW5TaXplKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChjb2x1bW4ud2lkdGgpIHtcbiAgICAgICAgICAgIHRoaXMuZWxlbWVudC5zdHlsZS53aWR0aCA9IGNvbHVtbi53aWR0aDtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChjb2x1bW4uaGVhZGVyRmlsdGVyRW1wdHkpIHtcbiAgICAgICAgICAgIHRoaXMuc3Bhbi5jbGFzc0xpc3QuYWRkKGNvbHVtbi5oZWFkZXJGaWx0ZXJFbXB0eSk7XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLmVsZW1lbnQuYXBwZW5kQ2hpbGQodGhpcy5zcGFuKTtcbiAgICAgICAgdGhpcy5lbGVtZW50LmNvbnRleHQgPSB0aGlzO1xuICAgICAgICB0aGlzLnNwYW4uaW5uZXJUZXh0ID0gY29sdW1uLmxhYmVsO1xuICAgICAgICB0aGlzLnNwYW4uY29udGV4dCA9IHRoaXM7XG4gICAgfVxuICAgIC8qKlxuICAgICAqIFNldCB0aGUgc29ydCBmbGFnIGZvciB0aGUgaGVhZGVyIGNlbGwuXG4gICAgICovXG4gICAgc2V0U29ydEZsYWcoKSB7XG4gICAgICAgIGlmICh0aGlzLmljb24gPT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgdGhpcy5pY29uID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImlcIik7XG4gICAgICAgICAgICB0aGlzLnNwYW4uYXBwZW5kKHRoaXMuaWNvbik7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAodGhpcy5kaXJlY3Rpb25OZXh0ID09PSBcImRlc2NcIikge1xuICAgICAgICAgICAgdGhpcy5pY29uLmNsYXNzTGlzdCA9IHRoaXMuc2V0dGluZ3MudGFibGVDc3NTb3J0RGVzYztcbiAgICAgICAgICAgIHRoaXMuZGlyZWN0aW9uID0gXCJkZXNjXCI7XG4gICAgICAgICAgICB0aGlzLmRpcmVjdGlvbk5leHQgPSBcImFzY1wiO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdGhpcy5pY29uLmNsYXNzTGlzdCA9IHRoaXMuc2V0dGluZ3MudGFibGVDc3NTb3J0QXNjO1xuICAgICAgICAgICAgdGhpcy5kaXJlY3Rpb24gPSBcImFzY1wiO1xuICAgICAgICAgICAgdGhpcy5kaXJlY3Rpb25OZXh0ID0gXCJkZXNjXCI7XG4gICAgICAgIH1cbiAgICB9XG4gICAgLyoqXG4gICAgICogUmVtb3ZlIHRoZSBzb3J0IGZsYWcgZm9yIHRoZSBoZWFkZXIgY2VsbC5cbiAgICAgKi9cbiAgICByZW1vdmVTb3J0RmxhZygpIHtcbiAgICAgICAgdGhpcy5kaXJlY3Rpb24gPSBcImRlc2NcIjtcbiAgICAgICAgdGhpcy5kaXJlY3Rpb25OZXh0ID0gXCJkZXNjXCI7XG4gICAgICAgIHRoaXMuaWNvbiA9IHRoaXMuaWNvbi5yZW1vdmUoKTtcbiAgICB9XG5cbiAgICBnZXQgaXNDdXJyZW50U29ydCgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuaWNvbiAhPT0gdW5kZWZpbmVkO1xuICAgIH1cbn1cblxuZXhwb3J0IHsgSGVhZGVyQ2VsbCB9OyIsIi8qKlxuICogRGVmaW5lcyBhIHNpbmdsZSBjb2x1bW4gZm9yIHRoZSBncmlkLiAgVHJhbnNmb3JtcyB1c2VyJ3MgY29sdW1uIGRlZmluaXRpb24gaW50byBDbGFzcyBwcm9wZXJ0aWVzLlxuICogQGNsYXNzXG4gKi9cbmNsYXNzIENvbHVtbiB7XG4gICAgLyoqXG4gICAgICogQ3JlYXRlIGNvbHVtbiBvYmplY3Qgd2hpY2ggdHJhbnNmb3JtcyB1c2VyJ3MgY29sdW1uIGRlZmluaXRpb24gaW50byBDbGFzcyBwcm9wZXJ0aWVzLlxuICAgICAqIEBwYXJhbSB7T2JqZWN0fSBjb2x1bW4gVXNlcidzIGNvbHVtbiBkZWZpbml0aW9uL3NldHRpbmdzLlxuICAgICAqIEBwYXJhbSB7U2V0dGluZ3NHcmlkfSBzZXR0aW5ncyBncmlkIHNldHRpbmdzLlxuICAgICAqIEBwYXJhbSB7bnVtYmVyfSBpbmRleCBjb2x1bW4gaW5kZXggbnVtYmVyLlxuICAgICAqL1xuICAgIGNvbnN0cnVjdG9yKGNvbHVtbiwgc2V0dGluZ3MsIGluZGV4ID0gMCkge1xuICAgICAgICB0aGlzLnNldHRpbmdzID0gc2V0dGluZ3M7XG4gICAgICAgIHRoaXMuaW5kZXggPSBpbmRleDtcblxuICAgICAgICBpZiAoY29sdW1uLmZpZWxkID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgIHRoaXMuZmllbGQgPSBgY29sdW1uJHtpbmRleH1gOyAgLy9hc3NvY2lhdGVkIGRhdGEgZmllbGQgbmFtZS5cbiAgICAgICAgICAgIHRoaXMudHlwZSA9IFwiaWNvblwiOyAgLy9pY29uIHR5cGUuXG4gICAgICAgICAgICB0aGlzLmxhYmVsID0gXCJcIjtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHRoaXMuZmllbGQgPSBjb2x1bW4uZmllbGQ7ICAvL2Fzc29jaWF0ZWQgZGF0YSBmaWVsZCBuYW1lLlxuICAgICAgICAgICAgdGhpcy50eXBlID0gY29sdW1uLnR5cGUgPyBjb2x1bW4udHlwZSA6IFwic3RyaW5nXCI7ICAvL3ZhbHVlIHR5cGUuXG4gICAgICAgICAgICB0aGlzLmxhYmVsID0gY29sdW1uLmxhYmVsIFxuICAgICAgICAgICAgICAgID8gY29sdW1uLmxhYmVsIFxuICAgICAgICAgICAgICAgIDogY29sdW1uLmZpZWxkWzBdLnRvVXBwZXJDYXNlKCkgKyBjb2x1bW4uZmllbGQuc2xpY2UoMSk7ICAvL2NvbHVtbiB0aXRsZS5cbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMuZm9ybWF0dGVyID0gY29sdW1uLmZvcm1hdHRlcjsgIC8vZm9ybWF0dGVyIHR5cGUgb3IgZnVuY3Rpb24uXG4gICAgICAgIHRoaXMuZm9ybWF0dGVyUGFyYW1zID0gY29sdW1uLmZvcm1hdHRlclBhcmFtcztcbiAgICAgICAgdGhpcy5oZWFkZXJDc3MgPSBjb2x1bW4uaGVhZGVyQ3NzO1xuICAgICAgICB0aGlzLmNvbHVtblNpemUgPSBjb2x1bW4/LmNvbHVtblNpemUgPyBgZGF0YWdyaWRzLWNvbC0ke2NvbHVtbi5jb2x1bW5TaXplfWAgOiBcIlwiO1xuICAgICAgICB0aGlzLndpZHRoID0gY29sdW1uPy53aWR0aCA/PyB1bmRlZmluZWQ7XG4gICAgICAgIHRoaXMuaGFzRmlsdGVyID0gdGhpcy50eXBlICE9PSBcImljb25cIiAmJiBjb2x1bW4uZmlsdGVyVHlwZSA/IHRydWUgOiBmYWxzZTtcbiAgICAgICAgdGhpcy5oZWFkZXJDZWxsID0gdW5kZWZpbmVkOyAgLy9IZWFkZXJDZWxsIGNsYXNzLlxuICAgICAgICB0aGlzLmhlYWRlckZpbHRlciA9IHVuZGVmaW5lZDsgIC8vSGVhZGVyRmlsdGVyIGNsYXNzLlxuXG4gICAgICAgIGlmICh0aGlzLmhhc0ZpbHRlcikge1xuICAgICAgICAgICAgdGhpcy4jaW5pdGlhbGl6ZUZpbHRlcihjb2x1bW4sIHNldHRpbmdzKTtcbiAgICAgICAgfSBlbHNlIGlmIChjb2x1bW4/LmhlYWRlckZpbHRlckVtcHR5KSB7XG4gICAgICAgICAgICB0aGlzLmhlYWRlckZpbHRlckVtcHR5ID0gKHR5cGVvZiBjb2x1bW4uaGVhZGVyRmlsdGVyRW1wdHkgPT09IFwic3RyaW5nXCIpIFxuICAgICAgICAgICAgICAgID8gY29sdW1uLmhlYWRlckZpbHRlckVtcHR5IDogXCJkYXRhZ3JpZHMtbm8taGVhZGVyXCI7XG4gICAgICAgIH1cbiAgICAgICAgLy9Ub29sdGlwIHNldHRpbmcuXG4gICAgICAgIGlmIChjb2x1bW4udG9vbHRpcEZpZWxkKSB7XG4gICAgICAgICAgICB0aGlzLnRvb2x0aXBGaWVsZCA9IGNvbHVtbi50b29sdGlwRmllbGQ7XG4gICAgICAgICAgICB0aGlzLnRvb2x0aXBMYXlvdXQgPSBjb2x1bW4/LnRvb2x0aXBMYXlvdXQgPT09IFwicmlnaHRcIiA/IFwiZGF0YWdyaWRzLXRvb2x0aXAtcmlnaHRcIiA6IFwiZGF0YWdyaWRzLXRvb2x0aXAtbGVmdFwiO1xuICAgICAgICB9XG4gICAgfVxuICAgIC8qKlxuICAgICAqIEluaXRpYWxpemVzIGZpbHRlciBwcm9wZXJ0aWVzLlxuICAgICAqIEBwYXJhbSB7T2JqZWN0fSBjb2x1bW4gXG4gICAgICogQHBhcmFtIHtTZXR0aW5nc30gc2V0dGluZ3MgXG4gICAgICovXG4gICAgI2luaXRpYWxpemVGaWx0ZXIoY29sdW1uLCBzZXR0aW5ncykge1xuICAgICAgICB0aGlzLmZpbHRlckVsZW1lbnQgPSBjb2x1bW4uZmlsdGVyVHlwZSA9PT0gXCJiZXR3ZWVuXCIgPyBcImJldHdlZW5cIiA6IFwiaW5wdXRcIjtcbiAgICAgICAgdGhpcy5maWx0ZXJUeXBlID0gY29sdW1uLmZpbHRlclR5cGU7ICAvL2ZpbHRlciB0eXBlIGRlc2NyaXB0b3IsIHN1Y2ggYXM6IGVxdWFscywgbGlrZSwgPCwgZXRjOyBjYW4gYWxzbyBiZSBhIGZ1bmN0aW9uLlxuICAgICAgICB0aGlzLmZpbHRlclBhcmFtcyA9IGNvbHVtbi5maWx0ZXJQYXJhbXM7XG4gICAgICAgIHRoaXMuZmlsdGVyQ3NzID0gY29sdW1uPy5maWx0ZXJDc3MgPz8gc2V0dGluZ3MudGFibGVGaWx0ZXJDc3M7XG4gICAgICAgIHRoaXMuZmlsdGVyUmVhbFRpbWUgPSBjb2x1bW4/LmZpbHRlclJlYWxUaW1lID8/IGZhbHNlO1xuXG4gICAgICAgIGlmIChjb2x1bW4uZmlsdGVyVmFsdWVzKSB7XG4gICAgICAgICAgICB0aGlzLmZpbHRlclZhbHVlcyA9IGNvbHVtbi5maWx0ZXJWYWx1ZXM7ICAvL3NlbGVjdCBvcHRpb24gZmlsdGVyIHZhbHVlLlxuICAgICAgICAgICAgdGhpcy5maWx0ZXJWYWx1ZXNSZW1vdGVTb3VyY2UgPSB0eXBlb2YgY29sdW1uLmZpbHRlclZhbHVlcyA9PT0gXCJzdHJpbmdcIiA/IGNvbHVtbi5maWx0ZXJWYWx1ZXMgOiB1bmRlZmluZWQ7ICAvL3NlbGVjdCBvcHRpb24gZmlsdGVyIHZhbHVlIGFqYXggc291cmNlLlxuICAgICAgICAgICAgdGhpcy5maWx0ZXJFbGVtZW50ID0gY29sdW1uLmZpbHRlck11bHRpU2VsZWN0ID8gXCJtdWx0aVwiIDpcInNlbGVjdFwiO1xuICAgICAgICAgICAgdGhpcy5maWx0ZXJNdWx0aVNlbGVjdCA9IGNvbHVtbi5maWx0ZXJNdWx0aVNlbGVjdDtcbiAgICAgICAgfVxuICAgIH1cbn1cblxuZXhwb3J0IHsgQ29sdW1uIH07IiwiaW1wb3J0IHsgSGVhZGVyQ2VsbCB9IGZyb20gXCIuLi9jZWxsL2hlYWRlckNlbGwuanNcIjtcbmltcG9ydCB7IENvbHVtbiB9IGZyb20gXCIuL2NvbHVtbi5qc1wiO1xuLyoqXG4gKiBDcmVhdGVzIGFuZCBtYW5hZ2VzIHRoZSBjb2x1bW5zIGZvciB0aGUgZ3JpZC4gIFdpbGwgY3JlYXRlIGEgYENvbHVtbmAgb2JqZWN0IGZvciBlYWNoIGNvbHVtbiBkZWZpbml0aW9uIHByb3ZpZGVkIGJ5IHRoZSB1c2VyLlxuICovXG5jbGFzcyBDb2x1bW5NYW5hZ2VyIHtcbiAgICAjY29sdW1ucztcbiAgICAjaW5kZXhDb3VudGVyID0gMDtcbiAgICAvKipcbiAgICAgKiBUcmFuc2Zvcm1zIHVzZXIncyBjb2x1bW4gZGVmaW5pdGlvbnMgaW50byBjb25jcmV0ZSBgQ29sdW1uYCBjbGFzcyBvYmplY3RzLiAgV2lsbCBhbHNvIGNyZWF0ZSBgSGVhZGVyQ2VsbGAgb2JqZWN0cyBcbiAgICAgKiBmb3IgZWFjaCBjb2x1bW4uXG4gICAgICogQHBhcmFtIHtBcnJheTxPYmplY3Q+fSBjb2x1bW5zIENvbHVtbiBkZWZpbml0aW9ucyBmcm9tIHVzZXIuXG4gICAgICogQHBhcmFtIHtTZXR0aW5nc0dyaWR9IHNldHRpbmdzIEdyaWQgc2V0dGluZ3MuXG4gICAgICovXG4gICAgY29uc3RydWN0b3IoY29sdW1ucywgc2V0dGluZ3MpIHtcbiAgICAgICAgdGhpcy4jY29sdW1ucyA9IFtdO1xuICAgICAgICB0aGlzLnNldHRpbmdzID0gc2V0dGluZ3M7XG4gICAgICAgIHRoaXMudGFibGVFdmVuQ29sdW1uV2lkdGhzID0gc2V0dGluZ3MudGFibGVFdmVuQ29sdW1uV2lkdGhzO1xuICAgICAgICB0aGlzLmhhc0hlYWRlckZpbHRlcnMgPSBmYWxzZTtcblxuICAgICAgICBmb3IgKGNvbnN0IGMgb2YgY29sdW1ucykge1xuICAgICAgICAgICAgY29uc3QgY29sID0gbmV3IENvbHVtbihjLCBzZXR0aW5ncywgdGhpcy4jaW5kZXhDb3VudGVyKTtcbiAgICAgICAgICBcbiAgICAgICAgICAgIGNvbC5oZWFkZXJDZWxsID0gbmV3IEhlYWRlckNlbGwoY29sKTtcblxuICAgICAgICAgICAgdGhpcy4jY29sdW1ucy5wdXNoKGNvbCk7XG4gICAgICAgICAgICB0aGlzLiNpbmRleENvdW50ZXIrKztcbiAgICAgICAgfVxuICAgICAgICAvLyBDaGVjayBpZiBhbnkgY29sdW1uIGhhcyBhIGZpbHRlciBkZWZpbmVkXG4gICAgICAgIGlmICh0aGlzLiNjb2x1bW5zLnNvbWUoKGMpID0+IGMuaGFzRmlsdGVyKSkge1xuICAgICAgICAgICAgdGhpcy5oYXNIZWFkZXJGaWx0ZXJzID0gdHJ1ZTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChzZXR0aW5ncy50YWJsZUV2ZW5Db2x1bW5XaWR0aHMpIHtcbiAgICAgICAgICAgIHRoaXMuI3NldEV2ZW5Db2x1bW5XaWR0aHMoKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgICNzZXRFdmVuQ29sdW1uV2lkdGhzKCkgeyBcbiAgICAgICAgY29uc3QgY291bnQgPSAodGhpcy4jaW5kZXhDb3VudGVyICsgMSk7XG4gICAgICAgIGNvbnN0IHdpZHRoID0gMTAwIC8gY291bnQ7XG5cbiAgICAgICAgdGhpcy4jY29sdW1ucy5mb3JFYWNoKChoKSA9PiBoLmhlYWRlckNlbGwuZWxlbWVudC5zdHlsZS53aWR0aCA9IGAke3dpZHRofSVgKTtcbiAgICB9XG4gICAgLyoqXG4gICAgICogR2V0IGFycmF5IG9mIGBDb2x1bW5gIG9iamVjdHMuXG4gICAgICogQHJldHVybnMge0FycmF5PENvbHVtbj59IGFycmF5IG9mIGBDb2x1bW5gIG9iamVjdHMuXG4gICAgICovXG4gICAgZ2V0IGNvbHVtbnMoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLiNjb2x1bW5zO1xuICAgIH1cbiAgICAvKipcbiAgICAgKiBBZGRzIGEgbmV3IGNvbHVtbiB0byB0aGUgY29sdW1ucyBjb2xsZWN0aW9uLlxuICAgICAqIEBwYXJhbSB7T2JqZWN0fSBjb2x1bW4gQ29sdW1uIGRlZmluaXRpb24gb2JqZWN0LlxuICAgICAqIEBwYXJhbSB7bnVtYmVyfSBbaW5kZXg9bnVsbF0gSW5kZXggdG8gaW5zZXJ0IHRoZSBjb2x1bW4gYXQuIElmIG51bGwsIGFwcGVuZHMgdG8gdGhlIGVuZC5cbiAgICAgKi9cbiAgICBhZGRDb2x1bW4oY29sdW1uLCBpbmRleCA9IG51bGwpIHsgXG4gICAgICAgIGNvbnN0IGNvbCA9IG5ldyBDb2x1bW4oY29sdW1uLCB0aGlzLnNldHRpbmdzLCB0aGlzLiNpbmRleENvdW50ZXIpO1xuICAgICAgICBjb2wuaGVhZGVyQ2VsbCA9IG5ldyBIZWFkZXJDZWxsKGNvbCk7XG5cbiAgICAgICAgaWYgKGluZGV4ICE9PSBudWxsICYmIGluZGV4ID49IDAgJiYgaW5kZXggPCB0aGlzLiNjb2x1bW5zLmxlbmd0aCkge1xuICAgICAgICAgICAgdGhpcy4jY29sdW1ucy5zcGxpY2UoaW5kZXgsIDAsIGNvbCk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB0aGlzLiNjb2x1bW5zLnB1c2goY29sKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMuI2luZGV4Q291bnRlcisrO1xuXG4gICAgICAgIGlmICh0aGlzLnRhYmxlRXZlbkNvbHVtbldpZHRocykge1xuICAgICAgICAgICAgdGhpcy4jc2V0RXZlbkNvbHVtbldpZHRocygpO1xuICAgICAgICB9XG4gICAgfVxufVxuXG5leHBvcnQgeyBDb2x1bW5NYW5hZ2VyIH07IiwiZXhwb3J0IGRlZmF1bHQge1xuICAgIGJhc2VJZE5hbWU6IFwiZGF0YWdyaWRcIiwgIC8vYmFzZSBuYW1lIGZvciBhbGwgZWxlbWVudCBJRCdzLlxuICAgIGRhdGE6IFtdLCAgLy9yb3cgZGF0YS5cbiAgICBjb2x1bW5zOiBbXSwgIC8vY29sdW1uIGRlZmluaXRpb25zLlxuICAgIGVuYWJsZVBhZ2luZzogdHJ1ZSwgIC8vZW5hYmxlIHBhZ2luZyBvZiBkYXRhLlxuICAgIHBhZ2VyUGFnZXNUb0Rpc3BsYXk6IDUsICAvL21heCBudW1iZXIgb2YgcGFnZXIgYnV0dG9ucyB0byBkaXNwbGF5LlxuICAgIHBhZ2VyUm93c1BlclBhZ2U6IDI1LCAgLy9yb3dzIHBlciBwYWdlLlxuICAgIGRhdGVGb3JtYXQ6IFwiTU0vZGQveXl5eVwiLCAgLy9yb3cgbGV2ZWwgZGF0ZSBmb3JtYXQuXG4gICAgZGF0ZVRpbWVGb3JtYXQ6IFwiTU0vZGQveXl5eSBISDptbTpzc1wiLCAvL3JvdyBsZXZlbCBkYXRlIGZvcm1hdC5cbiAgICByZW1vdGVVcmw6IFwiXCIsICAvL2dldCBkYXRhIGZyb20gdXJsIGVuZHBvaW50IHZpYSBBamF4LlxuICAgIHJlbW90ZVBhcmFtczogXCJcIiwgIC8vcGFyYW1ldGVycyB0byBiZSBwYXNzZWQgb24gQWpheCByZXF1ZXN0LlxuICAgIHJlbW90ZVByb2Nlc3Npbmc6IGZhbHNlLCAgLy90cnV0aHkgc2V0cyBncmlkIHRvIHByb2Nlc3MgZmlsdGVyL3NvcnQgb24gcmVtb3RlIHNlcnZlci5cbiAgICB0YWJsZUNzczogXCJkYXRhZ3JpZHNcIiwgXG4gICAgdGFibGVIZWFkZXJUaENzczogXCJcIixcbiAgICBwYWdlckNzczogXCJkYXRhZ3JpZHMtcGFnZXJcIiwgXG4gICAgdGFibGVGaWx0ZXJDc3M6IFwiZGF0YWdyaWRzLWlucHV0XCIsICAvL2NzcyBjbGFzcyBmb3IgaGVhZGVyIGZpbHRlciBpbnB1dCBlbGVtZW50cy5cbiAgICB0YWJsZUV2ZW5Db2x1bW5XaWR0aHM6IGZhbHNlLCAgLy9zaG91bGQgYWxsIGNvbHVtbnMgYmUgZXF1YWwgd2lkdGg/XG4gICAgdGFibGVDc3NTb3J0QXNjOiBcImRhdGFncmlkcy1zb3J0LWljb24gZGF0YWdyaWRzLXNvcnQtYXNjXCIsXG4gICAgdGFibGVDc3NTb3J0RGVzYzogXCJkYXRhZ3JpZHMtc29ydC1pY29uIGRhdGFncmlkcy1zb3J0LWRlc2NcIixcbiAgICByZWZyZXNoYWJsZUlkOiBcIlwiLCAgLy9yZWZyZXNoIHJlbW90ZSBkYXRhIHNvdXJjZXMgZm9yIGdyaWQgYW5kL29yIGZpbHRlciB2YWx1ZXMuXG4gICAgcm93Q291bnRJZDogXCJcIixcbiAgICBjc3ZFeHBvcnRJZDogXCJcIixcbiAgICBjc3ZFeHBvcnRSZW1vdGVTb3VyY2U6IFwiXCIgLy9nZXQgZXhwb3J0IGRhdGEgZnJvbSB1cmwgZW5kcG9pbnQgdmlhIEFqYXg7IHVzZWZ1bCB0byBnZXQgbm9uLXBhZ2VkIGRhdGEuXG59OyIsImltcG9ydCBzZXR0aW5nc0RlZmF1bHRzIGZyb20gXCIuL3NldHRpbmdzRGVmYXVsdC5qc1wiO1xuXG5jbGFzcyBNZXJnZU9wdGlvbnMge1xuICAgIC8qKlxuICAgICAqIFJldHVybnMgYW4gb2JqZWN0IGJhc2VkIG9uIHRoZSBtZXJnZWQgcmVzdWx0cyBvZiB0aGUgZGVmYXVsdCBhbmQgdXNlciBwcm92aWRlZCBzZXR0aW5ncy5cbiAgICAgKiBVc2VyIHByb3ZpZGVkIHNldHRpbmdzIHdpbGwgb3ZlcnJpZGUgZGVmYXVsdHMuXG4gICAgICogQHBhcmFtIHtPYmplY3R9IHNvdXJjZSB1c2VyIHN1cHBsaWVkIHNldHRpbmdzLlxuICAgICAqIEByZXR1cm5zIHtPYmplY3R9IHNldHRpbmdzIG1lcmdlZCBmcm9tIGRlZmF1bHQgYW5kIHVzZXIgdmFsdWVzLlxuICAgICAqL1xuICAgIHN0YXRpYyBtZXJnZShzb3VyY2UpIHtcbiAgICAgICAgLy9jb3B5IGRlZmF1bHQga2V5L3ZhbHVlIGl0ZW1zLlxuICAgICAgICBsZXQgcmVzdWx0ID0gSlNPTi5wYXJzZShKU09OLnN0cmluZ2lmeShzZXR0aW5nc0RlZmF1bHRzKSk7XG5cbiAgICAgICAgaWYgKHNvdXJjZSA9PT0gdW5kZWZpbmVkIHx8IE9iamVjdC5rZXlzKHNvdXJjZSkubGVuZ3RoID09PSAwKSB7XG4gICAgICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICBmb3IgKGxldCBba2V5LCB2YWx1ZV0gb2YgT2JqZWN0LmVudHJpZXMoc291cmNlKSkge1xuICAgICAgICAgICAgbGV0IHRhcmdldFR5cGUgPSByZXN1bHRba2V5XSAhPT0gdW5kZWZpbmVkID8gcmVzdWx0W2tleV0udG9TdHJpbmcoKSA6IHVuZGVmaW5lZDtcbiAgICAgICAgICAgIGxldCBzb3VyY2VUeXBlID0gdmFsdWUudG9TdHJpbmcoKTtcblxuICAgICAgICAgICAgaWYgKHRhcmdldFR5cGUgIT09IHVuZGVmaW5lZCAmJiB0YXJnZXRUeXBlICE9PSBzb3VyY2VUeXBlKSB7XG4gICAgICAgICAgICAgICAgcmVzdWx0W2tleV0gPSB2YWx1ZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgfVxufVxuXG5leHBvcnQgeyBNZXJnZU9wdGlvbnMgfTsiLCIvKipcbiAqIEltcGxlbWVudHMgdGhlIHByb3BlcnR5IHNldHRpbmdzIGZvciB0aGUgZ3JpZC5cbiAqL1xuY2xhc3MgU2V0dGluZ3NHcmlkIHtcbiAgICAvKipcbiAgICAgKiBUcmFuc2xhdGVzIHNldHRpbmdzIGZyb20gbWVyZ2VkIHVzZXIvZGVmYXVsdCBvcHRpb25zIGludG8gYSBkZWZpbml0aW9uIG9mIGdyaWQgc2V0dGluZ3MuXG4gICAgICogQHBhcmFtIHtPYmplY3R9IG9wdGlvbnMgTWVyZ2VkIHVzZXIvZGVmYXVsdCBvcHRpb25zLlxuICAgICAqL1xuICAgIGNvbnN0cnVjdG9yKG9wdGlvbnMpIHtcbiAgICAgICAgdGhpcy5iYXNlSWROYW1lID0gb3B0aW9ucy5iYXNlSWROYW1lO1xuICAgICAgICB0aGlzLmVuYWJsZVBhZ2luZyA9IG9wdGlvbnMuZW5hYmxlUGFnaW5nO1xuICAgICAgICB0aGlzLnBhZ2VyUGFnZXNUb0Rpc3BsYXkgPSBvcHRpb25zLnBhZ2VyUGFnZXNUb0Rpc3BsYXk7XG4gICAgICAgIHRoaXMucGFnZXJSb3dzUGVyUGFnZSA9IG9wdGlvbnMucGFnZXJSb3dzUGVyUGFnZTtcbiAgICAgICAgdGhpcy5kYXRlRm9ybWF0ID0gb3B0aW9ucy5kYXRlRm9ybWF0O1xuICAgICAgICB0aGlzLmRhdGVUaW1lRm9ybWF0ID0gb3B0aW9ucy5kYXRlVGltZUZvcm1hdDtcbiAgICAgICAgdGhpcy5yZW1vdGVVcmwgPSBvcHRpb25zLnJlbW90ZVVybDsgIFxuICAgICAgICB0aGlzLnJlbW90ZVBhcmFtcyA9IG9wdGlvbnMucmVtb3RlUGFyYW1zO1xuICAgICAgICB0aGlzLnJlbW90ZVByb2Nlc3NpbmcgPSBmYWxzZTtcbiAgICAgICAgXG4gICAgICAgIHRoaXMuYWpheFVybCA9ICh0aGlzLnJlbW90ZVVybCAmJiB0aGlzLnJlbW90ZVBhcmFtcykgPyB0aGlzLl9idWlsZEFqYXhVcmwodGhpcy5yZW1vdGVVcmwsIHRoaXMucmVtb3RlUGFyYW1zKSA6IHRoaXMucmVtb3RlVXJsO1xuXG4gICAgICAgIGlmICh0eXBlb2Ygb3B0aW9ucy5yZW1vdGVQcm9jZXNzaW5nID09PSBcImJvb2xlYW5cIiAmJiBvcHRpb25zLnJlbW90ZVByb2Nlc3NpbmcpIHtcbiAgICAgICAgICAgIC8vIFJlbW90ZSBwcm9jZXNzaW5nIHNldCB0byBgb25gOyB1c2UgZmlyc3QgY29sdW1uIHdpdGggZmllbGQgYXMgZGVmYXVsdCBzb3J0LlxuICAgICAgICAgICAgY29uc3QgZmlyc3QgPSBvcHRpb25zLmNvbHVtbnMuZmluZCgoaXRlbSkgPT4gaXRlbS5maWVsZCAhPT0gdW5kZWZpbmVkKTtcblxuICAgICAgICAgICAgdGhpcy5yZW1vdGVQcm9jZXNzaW5nID0gdHJ1ZTtcbiAgICAgICAgICAgIHRoaXMucmVtb3RlU29ydERlZmF1bHRDb2x1bW4gPSBmaXJzdC5maWVsZDtcbiAgICAgICAgICAgIHRoaXMucmVtb3RlU29ydERlZmF1bHREaXJlY3Rpb24gPSBcImRlc2NcIjtcbiAgICAgICAgfSBlbHNlIGlmIChPYmplY3Qua2V5cyhvcHRpb25zLnJlbW90ZVByb2Nlc3NpbmcpLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgIC8vIFJlbW90ZSBwcm9jZXNzaW5nIHNldCB0byBgb25gIHVzaW5nIGtleS92YWx1ZSBwYXJhbWV0ZXIgaW5wdXRzIGZvciBkZWZhdWx0IHNvcnQgY29sdW1uLlxuICAgICAgICAgICAgdGhpcy5yZW1vdGVQcm9jZXNzaW5nID0gdHJ1ZTtcbiAgICAgICAgICAgIHRoaXMucmVtb3RlU29ydERlZmF1bHRDb2x1bW4gPSBvcHRpb25zLnJlbW90ZVByb2Nlc3NpbmcuY29sdW1uO1xuICAgICAgICAgICAgdGhpcy5yZW1vdGVTb3J0RGVmYXVsdERpcmVjdGlvbiA9IG9wdGlvbnMucmVtb3RlUHJvY2Vzc2luZy5kaXJlY3Rpb24gPz8gXCJkZXNjXCI7XG4gICAgICAgIH0gXG5cbiAgICAgICAgdGhpcy50YWJsZUNzcyA9IG9wdGlvbnMudGFibGVDc3M7XG4gICAgICAgIHRoaXMudGFibGVIZWFkZXJUaENzcyA9IG9wdGlvbnMudGFibGVIZWFkZXJUaENzcztcbiAgICAgICAgdGhpcy5wYWdlckNzcyA9IG9wdGlvbnMucGFnZXJDc3M7XG4gICAgICAgIHRoaXMudGFibGVGaWx0ZXJDc3MgPSBvcHRpb25zLnRhYmxlRmlsdGVyQ3NzO1xuICAgICAgICB0aGlzLnRhYmxlRXZlbkNvbHVtbldpZHRocyA9IG9wdGlvbnMudGFibGVFdmVuQ29sdW1uV2lkdGhzO1xuICAgICAgICB0aGlzLnRhYmxlQ3NzU29ydEFzYyA9IG9wdGlvbnMudGFibGVDc3NTb3J0QXNjO1xuICAgICAgICB0aGlzLnRhYmxlQ3NzU29ydERlc2MgPSBvcHRpb25zLnRhYmxlQ3NzU29ydERlc2M7XG4gICAgICAgIHRoaXMucmVmcmVzaGFibGVJZCA9IG9wdGlvbnMucmVmcmVzaGFibGVJZDtcbiAgICAgICAgdGhpcy5yb3dDb3VudElkID0gb3B0aW9ucy5yb3dDb3VudElkO1xuICAgICAgICB0aGlzLmNzdkV4cG9ydElkID0gb3B0aW9ucy5jc3ZFeHBvcnRJZDtcbiAgICAgICAgdGhpcy5jc3ZFeHBvcnRSZW1vdGVTb3VyY2UgPSBvcHRpb25zLmNzdkV4cG9ydFJlbW90ZVNvdXJjZTtcbiAgICB9XG4gICAgLyoqXG4gICAgICogQ29tcGlsZXMgdGhlIGtleS92YWx1ZSBxdWVyeSBwYXJhbWV0ZXJzIGludG8gYSBmdWxseSBxdWFsaWZpZWQgdXJsIHdpdGggcXVlcnkgc3RyaW5nLlxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSB1cmwgYmFzZSB1cmwuXG4gICAgICogQHBhcmFtIHtvYmplY3R9IHBhcmFtcyBxdWVyeSBzdHJpbmcgcGFyYW1ldGVycy5cbiAgICAgKiBAcmV0dXJucyB7c3RyaW5nfSB1cmwgd2l0aCBxdWVyeSBwYXJhbWV0ZXJzLlxuICAgICAqL1xuICAgIF9idWlsZEFqYXhVcmwodXJsLCBwYXJhbXMpIHtcbiAgICAgICAgY29uc3QgcCA9IE9iamVjdC5rZXlzKHBhcmFtcyk7XG5cbiAgICAgICAgaWYgKHAubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgY29uc3QgcXVlcnkgPSBwLm1hcChrID0+IGAke2VuY29kZVVSSUNvbXBvbmVudChrKX09JHtlbmNvZGVVUklDb21wb25lbnQocGFyYW1zW2tdKX1gKVxuICAgICAgICAgICAgICAgIC5qb2luKFwiJlwiKTtcblxuICAgICAgICAgICAgcmV0dXJuIGAke3VybH0/JHtxdWVyeX1gO1xuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICByZXR1cm4gdXJsO1xuICAgIH1cbn1cblxuZXhwb3J0IHsgU2V0dGluZ3NHcmlkIH07IiwiY2xhc3MgRGF0YUxvYWRlciB7XG4gICAgLyoqXG4gICAgICogQ3JlYXRlIGNsYXNzIHRvIHJldHJpZXZlIGRhdGEgdmlhIGFuIEFqYXggY2FsbC5cbiAgICAgKiBAcGFyYW0ge1NldHRpbmdzR3JpZH0gc2V0dGluZ3MgZ3JpZCBzZXR0aW5ncy5cbiAgICAgKi9cbiAgICBjb25zdHJ1Y3RvcihzZXR0aW5ncykge1xuICAgICAgICB0aGlzLmFqYXhVcmwgPSBzZXR0aW5ncy5hamF4VXJsO1xuICAgIH1cbiAgICAvKioqXG4gICAgICogVXNlcyBpbnB1dCBwYXJhbWV0ZXIncyBrZXkvdmFsdWUgcGFyaXMgdG8gYnVpbGQgYSBmdWxseSBxdWFsaWZpZWQgdXJsIHdpdGggcXVlcnkgc3RyaW5nIHZhbHVlcy5cbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gdXJsIFRhcmdldCB1cmwuXG4gICAgICogQHBhcmFtIHtvYmplY3R9IFtwYXJhbWV0ZXJzPXt9XSBJbnB1dCBwYXJhbWV0ZXJzLlxuICAgICAqIEByZXR1cm5zIHtzdHJpbmd9IEZ1bGx5IHF1YWxpZmllZCB1cmwuXG4gICAgICovXG4gICAgYnVpbGRVcmwodXJsLCBwYXJhbWV0ZXJzID0ge30pIHtcbiAgICAgICAgY29uc3QgcCA9IE9iamVjdC5rZXlzKHBhcmFtZXRlcnMpO1xuICBcbiAgICAgICAgaWYgKHAubGVuZ3RoID09PSAwKSB7XG4gICAgICAgICAgICByZXR1cm4gdXJsO1xuICAgICAgICB9XG5cbiAgICAgICAgbGV0IHJlc3VsdCA9IFtdO1xuXG4gICAgICAgIGZvciAoY29uc3Qga2V5IG9mIHApIHtcbiAgICAgICAgICAgIGlmIChBcnJheS5pc0FycmF5KHBhcmFtZXRlcnNba2V5XSkpIHtcbiAgICAgICAgICAgICAgICBjb25zdCBtdWx0aSA9IHBhcmFtZXRlcnNba2V5XS5tYXAoayA9PiBgJHtrZXl9PSR7ZW5jb2RlVVJJQ29tcG9uZW50KGspfWApO1xuXG4gICAgICAgICAgICAgICAgcmVzdWx0ID0gcmVzdWx0LmNvbmNhdChtdWx0aSk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHJlc3VsdC5wdXNoKGAke2tleX09JHtlbmNvZGVVUklDb21wb25lbnQocGFyYW1ldGVyc1trZXldKX1gKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiB1cmwuaW5kZXhPZihcIj9cIikgIT09IC0xID8gYCR7dXJsfSYke3Jlc3VsdC5qb2luKFwiJlwiKX1gIDogYCR7dXJsfT8ke3Jlc3VsdC5qb2luKFwiJlwiKX1gO1xuICAgIH1cbiAgICAvKipcbiAgICAgKiBNYWtlcyBhbiBBamF4IGNhbGwgdG8gdGFyZ2V0IHJlc291cmNlLCBhbmQgcmV0dXJucyB0aGUgcmVzdWx0cyBhcyBhIEpTT04gYXJyYXkuXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IHVybCB1cmwuXG4gICAgICogQHBhcmFtIHtPYmplY3R9IHBhcmFtZXRlcnMga2V5L3ZhbHVlIHF1ZXJ5IHN0cmluZyBwYWlycy5cbiAgICAgKiBAcmV0dXJucyB7QXJyYXkgfCBPYmplY3R9XG4gICAgICovXG4gICAgYXN5bmMgcmVxdWVzdERhdGEodXJsLCBwYXJhbWV0ZXJzID0ge30pIHtcbiAgICAgICAgbGV0IHJlc3VsdCA9IFtdO1xuICAgICAgICBjb25zdCB0YXJnZXRVcmwgPSB0aGlzLmJ1aWxkVXJsKHVybCwgcGFyYW1ldGVycyk7XG5cbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGNvbnN0IHJlc3BvbnNlID0gYXdhaXQgZmV0Y2godGFyZ2V0VXJsLCB7IFxuICAgICAgICAgICAgICAgIG1ldGhvZDogXCJHRVRcIiwgXG4gICAgICAgICAgICAgICAgbW9kZTogXCJjb3JzXCIsXG4gICAgICAgICAgICAgICAgaGVhZGVyczogeyBBY2NlcHQ6IFwiYXBwbGljYXRpb24vanNvblwiIH0gXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgaWYgKHJlc3BvbnNlLm9rKSB7XG4gICAgICAgICAgICAgICAgcmVzdWx0ID0gYXdhaXQgcmVzcG9uc2UuanNvbigpO1xuICAgICAgICAgICAgfSBcbiAgICAgICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICAgICAgICB3aW5kb3cuYWxlcnQoZXJyLm1lc3NhZ2UpO1xuICAgICAgICAgICAgY29uc29sZS5sb2coZXJyLm1lc3NhZ2UpO1xuICAgICAgICAgICAgcmVzdWx0ID0gW107XG4gICAgICAgIH1cbiAgXG4gICAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgfVxuICAgIC8qKlxuICAgICAqIE1ha2VzIGFuIEFqYXggY2FsbCB0byB0YXJnZXQgcmVzb3VyY2UgaWRlbnRpZmllZCBpbiB0aGUgYGFqYXhVcmxgIFNldHRpbmdzIHByb3BlcnR5LCBhbmQgcmV0dXJucyB0aGUgcmVzdWx0cyBhcyBhIEpTT04gYXJyYXkuXG4gICAgICogQHBhcmFtIHtPYmplY3R9IFtwYXJhbWV0ZXJzPXt9XSBrZXkvdmFsdWUgcXVlcnkgc3RyaW5nIHBhaXJzLlxuICAgICAqIEByZXR1cm5zIHtBcnJheSB8IE9iamVjdH1cbiAgICAgKi9cbiAgICBhc3luYyByZXF1ZXN0R3JpZERhdGEocGFyYW1ldGVycyA9IHt9KSB7XG4gICAgICAgIHJldHVybiB0aGlzLnJlcXVlc3REYXRhKHRoaXMuYWpheFVybCwgcGFyYW1ldGVycyk7XG4gICAgfVxufVxuXG5leHBvcnQgeyBEYXRhTG9hZGVyIH07IiwiLyoqXG4gKiBQcm92aWRlcyBtZXRob2RzIHRvIHN0b3JlIGFuZCBwZXJzaXN0IGRhdGEgZm9yIHRoZSBncmlkLlxuICovXG5jbGFzcyBEYXRhUGVyc2lzdGVuY2Uge1xuICAgIC8qKlxuICAgICAqIENyZWF0ZXMgY2xhc3Mgb2JqZWN0IHRvIHN0b3JlIGFuZCBwZXJzaXN0IGdyaWQgZGF0YS5cbiAgICAgKiBAcGFyYW0ge0FycmF5PE9iamVjdD59IGRhdGEgcm93IGRhdGEuXG4gICAgICovXG4gICAgY29uc3RydWN0b3IoZGF0YSkge1xuICAgICAgICB0aGlzLmRhdGEgPSBkYXRhO1xuICAgICAgICB0aGlzLmRhdGFDYWNoZSA9IGRhdGEubGVuZ3RoID4gMCA/IHN0cnVjdHVyZWRDbG9uZShkYXRhKSA6IFtdO1xuICAgIH1cbiAgICAvKipcbiAgICAgKiBSZXR1cm5zIHRoZSByb3cgZGF0YS5cbiAgICAgKiBAcmV0dXJucyB7bnVtYmVyfSBDb3VudCBvZiByb3dzIGluIHRoZSBkYXRhLlxuICAgICAqL1xuICAgIGdldCByb3dDb3VudCgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuZGF0YS5sZW5ndGg7XG4gICAgfVxuICAgIC8qKlxuICAgICAqIFNhdmVzIHRoZSBkYXRhIHRvIHRoZSBjbGFzcyBvYmplY3QuICBXaWxsIGFsc28gY2FjaGUgYSBjb3B5IG9mIHRoZSBkYXRhIGZvciBsYXRlciByZXN0b3JhdGlvbiBpZiBmaWx0ZXJpbmcgb3Igc29ydGluZyBpcyBhcHBsaWVkLlxuICAgICAqIEBwYXJhbSB7QXJyYXk8b2JqZWN0Pn0gZGF0YSBEYXRhIHNldC5cbiAgICAgKi9cbiAgICBzZXREYXRhID0gKGRhdGEpID0+IHtcbiAgICAgICAgaWYgKCFBcnJheS5pc0FycmF5KGRhdGEpKSB7XG4gICAgICAgICAgICB0aGlzLmRhdGEgPSBbXTtcbiAgICAgICAgICAgIHRoaXMuZGF0YUNhY2hlID0gW107XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLmRhdGEgPSBkYXRhO1xuICAgICAgICB0aGlzLmRhdGFDYWNoZSA9IGRhdGEubGVuZ3RoID4gMCA/IHN0cnVjdHVyZWRDbG9uZShkYXRhKSA6IFtdO1xuICAgIH07XG4gICAgLyoqXG4gICAgICogUmVzZXRzIHRoZSBkYXRhIHRvIHRoZSBvcmlnaW5hbCBzdGF0ZSB3aGVuIHRoZSBjbGFzcyB3YXMgY3JlYXRlZC5cbiAgICAgKi9cbiAgICByZXN0b3JlRGF0YSgpIHtcbiAgICAgICAgdGhpcy5kYXRhID0gc3RydWN0dXJlZENsb25lKHRoaXMuZGF0YUNhY2hlKTtcbiAgICB9XG59XG5cbmV4cG9ydCB7IERhdGFQZXJzaXN0ZW5jZSB9OyIsIi8qKlxuICogQ2xhc3MgdG8gYnVpbGQgYSBkYXRhLXByb2Nlc3NpbmcgcGlwZWxpbmUgdGhhdCBpbnZva2VzIGFuIGFzeW5jIGZ1bmN0aW9uIHRvIHJldHJpZXZlIGRhdGEgZnJvbSBhIHJlbW90ZSBzb3VyY2UsIFxuICogYW5kIHBhc3MgdGhlIHJlc3VsdHMgdG8gYW4gYXNzb2NpYXRlZCBoYW5kbGVyIGZ1bmN0aW9uLiAgV2lsbCBleGVjdXRlIHN0ZXBzIGluIHRoZSBvcmRlciB0aGV5IGFyZSBhZGRlZCB0byB0aGUgY2xhc3MuXG4gKiBcbiAqIFRoZSBtYWluIHB1cnBvc2Ugb2YgdGhpcyBjbGFzcyBpcyB0byByZXRyaWV2ZSByZW1vdGUgZGF0YSBmb3Igc2VsZWN0IGlucHV0IGNvbnRyb2xzLCBidXQgY2FuIGJlIHVzZWQgZm9yIGFueSBoYW5kbGluZyBcbiAqIG9mIHJlbW90ZSBkYXRhIHJldHJpZXZhbCBhbmQgcHJvY2Vzc2luZy5cbiAqL1xuY2xhc3MgRGF0YVBpcGVsaW5lIHtcbiAgICAjcGlwZWxpbmVzO1xuICAgIC8qKlxuICAgICAqIENyZWF0ZXMgZGF0YS1wcm9jZXNzaW5nIHBpcGVsaW5lIGNsYXNzLiAgV2lsbCBpbnRlcm5hbGx5IGJ1aWxkIGEga2V5L3ZhbHVlIHBhaXIgb2YgZXZlbnRzIGFuZCBhc3NvY2lhdGVkXG4gICAgICogY2FsbGJhY2sgZnVuY3Rpb25zLiAgVmFsdWUgd2lsbCBiZSBhbiBhcnJheSB0byBhY2NvbW1vZGF0ZSBtdWx0aXBsZSBjYWxsYmFja3MgYXNzaWduZWQgdG8gdGhlIHNhbWUgZXZlbnQgXG4gICAgICoga2V5IG5hbWUuXG4gICAgICogQHBhcmFtIHtTZXR0aW5nc0dyaWR9IHNldHRpbmdzIFxuICAgICAqL1xuICAgIGNvbnN0cnVjdG9yKHNldHRpbmdzKSB7XG4gICAgICAgIHRoaXMuI3BpcGVsaW5lcyA9IHt9OyBcbiAgICAgICAgdGhpcy5hamF4VXJsID0gc2V0dGluZ3MuYWpheFVybDtcbiAgICB9XG5cbiAgICBjb3VudEV2ZW50U3RlcHMoZXZlbnROYW1lKSB7XG4gICAgICAgIGlmICghdGhpcy4jcGlwZWxpbmVzW2V2ZW50TmFtZV0pIHJldHVybiAwO1xuXG4gICAgICAgIHJldHVybiB0aGlzLiNwaXBlbGluZXNbZXZlbnROYW1lXS5sZW5ndGg7XG4gICAgfVxuICAgIC8qKlxuICAgICAqIFJldHVybnMgYHRydWVgIGlmIHN0ZXBzIGFyZSByZWdpc3RlcmVkIGZvciB0aGUgYXNzb2NpYXRlZCBldmVudCBuYW1lLCBvciBgZmFsc2VgIGlmIG5vIG1hdGNoaW5nIHJlc3VsdHMgYXJlIGZvdW5kLlxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBldmVudE5hbWUgRXZlbnQgbmFtZS5cbiAgICAgKiBAcmV0dXJucyB7Ym9vbGVhbn0gYHRydWVgIGlmIHJlc3VsdHMgYXJlIGZvdW5kIGZvciBldmVudCBuYW1lLCBvdGhlcndpc2UgYGZhbHNlYC5cbiAgICAgKi9cbiAgICBoYXNQaXBlbGluZShldmVudE5hbWUpIHtcbiAgICAgICAgaWYgKCF0aGlzLiNwaXBlbGluZXNbZXZlbnROYW1lXSkgcmV0dXJuIGZhbHNlO1xuXG4gICAgICAgIHJldHVybiB0aGlzLiNwaXBlbGluZXNbZXZlbnROYW1lXS5sZW5ndGggPiAwO1xuICAgIH1cbiAgICAvKipcbiAgICAgKiBSZWdpc3RlciBhbiBhc3luY2hyb25vdXMgY2FsbGJhY2sgc3RlcCB0byB0aGUgcGlwZWxpbmUuICBNb3JlIHRoYW4gb25lIGNhbGxiYWNrIGNhbiBiZSByZWdpc3RlcmVkIHRvIHRoZSBzYW1lIGV2ZW50IG5hbWUuXG4gICAgICogXG4gICAgICogSWYgYSBkdXBsaWNhdGUvbWF0Y2hpbmcgZXZlbnQgbmFtZSBhbmQgY2FsbGJhY2sgZnVuY3Rpb24gaGFzIGFscmVhZHkgYmVlbiByZWdpc3RlcmVkLCBtZXRob2Qgd2lsbCBza2lwIHRoZSBcbiAgICAgKiByZWdpc3RyYXRpb24gcHJvY2Vzcy5cbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gZXZlbnROYW1lIEV2ZW50IG5hbWUuXG4gICAgICogQHBhcmFtIHtGdW5jdGlvbn0gY2FsbGJhY2sgQW4gYXN5bmMgZnVuY3Rpb24uXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IFt1cmw9XCJcIl0gVGFyZ2V0IHVybC4gIFdpbGwgdXNlIGBhamF4VXJsYCBwcm9wZXJ0eSBkZWZhdWx0IGlmIGFyZ3VtZW50IGlzIGVtcHR5LlxuICAgICAqL1xuICAgIGFkZFN0ZXAoZXZlbnROYW1lLCBjYWxsYmFjaywgdXJsID0gXCJcIikge1xuICAgICAgICBpZiAoIXRoaXMuI3BpcGVsaW5lc1tldmVudE5hbWVdKSB7XG4gICAgICAgICAgICB0aGlzLiNwaXBlbGluZXNbZXZlbnROYW1lXSA9IFtdO1xuICAgICAgICB9IGVsc2UgaWYgKHRoaXMuI3BpcGVsaW5lc1tldmVudE5hbWVdLnNvbWUoKHgpID0+IHguY2FsbGJhY2sgPT09IGNhbGxiYWNrKSkge1xuICAgICAgICAgICAgY29uc29sZS53YXJuKFwiQ2FsbGJhY2sgZnVuY3Rpb24gYWxyZWFkeSBmb3VuZCBmb3I6IFwiICsgZXZlbnROYW1lKTtcbiAgICAgICAgICAgIHJldHVybjsgIC8vIElmIGV2ZW50IG5hbWUgYW5kIGNhbGxiYWNrIGFscmVhZHkgZXhpc3QsIGRvbid0IGFkZC5cbiAgICAgICAgfVxuXG4gICAgICAgIGlmICh1cmwgPT09IFwiXCIpIHtcbiAgICAgICAgICAgIHVybCA9IHRoaXMuYWpheFVybDtcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMuI3BpcGVsaW5lc1tldmVudE5hbWVdLnB1c2goe3VybDogdXJsLCBjYWxsYmFjazogY2FsbGJhY2t9KTtcbiAgICB9XG4gICAgLyoqXG4gICAgICogRXhlY3V0ZXMgdGhlIEhUVFAgcmVxdWVzdChzKSBmb3IgdGhlIGdpdmVuIGV2ZW50IG5hbWUsIGFuZCBwYXNzZXMgdGhlIHJlc3VsdHMgdG8gdGhlIGFzc29jaWF0ZWQgY2FsbGJhY2sgZnVuY3Rpb24uICBcbiAgICAgKiBNZXRob2QgZXhwZWN0cyByZXR1cm4gdHlwZSBvZiByZXF1ZXN0IHRvIGJlIGEgSlNPTiByZXNwb25zZS5cbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gZXZlbnROYW1lIFxuICAgICAqL1xuICAgIGFzeW5jIGV4ZWN1dGUoZXZlbnROYW1lKSB7XG4gICAgICAgIGZvciAobGV0IGl0ZW0gb2YgdGhpcy4jcGlwZWxpbmVzW2V2ZW50TmFtZV0pIHtcbiAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgY29uc3QgcmVzcG9uc2UgPSBhd2FpdCBmZXRjaChpdGVtLnVybCwgeyBcbiAgICAgICAgICAgICAgICAgICAgbWV0aG9kOiBcIkdFVFwiLCBcbiAgICAgICAgICAgICAgICAgICAgbW9kZTogXCJjb3JzXCIsXG4gICAgICAgICAgICAgICAgICAgIGhlYWRlcnM6IHsgQWNjZXB0OiBcImFwcGxpY2F0aW9uL2pzb25cIiB9IFxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgIGlmIChyZXNwb25zZS5vaykge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBkYXRhID0gYXdhaXQgcmVzcG9uc2UuanNvbigpO1xuXG4gICAgICAgICAgICAgICAgICAgIGl0ZW0uY2FsbGJhY2soZGF0YSk7XG4gICAgICAgICAgICAgICAgfSBcbiAgICAgICAgICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgICAgICAgICAgIHdpbmRvdy5hbGVydChlcnIubWVzc2FnZSk7XG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2coZXJyLm1lc3NhZ2UpO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxufVxuXG5leHBvcnQgeyBEYXRhUGlwZWxpbmUgfTsiLCJjbGFzcyBFbGVtZW50SGVscGVyIHtcbiAgICAvKipcbiAgICAgKiBDcmVhdGVzIGFuIEhUTUwgZWxlbWVudCB3aXRoIHRoZSBzcGVjaWZpZWQgdGFnIGFuZCBwcm9wZXJ0aWVzLlxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSB0YWcgVGhlIHRhZyBuYW1lIG9mIHRoZSBlbGVtZW50IHRvIGNyZWF0ZS5cbiAgICAgKiBAcGFyYW0ge09iamVjdH0gW3Byb3BlcnRpZXM9e31dIEFuIG9iamVjdCBjb250YWluaW5nIHByb3BlcnRpZXMgdG8gYXNzaWduIHRvIHRoZSBlbGVtZW50LlxuICAgICAqIEBwYXJhbSB7T2JqZWN0fSBbZGF0YXNldD17fV0gQW4gb2JqZWN0IGNvbnRhaW5pbmcgZGF0YXNldCBhdHRyaWJ1dGVzIHRvIGFzc2lnbiB0byB0aGUgZWxlbWVudC5cbiAgICAgKiBAcmV0dXJucyB7SFRNTEVsZW1lbnR9IFRoZSBjcmVhdGVkIEhUTUwgZWxlbWVudC5cbiAgICAgKi9cbiAgICBzdGF0aWMgY3JlYXRlKHRhZywgcHJvcGVydGllcyA9IHt9LCBkYXRhc2V0ID0ge30pIHtcbiAgICAgICAgY29uc3QgZWxlbWVudCA9IE9iamVjdC5hc3NpZ24oZG9jdW1lbnQuY3JlYXRlRWxlbWVudCh0YWcpLCBwcm9wZXJ0aWVzKTtcblxuICAgICAgICBpZiAoZGF0YXNldCkgeyBcbiAgICAgICAgICAgIE9iamVjdC5hc3NpZ24oZWxlbWVudC5kYXRhc2V0LCBkYXRhc2V0KTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBlbGVtZW50O1xuICAgIH1cbiAgICAvKipcbiAgICAgKiBDcmVhdGVzIGEgYGRpdmAgZWxlbWVudCB3aXRoIHRoZSBzcGVjaWZpZWQgcHJvcGVydGllcyBhbmQgZGF0YXNldC5cbiAgICAgKiBAcGFyYW0ge09iamVjdH0gW3Byb3BlcnRpZXM9e31dIEFuIG9iamVjdCBjb250YWluaW5nIHByb3BlcnRpZXMgdG8gYXNzaWduIHRvIHRoZSBlbGVtZW50LlxuICAgICAqIEBwYXJhbSB7T2JqZWN0fSBbZGF0YXNldD17fV0gQW4gb2JqZWN0IGNvbnRhaW5pbmcgZGF0YXNldCBhdHRyaWJ1dGVzIHRvIGFzc2lnbiB0byB0aGUgZWxlbWVudC5cbiAgICAgKiBAcmV0dXJucyB7SFRNTERpdkVsZW1lbnR9IFRoZSBjcmVhdGVkIEhUTUwgZWxlbWVudC5cbiAgICAgKi9cbiAgICBzdGF0aWMgZGl2KHByb3BlcnRpZXMgPSB7fSwgZGF0YXNldCA9IHt9KSB7XG4gICAgICAgIHJldHVybiB0aGlzLmNyZWF0ZShcImRpdlwiLCBwcm9wZXJ0aWVzLCBkYXRhc2V0KTtcbiAgICB9XG4gICAgLyoqXG4gICAgICogQ3JlYXRlcyBhIGBpbnB1dGAgZWxlbWVudCB3aXRoIHRoZSBzcGVjaWZpZWQgcHJvcGVydGllcyBhbmQgZGF0YXNldC5cbiAgICAgKiBAcGFyYW0ge09iamVjdH0gW3Byb3BlcnRpZXM9e31dIEFuIG9iamVjdCBjb250YWluaW5nIHByb3BlcnRpZXMgdG8gYXNzaWduIHRvIHRoZSBlbGVtZW50LlxuICAgICAqIEBwYXJhbSB7T2JqZWN0fSBbZGF0YXNldD17fV0gQW4gb2JqZWN0IGNvbnRhaW5pbmcgZGF0YXNldCBhdHRyaWJ1dGVzIHRvIGFzc2lnbiB0byB0aGUgZWxlbWVudC5cbiAgICAgKiBAcmV0dXJucyB7SFRNTElucHV0RWxlbWVudH0gVGhlIGNyZWF0ZWQgSFRNTCBlbGVtZW50LlxuICAgICAqL1xuICAgIHN0YXRpYyBpbnB1dChwcm9wZXJ0aWVzID0ge30sIGRhdGFzZXQgPSB7fSkge1xuICAgICAgICByZXR1cm4gdGhpcy5jcmVhdGUoXCJpbnB1dFwiLCBwcm9wZXJ0aWVzLCBkYXRhc2V0KTtcbiAgICB9XG4gICAgLyoqXG4gICAgICogQ3JlYXRlcyBhIGBzcGFuYCBlbGVtZW50IHdpdGggdGhlIHNwZWNpZmllZCBwcm9wZXJ0aWVzIGFuZCBkYXRhc2V0LlxuICAgICAqIEBwYXJhbSB7T2JqZWN0fSBbcHJvcGVydGllcz17fV0gQW4gb2JqZWN0IGNvbnRhaW5pbmcgcHJvcGVydGllcyB0byBhc3NpZ24gdG8gdGhlIGVsZW1lbnQuXG4gICAgICogQHBhcmFtIHtPYmplY3R9IFtkYXRhc2V0PXt9XSBBbiBvYmplY3QgY29udGFpbmluZyBkYXRhc2V0IGF0dHJpYnV0ZXMgdG8gYXNzaWduIHRvIHRoZSBlbGVtZW50LlxuICAgICAqIEByZXR1cm5zIHtIVE1MU3BhbkVsZW1lbnR9IFRoZSBjcmVhdGVkIEhUTUwgZWxlbWVudC5cbiAgICAgKi9cbiAgICBzdGF0aWMgc3Bhbihwcm9wZXJ0aWVzID0ge30sIGRhdGFzZXQgPSB7fSkge1xuICAgICAgICByZXR1cm4gdGhpcy5jcmVhdGUoXCJzcGFuXCIsIHByb3BlcnRpZXMsIGRhdGFzZXQpO1xuICAgIH1cbn1cblxuZXhwb3J0IHsgRWxlbWVudEhlbHBlciB9OyIsIi8qKlxuICogQ2xhc3MgdGhhdCBhbGxvd3MgdGhlIHN1YnNjcmlwdGlvbiBhbmQgcHVibGljYXRpb24gb2YgZ3JpZCByZWxhdGVkIGV2ZW50cy5cbiAqIEBjbGFzc1xuICovXG5jbGFzcyBHcmlkRXZlbnRzIHtcbiAgICAjZXZlbnRzO1xuXG4gICAgY29uc3RydWN0b3IoKSB7XG4gICAgICAgIHRoaXMuI2V2ZW50cyA9IHt9O1xuICAgIH1cblxuICAgICNndWFyZChldmVudE5hbWUpIHtcbiAgICAgICAgaWYgKCF0aGlzLiNldmVudHMpIHJldHVybiBmYWxzZTtcblxuICAgICAgICByZXR1cm4gKHRoaXMuI2V2ZW50c1tldmVudE5hbWVdKTtcbiAgICB9XG4gICAgLyoqXG4gICAgICogQWRkcyBhbiBldmVudCB0byBwdWJsaXNoZXIgY29sbGVjdGlvbi5cbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gZXZlbnROYW1lIEV2ZW50IG5hbWUuXG4gICAgICogQHBhcmFtIHtGdW5jdGlvbn0gaGFuZGxlciBDYWxsYmFjayBmdW5jdGlvbi5cbiAgICAgKiBAcGFyYW0ge2Jvb2xlYW59IFtpc0FzeW5jPWZhbHNlXSBUcnVlIGlmIGNhbGxiYWNrIHNob3VsZCBleGVjdXRlIHdpdGggYXdhaXQgb3BlcmF0aW9uLlxuICAgICAqIEBwYXJhbSB7bnVtYmVyfSBbcHJpb3JpdHk9MF0gT3JkZXIgaW4gd2hpY2ggZXZlbnQgc2hvdWxkIGJlIGV4ZWN1dGVkLlxuICAgICAqL1xuICAgIHN1YnNjcmliZShldmVudE5hbWUsIGhhbmRsZXIsIGlzQXN5bmMgPSBmYWxzZSwgcHJpb3JpdHkgPSAwKSB7XG4gICAgICAgIGlmICghdGhpcy4jZXZlbnRzW2V2ZW50TmFtZV0pIHtcbiAgICAgICAgICAgIHRoaXMuI2V2ZW50c1tldmVudE5hbWVdID0gW3sgaGFuZGxlciwgcHJpb3JpdHksIGlzQXN5bmMgfV07XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIHRoaXMuI2V2ZW50c1tldmVudE5hbWVdLnB1c2goeyBoYW5kbGVyLCBwcmlvcml0eSwgaXNBc3luYyB9KTtcbiAgICAgICAgdGhpcy4jZXZlbnRzW2V2ZW50TmFtZV0uc29ydCgoYSwgYikgPT4ge1xuICAgICAgICAgICAgcmV0dXJuIGEucHJpb3JpdHkgLSBiLnByaW9yaXR5O1xuICAgICAgICB9KTtcbiAgICB9XG4gICAgLyoqXG4gICAgICogUmVtb3ZlcyB0aGUgdGFyZ2V0IGV2ZW50IGZyb20gdGhlIHB1YmxpY2F0aW9uIGNoYWluLlxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBldmVudE5hbWUgRXZlbnQgbmFtZS5cbiAgICAgKiBAcGFyYW0ge0Z1bmN0aW9ufSBoYW5kbGVyIEV2ZW50IGhhbmRsZXIuXG4gICAgICovXG4gICAgdW5zdWJzY3JpYmUoZXZlbnROYW1lLCBoYW5kbGVyKSB7XG4gICAgICAgIGlmICghdGhpcy4jZ3VhcmQoZXZlbnROYW1lKSkgcmV0dXJuO1xuXG4gICAgICAgIHRoaXMuI2V2ZW50c1tldmVudE5hbWVdID0gdGhpcy4jZXZlbnRzW2V2ZW50TmFtZV0uZmlsdGVyKGggPT4gaCAhPT0gaGFuZGxlcik7XG4gICAgfVxuICAgIC8qKlxuICAgICAqIFRha2VzIHRoZSByZXN1bHQgb2YgZWFjaCBzdWJzY3JpYmVyJ3MgY2FsbGJhY2sgZnVuY3Rpb24gYW5kIGNoYWlucyB0aGVtIGludG8gb25lIHJlc3VsdC5cbiAgICAgKiBVc2VkIHRvIGNyZWF0ZSBhIGxpc3Qgb2YgcGFyYW1ldGVycyBmcm9tIG11bHRpcGxlIG1vZHVsZXM6IGkuZS4gc29ydCwgZmlsdGVyLCBhbmQgcGFnaW5nIGlucHV0cy5cbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gZXZlbnROYW1lIGV2ZW50IG5hbWVcbiAgICAgKiBAcGFyYW0ge09iamVjdH0gW2luaXRpYWxWYWx1ZT17fV0gaW5pdGlhbCB2YWx1ZVxuICAgICAqIEByZXR1cm5zIHtPYmplY3R9XG4gICAgICovXG4gICAgY2hhaW4oZXZlbnROYW1lLCBpbml0aWFsVmFsdWUgPSB7fSkge1xuICAgICAgICBpZiAoIXRoaXMuI2d1YXJkKGV2ZW50TmFtZSkpIHJldHVybjtcblxuICAgICAgICBsZXQgcmVzdWx0ID0gaW5pdGlhbFZhbHVlO1xuXG4gICAgICAgIHRoaXMuI2V2ZW50c1tldmVudE5hbWVdLmZvckVhY2goKGgpID0+IHtcbiAgICAgICAgICAgIHJlc3VsdCA9IGguaGFuZGxlcihyZXN1bHQpO1xuICAgICAgICB9KTtcblxuICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgIH1cbiAgICAvKipcbiAgICAgKiBUcmlnZ2VyIGNhbGxiYWNrIGZ1bmN0aW9uIGZvciBzdWJzY3JpYmVycyBvZiB0aGUgYGV2ZW50TmFtZWAuXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IGV2ZW50TmFtZSBFdmVudCBuYW1lLlxuICAgICAqIEBwYXJhbSAgey4uLmFueX0gYXJncyBBcmd1bWVudHMuXG4gICAgICovXG4gICAgYXN5bmMgdHJpZ2dlcihldmVudE5hbWUsIC4uLmFyZ3MpIHtcbiAgICAgICAgaWYgKCF0aGlzLiNndWFyZChldmVudE5hbWUpKSByZXR1cm47XG5cbiAgICAgICAgZm9yIChsZXQgaCBvZiB0aGlzLiNldmVudHNbZXZlbnROYW1lXSkge1xuICAgICAgICAgICAgaWYgKGguaXNBc3luYykge1xuICAgICAgICAgICAgICAgIGF3YWl0IGguaGFuZGxlciguLi5hcmdzKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgaC5oYW5kbGVyKC4uLmFyZ3MpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxufVxuXG5leHBvcnQgeyBHcmlkRXZlbnRzIH07IiwiaW1wb3J0IHsgQ2VsbCB9IGZyb20gXCIuLi9jZWxsL2NlbGwuanNcIjtcbi8qKlxuICogQ2xhc3MgdG8gbWFuYWdlIHRoZSB0YWJsZSBlbGVtZW50IGFuZCBpdHMgcm93cyBhbmQgY2VsbHMuXG4gKi9cbmNsYXNzIFRhYmxlIHtcbiAgICAjcm93Q291bnQ7XG4gICAgLyoqXG4gICAgICogQ3JlYXRlIGBUYWJsZWAgY2xhc3MgdG8gbWFuYWdlIHRoZSB0YWJsZSBlbGVtZW50IGFuZCBpdHMgcm93cyBhbmQgY2VsbHMuXG4gICAgICogQHBhcmFtIHtHcmlkQ29udGV4dH0gY29udGV4dCBHcmlkIGNvbnRleHQuXG4gICAgICovXG4gICAgY29uc3RydWN0b3IoY29udGV4dCkge1xuICAgICAgICB0aGlzLmNvbnRleHQgPSBjb250ZXh0O1xuICAgICAgICB0aGlzLnRhYmxlID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcInRhYmxlXCIpO1xuICAgICAgICB0aGlzLnRoZWFkID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcInRoZWFkXCIpO1xuICAgICAgICB0aGlzLnRib2R5ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcInRib2R5XCIpO1xuICAgICAgICB0aGlzLiNyb3dDb3VudCA9IDA7XG5cbiAgICAgICAgdGhpcy50YWJsZS5pZCA9IGAke2NvbnRleHQuc2V0dGluZ3MuYmFzZUlkTmFtZX1fdGFibGVgO1xuICAgICAgICB0aGlzLnRhYmxlLmFwcGVuZCh0aGlzLnRoZWFkLCB0aGlzLnRib2R5KTtcbiAgICAgICAgdGhpcy50YWJsZS5jbGFzc05hbWUgPSBjb250ZXh0LnNldHRpbmdzLnRhYmxlQ3NzO1xuICAgIH1cbiAgICAvKipcbiAgICAgKiBJbml0aWFsaXplcyB0aGUgdGFibGUgaGVhZGVyIHJvdyBlbGVtZW50IGJ5IGNyZWF0aW5nIGEgcm93IGFuZCBhcHBlbmRpbmcgZWFjaCBjb2x1bW4ncyBoZWFkZXIgY2VsbC5cbiAgICAgKi9cbiAgICBpbml0aWFsaXplSGVhZGVyKCkge1xuICAgICAgICBjb25zdCB0ciA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJ0clwiKTtcblxuICAgICAgICBmb3IgKGNvbnN0IGNvbHVtbiBvZiB0aGlzLmNvbnRleHQuY29sdW1uTWFuYWdlci5jb2x1bW5zKSB7XG4gICAgICAgICAgICB0ci5hcHBlbmRDaGlsZChjb2x1bW4uaGVhZGVyQ2VsbC5lbGVtZW50KTtcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMudGhlYWQuYXBwZW5kQ2hpbGQodHIpO1xuICAgIH1cbiAgICAvKipcbiAgICAgKiBSZW5kZXIgdGFibGUgYm9keSByb3dzLiAgV2lsbCByZW1vdmUgYW55IHByaW9yIHRhYmxlIGJvZHkgcmVzdWx0cyBhbmQgYnVpbGQgbmV3IHJvd3MgYW5kIGNlbGxzLlxuICAgICAqIEBwYXJhbSB7QXJyYXk8T2JqZWN0Pn0gZGF0YXNldCBEYXRhIHNldCB0byBidWlsZCB0YWJsZSByb3dzLlxuICAgICAqIEBwYXJhbSB7bnVtYmVyIHwgbnVsbH0gW3Jvd0NvdW50PW51bGxdIFNldCB0aGUgcm93IGNvdW50IHBhcmFtZXRlciB0byBhIHNwZWNpZmljIHZhbHVlIGlmIFxuICAgICAqIHJlbW90ZSBwcm9jZXNzaW5nIGlzIGJlaW5nIHVzZWQsIG90aGVyd2lzZSB3aWxsIHVzZSB0aGUgbGVuZ3RoIG9mIHRoZSBkYXRhc2V0LlxuICAgICAqL1xuICAgIHJlbmRlclJvd3MoZGF0YXNldCwgcm93Q291bnQgPSBudWxsKSB7XG4gICAgICAgIC8vQ2xlYXIgYm9keSBvZiBwcmV2aW91cyBkYXRhLlxuICAgICAgICB0aGlzLnRib2R5LnJlcGxhY2VDaGlsZHJlbigpO1xuICAgICAgICBcbiAgICAgICAgaWYgKCFBcnJheS5pc0FycmF5KGRhdGFzZXQpKSB7XG4gICAgICAgICAgICB0aGlzLiNyb3dDb3VudCA9IDA7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLiNyb3dDb3VudCA9IHJvd0NvdW50ID8/IGRhdGFzZXQubGVuZ3RoO1xuXG4gICAgICAgIGZvciAoY29uc3QgZGF0YSBvZiBkYXRhc2V0KSB7XG4gICAgICAgICAgICBjb25zdCB0ciA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJ0clwiKTtcblxuICAgICAgICAgICAgZm9yIChsZXQgY29sdW1uIG9mIHRoaXMuY29udGV4dC5jb2x1bW5NYW5hZ2VyLmNvbHVtbnMpIHtcbiAgICAgICAgICAgICAgICBjb25zdCBjZWxsID0gbmV3IENlbGwoZGF0YSwgY29sdW1uLCB0aGlzLmNvbnRleHQubW9kdWxlcywgdHIpO1xuXG4gICAgICAgICAgICAgICAgdHIuYXBwZW5kQ2hpbGQoY2VsbC5lbGVtZW50KTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgdGhpcy50Ym9keS5hcHBlbmRDaGlsZCh0cik7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBnZXQgcm93Q291bnQoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLiNyb3dDb3VudDtcbiAgICB9XG59XG5cbmV4cG9ydCB7IFRhYmxlIH07IiwiaW1wb3J0IHsgQ29sdW1uTWFuYWdlciB9IGZyb20gXCIuLi9jb2x1bW4vY29sdW1uTWFuYWdlci5qc1wiO1xuaW1wb3J0IHsgRGF0YVBpcGVsaW5lIH0gZnJvbSBcIi4uL2RhdGEvZGF0YVBpcGVsaW5lLmpzXCI7XG5pbXBvcnQgeyBEYXRhTG9hZGVyIH0gZnJvbSBcIi4uL2RhdGEvZGF0YUxvYWRlci5qc1wiO1xuaW1wb3J0IHsgRGF0YVBlcnNpc3RlbmNlIH0gZnJvbSBcIi4uL2RhdGEvZGF0YVBlcnNpc3RlbmNlLmpzXCI7XG5pbXBvcnQgeyBHcmlkRXZlbnRzIH0gZnJvbSBcIi4uL2V2ZW50cy9ncmlkRXZlbnRzLmpzXCI7XG5pbXBvcnQgeyBUYWJsZSB9IGZyb20gXCIuLi90YWJsZS90YWJsZS5qc1wiO1xuLyoqXG4gKiBQcm92aWRlcyB0aGUgY29udGV4dCBmb3IgdGhlIGdyaWQsIGluY2x1ZGluZyBzZXR0aW5ncywgZGF0YSwgYW5kIG1vZHVsZXMuICBUaGlzIGNsYXNzIGlzIHJlc3BvbnNpYmxlIGZvciBtYW5hZ2luZyBcbiAqIHRoZSBncmlkJ3MgY29yZSBzdGF0ZSBhbmQgYmVoYXZpb3IuXG4gKi9cbmNsYXNzIEdyaWRDb250ZXh0IHtcbiAgICAvKipcbiAgICAgKiBDcmVhdGUgZ3JpZCBjb250ZXh0LCB3aGljaCByZXByZXNlbnRzIHRoZSBjb3JlIGxvZ2ljIGFuZCBmdW5jdGlvbmFsaXR5IG9mIHRoZSBkYXRhIGdyaWQuXG4gICAgICogQHBhcmFtIHtBcnJheTxvYmplY3Q+fSBjb2x1bW5zIENvbHVtbiBkZWZpbml0aW9uLlxuICAgICAqIEBwYXJhbSB7U2V0dGluZ3NHcmlkfSBzZXR0aW5ncyBHcmlkIHNldHRpbmdzLlxuICAgICAqIEBwYXJhbSB7YW55W119IFtkYXRhPVtdXSBHcmlkIGRhdGEuXG4gICAgICovXG4gICAgY29uc3RydWN0b3IoY29sdW1ucywgc2V0dGluZ3MsIGRhdGEgPSBbXSkge1xuICAgICAgICB0aGlzLnNldHRpbmdzID0gc2V0dGluZ3M7XG4gICAgICAgIHRoaXMuZXZlbnRzID0gbmV3IEdyaWRFdmVudHMoKTtcbiAgICAgICAgdGhpcy5waXBlbGluZSA9IG5ldyBEYXRhUGlwZWxpbmUodGhpcy5zZXR0aW5ncyk7XG4gICAgICAgIHRoaXMuZGF0YWxvYWRlciA9IG5ldyBEYXRhTG9hZGVyKHRoaXMuc2V0dGluZ3MpO1xuICAgICAgICB0aGlzLnBlcnNpc3RlbmNlID0gbmV3IERhdGFQZXJzaXN0ZW5jZShkYXRhKTtcbiAgICAgICAgdGhpcy5jb2x1bW5NYW5hZ2VyID0gbmV3IENvbHVtbk1hbmFnZXIoY29sdW1ucywgdGhpcy5zZXR0aW5ncyk7XG4gICAgICAgIHRoaXMuZ3JpZCA9IG5ldyBUYWJsZSh0aGlzKTtcbiAgICAgICAgdGhpcy5tb2R1bGVzID0ge307XG4gICAgfVxufVxuXG5leHBvcnQgeyBHcmlkQ29udGV4dCB9OyIsIi8qKlxuICogUHJvdmlkZXMgbG9naWMgdG8gY29udmVydCBncmlkIGRhdGEgaW50byBhIGRvd25sb2FkYWJsZSBDU1YgZmlsZS5cbiAqIE1vZHVsZSB3aWxsIHByb3ZpZGUgbGltaXRlZCBmb3JtYXR0aW5nIG9mIGRhdGEuICBPbmx5IGNvbHVtbnMgd2l0aCBhIGZvcm1hdHRlciB0eXBlIFxuICogb2YgYG1vZHVsZWAgb3IgYGZ1bmN0aW9uYCB3aWxsIGJlIHByb2Nlc3NlZC4gIEFsbCBvdGhlciBjb2x1bW5zIHdpbGwgYmUgcmV0dXJuZWQgYXNcbiAqIHRoZWlyIHJhdyBkYXRhIHR5cGUuICBJZiBhIGNvbHVtbidzIHZhbHVlIGNvbnRhaW5zIGEgY29tbWEsIHRoZSB2YWx1ZSB3aWxsIGJlIGRvdWJsZSBxdW90ZWQuXG4gKi9cbmNsYXNzIENzdk1vZHVsZSB7XG4gICAgLyoqXG4gICAgICogQWxsb3dzIGdyaWQncyBkYXRhIHRvIGJlIGNvbnZlcnRlZCBpbnRvIGEgZG93bmxvYWRhYmxlIENTViBmaWxlLiAgSWYgZ3JpZCBpcyBcbiAgICAgKiBzZXQgdG8gYSBsb2NhbCBkYXRhIHNvdXJjZSwgdGhlIGRhdGEgY2FjaGUgaW4gdGhlIHBlcnNpc3RlbmNlIGNsYXNzIGlzIHVzZWQuXG4gICAgICogT3RoZXJ3aXNlLCBjbGFzcyB3aWxsIG1ha2UgYW4gQWpheCBjYWxsIHRvIHJlbW90ZSB0YXJnZXQgc2V0IGluIGRhdGEgbG9hZGVyXG4gICAgICogY2xhc3MuXG4gICAgICogQHBhcmFtIHtHcmlkQ29udGV4dH0gY29udGV4dCBHcmlkIGNvbnRleHQgY2xhc3MuXG4gICAgICovXG4gICAgY29uc3RydWN0b3IoY29udGV4dCkge1xuICAgICAgICB0aGlzLmNvbnRleHQgPSBjb250ZXh0O1xuICAgICAgICB0aGlzLmRlbGltaXRlciA9IFwiLFwiO1xuICAgICAgICB0aGlzLmJ1dHRvbiA9IGNvbnRleHQuc2V0dGluZ3MuY3N2RXhwb3J0SWQ7XG4gICAgICAgIHRoaXMuZGF0YVVybCA9IGNvbnRleHQuc2V0dGluZ3MuY3N2RXhwb3J0UmVtb3RlU291cmNlO1xuICAgIH1cblxuICAgIGluaXRpYWxpemUoKSB7XG4gICAgICAgIGNvbnN0IGJ0biA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKHRoaXMuYnV0dG9uKTtcbiAgICAgICAgXG4gICAgICAgIGJ0bi5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgdGhpcy5oYW5kbGVEb3dubG9hZCk7XG4gICAgfVxuXG4gICAgaGFuZGxlRG93bmxvYWQgPSBhc3luYyAoKSA9PiB7XG4gICAgICAgIGxldCBjc3ZEYXRhID0gW107XG4gICAgICAgIGNvbnN0IGZpbGVOYW1lID0gYCR7ZG9jdW1lbnQudGl0bGV9LmNzdmA7XG5cbiAgICAgICAgaWYgKHRoaXMuZGF0YVVybCkge1xuICAgICAgICAgICAgY29uc3QgZGF0YSA9IGF3YWl0IHRoaXMuY29udGV4dC5kYXRhbG9hZGVyLnJlcXVlc3REYXRhKHRoaXMuZGF0YVVybCk7XG5cbiAgICAgICAgICAgIGNzdkRhdGEgPSB0aGlzLmJ1aWxkRmlsZUNvbnRlbnQoZGF0YSkuam9pbihcIlxcclxcblwiKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGNzdkRhdGEgPSB0aGlzLmJ1aWxkRmlsZUNvbnRlbnQodGhpcy5jb250ZXh0LnBlcnNpc3RlbmNlLmRhdGFDYWNoZSkuam9pbihcIlxcclxcblwiKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IGJsb2IgPSBuZXcgQmxvYihbY3N2RGF0YV0sIHsgdHlwZTogXCJ0ZXh0L2NzdjtjaGFyc2V0PXV0Zi04O1wiIH0pO1xuICAgICAgICBjb25zdCBlbGVtZW50ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImFcIik7XG5cbiAgICAgICAgZWxlbWVudC5zZXRBdHRyaWJ1dGUoXCJocmVmXCIsIHdpbmRvdy5VUkwuY3JlYXRlT2JqZWN0VVJMKGJsb2IpKTtcbiAgICAgICAgLy9zZXQgZmlsZSB0aXRsZVxuICAgICAgICBlbGVtZW50LnNldEF0dHJpYnV0ZShcImRvd25sb2FkXCIsIGZpbGVOYW1lKTtcbiAgICAgICAgLy90cmlnZ2VyIGRvd25sb2FkXG4gICAgICAgIGVsZW1lbnQuc3R5bGUuZGlzcGxheSA9IFwibm9uZVwiO1xuICAgICAgICBkb2N1bWVudC5ib2R5LmFwcGVuZENoaWxkKGVsZW1lbnQpO1xuICAgICAgICBlbGVtZW50LmNsaWNrKCk7XG4gICAgICAgIC8vcmVtb3ZlIHRlbXBvcmFyeSBsaW5rIGVsZW1lbnRcbiAgICAgICAgZG9jdW1lbnQuYm9keS5yZW1vdmVDaGlsZChlbGVtZW50KTtcblxuICAgICAgICB3aW5kb3cuYWxlcnQoYERvd25sb2FkZWQgJHtmaWxlTmFtZX1gKTtcbiAgICB9O1xuICAgIC8qKlxuICAgICAqIFJldHVybnMgYW4gb2JqZWN0IHRoYXQgcmVwcmVzZW50cyB0aGUgY29sdW1ucyBhbmQgaGVhZGVyIG5hbWVzIHRoYXQgc2hvdWxkIGJlIHVzZWRcbiAgICAgKiB0byBjcmVhdGUgdGhlIENTViByZXN1bHRzLiAgV2lsbCBleGNsdWRlIGNvbHVtbnMgd2l0aCBhIHR5cGUgb2YgYGljb25gLlxuICAgICAqIEBwYXJhbSB7T2JqZWN0fSBjb2x1bW5NZ3JDb2x1bW5zIENvbHVtbiBNYW5hZ2VyIENvbHVtbnMgY29sbGVjdGlvbi5cbiAgICAgKiBAcmV0dXJucyB7eyBoZWFkZXJzOiBBcnJheTxzdHJpbmc+LCBjb2x1bW5zOiBBcnJheTxDb2x1bW4+IH19XG4gICAgICovXG4gICAgaWRlbnRpZnlDb2x1bW5zKGNvbHVtbk1nckNvbHVtbnMpIHtcbiAgICAgICAgY29uc3QgaGVhZGVycyA9IFtdO1xuICAgICAgICBjb25zdCBjb2x1bW5zID0gW107XG5cbiAgICAgICAgZm9yIChjb25zdCBjb2x1bW4gb2YgY29sdW1uTWdyQ29sdW1ucykge1xuICAgICAgICAgICAgaWYgKGNvbHVtbi50eXBlID09PSBcImljb25cIikgY29udGludWU7XG5cbiAgICAgICAgICAgIGhlYWRlcnMucHVzaChjb2x1bW4ubGFiZWwpO1xuICAgICAgICAgICAgY29sdW1ucy5wdXNoKGNvbHVtbik7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4geyBoZWFkZXJzOiBoZWFkZXJzLCBjb2x1bW5zOiBjb2x1bW5zIH07IFxuICAgIH1cbiAgICAvKipcbiAgICAgKiBDb252ZXJ0cyBncmlkIGRhdGEgaW4gRGF0YVBlcnNpc3RlbmNlIGNsYXNzIGludG8gYSBzaW5nbGUgZGltZW5zaW9uYWwgYXJyYXkgb2ZcbiAgICAgKiBzdHJpbmcgZGVsaW1pdGVkIHZhbHVlcyB0aGF0IHJlcHJlc2VudHMgYSByb3cgb2YgZGF0YSBpbiBhIGNzdiBmaWxlLiBcbiAgICAgKiBAcGFyYW0ge0FycmF5PE9iamVjdD59IGRhdGFzZXQgZGF0YSBzZXQgdG8gYnVpbGQgY3N2IHJvd3MuXG4gICAgICogQHJldHVybnMge0FycmF5PHN0cmluZz59XG4gICAgICovXG4gICAgYnVpbGRGaWxlQ29udGVudChkYXRhc2V0KSB7XG4gICAgICAgIGNvbnN0IGZpbGVDb250ZW50cyA9IFtdO1xuICAgICAgICBjb25zdCBjb2x1bW5zID0gdGhpcy5pZGVudGlmeUNvbHVtbnModGhpcy5jb250ZXh0LmNvbHVtbk1hbmFnZXIuY29sdW1ucyk7XG4gICAgICAgIC8vY3JlYXRlIGRlbGltaXRlZCBoZWFkZXIuXG4gICAgICAgIGZpbGVDb250ZW50cy5wdXNoKGNvbHVtbnMuaGVhZGVycy5qb2luKHRoaXMuZGVsaW1pdGVyKSk7XG4gICAgICAgIC8vY3JlYXRlIHJvdyBkYXRhXG4gICAgICAgIGZvciAoY29uc3Qgcm93RGF0YSBvZiBkYXRhc2V0KSB7XG4gICAgICAgICAgICBjb25zdCByZXN1bHQgPSBjb2x1bW5zLmNvbHVtbnMubWFwKChjKSA9PiB0aGlzLmZvcm1hdFZhbHVlKGMsIHJvd0RhdGEpKTtcblxuICAgICAgICAgICAgZmlsZUNvbnRlbnRzLnB1c2gocmVzdWx0LmpvaW4odGhpcy5kZWxpbWl0ZXIpKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBmaWxlQ29udGVudHM7XG4gICAgfVxuICAgIC8qKlxuICAgICAqIFJldHVybnMgYSBmb3JtYXR0ZWQgc3RyaW5nIGJhc2VkIG9uIHRoZSBDb2x1bW4ncyBmb3JtYXR0ZXIgc2V0dGluZy5cbiAgICAgKiBXaWxsIGRvdWJsZSBxdW90ZSBzdHJpbmcgaWYgY29tbWEgY2hhcmFjdGVyIGlzIGZvdW5kIGluIHZhbHVlLlxuICAgICAqIEBwYXJhbSB7Q29sdW1ufSBjb2x1bW4gY29sdW1uIG1vZGVsLlxuICAgICAqIEBwYXJhbSB7T2JqZWN0fSByb3dEYXRhIHJvdyBkYXRhLlxuICAgICAqIEByZXR1cm5zIHtzdHJpbmd9XG4gICAgICovXG4gICAgZm9ybWF0VmFsdWUoY29sdW1uLCByb3dEYXRhKSB7XG4gICAgICAgIGxldCB2YWx1ZSA9IFN0cmluZyhyb3dEYXRhW2NvbHVtbi5maWVsZF0pO1xuICAgICAgICAvL2FwcGx5IGxpbWl0ZWQgZm9ybWF0dGluZzsgY3N2IHJlc3VsdHMgc2hvdWxkIGJlICdyYXcnIGRhdGEuXG4gICAgICAgIGlmIChjb2x1bW4uZm9ybWF0dGVyKSB7XG4gICAgICAgICAgICBpZiAodHlwZW9mIGNvbHVtbi5mb3JtYXR0ZXIgPT09IFwiZnVuY3Rpb25cIikge1xuICAgICAgICAgICAgICAgIHZhbHVlID0gU3RyaW5nKGNvbHVtbi5mb3JtYXR0ZXIocm93RGF0YSwgY29sdW1uLmZvcm1hdHRlclBhcmFtcykpO1xuICAgICAgICAgICAgfSBlbHNlIGlmIChjb2x1bW4uZm9ybWF0dGVyID09PSBcIm1vZHVsZVwiKSB7XG4gICAgICAgICAgICAgICAgdmFsdWUgPSBTdHJpbmcodGhpcy5jb250ZXh0Lm1vZHVsZXNbY29sdW1uLmZvcm1hdHRlclBhcmFtcy5uYW1lXS5hcHBseShyb3dEYXRhLCBjb2x1bW4sIFwiY3N2XCIpKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICAvL2NoZWNrIGZvciBzdHJpbmdzIHRoYXQgbWF5IG5lZWQgdG8gYmUgcXVvdGVkLlxuICAgICAgICBpZiAodmFsdWUuaW5jbHVkZXMoXCIsXCIpKSB7XG4gICAgICAgICAgICB2YWx1ZSA9IGBcIiR7dmFsdWV9XCJgO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHZhbHVlO1xuICAgIH1cbn1cblxuQ3N2TW9kdWxlLm1vZHVsZU5hbWUgPSBcImNzdlwiO1xuXG5leHBvcnQgeyBDc3ZNb2R1bGUgfTsiLCJpbXBvcnQgeyBjc3NIZWxwZXIgfSBmcm9tIFwiLi4vLi4vLi4vY29tcG9uZW50cy9oZWxwZXJzL2Nzc0hlbHBlci5qc1wiO1xuaW1wb3J0IHsgRWxlbWVudEhlbHBlciB9IGZyb20gXCIuLi8uLi8uLi9jb21wb25lbnRzL2hlbHBlcnMvZWxlbWVudEhlbHBlci5qc1wiO1xuLyoqXG4gKiBDcmVhdGUgZmlsdGVyIG9iamVjdCB0aGF0IHJlcHJlc2VudHMgYSBlbGVtZW50IHRvIGZpbHRlciBiZXR3ZWVuIHR3byB2YWx1ZXMuICBDcmVhdGVzIGEgZHJvcGRvd24gd2l0aCBhIHR3byBpbnB1dCBib3hlcyBcbiAqIHRvIGVudGVyIHN0YXJ0IGFuZCBlbmQgdmFsdWVzLlxuICovXG5jbGFzcyBFbGVtZW50QmV0d2VlbiB7XG4gICAgLyoqXG4gICAgICogQ3JlYXRlIGZpbHRlciBvYmplY3QgdGhhdCByZXByZXNlbnRzIGEgYmV0d2VlbiBlbGVtZW50LlxuICAgICAqIEBwYXJhbSB7Q29sdW1ufSBjb2x1bW4gQ29sdW1uIGNsYXNzIG9iamVjdC5cbiAgICAgKiBAcGFyYW0ge0dyaWRDb250ZXh0fSBjb250ZXh0IEdyaWQgY29udGV4dCBvYmplY3QuXG4gICAgICovXG4gICAgY29uc3RydWN0b3IoY29sdW1uLCBjb250ZXh0KSB7XG4gICAgICAgIHRoaXMuY29udGV4dCA9IGNvbnRleHQ7XG4gICAgICAgIHRoaXMuZWxlbWVudCA9IEVsZW1lbnRIZWxwZXIuZGl2KHsgbmFtZTogY29sdW1uLmZpZWxkLCBjbGFzc05hbWU6IGNzc0hlbHBlci5tdWx0aVNlbGVjdC5wYXJlbnRDbGFzcyB9KTtcbiAgICAgICAgdGhpcy5oZWFkZXIgPSBFbGVtZW50SGVscGVyLmRpdih7IGNsYXNzTmFtZTogY3NzSGVscGVyLm11bHRpU2VsZWN0LmhlYWRlciB9KTtcbiAgICAgICAgdGhpcy5vcHRpb25zQ29udGFpbmVyID0gRWxlbWVudEhlbHBlci5kaXYoeyBjbGFzc05hbWU6IGNzc0hlbHBlci5tdWx0aVNlbGVjdC5vcHRpb25zIH0pO1xuICAgICAgICB0aGlzLmZpZWxkID0gY29sdW1uLmZpZWxkO1xuICAgICAgICB0aGlzLmZpZWxkVHlwZSA9IGNvbHVtbi50eXBlOyAgLy9maWVsZCB2YWx1ZSB0eXBlLlxuICAgICAgICB0aGlzLmZpbHRlclR5cGUgPSBcImJldHdlZW5cIjsgIC8vY29uZGl0aW9uIHR5cGUuXG5cbiAgICAgICAgdGhpcy5lbGVtZW50LmlkID0gYCR7dGhpcy5jb250ZXh0LnNldHRpbmdzLmJhc2VJZE5hbWV9XyR7dGhpcy5maWVsZH1gO1xuICAgICAgICB0aGlzLmVsZW1lbnQuYXBwZW5kKHRoaXMuaGVhZGVyLCB0aGlzLm9wdGlvbnNDb250YWluZXIpO1xuICAgICAgICB0aGlzLmhlYWRlci5pZCA9IGBoZWFkZXJfJHt0aGlzLmNvbnRleHQuc2V0dGluZ3MuYmFzZUlkTmFtZX1fJHt0aGlzLmZpZWxkfWA7XG4gICAgICAgIHRoaXMub3B0aW9uc0NvbnRhaW5lci5zdHlsZS5taW5XaWR0aCA9IFwiMTg1cHhcIjtcblxuICAgICAgICB0aGlzLiN0ZW1wbGF0ZUJldHdlZW4oKTtcbiAgICAgICAgdGhpcy5oZWFkZXIuYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsIHRoaXMuaGFuZGxlQ2xpY2spO1xuICAgIH1cblxuICAgICN0ZW1wbGF0ZUJldHdlZW4oKSB7XG4gICAgICAgIHRoaXMuZWxlbWVudFN0YXJ0ID0gRWxlbWVudEhlbHBlci5pbnB1dCh7IGNsYXNzTmFtZTogY3NzSGVscGVyLmlucHV0LCBpZDogYHN0YXJ0XyR7dGhpcy5jb250ZXh0LnNldHRpbmdzLmJhc2VJZE5hbWV9XyR7dGhpcy5maWVsZH1gIH0pO1xuXG4gICAgICAgIHRoaXMuZWxlbWVudEVuZCA9IEVsZW1lbnRIZWxwZXIuaW5wdXQoeyBjbGFzc05hbWU6IGNzc0hlbHBlci5pbnB1dCwgaWQ6IGBlbmRfJHt0aGlzLmNvbnRleHQuc2V0dGluZ3MuYmFzZUlkTmFtZX1fJHt0aGlzLmZpZWxkfWAgfSk7XG4gICAgICAgIHRoaXMuZWxlbWVudEVuZC5zdHlsZS5tYXJnaW5Cb3R0b20gPSBcIjEwcHhcIjtcblxuICAgICAgICBjb25zdCBzdGFydCA9IEVsZW1lbnRIZWxwZXIuc3Bhbih7IGlubmVyVGV4dDogXCJTdGFydFwiLCBjbGFzc05hbWU6IGNzc0hlbHBlci5iZXR3ZWVuTGFiZWwgfSk7XG4gICAgICAgIGNvbnN0IGVuZCA9ICBFbGVtZW50SGVscGVyLnNwYW4oeyBpbm5lclRleHQ6IFwiRW5kXCIsIGNsYXNzTmFtZTogY3NzSGVscGVyLmJldHdlZW5MYWJlbCB9KTtcbiBcbiAgICAgICAgY29uc3QgYnRuQXBwbHkgPSBFbGVtZW50SGVscGVyLmNyZWF0ZShcImJ1dHRvblwiLCB7IGlubmVyVGV4dDogXCJBcHBseVwiLCBjbGFzc05hbWU6IGNzc0hlbHBlci5iZXR3ZWVuQnV0dG9uIH0pO1xuICAgICAgICBidG5BcHBseS5zdHlsZS5tYXJnaW5SaWdodCA9IFwiMTBweFwiO1xuICAgICAgICBidG5BcHBseS5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgdGhpcy5oYW5kbGVyQ2xpY2spO1xuXG4gICAgICAgIGNvbnN0IGJ0bkNsZWFyID0gRWxlbWVudEhlbHBlci5jcmVhdGUoXCJidXR0b25cIiwgeyBpbm5lclRleHQ6IFwiQ2xlYXJcIiwgY2xhc3NOYW1lOiBjc3NIZWxwZXIuYmV0d2VlbkJ1dHRvbiB9KTtcbiAgICAgICAgYnRuQ2xlYXIuYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsIHRoaXMuaGFuZGxlQnV0dG9uQ2xlYXIpO1xuXG4gICAgICAgIHRoaXMub3B0aW9uc0NvbnRhaW5lci5hcHBlbmQoc3RhcnQsIHRoaXMuZWxlbWVudFN0YXJ0LCBlbmQsIHRoaXMuZWxlbWVudEVuZCwgYnRuQXBwbHksIGJ0bkNsZWFyKTtcbiAgICB9XG5cbiAgICBoYW5kbGVCdXR0b25DbGVhciA9ICgpID0+IHtcbiAgICAgICAgdGhpcy5lbGVtZW50U3RhcnQudmFsdWUgPSBcIlwiO1xuICAgICAgICB0aGlzLmVsZW1lbnRFbmQudmFsdWUgPSBcIlwiO1xuXG4gICAgICAgIGlmICh0aGlzLmNvdW50TGFiZWwgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgdGhpcy5jb3VudExhYmVsLnJlbW92ZSgpO1xuICAgICAgICAgICAgdGhpcy5jb3VudExhYmVsID0gdW5kZWZpbmVkO1xuICAgICAgICB9XG4gICAgfTtcblxuICAgIGNyZWF0ZUNvdW50TGFiZWwgPSAoKSA9PiB7XG4gICAgICAgIC8vdXBkYXRlIGNvdW50IGxhYmVsLlxuICAgICAgICBpZiAodGhpcy5jb3VudExhYmVsID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgIHRoaXMuY291bnRMYWJlbCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJzcGFuXCIpO1xuICAgICAgICAgICAgdGhpcy5jb3VudExhYmVsLmNsYXNzTmFtZSA9IGNzc0hlbHBlci5tdWx0aVNlbGVjdC5oZWFkZXJPcHRpb247XG4gICAgICAgICAgICB0aGlzLmhlYWRlci5hcHBlbmQodGhpcy5jb3VudExhYmVsKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICh0aGlzLmVsZW1lbnRTdGFydC52YWx1ZSAhPT0gXCJcIiAmJiB0aGlzLmVsZW1lbnRFbmQudmFsdWUgIT09IFwiXCIpIHtcbiAgICAgICAgICAgIHRoaXMuY291bnRMYWJlbC5pbm5lclRleHQgPSBgJHt0aGlzLmVsZW1lbnRTdGFydC52YWx1ZX0gdG8gJHt0aGlzLmVsZW1lbnRFbmQudmFsdWV9YDtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHRoaXMuY291bnRMYWJlbC5yZW1vdmUoKTtcbiAgICAgICAgICAgIHRoaXMuY291bnRMYWJlbCA9IHVuZGVmaW5lZDtcbiAgICAgICAgfVxuICAgIH07XG5cbiAgICBoYW5kbGVDbGljayA9IGFzeW5jICgpID0+IHtcbiAgICAgICAgY29uc3Qgc3RhdHVzID0gdGhpcy5oZWFkZXIuY2xhc3NMaXN0LnRvZ2dsZShjc3NIZWxwZXIubXVsdGlTZWxlY3QuaGVhZGVyQWN0aXZlKTtcblxuICAgICAgICBpZiAoIXN0YXR1cykge1xuICAgICAgICAgICAgLy9DbG9zZSB3aW5kb3cgYW5kIGFwcGx5IGZpbHRlciB2YWx1ZS5cbiAgICAgICAgICAgIHRoaXMuY3JlYXRlQ291bnRMYWJlbCgpO1xuICAgICAgICAgICAgYXdhaXQgdGhpcy5jb250ZXh0LmV2ZW50cy50cmlnZ2VyKFwicmVuZGVyXCIpO1xuICAgICAgICAgICAgZG9jdW1lbnQucmVtb3ZlRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsIHRoaXMuaGFuZGxlRG9jdW1lbnQpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsIHRoaXMuaGFuZGxlRG9jdW1lbnQpO1xuICAgICAgICB9XG4gICAgfTtcbiAgICAvKipcbiAgICAgKiBIYW5kbGVyIGV2ZW50IHRvIGNsb3NlIGRyb3Bkb3duIHdoZW4gdXNlciBjbGlja3Mgb3V0c2lkZSB0aGUgbXVsdGktc2VsZWN0IGNvbnRyb2wuICBFdmVudCBpcyByZW1vdmVkIHdoZW4gbXVsdGktc2VsZWN0IGlzIFxuICAgICAqIG5vdCBhY3RpdmUgc28gdGhhdCBpdCdzIG5vdCBmaXJpbmcgb24gcmVkdW5kYW50IGV2ZW50cy5cbiAgICAgKiBAcGFyYW0ge09iamVjdH0gZSBPYmplY3QgdGhhdCB0cmlnZ2VyZWQgZXZlbnQuXG4gICAgICovXG4gICAgaGFuZGxlRG9jdW1lbnQgPSBhc3luYyAoZSkgPT4ge1xuICAgICAgICBpZiAoIWUudGFyZ2V0LmNsb3Nlc3QoXCIuZGF0YWdyaWRzLWlucHV0XCIpICYmICFlLnRhcmdldC5jbG9zZXN0KGAjJHt0aGlzLmhlYWRlci5pZH1gKSkge1xuICAgICAgICAgICAgdGhpcy5oZWFkZXIuY2xhc3NMaXN0LnJlbW92ZShjc3NIZWxwZXIubXVsdGlTZWxlY3QuaGVhZGVyQWN0aXZlKTtcblxuICAgICAgICAgICAgYXdhaXQgdGhpcy5jb250ZXh0LmV2ZW50cy50cmlnZ2VyKFwicmVuZGVyXCIpO1xuXG4gICAgICAgICAgICBkb2N1bWVudC5yZW1vdmVFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgdGhpcy5oYW5kbGVEb2N1bWVudCk7XG4gICAgICAgIH1cbiAgICB9O1xuICAgIC8qKlxuICAgICAqIFJldHVybnMgYW4gYXJyYXkgb2YgdGhlIHN0YXJ0IGFuZCBlbmQgdmFsdWVzIGZyb20gaW5wdXQgc291cmNlLiAgSWYgZWl0aGVyIGlucHV0IHNvdXJjZSBpcyBlbXB0eSwgYW4gZW1wdHkgc3RyaW5nIHdpbGwgYmUgcmV0dXJuZWQuXG4gICAgICogQHJldHVybnMge0FycmF5IHwgc3RyaW5nfSBBcnJheSBvZiBzdGFydCBhbmQgZW5kIHZhbHVlcyBvciBlbXB0eSBzdHJpbmcuXG4gICAgICovXG4gICAgZ2V0IHZhbHVlKCkge1xuICAgICAgICBpZiAodGhpcy5lbGVtZW50U3RhcnQudmFsdWUgPT09IFwiXCIgfHwgdGhpcy5lbGVtZW50RW5kLnZhbHVlID09PSBcIlwiKSByZXR1cm4gXCJcIjtcblxuICAgICAgICByZXR1cm4gW3RoaXMuZWxlbWVudFN0YXJ0LnZhbHVlLCB0aGlzLmVsZW1lbnRFbmQudmFsdWVdO1xuICAgIH1cbn1cblxuZXhwb3J0IHsgRWxlbWVudEJldHdlZW4gfTsiLCIvKipcbiAqIFJlcHJlc2VudHMgYSBjb2x1bW5zIGZpbHRlciBjb250cm9sLiAgQ3JlYXRlcyBhIGBIVE1MSW5wdXRFbGVtZW50YCB0aGF0IGlzIGFkZGVkIHRvIHRoZSBoZWFkZXIgcm93IG9mIFxuICogdGhlIGdyaWQgdG8gZmlsdGVyIGRhdGEgc3BlY2lmaWMgdG8gaXRzIGRlZmluZWQgY29sdW1uLiBcbiAqL1xuY2xhc3MgRWxlbWVudElucHV0IHtcbiAgICAvKipcbiAgICAgKiBDcmVhdGUgZmlsdGVyIG9iamVjdCB0aGF0IHJlcHJlc2VudHMgYSBgSFRNTFNlbGVjdEVsZW1lbnRgIGVsZW1lbnQgaW4gdGhlIHRhYmxlJ3MgaGVhZGVyIHJvdy5cbiAgICAgKiBAcGFyYW0ge0NvbHVtbn0gY29sdW1uIENvbHVtbiBjbGFzcyBvYmplY3QuXG4gICAgICogQHBhcmFtIHtHcmlkQ29udGV4dH0gY29udGV4dCBHcmlkIGNvbnRleHQuXG4gICAgKi9cbiAgICBjb25zdHJ1Y3Rvcihjb2x1bW4sIGNvbnRleHQpIHtcbiAgICAgICAgdGhpcy5lbGVtZW50ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImlucHV0XCIpO1xuICAgICAgICB0aGlzLmNvbnRleHQgPSBjb250ZXh0O1xuICAgICAgICB0aGlzLmZpZWxkID0gY29sdW1uLmZpZWxkO1xuICAgICAgICB0aGlzLmZpZWxkVHlwZSA9IGNvbHVtbi50eXBlOyAgLy9maWVsZCB2YWx1ZSB0eXBlLlxuICAgICAgICB0aGlzLmZpbHRlclR5cGUgPSBjb2x1bW4uZmlsdGVyVHlwZTsgIC8vY29uZGl0aW9uIHR5cGUuXG4gICAgICAgIHRoaXMuZmlsdGVySXNGdW5jdGlvbiA9ICh0eXBlb2YgY29sdW1uPy5maWx0ZXJUeXBlID09PSBcImZ1bmN0aW9uXCIpO1xuICAgICAgICB0aGlzLmZpbHRlclBhcmFtcyA9IGNvbHVtbi5maWx0ZXJQYXJhbXM7XG4gICAgICAgIHRoaXMuZWxlbWVudC5uYW1lID0gdGhpcy5maWVsZDtcbiAgICAgICAgdGhpcy5lbGVtZW50LmlkID0gdGhpcy5maWVsZDtcbiAgICAgICAgdGhpcy5lbGVtZW50LmFkZEV2ZW50TGlzdGVuZXIoXCJjaGFuZ2VcIiwgYXN5bmMgKCkgPT4gYXdhaXQgdGhpcy5jb250ZXh0LmV2ZW50cy50cmlnZ2VyKFwicmVuZGVyXCIpKTtcblxuICAgICAgICBpZiAoY29sdW1uLmZpbHRlckNzcykge1xuICAgICAgICAgICAgdGhpcy5lbGVtZW50LmNsYXNzTmFtZSA9IGNvbHVtbi5maWx0ZXJDc3M7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoIXRoaXMuY29udGV4dC5zZXR0aW5ncy5yZW1vdGVQcm9jZXNzaW5nICYmIGNvbHVtbi5maWx0ZXJSZWFsVGltZSkge1xuICAgICAgICAgICAgdGhpcy5yZWFsVGltZVRpbWVvdXQgPSAodHlwZW9mIHRoaXMuZmlsdGVyUmVhbFRpbWUgPT09IFwibnVtYmVyXCIpIFxuICAgICAgICAgICAgICAgID8gdGhpcy5maWx0ZXJSZWFsVGltZSBcbiAgICAgICAgICAgICAgICA6IDUwMDtcblxuICAgICAgICAgICAgdGhpcy5lbGVtZW50LmFkZEV2ZW50TGlzdGVuZXIoXCJrZXl1cFwiLCB0aGlzLmhhbmRsZUxpdmVGaWx0ZXIpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgaGFuZGxlTGl2ZUZpbHRlciA9IGFzeW5jICgpID0+IHtcbiAgICAgICAgc2V0VGltZW91dChhc3luYyAoKSA9PiBhd2FpdCB0aGlzLmNvbnRleHQuZXZlbnRzLnRyaWdnZXIoXCJyZW5kZXJcIiksIHRoaXMucmVhbFRpbWVUaW1lb3V0KTtcbiAgICB9O1xuICAgIC8qKlxuICAgICAqIFJldHVybnMgdGhlIHZhbHVlIG9mIHRoZSBpbnB1dCBlbGVtZW50LiAgV2lsbCByZXR1cm4gYSBzdHJpbmcgdmFsdWUuXG4gICAgICogQHJldHVybnMge3N0cmluZ31cbiAgICAgKi9cbiAgICBnZXQgdmFsdWUoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmVsZW1lbnQudmFsdWU7XG4gICAgfVxufVxuXG5leHBvcnQgeyBFbGVtZW50SW5wdXQgfTsiLCJpbXBvcnQgeyBFbGVtZW50SGVscGVyIH0gZnJvbSBcIi4uLy4uLy4uL2NvbXBvbmVudHMvaGVscGVycy9lbGVtZW50SGVscGVyLmpzXCI7XG4vKipcbiAqIFJlcHJlc2VudHMgYSBjb2x1bW5zIGZpbHRlciBjb250cm9sLiAgQ3JlYXRlcyBhIGBIVE1MU2VsZWN0RWxlbWVudGAgdGhhdCBpcyBhZGRlZCB0byB0aGUgaGVhZGVyIHJvdyBvZiB0aGUgZ3JpZCB0byBmaWx0ZXIgZGF0YSBcbiAqIHNwZWNpZmljIHRvIGl0cyBkZWZpbmVkIGNvbHVtbi4gIElmIGBmaWx0ZXJWYWx1ZXNSZW1vdGVTb3VyY2VgIGlzIGRlZmluZWQsIHRoZSBzZWxlY3Qgb3B0aW9ucyB3aWxsIGJlIHBvcHVsYXRlZCBieSB0aGUgZGF0YSByZXR1cm5lZCBcbiAqIGZyb20gdGhlIHJlbW90ZSBzb3VyY2UgYnkgcmVnaXN0ZXJpbmcgdG8gdGhlIGdyaWQgcGlwZWxpbmUncyBgaW5pdGAgYW5kIGByZWZyZXNoYCBldmVudHMuXG4gKi9cbmNsYXNzIEVsZW1lbnRTZWxlY3Qge1xuICAgIC8qKlxuICAgICAqIENyZWF0ZSBmaWx0ZXIgb2JqZWN0IHRoYXQgcmVwcmVzZW50cyBhIGBIVE1MU2VsZWN0RWxlbWVudGAgZWxlbWVudCBpbiB0aGUgdGFibGUncyBoZWFkZXIgcm93LlxuICAgICAqIEBwYXJhbSB7Q29sdW1ufSBjb2x1bW4gQ29sdW1uIGNsYXNzIG9iamVjdC5cbiAgICAgKiBAcGFyYW0ge0dyaWRDb250ZXh0fSBjb250ZXh0IEdyaWQgY29udGV4dC4gXG4gICAgICovXG4gICAgY29uc3RydWN0b3IoY29sdW1uLCBjb250ZXh0KSB7XG4gICAgICAgIHRoaXMuZWxlbWVudCA9IEVsZW1lbnRIZWxwZXIuY3JlYXRlKFwic2VsZWN0XCIsIHsgbmFtZTogY29sdW1uLmZpZWxkIH0pO1xuICAgICAgICB0aGlzLmZpZWxkID0gY29sdW1uLmZpZWxkO1xuICAgICAgICB0aGlzLmZpZWxkVHlwZSA9IGNvbHVtbi50eXBlOyAgLy9maWVsZCB2YWx1ZSB0eXBlLlxuICAgICAgICB0aGlzLmZpbHRlclR5cGUgPSBjb2x1bW4uZmlsdGVyVHlwZTsgIC8vY29uZGl0aW9uIHR5cGUuXG4gICAgICAgIHRoaXMuZmlsdGVySXNGdW5jdGlvbiA9ICh0eXBlb2YgY29sdW1uPy5maWx0ZXJUeXBlID09PSBcImZ1bmN0aW9uXCIpO1xuICAgICAgICB0aGlzLmZpbHRlclBhcmFtcyA9IGNvbHVtbi5maWx0ZXJQYXJhbXM7XG4gICAgICAgIHRoaXMucGlwZWxpbmUgPSBjb250ZXh0LnBpcGVsaW5lO1xuICAgICAgICB0aGlzLmNvbnRleHQgPSBjb250ZXh0O1xuXG4gICAgICAgIHRoaXMuZWxlbWVudC5pZCA9IGAke2NvbHVtbi5zZXR0aW5ncy5iYXNlSWROYW1lfV8ke3RoaXMuZmllbGR9YDtcbiAgICAgICAgdGhpcy5lbGVtZW50LmFkZEV2ZW50TGlzdGVuZXIoXCJjaGFuZ2VcIiwgYXN5bmMgKCkgPT4gYXdhaXQgdGhpcy5jb250ZXh0LmV2ZW50cy50cmlnZ2VyKFwicmVuZGVyXCIpKTtcblxuICAgICAgICBpZiAoY29sdW1uLmZpbHRlckNzcykge1xuICAgICAgICAgICAgdGhpcy5lbGVtZW50LmNsYXNzTmFtZSA9IGNvbHVtbi5maWx0ZXJDc3M7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoY29sdW1uLmZpbHRlclZhbHVlc1JlbW90ZVNvdXJjZSkge1xuICAgICAgICAgICAgLy9zZXQgdXAgcGlwZWxpbmUgdG8gcmV0cmlldmUgb3B0aW9uIGRhdGEgd2hlbiBpbml0IHBpcGVsaW5lIGlzIGNhbGxlZC5cbiAgICAgICAgICAgIHRoaXMucGlwZWxpbmUuYWRkU3RlcChcImluaXRcIiwgdGhpcy5jcmVhdGVTZWxlY3RPcHRpb25zLCBjb2x1bW4uZmlsdGVyVmFsdWVzUmVtb3RlU291cmNlKTtcbiAgICAgICAgICAgIHRoaXMucGlwZWxpbmUuYWRkU3RlcChcInJlZnJlc2hcIiwgdGhpcy5yZWZyZXNoU2VsZWN0T3B0aW9ucywgY29sdW1uLmZpbHRlclZhbHVlc1JlbW90ZVNvdXJjZSk7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH0gXG4gICAgICAgIC8vdXNlIHVzZXIgc3VwcGxpZWQgdmFsdWVzIHRvIGNyZWF0ZSBzZWxlY3Qgb3B0aW9ucy5cbiAgICAgICAgY29uc3Qgb3B0cyA9IEFycmF5LmlzQXJyYXkoY29sdW1uLmZpbHRlclZhbHVlcykgXG4gICAgICAgICAgICA/IGNvbHVtbi5maWx0ZXJWYWx1ZXNcbiAgICAgICAgICAgIDogT2JqZWN0LmVudHJpZXMoY29sdW1uLmZpbHRlclZhbHVlcykubWFwKChba2V5LCB2YWx1ZV0pID0+ICh7IHZhbHVlOiBrZXksIHRleHQ6IHZhbHVlfSkpO1xuXG4gICAgICAgIHRoaXMuY3JlYXRlU2VsZWN0T3B0aW9ucyhvcHRzKTtcbiAgICB9XG4gICAgLyoqXG4gICAgICogQnVpbGRzIG9wdGlvbiBlbGVtZW50cyBmb3IgY2xhc3MncyBgc2VsZWN0YCBpbnB1dC4gIEV4cGVjdHMgYW4gYXJyYXkgb2Ygb2JqZWN0cyB3aXRoIGtleS92YWx1ZSBwYWlycyBvZjpcbiAgICAgKiAgKiBgdmFsdWVgOiBvcHRpb24gdmFsdWUuICBzaG91bGQgYmUgYSBwcmltYXJ5IGtleSB0eXBlIHZhbHVlIHdpdGggbm8gYmxhbmsgc3BhY2VzLlxuICAgICAqICAqIGB0ZXh0YDogb3B0aW9uIHRleHQgdmFsdWVcbiAgICAgKiBAcGFyYW0ge0FycmF5PG9iamVjdD59IGRhdGEga2V5L3ZhbHVlIGFycmF5IG9mIHZhbHVlcy5cbiAgICAgKi9cbiAgICBjcmVhdGVTZWxlY3RPcHRpb25zID0gKGRhdGEpID0+IHtcbiAgICAgICAgY29uc3QgZmlyc3QgPSBFbGVtZW50SGVscGVyLmNyZWF0ZShcIm9wdGlvblwiLCB7IHZhbHVlOiBcIlwiLCB0ZXh0OiBcIlNlbGVjdCBhbGxcIiB9KTtcblxuICAgICAgICB0aGlzLmVsZW1lbnQuYXBwZW5kKGZpcnN0KTtcblxuICAgICAgICBmb3IgKGNvbnN0IGl0ZW0gb2YgZGF0YSkge1xuICAgICAgICAgICAgY29uc3Qgb3B0aW9uID0gRWxlbWVudEhlbHBlci5jcmVhdGUoXCJvcHRpb25cIiwgeyB2YWx1ZTogaXRlbS52YWx1ZSwgdGV4dDogaXRlbS50ZXh0IH0pO1xuXG4gICAgICAgICAgICB0aGlzLmVsZW1lbnQuYXBwZW5kKG9wdGlvbik7XG4gICAgICAgIH1cbiAgICB9O1xuICAgIC8qKlxuICAgICAqIFJlcGxhY2VzL3VwZGF0ZXMgb3B0aW9uIGVsZW1lbnRzIGZvciBjbGFzcydzIGBzZWxlY3RgIGlucHV0LiAgV2lsbCBwZXJzaXN0IHRoZSBjdXJyZW50IHNlbGVjdCB2YWx1ZSwgaWYgYW55LiAgXG4gICAgICogRXhwZWN0cyBhbiBhcnJheSBvZiBvYmplY3RzIHdpdGgga2V5L3ZhbHVlIHBhaXJzIG9mOlxuICAgICAqICAqIGB2YWx1ZWA6IE9wdGlvbiB2YWx1ZS4gIFNob3VsZCBiZSBhIHByaW1hcnkga2V5IHR5cGUgdmFsdWUgd2l0aCBubyBibGFuayBzcGFjZXMuXG4gICAgICogICogYHRleHRgOiBPcHRpb24gdGV4dC5cbiAgICAgKiBAcGFyYW0ge0FycmF5PG9iamVjdD59IGRhdGEga2V5L3ZhbHVlIGFycmF5IG9mIHZhbHVlcy5cbiAgICAgKi9cbiAgICByZWZyZXNoU2VsZWN0T3B0aW9ucyA9IChkYXRhKSA9PiB7XG4gICAgICAgIGNvbnN0IHNlbGVjdGVkVmFsdWUgPSB0aGlzLmVsZW1lbnQudmFsdWU7XG5cbiAgICAgICAgdGhpcy5lbGVtZW50LnJlcGxhY2VDaGlsZHJlbigpO1xuICAgICAgICB0aGlzLmNyZWF0ZVNlbGVjdE9wdGlvbnMoZGF0YSk7XG4gICAgICAgIHRoaXMuZWxlbWVudC52YWx1ZSA9IHNlbGVjdGVkVmFsdWU7XG4gICAgfTtcblxuICAgIGdldCB2YWx1ZSgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuZWxlbWVudC52YWx1ZTtcbiAgICB9XG59XG5cbmV4cG9ydCB7IEVsZW1lbnRTZWxlY3QgfTsiLCJpbXBvcnQgeyBjc3NIZWxwZXIgfSBmcm9tIFwiLi4vLi4vLi4vY29tcG9uZW50cy9oZWxwZXJzL2Nzc0hlbHBlci5qc1wiO1xuaW1wb3J0IHsgRWxlbWVudEhlbHBlciB9IGZyb20gXCIuLi8uLi8uLi9jb21wb25lbnRzL2hlbHBlcnMvZWxlbWVudEhlbHBlci5qc1wiO1xuLyoqXG4gKiBDcmVhdGUgZmlsdGVyIG9iamVjdCB0aGF0IHJlcHJlc2VudHMgYSBtdWx0aS1zZWxlY3QgZWxlbWVudC4gIENyZWF0ZXMgYSBkcm9wZG93biB3aXRoIGEgbGlzdCBvZiBvcHRpb25zIHRoYXQgY2FuIGJlIFxuICogc2VsZWN0ZWQgb3IgZGVzZWxlY3RlZC4gIElmIGBmaWx0ZXJWYWx1ZXNSZW1vdGVTb3VyY2VgIGlzIGRlZmluZWQsIHRoZSBzZWxlY3Qgb3B0aW9ucyB3aWxsIGJlIHBvcHVsYXRlZCBieSB0aGUgZGF0YSByZXR1cm5lZCBcbiAqIGZyb20gdGhlIHJlbW90ZSBzb3VyY2UgYnkgcmVnaXN0ZXJpbmcgdG8gIHRoZSBncmlkIHBpcGVsaW5lJ3MgYGluaXRgIGFuZCBgcmVmcmVzaGAgZXZlbnRzLlxuICovXG5jbGFzcyBFbGVtZW50TXVsdGlTZWxlY3Qge1xuICAgIC8qKlxuICAgICAqIENyZWF0ZSBmaWx0ZXIgb2JqZWN0IHRoYXQgcmVwcmVzZW50cyBhIG11bHRpLXNlbGVjdCBlbGVtZW50LlxuICAgICAqIEBwYXJhbSB7Q29sdW1ufSBjb2x1bW4gQ29sdW1uIGNsYXNzIG9iamVjdC5cbiAgICAgKiBAcGFyYW0ge0dyaWRDb250ZXh0fSBjb250ZXh0IEdyaWQgY29udGV4dCBvYmplY3QuXG4gICAgICovXG4gICAgY29uc3RydWN0b3IoY29sdW1uLCBjb250ZXh0KSB7XG4gICAgICAgIHRoaXMuY29udGV4dCA9IGNvbnRleHQ7XG4gICAgICAgIHRoaXMuZWxlbWVudCA9IEVsZW1lbnRIZWxwZXIuZGl2KHsgbmFtZTogY29sdW1uLmZpZWxkLCBjbGFzc05hbWU6IGNzc0hlbHBlci5tdWx0aVNlbGVjdC5wYXJlbnRDbGFzcyB9KTtcbiAgICAgICAgdGhpcy5oZWFkZXIgPSBFbGVtZW50SGVscGVyLmRpdih7IGNsYXNzTmFtZTogY3NzSGVscGVyLm11bHRpU2VsZWN0LmhlYWRlciB9KTtcbiAgICAgICAgdGhpcy5vcHRpb25zQ29udGFpbmVyID0gRWxlbWVudEhlbHBlci5kaXYoeyBjbGFzc05hbWU6IGNzc0hlbHBlci5tdWx0aVNlbGVjdC5vcHRpb25zIH0pO1xuICAgICAgICB0aGlzLmZpZWxkID0gY29sdW1uLmZpZWxkO1xuICAgICAgICB0aGlzLmZpZWxkVHlwZSA9IGNvbHVtbi50eXBlOyAgLy9maWVsZCB2YWx1ZSB0eXBlLlxuICAgICAgICB0aGlzLmZpbHRlclR5cGUgPSBcImluXCI7ICAvL2NvbmRpdGlvbiB0eXBlLlxuICAgICAgICB0aGlzLmZpbHRlcklzRnVuY3Rpb24gPSAodHlwZW9mIGNvbHVtbj8uZmlsdGVyVHlwZSA9PT0gXCJmdW5jdGlvblwiKTtcbiAgICAgICAgdGhpcy5maWx0ZXJQYXJhbXMgPSBjb2x1bW4uZmlsdGVyUGFyYW1zO1xuICAgICAgICB0aGlzLmxpc3RBbGwgPSBmYWxzZTtcbiAgICAgICAgdGhpcy5zZWxlY3RlZFZhbHVlcyA9IFtdO1xuXG4gICAgICAgIGlmICh0eXBlb2YgY29sdW1uLmZpbHRlck11bHRpU2VsZWN0ID09PSBcIm9iamVjdFwiKSB7XG4gICAgICAgICAgICB0aGlzLmxpc3RBbGwgPSBjb2x1bW4uZmlsdGVyTXVsdGlTZWxlY3QubGlzdEFsbDtcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMuaGVhZGVyLmlkID0gYGhlYWRlcl8ke3RoaXMuY29udGV4dC5zZXR0aW5ncy5iYXNlSWROYW1lfV8ke3RoaXMuZmllbGR9YDtcbiAgICAgICAgdGhpcy5lbGVtZW50LmlkID0gYCR7dGhpcy5jb250ZXh0LnNldHRpbmdzLmJhc2VJZE5hbWV9XyR7dGhpcy5maWVsZH1gO1xuICAgICAgICB0aGlzLmVsZW1lbnQuYXBwZW5kKHRoaXMuaGVhZGVyLCB0aGlzLm9wdGlvbnNDb250YWluZXIpO1xuXG4gICAgICAgIGlmIChjb2x1bW4uZmlsdGVyVmFsdWVzUmVtb3RlU291cmNlKSB7XG4gICAgICAgICAgICAvL3NldCB1cCBwaXBlbGluZSB0byByZXRyaWV2ZSBvcHRpb24gZGF0YSB3aGVuIGluaXQgcGlwZWxpbmUgaXMgY2FsbGVkLlxuICAgICAgICAgICAgdGhpcy5jb250ZXh0LnBpcGVsaW5lLmFkZFN0ZXAoXCJpbml0XCIsIHRoaXMudGVtcGxhdGVDb250YWluZXIsIGNvbHVtbi5maWx0ZXJWYWx1ZXNSZW1vdGVTb3VyY2UpO1xuICAgICAgICAgICAgdGhpcy5jb250ZXh0LnBpcGVsaW5lLmFkZFN0ZXAoXCJyZWZyZXNoXCIsIHRoaXMucmVmcmVzaFNlbGVjdE9wdGlvbnMsIGNvbHVtbi5maWx0ZXJWYWx1ZXNSZW1vdGVTb3VyY2UpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgLy91c2UgdXNlciBzdXBwbGllZCB2YWx1ZXMgdG8gY3JlYXRlIHNlbGVjdCBvcHRpb25zLlxuICAgICAgICAgICAgY29uc3QgZGF0YSA9IEFycmF5LmlzQXJyYXkoY29sdW1uLmZpbHRlclZhbHVlcykgXG4gICAgICAgICAgICAgICAgPyBjb2x1bW4uZmlsdGVyVmFsdWVzXG4gICAgICAgICAgICAgICAgOiBPYmplY3QuZW50cmllcyhjb2x1bW4uZmlsdGVyVmFsdWVzKS5tYXAoKFtrZXksIHZhbHVlXSkgPT4gKHsgdmFsdWU6IGtleSwgdGV4dDogdmFsdWV9KSk7XG5cbiAgICAgICAgICAgIHRoaXMudGVtcGxhdGVDb250YWluZXIoZGF0YSk7XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLmhlYWRlci5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgdGhpcy5oYW5kbGVDbGljayk7XG4gICAgfVxuXG4gICAgaGFuZGxlQ2xpY2sgPSBhc3luYyAoKSA9PiB7XG4gICAgICAgIGNvbnN0IHN0YXR1cyA9IHRoaXMuaGVhZGVyLmNsYXNzTGlzdC50b2dnbGUoY3NzSGVscGVyLm11bHRpU2VsZWN0LmhlYWRlckFjdGl2ZSk7XG5cbiAgICAgICAgaWYgKCFzdGF0dXMpIHtcbiAgICAgICAgICAgIGF3YWl0IHRoaXMuY29udGV4dC5ldmVudHMudHJpZ2dlcihcInJlbmRlclwiKTtcbiAgICAgICAgICAgIGRvY3VtZW50LnJlbW92ZUV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCB0aGlzLmhhbmRsZURvY3VtZW50KTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCB0aGlzLmhhbmRsZURvY3VtZW50KTtcbiAgICAgICAgfVxuICAgIH07XG4gICAgLyoqXG4gICAgICogSGFuZGxlciBldmVudCB0byBjbG9zZSBkcm9wZG93biB3aGVuIHVzZXIgY2xpY2tzIG91dHNpZGUgdGhlIG11bHRpLXNlbGVjdCBjb250cm9sLiAgRXZlbnQgaXMgcmVtb3ZlZCB3aGVuIG11bHRpLXNlbGVjdCBcbiAgICAgKiBpcyBub3QgYWN0aXZlIHNvIHRoYXQgaXQncyBub3QgZmlyaW5nIG9uIHJlZHVuZGFudCBldmVudHMuXG4gICAgICogQHBhcmFtIHtPYmplY3R9IGUgT2JqZWN0IHRoYXQgdHJpZ2dlcmVkIGV2ZW50LlxuICAgICAqL1xuICAgIGhhbmRsZURvY3VtZW50ID0gYXN5bmMgKGUpID0+IHtcbiAgICAgICAgaWYgKCFlLnRhcmdldC5jbG9zZXN0KFwiLlwiICsgY3NzSGVscGVyLm11bHRpU2VsZWN0Lm9wdGlvbikgJiYgIWUudGFyZ2V0LmNsb3Nlc3QoYCMke3RoaXMuaGVhZGVyLmlkfWApKSB7XG4gICAgICAgICAgICB0aGlzLmhlYWRlci5jbGFzc0xpc3QucmVtb3ZlKGNzc0hlbHBlci5tdWx0aVNlbGVjdC5oZWFkZXJBY3RpdmUpO1xuXG4gICAgICAgICAgICBhd2FpdCB0aGlzLmNvbnRleHQuZXZlbnRzLnRyaWdnZXIoXCJyZW5kZXJcIik7XG5cbiAgICAgICAgICAgIGRvY3VtZW50LnJlbW92ZUV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCB0aGlzLmhhbmRsZURvY3VtZW50KTtcbiAgICAgICAgfVxuICAgIH07XG4gICAgLyoqXG4gICAgICogQ3JlYXRlcyBhIGNvdW50IGxhYmVsIHRoYXQgZGlzcGxheXMgdGhlIG51bWJlciBvZiBzZWxlY3RlZCBpdGVtcyBpbiB0aGUgbXVsdGktc2VsZWN0IGNvbnRyb2wuXG4gICAgICovXG4gICAgY3JlYXRlQ291bnRMYWJlbCA9ICgpID0+IHtcbiAgICAgICAgLy91cGRhdGUgY291bnQgbGFiZWwuXG4gICAgICAgIGlmICh0aGlzLmNvdW50TGFiZWwgPT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgdGhpcy5jb3VudExhYmVsID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcInNwYW5cIik7XG4gICAgICAgICAgICB0aGlzLmNvdW50TGFiZWwuY2xhc3NOYW1lID0gY3NzSGVscGVyLm11bHRpU2VsZWN0LmhlYWRlck9wdGlvbjtcbiAgICAgICAgICAgIHRoaXMuaGVhZGVyLmFwcGVuZCh0aGlzLmNvdW50TGFiZWwpO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHRoaXMuc2VsZWN0ZWRWYWx1ZXMubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgdGhpcy5jb3VudExhYmVsLmlubmVyVGV4dCA9IGAke3RoaXMuc2VsZWN0ZWRWYWx1ZXMubGVuZ3RofSBzZWxlY3RlZGA7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB0aGlzLmNvdW50TGFiZWwucmVtb3ZlKCk7XG4gICAgICAgICAgICB0aGlzLmNvdW50TGFiZWwgPSB1bmRlZmluZWQ7XG4gICAgICAgIH1cbiAgICB9O1xuICAgIC8qKlxuICAgICAqIEhhbmRsZSBjbGljayBldmVudCBmb3IgZWFjaCBvcHRpb24gaW4gdGhlIG11bHRpLXNlbGVjdCBjb250cm9sLiAgVG9nZ2xlcyB0aGUgc2VsZWN0ZWQgc3RhdGUgb2YgdGhlIG9wdGlvbiBhbmQgdXBkYXRlcyB0aGUgXG4gICAgICogaGVhZGVyIGlmIGBsaXN0QWxsYCBpcyBgdHJ1ZWAuXG4gICAgICogQHBhcmFtIHtPYmplY3R9IG8gT2JqZWN0IHRoYXQgdHJpZ2dlcmVkIHRoZSBldmVudC5cbiAgICAgKi9cbiAgICBoYW5kbGVPcHRpb24gPSAobykgPT4ge1xuICAgICAgICBpZiAoIW8uY3VycmVudFRhcmdldC5jbGFzc0xpc3QuY29udGFpbnMoY3NzSGVscGVyLm11bHRpU2VsZWN0LnNlbGVjdGVkKSkge1xuICAgICAgICAgICAgLy9zZWxlY3QgaXRlbS5cbiAgICAgICAgICAgIG8uY3VycmVudFRhcmdldC5jbGFzc0xpc3QuYWRkKGNzc0hlbHBlci5tdWx0aVNlbGVjdC5zZWxlY3RlZCk7XG4gICAgICAgICAgICBvLmN1cnJlbnRUYXJnZXQuZGF0YXNldC5zZWxlY3RlZCA9IFwidHJ1ZVwiO1xuICAgICAgICAgICAgXG4gICAgICAgICAgICB0aGlzLnNlbGVjdGVkVmFsdWVzLnB1c2goby5jdXJyZW50VGFyZ2V0LmRhdGFzZXQudmFsdWUpO1xuXG4gICAgICAgICAgICBpZiAodGhpcy5saXN0QWxsKSB7XG4gICAgICAgICAgICAgICAgY29uc3Qgc3BhbiA9IEVsZW1lbnRIZWxwZXIuc3Bhbih7IGNsYXNzTmFtZTogY3NzSGVscGVyLm11bHRpU2VsZWN0LmhlYWRlck9wdGlvbiwgaW5uZXJUZXh0OiBvLmN1cnJlbnRUYXJnZXQuZGF0YXNldC52YWx1ZSB9LCB7IHZhbHVlOiBvLmN1cnJlbnRUYXJnZXQuZGF0YXNldC52YWx1ZSB9KTtcbiAgICAgICAgICAgICAgICB0aGlzLmhlYWRlci5hcHBlbmQoc3Bhbik7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAvL2Rlc2VsZWN0IGl0ZW0uXG4gICAgICAgICAgICBvLmN1cnJlbnRUYXJnZXQuY2xhc3NMaXN0LnJlbW92ZShjc3NIZWxwZXIubXVsdGlTZWxlY3Quc2VsZWN0ZWQpO1xuICAgICAgICAgICAgby5jdXJyZW50VGFyZ2V0LmRhdGFzZXQuc2VsZWN0ZWQgPSBcImZhbHNlXCI7XG5cbiAgICAgICAgICAgIHRoaXMuc2VsZWN0ZWRWYWx1ZXMgPSB0aGlzLnNlbGVjdGVkVmFsdWVzLmZpbHRlcihmID0+IGYgIT09IG8uY3VycmVudFRhcmdldC5kYXRhc2V0LnZhbHVlKTtcblxuICAgICAgICAgICAgaWYgKHRoaXMubGlzdEFsbCkge1xuICAgICAgICAgICAgICAgIGNvbnN0IGl0ZW0gPSB0aGlzLmhlYWRlci5xdWVyeVNlbGVjdG9yKGBbZGF0YS12YWx1ZT0nJHtvLmN1cnJlbnRUYXJnZXQuZGF0YXNldC52YWx1ZX0nXWApO1xuXG4gICAgICAgICAgICAgICAgaWYgKGl0ZW0gIT09IG51bGwpIHtcbiAgICAgICAgICAgICAgICAgICAgaXRlbS5yZW1vdmUoKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBpZiAodGhpcy5saXN0QWxsID09PSBmYWxzZSkge1xuICAgICAgICAgICAgdGhpcy5jcmVhdGVDb3VudExhYmVsKCk7XG4gICAgICAgIH1cbiAgICB9O1xuXG4gICAgdGVtcGxhdGVDb250YWluZXIgPSAoZGF0YSkgPT4ge1xuICAgICAgICBmb3IgKGNvbnN0IGl0ZW0gb2YgZGF0YSkge1xuICAgICAgICAgICAgY29uc3Qgb3B0aW9uID0gRWxlbWVudEhlbHBlci5kaXYoeyBjbGFzc05hbWU6IGNzc0hlbHBlci5tdWx0aVNlbGVjdC5vcHRpb24gfSwgeyB2YWx1ZTogaXRlbS52YWx1ZSwgc2VsZWN0ZWQ6IFwiZmFsc2VcIiB9KTtcbiAgICAgICAgICAgIGNvbnN0IHJhZGlvID0gRWxlbWVudEhlbHBlci5zcGFuKHsgY2xhc3NOYW1lOiBjc3NIZWxwZXIubXVsdGlTZWxlY3Qub3B0aW9uUmFkaW8gfSk7XG4gICAgICAgICAgICBjb25zdCB0ZXh0ID0gRWxlbWVudEhlbHBlci5zcGFuKHsgY2xhc3NOYW1lOiBjc3NIZWxwZXIubXVsdGlTZWxlY3Qub3B0aW9uVGV4dCwgaW5uZXJIVE1MOiBpdGVtLnRleHQgfSk7XG5cbiAgICAgICAgICAgIG9wdGlvbi5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgdGhpcy5oYW5kbGVPcHRpb24pO1xuICAgICAgICAgICAgb3B0aW9uLmFwcGVuZChyYWRpbywgdGV4dCk7XG5cbiAgICAgICAgICAgIHRoaXMub3B0aW9uc0NvbnRhaW5lci5hcHBlbmQob3B0aW9uKTtcbiAgICAgICAgfVxuICAgIH07XG5cbiAgICByZWZyZXNoU2VsZWN0T3B0aW9ucyA9IChkYXRhKSA9PiB7XG4gICAgICAgIHRoaXMub3B0aW9uc0NvbnRhaW5lci5yZXBsYWNlQ2hpbGRyZW4oKTtcbiAgICAgICAgdGhpcy5oZWFkZXIucmVwbGFjZUNoaWxkcmVuKCk7XG4gICAgICAgIHRoaXMuY291bnRMYWJlbCA9IHVuZGVmaW5lZDsgIC8vc2V0IHRvIHVuZGVmaW5lZCBzbyBpdCBjYW4gYmUgcmVjcmVhdGVkIGxhdGVyLlxuICAgICAgICBjb25zdCBuZXdTZWxlY3RlZCA9IFtdO1xuXG4gICAgICAgIGZvciAoY29uc3QgaXRlbSBvZiBkYXRhKSB7XG4gICAgICAgICAgICBjb25zdCBvcHRpb24gPSBFbGVtZW50SGVscGVyLmRpdih7IGNsYXNzTmFtZTogY3NzSGVscGVyLm11bHRpU2VsZWN0Lm9wdGlvbiB9LCB7IHZhbHVlOiBpdGVtLnZhbHVlLCBzZWxlY3RlZDogXCJmYWxzZVwiIH0pO1xuICAgICAgICAgICAgY29uc3QgcmFkaW8gPSBFbGVtZW50SGVscGVyLnNwYW4oeyBjbGFzc05hbWU6IGNzc0hlbHBlci5tdWx0aVNlbGVjdC5vcHRpb25SYWRpbyB9KTtcbiAgICAgICAgICAgIGNvbnN0IHRleHQgPSBFbGVtZW50SGVscGVyLnNwYW4oeyBjbGFzc05hbWU6IGNzc0hlbHBlci5tdWx0aVNlbGVjdC5vcHRpb25UZXh0LCBpbm5lckhUTUw6IGl0ZW0udGV4dCB9KTtcblxuICAgICAgICAgICAgb3B0aW9uLmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCB0aGlzLmhhbmRsZU9wdGlvbik7XG4gICAgICAgICAgICAvL2NoZWNrIGlmIGl0ZW0gaXMgc2VsZWN0ZWQuXG4gICAgICAgICAgICBpZiAodGhpcy5zZWxlY3RlZFZhbHVlcy5pbmNsdWRlcyhpdGVtLnZhbHVlKSkge1xuICAgICAgICAgICAgICAgIC8vc2VsZWN0IGl0ZW0uXG4gICAgICAgICAgICAgICAgb3B0aW9uLmNsYXNzTGlzdC5hZGQoY3NzSGVscGVyLm11bHRpU2VsZWN0LnNlbGVjdGVkKTtcbiAgICAgICAgICAgICAgICBvcHRpb24uZGF0YXNldC5zZWxlY3RlZCA9IFwidHJ1ZVwiO1xuICAgICAgICAgICAgICAgIG5ld1NlbGVjdGVkLnB1c2goaXRlbS52YWx1ZSk7XG5cbiAgICAgICAgICAgICAgICBpZiAodGhpcy5saXN0QWxsKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHNwYW4gPSBFbGVtZW50SGVscGVyLnNwYW4oeyBjbGFzc05hbWU6IGNzc0hlbHBlci5tdWx0aVNlbGVjdC5oZWFkZXJPcHRpb24sIGlubmVyVGV4dDogaXRlbS52YWx1ZSB9LCB7IHZhbHVlOiBpdGVtLnZhbHVlIH0pO1xuXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuaGVhZGVyLmFwcGVuZChzcGFuKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIG9wdGlvbi5hcHBlbmQocmFkaW8sIHRleHQpO1xuXG4gICAgICAgICAgICB0aGlzLm9wdGlvbnNDb250YWluZXIuYXBwZW5kKG9wdGlvbik7XG4gICAgICAgIH1cbiAgICAgICAgLy9zZXQgbmV3IHNlbGVjdGVkIHZhbHVlcyBhcyBpdGVtcyBtYXkgaGF2ZSBiZWVuIHJlbW92ZWQgb24gcmVmcmVzaC5cbiAgICAgICAgdGhpcy5zZWxlY3RlZFZhbHVlcyA9IG5ld1NlbGVjdGVkO1xuXG4gICAgICAgIGlmICh0aGlzLmxpc3RBbGwgPT09IGZhbHNlKSB7XG4gICAgICAgICAgICB0aGlzLmNyZWF0ZUNvdW50TGFiZWwoKTtcbiAgICAgICAgfVxuICAgIH07XG5cbiAgICBnZXQgdmFsdWUoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLnNlbGVjdGVkVmFsdWVzO1xuICAgIH1cbn1cblxuZXhwb3J0IHsgRWxlbWVudE11bHRpU2VsZWN0IH07IiwiLyoqXG4gKiBDbGFzcyB0aGF0IGRlZmluZXMgYSBzaW5nbGUgZmlsdGVyIGNvbmRpdGlvbiBmb3IgYSBjb2x1bW4uXG4gKi9cbmNsYXNzIEZpbHRlclRhcmdldCB7XG4gICAgLyoqXG4gICAgICogQ3JlYXRlcyBmaWx0ZXIgdGFyZ2V0IG9iamVjdCB0aGF0IGRlZmluZXMgYSBzaW5nbGUgZmlsdGVyIGNvbmRpdGlvbi4gIEV4cGVjdHMgYW4gb2JqZWN0IHdpdGggdGhlIGZvbGxvd2luZyBwcm9wZXJ0aWVzOlxuICAgICAqICogYHZhbHVlYDogVGhlIHZhbHVlIHRvIGZpbHRlciBhZ2FpbnN0LiAgRXhwZWN0cyB0aGF0IHZhbHVlIG1hdGNoZXMgdGhlIHR5cGUgb2YgdGhlIGZpZWxkIGJlaW5nIGZpbHRlcmVkLiAgU2hvdWxkIGJlIG51bGwgaWYgXG4gICAgICogdmFsdWUgdHlwZSBjYW5ub3QgYmUgY29udmVydGVkIHRvIHRoZSBmaWVsZCB0eXBlLlxuICAgICAqICogYGZpZWxkYDogVGhlIGZpZWxkIG5hbWUgb2YgdGhlIGNvbHVtbiBiZWluZyBmaWx0ZXJlZC4gIFRoaXMgaXMgdXNlZCB0byBpZGVudGlmeSB0aGUgY29sdW1uIGluIHRoZSBkYXRhIHNldC5cbiAgICAgKiAqIGBmaWVsZFR5cGVgOiBUaGUgdHlwZSBvZiBmaWVsZCBiZWluZyBmaWx0ZXJlZCAoZS5nLiwgXCJzdHJpbmdcIiwgXCJudW1iZXJcIiwgXCJkYXRlXCIsIFwib2JqZWN0XCIpLiAgVGhpcyBpcyB1c2VkIHRvIGRldGVybWluZSBob3cgdG8gY29tcGFyZSB0aGUgdmFsdWUuXG4gICAgICogKiBgZmlsdGVyVHlwZWA6IFRoZSB0eXBlIG9mIGZpbHRlciB0byBhcHBseSAoZS5nLiwgXCJlcXVhbHNcIiwgXCJsaWtlXCIsIFwiPFwiLCBcIjw9XCIsIFwiPlwiLCBcIj49XCIsIFwiIT1cIiwgXCJiZXR3ZWVuXCIsIFwiaW5cIikuXG4gICAgICogQHBhcmFtIHt7IHZhbHVlOiAoc3RyaW5nIHwgbnVtYmVyIHwgRGF0ZSB8IE9iamVjdCB8IG51bGwpLCBmaWVsZDogc3RyaW5nLCBmaWVsZFR5cGU6IHN0cmluZywgZmlsdGVyVHlwZTogc3RyaW5nIH19IHRhcmdldCBcbiAgICAgKi9cbiAgICBjb25zdHJ1Y3Rvcih0YXJnZXQpIHtcbiAgICAgICAgdGhpcy52YWx1ZSA9IHRhcmdldC52YWx1ZTtcbiAgICAgICAgdGhpcy5maWVsZCA9IHRhcmdldC5maWVsZDtcbiAgICAgICAgdGhpcy5maWVsZFR5cGUgPSB0YXJnZXQuZmllbGRUeXBlIHx8IFwic3RyaW5nXCI7IC8vIERlZmF1bHQgdG8gc3RyaW5nIGlmIG5vdCBwcm92aWRlZFxuICAgICAgICB0aGlzLmZpbHRlclR5cGUgPSB0YXJnZXQuZmlsdGVyVHlwZTtcbiAgICAgICAgdGhpcy5maWx0ZXJzID0gdGhpcy4jaW5pdCgpO1xuICAgIH1cblxuICAgICNpbml0KCkge1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgLy9lcXVhbCB0b1xuICAgICAgICAgICAgXCJlcXVhbHNcIjogZnVuY3Rpb24oZmlsdGVyVmFsLCByb3dWYWwpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gZmlsdGVyVmFsID09PSByb3dWYWw7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgLy9saWtlXG4gICAgICAgICAgICBcImxpa2VcIjogZnVuY3Rpb24oZmlsdGVyVmFsLCByb3dWYWwpIHtcbiAgICAgICAgICAgICAgICBpZiAocm93VmFsID09PSB1bmRlZmluZWQgfHwgcm93VmFsID09PSBudWxsIHx8IHJvd1ZhbCA9PT0gXCJcIikge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgICAgICAgICByZXR1cm4gU3RyaW5nKHJvd1ZhbCkudG9Mb3dlckNhc2UoKS5pbmRleE9mKGZpbHRlclZhbC50b0xvd2VyQ2FzZSgpKSA+IC0xO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIC8vbGVzcyB0aGFuXG4gICAgICAgICAgICBcIjxcIjogZnVuY3Rpb24oZmlsdGVyVmFsLCByb3dWYWwpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gZmlsdGVyVmFsIDwgcm93VmFsO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIC8vbGVzcyB0aGFuIG9yIGVxdWFsIHRvXG4gICAgICAgICAgICBcIjw9XCI6IGZ1bmN0aW9uKGZpbHRlclZhbCwgcm93VmFsKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGZpbHRlclZhbCA8PSByb3dWYWw7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgLy9ncmVhdGVyIHRoYW5cbiAgICAgICAgICAgIFwiPlwiOiBmdW5jdGlvbihmaWx0ZXJWYWwsIHJvd1ZhbCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBmaWx0ZXJWYWwgPiByb3dWYWw7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgLy9ncmVhdGVyIHRoYW4gb3IgZXF1YWwgdG9cbiAgICAgICAgICAgIFwiPj1cIjogZnVuY3Rpb24oZmlsdGVyVmFsLCByb3dWYWwpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gZmlsdGVyVmFsID49IHJvd1ZhbDtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAvL25vdCBlcXVhbCB0b1xuICAgICAgICAgICAgXCIhPVwiOiBmdW5jdGlvbihmaWx0ZXJWYWwsIHJvd1ZhbCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByb3dWYWwgIT09IGZpbHRlclZhbDtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAvLyBiZXR3ZWVuLiAgZXhwZWN0cyBmaWx0ZXJWYWwgdG8gYmUgYW4gYXJyYXkgb2Y6IFsge3N0YXJ0IHZhbHVlfSwgeyBlbmQgdmFsdWUgfSBdIFxuICAgICAgICAgICAgXCJiZXR3ZWVuXCI6IGZ1bmN0aW9uKGZpbHRlclZhbCwgcm93VmFsKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJvd1ZhbCA+PSBmaWx0ZXJWYWxbMF0gJiYgcm93VmFsIDw9IGZpbHRlclZhbFsxXTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAvL2luIGFycmF5LlxuICAgICAgICAgICAgXCJpblwiOiBmdW5jdGlvbihmaWx0ZXJWYWwsIHJvd1ZhbCkge1xuICAgICAgICAgICAgICAgIGlmIChBcnJheS5pc0FycmF5KGZpbHRlclZhbCkpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGZpbHRlclZhbC5sZW5ndGggPyBmaWx0ZXJWYWwuaW5kZXhPZihyb3dWYWwpID4gLTEgOiB0cnVlO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUud2FybihcIkZpbHRlciBFcnJvciAtIGZpbHRlciB2YWx1ZSBpcyBub3QgYW4gYXJyYXk6XCIsIGZpbHRlclZhbCk7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG4gICAgfVxuICAgIC8qKlxuICAgICAqIEV4ZWN1dGVzIGFuIGludGVybmFsIGZ1bmN0aW9uIHRvIGluZGljYXRlIGlmIHRoZSBjdXJyZW50IHJvdyB2YWx1ZXMgbWF0Y2hlcyB0aGUgZmlsdGVyIGNyaXRlcmlhJ3MgdmFsdWUuICBcbiAgICAgKiBAcGFyYW0ge09iamVjdH0gcm93VmFsIFJvdyBjb2x1bW4gdmFsdWUuICBFeHBlY3RzIGEgdmFsdWUgdGhhdCBtYXRjaGVzIHRoZSB0eXBlIGlkZW50aWZpZWQgYnkgdGhlIGNvbHVtbi5cbiAgICAgKiBAcGFyYW0ge09iamVjdDxBcnJheT59IHJvdyBDdXJyZW50IGRhdGEgc2V0IHJvdy5cbiAgICAgKiBAcmV0dXJucyB7Ym9vbGVhbn0gUmV0dXJucyB0cnVlIGlmIHJvdyB2YWx1ZSBtYXRjaGVzIGZpbHRlciB2YWx1ZS4gIE90aGVyd2lzZSwgZmFsc2UgaW5kaWNhdGluZyBubyBtYXRjaC5cbiAgICAgKi9cbiAgICBleGVjdXRlKHJvd1ZhbCwgcm93KSB7XG4gICAgICAgIHJldHVybiB0aGlzLmZpbHRlcnNbdGhpcy5maWx0ZXJUeXBlXSh0aGlzLnZhbHVlLCByb3dWYWwpO1xuICAgIH1cbn1cblxuZXhwb3J0IHsgRmlsdGVyVGFyZ2V0IH07IiwiaW1wb3J0IHsgRGF0ZUhlbHBlciB9IGZyb20gXCIuLi8uLi8uLi9jb21wb25lbnRzL2hlbHBlcnMvZGF0ZUhlbHBlci5qc1wiO1xuLyoqXG4gKiBDbGFzcyB0aGF0IGRlZmluZXMgYSBzaW5nbGUgZmlsdGVyIGNvbmRpdGlvbiBmb3IgYSBkYXRlIGNvbHVtbi5cbiAqL1xuY2xhc3MgRmlsdGVyRGF0ZSB7XG4gICAgLyoqXG4gICAgICogQ3JlYXRlcyBmaWx0ZXIgdGFyZ2V0IG9iamVjdCB0aGF0IGRlZmluZXMgYSBzaW5nbGUgZmlsdGVyIGNvbmRpdGlvbiBmb3IgYSBkYXRlIGRhdGEgdHlwZS4gIEV4cGVjdHMgYW4gb2JqZWN0IHdpdGggdGhlIGZvbGxvd2luZyBwcm9wZXJ0aWVzOlxuICAgICAqICogYHZhbHVlYDogVGhlIHZhbHVlIHRvIGZpbHRlciBhZ2FpbnN0LiAgRXhwZWN0cyB0aGF0IHZhbHVlIG1hdGNoZXMgdGhlIHR5cGUgb2YgdGhlIGZpZWxkIGJlaW5nIGZpbHRlcmVkLiAgU2hvdWxkIGJlIG51bGwgaWYgXG4gICAgICogdmFsdWUgdHlwZSBjYW5ub3QgYmUgY29udmVydGVkIHRvIHRoZSBmaWVsZCB0eXBlLlxuICAgICAqICogYGZpZWxkYDogVGhlIGZpZWxkIG5hbWUgb2YgdGhlIGNvbHVtbiBiZWluZyBmaWx0ZXJlZC4gIFRoaXMgaXMgdXNlZCB0byBpZGVudGlmeSB0aGUgY29sdW1uIGluIHRoZSBkYXRhIHNldC5cbiAgICAgKiAqIGBmaWx0ZXJUeXBlYDogVGhlIHR5cGUgb2YgZmlsdGVyIHRvIGFwcGx5IChlLmcuLCBcImVxdWFsc1wiLCBcImxpa2VcIiwgXCI8XCIsIFwiPD1cIiwgXCI+XCIsIFwiPj1cIiwgXCIhPVwiLCBcImJldHdlZW5cIiwgXCJpblwiKS5cbiAgICAgKiBAcGFyYW0ge3sgdmFsdWU6IChEYXRlIHwgQXJyYXk8RGF0ZT4pLCBmaWVsZDogc3RyaW5nLCBmaWx0ZXJUeXBlOiBzdHJpbmcgfX0gdGFyZ2V0IFxuICAgICAqL1xuICAgIGNvbnN0cnVjdG9yKHRhcmdldCkge1xuICAgICAgICB0aGlzLnZhbHVlID0gdGFyZ2V0LnZhbHVlO1xuICAgICAgICB0aGlzLmZpZWxkID0gdGFyZ2V0LmZpZWxkO1xuICAgICAgICB0aGlzLmZpZWxkVHlwZSA9IFwiZGF0ZVwiO1xuICAgICAgICB0aGlzLmZpbHRlclR5cGUgPSB0YXJnZXQuZmlsdGVyVHlwZTtcbiAgICAgICAgdGhpcy5maWx0ZXJzID0gdGhpcy4jaW5pdCgpO1xuICAgIH1cbiAgICAvKipcbiAgICAgKiBSZXR1cm5zIGEgbmV3IGRhdGUgb2JqZWN0IGZvciBlYWNoIGRhdGUgcGFzc2VkIGluLCBzZXR0aW5nIHRoZSB0aW1lIHRvIG1pZG5pZ2h0LiAgVGhpcyBpcyB1c2VkIHRvIGVuc3VyZSB0aGF0IHRoZSBkYXRlIG9iamVjdHMgYXJlIG5vdCBtb2RpZmllZFxuICAgICAqIHdoZW4gY29tcGFyaW5nIGRhdGVzIGluIHRoZSBmaWx0ZXIgZnVuY3Rpb25zLCBhbmQgdG8gZW5zdXJlIHRoYXQgdGhlIHRpbWUgcG9ydGlvbiBvZiB0aGUgZGF0ZSBkb2VzIG5vdCBhZmZlY3QgdGhlIGNvbXBhcmlzb24uXG4gICAgICogQHBhcmFtIHtEYXRlfSBkYXRlMSBcbiAgICAgKiBAcGFyYW0ge0RhdGV9IGRhdGUyIFxuICAgICAqIEByZXR1cm5zIHtBcnJheTxEYXRlPn0gUmV0dXJucyBhbiBhcnJheSBvZiB0d28gZGF0ZSBvYmplY3RzLCBlYWNoIHNldCB0byBtaWRuaWdodCBvZiB0aGUgcmVzcGVjdGl2ZSBkYXRlIHBhc3NlZCBpbi5cbiAgICAgKi9cbiAgICBjbG9uZURhdGVzID0gKGRhdGUxLCBkYXRlMikgPT4geyBcbiAgICAgICAgY29uc3QgZDEgPSBuZXcgRGF0ZShkYXRlMSk7XG4gICAgICAgIGNvbnN0IGQyID0gbmV3IERhdGUoZGF0ZTIpO1xuXG4gICAgICAgIGQxLnNldEhvdXJzKDAsIDAsIDAsIDApO1xuICAgICAgICBkMi5zZXRIb3VycygwLCAwLCAwLCAwKTtcbiAgICAgICAgXG4gICAgICAgIHJldHVybiBbZDEsIGQyXTtcbiAgICB9O1xuXG4gICAgI2luaXQoKSB7IFxuICAgICAgICByZXR1cm4geyBcbiAgICAgICAgICAgIFwiZXF1YWxzXCI6IGZ1bmN0aW9uKGZpbHRlclZhbCwgcm93VmFsKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGZpbHRlclZhbC5nZXRGdWxsWWVhcigpID09PSByb3dWYWwuZ2V0RnVsbFllYXIoKSAmJiBmaWx0ZXJWYWwuZ2V0TW9udGgoKSA9PT0gcm93VmFsLmdldE1vbnRoKCkgJiYgZmlsdGVyVmFsLmdldERhdGUoKSA9PT0gcm93VmFsLmdldERhdGUoKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAvL2xlc3MgdGhhblxuICAgICAgICAgICAgXCI8XCI6IChmaWx0ZXJWYWwsIHJvd1ZhbCkgPT4ge1xuICAgICAgICAgICAgICAgIGNvbnN0IGRhdGVzID0gdGhpcy5jbG9uZURhdGVzKGZpbHRlclZhbCwgcm93VmFsKTtcbiBcbiAgICAgICAgICAgICAgICByZXR1cm4gZGF0ZXNbMF0uZ2V0VGltZSgpIDwgZGF0ZXNbMV0uZ2V0VGltZSgpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIC8vbGVzcyB0aGFuIG9yIGVxdWFsIHRvXG4gICAgICAgICAgICBcIjw9XCI6IChmaWx0ZXJWYWwsIHJvd1ZhbCkgPT4ge1xuICAgICAgICAgICAgICAgIGNvbnN0IGRhdGVzID0gdGhpcy5jbG9uZURhdGVzKGZpbHRlclZhbCwgcm93VmFsKTtcblxuICAgICAgICAgICAgICAgIHJldHVybiBkYXRlc1swXS5nZXRUaW1lKCkgPCBkYXRlc1sxXS5nZXRUaW1lKCk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgLy9ncmVhdGVyIHRoYW5cbiAgICAgICAgICAgIFwiPlwiOiAoZmlsdGVyVmFsLCByb3dWYWwpID0+IHtcbiAgICAgICAgICAgICAgICBjb25zdCBkYXRlcyA9IHRoaXMuY2xvbmVEYXRlcyhmaWx0ZXJWYWwsIHJvd1ZhbCk7XG5cbiAgICAgICAgICAgICAgICByZXR1cm4gZGF0ZXNbMF0uZ2V0VGltZSgpID4gZGF0ZXNbMV0uZ2V0VGltZSgpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIC8vZ3JlYXRlciB0aGFuIG9yIGVxdWFsIHRvXG4gICAgICAgICAgICBcIj49XCI6IChmaWx0ZXJWYWwsIHJvd1ZhbCkgPT4ge1xuICAgICAgICAgICAgICAgIGNvbnN0IGRhdGVzID0gdGhpcy5jbG9uZURhdGVzKGZpbHRlclZhbCwgcm93VmFsKTtcblxuICAgICAgICAgICAgICAgIHJldHVybiBkYXRlc1swXS5nZXRUaW1lKCkgPj0gZGF0ZXNbMV0uZ2V0VGltZSgpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIC8vbm90IGVxdWFsIHRvXG4gICAgICAgICAgICBcIiE9XCI6IGZ1bmN0aW9uKGZpbHRlclZhbCwgcm93VmFsKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGZpbHRlclZhbC5nZXRGdWxsWWVhcigpICE9PSByb3dWYWwuZ2V0RnVsbFllYXIoKSAmJiBmaWx0ZXJWYWwuZ2V0TW9udGgoKSAhPT0gcm93VmFsLmdldE1vbnRoKCkgJiYgZmlsdGVyVmFsLmdldERhdGUoKSAhPT0gcm93VmFsLmdldERhdGUoKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAvLyBiZXR3ZWVuLiAgZXhwZWN0cyBmaWx0ZXJWYWwgdG8gYmUgYW4gYXJyYXkgb2Y6IFsge3N0YXJ0IHZhbHVlfSwgeyBlbmQgdmFsdWUgfSBdIFxuICAgICAgICAgICAgXCJiZXR3ZWVuXCI6IChmaWx0ZXJWYWwsIHJvd1ZhbCkgID0+IHtcbiAgICAgICAgICAgICAgICBjb25zdCBmaWx0ZXJEYXRlcyA9IHRoaXMuY2xvbmVEYXRlcyhmaWx0ZXJWYWxbMF0sIGZpbHRlclZhbFsxXSk7XG4gICAgICAgICAgICAgICAgY29uc3Qgcm93RGF0ZXMgPSB0aGlzLmNsb25lRGF0ZXMocm93VmFsLCByb3dWYWwpO1xuXG4gICAgICAgICAgICAgICAgcmV0dXJuIHJvd0RhdGVzWzBdID49IGZpbHRlckRhdGVzWzBdICYmIHJvd0RhdGVzWzBdIDw9IGZpbHRlckRhdGVzWzFdO1xuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuICAgIH1cbiAgICAvKipcbiAgICAgKiBFeGVjdXRlcyBhbiBpbnRlcm5hbCBmdW5jdGlvbiB0byBpbmRpY2F0ZSBpZiB0aGUgY3VycmVudCByb3cgdmFsdWUgbWF0Y2hlcyB0aGUgZmlsdGVyIGNyaXRlcmlhJ3MgdmFsdWUuICBcbiAgICAgKiBAcGFyYW0ge0RhdGV9IHJvd1ZhbCBSb3cgY29sdW1uIHZhbHVlLiAgRXhwZWN0cyBhIERhdGUgb2JqZWN0LlxuICAgICAqIEBwYXJhbSB7T2JqZWN0PEFycmF5Pn0gcm93IEN1cnJlbnQgZGF0YSBzZXQgcm93LlxuICAgICAqIEByZXR1cm5zIHtib29sZWFufSBSZXR1cm5zIHRydWUgaWYgcm93IHZhbHVlIG1hdGNoZXMgZmlsdGVyIHZhbHVlLiAgT3RoZXJ3aXNlLCBmYWxzZSBpbmRpY2F0aW5nIG5vIG1hdGNoLlxuICAgICAqL1xuICAgIGV4ZWN1dGUocm93VmFsLCByb3cpIHtcbiAgICAgICAgaWYgKHJvd1ZhbCA9PT0gbnVsbCB8fCAhRGF0ZUhlbHBlci5pc0RhdGUocm93VmFsKSkge1xuICAgICAgICAgICAgcmV0dXJuIGZhbHNlOyAvLyBJZiByb3dWYWwgaXMgbnVsbCBvciBub3QgYSBkYXRlLCByZXR1cm4gZmFsc2UuXG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gdGhpcy5maWx0ZXJzW3RoaXMuZmlsdGVyVHlwZV0odGhpcy52YWx1ZSwgcm93VmFsKTtcbiAgICB9XG59XG5cbmV4cG9ydCB7IEZpbHRlckRhdGUgfTsiLCIvKipcbiAqIFJlcHJlc2VudHMgYSBjb25jcmV0ZSBpbXBsZW1lbnRhdGlvbiBvZiBhIGZpbHRlciB0aGF0IHVzZXMgYSB1c2VyIHN1cHBsaWVkIGZ1bmN0aW9uLlxuICovXG5jbGFzcyBGaWx0ZXJGdW5jdGlvbiB7XG4gICAgLyoqXG4gICAgICogQ3JlYXRlcyBhIGZpbHRlciBmdW5jdGlvbiBpbnN0YW5jZS4gIEV4cGVjdHMgYW4gb2JqZWN0IHdpdGggdGhlIGZvbGxvd2luZyBwcm9wZXJ0aWVzOlxuICAgICAqICogYHZhbHVlYDogVGhlIHZhbHVlIHRvIGZpbHRlciBhZ2FpbnN0LiAgRG9lcyBub3QgbmVlZCB0byBtYXRjaCB0aGUgdHlwZSBvZiB0aGUgZmllbGQgYmVpbmcgZmlsdGVyZWQuXG4gICAgICogKiBgZmllbGRgOiBUaGUgZmllbGQgbmFtZSBvZiB0aGUgY29sdW1uIGJlaW5nIGZpbHRlcmVkLiAgVGhpcyBpcyB1c2VkIHRvIGlkZW50aWZ5IHRoZSBjb2x1bW4gaW4gdGhlIGRhdGEgc2V0LlxuICAgICAqICogYGZpbHRlclR5cGVgOiBUaGUgZnVuY3Rpb24gdG8gdXNlIGZvciBmaWx0ZXJpbmcuXG4gICAgICogKiBgcGFyYW1zYDogT3B0aW9uYWwgcGFyYW1ldGVycyB0byBwYXNzIHRvIHRoZSBmaWx0ZXIgZnVuY3Rpb24uXG4gICAgICogQHBhcmFtIHt7IHZhbHVlOiBPYmplY3QsIGZpZWxkOiBzdHJpbmcsIGZpbHRlclR5cGU6IEZ1bmN0aW9uLCBwYXJhbXM6IE9iamVjdCB9fSB0YXJnZXQgXG4gICAgICovXG4gICAgY29uc3RydWN0b3IodGFyZ2V0KSB7XG4gICAgICAgIHRoaXMudmFsdWUgPSB0YXJnZXQudmFsdWU7XG4gICAgICAgIHRoaXMuZmllbGQgPSB0YXJnZXQuZmllbGQ7XG4gICAgICAgIHRoaXMuZmlsdGVyRnVuY3Rpb24gPSB0YXJnZXQuZmlsdGVyVHlwZTtcbiAgICAgICAgdGhpcy5wYXJhbXMgPSB0YXJnZXQucGFyYW1zID8/IHt9O1xuICAgIH1cbiAgICAvKipcbiAgICAgKiBFeGVjdXRlcyBhbiB1c2VyIHN1cHBsaWVkIGZ1bmN0aW9uIHRvIGluZGljYXRlIGlmIHRoZSBjdXJyZW50IHJvdyB2YWx1ZXMgbWF0Y2hlcyB0aGUgZmlsdGVyIGNyaXRlcmlhJ3MgdmFsdWUuICBcbiAgICAgKiBAcGFyYW0ge09iamVjdH0gcm93VmFsIFJvdyBjb2x1bW4gdmFsdWUuICBFeHBlY3RzIGEgdmFsdWUgdGhhdCBtYXRjaGVzIHRoZSB0eXBlIGlkZW50aWZpZWQgYnkgdGhlIGNvbHVtbi5cbiAgICAgKiBAcGFyYW0ge09iamVjdDxBcnJheT59IHJvdyBDdXJyZW50IGRhdGEgc2V0IHJvdy5cbiAgICAgKiBAcmV0dXJucyB7Ym9vbGVhbn0gUmV0dXJucyB0cnVlIGlmIHJvdyB2YWx1ZSBtYXRjaGVzIGZpbHRlciB2YWx1ZS4gIE90aGVyd2lzZSwgZmFsc2UgaW5kaWNhdGluZyBubyBtYXRjaC5cbiAgICAgKi9cbiAgICBleGVjdXRlKHJvd1ZhbCwgcm93KSB7XG4gICAgICAgIHJldHVybiB0aGlzLmZpbHRlckZ1bmN0aW9uKHRoaXMudmFsdWUsIHJvd1ZhbCwgcm93LCB0aGlzLnBhcmFtcyk7XG4gICAgfVxufVxuXG5leHBvcnQgeyBGaWx0ZXJGdW5jdGlvbiB9OyIsImltcG9ydCB7IERhdGVIZWxwZXIgfSBmcm9tIFwiLi4vLi4vY29tcG9uZW50cy9oZWxwZXJzL2RhdGVIZWxwZXIuanNcIjtcbmltcG9ydCB7IEZpbHRlclRhcmdldCB9IGZyb20gXCIuL3R5cGVzL2ZpbHRlclRhcmdldC5qc1wiO1xuaW1wb3J0IHsgRmlsdGVyRGF0ZSB9IGZyb20gXCIuL3R5cGVzL2ZpbHRlckRhdGUuanNcIjtcbmltcG9ydCB7IEZpbHRlckZ1bmN0aW9uIH0gZnJvbSBcIi4vdHlwZXMvZmlsdGVyRnVuY3Rpb24uanNcIjtcbmltcG9ydCB7IEVsZW1lbnRCZXR3ZWVuIH0gZnJvbSBcIi4vZWxlbWVudHMvZWxlbWVudEJldHdlZW4uanNcIjtcbmltcG9ydCB7IEVsZW1lbnRJbnB1dCB9IGZyb20gXCIuL2VsZW1lbnRzL2VsZW1lbnRJbnB1dC5qc1wiO1xuaW1wb3J0IHsgRWxlbWVudE11bHRpU2VsZWN0IH0gZnJvbSBcIi4vZWxlbWVudHMvZWxlbWVudE11bHRpU2VsZWN0LmpzXCI7XG5pbXBvcnQgeyBFbGVtZW50U2VsZWN0IH0gZnJvbSBcIi4vZWxlbWVudHMvZWxlbWVudFNlbGVjdC5qc1wiO1xuLyoqXG4gKiBQcm92aWRlcyBhIG1lYW5zIHRvIGZpbHRlciBkYXRhIGluIHRoZSBncmlkLiAgVGhpcyBtb2R1bGUgY3JlYXRlcyBoZWFkZXIgZmlsdGVyIGNvbnRyb2xzIGZvciBlYWNoIGNvbHVtbiB0aGF0IGhhcyBcbiAqIGEgYGhhc0ZpbHRlcmAgYXR0cmlidXRlIHNldCB0byBgdHJ1ZWAuXG4gKiBcbiAqIENsYXNzIHN1YnNjcmliZXMgdG8gdGhlIGByZW5kZXJgIGV2ZW50IHRvIHVwZGF0ZSB0aGUgZmlsdGVyIGNvbnRyb2wgd2hlbiB0aGUgZ3JpZCBpcyByZW5kZXJlZC4gIEl0IGFsc28gY2FsbHMgdGhlIGNoYWluIFxuICogZXZlbnQgYHJlbW90ZVBhcmFtc2AgdG8gY29tcGlsZSBhIGxpc3Qgb2YgcGFyYW1ldGVycyB0byBiZSBwYXNzZWQgdG8gdGhlIHJlbW90ZSBkYXRhIHNvdXJjZSB3aGVuIHVzaW5nIHJlbW90ZSBwcm9jZXNzaW5nLlxuICovXG5jbGFzcyBGaWx0ZXJNb2R1bGUge1xuICAgIC8qKlxuICAgICAqIENyZWF0ZXMgYSBuZXcgZmlsdGVyIG1vZHVsZSBvYmplY3QuXG4gICAgICogQHBhcmFtIHtHcmlkQ29udGV4dH0gY29udGV4dCBHcmlkIGNvbnRleHQuXG4gICAgICovXG4gICAgY29uc3RydWN0b3IoY29udGV4dCkge1xuICAgICAgICB0aGlzLmNvbnRleHQgPSBjb250ZXh0O1xuICAgICAgICB0aGlzLmhlYWRlckZpbHRlcnMgPSBbXTtcbiAgICAgICAgdGhpcy5ncmlkRmlsdGVycyA9IFtdO1xuICAgIH1cblxuICAgIGluaXRpYWxpemUoKSB7XG4gICAgICAgIGlmICh0aGlzLmNvbnRleHQuc2V0dGluZ3MucmVtb3RlUHJvY2Vzc2luZykge1xuICAgICAgICAgICAgdGhpcy5jb250ZXh0LmV2ZW50cy5zdWJzY3JpYmUoXCJyZW1vdGVQYXJhbXNcIiwgdGhpcy5yZW1vdGVQYXJhbXMsIHRydWUpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdGhpcy5jb250ZXh0LmV2ZW50cy5zdWJzY3JpYmUoXCJyZW5kZXJcIiwgdGhpcy5yZW5kZXJMb2NhbCwgZmFsc2UsIDgpO1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5faW5pdCgpO1xuICAgIH1cbiAgICAvKipcbiAgICAgKiBDcmVhdGUgYEhlYWRlckZpbHRlcmAgQ2xhc3MgZm9yIGdyaWQgY29sdW1ucyB3aXRoIGEgYGhhc0ZpbHRlcmAgYXR0cmlidXRlIG9mIGB0cnVlYC5cbiAgICAgKi9cbiAgICBfaW5pdCgpIHtcbiAgICAgICAgZm9yIChjb25zdCBjb2wgb2YgdGhpcy5jb250ZXh0LmNvbHVtbk1hbmFnZXIuY29sdW1ucykge1xuICAgICAgICAgICAgaWYgKCFjb2wuaGFzRmlsdGVyKSBjb250aW51ZTtcblxuICAgICAgICAgICAgaWYgKGNvbC5maWx0ZXJFbGVtZW50ID09PSBcIm11bHRpXCIpIHtcbiAgICAgICAgICAgICAgICBjb2wuaGVhZGVyRmlsdGVyID0gbmV3IEVsZW1lbnRNdWx0aVNlbGVjdChjb2wsIHRoaXMuY29udGV4dCk7XG4gICAgICAgICAgICB9IGVsc2UgaWYgKGNvbC5maWx0ZXJFbGVtZW50ID09PSBcImJldHdlZW5cIikge1xuICAgICAgICAgICAgICAgIGNvbC5oZWFkZXJGaWx0ZXIgPSBuZXcgRWxlbWVudEJldHdlZW4oY29sLCB0aGlzLmNvbnRleHQpO1xuICAgICAgICAgICAgfSBlbHNlIGlmIChjb2wuZmlsdGVyRWxlbWVudCA9PT0gXCJzZWxlY3RcIikge1xuICAgICAgICAgICAgICAgIGNvbC5oZWFkZXJGaWx0ZXIgPSBuZXcgRWxlbWVudFNlbGVjdChjb2wsIHRoaXMuY29udGV4dCk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGNvbC5oZWFkZXJGaWx0ZXIgPSBuZXcgRWxlbWVudElucHV0KGNvbCwgdGhpcy5jb250ZXh0KTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgY29sLmhlYWRlckNlbGwuZWxlbWVudC5hcHBlbmRDaGlsZChjb2wuaGVhZGVyRmlsdGVyLmVsZW1lbnQpO1xuICAgICAgICAgICAgdGhpcy5oZWFkZXJGaWx0ZXJzLnB1c2goY29sLmhlYWRlckZpbHRlcik7XG4gICAgICAgIH1cbiAgICB9XG4gICAgLyoqXG4gICAgICogQ29tcGlsZXMgaGVhZGVyIGFuZCBncmlkIGZpbHRlciB2YWx1ZXMgaW50byBhIHNpbmdsZSBvYmplY3Qgb2Yga2V5L3ZhbHVlIHBhaXJzIHRoYXQgY2FuIGJlIHVzZWQgdG8gc2VuZCB0byB0aGUgcmVtb3RlIGRhdGEgc291cmNlLlxuICAgICAqIEBwYXJhbSB7T2JqZWN0fSBwYXJhbXMgT2JqZWN0IG9mIGtleS92YWx1ZSBwYWlycyB0byBiZSBzZW50IHRvIHRoZSByZW1vdGUgZGF0YSBzb3VyY2UuXG4gICAgICogQHJldHVybnMge09iamVjdH0gUmV0dXJucyB0aGUgbW9kaWZpZWQgcGFyYW1zIG9iamVjdCB3aXRoIGZpbHRlciB2YWx1ZXMgYWRkZWQuXG4gICAgICovXG4gICAgcmVtb3RlUGFyYW1zID0gKHBhcmFtcykgPT4ge1xuICAgICAgICB0aGlzLmhlYWRlckZpbHRlcnMuZm9yRWFjaCgoZikgPT4ge1xuICAgICAgICAgICAgaWYgKGYudmFsdWUgIT09IFwiXCIpIHtcbiAgICAgICAgICAgICAgICBwYXJhbXNbZi5maWVsZF0gPSBmLnZhbHVlO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcblxuICAgICAgICBpZiAodGhpcy5ncmlkRmlsdGVycy5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICBmb3IgKGNvbnN0IGl0ZW0gb2YgdGhpcy5ncmlkRmlsdGVycykge1xuICAgICAgICAgICAgICAgIHBhcmFtc1tpdGVtLmZpZWxkXSA9IGl0ZW0udmFsdWU7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gcGFyYW1zO1xuICAgIH07XG4gICAgLyoqXG4gICAgICogQ29udmVydCB2YWx1ZSB0eXBlIHRvIGNvbHVtbiB0eXBlLiAgSWYgdmFsdWUgY2Fubm90IGJlIGNvbnZlcnRlZCwgYG51bGxgIGlzIHJldHVybmVkLlxuICAgICAqIEBwYXJhbSB7b2JqZWN0IHwgc3RyaW5nIHwgbnVtYmVyfSB2YWx1ZSBSYXcgZmlsdGVyIHZhbHVlLlxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSB0eXBlIEZpZWxkIHR5cGUuXG4gICAgICogQHJldHVybnMge251bWJlciB8IERhdGUgfCBzdHJpbmcgfCBudWxsIHwgT2JqZWN0fSBpbnB1dCB2YWx1ZSBvciBgbnVsbGAgaWYgZW1wdHkuXG4gICAgICovXG4gICAgY29udmVydFRvVHlwZSh2YWx1ZSwgdHlwZSkge1xuICAgICAgICBpZiAodmFsdWUgPT09IFwiXCIgfHwgdmFsdWUgPT09IG51bGwpIHJldHVybiB2YWx1ZTtcblxuICAgICAgICBpZiAoQXJyYXkuaXNBcnJheSh2YWx1ZSkpIHtcbiAgICAgICAgICAgIGlmICh0eXBlID09PSBcImRhdGVcIiB8fCB0eXBlID09PSBcImRhdGV0aW1lXCIpICB7IFxuICAgICAgICAgICAgICAgIGNvbnN0IHJlc3VsdCA9IHZhbHVlLm1hcCgodikgPT4gRGF0ZUhlbHBlci5wYXJzZURhdGUodikpOyBcblxuICAgICAgICAgICAgICAgIHJldHVybiByZXN1bHQuaW5jbHVkZXMoXCJcIikgPyBudWxsIDogcmVzdWx0O1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpZiAodHlwZSA9PT0gXCJudW1iZXJcIikge1xuICAgICAgICAgICAgICAgIGNvbnN0IHZhbHVlMSA9IHRoaXMuY29udmVydFRvVHlwZSh2YWx1ZVswXSwgdHlwZSk7XG4gICAgICAgICAgICAgICAgY29uc3QgdmFsdWUyID0gdGhpcy5jb252ZXJ0VG9UeXBlKHZhbHVlWzFdLCB0eXBlKTsgIFxuXG4gICAgICAgICAgICAgICAgcmV0dXJuIHZhbHVlMSA9PT0gbnVsbCB8fCB2YWx1ZTIgPT09IG51bGwgPyBudWxsIDogW3ZhbHVlMSwgdmFsdWUyXTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgcmV0dXJuIHZhbHVlO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHR5cGUgPT09IFwibnVtYmVyXCIpIHtcbiAgICAgICAgICAgIHZhbHVlID0gTnVtYmVyKHZhbHVlKTtcbiAgICAgICAgICAgIHJldHVybiBOdW1iZXIuaXNOYU4odmFsdWUpID8gbnVsbCA6IHZhbHVlO1xuICAgICAgICB9IFxuICAgICAgICBcbiAgICAgICAgaWYgKHR5cGUgPT09IFwiZGF0ZVwiIHx8IHR5cGUgPT09IFwiZGF0ZXRpbWVcIikge1xuICAgICAgICAgICAgdmFsdWUgPSBEYXRlSGVscGVyLnBhcnNlRGF0ZU9ubHkodmFsdWUpO1xuICAgICAgICAgICAgcmV0dXJuIHZhbHVlID09PSBcIlwiID8gbnVsbCA6IHZhbHVlO1xuICAgICAgICB9IFxuICAgICAgICAvL2Fzc3VtaW5nIGl0J3MgYSBzdHJpbmcgdmFsdWUgb3IgT2JqZWN0IGF0IHRoaXMgcG9pbnQuXG4gICAgICAgIHJldHVybiB2YWx1ZTtcbiAgICB9XG4gICAgLyoqXG4gICAgICogV3JhcHMgdGhlIGZpbHRlciBpbnB1dCB2YWx1ZSBpbiBhIGBGaWx0ZXJUYXJnZXRgIG9iamVjdCwgd2hpY2ggZGVmaW5lcyBhIHNpbmdsZSBmaWx0ZXIgY29uZGl0aW9uIGZvciBhIGNvbHVtbi5cbiAgICAgKiBAcGFyYW0ge3N0cmluZyB8IERhdGUgfCBudW1iZXIgfCBPYmplY3R9IHZhbHVlIEZpbHRlciB2YWx1ZSB0byBhcHBseSB0byB0aGUgY29sdW1uLlxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBmaWVsZCBUaGUgZmllbGQgbmFtZSBvZiB0aGUgY29sdW1uIGJlaW5nIGZpbHRlcmVkLiBUaGlzIGlzIHVzZWQgdG8gaWRlbnRpZnkgdGhlIGNvbHVtbiBpbiB0aGUgZGF0YSBzZXQuXG4gICAgICogQHBhcmFtIHtzdHJpbmcgfCBGdW5jdGlvbn0gZmlsdGVyVHlwZSBUaGUgdHlwZSBvZiBmaWx0ZXIgdG8gYXBwbHkgKGUuZy4sIFwiZXF1YWxzXCIsIFwibGlrZVwiLCBcIjxcIiwgXCI8PVwiLCBcIj5cIiwgXCI+PVwiLCBcIiE9XCIsIFwiYmV0d2VlblwiLCBcImluXCIpLlxuICAgICAqIENhbiBhbHNvIGJlIGEgZnVuY3Rpb24uXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IGZpZWxkVHlwZSBUaGUgdHlwZSBvZiBmaWVsZCBiZWluZyBmaWx0ZXJlZCAoZS5nLiwgXCJzdHJpbmdcIiwgXCJudW1iZXJcIiwgXCJkYXRlXCIsIFwib2JqZWN0XCIpLlxuICAgICAqIEBwYXJhbSB7Ym9vbGVhbn0gZmlsdGVySXNGdW5jdGlvbiBJbmRpY2F0ZXMgaWYgdGhlIGZpbHRlciB0eXBlIGlzIGEgZnVuY3Rpb24uXG4gICAgICogQHBhcmFtIHtPYmplY3R9IGZpbHRlclBhcmFtcyBPcHRpb25hbCBwYXJhbWV0ZXJzIHRvIHBhc3MgdG8gdGhlIGZpbHRlciBmdW5jdGlvbi5cbiAgICAgKiBAcmV0dXJucyB7RmlsdGVyVGFyZ2V0IHwgRmlsdGVyRGF0ZSB8IEZpbHRlckZ1bmN0aW9uIHwgbnVsbH0gUmV0dXJucyBhIGZpbHRlciB0YXJnZXQgb2JqZWN0IHRoYXQgZGVmaW5lcyBhIHNpbmdsZSBmaWx0ZXIgY29uZGl0aW9uIGZvciBhIGNvbHVtbiwgXG4gICAgICogb3IgbnVsbCBpZiB0aGUgdmFsdWUgY2Fubm90IGJlIGNvbnZlcnRlZCB0byB0aGUgZmllbGQgdHlwZS4gXG4gICAgICovXG4gICAgY3JlYXRlRmlsdGVyVGFyZ2V0KHZhbHVlLCBmaWVsZCwgZmlsdGVyVHlwZSwgZmllbGRUeXBlLCBmaWx0ZXJJc0Z1bmN0aW9uLCBmaWx0ZXJQYXJhbXMpIHsgXG4gICAgICAgIGlmIChmaWx0ZXJJc0Z1bmN0aW9uKSB7IFxuICAgICAgICAgICAgcmV0dXJuIG5ldyBGaWx0ZXJGdW5jdGlvbih7IHZhbHVlOiB2YWx1ZSwgZmllbGQ6IGZpZWxkLCBmaWx0ZXJUeXBlOiBmaWx0ZXJUeXBlLCBwYXJhbXM6IGZpbHRlclBhcmFtcyB9KTtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IGNvbnZlcnRlZFZhbHVlID0gdGhpcy5jb252ZXJ0VG9UeXBlKHZhbHVlLCBmaWVsZFR5cGUpO1xuXG4gICAgICAgIGlmIChjb252ZXJ0ZWRWYWx1ZSA9PT0gbnVsbCkgcmV0dXJuIG51bGw7XG5cbiAgICAgICAgaWYgKGZpZWxkVHlwZSA9PT0gXCJkYXRlXCIgfHwgZmllbGRUeXBlID09PSBcImRhdGV0aW1lXCIpIHtcbiAgICAgICAgICAgIHJldHVybiBuZXcgRmlsdGVyRGF0ZSh7IHZhbHVlOiBjb252ZXJ0ZWRWYWx1ZSwgZmllbGQ6IGZpZWxkLCBmaWx0ZXJUeXBlOiBmaWx0ZXJUeXBlIH0pO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIG5ldyBGaWx0ZXJUYXJnZXQoeyB2YWx1ZTogY29udmVydGVkVmFsdWUsIGZpZWxkOiBmaWVsZCwgZmllbGRUeXBlOiBmaWVsZFR5cGUsIGZpbHRlclR5cGU6IGZpbHRlclR5cGUgfSk7XG4gICAgfVxuICAgIC8qKlxuICAgICAqIENvbXBpbGVzIGFuIGFycmF5IG9mIGZpbHRlciB0eXBlIG9iamVjdHMgdGhhdCBjb250YWluIGEgZmlsdGVyIHZhbHVlIHRoYXQgbWF0Y2hlcyBpdHMgY29sdW1uIHR5cGUuICBDb2x1bW4gdHlwZSBtYXRjaGluZyBcbiAgICAgKiBpcyBuZWNlc3Nhcnkgd2hlbiBwcm9jZXNzaW5nIGRhdGEgbG9jYWxseSwgc28gdGhhdCBmaWx0ZXIgdmFsdWUgbWF0Y2hlcyBhc3NvY2lhdGVkIHJvdyB0eXBlIHZhbHVlIGZvciBjb21wYXJpc29uLlxuICAgICAqIEByZXR1cm5zIHtBcnJheX0gYXJyYXkgb2YgZmlsdGVyIHR5cGUgb2JqZWN0cyB3aXRoIHZhbGlkIHZhbHVlLlxuICAgICAqL1xuICAgIGNvbXBpbGVGaWx0ZXJzKCkge1xuICAgICAgICBsZXQgcmVzdWx0cyA9IFtdO1xuXG4gICAgICAgIGZvciAoY29uc3QgaXRlbSBvZiB0aGlzLmhlYWRlckZpbHRlcnMpIHtcbiAgICAgICAgICAgIGlmIChpdGVtLnZhbHVlID09PSBcIlwiKSBjb250aW51ZTtcblxuICAgICAgICAgICAgY29uc3QgZmlsdGVyID0gdGhpcy5jcmVhdGVGaWx0ZXJUYXJnZXQoaXRlbS52YWx1ZSwgaXRlbS5maWVsZCwgaXRlbS5maWx0ZXJUeXBlLCBpdGVtLmZpZWxkVHlwZSwgaXRlbS5maWx0ZXJJc0Z1bmN0aW9uLCBpdGVtPy5maWx0ZXJQYXJhbXMpO1xuXG4gICAgICAgICAgICBpZiAoZmlsdGVyICE9PSBudWxsKSB7XG4gICAgICAgICAgICAgICAgcmVzdWx0cy5wdXNoKGZpbHRlcik7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBpZiAodGhpcy5ncmlkRmlsdGVycy5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICByZXN1bHRzID0gcmVzdWx0cy5jb25jYXQodGhpcy5ncmlkRmlsdGVycyk7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gcmVzdWx0cztcbiAgICB9XG4gICAgLyoqXG4gICAgICogVXNlIHRhcmdldCBmaWx0ZXJzIHRvIGNyZWF0ZSBhIG5ldyBkYXRhIHNldCBpbiB0aGUgcGVyc2lzdGVuY2UgZGF0YSBwcm92aWRlci5cbiAgICAgKiBAcGFyYW0ge0FycmF5PEZpbHRlclRhcmdldD59IHRhcmdldHMgQXJyYXkgb2YgRmlsdGVyVGFyZ2V0IG9iamVjdHMuXG4gICAgICovXG4gICAgYXBwbHlGaWx0ZXJzKHRhcmdldHMpIHtcbiAgICAgICAgdGhpcy5jb250ZXh0LnBlcnNpc3RlbmNlLmRhdGEgPSBbXTtcbiAgICAgICAgdGhpcy5jb250ZXh0LnBlcnNpc3RlbmNlLmRhdGFDYWNoZS5mb3JFYWNoKChyb3cpID0+IHtcbiAgICAgICAgICAgIGxldCBtYXRjaCA9IHRydWU7XG5cbiAgICAgICAgICAgIGZvciAobGV0IGl0ZW0gb2YgdGFyZ2V0cykge1xuICAgICAgICAgICAgICAgIGNvbnN0IHJvd1ZhbCA9IHRoaXMuY29udmVydFRvVHlwZShyb3dbaXRlbS5maWVsZF0sIGl0ZW0uZmllbGRUeXBlKTtcbiAgICAgICAgICAgICAgICBjb25zdCByZXN1bHQgPSBpdGVtLmV4ZWN1dGUocm93VmFsLCByb3cpO1xuXG4gICAgICAgICAgICAgICAgaWYgKCFyZXN1bHQpIHtcbiAgICAgICAgICAgICAgICAgICAgbWF0Y2ggPSBmYWxzZTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmIChtYXRjaCkge1xuICAgICAgICAgICAgICAgIHRoaXMuY29udGV4dC5wZXJzaXN0ZW5jZS5kYXRhLnB1c2gocm93KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgfVxuICAgIC8qKlxuICAgICAqIFJlbmRlcnMgdGhlIGxvY2FsIGRhdGEgc2V0IGJ5IGFwcGx5aW5nIHRoZSBjb21waWxlZCBmaWx0ZXJzIHRvIHRoZSBwZXJzaXN0ZW5jZSBkYXRhIHByb3ZpZGVyLlxuICAgICAqL1xuICAgIHJlbmRlckxvY2FsID0gKCkgPT4ge1xuICAgICAgICBjb25zdCB0YXJnZXRzID0gdGhpcy5jb21waWxlRmlsdGVycygpO1xuXG4gICAgICAgIGlmIChPYmplY3Qua2V5cyh0YXJnZXRzKS5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICB0aGlzLmFwcGx5RmlsdGVycyh0YXJnZXRzKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHRoaXMuY29udGV4dC5wZXJzaXN0ZW5jZS5yZXN0b3JlRGF0YSgpO1xuICAgICAgICB9XG4gICAgfTtcbiAgICAvKipcbiAgICAgKiBQcm92aWRlcyBhIG1lYW5zIHRvIGFwcGx5IGEgY29uZGl0aW9uIG91dHNpZGUgdGhlIGhlYWRlciBmaWx0ZXIgY29udHJvbHMuICBXaWxsIGFkZCBjb25kaXRpb25cbiAgICAgKiB0byBncmlkJ3MgYGdyaWRGaWx0ZXJzYCBjb2xsZWN0aW9uLCBhbmQgcmFpc2UgYHJlbmRlcmAgZXZlbnQgdG8gZmlsdGVyIGRhdGEgc2V0LlxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBmaWVsZCBmaWVsZCBuYW1lLlxuICAgICAqIEBwYXJhbSB7b2JqZWN0fSB2YWx1ZSB2YWx1ZS5cbiAgICAgKiBAcGFyYW0ge3N0cmluZyB8IEZ1bmN0aW9ufSB0eXBlIGNvbmRpdGlvbiB0eXBlLlxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBbZmllbGRUeXBlPVwic3RyaW5nXCJdIGZpZWxkIHR5cGUuXG4gICAgICogQHBhcmFtIHtvYmplY3R9IFtmaWx0ZXJQYXJhbXM9e31dIGFkZGl0aW9uYWwgZmlsdGVyIHBhcmFtZXRlcnMuXG4gICAgICovXG4gICAgc2V0RmlsdGVyKGZpZWxkLCB2YWx1ZSwgdHlwZSA9IFwiZXF1YWxzXCIsIGZpZWxkVHlwZSA9IFwic3RyaW5nXCIsIGZpbHRlclBhcmFtcyA9IHt9KSB7XG4gICAgICAgIGNvbnN0IGNvbnZlcnRlZFZhbHVlID0gdGhpcy5jb252ZXJ0VG9UeXBlKHZhbHVlLCBmaWVsZFR5cGUpO1xuXG4gICAgICAgIGlmICh0aGlzLmdyaWRGaWx0ZXJzLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgIGNvbnN0IGluZGV4ID0gdGhpcy5ncmlkRmlsdGVycy5maW5kSW5kZXgoKGkpID0+IGkuZmllbGQgPT09IGZpZWxkKTtcbiAgICAgICAgICAgIC8vSWYgZmllbGQgYWxyZWFkeSBleGlzdHMsIGp1c3QgdXBkYXRlIHRoZSB2YWx1ZS5cbiAgICAgICAgICAgIGlmIChpbmRleCA+IC0xKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5ncmlkRmlsdGVyc1tpbmRleF0udmFsdWUgPSBjb252ZXJ0ZWRWYWx1ZTtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCBmaWx0ZXIgPSB0aGlzLmNyZWF0ZUZpbHRlclRhcmdldChjb252ZXJ0ZWRWYWx1ZSwgZmllbGQsIHR5cGUsIGZpZWxkVHlwZSwgKHR5cGVvZiB0eXBlID09PSBcImZ1bmN0aW9uXCIpLCBmaWx0ZXJQYXJhbXMpO1xuICAgICAgICB0aGlzLmdyaWRGaWx0ZXJzLnB1c2goZmlsdGVyKTtcbiAgICB9XG4gICAgLyoqXG4gICAgICogUmVtb3ZlcyBmaWx0ZXIgY29uZGl0aW9uIGZyb20gZ3JpZCdzIGBncmlkRmlsdGVyc2AgY29sbGVjdGlvbi5cbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gZmllbGQgZmllbGQgbmFtZS5cbiAgICAgKi9cbiAgICByZW1vdmVGaWx0ZXIoZmllbGQpIHtcbiAgICAgICAgdGhpcy5ncmlkRmlsdGVycyA9IHRoaXMuZ3JpZEZpbHRlcnMuZmlsdGVyKGYgPT4gZi5maWVsZCAhPT0gZmllbGQpO1xuICAgIH1cbn1cblxuRmlsdGVyTW9kdWxlLm1vZHVsZU5hbWUgPSBcImZpbHRlclwiO1xuXG5leHBvcnQgeyBGaWx0ZXJNb2R1bGUgfTsiLCJjbGFzcyBQYWdlckJ1dHRvbnMge1xuICAgIC8qKlxuICAgICAqIFJldHVybnMgc3RhcnQgYnV0dG9uIGZvciBwYWdlciBlbGVtZW50LlxuICAgICAqIEBwYXJhbSB7bnVtYmVyfSBjdXJyZW50UGFnZSBDdXJyZW50IHBhZ2UuXG4gICAgICogQHBhcmFtIHtGdW5jdGlvbn0gY2FsbGJhY2sgQnV0dG9uIGNsaWNrIGhhbmRsZXIuXG4gICAgICogQHJldHVybnMge0hUTUxMaW5rRWxlbWVudH1cbiAgICAgKi9cbiAgICBzdGF0aWMgc3RhcnQoY3VycmVudFBhZ2UsIGNhbGxiYWNrKSB7XG4gICAgICAgIGNvbnN0IGxpID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImxpXCIpO1xuICAgICAgICBjb25zdCBidG4gPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiYnV0dG9uXCIpO1xuXG4gICAgICAgIGxpLmFwcGVuZChidG4pO1xuICAgICAgICBidG4uaW5uZXJIVE1MID0gXCImbHNhcXVvO1wiO1xuICAgICAgICBidG4uYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsIGNhbGxiYWNrKTtcblxuICAgICAgICBpZiAoY3VycmVudFBhZ2UgPiAxKSB7XG4gICAgICAgICAgICBidG4uZGF0YXNldC5wYWdlID0gXCIxXCI7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBidG4udGFiSW5kZXggPSAtMTtcbiAgICAgICAgICAgIGJ0bi5kaXNhYmxlZCA9IHRydWU7XG4gICAgICAgICAgICBsaS5jbGFzc05hbWUgPSBcImRpc2FibGVkXCI7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gbGk7XG4gICAgfVxuICAgIC8qKlxuICAgICAqIFJldHVybnMgZW5kIGJ1dHRvbiBmb3IgcGFnZXIgZWxlbWVudC5cbiAgICAgKiBAcGFyYW0ge251bWJlcn0gdG90YWxQYWdlcyBsYXN0IHBhZ2UgbnVtYmVyIGluIGdyb3VwIHNldC5cbiAgICAgKiBAcGFyYW0ge251bWJlcn0gY3VycmVudFBhZ2UgY3VycmVudCBwYWdlLlxuICAgICAqIEBwYXJhbSB7RnVuY3Rpb259IGNhbGxiYWNrIGJ1dHRvbiBjbGljayBoYW5kbGVyLlxuICAgICAqIEByZXR1cm5zIHtIVE1MTElFbGVtZW50fVxuICAgICAqL1xuICAgIHN0YXRpYyBlbmQodG90YWxQYWdlcywgY3VycmVudFBhZ2UsIGNhbGxiYWNrKSB7XG4gICAgICAgIGNvbnN0IGxpID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImxpXCIpO1xuICAgICAgICBjb25zdCBidG4gPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiYnV0dG9uXCIpO1xuXG4gICAgICAgIGxpLmFwcGVuZChidG4pO1xuICAgICAgICBidG4uaW5uZXJIVE1MID0gXCImcnNhcXVvO1wiO1xuICAgICAgICBidG4uYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsIGNhbGxiYWNrKTtcblxuICAgICAgICBpZiAoY3VycmVudFBhZ2UgPCB0b3RhbFBhZ2VzKSB7XG4gICAgICAgICAgICBidG4uZGF0YXNldC5wYWdlID0gdG90YWxQYWdlcztcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGJ0bi50YWJJbmRleCA9IC0xO1xuICAgICAgICAgICAgYnRuLmRpc2FibGVkID0gdHJ1ZTtcbiAgICAgICAgICAgIGxpLmNsYXNzTmFtZSA9IFwiZGlzYWJsZWRcIjtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBsaTtcbiAgICB9XG4gICAgLyoqXG4gICAgICogUmV0dXJucyBwYWdlciBidXR0b24gZm9yIGFzc29jaWF0ZWQgcGFnZS5cbiAgICAgKiBAcGFyYW0ge251bWJlcn0gcGFnZSBwYWdlIG51bWJlci5cbiAgICAgKiBAcGFyYW0ge251bWJlcn0gY3VycmVudFBhZ2UgY3VycmVudCBwYWdlLlxuICAgICAqIEBwYXJhbSB7RnVuY3Rpb259IGNhbGxiYWNrIGJ1dHRvbiBjbGljayBoYW5kbGVyLlxuICAgICAqIEByZXR1cm5zIHtIVE1MTElFbGVtZW50fVxuICAgICAqL1xuICAgIHN0YXRpYyBwYWdlTnVtYmVyKHBhZ2UsIGN1cnJlbnRQYWdlLCBjYWxsYmFjaykge1xuICAgICAgICBjb25zdCBsaSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJsaVwiKTtcbiAgICAgICAgY29uc3QgYnRuID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImJ1dHRvblwiKTtcblxuICAgICAgICBsaS5hcHBlbmQoYnRuKTtcbiAgICAgICAgYnRuLmlubmVyVGV4dCA9IHBhZ2U7XG4gICAgICAgIGJ0bi5kYXRhc2V0LnBhZ2UgPSBwYWdlO1xuICAgICAgICBidG4uYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsIGNhbGxiYWNrKTtcblxuICAgICAgICBpZiAocGFnZSA9PT0gY3VycmVudFBhZ2UpIHtcbiAgICAgICAgICAgIGxpLmNsYXNzTmFtZSA9IFwiYWN0aXZlXCI7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gbGk7XG4gICAgfVxufVxuXG5leHBvcnQgeyBQYWdlckJ1dHRvbnMgfTsiLCJpbXBvcnQgeyBQYWdlckJ1dHRvbnMgfSBmcm9tIFwiLi9wYWdlckJ1dHRvbnMuanNcIjtcbi8qKlxuICogRm9ybWF0cyBncmlkJ3Mgcm93cyBhcyBhIHNlcmllcyBvZiBwYWdlcyByYXRoZXIgdGhhdCBhIHNjcm9sbGluZyBsaXN0LiAgSWYgcGFnaW5nIGlzIG5vdCBkZXNpcmVkLCByZWdpc3RlciB0aGUgYFJvd01vZHVsZWAgaW5zdGVhZC5cbiAqIFxuICogQ2xhc3Mgc3Vic2NyaWJlcyB0byB0aGUgYHJlbmRlcmAgZXZlbnQgdG8gdXBkYXRlIHRoZSBwYWdlciBjb250cm9sIHdoZW4gdGhlIGdyaWQgaXMgcmVuZGVyZWQuICBJdCBhbHNvIGNhbGxzIHRoZSBjaGFpbiBldmVudCBcbiAqIGByZW1vdGVQYXJhbXNgIHRvIGNvbXBpbGUgYSBsaXN0IG9mIHBhcmFtZXRlcnMgdG8gYmUgcGFzc2VkIHRvIHRoZSByZW1vdGUgZGF0YSBzb3VyY2Ugd2hlbiB1c2luZyByZW1vdGUgcHJvY2Vzc2luZy5cbiAqL1xuY2xhc3MgUGFnZXJNb2R1bGUge1xuICAgIC8qKlxuICAgICAqIEZvcm1hdHMgZ3JpZCdzIHJvd3MgYXMgYSBzZXJpZXMgb2YgcGFnZXMgcmF0aGVyIHRoYXQgYSBzY3JvbGxpbmcgbGlzdC4gIE1vZHVsZSBjYW4gYmUgdXNlZCB3aXRoIGJvdGggbG9jYWwgYW5kIHJlbW90ZSBkYXRhIHNvdXJjZXMuICBcbiAgICAgKiBAcGFyYW0ge0dyaWRDb250ZXh0fSBjb250ZXh0IEdyaWQgY29udGV4dC5cbiAgICAgKi9cbiAgICBjb25zdHJ1Y3Rvcihjb250ZXh0KSB7XG4gICAgICAgIHRoaXMuY29udGV4dCA9IGNvbnRleHQ7XG4gICAgICAgIHRoaXMudG90YWxSb3dzID0gdGhpcy5jb250ZXh0LnBlcnNpc3RlbmNlLnJvd0NvdW50O1xuICAgICAgICB0aGlzLnBhZ2VzVG9EaXNwbGF5ID0gdGhpcy5jb250ZXh0LnNldHRpbmdzLnBhZ2VyUGFnZXNUb0Rpc3BsYXk7XG4gICAgICAgIHRoaXMucm93c1BlclBhZ2UgPSB0aGlzLmNvbnRleHQuc2V0dGluZ3MucGFnZXJSb3dzUGVyUGFnZTtcbiAgICAgICAgdGhpcy5jdXJyZW50UGFnZSA9IDE7XG4gICAgICAgIC8vY3JlYXRlIGRpdiBjb250YWluZXIgZm9yIHBhZ2VyXG4gICAgICAgIHRoaXMuY29udGFpbmVyID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImRpdlwiKTtcbiAgICAgICAgdGhpcy5lbFBhZ2VyID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcInVsXCIpO1xuXG4gICAgICAgIHRoaXMuY29udGFpbmVyLmlkID0gYCR7dGhpcy5jb250ZXh0LnNldHRpbmdzLmJhc2VJZE5hbWV9X3BhZ2VyYDtcbiAgICAgICAgdGhpcy5jb250YWluZXIuY2xhc3NOYW1lID0gdGhpcy5jb250ZXh0LnNldHRpbmdzLnBhZ2VyQ3NzO1xuICAgICAgICB0aGlzLmNvbnRhaW5lci5hcHBlbmQodGhpcy5lbFBhZ2VyKTtcbiAgICAgICAgdGhpcy5jb250ZXh0LmdyaWQudGFibGUuaW5zZXJ0QWRqYWNlbnRFbGVtZW50KFwiYWZ0ZXJlbmRcIiwgdGhpcy5jb250YWluZXIpO1xuICAgIH1cbiAgICAvKipcbiAgICAgKiBTZXRzIGhhbmRsZXIgZXZlbnRzIGZvciByZW5kZXJpbmcvdXBkYXRpbmcgZ3JpZCBib2R5IHJvd3MgYW5kIHBhZ2VyIGNvbnRyb2wuXG4gICAgICovXG4gICAgaW5pdGlhbGl6ZSgpIHtcbiAgICAgICAgaWYgKHRoaXMuY29udGV4dC5zZXR0aW5ncy5yZW1vdGVQcm9jZXNzaW5nKSB7XG4gICAgICAgICAgICB0aGlzLmNvbnRleHQuZXZlbnRzLnN1YnNjcmliZShcInJlbmRlclwiLCB0aGlzLnJlbmRlclJlbW90ZSwgdHJ1ZSwgMTApO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdGhpcy5jb250ZXh0LmV2ZW50cy5zdWJzY3JpYmUoXCJyZW5kZXJcIiwgdGhpcy5yZW5kZXJMb2NhbCwgZmFsc2UsIDEwKTtcbiAgICAgICAgfVxuICAgIH1cbiAgICAvKipcbiAgICAgKiBSZXR1cm5zIHRoZSB0b3RhbCBudW1iZXIgb2YgcG9zc2libGUgcGFnZXMgYmFzZWQgb24gdGhlIHRvdGFsIHJvd3MsIGFuZCByb3dzIHBlciBwYWdlIHNldHRpbmcuXG4gICAgICogQHJldHVybnMge051bWJlcn1cbiAgICAgKi9cbiAgICB0b3RhbFBhZ2VzKCkge1xuICAgICAgICBjb25zdCB0b3RhbFJvd3MgPSBpc05hTih0aGlzLnRvdGFsUm93cykgPyAxIDogdGhpcy50b3RhbFJvd3M7XG5cbiAgICAgICAgcmV0dXJuIHRoaXMucm93c1BlclBhZ2UgPT09IDAgPyAxIDogTWF0aC5jZWlsKHRvdGFsUm93cyAvIHRoaXMucm93c1BlclBhZ2UpO1xuICAgIH1cbiAgICAvKipcbiAgICAgKiBSZXR1cm5zIGEgdmFsaWRhdGVkIHBhZ2UgbnVtYmVyIGlucHV0IGJ5IG1ha2luZyBzdXJlIHZhbHVlIGlzIG51bWVyaWMsIGFuZCB3aXRoaW4gdGhlIGJvdW5kcyBvZiB0aGUgdG90YWwgcGFnZXMuICBcbiAgICAgKiBBbiBpbnZhbGlkIGlucHV0IHdpbGwgcmV0dXJuIGEgdmFsdWUgb2YgMS5cbiAgICAgKiBAcGFyYW0ge3N0cmluZyB8IG51bWJlcn0gY3VycmVudFBhZ2UgUGFnZSBudW1iZXIgdG8gdmFsaWRhdGUuXG4gICAgICogQHJldHVybnMge051bWJlcn0gUmV0dXJucyBhIHZhbGlkIHBhZ2UgbnVtYmVyIGJldHdlZW4gMSBhbmQgdGhlIHRvdGFsIG51bWJlciBvZiBwYWdlcy4gIElmIHRoZSBpbnB1dCBpcyBpbnZhbGlkLCByZXR1cm5zIDEuXG4gICAgICovXG4gICAgdmFsaWRhdGVQYWdlKGN1cnJlbnRQYWdlKSB7XG4gICAgICAgIGlmICghTnVtYmVyLmlzSW50ZWdlcihjdXJyZW50UGFnZSkpIHtcbiAgICAgICAgICAgIGN1cnJlbnRQYWdlID0gcGFyc2VJbnQoY3VycmVudFBhZ2UpO1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc3QgdG90YWwgPSB0aGlzLnRvdGFsUGFnZXMoKTtcbiAgICAgICAgY29uc3QgcmVzdWx0ID0gdG90YWwgPCBjdXJyZW50UGFnZSA/IHRvdGFsIDogY3VycmVudFBhZ2U7XG5cbiAgICAgICAgcmV0dXJuIHJlc3VsdCA8PSAwID8gMSA6IHJlc3VsdDtcbiAgICB9XG4gICAgLyoqXG4gICAgICogUmV0dXJucyB0aGUgZmlyc3QgcGFnZSBudW1iZXIgdG8gZGlzcGxheSBpbiB0aGUgYnV0dG9uIGNvbnRyb2wgc2V0IGJhc2VkIG9uIHRoZSBwYWdlIG51bWJlciBwb3NpdGlvbiBpbiB0aGUgZGF0YXNldC4gIFxuICAgICAqIFBhZ2UgbnVtYmVycyBvdXRzaWRlIG9mIHRoaXMgcmFuZ2UgYXJlIHJlcHJlc2VudGVkIGJ5IGFuIGFycm93LlxuICAgICAqIEBwYXJhbSB7TnVtYmVyfSBjdXJyZW50UGFnZSBDdXJyZW50IHBhZ2UgbnVtYmVyLlxuICAgICAqIEByZXR1cm5zIHtOdW1iZXJ9XG4gICAgICovXG4gICAgZmlyc3REaXNwbGF5UGFnZShjdXJyZW50UGFnZSkge1xuICAgICAgICBjb25zdCBtaWRkbGUgPSBNYXRoLmZsb29yKHRoaXMucGFnZXNUb0Rpc3BsYXkgLyAyICsgdGhpcy5wYWdlc1RvRGlzcGxheSAlIDIpO1xuXG4gICAgICAgIGlmIChjdXJyZW50UGFnZSA8IG1pZGRsZSkgcmV0dXJuIDE7XG5cbiAgICAgICAgaWYgKHRoaXMudG90YWxQYWdlcygpIDwgKGN1cnJlbnRQYWdlICsgdGhpcy5wYWdlc1RvRGlzcGxheSAtIG1pZGRsZSkpIHtcbiAgICAgICAgICAgIHJldHVybiBNYXRoLm1heCh0aGlzLnRvdGFsUGFnZXMoKSAtIHRoaXMucGFnZXNUb0Rpc3BsYXkgKyAxLCAxKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBjdXJyZW50UGFnZSAtIG1pZGRsZSArIDE7XG4gICAgfVxuICAgIC8qKlxuICAgICAqIENyZWF0ZXMgdGhlIGh0bWwgbGlzdCBpdGVtIGFuZCBidXR0b24gZWxlbWVudHMgZm9yIHRoZSBwYWdlciBjb250YWluZXIncyB1bCBlbGVtZW50LiAgV2lsbCBhbHNvIHNldCB0aGUgXG4gICAgICogYHRoaXMuY3VycmVudFBhZ2VgIHByb3BlcnR5IHRvIHRoZSBjdXJyZW50IHBhZ2UgbnVtYmVyLlxuICAgICAqIEBwYXJhbSB7TnVtYmVyfSBjdXJyZW50UGFnZSBDdXJyZW50IHBhZ2UgbnVtYmVyLiAgQXNzdW1lcyBhIHZhbGlkIHBhZ2UgbnVtYmVyIGlzIHByb3ZpZGVkLlxuICAgICAqIEBwYXJhbSB7RnVuY3Rpb259IGNhbGxiYWNrIEJ1dHRvbiBjbGljayBoYW5kbGVyLlxuICAgICAqL1xuICAgIHJlbmRlcihjdXJyZW50UGFnZSwgY2FsbGJhY2spIHtcbiAgICAgICAgY29uc3QgdG90YWxQYWdlcyA9IHRoaXMudG90YWxQYWdlcygpO1xuICAgICAgICAvLyBDbGVhciB0aGUgcHJpb3IgbGkgZWxlbWVudHMuXG4gICAgICAgIHRoaXMuZWxQYWdlci5yZXBsYWNlQ2hpbGRyZW4oKTtcblxuICAgICAgICBpZiAodG90YWxQYWdlcyA8PSAxKSByZXR1cm47XG4gICAgICAgIFxuICAgICAgICBjb25zdCBmaXJzdERpc3BsYXkgPSB0aGlzLmZpcnN0RGlzcGxheVBhZ2UoY3VycmVudFBhZ2UpO1xuICAgICAgICBjb25zdCBtYXhQYWdlcyA9IGZpcnN0RGlzcGxheSArIHRoaXMucGFnZXNUb0Rpc3BsYXk7XG4gICAgICAgIFxuICAgICAgICB0aGlzLmN1cnJlbnRQYWdlID0gY3VycmVudFBhZ2U7XG4gICAgICAgIHRoaXMuZWxQYWdlci5hcHBlbmRDaGlsZChQYWdlckJ1dHRvbnMuc3RhcnQoY3VycmVudFBhZ2UsIGNhbGxiYWNrKSk7XG5cbiAgICAgICAgZm9yIChsZXQgcGFnZSA9IGZpcnN0RGlzcGxheTsgcGFnZSA8PSB0b3RhbFBhZ2VzICYmIHBhZ2UgPCBtYXhQYWdlczsgcGFnZSsrKSB7XG4gICAgICAgICAgICB0aGlzLmVsUGFnZXIuYXBwZW5kQ2hpbGQoUGFnZXJCdXR0b25zLnBhZ2VOdW1iZXIocGFnZSwgY3VycmVudFBhZ2UsIGNhbGxiYWNrKSk7XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLmVsUGFnZXIuYXBwZW5kQ2hpbGQoUGFnZXJCdXR0b25zLmVuZCh0b3RhbFBhZ2VzLCBjdXJyZW50UGFnZSwgY2FsbGJhY2spKTtcbiAgICB9XG5cbiAgICBoYW5kbGVQYWdpbmcgPSBhc3luYyAoZSkgPT4ge1xuICAgICAgICBjb25zdCB2YWxpZFBhZ2UgPSB7IHBhZ2U6IHRoaXMudmFsaWRhdGVQYWdlKGUuY3VycmVudFRhcmdldC5kYXRhc2V0LnBhZ2UpIH07XG5cbiAgICAgICAgaWYgKHRoaXMuY29udGV4dC5zZXR0aW5ncy5yZW1vdGVQcm9jZXNzaW5nKSB7XG4gICAgICAgICAgICBhd2FpdCB0aGlzLnJlbmRlclJlbW90ZSh2YWxpZFBhZ2UpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdGhpcy5yZW5kZXJMb2NhbCh2YWxpZFBhZ2UpO1xuICAgICAgICB9XG4gICAgfTtcbiAgICAvKipcbiAgICAgKiBIYW5kbGVyIGZvciByZW5kZXJpbmcgcm93cyB1c2luZyBsb2NhbCBkYXRhIHNvdXJjZS4gIFdpbGwgc2xpY2UgdGhlIGRhdGEgYXJyYXkgYmFzZWQgb24gdGhlIGN1cnJlbnQgcGFnZSBhbmQgcm93cyBwZXIgcGFnZSBzZXR0aW5ncyxcbiAgICAgKiB0aGVuIGNhbGwgYHJlbmRlcmAgdG8gdXBkYXRlIHRoZSBwYWdlciBjb250cm9sLiAgT3B0aW9uYWwgYXJndW1lbnQgYHBhcmFtc2AgaXMgYW4gb2JqZWN0IHRoYXQgY2FuIGNvbnRhaW4gdGhlIGZvbGxvd2luZyBwcm9wZXJ0aWVzOlxuICAgICAqICogYHBhZ2VgOlBhZ2UgbnVtYmVyIHRvIHJlbmRlci4gIElmIG5vdCBwcm92aWRlZCwgZGVmYXVsdHMgdG8gMS5cbiAgICAgKiBAcGFyYW0ge3sgcGFnZTogbnVtYmVyIH0gfCBudWxsfSBwYXJhbXMgXG4gICAgICovXG4gICAgcmVuZGVyTG9jYWwgPSAocGFyYW1zID0ge30pID0+IHtcbiAgICAgICAgY29uc3QgcGFnZSA9ICFwYXJhbXMucGFnZSA/IDEgOiB0aGlzLnZhbGlkYXRlUGFnZShwYXJhbXMucGFnZSk7XG4gICAgICAgIGNvbnN0IGJlZ2luID0gKHBhZ2UgLSAxKSAqIHRoaXMucm93c1BlclBhZ2U7XG4gICAgICAgIGNvbnN0IGVuZCA9IGJlZ2luICsgdGhpcy5yb3dzUGVyUGFnZTtcbiAgICAgICAgY29uc3QgZGF0YSA9IHRoaXMuY29udGV4dC5wZXJzaXN0ZW5jZS5kYXRhLnNsaWNlKGJlZ2luLCBlbmQpO1xuXG4gICAgICAgIHRoaXMuY29udGV4dC5ncmlkLnJlbmRlclJvd3MoZGF0YSwgdGhpcy5jb250ZXh0LnBlcnNpc3RlbmNlLnJvd0NvdW50KTtcbiAgICAgICAgdGhpcy50b3RhbFJvd3MgPSB0aGlzLmNvbnRleHQucGVyc2lzdGVuY2Uucm93Q291bnQ7XG4gICAgICAgIHRoaXMucmVuZGVyKHBhZ2UsIHRoaXMuaGFuZGxlUGFnaW5nKTtcbiAgICB9O1xuICAgIC8qKlxuICAgICAqIEhhbmRsZXIgZm9yIHJlbmRlcmluZyByb3dzIHVzaW5nIHJlbW90ZSBkYXRhIHNvdXJjZS4gIFdpbGwgY2FsbCB0aGUgYGRhdGFsb2FkZXJgIHRvIHJlcXVlc3QgZGF0YSBiYXNlZCBvbiB0aGUgcHJvdmlkZWQgcGFyYW1zLFxuICAgICAqIHRoZW4gY2FsbCBgcmVuZGVyYCB0byB1cGRhdGUgdGhlIHBhZ2VyIGNvbnRyb2wuICBPcHRpb25hbCBhcmd1bWVudCBgcGFyYW1zYCBpcyBhbiBvYmplY3QgdGhhdCBjYW4gY29udGFpbiB0aGUgZm9sbG93aW5nIHByb3BlcnRpZXM6XG4gICAgICogKiBgcGFnZWA6IFBhZ2UgbnVtYmVyIHRvIHJlbmRlci4gIElmIG5vdCBwcm92aWRlZCwgZGVmYXVsdHMgdG8gMS5cbiAgICAgKiBAcGFyYW0ge3sgcGFnZTogbnVtYmVyIH0gfCBudWxsfSBwYXJhbXMgXG4gICAgICovXG4gICAgcmVuZGVyUmVtb3RlID0gYXN5bmMgKHBhcmFtcyA9IHt9KSA9PiB7XG4gICAgICAgIGlmICghcGFyYW1zLnBhZ2UpIHBhcmFtcy5wYWdlID0gMTtcbiAgICAgICAgXG4gICAgICAgIHBhcmFtcyA9IHRoaXMuY29udGV4dC5ldmVudHMuY2hhaW4oXCJyZW1vdGVQYXJhbXNcIiwgcGFyYW1zKTtcblxuICAgICAgICBjb25zdCBkYXRhID0gYXdhaXQgdGhpcy5jb250ZXh0LmRhdGFsb2FkZXIucmVxdWVzdEdyaWREYXRhKHBhcmFtcyk7XG4gICAgICAgIGNvbnN0IHJvd0NvdW50ID0gZGF0YS5yb3dDb3VudCA/PyAwO1xuXG4gICAgICAgIHRoaXMuY29udGV4dC5ncmlkLnJlbmRlclJvd3MoZGF0YS5kYXRhLCByb3dDb3VudCk7XG4gICAgICAgIHRoaXMudG90YWxSb3dzID0gcm93Q291bnQ7XG4gICAgICAgIHRoaXMucmVuZGVyKHBhcmFtcy5wYWdlLCB0aGlzLmhhbmRsZVBhZ2luZyk7XG4gICAgfTtcbn1cblxuUGFnZXJNb2R1bGUubW9kdWxlTmFtZSA9IFwicGFnZXJcIjtcblxuZXhwb3J0IHsgUGFnZXJNb2R1bGUgfTsiLCIvKipcbiAqIFdpbGwgcmUtbG9hZCB0aGUgZ3JpZCdzIGRhdGEgZnJvbSBpdHMgdGFyZ2V0IHNvdXJjZSAobG9jYWwgb3IgcmVtb3RlKS5cbiAqL1xuY2xhc3MgUmVmcmVzaE1vZHVsZSB7XG4gICAgLyoqXG4gICAgICogV2lsbCBhcHBseSBldmVudCB0byB0YXJnZXQgYnV0dG9uIHRoYXQsIHdoZW4gY2xpY2tlZCwgd2lsbCByZS1sb2FkIHRoZSBcbiAgICAgKiBncmlkJ3MgZGF0YSBmcm9tIGl0cyB0YXJnZXQgc291cmNlIChsb2NhbCBvciByZW1vdGUpLlxuICAgICAqIEBwYXJhbSB7R3JpZENvbnRleHR9IGNvbnRleHQgR3JpZCBjb250ZXh0IGNsYXNzLlxuICAgICAqL1xuICAgIGNvbnN0cnVjdG9yKGNvbnRleHQpIHtcbiAgICAgICAgdGhpcy5jb250ZXh0ID0gY29udGV4dDtcbiAgICB9XG5cbiAgICBpbml0aWFsaXplKCkge1xuICAgICAgICBpZiAoIXRoaXMuY29udGV4dC5zZXR0aW5ncy5yZW1vdGVQcm9jZXNzaW5nICYmIHRoaXMuY29udGV4dC5zZXR0aW5ncy5yZW1vdGVVcmwpIHtcbiAgICAgICAgICAgIHRoaXMuY29udGV4dC5waXBlbGluZS5hZGRTdGVwKFwicmVmcmVzaFwiLCB0aGlzLmNvbnRleHQucGVyc2lzdGVuY2Uuc2V0RGF0YSk7XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCBidG4gPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCh0aGlzLmNvbnRleHQuc2V0dGluZ3MucmVmcmVzaGFibGVJZCk7XG4gICAgICAgIFxuICAgICAgICBidG4uYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsIHRoaXMuaGFuZGxlUmVmcmVzaCk7XG4gICAgfVxuXG4gICAgaGFuZGxlUmVmcmVzaCA9IGFzeW5jICgpID0+IHtcbiAgICAgICAgaWYgKHRoaXMuY29udGV4dC5waXBlbGluZS5oYXNQaXBlbGluZShcInJlZnJlc2hcIikpIHtcbiAgICAgICAgICAgIGF3YWl0IHRoaXMuY29udGV4dC5waXBlbGluZS5leGVjdXRlKFwicmVmcmVzaFwiKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGF3YWl0IHRoaXMuY29udGV4dC5ldmVudHMudHJpZ2dlcihcInJlbmRlclwiKTtcbiAgICB9O1xufVxuXG5SZWZyZXNoTW9kdWxlLm1vZHVsZU5hbWUgPSBcInJlZnJlc2hcIjtcblxuZXhwb3J0IHsgUmVmcmVzaE1vZHVsZSB9OyIsIi8qKlxuICogUmVzcG9uc2libGUgZm9yIHJlbmRlcmluZyB0aGUgZ3JpZHMgcm93cyB1c2luZyBlaXRoZXIgbG9jYWwgb3IgcmVtb3RlIGRhdGEuICBUaGlzIHNob3VsZCBiZSB0aGUgZGVmYXVsdCBtb2R1bGUgdG8gXG4gKiBjcmVhdGUgcm93IGRhdGEgaWYgcGFnaW5nIGlzIG5vdCBlbmFibGVkLiAgU3Vic2NyaWJlcyB0byB0aGUgYHJlbmRlcmAgZXZlbnQgdG8gY3JlYXRlIHRoZSBncmlkJ3Mgcm93cyBhbmQgdGhlIGByZW1vdGVQYXJhbXNgIFxuICogZXZlbnQgZm9yIHJlbW90ZSBwcm9jZXNzaW5nLlxuICogXG4gKiBDbGFzcyB3aWxsIGNhbGwgdGhlICdyZW1vdGVQYXJhbXMnIGV2ZW50IHRvIGNvbmNhdGVuYXRlIHBhcmFtZXRlcnMgZm9yIHJlbW90ZSBkYXRhIHJlcXVlc3RzLlxuICovXG5jbGFzcyBSb3dNb2R1bGUge1xuICAgIC8qKlxuICAgICAqIENyZWF0ZXMgZ3JpZCByb3dzLiAgVGhpcyBzaG91bGQgYmUgdGhlIGRlZmF1bHQgbW9kdWxlIHRvIGNyZWF0ZSByb3cgZGF0YSBpZiBwYWdpbmcgaXMgbm90IGVuYWJsZWQuXG4gICAgICogQHBhcmFtIHtHcmlkQ29udGV4dH0gY29udGV4dCBHcmlkIGNvbnRleHQgY2xhc3MuXG4gICAgICovXG4gICAgY29uc3RydWN0b3IoY29udGV4dCkge1xuICAgICAgICB0aGlzLmNvbnRleHQgPSBjb250ZXh0O1xuICAgIH1cblxuICAgIGluaXRpYWxpemUoKSB7XG4gICAgICAgIGlmICh0aGlzLmNvbnRleHQuc2V0dGluZ3MucmVtb3RlUHJvY2Vzc2luZykge1xuICAgICAgICAgICAgdGhpcy5jb250ZXh0LmV2ZW50cy5zdWJzY3JpYmUoXCJyZW5kZXJcIiwgdGhpcy5yZW5kZXJSZW1vdGUsIHRydWUsIDEwKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHRoaXMuY29udGV4dC5ldmVudHMuc3Vic2NyaWJlKFwicmVuZGVyXCIsIHRoaXMucmVuZGVyTG9jYWwsIGZhbHNlLCAxMCk7XG4gICAgICAgIH1cbiAgICB9XG4gICAgLyoqXG4gICAgICogUmVuZGVycyB0aGUgZ3JpZCByb3dzIHVzaW5nIGxvY2FsIGRhdGEuICBUaGlzIGlzIHRoZSBkZWZhdWx0IG1ldGhvZCB0byByZW5kZXIgcm93cyB3aGVuIHJlbW90ZSBwcm9jZXNzaW5nIGlzIG5vdCBlbmFibGVkLlxuICAgICAqL1xuICAgIHJlbmRlckxvY2FsID0gKCkgPT4ge1xuICAgICAgICB0aGlzLmNvbnRleHQuZ3JpZC5yZW5kZXJSb3dzKHRoaXMuY29udGV4dC5wZXJzaXN0ZW5jZS5kYXRhKTtcbiAgICB9O1xuICAgIC8qKlxuICAgICAqIFJlbmRlcnMgdGhlIGdyaWQgcm93cyB1c2luZyByZW1vdGUgZGF0YS4gIFRoaXMgbWV0aG9kIHdpbGwgY2FsbCB0aGUgYHJlbW90ZVBhcmFtc2AgZXZlbnQgdG8gZ2V0IHRoZSBwYXJhbWV0ZXJzIGZvciB0aGUgcmVtb3RlIHJlcXVlc3QuXG4gICAgICovXG4gICAgcmVuZGVyUmVtb3RlID0gYXN5bmMgKCkgPT4ge1xuICAgICAgICBjb25zdCBwYXJhbXMgPSB0aGlzLmNvbnRleHQuZXZlbnRzLmNoYWluKFwicmVtb3RlUGFyYW1zXCIsIHt9KTtcbiAgICAgICAgY29uc3QgZGF0YSA9IGF3YWl0IHRoaXMuY29udGV4dC5kYXRhbG9hZGVyLnJlcXVlc3RHcmlkRGF0YShwYXJhbXMpO1xuXG4gICAgICAgIHRoaXMuY29udGV4dC5ncmlkLnJlbmRlclJvd3MoZGF0YSk7XG4gICAgfTtcbn1cblxuUm93TW9kdWxlLm1vZHVsZU5hbWUgPSBcInJvd1wiO1xuXG5leHBvcnQgeyBSb3dNb2R1bGUgfTsiLCIvKipcbiAqIFVwZGF0ZXMgdGFyZ2V0IGxhYmVsIHdpdGggYSBjb3VudCBvZiByb3dzIGluIGdyaWQuXG4gKi9cbmNsYXNzIFJvd0NvdW50TW9kdWxlIHtcbiAgICAvKipcbiAgICAgKiBVcGRhdGVzIHRhcmdldCBsYWJlbCBzdXBwbGllZCBpbiBzZXR0aW5ncyB3aXRoIGEgY291bnQgb2Ygcm93cyBpbiBncmlkLlxuICAgICAqIEBwYXJhbSB7R3JpZENvbnRleHR9IGNvbnRleHQgR3JpZCBjb250ZXh0IGNsYXNzLlxuICAgICAqL1xuICAgIGNvbnN0cnVjdG9yKGNvbnRleHQpIHtcbiAgICAgICAgdGhpcy5jb250ZXh0ID0gY29udGV4dDtcbiAgICAgICAgdGhpcy5lbGVtZW50ID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoY29udGV4dC5zZXR0aW5ncy5yb3dDb3VudElkKTtcbiAgICB9XG5cbiAgICBpbml0aWFsaXplKCkge1xuICAgICAgICB0aGlzLmNvbnRleHQuZXZlbnRzLnN1YnNjcmliZShcInJlbmRlclwiLCB0aGlzLmhhbmRsZUNvdW50LCBmYWxzZSwgMjApO1xuICAgIH1cblxuICAgIGhhbmRsZUNvdW50ID0gKCkgPT4ge1xuICAgICAgICB0aGlzLmVsZW1lbnQuaW5uZXJUZXh0ID0gdGhpcy5jb250ZXh0LmdyaWQucm93Q291bnQ7XG4gICAgfTtcbn1cblxuUm93Q291bnRNb2R1bGUubW9kdWxlTmFtZSA9IFwicm93Y291bnRcIjtcblxuZXhwb3J0IHsgUm93Q291bnRNb2R1bGUgfTsiLCIvKipcbiAqIENsYXNzIHRvIG1hbmFnZSBzb3J0aW5nIGZ1bmN0aW9uYWxpdHkgaW4gYSBncmlkIGNvbnRleHQuICBGb3IgcmVtb3RlIHByb2Nlc3NpbmcsIHdpbGwgc3Vic2NyaWJlIHRvIHRoZSBgcmVtb3RlUGFyYW1zYCBldmVudC5cbiAqIEZvciBsb2NhbCBwcm9jZXNzaW5nLCB3aWxsIHN1YnNjcmliZSB0byB0aGUgYHJlbmRlcmAgZXZlbnQuXG4gKiBcbiAqIENsYXNzIHdpbGwgdHJpZ2dlciB0aGUgYHJlbmRlcmAgZXZlbnQgYWZ0ZXIgc29ydGluZyBpcyBhcHBsaWVkLCBhbGxvd2luZyB0aGUgZ3JpZCB0byByZS1yZW5kZXIgd2l0aCB0aGUgc29ydGVkIGRhdGEuXG4gKi9cbmNsYXNzIFNvcnRNb2R1bGUge1xuICAgIC8qKlxuICAgICAqIENyZWF0ZXMgYSBuZXcgU29ydE1vZHVsZSBvYmplY3QuXG4gICAgICogQHBhcmFtIHtHcmlkQ29udGV4dH0gY29udGV4dCBcbiAgICAgKi9cbiAgICBjb25zdHJ1Y3Rvcihjb250ZXh0KSB7XG4gICAgICAgIHRoaXMuY29udGV4dCA9IGNvbnRleHQ7XG4gICAgICAgIHRoaXMuaGVhZGVyQ2VsbHMgPSBbXTtcbiAgICAgICAgdGhpcy5jdXJyZW50U29ydENvbHVtbiA9IFwiXCI7XG4gICAgICAgIHRoaXMuY3VycmVudERpcmVjdGlvbiA9IFwiXCI7XG4gICAgICAgIHRoaXMuY3VycmVudFR5cGUgPSBcIlwiO1xuICAgIH1cblxuICAgIGluaXRpYWxpemUoKSB7XG4gICAgICAgIGlmICh0aGlzLmNvbnRleHQuc2V0dGluZ3MucmVtb3RlUHJvY2Vzc2luZykge1xuICAgICAgICAgICAgdGhpcy5jdXJyZW50U29ydENvbHVtbiA9IHRoaXMuY29udGV4dC5zZXR0aW5ncy5yZW1vdGVTb3J0RGVmYXVsdENvbHVtbjtcbiAgICAgICAgICAgIHRoaXMuY3VycmVudERpcmVjdGlvbiA9IHRoaXMuY29udGV4dC5zZXR0aW5ncy5yZW1vdGVTb3J0RGVmYXVsdERpcmVjdGlvbjtcbiAgICAgICAgICAgIHRoaXMuY29udGV4dC5ldmVudHMuc3Vic2NyaWJlKFwicmVtb3RlUGFyYW1zXCIsIHRoaXMucmVtb3RlUGFyYW1zLCB0cnVlKTtcbiAgICAgICAgICAgIHRoaXMuX2luaXQodGhpcy5oYW5kbGVSZW1vdGUpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdGhpcy5jb250ZXh0LmV2ZW50cy5zdWJzY3JpYmUoXCJyZW5kZXJcIiwgdGhpcy5yZW5kZXJMb2NhbCwgZmFsc2UsIDkpO1xuICAgICAgICAgICAgLy90aGlzLnNvcnRlcnMgPSB7IG51bWJlcjogc29ydE51bWJlciwgc3RyaW5nOiBzb3J0U3RyaW5nLCBkYXRlOiBzb3J0RGF0ZSwgZGF0ZXRpbWU6IHNvcnREYXRlIH07XG4gICAgICAgICAgICB0aGlzLnNvcnRlcnMgPSB0aGlzLiNzZXRMb2NhbEZpbHRlcnMoKTtcbiAgICAgICAgICAgIHRoaXMuX2luaXQodGhpcy5oYW5kbGVMb2NhbCk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBfaW5pdChjYWxsYmFjaykge1xuICAgICAgICAvL2JpbmQgbGlzdGVuZXIgZm9yIG5vbi1pY29uIGNvbHVtbnM7IGFkZCBjc3Mgc29ydCB0YWcuXG4gICAgICAgIGZvciAoY29uc3QgY29sIG9mIHRoaXMuY29udGV4dC5jb2x1bW5NYW5hZ2VyLmNvbHVtbnMpIHtcbiAgICAgICAgICAgIGlmIChjb2wudHlwZSAhPT0gXCJpY29uXCIpIHtcbiAgICAgICAgICAgICAgICB0aGlzLmhlYWRlckNlbGxzLnB1c2goY29sLmhlYWRlckNlbGwpO1xuICAgICAgICAgICAgICAgIGNvbC5oZWFkZXJDZWxsLnNwYW4uY2xhc3NMaXN0LmFkZChcInNvcnRcIik7XG4gICAgICAgICAgICAgICAgY29sLmhlYWRlckNlbGwuc3Bhbi5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgY2FsbGJhY2spO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuXG4gICAgI3NldExvY2FsRmlsdGVycygpIHtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIGRhdGU6IChhLCBiLCBkaXJlY3Rpb24pID0+IHtcbiAgICAgICAgICAgICAgICBsZXQgY29tcGFyaXNvbiA9IDA7XG4gICAgICAgICAgICAgICAgbGV0IGRhdGVBID0gbmV3IERhdGUoYSk7XG4gICAgICAgICAgICAgICAgbGV0IGRhdGVCID0gbmV3IERhdGUoYik7XG5cbiAgICAgICAgICAgICAgICBpZiAoTnVtYmVyLmlzTmFOKGRhdGVBLnZhbHVlT2YoKSkpIHtcbiAgICAgICAgICAgICAgICAgICAgZGF0ZUEgPSBudWxsO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIGlmIChOdW1iZXIuaXNOYU4oZGF0ZUIudmFsdWVPZigpKSkge1xuICAgICAgICAgICAgICAgICAgICBkYXRlQiA9IG51bGw7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIC8vaGFuZGxlIGVtcHR5IHZhbHVlcy5cbiAgICAgICAgICAgICAgICBpZiAoIWRhdGVBKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbXBhcmlzb24gPSAhZGF0ZUIgPyAwIDogLTE7XG4gICAgICAgICAgICAgICAgfSBlbHNlIGlmICghZGF0ZUIpIHtcbiAgICAgICAgICAgICAgICAgICAgY29tcGFyaXNvbiA9IDE7XG4gICAgICAgICAgICAgICAgfSBlbHNlIGlmIChkYXRlQSA+IGRhdGVCKSB7ICAgIFxuICAgICAgICAgICAgICAgICAgICBjb21wYXJpc29uID0gMTtcbiAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKGRhdGVBIDwgZGF0ZUIpIHtcbiAgICAgICAgICAgICAgICAgICAgY29tcGFyaXNvbiA9IC0xO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIHJldHVybiBkaXJlY3Rpb24gPT09IFwiZGVzY1wiID8gKGNvbXBhcmlzb24gKiAtMSkgOiBjb21wYXJpc29uO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIG51bWJlcjogKGEsIGIsIGRpcmVjdGlvbikgPT4ge1xuICAgICAgICAgICAgICAgIGxldCBjb21wYXJpc29uID0gMDtcblxuICAgICAgICAgICAgICAgIGlmIChhID4gYikge1xuICAgICAgICAgICAgICAgICAgICBjb21wYXJpc29uID0gMTtcbiAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKGEgPCBiKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbXBhcmlzb24gPSAtMTtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICByZXR1cm4gZGlyZWN0aW9uID09PSBcImRlc2NcIiA/IChjb21wYXJpc29uICogLTEpIDogY29tcGFyaXNvbjtcbiAgICAgICAgICAgIH0sIFxuICAgICAgICAgICAgc3RyaW5nOiAoYSwgYiwgZGlyZWN0aW9uKSA9PiB7XG4gICAgICAgICAgICAgICAgbGV0IGNvbXBhcmlzb24gPSAwO1xuICAgICAgICAgICAgICAgIC8vaGFuZGxlIGVtcHR5IHZhbHVlcy5cbiAgICAgICAgICAgICAgICBpZiAoIWEpIHtcbiAgICAgICAgICAgICAgICAgICAgY29tcGFyaXNvbiA9ICFiID8gMCA6IC0xO1xuICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAoIWIpIHtcbiAgICAgICAgICAgICAgICAgICAgY29tcGFyaXNvbiA9IDE7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgdmFyQSA9IGEudG9VcHBlckNhc2UoKTtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgdmFyQiA9IGIudG9VcHBlckNhc2UoKTtcbiAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICAgICAgaWYgKHZhckEgPiB2YXJCKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb21wYXJpc29uID0gMTtcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIGlmICh2YXJBIDwgdmFyQikge1xuICAgICAgICAgICAgICAgICAgICAgICAgY29tcGFyaXNvbiA9IC0xO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgcmV0dXJuIGRpcmVjdGlvbiA9PT0gXCJkZXNjXCIgPyAoY29tcGFyaXNvbiAqIC0xKSA6IGNvbXBhcmlzb247XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG4gICAgfVxuXG4gICAgcmVtb3RlUGFyYW1zID0gKHBhcmFtcykgPT4ge1xuICAgICAgICBwYXJhbXMuc29ydCA9IHRoaXMuY3VycmVudFNvcnRDb2x1bW47XG4gICAgICAgIHBhcmFtcy5kaXJlY3Rpb24gPSB0aGlzLmN1cnJlbnREaXJlY3Rpb247XG5cbiAgICAgICAgcmV0dXJuIHBhcmFtcztcbiAgICB9O1xuXG4gICAgaGFuZGxlUmVtb3RlID0gYXN5bmMgKGMpID0+IHtcbiAgICAgICAgdGhpcy5jdXJyZW50U29ydENvbHVtbiA9IGMuY3VycmVudFRhcmdldC5jb250ZXh0Lm5hbWU7XG4gICAgICAgIHRoaXMuY3VycmVudERpcmVjdGlvbiA9IGMuY3VycmVudFRhcmdldC5jb250ZXh0LmRpcmVjdGlvbk5leHQudmFsdWVPZigpO1xuICAgICAgICB0aGlzLmN1cnJlbnRUeXBlID0gYy5jdXJyZW50VGFyZ2V0LmNvbnRleHQudHlwZTtcblxuICAgICAgICBpZiAoIWMuY3VycmVudFRhcmdldC5jb250ZXh0LmlzQ3VycmVudFNvcnQpIHtcbiAgICAgICAgICAgIHRoaXMucmVzZXRTb3J0KCk7XG4gICAgICAgIH1cblxuICAgICAgICBjLmN1cnJlbnRUYXJnZXQuY29udGV4dC5zZXRTb3J0RmxhZygpO1xuXG4gICAgICAgIGF3YWl0IHRoaXMuY29udGV4dC5ldmVudHMudHJpZ2dlcihcInJlbmRlclwiKTtcbiAgICB9O1xuXG4gICAgcmVzZXRTb3J0KCkge1xuICAgICAgICBjb25zdCBjZWxsID0gdGhpcy5oZWFkZXJDZWxscy5maW5kKGUgPT4gZS5pc0N1cnJlbnRTb3J0KTtcblxuICAgICAgICBpZiAoY2VsbCAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICBjZWxsLnJlbW92ZVNvcnRGbGFnKCk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICByZW5kZXJMb2NhbCA9ICgpID0+IHtcbiAgICAgICAgaWYgKCF0aGlzLmN1cnJlbnRTb3J0Q29sdW1uKSByZXR1cm47XG5cbiAgICAgICAgdGhpcy5jb250ZXh0LnBlcnNpc3RlbmNlLmRhdGEuc29ydCgoYSwgYikgPT4ge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuc29ydGVyc1t0aGlzLmN1cnJlbnRUeXBlXShhW3RoaXMuY3VycmVudFNvcnRDb2x1bW5dLCBiW3RoaXMuY3VycmVudFNvcnRDb2x1bW5dLCB0aGlzLmN1cnJlbnREaXJlY3Rpb24pO1xuICAgICAgICB9KTtcbiAgICB9O1xuXG4gICAgaGFuZGxlTG9jYWwgPSBhc3luYyAoYykgPT4ge1xuICAgICAgICB0aGlzLmN1cnJlbnRTb3J0Q29sdW1uID0gYy5jdXJyZW50VGFyZ2V0LmNvbnRleHQubmFtZTtcbiAgICAgICAgdGhpcy5jdXJyZW50RGlyZWN0aW9uID0gYy5jdXJyZW50VGFyZ2V0LmNvbnRleHQuZGlyZWN0aW9uTmV4dC52YWx1ZU9mKCk7XG4gICAgICAgIHRoaXMuY3VycmVudFR5cGUgPSBjLmN1cnJlbnRUYXJnZXQuY29udGV4dC50eXBlO1xuXG4gICAgICAgIGlmICghYy5jdXJyZW50VGFyZ2V0LmNvbnRleHQuaXNDdXJyZW50U29ydCkge1xuICAgICAgICAgICAgdGhpcy5yZXNldFNvcnQoKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGMuY3VycmVudFRhcmdldC5jb250ZXh0LnNldFNvcnRGbGFnKCk7XG5cbiAgICAgICAgYXdhaXQgdGhpcy5jb250ZXh0LmV2ZW50cy50cmlnZ2VyKFwicmVuZGVyXCIpO1xuICAgIH07XG59XG5cblNvcnRNb2R1bGUubW9kdWxlTmFtZSA9IFwic29ydFwiO1xuXG5leHBvcnQgeyBTb3J0TW9kdWxlIH07IiwiaW1wb3J0IHsgR3JpZENvbnRleHQgfSBmcm9tIFwiLi4vY29tcG9uZW50cy9jb250ZXh0L2dyaWRDb250ZXh0LmpzXCI7XG5pbXBvcnQgeyBNZXJnZU9wdGlvbnMgfSBmcm9tIFwiLi4vc2V0dGluZ3MvbWVyZ2VPcHRpb25zLmpzXCI7XG5pbXBvcnQgeyBTZXR0aW5nc0dyaWQgfSBmcm9tIFwiLi4vc2V0dGluZ3Mvc2V0dGluZ3NHcmlkLmpzXCI7XG5pbXBvcnQgeyBSb3dNb2R1bGUgfSBmcm9tIFwiLi4vbW9kdWxlcy9yb3cvcm93TW9kdWxlLmpzXCI7XG5pbXBvcnQgeyBQYWdlck1vZHVsZSB9IGZyb20gXCIuLi9tb2R1bGVzL3BhZ2VyL3BhZ2VyTW9kdWxlLmpzXCI7XG4vKipcbiAqIENyZWF0ZXMgZ3JpZCdzIGNvcmUgcHJvcGVydGllcyBhbmQgb2JqZWN0cywgYW5kIGFsbG93cyBmb3IgcmVnaXN0cmF0aW9uIG9mIG1vZHVsZXMgdXNlZCB0byBidWlsZCBmdW5jdGlvbmFsaXR5LlxuICogVXNlIHRoaXMgY2xhc3MgYXMgYSBiYXNlIGNsYXNzIHRvIGNyZWF0ZSBhIGdyaWQgd2l0aCBjdXN0b20gbW9kdWxhciBmdW5jdGlvbmFsaXR5IHVzaW5nIHRoZSBgZXh0ZW5kc2AgY2xhc3MgcmVmZXJlbmNlLlxuICovXG5jbGFzcyBHcmlkQ29yZSB7XG4gICAgI21vZHVsZVR5cGVzO1xuICAgICNtb2R1bGVzQ3JlYXRlZDtcbiAgICAvKipcbiAgICAqIENyZWF0ZXMgZ3JpZCdzIGNvcmUgcHJvcGVydGllcyBhbmQgb2JqZWN0cyBhbmQgaWRlbnRpZmllcyBkaXYgZWxlbWVudCB3aGljaCBncmlkIHdpbGwgYmUgYnVpbHQuICBBZnRlciBpbnN0YW50aWF0aW9uLCBcbiAgICAqIHVzZSB0aGUgYGFkZE1vZHVsZXNgIG1ldGhvZCB0byByZWdpc3RlciBkZXNpcmVkIG1vZHVsZXMgdG8gY29tcGxldGUgdGhlIHNldHVwIHByb2Nlc3MuICBNb2R1bGUgcmVnaXN0cmF0aW9uIGlzIGtlcHQgXG4gICAgKiBzZXBhcmF0ZSBmcm9tIGNvbnN0cnVjdG9yIHRvIGFsbG93IGN1c3RvbWl6YXRpb24gb2YgbW9kdWxlcyB1c2VkIHRvIGJ1aWxkIGdyaWQuXG4gICAgKiBAcGFyYW0ge3N0cmluZ30gY29udGFpbmVyIGRpdiBlbGVtZW50IElEIHRvIGJ1aWxkIGdyaWQgaW4uXG4gICAgKiBAcGFyYW0ge29iamVjdH0gc2V0dGluZ3MgVXNlciBzZXR0aW5nczsga2V5L3ZhbHVlIHBhaXJzLlxuICAgICovXG4gICAgY29uc3RydWN0b3IoY29udGFpbmVyLCBzZXR0aW5ncykge1xuICAgICAgICBjb25zdCBzb3VyY2UgPSBNZXJnZU9wdGlvbnMubWVyZ2Uoc2V0dGluZ3MpO1xuXG4gICAgICAgIHRoaXMuc2V0dGluZ3MgPSBuZXcgU2V0dGluZ3NHcmlkKHNvdXJjZSk7XG4gICAgICAgIHRoaXMuY29udGFpbmVyID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoY29udGFpbmVyKTtcbiAgICAgICAgdGhpcy5lbmFibGVQYWdpbmcgPSB0aGlzLnNldHRpbmdzLmVuYWJsZVBhZ2luZztcbiAgICAgICAgdGhpcy5pc1ZhbGlkID0gdHJ1ZTtcbiAgICAgICAgdGhpcy4jbW9kdWxlVHlwZXMgPSBbXTtcbiAgICAgICAgdGhpcy4jbW9kdWxlc0NyZWF0ZWQgPSBmYWxzZTtcbiAgICAgICAgdGhpcy5tb2R1bGVzID0ge307XG5cbiAgICAgICAgaWYgKE9iamVjdC52YWx1ZXMoc291cmNlLmNvbHVtbnMpLmxlbmd0aCA9PT0gMCkge1xuICAgICAgICAgICAgY29uc29sZS5sb2coXCJNaXNzaW5nIHJlcXVpcmVkIGNvbHVtbnMgZGVmaW5pdGlvbi5cIik7XG4gICAgICAgICAgICB0aGlzLmlzVmFsaWQgPSBmYWxzZTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGNvbnN0IGRhdGEgPSBzb3VyY2UuZGF0YSA/PyBbXTtcbiAgICAgICAgICAgIHRoaXMuI2luaXQoc291cmNlLmNvbHVtbnMsIGRhdGEpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgI2luaXQoY29sdW1ucywgZGF0YSkge1xuICAgICAgICB0aGlzLmNvbnRleHQgPSBuZXcgR3JpZENvbnRleHQoY29sdW1ucywgdGhpcy5zZXR0aW5ncywgZGF0YSk7XG5cbiAgICAgICAgdGhpcy5jb250YWluZXIuYXBwZW5kKHRoaXMuY29udGV4dC5ncmlkLnRhYmxlKTtcbiAgICB9XG4gICAgLyoqXG4gICAgICogUmVnaXN0ZXIgbW9kdWxlcyB0byBiZSB1c2VkIGluIHRoZSBidWlsZGluZyBhbmQgb3BlcmF0aW9uIG9mIHRoZSBncmlkLiAgXG4gICAgICogXG4gICAgICogTk9URTogVGhpcyBtZXRob2Qgc2hvdWxkIGJlIGNhbGxlZCBiZWZvcmUgdGhlIGBpbml0KClgIG1ldGhvZC5cbiAgICAgKiBAcGFyYW0ge2NsYXNzfSBtb2R1bGVzIENsYXNzIG1vZHVsZShzKS5cbiAgICAgKi9cbiAgICBhZGRNb2R1bGVzKC4uLm1vZHVsZXMpIHtcbiAgICAgICAgbW9kdWxlcy5mb3JFYWNoKChtKSA9PiB0aGlzLiNtb2R1bGVUeXBlcy5wdXNoKG0pKTtcbiAgICB9XG4gICAgLyoqXG4gICAgICogQWRkcyBhIG5ldyBjb2x1bW4gdG8gdGhlIGdyaWQuICBUaGUgY29sdW1uIHdpbGwgYmUgYWRkZWQgdG8gdGhlIGVuZCBvZiB0aGUgY29sdW1ucyBjb2xsZWN0aW9uIGJ5IGRlZmF1bHQsIGJ1dCBjYW4gXG4gICAgICogYmUgaW5zZXJ0ZWQgYXQgYSBzcGVjaWZpYyBpbmRleC4gIFxuICAgICAqIFxuICAgICAqIE5PVEU6IFRoaXMgbWV0aG9kIHNob3VsZCBiZSBjYWxsZWQgYmVmb3JlIHRoZSBgaW5pdCgpYCBtZXRob2QuXG4gICAgICogQHBhcmFtIHtPYmplY3R9IGNvbHVtbiBDb2x1bW4gb2JqZWN0IGRlZmluaXRpb24uXG4gICAgICogQHBhcmFtIHtudW1iZXJ9IFtpbmRleFBvc2l0aW9uPW51bGxdIEluZGV4IHRvIGluc2VydCB0aGUgY29sdW1uIGF0LiBJZiBudWxsLCBhcHBlbmRzIHRvIHRoZSBlbmQuXG4gICAgICovXG4gICAgYWRkQ29sdW1uKGNvbHVtbiwgaW5kZXhQb3NpdGlvbiA9IG51bGwpIHtcbiAgICAgICAgdGhpcy5jb250ZXh0LmNvbHVtbk1hbmFnZXIuYWRkQ29sdW1uKGNvbHVtbiwgaW5kZXhQb3NpdGlvbik7XG4gICAgfVxuICAgIC8qKlxuICAgICAqIEl0ZXJhdGVzIHRob3VnaCBhIGxpc3Qgb2YgbW9kdWxlcyB0byBpbnN0YW50aWF0ZSBhbmQgaW5pdGlhbGl6ZSBzdGFydCB1cCBhbmQvb3IgYnVpbGQgYmVoYXZpb3IuICBTaG91bGQgYmUgY2FsbGVkIGFmdGVyIFxuICAgICAqIGFsbCBtb2R1bGVzIGhhdmUgYmVlbiByZWdpc3RlcmVkIHVzaW5nIHRoZSBgYWRkTW9kdWxlc2AgbWV0aG9kLCBhbmQgb25seSBuZWVkcyB0byBiZSBjYWxsZWQgb25jZS5cbiAgICAgKi9cbiAgICAjaW5pdE1vZHVsZXMgPSBhc3luYyAoKSA9PiB7XG4gICAgICAgIGlmICh0aGlzLiNtb2R1bGVzQ3JlYXRlZClcbiAgICAgICAgICAgIHJldHVybjtcblxuICAgICAgICAvL1ZlcmlmeSBpZiBiYXNlIHJlcXVpcmVkIHJvdyByZWxhdGVkIG1vZHVsZSBoYXMgYmVlbiBhZGRlZCB0byB0aGUgZ3JpZC5cbiAgICAgICAgaWYgKHRoaXMuc2V0dGluZ3MuZW5hYmxlUGFnaW5nICYmICF0aGlzLiNtb2R1bGVUeXBlcy5zb21lKCh4KSA9PiB4Lm1vZHVsZU5hbWUgPT09IFwicGFnZVwiKSkge1xuICAgICAgICAgICAgdGhpcy4jbW9kdWxlVHlwZXMucHVzaChQYWdlck1vZHVsZSk7XG4gICAgICAgIH0gZWxzZSBpZiAoIXRoaXMuI21vZHVsZVR5cGVzLnNvbWUoKHgpID0+IHgubW9kdWxlTmFtZSA9PT0gXCJyb3dcIikpIHtcbiAgICAgICAgICAgICB0aGlzLiNtb2R1bGVUeXBlcy5wdXNoKFJvd01vZHVsZSk7XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLiNtb2R1bGVUeXBlcy5mb3JFYWNoKChtKSA9PiB7XG4gICAgICAgICAgICB0aGlzLmNvbnRleHQubW9kdWxlc1ttLm1vZHVsZU5hbWVdID0gbmV3IG0odGhpcy5jb250ZXh0KTtcbiAgICAgICAgICAgIHRoaXMuY29udGV4dC5tb2R1bGVzW20ubW9kdWxlTmFtZV0uaW5pdGlhbGl6ZSgpO1xuICAgICAgICB9KTtcblxuICAgICAgICB0aGlzLiNtb2R1bGVzQ3JlYXRlZCA9IHRydWU7XG4gICAgICAgIGF3YWl0IHRoaXMuY29udGV4dC5ldmVudHMudHJpZ2dlcihcInBvc3RJbml0TW9kXCIpO1xuICAgIH07XG4gICAgLyoqXG4gICAgICogSW5zdGFudGlhdGVzIHRoZSBjcmVhdGlvbiBvZiB0aGUgZ3JpZC4gIE1ldGhvZCB3aWxsIGNyZWF0ZSB0aGUgZ3JpZCdzIGVsZW1lbnRzLCBydW4gYWxsIHJlZ2lzdGVyZWQgbW9kdWxlcywgZGF0YSBwcm9jZXNzaW5nIFxuICAgICAqIHBpcGVsaW5lcyBhbmQgZXZlbnRzLiAgSWYgZ3JpZCBpcyBiZWluZyBidWlsdCB1c2luZyB0aGUgbW9kdWxhciBhcHByb2FjaCwgYmUgc3VyZSB0byBjYWxsIHRoZSBgYWRkTW9kdWxlc2AgbWV0aG9kIGJlZm9yZSBcbiAgICAgKiBjYWxsaW5nIHRoaXMgb25lIHRvIGVuc3VyZSBhbGwgbW9kdWxlcyBhcmUgcmVnaXN0ZXJlZCBhbmQgaW5pdGlhbGl6ZWQgaW4gdGhlaXIgcHJvcGVyIG9yZGVyLlxuICAgICAqIFxuICAgICAqIE5PVEU6IE1ldGhvZCB3aWxsIGF1dG9tYXRpY2FsbHkgcmVnaXN0ZXIgdGhlIGBQYWdlck1vZHVsZWAgaWYgcGFnaW5nIGlzIGVuYWJsZWQsIG9yIHRoZSBgUm93TW9kdWxlYCBpZiBwYWdpbmcgaXMgbm90IGVuYWJsZWQuXG4gICAgICovXG4gICAgYXN5bmMgaW5pdCgpIHtcbiAgICAgICAgaWYgKCF0aGlzLmlzVmFsaWQpIHtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiTWlzc2luZyByZXF1aXJlZCBjb2x1bW5zIGRlZmluaXRpb24uXCIpO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5jb250ZXh0LmdyaWQuaW5pdGlhbGl6ZUhlYWRlcigpO1xuXG4gICAgICAgIGF3YWl0IHRoaXMuI2luaXRNb2R1bGVzKCk7XG5cbiAgICAgICAgaWYgKCF0aGlzLnNldHRpbmdzLnJlbW90ZVByb2Nlc3NpbmcgJiYgdGhpcy5zZXR0aW5ncy5yZW1vdGVVcmwpIHtcbiAgICAgICAgICAgIC8vbG9jYWwgZGF0YSBzb3VyY2UgcHJvY2Vzc2luZzsgc2V0IHBpcGVsaW5lIGFjdGlvbnMuXG4gICAgICAgICAgICB0aGlzLmNvbnRleHQucGlwZWxpbmUuYWRkU3RlcChcImluaXRcIiwgdGhpcy5jb250ZXh0LnBlcnNpc3RlbmNlLnNldERhdGEpO1xuICAgICAgICB9XG4gICAgICAgIC8vZXhlY3V0ZSBkYXRhIHBpcGVsaW5lIGJlZm9yZSBidWlsZGluZyBlbGVtZW50cy5cbiAgICAgICAgaWYgKHRoaXMuY29udGV4dC5waXBlbGluZS5oYXNQaXBlbGluZShcImluaXRcIikpIHtcbiAgICAgICAgICAgIGF3YWl0IHRoaXMuY29udGV4dC5waXBlbGluZS5leGVjdXRlKFwiaW5pdFwiKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGF3YWl0IHRoaXMuY29udGV4dC5ldmVudHMudHJpZ2dlcihcInJlbmRlclwiKTtcbiAgICB9XG4gICAgLyoqXG4gICAgICogQXBwbHkgZmlsdGVyIGNvbmRpdGlvbiBmb3IgdGFyZ2V0IGNvbHVtbi4gIE1ldGhvZCBwcm92aWRlcyBhIG1lYW5zIHRvIGFwcGx5IGNvbmRpdGlvbiBvdXRzaWRlIG9mIGhlYWRlciBmaWx0ZXIgY29udHJvbHMuXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IGZpZWxkIFRhcmdldCBmaWVsZC5cbiAgICAgKiBAcGFyYW0ge29iamVjdH0gdmFsdWUgRmlsdGVyIHZhbHVlLlxuICAgICAqIEBwYXJhbSB7c3RyaW5nIHwgRnVuY3Rpb259IFt0eXBlPVwiZXF1YWxzXCJdIEZpbHRlciB0eXBlLiAgSWYgYSBmdW5jdGlvbiBpcyBwcm92aWRlZCwgaXQgd2lsbCBiZSB1c2VkIGFzIHRoZSBmaWx0ZXIgY29uZGl0aW9uLlxuICAgICAqIE90aGVyd2lzZSwgdXNlIHRoZSBhc3NvY2lhdGVkIHN0cmluZyB2YWx1ZSB0eXBlIHRvIGRldGVybWluZSB0aGUgZmlsdGVyIGNvbmRpdGlvbi4gIGkuZS4gXCJlcXVhbHNcIiwgXCJjb250YWluc1wiLCBldGMuXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IFtmaWVsZFR5cGU9XCJzdHJpbmdcIl0gRmllbGQgdHlwZS5cbiAgICAgKiBAcGFyYW0ge29iamVjdH0gW2ZpbHRlclBhcmFtcz17fV0gQWRkaXRpb25hbCBmaWx0ZXIgcGFyYW1ldGVycy5cbiAgICAgKi9cbiAgICBzZXRGaWx0ZXIgPSBhc3luYyAoZmllbGQsIHZhbHVlLCB0eXBlID0gXCJlcXVhbHNcIiwgZmllbGRUeXBlID0gXCJzdHJpbmdcIiwgZmlsdGVyUGFyYW1zID0ge30pID0+IHtcbiAgICAgICAgaWYgKHRoaXMuY29udGV4dC5tb2R1bGVzLmZpbHRlcikge1xuICAgICAgICAgICAgdGhpcy5jb250ZXh0Lm1vZHVsZXMuZmlsdGVyLnNldEZpbHRlcihmaWVsZCwgdmFsdWUsIHR5cGUsIGZpZWxkVHlwZSwgZmlsdGVyUGFyYW1zKTtcblxuICAgICAgICAgICAgYXdhaXQgdGhpcy5jb250ZXh0LmV2ZW50cy50cmlnZ2VyKFwicmVuZGVyXCIpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgY29uc29sZS53YXJuKFwiRmlsdGVyIG1vZHVsZSBpcyBub3QgZW5hYmxlZC4gIFNldCBgRGF0YUdyaWQuZGVmYXVsdE9wdGlvbnMuZW5hYmxlRmlsdGVyYCB0byB0cnVlIGluIG9yZGVyIHRvIGVuYWJsZSB0aGlzIGZ1bmN0aW9uLlwiKTtcbiAgICAgICAgfVxuICAgIH07XG4gICAgLyoqXG4gICAgICogUmVtb3ZlIGZpbHRlciBjb25kaXRpb24gZm9yIHRhcmdldCBmaWVsZC5cbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gZmllbGQgVGFyZ2V0IGZpZWxkLlxuICAgICAqL1xuICAgIHJlbW92ZUZpbHRlciA9IGFzeW5jIChmaWVsZCkgPT4ge1xuICAgICAgICBpZiAodGhpcy5jb250ZXh0Lm1vZHVsZXMuZmlsdGVyKSB7XG4gICAgICAgICAgICB0aGlzLmNvbnRleHQubW9kdWxlcy5maWx0ZXIucmVtb3ZlRmlsdGVyKGZpZWxkKTtcblxuICAgICAgICAgICAgYXdhaXQgdGhpcy5jb250ZXh0LmV2ZW50cy50cmlnZ2VyKFwicmVuZGVyXCIpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgY29uc29sZS53YXJuKFwiRmlsdGVyIG1vZHVsZSBpcyBub3QgZW5hYmxlZC4gIFNldCBgRGF0YUdyaWQuZGVmYXVsdE9wdGlvbnMuZW5hYmxlRmlsdGVyYCB0byB0cnVlIGluIG9yZGVyIHRvIGVuYWJsZSB0aGlzIGZ1bmN0aW9uLlwiKTtcbiAgICAgICAgfVxuICAgIH07XG59XG5cbmV4cG9ydCB7IEdyaWRDb3JlIH07IiwiaW1wb3J0IHsgR3JpZENvcmUgfSBmcm9tIFwiLi9jb3JlL2dyaWRDb3JlLmpzXCI7XG5pbXBvcnQgeyBDc3ZNb2R1bGUgfSBmcm9tIFwiLi9tb2R1bGVzL2Rvd25sb2FkL2Nzdk1vZHVsZS5qc1wiO1xuaW1wb3J0IHsgRmlsdGVyTW9kdWxlIH0gZnJvbSBcIi4vbW9kdWxlcy9maWx0ZXIvZmlsdGVyTW9kdWxlLmpzXCI7XG5pbXBvcnQgeyBSZWZyZXNoTW9kdWxlIH0gZnJvbSBcIi4vbW9kdWxlcy9yb3cvcmVmcmVzaE1vZHVsZS5qc1wiO1xuaW1wb3J0IHsgUm93Q291bnRNb2R1bGUgfSBmcm9tIFwiLi9tb2R1bGVzL3Jvdy9yb3dDb3VudE1vZHVsZS5qc1wiO1xuaW1wb3J0IHsgU29ydE1vZHVsZSB9IGZyb20gXCIuL21vZHVsZXMvc29ydC9zb3J0TW9kdWxlLmpzXCI7XG5cbmNsYXNzIERhdGFHcmlkIGV4dGVuZHMgR3JpZENvcmUge1xuICAgIGNvbnN0cnVjdG9yKGNvbnRhaW5lciwgc2V0dGluZ3MpIHtcbiAgICAgICAgc3VwZXIoY29udGFpbmVyLCBzZXR0aW5ncyk7XG5cbiAgICAgICAgaWYgKERhdGFHcmlkLmRlZmF1bHRPcHRpb25zLmVuYWJsZUZpbHRlcikge1xuICAgICAgICAgICAgdGhpcy5hZGRNb2R1bGVzKEZpbHRlck1vZHVsZSk7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoRGF0YUdyaWQuZGVmYXVsdE9wdGlvbnMuZW5hYmxlU29ydCkge1xuICAgICAgICAgICAgdGhpcy5hZGRNb2R1bGVzKFNvcnRNb2R1bGUpO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHRoaXMuc2V0dGluZ3Mucm93Q291bnRJZCkge1xuICAgICAgICAgICAgdGhpcy5hZGRNb2R1bGVzKFJvd0NvdW50TW9kdWxlKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICh0aGlzLnNldHRpbmdzLnJlZnJlc2hhYmxlSWQpIHtcbiAgICAgICAgICAgIHRoaXMuYWRkTW9kdWxlcyhSZWZyZXNoTW9kdWxlKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICh0aGlzLnNldHRpbmdzLmNzdkV4cG9ydElkKSB7XG4gICAgICAgICAgICB0aGlzLmFkZE1vZHVsZXMoQ3N2TW9kdWxlKTtcbiAgICAgICAgfVxuICAgIH1cbn1cblxuRGF0YUdyaWQuZGVmYXVsdE9wdGlvbnMgPSB7XG4gICAgZW5hYmxlU29ydDogdHJ1ZSxcbiAgICBlbmFibGVGaWx0ZXI6IHRydWVcbn07XG5cbmV4cG9ydCB7IERhdGFHcmlkIH07Il0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLE1BQU0sVUFBVSxDQUFDO0FBQ2pCLElBQUksT0FBTyxTQUFTLEdBQUcsSUFBSSxNQUFNLENBQUMsYUFBYSxDQUFDO0FBQ2hEO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxJQUFJLE9BQU8sU0FBUyxDQUFDLEtBQUssRUFBRTtBQUM1QjtBQUNBO0FBQ0EsUUFBUSxJQUFJLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLEVBQUU7QUFDekMsWUFBWSxLQUFLLEdBQUcsQ0FBQyxFQUFFLEtBQUssQ0FBQyxNQUFNLENBQUM7QUFDcEMsUUFBUTs7QUFFUixRQUFRLE1BQU0s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
