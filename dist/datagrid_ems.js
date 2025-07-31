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
    /**
     * Helper function to create an option element for the multi-select control.
     * @param {Object} item key/value pair object that contains the value and text for the option.
     * @returns {HTMLDivElement} Returns a div element that represents the option in the multi-select control.
     */
    createOption(item) { 
        const option = ElementHelper.div({ className: cssHelper.multiSelect.option }, { value: item.value, selected: "false" });
        const radio = ElementHelper.span({ className: cssHelper.multiSelect.optionRadio });
        const text = ElementHelper.span({ className: cssHelper.multiSelect.optionText, innerHTML: item.text });

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
                option.classList.add(cssHelper.multiSelect.selected);
                option.dataset.selected = "true";
                newSelected.push(item.value);

                if (this.listAll) {
                    const span = ElementHelper.span({ className: cssHelper.multiSelect.headerOption, innerText: item.value }, { value: item.value });
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

export { Cell, Column, ColumnManager, CsvModule, DataGrid, DataLoader, DataPersistence, DataPipeline, DateHelper, ElementBetween, ElementHelper, ElementInput, ElementMultiSelect, ElementSelect, FilterModule, FormatDateTime, FormatLink, FormatNumeric, FormatStar, GridContext, GridCore, GridEvents, HeaderCell, MergeOptions, PagerButtons, PagerModule, RefreshModule, RowCountModule, RowModule, SettingsGrid, SortModule, Table, cssHelper, settingsDefaults as settingsDefault };
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGF0YWdyaWRfZW1zLmpzIiwic291cmNlcyI6WyIuLi9zcmMvY29tcG9uZW50cy9oZWxwZXJzL2RhdGVIZWxwZXIuanMiLCIuLi9zcmMvY29tcG9uZW50cy9jZWxsL2Zvcm1hdHRlcnMvZGF0ZXRpbWUuanMiLCIuLi9zcmMvY29tcG9uZW50cy9jZWxsL2Zvcm1hdHRlcnMvbGluay5qcyIsIi4uL3NyYy9jb21wb25lbnRzL2NlbGwvZm9ybWF0dGVycy9udW1lcmljLmpzIiwiLi4vc3JjL2NvbXBvbmVudHMvY2VsbC9mb3JtYXR0ZXJzL3N0YXIuanMiLCIuLi9zcmMvY29tcG9uZW50cy9oZWxwZXJzL2Nzc0hlbHBlci5qcyIsIi4uL3NyYy9jb21wb25lbnRzL2NlbGwvY2VsbC5qcyIsIi4uL3NyYy9jb21wb25lbnRzL2NlbGwvaGVhZGVyQ2VsbC5qcyIsIi4uL3NyYy9jb21wb25lbnRzL2NvbHVtbi9jb2x1bW4uanMiLCIuLi9zcmMvY29tcG9uZW50cy9jb2x1bW4vY29sdW1uTWFuYWdlci5qcyIsIi4uL3NyYy9zZXR0aW5ncy9zZXR0aW5nc0RlZmF1bHQuanMiLCIuLi9zcmMvc2V0dGluZ3MvbWVyZ2VPcHRpb25zLmpzIiwiLi4vc3JjL3NldHRpbmdzL3NldHRpbmdzR3JpZC5qcyIsIi4uL3NyYy9jb21wb25lbnRzL2RhdGEvZGF0YUxvYWRlci5qcyIsIi4uL3NyYy9jb21wb25lbnRzL2RhdGEvZGF0YVBlcnNpc3RlbmNlLmpzIiwiLi4vc3JjL2NvbXBvbmVudHMvZGF0YS9kYXRhUGlwZWxpbmUuanMiLCIuLi9zcmMvY29tcG9uZW50cy9oZWxwZXJzL2VsZW1lbnRIZWxwZXIuanMiLCIuLi9zcmMvY29tcG9uZW50cy9ldmVudHMvZ3JpZEV2ZW50cy5qcyIsIi4uL3NyYy9jb21wb25lbnRzL3RhYmxlL3RhYmxlLmpzIiwiLi4vc3JjL2NvbXBvbmVudHMvY29udGV4dC9ncmlkQ29udGV4dC5qcyIsIi4uL3NyYy9tb2R1bGVzL2Rvd25sb2FkL2Nzdk1vZHVsZS5qcyIsIi4uL3NyYy9tb2R1bGVzL2ZpbHRlci9lbGVtZW50cy9lbGVtZW50QmV0d2Vlbi5qcyIsIi4uL3NyYy9tb2R1bGVzL2ZpbHRlci9lbGVtZW50cy9lbGVtZW50SW5wdXQuanMiLCIuLi9zcmMvbW9kdWxlcy9maWx0ZXIvZWxlbWVudHMvZWxlbWVudFNlbGVjdC5qcyIsIi4uL3NyYy9tb2R1bGVzL2ZpbHRlci9lbGVtZW50cy9lbGVtZW50TXVsdGlTZWxlY3QuanMiLCIuLi9zcmMvbW9kdWxlcy9maWx0ZXIvdHlwZXMvZmlsdGVyVGFyZ2V0LmpzIiwiLi4vc3JjL21vZHVsZXMvZmlsdGVyL3R5cGVzL2ZpbHRlckRhdGUuanMiLCIuLi9zcmMvbW9kdWxlcy9maWx0ZXIvdHlwZXMvZmlsdGVyRnVuY3Rpb24uanMiLCIuLi9zcmMvbW9kdWxlcy9maWx0ZXIvZmlsdGVyTW9kdWxlLmpzIiwiLi4vc3JjL21vZHVsZXMvcGFnZXIvcGFnZXJCdXR0b25zLmpzIiwiLi4vc3JjL21vZHVsZXMvcGFnZXIvcGFnZXJNb2R1bGUuanMiLCIuLi9zcmMvbW9kdWxlcy9yZWZyZXNoL3JlZnJlc2hNb2R1bGUuanMiLCIuLi9zcmMvbW9kdWxlcy9yb3cvcm93TW9kdWxlLmpzIiwiLi4vc3JjL21vZHVsZXMvcm93L3Jvd0NvdW50TW9kdWxlLmpzIiwiLi4vc3JjL21vZHVsZXMvc29ydC9zb3J0TW9kdWxlLmpzIiwiLi4vc3JjL2NvcmUvZ3JpZENvcmUuanMiLCIuLi9zcmMvZGF0YWdyaWQuanMiXSwic291cmNlc0NvbnRlbnQiOlsiY2xhc3MgRGF0ZUhlbHBlciB7XG4gICAgc3RhdGljIHRpbWVSZUdleCA9IG5ldyBSZWdFeHAoXCJbMC05XTpbMC05XVwiKTtcbiAgICAvKipcbiAgICAgKiBDb252ZXJ0IHN0cmluZyB0byBEYXRlIG9iamVjdCB0eXBlLiAgRXhwZWN0cyBzdHJpbmcgZm9ybWF0IG9mIHllYXItbW9udGgtZGF5LlxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSB2YWx1ZSBTdHJpbmcgZGF0ZSB3aXRoIGZvcm1hdCBvZiB5ZWFyLW1vbnRoLWRheS5cbiAgICAgKiBAcmV0dXJucyB7RGF0ZSB8IHN0cmluZ30gRGF0ZSBpZiBjb252ZXJzaW9uIGlzIHN1Y2Nlc3NmdWwuICBPdGhlcndpc2UsIGVtcHR5IHN0cmluZy5cbiAgICAgKi9cbiAgICBzdGF0aWMgcGFyc2VEYXRlKHZhbHVlKSB7XG4gICAgICAgIC8vQ2hlY2sgaWYgc3RyaW5nIGlzIGRhdGUgb25seSBieSBsb29raW5nIGZvciBtaXNzaW5nIHRpbWUgY29tcG9uZW50LiAgXG4gICAgICAgIC8vSWYgbWlzc2luZywgYWRkIGl0IHNvIGRhdGUgaXMgaW50ZXJwcmV0ZWQgYXMgbG9jYWwgdGltZS5cbiAgICAgICAgaWYgKCF0aGlzLnRpbWVSZUdleC50ZXN0KHZhbHVlKSkge1xuICAgICAgICAgICAgdmFsdWUgPSBgJHt2YWx1ZX1UMDA6MDBgO1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc3QgZGF0ZSA9IG5ldyBEYXRlKHZhbHVlKTtcbiAgICAgICAgXG4gICAgICAgIHJldHVybiAoTnVtYmVyLmlzTmFOKGRhdGUudmFsdWVPZigpKSkgPyBcIlwiIDogZGF0ZTtcbiAgICB9XG4gICAgLyoqXG4gICAgICogQ29udmVydCBzdHJpbmcgdG8gRGF0ZSBvYmplY3QgdHlwZSwgc2V0dGluZyB0aGUgdGltZSBjb21wb25lbnQgdG8gbWlkbmlnaHQuICBFeHBlY3RzIHN0cmluZyBmb3JtYXQgb2YgeWVhci1tb250aC1kYXkuXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IHZhbHVlIFN0cmluZyBkYXRlIHdpdGggZm9ybWF0IG9mIHllYXItbW9udGgtZGF5LlxuICAgICAqIEByZXR1cm5zIHtEYXRlIHwgc3RyaW5nfSBEYXRlIGlmIGNvbnZlcnNpb24gaXMgc3VjY2Vzc2Z1bC4gIE90aGVyd2lzZSwgZW1wdHkgc3RyaW5nLlxuICAgICAqL1xuICAgIHN0YXRpYyBwYXJzZURhdGVPbmx5KHZhbHVlKSB7XG4gICAgICAgIGNvbnN0IGRhdGUgPSB0aGlzLnBhcnNlRGF0ZSh2YWx1ZSk7XG5cbiAgICAgICAgaWYgKGRhdGUgPT09IFwiXCIpIHJldHVybiBcIlwiOyAgLy9JbnZhbGlkIGRhdGUuXG5cbiAgICAgICAgZGF0ZS5zZXRIb3VycygwLCAwLCAwLCAwKTsgLy9TZXQgdGltZSB0byBtaWRuaWdodCB0byByZW1vdmUgdGltZSBjb21wb25lbnQuXG5cbiAgICAgICAgcmV0dXJuIGRhdGU7XG4gICAgfVxuXG4gICAgc3RhdGljIGlzRGF0ZSh2YWx1ZSkgeyBcbiAgICAgICAgcmV0dXJuIE9iamVjdC5wcm90b3R5cGUudG9TdHJpbmcuY2FsbCh2YWx1ZSkgPT09IFwiW29iamVjdCBEYXRlXVwiO1xuXG4gICAgfVxuXG59XG5cbmV4cG9ydCB7IERhdGVIZWxwZXIgfTsiLCJpbXBvcnQgeyBEYXRlSGVscGVyIH0gZnJvbSBcIi4uLy4uL2hlbHBlcnMvZGF0ZUhlbHBlci5qc1wiO1xuLyoqXG4gKiBQcm92aWRlcyBtZXRob2RzIHRvIGZvcm1hdCBkYXRlIGFuZCB0aW1lIHN0cmluZ3MuICBFeHBlY3RzIGRhdGUgc3RyaW5nIGluIGZvcm1hdCBvZiB5ZWFyLW1vbnRoLWRheS5cbiAqL1xuY2xhc3MgRm9ybWF0RGF0ZVRpbWUge1xuICAgIHN0YXRpYyBtb250aHNMb25nID0gW1wiSmFudWFyeVwiLCBcIkZlYnJ1YXJ5XCIsIFwiTWFyY2hcIiwgXCJBcHJpbFwiLCBcIk1heVwiLCBcIkp1bmVcIiwgXCJKdWx5XCIsIFwiQXVndXN0XCIsIFwiU2VwdGVtYmVyXCIsIFwiT2N0b2JlclwiLCBcIk5vdmVtYmVyXCIsIFwiRGVjZW1iZXJcIl07XG4gICAgc3RhdGljIG1vbnRoc1Nob3J0ID0gW1wiSmFuXCIsIFwiRmViXCIsIFwiTWFyXCIsIFwiQXByXCIsIFwiTWF5XCIsIFwiSnVuXCIsIFwiSnVsXCIsIFwiQXVnXCIsIFwiU2VwXCIsIFwiT2N0XCIsIFwiTm92XCIsIFwiRGVjXCJdO1xuXG4gICAgc3RhdGljIGxlYWRpbmdaZXJvKG51bSkge1xuICAgICAgICByZXR1cm4gbnVtIDwgMTAgPyBcIjBcIiArIG51bSA6IG51bTtcbiAgICB9XG4gICAgLyoqXG4gICAgICogUmV0dXJucyBhIGZvcm1hdHRlZCBkYXRlIHRpbWUgc3RyaW5nLiAgRXhwZWN0cyBkYXRlIHN0cmluZyBpbiBmb3JtYXQgb2YgeWVhci1tb250aC1kYXkuICBJZiBgZm9ybWF0dGVyUGFyYW1zYCBpcyBlbXB0eSwgXG4gICAgICogZnVuY3Rpb24gd2lsbCByZXZlcnQgdG8gZGVmYXVsdCB2YWx1ZXMuIEV4cGVjdGVkIHByb3BlcnR5IHZhbHVlcyBpbiBgZm9ybWF0dGVyUGFyYW1zYCBvYmplY3Q6XG4gICAgICogLSBkYXRlRmllbGQ6IGZpZWxkIHRvIGNvbnZlcnQgZGF0ZSB0aW1lLlxuICAgICAqIC0gZm9ybWF0OiBzdHJpbmcgZm9ybWF0IHRlbXBsYXRlLlxuICAgICAqIEBwYXJhbSB7T2JqZWN0fSByb3dEYXRhIFJvdyBkYXRhLlxuICAgICAqIEBwYXJhbSB7Q29sdW1ufSBjb2x1bW4gQ29sdW1uIGNsYXNzIG9iamVjdC5cbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gZGVmYXVsdEZvcm1hdCBEZWZhdWx0IHN0cmluZyBmb3JtYXQ6IE1NL2RkL3l5eXlcbiAgICAgKiBAcGFyYW0ge2Jvb2xlYW59IFthZGRUaW1lPWZhbHNlXSBBcHBseSBkYXRlIHRpbWUgZm9ybWF0dGluZz9cbiAgICAgKiBAcmV0dXJucyB7c3RyaW5nfVxuICAgICAqL1xuICAgIHN0YXRpYyBhcHBseShyb3dEYXRhLCBjb2x1bW4sIGRlZmF1bHRGb3JtYXQgPSBcIk1NL2RkL3l5eXlcIiwgYWRkVGltZSA9IGZhbHNlKSB7XG4gICAgICAgIGxldCByZXN1bHQgPSBjb2x1bW4/LmZvcm1hdHRlclBhcmFtcz8uZm9ybWF0ID8/IGRlZmF1bHRGb3JtYXQ7XG4gICAgICAgIGxldCBmaWVsZCA9IGNvbHVtbj8uZm9ybWF0dGVyUGFyYW1zPy5kYXRlRmllbGQgXG4gICAgICAgICAgICA/IHJvd0RhdGFbY29sdW1uLmZvcm1hdHRlclBhcmFtcy5kYXRlRmllbGRdXG4gICAgICAgICAgICA6IHJvd0RhdGFbY29sdW1uLmZpZWxkXTtcblxuICAgICAgICBpZiAoZmllbGQgPT09IG51bGwpIHtcbiAgICAgICAgICAgIHJldHVybiBcIlwiO1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc3QgZGF0ZSA9IERhdGVIZWxwZXIucGFyc2VEYXRlKGZpZWxkKTtcblxuICAgICAgICBpZiAoZGF0ZSA9PT0gXCJcIikge1xuICAgICAgICAgICAgcmV0dXJuIFwiXCI7XG4gICAgICAgIH1cblxuICAgICAgICBsZXQgZm9ybWF0cyA9IHtcbiAgICAgICAgICAgIGQ6IGRhdGUuZ2V0RGF0ZSgpLFxuICAgICAgICAgICAgZGQ6IHRoaXMubGVhZGluZ1plcm8oZGF0ZS5nZXREYXRlKCkpLFxuXG4gICAgICAgICAgICBNOiBkYXRlLmdldE1vbnRoKCkgKyAxLFxuICAgICAgICAgICAgTU06IHRoaXMubGVhZGluZ1plcm8oZGF0ZS5nZXRNb250aCgpICsgMSksXG4gICAgICAgICAgICBNTU06IHRoaXMubW9udGhzU2hvcnRbZGF0ZS5nZXRNb250aCgpXSxcbiAgICAgICAgICAgIE1NTU06IHRoaXMubW9udGhzTG9uZ1tkYXRlLmdldE1vbnRoKCldLFxuXG4gICAgICAgICAgICB5eTogZGF0ZS5nZXRGdWxsWWVhcigpLnRvU3RyaW5nKCkuc2xpY2UoLTIpLFxuICAgICAgICAgICAgeXl5eTogZGF0ZS5nZXRGdWxsWWVhcigpXG4gICAgICAgIH07XG5cbiAgICAgICAgaWYgKGFkZFRpbWUpIHtcbiAgICAgICAgICAgIGxldCBob3VycyA9IGRhdGUuZ2V0SG91cnMoKTtcbiAgICAgICAgICAgIGxldCBob3VyczEyID0gaG91cnMgJSAxMiA9PT0gMCA/IDEyIDogaG91cnMgJSAxMjtcblxuICAgICAgICAgICAgZm9ybWF0cy5zID0gZGF0ZS5nZXRTZWNvbmRzKCk7XG4gICAgICAgICAgICBmb3JtYXRzLnNzID0gdGhpcy5sZWFkaW5nWmVybyhkYXRlLmdldFNlY29uZHMoKSk7XG4gICAgICAgICAgICBmb3JtYXRzLm0gPSBkYXRlLmdldE1pbnV0ZXMoKTtcbiAgICAgICAgICAgIGZvcm1hdHMubW0gPSB0aGlzLmxlYWRpbmdaZXJvKGRhdGUuZ2V0TWludXRlcygpKTtcbiAgICAgICAgICAgIGZvcm1hdHMuaCA9IGhvdXJzMTI7XG4gICAgICAgICAgICBmb3JtYXRzLmhoID0gIHRoaXMubGVhZGluZ1plcm8oaG91cnMxMik7XG4gICAgICAgICAgICBmb3JtYXRzLkggPSBob3VycztcbiAgICAgICAgICAgIGZvcm1hdHMuSEggPSB0aGlzLmxlYWRpbmdaZXJvKGhvdXJzKTtcbiAgICAgICAgICAgIGZvcm1hdHMuaHAgPSBob3VycyA8IDEyID8gXCJBTVwiIDogXCJQTVwiO1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc3QgdGFyZ2V0cyA9IHJlc3VsdC5zcGxpdCgvXFwvfC18XFxzfDovKTtcblxuICAgICAgICBmb3IgKGxldCBpdGVtIG9mIHRhcmdldHMpIHtcbiAgICAgICAgICAgIHJlc3VsdCA9IHJlc3VsdC5yZXBsYWNlKGl0ZW0sIGZvcm1hdHNbaXRlbV0pO1xuICAgICAgICB9XG4gICAgXG4gICAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgfVxufVxuXG5leHBvcnQgeyBGb3JtYXREYXRlVGltZSB9OyIsIi8qKlxuICogUHJvdmlkZXMgbWV0aG9kIHRvIGZvcm1hdCBhIGxpbmsgYXMgYW4gYW5jaG9yIHRhZyBlbGVtZW50LlxuICovXG5jbGFzcyBGb3JtYXRMaW5rIHtcbiAgICAvKipcbiAgICAgKiBGb3JtYXR0ZXIgdGhhdCBjcmVhdGUgYW4gYW5jaG9yIHRhZyBlbGVtZW50LiBocmVmIGFuZCBvdGhlciBhdHRyaWJ1dGVzIGNhbiBiZSBtb2RpZmllZCB3aXRoIHByb3BlcnRpZXMgaW4gdGhlIFxuICAgICAqICdmb3JtYXR0ZXJQYXJhbXMnIHBhcmFtZXRlci4gIEV4cGVjdGVkIHByb3BlcnR5IHZhbHVlczogXG4gICAgICogLSB1cmxQcmVmaXg6IEJhc2UgdXJsIGFkZHJlc3MuXG4gICAgICogLSByb3V0ZUZpZWxkOiBSb3V0ZSB2YWx1ZS5cbiAgICAgKiAtIHF1ZXJ5RmllbGQ6IEZpZWxkIG5hbWUgZnJvbSBkYXRhc2V0IHRvIGJ1aWxkIHF1ZXJ5IHN0aW5nIGtleS92YWx1ZSBpbnB1dC5cbiAgICAgKiAtIGZpZWxkVGV4dDogVXNlIGZpZWxkIG5hbWUgdG8gc2V0IGlubmVyIHRleHQgdG8gYXNzb2NpYXRlZCBkYXRhc2V0IHZhbHVlLlxuICAgICAqIC0gaW5uZXJUZXh0OiBSYXcgaW5uZXIgdGV4dCB2YWx1ZSBvciBmdW5jdGlvbi4gIElmIGZ1bmN0aW9uIGlzIHByb3ZpZGVkLCBpdCB3aWxsIGJlIGNhbGxlZCB3aXRoIHJvd0RhdGEgYW5kIGZvcm1hdHRlclBhcmFtcyBhcyBwYXJhbWV0ZXJzLlxuICAgICAqIC0gdGFyZ2V0OiBIb3cgdGFyZ2V0IGRvY3VtZW50IHNob3VsZCBiZSBvcGVuZWQuXG4gICAgICogQHBhcmFtIHtPYmplY3R9IHJvd0RhdGEgUm93IGRhdGEuXG4gICAgICogQHBhcmFtIHt7IHVybFByZWZpeDogc3RyaW5nLCBxdWVyeUZpZWxkOiBzdHJpbmcsIGZpZWxkVGV4dDogc3RyaW5nLCBpbm5lclRleHQ6IHN0cmluZyB8IEZ1bmN0aW9uLCB0YXJnZXQ6IHN0cmluZyB9fSBmb3JtYXR0ZXJQYXJhbXMgU2V0dGluZ3MuXG4gICAgICogQHJldHVybiB7SFRNTEFuY2hvckVsZW1lbnR9IGFuY2hvciB0YWcgZWxlbWVudC5cbiAgICAgKiAqL1xuICAgIHN0YXRpYyBhcHBseShyb3dEYXRhLCBmb3JtYXR0ZXJQYXJhbXMpIHtcbiAgICAgICAgY29uc3QgZWwgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiYVwiKTtcblxuICAgICAgICBsZXQgdXJsID0gZm9ybWF0dGVyUGFyYW1zLnVybFByZWZpeDtcbiAgICAgICAgLy9BcHBseSByb3V0ZSB2YWx1ZSBiZWZvcmUgcXVlcnkgc3RyaW5nLlxuICAgICAgICBpZiAoZm9ybWF0dGVyUGFyYW1zLnJvdXRlRmllbGQpIHtcbiAgICAgICAgICAgIHVybCArPSBcIi9cIiArIGVuY29kZVVSSUNvbXBvbmVudChyb3dEYXRhW2Zvcm1hdHRlclBhcmFtcy5yb3V0ZUZpZWxkXSk7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoZm9ybWF0dGVyUGFyYW1zLnF1ZXJ5RmllbGQpIHtcbiAgICAgICAgICAgIGNvbnN0IHFyeVZhbHVlID0gZW5jb2RlVVJJQ29tcG9uZW50KHJvd0RhdGFbZm9ybWF0dGVyUGFyYW1zLnF1ZXJ5RmllbGRdKTtcblxuICAgICAgICAgICAgdXJsID0gYCR7dXJsfT8ke2Zvcm1hdHRlclBhcmFtcy5xdWVyeUZpZWxkfT0ke3FyeVZhbHVlfWA7XG4gICAgICAgIH1cblxuICAgICAgICBlbC5ocmVmID0gdXJsO1xuXG4gICAgICAgIGlmIChmb3JtYXR0ZXJQYXJhbXMuZmllbGRUZXh0KSB7XG4gICAgICAgICAgICBlbC5pbm5lckhUTUwgPSByb3dEYXRhW2Zvcm1hdHRlclBhcmFtcy5maWVsZFRleHRdO1xuICAgICAgICB9IGVsc2UgaWYgKCh0eXBlb2YgZm9ybWF0dGVyUGFyYW1zLmlubmVyVGV4dCA9PT0gXCJmdW5jdGlvblwiKSkge1xuICAgICAgICAgICAgZWwuaW5uZXJIVE1MID0gZm9ybWF0dGVyUGFyYW1zLmlubmVyVGV4dChyb3dEYXRhLCBmb3JtYXR0ZXJQYXJhbXMpO1xuICAgICAgICB9IGVsc2UgaWYgKGZvcm1hdHRlclBhcmFtcy5pbm5lclRleHQpIHtcbiAgICAgICAgICAgIGVsLmlubmVySFRNTCA9IGZvcm1hdHRlclBhcmFtcy5pbm5lclRleHQ7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoZm9ybWF0dGVyUGFyYW1zLnRhcmdldCkge1xuICAgICAgICAgICAgZWwuc2V0QXR0cmlidXRlKFwidGFyZ2V0XCIsIGZvcm1hdHRlclBhcmFtcy50YXJnZXQpO1xuICAgICAgICAgICAgZWwuc2V0QXR0cmlidXRlKFwicmVsXCIsIFwibm9vcGVuZXJcIik7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gZWw7XG4gICAgfVxufVxuXG5leHBvcnQgeyBGb3JtYXRMaW5rIH07IiwiLyoqXG4gKiBQcm92aWRlcyBtZXRob2QgdG8gZm9ybWF0IG51bWVyaWMgdmFsdWVzIGludG8gc3RyaW5ncyB3aXRoIHNwZWNpZmllZCBzdHlsZXMgb2YgZGVjaW1hbCwgY3VycmVuY3ksIG9yIHBlcmNlbnQuXG4gKi9cbmNsYXNzIEZvcm1hdE51bWVyaWMge1xuICAgIHN0YXRpYyB2YWxpZFN0eWxlcyA9IFtcImRlY2ltYWxcIiwgXCJjdXJyZW5jeVwiLCBcInBlcmNlbnRcIl07XG4gICAgLyoqXG4gICAgICogUmV0dXJucyBhIGZvcm1hdHRlZCBudW1lcmljIHN0cmluZy4gIEV4cGVjdGVkIHByb3BlcnR5IHZhbHVlczogXG4gICAgICogLSBwcmVjaXNpb246IHJvdW5kaW5nIHByZWNpc2lvbi5cbiAgICAgKiAtIHN0eWxlOiBmb3JtYXR0aW5nIHN0eWxlIHRvIHVzZS5cbiAgICAgKiBAcGFyYW0ge09iamVjdH0gcm93RGF0YSBSb3cgZGF0YS5cbiAgICAgKiBAcGFyYW0ge0NvbHVtbn0gY29sdW1uIENvbHVtbiBjbGFzcyBvYmplY3QuXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IFtzdHlsZT1cImRlY2ltYWxcIl0gRm9ybWF0dGluZyBzdHlsZSB0byB1c2UuIERlZmF1bHQgaXMgXCJkZWNpbWFsXCIuXG4gICAgICogQHBhcmFtIHtudW1iZXJ9IFtwcmVjaXNpb249Ml0gUm91bmRpbmcgcHJlY2lzaW9uLiBEZWZhdWx0IGlzIDIuXG4gICAgICogQHJldHVybnMge3N0cmluZ31cbiAgICAgKi9cbiAgICBzdGF0aWMgYXBwbHkocm93RGF0YSwgY29sdW1uLCBzdHlsZSA9IFwiZGVjaW1hbFwiLCBwcmVjaXNpb24gPSAyKSB7XG4gICAgICAgIGNvbnN0IGZsb2F0VmFsID0gcm93RGF0YVtjb2x1bW4uZmllbGRdO1xuXG4gICAgICAgIGlmIChpc05hTihmbG9hdFZhbCkpIHJldHVybiBmbG9hdFZhbDtcblxuICAgICAgICBpZiAoIXRoaXMudmFsaWRTdHlsZXMuaW5jbHVkZXMoc3R5bGUpKSB7XG4gICAgICAgICAgICBzdHlsZSA9IFwiZGVjaW1hbFwiO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIG5ldyBJbnRsLk51bWJlckZvcm1hdChcImVuLVVTXCIsIHtcbiAgICAgICAgICAgIHN0eWxlOiBzdHlsZSxcbiAgICAgICAgICAgIG1heGltdW1GcmFjdGlvbkRpZ2l0czogcHJlY2lzaW9uLFxuICAgICAgICAgICAgY3VycmVuY3k6IFwiVVNEXCJcbiAgICAgICAgfSkuZm9ybWF0KGZsb2F0VmFsKTtcbiAgICB9XG59XG5cbmV4cG9ydCB7IEZvcm1hdE51bWVyaWMgfTsiLCJjbGFzcyBGb3JtYXRTdGFyIHtcbiAgICAvKipcbiAgICAgKiBSZXR1cm5zIGFuIGVsZW1lbnQgb2Ygc3RhciByYXRpbmdzIGJhc2VkIG9uIGludGVnZXIgdmFsdWVzLiAgRXhwZWN0ZWQgcHJvcGVydHkgdmFsdWVzOiBcbiAgICAgKiAtIHN0YXJzOiBudW1iZXIgb2Ygc3RhcnMgdG8gZGlzcGxheS5cbiAgICAgKiBAcGFyYW0ge09iamVjdH0gcm93RGF0YSByb3cgZGF0YS5cbiAgICAgKiBAcGFyYW0ge0NvbHVtbn0gY29sdW1uIGNvbHVtbiBjbGFzcyBvYmplY3QuXG4gICAgICogQHJldHVybnMge0hUTUxEaXZFbGVtZW50fVxuICAgICAqL1xuICAgIHN0YXRpYyBhcHBseShyb3dEYXRhLCBjb2x1bW4pIHtcbiAgICAgICAgbGV0IHZhbHVlID0gcm93RGF0YVtjb2x1bW4uZmllbGRdO1xuICAgICAgICBjb25zdCBtYXhTdGFycyA9IGNvbHVtbi5mb3JtYXR0ZXJQYXJhbXM/LnN0YXJzID8gY29sdW1uLmZvcm1hdHRlclBhcmFtcy5zdGFycyA6IDU7XG4gICAgICAgIGNvbnN0IGNvbnRhaW5lciA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJkaXZcIik7XG4gICAgICAgIGNvbnN0IHN0YXJzID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcInNwYW5cIik7XG4gICAgICAgIGNvbnN0IHN0YXIgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50TlMoXCJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2Z1wiLCBcInN2Z1wiKTtcbiAgICAgICAgY29uc3Qgc3RhckFjdGl2ZSA9ICc8cG9seWdvbiBmaWxsPVwiI0ZGRUEwMFwiIHN0cm9rZT1cIiNDMUFCNjBcIiBzdHJva2Utd2lkdGg9XCIzNy42MTUyXCIgc3Ryb2tlLWxpbmVjYXA9XCJyb3VuZFwiIHN0cm9rZS1saW5lam9pbj1cInJvdW5kXCIgc3Ryb2tlLW1pdGVybGltaXQ9XCIxMFwiIHBvaW50cz1cIjI1OS4yMTYsMjkuOTQyIDMzMC4yNywxNzMuOTE5IDQ4OS4xNiwxOTcuMDA3IDM3NC4xODUsMzA5LjA4IDQwMS4zMyw0NjcuMzEgMjU5LjIxNiwzOTIuNjEyIDExNy4xMDQsNDY3LjMxIDE0NC4yNSwzMDkuMDggMjkuMjc0LDE5Ny4wMDcgMTg4LjE2NSwxNzMuOTE5IFwiLz4nO1xuICAgICAgICBjb25zdCBzdGFySW5hY3RpdmUgPSAnPHBvbHlnb24gZmlsbD1cIiNEMkQyRDJcIiBzdHJva2U9XCIjNjg2ODY4XCIgc3Ryb2tlLXdpZHRoPVwiMzcuNjE1MlwiIHN0cm9rZS1saW5lY2FwPVwicm91bmRcIiBzdHJva2UtbGluZWpvaW49XCJyb3VuZFwiIHN0cm9rZS1taXRlcmxpbWl0PVwiMTBcIiBwb2ludHM9XCIyNTkuMjE2LDI5Ljk0MiAzMzAuMjcsMTczLjkxOSA0ODkuMTYsMTk3LjAwNyAzNzQuMTg1LDMwOS4wOCA0MDEuMzMsNDY3LjMxIDI1OS4yMTYsMzkyLjYxMiAxMTcuMTA0LDQ2Ny4zMSAxNDQuMjUsMzA5LjA4IDI5LjI3NCwxOTcuMDA3IDE4OC4xNjUsMTczLjkxOSBcIi8+JztcblxuICAgICAgICAvL3N0eWxlIHN0YXJzIGhvbGRlclxuICAgICAgICBzdGFycy5zdHlsZS52ZXJ0aWNhbEFsaWduID0gXCJtaWRkbGVcIjtcbiAgICAgICAgLy9zdHlsZSBzdGFyXG4gICAgICAgIHN0YXIuc2V0QXR0cmlidXRlKFwid2lkdGhcIiwgXCIxNFwiKTtcbiAgICAgICAgc3Rhci5zZXRBdHRyaWJ1dGUoXCJoZWlnaHRcIiwgXCIxNFwiKTtcbiAgICAgICAgc3Rhci5zZXRBdHRyaWJ1dGUoXCJ2aWV3Qm94XCIsIFwiMCAwIDUxMiA1MTJcIik7XG4gICAgICAgIHN0YXIuc2V0QXR0cmlidXRlKFwieG1sOnNwYWNlXCIsIFwicHJlc2VydmVcIik7XG4gICAgICAgIHN0YXIuc3R5bGUucGFkZGluZyA9IFwiMCAxcHhcIjtcblxuICAgICAgICB2YWx1ZSA9IHZhbHVlICYmICFpc05hTih2YWx1ZSkgPyBwYXJzZUludCh2YWx1ZSkgOiAwO1xuICAgICAgICB2YWx1ZSA9IE1hdGgubWF4KDAsIE1hdGgubWluKHZhbHVlLCBtYXhTdGFycykpO1xuXG4gICAgICAgIGZvcihsZXQgaSA9IDE7IGkgPD0gbWF4U3RhcnM7IGkrKyl7XG4gICAgICAgICAgICBjb25zdCBuZXh0U3RhciA9IHN0YXIuY2xvbmVOb2RlKHRydWUpO1xuXG4gICAgICAgICAgICBuZXh0U3Rhci5pbm5lckhUTUwgPSBpIDw9IHZhbHVlID8gc3RhckFjdGl2ZSA6IHN0YXJJbmFjdGl2ZTtcblxuICAgICAgICAgICAgc3RhcnMuYXBwZW5kQ2hpbGQobmV4dFN0YXIpO1xuICAgICAgICB9XG5cbiAgICAgICAgY29udGFpbmVyLnN0eWxlLndoaXRlU3BhY2UgPSBcIm5vd3JhcFwiO1xuICAgICAgICBjb250YWluZXIuc3R5bGUub3ZlcmZsb3cgPSBcImhpZGRlblwiO1xuICAgICAgICBjb250YWluZXIuc3R5bGUudGV4dE92ZXJmbG93ID0gXCJlbGxpcHNpc1wiO1xuICAgICAgICBjb250YWluZXIuc2V0QXR0cmlidXRlKFwiYXJpYS1sYWJlbFwiLCB2YWx1ZSk7XG4gICAgICAgIGNvbnRhaW5lci5hcHBlbmQoc3RhcnMpO1xuXG4gICAgICAgIHJldHVybiBjb250YWluZXI7XG4gICAgfVxufVxuXG5leHBvcnQgeyBGb3JtYXRTdGFyIH07IiwiZXhwb3J0IGNvbnN0IGNzc0hlbHBlciA9IHtcbiAgICB0b29sdGlwOiBcImRhdGFncmlkcy10b29sdGlwXCIsXG4gICAgbXVsdGlTZWxlY3Q6IHtcbiAgICAgICAgcGFyZW50Q2xhc3M6IFwiZGF0YWdyaWRzLW11bHRpLXNlbGVjdFwiLFxuICAgICAgICBoZWFkZXI6IFwiZGF0YWdyaWRzLW11bHRpLXNlbGVjdC1oZWFkZXJcIixcbiAgICAgICAgaGVhZGVyQWN0aXZlOiBcImRhdGFncmlkcy1tdWx0aS1zZWxlY3QtaGVhZGVyLWFjdGl2ZVwiLFxuICAgICAgICBoZWFkZXJPcHRpb246IFwiZGF0YWdyaWRzLW11bHRpLXNlbGVjdC1oZWFkZXItb3B0aW9uXCIsXG4gICAgICAgIG9wdGlvbnM6IFwiZGF0YWdyaWRzLW11bHRpLXNlbGVjdC1vcHRpb25zXCIsXG4gICAgICAgIG9wdGlvbjogXCJkYXRhZ3JpZHMtbXVsdGktc2VsZWN0LW9wdGlvblwiLFxuICAgICAgICBvcHRpb25UZXh0OiBcImRhdGFncmlkcy1tdWx0aS1zZWxlY3Qtb3B0aW9uLXRleHRcIixcbiAgICAgICAgb3B0aW9uUmFkaW86IFwiZGF0YWdyaWRzLW11bHRpLXNlbGVjdC1vcHRpb24tcmFkaW9cIixcbiAgICAgICAgc2VsZWN0ZWQ6IFwiZGF0YWdyaWRzLW11bHRpLXNlbGVjdC1zZWxlY3RlZFwiXG4gICAgfSxcbiAgICBpbnB1dDogXCJkYXRhZ3JpZHMtaW5wdXRcIixcbiAgICBiZXR3ZWVuQnV0dG9uOiBcImRhdGFncmlkcy1iZXR3ZWVuLWJ1dHRvblwiLFxuICAgIGJldHdlZW5MYWJlbDogXCJkYXRhZ3JpZHMtYmV0d2Vlbi1pbnB1dC1sYWJlbFwiLFxufTsiLCJpbXBvcnQgeyBGb3JtYXREYXRlVGltZSB9IGZyb20gXCIuL2Zvcm1hdHRlcnMvZGF0ZXRpbWUuanNcIjtcbmltcG9ydCB7IEZvcm1hdExpbmsgfSBmcm9tIFwiLi9mb3JtYXR0ZXJzL2xpbmsuanNcIjtcbmltcG9ydCB7IEZvcm1hdE51bWVyaWMgfSBmcm9tIFwiLi9mb3JtYXR0ZXJzL251bWVyaWMuanNcIjtcbmltcG9ydCB7IEZvcm1hdFN0YXIgfSBmcm9tIFwiLi9mb3JtYXR0ZXJzL3N0YXIuanNcIjtcbmltcG9ydCB7IGNzc0hlbHBlciB9IGZyb20gXCIuLi9oZWxwZXJzL2Nzc0hlbHBlci5qc1wiO1xuXG5jbGFzcyBDZWxsIHtcbiAgICAvKipcbiAgICAgKiBDcmVhdGUgY2VsbCBvYmplY3QgdGhhdCByZXByZXNlbnRzIHRoZSBgdGRgIHRhYmxlIGJvZHkgZWxlbWVudC5cbiAgICAgKiBAcGFyYW0ge0FycmF5PG9iamVjdD59IHJvd0RhdGEgUm93IGRhdGEuXG4gICAgICogQHBhcmFtIHtDb2x1bW59IGNvbHVtbiBDb2x1bW4gb2JqZWN0LlxuICAgICAqIEBwYXJhbSB7T2JqZWN0fSBtb2R1bGVzIEdyaWQgbW9kdWxlKHMpIGFkZGVkIGJ5IHVzZXIgZm9yIGN1c3RvbSBmb3JtYXR0aW5nLlxuICAgICAqIEBwYXJhbSB7SFRNTFRhYmxlUm93RWxlbWVudH0gcm93IFRhYmxlIHJvdyBgdHJgIGVsZW1lbnQuXG4gICAgICovXG4gICAgY29uc3RydWN0b3Iocm93RGF0YSwgY29sdW1uLCBtb2R1bGVzLCByb3cpIHtcbiAgICAgICAgdGhpcy5lbGVtZW50ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcInRkXCIpO1xuXG4gICAgICAgIGlmIChjb2x1bW4uZm9ybWF0dGVyKSB7XG4gICAgICAgICAgICB0aGlzLiNpbml0KHJvd0RhdGEsIGNvbHVtbiwgbW9kdWxlcywgcm93KTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHRoaXMuZWxlbWVudC5pbm5lclRleHQgPSByb3dEYXRhW2NvbHVtbi5maWVsZF07XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoY29sdW1uLnRvb2x0aXBGaWVsZCkge1xuICAgICAgICAgICAgdGhpcy4jYXBwbHlUb29sdGlwKHJvd0RhdGFbY29sdW1uLnRvb2x0aXBGaWVsZF0sIGNvbHVtbi50b29sdGlwTGF5b3V0KTtcbiAgICAgICAgfVxuICAgIH1cbiAgICAvKipcbiAgICAgKiBBcHBsaWVzIHRvb2x0aXAgZnVuY3Rpb25hbGl0eSB0byB0aGUgY2VsbC4gIElmIHRoZSBjZWxsJ3MgY29udGVudCBjb250YWlucyB0ZXh0IG9ubHksIGl0IHdpbGwgY3JlYXRlIGEgdG9vbHRpcCBcbiAgICAgKiBgc3BhbmAgZWxlbWVudCBhbmQgYXBwbHkgdGhlIGNvbnRlbnQgdG8gaXQuXG4gICAgICogQHBhcmFtIHtzdHJpbmcgfCBudW1iZXIgfCBEYXRlIHwgbnVsbH0gY29udGVudCBUb29sdGlwIGNvbnRlbnQgdG8gYmUgZGlzcGxheWVkLlxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBsYXlvdXQgQ1NTIGNsYXNzIGZvciB0b29sdGlwIGxheW91dCwgZWl0aGVyIFwiZGF0YWdyaWRzLXRvb2x0aXAtcmlnaHRcIiBvciBcImRhdGFncmlkcy10b29sdGlwLWxlZnRcIi5cbiAgICAgKi9cbiAgICAjYXBwbHlUb29sdGlwKGNvbnRlbnQsIGxheW91dCkge1xuICAgICAgICBpZiAoY29udGVudCA9PT0gbnVsbCB8fCBjb250ZW50ID09PSBcIlwiKSByZXR1cm47XG4gICAgICAgIFxuICAgICAgICBsZXQgdG9vbHRpcEVsZW1lbnQgPSB0aGlzLmVsZW1lbnQuZmlyc3RFbGVtZW50Q2hpbGQ7XG5cbiAgICAgICAgaWYgKHRvb2x0aXBFbGVtZW50ID09PSBudWxsKSB7XG4gICAgICAgICAgICB0b29sdGlwRWxlbWVudCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJzcGFuXCIpO1xuICAgICAgICAgICAgdG9vbHRpcEVsZW1lbnQuaW5uZXJUZXh0ID0gdGhpcy5lbGVtZW50LmlubmVyVGV4dDtcbiAgICAgICAgICAgIHRoaXMuZWxlbWVudC5yZXBsYWNlQ2hpbGRyZW4odG9vbHRpcEVsZW1lbnQpO1xuICAgICAgICB9XG5cbiAgICAgICAgdG9vbHRpcEVsZW1lbnQuZGF0YXNldC50b29sdGlwID0gY29udGVudDtcbiAgICAgICAgdG9vbHRpcEVsZW1lbnQuY2xhc3NMaXN0LmFkZChjc3NIZWxwZXIudG9vbHRpcCwgbGF5b3V0KTtcbiAgICB9XG5cbiAgICAjaW5pdChyb3dEYXRhLCBjb2x1bW4sIG1vZHVsZXMsIHJvdykge1xuICAgICAgICBpZiAodHlwZW9mIGNvbHVtbi5mb3JtYXR0ZXIgPT09IFwiZnVuY3Rpb25cIikge1xuICAgICAgICAgICAgdGhpcy5lbGVtZW50LmFwcGVuZChjb2x1bW4uZm9ybWF0dGVyKHJvd0RhdGEsIGNvbHVtbi5mb3JtYXR0ZXJQYXJhbXMsIHRoaXMuZWxlbWVudCwgcm93KSk7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgXG4gICAgICAgIHN3aXRjaCAoY29sdW1uLmZvcm1hdHRlcikge1xuICAgICAgICAgICAgY2FzZSBcImxpbmtcIjpcbiAgICAgICAgICAgICAgICB0aGlzLmVsZW1lbnQuYXBwZW5kKEZvcm1hdExpbmsuYXBwbHkocm93RGF0YSwgY29sdW1uLmZvcm1hdHRlclBhcmFtcykpO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgY2FzZSBcImRhdGVcIjpcbiAgICAgICAgICAgICAgICB0aGlzLmVsZW1lbnQuaW5uZXJUZXh0ID0gRm9ybWF0RGF0ZVRpbWUuYXBwbHkocm93RGF0YSwgY29sdW1uLCBjb2x1bW4uc2V0dGluZ3MuZGF0ZUZvcm1hdCwgZmFsc2UpO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgY2FzZSBcImRhdGV0aW1lXCI6XG4gICAgICAgICAgICAgICAgdGhpcy5lbGVtZW50LmlubmVyVGV4dCA9IEZvcm1hdERhdGVUaW1lLmFwcGx5KHJvd0RhdGEsIGNvbHVtbiwgY29sdW1uLnNldHRpbmdzLmRhdGVUaW1lRm9ybWF0LCB0cnVlKTtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIGNhc2UgXCJtb25leVwiOlxuICAgICAgICAgICAgICAgIHRoaXMuZWxlbWVudC5pbm5lclRleHQgPSBGb3JtYXROdW1lcmljLmFwcGx5KHJvd0RhdGEsIGNvbHVtbiwgXCJjdXJyZW5jeVwiLCAyKTtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIGNhc2UgXCJudW1lcmljXCI6XG4gICAgICAgICAgICAgICAgdGhpcy5lbGVtZW50LmlubmVyVGV4dCA9IEZvcm1hdE51bWVyaWMuYXBwbHkocm93RGF0YSwgY29sdW1uLCBjb2x1bW4uZm9ybWF0dGVyUGFyYW1zPy5zdHlsZSA/PyBcImRlY2ltYWxcIiwgY29sdW1uLmZvcm1hdHRlclBhcmFtcz8ucHJlY2lzaW9uID8/IDIpO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgY2FzZSBcInN0YXJcIjpcbiAgICAgICAgICAgICAgICB0aGlzLmVsZW1lbnQuYXBwZW5kKEZvcm1hdFN0YXIuYXBwbHkocm93RGF0YSwgY29sdW1uKSk7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICBjYXNlIFwibW9kdWxlXCI6XG4gICAgICAgICAgICAgICAgdGhpcy5lbGVtZW50LmFwcGVuZChtb2R1bGVzW2NvbHVtbi5mb3JtYXR0ZXJQYXJhbXMubmFtZV0uYXBwbHkocm93RGF0YSwgY29sdW1uLCByb3csIHRoaXMuZWxlbWVudCkpO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICAgICAgICB0aGlzLmVsZW1lbnQuaW5uZXJUZXh0ID0gcm93RGF0YVtjb2x1bW4uZmllbGRdO1xuICAgICAgICB9XG4gICAgfVxufVxuXG5leHBvcnQgeyBDZWxsIH07IiwiLyoqXG4gKiBEZWZpbmVzIGEgc2luZ2xlIGhlYWRlciBjZWxsICd0aCcgZWxlbWVudC5cbiAqL1xuY2xhc3MgSGVhZGVyQ2VsbCB7XG4gICAgLyoqXG4gICAgICogQ3JlYXRlIGhlYWRlciBvYmplY3QgdGhhdCByZXByZXNlbnRzIHRoZSBgdGhgIHRhYmxlIGhlYWRlciBlbGVtZW50LiAgQ2xhc3Mgd2lsbCBwZXJzaXN0IGNvbHVtbiBzb3J0IGFuZCBvcmRlciB1c2VyIGlucHV0LlxuICAgICAqIEBwYXJhbSB7Q29sdW1ufSBjb2x1bW4gY29sdW1uIG9iamVjdC5cbiAgICAgKi9cbiAgICBjb25zdHJ1Y3Rvcihjb2x1bW4pIHtcbiAgICAgICAgdGhpcy5jb2x1bW4gPSBjb2x1bW47XG4gICAgICAgIHRoaXMuc2V0dGluZ3MgPSBjb2x1bW4uc2V0dGluZ3M7XG4gICAgICAgIHRoaXMuZWxlbWVudCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJ0aFwiKTtcbiAgICAgICAgdGhpcy5zcGFuID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcInNwYW5cIik7XG4gICAgICAgIHRoaXMubmFtZSA9IGNvbHVtbi5maWVsZDtcbiAgICAgICAgdGhpcy5kaXJlY3Rpb24gPSBcImRlc2NcIjtcbiAgICAgICAgdGhpcy5kaXJlY3Rpb25OZXh0ID0gXCJkZXNjXCI7XG4gICAgICAgIHRoaXMudHlwZSA9IGNvbHVtbi50eXBlO1xuXG4gICAgICAgIGlmIChjb2x1bW4uaGVhZGVyQ3NzKSB7XG4gICAgICAgICAgICB0aGlzLmVsZW1lbnQuY2xhc3NMaXN0LmFkZChjb2x1bW4uaGVhZGVyQ3NzKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICh0aGlzLnNldHRpbmdzLnRhYmxlSGVhZGVyVGhDc3MpIHtcbiAgICAgICAgICAgIHRoaXMuZWxlbWVudC5jbGFzc0xpc3QuYWRkKHRoaXMuc2V0dGluZ3MudGFibGVIZWFkZXJUaENzcyk7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoY29sdW1uLmNvbHVtblNpemUpIHtcbiAgICAgICAgICAgIHRoaXMuZWxlbWVudC5jbGFzc0xpc3QuYWRkKGNvbHVtbi5jb2x1bW5TaXplKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChjb2x1bW4ud2lkdGgpIHtcbiAgICAgICAgICAgIHRoaXMuZWxlbWVudC5zdHlsZS53aWR0aCA9IGNvbHVtbi53aWR0aDtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChjb2x1bW4uaGVhZGVyRmlsdGVyRW1wdHkpIHtcbiAgICAgICAgICAgIHRoaXMuc3Bhbi5jbGFzc0xpc3QuYWRkKGNvbHVtbi5oZWFkZXJGaWx0ZXJFbXB0eSk7XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLmVsZW1lbnQuYXBwZW5kQ2hpbGQodGhpcy5zcGFuKTtcbiAgICAgICAgdGhpcy5lbGVtZW50LmNvbnRleHQgPSB0aGlzO1xuICAgICAgICB0aGlzLnNwYW4uaW5uZXJUZXh0ID0gY29sdW1uLmxhYmVsO1xuICAgICAgICB0aGlzLnNwYW4uY29udGV4dCA9IHRoaXM7XG4gICAgfVxuICAgIC8qKlxuICAgICAqIFNldCB0aGUgc29ydCBmbGFnIGZvciB0aGUgaGVhZGVyIGNlbGwuXG4gICAgICovXG4gICAgc2V0U29ydEZsYWcoKSB7XG4gICAgICAgIGlmICh0aGlzLmljb24gPT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgdGhpcy5pY29uID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImlcIik7XG4gICAgICAgICAgICB0aGlzLnNwYW4uYXBwZW5kKHRoaXMuaWNvbik7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAodGhpcy5kaXJlY3Rpb25OZXh0ID09PSBcImRlc2NcIikge1xuICAgICAgICAgICAgdGhpcy5pY29uLmNsYXNzTGlzdCA9IHRoaXMuc2V0dGluZ3MudGFibGVDc3NTb3J0RGVzYztcbiAgICAgICAgICAgIHRoaXMuZGlyZWN0aW9uID0gXCJkZXNjXCI7XG4gICAgICAgICAgICB0aGlzLmRpcmVjdGlvbk5leHQgPSBcImFzY1wiO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdGhpcy5pY29uLmNsYXNzTGlzdCA9IHRoaXMuc2V0dGluZ3MudGFibGVDc3NTb3J0QXNjO1xuICAgICAgICAgICAgdGhpcy5kaXJlY3Rpb24gPSBcImFzY1wiO1xuICAgICAgICAgICAgdGhpcy5kaXJlY3Rpb25OZXh0ID0gXCJkZXNjXCI7XG4gICAgICAgIH1cbiAgICB9XG4gICAgLyoqXG4gICAgICogUmVtb3ZlIHRoZSBzb3J0IGZsYWcgZm9yIHRoZSBoZWFkZXIgY2VsbC5cbiAgICAgKi9cbiAgICByZW1vdmVTb3J0RmxhZygpIHtcbiAgICAgICAgdGhpcy5kaXJlY3Rpb24gPSBcImRlc2NcIjtcbiAgICAgICAgdGhpcy5kaXJlY3Rpb25OZXh0ID0gXCJkZXNjXCI7XG4gICAgICAgIHRoaXMuaWNvbiA9IHRoaXMuaWNvbi5yZW1vdmUoKTtcbiAgICB9XG5cbiAgICBnZXQgaXNDdXJyZW50U29ydCgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuaWNvbiAhPT0gdW5kZWZpbmVkO1xuICAgIH1cbn1cblxuZXhwb3J0IHsgSGVhZGVyQ2VsbCB9OyIsIi8qKlxuICogRGVmaW5lcyBhIHNpbmdsZSBjb2x1bW4gZm9yIHRoZSBncmlkLiAgVHJhbnNmb3JtcyB1c2VyJ3MgY29sdW1uIGRlZmluaXRpb24gaW50byBDbGFzcyBwcm9wZXJ0aWVzLlxuICogQGNsYXNzXG4gKi9cbmNsYXNzIENvbHVtbiB7XG4gICAgLyoqXG4gICAgICogQ3JlYXRlIGNvbHVtbiBvYmplY3Qgd2hpY2ggdHJhbnNmb3JtcyB1c2VyJ3MgY29sdW1uIGRlZmluaXRpb24gaW50byBDbGFzcyBwcm9wZXJ0aWVzLlxuICAgICAqIEBwYXJhbSB7T2JqZWN0fSBjb2x1bW4gVXNlcidzIGNvbHVtbiBkZWZpbml0aW9uL3NldHRpbmdzLlxuICAgICAqIEBwYXJhbSB7U2V0dGluZ3NHcmlkfSBzZXR0aW5ncyBncmlkIHNldHRpbmdzLlxuICAgICAqIEBwYXJhbSB7bnVtYmVyfSBpbmRleCBjb2x1bW4gaW5kZXggbnVtYmVyLlxuICAgICAqL1xuICAgIGNvbnN0cnVjdG9yKGNvbHVtbiwgc2V0dGluZ3MsIGluZGV4ID0gMCkge1xuICAgICAgICB0aGlzLnNldHRpbmdzID0gc2V0dGluZ3M7XG4gICAgICAgIHRoaXMuaW5kZXggPSBpbmRleDtcblxuICAgICAgICBpZiAoY29sdW1uLmZpZWxkID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgIHRoaXMuZmllbGQgPSBgY29sdW1uJHtpbmRleH1gOyAgLy9hc3NvY2lhdGVkIGRhdGEgZmllbGQgbmFtZS5cbiAgICAgICAgICAgIHRoaXMudHlwZSA9IFwiaWNvblwiOyAgLy9pY29uIHR5cGUuXG4gICAgICAgICAgICB0aGlzLmxhYmVsID0gXCJcIjtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHRoaXMuZmllbGQgPSBjb2x1bW4uZmllbGQ7ICAvL2Fzc29jaWF0ZWQgZGF0YSBmaWVsZCBuYW1lLlxuICAgICAgICAgICAgdGhpcy50eXBlID0gY29sdW1uLnR5cGUgPyBjb2x1bW4udHlwZSA6IFwic3RyaW5nXCI7ICAvL3ZhbHVlIHR5cGUuXG4gICAgICAgICAgICB0aGlzLmxhYmVsID0gY29sdW1uLmxhYmVsIFxuICAgICAgICAgICAgICAgID8gY29sdW1uLmxhYmVsIFxuICAgICAgICAgICAgICAgIDogY29sdW1uLmZpZWxkWzBdLnRvVXBwZXJDYXNlKCkgKyBjb2x1bW4uZmllbGQuc2xpY2UoMSk7ICAvL2NvbHVtbiB0aXRsZS5cbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChjb2x1bW4/LmZvcm1hdHRlck1vZHVsZU5hbWUpIHsgXG4gICAgICAgICAgICB0aGlzLmZvcm1hdHRlciA9IFwibW9kdWxlXCI7XG4gICAgICAgICAgICB0aGlzLmZvcm1hdHRlck1vZHVsZU5hbWUgPSBjb2x1bW4uZm9ybWF0dGVyTW9kdWxlTmFtZTsgIC8vZm9ybWF0dGVyIG1vZHVsZSBuYW1lLlxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdGhpcy5mb3JtYXR0ZXIgPSBjb2x1bW4uZm9ybWF0dGVyOyAgLy9mb3JtYXR0ZXIgdHlwZSBvciBmdW5jdGlvbi5cbiAgICAgICAgICAgIHRoaXMuZm9ybWF0dGVyUGFyYW1zID0gY29sdW1uLmZvcm1hdHRlclBhcmFtcztcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMuaGVhZGVyQ3NzID0gY29sdW1uLmhlYWRlckNzcztcbiAgICAgICAgdGhpcy5jb2x1bW5TaXplID0gY29sdW1uPy5jb2x1bW5TaXplID8gYGRhdGFncmlkcy1jb2wtJHtjb2x1bW4uY29sdW1uU2l6ZX1gIDogXCJcIjtcbiAgICAgICAgdGhpcy53aWR0aCA9IGNvbHVtbj8ud2lkdGggPz8gdW5kZWZpbmVkO1xuICAgICAgICB0aGlzLmhhc0ZpbHRlciA9IHRoaXMudHlwZSAhPT0gXCJpY29uXCIgJiYgY29sdW1uLmZpbHRlclR5cGUgPyB0cnVlIDogZmFsc2U7XG4gICAgICAgIHRoaXMuaGVhZGVyQ2VsbCA9IHVuZGVmaW5lZDsgIC8vSGVhZGVyQ2VsbCBjbGFzcy5cbiAgICAgICAgdGhpcy5oZWFkZXJGaWx0ZXIgPSB1bmRlZmluZWQ7ICAvL0hlYWRlckZpbHRlciBjbGFzcy5cblxuICAgICAgICBpZiAodGhpcy5oYXNGaWx0ZXIpIHtcbiAgICAgICAgICAgIHRoaXMuI2luaXRpYWxpemVGaWx0ZXIoY29sdW1uLCBzZXR0aW5ncyk7XG4gICAgICAgIH0gZWxzZSBpZiAoY29sdW1uPy5oZWFkZXJGaWx0ZXJFbXB0eSkge1xuICAgICAgICAgICAgdGhpcy5oZWFkZXJGaWx0ZXJFbXB0eSA9ICh0eXBlb2YgY29sdW1uLmhlYWRlckZpbHRlckVtcHR5ID09PSBcInN0cmluZ1wiKSBcbiAgICAgICAgICAgICAgICA/IGNvbHVtbi5oZWFkZXJGaWx0ZXJFbXB0eSA6IFwiZGF0YWdyaWRzLW5vLWhlYWRlclwiO1xuICAgICAgICB9XG4gICAgICAgIC8vVG9vbHRpcCBzZXR0aW5nLlxuICAgICAgICBpZiAoY29sdW1uLnRvb2x0aXBGaWVsZCkge1xuICAgICAgICAgICAgdGhpcy50b29sdGlwRmllbGQgPSBjb2x1bW4udG9vbHRpcEZpZWxkO1xuICAgICAgICAgICAgdGhpcy50b29sdGlwTGF5b3V0ID0gY29sdW1uPy50b29sdGlwTGF5b3V0ID09PSBcInJpZ2h0XCIgPyBcImRhdGFncmlkcy10b29sdGlwLXJpZ2h0XCIgOiBcImRhdGFncmlkcy10b29sdGlwLWxlZnRcIjtcbiAgICAgICAgfVxuICAgIH1cbiAgICAvKipcbiAgICAgKiBJbml0aWFsaXplcyBmaWx0ZXIgcHJvcGVydGllcy5cbiAgICAgKiBAcGFyYW0ge09iamVjdH0gY29sdW1uIFxuICAgICAqIEBwYXJhbSB7U2V0dGluZ3N9IHNldHRpbmdzIFxuICAgICAqL1xuICAgICNpbml0aWFsaXplRmlsdGVyKGNvbHVtbiwgc2V0dGluZ3MpIHtcbiAgICAgICAgdGhpcy5maWx0ZXJFbGVtZW50ID0gY29sdW1uLmZpbHRlclR5cGUgPT09IFwiYmV0d2VlblwiID8gXCJiZXR3ZWVuXCIgOiBcImlucHV0XCI7XG4gICAgICAgIHRoaXMuZmlsdGVyVHlwZSA9IGNvbHVtbi5maWx0ZXJUeXBlOyAgLy9maWx0ZXIgdHlwZSBkZXNjcmlwdG9yLCBzdWNoIGFzOiBlcXVhbHMsIGxpa2UsIDwsIGV0YzsgY2FuIGFsc28gYmUgYSBmdW5jdGlvbi5cbiAgICAgICAgdGhpcy5maWx0ZXJQYXJhbXMgPSBjb2x1bW4uZmlsdGVyUGFyYW1zO1xuICAgICAgICB0aGlzLmZpbHRlckNzcyA9IGNvbHVtbj8uZmlsdGVyQ3NzID8/IHNldHRpbmdzLnRhYmxlRmlsdGVyQ3NzO1xuICAgICAgICB0aGlzLmZpbHRlclJlYWxUaW1lID0gY29sdW1uPy5maWx0ZXJSZWFsVGltZSA/PyBmYWxzZTtcblxuICAgICAgICBpZiAoY29sdW1uLmZpbHRlclZhbHVlcykge1xuICAgICAgICAgICAgdGhpcy5maWx0ZXJWYWx1ZXMgPSBjb2x1bW4uZmlsdGVyVmFsdWVzOyAgLy9zZWxlY3Qgb3B0aW9uIGZpbHRlciB2YWx1ZS5cbiAgICAgICAgICAgIHRoaXMuZmlsdGVyVmFsdWVzUmVtb3RlU291cmNlID0gdHlwZW9mIGNvbHVtbi5maWx0ZXJWYWx1ZXMgPT09IFwic3RyaW5nXCIgPyBjb2x1bW4uZmlsdGVyVmFsdWVzIDogdW5kZWZpbmVkOyAgLy9zZWxlY3Qgb3B0aW9uIGZpbHRlciB2YWx1ZSBhamF4IHNvdXJjZS5cbiAgICAgICAgICAgIHRoaXMuZmlsdGVyRWxlbWVudCA9IGNvbHVtbi5maWx0ZXJNdWx0aVNlbGVjdCA/IFwibXVsdGlcIiA6XCJzZWxlY3RcIjtcbiAgICAgICAgICAgIHRoaXMuZmlsdGVyTXVsdGlTZWxlY3QgPSBjb2x1bW4uZmlsdGVyTXVsdGlTZWxlY3Q7XG4gICAgICAgIH1cbiAgICB9XG59XG5cbmV4cG9ydCB7IENvbHVtbiB9OyIsImltcG9ydCB7IEhlYWRlckNlbGwgfSBmcm9tIFwiLi4vY2VsbC9oZWFkZXJDZWxsLmpzXCI7XG5pbXBvcnQgeyBDb2x1bW4gfSBmcm9tIFwiLi9jb2x1bW4uanNcIjtcbi8qKlxuICogQ3JlYXRlcyBhbmQgbWFuYWdlcyB0aGUgY29sdW1ucyBmb3IgdGhlIGdyaWQuICBXaWxsIGNyZWF0ZSBhIGBDb2x1bW5gIG9iamVjdCBmb3IgZWFjaCBjb2x1bW4gZGVmaW5pdGlvbiBwcm92aWRlZCBieSB0aGUgdXNlci5cbiAqL1xuY2xhc3MgQ29sdW1uTWFuYWdlciB7XG4gICAgI2NvbHVtbnM7XG4gICAgI2luZGV4Q291bnRlciA9IDA7XG4gICAgLyoqXG4gICAgICogVHJhbnNmb3JtcyB1c2VyJ3MgY29sdW1uIGRlZmluaXRpb25zIGludG8gY29uY3JldGUgYENvbHVtbmAgY2xhc3Mgb2JqZWN0cy4gIFdpbGwgYWxzbyBjcmVhdGUgYEhlYWRlckNlbGxgIG9iamVjdHMgXG4gICAgICogZm9yIGVhY2ggY29sdW1uLlxuICAgICAqIEBwYXJhbSB7QXJyYXk8T2JqZWN0Pn0gY29sdW1ucyBDb2x1bW4gZGVmaW5pdGlvbnMgZnJvbSB1c2VyLlxuICAgICAqIEBwYXJhbSB7U2V0dGluZ3NHcmlkfSBzZXR0aW5ncyBHcmlkIHNldHRpbmdzLlxuICAgICAqL1xuICAgIGNvbnN0cnVjdG9yKGNvbHVtbnMsIHNldHRpbmdzKSB7XG4gICAgICAgIHRoaXMuI2NvbHVtbnMgPSBbXTtcbiAgICAgICAgdGhpcy5zZXR0aW5ncyA9IHNldHRpbmdzO1xuICAgICAgICB0aGlzLnRhYmxlRXZlbkNvbHVtbldpZHRocyA9IHNldHRpbmdzLnRhYmxlRXZlbkNvbHVtbldpZHRocztcbiAgICAgICAgdGhpcy5oYXNIZWFkZXJGaWx0ZXJzID0gZmFsc2U7XG5cbiAgICAgICAgZm9yIChjb25zdCBjIG9mIGNvbHVtbnMpIHtcbiAgICAgICAgICAgIGNvbnN0IGNvbCA9IG5ldyBDb2x1bW4oYywgc2V0dGluZ3MsIHRoaXMuI2luZGV4Q291bnRlcik7XG4gICAgICAgICAgXG4gICAgICAgICAgICBjb2wuaGVhZGVyQ2VsbCA9IG5ldyBIZWFkZXJDZWxsKGNvbCk7XG5cbiAgICAgICAgICAgIHRoaXMuI2NvbHVtbnMucHVzaChjb2wpO1xuICAgICAgICAgICAgdGhpcy4jaW5kZXhDb3VudGVyKys7XG4gICAgICAgIH1cbiAgICAgICAgLy8gQ2hlY2sgaWYgYW55IGNvbHVtbiBoYXMgYSBmaWx0ZXIgZGVmaW5lZFxuICAgICAgICBpZiAodGhpcy4jY29sdW1ucy5zb21lKChjKSA9PiBjLmhhc0ZpbHRlcikpIHtcbiAgICAgICAgICAgIHRoaXMuaGFzSGVhZGVyRmlsdGVycyA9IHRydWU7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoc2V0dGluZ3MudGFibGVFdmVuQ29sdW1uV2lkdGhzKSB7XG4gICAgICAgICAgICB0aGlzLiNzZXRFdmVuQ29sdW1uV2lkdGhzKCk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICAjc2V0RXZlbkNvbHVtbldpZHRocygpIHsgXG4gICAgICAgIGNvbnN0IGNvdW50ID0gKHRoaXMuI2luZGV4Q291bnRlciArIDEpO1xuICAgICAgICBjb25zdCB3aWR0aCA9IDEwMCAvIGNvdW50O1xuXG4gICAgICAgIHRoaXMuI2NvbHVtbnMuZm9yRWFjaCgoaCkgPT4gaC5oZWFkZXJDZWxsLmVsZW1lbnQuc3R5bGUud2lkdGggPSBgJHt3aWR0aH0lYCk7XG4gICAgfVxuICAgIC8qKlxuICAgICAqIEdldCBhcnJheSBvZiBgQ29sdW1uYCBvYmplY3RzLlxuICAgICAqIEByZXR1cm5zIHtBcnJheTxDb2x1bW4+fSBhcnJheSBvZiBgQ29sdW1uYCBvYmplY3RzLlxuICAgICAqL1xuICAgIGdldCBjb2x1bW5zKCkge1xuICAgICAgICByZXR1cm4gdGhpcy4jY29sdW1ucztcbiAgICB9XG4gICAgLyoqXG4gICAgICogQWRkcyBhIG5ldyBjb2x1bW4gdG8gdGhlIGNvbHVtbnMgY29sbGVjdGlvbi5cbiAgICAgKiBAcGFyYW0ge09iamVjdH0gY29sdW1uIENvbHVtbiBkZWZpbml0aW9uIG9iamVjdC5cbiAgICAgKiBAcGFyYW0ge251bWJlcn0gW2luZGV4PW51bGxdIEluZGV4IHRvIGluc2VydCB0aGUgY29sdW1uIGF0LiBJZiBudWxsLCBhcHBlbmRzIHRvIHRoZSBlbmQuXG4gICAgICovXG4gICAgYWRkQ29sdW1uKGNvbHVtbiwgaW5kZXggPSBudWxsKSB7IFxuICAgICAgICBjb25zdCBjb2wgPSBuZXcgQ29sdW1uKGNvbHVtbiwgdGhpcy5zZXR0aW5ncywgdGhpcy4jaW5kZXhDb3VudGVyKTtcbiAgICAgICAgY29sLmhlYWRlckNlbGwgPSBuZXcgSGVhZGVyQ2VsbChjb2wpO1xuXG4gICAgICAgIGlmIChpbmRleCAhPT0gbnVsbCAmJiBpbmRleCA+PSAwICYmIGluZGV4IDwgdGhpcy4jY29sdW1ucy5sZW5ndGgpIHtcbiAgICAgICAgICAgIHRoaXMuI2NvbHVtbnMuc3BsaWNlKGluZGV4LCAwLCBjb2wpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdGhpcy4jY29sdW1ucy5wdXNoKGNvbCk7XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLiNpbmRleENvdW50ZXIrKztcblxuICAgICAgICBpZiAodGhpcy50YWJsZUV2ZW5Db2x1bW5XaWR0aHMpIHtcbiAgICAgICAgICAgIHRoaXMuI3NldEV2ZW5Db2x1bW5XaWR0aHMoKTtcbiAgICAgICAgfVxuICAgIH1cbn1cblxuZXhwb3J0IHsgQ29sdW1uTWFuYWdlciB9OyIsImV4cG9ydCBkZWZhdWx0IHtcbiAgICBiYXNlSWROYW1lOiBcImRhdGFncmlkXCIsICAvL2Jhc2UgbmFtZSBmb3IgYWxsIGVsZW1lbnQgSUQncy5cbiAgICBkYXRhOiBbXSwgIC8vcm93IGRhdGEuXG4gICAgY29sdW1uczogW10sICAvL2NvbHVtbiBkZWZpbml0aW9ucy5cbiAgICBlbmFibGVQYWdpbmc6IHRydWUsICAvL2VuYWJsZSBwYWdpbmcgb2YgZGF0YS5cbiAgICBwYWdlclBhZ2VzVG9EaXNwbGF5OiA1LCAgLy9tYXggbnVtYmVyIG9mIHBhZ2VyIGJ1dHRvbnMgdG8gZGlzcGxheS5cbiAgICBwYWdlclJvd3NQZXJQYWdlOiAyNSwgIC8vcm93cyBwZXIgcGFnZS5cbiAgICBkYXRlRm9ybWF0OiBcIk1NL2RkL3l5eXlcIiwgIC8vcm93IGxldmVsIGRhdGUgZm9ybWF0LlxuICAgIGRhdGVUaW1lRm9ybWF0OiBcIk1NL2RkL3l5eXkgSEg6bW06c3NcIiwgLy9yb3cgbGV2ZWwgZGF0ZSBmb3JtYXQuXG4gICAgcmVtb3RlVXJsOiBcIlwiLCAgLy9nZXQgZGF0YSBmcm9tIHVybCBlbmRwb2ludCB2aWEgQWpheC5cbiAgICByZW1vdGVQYXJhbXM6IFwiXCIsICAvL3BhcmFtZXRlcnMgdG8gYmUgcGFzc2VkIG9uIEFqYXggcmVxdWVzdC5cbiAgICByZW1vdGVQcm9jZXNzaW5nOiBmYWxzZSwgIC8vdHJ1dGh5IHNldHMgZ3JpZCB0byBwcm9jZXNzIGZpbHRlci9zb3J0IG9uIHJlbW90ZSBzZXJ2ZXIuXG4gICAgdGFibGVDc3M6IFwiZGF0YWdyaWRzXCIsIFxuICAgIHRhYmxlSGVhZGVyVGhDc3M6IFwiXCIsXG4gICAgcGFnZXJDc3M6IFwiZGF0YWdyaWRzLXBhZ2VyXCIsIFxuICAgIHRhYmxlRmlsdGVyQ3NzOiBcImRhdGFncmlkcy1pbnB1dFwiLCAgLy9jc3MgY2xhc3MgZm9yIGhlYWRlciBmaWx0ZXIgaW5wdXQgZWxlbWVudHMuXG4gICAgdGFibGVFdmVuQ29sdW1uV2lkdGhzOiBmYWxzZSwgIC8vc2hvdWxkIGFsbCBjb2x1bW5zIGJlIGVxdWFsIHdpZHRoP1xuICAgIHRhYmxlQ3NzU29ydEFzYzogXCJkYXRhZ3JpZHMtc29ydC1pY29uIGRhdGFncmlkcy1zb3J0LWFzY1wiLFxuICAgIHRhYmxlQ3NzU29ydERlc2M6IFwiZGF0YWdyaWRzLXNvcnQtaWNvbiBkYXRhZ3JpZHMtc29ydC1kZXNjXCIsXG4gICAgcmVmcmVzaGFibGVJZDogXCJcIiwgIC8vcmVmcmVzaCByZW1vdGUgZGF0YSBzb3VyY2VzIGZvciBncmlkIGFuZC9vciBmaWx0ZXIgdmFsdWVzLlxuICAgIHJvd0NvdW50SWQ6IFwiXCIsXG4gICAgY3N2RXhwb3J0SWQ6IFwiXCIsXG4gICAgY3N2RXhwb3J0UmVtb3RlU291cmNlOiBcIlwiIC8vZ2V0IGV4cG9ydCBkYXRhIGZyb20gdXJsIGVuZHBvaW50IHZpYSBBamF4OyB1c2VmdWwgdG8gZ2V0IG5vbi1wYWdlZCBkYXRhLlxufTsiLCJpbXBvcnQgc2V0dGluZ3NEZWZhdWx0cyBmcm9tIFwiLi9zZXR0aW5nc0RlZmF1bHQuanNcIjtcblxuY2xhc3MgTWVyZ2VPcHRpb25zIHtcbiAgICAvKipcbiAgICAgKiBSZXR1cm5zIGFuIG9iamVjdCBiYXNlZCBvbiB0aGUgbWVyZ2VkIHJlc3VsdHMgb2YgdGhlIGRlZmF1bHQgYW5kIHVzZXIgcHJvdmlkZWQgc2V0dGluZ3MuXG4gICAgICogVXNlciBwcm92aWRlZCBzZXR0aW5ncyB3aWxsIG92ZXJyaWRlIGRlZmF1bHRzLlxuICAgICAqIEBwYXJhbSB7T2JqZWN0fSBzb3VyY2UgdXNlciBzdXBwbGllZCBzZXR0aW5ncy5cbiAgICAgKiBAcmV0dXJucyB7T2JqZWN0fSBzZXR0aW5ncyBtZXJnZWQgZnJvbSBkZWZhdWx0IGFuZCB1c2VyIHZhbHVlcy5cbiAgICAgKi9cbiAgICBzdGF0aWMgbWVyZ2Uoc291cmNlKSB7XG4gICAgICAgIC8vY29weSBkZWZhdWx0IGtleS92YWx1ZSBpdGVtcy5cbiAgICAgICAgbGV0IHJlc3VsdCA9IEpTT04ucGFyc2UoSlNPTi5zdHJpbmdpZnkoc2V0dGluZ3NEZWZhdWx0cykpO1xuXG4gICAgICAgIGlmIChzb3VyY2UgPT09IHVuZGVmaW5lZCB8fCBPYmplY3Qua2V5cyhzb3VyY2UpLmxlbmd0aCA9PT0gMCkge1xuICAgICAgICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgZm9yIChsZXQgW2tleSwgdmFsdWVdIG9mIE9iamVjdC5lbnRyaWVzKHNvdXJjZSkpIHtcbiAgICAgICAgICAgIGxldCB0YXJnZXRUeXBlID0gcmVzdWx0W2tleV0gIT09IHVuZGVmaW5lZCA/IHJlc3VsdFtrZXldLnRvU3RyaW5nKCkgOiB1bmRlZmluZWQ7XG4gICAgICAgICAgICBsZXQgc291cmNlVHlwZSA9IHZhbHVlLnRvU3RyaW5nKCk7XG5cbiAgICAgICAgICAgIGlmICh0YXJnZXRUeXBlICE9PSB1bmRlZmluZWQgJiYgdGFyZ2V0VHlwZSAhPT0gc291cmNlVHlwZSkge1xuICAgICAgICAgICAgICAgIHJlc3VsdFtrZXldID0gdmFsdWU7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgIH1cbn1cblxuZXhwb3J0IHsgTWVyZ2VPcHRpb25zIH07IiwiLyoqXG4gKiBJbXBsZW1lbnRzIHRoZSBwcm9wZXJ0eSBzZXR0aW5ncyBmb3IgdGhlIGdyaWQuXG4gKi9cbmNsYXNzIFNldHRpbmdzR3JpZCB7XG4gICAgLyoqXG4gICAgICogVHJhbnNsYXRlcyBzZXR0aW5ncyBmcm9tIG1lcmdlZCB1c2VyL2RlZmF1bHQgb3B0aW9ucyBpbnRvIGEgZGVmaW5pdGlvbiBvZiBncmlkIHNldHRpbmdzLlxuICAgICAqIEBwYXJhbSB7T2JqZWN0fSBvcHRpb25zIE1lcmdlZCB1c2VyL2RlZmF1bHQgb3B0aW9ucy5cbiAgICAgKi9cbiAgICBjb25zdHJ1Y3RvcihvcHRpb25zKSB7XG4gICAgICAgIHRoaXMuYmFzZUlkTmFtZSA9IG9wdGlvbnMuYmFzZUlkTmFtZTtcbiAgICAgICAgdGhpcy5lbmFibGVQYWdpbmcgPSBvcHRpb25zLmVuYWJsZVBhZ2luZztcbiAgICAgICAgdGhpcy5wYWdlclBhZ2VzVG9EaXNwbGF5ID0gb3B0aW9ucy5wYWdlclBhZ2VzVG9EaXNwbGF5O1xuICAgICAgICB0aGlzLnBhZ2VyUm93c1BlclBhZ2UgPSBvcHRpb25zLnBhZ2VyUm93c1BlclBhZ2U7XG4gICAgICAgIHRoaXMuZGF0ZUZvcm1hdCA9IG9wdGlvbnMuZGF0ZUZvcm1hdDtcbiAgICAgICAgdGhpcy5kYXRlVGltZUZvcm1hdCA9IG9wdGlvbnMuZGF0ZVRpbWVGb3JtYXQ7XG4gICAgICAgIHRoaXMucmVtb3RlVXJsID0gb3B0aW9ucy5yZW1vdGVVcmw7ICBcbiAgICAgICAgdGhpcy5yZW1vdGVQYXJhbXMgPSBvcHRpb25zLnJlbW90ZVBhcmFtcztcbiAgICAgICAgdGhpcy5yZW1vdGVQcm9jZXNzaW5nID0gZmFsc2U7XG4gICAgICAgIFxuICAgICAgICB0aGlzLmFqYXhVcmwgPSAodGhpcy5yZW1vdGVVcmwgJiYgdGhpcy5yZW1vdGVQYXJhbXMpID8gdGhpcy5fYnVpbGRBamF4VXJsKHRoaXMucmVtb3RlVXJsLCB0aGlzLnJlbW90ZVBhcmFtcykgOiB0aGlzLnJlbW90ZVVybDtcblxuICAgICAgICBpZiAodHlwZW9mIG9wdGlvbnMucmVtb3RlUHJvY2Vzc2luZyA9PT0gXCJib29sZWFuXCIgJiYgb3B0aW9ucy5yZW1vdGVQcm9jZXNzaW5nKSB7XG4gICAgICAgICAgICAvLyBSZW1vdGUgcHJvY2Vzc2luZyBzZXQgdG8gYG9uYDsgdXNlIGZpcnN0IGNvbHVtbiB3aXRoIGZpZWxkIGFzIGRlZmF1bHQgc29ydC5cbiAgICAgICAgICAgIGNvbnN0IGZpcnN0ID0gb3B0aW9ucy5jb2x1bW5zLmZpbmQoKGl0ZW0pID0+IGl0ZW0uZmllbGQgIT09IHVuZGVmaW5lZCk7XG5cbiAgICAgICAgICAgIHRoaXMucmVtb3RlUHJvY2Vzc2luZyA9IHRydWU7XG4gICAgICAgICAgICB0aGlzLnJlbW90ZVNvcnREZWZhdWx0Q29sdW1uID0gZmlyc3QuZmllbGQ7XG4gICAgICAgICAgICB0aGlzLnJlbW90ZVNvcnREZWZhdWx0RGlyZWN0aW9uID0gXCJkZXNjXCI7XG4gICAgICAgIH0gZWxzZSBpZiAoT2JqZWN0LmtleXMob3B0aW9ucy5yZW1vdGVQcm9jZXNzaW5nKS5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICAvLyBSZW1vdGUgcHJvY2Vzc2luZyBzZXQgdG8gYG9uYCB1c2luZyBrZXkvdmFsdWUgcGFyYW1ldGVyIGlucHV0cyBmb3IgZGVmYXVsdCBzb3J0IGNvbHVtbi5cbiAgICAgICAgICAgIHRoaXMucmVtb3RlUHJvY2Vzc2luZyA9IHRydWU7XG4gICAgICAgICAgICB0aGlzLnJlbW90ZVNvcnREZWZhdWx0Q29sdW1uID0gb3B0aW9ucy5yZW1vdGVQcm9jZXNzaW5nLmNvbHVtbjtcbiAgICAgICAgICAgIHRoaXMucmVtb3RlU29ydERlZmF1bHREaXJlY3Rpb24gPSBvcHRpb25zLnJlbW90ZVByb2Nlc3NpbmcuZGlyZWN0aW9uID8/IFwiZGVzY1wiO1xuICAgICAgICB9IFxuXG4gICAgICAgIHRoaXMudGFibGVDc3MgPSBvcHRpb25zLnRhYmxlQ3NzO1xuICAgICAgICB0aGlzLnRhYmxlSGVhZGVyVGhDc3MgPSBvcHRpb25zLnRhYmxlSGVhZGVyVGhDc3M7XG4gICAgICAgIHRoaXMucGFnZXJDc3MgPSBvcHRpb25zLnBhZ2VyQ3NzO1xuICAgICAgICB0aGlzLnRhYmxlRmlsdGVyQ3NzID0gb3B0aW9ucy50YWJsZUZpbHRlckNzcztcbiAgICAgICAgdGhpcy50YWJsZUV2ZW5Db2x1bW5XaWR0aHMgPSBvcHRpb25zLnRhYmxlRXZlbkNvbHVtbldpZHRocztcbiAgICAgICAgdGhpcy50YWJsZUNzc1NvcnRBc2MgPSBvcHRpb25zLnRhYmxlQ3NzU29ydEFzYztcbiAgICAgICAgdGhpcy50YWJsZUNzc1NvcnREZXNjID0gb3B0aW9ucy50YWJsZUNzc1NvcnREZXNjO1xuICAgICAgICB0aGlzLnJlZnJlc2hhYmxlSWQgPSBvcHRpb25zLnJlZnJlc2hhYmxlSWQ7XG4gICAgICAgIHRoaXMucm93Q291bnRJZCA9IG9wdGlvbnMucm93Q291bnRJZDtcbiAgICAgICAgdGhpcy5jc3ZFeHBvcnRJZCA9IG9wdGlvbnMuY3N2RXhwb3J0SWQ7XG4gICAgICAgIHRoaXMuY3N2RXhwb3J0UmVtb3RlU291cmNlID0gb3B0aW9ucy5jc3ZFeHBvcnRSZW1vdGVTb3VyY2U7XG4gICAgfVxuICAgIC8qKlxuICAgICAqIENvbXBpbGVzIHRoZSBrZXkvdmFsdWUgcXVlcnkgcGFyYW1ldGVycyBpbnRvIGEgZnVsbHkgcXVhbGlmaWVkIHVybCB3aXRoIHF1ZXJ5IHN0cmluZy5cbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gdXJsIGJhc2UgdXJsLlxuICAgICAqIEBwYXJhbSB7b2JqZWN0fSBwYXJhbXMgcXVlcnkgc3RyaW5nIHBhcmFtZXRlcnMuXG4gICAgICogQHJldHVybnMge3N0cmluZ30gdXJsIHdpdGggcXVlcnkgcGFyYW1ldGVycy5cbiAgICAgKi9cbiAgICBfYnVpbGRBamF4VXJsKHVybCwgcGFyYW1zKSB7XG4gICAgICAgIGNvbnN0IHAgPSBPYmplY3Qua2V5cyhwYXJhbXMpO1xuXG4gICAgICAgIGlmIChwLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgIGNvbnN0IHF1ZXJ5ID0gcC5tYXAoayA9PiBgJHtlbmNvZGVVUklDb21wb25lbnQoayl9PSR7ZW5jb2RlVVJJQ29tcG9uZW50KHBhcmFtc1trXSl9YClcbiAgICAgICAgICAgICAgICAuam9pbihcIiZcIik7XG5cbiAgICAgICAgICAgIHJldHVybiBgJHt1cmx9PyR7cXVlcnl9YDtcbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgcmV0dXJuIHVybDtcbiAgICB9XG59XG5cbmV4cG9ydCB7IFNldHRpbmdzR3JpZCB9OyIsImNsYXNzIERhdGFMb2FkZXIge1xuICAgIC8qKlxuICAgICAqIENyZWF0ZSBjbGFzcyB0byByZXRyaWV2ZSBkYXRhIHZpYSBhbiBBamF4IGNhbGwuXG4gICAgICogQHBhcmFtIHtTZXR0aW5nc0dyaWR9IHNldHRpbmdzIGdyaWQgc2V0dGluZ3MuXG4gICAgICovXG4gICAgY29uc3RydWN0b3Ioc2V0dGluZ3MpIHtcbiAgICAgICAgdGhpcy5hamF4VXJsID0gc2V0dGluZ3MuYWpheFVybDtcbiAgICB9XG4gICAgLyoqKlxuICAgICAqIFVzZXMgaW5wdXQgcGFyYW1ldGVyJ3Mga2V5L3ZhbHVlIHBhcmlzIHRvIGJ1aWxkIGEgZnVsbHkgcXVhbGlmaWVkIHVybCB3aXRoIHF1ZXJ5IHN0cmluZyB2YWx1ZXMuXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IHVybCBUYXJnZXQgdXJsLlxuICAgICAqIEBwYXJhbSB7b2JqZWN0fSBbcGFyYW1ldGVycz17fV0gSW5wdXQgcGFyYW1ldGVycy5cbiAgICAgKiBAcmV0dXJucyB7c3RyaW5nfSBGdWxseSBxdWFsaWZpZWQgdXJsLlxuICAgICAqL1xuICAgIGJ1aWxkVXJsKHVybCwgcGFyYW1ldGVycyA9IHt9KSB7XG4gICAgICAgIGNvbnN0IHAgPSBPYmplY3Qua2V5cyhwYXJhbWV0ZXJzKTtcbiAgXG4gICAgICAgIGlmIChwLmxlbmd0aCA9PT0gMCkge1xuICAgICAgICAgICAgcmV0dXJuIHVybDtcbiAgICAgICAgfVxuXG4gICAgICAgIGxldCByZXN1bHQgPSBbXTtcblxuICAgICAgICBmb3IgKGNvbnN0IGtleSBvZiBwKSB7XG4gICAgICAgICAgICBpZiAoQXJyYXkuaXNBcnJheShwYXJhbWV0ZXJzW2tleV0pKSB7XG4gICAgICAgICAgICAgICAgY29uc3QgbXVsdGkgPSBwYXJhbWV0ZXJzW2tleV0ubWFwKGsgPT4gYCR7a2V5fT0ke2VuY29kZVVSSUNvbXBvbmVudChrKX1gKTtcblxuICAgICAgICAgICAgICAgIHJlc3VsdCA9IHJlc3VsdC5jb25jYXQobXVsdGkpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICByZXN1bHQucHVzaChgJHtrZXl9PSR7ZW5jb2RlVVJJQ29tcG9uZW50KHBhcmFtZXRlcnNba2V5XSl9YCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gdXJsLmluZGV4T2YoXCI/XCIpICE9PSAtMSA/IGAke3VybH0mJHtyZXN1bHQuam9pbihcIiZcIil9YCA6IGAke3VybH0/JHtyZXN1bHQuam9pbihcIiZcIil9YDtcbiAgICB9XG4gICAgLyoqXG4gICAgICogTWFrZXMgYW4gQWpheCBjYWxsIHRvIHRhcmdldCByZXNvdXJjZSwgYW5kIHJldHVybnMgdGhlIHJlc3VsdHMgYXMgYSBKU09OIGFycmF5LlxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSB1cmwgdXJsLlxuICAgICAqIEBwYXJhbSB7T2JqZWN0fSBwYXJhbWV0ZXJzIGtleS92YWx1ZSBxdWVyeSBzdHJpbmcgcGFpcnMuXG4gICAgICogQHJldHVybnMge0FycmF5IHwgT2JqZWN0fVxuICAgICAqL1xuICAgIGFzeW5jIHJlcXVlc3REYXRhKHVybCwgcGFyYW1ldGVycyA9IHt9KSB7XG4gICAgICAgIGxldCByZXN1bHQgPSBbXTtcbiAgICAgICAgY29uc3QgdGFyZ2V0VXJsID0gdGhpcy5idWlsZFVybCh1cmwsIHBhcmFtZXRlcnMpO1xuXG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICBjb25zdCByZXNwb25zZSA9IGF3YWl0IGZldGNoKHRhcmdldFVybCwgeyBcbiAgICAgICAgICAgICAgICBtZXRob2Q6IFwiR0VUXCIsIFxuICAgICAgICAgICAgICAgIG1vZGU6IFwiY29yc1wiLFxuICAgICAgICAgICAgICAgIGhlYWRlcnM6IHsgQWNjZXB0OiBcImFwcGxpY2F0aW9uL2pzb25cIiB9IFxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIGlmIChyZXNwb25zZS5vaykge1xuICAgICAgICAgICAgICAgIHJlc3VsdCA9IGF3YWl0IHJlc3BvbnNlLmpzb24oKTtcbiAgICAgICAgICAgIH0gXG4gICAgICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgICAgICAgd2luZG93LmFsZXJ0KGVyci5tZXNzYWdlKTtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKGVyci5tZXNzYWdlKTtcbiAgICAgICAgICAgIHJlc3VsdCA9IFtdO1xuICAgICAgICB9XG4gIFxuICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgIH1cbiAgICAvKipcbiAgICAgKiBNYWtlcyBhbiBBamF4IGNhbGwgdG8gdGFyZ2V0IHJlc291cmNlIGlkZW50aWZpZWQgaW4gdGhlIGBhamF4VXJsYCBTZXR0aW5ncyBwcm9wZXJ0eSwgYW5kIHJldHVybnMgdGhlIHJlc3VsdHMgYXMgYSBKU09OIGFycmF5LlxuICAgICAqIEBwYXJhbSB7T2JqZWN0fSBbcGFyYW1ldGVycz17fV0ga2V5L3ZhbHVlIHF1ZXJ5IHN0cmluZyBwYWlycy5cbiAgICAgKiBAcmV0dXJucyB7QXJyYXkgfCBPYmplY3R9XG4gICAgICovXG4gICAgYXN5bmMgcmVxdWVzdEdyaWREYXRhKHBhcmFtZXRlcnMgPSB7fSkge1xuICAgICAgICByZXR1cm4gdGhpcy5yZXF1ZXN0RGF0YSh0aGlzLmFqYXhVcmwsIHBhcmFtZXRlcnMpO1xuICAgIH1cbn1cblxuZXhwb3J0IHsgRGF0YUxvYWRlciB9OyIsIi8qKlxuICogUHJvdmlkZXMgbWV0aG9kcyB0byBzdG9yZSBhbmQgcGVyc2lzdCBkYXRhIGZvciB0aGUgZ3JpZC5cbiAqL1xuY2xhc3MgRGF0YVBlcnNpc3RlbmNlIHtcbiAgICAvKipcbiAgICAgKiBDcmVhdGVzIGNsYXNzIG9iamVjdCB0byBzdG9yZSBhbmQgcGVyc2lzdCBncmlkIGRhdGEuXG4gICAgICogQHBhcmFtIHtBcnJheTxPYmplY3Q+fSBkYXRhIHJvdyBkYXRhLlxuICAgICAqL1xuICAgIGNvbnN0cnVjdG9yKGRhdGEpIHtcbiAgICAgICAgdGhpcy5kYXRhID0gZGF0YTtcbiAgICAgICAgdGhpcy5kYXRhQ2FjaGUgPSBkYXRhLmxlbmd0aCA+IDAgPyBzdHJ1Y3R1cmVkQ2xvbmUoZGF0YSkgOiBbXTtcbiAgICB9XG4gICAgLyoqXG4gICAgICogUmV0dXJucyB0aGUgcm93IGRhdGEuXG4gICAgICogQHJldHVybnMge251bWJlcn0gQ291bnQgb2Ygcm93cyBpbiB0aGUgZGF0YS5cbiAgICAgKi9cbiAgICBnZXQgcm93Q291bnQoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmRhdGEubGVuZ3RoO1xuICAgIH1cbiAgICAvKipcbiAgICAgKiBTYXZlcyB0aGUgZGF0YSB0byB0aGUgY2xhc3Mgb2JqZWN0LiAgV2lsbCBhbHNvIGNhY2hlIGEgY29weSBvZiB0aGUgZGF0YSBmb3IgbGF0ZXIgcmVzdG9yYXRpb24gaWYgZmlsdGVyaW5nIG9yIHNvcnRpbmcgaXMgYXBwbGllZC5cbiAgICAgKiBAcGFyYW0ge0FycmF5PG9iamVjdD59IGRhdGEgRGF0YSBzZXQuXG4gICAgICovXG4gICAgc2V0RGF0YSA9IChkYXRhKSA9PiB7XG4gICAgICAgIGlmICghQXJyYXkuaXNBcnJheShkYXRhKSkge1xuICAgICAgICAgICAgdGhpcy5kYXRhID0gW107XG4gICAgICAgICAgICB0aGlzLmRhdGFDYWNoZSA9IFtdO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5kYXRhID0gZGF0YTtcbiAgICAgICAgdGhpcy5kYXRhQ2FjaGUgPSBkYXRhLmxlbmd0aCA+IDAgPyBzdHJ1Y3R1cmVkQ2xvbmUoZGF0YSkgOiBbXTtcbiAgICB9O1xuICAgIC8qKlxuICAgICAqIFJlc2V0cyB0aGUgZGF0YSB0byB0aGUgb3JpZ2luYWwgc3RhdGUgd2hlbiB0aGUgY2xhc3Mgd2FzIGNyZWF0ZWQuXG4gICAgICovXG4gICAgcmVzdG9yZURhdGEoKSB7XG4gICAgICAgIHRoaXMuZGF0YSA9IHN0cnVjdHVyZWRDbG9uZSh0aGlzLmRhdGFDYWNoZSk7XG4gICAgfVxufVxuXG5leHBvcnQgeyBEYXRhUGVyc2lzdGVuY2UgfTsiLCIvKipcbiAqIENsYXNzIHRvIGJ1aWxkIGEgZGF0YS1wcm9jZXNzaW5nIHBpcGVsaW5lIHRoYXQgaW52b2tlcyBhbiBhc3luYyBmdW5jdGlvbiB0byByZXRyaWV2ZSBkYXRhIGZyb20gYSByZW1vdGUgc291cmNlLCBcbiAqIGFuZCBwYXNzIHRoZSByZXN1bHRzIHRvIGFuIGFzc29jaWF0ZWQgaGFuZGxlciBmdW5jdGlvbi4gIFdpbGwgZXhlY3V0ZSBzdGVwcyBpbiB0aGUgb3JkZXIgdGhleSBhcmUgYWRkZWQgdG8gdGhlIGNsYXNzLlxuICogXG4gKiBUaGUgbWFpbiBwdXJwb3NlIG9mIHRoaXMgY2xhc3MgaXMgdG8gcmV0cmlldmUgcmVtb3RlIGRhdGEgZm9yIHNlbGVjdCBpbnB1dCBjb250cm9scywgYnV0IGNhbiBiZSB1c2VkIGZvciBhbnkgaGFuZGxpbmcgXG4gKiBvZiByZW1vdGUgZGF0YSByZXRyaWV2YWwgYW5kIHByb2Nlc3NpbmcuXG4gKi9cbmNsYXNzIERhdGFQaXBlbGluZSB7XG4gICAgI3BpcGVsaW5lcztcbiAgICAvKipcbiAgICAgKiBDcmVhdGVzIGRhdGEtcHJvY2Vzc2luZyBwaXBlbGluZSBjbGFzcy4gIFdpbGwgaW50ZXJuYWxseSBidWlsZCBhIGtleS92YWx1ZSBwYWlyIG9mIGV2ZW50cyBhbmQgYXNzb2NpYXRlZFxuICAgICAqIGNhbGxiYWNrIGZ1bmN0aW9ucy4gIFZhbHVlIHdpbGwgYmUgYW4gYXJyYXkgdG8gYWNjb21tb2RhdGUgbXVsdGlwbGUgY2FsbGJhY2tzIGFzc2lnbmVkIHRvIHRoZSBzYW1lIGV2ZW50IFxuICAgICAqIGtleSBuYW1lLlxuICAgICAqIEBwYXJhbSB7U2V0dGluZ3NHcmlkfSBzZXR0aW5ncyBcbiAgICAgKi9cbiAgICBjb25zdHJ1Y3RvcihzZXR0aW5ncykge1xuICAgICAgICB0aGlzLiNwaXBlbGluZXMgPSB7fTsgXG4gICAgICAgIHRoaXMuYWpheFVybCA9IHNldHRpbmdzLmFqYXhVcmw7XG4gICAgfVxuXG4gICAgY291bnRFdmVudFN0ZXBzKGV2ZW50TmFtZSkge1xuICAgICAgICBpZiAoIXRoaXMuI3BpcGVsaW5lc1tldmVudE5hbWVdKSByZXR1cm4gMDtcblxuICAgICAgICByZXR1cm4gdGhpcy4jcGlwZWxpbmVzW2V2ZW50TmFtZV0ubGVuZ3RoO1xuICAgIH1cbiAgICAvKipcbiAgICAgKiBSZXR1cm5zIGB0cnVlYCBpZiBzdGVwcyBhcmUgcmVnaXN0ZXJlZCBmb3IgdGhlIGFzc29jaWF0ZWQgZXZlbnQgbmFtZSwgb3IgYGZhbHNlYCBpZiBubyBtYXRjaGluZyByZXN1bHRzIGFyZSBmb3VuZC5cbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gZXZlbnROYW1lIEV2ZW50IG5hbWUuXG4gICAgICogQHJldHVybnMge2Jvb2xlYW59IGB0cnVlYCBpZiByZXN1bHRzIGFyZSBmb3VuZCBmb3IgZXZlbnQgbmFtZSwgb3RoZXJ3aXNlIGBmYWxzZWAuXG4gICAgICovXG4gICAgaGFzUGlwZWxpbmUoZXZlbnROYW1lKSB7XG4gICAgICAgIGlmICghdGhpcy4jcGlwZWxpbmVzW2V2ZW50TmFtZV0pIHJldHVybiBmYWxzZTtcblxuICAgICAgICByZXR1cm4gdGhpcy4jcGlwZWxpbmVzW2V2ZW50TmFtZV0ubGVuZ3RoID4gMDtcbiAgICB9XG4gICAgLyoqXG4gICAgICogUmVnaXN0ZXIgYW4gYXN5bmNocm9ub3VzIGNhbGxiYWNrIHN0ZXAgdG8gdGhlIHBpcGVsaW5lLiAgTW9yZSB0aGFuIG9uZSBjYWxsYmFjayBjYW4gYmUgcmVnaXN0ZXJlZCB0byB0aGUgc2FtZSBldmVudCBuYW1lLlxuICAgICAqIFxuICAgICAqIElmIGEgZHVwbGljYXRlL21hdGNoaW5nIGV2ZW50IG5hbWUgYW5kIGNhbGxiYWNrIGZ1bmN0aW9uIGhhcyBhbHJlYWR5IGJlZW4gcmVnaXN0ZXJlZCwgbWV0aG9kIHdpbGwgc2tpcCB0aGUgXG4gICAgICogcmVnaXN0cmF0aW9uIHByb2Nlc3MuXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IGV2ZW50TmFtZSBFdmVudCBuYW1lLlxuICAgICAqIEBwYXJhbSB7RnVuY3Rpb259IGNhbGxiYWNrIEFuIGFzeW5jIGZ1bmN0aW9uLlxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBbdXJsPVwiXCJdIFRhcmdldCB1cmwuICBXaWxsIHVzZSBgYWpheFVybGAgcHJvcGVydHkgZGVmYXVsdCBpZiBhcmd1bWVudCBpcyBlbXB0eS5cbiAgICAgKi9cbiAgICBhZGRTdGVwKGV2ZW50TmFtZSwgY2FsbGJhY2ssIHVybCA9IFwiXCIpIHtcbiAgICAgICAgaWYgKCF0aGlzLiNwaXBlbGluZXNbZXZlbnROYW1lXSkge1xuICAgICAgICAgICAgdGhpcy4jcGlwZWxpbmVzW2V2ZW50TmFtZV0gPSBbXTtcbiAgICAgICAgfSBlbHNlIGlmICh0aGlzLiNwaXBlbGluZXNbZXZlbnROYW1lXS5zb21lKCh4KSA9PiB4LmNhbGxiYWNrID09PSBjYWxsYmFjaykpIHtcbiAgICAgICAgICAgIGNvbnNvbGUud2FybihcIkNhbGxiYWNrIGZ1bmN0aW9uIGFscmVhZHkgZm91bmQgZm9yOiBcIiArIGV2ZW50TmFtZSk7XG4gICAgICAgICAgICByZXR1cm47ICAvLyBJZiBldmVudCBuYW1lIGFuZCBjYWxsYmFjayBhbHJlYWR5IGV4aXN0LCBkb24ndCBhZGQuXG4gICAgICAgIH1cblxuICAgICAgICBpZiAodXJsID09PSBcIlwiKSB7XG4gICAgICAgICAgICB1cmwgPSB0aGlzLmFqYXhVcmw7XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLiNwaXBlbGluZXNbZXZlbnROYW1lXS5wdXNoKHt1cmw6IHVybCwgY2FsbGJhY2s6IGNhbGxiYWNrfSk7XG4gICAgfVxuICAgIC8qKlxuICAgICAqIEV4ZWN1dGVzIHRoZSBIVFRQIHJlcXVlc3QocykgZm9yIHRoZSBnaXZlbiBldmVudCBuYW1lLCBhbmQgcGFzc2VzIHRoZSByZXN1bHRzIHRvIHRoZSBhc3NvY2lhdGVkIGNhbGxiYWNrIGZ1bmN0aW9uLiAgXG4gICAgICogTWV0aG9kIGV4cGVjdHMgcmV0dXJuIHR5cGUgb2YgcmVxdWVzdCB0byBiZSBhIEpTT04gcmVzcG9uc2UuXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IGV2ZW50TmFtZSBcbiAgICAgKi9cbiAgICBhc3luYyBleGVjdXRlKGV2ZW50TmFtZSkge1xuICAgICAgICBmb3IgKGxldCBpdGVtIG9mIHRoaXMuI3BpcGVsaW5lc1tldmVudE5hbWVdKSB7XG4gICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgIGNvbnN0IHJlc3BvbnNlID0gYXdhaXQgZmV0Y2goaXRlbS51cmwsIHsgXG4gICAgICAgICAgICAgICAgICAgIG1ldGhvZDogXCJHRVRcIiwgXG4gICAgICAgICAgICAgICAgICAgIG1vZGU6IFwiY29yc1wiLFxuICAgICAgICAgICAgICAgICAgICBoZWFkZXJzOiB7IEFjY2VwdDogXCJhcHBsaWNhdGlvbi9qc29uXCIgfSBcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICBpZiAocmVzcG9uc2Uub2spIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgZGF0YSA9IGF3YWl0IHJlc3BvbnNlLmpzb24oKTtcblxuICAgICAgICAgICAgICAgICAgICBpdGVtLmNhbGxiYWNrKGRhdGEpO1xuICAgICAgICAgICAgICAgIH0gXG4gICAgICAgICAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgICAgICAgICAgICB3aW5kb3cuYWxlcnQoZXJyLm1lc3NhZ2UpO1xuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKGVyci5tZXNzYWdlKTtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cbn1cblxuZXhwb3J0IHsgRGF0YVBpcGVsaW5lIH07IiwiY2xhc3MgRWxlbWVudEhlbHBlciB7XG4gICAgLyoqXG4gICAgICogQ3JlYXRlcyBhbiBIVE1MIGVsZW1lbnQgd2l0aCB0aGUgc3BlY2lmaWVkIHRhZyBhbmQgcHJvcGVydGllcy5cbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gdGFnIFRoZSB0YWcgbmFtZSBvZiB0aGUgZWxlbWVudCB0byBjcmVhdGUuXG4gICAgICogQHBhcmFtIHtPYmplY3R9IFtwcm9wZXJ0aWVzPXt9XSBBbiBvYmplY3QgY29udGFpbmluZyBwcm9wZXJ0aWVzIHRvIGFzc2lnbiB0byB0aGUgZWxlbWVudC5cbiAgICAgKiBAcGFyYW0ge09iamVjdH0gW2RhdGFzZXQ9e31dIEFuIG9iamVjdCBjb250YWluaW5nIGRhdGFzZXQgYXR0cmlidXRlcyB0byBhc3NpZ24gdG8gdGhlIGVsZW1lbnQuXG4gICAgICogQHJldHVybnMge0hUTUxFbGVtZW50fSBUaGUgY3JlYXRlZCBIVE1MIGVsZW1lbnQuXG4gICAgICovXG4gICAgc3RhdGljIGNyZWF0ZSh0YWcsIHByb3BlcnRpZXMgPSB7fSwgZGF0YXNldCA9IHt9KSB7XG4gICAgICAgIGNvbnN0IGVsZW1lbnQgPSBPYmplY3QuYXNzaWduKGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQodGFnKSwgcHJvcGVydGllcyk7XG5cbiAgICAgICAgaWYgKGRhdGFzZXQpIHsgXG4gICAgICAgICAgICBPYmplY3QuYXNzaWduKGVsZW1lbnQuZGF0YXNldCwgZGF0YXNldCk7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gZWxlbWVudDtcbiAgICB9XG4gICAgLyoqXG4gICAgICogQ3JlYXRlcyBhIGBkaXZgIGVsZW1lbnQgd2l0aCB0aGUgc3BlY2lmaWVkIHByb3BlcnRpZXMgYW5kIGRhdGFzZXQuXG4gICAgICogQHBhcmFtIHtPYmplY3R9IFtwcm9wZXJ0aWVzPXt9XSBBbiBvYmplY3QgY29udGFpbmluZyBwcm9wZXJ0aWVzIHRvIGFzc2lnbiB0byB0aGUgZWxlbWVudC5cbiAgICAgKiBAcGFyYW0ge09iamVjdH0gW2RhdGFzZXQ9e31dIEFuIG9iamVjdCBjb250YWluaW5nIGRhdGFzZXQgYXR0cmlidXRlcyB0byBhc3NpZ24gdG8gdGhlIGVsZW1lbnQuXG4gICAgICogQHJldHVybnMge0hUTUxEaXZFbGVtZW50fSBUaGUgY3JlYXRlZCBIVE1MIGVsZW1lbnQuXG4gICAgICovXG4gICAgc3RhdGljIGRpdihwcm9wZXJ0aWVzID0ge30sIGRhdGFzZXQgPSB7fSkge1xuICAgICAgICByZXR1cm4gdGhpcy5jcmVhdGUoXCJkaXZcIiwgcHJvcGVydGllcywgZGF0YXNldCk7XG4gICAgfVxuICAgIC8qKlxuICAgICAqIENyZWF0ZXMgYSBgaW5wdXRgIGVsZW1lbnQgd2l0aCB0aGUgc3BlY2lmaWVkIHByb3BlcnRpZXMgYW5kIGRhdGFzZXQuXG4gICAgICogQHBhcmFtIHtPYmplY3R9IFtwcm9wZXJ0aWVzPXt9XSBBbiBvYmplY3QgY29udGFpbmluZyBwcm9wZXJ0aWVzIHRvIGFzc2lnbiB0byB0aGUgZWxlbWVudC5cbiAgICAgKiBAcGFyYW0ge09iamVjdH0gW2RhdGFzZXQ9e31dIEFuIG9iamVjdCBjb250YWluaW5nIGRhdGFzZXQgYXR0cmlidXRlcyB0byBhc3NpZ24gdG8gdGhlIGVsZW1lbnQuXG4gICAgICogQHJldHVybnMge0hUTUxJbnB1dEVsZW1lbnR9IFRoZSBjcmVhdGVkIEhUTUwgZWxlbWVudC5cbiAgICAgKi9cbiAgICBzdGF0aWMgaW5wdXQocHJvcGVydGllcyA9IHt9LCBkYXRhc2V0ID0ge30pIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuY3JlYXRlKFwiaW5wdXRcIiwgcHJvcGVydGllcywgZGF0YXNldCk7XG4gICAgfVxuICAgIC8qKlxuICAgICAqIENyZWF0ZXMgYSBgc3BhbmAgZWxlbWVudCB3aXRoIHRoZSBzcGVjaWZpZWQgcHJvcGVydGllcyBhbmQgZGF0YXNldC5cbiAgICAgKiBAcGFyYW0ge09iamVjdH0gW3Byb3BlcnRpZXM9e31dIEFuIG9iamVjdCBjb250YWluaW5nIHByb3BlcnRpZXMgdG8gYXNzaWduIHRvIHRoZSBlbGVtZW50LlxuICAgICAqIEBwYXJhbSB7T2JqZWN0fSBbZGF0YXNldD17fV0gQW4gb2JqZWN0IGNvbnRhaW5pbmcgZGF0YXNldCBhdHRyaWJ1dGVzIHRvIGFzc2lnbiB0byB0aGUgZWxlbWVudC5cbiAgICAgKiBAcmV0dXJucyB7SFRNTFNwYW5FbGVtZW50fSBUaGUgY3JlYXRlZCBIVE1MIGVsZW1lbnQuXG4gICAgICovXG4gICAgc3RhdGljIHNwYW4ocHJvcGVydGllcyA9IHt9LCBkYXRhc2V0ID0ge30pIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuY3JlYXRlKFwic3BhblwiLCBwcm9wZXJ0aWVzLCBkYXRhc2V0KTtcbiAgICB9XG59XG5cbmV4cG9ydCB7IEVsZW1lbnRIZWxwZXIgfTsiLCIvKipcbiAqIENsYXNzIHRoYXQgYWxsb3dzIHRoZSBzdWJzY3JpcHRpb24gYW5kIHB1YmxpY2F0aW9uIG9mIGdyaWQgcmVsYXRlZCBldmVudHMuXG4gKiBAY2xhc3NcbiAqL1xuY2xhc3MgR3JpZEV2ZW50cyB7XG4gICAgI2V2ZW50cztcblxuICAgIGNvbnN0cnVjdG9yKCkge1xuICAgICAgICB0aGlzLiNldmVudHMgPSB7fTtcbiAgICB9XG5cbiAgICAjZ3VhcmQoZXZlbnROYW1lKSB7XG4gICAgICAgIGlmICghdGhpcy4jZXZlbnRzKSByZXR1cm4gZmFsc2U7XG5cbiAgICAgICAgcmV0dXJuICh0aGlzLiNldmVudHNbZXZlbnROYW1lXSk7XG4gICAgfVxuICAgIC8qKlxuICAgICAqIEFkZHMgYW4gZXZlbnQgdG8gcHVibGlzaGVyIGNvbGxlY3Rpb24uXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IGV2ZW50TmFtZSBFdmVudCBuYW1lLlxuICAgICAqIEBwYXJhbSB7RnVuY3Rpb259IGhhbmRsZXIgQ2FsbGJhY2sgZnVuY3Rpb24uXG4gICAgICogQHBhcmFtIHtib29sZWFufSBbaXNBc3luYz1mYWxzZV0gVHJ1ZSBpZiBjYWxsYmFjayBzaG91bGQgZXhlY3V0ZSB3aXRoIGF3YWl0IG9wZXJhdGlvbi5cbiAgICAgKiBAcGFyYW0ge251bWJlcn0gW3ByaW9yaXR5PTBdIE9yZGVyIGluIHdoaWNoIGV2ZW50IHNob3VsZCBiZSBleGVjdXRlZC5cbiAgICAgKi9cbiAgICBzdWJzY3JpYmUoZXZlbnROYW1lLCBoYW5kbGVyLCBpc0FzeW5jID0gZmFsc2UsIHByaW9yaXR5ID0gMCkge1xuICAgICAgICBpZiAoIXRoaXMuI2V2ZW50c1tldmVudE5hbWVdKSB7XG4gICAgICAgICAgICB0aGlzLiNldmVudHNbZXZlbnROYW1lXSA9IFt7IGhhbmRsZXIsIHByaW9yaXR5LCBpc0FzeW5jIH1dO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICB0aGlzLiNldmVudHNbZXZlbnROYW1lXS5wdXNoKHsgaGFuZGxlciwgcHJpb3JpdHksIGlzQXN5bmMgfSk7XG4gICAgICAgIHRoaXMuI2V2ZW50c1tldmVudE5hbWVdLnNvcnQoKGEsIGIpID0+IHtcbiAgICAgICAgICAgIHJldHVybiBhLnByaW9yaXR5IC0gYi5wcmlvcml0eTtcbiAgICAgICAgfSk7XG4gICAgfVxuICAgIC8qKlxuICAgICAqIFJlbW92ZXMgdGhlIHRhcmdldCBldmVudCBmcm9tIHRoZSBwdWJsaWNhdGlvbiBjaGFpbi5cbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gZXZlbnROYW1lIEV2ZW50IG5hbWUuXG4gICAgICogQHBhcmFtIHtGdW5jdGlvbn0gaGFuZGxlciBFdmVudCBoYW5kbGVyLlxuICAgICAqL1xuICAgIHVuc3Vic2NyaWJlKGV2ZW50TmFtZSwgaGFuZGxlcikge1xuICAgICAgICBpZiAoIXRoaXMuI2d1YXJkKGV2ZW50TmFtZSkpIHJldHVybjtcblxuICAgICAgICB0aGlzLiNldmVudHNbZXZlbnROYW1lXSA9IHRoaXMuI2V2ZW50c1tldmVudE5hbWVdLmZpbHRlcihoID0+IGggIT09IGhhbmRsZXIpO1xuICAgIH1cbiAgICAvKipcbiAgICAgKiBUYWtlcyB0aGUgcmVzdWx0IG9mIGVhY2ggc3Vic2NyaWJlcidzIGNhbGxiYWNrIGZ1bmN0aW9uIGFuZCBjaGFpbnMgdGhlbSBpbnRvIG9uZSByZXN1bHQuXG4gICAgICogVXNlZCB0byBjcmVhdGUgYSBsaXN0IG9mIHBhcmFtZXRlcnMgZnJvbSBtdWx0aXBsZSBtb2R1bGVzOiBpLmUuIHNvcnQsIGZpbHRlciwgYW5kIHBhZ2luZyBpbnB1dHMuXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IGV2ZW50TmFtZSBldmVudCBuYW1lXG4gICAgICogQHBhcmFtIHtPYmplY3R9IFtpbml0aWFsVmFsdWU9e31dIGluaXRpYWwgdmFsdWVcbiAgICAgKiBAcmV0dXJucyB7T2JqZWN0fVxuICAgICAqL1xuICAgIGNoYWluKGV2ZW50TmFtZSwgaW5pdGlhbFZhbHVlID0ge30pIHtcbiAgICAgICAgaWYgKCF0aGlzLiNndWFyZChldmVudE5hbWUpKSByZXR1cm47XG5cbiAgICAgICAgbGV0IHJlc3VsdCA9IGluaXRpYWxWYWx1ZTtcblxuICAgICAgICB0aGlzLiNldmVudHNbZXZlbnROYW1lXS5mb3JFYWNoKChoKSA9PiB7XG4gICAgICAgICAgICByZXN1bHQgPSBoLmhhbmRsZXIocmVzdWx0KTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICB9XG4gICAgLyoqXG4gICAgICogVHJpZ2dlciBjYWxsYmFjayBmdW5jdGlvbiBmb3Igc3Vic2NyaWJlcnMgb2YgdGhlIGBldmVudE5hbWVgLlxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBldmVudE5hbWUgRXZlbnQgbmFtZS5cbiAgICAgKiBAcGFyYW0gIHsuLi5hbnl9IGFyZ3MgQXJndW1lbnRzLlxuICAgICAqL1xuICAgIGFzeW5jIHRyaWdnZXIoZXZlbnROYW1lLCAuLi5hcmdzKSB7XG4gICAgICAgIGlmICghdGhpcy4jZ3VhcmQoZXZlbnROYW1lKSkgcmV0dXJuO1xuXG4gICAgICAgIGZvciAobGV0IGggb2YgdGhpcy4jZXZlbnRzW2V2ZW50TmFtZV0pIHtcbiAgICAgICAgICAgIGlmIChoLmlzQXN5bmMpIHtcbiAgICAgICAgICAgICAgICBhd2FpdCBoLmhhbmRsZXIoLi4uYXJncyk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGguaGFuZGxlciguLi5hcmdzKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cbn1cblxuZXhwb3J0IHsgR3JpZEV2ZW50cyB9OyIsImltcG9ydCB7IENlbGwgfSBmcm9tIFwiLi4vY2VsbC9jZWxsLmpzXCI7XG4vKipcbiAqIENsYXNzIHRvIG1hbmFnZSB0aGUgdGFibGUgZWxlbWVudCBhbmQgaXRzIHJvd3MgYW5kIGNlbGxzLlxuICovXG5jbGFzcyBUYWJsZSB7XG4gICAgI3Jvd0NvdW50O1xuICAgIC8qKlxuICAgICAqIENyZWF0ZSBgVGFibGVgIGNsYXNzIHRvIG1hbmFnZSB0aGUgdGFibGUgZWxlbWVudCBhbmQgaXRzIHJvd3MgYW5kIGNlbGxzLlxuICAgICAqIEBwYXJhbSB7R3JpZENvbnRleHR9IGNvbnRleHQgR3JpZCBjb250ZXh0LlxuICAgICAqL1xuICAgIGNvbnN0cnVjdG9yKGNvbnRleHQpIHtcbiAgICAgICAgdGhpcy5jb250ZXh0ID0gY29udGV4dDtcbiAgICAgICAgdGhpcy50YWJsZSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJ0YWJsZVwiKTtcbiAgICAgICAgdGhpcy50aGVhZCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJ0aGVhZFwiKTtcbiAgICAgICAgdGhpcy50Ym9keSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJ0Ym9keVwiKTtcbiAgICAgICAgdGhpcy4jcm93Q291bnQgPSAwO1xuXG4gICAgICAgIHRoaXMudGFibGUuaWQgPSBgJHtjb250ZXh0LnNldHRpbmdzLmJhc2VJZE5hbWV9X3RhYmxlYDtcbiAgICAgICAgdGhpcy50YWJsZS5hcHBlbmQodGhpcy50aGVhZCwgdGhpcy50Ym9keSk7XG4gICAgICAgIHRoaXMudGFibGUuY2xhc3NOYW1lID0gY29udGV4dC5zZXR0aW5ncy50YWJsZUNzcztcbiAgICB9XG4gICAgLyoqXG4gICAgICogSW5pdGlhbGl6ZXMgdGhlIHRhYmxlIGhlYWRlciByb3cgZWxlbWVudCBieSBjcmVhdGluZyBhIHJvdyBhbmQgYXBwZW5kaW5nIGVhY2ggY29sdW1uJ3MgaGVhZGVyIGNlbGwuXG4gICAgICovXG4gICAgaW5pdGlhbGl6ZUhlYWRlcigpIHtcbiAgICAgICAgY29uc3QgdHIgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwidHJcIik7XG5cbiAgICAgICAgZm9yIChjb25zdCBjb2x1bW4gb2YgdGhpcy5jb250ZXh0LmNvbHVtbk1hbmFnZXIuY29sdW1ucykge1xuICAgICAgICAgICAgdHIuYXBwZW5kQ2hpbGQoY29sdW1uLmhlYWRlckNlbGwuZWxlbWVudCk7XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLnRoZWFkLmFwcGVuZENoaWxkKHRyKTtcbiAgICB9XG4gICAgLyoqXG4gICAgICogUmVuZGVyIHRhYmxlIGJvZHkgcm93cy4gIFdpbGwgcmVtb3ZlIGFueSBwcmlvciB0YWJsZSBib2R5IHJlc3VsdHMgYW5kIGJ1aWxkIG5ldyByb3dzIGFuZCBjZWxscy5cbiAgICAgKiBAcGFyYW0ge0FycmF5PE9iamVjdD59IGRhdGFzZXQgRGF0YSBzZXQgdG8gYnVpbGQgdGFibGUgcm93cy5cbiAgICAgKiBAcGFyYW0ge251bWJlciB8IG51bGx9IFtyb3dDb3VudD1udWxsXSBTZXQgdGhlIHJvdyBjb3VudCBwYXJhbWV0ZXIgdG8gYSBzcGVjaWZpYyB2YWx1ZSBpZiBcbiAgICAgKiByZW1vdGUgcHJvY2Vzc2luZyBpcyBiZWluZyB1c2VkLCBvdGhlcndpc2Ugd2lsbCB1c2UgdGhlIGxlbmd0aCBvZiB0aGUgZGF0YXNldC5cbiAgICAgKi9cbiAgICByZW5kZXJSb3dzKGRhdGFzZXQsIHJvd0NvdW50ID0gbnVsbCkge1xuICAgICAgICAvL0NsZWFyIGJvZHkgb2YgcHJldmlvdXMgZGF0YS5cbiAgICAgICAgdGhpcy50Ym9keS5yZXBsYWNlQ2hpbGRyZW4oKTtcbiAgICAgICAgXG4gICAgICAgIGlmICghQXJyYXkuaXNBcnJheShkYXRhc2V0KSkge1xuICAgICAgICAgICAgdGhpcy4jcm93Q291bnQgPSAwO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy4jcm93Q291bnQgPSByb3dDb3VudCA/PyBkYXRhc2V0Lmxlbmd0aDtcblxuICAgICAgICBmb3IgKGNvbnN0IGRhdGEgb2YgZGF0YXNldCkge1xuICAgICAgICAgICAgY29uc3QgdHIgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwidHJcIik7XG5cbiAgICAgICAgICAgIGZvciAobGV0IGNvbHVtbiBvZiB0aGlzLmNvbnRleHQuY29sdW1uTWFuYWdlci5jb2x1bW5zKSB7XG4gICAgICAgICAgICAgICAgY29uc3QgY2VsbCA9IG5ldyBDZWxsKGRhdGEsIGNvbHVtbiwgdGhpcy5jb250ZXh0Lm1vZHVsZXMsIHRyKTtcblxuICAgICAgICAgICAgICAgIHRyLmFwcGVuZENoaWxkKGNlbGwuZWxlbWVudCk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHRoaXMudGJvZHkuYXBwZW5kQ2hpbGQodHIpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgZ2V0IHJvd0NvdW50KCkge1xuICAgICAgICByZXR1cm4gdGhpcy4jcm93Q291bnQ7XG4gICAgfVxufVxuXG5leHBvcnQgeyBUYWJsZSB9OyIsImltcG9ydCB7IENvbHVtbk1hbmFnZXIgfSBmcm9tIFwiLi4vY29sdW1uL2NvbHVtbk1hbmFnZXIuanNcIjtcbmltcG9ydCB7IERhdGFQaXBlbGluZSB9IGZyb20gXCIuLi9kYXRhL2RhdGFQaXBlbGluZS5qc1wiO1xuaW1wb3J0IHsgRGF0YUxvYWRlciB9IGZyb20gXCIuLi9kYXRhL2RhdGFMb2FkZXIuanNcIjtcbmltcG9ydCB7IERhdGFQZXJzaXN0ZW5jZSB9IGZyb20gXCIuLi9kYXRhL2RhdGFQZXJzaXN0ZW5jZS5qc1wiO1xuaW1wb3J0IHsgR3JpZEV2ZW50cyB9IGZyb20gXCIuLi9ldmVudHMvZ3JpZEV2ZW50cy5qc1wiO1xuaW1wb3J0IHsgVGFibGUgfSBmcm9tIFwiLi4vdGFibGUvdGFibGUuanNcIjtcbi8qKlxuICogUHJvdmlkZXMgdGhlIGNvbnRleHQgZm9yIHRoZSBncmlkLCBpbmNsdWRpbmcgc2V0dGluZ3MsIGRhdGEsIGFuZCBtb2R1bGVzLiAgVGhpcyBjbGFzcyBpcyByZXNwb25zaWJsZSBmb3IgbWFuYWdpbmcgXG4gKiB0aGUgZ3JpZCdzIGNvcmUgc3RhdGUgYW5kIGJlaGF2aW9yLlxuICovXG5jbGFzcyBHcmlkQ29udGV4dCB7XG4gICAgLyoqXG4gICAgICogQ3JlYXRlIGdyaWQgY29udGV4dCwgd2hpY2ggcmVwcmVzZW50cyB0aGUgY29yZSBsb2dpYyBhbmQgZnVuY3Rpb25hbGl0eSBvZiB0aGUgZGF0YSBncmlkLlxuICAgICAqIEBwYXJhbSB7QXJyYXk8b2JqZWN0Pn0gY29sdW1ucyBDb2x1bW4gZGVmaW5pdGlvbi5cbiAgICAgKiBAcGFyYW0ge1NldHRpbmdzR3JpZH0gc2V0dGluZ3MgR3JpZCBzZXR0aW5ncy5cbiAgICAgKiBAcGFyYW0ge2FueVtdfSBbZGF0YT1bXV0gR3JpZCBkYXRhLlxuICAgICAqL1xuICAgIGNvbnN0cnVjdG9yKGNvbHVtbnMsIHNldHRpbmdzLCBkYXRhID0gW10pIHtcbiAgICAgICAgdGhpcy5zZXR0aW5ncyA9IHNldHRpbmdzO1xuICAgICAgICB0aGlzLmV2ZW50cyA9IG5ldyBHcmlkRXZlbnRzKCk7XG4gICAgICAgIHRoaXMucGlwZWxpbmUgPSBuZXcgRGF0YVBpcGVsaW5lKHRoaXMuc2V0dGluZ3MpO1xuICAgICAgICB0aGlzLmRhdGFsb2FkZXIgPSBuZXcgRGF0YUxvYWRlcih0aGlzLnNldHRpbmdzKTtcbiAgICAgICAgdGhpcy5wZXJzaXN0ZW5jZSA9IG5ldyBEYXRhUGVyc2lzdGVuY2UoZGF0YSk7XG4gICAgICAgIHRoaXMuY29sdW1uTWFuYWdlciA9IG5ldyBDb2x1bW5NYW5hZ2VyKGNvbHVtbnMsIHRoaXMuc2V0dGluZ3MpO1xuICAgICAgICB0aGlzLmdyaWQgPSBuZXcgVGFibGUodGhpcyk7XG4gICAgICAgIHRoaXMubW9kdWxlcyA9IHt9O1xuICAgIH1cbn1cblxuZXhwb3J0IHsgR3JpZENvbnRleHQgfTsiLCIvKipcbiAqIFByb3ZpZGVzIGxvZ2ljIHRvIGNvbnZlcnQgZ3JpZCBkYXRhIGludG8gYSBkb3dubG9hZGFibGUgQ1NWIGZpbGUuXG4gKiBNb2R1bGUgd2lsbCBwcm92aWRlIGxpbWl0ZWQgZm9ybWF0dGluZyBvZiBkYXRhLiAgT25seSBjb2x1bW5zIHdpdGggYSBmb3JtYXR0ZXIgdHlwZSBcbiAqIG9mIGBtb2R1bGVgIG9yIGBmdW5jdGlvbmAgd2lsbCBiZSBwcm9jZXNzZWQuICBBbGwgb3RoZXIgY29sdW1ucyB3aWxsIGJlIHJldHVybmVkIGFzXG4gKiB0aGVpciByYXcgZGF0YSB0eXBlLiAgSWYgYSBjb2x1bW4ncyB2YWx1ZSBjb250YWlucyBhIGNvbW1hLCB0aGUgdmFsdWUgd2lsbCBiZSBkb3VibGUgcXVvdGVkLlxuICovXG5jbGFzcyBDc3ZNb2R1bGUge1xuICAgIC8qKlxuICAgICAqIEFsbG93cyBncmlkJ3MgZGF0YSB0byBiZSBjb252ZXJ0ZWQgaW50byBhIGRvd25sb2FkYWJsZSBDU1YgZmlsZS4gIElmIGdyaWQgaXMgXG4gICAgICogc2V0IHRvIGEgbG9jYWwgZGF0YSBzb3VyY2UsIHRoZSBkYXRhIGNhY2hlIGluIHRoZSBwZXJzaXN0ZW5jZSBjbGFzcyBpcyB1c2VkLlxuICAgICAqIE90aGVyd2lzZSwgY2xhc3Mgd2lsbCBtYWtlIGFuIEFqYXggY2FsbCB0byByZW1vdGUgdGFyZ2V0IHNldCBpbiBkYXRhIGxvYWRlclxuICAgICAqIGNsYXNzLlxuICAgICAqIEBwYXJhbSB7R3JpZENvbnRleHR9IGNvbnRleHQgR3JpZCBjb250ZXh0IGNsYXNzLlxuICAgICAqL1xuICAgIGNvbnN0cnVjdG9yKGNvbnRleHQpIHtcbiAgICAgICAgdGhpcy5jb250ZXh0ID0gY29udGV4dDtcbiAgICAgICAgdGhpcy5kZWxpbWl0ZXIgPSBcIixcIjtcbiAgICAgICAgdGhpcy5idXR0b24gPSBjb250ZXh0LnNldHRpbmdzLmNzdkV4cG9ydElkO1xuICAgICAgICB0aGlzLmRhdGFVcmwgPSBjb250ZXh0LnNldHRpbmdzLmNzdkV4cG9ydFJlbW90ZVNvdXJjZTtcbiAgICB9XG5cbiAgICBpbml0aWFsaXplKCkge1xuICAgICAgICBjb25zdCBidG4gPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCh0aGlzLmJ1dHRvbik7XG4gICAgICAgIFxuICAgICAgICBidG4uYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsIHRoaXMuaGFuZGxlRG93bmxvYWQpO1xuICAgIH1cblxuICAgIGhhbmRsZURvd25sb2FkID0gYXN5bmMgKCkgPT4ge1xuICAgICAgICBsZXQgY3N2RGF0YSA9IFtdO1xuICAgICAgICBjb25zdCBmaWxlTmFtZSA9IGAke2RvY3VtZW50LnRpdGxlfS5jc3ZgO1xuXG4gICAgICAgIGlmICh0aGlzLmRhdGFVcmwpIHtcbiAgICAgICAgICAgIGNvbnN0IGRhdGEgPSBhd2FpdCB0aGlzLmNvbnRleHQuZGF0YWxvYWRlci5yZXF1ZXN0RGF0YSh0aGlzLmRhdGFVcmwpO1xuXG4gICAgICAgICAgICBjc3ZEYXRhID0gdGhpcy5idWlsZEZpbGVDb250ZW50KGRhdGEpLmpvaW4oXCJcXHJcXG5cIik7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBjc3ZEYXRhID0gdGhpcy5idWlsZEZpbGVDb250ZW50KHRoaXMuY29udGV4dC5wZXJzaXN0ZW5jZS5kYXRhQ2FjaGUpLmpvaW4oXCJcXHJcXG5cIik7XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCBibG9iID0gbmV3IEJsb2IoW2NzdkRhdGFdLCB7IHR5cGU6IFwidGV4dC9jc3Y7Y2hhcnNldD11dGYtODtcIiB9KTtcbiAgICAgICAgY29uc3QgZWxlbWVudCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJhXCIpO1xuXG4gICAgICAgIGVsZW1lbnQuc2V0QXR0cmlidXRlKFwiaHJlZlwiLCB3aW5kb3cuVVJMLmNyZWF0ZU9iamVjdFVSTChibG9iKSk7XG4gICAgICAgIC8vc2V0IGZpbGUgdGl0bGVcbiAgICAgICAgZWxlbWVudC5zZXRBdHRyaWJ1dGUoXCJkb3dubG9hZFwiLCBmaWxlTmFtZSk7XG4gICAgICAgIC8vdHJpZ2dlciBkb3dubG9hZFxuICAgICAgICBlbGVtZW50LnN0eWxlLmRpc3BsYXkgPSBcIm5vbmVcIjtcbiAgICAgICAgZG9jdW1lbnQuYm9keS5hcHBlbmRDaGlsZChlbGVtZW50KTtcbiAgICAgICAgZWxlbWVudC5jbGljaygpO1xuICAgICAgICAvL3JlbW92ZSB0ZW1wb3JhcnkgbGluayBlbGVtZW50XG4gICAgICAgIGRvY3VtZW50LmJvZHkucmVtb3ZlQ2hpbGQoZWxlbWVudCk7XG5cbiAgICAgICAgd2luZG93LmFsZXJ0KGBEb3dubG9hZGVkICR7ZmlsZU5hbWV9YCk7XG4gICAgfTtcbiAgICAvKipcbiAgICAgKiBSZXR1cm5zIGFuIG9iamVjdCB0aGF0IHJlcHJlc2VudHMgdGhlIGNvbHVtbnMgYW5kIGhlYWRlciBuYW1lcyB0aGF0IHNob3VsZCBiZSB1c2VkXG4gICAgICogdG8gY3JlYXRlIHRoZSBDU1YgcmVzdWx0cy4gIFdpbGwgZXhjbHVkZSBjb2x1bW5zIHdpdGggYSB0eXBlIG9mIGBpY29uYC5cbiAgICAgKiBAcGFyYW0ge09iamVjdH0gY29sdW1uTWdyQ29sdW1ucyBDb2x1bW4gTWFuYWdlciBDb2x1bW5zIGNvbGxlY3Rpb24uXG4gICAgICogQHJldHVybnMge3sgaGVhZGVyczogQXJyYXk8c3RyaW5nPiwgY29sdW1uczogQXJyYXk8Q29sdW1uPiB9fVxuICAgICAqL1xuICAgIGlkZW50aWZ5Q29sdW1ucyhjb2x1bW5NZ3JDb2x1bW5zKSB7XG4gICAgICAgIGNvbnN0IGhlYWRlcnMgPSBbXTtcbiAgICAgICAgY29uc3QgY29sdW1ucyA9IFtdO1xuXG4gICAgICAgIGZvciAoY29uc3QgY29sdW1uIG9mIGNvbHVtbk1nckNvbHVtbnMpIHtcbiAgICAgICAgICAgIGlmIChjb2x1bW4udHlwZSA9PT0gXCJpY29uXCIpIGNvbnRpbnVlO1xuXG4gICAgICAgICAgICBoZWFkZXJzLnB1c2goY29sdW1uLmxhYmVsKTtcbiAgICAgICAgICAgIGNvbHVtbnMucHVzaChjb2x1bW4pO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHsgaGVhZGVyczogaGVhZGVycywgY29sdW1uczogY29sdW1ucyB9OyBcbiAgICB9XG4gICAgLyoqXG4gICAgICogQ29udmVydHMgZ3JpZCBkYXRhIGluIERhdGFQZXJzaXN0ZW5jZSBjbGFzcyBpbnRvIGEgc2luZ2xlIGRpbWVuc2lvbmFsIGFycmF5IG9mXG4gICAgICogc3RyaW5nIGRlbGltaXRlZCB2YWx1ZXMgdGhhdCByZXByZXNlbnRzIGEgcm93IG9mIGRhdGEgaW4gYSBjc3YgZmlsZS4gXG4gICAgICogQHBhcmFtIHtBcnJheTxPYmplY3Q+fSBkYXRhc2V0IGRhdGEgc2V0IHRvIGJ1aWxkIGNzdiByb3dzLlxuICAgICAqIEByZXR1cm5zIHtBcnJheTxzdHJpbmc+fVxuICAgICAqL1xuICAgIGJ1aWxkRmlsZUNvbnRlbnQoZGF0YXNldCkge1xuICAgICAgICBjb25zdCBmaWxlQ29udGVudHMgPSBbXTtcbiAgICAgICAgY29uc3QgY29sdW1ucyA9IHRoaXMuaWRlbnRpZnlDb2x1bW5zKHRoaXMuY29udGV4dC5jb2x1bW5NYW5hZ2VyLmNvbHVtbnMpO1xuICAgICAgICAvL2NyZWF0ZSBkZWxpbWl0ZWQgaGVhZGVyLlxuICAgICAgICBmaWxlQ29udGVudHMucHVzaChjb2x1bW5zLmhlYWRlcnMuam9pbih0aGlzLmRlbGltaXRlcikpO1xuICAgICAgICAvL2NyZWF0ZSByb3cgZGF0YVxuICAgICAgICBmb3IgKGNvbnN0IHJvd0RhdGEgb2YgZGF0YXNldCkge1xuICAgICAgICAgICAgY29uc3QgcmVzdWx0ID0gY29sdW1ucy5jb2x1bW5zLm1hcCgoYykgPT4gdGhpcy5mb3JtYXRWYWx1ZShjLCByb3dEYXRhKSk7XG5cbiAgICAgICAgICAgIGZpbGVDb250ZW50cy5wdXNoKHJlc3VsdC5qb2luKHRoaXMuZGVsaW1pdGVyKSk7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gZmlsZUNvbnRlbnRzO1xuICAgIH1cbiAgICAvKipcbiAgICAgKiBSZXR1cm5zIGEgZm9ybWF0dGVkIHN0cmluZyBiYXNlZCBvbiB0aGUgQ29sdW1uJ3MgZm9ybWF0dGVyIHNldHRpbmcuXG4gICAgICogV2lsbCBkb3VibGUgcXVvdGUgc3RyaW5nIGlmIGNvbW1hIGNoYXJhY3RlciBpcyBmb3VuZCBpbiB2YWx1ZS5cbiAgICAgKiBAcGFyYW0ge0NvbHVtbn0gY29sdW1uIGNvbHVtbiBtb2RlbC5cbiAgICAgKiBAcGFyYW0ge09iamVjdH0gcm93RGF0YSByb3cgZGF0YS5cbiAgICAgKiBAcmV0dXJucyB7c3RyaW5nfVxuICAgICAqL1xuICAgIGZvcm1hdFZhbHVlKGNvbHVtbiwgcm93RGF0YSkge1xuICAgICAgICBsZXQgdmFsdWUgPSBTdHJpbmcocm93RGF0YVtjb2x1bW4uZmllbGRdKTtcbiAgICAgICAgLy9hcHBseSBsaW1pdGVkIGZvcm1hdHRpbmc7IGNzdiByZXN1bHRzIHNob3VsZCBiZSAncmF3JyBkYXRhLlxuICAgICAgICBpZiAoY29sdW1uLmZvcm1hdHRlcikge1xuICAgICAgICAgICAgaWYgKHR5cGVvZiBjb2x1bW4uZm9ybWF0dGVyID09PSBcImZ1bmN0aW9uXCIpIHtcbiAgICAgICAgICAgICAgICB2YWx1ZSA9IFN0cmluZyhjb2x1bW4uZm9ybWF0dGVyKHJvd0RhdGEsIGNvbHVtbi5mb3JtYXR0ZXJQYXJhbXMpKTtcbiAgICAgICAgICAgIH0gZWxzZSBpZiAoY29sdW1uLmZvcm1hdHRlciA9PT0gXCJtb2R1bGVcIikge1xuICAgICAgICAgICAgICAgIHZhbHVlID0gU3RyaW5nKHRoaXMuY29udGV4dC5tb2R1bGVzW2NvbHVtbi5mb3JtYXR0ZXJQYXJhbXMubmFtZV0uYXBwbHkocm93RGF0YSwgY29sdW1uLCBcImNzdlwiKSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgLy9jaGVjayBmb3Igc3RyaW5ncyB0aGF0IG1heSBuZWVkIHRvIGJlIHF1b3RlZC5cbiAgICAgICAgaWYgKHZhbHVlLmluY2x1ZGVzKFwiLFwiKSkge1xuICAgICAgICAgICAgdmFsdWUgPSBgXCIke3ZhbHVlfVwiYDtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiB2YWx1ZTtcbiAgICB9XG59XG5cbkNzdk1vZHVsZS5tb2R1bGVOYW1lID0gXCJjc3ZcIjtcblxuZXhwb3J0IHsgQ3N2TW9kdWxlIH07IiwiaW1wb3J0IHsgY3NzSGVscGVyIH0gZnJvbSBcIi4uLy4uLy4uL2NvbXBvbmVudHMvaGVscGVycy9jc3NIZWxwZXIuanNcIjtcbmltcG9ydCB7IEVsZW1lbnRIZWxwZXIgfSBmcm9tIFwiLi4vLi4vLi4vY29tcG9uZW50cy9oZWxwZXJzL2VsZW1lbnRIZWxwZXIuanNcIjtcbi8qKlxuICogQ3JlYXRlIGZpbHRlciBvYmplY3QgdGhhdCByZXByZXNlbnRzIGEgZWxlbWVudCB0byBmaWx0ZXIgYmV0d2VlbiB0d28gdmFsdWVzLiAgQ3JlYXRlcyBhIGRyb3Bkb3duIHdpdGggYSB0d28gaW5wdXQgYm94ZXMgXG4gKiB0byBlbnRlciBzdGFydCBhbmQgZW5kIHZhbHVlcy5cbiAqL1xuY2xhc3MgRWxlbWVudEJldHdlZW4ge1xuICAgIC8qKlxuICAgICAqIENyZWF0ZSBmaWx0ZXIgb2JqZWN0IHRoYXQgcmVwcmVzZW50cyBhIGJldHdlZW4gZWxlbWVudC5cbiAgICAgKiBAcGFyYW0ge0NvbHVtbn0gY29sdW1uIENvbHVtbiBjbGFzcyBvYmplY3QuXG4gICAgICogQHBhcmFtIHtHcmlkQ29udGV4dH0gY29udGV4dCBHcmlkIGNvbnRleHQgb2JqZWN0LlxuICAgICAqL1xuICAgIGNvbnN0cnVjdG9yKGNvbHVtbiwgY29udGV4dCkge1xuICAgICAgICB0aGlzLmNvbnRleHQgPSBjb250ZXh0O1xuICAgICAgICB0aGlzLmVsZW1lbnQgPSBFbGVtZW50SGVscGVyLmRpdih7IG5hbWU6IGNvbHVtbi5maWVsZCwgY2xhc3NOYW1lOiBjc3NIZWxwZXIubXVsdGlTZWxlY3QucGFyZW50Q2xhc3MgfSk7XG4gICAgICAgIHRoaXMuaGVhZGVyID0gRWxlbWVudEhlbHBlci5kaXYoeyBjbGFzc05hbWU6IGNzc0hlbHBlci5tdWx0aVNlbGVjdC5oZWFkZXIgfSk7XG4gICAgICAgIHRoaXMub3B0aW9uc0NvbnRhaW5lciA9IEVsZW1lbnRIZWxwZXIuZGl2KHsgY2xhc3NOYW1lOiBjc3NIZWxwZXIubXVsdGlTZWxlY3Qub3B0aW9ucyB9KTtcbiAgICAgICAgdGhpcy5maWVsZCA9IGNvbHVtbi5maWVsZDtcbiAgICAgICAgdGhpcy5maWVsZFR5cGUgPSBjb2x1bW4udHlwZTsgIC8vZmllbGQgdmFsdWUgdHlwZS5cbiAgICAgICAgdGhpcy5maWx0ZXJUeXBlID0gXCJiZXR3ZWVuXCI7ICAvL2NvbmRpdGlvbiB0eXBlLlxuXG4gICAgICAgIHRoaXMuZWxlbWVudC5pZCA9IGAke3RoaXMuY29udGV4dC5zZXR0aW5ncy5iYXNlSWROYW1lfV8ke3RoaXMuZmllbGR9YDtcbiAgICAgICAgdGhpcy5lbGVtZW50LmFwcGVuZCh0aGlzLmhlYWRlciwgdGhpcy5vcHRpb25zQ29udGFpbmVyKTtcbiAgICAgICAgdGhpcy5oZWFkZXIuaWQgPSBgaGVhZGVyXyR7dGhpcy5jb250ZXh0LnNldHRpbmdzLmJhc2VJZE5hbWV9XyR7dGhpcy5maWVsZH1gO1xuICAgICAgICB0aGlzLm9wdGlvbnNDb250YWluZXIuc3R5bGUubWluV2lkdGggPSBcIjE4NXB4XCI7XG5cbiAgICAgICAgdGhpcy4jdGVtcGxhdGVCZXR3ZWVuKCk7XG4gICAgICAgIHRoaXMuaGVhZGVyLmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCB0aGlzLmhhbmRsZUNsaWNrKTtcbiAgICB9XG5cbiAgICAjdGVtcGxhdGVCZXR3ZWVuKCkge1xuICAgICAgICB0aGlzLmVsZW1lbnRTdGFydCA9IEVsZW1lbnRIZWxwZXIuaW5wdXQoeyBjbGFzc05hbWU6IGNzc0hlbHBlci5pbnB1dCwgaWQ6IGBzdGFydF8ke3RoaXMuY29udGV4dC5zZXR0aW5ncy5iYXNlSWROYW1lfV8ke3RoaXMuZmllbGR9YCB9KTtcblxuICAgICAgICB0aGlzLmVsZW1lbnRFbmQgPSBFbGVtZW50SGVscGVyLmlucHV0KHsgY2xhc3NOYW1lOiBjc3NIZWxwZXIuaW5wdXQsIGlkOiBgZW5kXyR7dGhpcy5jb250ZXh0LnNldHRpbmdzLmJhc2VJZE5hbWV9XyR7dGhpcy5maWVsZH1gIH0pO1xuICAgICAgICB0aGlzLmVsZW1lbnRFbmQuc3R5bGUubWFyZ2luQm90dG9tID0gXCIxMHB4XCI7XG5cbiAgICAgICAgY29uc3Qgc3RhcnQgPSBFbGVtZW50SGVscGVyLnNwYW4oeyBpbm5lclRleHQ6IFwiU3RhcnRcIiwgY2xhc3NOYW1lOiBjc3NIZWxwZXIuYmV0d2VlbkxhYmVsIH0pO1xuICAgICAgICBjb25zdCBlbmQgPSAgRWxlbWVudEhlbHBlci5zcGFuKHsgaW5uZXJUZXh0OiBcIkVuZFwiLCBjbGFzc05hbWU6IGNzc0hlbHBlci5iZXR3ZWVuTGFiZWwgfSk7XG4gXG4gICAgICAgIGNvbnN0IGJ0bkFwcGx5ID0gRWxlbWVudEhlbHBlci5jcmVhdGUoXCJidXR0b25cIiwgeyBpbm5lclRleHQ6IFwiQXBwbHlcIiwgY2xhc3NOYW1lOiBjc3NIZWxwZXIuYmV0d2VlbkJ1dHRvbiB9KTtcbiAgICAgICAgYnRuQXBwbHkuc3R5bGUubWFyZ2luUmlnaHQgPSBcIjEwcHhcIjtcbiAgICAgICAgYnRuQXBwbHkuYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsIHRoaXMuaGFuZGxlckNsaWNrKTtcblxuICAgICAgICBjb25zdCBidG5DbGVhciA9IEVsZW1lbnRIZWxwZXIuY3JlYXRlKFwiYnV0dG9uXCIsIHsgaW5uZXJUZXh0OiBcIkNsZWFyXCIsIGNsYXNzTmFtZTogY3NzSGVscGVyLmJldHdlZW5CdXR0b24gfSk7XG4gICAgICAgIGJ0bkNsZWFyLmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCB0aGlzLmhhbmRsZUJ1dHRvbkNsZWFyKTtcblxuICAgICAgICB0aGlzLm9wdGlvbnNDb250YWluZXIuYXBwZW5kKHN0YXJ0LCB0aGlzLmVsZW1lbnRTdGFydCwgZW5kLCB0aGlzLmVsZW1lbnRFbmQsIGJ0bkFwcGx5LCBidG5DbGVhcik7XG4gICAgfVxuXG4gICAgaGFuZGxlQnV0dG9uQ2xlYXIgPSAoKSA9PiB7XG4gICAgICAgIHRoaXMuZWxlbWVudFN0YXJ0LnZhbHVlID0gXCJcIjtcbiAgICAgICAgdGhpcy5lbGVtZW50RW5kLnZhbHVlID0gXCJcIjtcblxuICAgICAgICBpZiAodGhpcy5jb3VudExhYmVsICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgIHRoaXMuY291bnRMYWJlbC5yZW1vdmUoKTtcbiAgICAgICAgICAgIHRoaXMuY291bnRMYWJlbCA9IHVuZGVmaW5lZDtcbiAgICAgICAgfVxuICAgIH07XG5cbiAgICBjcmVhdGVDb3VudExhYmVsID0gKCkgPT4ge1xuICAgICAgICAvL3VwZGF0ZSBjb3VudCBsYWJlbC5cbiAgICAgICAgaWYgKHRoaXMuY291bnRMYWJlbCA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICB0aGlzLmNvdW50TGFiZWwgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwic3BhblwiKTtcbiAgICAgICAgICAgIHRoaXMuY291bnRMYWJlbC5jbGFzc05hbWUgPSBjc3NIZWxwZXIubXVsdGlTZWxlY3QuaGVhZGVyT3B0aW9uO1xuICAgICAgICAgICAgdGhpcy5oZWFkZXIuYXBwZW5kKHRoaXMuY291bnRMYWJlbCk7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAodGhpcy5lbGVtZW50U3RhcnQudmFsdWUgIT09IFwiXCIgJiYgdGhpcy5lbGVtZW50RW5kLnZhbHVlICE9PSBcIlwiKSB7XG4gICAgICAgICAgICB0aGlzLmNvdW50TGFiZWwuaW5uZXJUZXh0ID0gYCR7dGhpcy5lbGVtZW50U3RhcnQudmFsdWV9IHRvICR7dGhpcy5lbGVtZW50RW5kLnZhbHVlfWA7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB0aGlzLmNvdW50TGFiZWwucmVtb3ZlKCk7XG4gICAgICAgICAgICB0aGlzLmNvdW50TGFiZWwgPSB1bmRlZmluZWQ7XG4gICAgICAgIH1cbiAgICB9O1xuXG4gICAgaGFuZGxlQ2xpY2sgPSBhc3luYyAoKSA9PiB7XG4gICAgICAgIGNvbnN0IHN0YXR1cyA9IHRoaXMuaGVhZGVyLmNsYXNzTGlzdC50b2dnbGUoY3NzSGVscGVyLm11bHRpU2VsZWN0LmhlYWRlckFjdGl2ZSk7XG5cbiAgICAgICAgaWYgKCFzdGF0dXMpIHtcbiAgICAgICAgICAgIC8vQ2xvc2Ugd2luZG93IGFuZCBhcHBseSBmaWx0ZXIgdmFsdWUuXG4gICAgICAgICAgICB0aGlzLmNyZWF0ZUNvdW50TGFiZWwoKTtcbiAgICAgICAgICAgIGF3YWl0IHRoaXMuY29udGV4dC5ldmVudHMudHJpZ2dlcihcInJlbmRlclwiKTtcbiAgICAgICAgICAgIGRvY3VtZW50LnJlbW92ZUV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCB0aGlzLmhhbmRsZURvY3VtZW50KTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCB0aGlzLmhhbmRsZURvY3VtZW50KTtcbiAgICAgICAgfVxuICAgIH07XG4gICAgLyoqXG4gICAgICogSGFuZGxlciBldmVudCB0byBjbG9zZSBkcm9wZG93biB3aGVuIHVzZXIgY2xpY2tzIG91dHNpZGUgdGhlIG11bHRpLXNlbGVjdCBjb250cm9sLiAgRXZlbnQgaXMgcmVtb3ZlZCB3aGVuIG11bHRpLXNlbGVjdCBpcyBcbiAgICAgKiBub3QgYWN0aXZlIHNvIHRoYXQgaXQncyBub3QgZmlyaW5nIG9uIHJlZHVuZGFudCBldmVudHMuXG4gICAgICogQHBhcmFtIHtPYmplY3R9IGUgT2JqZWN0IHRoYXQgdHJpZ2dlcmVkIGV2ZW50LlxuICAgICAqL1xuICAgIGhhbmRsZURvY3VtZW50ID0gYXN5bmMgKGUpID0+IHtcbiAgICAgICAgaWYgKCFlLnRhcmdldC5jbG9zZXN0KFwiLmRhdGFncmlkcy1pbnB1dFwiKSAmJiAhZS50YXJnZXQuY2xvc2VzdChgIyR7dGhpcy5oZWFkZXIuaWR9YCkpIHtcbiAgICAgICAgICAgIHRoaXMuaGVhZGVyLmNsYXNzTGlzdC5yZW1vdmUoY3NzSGVscGVyLm11bHRpU2VsZWN0LmhlYWRlckFjdGl2ZSk7XG5cbiAgICAgICAgICAgIGF3YWl0IHRoaXMuY29udGV4dC5ldmVudHMudHJpZ2dlcihcInJlbmRlclwiKTtcblxuICAgICAgICAgICAgZG9jdW1lbnQucmVtb3ZlRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsIHRoaXMuaGFuZGxlRG9jdW1lbnQpO1xuICAgICAgICB9XG4gICAgfTtcbiAgICAvKipcbiAgICAgKiBSZXR1cm5zIGFuIGFycmF5IG9mIHRoZSBzdGFydCBhbmQgZW5kIHZhbHVlcyBmcm9tIGlucHV0IHNvdXJjZS4gIElmIGVpdGhlciBpbnB1dCBzb3VyY2UgaXMgZW1wdHksIGFuIGVtcHR5IHN0cmluZyB3aWxsIGJlIHJldHVybmVkLlxuICAgICAqIEByZXR1cm5zIHtBcnJheSB8IHN0cmluZ30gQXJyYXkgb2Ygc3RhcnQgYW5kIGVuZCB2YWx1ZXMgb3IgZW1wdHkgc3RyaW5nLlxuICAgICAqL1xuICAgIGdldCB2YWx1ZSgpIHtcbiAgICAgICAgaWYgKHRoaXMuZWxlbWVudFN0YXJ0LnZhbHVlID09PSBcIlwiIHx8IHRoaXMuZWxlbWVudEVuZC52YWx1ZSA9PT0gXCJcIikgcmV0dXJuIFwiXCI7XG5cbiAgICAgICAgcmV0dXJuIFt0aGlzLmVsZW1lbnRTdGFydC52YWx1ZSwgdGhpcy5lbGVtZW50RW5kLnZhbHVlXTtcbiAgICB9XG59XG5cbmV4cG9ydCB7IEVsZW1lbnRCZXR3ZWVuIH07IiwiLyoqXG4gKiBSZXByZXNlbnRzIGEgY29sdW1ucyBmaWx0ZXIgY29udHJvbC4gIENyZWF0ZXMgYSBgSFRNTElucHV0RWxlbWVudGAgdGhhdCBpcyBhZGRlZCB0byB0aGUgaGVhZGVyIHJvdyBvZiBcbiAqIHRoZSBncmlkIHRvIGZpbHRlciBkYXRhIHNwZWNpZmljIHRvIGl0cyBkZWZpbmVkIGNvbHVtbi4gXG4gKi9cbmNsYXNzIEVsZW1lbnRJbnB1dCB7XG4gICAgLyoqXG4gICAgICogQ3JlYXRlIGZpbHRlciBvYmplY3QgdGhhdCByZXByZXNlbnRzIGEgYEhUTUxTZWxlY3RFbGVtZW50YCBlbGVtZW50IGluIHRoZSB0YWJsZSdzIGhlYWRlciByb3cuXG4gICAgICogQHBhcmFtIHtDb2x1bW59IGNvbHVtbiBDb2x1bW4gY2xhc3Mgb2JqZWN0LlxuICAgICAqIEBwYXJhbSB7R3JpZENvbnRleHR9IGNvbnRleHQgR3JpZCBjb250ZXh0LlxuICAgICovXG4gICAgY29uc3RydWN0b3IoY29sdW1uLCBjb250ZXh0KSB7XG4gICAgICAgIHRoaXMuZWxlbWVudCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJpbnB1dFwiKTtcbiAgICAgICAgdGhpcy5jb250ZXh0ID0gY29udGV4dDtcbiAgICAgICAgdGhpcy5maWVsZCA9IGNvbHVtbi5maWVsZDtcbiAgICAgICAgdGhpcy5maWVsZFR5cGUgPSBjb2x1bW4udHlwZTsgIC8vZmllbGQgdmFsdWUgdHlwZS5cbiAgICAgICAgdGhpcy5maWx0ZXJUeXBlID0gY29sdW1uLmZpbHRlclR5cGU7ICAvL2NvbmRpdGlvbiB0eXBlLlxuICAgICAgICB0aGlzLmZpbHRlcklzRnVuY3Rpb24gPSAodHlwZW9mIGNvbHVtbj8uZmlsdGVyVHlwZSA9PT0gXCJmdW5jdGlvblwiKTtcbiAgICAgICAgdGhpcy5maWx0ZXJQYXJhbXMgPSBjb2x1bW4uZmlsdGVyUGFyYW1zO1xuICAgICAgICB0aGlzLmVsZW1lbnQubmFtZSA9IHRoaXMuZmllbGQ7XG4gICAgICAgIHRoaXMuZWxlbWVudC5pZCA9IHRoaXMuZmllbGQ7XG4gICAgICAgIHRoaXMuZWxlbWVudC5hZGRFdmVudExpc3RlbmVyKFwiY2hhbmdlXCIsIGFzeW5jICgpID0+IGF3YWl0IHRoaXMuY29udGV4dC5ldmVudHMudHJpZ2dlcihcInJlbmRlclwiKSk7XG5cbiAgICAgICAgaWYgKGNvbHVtbi5maWx0ZXJDc3MpIHtcbiAgICAgICAgICAgIHRoaXMuZWxlbWVudC5jbGFzc05hbWUgPSBjb2x1bW4uZmlsdGVyQ3NzO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKCF0aGlzLmNvbnRleHQuc2V0dGluZ3MucmVtb3RlUHJvY2Vzc2luZyAmJiBjb2x1bW4uZmlsdGVyUmVhbFRpbWUpIHtcbiAgICAgICAgICAgIHRoaXMucmVhbFRpbWVUaW1lb3V0ID0gKHR5cGVvZiB0aGlzLmZpbHRlclJlYWxUaW1lID09PSBcIm51bWJlclwiKSBcbiAgICAgICAgICAgICAgICA/IHRoaXMuZmlsdGVyUmVhbFRpbWUgXG4gICAgICAgICAgICAgICAgOiA1MDA7XG5cbiAgICAgICAgICAgIHRoaXMuZWxlbWVudC5hZGRFdmVudExpc3RlbmVyKFwia2V5dXBcIiwgdGhpcy5oYW5kbGVMaXZlRmlsdGVyKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIGhhbmRsZUxpdmVGaWx0ZXIgPSBhc3luYyAoKSA9PiB7XG4gICAgICAgIHNldFRpbWVvdXQoYXN5bmMgKCkgPT4gYXdhaXQgdGhpcy5jb250ZXh0LmV2ZW50cy50cmlnZ2VyKFwicmVuZGVyXCIpLCB0aGlzLnJlYWxUaW1lVGltZW91dCk7XG4gICAgfTtcbiAgICAvKipcbiAgICAgKiBSZXR1cm5zIHRoZSB2YWx1ZSBvZiB0aGUgaW5wdXQgZWxlbWVudC4gIFdpbGwgcmV0dXJuIGEgc3RyaW5nIHZhbHVlLlxuICAgICAqIEByZXR1cm5zIHtzdHJpbmd9XG4gICAgICovXG4gICAgZ2V0IHZhbHVlKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5lbGVtZW50LnZhbHVlO1xuICAgIH1cbn1cblxuZXhwb3J0IHsgRWxlbWVudElucHV0IH07IiwiaW1wb3J0IHsgRWxlbWVudEhlbHBlciB9IGZyb20gXCIuLi8uLi8uLi9jb21wb25lbnRzL2hlbHBlcnMvZWxlbWVudEhlbHBlci5qc1wiO1xuLyoqXG4gKiBSZXByZXNlbnRzIGEgY29sdW1ucyBmaWx0ZXIgY29udHJvbC4gIENyZWF0ZXMgYSBgSFRNTFNlbGVjdEVsZW1lbnRgIHRoYXQgaXMgYWRkZWQgdG8gdGhlIGhlYWRlciByb3cgb2YgdGhlIGdyaWQgdG8gZmlsdGVyIGRhdGEgXG4gKiBzcGVjaWZpYyB0byBpdHMgZGVmaW5lZCBjb2x1bW4uICBJZiBgZmlsdGVyVmFsdWVzUmVtb3RlU291cmNlYCBpcyBkZWZpbmVkLCB0aGUgc2VsZWN0IG9wdGlvbnMgd2lsbCBiZSBwb3B1bGF0ZWQgYnkgdGhlIGRhdGEgcmV0dXJuZWQgXG4gKiBmcm9tIHRoZSByZW1vdGUgc291cmNlIGJ5IHJlZ2lzdGVyaW5nIHRvIHRoZSBncmlkIHBpcGVsaW5lJ3MgYGluaXRgIGFuZCBgcmVmcmVzaGAgZXZlbnRzLlxuICovXG5jbGFzcyBFbGVtZW50U2VsZWN0IHtcbiAgICAvKipcbiAgICAgKiBDcmVhdGUgZmlsdGVyIG9iamVjdCB0aGF0IHJlcHJlc2VudHMgYSBgSFRNTFNlbGVjdEVsZW1lbnRgIGVsZW1lbnQgaW4gdGhlIHRhYmxlJ3MgaGVhZGVyIHJvdy5cbiAgICAgKiBAcGFyYW0ge0NvbHVtbn0gY29sdW1uIENvbHVtbiBjbGFzcyBvYmplY3QuXG4gICAgICogQHBhcmFtIHtHcmlkQ29udGV4dH0gY29udGV4dCBHcmlkIGNvbnRleHQuIFxuICAgICAqL1xuICAgIGNvbnN0cnVjdG9yKGNvbHVtbiwgY29udGV4dCkge1xuICAgICAgICB0aGlzLmVsZW1lbnQgPSBFbGVtZW50SGVscGVyLmNyZWF0ZShcInNlbGVjdFwiLCB7IG5hbWU6IGNvbHVtbi5maWVsZCB9KTtcbiAgICAgICAgdGhpcy5maWVsZCA9IGNvbHVtbi5maWVsZDtcbiAgICAgICAgdGhpcy5maWVsZFR5cGUgPSBjb2x1bW4udHlwZTsgIC8vZmllbGQgdmFsdWUgdHlwZS5cbiAgICAgICAgdGhpcy5maWx0ZXJUeXBlID0gY29sdW1uLmZpbHRlclR5cGU7ICAvL2NvbmRpdGlvbiB0eXBlLlxuICAgICAgICB0aGlzLmZpbHRlcklzRnVuY3Rpb24gPSAodHlwZW9mIGNvbHVtbj8uZmlsdGVyVHlwZSA9PT0gXCJmdW5jdGlvblwiKTtcbiAgICAgICAgdGhpcy5maWx0ZXJQYXJhbXMgPSBjb2x1bW4uZmlsdGVyUGFyYW1zO1xuICAgICAgICB0aGlzLnBpcGVsaW5lID0gY29udGV4dC5waXBlbGluZTtcbiAgICAgICAgdGhpcy5jb250ZXh0ID0gY29udGV4dDtcblxuICAgICAgICB0aGlzLmVsZW1lbnQuaWQgPSBgJHtjb2x1bW4uc2V0dGluZ3MuYmFzZUlkTmFtZX1fJHt0aGlzLmZpZWxkfWA7XG4gICAgICAgIHRoaXMuZWxlbWVudC5hZGRFdmVudExpc3RlbmVyKFwiY2hhbmdlXCIsIGFzeW5jICgpID0+IGF3YWl0IHRoaXMuY29udGV4dC5ldmVudHMudHJpZ2dlcihcInJlbmRlclwiKSk7XG5cbiAgICAgICAgaWYgKGNvbHVtbi5maWx0ZXJDc3MpIHtcbiAgICAgICAgICAgIHRoaXMuZWxlbWVudC5jbGFzc05hbWUgPSBjb2x1bW4uZmlsdGVyQ3NzO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKGNvbHVtbi5maWx0ZXJWYWx1ZXNSZW1vdGVTb3VyY2UpIHtcbiAgICAgICAgICAgIC8vc2V0IHVwIHBpcGVsaW5lIHRvIHJldHJpZXZlIG9wdGlvbiBkYXRhIHdoZW4gaW5pdCBwaXBlbGluZSBpcyBjYWxsZWQuXG4gICAgICAgICAgICB0aGlzLnBpcGVsaW5lLmFkZFN0ZXAoXCJpbml0XCIsIHRoaXMuY3JlYXRlU2VsZWN0T3B0aW9ucywgY29sdW1uLmZpbHRlclZhbHVlc1JlbW90ZVNvdXJjZSk7XG4gICAgICAgICAgICB0aGlzLnBpcGVsaW5lLmFkZFN0ZXAoXCJyZWZyZXNoXCIsIHRoaXMucmVmcmVzaFNlbGVjdE9wdGlvbnMsIGNvbHVtbi5maWx0ZXJWYWx1ZXNSZW1vdGVTb3VyY2UpO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9IFxuICAgICAgICAvL3VzZSB1c2VyIHN1cHBsaWVkIHZhbHVlcyB0byBjcmVhdGUgc2VsZWN0IG9wdGlvbnMuXG4gICAgICAgIGNvbnN0IG9wdHMgPSBBcnJheS5pc0FycmF5KGNvbHVtbi5maWx0ZXJWYWx1ZXMpIFxuICAgICAgICAgICAgPyBjb2x1bW4uZmlsdGVyVmFsdWVzXG4gICAgICAgICAgICA6IE9iamVjdC5lbnRyaWVzKGNvbHVtbi5maWx0ZXJWYWx1ZXMpLm1hcCgoW2tleSwgdmFsdWVdKSA9PiAoeyB2YWx1ZToga2V5LCB0ZXh0OiB2YWx1ZX0pKTtcblxuICAgICAgICB0aGlzLmNyZWF0ZVNlbGVjdE9wdGlvbnMob3B0cyk7XG4gICAgfVxuICAgIC8qKlxuICAgICAqIEJ1aWxkcyBvcHRpb24gZWxlbWVudHMgZm9yIGNsYXNzJ3MgYHNlbGVjdGAgaW5wdXQuICBFeHBlY3RzIGFuIGFycmF5IG9mIG9iamVjdHMgd2l0aCBrZXkvdmFsdWUgcGFpcnMgb2Y6XG4gICAgICogICogYHZhbHVlYDogb3B0aW9uIHZhbHVlLiAgc2hvdWxkIGJlIGEgcHJpbWFyeSBrZXkgdHlwZSB2YWx1ZSB3aXRoIG5vIGJsYW5rIHNwYWNlcy5cbiAgICAgKiAgKiBgdGV4dGA6IG9wdGlvbiB0ZXh0IHZhbHVlXG4gICAgICogQHBhcmFtIHtBcnJheTxvYmplY3Q+fSBkYXRhIGtleS92YWx1ZSBhcnJheSBvZiB2YWx1ZXMuXG4gICAgICovXG4gICAgY3JlYXRlU2VsZWN0T3B0aW9ucyA9IChkYXRhKSA9PiB7XG4gICAgICAgIGNvbnN0IGZpcnN0ID0gRWxlbWVudEhlbHBlci5jcmVhdGUoXCJvcHRpb25cIiwgeyB2YWx1ZTogXCJcIiwgdGV4dDogXCJTZWxlY3QgYWxsXCIgfSk7XG5cbiAgICAgICAgdGhpcy5lbGVtZW50LmFwcGVuZChmaXJzdCk7XG5cbiAgICAgICAgZm9yIChjb25zdCBpdGVtIG9mIGRhdGEpIHtcbiAgICAgICAgICAgIGNvbnN0IG9wdGlvbiA9IEVsZW1lbnRIZWxwZXIuY3JlYXRlKFwib3B0aW9uXCIsIHsgdmFsdWU6IGl0ZW0udmFsdWUsIHRleHQ6IGl0ZW0udGV4dCB9KTtcblxuICAgICAgICAgICAgdGhpcy5lbGVtZW50LmFwcGVuZChvcHRpb24pO1xuICAgICAgICB9XG4gICAgfTtcbiAgICAvKipcbiAgICAgKiBSZXBsYWNlcy91cGRhdGVzIG9wdGlvbiBlbGVtZW50cyBmb3IgY2xhc3MncyBgc2VsZWN0YCBpbnB1dC4gIFdpbGwgcGVyc2lzdCB0aGUgY3VycmVudCBzZWxlY3QgdmFsdWUsIGlmIGFueS4gIFxuICAgICAqIEV4cGVjdHMgYW4gYXJyYXkgb2Ygb2JqZWN0cyB3aXRoIGtleS92YWx1ZSBwYWlycyBvZjpcbiAgICAgKiAgKiBgdmFsdWVgOiBPcHRpb24gdmFsdWUuICBTaG91bGQgYmUgYSBwcmltYXJ5IGtleSB0eXBlIHZhbHVlIHdpdGggbm8gYmxhbmsgc3BhY2VzLlxuICAgICAqICAqIGB0ZXh0YDogT3B0aW9uIHRleHQuXG4gICAgICogQHBhcmFtIHtBcnJheTxvYmplY3Q+fSBkYXRhIGtleS92YWx1ZSBhcnJheSBvZiB2YWx1ZXMuXG4gICAgICovXG4gICAgcmVmcmVzaFNlbGVjdE9wdGlvbnMgPSAoZGF0YSkgPT4ge1xuICAgICAgICBjb25zdCBzZWxlY3RlZFZhbHVlID0gdGhpcy5lbGVtZW50LnZhbHVlO1xuXG4gICAgICAgIHRoaXMuZWxlbWVudC5yZXBsYWNlQ2hpbGRyZW4oKTtcbiAgICAgICAgdGhpcy5jcmVhdGVTZWxlY3RPcHRpb25zKGRhdGEpO1xuICAgICAgICB0aGlzLmVsZW1lbnQudmFsdWUgPSBzZWxlY3RlZFZhbHVlO1xuICAgIH07XG5cbiAgICBnZXQgdmFsdWUoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmVsZW1lbnQudmFsdWU7XG4gICAgfVxufVxuXG5leHBvcnQgeyBFbGVtZW50U2VsZWN0IH07IiwiaW1wb3J0IHsgY3NzSGVscGVyIH0gZnJvbSBcIi4uLy4uLy4uL2NvbXBvbmVudHMvaGVscGVycy9jc3NIZWxwZXIuanNcIjtcbmltcG9ydCB7IEVsZW1lbnRIZWxwZXIgfSBmcm9tIFwiLi4vLi4vLi4vY29tcG9uZW50cy9oZWxwZXJzL2VsZW1lbnRIZWxwZXIuanNcIjtcbi8qKlxuICogQ3JlYXRlIGZpbHRlciBvYmplY3QgdGhhdCByZXByZXNlbnRzIGEgbXVsdGktc2VsZWN0IGVsZW1lbnQuICBDcmVhdGVzIGEgZHJvcGRvd24gd2l0aCBhIGxpc3Qgb2Ygb3B0aW9ucyB0aGF0IGNhbiBiZSBcbiAqIHNlbGVjdGVkIG9yIGRlc2VsZWN0ZWQuICBJZiBgZmlsdGVyVmFsdWVzUmVtb3RlU291cmNlYCBpcyBkZWZpbmVkLCB0aGUgc2VsZWN0IG9wdGlvbnMgd2lsbCBiZSBwb3B1bGF0ZWQgYnkgdGhlIGRhdGEgcmV0dXJuZWQgXG4gKiBmcm9tIHRoZSByZW1vdGUgc291cmNlIGJ5IHJlZ2lzdGVyaW5nIHRvICB0aGUgZ3JpZCBwaXBlbGluZSdzIGBpbml0YCBhbmQgYHJlZnJlc2hgIGV2ZW50cy5cbiAqL1xuY2xhc3MgRWxlbWVudE11bHRpU2VsZWN0IHtcbiAgICAvKipcbiAgICAgKiBDcmVhdGUgZmlsdGVyIG9iamVjdCB0aGF0IHJlcHJlc2VudHMgYSBtdWx0aS1zZWxlY3QgZWxlbWVudC5cbiAgICAgKiBAcGFyYW0ge0NvbHVtbn0gY29sdW1uIENvbHVtbiBjbGFzcyBvYmplY3QuXG4gICAgICogQHBhcmFtIHtHcmlkQ29udGV4dH0gY29udGV4dCBHcmlkIGNvbnRleHQgb2JqZWN0LlxuICAgICAqL1xuICAgIGNvbnN0cnVjdG9yKGNvbHVtbiwgY29udGV4dCkge1xuICAgICAgICB0aGlzLmNvbnRleHQgPSBjb250ZXh0O1xuICAgICAgICB0aGlzLmVsZW1lbnQgPSBFbGVtZW50SGVscGVyLmRpdih7IG5hbWU6IGNvbHVtbi5maWVsZCwgY2xhc3NOYW1lOiBjc3NIZWxwZXIubXVsdGlTZWxlY3QucGFyZW50Q2xhc3MgfSk7XG4gICAgICAgIHRoaXMuaGVhZGVyID0gRWxlbWVudEhlbHBlci5kaXYoeyBjbGFzc05hbWU6IGNzc0hlbHBlci5tdWx0aVNlbGVjdC5oZWFkZXIgfSk7XG4gICAgICAgIHRoaXMub3B0aW9uc0NvbnRhaW5lciA9IEVsZW1lbnRIZWxwZXIuZGl2KHsgY2xhc3NOYW1lOiBjc3NIZWxwZXIubXVsdGlTZWxlY3Qub3B0aW9ucyB9KTtcbiAgICAgICAgdGhpcy5maWVsZCA9IGNvbHVtbi5maWVsZDtcbiAgICAgICAgdGhpcy5maWVsZFR5cGUgPSBjb2x1bW4udHlwZTsgIC8vZmllbGQgdmFsdWUgdHlwZS5cbiAgICAgICAgdGhpcy5maWx0ZXJUeXBlID0gXCJpblwiOyAgLy9jb25kaXRpb24gdHlwZS5cbiAgICAgICAgdGhpcy5maWx0ZXJJc0Z1bmN0aW9uID0gKHR5cGVvZiBjb2x1bW4/LmZpbHRlclR5cGUgPT09IFwiZnVuY3Rpb25cIik7XG4gICAgICAgIHRoaXMuZmlsdGVyUGFyYW1zID0gY29sdW1uLmZpbHRlclBhcmFtcztcbiAgICAgICAgdGhpcy5saXN0QWxsID0gZmFsc2U7XG4gICAgICAgIHRoaXMuc2VsZWN0ZWRWYWx1ZXMgPSBbXTtcblxuICAgICAgICBpZiAodHlwZW9mIGNvbHVtbi5maWx0ZXJNdWx0aVNlbGVjdCA9PT0gXCJvYmplY3RcIikge1xuICAgICAgICAgICAgdGhpcy5saXN0QWxsID0gY29sdW1uLmZpbHRlck11bHRpU2VsZWN0Lmxpc3RBbGw7XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLmhlYWRlci5pZCA9IGBoZWFkZXJfJHt0aGlzLmNvbnRleHQuc2V0dGluZ3MuYmFzZUlkTmFtZX1fJHt0aGlzLmZpZWxkfWA7XG4gICAgICAgIHRoaXMuZWxlbWVudC5pZCA9IGAke3RoaXMuY29udGV4dC5zZXR0aW5ncy5iYXNlSWROYW1lfV8ke3RoaXMuZmllbGR9YDtcbiAgICAgICAgdGhpcy5lbGVtZW50LmFwcGVuZCh0aGlzLmhlYWRlciwgdGhpcy5vcHRpb25zQ29udGFpbmVyKTtcblxuICAgICAgICBpZiAoY29sdW1uLmZpbHRlclZhbHVlc1JlbW90ZVNvdXJjZSkge1xuICAgICAgICAgICAgLy9zZXQgdXAgcGlwZWxpbmUgdG8gcmV0cmlldmUgb3B0aW9uIGRhdGEgd2hlbiBpbml0IHBpcGVsaW5lIGlzIGNhbGxlZC5cbiAgICAgICAgICAgIHRoaXMuY29udGV4dC5waXBlbGluZS5hZGRTdGVwKFwiaW5pdFwiLCB0aGlzLnRlbXBsYXRlQ29udGFpbmVyLCBjb2x1bW4uZmlsdGVyVmFsdWVzUmVtb3RlU291cmNlKTtcbiAgICAgICAgICAgIHRoaXMuY29udGV4dC5waXBlbGluZS5hZGRTdGVwKFwicmVmcmVzaFwiLCB0aGlzLnJlZnJlc2hTZWxlY3RPcHRpb25zLCBjb2x1bW4uZmlsdGVyVmFsdWVzUmVtb3RlU291cmNlKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIC8vdXNlIHVzZXIgc3VwcGxpZWQgdmFsdWVzIHRvIGNyZWF0ZSBzZWxlY3Qgb3B0aW9ucy5cbiAgICAgICAgICAgIGNvbnN0IGRhdGEgPSBBcnJheS5pc0FycmF5KGNvbHVtbi5maWx0ZXJWYWx1ZXMpIFxuICAgICAgICAgICAgICAgID8gY29sdW1uLmZpbHRlclZhbHVlc1xuICAgICAgICAgICAgICAgIDogT2JqZWN0LmVudHJpZXMoY29sdW1uLmZpbHRlclZhbHVlcykubWFwKChba2V5LCB2YWx1ZV0pID0+ICh7IHZhbHVlOiBrZXksIHRleHQ6IHZhbHVlfSkpO1xuXG4gICAgICAgICAgICB0aGlzLnRlbXBsYXRlQ29udGFpbmVyKGRhdGEpO1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5oZWFkZXIuYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsIHRoaXMuaGFuZGxlQ2xpY2spO1xuICAgIH1cblxuICAgIGhhbmRsZUNsaWNrID0gYXN5bmMgKCkgPT4ge1xuICAgICAgICBjb25zdCBzdGF0dXMgPSB0aGlzLmhlYWRlci5jbGFzc0xpc3QudG9nZ2xlKGNzc0hlbHBlci5tdWx0aVNlbGVjdC5oZWFkZXJBY3RpdmUpO1xuXG4gICAgICAgIGlmICghc3RhdHVzKSB7XG4gICAgICAgICAgICBhd2FpdCB0aGlzLmNvbnRleHQuZXZlbnRzLnRyaWdnZXIoXCJyZW5kZXJcIik7XG4gICAgICAgICAgICBkb2N1bWVudC5yZW1vdmVFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgdGhpcy5oYW5kbGVEb2N1bWVudCk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBkb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgdGhpcy5oYW5kbGVEb2N1bWVudCk7XG4gICAgICAgIH1cbiAgICB9O1xuICAgIC8qKlxuICAgICAqIEhhbmRsZXIgZXZlbnQgdG8gY2xvc2UgZHJvcGRvd24gd2hlbiB1c2VyIGNsaWNrcyBvdXRzaWRlIHRoZSBtdWx0aS1zZWxlY3QgY29udHJvbC4gIEV2ZW50IGlzIHJlbW92ZWQgd2hlbiBtdWx0aS1zZWxlY3QgXG4gICAgICogaXMgbm90IGFjdGl2ZSBzbyB0aGF0IGl0J3Mgbm90IGZpcmluZyBvbiByZWR1bmRhbnQgZXZlbnRzLlxuICAgICAqIEBwYXJhbSB7T2JqZWN0fSBlIE9iamVjdCB0aGF0IHRyaWdnZXJlZCBldmVudC5cbiAgICAgKi9cbiAgICBoYW5kbGVEb2N1bWVudCA9IGFzeW5jIChlKSA9PiB7XG4gICAgICAgIGlmICghZS50YXJnZXQuY2xvc2VzdChcIi5cIiArIGNzc0hlbHBlci5tdWx0aVNlbGVjdC5vcHRpb24pICYmICFlLnRhcmdldC5jbG9zZXN0KGAjJHt0aGlzLmhlYWRlci5pZH1gKSkge1xuICAgICAgICAgICAgdGhpcy5oZWFkZXIuY2xhc3NMaXN0LnJlbW92ZShjc3NIZWxwZXIubXVsdGlTZWxlY3QuaGVhZGVyQWN0aXZlKTtcblxuICAgICAgICAgICAgYXdhaXQgdGhpcy5jb250ZXh0LmV2ZW50cy50cmlnZ2VyKFwicmVuZGVyXCIpO1xuXG4gICAgICAgICAgICBkb2N1bWVudC5yZW1vdmVFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgdGhpcy5oYW5kbGVEb2N1bWVudCk7XG4gICAgICAgIH1cbiAgICB9O1xuICAgIC8qKlxuICAgICAqIENyZWF0ZXMgYSBjb3VudCBsYWJlbCB0aGF0IGRpc3BsYXlzIHRoZSBudW1iZXIgb2Ygc2VsZWN0ZWQgaXRlbXMgaW4gdGhlIG11bHRpLXNlbGVjdCBjb250cm9sLlxuICAgICAqL1xuICAgIGNyZWF0ZUNvdW50TGFiZWwgPSAoKSA9PiB7XG4gICAgICAgIC8vdXBkYXRlIGNvdW50IGxhYmVsLlxuICAgICAgICBpZiAodGhpcy5jb3VudExhYmVsID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgIHRoaXMuY291bnRMYWJlbCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJzcGFuXCIpO1xuICAgICAgICAgICAgdGhpcy5jb3VudExhYmVsLmNsYXNzTmFtZSA9IGNzc0hlbHBlci5tdWx0aVNlbGVjdC5oZWFkZXJPcHRpb247XG4gICAgICAgICAgICB0aGlzLmhlYWRlci5hcHBlbmQodGhpcy5jb3VudExhYmVsKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICh0aGlzLnNlbGVjdGVkVmFsdWVzLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgIHRoaXMuY291bnRMYWJlbC5pbm5lclRleHQgPSBgJHt0aGlzLnNlbGVjdGVkVmFsdWVzLmxlbmd0aH0gc2VsZWN0ZWRgO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdGhpcy5jb3VudExhYmVsLnJlbW92ZSgpO1xuICAgICAgICAgICAgdGhpcy5jb3VudExhYmVsID0gdW5kZWZpbmVkO1xuICAgICAgICB9XG4gICAgfTtcbiAgICAvKipcbiAgICAgKiBIYW5kbGUgY2xpY2sgZXZlbnQgZm9yIGVhY2ggb3B0aW9uIGluIHRoZSBtdWx0aS1zZWxlY3QgY29udHJvbC4gIFRvZ2dsZXMgdGhlIHNlbGVjdGVkIHN0YXRlIG9mIHRoZSBvcHRpb24gYW5kIHVwZGF0ZXMgdGhlIFxuICAgICAqIGhlYWRlciBpZiBgbGlzdEFsbGAgaXMgYHRydWVgLlxuICAgICAqIEBwYXJhbSB7T2JqZWN0fSBvIE9iamVjdCB0aGF0IHRyaWdnZXJlZCB0aGUgZXZlbnQuXG4gICAgICovXG4gICAgaGFuZGxlT3B0aW9uID0gKG8pID0+IHtcbiAgICAgICAgaWYgKCFvLmN1cnJlbnRUYXJnZXQuY2xhc3NMaXN0LmNvbnRhaW5zKGNzc0hlbHBlci5tdWx0aVNlbGVjdC5zZWxlY3RlZCkpIHtcbiAgICAgICAgICAgIC8vc2VsZWN0IGl0ZW0uXG4gICAgICAgICAgICBvLmN1cnJlbnRUYXJnZXQuY2xhc3NMaXN0LmFkZChjc3NIZWxwZXIubXVsdGlTZWxlY3Quc2VsZWN0ZWQpO1xuICAgICAgICAgICAgby5jdXJyZW50VGFyZ2V0LmRhdGFzZXQuc2VsZWN0ZWQgPSBcInRydWVcIjtcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgdGhpcy5zZWxlY3RlZFZhbHVlcy5wdXNoKG8uY3VycmVudFRhcmdldC5kYXRhc2V0LnZhbHVlKTtcblxuICAgICAgICAgICAgaWYgKHRoaXMubGlzdEFsbCkge1xuICAgICAgICAgICAgICAgIGNvbnN0IHNwYW4gPSBFbGVtZW50SGVscGVyLnNwYW4oeyBjbGFzc05hbWU6IGNzc0hlbHBlci5tdWx0aVNlbGVjdC5oZWFkZXJPcHRpb24sIGlubmVyVGV4dDogby5jdXJyZW50VGFyZ2V0LmRhdGFzZXQudmFsdWUgfSwgeyB2YWx1ZTogby5jdXJyZW50VGFyZ2V0LmRhdGFzZXQudmFsdWUgfSk7XG4gICAgICAgICAgICAgICAgdGhpcy5oZWFkZXIuYXBwZW5kKHNwYW4pO1xuICAgICAgICAgICAgfVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgLy9kZXNlbGVjdCBpdGVtLlxuICAgICAgICAgICAgby5jdXJyZW50VGFyZ2V0LmNsYXNzTGlzdC5yZW1vdmUoY3NzSGVscGVyLm11bHRpU2VsZWN0LnNlbGVjdGVkKTtcbiAgICAgICAgICAgIG8uY3VycmVudFRhcmdldC5kYXRhc2V0LnNlbGVjdGVkID0gXCJmYWxzZVwiO1xuXG4gICAgICAgICAgICB0aGlzLnNlbGVjdGVkVmFsdWVzID0gdGhpcy5zZWxlY3RlZFZhbHVlcy5maWx0ZXIoZiA9PiBmICE9PSBvLmN1cnJlbnRUYXJnZXQuZGF0YXNldC52YWx1ZSk7XG5cbiAgICAgICAgICAgIGlmICh0aGlzLmxpc3RBbGwpIHtcbiAgICAgICAgICAgICAgICBjb25zdCBpdGVtID0gdGhpcy5oZWFkZXIucXVlcnlTZWxlY3RvcihgW2RhdGEtdmFsdWU9JyR7by5jdXJyZW50VGFyZ2V0LmRhdGFzZXQudmFsdWV9J11gKTtcblxuICAgICAgICAgICAgICAgIGlmIChpdGVtICE9PSBudWxsKSB7XG4gICAgICAgICAgICAgICAgICAgIGl0ZW0ucmVtb3ZlKCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHRoaXMubGlzdEFsbCA9PT0gZmFsc2UpIHtcbiAgICAgICAgICAgIHRoaXMuY3JlYXRlQ291bnRMYWJlbCgpO1xuICAgICAgICB9XG4gICAgfTtcbiAgICAvKipcbiAgICAgKiBIZWxwZXIgZnVuY3Rpb24gdG8gY3JlYXRlIGFuIG9wdGlvbiBlbGVtZW50IGZvciB0aGUgbXVsdGktc2VsZWN0IGNvbnRyb2wuXG4gICAgICogQHBhcmFtIHtPYmplY3R9IGl0ZW0ga2V5L3ZhbHVlIHBhaXIgb2JqZWN0IHRoYXQgY29udGFpbnMgdGhlIHZhbHVlIGFuZCB0ZXh0IGZvciB0aGUgb3B0aW9uLlxuICAgICAqIEByZXR1cm5zIHtIVE1MRGl2RWxlbWVudH0gUmV0dXJucyBhIGRpdiBlbGVtZW50IHRoYXQgcmVwcmVzZW50cyB0aGUgb3B0aW9uIGluIHRoZSBtdWx0aS1zZWxlY3QgY29udHJvbC5cbiAgICAgKi9cbiAgICBjcmVhdGVPcHRpb24oaXRlbSkgeyBcbiAgICAgICAgY29uc3Qgb3B0aW9uID0gRWxlbWVudEhlbHBlci5kaXYoeyBjbGFzc05hbWU6IGNzc0hlbHBlci5tdWx0aVNlbGVjdC5vcHRpb24gfSwgeyB2YWx1ZTogaXRlbS52YWx1ZSwgc2VsZWN0ZWQ6IFwiZmFsc2VcIiB9KTtcbiAgICAgICAgY29uc3QgcmFkaW8gPSBFbGVtZW50SGVscGVyLnNwYW4oeyBjbGFzc05hbWU6IGNzc0hlbHBlci5tdWx0aVNlbGVjdC5vcHRpb25SYWRpbyB9KTtcbiAgICAgICAgY29uc3QgdGV4dCA9IEVsZW1lbnRIZWxwZXIuc3Bhbih7IGNsYXNzTmFtZTogY3NzSGVscGVyLm11bHRpU2VsZWN0Lm9wdGlvblRleHQsIGlubmVySFRNTDogaXRlbS50ZXh0IH0pO1xuXG4gICAgICAgIG9wdGlvbi5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgdGhpcy5oYW5kbGVPcHRpb24pO1xuICAgICAgICBvcHRpb24uYXBwZW5kKHJhZGlvLCB0ZXh0KTtcblxuICAgICAgICByZXR1cm4gb3B0aW9uO1xuICAgIH1cblxuICAgIHRlbXBsYXRlQ29udGFpbmVyID0gKGRhdGEpID0+IHtcbiAgICAgICAgZm9yIChjb25zdCBpdGVtIG9mIGRhdGEpIHtcbiAgICAgICAgICAgIGNvbnN0IG9wdGlvbiA9IHRoaXMuY3JlYXRlT3B0aW9uKGl0ZW0pO1xuICAgICAgICAgICAgdGhpcy5vcHRpb25zQ29udGFpbmVyLmFwcGVuZChvcHRpb24pO1xuICAgICAgICB9XG4gICAgfTtcbiAgICAvKipcbiAgICAgKiBDYWxsZWQgd2hlbiB0aGUgZ3JpZCBwaXBlbGluZSdzIGByZWZyZXNoYCBldmVudCBpcyB0cmlnZ2VyZWQuICBJdCBjbGVhcnMgdGhlIGN1cnJlbnQgb3B0aW9ucyBhbmRcbiAgICAgKiByZWNyZWF0ZXMgdGhlbSBiYXNlZCBvbiB0aGUgZGF0YSBwcm92aWRlZC4gIEl0IGFsc28gdXBkYXRlcyB0aGUgc2VsZWN0ZWQgdmFsdWVzIGJhc2VkIG9uIHRoZSBjdXJyZW50IHN0YXRlIG9mIHRoZSBvcHRpb25zLlxuICAgICAqIEBwYXJhbSB7QXJyYXl9IGRhdGEgQXJyYXkgb2Ygb2JqZWN0cyB0aGF0IHJlcHJlc2VudCB0aGUgb3B0aW9ucyB0byBiZSBkaXNwbGF5ZWQgaW4gdGhlIG11bHRpLXNlbGVjdCBjb250cm9sLlxuICAgICAqL1xuICAgIHJlZnJlc2hTZWxlY3RPcHRpb25zID0gKGRhdGEpID0+IHtcbiAgICAgICAgdGhpcy5vcHRpb25zQ29udGFpbmVyLnJlcGxhY2VDaGlsZHJlbigpO1xuICAgICAgICB0aGlzLmhlYWRlci5yZXBsYWNlQ2hpbGRyZW4oKTtcbiAgICAgICAgdGhpcy5jb3VudExhYmVsID0gdW5kZWZpbmVkOyAgLy9zZXQgdG8gdW5kZWZpbmVkIHNvIGl0IGNhbiBiZSByZWNyZWF0ZWQgbGF0ZXIuXG4gICAgICAgIGNvbnN0IG5ld1NlbGVjdGVkID0gW107XG5cbiAgICAgICAgZm9yIChjb25zdCBpdGVtIG9mIGRhdGEpIHtcbiAgICAgICAgICAgIGNvbnN0IG9wdGlvbiA9IHRoaXMuY3JlYXRlT3B0aW9uKGl0ZW0pO1xuICAgICAgICAgICAgLy9jaGVjayBpZiBpdGVtIGlzIHNlbGVjdGVkLlxuICAgICAgICAgICAgaWYgKHRoaXMuc2VsZWN0ZWRWYWx1ZXMuaW5jbHVkZXMoaXRlbS52YWx1ZSkpIHtcbiAgICAgICAgICAgICAgICAvL3NlbGVjdCBpdGVtLlxuICAgICAgICAgICAgICAgIG9wdGlvbi5jbGFzc0xpc3QuYWRkKGNzc0hlbHBlci5tdWx0aVNlbGVjdC5zZWxlY3RlZCk7XG4gICAgICAgICAgICAgICAgb3B0aW9uLmRhdGFzZXQuc2VsZWN0ZWQgPSBcInRydWVcIjtcbiAgICAgICAgICAgICAgICBuZXdTZWxlY3RlZC5wdXNoKGl0ZW0udmFsdWUpO1xuXG4gICAgICAgICAgICAgICAgaWYgKHRoaXMubGlzdEFsbCkge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBzcGFuID0gRWxlbWVudEhlbHBlci5zcGFuKHsgY2xhc3NOYW1lOiBjc3NIZWxwZXIubXVsdGlTZWxlY3QuaGVhZGVyT3B0aW9uLCBpbm5lclRleHQ6IGl0ZW0udmFsdWUgfSwgeyB2YWx1ZTogaXRlbS52YWx1ZSB9KTtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5oZWFkZXIuYXBwZW5kKHNwYW4pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgdGhpcy5vcHRpb25zQ29udGFpbmVyLmFwcGVuZChvcHRpb24pO1xuICAgICAgICB9XG4gICAgICAgIC8vc2V0IG5ldyBzZWxlY3RlZCB2YWx1ZXMgYXMgaXRlbXMgbWF5IGhhdmUgYmVlbiByZW1vdmVkIG9uIHJlZnJlc2guXG4gICAgICAgIHRoaXMuc2VsZWN0ZWRWYWx1ZXMgPSBuZXdTZWxlY3RlZDtcblxuICAgICAgICBpZiAodGhpcy5saXN0QWxsID09PSBmYWxzZSkge1xuICAgICAgICAgICAgdGhpcy5jcmVhdGVDb3VudExhYmVsKCk7XG4gICAgICAgIH1cbiAgICB9O1xuXG4gICAgZ2V0IHZhbHVlKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5zZWxlY3RlZFZhbHVlcztcbiAgICB9XG59XG5cbmV4cG9ydCB7IEVsZW1lbnRNdWx0aVNlbGVjdCB9OyIsIi8qKlxuICogQ2xhc3MgdGhhdCBkZWZpbmVzIGEgc2luZ2xlIGZpbHRlciBjb25kaXRpb24gZm9yIGEgY29sdW1uLlxuICovXG5jbGFzcyBGaWx0ZXJUYXJnZXQge1xuICAgIC8qKlxuICAgICAqIENyZWF0ZXMgZmlsdGVyIHRhcmdldCBvYmplY3QgdGhhdCBkZWZpbmVzIGEgc2luZ2xlIGZpbHRlciBjb25kaXRpb24uICBFeHBlY3RzIGFuIG9iamVjdCB3aXRoIHRoZSBmb2xsb3dpbmcgcHJvcGVydGllczpcbiAgICAgKiAqIGB2YWx1ZWA6IFRoZSB2YWx1ZSB0byBmaWx0ZXIgYWdhaW5zdC4gIEV4cGVjdHMgdGhhdCB2YWx1ZSBtYXRjaGVzIHRoZSB0eXBlIG9mIHRoZSBmaWVsZCBiZWluZyBmaWx0ZXJlZC4gIFNob3VsZCBiZSBudWxsIGlmIFxuICAgICAqIHZhbHVlIHR5cGUgY2Fubm90IGJlIGNvbnZlcnRlZCB0byB0aGUgZmllbGQgdHlwZS5cbiAgICAgKiAqIGBmaWVsZGA6IFRoZSBmaWVsZCBuYW1lIG9mIHRoZSBjb2x1bW4gYmVpbmcgZmlsdGVyZWQuICBUaGlzIGlzIHVzZWQgdG8gaWRlbnRpZnkgdGhlIGNvbHVtbiBpbiB0aGUgZGF0YSBzZXQuXG4gICAgICogKiBgZmllbGRUeXBlYDogVGhlIHR5cGUgb2YgZmllbGQgYmVpbmcgZmlsdGVyZWQgKGUuZy4sIFwic3RyaW5nXCIsIFwibnVtYmVyXCIsIFwiZGF0ZVwiLCBcIm9iamVjdFwiKS4gIFRoaXMgaXMgdXNlZCB0byBkZXRlcm1pbmUgaG93IHRvIGNvbXBhcmUgdGhlIHZhbHVlLlxuICAgICAqICogYGZpbHRlclR5cGVgOiBUaGUgdHlwZSBvZiBmaWx0ZXIgdG8gYXBwbHkgKGUuZy4sIFwiZXF1YWxzXCIsIFwibGlrZVwiLCBcIjxcIiwgXCI8PVwiLCBcIj5cIiwgXCI+PVwiLCBcIiE9XCIsIFwiYmV0d2VlblwiLCBcImluXCIpLlxuICAgICAqIEBwYXJhbSB7eyB2YWx1ZTogKHN0cmluZyB8IG51bWJlciB8IERhdGUgfCBPYmplY3QgfCBudWxsKSwgZmllbGQ6IHN0cmluZywgZmllbGRUeXBlOiBzdHJpbmcsIGZpbHRlclR5cGU6IHN0cmluZyB9fSB0YXJnZXQgXG4gICAgICovXG4gICAgY29uc3RydWN0b3IodGFyZ2V0KSB7XG4gICAgICAgIHRoaXMudmFsdWUgPSB0YXJnZXQudmFsdWU7XG4gICAgICAgIHRoaXMuZmllbGQgPSB0YXJnZXQuZmllbGQ7XG4gICAgICAgIHRoaXMuZmllbGRUeXBlID0gdGFyZ2V0LmZpZWxkVHlwZSB8fCBcInN0cmluZ1wiOyAvLyBEZWZhdWx0IHRvIHN0cmluZyBpZiBub3QgcHJvdmlkZWRcbiAgICAgICAgdGhpcy5maWx0ZXJUeXBlID0gdGFyZ2V0LmZpbHRlclR5cGU7XG4gICAgICAgIHRoaXMuZmlsdGVycyA9IHRoaXMuI2luaXQoKTtcbiAgICB9XG5cbiAgICAjaW5pdCgpIHtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIC8vZXF1YWwgdG9cbiAgICAgICAgICAgIFwiZXF1YWxzXCI6IGZ1bmN0aW9uKGZpbHRlclZhbCwgcm93VmFsKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGZpbHRlclZhbCA9PT0gcm93VmFsO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIC8vbGlrZVxuICAgICAgICAgICAgXCJsaWtlXCI6IGZ1bmN0aW9uKGZpbHRlclZhbCwgcm93VmFsKSB7XG4gICAgICAgICAgICAgICAgaWYgKHJvd1ZhbCA9PT0gdW5kZWZpbmVkIHx8IHJvd1ZhbCA9PT0gbnVsbCB8fCByb3dWYWwgPT09IFwiXCIpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgICAgICAgICAgcmV0dXJuIFN0cmluZyhyb3dWYWwpLnRvTG93ZXJDYXNlKCkuaW5kZXhPZihmaWx0ZXJWYWwudG9Mb3dlckNhc2UoKSkgPiAtMTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAvL2xlc3MgdGhhblxuICAgICAgICAgICAgXCI8XCI6IGZ1bmN0aW9uKGZpbHRlclZhbCwgcm93VmFsKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGZpbHRlclZhbCA8IHJvd1ZhbDtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAvL2xlc3MgdGhhbiBvciBlcXVhbCB0b1xuICAgICAgICAgICAgXCI8PVwiOiBmdW5jdGlvbihmaWx0ZXJWYWwsIHJvd1ZhbCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBmaWx0ZXJWYWwgPD0gcm93VmFsO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIC8vZ3JlYXRlciB0aGFuXG4gICAgICAgICAgICBcIj5cIjogZnVuY3Rpb24oZmlsdGVyVmFsLCByb3dWYWwpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gZmlsdGVyVmFsID4gcm93VmFsO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIC8vZ3JlYXRlciB0aGFuIG9yIGVxdWFsIHRvXG4gICAgICAgICAgICBcIj49XCI6IGZ1bmN0aW9uKGZpbHRlclZhbCwgcm93VmFsKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGZpbHRlclZhbCA+PSByb3dWYWw7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgLy9ub3QgZXF1YWwgdG9cbiAgICAgICAgICAgIFwiIT1cIjogZnVuY3Rpb24oZmlsdGVyVmFsLCByb3dWYWwpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcm93VmFsICE9PSBmaWx0ZXJWYWw7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgLy8gYmV0d2Vlbi4gIGV4cGVjdHMgZmlsdGVyVmFsIHRvIGJlIGFuIGFycmF5IG9mOiBbIHtzdGFydCB2YWx1ZX0sIHsgZW5kIHZhbHVlIH0gXSBcbiAgICAgICAgICAgIFwiYmV0d2VlblwiOiBmdW5jdGlvbihmaWx0ZXJWYWwsIHJvd1ZhbCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByb3dWYWwgPj0gZmlsdGVyVmFsWzBdICYmIHJvd1ZhbCA8PSBmaWx0ZXJWYWxbMV07XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgLy9pbiBhcnJheS5cbiAgICAgICAgICAgIFwiaW5cIjogZnVuY3Rpb24oZmlsdGVyVmFsLCByb3dWYWwpIHtcbiAgICAgICAgICAgICAgICBpZiAoQXJyYXkuaXNBcnJheShmaWx0ZXJWYWwpKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBmaWx0ZXJWYWwubGVuZ3RoID8gZmlsdGVyVmFsLmluZGV4T2Yocm93VmFsKSA+IC0xIDogdHJ1ZTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLndhcm4oXCJGaWx0ZXIgRXJyb3IgLSBmaWx0ZXIgdmFsdWUgaXMgbm90IGFuIGFycmF5OlwiLCBmaWx0ZXJWYWwpO1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuICAgIH1cbiAgICAvKipcbiAgICAgKiBFeGVjdXRlcyBhbiBpbnRlcm5hbCBmdW5jdGlvbiB0byBpbmRpY2F0ZSBpZiB0aGUgY3VycmVudCByb3cgdmFsdWVzIG1hdGNoZXMgdGhlIGZpbHRlciBjcml0ZXJpYSdzIHZhbHVlLiAgXG4gICAgICogQHBhcmFtIHtPYmplY3R9IHJvd1ZhbCBSb3cgY29sdW1uIHZhbHVlLiAgRXhwZWN0cyBhIHZhbHVlIHRoYXQgbWF0Y2hlcyB0aGUgdHlwZSBpZGVudGlmaWVkIGJ5IHRoZSBjb2x1bW4uXG4gICAgICogQHBhcmFtIHtPYmplY3Q8QXJyYXk+fSByb3cgQ3VycmVudCBkYXRhIHNldCByb3cuXG4gICAgICogQHJldHVybnMge2Jvb2xlYW59IFJldHVybnMgdHJ1ZSBpZiByb3cgdmFsdWUgbWF0Y2hlcyBmaWx0ZXIgdmFsdWUuICBPdGhlcndpc2UsIGZhbHNlIGluZGljYXRpbmcgbm8gbWF0Y2guXG4gICAgICovXG4gICAgZXhlY3V0ZShyb3dWYWwsIHJvdykge1xuICAgICAgICByZXR1cm4gdGhpcy5maWx0ZXJzW3RoaXMuZmlsdGVyVHlwZV0odGhpcy52YWx1ZSwgcm93VmFsKTtcbiAgICB9XG59XG5cbmV4cG9ydCB7IEZpbHRlclRhcmdldCB9OyIsImltcG9ydCB7IERhdGVIZWxwZXIgfSBmcm9tIFwiLi4vLi4vLi4vY29tcG9uZW50cy9oZWxwZXJzL2RhdGVIZWxwZXIuanNcIjtcbi8qKlxuICogQ2xhc3MgdGhhdCBkZWZpbmVzIGEgc2luZ2xlIGZpbHRlciBjb25kaXRpb24gZm9yIGEgZGF0ZSBjb2x1bW4uXG4gKi9cbmNsYXNzIEZpbHRlckRhdGUge1xuICAgIC8qKlxuICAgICAqIENyZWF0ZXMgZmlsdGVyIHRhcmdldCBvYmplY3QgdGhhdCBkZWZpbmVzIGEgc2luZ2xlIGZpbHRlciBjb25kaXRpb24gZm9yIGEgZGF0ZSBkYXRhIHR5cGUuICBFeHBlY3RzIGFuIG9iamVjdCB3aXRoIHRoZSBmb2xsb3dpbmcgcHJvcGVydGllczpcbiAgICAgKiAqIGB2YWx1ZWA6IFRoZSB2YWx1ZSB0byBmaWx0ZXIgYWdhaW5zdC4gIEV4cGVjdHMgdGhhdCB2YWx1ZSBtYXRjaGVzIHRoZSB0eXBlIG9mIHRoZSBmaWVsZCBiZWluZyBmaWx0ZXJlZC4gIFNob3VsZCBiZSBudWxsIGlmIFxuICAgICAqIHZhbHVlIHR5cGUgY2Fubm90IGJlIGNvbnZlcnRlZCB0byB0aGUgZmllbGQgdHlwZS5cbiAgICAgKiAqIGBmaWVsZGA6IFRoZSBmaWVsZCBuYW1lIG9mIHRoZSBjb2x1bW4gYmVpbmcgZmlsdGVyZWQuICBUaGlzIGlzIHVzZWQgdG8gaWRlbnRpZnkgdGhlIGNvbHVtbiBpbiB0aGUgZGF0YSBzZXQuXG4gICAgICogKiBgZmlsdGVyVHlwZWA6IFRoZSB0eXBlIG9mIGZpbHRlciB0byBhcHBseSAoZS5nLiwgXCJlcXVhbHNcIiwgXCJsaWtlXCIsIFwiPFwiLCBcIjw9XCIsIFwiPlwiLCBcIj49XCIsIFwiIT1cIiwgXCJiZXR3ZWVuXCIsIFwiaW5cIikuXG4gICAgICogQHBhcmFtIHt7IHZhbHVlOiAoRGF0ZSB8IEFycmF5PERhdGU+KSwgZmllbGQ6IHN0cmluZywgZmlsdGVyVHlwZTogc3RyaW5nIH19IHRhcmdldCBcbiAgICAgKi9cbiAgICBjb25zdHJ1Y3Rvcih0YXJnZXQpIHtcbiAgICAgICAgdGhpcy52YWx1ZSA9IHRhcmdldC52YWx1ZTtcbiAgICAgICAgdGhpcy5maWVsZCA9IHRhcmdldC5maWVsZDtcbiAgICAgICAgdGhpcy5maWVsZFR5cGUgPSBcImRhdGVcIjtcbiAgICAgICAgdGhpcy5maWx0ZXJUeXBlID0gdGFyZ2V0LmZpbHRlclR5cGU7XG4gICAgICAgIHRoaXMuZmlsdGVycyA9IHRoaXMuI2luaXQoKTtcbiAgICB9XG4gICAgLyoqXG4gICAgICogUmV0dXJucyBhIG5ldyBkYXRlIG9iamVjdCBmb3IgZWFjaCBkYXRlIHBhc3NlZCBpbiwgc2V0dGluZyB0aGUgdGltZSB0byBtaWRuaWdodC4gIFRoaXMgaXMgdXNlZCB0byBlbnN1cmUgdGhhdCB0aGUgZGF0ZSBvYmplY3RzIGFyZSBub3QgbW9kaWZpZWRcbiAgICAgKiB3aGVuIGNvbXBhcmluZyBkYXRlcyBpbiB0aGUgZmlsdGVyIGZ1bmN0aW9ucywgYW5kIHRvIGVuc3VyZSB0aGF0IHRoZSB0aW1lIHBvcnRpb24gb2YgdGhlIGRhdGUgZG9lcyBub3QgYWZmZWN0IHRoZSBjb21wYXJpc29uLlxuICAgICAqIEBwYXJhbSB7RGF0ZX0gZGF0ZTEgXG4gICAgICogQHBhcmFtIHtEYXRlfSBkYXRlMiBcbiAgICAgKiBAcmV0dXJucyB7QXJyYXk8RGF0ZT59IFJldHVybnMgYW4gYXJyYXkgb2YgdHdvIGRhdGUgb2JqZWN0cywgZWFjaCBzZXQgdG8gbWlkbmlnaHQgb2YgdGhlIHJlc3BlY3RpdmUgZGF0ZSBwYXNzZWQgaW4uXG4gICAgICovXG4gICAgY2xvbmVEYXRlcyA9IChkYXRlMSwgZGF0ZTIpID0+IHsgXG4gICAgICAgIGNvbnN0IGQxID0gbmV3IERhdGUoZGF0ZTEpO1xuICAgICAgICBjb25zdCBkMiA9IG5ldyBEYXRlKGRhdGUyKTtcblxuICAgICAgICBkMS5zZXRIb3VycygwLCAwLCAwLCAwKTtcbiAgICAgICAgZDIuc2V0SG91cnMoMCwgMCwgMCwgMCk7XG4gICAgICAgIFxuICAgICAgICByZXR1cm4gW2QxLCBkMl07XG4gICAgfTtcblxuICAgICNpbml0KCkgeyBcbiAgICAgICAgcmV0dXJuIHsgXG4gICAgICAgICAgICBcImVxdWFsc1wiOiBmdW5jdGlvbihmaWx0ZXJWYWwsIHJvd1ZhbCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBmaWx0ZXJWYWwuZ2V0RnVsbFllYXIoKSA9PT0gcm93VmFsLmdldEZ1bGxZZWFyKCkgJiYgZmlsdGVyVmFsLmdldE1vbnRoKCkgPT09IHJvd1ZhbC5nZXRNb250aCgpICYmIGZpbHRlclZhbC5nZXREYXRlKCkgPT09IHJvd1ZhbC5nZXREYXRlKCk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgLy9sZXNzIHRoYW5cbiAgICAgICAgICAgIFwiPFwiOiAoZmlsdGVyVmFsLCByb3dWYWwpID0+IHtcbiAgICAgICAgICAgICAgICBjb25zdCBkYXRlcyA9IHRoaXMuY2xvbmVEYXRlcyhmaWx0ZXJWYWwsIHJvd1ZhbCk7XG4gXG4gICAgICAgICAgICAgICAgcmV0dXJuIGRhdGVzWzBdLmdldFRpbWUoKSA8IGRhdGVzWzFdLmdldFRpbWUoKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAvL2xlc3MgdGhhbiBvciBlcXVhbCB0b1xuICAgICAgICAgICAgXCI8PVwiOiAoZmlsdGVyVmFsLCByb3dWYWwpID0+IHtcbiAgICAgICAgICAgICAgICBjb25zdCBkYXRlcyA9IHRoaXMuY2xvbmVEYXRlcyhmaWx0ZXJWYWwsIHJvd1ZhbCk7XG5cbiAgICAgICAgICAgICAgICByZXR1cm4gZGF0ZXNbMF0uZ2V0VGltZSgpIDwgZGF0ZXNbMV0uZ2V0VGltZSgpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIC8vZ3JlYXRlciB0aGFuXG4gICAgICAgICAgICBcIj5cIjogKGZpbHRlclZhbCwgcm93VmFsKSA9PiB7XG4gICAgICAgICAgICAgICAgY29uc3QgZGF0ZXMgPSB0aGlzLmNsb25lRGF0ZXMoZmlsdGVyVmFsLCByb3dWYWwpO1xuXG4gICAgICAgICAgICAgICAgcmV0dXJuIGRhdGVzWzBdLmdldFRpbWUoKSA+IGRhdGVzWzFdLmdldFRpbWUoKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAvL2dyZWF0ZXIgdGhhbiBvciBlcXVhbCB0b1xuICAgICAgICAgICAgXCI+PVwiOiAoZmlsdGVyVmFsLCByb3dWYWwpID0+IHtcbiAgICAgICAgICAgICAgICBjb25zdCBkYXRlcyA9IHRoaXMuY2xvbmVEYXRlcyhmaWx0ZXJWYWwsIHJvd1ZhbCk7XG5cbiAgICAgICAgICAgICAgICByZXR1cm4gZGF0ZXNbMF0uZ2V0VGltZSgpID49IGRhdGVzWzFdLmdldFRpbWUoKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAvL25vdCBlcXVhbCB0b1xuICAgICAgICAgICAgXCIhPVwiOiBmdW5jdGlvbihmaWx0ZXJWYWwsIHJvd1ZhbCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBmaWx0ZXJWYWwuZ2V0RnVsbFllYXIoKSAhPT0gcm93VmFsLmdldEZ1bGxZZWFyKCkgJiYgZmlsdGVyVmFsLmdldE1vbnRoKCkgIT09IHJvd1ZhbC5nZXRNb250aCgpICYmIGZpbHRlclZhbC5nZXREYXRlKCkgIT09IHJvd1ZhbC5nZXREYXRlKCk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgLy8gYmV0d2Vlbi4gIGV4cGVjdHMgZmlsdGVyVmFsIHRvIGJlIGFuIGFycmF5IG9mOiBbIHtzdGFydCB2YWx1ZX0sIHsgZW5kIHZhbHVlIH0gXSBcbiAgICAgICAgICAgIFwiYmV0d2VlblwiOiAoZmlsdGVyVmFsLCByb3dWYWwpICA9PiB7XG4gICAgICAgICAgICAgICAgY29uc3QgZmlsdGVyRGF0ZXMgPSB0aGlzLmNsb25lRGF0ZXMoZmlsdGVyVmFsWzBdLCBmaWx0ZXJWYWxbMV0pO1xuICAgICAgICAgICAgICAgIGNvbnN0IHJvd0RhdGVzID0gdGhpcy5jbG9uZURhdGVzKHJvd1ZhbCwgcm93VmFsKTtcblxuICAgICAgICAgICAgICAgIHJldHVybiByb3dEYXRlc1swXSA+PSBmaWx0ZXJEYXRlc1swXSAmJiByb3dEYXRlc1swXSA8PSBmaWx0ZXJEYXRlc1sxXTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcbiAgICB9XG4gICAgLyoqXG4gICAgICogRXhlY3V0ZXMgYW4gaW50ZXJuYWwgZnVuY3Rpb24gdG8gaW5kaWNhdGUgaWYgdGhlIGN1cnJlbnQgcm93IHZhbHVlIG1hdGNoZXMgdGhlIGZpbHRlciBjcml0ZXJpYSdzIHZhbHVlLiAgXG4gICAgICogQHBhcmFtIHtEYXRlfSByb3dWYWwgUm93IGNvbHVtbiB2YWx1ZS4gIEV4cGVjdHMgYSBEYXRlIG9iamVjdC5cbiAgICAgKiBAcGFyYW0ge09iamVjdDxBcnJheT59IHJvdyBDdXJyZW50IGRhdGEgc2V0IHJvdy5cbiAgICAgKiBAcmV0dXJucyB7Ym9vbGVhbn0gUmV0dXJucyB0cnVlIGlmIHJvdyB2YWx1ZSBtYXRjaGVzIGZpbHRlciB2YWx1ZS4gIE90aGVyd2lzZSwgZmFsc2UgaW5kaWNhdGluZyBubyBtYXRjaC5cbiAgICAgKi9cbiAgICBleGVjdXRlKHJvd1ZhbCwgcm93KSB7XG4gICAgICAgIGlmIChyb3dWYWwgPT09IG51bGwgfHwgIURhdGVIZWxwZXIuaXNEYXRlKHJvd1ZhbCkpIHtcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTsgLy8gSWYgcm93VmFsIGlzIG51bGwgb3Igbm90IGEgZGF0ZSwgcmV0dXJuIGZhbHNlLlxuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHRoaXMuZmlsdGVyc1t0aGlzLmZpbHRlclR5cGVdKHRoaXMudmFsdWUsIHJvd1ZhbCk7XG4gICAgfVxufVxuXG5leHBvcnQgeyBGaWx0ZXJEYXRlIH07IiwiLyoqXG4gKiBSZXByZXNlbnRzIGEgY29uY3JldGUgaW1wbGVtZW50YXRpb24gb2YgYSBmaWx0ZXIgdGhhdCB1c2VzIGEgdXNlciBzdXBwbGllZCBmdW5jdGlvbi5cbiAqL1xuY2xhc3MgRmlsdGVyRnVuY3Rpb24ge1xuICAgIC8qKlxuICAgICAqIENyZWF0ZXMgYSBmaWx0ZXIgZnVuY3Rpb24gaW5zdGFuY2UuICBFeHBlY3RzIGFuIG9iamVjdCB3aXRoIHRoZSBmb2xsb3dpbmcgcHJvcGVydGllczpcbiAgICAgKiAqIGB2YWx1ZWA6IFRoZSB2YWx1ZSB0byBmaWx0ZXIgYWdhaW5zdC4gIERvZXMgbm90IG5lZWQgdG8gbWF0Y2ggdGhlIHR5cGUgb2YgdGhlIGZpZWxkIGJlaW5nIGZpbHRlcmVkLlxuICAgICAqICogYGZpZWxkYDogVGhlIGZpZWxkIG5hbWUgb2YgdGhlIGNvbHVtbiBiZWluZyBmaWx0ZXJlZC4gIFRoaXMgaXMgdXNlZCB0byBpZGVudGlmeSB0aGUgY29sdW1uIGluIHRoZSBkYXRhIHNldC5cbiAgICAgKiAqIGBmaWx0ZXJUeXBlYDogVGhlIGZ1bmN0aW9uIHRvIHVzZSBmb3IgZmlsdGVyaW5nLlxuICAgICAqICogYHBhcmFtc2A6IE9wdGlvbmFsIHBhcmFtZXRlcnMgdG8gcGFzcyB0byB0aGUgZmlsdGVyIGZ1bmN0aW9uLlxuICAgICAqIEBwYXJhbSB7eyB2YWx1ZTogT2JqZWN0LCBmaWVsZDogc3RyaW5nLCBmaWx0ZXJUeXBlOiBGdW5jdGlvbiwgcGFyYW1zOiBPYmplY3QgfX0gdGFyZ2V0IFxuICAgICAqL1xuICAgIGNvbnN0cnVjdG9yKHRhcmdldCkge1xuICAgICAgICB0aGlzLnZhbHVlID0gdGFyZ2V0LnZhbHVlO1xuICAgICAgICB0aGlzLmZpZWxkID0gdGFyZ2V0LmZpZWxkO1xuICAgICAgICB0aGlzLmZpbHRlckZ1bmN0aW9uID0gdGFyZ2V0LmZpbHRlclR5cGU7XG4gICAgICAgIHRoaXMucGFyYW1zID0gdGFyZ2V0LnBhcmFtcyA/PyB7fTtcbiAgICB9XG4gICAgLyoqXG4gICAgICogRXhlY3V0ZXMgYW4gdXNlciBzdXBwbGllZCBmdW5jdGlvbiB0byBpbmRpY2F0ZSBpZiB0aGUgY3VycmVudCByb3cgdmFsdWVzIG1hdGNoZXMgdGhlIGZpbHRlciBjcml0ZXJpYSdzIHZhbHVlLiAgXG4gICAgICogQHBhcmFtIHtPYmplY3R9IHJvd1ZhbCBSb3cgY29sdW1uIHZhbHVlLiAgRXhwZWN0cyBhIHZhbHVlIHRoYXQgbWF0Y2hlcyB0aGUgdHlwZSBpZGVudGlmaWVkIGJ5IHRoZSBjb2x1bW4uXG4gICAgICogQHBhcmFtIHtPYmplY3Q8QXJyYXk+fSByb3cgQ3VycmVudCBkYXRhIHNldCByb3cuXG4gICAgICogQHJldHVybnMge2Jvb2xlYW59IFJldHVybnMgdHJ1ZSBpZiByb3cgdmFsdWUgbWF0Y2hlcyBmaWx0ZXIgdmFsdWUuICBPdGhlcndpc2UsIGZhbHNlIGluZGljYXRpbmcgbm8gbWF0Y2guXG4gICAgICovXG4gICAgZXhlY3V0ZShyb3dWYWwsIHJvdykge1xuICAgICAgICByZXR1cm4gdGhpcy5maWx0ZXJGdW5jdGlvbih0aGlzLnZhbHVlLCByb3dWYWwsIHJvdywgdGhpcy5wYXJhbXMpO1xuICAgIH1cbn1cblxuZXhwb3J0IHsgRmlsdGVyRnVuY3Rpb24gfTsiLCJpbXBvcnQgeyBEYXRlSGVscGVyIH0gZnJvbSBcIi4uLy4uL2NvbXBvbmVudHMvaGVscGVycy9kYXRlSGVscGVyLmpzXCI7XG5pbXBvcnQgeyBGaWx0ZXJUYXJnZXQgfSBmcm9tIFwiLi90eXBlcy9maWx0ZXJUYXJnZXQuanNcIjtcbmltcG9ydCB7IEZpbHRlckRhdGUgfSBmcm9tIFwiLi90eXBlcy9maWx0ZXJEYXRlLmpzXCI7XG5pbXBvcnQgeyBGaWx0ZXJGdW5jdGlvbiB9IGZyb20gXCIuL3R5cGVzL2ZpbHRlckZ1bmN0aW9uLmpzXCI7XG5pbXBvcnQgeyBFbGVtZW50QmV0d2VlbiB9IGZyb20gXCIuL2VsZW1lbnRzL2VsZW1lbnRCZXR3ZWVuLmpzXCI7XG5pbXBvcnQgeyBFbGVtZW50SW5wdXQgfSBmcm9tIFwiLi9lbGVtZW50cy9lbGVtZW50SW5wdXQuanNcIjtcbmltcG9ydCB7IEVsZW1lbnRNdWx0aVNlbGVjdCB9IGZyb20gXCIuL2VsZW1lbnRzL2VsZW1lbnRNdWx0aVNlbGVjdC5qc1wiO1xuaW1wb3J0IHsgRWxlbWVudFNlbGVjdCB9IGZyb20gXCIuL2VsZW1lbnRzL2VsZW1lbnRTZWxlY3QuanNcIjtcbi8qKlxuICogUHJvdmlkZXMgYSBtZWFucyB0byBmaWx0ZXIgZGF0YSBpbiB0aGUgZ3JpZC4gIFRoaXMgbW9kdWxlIGNyZWF0ZXMgaGVhZGVyIGZpbHRlciBjb250cm9scyBmb3IgZWFjaCBjb2x1bW4gdGhhdCBoYXMgXG4gKiBhIGBoYXNGaWx0ZXJgIGF0dHJpYnV0ZSBzZXQgdG8gYHRydWVgLlxuICogXG4gKiBDbGFzcyBzdWJzY3JpYmVzIHRvIHRoZSBgcmVuZGVyYCBldmVudCB0byB1cGRhdGUgdGhlIGZpbHRlciBjb250cm9sIHdoZW4gdGhlIGdyaWQgaXMgcmVuZGVyZWQuICBJdCBhbHNvIGNhbGxzIHRoZSBjaGFpbiBcbiAqIGV2ZW50IGByZW1vdGVQYXJhbXNgIHRvIGNvbXBpbGUgYSBsaXN0IG9mIHBhcmFtZXRlcnMgdG8gYmUgcGFzc2VkIHRvIHRoZSByZW1vdGUgZGF0YSBzb3VyY2Ugd2hlbiB1c2luZyByZW1vdGUgcHJvY2Vzc2luZy5cbiAqL1xuY2xhc3MgRmlsdGVyTW9kdWxlIHtcbiAgICAvKipcbiAgICAgKiBDcmVhdGVzIGEgbmV3IGZpbHRlciBtb2R1bGUgb2JqZWN0LlxuICAgICAqIEBwYXJhbSB7R3JpZENvbnRleHR9IGNvbnRleHQgR3JpZCBjb250ZXh0LlxuICAgICAqL1xuICAgIGNvbnN0cnVjdG9yKGNvbnRleHQpIHtcbiAgICAgICAgdGhpcy5jb250ZXh0ID0gY29udGV4dDtcbiAgICAgICAgdGhpcy5oZWFkZXJGaWx0ZXJzID0gW107XG4gICAgICAgIHRoaXMuZ3JpZEZpbHRlcnMgPSBbXTtcbiAgICB9XG5cbiAgICBpbml0aWFsaXplKCkge1xuICAgICAgICBpZiAodGhpcy5jb250ZXh0LnNldHRpbmdzLnJlbW90ZVByb2Nlc3NpbmcpIHtcbiAgICAgICAgICAgIHRoaXMuY29udGV4dC5ldmVudHMuc3Vic2NyaWJlKFwicmVtb3RlUGFyYW1zXCIsIHRoaXMucmVtb3RlUGFyYW1zLCB0cnVlKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHRoaXMuY29udGV4dC5ldmVudHMuc3Vic2NyaWJlKFwicmVuZGVyXCIsIHRoaXMucmVuZGVyTG9jYWwsIGZhbHNlLCA4KTtcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMuX2luaXQoKTtcbiAgICB9XG4gICAgLyoqXG4gICAgICogQ3JlYXRlIGBIZWFkZXJGaWx0ZXJgIENsYXNzIGZvciBncmlkIGNvbHVtbnMgd2l0aCBhIGBoYXNGaWx0ZXJgIGF0dHJpYnV0ZSBvZiBgdHJ1ZWAuXG4gICAgICovXG4gICAgX2luaXQoKSB7XG4gICAgICAgIGZvciAoY29uc3QgY29sIG9mIHRoaXMuY29udGV4dC5jb2x1bW5NYW5hZ2VyLmNvbHVtbnMpIHtcbiAgICAgICAgICAgIGlmICghY29sLmhhc0ZpbHRlcikgY29udGludWU7XG5cbiAgICAgICAgICAgIGlmIChjb2wuZmlsdGVyRWxlbWVudCA9PT0gXCJtdWx0aVwiKSB7XG4gICAgICAgICAgICAgICAgY29sLmhlYWRlckZpbHRlciA9IG5ldyBFbGVtZW50TXVsdGlTZWxlY3QoY29sLCB0aGlzLmNvbnRleHQpO1xuICAgICAgICAgICAgfSBlbHNlIGlmIChjb2wuZmlsdGVyRWxlbWVudCA9PT0gXCJiZXR3ZWVuXCIpIHtcbiAgICAgICAgICAgICAgICBjb2wuaGVhZGVyRmlsdGVyID0gbmV3IEVsZW1lbnRCZXR3ZWVuKGNvbCwgdGhpcy5jb250ZXh0KTtcbiAgICAgICAgICAgIH0gZWxzZSBpZiAoY29sLmZpbHRlckVsZW1lbnQgPT09IFwic2VsZWN0XCIpIHtcbiAgICAgICAgICAgICAgICBjb2wuaGVhZGVyRmlsdGVyID0gbmV3IEVsZW1lbnRTZWxlY3QoY29sLCB0aGlzLmNvbnRleHQpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBjb2wuaGVhZGVyRmlsdGVyID0gbmV3IEVsZW1lbnRJbnB1dChjb2wsIHRoaXMuY29udGV4dCk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGNvbC5oZWFkZXJDZWxsLmVsZW1lbnQuYXBwZW5kQ2hpbGQoY29sLmhlYWRlckZpbHRlci5lbGVtZW50KTtcbiAgICAgICAgICAgIHRoaXMuaGVhZGVyRmlsdGVycy5wdXNoKGNvbC5oZWFkZXJGaWx0ZXIpO1xuICAgICAgICB9XG4gICAgfVxuICAgIC8qKlxuICAgICAqIENvbXBpbGVzIGhlYWRlciBhbmQgZ3JpZCBmaWx0ZXIgdmFsdWVzIGludG8gYSBzaW5nbGUgb2JqZWN0IG9mIGtleS92YWx1ZSBwYWlycyB0aGF0IGNhbiBiZSB1c2VkIHRvIHNlbmQgdG8gdGhlIHJlbW90ZSBkYXRhIHNvdXJjZS5cbiAgICAgKiBAcGFyYW0ge09iamVjdH0gcGFyYW1zIE9iamVjdCBvZiBrZXkvdmFsdWUgcGFpcnMgdG8gYmUgc2VudCB0byB0aGUgcmVtb3RlIGRhdGEgc291cmNlLlxuICAgICAqIEByZXR1cm5zIHtPYmplY3R9IFJldHVybnMgdGhlIG1vZGlmaWVkIHBhcmFtcyBvYmplY3Qgd2l0aCBmaWx0ZXIgdmFsdWVzIGFkZGVkLlxuICAgICAqL1xuICAgIHJlbW90ZVBhcmFtcyA9IChwYXJhbXMpID0+IHtcbiAgICAgICAgdGhpcy5oZWFkZXJGaWx0ZXJzLmZvckVhY2goKGYpID0+IHtcbiAgICAgICAgICAgIGlmIChmLnZhbHVlICE9PSBcIlwiKSB7XG4gICAgICAgICAgICAgICAgcGFyYW1zW2YuZmllbGRdID0gZi52YWx1ZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG5cbiAgICAgICAgaWYgKHRoaXMuZ3JpZEZpbHRlcnMubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgZm9yIChjb25zdCBpdGVtIG9mIHRoaXMuZ3JpZEZpbHRlcnMpIHtcbiAgICAgICAgICAgICAgICBwYXJhbXNbaXRlbS5maWVsZF0gPSBpdGVtLnZhbHVlO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHBhcmFtcztcbiAgICB9O1xuICAgIC8qKlxuICAgICAqIENvbnZlcnQgdmFsdWUgdHlwZSB0byBjb2x1bW4gdHlwZS4gIElmIHZhbHVlIGNhbm5vdCBiZSBjb252ZXJ0ZWQsIGBudWxsYCBpcyByZXR1cm5lZC5cbiAgICAgKiBAcGFyYW0ge29iamVjdCB8IHN0cmluZyB8IG51bWJlcn0gdmFsdWUgUmF3IGZpbHRlciB2YWx1ZS5cbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gdHlwZSBGaWVsZCB0eXBlLlxuICAgICAqIEByZXR1cm5zIHtudW1iZXIgfCBEYXRlIHwgc3RyaW5nIHwgbnVsbCB8IE9iamVjdH0gaW5wdXQgdmFsdWUgb3IgYG51bGxgIGlmIGVtcHR5LlxuICAgICAqL1xuICAgIGNvbnZlcnRUb1R5cGUodmFsdWUsIHR5cGUpIHtcbiAgICAgICAgaWYgKHZhbHVlID09PSBcIlwiIHx8IHZhbHVlID09PSBudWxsKSByZXR1cm4gdmFsdWU7XG5cbiAgICAgICAgaWYgKEFycmF5LmlzQXJyYXkodmFsdWUpKSB7XG4gICAgICAgICAgICBpZiAodHlwZSA9PT0gXCJkYXRlXCIgfHwgdHlwZSA9PT0gXCJkYXRldGltZVwiKSAgeyBcbiAgICAgICAgICAgICAgICBjb25zdCByZXN1bHQgPSB2YWx1ZS5tYXAoKHYpID0+IERhdGVIZWxwZXIucGFyc2VEYXRlKHYpKTsgXG5cbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzdWx0LmluY2x1ZGVzKFwiXCIpID8gbnVsbCA6IHJlc3VsdDtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKHR5cGUgPT09IFwibnVtYmVyXCIpIHtcbiAgICAgICAgICAgICAgICBjb25zdCB2YWx1ZTEgPSB0aGlzLmNvbnZlcnRUb1R5cGUodmFsdWVbMF0sIHR5cGUpO1xuICAgICAgICAgICAgICAgIGNvbnN0IHZhbHVlMiA9IHRoaXMuY29udmVydFRvVHlwZSh2YWx1ZVsxXSwgdHlwZSk7ICBcblxuICAgICAgICAgICAgICAgIHJldHVybiB2YWx1ZTEgPT09IG51bGwgfHwgdmFsdWUyID09PSBudWxsID8gbnVsbCA6IFt2YWx1ZTEsIHZhbHVlMl07XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHJldHVybiB2YWx1ZTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICh0eXBlID09PSBcIm51bWJlclwiKSB7XG4gICAgICAgICAgICB2YWx1ZSA9IE51bWJlcih2YWx1ZSk7XG4gICAgICAgICAgICByZXR1cm4gTnVtYmVyLmlzTmFOKHZhbHVlKSA/IG51bGwgOiB2YWx1ZTtcbiAgICAgICAgfSBcbiAgICAgICAgXG4gICAgICAgIGlmICh0eXBlID09PSBcImRhdGVcIiB8fCB0eXBlID09PSBcImRhdGV0aW1lXCIpIHtcbiAgICAgICAgICAgIHZhbHVlID0gRGF0ZUhlbHBlci5wYXJzZURhdGVPbmx5KHZhbHVlKTtcbiAgICAgICAgICAgIHJldHVybiB2YWx1ZSA9PT0gXCJcIiA/IG51bGwgOiB2YWx1ZTtcbiAgICAgICAgfSBcbiAgICAgICAgLy9hc3N1bWluZyBpdCdzIGEgc3RyaW5nIHZhbHVlIG9yIE9iamVjdCBhdCB0aGlzIHBvaW50LlxuICAgICAgICByZXR1cm4gdmFsdWU7XG4gICAgfVxuICAgIC8qKlxuICAgICAqIFdyYXBzIHRoZSBmaWx0ZXIgaW5wdXQgdmFsdWUgaW4gYSBgRmlsdGVyVGFyZ2V0YCBvYmplY3QsIHdoaWNoIGRlZmluZXMgYSBzaW5nbGUgZmlsdGVyIGNvbmRpdGlvbiBmb3IgYSBjb2x1bW4uXG4gICAgICogQHBhcmFtIHtzdHJpbmcgfCBEYXRlIHwgbnVtYmVyIHwgT2JqZWN0fSB2YWx1ZSBGaWx0ZXIgdmFsdWUgdG8gYXBwbHkgdG8gdGhlIGNvbHVtbi5cbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gZmllbGQgVGhlIGZpZWxkIG5hbWUgb2YgdGhlIGNvbHVtbiBiZWluZyBmaWx0ZXJlZC4gVGhpcyBpcyB1c2VkIHRvIGlkZW50aWZ5IHRoZSBjb2x1bW4gaW4gdGhlIGRhdGEgc2V0LlxuICAgICAqIEBwYXJhbSB7c3RyaW5nIHwgRnVuY3Rpb259IGZpbHRlclR5cGUgVGhlIHR5cGUgb2YgZmlsdGVyIHRvIGFwcGx5IChlLmcuLCBcImVxdWFsc1wiLCBcImxpa2VcIiwgXCI8XCIsIFwiPD1cIiwgXCI+XCIsIFwiPj1cIiwgXCIhPVwiLCBcImJldHdlZW5cIiwgXCJpblwiKS5cbiAgICAgKiBDYW4gYWxzbyBiZSBhIGZ1bmN0aW9uLlxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBmaWVsZFR5cGUgVGhlIHR5cGUgb2YgZmllbGQgYmVpbmcgZmlsdGVyZWQgKGUuZy4sIFwic3RyaW5nXCIsIFwibnVtYmVyXCIsIFwiZGF0ZVwiLCBcIm9iamVjdFwiKS5cbiAgICAgKiBAcGFyYW0ge2Jvb2xlYW59IGZpbHRlcklzRnVuY3Rpb24gSW5kaWNhdGVzIGlmIHRoZSBmaWx0ZXIgdHlwZSBpcyBhIGZ1bmN0aW9uLlxuICAgICAqIEBwYXJhbSB7T2JqZWN0fSBmaWx0ZXJQYXJhbXMgT3B0aW9uYWwgcGFyYW1ldGVycyB0byBwYXNzIHRvIHRoZSBmaWx0ZXIgZnVuY3Rpb24uXG4gICAgICogQHJldHVybnMge0ZpbHRlclRhcmdldCB8IEZpbHRlckRhdGUgfCBGaWx0ZXJGdW5jdGlvbiB8IG51bGx9IFJldHVybnMgYSBmaWx0ZXIgdGFyZ2V0IG9iamVjdCB0aGF0IGRlZmluZXMgYSBzaW5nbGUgZmlsdGVyIGNvbmRpdGlvbiBmb3IgYSBjb2x1bW4sIFxuICAgICAqIG9yIG51bGwgaWYgdGhlIHZhbHVlIGNhbm5vdCBiZSBjb252ZXJ0ZWQgdG8gdGhlIGZpZWxkIHR5cGUuIFxuICAgICAqL1xuICAgIGNyZWF0ZUZpbHRlclRhcmdldCh2YWx1ZSwgZmllbGQsIGZpbHRlclR5cGUsIGZpZWxkVHlwZSwgZmlsdGVySXNGdW5jdGlvbiwgZmlsdGVyUGFyYW1zKSB7IFxuICAgICAgICBpZiAoZmlsdGVySXNGdW5jdGlvbikgeyBcbiAgICAgICAgICAgIHJldHVybiBuZXcgRmlsdGVyRnVuY3Rpb24oeyB2YWx1ZTogdmFsdWUsIGZpZWxkOiBmaWVsZCwgZmlsdGVyVHlwZTogZmlsdGVyVHlwZSwgcGFyYW1zOiBmaWx0ZXJQYXJhbXMgfSk7XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCBjb252ZXJ0ZWRWYWx1ZSA9IHRoaXMuY29udmVydFRvVHlwZSh2YWx1ZSwgZmllbGRUeXBlKTtcblxuICAgICAgICBpZiAoY29udmVydGVkVmFsdWUgPT09IG51bGwpIHJldHVybiBudWxsO1xuXG4gICAgICAgIGlmIChmaWVsZFR5cGUgPT09IFwiZGF0ZVwiIHx8IGZpZWxkVHlwZSA9PT0gXCJkYXRldGltZVwiKSB7XG4gICAgICAgICAgICByZXR1cm4gbmV3IEZpbHRlckRhdGUoeyB2YWx1ZTogY29udmVydGVkVmFsdWUsIGZpZWxkOiBmaWVsZCwgZmlsdGVyVHlwZTogZmlsdGVyVHlwZSB9KTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBuZXcgRmlsdGVyVGFyZ2V0KHsgdmFsdWU6IGNvbnZlcnRlZFZhbHVlLCBmaWVsZDogZmllbGQsIGZpZWxkVHlwZTogZmllbGRUeXBlLCBmaWx0ZXJUeXBlOiBmaWx0ZXJUeXBlIH0pO1xuICAgIH1cbiAgICAvKipcbiAgICAgKiBDb21waWxlcyBhbiBhcnJheSBvZiBmaWx0ZXIgdHlwZSBvYmplY3RzIHRoYXQgY29udGFpbiBhIGZpbHRlciB2YWx1ZSB0aGF0IG1hdGNoZXMgaXRzIGNvbHVtbiB0eXBlLiAgQ29sdW1uIHR5cGUgbWF0Y2hpbmcgXG4gICAgICogaXMgbmVjZXNzYXJ5IHdoZW4gcHJvY2Vzc2luZyBkYXRhIGxvY2FsbHksIHNvIHRoYXQgZmlsdGVyIHZhbHVlIG1hdGNoZXMgYXNzb2NpYXRlZCByb3cgdHlwZSB2YWx1ZSBmb3IgY29tcGFyaXNvbi5cbiAgICAgKiBAcmV0dXJucyB7QXJyYXl9IGFycmF5IG9mIGZpbHRlciB0eXBlIG9iamVjdHMgd2l0aCB2YWxpZCB2YWx1ZS5cbiAgICAgKi9cbiAgICBjb21waWxlRmlsdGVycygpIHtcbiAgICAgICAgbGV0IHJlc3VsdHMgPSBbXTtcblxuICAgICAgICBmb3IgKGNvbnN0IGl0ZW0gb2YgdGhpcy5oZWFkZXJGaWx0ZXJzKSB7XG4gICAgICAgICAgICBpZiAoaXRlbS52YWx1ZSA9PT0gXCJcIikgY29udGludWU7XG5cbiAgICAgICAgICAgIGNvbnN0IGZpbHRlciA9IHRoaXMuY3JlYXRlRmlsdGVyVGFyZ2V0KGl0ZW0udmFsdWUsIGl0ZW0uZmllbGQsIGl0ZW0uZmlsdGVyVHlwZSwgaXRlbS5maWVsZFR5cGUsIGl0ZW0uZmlsdGVySXNGdW5jdGlvbiwgaXRlbT8uZmlsdGVyUGFyYW1zKTtcblxuICAgICAgICAgICAgaWYgKGZpbHRlciAhPT0gbnVsbCkge1xuICAgICAgICAgICAgICAgIHJlc3VsdHMucHVzaChmaWx0ZXIpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHRoaXMuZ3JpZEZpbHRlcnMubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgcmVzdWx0cyA9IHJlc3VsdHMuY29uY2F0KHRoaXMuZ3JpZEZpbHRlcnMpO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHJlc3VsdHM7XG4gICAgfVxuICAgIC8qKlxuICAgICAqIFVzZSB0YXJnZXQgZmlsdGVycyB0byBjcmVhdGUgYSBuZXcgZGF0YSBzZXQgaW4gdGhlIHBlcnNpc3RlbmNlIGRhdGEgcHJvdmlkZXIuXG4gICAgICogQHBhcmFtIHtBcnJheTxGaWx0ZXJUYXJnZXQ+fSB0YXJnZXRzIEFycmF5IG9mIEZpbHRlclRhcmdldCBvYmplY3RzLlxuICAgICAqL1xuICAgIGFwcGx5RmlsdGVycyh0YXJnZXRzKSB7XG4gICAgICAgIHRoaXMuY29udGV4dC5wZXJzaXN0ZW5jZS5kYXRhID0gW107XG4gICAgICAgIHRoaXMuY29udGV4dC5wZXJzaXN0ZW5jZS5kYXRhQ2FjaGUuZm9yRWFjaCgocm93KSA9PiB7XG4gICAgICAgICAgICBsZXQgbWF0Y2ggPSB0cnVlO1xuXG4gICAgICAgICAgICBmb3IgKGxldCBpdGVtIG9mIHRhcmdldHMpIHtcbiAgICAgICAgICAgICAgICBjb25zdCByb3dWYWwgPSB0aGlzLmNvbnZlcnRUb1R5cGUocm93W2l0ZW0uZmllbGRdLCBpdGVtLmZpZWxkVHlwZSk7XG4gICAgICAgICAgICAgICAgY29uc3QgcmVzdWx0ID0gaXRlbS5leGVjdXRlKHJvd1ZhbCwgcm93KTtcblxuICAgICAgICAgICAgICAgIGlmICghcmVzdWx0KSB7XG4gICAgICAgICAgICAgICAgICAgIG1hdGNoID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpZiAobWF0Y2gpIHtcbiAgICAgICAgICAgICAgICB0aGlzLmNvbnRleHQucGVyc2lzdGVuY2UuZGF0YS5wdXNoKHJvdyk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgIH1cbiAgICAvKipcbiAgICAgKiBSZW5kZXJzIHRoZSBsb2NhbCBkYXRhIHNldCBieSBhcHBseWluZyB0aGUgY29tcGlsZWQgZmlsdGVycyB0byB0aGUgcGVyc2lzdGVuY2UgZGF0YSBwcm92aWRlci5cbiAgICAgKi9cbiAgICByZW5kZXJMb2NhbCA9ICgpID0+IHtcbiAgICAgICAgY29uc3QgdGFyZ2V0cyA9IHRoaXMuY29tcGlsZUZpbHRlcnMoKTtcblxuICAgICAgICBpZiAoT2JqZWN0LmtleXModGFyZ2V0cykubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgdGhpcy5hcHBseUZpbHRlcnModGFyZ2V0cyk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB0aGlzLmNvbnRleHQucGVyc2lzdGVuY2UucmVzdG9yZURhdGEoKTtcbiAgICAgICAgfVxuICAgIH07XG4gICAgLyoqXG4gICAgICogUHJvdmlkZXMgYSBtZWFucyB0byBhcHBseSBhIGNvbmRpdGlvbiBvdXRzaWRlIHRoZSBoZWFkZXIgZmlsdGVyIGNvbnRyb2xzLiAgV2lsbCBhZGQgY29uZGl0aW9uXG4gICAgICogdG8gZ3JpZCdzIGBncmlkRmlsdGVyc2AgY29sbGVjdGlvbiwgYW5kIHJhaXNlIGByZW5kZXJgIGV2ZW50IHRvIGZpbHRlciBkYXRhIHNldC5cbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gZmllbGQgZmllbGQgbmFtZS5cbiAgICAgKiBAcGFyYW0ge29iamVjdH0gdmFsdWUgdmFsdWUuXG4gICAgICogQHBhcmFtIHtzdHJpbmcgfCBGdW5jdGlvbn0gdHlwZSBjb25kaXRpb24gdHlwZS5cbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gW2ZpZWxkVHlwZT1cInN0cmluZ1wiXSBmaWVsZCB0eXBlLlxuICAgICAqIEBwYXJhbSB7b2JqZWN0fSBbZmlsdGVyUGFyYW1zPXt9XSBhZGRpdGlvbmFsIGZpbHRlciBwYXJhbWV0ZXJzLlxuICAgICAqL1xuICAgIHNldEZpbHRlcihmaWVsZCwgdmFsdWUsIHR5cGUgPSBcImVxdWFsc1wiLCBmaWVsZFR5cGUgPSBcInN0cmluZ1wiLCBmaWx0ZXJQYXJhbXMgPSB7fSkge1xuICAgICAgICBjb25zdCBjb252ZXJ0ZWRWYWx1ZSA9IHRoaXMuY29udmVydFRvVHlwZSh2YWx1ZSwgZmllbGRUeXBlKTtcblxuICAgICAgICBpZiAodGhpcy5ncmlkRmlsdGVycy5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICBjb25zdCBpbmRleCA9IHRoaXMuZ3JpZEZpbHRlcnMuZmluZEluZGV4KChpKSA9PiBpLmZpZWxkID09PSBmaWVsZCk7XG4gICAgICAgICAgICAvL0lmIGZpZWxkIGFscmVhZHkgZXhpc3RzLCBqdXN0IHVwZGF0ZSB0aGUgdmFsdWUuXG4gICAgICAgICAgICBpZiAoaW5kZXggPiAtMSkge1xuICAgICAgICAgICAgICAgIHRoaXMuZ3JpZEZpbHRlcnNbaW5kZXhdLnZhbHVlID0gY29udmVydGVkVmFsdWU7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgY29uc3QgZmlsdGVyID0gdGhpcy5jcmVhdGVGaWx0ZXJUYXJnZXQoY29udmVydGVkVmFsdWUsIGZpZWxkLCB0eXBlLCBmaWVsZFR5cGUsICh0eXBlb2YgdHlwZSA9PT0gXCJmdW5jdGlvblwiKSwgZmlsdGVyUGFyYW1zKTtcbiAgICAgICAgdGhpcy5ncmlkRmlsdGVycy5wdXNoKGZpbHRlcik7XG4gICAgfVxuICAgIC8qKlxuICAgICAqIFJlbW92ZXMgZmlsdGVyIGNvbmRpdGlvbiBmcm9tIGdyaWQncyBgZ3JpZEZpbHRlcnNgIGNvbGxlY3Rpb24uXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IGZpZWxkIGZpZWxkIG5hbWUuXG4gICAgICovXG4gICAgcmVtb3ZlRmlsdGVyKGZpZWxkKSB7XG4gICAgICAgIHRoaXMuZ3JpZEZpbHRlcnMgPSB0aGlzLmdyaWRGaWx0ZXJzLmZpbHRlcihmID0+IGYuZmllbGQgIT09IGZpZWxkKTtcbiAgICB9XG59XG5cbkZpbHRlck1vZHVsZS5tb2R1bGVOYW1lID0gXCJmaWx0ZXJcIjtcblxuZXhwb3J0IHsgRmlsdGVyTW9kdWxlIH07IiwiY2xhc3MgUGFnZXJCdXR0b25zIHtcbiAgICAvKipcbiAgICAgKiBSZXR1cm5zIHN0YXJ0IGJ1dHRvbiBmb3IgcGFnZXIgZWxlbWVudC5cbiAgICAgKiBAcGFyYW0ge251bWJlcn0gY3VycmVudFBhZ2UgQ3VycmVudCBwYWdlLlxuICAgICAqIEBwYXJhbSB7RnVuY3Rpb259IGNhbGxiYWNrIEJ1dHRvbiBjbGljayBoYW5kbGVyLlxuICAgICAqIEByZXR1cm5zIHtIVE1MTGlua0VsZW1lbnR9XG4gICAgICovXG4gICAgc3RhdGljIHN0YXJ0KGN1cnJlbnRQYWdlLCBjYWxsYmFjaykge1xuICAgICAgICBjb25zdCBsaSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJsaVwiKTtcbiAgICAgICAgY29uc3QgYnRuID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImJ1dHRvblwiKTtcblxuICAgICAgICBsaS5hcHBlbmQoYnRuKTtcbiAgICAgICAgYnRuLmlubmVySFRNTCA9IFwiJmxzYXF1bztcIjtcbiAgICAgICAgYnRuLmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCBjYWxsYmFjayk7XG5cbiAgICAgICAgaWYgKGN1cnJlbnRQYWdlID4gMSkge1xuICAgICAgICAgICAgYnRuLmRhdGFzZXQucGFnZSA9IFwiMVwiO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgYnRuLnRhYkluZGV4ID0gLTE7XG4gICAgICAgICAgICBidG4uZGlzYWJsZWQgPSB0cnVlO1xuICAgICAgICAgICAgbGkuY2xhc3NOYW1lID0gXCJkaXNhYmxlZFwiO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIGxpO1xuICAgIH1cbiAgICAvKipcbiAgICAgKiBSZXR1cm5zIGVuZCBidXR0b24gZm9yIHBhZ2VyIGVsZW1lbnQuXG4gICAgICogQHBhcmFtIHtudW1iZXJ9IHRvdGFsUGFnZXMgbGFzdCBwYWdlIG51bWJlciBpbiBncm91cCBzZXQuXG4gICAgICogQHBhcmFtIHtudW1iZXJ9IGN1cnJlbnRQYWdlIGN1cnJlbnQgcGFnZS5cbiAgICAgKiBAcGFyYW0ge0Z1bmN0aW9ufSBjYWxsYmFjayBidXR0b24gY2xpY2sgaGFuZGxlci5cbiAgICAgKiBAcmV0dXJucyB7SFRNTExJRWxlbWVudH1cbiAgICAgKi9cbiAgICBzdGF0aWMgZW5kKHRvdGFsUGFnZXMsIGN1cnJlbnRQYWdlLCBjYWxsYmFjaykge1xuICAgICAgICBjb25zdCBsaSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJsaVwiKTtcbiAgICAgICAgY29uc3QgYnRuID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImJ1dHRvblwiKTtcblxuICAgICAgICBsaS5hcHBlbmQoYnRuKTtcbiAgICAgICAgYnRuLmlubmVySFRNTCA9IFwiJnJzYXF1bztcIjtcbiAgICAgICAgYnRuLmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCBjYWxsYmFjayk7XG5cbiAgICAgICAgaWYgKGN1cnJlbnRQYWdlIDwgdG90YWxQYWdlcykge1xuICAgICAgICAgICAgYnRuLmRhdGFzZXQucGFnZSA9IHRvdGFsUGFnZXM7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBidG4udGFiSW5kZXggPSAtMTtcbiAgICAgICAgICAgIGJ0bi5kaXNhYmxlZCA9IHRydWU7XG4gICAgICAgICAgICBsaS5jbGFzc05hbWUgPSBcImRpc2FibGVkXCI7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gbGk7XG4gICAgfVxuICAgIC8qKlxuICAgICAqIFJldHVybnMgcGFnZXIgYnV0dG9uIGZvciBhc3NvY2lhdGVkIHBhZ2UuXG4gICAgICogQHBhcmFtIHtudW1iZXJ9IHBhZ2UgcGFnZSBudW1iZXIuXG4gICAgICogQHBhcmFtIHtudW1iZXJ9IGN1cnJlbnRQYWdlIGN1cnJlbnQgcGFnZS5cbiAgICAgKiBAcGFyYW0ge0Z1bmN0aW9ufSBjYWxsYmFjayBidXR0b24gY2xpY2sgaGFuZGxlci5cbiAgICAgKiBAcmV0dXJucyB7SFRNTExJRWxlbWVudH1cbiAgICAgKi9cbiAgICBzdGF0aWMgcGFnZU51bWJlcihwYWdlLCBjdXJyZW50UGFnZSwgY2FsbGJhY2spIHtcbiAgICAgICAgY29uc3QgbGkgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwibGlcIik7XG4gICAgICAgIGNvbnN0IGJ0biA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJidXR0b25cIik7XG5cbiAgICAgICAgbGkuYXBwZW5kKGJ0bik7XG4gICAgICAgIGJ0bi5pbm5lclRleHQgPSBwYWdlO1xuICAgICAgICBidG4uZGF0YXNldC5wYWdlID0gcGFnZTtcbiAgICAgICAgYnRuLmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCBjYWxsYmFjayk7XG5cbiAgICAgICAgaWYgKHBhZ2UgPT09IGN1cnJlbnRQYWdlKSB7XG4gICAgICAgICAgICBsaS5jbGFzc05hbWUgPSBcImFjdGl2ZVwiO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIGxpO1xuICAgIH1cbn1cblxuZXhwb3J0IHsgUGFnZXJCdXR0b25zIH07IiwiaW1wb3J0IHsgUGFnZXJCdXR0b25zIH0gZnJvbSBcIi4vcGFnZXJCdXR0b25zLmpzXCI7XG4vKipcbiAqIEZvcm1hdHMgZ3JpZCdzIHJvd3MgYXMgYSBzZXJpZXMgb2YgcGFnZXMgcmF0aGVyIHRoYXQgYSBzY3JvbGxpbmcgbGlzdC4gIElmIHBhZ2luZyBpcyBub3QgZGVzaXJlZCwgcmVnaXN0ZXIgdGhlIGBSb3dNb2R1bGVgIGluc3RlYWQuXG4gKiBcbiAqIENsYXNzIHN1YnNjcmliZXMgdG8gdGhlIGByZW5kZXJgIGV2ZW50IHRvIHVwZGF0ZSB0aGUgcGFnZXIgY29udHJvbCB3aGVuIHRoZSBncmlkIGlzIHJlbmRlcmVkLiAgSXQgYWxzbyBjYWxscyB0aGUgY2hhaW4gZXZlbnQgXG4gKiBgcmVtb3RlUGFyYW1zYCB0byBjb21waWxlIGEgbGlzdCBvZiBwYXJhbWV0ZXJzIHRvIGJlIHBhc3NlZCB0byB0aGUgcmVtb3RlIGRhdGEgc291cmNlIHdoZW4gdXNpbmcgcmVtb3RlIHByb2Nlc3NpbmcuXG4gKi9cbmNsYXNzIFBhZ2VyTW9kdWxlIHtcbiAgICAvKipcbiAgICAgKiBGb3JtYXRzIGdyaWQncyByb3dzIGFzIGEgc2VyaWVzIG9mIHBhZ2VzIHJhdGhlciB0aGF0IGEgc2Nyb2xsaW5nIGxpc3QuICBNb2R1bGUgY2FuIGJlIHVzZWQgd2l0aCBib3RoIGxvY2FsIGFuZCByZW1vdGUgZGF0YSBzb3VyY2VzLiAgXG4gICAgICogQHBhcmFtIHtHcmlkQ29udGV4dH0gY29udGV4dCBHcmlkIGNvbnRleHQuXG4gICAgICovXG4gICAgY29uc3RydWN0b3IoY29udGV4dCkge1xuICAgICAgICB0aGlzLmNvbnRleHQgPSBjb250ZXh0O1xuICAgICAgICB0aGlzLnRvdGFsUm93cyA9IHRoaXMuY29udGV4dC5wZXJzaXN0ZW5jZS5yb3dDb3VudDtcbiAgICAgICAgdGhpcy5wYWdlc1RvRGlzcGxheSA9IHRoaXMuY29udGV4dC5zZXR0aW5ncy5wYWdlclBhZ2VzVG9EaXNwbGF5O1xuICAgICAgICB0aGlzLnJvd3NQZXJQYWdlID0gdGhpcy5jb250ZXh0LnNldHRpbmdzLnBhZ2VyUm93c1BlclBhZ2U7XG4gICAgICAgIHRoaXMuY3VycmVudFBhZ2UgPSAxO1xuICAgICAgICAvL2NyZWF0ZSBkaXYgY29udGFpbmVyIGZvciBwYWdlclxuICAgICAgICB0aGlzLmNvbnRhaW5lciA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJkaXZcIik7XG4gICAgICAgIHRoaXMuZWxQYWdlciA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJ1bFwiKTtcblxuICAgICAgICB0aGlzLmNvbnRhaW5lci5pZCA9IGAke3RoaXMuY29udGV4dC5zZXR0aW5ncy5iYXNlSWROYW1lfV9wYWdlcmA7XG4gICAgICAgIHRoaXMuY29udGFpbmVyLmNsYXNzTmFtZSA9IHRoaXMuY29udGV4dC5zZXR0aW5ncy5wYWdlckNzcztcbiAgICAgICAgdGhpcy5jb250YWluZXIuYXBwZW5kKHRoaXMuZWxQYWdlcik7XG4gICAgICAgIHRoaXMuY29udGV4dC5ncmlkLnRhYmxlLmluc2VydEFkamFjZW50RWxlbWVudChcImFmdGVyZW5kXCIsIHRoaXMuY29udGFpbmVyKTtcbiAgICB9XG4gICAgLyoqXG4gICAgICogU2V0cyBoYW5kbGVyIGV2ZW50cyBmb3IgcmVuZGVyaW5nL3VwZGF0aW5nIGdyaWQgYm9keSByb3dzIGFuZCBwYWdlciBjb250cm9sLlxuICAgICAqL1xuICAgIGluaXRpYWxpemUoKSB7XG4gICAgICAgIGlmICh0aGlzLmNvbnRleHQuc2V0dGluZ3MucmVtb3RlUHJvY2Vzc2luZykge1xuICAgICAgICAgICAgdGhpcy5jb250ZXh0LmV2ZW50cy5zdWJzY3JpYmUoXCJyZW5kZXJcIiwgdGhpcy5yZW5kZXJSZW1vdGUsIHRydWUsIDEwKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHRoaXMuY29udGV4dC5ldmVudHMuc3Vic2NyaWJlKFwicmVuZGVyXCIsIHRoaXMucmVuZGVyTG9jYWwsIGZhbHNlLCAxMCk7XG4gICAgICAgIH1cbiAgICB9XG4gICAgLyoqXG4gICAgICogUmV0dXJucyB0aGUgdG90YWwgbnVtYmVyIG9mIHBvc3NpYmxlIHBhZ2VzIGJhc2VkIG9uIHRoZSB0b3RhbCByb3dzLCBhbmQgcm93cyBwZXIgcGFnZSBzZXR0aW5nLlxuICAgICAqIEByZXR1cm5zIHtOdW1iZXJ9XG4gICAgICovXG4gICAgdG90YWxQYWdlcygpIHtcbiAgICAgICAgY29uc3QgdG90YWxSb3dzID0gaXNOYU4odGhpcy50b3RhbFJvd3MpID8gMSA6IHRoaXMudG90YWxSb3dzO1xuXG4gICAgICAgIHJldHVybiB0aGlzLnJvd3NQZXJQYWdlID09PSAwID8gMSA6IE1hdGguY2VpbCh0b3RhbFJvd3MgLyB0aGlzLnJvd3NQZXJQYWdlKTtcbiAgICB9XG4gICAgLyoqXG4gICAgICogUmV0dXJucyBhIHZhbGlkYXRlZCBwYWdlIG51bWJlciBpbnB1dCBieSBtYWtpbmcgc3VyZSB2YWx1ZSBpcyBudW1lcmljLCBhbmQgd2l0aGluIHRoZSBib3VuZHMgb2YgdGhlIHRvdGFsIHBhZ2VzLiAgXG4gICAgICogQW4gaW52YWxpZCBpbnB1dCB3aWxsIHJldHVybiBhIHZhbHVlIG9mIDEuXG4gICAgICogQHBhcmFtIHtzdHJpbmcgfCBudW1iZXJ9IGN1cnJlbnRQYWdlIFBhZ2UgbnVtYmVyIHRvIHZhbGlkYXRlLlxuICAgICAqIEByZXR1cm5zIHtOdW1iZXJ9IFJldHVybnMgYSB2YWxpZCBwYWdlIG51bWJlciBiZXR3ZWVuIDEgYW5kIHRoZSB0b3RhbCBudW1iZXIgb2YgcGFnZXMuICBJZiB0aGUgaW5wdXQgaXMgaW52YWxpZCwgcmV0dXJucyAxLlxuICAgICAqL1xuICAgIHZhbGlkYXRlUGFnZShjdXJyZW50UGFnZSkge1xuICAgICAgICBpZiAoIU51bWJlci5pc0ludGVnZXIoY3VycmVudFBhZ2UpKSB7XG4gICAgICAgICAgICBjdXJyZW50UGFnZSA9IHBhcnNlSW50KGN1cnJlbnRQYWdlKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IHRvdGFsID0gdGhpcy50b3RhbFBhZ2VzKCk7XG4gICAgICAgIGNvbnN0IHJlc3VsdCA9IHRvdGFsIDwgY3VycmVudFBhZ2UgPyB0b3RhbCA6IGN1cnJlbnRQYWdlO1xuXG4gICAgICAgIHJldHVybiByZXN1bHQgPD0gMCA/IDEgOiByZXN1bHQ7XG4gICAgfVxuICAgIC8qKlxuICAgICAqIFJldHVybnMgdGhlIGZpcnN0IHBhZ2UgbnVtYmVyIHRvIGRpc3BsYXkgaW4gdGhlIGJ1dHRvbiBjb250cm9sIHNldCBiYXNlZCBvbiB0aGUgcGFnZSBudW1iZXIgcG9zaXRpb24gaW4gdGhlIGRhdGFzZXQuICBcbiAgICAgKiBQYWdlIG51bWJlcnMgb3V0c2lkZSBvZiB0aGlzIHJhbmdlIGFyZSByZXByZXNlbnRlZCBieSBhbiBhcnJvdy5cbiAgICAgKiBAcGFyYW0ge051bWJlcn0gY3VycmVudFBhZ2UgQ3VycmVudCBwYWdlIG51bWJlci5cbiAgICAgKiBAcmV0dXJucyB7TnVtYmVyfVxuICAgICAqL1xuICAgIGZpcnN0RGlzcGxheVBhZ2UoY3VycmVudFBhZ2UpIHtcbiAgICAgICAgY29uc3QgbWlkZGxlID0gTWF0aC5mbG9vcih0aGlzLnBhZ2VzVG9EaXNwbGF5IC8gMiArIHRoaXMucGFnZXNUb0Rpc3BsYXkgJSAyKTtcblxuICAgICAgICBpZiAoY3VycmVudFBhZ2UgPCBtaWRkbGUpIHJldHVybiAxO1xuXG4gICAgICAgIGlmICh0aGlzLnRvdGFsUGFnZXMoKSA8IChjdXJyZW50UGFnZSArIHRoaXMucGFnZXNUb0Rpc3BsYXkgLSBtaWRkbGUpKSB7XG4gICAgICAgICAgICByZXR1cm4gTWF0aC5tYXgodGhpcy50b3RhbFBhZ2VzKCkgLSB0aGlzLnBhZ2VzVG9EaXNwbGF5ICsgMSwgMSk7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gY3VycmVudFBhZ2UgLSBtaWRkbGUgKyAxO1xuICAgIH1cbiAgICAvKipcbiAgICAgKiBDcmVhdGVzIHRoZSBodG1sIGxpc3QgaXRlbSBhbmQgYnV0dG9uIGVsZW1lbnRzIGZvciB0aGUgcGFnZXIgY29udGFpbmVyJ3MgdWwgZWxlbWVudC4gIFdpbGwgYWxzbyBzZXQgdGhlIFxuICAgICAqIGB0aGlzLmN1cnJlbnRQYWdlYCBwcm9wZXJ0eSB0byB0aGUgY3VycmVudCBwYWdlIG51bWJlci5cbiAgICAgKiBAcGFyYW0ge051bWJlcn0gY3VycmVudFBhZ2UgQ3VycmVudCBwYWdlIG51bWJlci4gIEFzc3VtZXMgYSB2YWxpZCBwYWdlIG51bWJlciBpcyBwcm92aWRlZC5cbiAgICAgKiBAcGFyYW0ge0Z1bmN0aW9ufSBjYWxsYmFjayBCdXR0b24gY2xpY2sgaGFuZGxlci5cbiAgICAgKi9cbiAgICByZW5kZXIoY3VycmVudFBhZ2UsIGNhbGxiYWNrKSB7XG4gICAgICAgIGNvbnN0IHRvdGFsUGFnZXMgPSB0aGlzLnRvdGFsUGFnZXMoKTtcbiAgICAgICAgLy8gQ2xlYXIgdGhlIHByaW9yIGxpIGVsZW1lbnRzLlxuICAgICAgICB0aGlzLmVsUGFnZXIucmVwbGFjZUNoaWxkcmVuKCk7XG5cbiAgICAgICAgaWYgKHRvdGFsUGFnZXMgPD0gMSkgcmV0dXJuO1xuICAgICAgICBcbiAgICAgICAgY29uc3QgZmlyc3REaXNwbGF5ID0gdGhpcy5maXJzdERpc3BsYXlQYWdlKGN1cnJlbnRQYWdlKTtcbiAgICAgICAgY29uc3QgbWF4UGFnZXMgPSBmaXJzdERpc3BsYXkgKyB0aGlzLnBhZ2VzVG9EaXNwbGF5O1xuICAgICAgICBcbiAgICAgICAgdGhpcy5jdXJyZW50UGFnZSA9IGN1cnJlbnRQYWdlO1xuICAgICAgICB0aGlzLmVsUGFnZXIuYXBwZW5kQ2hpbGQoUGFnZXJCdXR0b25zLnN0YXJ0KGN1cnJlbnRQYWdlLCBjYWxsYmFjaykpO1xuXG4gICAgICAgIGZvciAobGV0IHBhZ2UgPSBmaXJzdERpc3BsYXk7IHBhZ2UgPD0gdG90YWxQYWdlcyAmJiBwYWdlIDwgbWF4UGFnZXM7IHBhZ2UrKykge1xuICAgICAgICAgICAgdGhpcy5lbFBhZ2VyLmFwcGVuZENoaWxkKFBhZ2VyQnV0dG9ucy5wYWdlTnVtYmVyKHBhZ2UsIGN1cnJlbnRQYWdlLCBjYWxsYmFjaykpO1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5lbFBhZ2VyLmFwcGVuZENoaWxkKFBhZ2VyQnV0dG9ucy5lbmQodG90YWxQYWdlcywgY3VycmVudFBhZ2UsIGNhbGxiYWNrKSk7XG4gICAgfVxuXG4gICAgaGFuZGxlUGFnaW5nID0gYXN5bmMgKGUpID0+IHtcbiAgICAgICAgY29uc3QgdmFsaWRQYWdlID0geyBwYWdlOiB0aGlzLnZhbGlkYXRlUGFnZShlLmN1cnJlbnRUYXJnZXQuZGF0YXNldC5wYWdlKSB9O1xuXG4gICAgICAgIGlmICh0aGlzLmNvbnRleHQuc2V0dGluZ3MucmVtb3RlUHJvY2Vzc2luZykge1xuICAgICAgICAgICAgYXdhaXQgdGhpcy5yZW5kZXJSZW1vdGUodmFsaWRQYWdlKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHRoaXMucmVuZGVyTG9jYWwodmFsaWRQYWdlKTtcbiAgICAgICAgfVxuICAgIH07XG4gICAgLyoqXG4gICAgICogSGFuZGxlciBmb3IgcmVuZGVyaW5nIHJvd3MgdXNpbmcgbG9jYWwgZGF0YSBzb3VyY2UuICBXaWxsIHNsaWNlIHRoZSBkYXRhIGFycmF5IGJhc2VkIG9uIHRoZSBjdXJyZW50IHBhZ2UgYW5kIHJvd3MgcGVyIHBhZ2Ugc2V0dGluZ3MsXG4gICAgICogdGhlbiBjYWxsIGByZW5kZXJgIHRvIHVwZGF0ZSB0aGUgcGFnZXIgY29udHJvbC4gIE9wdGlvbmFsIGFyZ3VtZW50IGBwYXJhbXNgIGlzIGFuIG9iamVjdCB0aGF0IGNhbiBjb250YWluIHRoZSBmb2xsb3dpbmcgcHJvcGVydGllczpcbiAgICAgKiAqIGBwYWdlYDpQYWdlIG51bWJlciB0byByZW5kZXIuICBJZiBub3QgcHJvdmlkZWQsIGRlZmF1bHRzIHRvIDEuXG4gICAgICogQHBhcmFtIHt7IHBhZ2U6IG51bWJlciB9IHwgbnVsbH0gcGFyYW1zIFxuICAgICAqL1xuICAgIHJlbmRlckxvY2FsID0gKHBhcmFtcyA9IHt9KSA9PiB7XG4gICAgICAgIGNvbnN0IHBhZ2UgPSAhcGFyYW1zLnBhZ2UgPyAxIDogdGhpcy52YWxpZGF0ZVBhZ2UocGFyYW1zLnBhZ2UpO1xuICAgICAgICBjb25zdCBiZWdpbiA9IChwYWdlIC0gMSkgKiB0aGlzLnJvd3NQZXJQYWdlO1xuICAgICAgICBjb25zdCBlbmQgPSBiZWdpbiArIHRoaXMucm93c1BlclBhZ2U7XG4gICAgICAgIGNvbnN0IGRhdGEgPSB0aGlzLmNvbnRleHQucGVyc2lzdGVuY2UuZGF0YS5zbGljZShiZWdpbiwgZW5kKTtcblxuICAgICAgICB0aGlzLmNvbnRleHQuZ3JpZC5yZW5kZXJSb3dzKGRhdGEsIHRoaXMuY29udGV4dC5wZXJzaXN0ZW5jZS5yb3dDb3VudCk7XG4gICAgICAgIHRoaXMudG90YWxSb3dzID0gdGhpcy5jb250ZXh0LnBlcnNpc3RlbmNlLnJvd0NvdW50O1xuICAgICAgICB0aGlzLnJlbmRlcihwYWdlLCB0aGlzLmhhbmRsZVBhZ2luZyk7XG4gICAgfTtcbiAgICAvKipcbiAgICAgKiBIYW5kbGVyIGZvciByZW5kZXJpbmcgcm93cyB1c2luZyByZW1vdGUgZGF0YSBzb3VyY2UuICBXaWxsIGNhbGwgdGhlIGBkYXRhbG9hZGVyYCB0byByZXF1ZXN0IGRhdGEgYmFzZWQgb24gdGhlIHByb3ZpZGVkIHBhcmFtcyxcbiAgICAgKiB0aGVuIGNhbGwgYHJlbmRlcmAgdG8gdXBkYXRlIHRoZSBwYWdlciBjb250cm9sLiAgT3B0aW9uYWwgYXJndW1lbnQgYHBhcmFtc2AgaXMgYW4gb2JqZWN0IHRoYXQgY2FuIGNvbnRhaW4gdGhlIGZvbGxvd2luZyBwcm9wZXJ0aWVzOlxuICAgICAqICogYHBhZ2VgOiBQYWdlIG51bWJlciB0byByZW5kZXIuICBJZiBub3QgcHJvdmlkZWQsIGRlZmF1bHRzIHRvIDEuXG4gICAgICogQHBhcmFtIHt7IHBhZ2U6IG51bWJlciB9IHwgbnVsbH0gcGFyYW1zIFxuICAgICAqL1xuICAgIHJlbmRlclJlbW90ZSA9IGFzeW5jIChwYXJhbXMgPSB7fSkgPT4ge1xuICAgICAgICBpZiAoIXBhcmFtcy5wYWdlKSBwYXJhbXMucGFnZSA9IDE7XG4gICAgICAgIFxuICAgICAgICBwYXJhbXMgPSB0aGlzLmNvbnRleHQuZXZlbnRzLmNoYWluKFwicmVtb3RlUGFyYW1zXCIsIHBhcmFtcyk7XG5cbiAgICAgICAgY29uc3QgZGF0YSA9IGF3YWl0IHRoaXMuY29udGV4dC5kYXRhbG9hZGVyLnJlcXVlc3RHcmlkRGF0YShwYXJhbXMpO1xuICAgICAgICBjb25zdCByb3dDb3VudCA9IGRhdGEucm93Q291bnQgPz8gMDtcblxuICAgICAgICB0aGlzLmNvbnRleHQuZ3JpZC5yZW5kZXJSb3dzKGRhdGEuZGF0YSwgcm93Q291bnQpO1xuICAgICAgICB0aGlzLnRvdGFsUm93cyA9IHJvd0NvdW50O1xuICAgICAgICB0aGlzLnJlbmRlcihwYXJhbXMucGFnZSwgdGhpcy5oYW5kbGVQYWdpbmcpO1xuICAgIH07XG59XG5cblBhZ2VyTW9kdWxlLm1vZHVsZU5hbWUgPSBcInBhZ2VyXCI7XG5cbmV4cG9ydCB7IFBhZ2VyTW9kdWxlIH07IiwiLyoqXG4gKiBXaWxsIHJlLWxvYWQgdGhlIGdyaWQncyBkYXRhIGZyb20gaXRzIHRhcmdldCBzb3VyY2UgKGxvY2FsIG9yIHJlbW90ZSkuXG4gKi9cbmNsYXNzIFJlZnJlc2hNb2R1bGUge1xuICAgIC8qKlxuICAgICAqIFdpbGwgYXBwbHkgZXZlbnQgdG8gdGFyZ2V0IGJ1dHRvbiB0aGF0LCB3aGVuIGNsaWNrZWQsIHdpbGwgcmUtbG9hZCB0aGUgXG4gICAgICogZ3JpZCdzIGRhdGEgZnJvbSBpdHMgdGFyZ2V0IHNvdXJjZSAobG9jYWwgb3IgcmVtb3RlKS5cbiAgICAgKiBAcGFyYW0ge0dyaWRDb250ZXh0fSBjb250ZXh0IEdyaWQgY29udGV4dCBjbGFzcy5cbiAgICAgKi9cbiAgICBjb25zdHJ1Y3Rvcihjb250ZXh0KSB7XG4gICAgICAgIHRoaXMuY29udGV4dCA9IGNvbnRleHQ7XG4gICAgfVxuXG4gICAgaW5pdGlhbGl6ZSgpIHtcbiAgICAgICAgaWYgKCF0aGlzLmNvbnRleHQuc2V0dGluZ3MucmVtb3RlUHJvY2Vzc2luZyAmJiB0aGlzLmNvbnRleHQuc2V0dGluZ3MucmVtb3RlVXJsKSB7XG4gICAgICAgICAgICB0aGlzLmNvbnRleHQucGlwZWxpbmUuYWRkU3RlcChcInJlZnJlc2hcIiwgdGhpcy5jb250ZXh0LnBlcnNpc3RlbmNlLnNldERhdGEpO1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc3QgYnRuID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQodGhpcy5jb250ZXh0LnNldHRpbmdzLnJlZnJlc2hhYmxlSWQpO1xuICAgICAgICBcbiAgICAgICAgYnRuLmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCB0aGlzLmhhbmRsZVJlZnJlc2gpO1xuICAgIH1cblxuICAgIGhhbmRsZVJlZnJlc2ggPSBhc3luYyAoKSA9PiB7XG4gICAgICAgIGlmICh0aGlzLmNvbnRleHQucGlwZWxpbmUuaGFzUGlwZWxpbmUoXCJyZWZyZXNoXCIpKSB7XG4gICAgICAgICAgICBhd2FpdCB0aGlzLmNvbnRleHQucGlwZWxpbmUuZXhlY3V0ZShcInJlZnJlc2hcIik7XG4gICAgICAgIH1cblxuICAgICAgICBhd2FpdCB0aGlzLmNvbnRleHQuZXZlbnRzLnRyaWdnZXIoXCJyZW5kZXJcIik7XG4gICAgfTtcbn1cblxuUmVmcmVzaE1vZHVsZS5tb2R1bGVOYW1lID0gXCJyZWZyZXNoXCI7XG5cbmV4cG9ydCB7IFJlZnJlc2hNb2R1bGUgfTsiLCIvKipcbiAqIFJlc3BvbnNpYmxlIGZvciByZW5kZXJpbmcgdGhlIGdyaWRzIHJvd3MgdXNpbmcgZWl0aGVyIGxvY2FsIG9yIHJlbW90ZSBkYXRhLiAgVGhpcyBzaG91bGQgYmUgdGhlIGRlZmF1bHQgbW9kdWxlIHRvIFxuICogY3JlYXRlIHJvdyBkYXRhIGlmIHBhZ2luZyBpcyBub3QgZW5hYmxlZC4gIFN1YnNjcmliZXMgdG8gdGhlIGByZW5kZXJgIGV2ZW50IHRvIGNyZWF0ZSB0aGUgZ3JpZCdzIHJvd3MgYW5kIHRoZSBgcmVtb3RlUGFyYW1zYCBcbiAqIGV2ZW50IGZvciByZW1vdGUgcHJvY2Vzc2luZy5cbiAqIFxuICogQ2xhc3Mgd2lsbCBjYWxsIHRoZSAncmVtb3RlUGFyYW1zJyBldmVudCB0byBjb25jYXRlbmF0ZSBwYXJhbWV0ZXJzIGZvciByZW1vdGUgZGF0YSByZXF1ZXN0cy5cbiAqL1xuY2xhc3MgUm93TW9kdWxlIHtcbiAgICAvKipcbiAgICAgKiBDcmVhdGVzIGdyaWQgcm93cy4gIFRoaXMgc2hvdWxkIGJlIHRoZSBkZWZhdWx0IG1vZHVsZSB0byBjcmVhdGUgcm93IGRhdGEgaWYgcGFnaW5nIGlzIG5vdCBlbmFibGVkLlxuICAgICAqIEBwYXJhbSB7R3JpZENvbnRleHR9IGNvbnRleHQgR3JpZCBjb250ZXh0IGNsYXNzLlxuICAgICAqL1xuICAgIGNvbnN0cnVjdG9yKGNvbnRleHQpIHtcbiAgICAgICAgdGhpcy5jb250ZXh0ID0gY29udGV4dDtcbiAgICB9XG5cbiAgICBpbml0aWFsaXplKCkge1xuICAgICAgICBpZiAodGhpcy5jb250ZXh0LnNldHRpbmdzLnJlbW90ZVByb2Nlc3NpbmcpIHtcbiAgICAgICAgICAgIHRoaXMuY29udGV4dC5ldmVudHMuc3Vic2NyaWJlKFwicmVuZGVyXCIsIHRoaXMucmVuZGVyUmVtb3RlLCB0cnVlLCAxMCk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB0aGlzLmNvbnRleHQuZXZlbnRzLnN1YnNjcmliZShcInJlbmRlclwiLCB0aGlzLnJlbmRlckxvY2FsLCBmYWxzZSwgMTApO1xuICAgICAgICB9XG4gICAgfVxuICAgIC8qKlxuICAgICAqIFJlbmRlcnMgdGhlIGdyaWQgcm93cyB1c2luZyBsb2NhbCBkYXRhLiAgVGhpcyBpcyB0aGUgZGVmYXVsdCBtZXRob2QgdG8gcmVuZGVyIHJvd3Mgd2hlbiByZW1vdGUgcHJvY2Vzc2luZyBpcyBub3QgZW5hYmxlZC5cbiAgICAgKi9cbiAgICByZW5kZXJMb2NhbCA9ICgpID0+IHtcbiAgICAgICAgdGhpcy5jb250ZXh0LmdyaWQucmVuZGVyUm93cyh0aGlzLmNvbnRleHQucGVyc2lzdGVuY2UuZGF0YSk7XG4gICAgfTtcbiAgICAvKipcbiAgICAgKiBSZW5kZXJzIHRoZSBncmlkIHJvd3MgdXNpbmcgcmVtb3RlIGRhdGEuICBUaGlzIG1ldGhvZCB3aWxsIGNhbGwgdGhlIGByZW1vdGVQYXJhbXNgIGV2ZW50IHRvIGdldCB0aGUgcGFyYW1ldGVycyBmb3IgdGhlIHJlbW90ZSByZXF1ZXN0LlxuICAgICAqL1xuICAgIHJlbmRlclJlbW90ZSA9IGFzeW5jICgpID0+IHtcbiAgICAgICAgY29uc3QgcGFyYW1zID0gdGhpcy5jb250ZXh0LmV2ZW50cy5jaGFpbihcInJlbW90ZVBhcmFtc1wiLCB7fSk7XG4gICAgICAgIGNvbnN0IGRhdGEgPSBhd2FpdCB0aGlzLmNvbnRleHQuZGF0YWxvYWRlci5yZXF1ZXN0R3JpZERhdGEocGFyYW1zKTtcblxuICAgICAgICB0aGlzLmNvbnRleHQuZ3JpZC5yZW5kZXJSb3dzKGRhdGEpO1xuICAgIH07XG59XG5cblJvd01vZHVsZS5tb2R1bGVOYW1lID0gXCJyb3dcIjtcblxuZXhwb3J0IHsgUm93TW9kdWxlIH07IiwiLyoqXG4gKiBVcGRhdGVzIHRhcmdldCBsYWJlbCB3aXRoIGEgY291bnQgb2Ygcm93cyBpbiBncmlkLlxuICovXG5jbGFzcyBSb3dDb3VudE1vZHVsZSB7XG4gICAgLyoqXG4gICAgICogVXBkYXRlcyB0YXJnZXQgbGFiZWwgc3VwcGxpZWQgaW4gc2V0dGluZ3Mgd2l0aCBhIGNvdW50IG9mIHJvd3MgaW4gZ3JpZC5cbiAgICAgKiBAcGFyYW0ge0dyaWRDb250ZXh0fSBjb250ZXh0IEdyaWQgY29udGV4dCBjbGFzcy5cbiAgICAgKi9cbiAgICBjb25zdHJ1Y3Rvcihjb250ZXh0KSB7XG4gICAgICAgIHRoaXMuY29udGV4dCA9IGNvbnRleHQ7XG4gICAgICAgIHRoaXMuZWxlbWVudCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKGNvbnRleHQuc2V0dGluZ3Mucm93Q291bnRJZCk7XG4gICAgfVxuXG4gICAgaW5pdGlhbGl6ZSgpIHtcbiAgICAgICAgdGhpcy5jb250ZXh0LmV2ZW50cy5zdWJzY3JpYmUoXCJyZW5kZXJcIiwgdGhpcy5oYW5kbGVDb3VudCwgZmFsc2UsIDIwKTtcbiAgICB9XG5cbiAgICBoYW5kbGVDb3VudCA9ICgpID0+IHtcbiAgICAgICAgdGhpcy5lbGVtZW50LmlubmVyVGV4dCA9IHRoaXMuY29udGV4dC5ncmlkLnJvd0NvdW50O1xuICAgIH07XG59XG5cblJvd0NvdW50TW9kdWxlLm1vZHVsZU5hbWUgPSBcInJvd2NvdW50XCI7XG5cbmV4cG9ydCB7IFJvd0NvdW50TW9kdWxlIH07IiwiLyoqXG4gKiBDbGFzcyB0byBtYW5hZ2Ugc29ydGluZyBmdW5jdGlvbmFsaXR5IGluIGEgZ3JpZCBjb250ZXh0LiAgRm9yIHJlbW90ZSBwcm9jZXNzaW5nLCB3aWxsIHN1YnNjcmliZSB0byB0aGUgYHJlbW90ZVBhcmFtc2AgZXZlbnQuXG4gKiBGb3IgbG9jYWwgcHJvY2Vzc2luZywgd2lsbCBzdWJzY3JpYmUgdG8gdGhlIGByZW5kZXJgIGV2ZW50LlxuICogXG4gKiBDbGFzcyB3aWxsIHRyaWdnZXIgdGhlIGByZW5kZXJgIGV2ZW50IGFmdGVyIHNvcnRpbmcgaXMgYXBwbGllZCwgYWxsb3dpbmcgdGhlIGdyaWQgdG8gcmUtcmVuZGVyIHdpdGggdGhlIHNvcnRlZCBkYXRhLlxuICovXG5jbGFzcyBTb3J0TW9kdWxlIHtcbiAgICAvKipcbiAgICAgKiBDcmVhdGVzIGEgbmV3IFNvcnRNb2R1bGUgb2JqZWN0LlxuICAgICAqIEBwYXJhbSB7R3JpZENvbnRleHR9IGNvbnRleHQgXG4gICAgICovXG4gICAgY29uc3RydWN0b3IoY29udGV4dCkge1xuICAgICAgICB0aGlzLmNvbnRleHQgPSBjb250ZXh0O1xuICAgICAgICB0aGlzLmhlYWRlckNlbGxzID0gW107XG4gICAgICAgIHRoaXMuY3VycmVudFNvcnRDb2x1bW4gPSBcIlwiO1xuICAgICAgICB0aGlzLmN1cnJlbnREaXJlY3Rpb24gPSBcIlwiO1xuICAgICAgICB0aGlzLmN1cnJlbnRUeXBlID0gXCJcIjtcbiAgICB9XG5cbiAgICBpbml0aWFsaXplKCkge1xuICAgICAgICBpZiAodGhpcy5jb250ZXh0LnNldHRpbmdzLnJlbW90ZVByb2Nlc3NpbmcpIHtcbiAgICAgICAgICAgIHRoaXMuY3VycmVudFNvcnRDb2x1bW4gPSB0aGlzLmNvbnRleHQuc2V0dGluZ3MucmVtb3RlU29ydERlZmF1bHRDb2x1bW47XG4gICAgICAgICAgICB0aGlzLmN1cnJlbnREaXJlY3Rpb24gPSB0aGlzLmNvbnRleHQuc2V0dGluZ3MucmVtb3RlU29ydERlZmF1bHREaXJlY3Rpb247XG4gICAgICAgICAgICB0aGlzLmNvbnRleHQuZXZlbnRzLnN1YnNjcmliZShcInJlbW90ZVBhcmFtc1wiLCB0aGlzLnJlbW90ZVBhcmFtcywgdHJ1ZSk7XG4gICAgICAgICAgICB0aGlzLl9pbml0KHRoaXMuaGFuZGxlUmVtb3RlKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHRoaXMuY29udGV4dC5ldmVudHMuc3Vic2NyaWJlKFwicmVuZGVyXCIsIHRoaXMucmVuZGVyTG9jYWwsIGZhbHNlLCA5KTtcbiAgICAgICAgICAgIC8vdGhpcy5zb3J0ZXJzID0geyBudW1iZXI6IHNvcnROdW1iZXIsIHN0cmluZzogc29ydFN0cmluZywgZGF0ZTogc29ydERhdGUsIGRhdGV0aW1lOiBzb3J0RGF0ZSB9O1xuICAgICAgICAgICAgdGhpcy5zb3J0ZXJzID0gdGhpcy4jc2V0TG9jYWxGaWx0ZXJzKCk7XG4gICAgICAgICAgICB0aGlzLl9pbml0KHRoaXMuaGFuZGxlTG9jYWwpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgX2luaXQoY2FsbGJhY2spIHtcbiAgICAgICAgLy9iaW5kIGxpc3RlbmVyIGZvciBub24taWNvbiBjb2x1bW5zOyBhZGQgY3NzIHNvcnQgdGFnLlxuICAgICAgICBmb3IgKGNvbnN0IGNvbCBvZiB0aGlzLmNvbnRleHQuY29sdW1uTWFuYWdlci5jb2x1bW5zKSB7XG4gICAgICAgICAgICBpZiAoY29sLnR5cGUgIT09IFwiaWNvblwiKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5oZWFkZXJDZWxscy5wdXNoKGNvbC5oZWFkZXJDZWxsKTtcbiAgICAgICAgICAgICAgICBjb2wuaGVhZGVyQ2VsbC5zcGFuLmNsYXNzTGlzdC5hZGQoXCJzb3J0XCIpO1xuICAgICAgICAgICAgICAgIGNvbC5oZWFkZXJDZWxsLnNwYW4uYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsIGNhbGxiYWNrKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cblxuICAgICNzZXRMb2NhbEZpbHRlcnMoKSB7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICBkYXRlOiAoYSwgYiwgZGlyZWN0aW9uKSA9PiB7XG4gICAgICAgICAgICAgICAgbGV0IGNvbXBhcmlzb24gPSAwO1xuICAgICAgICAgICAgICAgIGxldCBkYXRlQSA9IG5ldyBEYXRlKGEpO1xuICAgICAgICAgICAgICAgIGxldCBkYXRlQiA9IG5ldyBEYXRlKGIpO1xuXG4gICAgICAgICAgICAgICAgaWYgKE51bWJlci5pc05hTihkYXRlQS52YWx1ZU9mKCkpKSB7XG4gICAgICAgICAgICAgICAgICAgIGRhdGVBID0gbnVsbDtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICBpZiAoTnVtYmVyLmlzTmFOKGRhdGVCLnZhbHVlT2YoKSkpIHtcbiAgICAgICAgICAgICAgICAgICAgZGF0ZUIgPSBudWxsO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAvL2hhbmRsZSBlbXB0eSB2YWx1ZXMuXG4gICAgICAgICAgICAgICAgaWYgKCFkYXRlQSkge1xuICAgICAgICAgICAgICAgICAgICBjb21wYXJpc29uID0gIWRhdGVCID8gMCA6IC0xO1xuICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAoIWRhdGVCKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbXBhcmlzb24gPSAxO1xuICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAoZGF0ZUEgPiBkYXRlQikgeyAgICBcbiAgICAgICAgICAgICAgICAgICAgY29tcGFyaXNvbiA9IDE7XG4gICAgICAgICAgICAgICAgfSBlbHNlIGlmIChkYXRlQSA8IGRhdGVCKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbXBhcmlzb24gPSAtMTtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICByZXR1cm4gZGlyZWN0aW9uID09PSBcImRlc2NcIiA/IChjb21wYXJpc29uICogLTEpIDogY29tcGFyaXNvbjtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBudW1iZXI6IChhLCBiLCBkaXJlY3Rpb24pID0+IHtcbiAgICAgICAgICAgICAgICBsZXQgY29tcGFyaXNvbiA9IDA7XG5cbiAgICAgICAgICAgICAgICBpZiAoYSA+IGIpIHtcbiAgICAgICAgICAgICAgICAgICAgY29tcGFyaXNvbiA9IDE7XG4gICAgICAgICAgICAgICAgfSBlbHNlIGlmIChhIDwgYikge1xuICAgICAgICAgICAgICAgICAgICBjb21wYXJpc29uID0gLTE7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgcmV0dXJuIGRpcmVjdGlvbiA9PT0gXCJkZXNjXCIgPyAoY29tcGFyaXNvbiAqIC0xKSA6IGNvbXBhcmlzb247XG4gICAgICAgICAgICB9LCBcbiAgICAgICAgICAgIHN0cmluZzogKGEsIGIsIGRpcmVjdGlvbikgPT4ge1xuICAgICAgICAgICAgICAgIGxldCBjb21wYXJpc29uID0gMDtcbiAgICAgICAgICAgICAgICAvL2hhbmRsZSBlbXB0eSB2YWx1ZXMuXG4gICAgICAgICAgICAgICAgaWYgKCFhKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbXBhcmlzb24gPSAhYiA/IDAgOiAtMTtcbiAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKCFiKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbXBhcmlzb24gPSAxO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHZhckEgPSBhLnRvVXBwZXJDYXNlKCk7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHZhckIgPSBiLnRvVXBwZXJDYXNlKCk7XG4gICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgICAgIGlmICh2YXJBID4gdmFyQikge1xuICAgICAgICAgICAgICAgICAgICAgICAgY29tcGFyaXNvbiA9IDE7XG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAodmFyQSA8IHZhckIpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbXBhcmlzb24gPSAtMTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIHJldHVybiBkaXJlY3Rpb24gPT09IFwiZGVzY1wiID8gKGNvbXBhcmlzb24gKiAtMSkgOiBjb21wYXJpc29uO1xuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuICAgIH1cblxuICAgIHJlbW90ZVBhcmFtcyA9IChwYXJhbXMpID0+IHtcbiAgICAgICAgcGFyYW1zLnNvcnQgPSB0aGlzLmN1cnJlbnRTb3J0Q29sdW1uO1xuICAgICAgICBwYXJhbXMuZGlyZWN0aW9uID0gdGhpcy5jdXJyZW50RGlyZWN0aW9uO1xuXG4gICAgICAgIHJldHVybiBwYXJhbXM7XG4gICAgfTtcblxuICAgIGhhbmRsZVJlbW90ZSA9IGFzeW5jIChjKSA9PiB7XG4gICAgICAgIHRoaXMuY3VycmVudFNvcnRDb2x1bW4gPSBjLmN1cnJlbnRUYXJnZXQuY29udGV4dC5uYW1lO1xuICAgICAgICB0aGlzLmN1cnJlbnREaXJlY3Rpb24gPSBjLmN1cnJlbnRUYXJnZXQuY29udGV4dC5kaXJlY3Rpb25OZXh0LnZhbHVlT2YoKTtcbiAgICAgICAgdGhpcy5jdXJyZW50VHlwZSA9IGMuY3VycmVudFRhcmdldC5jb250ZXh0LnR5cGU7XG5cbiAgICAgICAgaWYgKCFjLmN1cnJlbnRUYXJnZXQuY29udGV4dC5pc0N1cnJlbnRTb3J0KSB7XG4gICAgICAgICAgICB0aGlzLnJlc2V0U29ydCgpO1xuICAgICAgICB9XG5cbiAgICAgICAgYy5jdXJyZW50VGFyZ2V0LmNvbnRleHQuc2V0U29ydEZsYWcoKTtcblxuICAgICAgICBhd2FpdCB0aGlzLmNvbnRleHQuZXZlbnRzLnRyaWdnZXIoXCJyZW5kZXJcIik7XG4gICAgfTtcblxuICAgIHJlc2V0U29ydCgpIHtcbiAgICAgICAgY29uc3QgY2VsbCA9IHRoaXMuaGVhZGVyQ2VsbHMuZmluZChlID0+IGUuaXNDdXJyZW50U29ydCk7XG5cbiAgICAgICAgaWYgKGNlbGwgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgY2VsbC5yZW1vdmVTb3J0RmxhZygpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgcmVuZGVyTG9jYWwgPSAoKSA9PiB7XG4gICAgICAgIGlmICghdGhpcy5jdXJyZW50U29ydENvbHVtbikgcmV0dXJuO1xuXG4gICAgICAgIHRoaXMuY29udGV4dC5wZXJzaXN0ZW5jZS5kYXRhLnNvcnQoKGEsIGIpID0+IHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLnNvcnRlcnNbdGhpcy5jdXJyZW50VHlwZV0oYVt0aGlzLmN1cnJlbnRTb3J0Q29sdW1uXSwgYlt0aGlzLmN1cnJlbnRTb3J0Q29sdW1uXSwgdGhpcy5jdXJyZW50RGlyZWN0aW9uKTtcbiAgICAgICAgfSk7XG4gICAgfTtcblxuICAgIGhhbmRsZUxvY2FsID0gYXN5bmMgKGMpID0+IHtcbiAgICAgICAgdGhpcy5jdXJyZW50U29ydENvbHVtbiA9IGMuY3VycmVudFRhcmdldC5jb250ZXh0Lm5hbWU7XG4gICAgICAgIHRoaXMuY3VycmVudERpcmVjdGlvbiA9IGMuY3VycmVudFRhcmdldC5jb250ZXh0LmRpcmVjdGlvbk5leHQudmFsdWVPZigpO1xuICAgICAgICB0aGlzLmN1cnJlbnRUeXBlID0gYy5jdXJyZW50VGFyZ2V0LmNvbnRleHQudHlwZTtcblxuICAgICAgICBpZiAoIWMuY3VycmVudFRhcmdldC5jb250ZXh0LmlzQ3VycmVudFNvcnQpIHtcbiAgICAgICAgICAgIHRoaXMucmVzZXRTb3J0KCk7XG4gICAgICAgIH1cblxuICAgICAgICBjLmN1cnJlbnRUYXJnZXQuY29udGV4dC5zZXRTb3J0RmxhZygpO1xuXG4gICAgICAgIGF3YWl0IHRoaXMuY29udGV4dC5ldmVudHMudHJpZ2dlcihcInJlbmRlclwiKTtcbiAgICB9O1xufVxuXG5Tb3J0TW9kdWxlLm1vZHVsZU5hbWUgPSBcInNvcnRcIjtcblxuZXhwb3J0IHsgU29ydE1vZHVsZSB9OyIsImltcG9ydCB7IEdyaWRDb250ZXh0IH0gZnJvbSBcIi4uL2NvbXBvbmVudHMvY29udGV4dC9ncmlkQ29udGV4dC5qc1wiO1xuaW1wb3J0IHsgTWVyZ2VPcHRpb25zIH0gZnJvbSBcIi4uL3NldHRpbmdzL21lcmdlT3B0aW9ucy5qc1wiO1xuaW1wb3J0IHsgU2V0dGluZ3NHcmlkIH0gZnJvbSBcIi4uL3NldHRpbmdzL3NldHRpbmdzR3JpZC5qc1wiO1xuaW1wb3J0IHsgUm93TW9kdWxlIH0gZnJvbSBcIi4uL21vZHVsZXMvcm93L3Jvd01vZHVsZS5qc1wiO1xuaW1wb3J0IHsgUGFnZXJNb2R1bGUgfSBmcm9tIFwiLi4vbW9kdWxlcy9wYWdlci9wYWdlck1vZHVsZS5qc1wiO1xuLyoqXG4gKiBDcmVhdGVzIGdyaWQncyBjb3JlIHByb3BlcnRpZXMgYW5kIG9iamVjdHMsIGFuZCBhbGxvd3MgZm9yIHJlZ2lzdHJhdGlvbiBvZiBtb2R1bGVzIHVzZWQgdG8gYnVpbGQgZnVuY3Rpb25hbGl0eS5cbiAqIFVzZSB0aGlzIGNsYXNzIGFzIGEgYmFzZSBjbGFzcyB0byBjcmVhdGUgYSBncmlkIHdpdGggY3VzdG9tIG1vZHVsYXIgZnVuY3Rpb25hbGl0eSB1c2luZyB0aGUgYGV4dGVuZHNgIGNsYXNzIHJlZmVyZW5jZS5cbiAqL1xuY2xhc3MgR3JpZENvcmUge1xuICAgICNtb2R1bGVUeXBlcztcbiAgICAjbW9kdWxlc0NyZWF0ZWQ7XG4gICAgLyoqXG4gICAgKiBDcmVhdGVzIGdyaWQncyBjb3JlIHByb3BlcnRpZXMgYW5kIG9iamVjdHMgYW5kIGlkZW50aWZpZXMgZGl2IGVsZW1lbnQgd2hpY2ggZ3JpZCB3aWxsIGJlIGJ1aWx0LiAgQWZ0ZXIgaW5zdGFudGlhdGlvbiwgXG4gICAgKiB1c2UgdGhlIGBhZGRNb2R1bGVzYCBtZXRob2QgdG8gcmVnaXN0ZXIgZGVzaXJlZCBtb2R1bGVzIHRvIGNvbXBsZXRlIHRoZSBzZXR1cCBwcm9jZXNzLiAgTW9kdWxlIHJlZ2lzdHJhdGlvbiBpcyBrZXB0IFxuICAgICogc2VwYXJhdGUgZnJvbSBjb25zdHJ1Y3RvciB0byBhbGxvdyBjdXN0b21pemF0aW9uIG9mIG1vZHVsZXMgdXNlZCB0byBidWlsZCBncmlkLlxuICAgICogQHBhcmFtIHtzdHJpbmd9IGNvbnRhaW5lciBkaXYgZWxlbWVudCBJRCB0byBidWlsZCBncmlkIGluLlxuICAgICogQHBhcmFtIHtvYmplY3R9IHNldHRpbmdzIFVzZXIgc2V0dGluZ3M7IGtleS92YWx1ZSBwYWlycy5cbiAgICAqL1xuICAgIGNvbnN0cnVjdG9yKGNvbnRhaW5lciwgc2V0dGluZ3MpIHtcbiAgICAgICAgY29uc3Qgc291cmNlID0gTWVyZ2VPcHRpb25zLm1lcmdlKHNldHRpbmdzKTtcblxuICAgICAgICB0aGlzLnNldHRpbmdzID0gbmV3IFNldHRpbmdzR3JpZChzb3VyY2UpO1xuICAgICAgICB0aGlzLmNvbnRhaW5lciA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKGNvbnRhaW5lcik7XG4gICAgICAgIHRoaXMuZW5hYmxlUGFnaW5nID0gdGhpcy5zZXR0aW5ncy5lbmFibGVQYWdpbmc7XG4gICAgICAgIHRoaXMuaXNWYWxpZCA9IHRydWU7XG4gICAgICAgIHRoaXMuI21vZHVsZVR5cGVzID0gW107XG4gICAgICAgIHRoaXMuI21vZHVsZXNDcmVhdGVkID0gZmFsc2U7XG4gICAgICAgIHRoaXMubW9kdWxlcyA9IHt9O1xuXG4gICAgICAgIGlmIChPYmplY3QudmFsdWVzKHNvdXJjZS5jb2x1bW5zKS5sZW5ndGggPT09IDApIHtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiTWlzc2luZyByZXF1aXJlZCBjb2x1bW5zIGRlZmluaXRpb24uXCIpO1xuICAgICAgICAgICAgdGhpcy5pc1ZhbGlkID0gZmFsc2U7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBjb25zdCBkYXRhID0gc291cmNlLmRhdGEgPz8gW107XG4gICAgICAgICAgICB0aGlzLiNpbml0KHNvdXJjZS5jb2x1bW5zLCBkYXRhKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgICNpbml0KGNvbHVtbnMsIGRhdGEpIHtcbiAgICAgICAgdGhpcy5jb250ZXh0ID0gbmV3IEdyaWRDb250ZXh0KGNvbHVtbnMsIHRoaXMuc2V0dGluZ3MsIGRhdGEpO1xuXG4gICAgICAgIHRoaXMuY29udGFpbmVyLmFwcGVuZCh0aGlzLmNvbnRleHQuZ3JpZC50YWJsZSk7XG4gICAgfVxuICAgIC8qKlxuICAgICAqIFJlZ2lzdGVyIG1vZHVsZXMgdG8gYmUgdXNlZCBpbiB0aGUgYnVpbGRpbmcgYW5kIG9wZXJhdGlvbiBvZiB0aGUgZ3JpZC4gIFxuICAgICAqIFxuICAgICAqIE5PVEU6IFRoaXMgbWV0aG9kIHNob3VsZCBiZSBjYWxsZWQgYmVmb3JlIHRoZSBgaW5pdCgpYCBtZXRob2QuXG4gICAgICogQHBhcmFtIHtjbGFzc30gbW9kdWxlcyBDbGFzcyBtb2R1bGUocykuXG4gICAgICovXG4gICAgYWRkTW9kdWxlcyguLi5tb2R1bGVzKSB7XG4gICAgICAgIG1vZHVsZXMuZm9yRWFjaCgobSkgPT4gdGhpcy4jbW9kdWxlVHlwZXMucHVzaChtKSk7XG4gICAgfVxuICAgIC8qKlxuICAgICAqIEFkZHMgYSBuZXcgY29sdW1uIHRvIHRoZSBncmlkLiAgVGhlIGNvbHVtbiB3aWxsIGJlIGFkZGVkIHRvIHRoZSBlbmQgb2YgdGhlIGNvbHVtbnMgY29sbGVjdGlvbiBieSBkZWZhdWx0LCBidXQgY2FuIFxuICAgICAqIGJlIGluc2VydGVkIGF0IGEgc3BlY2lmaWMgaW5kZXguICBcbiAgICAgKiBcbiAgICAgKiBOT1RFOiBUaGlzIG1ldGhvZCBzaG91bGQgYmUgY2FsbGVkIGJlZm9yZSB0aGUgYGluaXQoKWAgbWV0aG9kLlxuICAgICAqIEBwYXJhbSB7T2JqZWN0fSBjb2x1bW4gQ29sdW1uIG9iamVjdCBkZWZpbml0aW9uLlxuICAgICAqIEBwYXJhbSB7bnVtYmVyfSBbaW5kZXhQb3NpdGlvbj1udWxsXSBJbmRleCB0byBpbnNlcnQgdGhlIGNvbHVtbiBhdC4gSWYgbnVsbCwgYXBwZW5kcyB0byB0aGUgZW5kLlxuICAgICAqL1xuICAgIGFkZENvbHVtbihjb2x1bW4sIGluZGV4UG9zaXRpb24gPSBudWxsKSB7XG4gICAgICAgIHRoaXMuY29udGV4dC5jb2x1bW5NYW5hZ2VyLmFkZENvbHVtbihjb2x1bW4sIGluZGV4UG9zaXRpb24pO1xuICAgIH1cbiAgICAvKipcbiAgICAgKiBJdGVyYXRlcyB0aG91Z2ggYSBsaXN0IG9mIG1vZHVsZXMgdG8gaW5zdGFudGlhdGUgYW5kIGluaXRpYWxpemUgc3RhcnQgdXAgYW5kL29yIGJ1aWxkIGJlaGF2aW9yLiAgU2hvdWxkIGJlIGNhbGxlZCBhZnRlciBcbiAgICAgKiBhbGwgbW9kdWxlcyBoYXZlIGJlZW4gcmVnaXN0ZXJlZCB1c2luZyB0aGUgYGFkZE1vZHVsZXNgIG1ldGhvZCwgYW5kIG9ubHkgbmVlZHMgdG8gYmUgY2FsbGVkIG9uY2UuXG4gICAgICovXG4gICAgI2luaXRNb2R1bGVzID0gYXN5bmMgKCkgPT4ge1xuICAgICAgICBpZiAodGhpcy4jbW9kdWxlc0NyZWF0ZWQpXG4gICAgICAgICAgICByZXR1cm47XG5cbiAgICAgICAgLy9WZXJpZnkgaWYgYmFzZSByZXF1aXJlZCByb3cgcmVsYXRlZCBtb2R1bGUgaGFzIGJlZW4gYWRkZWQgdG8gdGhlIGdyaWQuXG4gICAgICAgIGlmICh0aGlzLnNldHRpbmdzLmVuYWJsZVBhZ2luZyAmJiAhdGhpcy4jbW9kdWxlVHlwZXMuc29tZSgoeCkgPT4geC5tb2R1bGVOYW1lID09PSBcInBhZ2VcIikpIHtcbiAgICAgICAgICAgIHRoaXMuI21vZHVsZVR5cGVzLnB1c2goUGFnZXJNb2R1bGUpO1xuICAgICAgICB9IGVsc2UgaWYgKCF0aGlzLiNtb2R1bGVUeXBlcy5zb21lKCh4KSA9PiB4Lm1vZHVsZU5hbWUgPT09IFwicm93XCIpKSB7XG4gICAgICAgICAgICAgdGhpcy4jbW9kdWxlVHlwZXMucHVzaChSb3dNb2R1bGUpO1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy4jbW9kdWxlVHlwZXMuZm9yRWFjaCgobSkgPT4ge1xuICAgICAgICAgICAgdGhpcy5jb250ZXh0Lm1vZHVsZXNbbS5tb2R1bGVOYW1lXSA9IG5ldyBtKHRoaXMuY29udGV4dCk7XG4gICAgICAgICAgICB0aGlzLmNvbnRleHQubW9kdWxlc1ttLm1vZHVsZU5hbWVdLmluaXRpYWxpemUoKTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgdGhpcy4jbW9kdWxlc0NyZWF0ZWQgPSB0cnVlO1xuICAgICAgICBhd2FpdCB0aGlzLmNvbnRleHQuZXZlbnRzLnRyaWdnZXIoXCJwb3N0SW5pdE1vZFwiKTtcbiAgICB9O1xuICAgIC8qKlxuICAgICAqIEluc3RhbnRpYXRlcyB0aGUgY3JlYXRpb24gb2YgdGhlIGdyaWQuICBNZXRob2Qgd2lsbCBjcmVhdGUgdGhlIGdyaWQncyBlbGVtZW50cywgcnVuIGFsbCByZWdpc3RlcmVkIG1vZHVsZXMsIGRhdGEgcHJvY2Vzc2luZyBcbiAgICAgKiBwaXBlbGluZXMgYW5kIGV2ZW50cy4gIElmIGdyaWQgaXMgYmVpbmcgYnVpbHQgdXNpbmcgdGhlIG1vZHVsYXIgYXBwcm9hY2gsIGJlIHN1cmUgdG8gY2FsbCB0aGUgYGFkZE1vZHVsZXNgIG1ldGhvZCBiZWZvcmUgXG4gICAgICogY2FsbGluZyB0aGlzIG9uZSB0byBlbnN1cmUgYWxsIG1vZHVsZXMgYXJlIHJlZ2lzdGVyZWQgYW5kIGluaXRpYWxpemVkIGluIHRoZWlyIHByb3BlciBvcmRlci5cbiAgICAgKiBcbiAgICAgKiBOT1RFOiBNZXRob2Qgd2lsbCBhdXRvbWF0aWNhbGx5IHJlZ2lzdGVyIHRoZSBgUGFnZXJNb2R1bGVgIGlmIHBhZ2luZyBpcyBlbmFibGVkLCBvciB0aGUgYFJvd01vZHVsZWAgaWYgcGFnaW5nIGlzIG5vdCBlbmFibGVkLlxuICAgICAqL1xuICAgIGFzeW5jIGluaXQoKSB7XG4gICAgICAgIGlmICghdGhpcy5pc1ZhbGlkKSB7XG4gICAgICAgICAgICBjb25zb2xlLmxvZyhcIk1pc3NpbmcgcmVxdWlyZWQgY29sdW1ucyBkZWZpbml0aW9uLlwiKTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMuY29udGV4dC5ncmlkLmluaXRpYWxpemVIZWFkZXIoKTtcblxuICAgICAgICBhd2FpdCB0aGlzLiNpbml0TW9kdWxlcygpO1xuXG4gICAgICAgIGlmICghdGhpcy5zZXR0aW5ncy5yZW1vdGVQcm9jZXNzaW5nICYmIHRoaXMuc2V0dGluZ3MucmVtb3RlVXJsKSB7XG4gICAgICAgICAgICAvL2xvY2FsIGRhdGEgc291cmNlIHByb2Nlc3Npbmc7IHNldCBwaXBlbGluZSBhY3Rpb25zLlxuICAgICAgICAgICAgdGhpcy5jb250ZXh0LnBpcGVsaW5lLmFkZFN0ZXAoXCJpbml0XCIsIHRoaXMuY29udGV4dC5wZXJzaXN0ZW5jZS5zZXREYXRhKTtcbiAgICAgICAgfVxuICAgICAgICAvL2V4ZWN1dGUgZGF0YSBwaXBlbGluZSBiZWZvcmUgYnVpbGRpbmcgZWxlbWVudHMuXG4gICAgICAgIGlmICh0aGlzLmNvbnRleHQucGlwZWxpbmUuaGFzUGlwZWxpbmUoXCJpbml0XCIpKSB7XG4gICAgICAgICAgICBhd2FpdCB0aGlzLmNvbnRleHQucGlwZWxpbmUuZXhlY3V0ZShcImluaXRcIik7XG4gICAgICAgIH1cblxuICAgICAgICBhd2FpdCB0aGlzLmNvbnRleHQuZXZlbnRzLnRyaWdnZXIoXCJyZW5kZXJcIik7XG4gICAgfVxuICAgIC8qKlxuICAgICAqIEFwcGx5IGZpbHRlciBjb25kaXRpb24gZm9yIHRhcmdldCBjb2x1bW4uICBNZXRob2QgcHJvdmlkZXMgYSBtZWFucyB0byBhcHBseSBjb25kaXRpb24gb3V0c2lkZSBvZiBoZWFkZXIgZmlsdGVyIGNvbnRyb2xzLlxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBmaWVsZCBUYXJnZXQgZmllbGQuXG4gICAgICogQHBhcmFtIHtvYmplY3R9IHZhbHVlIEZpbHRlciB2YWx1ZS5cbiAgICAgKiBAcGFyYW0ge3N0cmluZyB8IEZ1bmN0aW9ufSBbdHlwZT1cImVxdWFsc1wiXSBGaWx0ZXIgdHlwZS4gIElmIGEgZnVuY3Rpb24gaXMgcHJvdmlkZWQsIGl0IHdpbGwgYmUgdXNlZCBhcyB0aGUgZmlsdGVyIGNvbmRpdGlvbi5cbiAgICAgKiBPdGhlcndpc2UsIHVzZSB0aGUgYXNzb2NpYXRlZCBzdHJpbmcgdmFsdWUgdHlwZSB0byBkZXRlcm1pbmUgdGhlIGZpbHRlciBjb25kaXRpb24uICBpLmUuIFwiZXF1YWxzXCIsIFwiY29udGFpbnNcIiwgZXRjLlxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBbZmllbGRUeXBlPVwic3RyaW5nXCJdIEZpZWxkIHR5cGUuXG4gICAgICogQHBhcmFtIHtvYmplY3R9IFtmaWx0ZXJQYXJhbXM9e31dIEFkZGl0aW9uYWwgZmlsdGVyIHBhcmFtZXRlcnMuXG4gICAgICovXG4gICAgc2V0RmlsdGVyID0gYXN5bmMgKGZpZWxkLCB2YWx1ZSwgdHlwZSA9IFwiZXF1YWxzXCIsIGZpZWxkVHlwZSA9IFwic3RyaW5nXCIsIGZpbHRlclBhcmFtcyA9IHt9KSA9PiB7XG4gICAgICAgIGlmICh0aGlzLmNvbnRleHQubW9kdWxlcy5maWx0ZXIpIHtcbiAgICAgICAgICAgIHRoaXMuY29udGV4dC5tb2R1bGVzLmZpbHRlci5zZXRGaWx0ZXIoZmllbGQsIHZhbHVlLCB0eXBlLCBmaWVsZFR5cGUsIGZpbHRlclBhcmFtcyk7XG5cbiAgICAgICAgICAgIGF3YWl0IHRoaXMuY29udGV4dC5ldmVudHMudHJpZ2dlcihcInJlbmRlclwiKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGNvbnNvbGUud2FybihcIkZpbHRlciBtb2R1bGUgaXMgbm90IGVuYWJsZWQuICBTZXQgYERhdGFHcmlkLmRlZmF1bHRPcHRpb25zLmVuYWJsZUZpbHRlcmAgdG8gdHJ1ZSBpbiBvcmRlciB0byBlbmFibGUgdGhpcyBmdW5jdGlvbi5cIik7XG4gICAgICAgIH1cbiAgICB9O1xuICAgIC8qKlxuICAgICAqIFJlbW92ZSBmaWx0ZXIgY29uZGl0aW9uIGZvciB0YXJnZXQgZmllbGQuXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IGZpZWxkIFRhcmdldCBmaWVsZC5cbiAgICAgKi9cbiAgICByZW1vdmVGaWx0ZXIgPSBhc3luYyAoZmllbGQpID0+IHtcbiAgICAgICAgaWYgKHRoaXMuY29udGV4dC5tb2R1bGVzLmZpbHRlcikge1xuICAgICAgICAgICAgdGhpcy5jb250ZXh0Lm1vZHVsZXMuZmlsdGVyLnJlbW92ZUZpbHRlcihmaWVsZCk7XG5cbiAgICAgICAgICAgIGF3YWl0IHRoaXMuY29udGV4dC5ldmVudHMudHJpZ2dlcihcInJlbmRlclwiKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGNvbnNvbGUud2FybihcIkZpbHRlciBtb2R1bGUgaXMgbm90IGVuYWJsZWQuICBTZXQgYERhdGFHcmlkLmRlZmF1bHRPcHRpb25zLmVuYWJsZUZpbHRlcmAgdG8gdHJ1ZSBpbiBvcmRlciB0byBlbmFibGUgdGhpcyBmdW5jdGlvbi5cIik7XG4gICAgICAgIH1cbiAgICB9O1xufVxuXG5leHBvcnQgeyBHcmlkQ29yZSB9OyIsImltcG9ydCB7IEdyaWRDb3JlIH0gZnJvbSBcIi4vY29yZS9ncmlkQ29yZS5qc1wiO1xuaW1wb3J0IHsgQ3N2TW9kdWxlIH0gZnJvbSBcIi4vbW9kdWxlcy9kb3dubG9hZC9jc3ZNb2R1bGUuanNcIjtcbmltcG9ydCB7IEZpbHRlck1vZHVsZSB9IGZyb20gXCIuL21vZHVsZXMvZmlsdGVyL2ZpbHRlck1vZHVsZS5qc1wiO1xuaW1wb3J0IHsgUmVmcmVzaE1vZHVsZSB9IGZyb20gXCIuL21vZHVsZXMvcmVmcmVzaC9yZWZyZXNoTW9kdWxlLmpzXCI7XG5pbXBvcnQgeyBSb3dDb3VudE1vZHVsZSB9IGZyb20gXCIuL21vZHVsZXMvcm93L3Jvd0NvdW50TW9kdWxlLmpzXCI7XG5pbXBvcnQgeyBTb3J0TW9kdWxlIH0gZnJvbSBcIi4vbW9kdWxlcy9zb3J0L3NvcnRNb2R1bGUuanNcIjtcblxuY2xhc3MgRGF0YUdyaWQgZXh0ZW5kcyBHcmlkQ29yZSB7XG4gICAgY29uc3RydWN0b3IoY29udGFpbmVyLCBzZXR0aW5ncykge1xuICAgICAgICBzdXBlcihjb250YWluZXIsIHNldHRpbmdzKTtcblxuICAgICAgICBpZiAoRGF0YUdyaWQuZGVmYXVsdE9wdGlvbnMuZW5hYmxlRmlsdGVyKSB7XG4gICAgICAgICAgICB0aGlzLmFkZE1vZHVsZXMoRmlsdGVyTW9kdWxlKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChEYXRhR3JpZC5kZWZhdWx0T3B0aW9ucy5lbmFibGVTb3J0KSB7XG4gICAgICAgICAgICB0aGlzLmFkZE1vZHVsZXMoU29ydE1vZHVsZSk7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAodGhpcy5zZXR0aW5ncy5yb3dDb3VudElkKSB7XG4gICAgICAgICAgICB0aGlzLmFkZE1vZHVsZXMoUm93Q291bnRNb2R1bGUpO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHRoaXMuc2V0dGluZ3MucmVmcmVzaGFibGVJZCkge1xuICAgICAgICAgICAgdGhpcy5hZGRNb2R1bGVzKFJlZnJlc2hNb2R1bGUpO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHRoaXMuc2V0dGluZ3MuY3N2RXhwb3J0SWQpIHtcbiAgICAgICAgICAgIHRoaXMuYWRkTW9kdWxlcyhDc3ZNb2R1bGUpO1xuICAgICAgICB9XG4gICAgfVxufVxuXG5EYXRhR3JpZC5kZWZhdWx0T3B0aW9ucyA9IHtcbiAgICBlbmFibGVTb3J0OiB0cnVlLFxuICAgIGVuYWJsZUZpbHRlcjogdHJ1ZVxufTtcblxuZXhwb3J0IHsgRGF0YUdyaWQgfTsiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsTUFBTSxVQUFVLENBQUM7QUFDakIsSUFBSSxPQUFPLFNBQVMsR0FBRyxJQUFJLE1BQU0sQ0FBQyxhQUFhLENBQUM7QUFDaEQ7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLElBQUksT0FBTyxTQUFTLENBQUMsS0FBSyxFQUFFO0FBQzVCO0FBQ0E7QUFDQSxRQUFRLElBQUksQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsRUFBRTtBQUN6QyxZQUFZLEtBQUssR0FBRyxDQUFDLEVBQUUsS0FBSyxDQUFDLE1BQU0sQ0FBQztBQUNwQyxRQUFROztBQUVSLFFBQVEsTUFBTSxJQUFJLEdBQUcsSUFBSSxJQUFJLENBQUMsS0FBSyxDQUFDO0FBQ3BDO0FBQ0EsUUFBUSxPQUFPLENBQUMsTUFBTSxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsT0FBTyxFQUFFLENBQUMsSUFBSSxFQUFFLEdBQUcsSUFBSTtBQUN6RCxJQUFJO0FBQ0o7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLElBQUksT0FBTyxhQUFhLENBQUMsS0FBSyxFQUFFO0FBQ2hDLFFBQVEsTUFBTSxJQUFJLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxLQUFLLENBQUM7O0FBRTFDLFFBQVEsSUFBSSxJQUFJLEtBQUssRUFBRSxFQUFFLE9BQU8sRUFB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QUFDOUQsWUFBWSxDQUFDO0FBQ2I7QUFDQSxZQUFZLElBQUksRUFBRSxDQUFDLFNBQVMsRUFBRSxNQUFNLEtBQUs7QUFDekMsZ0JBQWdCLE1BQU0sS0FBSyxHQUFHLElBQUksQ0FBQyxVQUFVLENBQUMsU0FBUyxFQUFFLE1BQU0sQ0FBQzs7QUFFaEUsZ0JBQWdCLE9BQU8sS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDLE9BQU8sRUFBRSxHQUFHLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxPQUFPLEVBQUU7QUFDOUQsWUFBWSxDQUFDO0FBQ2I7QUFDQSxZQUFZLEdBQUcsRUFBRSxDQUFDLFNBQVMsRUFBRSxNQUFNLEtBQUs7QUFDeEMsZ0JBQWdCLE1BQU0sS0FBSyxHQUFHLElBQUksQ0FBQyxVQUFVLENBQUMsU0FBUyxFQUFFLE1BQU0sQ0FBQzs7QUFFaEUsZ0JBQWdCLE9BQU8sS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDLE9BQU8sRUFBRSxHQUFHLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxPQUFPLEVBQUU7QUFDOUQsWUFBWSxDQUFDO0FBQ2I7QUFDQSxZQUFZLElBQUksRUFBRSxDQUFDLFNBQVMsRUFBRSxNQUFNLEtBQUs7QUFDekMsZ0JBQWdCLE1BQU0sS0FBSyxHQUFHLElBQUksQ0FBQyxVQUFVLENBQUMsU0FBUyxFQUFFLE1BQU0sQ0FBQzs7QUFFaEUsZ0JBQWdCLE9BQU8sS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDLE9BQU8sRUFBRSxJQUFJLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxPQUFPLEVBQUU7QUFDL0QsWUFBWSxDQUFDO0FBQ2I7QUFDQSxZQUFZLElBQUksRUFBRSxTQUFTLFNBQVMsRUFBRSxNQUFNLEVBQUU7QUFDOUMsZ0JBQWdCLE9BQU8sU0FBUyxDQUFDLFdBQVcsRUFBRSxLQUFLLE1BQU0sQ0FBQyxXQUFXLEVBQUUsSUFBSSxTQUFTLENBQUMsUUFBUSxFQUFFLEtBQUssTUFBTSxDQUFDLFFBQVEsRUFBRSxJQUFJLFNBQVMsQ0FBQyxPQUFPLEVBQUUsS0FBSyxNQUFNLENB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LFdBQVc7QUFDbkQsUUFBUSxNQUFNLEdBQUcsR0FBRyxLQUFLLEdBQUcsSUFBSSxDQUFDLFdBQVc7QUFDNUMsUUFBUSxNQUFNLElBQUksR0FBRyxJQUFJLENBQUMsT0FBTyxDQUFDLFdBQVcsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLEtBQUssRUFBRSxHQUFHLENBQUM7O0FBRXBFLFFBQVEsSUFBSSxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsVUFBVSxDQUFDLElBQUksRUFBRSxJQUFJLENBQUMsT0FBTyxDQUFDLFdBQVcsQ0FBQyxRQUFRLENBQUM7QUFDN0UsUUFBUSxJQUFJLENBQUMsU0FBUyxHQUFHLElBQUksQ0FBQyxPQUFPLENBQUMsV0FBVyxDQUFDLFFBQVE7QUFDMUQsUUFBUSxJQUFJLENBQUMsTUFBTSxDQUFDLElBQUksRUFBRSxJQUFJLENBQUMsWUFBWSxDQUFDO0FBQzVDLElBQUksQ0FBQztBQUNMO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLElBQUksWUFBWSxHQUFHLE9BQU8sTUFBTSxHQUFHLEVBQUUsS0FBSztBQUMxQyxRQUFRLElBQUksQ0FBQyxNQUFNLENBQUMsSUFBSSxFQUFFLE1BQU0sQ0FBQyxJQUFJLEdBQUcsQ0FBQztBQUN6QztBQUNBLFFBQVEsTUFBTSxHQUFHLElBQUksQ0FBQyxPQUFPLENBQUMsTUFBTSxDQUFDLEtBQUssQ0FBQyxjQUFjLEVBQUUsTUFBTSxDQUFDOztBQUVsRSxRQUFRLE1BQU0sSUFBSSxHQUFHLE1BQU0sSUFBSSxDQUFDLE9BQU8sQ0FBQyxVQUFVLENBQUMsZUFBZSxDQUFDLE1BQU0sQ0FBQztBQUMxRSxRQUFRLE1BQU0sUUFBUSxHQUFHLElBQUksQ0FBQyxRQUFRLElBQUksQ0FBQzs7QUFFM0MsUUFBUSxJQUFJLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxVQUFVLENBQUMsSUFBSSxDQUFDLElBQUksRUFBRSxRQUFRLENBQUM7QUFDekQsUUFBUSxJQUFJLENBQUMsU0FBUyxHQUFHLFFBQVE7QUFDakMsUUFBUSxJQUFJLENBQUMsTUFBTSxDQUFDLE1BQU0sQ0FBQyxJQUFJLEVBQUUsSUFBSSxDQUFDLFlBQVksQ0FBQztBQUNuRCxJQUFJLENBQUM7QUFDTDs7QUFFQSxXQUFXLENBQUMsVUFBVSxHQUFHLE9BQU87O0FDdEpoQztBQUNBO0FBQ0E7QUFDQSxNQUFNLGFBQWEsQ0FBQztBQUNwQjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsSUFBSSxXQUFXLENBQUMsT0FBTyxFQUFFO0FBQ3pCLFFBQVEsSUFBSSxDQUFDLE9BQU8sR0FBRyxPQUFPO0FBQzlCLElBQUk7O0FBRUosSUFBSSxVQUFVLEdBQUc7QUFDakIsUUFBUSxJQUFJLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxRQUFRLENBQUMsZ0JBQWdCLElBQUksSUFBSSxDQUFDLE9BQU8sQ0FBQyxRQUFRLENBQUMsU0FBUyxFQUFFO0FBQ3hGLFlBQVksSUFBSSxDQUFDLE9BQU8sQ0FBQyxRQUFRLENBQUMsT0FBTyxDQUFDLFNBQVMsRUFBRSxJQUFJLENBQUMsT0FBTyxDQUFDLFdBQVcsQ0FBQyxPQUFPLENBQUM7QUFDdEYsUUFBUTs7QUFFUixRQUFRLE1BQU0sR0FBRyxHQUFHLFFBQVEsQ0FBQyxjQUFjLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxRQUFRLENBQUMsYUFBYSxDQUFDO0FBQ2hGO0FBQ0EsUUFBUSxHQUFHLENBQUMsZ0JBQWdCLENBQUMsT0FBTyxFQUFFLElBQUksQ0FBQyxhQUFhLENBQUM7QUFDekQsSUFBSTs7QUFFSixJQUFJLGFBQWEsR0FBRyxZQUFZO0FBQ2hDLFFBQVEsSUFBSSxJQUFJLENBQUMsT0FBTyxDQUFDLFFBQVEsQ0FBQyxXQUFXLENBQUMsU0FBUyxDQUFDLEVBQUU7QUFDMUQsWUFBWSxNQUFNLElBQUksQ0FBQyxPQUFPLENBQUMsUUFBUSxDQUFDLE9BQU8sQ0FBQyxTQUFTLENBQUM7QUFDMUQsUUFBUTs7QUFFUixRQUFRLE1BQU0sSUFBSSxDQUFDLE9BQU8sQ0FBQyxNQUFNLENBQUMsT0FBTyxDQUFDLFFBQVEsQ0FBQztBQUNuRCxJQUFJLENBQUM7QUFDTDs7QUFFQSxhQUFhLENBQUMsVUFBVSxHQUFHLFNBQVM7O0FDaENwQztBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLE1BQU0sU0FBUyxDQUFDO0FBQ2hCO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsSUFBSSxXQUFXLENBQUMsT0FBTyxFQUFFO0FBQ3pCLFFBQVEsSUFBSSxDQUFDLE9BQU8sR0FBRyxPQUFPO0FBQzlCLElBQUk7O0FBRUosSUFBSSxVQUFVLEdBQUc7QUFDakIsUUFBUSxJQUFJLElBQUksQ0FBQyxPQUFPLENBQUMsUUFBUSxDQUFDLGdCQUFnQixFQUFFO0FBQ3BELFlBQVksSUFBSSxDQUFDLE9BQU8sQ0FBQyxNQUFNLENBQUMsU0FBUyxDQUFDLFFBQVEsRUFBRSxJQUFJLENBQUMsWUFBWSxFQUFFLElBQUksRUFBRSxFQUFFLENBQUM7QUFDaEYsUUFBUSxDQUFDLE1BQU07QUFDZixZQUFZLElBQUksQ0FBQyxPQUFPLENBQUMsTUFBTSxDQUFDLFNBQVMsQ0FBQyxRQUFRLEVBQUUsSUFBSSxDQUFDLFdBQVcsRUFBRSxLQUFLLEVBQUUsRUFBRSxDQUFDO0FBQ2hGLFFBQVE7QUFDUixJQUFJO0FBQ0o7QUFDQTtBQUNBO0FBQ0EsSUFBSSxXQUFXLEdBQUcsTUFBTTtBQUN4QixRQUFRLElBQUksQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLFVBQVUsQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLFdBQVcsQ0FBQyxJQUFJLENBQUM7QUFDbkUsSUFBSSxDQUFDO0FBQ0w7QUFDQTtBQUNBO0FBQ0EsSUFBSSxZQUFZLEdBQUcsWUFBWTtBQUMvQixRQUFRLE1BQU0sTUFBTSxHQUFHLElBQUksQ0FBQyxPQUFPLENBQUMsTUFBTSxDQUFDLEtBQUssQ0FBQyxjQUFjLEVBQUUsRUFBRSxDQUFDO0FBQ3BFLFFBQVEsTUFBTSxJQUFJLEdBQUcsTUFBTSxJQUFJLENBQUMsT0FBTyxDQUFDLFVBQVUsQ0FBQyxlQUFlLENBQUMsTUFBTSxDQUFDOztBQUUxRSxRQUFRLElBQUksQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLFVBQVUsQ0FBQyxJQUFJLENBQUM7QUFDMUMsSUFBSSxDQUFDO0FBQ0w7O0FBRUEsU0FBUyxDQUFDLFVBQVUsR0FBRyxLQUFLOztBQ3hDNUI7QUFDQTtBQUNBO0FBQ0EsTUFBTSxjQUFjLENBQUM7QUFDckI7QUFDQTtBQUNBO0FBQ0E7QUFDQSxJQUFJLFdBQVcsQ0FBQyxPQUFPLEVBQUU7QUFDekIsUUFBUSxJQUFJLENBQUMsT0FBTyxHQUFHLE9BQU87QUFDOUIsUUFBUSxJQUFJLENBQUMsT0FBTyxHQUFHLFFBQVEsQ0FBQyxjQUFjLENBQUMsT0FBTyxDQUFDLFFBQVEsQ0FBQyxVQUFVLENBQUM7QUFDM0UsSUFBSTs7QUFFSixJQUFJLFVBQVUsR0FBRztBQUNqQixRQUFRLElBQUksQ0FBQyxPQUFPLENBQUMsTUFBTSxDQUFDLFNBQVMsQ0FBQyxRQUFRLEVBQUUsSUFBSSxDQUFDLFdBQVcsRUFBRSxLQUFLLEVBQUUsRUFBRSxDQUFDO0FBQzVFLElBQUk7O0FBRUosSUFBSSxXQUFXLEdBQUcsTUFBTTtBQUN4QixRQUFRLElBQUksQ0FBQyxPQUFPLENBQUMsU0FBUyxHQUFHLElBQUksQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLFFBQVE7QUFDM0QsSUFBSSxDQUFDO0FBQ0w7O0FBRUEsY0FBYyxDQUFDLFVBQVUsR0FBRyxVQUFVOztBQ3RCdEM7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsTUFBTSxVQUFVLENBQUM7QUFDakI7QUFDQTtBQUNBO0FBQ0E7QUFDQSxJQUFJLFdBQVcsQ0FBQyxPQUFPLEVBQUU7QUFDekIsUUFBUSxJQUFJLENBQUMsT0FBTyxHQUFHLE9BQU87QUFDOUIsUUFBUSxJQUFJLENBQUMsV0FBVyxHQUFHLEVBQUU7QUFDN0IsUUFBUSxJQUFJLENBQUMsaUJBQWlCLEdBQUcsRUFBRTtBQUNuQyxRQUFRLElBQUksQ0FBQyxnQkFBZ0IsR0FBRyxFQUFFO0FBQ2xDLFFBQVEsSUFBSSxDQUFDLFdBQVcsR0FBRyxFQUFFO0FBQzdCLElBQUk7O0FBRUosSUFBSSxVQUFVLEdBQUc7QUFDakIsUUFBUSxJQUFJLElBQUksQ0FBQyxPQUFPLENBQUMsUUFBUSxDQUFDLGdCQUFnQixFQUFFO0FBQ3BELFlBQVksSUFBSSxDQUFDLGlCQUFpQixHQUFHLElBQUksQ0FBQyxPQUFPLENBQUMsUUFBUSxDQUFDLHVCQUF1QjtBQUNsRixZQUFZLElBQUksQ0FBQyxnQkFBZ0IsR0FBRyxJQUFJLENBQUMsT0FBTyxDQUFDLFFBQVEsQ0FBQywwQkFBMEI7QUFDcEYsWUFBWSxJQUFJLENBQUMsT0FBTyxDQUFDLE1BQU0sQ0FBQyxTQUFTLENBQUMsY0FBYyxFQUFFLElBQUksQ0FBQyxZQUFZLEVBQUUsSUFBSSxDQUFDO0FBQ2xGLFlBQVksSUFBSSxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsWUFBWSxDQUFDO0FBQ3pDLFFBQVEsQ0FBQyxNQUFNO0FBQ2YsWUFBWSxJQUFJLENBQUMsT0FBTyxDQUFDLE1BQU0sQ0FBQyxTQUFTLENBQUMsUUFBUSxFQUFFLElBQUksQ0FBQyxXQUFXLEVBQUUsS0FBSyxFQUFFLENBQUMsQ0FBQztBQUMvRTtBQUNBLFlBQVksSUFBSSxDQUFDLE9BQU8sR0FBRyxJQUFJLENBQUMsZ0JBQWdCLEVBQUU7QUFDbEQsWUFBWSxJQUFJLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxXQUFXLENBQUM7QUFDeEMsUUFBUTtBQUNSLElBQUk7O0FBRUosSUFBSSxLQUFLLENBQUMsUUFBUSxFQUFFO0FBQ3BCO0FBQ0EsUUFBUSxLQUFLLE1BQU0sR0FBRyxJQUFJLElBQUksQ0FBQyxPQUFPLENBQUMsYUFBYSxDQUFDLE9BQU8sRUFBRTtBQUM5RCxZQUFZLElBQUksR0FBRyxDQUFDLElBQUksS0FBSyxNQUFNLEVBQUU7QUFDckMsZ0JBQWdCLElBQUksQ0FBQyxXQUFXLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxVQUFVLENBQUM7QUFDckQsZ0JBQWdCLEdBQUcsQ0FBQyxVQUFVLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxHQUFHLENBQUMsTUFBTSxDQUFDO0FBQ3pELGdCQUFnQixHQUFHLENBQUMsVUFBVSxDQUFDLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxPQUFPLEVBQUUsUUFBUSxDQUFDO0FBQ3ZFLFlBQVk7QUFDWixRQUFRO0FBQ1IsSUFBSTs7QUFFSixJQUFJLGdCQUFnQixHQUFHO0FBQ3ZCLFFBQVEsT0FBTztBQUNmLFlBQVksSUFBSSxFQUFFLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxTQUFTLEtBQUs7QUFDdkMsZ0JBQWdCLElBQUksVUFBVSxHQUFHLENBQUM7QUFDbEMsZ0JBQWdCLElBQUksS0FBSyxHQUFHLElBQUksSUFBSSxDQUFDLENBQUMsQ0FBQztBQUN2QyxnQkFBZ0IsSUFBSSxLQUFLLEdBQUcsSUFBSSxJQUFJLENBQUMsQ0FBQyxDQUFDOztBQUV2QyxnQkFBZ0IsSUFBSSxNQUFNLENBQUMsS0FBSyxDQUFDLEtBQUssQ0FBQyxPQUFPLEVBQUUsQ0FBQyxFQUFFO0FBQ25ELG9CQUFvQixLQUFLLEdBQUcsSUFBSTtBQUNoQyxnQkFBZ0I7O0FBRWhCLGdCQUFnQixJQUFJLE1BQU0sQ0FBQyxLQUFLLENBQUMsS0FBSyxDQUFDLE9BQU8sRUFBRSxDQUFDLEVBQUU7QUFDbkQsb0JBQW9CLEtBQUssR0FBRyxJQUFJO0FBQ2hDLGdCQUFnQjtBQUNoQjtBQUNBLGdCQUFnQixJQUFJLENBQUMsS0FBSyxFQUFFO0FBQzVCLG9CQUFvQixVQUFVLEdBQUcsQ0FBQyxLQUFLLEdBQUcsQ0FBQyxHQUFHLENBQUMsQ0FBQztBQUNoRCxnQkFBZ0IsQ0FBQyxNQUFNLElBQUksQ0FBQyxLQUFLLEVBQUU7QUFDbkMsb0JBQW9CLFVBQVUsR0FBRyxDQUFDO0FBQ2xDLGdCQUFnQixDQUFDLE1BQU0sSUFBSSxLQUFLLEdBQUcsS0FBSyxFQUFFO0FBQzFDLG9CQUFvQixVQUFVLEdBQUcsQ0FBQztBQUNsQyxnQkFBZ0IsQ0FBQyxNQUFNLElBQUksS0FBSyxHQUFHLEtBQUssRUFBRTtBQUMxQyxvQkFBb0IsVUFBVSxHQUFHLENBQUMsQ0FBQztBQUNuQyxnQkFBZ0I7O0FBRWhCLGdCQUFnQixPQUFPLFNBQVMsS0FBSyxNQUFNLElBQUksVUFBVSxHQUFHLENBQUMsQ0FBQyxJQUFJLFVBQVU7QUFDNUUsWUFBWSxDQUFDO0FBQ2IsWUFBWSxNQUFNLEVBQUUsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLFNBQVMsS0FBSztBQUN6QyxnQkFBZ0IsSUFBSSxVQUFVLEdBQUcsQ0FBQzs7QUFFbEMsZ0JBQWdCLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRTtBQUMzQixvQkFBb0IsVUFBVSxHQUFHLENBQUM7QUFDbEMsZ0JBQWdCLENBQUMsTUFBTSxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUU7QUFDbEMsb0JBQW9CLFVBQVUsR0FBRyxDQUFDLENBQUM7QUFDbkMsZ0JBQWdCOztBQUVoQixnQkFBZ0IsT0FBTyxTQUFTLEtBQUssTUFBTSxJQUFJLFVBQVUsR0FBRyxDQUFDLENBQUMsSUFBSSxVQUFVO0FBQzVFLFlBQVksQ0FBQztBQUNiLFlBQVksTUFBTSxFQUFFLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxTQUFTLEtBQUs7QUFDekMsZ0JBQWdCLElBQUksVUFBVSxHQUFHLENBQUM7QUFDbEM7QUFDQSxnQkFBZ0IsSUFBSSxDQUFDLENBQUMsRUFBRTtBQUN4QixvQkFBb0IsVUFBVSxHQUFHLENBQUMsQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLENBQUM7QUFDNUMsZ0JBQWdCLENBQUMsTUFBTSxJQUFJLENBQUMsQ0FBQyxFQUFFO0FBQy9CLG9CQUFvQixVQUFVLEdBQUcsQ0FBQztBQUNsQyxnQkFBZ0IsQ0FBQyxNQUFNO0FBQ3ZCLG9CQUFvQixNQUFNLElBQUksR0FBRyxDQUFDLENBQUMsV0FBVyxFQUFFO0FBQ2hELG9CQUFvQixNQUFNLElBQUksR0FBRyxDQUFDLENBQUMsV0FBVyxFQUFFO0FBQ2hEO0FBQ0Esb0JBQW9CLElBQUksSUFBSSxHQUFHLElBQUksRUFBRTtBQUNyQyx3QkFBd0IsVUFBVSxHQUFHLENBQUM7QUFDdEMsb0JBQW9CLENBQUMsTUFBTSxJQUFJLElBQUksR0FBRyxJQUFJLEVBQUU7QUFDNUMsd0JBQXdCLFVBQVUsR0FBRyxDQUFDLENBQUM7QUFDdkMsb0JBQW9CO0FBQ3BCLGdCQUFnQjs7QUFFaEIsZ0JBQWdCLE9BQU8sU0FBUyxLQUFLLE1BQU0sSUFBSSxVQUFVLEdBQUcsQ0FBQyxDQUFDLElBQUksVUFBVTtBQUM1RSxZQUFZO0FBQ1osU0FBUztBQUNULElBQUk7O0FBRUosSUFBSSxZQUFZLEdBQUcsQ0FBQyxNQUFNLEtBQUs7QUFDL0IsUUFBUSxNQUFNLENBQUMsSUFBSSxHQUFHLElBQUksQ0FBQyxpQkFBaUI7QUFDNUMsUUFBUSxNQUFNLENBQUMsU0FBUyxHQUFHLElBQUksQ0FBQyxnQkFBZ0I7O0FBRWhELFFBQVEsT0FBTyxNQUFNO0FBQ3JCLElBQUksQ0FBQzs7QUFFTCxJQUFJLFlBQVksR0FBRyxPQUFPLENBQUMsS0FBSztBQUNoQyxRQUFRLElBQUksQ0FBQyxpQkFBaUIsR0FBRyxDQUFDLENBQUMsYUFBYSxDQUFDLE9BQU8sQ0FBQyxJQUFJO0FBQzdELFFBQVEsSUFBSSxDQUFDLGdCQUFnQixHQUFHLENBQUMsQ0FBQyxhQUFhLENBQUMsT0FBTyxDQUFDLGFBQWEsQ0FBQyxPQUFPLEVBQUU7QUFDL0UsUUFBUSxJQUFJLENBQUMsV0FBVyxHQUFHLENBQUMsQ0FBQyxhQUFhLENBQUMsT0FBTyxDQUFDLElBQUk7O0FBRXZELFFBQVEsSUFBSSxDQUFDLENBQUMsQ0FBQyxhQUFhLENBQUMsT0FBTyxDQUFDLGFBQWEsRUFBRTtBQUNwRCxZQUFZLElBQUksQ0FBQyxTQUFTLEVBQUU7QUFDNUIsUUFBUTs7QUFFUixRQUFRLENBQUMsQ0FBQyxhQUFhLENBQUMsT0FBTyxDQUFDLFdBQVcsRUFBRTs7QUFFN0MsUUFBUSxNQUFNLElBQUksQ0FBQyxPQUFPLENBQUMsTUFBTSxDQUFDLE9BQU8sQ0FBQyxRQUFRLENBQUM7QUFDbkQsSUFBSSxDQUFDOztBQUVMLElBQUksU0FBUyxHQUFHO0FBQ2hCLFFBQVEsTUFBTSxJQUFJLEdBQUcsSUFBSSxDQUFDLFdBQVcsQ0FBQyxJQUFJLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxhQUFhLENBQUM7O0FBRWhFLFFBQVEsSUFBSSxJQUFJLEtBQUssU0FBUyxFQUFFO0FBQ2hDLFlBQVksSUFBSSxDQUFDLGNBQWMsRUFBRTtBQUNqQyxRQUFRO0FBQ1IsSUFBSTs7QUFFSixJQUFJLFdBQVcsR0FBRyxNQUFNO0FBQ3hCLFFBQVEsSUFBSSxDQUFDLElBQUksQ0FBQyxpQkFBaUIsRUFBRTs7QUFFckMsUUFBUSxJQUFJLENBQUMsT0FBTyxDQUFDLFdBQVcsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsS0FBSztBQUNyRCxZQUFZLE9BQU8sSUFBSSxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsV0FBVyxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxpQkFBaUIsQ0FBQyxFQUFFLENBQUMsQ0FBQyxJQUFJLENBQUMsaUJBQWlCLENBQUMsRUFBRSxJQUFJLENBQUMsZ0JBQWdCLENBQUM7QUFDOUgsUUFBUSxDQUFDLENBQUM7QUFDVixJQUFJLENBQUM7O0FBRUwsSUFBSSxXQUFXLEdBQUcsT0FBTyxDQUFDLEtBQUs7QUFDL0IsUUFBUSxJQUFJLENBQUMsaUJBQWlCLEdBQUcsQ0FBQyxDQUFDLGFBQWEsQ0FBQyxPQUFPLENBQUMsSUFBSTtBQUM3RCxRQUFRLElBQUksQ0FBQyxnQkFBZ0IsR0FBRyxDQUFDLENBQUMsYUFBYSxDQUFDLE9BQU8sQ0FBQyxhQUFhLENBQUMsT0FBTyxFQUFFO0FBQy9FLFFBQVEsSUFBSSxDQUFDLFdBQVcsR0FBRyxDQUFDLENBQUMsYUFBYSxDQUFDLE9BQU8sQ0FBQyxJQUFJOztBQUV2RCxRQUFRLElBQUksQ0FBQyxDQUFDLENBQUMsYUFBYSxDQUFDLE9BQU8sQ0FBQyxhQUFhLEVBQUU7QUFDcEQsWUFBWSxJQUFJLENBQUMsU0FBUyxFQUFFO0FBQzVCLFFBQVE7O0FBRVIsUUFBUSxDQUFDLENBQUMsYUFBYSxDQUFDLE9BQU8sQ0FBQyxXQUFXLEVBQUU7O0FBRTdDLFFBQVEsTUFBTSxJQUFJLENBQUMsT0FBTyxDQUFDLE1BQU0sQ0FBQyxPQUFPLENBQUMsUUFBUSxDQUFDO0FBQ25ELElBQUksQ0FBQztBQUNMOztBQUVBLFVBQVUsQ0FBQyxVQUFVLEdBQUcsTUFBTTs7QUN4SjlCO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsTUFBTSxRQUFRLENBQUM7QUFDZixJQUFJLFlBQVk7QUFDaEIsSUFBSSxlQUFlO0FBQ25CO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsSUFBSSxXQUFXLENBQUMsU0FBUyxFQUFFLFFBQVEsRUFBRTtBQUNyQyxRQUFRLE1BQU0sTUFBTSxHQUFHLFlBQVksQ0FBQyxLQUFLLENBQUMsUUFBUSxDQUFDOztBQUVuRCxRQUFRLElBQUksQ0FBQyxRQUFRLEdBQUcsSUFBSSxZQUFZLENBQUMsTUFBTSxDQUFDO0FBQ2hELFFBQVEsSUFBSSxDQUFDLFNBQVMsR0FBRyxRQUFRLENBQUMsY0FBYyxDQUFDLFNBQVMsQ0FBQztBQUMzRCxRQUFRLElBQUksQ0FBQyxZQUFZLEdBQUcsSUFBSSxDQUFDLFFBQVEsQ0FBQyxZQUFZO0FBQ3RELFFBQVEsSUFBSSxDQUFDLE9BQU8sR0FBRyxJQUFJO0FBQzNCLFFBQVEsSUFBSSxDQUFDLFlBQVksR0FBRyxFQUFFO0FBQzlCLFFBQVEsSUFBSSxDQUFDLGVBQWUsR0FBRyxLQUFLO0FBQ3BDLFFBQVEsSUFBSSxDQUFDLE9BQU8sR0FBRyxFQUFFOztBQUV6QixRQUFRLElBQUksTUFBTSxDQUFDLE1BQU0sQ0FBQyxNQUFNLENBQUMsT0FBTyxDQUFDLENBQUMsTUFBTSxLQUFLLENBQUMsRUFBRTtBQUN4RCxZQUFZLE9BQU8sQ0FBQyxHQUFHLENBQUMsc0NBQXNDLENBQUM7QUFDL0QsWUFBWSxJQUFJLENBQUMsT0FBTyxHQUFHLEtBQUs7QUFDaEMsUUFBUSxDQUFDLE1BQU07QUFDZixZQUFZLE1BQU0sSUFBSSxHQUFHLE1BQU0sQ0FBQyxJQUFJLElBQUksRUFBRTtBQUMxQyxZQUFZLElBQUksQ0FBQyxLQUFLLENBQUMsTUFBTSxDQUFDLE9BQU8sRUFBRSxJQUFJLENBQUM7QUFDNUMsUUFBUTtBQUNSLElBQUk7O0FBRUosSUFBSSxLQUFLLENBQUMsT0FBTyxFQUFFLElBQUksRUFBRTtBQUN6QixRQUFRLElBQUksQ0FBQyxPQUFPLEdBQUcsSUFBSSxXQUFXLENBQUMsT0FBTyxFQUFFLElBQUksQ0FBQyxRQUFRLEVBQUUsSUFBSSxDQUFDOztBQUVwRSxRQUFRLElBQUksQ0FBQyxTQUFTLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQztBQUN0RCxJQUFJO0FBQ0o7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsSUFBSSxVQUFVLENBQUMsR0FBRyxPQUFPLEVBQUU7QUFDM0IsUUFBUSxPQUFPLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxLQUFLLElBQUksQ0FBQyxZQUFZLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDO0FBQ3pELElBQUk7QUFDSjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsSUFBSSxTQUFTLENBQUMsTUFBTSxFQUFFLGFBQWEsR0FBRyxJQUFJLEVBQUU7QUFDNUMsUUFBUSxJQUFJLENBQUMsT0FBTyxDQUFDLGFBQWEsQ0FBQyxTQUFTLENBQUMsTUFBTSxFQUFFLGFBQWEsQ0FBQztBQUNuRSxJQUFJO0FBQ0o7QUFDQTtBQUNBO0FBQ0E7QUFDQSxJQUFJLFlBQVksR0FBRyxZQUFZO0FBQy9CLFFBQVEsSUFBSSxJQUFJLENBQUMsZUFBZTtBQUNoQyxZQUFZOztBQUVaO0FBQ0EsUUFBUSxJQUFJLElBQUksQ0FBQyxRQUFRLENBQUMsWUFBWSxJQUFJLENBQUMsSUFBSSxDQUFDLFlBQVksQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFDLFVBQVUsS0FBSyxNQUFNLENBQUMsRUFBRTtBQUNuRyxZQUFZLElBQUksQ0FBQyxZQUFZLENBQUMsSUFBSSxDQUFDLFdBQVcsQ0FBQztBQUMvQyxRQUFRLENBQUMsTUFBTSxJQUFJLENBQUMsSUFBSSxDQUFDLFlBQVksQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFDLFVBQVUsS0FBSyxLQUFLLENBQUMsRUFBRTtBQUMzRSxhQUFhLElBQUksQ0FBQyxZQUFZLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQztBQUM5QyxRQUFROztBQUVSLFFBQVEsSUFBSSxDQUFDLFlBQVksQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLEtBQUs7QUFDekMsWUFBWSxJQUFJLENBQUMsT0FBTyxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsVUFBVSxDQUFDLEdBQUcsSUFBSSxDQUFDLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQztBQUNwRSxZQUFZLElBQUksQ0FBQyxPQUFPLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxVQUFVLENBQUMsQ0FBQyxVQUFVLEVBQUU7QUFDM0QsUUFBUSxDQUFDLENBQUM7O0FBRVYsUUFBUSxJQUFJLENBQUMsZUFBZSxHQUFHLElBQUk7QUFDbkMsUUFBUSxNQUFNLElBQUksQ0FBQyxPQUFPLENBQUMsTUFBTSxDQUFDLE9BQU8sQ0FBQyxhQUFhLENBQUM7QUFDeEQsSUFBSSxDQUFDO0FBQ0w7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxJQUFJLE1BQU0sSUFBSSxHQUFHO0FBQ2pCLFFBQVEsSUFBSSxDQUFDLElBQUksQ0FBQyxPQUFPLEVBQUU7QUFDM0IsWUFBWSxPQUFPLENBQUMsR0FBRyxDQUFDLHNDQUFzQyxDQUFDO0FBQy9ELFlBQVk7QUFDWixRQUFROztBQUVSLFFBQVEsSUFBSSxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsZ0JBQWdCLEVBQUU7O0FBRTVDLFFBQVEsTUFBTSxJQUFJLENBQUMsWUFBWSxFQUFFOztBQUVqQyxRQUFRLElBQUksQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLGdCQUFnQixJQUFJLElBQUksQ0FBQyxRQUFRLENBQUMsU0FBUyxFQUFFO0FBQ3hFO0FBQ0EsWUFBWSxJQUFJLENBQUMsT0FBTyxDQUFDLFFBQVEsQ0FBQyxPQUFPLENBQUMsTUFBTSxFQUFFLElBQUksQ0FBQyxPQUFPLENBQUMsV0FBVyxDQUFDLE9BQU8sQ0FBQztBQUNuRixRQUFRO0FBQ1I7QUFDQSxRQUFRLElBQUksSUFBSSxDQUFDLE9BQU8sQ0FBQyxRQUFRLENBQUMsV0FBVyxDQUFDLE1BQU0sQ0FBQyxFQUFFO0FBQ3ZELFlBQVksTUFBTSxJQUFJLENBQUMsT0FBTyxDQUFDLFFBQVEsQ0FBQyxPQUFPLENBQUMsTUFBTSxDQUFDO0FBQ3ZELFFBQVE7O0FBRVIsUUFBUSxNQUFNLElBQUksQ0FBQyxPQUFPLENBQUMsTUFBTSxDQUFDLE9BQU8sQ0FBQyxRQUFRLENBQUM7QUFDbkQsSUFBSTtBQUNKO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLElBQUksU0FBUyxHQUFHLE9BQU8sS0FBSyxFQUFFLEtBQUssRUFBRSxJQUFJLEdBQUcsUUFBUSxFQUFFLFNBQVMsR0FBRyxRQUFRLEVBQUUsWUFBWSxHQUFHLEVBQUUsS0FBSztBQUNsRyxRQUFRLElBQUksSUFBSSxDQUFDLE9BQU8sQ0FBQyxPQUFPLENBQUMsTUFBTSxFQUFFO0FBQ3pDLFlBQVksSUFBSSxDQUFDLE9BQU8sQ0FBQyxPQUFPLENBQUMsTUFBTSxDQUFDLFNBQVMsQ0FBQyxLQUFLLEVBQUUsS0FBSyxFQUFFLElBQUksRUFBRSxTQUFTLEVBQUUsWUFBWSxDQUFDOztBQUU5RixZQUFZLE1BQU0sSUFBSSxDQUFDLE9BQU8sQ0FBQyxNQUFNLENBQUMsT0FBTyxDQUFDLFFBQVEsQ0FBQztBQUN2RCxRQUFRLENBQUMsTUFBTTtBQUNmLFlBQVksT0FBTyxDQUFDLElBQUksQ0FBQyxxSEFBcUgsQ0FBQztBQUMvSSxRQUFRO0FBQ1IsSUFBSSxDQUFDO0FBQ0w7QUFDQTtBQUNBO0FBQ0E7QUFDQSxJQUFJLFlBQVksR0FBRyxPQUFPLEtBQUssS0FBSztBQUNwQyxRQUFRLElBQUksSUFBSSxDQUFDLE9BQU8sQ0FBQyxPQUFPLENBQUMsTUFBTSxFQUFFO0FBQ3pDLFlBQVksSUFBSSxDQUFDLE9BQU8sQ0FBQyxPQUFPLENBQUMsTUFBTSxDQUFDLFlBQVksQ0FBQyxLQUFLLENBQUM7O0FBRTNELFlBQVksTUFBTSxJQUFJLENBQUMsT0FBTyxDQUFDLE1BQU0sQ0FBQyxPQUFPLENBQUMsUUFBUSxDQUFDO0FBQ3ZELFFBQVEsQ0FBQyxNQUFNO0FBQ2YsWUFBWSxPQUFPLENBQUMsSUFBSSxDQUFDLHFIQUFxSCxDQUFDO0FBQy9JLFFBQVE7QUFDUixJQUFJLENBQUM7QUFDTDs7QUMzSUEsTUFBTSxRQUFRLFNBQVMsUUFBUSxDQUFDO0FBQ2hDLElBQUksV0FBVyxDQUFDLFNBQVMsRUFBRSxRQUFRLEVBQUU7QUFDckMsUUFBUSxLQUFLLENBQUMsU0FBUyxFQUFFLFFBQVEsQ0FBQzs7QUFFbEMsUUFBUSxJQUFJLFFBQVEsQ0FBQyxjQUFjLENBQUMsWUFBWSxFQUFFO0FBQ2xELFlBQVksSUFBSSxDQUFDLFVBQVUsQ0FBQyxZQUFZLENBQUM7QUFDekMsUUFBUTs7QUFFUixRQUFRLElBQUksUUFBUSxDQUFDLGNBQWMsQ0FBQyxVQUFVLEVBQUU7QUFDaEQsWUFBWSxJQUFJLENBQUMsVUFBVSxDQUFDLFVBQVUsQ0FBQztBQUN2QyxRQUFROztBQUVSLFFBQVEsSUFBSSxJQUFJLENBQUMsUUFBUSxDQUFDLFVBQVUsRUFBRTtBQUN0QyxZQUFZLElBQUksQ0FBQyxVQUFVLENBQUMsY0FBYyxDQUFDO0FBQzNDLFFBQVE7O0FBRVIsUUFBUSxJQUFJLElBQUksQ0FBQyxRQUFRLENBQUMsYUFBYSxFQUFFO0FBQ3pDLFlBQVksSUFBSSxDQUFDLFVBQVUsQ0FBQyxhQUFhLENBQUM7QUFDMUMsUUFBUTs7QUFFUixRQUFRLElBQUksSUFBSSxDQUFDLFFBQVEsQ0FBQyxXQUFXLEVBQUU7QUFDdkMsWUFBWSxJQUFJLENBQUMsVUFBVSxDQUFDLFNBQVMsQ0FBQztBQUN0QyxRQUFRO0FBQ1IsSUFBSTtBQUNKOztBQUVBLFFBQVEsQ0FBQyxjQUFjLEdBQUc7QUFDMUIsSUFBSSxVQUFVLEVBQUUsSUFBSTtBQUNwQixJQUFJLFlBQVksRUFBRTtBQUNsQixDQUFDOzs7OyJ9
