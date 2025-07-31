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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGF0YWdyaWQuanMiLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NyYy9jb21wb25lbnRzL2NlbGwvaGVhZGVyQ2VsbC5qcyIsIi4uLy4uLy4uL3NyYy9jb21wb25lbnRzL2hlbHBlcnMvY3NzSGVscGVyLmpzIiwiLi4vLi4vLi4vc3JjL2NvbXBvbmVudHMvY29sdW1uL2NvbHVtbi5qcyIsIi4uLy4uLy4uL3NyYy9jb21wb25lbnRzL2NvbHVtbi9jb2x1bW5NYW5hZ2VyLmpzIiwiLi4vLi4vLi4vc3JjL2NvbXBvbmVudHMvZGF0YS9kYXRhUGlwZWxpbmUuanMiLCIuLi8uLi8uLi9zcmMvY29tcG9uZW50cy9kYXRhL2RhdGFMb2FkZXIuanMiLCIuLi8uLi8uLi9zcmMvY29tcG9uZW50cy9kYXRhL2RhdGFQZXJzaXN0ZW5jZS5qcyIsIi4uLy4uLy4uL3NyYy9jb21wb25lbnRzL2V2ZW50cy9ncmlkRXZlbnRzLmpzIiwiLi4vLi4vLi4vc3JjL2NvbXBvbmVudHMvaGVscGVycy9kYXRlSGVscGVyLmpzIiwiLi4vLi4vLi4vc3JjL2NvbXBvbmVudHMvY2VsbC9mb3JtYXR0ZXJzL2RhdGV0aW1lLmpzIiwiLi4vLi4vLi4vc3JjL2NvbXBvbmVudHMvY2VsbC9mb3JtYXR0ZXJzL2xpbmsuanMiLCIuLi8uLi8uLi9zcmMvY29tcG9uZW50cy9jZWxsL2Zvcm1hdHRlcnMvbnVtZXJpYy5qcyIsIi4uLy4uLy4uL3NyYy9jb21wb25lbnRzL2NlbGwvZm9ybWF0dGVycy9zdGFyLmpzIiwiLi4vLi4vLi4vc3JjL2NvbXBvbmVudHMvY2VsbC9jZWxsLmpzIiwiLi4vLi4vLi4vc3JjL2NvbXBvbmVudHMvdGFibGUvdGFibGUuanMiLCIuLi8uLi8uLi9zcmMvY29tcG9uZW50cy9jb250ZXh0L2dyaWRDb250ZXh0LmpzIiwiLi4vLi4vLi4vc3JjL3NldHRpbmdzL3NldHRpbmdzRGVmYXVsdC5qcyIsIi4uLy4uLy4uL3NyYy9zZXR0aW5ncy9tZXJnZU9wdGlvbnMuanMiLCIuLi8uLi8uLi9zcmMvc2V0dGluZ3Mvc2V0dGluZ3NHcmlkLmpzIiwiLi4vLi4vLi4vc3JjL21vZHVsZXMvcm93L3Jvd01vZHVsZS5qcyIsIi4uLy4uLy4uL3NyYy9tb2R1bGVzL3BhZ2VyL3BhZ2VyQnV0dG9ucy5qcyIsIi4uLy4uLy4uL3NyYy9tb2R1bGVzL3BhZ2VyL3BhZ2VyTW9kdWxlLmpzIiwiLi4vLi4vLi4vc3JjL2NvcmUvZ3JpZENvcmUuanMiLCIuLi8uLi8uLi9zcmMvbW9kdWxlcy9kb3dubG9hZC9jc3ZNb2R1bGUuanMiLCIuLi8uLi8uLi9zcmMvbW9kdWxlcy9maWx0ZXIvdHlwZXMvZmlsdGVyVGFyZ2V0LmpzIiwiLi4vLi4vLi4vc3JjL21vZHVsZXMvZmlsdGVyL3R5cGVzL2ZpbHRlckRhdGUuanMiLCIuLi8uLi8uLi9zcmMvbW9kdWxlcy9maWx0ZXIvdHlwZXMvZmlsdGVyRnVuY3Rpb24uanMiLCIuLi8uLi8uLi9zcmMvY29tcG9uZW50cy9oZWxwZXJzL2VsZW1lbnRIZWxwZXIuanMiLCIuLi8uLi8uLi9zcmMvbW9kdWxlcy9maWx0ZXIvZWxlbWVudHMvZWxlbWVudEJldHdlZW4uanMiLCIuLi8uLi8uLi9zcmMvbW9kdWxlcy9maWx0ZXIvZWxlbWVudHMvZWxlbWVudElucHV0LmpzIiwiLi4vLi4vLi4vc3JjL21vZHVsZXMvZmlsdGVyL2VsZW1lbnRzL2VsZW1lbnRNdWx0aVNlbGVjdC5qcyIsIi4uLy4uLy4uL3NyYy9tb2R1bGVzL2ZpbHRlci9lbGVtZW50cy9lbGVtZW50U2VsZWN0LmpzIiwiLi4vLi4vLi4vc3JjL21vZHVsZXMvZmlsdGVyL2ZpbHRlck1vZHVsZS5qcyIsIi4uLy4uLy4uL3NyYy9tb2R1bGVzL3JlZnJlc2gvcmVmcmVzaE1vZHVsZS5qcyIsIi4uLy4uLy4uL3NyYy9tb2R1bGVzL3Jvdy9yb3dDb3VudE1vZHVsZS5qcyIsIi4uLy4uLy4uL3NyYy9tb2R1bGVzL3NvcnQvc29ydE1vZHVsZS5qcyIsIi4uLy4uLy4uL3NyYy9kYXRhZ3JpZC5qcyJdLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIERlZmluZXMgYSBzaW5nbGUgaGVhZGVyIGNlbGwgJ3RoJyBlbGVtZW50LlxuICovXG5jbGFzcyBIZWFkZXJDZWxsIHtcbiAgICAvKipcbiAgICAgKiBDcmVhdGUgaGVhZGVyIG9iamVjdCB0aGF0IHJlcHJlc2VudHMgdGhlIGB0aGAgdGFibGUgaGVhZGVyIGVsZW1lbnQuICBDbGFzcyB3aWxsIHBlcnNpc3QgY29sdW1uIHNvcnQgYW5kIG9yZGVyIHVzZXIgaW5wdXQuXG4gICAgICogQHBhcmFtIHtDb2x1bW59IGNvbHVtbiBjb2x1bW4gb2JqZWN0LlxuICAgICAqL1xuICAgIGNvbnN0cnVjdG9yKGNvbHVtbikge1xuICAgICAgICB0aGlzLmNvbHVtbiA9IGNvbHVtbjtcbiAgICAgICAgdGhpcy5zZXR0aW5ncyA9IGNvbHVtbi5zZXR0aW5ncztcbiAgICAgICAgdGhpcy5lbGVtZW50ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcInRoXCIpO1xuICAgICAgICB0aGlzLnNwYW4gPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwic3BhblwiKTtcbiAgICAgICAgdGhpcy5uYW1lID0gY29sdW1uLmZpZWxkO1xuICAgICAgICB0aGlzLmRpcmVjdGlvbiA9IFwiZGVzY1wiO1xuICAgICAgICB0aGlzLmRpcmVjdGlvbk5leHQgPSBcImRlc2NcIjtcbiAgICAgICAgdGhpcy50eXBlID0gY29sdW1uLnR5cGU7XG5cbiAgICAgICAgaWYgKGNvbHVtbi5oZWFkZXJDc3MpIHtcbiAgICAgICAgICAgIHRoaXMuZWxlbWVudC5jbGFzc0xpc3QuYWRkKGNvbHVtbi5oZWFkZXJDc3MpO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHRoaXMuc2V0dGluZ3MudGFibGVIZWFkZXJUaENzcykge1xuICAgICAgICAgICAgdGhpcy5lbGVtZW50LmNsYXNzTGlzdC5hZGQodGhpcy5zZXR0aW5ncy50YWJsZUhlYWRlclRoQ3NzKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChjb2x1bW4uY29sdW1uU2l6ZSkge1xuICAgICAgICAgICAgdGhpcy5lbGVtZW50LmNsYXNzTGlzdC5hZGQoY29sdW1uLmNvbHVtblNpemUpO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKGNvbHVtbi53aWR0aCkge1xuICAgICAgICAgICAgdGhpcy5lbGVtZW50LnN0eWxlLndpZHRoID0gY29sdW1uLndpZHRoO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKGNvbHVtbi5oZWFkZXJGaWx0ZXJFbXB0eSkge1xuICAgICAgICAgICAgdGhpcy5zcGFuLmNsYXNzTGlzdC5hZGQoY29sdW1uLmhlYWRlckZpbHRlckVtcHR5KTtcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMuZWxlbWVudC5hcHBlbmRDaGlsZCh0aGlzLnNwYW4pO1xuICAgICAgICB0aGlzLmVsZW1lbnQuY29udGV4dCA9IHRoaXM7XG4gICAgICAgIHRoaXMuc3Bhbi5pbm5lclRleHQgPSBjb2x1bW4ubGFiZWw7XG4gICAgICAgIHRoaXMuc3Bhbi5jb250ZXh0ID0gdGhpcztcbiAgICB9XG4gICAgLyoqXG4gICAgICogU2V0IHRoZSBzb3J0IGZsYWcgZm9yIHRoZSBoZWFkZXIgY2VsbC5cbiAgICAgKi9cbiAgICBzZXRTb3J0RmxhZygpIHtcbiAgICAgICAgaWYgKHRoaXMuaWNvbiA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICB0aGlzLmljb24gPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiaVwiKTtcbiAgICAgICAgICAgIHRoaXMuc3Bhbi5hcHBlbmQodGhpcy5pY29uKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICh0aGlzLmRpcmVjdGlvbk5leHQgPT09IFwiZGVzY1wiKSB7XG4gICAgICAgICAgICB0aGlzLmljb24uY2xhc3NMaXN0ID0gdGhpcy5zZXR0aW5ncy50YWJsZUNzc1NvcnREZXNjO1xuICAgICAgICAgICAgdGhpcy5kaXJlY3Rpb24gPSBcImRlc2NcIjtcbiAgICAgICAgICAgIHRoaXMuZGlyZWN0aW9uTmV4dCA9IFwiYXNjXCI7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB0aGlzLmljb24uY2xhc3NMaXN0ID0gdGhpcy5zZXR0aW5ncy50YWJsZUNzc1NvcnRBc2M7XG4gICAgICAgICAgICB0aGlzLmRpcmVjdGlvbiA9IFwiYXNjXCI7XG4gICAgICAgICAgICB0aGlzLmRpcmVjdGlvbk5leHQgPSBcImRlc2NcIjtcbiAgICAgICAgfVxuICAgIH1cbiAgICAvKipcbiAgICAgKiBSZW1vdmUgdGhlIHNvcnQgZmxhZyBmb3IgdGhlIGhlYWRlciBjZWxsLlxuICAgICAqL1xuICAgIHJlbW92ZVNvcnRGbGFnKCkge1xuICAgICAgICB0aGlzLmRpcmVjdGlvbiA9IFwiZGVzY1wiO1xuICAgICAgICB0aGlzLmRpcmVjdGlvbk5leHQgPSBcImRlc2NcIjtcbiAgICAgICAgdGhpcy5pY29uID0gdGhpcy5pY29uLnJlbW92ZSgpO1xuICAgIH1cblxuICAgIGdldCBpc0N1cnJlbnRTb3J0KCkge1xuICAgICAgICByZXR1cm4gdGhpcy5pY29uICE9PSB1bmRlZmluZWQ7XG4gICAgfVxufVxuXG5leHBvcnQgeyBIZWFkZXJDZWxsIH07IiwiY2xhc3MgQ3NzSGVscGVyIHtcbiAgICBzdGF0aWMgYmV0d2VlbiA9IHtcbiAgICAgICAgYnV0dG9uOiBcImRhdGFncmlkcy1iZXR3ZWVuLWJ1dHRvblwiLFxuICAgICAgICBsYWJlbDogXCJkYXRhZ3JpZHMtYmV0d2Vlbi1pbnB1dC1sYWJlbFwiXG4gICAgfTtcblxuICAgIHN0YXRpYyBub0hlYWRlciA9IFwiZGF0YWdyaWRzLW5vLWhlYWRlclwiO1xuXG4gICAgc3RhdGljIGlucHV0ID0gXCJkYXRhZ3JpZHMtaW5wdXRcIjtcblxuICAgIHN0YXRpYyBtdWx0aVNlbGVjdCA9IHtcbiAgICAgICAgcGFyZW50Q2xhc3M6IFwiZGF0YWdyaWRzLW11bHRpLXNlbGVjdFwiLFxuICAgICAgICBoZWFkZXI6IFwiZGF0YWdyaWRzLW11bHRpLXNlbGVjdC1oZWFkZXJcIixcbiAgICAgICAgaGVhZGVyQWN0aXZlOiBcImRhdGFncmlkcy1tdWx0aS1zZWxlY3QtaGVhZGVyLWFjdGl2ZVwiLFxuICAgICAgICBoZWFkZXJPcHRpb246IFwiZGF0YWdyaWRzLW11bHRpLXNlbGVjdC1oZWFkZXItb3B0aW9uXCIsXG4gICAgICAgIG9wdGlvbnM6IFwiZGF0YWdyaWRzLW11bHRpLXNlbGVjdC1vcHRpb25zXCIsXG4gICAgICAgIG9wdGlvbjogXCJkYXRhZ3JpZHMtbXVsdGktc2VsZWN0LW9wdGlvblwiLFxuICAgICAgICBvcHRpb25UZXh0OiBcImRhdGFncmlkcy1tdWx0aS1zZWxlY3Qtb3B0aW9uLXRleHRcIixcbiAgICAgICAgb3B0aW9uUmFkaW86IFwiZGF0YWdyaWRzLW11bHRpLXNlbGVjdC1vcHRpb24tcmFkaW9cIixcbiAgICAgICAgc2VsZWN0ZWQ6IFwiZGF0YWdyaWRzLW11bHRpLXNlbGVjdC1zZWxlY3RlZFwiXG4gICAgfTtcblxuICAgIHN0YXRpYyB0b29sdGlwID0geyBcbiAgICAgICAgcGFyZW50Q2xhc3M6IFwiZGF0YWdyaWRzLXRvb2x0aXBcIixcbiAgICAgICAgcmlnaHQ6IFwiZGF0YWdyaWRzLXRvb2x0aXAtcmlnaHRcIixcbiAgICAgICAgbGVmdDogXCJkYXRhZ3JpZHMtdG9vbHRpcC1sZWZ0XCJcbiAgICB9O1xufVxuXG5leHBvcnQgeyBDc3NIZWxwZXIgfTsiLCJpbXBvcnQgeyBDc3NIZWxwZXIgfSBmcm9tIFwiLi4vaGVscGVycy9jc3NIZWxwZXIuanNcIjtcbi8qKlxuICogRGVmaW5lcyBhIHNpbmdsZSBjb2x1bW4gZm9yIHRoZSBncmlkLiAgVHJhbnNmb3JtcyB1c2VyJ3MgY29sdW1uIGRlZmluaXRpb24gaW50byBDbGFzcyBwcm9wZXJ0aWVzLlxuICogQGNsYXNzXG4gKi9cbmNsYXNzIENvbHVtbiB7XG4gICAgLyoqXG4gICAgICogQ3JlYXRlIGNvbHVtbiBvYmplY3Qgd2hpY2ggdHJhbnNmb3JtcyB1c2VyJ3MgY29sdW1uIGRlZmluaXRpb24gaW50byBDbGFzcyBwcm9wZXJ0aWVzLlxuICAgICAqIEBwYXJhbSB7T2JqZWN0fSBjb2x1bW4gVXNlcidzIGNvbHVtbiBkZWZpbml0aW9uL3NldHRpbmdzLlxuICAgICAqIEBwYXJhbSB7U2V0dGluZ3NHcmlkfSBzZXR0aW5ncyBncmlkIHNldHRpbmdzLlxuICAgICAqIEBwYXJhbSB7bnVtYmVyfSBpbmRleCBjb2x1bW4gaW5kZXggbnVtYmVyLlxuICAgICAqL1xuICAgIGNvbnN0cnVjdG9yKGNvbHVtbiwgc2V0dGluZ3MsIGluZGV4ID0gMCkge1xuICAgICAgICB0aGlzLnNldHRpbmdzID0gc2V0dGluZ3M7XG4gICAgICAgIHRoaXMuaW5kZXggPSBpbmRleDtcblxuICAgICAgICBpZiAoY29sdW1uLmZpZWxkID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgIHRoaXMuZmllbGQgPSBgY29sdW1uJHtpbmRleH1gOyAgLy9hc3NvY2lhdGVkIGRhdGEgZmllbGQgbmFtZS5cbiAgICAgICAgICAgIHRoaXMudHlwZSA9IFwiaWNvblwiOyAgLy9pY29uIHR5cGUuXG4gICAgICAgICAgICB0aGlzLmxhYmVsID0gXCJcIjtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHRoaXMuZmllbGQgPSBjb2x1bW4uZmllbGQ7ICAvL2Fzc29jaWF0ZWQgZGF0YSBmaWVsZCBuYW1lLlxuICAgICAgICAgICAgdGhpcy50eXBlID0gY29sdW1uLnR5cGUgPyBjb2x1bW4udHlwZSA6IFwic3RyaW5nXCI7ICAvL3ZhbHVlIHR5cGUuXG4gICAgICAgICAgICB0aGlzLmxhYmVsID0gY29sdW1uLmxhYmVsIFxuICAgICAgICAgICAgICAgID8gY29sdW1uLmxhYmVsIFxuICAgICAgICAgICAgICAgIDogY29sdW1uLmZpZWxkWzBdLnRvVXBwZXJDYXNlKCkgKyBjb2x1bW4uZmllbGQuc2xpY2UoMSk7ICAvL2NvbHVtbiB0aXRsZS5cbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChjb2x1bW4/LmZvcm1hdHRlck1vZHVsZU5hbWUpIHsgXG4gICAgICAgICAgICB0aGlzLmZvcm1hdHRlciA9IFwibW9kdWxlXCI7XG4gICAgICAgICAgICB0aGlzLmZvcm1hdHRlck1vZHVsZU5hbWUgPSBjb2x1bW4uZm9ybWF0dGVyTW9kdWxlTmFtZTsgIC8vZm9ybWF0dGVyIG1vZHVsZSBuYW1lLlxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdGhpcy5mb3JtYXR0ZXIgPSBjb2x1bW4uZm9ybWF0dGVyOyAgLy9mb3JtYXR0ZXIgdHlwZSBvciBmdW5jdGlvbi5cbiAgICAgICAgICAgIHRoaXMuZm9ybWF0dGVyUGFyYW1zID0gY29sdW1uLmZvcm1hdHRlclBhcmFtcztcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMuaGVhZGVyQ3NzID0gY29sdW1uLmhlYWRlckNzcztcbiAgICAgICAgdGhpcy5jb2x1bW5TaXplID0gY29sdW1uPy5jb2x1bW5TaXplID8gYGRhdGFncmlkcy1jb2wtJHtjb2x1bW4uY29sdW1uU2l6ZX1gIDogXCJcIjtcbiAgICAgICAgdGhpcy53aWR0aCA9IGNvbHVtbj8ud2lkdGggPz8gdW5kZWZpbmVkO1xuICAgICAgICB0aGlzLmhhc0ZpbHRlciA9IHRoaXMudHlwZSAhPT0gXCJpY29uXCIgJiYgY29sdW1uLmZpbHRlclR5cGUgPyB0cnVlIDogZmFsc2U7XG4gICAgICAgIHRoaXMuaGVhZGVyQ2VsbCA9IHVuZGVmaW5lZDsgIC8vSGVhZGVyQ2VsbCBjbGFzcy5cbiAgICAgICAgdGhpcy5oZWFkZXJGaWx0ZXIgPSB1bmRlZmluZWQ7ICAvL0hlYWRlckZpbHRlciBjbGFzcy5cblxuICAgICAgICBpZiAodGhpcy5oYXNGaWx0ZXIpIHtcbiAgICAgICAgICAgIHRoaXMuI2luaXRpYWxpemVGaWx0ZXIoY29sdW1uLCBzZXR0aW5ncyk7XG4gICAgICAgIH0gZWxzZSBpZiAoY29sdW1uPy5oZWFkZXJGaWx0ZXJFbXB0eSkge1xuICAgICAgICAgICAgdGhpcy5oZWFkZXJGaWx0ZXJFbXB0eSA9ICh0eXBlb2YgY29sdW1uLmhlYWRlckZpbHRlckVtcHR5ID09PSBcInN0cmluZ1wiKSBcbiAgICAgICAgICAgICAgICA/IGNvbHVtbi5oZWFkZXJGaWx0ZXJFbXB0eSA6IENzc0hlbHBlci5ub0hlYWRlcjtcbiAgICAgICAgfVxuICAgICAgICAvL1Rvb2x0aXAgc2V0dGluZy5cbiAgICAgICAgaWYgKGNvbHVtbi50b29sdGlwRmllbGQpIHtcbiAgICAgICAgICAgIHRoaXMudG9vbHRpcEZpZWxkID0gY29sdW1uLnRvb2x0aXBGaWVsZDtcbiAgICAgICAgICAgIHRoaXMudG9vbHRpcExheW91dCA9IGNvbHVtbj8udG9vbHRpcExheW91dCA9PT0gXCJyaWdodFwiID8gQ3NzSGVscGVyLnRvb2x0aXAucmlnaHQgOiBDc3NIZWxwZXIudG9vbHRpcC5sZWZ0O1xuICAgICAgICB9XG4gICAgfVxuICAgIC8qKlxuICAgICAqIEluaXRpYWxpemVzIGZpbHRlciBwcm9wZXJ0aWVzLlxuICAgICAqIEBwYXJhbSB7T2JqZWN0fSBjb2x1bW4gXG4gICAgICogQHBhcmFtIHtTZXR0aW5nc30gc2V0dGluZ3MgXG4gICAgICovXG4gICAgI2luaXRpYWxpemVGaWx0ZXIoY29sdW1uLCBzZXR0aW5ncykge1xuICAgICAgICB0aGlzLmZpbHRlckVsZW1lbnQgPSBjb2x1bW4uZmlsdGVyVHlwZSA9PT0gXCJiZXR3ZWVuXCIgPyBcImJldHdlZW5cIiA6IFwiaW5wdXRcIjtcbiAgICAgICAgdGhpcy5maWx0ZXJUeXBlID0gY29sdW1uLmZpbHRlclR5cGU7ICAvL2ZpbHRlciB0eXBlIGRlc2NyaXB0b3IsIHN1Y2ggYXM6IGVxdWFscywgbGlrZSwgPCwgZXRjOyBjYW4gYWxzbyBiZSBhIGZ1bmN0aW9uLlxuICAgICAgICB0aGlzLmZpbHRlclBhcmFtcyA9IGNvbHVtbi5maWx0ZXJQYXJhbXM7XG4gICAgICAgIHRoaXMuZmlsdGVyQ3NzID0gY29sdW1uPy5maWx0ZXJDc3MgPz8gc2V0dGluZ3MudGFibGVGaWx0ZXJDc3M7XG4gICAgICAgIHRoaXMuZmlsdGVyUmVhbFRpbWUgPSBjb2x1bW4/LmZpbHRlclJlYWxUaW1lID8/IGZhbHNlO1xuXG4gICAgICAgIGlmIChjb2x1bW4uZmlsdGVyVmFsdWVzKSB7XG4gICAgICAgICAgICB0aGlzLmZpbHRlclZhbHVlcyA9IGNvbHVtbi5maWx0ZXJWYWx1ZXM7ICAvL3NlbGVjdCBvcHRpb24gZmlsdGVyIHZhbHVlLlxuICAgICAgICAgICAgdGhpcy5maWx0ZXJWYWx1ZXNSZW1vdGVTb3VyY2UgPSB0eXBlb2YgY29sdW1uLmZpbHRlclZhbHVlcyA9PT0gXCJzdHJpbmdcIiA/IGNvbHVtbi5maWx0ZXJWYWx1ZXMgOiB1bmRlZmluZWQ7ICAvL3NlbGVjdCBvcHRpb24gZmlsdGVyIHZhbHVlIGFqYXggc291cmNlLlxuICAgICAgICAgICAgdGhpcy5maWx0ZXJFbGVtZW50ID0gY29sdW1uLmZpbHRlck11bHRpU2VsZWN0ID8gXCJtdWx0aVwiIDogXCJzZWxlY3RcIjtcbiAgICAgICAgICAgIHRoaXMuZmlsdGVyTXVsdGlTZWxlY3QgPSBjb2x1bW4uZmlsdGVyTXVsdGlTZWxlY3Q7XG4gICAgICAgIH1cbiAgICB9XG59XG5cbmV4cG9ydCB7IENvbHVtbiB9OyIsImltcG9ydCB7IEhlYWRlckNlbGwgfSBmcm9tIFwiLi4vY2VsbC9oZWFkZXJDZWxsLmpzXCI7XG5pbXBvcnQgeyBDb2x1bW4gfSBmcm9tIFwiLi9jb2x1bW4uanNcIjtcbi8qKlxuICogQ3JlYXRlcyBhbmQgbWFuYWdlcyB0aGUgY29sdW1ucyBmb3IgdGhlIGdyaWQuICBXaWxsIGNyZWF0ZSBhIGBDb2x1bW5gIG9iamVjdCBmb3IgZWFjaCBjb2x1bW4gZGVmaW5pdGlvbiBwcm92aWRlZCBieSB0aGUgdXNlci5cbiAqL1xuY2xhc3MgQ29sdW1uTWFuYWdlciB7XG4gICAgI2NvbHVtbnM7XG4gICAgI2luZGV4Q291bnRlciA9IDA7XG4gICAgLyoqXG4gICAgICogVHJhbnNmb3JtcyB1c2VyJ3MgY29sdW1uIGRlZmluaXRpb25zIGludG8gY29uY3JldGUgYENvbHVtbmAgY2xhc3Mgb2JqZWN0cy4gIFdpbGwgYWxzbyBjcmVhdGUgYEhlYWRlckNlbGxgIG9iamVjdHMgXG4gICAgICogZm9yIGVhY2ggY29sdW1uLlxuICAgICAqIEBwYXJhbSB7QXJyYXk8T2JqZWN0Pn0gY29sdW1ucyBDb2x1bW4gZGVmaW5pdGlvbnMgZnJvbSB1c2VyLlxuICAgICAqIEBwYXJhbSB7U2V0dGluZ3NHcmlkfSBzZXR0aW5ncyBHcmlkIHNldHRpbmdzLlxuICAgICAqL1xuICAgIGNvbnN0cnVjdG9yKGNvbHVtbnMsIHNldHRpbmdzKSB7XG4gICAgICAgIHRoaXMuI2NvbHVtbnMgPSBbXTtcbiAgICAgICAgdGhpcy5zZXR0aW5ncyA9IHNldHRpbmdzO1xuICAgICAgICB0aGlzLnRhYmxlRXZlbkNvbHVtbldpZHRocyA9IHNldHRpbmdzLnRhYmxlRXZlbkNvbHVtbldpZHRocztcbiAgICAgICAgdGhpcy5oYXNIZWFkZXJGaWx0ZXJzID0gZmFsc2U7XG5cbiAgICAgICAgZm9yIChjb25zdCBjIG9mIGNvbHVtbnMpIHtcbiAgICAgICAgICAgIGNvbnN0IGNvbCA9IG5ldyBDb2x1bW4oYywgc2V0dGluZ3MsIHRoaXMuI2luZGV4Q291bnRlcik7XG4gICAgICAgICAgXG4gICAgICAgICAgICBjb2wuaGVhZGVyQ2VsbCA9IG5ldyBIZWFkZXJDZWxsKGNvbCk7XG5cbiAgICAgICAgICAgIHRoaXMuI2NvbHVtbnMucHVzaChjb2wpO1xuICAgICAgICAgICAgdGhpcy4jaW5kZXhDb3VudGVyKys7XG4gICAgICAgIH1cbiAgICAgICAgLy8gQ2hlY2sgaWYgYW55IGNvbHVtbiBoYXMgYSBmaWx0ZXIgZGVmaW5lZFxuICAgICAgICBpZiAodGhpcy4jY29sdW1ucy5zb21lKChjKSA9PiBjLmhhc0ZpbHRlcikpIHtcbiAgICAgICAgICAgIHRoaXMuaGFzSGVhZGVyRmlsdGVycyA9IHRydWU7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoc2V0dGluZ3MudGFibGVFdmVuQ29sdW1uV2lkdGhzKSB7XG4gICAgICAgICAgICB0aGlzLiNzZXRFdmVuQ29sdW1uV2lkdGhzKCk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICAjc2V0RXZlbkNvbHVtbldpZHRocygpIHsgXG4gICAgICAgIGNvbnN0IGNvdW50ID0gKHRoaXMuI2luZGV4Q291bnRlciArIDEpO1xuICAgICAgICBjb25zdCB3aWR0aCA9IDEwMCAvIGNvdW50O1xuXG4gICAgICAgIHRoaXMuI2NvbHVtbnMuZm9yRWFjaCgoaCkgPT4gaC5oZWFkZXJDZWxsLmVsZW1lbnQuc3R5bGUud2lkdGggPSBgJHt3aWR0aH0lYCk7XG4gICAgfVxuICAgIC8qKlxuICAgICAqIEdldCBhcnJheSBvZiBgQ29sdW1uYCBvYmplY3RzLlxuICAgICAqIEByZXR1cm5zIHtBcnJheTxDb2x1bW4+fSBhcnJheSBvZiBgQ29sdW1uYCBvYmplY3RzLlxuICAgICAqL1xuICAgIGdldCBjb2x1bW5zKCkge1xuICAgICAgICByZXR1cm4gdGhpcy4jY29sdW1ucztcbiAgICB9XG4gICAgLyoqXG4gICAgICogQWRkcyBhIG5ldyBjb2x1bW4gdG8gdGhlIGNvbHVtbnMgY29sbGVjdGlvbi5cbiAgICAgKiBAcGFyYW0ge09iamVjdH0gY29sdW1uIENvbHVtbiBkZWZpbml0aW9uIG9iamVjdC5cbiAgICAgKiBAcGFyYW0ge251bWJlcn0gW2luZGV4PW51bGxdIEluZGV4IHRvIGluc2VydCB0aGUgY29sdW1uIGF0LiBJZiBudWxsLCBhcHBlbmRzIHRvIHRoZSBlbmQuXG4gICAgICovXG4gICAgYWRkQ29sdW1uKGNvbHVtbiwgaW5kZXggPSBudWxsKSB7IFxuICAgICAgICBjb25zdCBjb2wgPSBuZXcgQ29sdW1uKGNvbHVtbiwgdGhpcy5zZXR0aW5ncywgdGhpcy4jaW5kZXhDb3VudGVyKTtcbiAgICAgICAgY29sLmhlYWRlckNlbGwgPSBuZXcgSGVhZGVyQ2VsbChjb2wpO1xuXG4gICAgICAgIGlmIChpbmRleCAhPT0gbnVsbCAmJiBpbmRleCA+PSAwICYmIGluZGV4IDwgdGhpcy4jY29sdW1ucy5sZW5ndGgpIHtcbiAgICAgICAgICAgIHRoaXMuI2NvbHVtbnMuc3BsaWNlKGluZGV4LCAwLCBjb2wpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdGhpcy4jY29sdW1ucy5wdXNoKGNvbCk7XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLiNpbmRleENvdW50ZXIrKztcblxuICAgICAgICBpZiAodGhpcy50YWJsZUV2ZW5Db2x1bW5XaWR0aHMpIHtcbiAgICAgICAgICAgIHRoaXMuI3NldEV2ZW5Db2x1bW5XaWR0aHMoKTtcbiAgICAgICAgfVxuICAgIH1cbn1cblxuZXhwb3J0IHsgQ29sdW1uTWFuYWdlciB9OyIsIi8qKlxuICogQ2xhc3MgdG8gYnVpbGQgYSBkYXRhLXByb2Nlc3NpbmcgcGlwZWxpbmUgdGhhdCBpbnZva2VzIGFuIGFzeW5jIGZ1bmN0aW9uIHRvIHJldHJpZXZlIGRhdGEgZnJvbSBhIHJlbW90ZSBzb3VyY2UsIFxuICogYW5kIHBhc3MgdGhlIHJlc3VsdHMgdG8gYW4gYXNzb2NpYXRlZCBoYW5kbGVyIGZ1bmN0aW9uLiAgV2lsbCBleGVjdXRlIHN0ZXBzIGluIHRoZSBvcmRlciB0aGV5IGFyZSBhZGRlZCB0byB0aGUgY2xhc3MuXG4gKiBcbiAqIFRoZSBtYWluIHB1cnBvc2Ugb2YgdGhpcyBjbGFzcyBpcyB0byByZXRyaWV2ZSByZW1vdGUgZGF0YSBmb3Igc2VsZWN0IGlucHV0IGNvbnRyb2xzLCBidXQgY2FuIGJlIHVzZWQgZm9yIGFueSBoYW5kbGluZyBcbiAqIG9mIHJlbW90ZSBkYXRhIHJldHJpZXZhbCBhbmQgcHJvY2Vzc2luZy5cbiAqL1xuY2xhc3MgRGF0YVBpcGVsaW5lIHtcbiAgICAjcGlwZWxpbmVzO1xuICAgIC8qKlxuICAgICAqIENyZWF0ZXMgZGF0YS1wcm9jZXNzaW5nIHBpcGVsaW5lIGNsYXNzLiAgV2lsbCBpbnRlcm5hbGx5IGJ1aWxkIGEga2V5L3ZhbHVlIHBhaXIgb2YgZXZlbnRzIGFuZCBhc3NvY2lhdGVkXG4gICAgICogY2FsbGJhY2sgZnVuY3Rpb25zLiAgVmFsdWUgd2lsbCBiZSBhbiBhcnJheSB0byBhY2NvbW1vZGF0ZSBtdWx0aXBsZSBjYWxsYmFja3MgYXNzaWduZWQgdG8gdGhlIHNhbWUgZXZlbnQgXG4gICAgICoga2V5IG5hbWUuXG4gICAgICogQHBhcmFtIHtTZXR0aW5nc0dyaWR9IHNldHRpbmdzIFxuICAgICAqL1xuICAgIGNvbnN0cnVjdG9yKHNldHRpbmdzKSB7XG4gICAgICAgIHRoaXMuI3BpcGVsaW5lcyA9IHt9OyBcbiAgICAgICAgdGhpcy5hamF4VXJsID0gc2V0dGluZ3MuYWpheFVybDtcbiAgICB9XG5cbiAgICBjb3VudEV2ZW50U3RlcHMoZXZlbnROYW1lKSB7XG4gICAgICAgIGlmICghdGhpcy4jcGlwZWxpbmVzW2V2ZW50TmFtZV0pIHJldHVybiAwO1xuXG4gICAgICAgIHJldHVybiB0aGlzLiNwaXBlbGluZXNbZXZlbnROYW1lXS5sZW5ndGg7XG4gICAgfVxuICAgIC8qKlxuICAgICAqIFJldHVybnMgYHRydWVgIGlmIHN0ZXBzIGFyZSByZWdpc3RlcmVkIGZvciB0aGUgYXNzb2NpYXRlZCBldmVudCBuYW1lLCBvciBgZmFsc2VgIGlmIG5vIG1hdGNoaW5nIHJlc3VsdHMgYXJlIGZvdW5kLlxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBldmVudE5hbWUgRXZlbnQgbmFtZS5cbiAgICAgKiBAcmV0dXJucyB7Ym9vbGVhbn0gYHRydWVgIGlmIHJlc3VsdHMgYXJlIGZvdW5kIGZvciBldmVudCBuYW1lLCBvdGhlcndpc2UgYGZhbHNlYC5cbiAgICAgKi9cbiAgICBoYXNQaXBlbGluZShldmVudE5hbWUpIHtcbiAgICAgICAgaWYgKCF0aGlzLiNwaXBlbGluZXNbZXZlbnROYW1lXSkgcmV0dXJuIGZhbHNlO1xuXG4gICAgICAgIHJldHVybiB0aGlzLiNwaXBlbGluZXNbZXZlbnROYW1lXS5sZW5ndGggPiAwO1xuICAgIH1cbiAgICAvKipcbiAgICAgKiBSZWdpc3RlciBhbiBhc3luY2hyb25vdXMgY2FsbGJhY2sgc3RlcCB0byB0aGUgcGlwZWxpbmUuICBNb3JlIHRoYW4gb25lIGNhbGxiYWNrIGNhbiBiZSByZWdpc3RlcmVkIHRvIHRoZSBzYW1lIGV2ZW50IG5hbWUuXG4gICAgICogXG4gICAgICogSWYgYSBkdXBsaWNhdGUvbWF0Y2hpbmcgZXZlbnQgbmFtZSBhbmQgY2FsbGJhY2sgZnVuY3Rpb24gaGFzIGFscmVhZHkgYmVlbiByZWdpc3RlcmVkLCBtZXRob2Qgd2lsbCBza2lwIHRoZSBcbiAgICAgKiByZWdpc3RyYXRpb24gcHJvY2Vzcy5cbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gZXZlbnROYW1lIEV2ZW50IG5hbWUuXG4gICAgICogQHBhcmFtIHtGdW5jdGlvbn0gY2FsbGJhY2sgQW4gYXN5bmMgZnVuY3Rpb24uXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IFt1cmw9XCJcIl0gVGFyZ2V0IHVybC4gIFdpbGwgdXNlIGBhamF4VXJsYCBwcm9wZXJ0eSBkZWZhdWx0IGlmIGFyZ3VtZW50IGlzIGVtcHR5LlxuICAgICAqL1xuICAgIGFkZFN0ZXAoZXZlbnROYW1lLCBjYWxsYmFjaywgdXJsID0gXCJcIikge1xuICAgICAgICBpZiAoIXRoaXMuI3BpcGVsaW5lc1tldmVudE5hbWVdKSB7XG4gICAgICAgICAgICB0aGlzLiNwaXBlbGluZXNbZXZlbnROYW1lXSA9IFtdO1xuICAgICAgICB9IGVsc2UgaWYgKHRoaXMuI3BpcGVsaW5lc1tldmVudE5hbWVdLnNvbWUoKHgpID0+IHguY2FsbGJhY2sgPT09IGNhbGxiYWNrKSkge1xuICAgICAgICAgICAgY29uc29sZS53YXJuKFwiQ2FsbGJhY2sgZnVuY3Rpb24gYWxyZWFkeSBmb3VuZCBmb3I6IFwiICsgZXZlbnROYW1lKTtcbiAgICAgICAgICAgIHJldHVybjsgIC8vIElmIGV2ZW50IG5hbWUgYW5kIGNhbGxiYWNrIGFscmVhZHkgZXhpc3QsIGRvbid0IGFkZC5cbiAgICAgICAgfVxuXG4gICAgICAgIGlmICh1cmwgPT09IFwiXCIpIHtcbiAgICAgICAgICAgIHVybCA9IHRoaXMuYWpheFVybDtcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMuI3BpcGVsaW5lc1tldmVudE5hbWVdLnB1c2goe3VybDogdXJsLCBjYWxsYmFjazogY2FsbGJhY2t9KTtcbiAgICB9XG4gICAgLyoqXG4gICAgICogRXhlY3V0ZXMgdGhlIEhUVFAgcmVxdWVzdChzKSBmb3IgdGhlIGdpdmVuIGV2ZW50IG5hbWUsIGFuZCBwYXNzZXMgdGhlIHJlc3VsdHMgdG8gdGhlIGFzc29jaWF0ZWQgY2FsbGJhY2sgZnVuY3Rpb24uICBcbiAgICAgKiBNZXRob2QgZXhwZWN0cyByZXR1cm4gdHlwZSBvZiByZXF1ZXN0IHRvIGJlIGEgSlNPTiByZXNwb25zZS5cbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gZXZlbnROYW1lIFxuICAgICAqL1xuICAgIGFzeW5jIGV4ZWN1dGUoZXZlbnROYW1lKSB7XG4gICAgICAgIGZvciAobGV0IGl0ZW0gb2YgdGhpcy4jcGlwZWxpbmVzW2V2ZW50TmFtZV0pIHtcbiAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgY29uc3QgcmVzcG9uc2UgPSBhd2FpdCBmZXRjaChpdGVtLnVybCwgeyBcbiAgICAgICAgICAgICAgICAgICAgbWV0aG9kOiBcIkdFVFwiLCBcbiAgICAgICAgICAgICAgICAgICAgbW9kZTogXCJjb3JzXCIsXG4gICAgICAgICAgICAgICAgICAgIGhlYWRlcnM6IHsgQWNjZXB0OiBcImFwcGxpY2F0aW9uL2pzb25cIiB9IFxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgIGlmIChyZXNwb25zZS5vaykge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBkYXRhID0gYXdhaXQgcmVzcG9uc2UuanNvbigpO1xuXG4gICAgICAgICAgICAgICAgICAgIGl0ZW0uY2FsbGJhY2soZGF0YSk7XG4gICAgICAgICAgICAgICAgfSBcbiAgICAgICAgICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgICAgICAgICAgIHdpbmRvdy5hbGVydChlcnIubWVzc2FnZSk7XG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2coZXJyLm1lc3NhZ2UpO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxufVxuXG5leHBvcnQgeyBEYXRhUGlwZWxpbmUgfTsiLCJjbGFzcyBEYXRhTG9hZGVyIHtcbiAgICAvKipcbiAgICAgKiBDcmVhdGUgY2xhc3MgdG8gcmV0cmlldmUgZGF0YSB2aWEgYW4gQWpheCBjYWxsLlxuICAgICAqIEBwYXJhbSB7U2V0dGluZ3NHcmlkfSBzZXR0aW5ncyBncmlkIHNldHRpbmdzLlxuICAgICAqL1xuICAgIGNvbnN0cnVjdG9yKHNldHRpbmdzKSB7XG4gICAgICAgIHRoaXMuYWpheFVybCA9IHNldHRpbmdzLmFqYXhVcmw7XG4gICAgfVxuICAgIC8qKipcbiAgICAgKiBVc2VzIGlucHV0IHBhcmFtZXRlcidzIGtleS92YWx1ZSBwYXJpcyB0byBidWlsZCBhIGZ1bGx5IHF1YWxpZmllZCB1cmwgd2l0aCBxdWVyeSBzdHJpbmcgdmFsdWVzLlxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSB1cmwgVGFyZ2V0IHVybC5cbiAgICAgKiBAcGFyYW0ge29iamVjdH0gW3BhcmFtZXRlcnM9e31dIElucHV0IHBhcmFtZXRlcnMuXG4gICAgICogQHJldHVybnMge3N0cmluZ30gRnVsbHkgcXVhbGlmaWVkIHVybC5cbiAgICAgKi9cbiAgICBidWlsZFVybCh1cmwsIHBhcmFtZXRlcnMgPSB7fSkge1xuICAgICAgICBjb25zdCBwID0gT2JqZWN0LmtleXMocGFyYW1ldGVycyk7XG4gIFxuICAgICAgICBpZiAocC5sZW5ndGggPT09IDApIHtcbiAgICAgICAgICAgIHJldHVybiB1cmw7XG4gICAgICAgIH1cblxuICAgICAgICBsZXQgcmVzdWx0ID0gW107XG5cbiAgICAgICAgZm9yIChjb25zdCBrZXkgb2YgcCkge1xuICAgICAgICAgICAgaWYgKEFycmF5LmlzQXJyYXkocGFyYW1ldGVyc1trZXldKSkge1xuICAgICAgICAgICAgICAgIGNvbnN0IG11bHRpID0gcGFyYW1ldGVyc1trZXldLm1hcChrID0+IGAke2tleX09JHtlbmNvZGVVUklDb21wb25lbnQoayl9YCk7XG5cbiAgICAgICAgICAgICAgICByZXN1bHQgPSByZXN1bHQuY29uY2F0KG11bHRpKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgcmVzdWx0LnB1c2goYCR7a2V5fT0ke2VuY29kZVVSSUNvbXBvbmVudChwYXJhbWV0ZXJzW2tleV0pfWApO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHVybC5pbmRleE9mKFwiP1wiKSAhPT0gLTEgPyBgJHt1cmx9JiR7cmVzdWx0LmpvaW4oXCImXCIpfWAgOiBgJHt1cmx9PyR7cmVzdWx0LmpvaW4oXCImXCIpfWA7XG4gICAgfVxuICAgIC8qKlxuICAgICAqIE1ha2VzIGFuIEFqYXggY2FsbCB0byB0YXJnZXQgcmVzb3VyY2UsIGFuZCByZXR1cm5zIHRoZSByZXN1bHRzIGFzIGEgSlNPTiBhcnJheS5cbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gdXJsIHVybC5cbiAgICAgKiBAcGFyYW0ge09iamVjdH0gcGFyYW1ldGVycyBrZXkvdmFsdWUgcXVlcnkgc3RyaW5nIHBhaXJzLlxuICAgICAqIEByZXR1cm5zIHtBcnJheSB8IE9iamVjdH1cbiAgICAgKi9cbiAgICBhc3luYyByZXF1ZXN0RGF0YSh1cmwsIHBhcmFtZXRlcnMgPSB7fSkge1xuICAgICAgICBsZXQgcmVzdWx0ID0gW107XG4gICAgICAgIGNvbnN0IHRhcmdldFVybCA9IHRoaXMuYnVpbGRVcmwodXJsLCBwYXJhbWV0ZXJzKTtcblxuICAgICAgICB0cnkge1xuICAgICAgICAgICAgY29uc3QgcmVzcG9uc2UgPSBhd2FpdCBmZXRjaCh0YXJnZXRVcmwsIHsgXG4gICAgICAgICAgICAgICAgbWV0aG9kOiBcIkdFVFwiLCBcbiAgICAgICAgICAgICAgICBtb2RlOiBcImNvcnNcIixcbiAgICAgICAgICAgICAgICBoZWFkZXJzOiB7IEFjY2VwdDogXCJhcHBsaWNhdGlvbi9qc29uXCIgfSBcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgXG4gICAgICAgICAgICBpZiAocmVzcG9uc2Uub2spIHtcbiAgICAgICAgICAgICAgICByZXN1bHQgPSBhd2FpdCByZXNwb25zZS5qc29uKCk7XG4gICAgICAgICAgICB9IFxuICAgICAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgICAgICAgIHdpbmRvdy5hbGVydChlcnIubWVzc2FnZSk7XG4gICAgICAgICAgICBjb25zb2xlLmxvZyhlcnIubWVzc2FnZSk7XG4gICAgICAgICAgICByZXN1bHQgPSBbXTtcbiAgICAgICAgfVxuICBcbiAgICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICB9XG4gICAgLyoqXG4gICAgICogTWFrZXMgYW4gQWpheCBjYWxsIHRvIHRhcmdldCByZXNvdXJjZSBpZGVudGlmaWVkIGluIHRoZSBgYWpheFVybGAgU2V0dGluZ3MgcHJvcGVydHksIGFuZCByZXR1cm5zIHRoZSByZXN1bHRzIGFzIGEgSlNPTiBhcnJheS5cbiAgICAgKiBAcGFyYW0ge09iamVjdH0gW3BhcmFtZXRlcnM9e31dIGtleS92YWx1ZSBxdWVyeSBzdHJpbmcgcGFpcnMuXG4gICAgICogQHJldHVybnMge0FycmF5IHwgT2JqZWN0fVxuICAgICAqL1xuICAgIGFzeW5jIHJlcXVlc3RHcmlkRGF0YShwYXJhbWV0ZXJzID0ge30pIHtcbiAgICAgICAgcmV0dXJuIHRoaXMucmVxdWVzdERhdGEodGhpcy5hamF4VXJsLCBwYXJhbWV0ZXJzKTtcbiAgICB9XG59XG5cbmV4cG9ydCB7IERhdGFMb2FkZXIgfTsiLCIvKipcbiAqIFByb3ZpZGVzIG1ldGhvZHMgdG8gc3RvcmUgYW5kIHBlcnNpc3QgZGF0YSBmb3IgdGhlIGdyaWQuXG4gKi9cbmNsYXNzIERhdGFQZXJzaXN0ZW5jZSB7XG4gICAgLyoqXG4gICAgICogQ3JlYXRlcyBjbGFzcyBvYmplY3QgdG8gc3RvcmUgYW5kIHBlcnNpc3QgZ3JpZCBkYXRhLlxuICAgICAqIEBwYXJhbSB7QXJyYXk8T2JqZWN0Pn0gZGF0YSByb3cgZGF0YS5cbiAgICAgKi9cbiAgICBjb25zdHJ1Y3RvcihkYXRhKSB7XG4gICAgICAgIHRoaXMuZGF0YSA9IGRhdGE7XG4gICAgICAgIHRoaXMuZGF0YUNhY2hlID0gZGF0YS5sZW5ndGggPiAwID8gc3RydWN0dXJlZENsb25lKGRhdGEpIDogW107XG4gICAgfVxuICAgIC8qKlxuICAgICAqIFJldHVybnMgdGhlIHJvdyBkYXRhLlxuICAgICAqIEByZXR1cm5zIHtudW1iZXJ9IENvdW50IG9mIHJvd3MgaW4gdGhlIGRhdGEuXG4gICAgICovXG4gICAgZ2V0IHJvd0NvdW50KCkge1xuICAgICAgICByZXR1cm4gdGhpcy5kYXRhLmxlbmd0aDtcbiAgICB9XG4gICAgLyoqXG4gICAgICogU2F2ZXMgdGhlIGRhdGEgdG8gdGhlIGNsYXNzIG9iamVjdC4gIFdpbGwgYWxzbyBjYWNoZSBhIGNvcHkgb2YgdGhlIGRhdGEgZm9yIGxhdGVyIHJlc3RvcmF0aW9uIGlmIGZpbHRlcmluZyBvciBzb3J0aW5nIGlzIGFwcGxpZWQuXG4gICAgICogQHBhcmFtIHtBcnJheTxvYmplY3Q+fSBkYXRhIERhdGEgc2V0LlxuICAgICAqL1xuICAgIHNldERhdGEgPSAoZGF0YSkgPT4ge1xuICAgICAgICBpZiAoIUFycmF5LmlzQXJyYXkoZGF0YSkpIHtcbiAgICAgICAgICAgIHRoaXMuZGF0YSA9IFtdO1xuICAgICAgICAgICAgdGhpcy5kYXRhQ2FjaGUgPSBbXTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMuZGF0YSA9IGRhdGE7XG4gICAgICAgIHRoaXMuZGF0YUNhY2hlID0gZGF0YS5sZW5ndGggPiAwID8gc3RydWN0dXJlZENsb25lKGRhdGEpIDogW107XG4gICAgfTtcbiAgICAvKipcbiAgICAgKiBSZXNldHMgdGhlIGRhdGEgdG8gdGhlIG9yaWdpbmFsIHN0YXRlIHdoZW4gdGhlIGNsYXNzIHdhcyBjcmVhdGVkLlxuICAgICAqL1xuICAgIHJlc3RvcmVEYXRhKCkge1xuICAgICAgICB0aGlzLmRhdGEgPSBzdHJ1Y3R1cmVkQ2xvbmUodGhpcy5kYXRhQ2FjaGUpO1xuICAgIH1cbn1cblxuZXhwb3J0IHsgRGF0YVBlcnNpc3RlbmNlIH07IiwiLyoqXG4gKiBDbGFzcyB0aGF0IGFsbG93cyB0aGUgc3Vic2NyaXB0aW9uIGFuZCBwdWJsaWNhdGlvbiBvZiBncmlkIHJlbGF0ZWQgZXZlbnRzLlxuICogQGNsYXNzXG4gKi9cbmNsYXNzIEdyaWRFdmVudHMge1xuICAgICNldmVudHM7XG5cbiAgICBjb25zdHJ1Y3RvcigpIHtcbiAgICAgICAgdGhpcy4jZXZlbnRzID0ge307XG4gICAgfVxuXG4gICAgI2d1YXJkKGV2ZW50TmFtZSkge1xuICAgICAgICBpZiAoIXRoaXMuI2V2ZW50cykgcmV0dXJuIGZhbHNlO1xuXG4gICAgICAgIHJldHVybiAodGhpcy4jZXZlbnRzW2V2ZW50TmFtZV0pO1xuICAgIH1cbiAgICAvKipcbiAgICAgKiBBZGRzIGFuIGV2ZW50IHRvIHB1Ymxpc2hlciBjb2xsZWN0aW9uLlxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBldmVudE5hbWUgRXZlbnQgbmFtZS5cbiAgICAgKiBAcGFyYW0ge0Z1bmN0aW9ufSBoYW5kbGVyIENhbGxiYWNrIGZ1bmN0aW9uLlxuICAgICAqIEBwYXJhbSB7Ym9vbGVhbn0gW2lzQXN5bmM9ZmFsc2VdIFRydWUgaWYgY2FsbGJhY2sgc2hvdWxkIGV4ZWN1dGUgd2l0aCBhd2FpdCBvcGVyYXRpb24uXG4gICAgICogQHBhcmFtIHtudW1iZXJ9IFtwcmlvcml0eT0wXSBPcmRlciBpbiB3aGljaCBldmVudCBzaG91bGQgYmUgZXhlY3V0ZWQuXG4gICAgICovXG4gICAgc3Vic2NyaWJlKGV2ZW50TmFtZSwgaGFuZGxlciwgaXNBc3luYyA9IGZhbHNlLCBwcmlvcml0eSA9IDApIHtcbiAgICAgICAgaWYgKCF0aGlzLiNldmVudHNbZXZlbnROYW1lXSkge1xuICAgICAgICAgICAgdGhpcy4jZXZlbnRzW2V2ZW50TmFtZV0gPSBbeyBoYW5kbGVyLCBwcmlvcml0eSwgaXNBc3luYyB9XTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgdGhpcy4jZXZlbnRzW2V2ZW50TmFtZV0ucHVzaCh7IGhhbmRsZXIsIHByaW9yaXR5LCBpc0FzeW5jIH0pO1xuICAgICAgICB0aGlzLiNldmVudHNbZXZlbnROYW1lXS5zb3J0KChhLCBiKSA9PiB7XG4gICAgICAgICAgICByZXR1cm4gYS5wcmlvcml0eSAtIGIucHJpb3JpdHk7XG4gICAgICAgIH0pO1xuICAgIH1cbiAgICAvKipcbiAgICAgKiBSZW1vdmVzIHRoZSB0YXJnZXQgZXZlbnQgZnJvbSB0aGUgcHVibGljYXRpb24gY2hhaW4uXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IGV2ZW50TmFtZSBFdmVudCBuYW1lLlxuICAgICAqIEBwYXJhbSB7RnVuY3Rpb259IGhhbmRsZXIgRXZlbnQgaGFuZGxlci5cbiAgICAgKi9cbiAgICB1bnN1YnNjcmliZShldmVudE5hbWUsIGhhbmRsZXIpIHtcbiAgICAgICAgaWYgKCF0aGlzLiNndWFyZChldmVudE5hbWUpKSByZXR1cm47XG5cbiAgICAgICAgdGhpcy4jZXZlbnRzW2V2ZW50TmFtZV0gPSB0aGlzLiNldmVudHNbZXZlbnROYW1lXS5maWx0ZXIoaCA9PiBoICE9PSBoYW5kbGVyKTtcbiAgICB9XG4gICAgLyoqXG4gICAgICogVGFrZXMgdGhlIHJlc3VsdCBvZiBlYWNoIHN1YnNjcmliZXIncyBjYWxsYmFjayBmdW5jdGlvbiBhbmQgY2hhaW5zIHRoZW0gaW50byBvbmUgcmVzdWx0LlxuICAgICAqIFVzZWQgdG8gY3JlYXRlIGEgbGlzdCBvZiBwYXJhbWV0ZXJzIGZyb20gbXVsdGlwbGUgbW9kdWxlczogaS5lLiBzb3J0LCBmaWx0ZXIsIGFuZCBwYWdpbmcgaW5wdXRzLlxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBldmVudE5hbWUgZXZlbnQgbmFtZVxuICAgICAqIEBwYXJhbSB7T2JqZWN0fSBbaW5pdGlhbFZhbHVlPXt9XSBpbml0aWFsIHZhbHVlXG4gICAgICogQHJldHVybnMge09iamVjdH1cbiAgICAgKi9cbiAgICBjaGFpbihldmVudE5hbWUsIGluaXRpYWxWYWx1ZSA9IHt9KSB7XG4gICAgICAgIGlmICghdGhpcy4jZ3VhcmQoZXZlbnROYW1lKSkgcmV0dXJuO1xuXG4gICAgICAgIGxldCByZXN1bHQgPSBpbml0aWFsVmFsdWU7XG5cbiAgICAgICAgdGhpcy4jZXZlbnRzW2V2ZW50TmFtZV0uZm9yRWFjaCgoaCkgPT4ge1xuICAgICAgICAgICAgcmVzdWx0ID0gaC5oYW5kbGVyKHJlc3VsdCk7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgfVxuICAgIC8qKlxuICAgICAqIFRyaWdnZXIgY2FsbGJhY2sgZnVuY3Rpb24gZm9yIHN1YnNjcmliZXJzIG9mIHRoZSBgZXZlbnROYW1lYC5cbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gZXZlbnROYW1lIEV2ZW50IG5hbWUuXG4gICAgICogQHBhcmFtICB7Li4uYW55fSBhcmdzIEFyZ3VtZW50cy5cbiAgICAgKi9cbiAgICBhc3luYyB0cmlnZ2VyKGV2ZW50TmFtZSwgLi4uYXJncykge1xuICAgICAgICBpZiAoIXRoaXMuI2d1YXJkKGV2ZW50TmFtZSkpIHJldHVybjtcblxuICAgICAgICBmb3IgKGxldCBoIG9mIHRoaXMuI2V2ZW50c1tldmVudE5hbWVdKSB7XG4gICAgICAgICAgICBpZiAoaC5pc0FzeW5jKSB7XG4gICAgICAgICAgICAgICAgYXdhaXQgaC5oYW5kbGVyKC4uLmFyZ3MpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBoLmhhbmRsZXIoLi4uYXJncyk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG59XG5cbmV4cG9ydCB7IEdyaWRFdmVudHMgfTsiLCJjbGFzcyBEYXRlSGVscGVyIHtcbiAgICBzdGF0aWMgdGltZVJlR2V4ID0gbmV3IFJlZ0V4cChcIlswLTldOlswLTldXCIpO1xuICAgIC8qKlxuICAgICAqIENvbnZlcnQgc3RyaW5nIHRvIERhdGUgb2JqZWN0IHR5cGUuICBFeHBlY3RzIHN0cmluZyBmb3JtYXQgb2YgeWVhci1tb250aC1kYXkuXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IHZhbHVlIFN0cmluZyBkYXRlIHdpdGggZm9ybWF0IG9mIHllYXItbW9udGgtZGF5LlxuICAgICAqIEByZXR1cm5zIHtEYXRlIHwgc3RyaW5nfSBEYXRlIGlmIGNvbnZlcnNpb24gaXMgc3VjY2Vzc2Z1bC4gIE90aGVyd2lzZSwgZW1wdHkgc3RyaW5nLlxuICAgICAqL1xuICAgIHN0YXRpYyBwYXJzZURhdGUodmFsdWUpIHtcbiAgICAgICAgLy9DaGVjayBpZiBzdHJpbmcgaXMgZGF0ZSBvbmx5IGJ5IGxvb2tpbmcgZm9yIG1pc3NpbmcgdGltZSBjb21wb25lbnQuICBcbiAgICAgICAgLy9JZiBtaXNzaW5nLCBhZGQgaXQgc28gZGF0ZSBpcyBpbnRlcnByZXRlZCBhcyBsb2NhbCB0aW1lLlxuICAgICAgICBpZiAoIXRoaXMudGltZVJlR2V4LnRlc3QodmFsdWUpKSB7XG4gICAgICAgICAgICB2YWx1ZSA9IGAke3ZhbHVlfVQwMDowMGA7XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCBkYXRlID0gbmV3IERhdGUodmFsdWUpO1xuICAgICAgICBcbiAgICAgICAgcmV0dXJuIChOdW1iZXIuaXNOYU4oZGF0ZS52YWx1ZU9mKCkpKSA/IFwiXCIgOiBkYXRlO1xuICAgIH1cbiAgICAvKipcbiAgICAgKiBDb252ZXJ0IHN0cmluZyB0byBEYXRlIG9iamVjdCB0eXBlLCBzZXR0aW5nIHRoZSB0aW1lIGNvbXBvbmVudCB0byBtaWRuaWdodC4gIEV4cGVjdHMgc3RyaW5nIGZvcm1hdCBvZiB5ZWFyLW1vbnRoLWRheS5cbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gdmFsdWUgU3RyaW5nIGRhdGUgd2l0aCBmb3JtYXQgb2YgeWVhci1tb250aC1kYXkuXG4gICAgICogQHJldHVybnMge0RhdGUgfCBzdHJpbmd9IERhdGUgaWYgY29udmVyc2lvbiBpcyBzdWNjZXNzZnVsLiAgT3RoZXJ3aXNlLCBlbXB0eSBzdHJpbmcuXG4gICAgICovXG4gICAgc3RhdGljIHBhcnNlRGF0ZU9ubHkodmFsdWUpIHtcbiAgICAgICAgY29uc3QgZGF0ZSA9IHRoaXMucGFyc2VEYXRlKHZhbHVlKTtcblxuICAgICAgICBpZiAoZGF0ZSA9PT0gXCJcIikgcmV0dXJuIFwiXCI7ICAvL0ludmFsaWQgZGF0ZS5cblxuICAgICAgICBkYXRlLnNldEhvdXJzKDAsIDAsIDAsIDApOyAvL1NldCB0aW1lIHRvIG1pZG5pZ2h0IHRvIHJlbW92ZSB0aW1lIGNvbXBvbmVudC5cblxuICAgICAgICByZXR1cm4gZGF0ZTtcbiAgICB9XG4gICAgLyoqXG4gICAgICogUmV0dXJucyBgdHJ1ZWAgaWYgdmFsdWUgaXMgYSBEYXRlIG9iamVjdCB0eXBlLlxuICAgICAqIEBwYXJhbSB7b2JqZWN0fSB2YWx1ZSBcbiAgICAgKiBAcmV0dXJucyB7Ym9vbGVhbn0gUmV0dXJucyBgdHJ1ZWAgaWYgdmFsdWUgaXMgYSBEYXRlIG9iamVjdCB0eXBlLCBvdGhlcndpc2UgYGZhbHNlYC5cbiAgICAgKi9cbiAgICBzdGF0aWMgaXNEYXRlKHZhbHVlKSB7IFxuICAgICAgICByZXR1cm4gT2JqZWN0LnByb3RvdHlwZS50b1N0cmluZy5jYWxsKHZhbHVlKSA9PT0gXCJbb2JqZWN0IERhdGVdXCI7XG5cbiAgICB9XG59XG5cbmV4cG9ydCB7IERhdGVIZWxwZXIgfTsiLCJpbXBvcnQgeyBEYXRlSGVscGVyIH0gZnJvbSBcIi4uLy4uL2hlbHBlcnMvZGF0ZUhlbHBlci5qc1wiO1xuLyoqXG4gKiBQcm92aWRlcyBtZXRob2RzIHRvIGZvcm1hdCBkYXRlIGFuZCB0aW1lIHN0cmluZ3MuICBFeHBlY3RzIGRhdGUgc3RyaW5nIGluIGZvcm1hdCBvZiB5ZWFyLW1vbnRoLWRheS5cbiAqL1xuY2xhc3MgRm9ybWF0RGF0ZVRpbWUge1xuICAgIHN0YXRpYyBtb250aHNMb25nID0gW1wiSmFudWFyeVwiLCBcIkZlYnJ1YXJ5XCIsIFwiTWFyY2hcIiwgXCJBcHJpbFwiLCBcIk1heVwiLCBcIkp1bmVcIiwgXCJKdWx5XCIsIFwiQXVndXN0XCIsIFwiU2VwdGVtYmVyXCIsIFwiT2N0b2JlclwiLCBcIk5vdmVtYmVyXCIsIFwiRGVjZW1iZXJcIl07XG4gICAgc3RhdGljIG1vbnRoc1Nob3J0ID0gW1wiSmFuXCIsIFwiRmViXCIsIFwiTWFyXCIsIFwiQXByXCIsIFwiTWF5XCIsIFwiSnVuXCIsIFwiSnVsXCIsIFwiQXVnXCIsIFwiU2VwXCIsIFwiT2N0XCIsIFwiTm92XCIsIFwiRGVjXCJdO1xuXG4gICAgc3RhdGljIGxlYWRpbmdaZXJvKG51bSkge1xuICAgICAgICByZXR1cm4gbnVtIDwgMTAgPyBcIjBcIiArIG51bSA6IG51bTtcbiAgICB9XG4gICAgLyoqXG4gICAgICogUmV0dXJucyBhIGZvcm1hdHRlZCBkYXRlIHRpbWUgc3RyaW5nLiAgRXhwZWN0cyBkYXRlIHN0cmluZyBpbiBmb3JtYXQgb2YgeWVhci1tb250aC1kYXkuICBJZiBgZm9ybWF0dGVyUGFyYW1zYCBpcyBlbXB0eSwgXG4gICAgICogZnVuY3Rpb24gd2lsbCByZXZlcnQgdG8gZGVmYXVsdCB2YWx1ZXMuIEV4cGVjdGVkIHByb3BlcnR5IHZhbHVlcyBpbiBgZm9ybWF0dGVyUGFyYW1zYCBvYmplY3Q6XG4gICAgICogLSBkYXRlRmllbGQ6IGZpZWxkIHRvIGNvbnZlcnQgZGF0ZSB0aW1lLlxuICAgICAqIC0gZm9ybWF0OiBzdHJpbmcgZm9ybWF0IHRlbXBsYXRlLlxuICAgICAqIEBwYXJhbSB7T2JqZWN0fSByb3dEYXRhIFJvdyBkYXRhLlxuICAgICAqIEBwYXJhbSB7Q29sdW1ufSBjb2x1bW4gQ29sdW1uIGNsYXNzIG9iamVjdC5cbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gZGVmYXVsdEZvcm1hdCBEZWZhdWx0IHN0cmluZyBmb3JtYXQ6IE1NL2RkL3l5eXlcbiAgICAgKiBAcGFyYW0ge2Jvb2xlYW59IFthZGRUaW1lPWZhbHNlXSBBcHBseSBkYXRlIHRpbWUgZm9ybWF0dGluZz9cbiAgICAgKiBAcmV0dXJucyB7c3RyaW5nfVxuICAgICAqL1xuICAgIHN0YXRpYyBhcHBseShyb3dEYXRhLCBjb2x1bW4sIGRlZmF1bHRGb3JtYXQgPSBcIk1NL2RkL3l5eXlcIiwgYWRkVGltZSA9IGZhbHNlKSB7XG4gICAgICAgIGxldCByZXN1bHQgPSBjb2x1bW4/LmZvcm1hdHRlclBhcmFtcz8uZm9ybWF0ID8/IGRlZmF1bHRGb3JtYXQ7XG4gICAgICAgIGxldCBmaWVsZCA9IGNvbHVtbj8uZm9ybWF0dGVyUGFyYW1zPy5kYXRlRmllbGQgXG4gICAgICAgICAgICA/IHJvd0RhdGFbY29sdW1uLmZvcm1hdHRlclBhcmFtcy5kYXRlRmllbGRdXG4gICAgICAgICAgICA6IHJvd0RhdGFbY29sdW1uLmZpZWxkXTtcblxuICAgICAgICBpZiAoZmllbGQgPT09IG51bGwpIHtcbiAgICAgICAgICAgIHJldHVybiBcIlwiO1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc3QgZGF0ZSA9IERhdGVIZWxwZXIucGFyc2VEYXRlKGZpZWxkKTtcblxuICAgICAgICBpZiAoZGF0ZSA9PT0gXCJcIikge1xuICAgICAgICAgICAgcmV0dXJuIFwiXCI7XG4gICAgICAgIH1cblxuICAgICAgICBsZXQgZm9ybWF0cyA9IHtcbiAgICAgICAgICAgIGQ6IGRhdGUuZ2V0RGF0ZSgpLFxuICAgICAgICAgICAgZGQ6IHRoaXMubGVhZGluZ1plcm8oZGF0ZS5nZXREYXRlKCkpLFxuXG4gICAgICAgICAgICBNOiBkYXRlLmdldE1vbnRoKCkgKyAxLFxuICAgICAgICAgICAgTU06IHRoaXMubGVhZGluZ1plcm8oZGF0ZS5nZXRNb250aCgpICsgMSksXG4gICAgICAgICAgICBNTU06IHRoaXMubW9udGhzU2hvcnRbZGF0ZS5nZXRNb250aCgpXSxcbiAgICAgICAgICAgIE1NTU06IHRoaXMubW9udGhzTG9uZ1tkYXRlLmdldE1vbnRoKCldLFxuXG4gICAgICAgICAgICB5eTogZGF0ZS5nZXRGdWxsWWVhcigpLnRvU3RyaW5nKCkuc2xpY2UoLTIpLFxuICAgICAgICAgICAgeXl5eTogZGF0ZS5nZXRGdWxsWWVhcigpXG4gICAgICAgIH07XG5cbiAgICAgICAgaWYgKGFkZFRpbWUpIHtcbiAgICAgICAgICAgIGxldCBob3VycyA9IGRhdGUuZ2V0SG91cnMoKTtcbiAgICAgICAgICAgIGxldCBob3VyczEyID0gaG91cnMgJSAxMiA9PT0gMCA/IDEyIDogaG91cnMgJSAxMjtcblxuICAgICAgICAgICAgZm9ybWF0cy5zID0gZGF0ZS5nZXRTZWNvbmRzKCk7XG4gICAgICAgICAgICBmb3JtYXRzLnNzID0gdGhpcy5sZWFkaW5nWmVybyhkYXRlLmdldFNlY29uZHMoKSk7XG4gICAgICAgICAgICBmb3JtYXRzLm0gPSBkYXRlLmdldE1pbnV0ZXMoKTtcbiAgICAgICAgICAgIGZvcm1hdHMubW0gPSB0aGlzLmxlYWRpbmdaZXJvKGRhdGUuZ2V0TWludXRlcygpKTtcbiAgICAgICAgICAgIGZvcm1hdHMuaCA9IGhvdXJzMTI7XG4gICAgICAgICAgICBmb3JtYXRzLmhoID0gIHRoaXMubGVhZGluZ1plcm8oaG91cnMxMik7XG4gICAgICAgICAgICBmb3JtYXRzLkggPSBob3VycztcbiAgICAgICAgICAgIGZvcm1hdHMuSEggPSB0aGlzLmxlYWRpbmdaZXJvKGhvdXJzKTtcbiAgICAgICAgICAgIGZvcm1hdHMuaHAgPSBob3VycyA8IDEyID8gXCJBTVwiIDogXCJQTVwiO1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc3QgdGFyZ2V0cyA9IHJlc3VsdC5zcGxpdCgvXFwvfC18XFxzfDovKTtcblxuICAgICAgICBmb3IgKGxldCBpdGVtIG9mIHRhcmdldHMpIHtcbiAgICAgICAgICAgIHJlc3VsdCA9IHJlc3VsdC5yZXBsYWNlKGl0ZW0sIGZvcm1hdHNbaXRlbV0pO1xuICAgICAgICB9XG4gICAgXG4gICAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgfVxufVxuXG5leHBvcnQgeyBGb3JtYXREYXRlVGltZSB9OyIsIi8qKlxuICogUHJvdmlkZXMgbWV0aG9kIHRvIGZvcm1hdCBhIGxpbmsgYXMgYW4gYW5jaG9yIHRhZyBlbGVtZW50LlxuICovXG5jbGFzcyBGb3JtYXRMaW5rIHtcbiAgICAvKipcbiAgICAgKiBGb3JtYXR0ZXIgdGhhdCBjcmVhdGUgYW4gYW5jaG9yIHRhZyBlbGVtZW50LiBocmVmIGFuZCBvdGhlciBhdHRyaWJ1dGVzIGNhbiBiZSBtb2RpZmllZCB3aXRoIHByb3BlcnRpZXMgaW4gdGhlIFxuICAgICAqICdmb3JtYXR0ZXJQYXJhbXMnIHBhcmFtZXRlci4gIEV4cGVjdGVkIHByb3BlcnR5IHZhbHVlczogXG4gICAgICogLSB1cmxQcmVmaXg6IEJhc2UgdXJsIGFkZHJlc3MuXG4gICAgICogLSByb3V0ZUZpZWxkOiBSb3V0ZSB2YWx1ZS5cbiAgICAgKiAtIHF1ZXJ5RmllbGQ6IEZpZWxkIG5hbWUgZnJvbSBkYXRhc2V0IHRvIGJ1aWxkIHF1ZXJ5IHN0aW5nIGtleS92YWx1ZSBpbnB1dC5cbiAgICAgKiAtIGZpZWxkVGV4dDogVXNlIGZpZWxkIG5hbWUgdG8gc2V0IGlubmVyIHRleHQgdG8gYXNzb2NpYXRlZCBkYXRhc2V0IHZhbHVlLlxuICAgICAqIC0gaW5uZXJUZXh0OiBSYXcgaW5uZXIgdGV4dCB2YWx1ZSBvciBmdW5jdGlvbi4gIElmIGZ1bmN0aW9uIGlzIHByb3ZpZGVkLCBpdCB3aWxsIGJlIGNhbGxlZCB3aXRoIHJvd0RhdGEgYW5kIGZvcm1hdHRlclBhcmFtcyBhcyBwYXJhbWV0ZXJzLlxuICAgICAqIC0gdGFyZ2V0OiBIb3cgdGFyZ2V0IGRvY3VtZW50IHNob3VsZCBiZSBvcGVuZWQuXG4gICAgICogQHBhcmFtIHtPYmplY3R9IHJvd0RhdGEgUm93IGRhdGEuXG4gICAgICogQHBhcmFtIHt7IHVybFByZWZpeDogc3RyaW5nLCBxdWVyeUZpZWxkOiBzdHJpbmcsIGZpZWxkVGV4dDogc3RyaW5nLCBpbm5lclRleHQ6IHN0cmluZyB8IEZ1bmN0aW9uLCB0YXJnZXQ6IHN0cmluZyB9fSBmb3JtYXR0ZXJQYXJhbXMgU2V0dGluZ3MuXG4gICAgICogQHJldHVybiB7SFRNTEFuY2hvckVsZW1lbnR9IGFuY2hvciB0YWcgZWxlbWVudC5cbiAgICAgKiAqL1xuICAgIHN0YXRpYyBhcHBseShyb3dEYXRhLCBmb3JtYXR0ZXJQYXJhbXMpIHtcbiAgICAgICAgY29uc3QgZWwgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiYVwiKTtcblxuICAgICAgICBsZXQgdXJsID0gZm9ybWF0dGVyUGFyYW1zLnVybFByZWZpeDtcbiAgICAgICAgLy9BcHBseSByb3V0ZSB2YWx1ZSBiZWZvcmUgcXVlcnkgc3RyaW5nLlxuICAgICAgICBpZiAoZm9ybWF0dGVyUGFyYW1zLnJvdXRlRmllbGQpIHtcbiAgICAgICAgICAgIHVybCArPSBcIi9cIiArIGVuY29kZVVSSUNvbXBvbmVudChyb3dEYXRhW2Zvcm1hdHRlclBhcmFtcy5yb3V0ZUZpZWxkXSk7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoZm9ybWF0dGVyUGFyYW1zLnF1ZXJ5RmllbGQpIHtcbiAgICAgICAgICAgIGNvbnN0IHFyeVZhbHVlID0gZW5jb2RlVVJJQ29tcG9uZW50KHJvd0RhdGFbZm9ybWF0dGVyUGFyYW1zLnF1ZXJ5RmllbGRdKTtcblxuICAgICAgICAgICAgdXJsID0gYCR7dXJsfT8ke2Zvcm1hdHRlclBhcmFtcy5xdWVyeUZpZWxkfT0ke3FyeVZhbHVlfWA7XG4gICAgICAgIH1cblxuICAgICAgICBlbC5ocmVmID0gdXJsO1xuXG4gICAgICAgIGlmIChmb3JtYXR0ZXJQYXJhbXMuZmllbGRUZXh0KSB7XG4gICAgICAgICAgICBlbC5pbm5lckhUTUwgPSByb3dEYXRhW2Zvcm1hdHRlclBhcmFtcy5maWVsZFRleHRdO1xuICAgICAgICB9IGVsc2UgaWYgKCh0eXBlb2YgZm9ybWF0dGVyUGFyYW1zLmlubmVyVGV4dCA9PT0gXCJmdW5jdGlvblwiKSkge1xuICAgICAgICAgICAgZWwuaW5uZXJIVE1MID0gZm9ybWF0dGVyUGFyYW1zLmlubmVyVGV4dChyb3dEYXRhLCBmb3JtYXR0ZXJQYXJhbXMpO1xuICAgICAgICB9IGVsc2UgaWYgKGZvcm1hdHRlclBhcmFtcy5pbm5lclRleHQpIHtcbiAgICAgICAgICAgIGVsLmlubmVySFRNTCA9IGZvcm1hdHRlclBhcmFtcy5pbm5lclRleHQ7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoZm9ybWF0dGVyUGFyYW1zLnRhcmdldCkge1xuICAgICAgICAgICAgZWwuc2V0QXR0cmlidXRlKFwidGFyZ2V0XCIsIGZvcm1hdHRlclBhcmFtcy50YXJnZXQpO1xuICAgICAgICAgICAgZWwuc2V0QXR0cmlidXRlKFwicmVsXCIsIFwibm9vcGVuZXJcIik7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gZWw7XG4gICAgfVxufVxuXG5leHBvcnQgeyBGb3JtYXRMaW5rIH07IiwiLyoqXG4gKiBQcm92aWRlcyBtZXRob2QgdG8gZm9ybWF0IG51bWVyaWMgdmFsdWVzIGludG8gc3RyaW5ncyB3aXRoIHNwZWNpZmllZCBzdHlsZXMgb2YgZGVjaW1hbCwgY3VycmVuY3ksIG9yIHBlcmNlbnQuXG4gKi9cbmNsYXNzIEZvcm1hdE51bWVyaWMge1xuICAgIHN0YXRpYyB2YWxpZFN0eWxlcyA9IFtcImRlY2ltYWxcIiwgXCJjdXJyZW5jeVwiLCBcInBlcmNlbnRcIl07XG4gICAgLyoqXG4gICAgICogUmV0dXJucyBhIGZvcm1hdHRlZCBudW1lcmljIHN0cmluZy4gIEV4cGVjdGVkIHByb3BlcnR5IHZhbHVlczogXG4gICAgICogLSBwcmVjaXNpb246IHJvdW5kaW5nIHByZWNpc2lvbi5cbiAgICAgKiAtIHN0eWxlOiBmb3JtYXR0aW5nIHN0eWxlIHRvIHVzZS5cbiAgICAgKiBAcGFyYW0ge09iamVjdH0gcm93RGF0YSBSb3cgZGF0YS5cbiAgICAgKiBAcGFyYW0ge0NvbHVtbn0gY29sdW1uIENvbHVtbiBjbGFzcyBvYmplY3QuXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IFtzdHlsZT1cImRlY2ltYWxcIl0gRm9ybWF0dGluZyBzdHlsZSB0byB1c2UuIERlZmF1bHQgaXMgXCJkZWNpbWFsXCIuXG4gICAgICogQHBhcmFtIHtudW1iZXJ9IFtwcmVjaXNpb249Ml0gUm91bmRpbmcgcHJlY2lzaW9uLiBEZWZhdWx0IGlzIDIuXG4gICAgICogQHJldHVybnMge3N0cmluZ31cbiAgICAgKi9cbiAgICBzdGF0aWMgYXBwbHkocm93RGF0YSwgY29sdW1uLCBzdHlsZSA9IFwiZGVjaW1hbFwiLCBwcmVjaXNpb24gPSAyKSB7XG4gICAgICAgIGNvbnN0IGZsb2F0VmFsID0gcm93RGF0YVtjb2x1bW4uZmllbGRdO1xuXG4gICAgICAgIGlmIChpc05hTihmbG9hdFZhbCkpIHJldHVybiBmbG9hdFZhbDtcblxuICAgICAgICBpZiAoIXRoaXMudmFsaWRTdHlsZXMuaW5jbHVkZXMoc3R5bGUpKSB7XG4gICAgICAgICAgICBzdHlsZSA9IFwiZGVjaW1hbFwiO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIG5ldyBJbnRsLk51bWJlckZvcm1hdChcImVuLVVTXCIsIHtcbiAgICAgICAgICAgIHN0eWxlOiBzdHlsZSxcbiAgICAgICAgICAgIG1heGltdW1GcmFjdGlvbkRpZ2l0czogcHJlY2lzaW9uLFxuICAgICAgICAgICAgY3VycmVuY3k6IFwiVVNEXCJcbiAgICAgICAgfSkuZm9ybWF0KGZsb2F0VmFsKTtcbiAgICB9XG59XG5cbmV4cG9ydCB7IEZvcm1hdE51bWVyaWMgfTsiLCJjbGFzcyBGb3JtYXRTdGFyIHtcbiAgICAvKipcbiAgICAgKiBSZXR1cm5zIGFuIGVsZW1lbnQgb2Ygc3RhciByYXRpbmdzIGJhc2VkIG9uIGludGVnZXIgdmFsdWVzLiAgRXhwZWN0ZWQgcHJvcGVydHkgdmFsdWVzOiBcbiAgICAgKiAtIHN0YXJzOiBudW1iZXIgb2Ygc3RhcnMgdG8gZGlzcGxheS5cbiAgICAgKiBAcGFyYW0ge09iamVjdH0gcm93RGF0YSByb3cgZGF0YS5cbiAgICAgKiBAcGFyYW0ge0NvbHVtbn0gY29sdW1uIGNvbHVtbiBjbGFzcyBvYmplY3QuXG4gICAgICogQHJldHVybnMge0hUTUxEaXZFbGVtZW50fVxuICAgICAqL1xuICAgIHN0YXRpYyBhcHBseShyb3dEYXRhLCBjb2x1bW4pIHtcbiAgICAgICAgbGV0IHZhbHVlID0gcm93RGF0YVtjb2x1bW4uZmllbGRdO1xuICAgICAgICBjb25zdCBtYXhTdGFycyA9IGNvbHVtbi5mb3JtYXR0ZXJQYXJhbXM/LnN0YXJzID8gY29sdW1uLmZvcm1hdHRlclBhcmFtcy5zdGFycyA6IDU7XG4gICAgICAgIGNvbnN0IGNvbnRhaW5lciA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJkaXZcIik7XG4gICAgICAgIGNvbnN0IHN0YXJzID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcInNwYW5cIik7XG4gICAgICAgIGNvbnN0IHN0YXIgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50TlMoXCJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2Z1wiLCBcInN2Z1wiKTtcbiAgICAgICAgY29uc3Qgc3RhckFjdGl2ZSA9ICc8cG9seWdvbiBmaWxsPVwiI0ZGRUEwMFwiIHN0cm9rZT1cIiNDMUFCNjBcIiBzdHJva2Utd2lkdGg9XCIzNy42MTUyXCIgc3Ryb2tlLWxpbmVjYXA9XCJyb3VuZFwiIHN0cm9rZS1saW5lam9pbj1cInJvdW5kXCIgc3Ryb2tlLW1pdGVybGltaXQ9XCIxMFwiIHBvaW50cz1cIjI1OS4yMTYsMjkuOTQyIDMzMC4yNywxNzMuOTE5IDQ4OS4xNiwxOTcuMDA3IDM3NC4xODUsMzA5LjA4IDQwMS4zMyw0NjcuMzEgMjU5LjIxNiwzOTIuNjEyIDExNy4xMDQsNDY3LjMxIDE0NC4yNSwzMDkuMDggMjkuMjc0LDE5Ny4wMDcgMTg4LjE2NSwxNzMuOTE5IFwiLz4nO1xuICAgICAgICBjb25zdCBzdGFySW5hY3RpdmUgPSAnPHBvbHlnb24gZmlsbD1cIiNEMkQyRDJcIiBzdHJva2U9XCIjNjg2ODY4XCIgc3Ryb2tlLXdpZHRoPVwiMzcuNjE1MlwiIHN0cm9rZS1saW5lY2FwPVwicm91bmRcIiBzdHJva2UtbGluZWpvaW49XCJyb3VuZFwiIHN0cm9rZS1taXRlcmxpbWl0PVwiMTBcIiBwb2ludHM9XCIyNTkuMjE2LDI5Ljk0MiAzMzAuMjcsMTczLjkxOSA0ODkuMTYsMTk3LjAwNyAzNzQuMTg1LDMwOS4wOCA0MDEuMzMsNDY3LjMxIDI1OS4yMTYsMzkyLjYxMiAxMTcuMTA0LDQ2Ny4zMSAxNDQuMjUsMzA5LjA4IDI5LjI3NCwxOTcuMDA3IDE4OC4xNjUsMTczLjkxOSBcIi8+JztcblxuICAgICAgICAvL3N0eWxlIHN0YXJzIGhvbGRlclxuICAgICAgICBzdGFycy5zdHlsZS52ZXJ0aWNhbEFsaWduID0gXCJtaWRkbGVcIjtcbiAgICAgICAgLy9zdHlsZSBzdGFyXG4gICAgICAgIHN0YXIuc2V0QXR0cmlidXRlKFwid2lkdGhcIiwgXCIxNFwiKTtcbiAgICAgICAgc3Rhci5zZXRBdHRyaWJ1dGUoXCJoZWlnaHRcIiwgXCIxNFwiKTtcbiAgICAgICAgc3Rhci5zZXRBdHRyaWJ1dGUoXCJ2aWV3Qm94XCIsIFwiMCAwIDUxMiA1MTJcIik7XG4gICAgICAgIHN0YXIuc2V0QXR0cmlidXRlKFwieG1sOnNwYWNlXCIsIFwicHJlc2VydmVcIik7XG4gICAgICAgIHN0YXIuc3R5bGUucGFkZGluZyA9IFwiMCAxcHhcIjtcblxuICAgICAgICB2YWx1ZSA9IHZhbHVlICYmICFpc05hTih2YWx1ZSkgPyBwYXJzZUludCh2YWx1ZSkgOiAwO1xuICAgICAgICB2YWx1ZSA9IE1hdGgubWF4KDAsIE1hdGgubWluKHZhbHVlLCBtYXhTdGFycykpO1xuXG4gICAgICAgIGZvcihsZXQgaSA9IDE7IGkgPD0gbWF4U3RhcnM7IGkrKyl7XG4gICAgICAgICAgICBjb25zdCBuZXh0U3RhciA9IHN0YXIuY2xvbmVOb2RlKHRydWUpO1xuXG4gICAgICAgICAgICBuZXh0U3Rhci5pbm5lckhUTUwgPSBpIDw9IHZhbHVlID8gc3RhckFjdGl2ZSA6IHN0YXJJbmFjdGl2ZTtcblxuICAgICAgICAgICAgc3RhcnMuYXBwZW5kQ2hpbGQobmV4dFN0YXIpO1xuICAgICAgICB9XG5cbiAgICAgICAgY29udGFpbmVyLnN0eWxlLndoaXRlU3BhY2UgPSBcIm5vd3JhcFwiO1xuICAgICAgICBjb250YWluZXIuc3R5bGUub3ZlcmZsb3cgPSBcImhpZGRlblwiO1xuICAgICAgICBjb250YWluZXIuc3R5bGUudGV4dE92ZXJmbG93ID0gXCJlbGxpcHNpc1wiO1xuICAgICAgICBjb250YWluZXIuc2V0QXR0cmlidXRlKFwiYXJpYS1sYWJlbFwiLCB2YWx1ZSk7XG4gICAgICAgIGNvbnRhaW5lci5hcHBlbmQoc3RhcnMpO1xuXG4gICAgICAgIHJldHVybiBjb250YWluZXI7XG4gICAgfVxufVxuXG5leHBvcnQgeyBGb3JtYXRTdGFyIH07IiwiaW1wb3J0IHsgRm9ybWF0RGF0ZVRpbWUgfSBmcm9tIFwiLi9mb3JtYXR0ZXJzL2RhdGV0aW1lLmpzXCI7XG5pbXBvcnQgeyBGb3JtYXRMaW5rIH0gZnJvbSBcIi4vZm9ybWF0dGVycy9saW5rLmpzXCI7XG5pbXBvcnQgeyBGb3JtYXROdW1lcmljIH0gZnJvbSBcIi4vZm9ybWF0dGVycy9udW1lcmljLmpzXCI7XG5pbXBvcnQgeyBGb3JtYXRTdGFyIH0gZnJvbSBcIi4vZm9ybWF0dGVycy9zdGFyLmpzXCI7XG5pbXBvcnQgeyBDc3NIZWxwZXIgfSBmcm9tIFwiLi4vaGVscGVycy9jc3NIZWxwZXIuanNcIjtcblxuY2xhc3MgQ2VsbCB7XG4gICAgLyoqXG4gICAgICogQ3JlYXRlIGNlbGwgb2JqZWN0IHRoYXQgcmVwcmVzZW50cyB0aGUgYHRkYCB0YWJsZSBib2R5IGVsZW1lbnQuXG4gICAgICogQHBhcmFtIHtBcnJheTxvYmplY3Q+fSByb3dEYXRhIFJvdyBkYXRhLlxuICAgICAqIEBwYXJhbSB7Q29sdW1ufSBjb2x1bW4gQ29sdW1uIG9iamVjdC5cbiAgICAgKiBAcGFyYW0ge09iamVjdH0gbW9kdWxlcyBHcmlkIG1vZHVsZShzKSBhZGRlZCBieSB1c2VyIGZvciBjdXN0b20gZm9ybWF0dGluZy5cbiAgICAgKiBAcGFyYW0ge0hUTUxUYWJsZVJvd0VsZW1lbnR9IHJvdyBUYWJsZSByb3cgYHRyYCBlbGVtZW50LlxuICAgICAqL1xuICAgIGNvbnN0cnVjdG9yKHJvd0RhdGEsIGNvbHVtbiwgbW9kdWxlcywgcm93KSB7XG4gICAgICAgIHRoaXMuZWxlbWVudCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJ0ZFwiKTtcblxuICAgICAgICBpZiAoY29sdW1uLmZvcm1hdHRlcikge1xuICAgICAgICAgICAgdGhpcy4jaW5pdChyb3dEYXRhLCBjb2x1bW4sIG1vZHVsZXMsIHJvdyk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB0aGlzLmVsZW1lbnQuaW5uZXJUZXh0ID0gcm93RGF0YVtjb2x1bW4uZmllbGRdO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKGNvbHVtbi50b29sdGlwRmllbGQpIHtcbiAgICAgICAgICAgIHRoaXMuI2FwcGx5VG9vbHRpcChyb3dEYXRhW2NvbHVtbi50b29sdGlwRmllbGRdLCBjb2x1bW4udG9vbHRpcExheW91dCk7XG4gICAgICAgIH1cbiAgICB9XG4gICAgLyoqXG4gICAgICogQXBwbGllcyB0b29sdGlwIGZ1bmN0aW9uYWxpdHkgdG8gdGhlIGNlbGwuICBJZiB0aGUgY2VsbCdzIGNvbnRlbnQgY29udGFpbnMgdGV4dCBvbmx5LCBpdCB3aWxsIGNyZWF0ZSBhIHRvb2x0aXAgXG4gICAgICogYHNwYW5gIGVsZW1lbnQgYW5kIGFwcGx5IHRoZSBjb250ZW50IHRvIGl0LlxuICAgICAqIEBwYXJhbSB7c3RyaW5nIHwgbnVtYmVyIHwgRGF0ZSB8IG51bGx9IGNvbnRlbnQgVG9vbHRpcCBjb250ZW50IHRvIGJlIGRpc3BsYXllZC5cbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gbGF5b3V0IENTUyBjbGFzcyBmb3IgdG9vbHRpcCBsYXlvdXQsIGVpdGhlciBcImRhdGFncmlkcy10b29sdGlwLXJpZ2h0XCIgb3IgXCJkYXRhZ3JpZHMtdG9vbHRpcC1sZWZ0XCIuXG4gICAgICovXG4gICAgI2FwcGx5VG9vbHRpcChjb250ZW50LCBsYXlvdXQpIHtcbiAgICAgICAgaWYgKGNvbnRlbnQgPT09IG51bGwgfHwgY29udGVudCA9PT0gXCJcIikgcmV0dXJuO1xuICAgICAgICBcbiAgICAgICAgbGV0IHRvb2x0aXBFbGVtZW50ID0gdGhpcy5lbGVtZW50LmZpcnN0RWxlbWVudENoaWxkO1xuXG4gICAgICAgIGlmICh0b29sdGlwRWxlbWVudCA9PT0gbnVsbCkge1xuICAgICAgICAgICAgdG9vbHRpcEVsZW1lbnQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwic3BhblwiKTtcbiAgICAgICAgICAgIHRvb2x0aXBFbGVtZW50LmlubmVyVGV4dCA9IHRoaXMuZWxlbWVudC5pbm5lclRleHQ7XG4gICAgICAgICAgICB0aGlzLmVsZW1lbnQucmVwbGFjZUNoaWxkcmVuKHRvb2x0aXBFbGVtZW50KTtcbiAgICAgICAgfVxuXG4gICAgICAgIHRvb2x0aXBFbGVtZW50LmRhdGFzZXQudG9vbHRpcCA9IGNvbnRlbnQ7XG4gICAgICAgIHRvb2x0aXBFbGVtZW50LmNsYXNzTGlzdC5hZGQoQ3NzSGVscGVyLnRvb2x0aXAsIGxheW91dCk7XG4gICAgfVxuXG4gICAgI2luaXQocm93RGF0YSwgY29sdW1uLCBtb2R1bGVzLCByb3cpIHtcbiAgICAgICAgaWYgKHR5cGVvZiBjb2x1bW4uZm9ybWF0dGVyID09PSBcImZ1bmN0aW9uXCIpIHtcbiAgICAgICAgICAgIHRoaXMuZWxlbWVudC5hcHBlbmQoY29sdW1uLmZvcm1hdHRlcihyb3dEYXRhLCBjb2x1bW4uZm9ybWF0dGVyUGFyYW1zLCB0aGlzLmVsZW1lbnQsIHJvdykpO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gIFxuICAgICAgICBzd2l0Y2ggKGNvbHVtbi5mb3JtYXR0ZXIpIHtcbiAgICAgICAgICAgIGNhc2UgXCJsaW5rXCI6XG4gICAgICAgICAgICAgICAgdGhpcy5lbGVtZW50LmFwcGVuZChGb3JtYXRMaW5rLmFwcGx5KHJvd0RhdGEsIGNvbHVtbi5mb3JtYXR0ZXJQYXJhbXMpKTtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIGNhc2UgXCJkYXRlXCI6XG4gICAgICAgICAgICAgICAgdGhpcy5lbGVtZW50LmlubmVyVGV4dCA9IEZvcm1hdERhdGVUaW1lLmFwcGx5KHJvd0RhdGEsIGNvbHVtbiwgY29sdW1uLnNldHRpbmdzLmRhdGVGb3JtYXQsIGZhbHNlKTtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIGNhc2UgXCJkYXRldGltZVwiOlxuICAgICAgICAgICAgICAgIHRoaXMuZWxlbWVudC5pbm5lclRleHQgPSBGb3JtYXREYXRlVGltZS5hcHBseShyb3dEYXRhLCBjb2x1bW4sIGNvbHVtbi5zZXR0aW5ncy5kYXRlVGltZUZvcm1hdCwgdHJ1ZSk7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICBjYXNlIFwibW9uZXlcIjpcbiAgICAgICAgICAgICAgICB0aGlzLmVsZW1lbnQuaW5uZXJUZXh0ID0gRm9ybWF0TnVtZXJpYy5hcHBseShyb3dEYXRhLCBjb2x1bW4sIFwiY3VycmVuY3lcIiwgMik7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICBjYXNlIFwibnVtZXJpY1wiOlxuICAgICAgICAgICAgICAgIHRoaXMuZWxlbWVudC5pbm5lclRleHQgPSBGb3JtYXROdW1lcmljLmFwcGx5KHJvd0RhdGEsIGNvbHVtbiwgY29sdW1uLmZvcm1hdHRlclBhcmFtcz8uc3R5bGUgPz8gXCJkZWNpbWFsXCIsIGNvbHVtbi5mb3JtYXR0ZXJQYXJhbXM/LnByZWNpc2lvbiA/PyAyKTtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIGNhc2UgXCJzdGFyXCI6XG4gICAgICAgICAgICAgICAgdGhpcy5lbGVtZW50LmFwcGVuZChGb3JtYXRTdGFyLmFwcGx5KHJvd0RhdGEsIGNvbHVtbikpO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgY2FzZSBcIm1vZHVsZVwiOlxuICAgICAgICAgICAgICAgIHRoaXMuZWxlbWVudC5hcHBlbmQobW9kdWxlc1tjb2x1bW4uZm9ybWF0dGVyUGFyYW1zLm5hbWVdLmFwcGx5KHJvd0RhdGEsIGNvbHVtbiwgcm93LCB0aGlzLmVsZW1lbnQpKTtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgICAgICAgdGhpcy5lbGVtZW50LmlubmVyVGV4dCA9IHJvd0RhdGFbY29sdW1uLmZpZWxkXTtcbiAgICAgICAgfVxuICAgIH1cbn1cblxuZXhwb3J0IHsgQ2VsbCB9OyIsImltcG9ydCB7IENlbGwgfSBmcm9tIFwiLi4vY2VsbC9jZWxsLmpzXCI7XG4vKipcbiAqIENsYXNzIHRvIG1hbmFnZSB0aGUgdGFibGUgZWxlbWVudCBhbmQgaXRzIHJvd3MgYW5kIGNlbGxzLlxuICovXG5jbGFzcyBUYWJsZSB7XG4gICAgI3Jvd0NvdW50O1xuICAgIC8qKlxuICAgICAqIENyZWF0ZSBgVGFibGVgIGNsYXNzIHRvIG1hbmFnZSB0aGUgdGFibGUgZWxlbWVudCBhbmQgaXRzIHJvd3MgYW5kIGNlbGxzLlxuICAgICAqIEBwYXJhbSB7R3JpZENvbnRleHR9IGNvbnRleHQgR3JpZCBjb250ZXh0LlxuICAgICAqL1xuICAgIGNvbnN0cnVjdG9yKGNvbnRleHQpIHtcbiAgICAgICAgdGhpcy5jb250ZXh0ID0gY29udGV4dDtcbiAgICAgICAgdGhpcy50YWJsZSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJ0YWJsZVwiKTtcbiAgICAgICAgdGhpcy50aGVhZCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJ0aGVhZFwiKTtcbiAgICAgICAgdGhpcy50Ym9keSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJ0Ym9keVwiKTtcbiAgICAgICAgdGhpcy4jcm93Q291bnQgPSAwO1xuXG4gICAgICAgIHRoaXMudGFibGUuaWQgPSBgJHtjb250ZXh0LnNldHRpbmdzLmJhc2VJZE5hbWV9X3RhYmxlYDtcbiAgICAgICAgdGhpcy50YWJsZS5hcHBlbmQodGhpcy50aGVhZCwgdGhpcy50Ym9keSk7XG4gICAgICAgIHRoaXMudGFibGUuY2xhc3NOYW1lID0gY29udGV4dC5zZXR0aW5ncy50YWJsZUNzcztcbiAgICB9XG4gICAgLyoqXG4gICAgICogSW5pdGlhbGl6ZXMgdGhlIHRhYmxlIGhlYWRlciByb3cgZWxlbWVudCBieSBjcmVhdGluZyBhIHJvdyBhbmQgYXBwZW5kaW5nIGVhY2ggY29sdW1uJ3MgaGVhZGVyIGNlbGwuXG4gICAgICovXG4gICAgaW5pdGlhbGl6ZUhlYWRlcigpIHtcbiAgICAgICAgY29uc3QgdHIgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwidHJcIik7XG5cbiAgICAgICAgZm9yIChjb25zdCBjb2x1bW4gb2YgdGhpcy5jb250ZXh0LmNvbHVtbk1hbmFnZXIuY29sdW1ucykge1xuICAgICAgICAgICAgdHIuYXBwZW5kQ2hpbGQoY29sdW1uLmhlYWRlckNlbGwuZWxlbWVudCk7XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLnRoZWFkLmFwcGVuZENoaWxkKHRyKTtcbiAgICB9XG4gICAgLyoqXG4gICAgICogUmVuZGVyIHRhYmxlIGJvZHkgcm93cy4gIFdpbGwgcmVtb3ZlIGFueSBwcmlvciB0YWJsZSBib2R5IHJlc3VsdHMgYW5kIGJ1aWxkIG5ldyByb3dzIGFuZCBjZWxscy5cbiAgICAgKiBAcGFyYW0ge0FycmF5PE9iamVjdD59IGRhdGFzZXQgRGF0YSBzZXQgdG8gYnVpbGQgdGFibGUgcm93cy5cbiAgICAgKiBAcGFyYW0ge251bWJlciB8IG51bGx9IFtyb3dDb3VudD1udWxsXSBTZXQgdGhlIHJvdyBjb3VudCBwYXJhbWV0ZXIgdG8gYSBzcGVjaWZpYyB2YWx1ZSBpZiBcbiAgICAgKiByZW1vdGUgcHJvY2Vzc2luZyBpcyBiZWluZyB1c2VkLCBvdGhlcndpc2Ugd2lsbCB1c2UgdGhlIGxlbmd0aCBvZiB0aGUgZGF0YXNldC5cbiAgICAgKi9cbiAgICByZW5kZXJSb3dzKGRhdGFzZXQsIHJvd0NvdW50ID0gbnVsbCkge1xuICAgICAgICAvL0NsZWFyIGJvZHkgb2YgcHJldmlvdXMgZGF0YS5cbiAgICAgICAgdGhpcy50Ym9keS5yZXBsYWNlQ2hpbGRyZW4oKTtcbiAgICAgICAgXG4gICAgICAgIGlmICghQXJyYXkuaXNBcnJheShkYXRhc2V0KSkge1xuICAgICAgICAgICAgdGhpcy4jcm93Q291bnQgPSAwO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy4jcm93Q291bnQgPSByb3dDb3VudCA/PyBkYXRhc2V0Lmxlbmd0aDtcblxuICAgICAgICBmb3IgKGNvbnN0IGRhdGEgb2YgZGF0YXNldCkge1xuICAgICAgICAgICAgY29uc3QgdHIgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwidHJcIik7XG5cbiAgICAgICAgICAgIGZvciAobGV0IGNvbHVtbiBvZiB0aGlzLmNvbnRleHQuY29sdW1uTWFuYWdlci5jb2x1bW5zKSB7XG4gICAgICAgICAgICAgICAgY29uc3QgY2VsbCA9IG5ldyBDZWxsKGRhdGEsIGNvbHVtbiwgdGhpcy5jb250ZXh0Lm1vZHVsZXMsIHRyKTtcblxuICAgICAgICAgICAgICAgIHRyLmFwcGVuZENoaWxkKGNlbGwuZWxlbWVudCk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHRoaXMudGJvZHkuYXBwZW5kQ2hpbGQodHIpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgZ2V0IHJvd0NvdW50KCkge1xuICAgICAgICByZXR1cm4gdGhpcy4jcm93Q291bnQ7XG4gICAgfVxufVxuXG5leHBvcnQgeyBUYWJsZSB9OyIsImltcG9ydCB7IENvbHVtbk1hbmFnZXIgfSBmcm9tIFwiLi4vY29sdW1uL2NvbHVtbk1hbmFnZXIuanNcIjtcbmltcG9ydCB7IERhdGFQaXBlbGluZSB9IGZyb20gXCIuLi9kYXRhL2RhdGFQaXBlbGluZS5qc1wiO1xuaW1wb3J0IHsgRGF0YUxvYWRlciB9IGZyb20gXCIuLi9kYXRhL2RhdGFMb2FkZXIuanNcIjtcbmltcG9ydCB7IERhdGFQZXJzaXN0ZW5jZSB9IGZyb20gXCIuLi9kYXRhL2RhdGFQZXJzaXN0ZW5jZS5qc1wiO1xuaW1wb3J0IHsgR3JpZEV2ZW50cyB9IGZyb20gXCIuLi9ldmVudHMvZ3JpZEV2ZW50cy5qc1wiO1xuaW1wb3J0IHsgVGFibGUgfSBmcm9tIFwiLi4vdGFibGUvdGFibGUuanNcIjtcbi8qKlxuICogUHJvdmlkZXMgdGhlIGNvbnRleHQgZm9yIHRoZSBncmlkLCBpbmNsdWRpbmcgc2V0dGluZ3MsIGRhdGEsIGFuZCBtb2R1bGVzLiAgVGhpcyBjbGFzcyBpcyByZXNwb25zaWJsZSBmb3IgbWFuYWdpbmcgXG4gKiB0aGUgZ3JpZCdzIGNvcmUgc3RhdGUgYW5kIGJlaGF2aW9yLlxuICovXG5jbGFzcyBHcmlkQ29udGV4dCB7XG4gICAgLyoqXG4gICAgICogQ3JlYXRlIGdyaWQgY29udGV4dCwgd2hpY2ggcmVwcmVzZW50cyB0aGUgY29yZSBsb2dpYyBhbmQgZnVuY3Rpb25hbGl0eSBvZiB0aGUgZGF0YSBncmlkLlxuICAgICAqIEBwYXJhbSB7QXJyYXk8b2JqZWN0Pn0gY29sdW1ucyBDb2x1bW4gZGVmaW5pdGlvbi5cbiAgICAgKiBAcGFyYW0ge1NldHRpbmdzR3JpZH0gc2V0dGluZ3MgR3JpZCBzZXR0aW5ncy5cbiAgICAgKiBAcGFyYW0ge2FueVtdfSBbZGF0YT1bXV0gR3JpZCBkYXRhLlxuICAgICAqL1xuICAgIGNvbnN0cnVjdG9yKGNvbHVtbnMsIHNldHRpbmdzLCBkYXRhID0gW10pIHtcbiAgICAgICAgdGhpcy5zZXR0aW5ncyA9IHNldHRpbmdzO1xuICAgICAgICB0aGlzLmV2ZW50cyA9IG5ldyBHcmlkRXZlbnRzKCk7XG4gICAgICAgIHRoaXMucGlwZWxpbmUgPSBuZXcgRGF0YVBpcGVsaW5lKHRoaXMuc2V0dGluZ3MpO1xuICAgICAgICB0aGlzLmRhdGFsb2FkZXIgPSBuZXcgRGF0YUxvYWRlcih0aGlzLnNldHRpbmdzKTtcbiAgICAgICAgdGhpcy5wZXJzaXN0ZW5jZSA9IG5ldyBEYXRhUGVyc2lzdGVuY2UoZGF0YSk7XG4gICAgICAgIHRoaXMuY29sdW1uTWFuYWdlciA9IG5ldyBDb2x1bW5NYW5hZ2VyKGNvbHVtbnMsIHRoaXMuc2V0dGluZ3MpO1xuICAgICAgICB0aGlzLmdyaWQgPSBuZXcgVGFibGUodGhpcyk7XG4gICAgICAgIHRoaXMubW9kdWxlcyA9IHt9O1xuICAgIH1cbn1cblxuZXhwb3J0IHsgR3JpZENvbnRleHQgfTsiLCJleHBvcnQgZGVmYXVsdCB7XG4gICAgYmFzZUlkTmFtZTogXCJkYXRhZ3JpZFwiLCAgLy9iYXNlIG5hbWUgZm9yIGFsbCBlbGVtZW50IElEJ3MuXG4gICAgZGF0YTogW10sICAvL3JvdyBkYXRhLlxuICAgIGNvbHVtbnM6IFtdLCAgLy9jb2x1bW4gZGVmaW5pdGlvbnMuXG4gICAgZW5hYmxlUGFnaW5nOiB0cnVlLCAgLy9lbmFibGUgcGFnaW5nIG9mIGRhdGEuXG4gICAgcGFnZXJQYWdlc1RvRGlzcGxheTogNSwgIC8vbWF4IG51bWJlciBvZiBwYWdlciBidXR0b25zIHRvIGRpc3BsYXkuXG4gICAgcGFnZXJSb3dzUGVyUGFnZTogMjUsICAvL3Jvd3MgcGVyIHBhZ2UuXG4gICAgZGF0ZUZvcm1hdDogXCJNTS9kZC95eXl5XCIsICAvL3JvdyBsZXZlbCBkYXRlIGZvcm1hdC5cbiAgICBkYXRlVGltZUZvcm1hdDogXCJNTS9kZC95eXl5IEhIOm1tOnNzXCIsIC8vcm93IGxldmVsIGRhdGUgZm9ybWF0LlxuICAgIHJlbW90ZVVybDogXCJcIiwgIC8vZ2V0IGRhdGEgZnJvbSB1cmwgZW5kcG9pbnQgdmlhIEFqYXguXG4gICAgcmVtb3RlUGFyYW1zOiBcIlwiLCAgLy9wYXJhbWV0ZXJzIHRvIGJlIHBhc3NlZCBvbiBBamF4IHJlcXVlc3QuXG4gICAgcmVtb3RlUHJvY2Vzc2luZzogZmFsc2UsICAvL3RydXRoeSBzZXRzIGdyaWQgdG8gcHJvY2VzcyBmaWx0ZXIvc29ydCBvbiByZW1vdGUgc2VydmVyLlxuICAgIHRhYmxlQ3NzOiBcImRhdGFncmlkc1wiLCBcbiAgICB0YWJsZUhlYWRlclRoQ3NzOiBcIlwiLFxuICAgIHBhZ2VyQ3NzOiBcImRhdGFncmlkcy1wYWdlclwiLCBcbiAgICB0YWJsZUZpbHRlckNzczogXCJkYXRhZ3JpZHMtaW5wdXRcIiwgIC8vY3NzIGNsYXNzIGZvciBoZWFkZXIgZmlsdGVyIGlucHV0IGVsZW1lbnRzLlxuICAgIHRhYmxlRXZlbkNvbHVtbldpZHRoczogZmFsc2UsICAvL3Nob3VsZCBhbGwgY29sdW1ucyBiZSBlcXVhbCB3aWR0aD9cbiAgICB0YWJsZUNzc1NvcnRBc2M6IFwiZGF0YWdyaWRzLXNvcnQtaWNvbiBkYXRhZ3JpZHMtc29ydC1hc2NcIixcbiAgICB0YWJsZUNzc1NvcnREZXNjOiBcImRhdGFncmlkcy1zb3J0LWljb24gZGF0YWdyaWRzLXNvcnQtZGVzY1wiLFxuICAgIHJlZnJlc2hhYmxlSWQ6IFwiXCIsICAvL3JlZnJlc2ggcmVtb3RlIGRhdGEgc291cmNlcyBmb3IgZ3JpZCBhbmQvb3IgZmlsdGVyIHZhbHVlcy5cbiAgICByb3dDb3VudElkOiBcIlwiLFxuICAgIGNzdkV4cG9ydElkOiBcIlwiLFxuICAgIGNzdkV4cG9ydFJlbW90ZVNvdXJjZTogXCJcIiAvL2dldCBleHBvcnQgZGF0YSBmcm9tIHVybCBlbmRwb2ludCB2aWEgQWpheDsgdXNlZnVsIHRvIGdldCBub24tcGFnZWQgZGF0YS5cbn07IiwiaW1wb3J0IHNldHRpbmdzRGVmYXVsdHMgZnJvbSBcIi4vc2V0dGluZ3NEZWZhdWx0LmpzXCI7XG5cbmNsYXNzIE1lcmdlT3B0aW9ucyB7XG4gICAgLyoqXG4gICAgICogUmV0dXJucyBhbiBvYmplY3QgYmFzZWQgb24gdGhlIG1lcmdlZCByZXN1bHRzIG9mIHRoZSBkZWZhdWx0IGFuZCB1c2VyIHByb3ZpZGVkIHNldHRpbmdzLlxuICAgICAqIFVzZXIgcHJvdmlkZWQgc2V0dGluZ3Mgd2lsbCBvdmVycmlkZSBkZWZhdWx0cy5cbiAgICAgKiBAcGFyYW0ge09iamVjdH0gc291cmNlIHVzZXIgc3VwcGxpZWQgc2V0dGluZ3MuXG4gICAgICogQHJldHVybnMge09iamVjdH0gc2V0dGluZ3MgbWVyZ2VkIGZyb20gZGVmYXVsdCBhbmQgdXNlciB2YWx1ZXMuXG4gICAgICovXG4gICAgc3RhdGljIG1lcmdlKHNvdXJjZSkge1xuICAgICAgICAvL2NvcHkgZGVmYXVsdCBrZXkvdmFsdWUgaXRlbXMuXG4gICAgICAgIGxldCByZXN1bHQgPSBKU09OLnBhcnNlKEpTT04uc3RyaW5naWZ5KHNldHRpbmdzRGVmYXVsdHMpKTtcblxuICAgICAgICBpZiAoc291cmNlID09PSB1bmRlZmluZWQgfHwgT2JqZWN0LmtleXMoc291cmNlKS5sZW5ndGggPT09IDApIHtcbiAgICAgICAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIGZvciAobGV0IFtrZXksIHZhbHVlXSBvZiBPYmplY3QuZW50cmllcyhzb3VyY2UpKSB7XG4gICAgICAgICAgICBsZXQgdGFyZ2V0VHlwZSA9IHJlc3VsdFtrZXldICE9PSB1bmRlZmluZWQgPyByZXN1bHRba2V5XS50b1N0cmluZygpIDogdW5kZWZpbmVkO1xuICAgICAgICAgICAgbGV0IHNvdXJjZVR5cGUgPSB2YWx1ZS50b1N0cmluZygpO1xuXG4gICAgICAgICAgICBpZiAodGFyZ2V0VHlwZSAhPT0gdW5kZWZpbmVkICYmIHRhcmdldFR5cGUgIT09IHNvdXJjZVR5cGUpIHtcbiAgICAgICAgICAgICAgICByZXN1bHRba2V5XSA9IHZhbHVlO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICB9XG59XG5cbmV4cG9ydCB7IE1lcmdlT3B0aW9ucyB9OyIsIi8qKlxuICogSW1wbGVtZW50cyB0aGUgcHJvcGVydHkgc2V0dGluZ3MgZm9yIHRoZSBncmlkLlxuICovXG5jbGFzcyBTZXR0aW5nc0dyaWQge1xuICAgIC8qKlxuICAgICAqIFRyYW5zbGF0ZXMgc2V0dGluZ3MgZnJvbSBtZXJnZWQgdXNlci9kZWZhdWx0IG9wdGlvbnMgaW50byBhIGRlZmluaXRpb24gb2YgZ3JpZCBzZXR0aW5ncy5cbiAgICAgKiBAcGFyYW0ge09iamVjdH0gb3B0aW9ucyBNZXJnZWQgdXNlci9kZWZhdWx0IG9wdGlvbnMuXG4gICAgICovXG4gICAgY29uc3RydWN0b3Iob3B0aW9ucykge1xuICAgICAgICB0aGlzLmJhc2VJZE5hbWUgPSBvcHRpb25zLmJhc2VJZE5hbWU7XG4gICAgICAgIHRoaXMuZW5hYmxlUGFnaW5nID0gb3B0aW9ucy5lbmFibGVQYWdpbmc7XG4gICAgICAgIHRoaXMucGFnZXJQYWdlc1RvRGlzcGxheSA9IG9wdGlvbnMucGFnZXJQYWdlc1RvRGlzcGxheTtcbiAgICAgICAgdGhpcy5wYWdlclJvd3NQZXJQYWdlID0gb3B0aW9ucy5wYWdlclJvd3NQZXJQYWdlO1xuICAgICAgICB0aGlzLmRhdGVGb3JtYXQgPSBvcHRpb25zLmRhdGVGb3JtYXQ7XG4gICAgICAgIHRoaXMuZGF0ZVRpbWVGb3JtYXQgPSBvcHRpb25zLmRhdGVUaW1lRm9ybWF0O1xuICAgICAgICB0aGlzLnJlbW90ZVVybCA9IG9wdGlvbnMucmVtb3RlVXJsOyAgXG4gICAgICAgIHRoaXMucmVtb3RlUGFyYW1zID0gb3B0aW9ucy5yZW1vdGVQYXJhbXM7XG4gICAgICAgIHRoaXMucmVtb3RlUHJvY2Vzc2luZyA9IGZhbHNlO1xuICAgICAgICBcbiAgICAgICAgdGhpcy5hamF4VXJsID0gKHRoaXMucmVtb3RlVXJsICYmIHRoaXMucmVtb3RlUGFyYW1zKSA/IHRoaXMuX2J1aWxkQWpheFVybCh0aGlzLnJlbW90ZVVybCwgdGhpcy5yZW1vdGVQYXJhbXMpIDogdGhpcy5yZW1vdGVVcmw7XG5cbiAgICAgICAgaWYgKHR5cGVvZiBvcHRpb25zLnJlbW90ZVByb2Nlc3NpbmcgPT09IFwiYm9vbGVhblwiICYmIG9wdGlvbnMucmVtb3RlUHJvY2Vzc2luZykge1xuICAgICAgICAgICAgLy8gUmVtb3RlIHByb2Nlc3Npbmcgc2V0IHRvIGBvbmA7IHVzZSBmaXJzdCBjb2x1bW4gd2l0aCBmaWVsZCBhcyBkZWZhdWx0IHNvcnQuXG4gICAgICAgICAgICBjb25zdCBmaXJzdCA9IG9wdGlvbnMuY29sdW1ucy5maW5kKChpdGVtKSA9PiBpdGVtLmZpZWxkICE9PSB1bmRlZmluZWQpO1xuXG4gICAgICAgICAgICB0aGlzLnJlbW90ZVByb2Nlc3NpbmcgPSB0cnVlO1xuICAgICAgICAgICAgdGhpcy5yZW1vdGVTb3J0RGVmYXVsdENvbHVtbiA9IGZpcnN0LmZpZWxkO1xuICAgICAgICAgICAgdGhpcy5yZW1vdGVTb3J0RGVmYXVsdERpcmVjdGlvbiA9IFwiZGVzY1wiO1xuICAgICAgICB9IGVsc2UgaWYgKE9iamVjdC5rZXlzKG9wdGlvbnMucmVtb3RlUHJvY2Vzc2luZykubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgLy8gUmVtb3RlIHByb2Nlc3Npbmcgc2V0IHRvIGBvbmAgdXNpbmcga2V5L3ZhbHVlIHBhcmFtZXRlciBpbnB1dHMgZm9yIGRlZmF1bHQgc29ydCBjb2x1bW4uXG4gICAgICAgICAgICB0aGlzLnJlbW90ZVByb2Nlc3NpbmcgPSB0cnVlO1xuICAgICAgICAgICAgdGhpcy5yZW1vdGVTb3J0RGVmYXVsdENvbHVtbiA9IG9wdGlvbnMucmVtb3RlUHJvY2Vzc2luZy5jb2x1bW47XG4gICAgICAgICAgICB0aGlzLnJlbW90ZVNvcnREZWZhdWx0RGlyZWN0aW9uID0gb3B0aW9ucy5yZW1vdGVQcm9jZXNzaW5nLmRpcmVjdGlvbiA/PyBcImRlc2NcIjtcbiAgICAgICAgfSBcblxuICAgICAgICB0aGlzLnRhYmxlQ3NzID0gb3B0aW9ucy50YWJsZUNzcztcbiAgICAgICAgdGhpcy50YWJsZUhlYWRlclRoQ3NzID0gb3B0aW9ucy50YWJsZUhlYWRlclRoQ3NzO1xuICAgICAgICB0aGlzLnBhZ2VyQ3NzID0gb3B0aW9ucy5wYWdlckNzcztcbiAgICAgICAgdGhpcy50YWJsZUZpbHRlckNzcyA9IG9wdGlvbnMudGFibGVGaWx0ZXJDc3M7XG4gICAgICAgIHRoaXMudGFibGVFdmVuQ29sdW1uV2lkdGhzID0gb3B0aW9ucy50YWJsZUV2ZW5Db2x1bW5XaWR0aHM7XG4gICAgICAgIHRoaXMudGFibGVDc3NTb3J0QXNjID0gb3B0aW9ucy50YWJsZUNzc1NvcnRBc2M7XG4gICAgICAgIHRoaXMudGFibGVDc3NTb3J0RGVzYyA9IG9wdGlvbnMudGFibGVDc3NTb3J0RGVzYztcbiAgICAgICAgdGhpcy5yZWZyZXNoYWJsZUlkID0gb3B0aW9ucy5yZWZyZXNoYWJsZUlkO1xuICAgICAgICB0aGlzLnJvd0NvdW50SWQgPSBvcHRpb25zLnJvd0NvdW50SWQ7XG4gICAgICAgIHRoaXMuY3N2RXhwb3J0SWQgPSBvcHRpb25zLmNzdkV4cG9ydElkO1xuICAgICAgICB0aGlzLmNzdkV4cG9ydFJlbW90ZVNvdXJjZSA9IG9wdGlvbnMuY3N2RXhwb3J0UmVtb3RlU291cmNlO1xuICAgIH1cbiAgICAvKipcbiAgICAgKiBDb21waWxlcyB0aGUga2V5L3ZhbHVlIHF1ZXJ5IHBhcmFtZXRlcnMgaW50byBhIGZ1bGx5IHF1YWxpZmllZCB1cmwgd2l0aCBxdWVyeSBzdHJpbmcuXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IHVybCBiYXNlIHVybC5cbiAgICAgKiBAcGFyYW0ge29iamVjdH0gcGFyYW1zIHF1ZXJ5IHN0cmluZyBwYXJhbWV0ZXJzLlxuICAgICAqIEByZXR1cm5zIHtzdHJpbmd9IHVybCB3aXRoIHF1ZXJ5IHBhcmFtZXRlcnMuXG4gICAgICovXG4gICAgX2J1aWxkQWpheFVybCh1cmwsIHBhcmFtcykge1xuICAgICAgICBjb25zdCBwID0gT2JqZWN0LmtleXMocGFyYW1zKTtcblxuICAgICAgICBpZiAocC5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICBjb25zdCBxdWVyeSA9IHAubWFwKGsgPT4gYCR7ZW5jb2RlVVJJQ29tcG9uZW50KGspfT0ke2VuY29kZVVSSUNvbXBvbmVudChwYXJhbXNba10pfWApXG4gICAgICAgICAgICAgICAgLmpvaW4oXCImXCIpO1xuXG4gICAgICAgICAgICByZXR1cm4gYCR7dXJsfT8ke3F1ZXJ5fWA7XG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIHJldHVybiB1cmw7XG4gICAgfVxufVxuXG5leHBvcnQgeyBTZXR0aW5nc0dyaWQgfTsiLCIvKipcbiAqIFJlc3BvbnNpYmxlIGZvciByZW5kZXJpbmcgdGhlIGdyaWRzIHJvd3MgdXNpbmcgZWl0aGVyIGxvY2FsIG9yIHJlbW90ZSBkYXRhLiAgVGhpcyBzaG91bGQgYmUgdGhlIGRlZmF1bHQgbW9kdWxlIHRvIFxuICogY3JlYXRlIHJvdyBkYXRhIGlmIHBhZ2luZyBpcyBub3QgZW5hYmxlZC4gIFN1YnNjcmliZXMgdG8gdGhlIGByZW5kZXJgIGV2ZW50IHRvIGNyZWF0ZSB0aGUgZ3JpZCdzIHJvd3MgYW5kIHRoZSBgcmVtb3RlUGFyYW1zYCBcbiAqIGV2ZW50IGZvciByZW1vdGUgcHJvY2Vzc2luZy5cbiAqIFxuICogQ2xhc3Mgd2lsbCBjYWxsIHRoZSAncmVtb3RlUGFyYW1zJyBldmVudCB0byBjb25jYXRlbmF0ZSBwYXJhbWV0ZXJzIGZvciByZW1vdGUgZGF0YSByZXF1ZXN0cy5cbiAqL1xuY2xhc3MgUm93TW9kdWxlIHtcbiAgICAvKipcbiAgICAgKiBDcmVhdGVzIGdyaWQgcm93cy4gIFRoaXMgc2hvdWxkIGJlIHRoZSBkZWZhdWx0IG1vZHVsZSB0byBjcmVhdGUgcm93IGRhdGEgaWYgcGFnaW5nIGlzIG5vdCBlbmFibGVkLlxuICAgICAqIEBwYXJhbSB7R3JpZENvbnRleHR9IGNvbnRleHQgR3JpZCBjb250ZXh0IGNsYXNzLlxuICAgICAqL1xuICAgIGNvbnN0cnVjdG9yKGNvbnRleHQpIHtcbiAgICAgICAgdGhpcy5jb250ZXh0ID0gY29udGV4dDtcbiAgICB9XG5cbiAgICBpbml0aWFsaXplKCkge1xuICAgICAgICBpZiAodGhpcy5jb250ZXh0LnNldHRpbmdzLnJlbW90ZVByb2Nlc3NpbmcpIHtcbiAgICAgICAgICAgIHRoaXMuY29udGV4dC5ldmVudHMuc3Vic2NyaWJlKFwicmVuZGVyXCIsIHRoaXMucmVuZGVyUmVtb3RlLCB0cnVlLCAxMCk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB0aGlzLmNvbnRleHQuZXZlbnRzLnN1YnNjcmliZShcInJlbmRlclwiLCB0aGlzLnJlbmRlckxvY2FsLCBmYWxzZSwgMTApO1xuICAgICAgICB9XG4gICAgfVxuICAgIC8qKlxuICAgICAqIFJlbmRlcnMgdGhlIGdyaWQgcm93cyB1c2luZyBsb2NhbCBkYXRhLiAgVGhpcyBpcyB0aGUgZGVmYXVsdCBtZXRob2QgdG8gcmVuZGVyIHJvd3Mgd2hlbiByZW1vdGUgcHJvY2Vzc2luZyBpcyBub3QgZW5hYmxlZC5cbiAgICAgKi9cbiAgICByZW5kZXJMb2NhbCA9ICgpID0+IHtcbiAgICAgICAgdGhpcy5jb250ZXh0LmdyaWQucmVuZGVyUm93cyh0aGlzLmNvbnRleHQucGVyc2lzdGVuY2UuZGF0YSk7XG4gICAgfTtcbiAgICAvKipcbiAgICAgKiBSZW5kZXJzIHRoZSBncmlkIHJvd3MgdXNpbmcgcmVtb3RlIGRhdGEuICBUaGlzIG1ldGhvZCB3aWxsIGNhbGwgdGhlIGByZW1vdGVQYXJhbXNgIGV2ZW50IHRvIGdldCB0aGUgcGFyYW1ldGVycyBmb3IgdGhlIHJlbW90ZSByZXF1ZXN0LlxuICAgICAqL1xuICAgIHJlbmRlclJlbW90ZSA9IGFzeW5jICgpID0+IHtcbiAgICAgICAgY29uc3QgcGFyYW1zID0gdGhpcy5jb250ZXh0LmV2ZW50cy5jaGFpbihcInJlbW90ZVBhcmFtc1wiLCB7fSk7XG4gICAgICAgIGNvbnN0IGRhdGEgPSBhd2FpdCB0aGlzLmNvbnRleHQuZGF0YWxvYWRlci5yZXF1ZXN0R3JpZERhdGEocGFyYW1zKTtcblxuICAgICAgICB0aGlzLmNvbnRleHQuZ3JpZC5yZW5kZXJSb3dzKGRhdGEpO1xuICAgIH07XG59XG5cblJvd01vZHVsZS5tb2R1bGVOYW1lID0gXCJyb3dcIjtcblxuZXhwb3J0IHsgUm93TW9kdWxlIH07IiwiY2xhc3MgUGFnZXJCdXR0b25zIHtcbiAgICAvKipcbiAgICAgKiBSZXR1cm5zIHN0YXJ0IGJ1dHRvbiBmb3IgcGFnZXIgZWxlbWVudC5cbiAgICAgKiBAcGFyYW0ge251bWJlcn0gY3VycmVudFBhZ2UgQ3VycmVudCBwYWdlLlxuICAgICAqIEBwYXJhbSB7RnVuY3Rpb259IGNhbGxiYWNrIEJ1dHRvbiBjbGljayBoYW5kbGVyLlxuICAgICAqIEByZXR1cm5zIHtIVE1MTGlua0VsZW1lbnR9XG4gICAgICovXG4gICAgc3RhdGljIHN0YXJ0KGN1cnJlbnRQYWdlLCBjYWxsYmFjaykge1xuICAgICAgICBjb25zdCBsaSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJsaVwiKTtcbiAgICAgICAgY29uc3QgYnRuID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImJ1dHRvblwiKTtcblxuICAgICAgICBsaS5hcHBlbmQoYnRuKTtcbiAgICAgICAgYnRuLmlubmVySFRNTCA9IFwiJmxzYXF1bztcIjtcbiAgICAgICAgYnRuLmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCBjYWxsYmFjayk7XG5cbiAgICAgICAgaWYgKGN1cnJlbnRQYWdlID4gMSkge1xuICAgICAgICAgICAgYnRuLmRhdGFzZXQucGFnZSA9IFwiMVwiO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgYnRuLnRhYkluZGV4ID0gLTE7XG4gICAgICAgICAgICBidG4uZGlzYWJsZWQgPSB0cnVlO1xuICAgICAgICAgICAgbGkuY2xhc3NOYW1lID0gXCJkaXNhYmxlZFwiO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIGxpO1xuICAgIH1cbiAgICAvKipcbiAgICAgKiBSZXR1cm5zIGVuZCBidXR0b24gZm9yIHBhZ2VyIGVsZW1lbnQuXG4gICAgICogQHBhcmFtIHtudW1iZXJ9IHRvdGFsUGFnZXMgbGFzdCBwYWdlIG51bWJlciBpbiBncm91cCBzZXQuXG4gICAgICogQHBhcmFtIHtudW1iZXJ9IGN1cnJlbnRQYWdlIGN1cnJlbnQgcGFnZS5cbiAgICAgKiBAcGFyYW0ge0Z1bmN0aW9ufSBjYWxsYmFjayBidXR0b24gY2xpY2sgaGFuZGxlci5cbiAgICAgKiBAcmV0dXJucyB7SFRNTExJRWxlbWVudH1cbiAgICAgKi9cbiAgICBzdGF0aWMgZW5kKHRvdGFsUGFnZXMsIGN1cnJlbnRQYWdlLCBjYWxsYmFjaykge1xuICAgICAgICBjb25zdCBsaSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJsaVwiKTtcbiAgICAgICAgY29uc3QgYnRuID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImJ1dHRvblwiKTtcblxuICAgICAgICBsaS5hcHBlbmQoYnRuKTtcbiAgICAgICAgYnRuLmlubmVySFRNTCA9IFwiJnJzYXF1bztcIjtcbiAgICAgICAgYnRuLmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCBjYWxsYmFjayk7XG5cbiAgICAgICAgaWYgKGN1cnJlbnRQYWdlIDwgdG90YWxQYWdlcykge1xuICAgICAgICAgICAgYnRuLmRhdGFzZXQucGFnZSA9IHRvdGFsUGFnZXM7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBidG4udGFiSW5kZXggPSAtMTtcbiAgICAgICAgICAgIGJ0bi5kaXNhYmxlZCA9IHRydWU7XG4gICAgICAgICAgICBsaS5jbGFzc05hbWUgPSBcImRpc2FibGVkXCI7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gbGk7XG4gICAgfVxuICAgIC8qKlxuICAgICAqIFJldHVybnMgcGFnZXIgYnV0dG9uIGZvciBhc3NvY2lhdGVkIHBhZ2UuXG4gICAgICogQHBhcmFtIHtudW1iZXJ9IHBhZ2UgcGFnZSBudW1iZXIuXG4gICAgICogQHBhcmFtIHtudW1iZXJ9IGN1cnJlbnRQYWdlIGN1cnJlbnQgcGFnZS5cbiAgICAgKiBAcGFyYW0ge0Z1bmN0aW9ufSBjYWxsYmFjayBidXR0b24gY2xpY2sgaGFuZGxlci5cbiAgICAgKiBAcmV0dXJucyB7SFRNTExJRWxlbWVudH1cbiAgICAgKi9cbiAgICBzdGF0aWMgcGFnZU51bWJlcihwYWdlLCBjdXJyZW50UGFnZSwgY2FsbGJhY2spIHtcbiAgICAgICAgY29uc3QgbGkgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwibGlcIik7XG4gICAgICAgIGNvbnN0IGJ0biA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJidXR0b25cIik7XG5cbiAgICAgICAgbGkuYXBwZW5kKGJ0bik7XG4gICAgICAgIGJ0bi5pbm5lclRleHQgPSBwYWdlO1xuICAgICAgICBidG4uZGF0YXNldC5wYWdlID0gcGFnZTtcbiAgICAgICAgYnRuLmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCBjYWxsYmFjayk7XG5cbiAgICAgICAgaWYgKHBhZ2UgPT09IGN1cnJlbnRQYWdlKSB7XG4gICAgICAgICAgICBsaS5jbGFzc05hbWUgPSBcImFjdGl2ZVwiO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIGxpO1xuICAgIH1cbn1cblxuZXhwb3J0IHsgUGFnZXJCdXR0b25zIH07IiwiaW1wb3J0IHsgUGFnZXJCdXR0b25zIH0gZnJvbSBcIi4vcGFnZXJCdXR0b25zLmpzXCI7XG4vKipcbiAqIEZvcm1hdHMgZ3JpZCdzIHJvd3MgYXMgYSBzZXJpZXMgb2YgcGFnZXMgcmF0aGVyIHRoYXQgYSBzY3JvbGxpbmcgbGlzdC4gIElmIHBhZ2luZyBpcyBub3QgZGVzaXJlZCwgcmVnaXN0ZXIgdGhlIGBSb3dNb2R1bGVgIGluc3RlYWQuXG4gKiBcbiAqIENsYXNzIHN1YnNjcmliZXMgdG8gdGhlIGByZW5kZXJgIGV2ZW50IHRvIHVwZGF0ZSB0aGUgcGFnZXIgY29udHJvbCB3aGVuIHRoZSBncmlkIGlzIHJlbmRlcmVkLiAgSXQgYWxzbyBjYWxscyB0aGUgY2hhaW4gZXZlbnQgXG4gKiBgcmVtb3RlUGFyYW1zYCB0byBjb21waWxlIGEgbGlzdCBvZiBwYXJhbWV0ZXJzIHRvIGJlIHBhc3NlZCB0byB0aGUgcmVtb3RlIGRhdGEgc291cmNlIHdoZW4gdXNpbmcgcmVtb3RlIHByb2Nlc3NpbmcuXG4gKi9cbmNsYXNzIFBhZ2VyTW9kdWxlIHtcbiAgICAvKipcbiAgICAgKiBGb3JtYXRzIGdyaWQncyByb3dzIGFzIGEgc2VyaWVzIG9mIHBhZ2VzIHJhdGhlciB0aGF0IGEgc2Nyb2xsaW5nIGxpc3QuICBNb2R1bGUgY2FuIGJlIHVzZWQgd2l0aCBib3RoIGxvY2FsIGFuZCByZW1vdGUgZGF0YSBzb3VyY2VzLiAgXG4gICAgICogQHBhcmFtIHtHcmlkQ29udGV4dH0gY29udGV4dCBHcmlkIGNvbnRleHQuXG4gICAgICovXG4gICAgY29uc3RydWN0b3IoY29udGV4dCkge1xuICAgICAgICB0aGlzLmNvbnRleHQgPSBjb250ZXh0O1xuICAgICAgICB0aGlzLnRvdGFsUm93cyA9IHRoaXMuY29udGV4dC5wZXJzaXN0ZW5jZS5yb3dDb3VudDtcbiAgICAgICAgdGhpcy5wYWdlc1RvRGlzcGxheSA9IHRoaXMuY29udGV4dC5zZXR0aW5ncy5wYWdlclBhZ2VzVG9EaXNwbGF5O1xuICAgICAgICB0aGlzLnJvd3NQZXJQYWdlID0gdGhpcy5jb250ZXh0LnNldHRpbmdzLnBhZ2VyUm93c1BlclBhZ2U7XG4gICAgICAgIHRoaXMuY3VycmVudFBhZ2UgPSAxO1xuICAgICAgICAvL2NyZWF0ZSBkaXYgY29udGFpbmVyIGZvciBwYWdlclxuICAgICAgICB0aGlzLmNvbnRhaW5lciA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJkaXZcIik7XG4gICAgICAgIHRoaXMuZWxQYWdlciA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJ1bFwiKTtcblxuICAgICAgICB0aGlzLmNvbnRhaW5lci5pZCA9IGAke3RoaXMuY29udGV4dC5zZXR0aW5ncy5iYXNlSWROYW1lfV9wYWdlcmA7XG4gICAgICAgIHRoaXMuY29udGFpbmVyLmNsYXNzTmFtZSA9IHRoaXMuY29udGV4dC5zZXR0aW5ncy5wYWdlckNzcztcbiAgICAgICAgdGhpcy5jb250YWluZXIuYXBwZW5kKHRoaXMuZWxQYWdlcik7XG4gICAgICAgIHRoaXMuY29udGV4dC5ncmlkLnRhYmxlLmluc2VydEFkamFjZW50RWxlbWVudChcImFmdGVyZW5kXCIsIHRoaXMuY29udGFpbmVyKTtcbiAgICB9XG4gICAgLyoqXG4gICAgICogU2V0cyBoYW5kbGVyIGV2ZW50cyBmb3IgcmVuZGVyaW5nL3VwZGF0aW5nIGdyaWQgYm9keSByb3dzIGFuZCBwYWdlciBjb250cm9sLlxuICAgICAqL1xuICAgIGluaXRpYWxpemUoKSB7XG4gICAgICAgIGlmICh0aGlzLmNvbnRleHQuc2V0dGluZ3MucmVtb3RlUHJvY2Vzc2luZykge1xuICAgICAgICAgICAgdGhpcy5jb250ZXh0LmV2ZW50cy5zdWJzY3JpYmUoXCJyZW5kZXJcIiwgdGhpcy5yZW5kZXJSZW1vdGUsIHRydWUsIDEwKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHRoaXMuY29udGV4dC5ldmVudHMuc3Vic2NyaWJlKFwicmVuZGVyXCIsIHRoaXMucmVuZGVyTG9jYWwsIGZhbHNlLCAxMCk7XG4gICAgICAgIH1cbiAgICB9XG4gICAgLyoqXG4gICAgICogUmV0dXJucyB0aGUgdG90YWwgbnVtYmVyIG9mIHBvc3NpYmxlIHBhZ2VzIGJhc2VkIG9uIHRoZSB0b3RhbCByb3dzLCBhbmQgcm93cyBwZXIgcGFnZSBzZXR0aW5nLlxuICAgICAqIEByZXR1cm5zIHtOdW1iZXJ9XG4gICAgICovXG4gICAgdG90YWxQYWdlcygpIHtcbiAgICAgICAgY29uc3QgdG90YWxSb3dzID0gaXNOYU4odGhpcy50b3RhbFJvd3MpID8gMSA6IHRoaXMudG90YWxSb3dzO1xuXG4gICAgICAgIHJldHVybiB0aGlzLnJvd3NQZXJQYWdlID09PSAwID8gMSA6IE1hdGguY2VpbCh0b3RhbFJvd3MgLyB0aGlzLnJvd3NQZXJQYWdlKTtcbiAgICB9XG4gICAgLyoqXG4gICAgICogUmV0dXJucyBhIHZhbGlkYXRlZCBwYWdlIG51bWJlciBpbnB1dCBieSBtYWtpbmcgc3VyZSB2YWx1ZSBpcyBudW1lcmljLCBhbmQgd2l0aGluIHRoZSBib3VuZHMgb2YgdGhlIHRvdGFsIHBhZ2VzLiAgXG4gICAgICogQW4gaW52YWxpZCBpbnB1dCB3aWxsIHJldHVybiBhIHZhbHVlIG9mIDEuXG4gICAgICogQHBhcmFtIHtzdHJpbmcgfCBudW1iZXJ9IGN1cnJlbnRQYWdlIFBhZ2UgbnVtYmVyIHRvIHZhbGlkYXRlLlxuICAgICAqIEByZXR1cm5zIHtOdW1iZXJ9IFJldHVybnMgYSB2YWxpZCBwYWdlIG51bWJlciBiZXR3ZWVuIDEgYW5kIHRoZSB0b3RhbCBudW1iZXIgb2YgcGFnZXMuICBJZiB0aGUgaW5wdXQgaXMgaW52YWxpZCwgcmV0dXJucyAxLlxuICAgICAqL1xuICAgIHZhbGlkYXRlUGFnZShjdXJyZW50UGFnZSkge1xuICAgICAgICBpZiAoIU51bWJlci5pc0ludGVnZXIoY3VycmVudFBhZ2UpKSB7XG4gICAgICAgICAgICBjdXJyZW50UGFnZSA9IHBhcnNlSW50KGN1cnJlbnRQYWdlKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IHRvdGFsID0gdGhpcy50b3RhbFBhZ2VzKCk7XG4gICAgICAgIGNvbnN0IHJlc3VsdCA9IHRvdGFsIDwgY3VycmVudFBhZ2UgPyB0b3RhbCA6IGN1cnJlbnRQYWdlO1xuXG4gICAgICAgIHJldHVybiByZXN1bHQgPD0gMCA/IDEgOiByZXN1bHQ7XG4gICAgfVxuICAgIC8qKlxuICAgICAqIFJldHVybnMgdGhlIGZpcnN0IHBhZ2UgbnVtYmVyIHRvIGRpc3BsYXkgaW4gdGhlIGJ1dHRvbiBjb250cm9sIHNldCBiYXNlZCBvbiB0aGUgcGFnZSBudW1iZXIgcG9zaXRpb24gaW4gdGhlIGRhdGFzZXQuICBcbiAgICAgKiBQYWdlIG51bWJlcnMgb3V0c2lkZSBvZiB0aGlzIHJhbmdlIGFyZSByZXByZXNlbnRlZCBieSBhbiBhcnJvdy5cbiAgICAgKiBAcGFyYW0ge051bWJlcn0gY3VycmVudFBhZ2UgQ3VycmVudCBwYWdlIG51bWJlci5cbiAgICAgKiBAcmV0dXJucyB7TnVtYmVyfVxuICAgICAqL1xuICAgIGZpcnN0RGlzcGxheVBhZ2UoY3VycmVudFBhZ2UpIHtcbiAgICAgICAgY29uc3QgbWlkZGxlID0gTWF0aC5mbG9vcih0aGlzLnBhZ2VzVG9EaXNwbGF5IC8gMiArIHRoaXMucGFnZXNUb0Rpc3BsYXkgJSAyKTtcblxuICAgICAgICBpZiAoY3VycmVudFBhZ2UgPCBtaWRkbGUpIHJldHVybiAxO1xuXG4gICAgICAgIGlmICh0aGlzLnRvdGFsUGFnZXMoKSA8IChjdXJyZW50UGFnZSArIHRoaXMucGFnZXNUb0Rpc3BsYXkgLSBtaWRkbGUpKSB7XG4gICAgICAgICAgICByZXR1cm4gTWF0aC5tYXgodGhpcy50b3RhbFBhZ2VzKCkgLSB0aGlzLnBhZ2VzVG9EaXNwbGF5ICsgMSwgMSk7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gY3VycmVudFBhZ2UgLSBtaWRkbGUgKyAxO1xuICAgIH1cbiAgICAvKipcbiAgICAgKiBDcmVhdGVzIHRoZSBodG1sIGxpc3QgaXRlbSBhbmQgYnV0dG9uIGVsZW1lbnRzIGZvciB0aGUgcGFnZXIgY29udGFpbmVyJ3MgdWwgZWxlbWVudC4gIFdpbGwgYWxzbyBzZXQgdGhlIFxuICAgICAqIGB0aGlzLmN1cnJlbnRQYWdlYCBwcm9wZXJ0eSB0byB0aGUgY3VycmVudCBwYWdlIG51bWJlci5cbiAgICAgKiBAcGFyYW0ge051bWJlcn0gY3VycmVudFBhZ2UgQ3VycmVudCBwYWdlIG51bWJlci4gIEFzc3VtZXMgYSB2YWxpZCBwYWdlIG51bWJlciBpcyBwcm92aWRlZC5cbiAgICAgKiBAcGFyYW0ge0Z1bmN0aW9ufSBjYWxsYmFjayBCdXR0b24gY2xpY2sgaGFuZGxlci5cbiAgICAgKi9cbiAgICByZW5kZXIoY3VycmVudFBhZ2UsIGNhbGxiYWNrKSB7XG4gICAgICAgIGNvbnN0IHRvdGFsUGFnZXMgPSB0aGlzLnRvdGFsUGFnZXMoKTtcbiAgICAgICAgLy8gQ2xlYXIgdGhlIHByaW9yIGxpIGVsZW1lbnRzLlxuICAgICAgICB0aGlzLmVsUGFnZXIucmVwbGFjZUNoaWxkcmVuKCk7XG5cbiAgICAgICAgaWYgKHRvdGFsUGFnZXMgPD0gMSkgcmV0dXJuO1xuICAgICAgICBcbiAgICAgICAgY29uc3QgZmlyc3REaXNwbGF5ID0gdGhpcy5maXJzdERpc3BsYXlQYWdlKGN1cnJlbnRQYWdlKTtcbiAgICAgICAgY29uc3QgbWF4UGFnZXMgPSBmaXJzdERpc3BsYXkgKyB0aGlzLnBhZ2VzVG9EaXNwbGF5O1xuICAgICAgICBcbiAgICAgICAgdGhpcy5jdXJyZW50UGFnZSA9IGN1cnJlbnRQYWdlO1xuICAgICAgICB0aGlzLmVsUGFnZXIuYXBwZW5kQ2hpbGQoUGFnZXJCdXR0b25zLnN0YXJ0KGN1cnJlbnRQYWdlLCBjYWxsYmFjaykpO1xuXG4gICAgICAgIGZvciAobGV0IHBhZ2UgPSBmaXJzdERpc3BsYXk7IHBhZ2UgPD0gdG90YWxQYWdlcyAmJiBwYWdlIDwgbWF4UGFnZXM7IHBhZ2UrKykge1xuICAgICAgICAgICAgdGhpcy5lbFBhZ2VyLmFwcGVuZENoaWxkKFBhZ2VyQnV0dG9ucy5wYWdlTnVtYmVyKHBhZ2UsIGN1cnJlbnRQYWdlLCBjYWxsYmFjaykpO1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5lbFBhZ2VyLmFwcGVuZENoaWxkKFBhZ2VyQnV0dG9ucy5lbmQodG90YWxQYWdlcywgY3VycmVudFBhZ2UsIGNhbGxiYWNrKSk7XG4gICAgfVxuXG4gICAgaGFuZGxlUGFnaW5nID0gYXN5bmMgKGUpID0+IHtcbiAgICAgICAgY29uc3QgdmFsaWRQYWdlID0geyBwYWdlOiB0aGlzLnZhbGlkYXRlUGFnZShlLmN1cnJlbnRUYXJnZXQuZGF0YXNldC5wYWdlKSB9O1xuXG4gICAgICAgIGlmICh0aGlzLmNvbnRleHQuc2V0dGluZ3MucmVtb3RlUHJvY2Vzc2luZykge1xuICAgICAgICAgICAgYXdhaXQgdGhpcy5yZW5kZXJSZW1vdGUodmFsaWRQYWdlKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHRoaXMucmVuZGVyTG9jYWwodmFsaWRQYWdlKTtcbiAgICAgICAgfVxuICAgIH07XG4gICAgLyoqXG4gICAgICogSGFuZGxlciBmb3IgcmVuZGVyaW5nIHJvd3MgdXNpbmcgbG9jYWwgZGF0YSBzb3VyY2UuICBXaWxsIHNsaWNlIHRoZSBkYXRhIGFycmF5IGJhc2VkIG9uIHRoZSBjdXJyZW50IHBhZ2UgYW5kIHJvd3MgcGVyIHBhZ2Ugc2V0dGluZ3MsXG4gICAgICogdGhlbiBjYWxsIGByZW5kZXJgIHRvIHVwZGF0ZSB0aGUgcGFnZXIgY29udHJvbC4gIE9wdGlvbmFsIGFyZ3VtZW50IGBwYXJhbXNgIGlzIGFuIG9iamVjdCB0aGF0IGNhbiBjb250YWluIHRoZSBmb2xsb3dpbmcgcHJvcGVydGllczpcbiAgICAgKiAqIGBwYWdlYDpQYWdlIG51bWJlciB0byByZW5kZXIuICBJZiBub3QgcHJvdmlkZWQsIGRlZmF1bHRzIHRvIDEuXG4gICAgICogQHBhcmFtIHt7IHBhZ2U6IG51bWJlciB9IHwgbnVsbH0gcGFyYW1zIFxuICAgICAqL1xuICAgIHJlbmRlckxvY2FsID0gKHBhcmFtcyA9IHt9KSA9PiB7XG4gICAgICAgIGNvbnN0IHBhZ2UgPSAhcGFyYW1zLnBhZ2UgPyAxIDogdGhpcy52YWxpZGF0ZVBhZ2UocGFyYW1zLnBhZ2UpO1xuICAgICAgICBjb25zdCBiZWdpbiA9IChwYWdlIC0gMSkgKiB0aGlzLnJvd3NQZXJQYWdlO1xuICAgICAgICBjb25zdCBlbmQgPSBiZWdpbiArIHRoaXMucm93c1BlclBhZ2U7XG4gICAgICAgIGNvbnN0IGRhdGEgPSB0aGlzLmNvbnRleHQucGVyc2lzdGVuY2UuZGF0YS5zbGljZShiZWdpbiwgZW5kKTtcblxuICAgICAgICB0aGlzLmNvbnRleHQuZ3JpZC5yZW5kZXJSb3dzKGRhdGEsIHRoaXMuY29udGV4dC5wZXJzaXN0ZW5jZS5yb3dDb3VudCk7XG4gICAgICAgIHRoaXMudG90YWxSb3dzID0gdGhpcy5jb250ZXh0LnBlcnNpc3RlbmNlLnJvd0NvdW50O1xuICAgICAgICB0aGlzLnJlbmRlcihwYWdlLCB0aGlzLmhhbmRsZVBhZ2luZyk7XG4gICAgfTtcbiAgICAvKipcbiAgICAgKiBIYW5kbGVyIGZvciByZW5kZXJpbmcgcm93cyB1c2luZyByZW1vdGUgZGF0YSBzb3VyY2UuICBXaWxsIGNhbGwgdGhlIGBkYXRhbG9hZGVyYCB0byByZXF1ZXN0IGRhdGEgYmFzZWQgb24gdGhlIHByb3ZpZGVkIHBhcmFtcyxcbiAgICAgKiB0aGVuIGNhbGwgYHJlbmRlcmAgdG8gdXBkYXRlIHRoZSBwYWdlciBjb250cm9sLiAgT3B0aW9uYWwgYXJndW1lbnQgYHBhcmFtc2AgaXMgYW4gb2JqZWN0IHRoYXQgY2FuIGNvbnRhaW4gdGhlIGZvbGxvd2luZyBwcm9wZXJ0aWVzOlxuICAgICAqICogYHBhZ2VgOiBQYWdlIG51bWJlciB0byByZW5kZXIuICBJZiBub3QgcHJvdmlkZWQsIGRlZmF1bHRzIHRvIDEuXG4gICAgICogQHBhcmFtIHt7IHBhZ2U6IG51bWJlciB9IHwgbnVsbH0gcGFyYW1zIFxuICAgICAqL1xuICAgIHJlbmRlclJlbW90ZSA9IGFzeW5jIChwYXJhbXMgPSB7fSkgPT4ge1xuICAgICAgICBpZiAoIXBhcmFtcy5wYWdlKSBwYXJhbXMucGFnZSA9IDE7XG4gICAgICAgIFxuICAgICAgICBwYXJhbXMgPSB0aGlzLmNvbnRleHQuZXZlbnRzLmNoYWluKFwicmVtb3RlUGFyYW1zXCIsIHBhcmFtcyk7XG5cbiAgICAgICAgY29uc3QgZGF0YSA9IGF3YWl0IHRoaXMuY29udGV4dC5kYXRhbG9hZGVyLnJlcXVlc3RHcmlkRGF0YShwYXJhbXMpO1xuICAgICAgICBjb25zdCByb3dDb3VudCA9IGRhdGEucm93Q291bnQgPz8gMDtcblxuICAgICAgICB0aGlzLmNvbnRleHQuZ3JpZC5yZW5kZXJSb3dzKGRhdGEuZGF0YSwgcm93Q291bnQpO1xuICAgICAgICB0aGlzLnRvdGFsUm93cyA9IHJvd0NvdW50O1xuICAgICAgICB0aGlzLnJlbmRlcihwYXJhbXMucGFnZSwgdGhpcy5oYW5kbGVQYWdpbmcpO1xuICAgIH07XG59XG5cblBhZ2VyTW9kdWxlLm1vZHVsZU5hbWUgPSBcInBhZ2VyXCI7XG5cbmV4cG9ydCB7IFBhZ2VyTW9kdWxlIH07IiwiaW1wb3J0IHsgR3JpZENvbnRleHQgfSBmcm9tIFwiLi4vY29tcG9uZW50cy9jb250ZXh0L2dyaWRDb250ZXh0LmpzXCI7XG5pbXBvcnQgeyBNZXJnZU9wdGlvbnMgfSBmcm9tIFwiLi4vc2V0dGluZ3MvbWVyZ2VPcHRpb25zLmpzXCI7XG5pbXBvcnQgeyBTZXR0aW5nc0dyaWQgfSBmcm9tIFwiLi4vc2V0dGluZ3Mvc2V0dGluZ3NHcmlkLmpzXCI7XG5pbXBvcnQgeyBSb3dNb2R1bGUgfSBmcm9tIFwiLi4vbW9kdWxlcy9yb3cvcm93TW9kdWxlLmpzXCI7XG5pbXBvcnQgeyBQYWdlck1vZHVsZSB9IGZyb20gXCIuLi9tb2R1bGVzL3BhZ2VyL3BhZ2VyTW9kdWxlLmpzXCI7XG4vKipcbiAqIENyZWF0ZXMgZ3JpZCdzIGNvcmUgcHJvcGVydGllcyBhbmQgb2JqZWN0cywgYW5kIGFsbG93cyBmb3IgcmVnaXN0cmF0aW9uIG9mIG1vZHVsZXMgdXNlZCB0byBidWlsZCBmdW5jdGlvbmFsaXR5LlxuICogVXNlIHRoaXMgY2xhc3MgYXMgYSBiYXNlIGNsYXNzIHRvIGNyZWF0ZSBhIGdyaWQgd2l0aCBjdXN0b20gbW9kdWxhciBmdW5jdGlvbmFsaXR5IHVzaW5nIHRoZSBgZXh0ZW5kc2AgY2xhc3MgcmVmZXJlbmNlLlxuICovXG5jbGFzcyBHcmlkQ29yZSB7XG4gICAgI21vZHVsZVR5cGVzO1xuICAgICNtb2R1bGVzQ3JlYXRlZDtcbiAgICAvKipcbiAgICAqIENyZWF0ZXMgZ3JpZCdzIGNvcmUgcHJvcGVydGllcyBhbmQgb2JqZWN0cyBhbmQgaWRlbnRpZmllcyBkaXYgZWxlbWVudCB3aGljaCBncmlkIHdpbGwgYmUgYnVpbHQuICBBZnRlciBpbnN0YW50aWF0aW9uLCBcbiAgICAqIHVzZSB0aGUgYGFkZE1vZHVsZXNgIG1ldGhvZCB0byByZWdpc3RlciBkZXNpcmVkIG1vZHVsZXMgdG8gY29tcGxldGUgdGhlIHNldHVwIHByb2Nlc3MuICBNb2R1bGUgcmVnaXN0cmF0aW9uIGlzIGtlcHQgXG4gICAgKiBzZXBhcmF0ZSBmcm9tIGNvbnN0cnVjdG9yIHRvIGFsbG93IGN1c3RvbWl6YXRpb24gb2YgbW9kdWxlcyB1c2VkIHRvIGJ1aWxkIGdyaWQuXG4gICAgKiBAcGFyYW0ge3N0cmluZ30gY29udGFpbmVyIGRpdiBlbGVtZW50IElEIHRvIGJ1aWxkIGdyaWQgaW4uXG4gICAgKiBAcGFyYW0ge29iamVjdH0gc2V0dGluZ3MgVXNlciBzZXR0aW5nczsga2V5L3ZhbHVlIHBhaXJzLlxuICAgICovXG4gICAgY29uc3RydWN0b3IoY29udGFpbmVyLCBzZXR0aW5ncykge1xuICAgICAgICBjb25zdCBzb3VyY2UgPSBNZXJnZU9wdGlvbnMubWVyZ2Uoc2V0dGluZ3MpO1xuXG4gICAgICAgIHRoaXMuc2V0dGluZ3MgPSBuZXcgU2V0dGluZ3NHcmlkKHNvdXJjZSk7XG4gICAgICAgIHRoaXMuY29udGFpbmVyID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoY29udGFpbmVyKTtcbiAgICAgICAgdGhpcy5lbmFibGVQYWdpbmcgPSB0aGlzLnNldHRpbmdzLmVuYWJsZVBhZ2luZztcbiAgICAgICAgdGhpcy5pc1ZhbGlkID0gdHJ1ZTtcbiAgICAgICAgdGhpcy4jbW9kdWxlVHlwZXMgPSBbXTtcbiAgICAgICAgdGhpcy4jbW9kdWxlc0NyZWF0ZWQgPSBmYWxzZTtcbiAgICAgICAgdGhpcy5tb2R1bGVzID0ge307XG5cbiAgICAgICAgaWYgKE9iamVjdC52YWx1ZXMoc291cmNlLmNvbHVtbnMpLmxlbmd0aCA9PT0gMCkge1xuICAgICAgICAgICAgY29uc29sZS5sb2coXCJNaXNzaW5nIHJlcXVpcmVkIGNvbHVtbnMgZGVmaW5pdGlvbi5cIik7XG4gICAgICAgICAgICB0aGlzLmlzVmFsaWQgPSBmYWxzZTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGNvbnN0IGRhdGEgPSBzb3VyY2UuZGF0YSA/PyBbXTtcbiAgICAgICAgICAgIHRoaXMuI2luaXQoc291cmNlLmNvbHVtbnMsIGRhdGEpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgI2luaXQoY29sdW1ucywgZGF0YSkge1xuICAgICAgICB0aGlzLmNvbnRleHQgPSBuZXcgR3JpZENvbnRleHQoY29sdW1ucywgdGhpcy5zZXR0aW5ncywgZGF0YSk7XG5cbiAgICAgICAgdGhpcy5jb250YWluZXIuYXBwZW5kKHRoaXMuY29udGV4dC5ncmlkLnRhYmxlKTtcbiAgICB9XG4gICAgLyoqXG4gICAgICogUmVnaXN0ZXIgbW9kdWxlcyB0byBiZSB1c2VkIGluIHRoZSBidWlsZGluZyBhbmQgb3BlcmF0aW9uIG9mIHRoZSBncmlkLiAgXG4gICAgICogXG4gICAgICogTk9URTogVGhpcyBtZXRob2Qgc2hvdWxkIGJlIGNhbGxlZCBiZWZvcmUgdGhlIGBpbml0KClgIG1ldGhvZC5cbiAgICAgKiBAcGFyYW0ge2NsYXNzfSBtb2R1bGVzIENsYXNzIG1vZHVsZShzKS5cbiAgICAgKi9cbiAgICBhZGRNb2R1bGVzKC4uLm1vZHVsZXMpIHtcbiAgICAgICAgbW9kdWxlcy5mb3JFYWNoKChtKSA9PiB0aGlzLiNtb2R1bGVUeXBlcy5wdXNoKG0pKTtcbiAgICB9XG4gICAgLyoqXG4gICAgICogQWRkcyBhIG5ldyBjb2x1bW4gdG8gdGhlIGdyaWQuICBUaGUgY29sdW1uIHdpbGwgYmUgYWRkZWQgdG8gdGhlIGVuZCBvZiB0aGUgY29sdW1ucyBjb2xsZWN0aW9uIGJ5IGRlZmF1bHQsIGJ1dCBjYW4gXG4gICAgICogYmUgaW5zZXJ0ZWQgYXQgYSBzcGVjaWZpYyBpbmRleC4gIFxuICAgICAqIFxuICAgICAqIE5PVEU6IFRoaXMgbWV0aG9kIHNob3VsZCBiZSBjYWxsZWQgYmVmb3JlIHRoZSBgaW5pdCgpYCBtZXRob2QuXG4gICAgICogQHBhcmFtIHtPYmplY3R9IGNvbHVtbiBDb2x1bW4gb2JqZWN0IGRlZmluaXRpb24uXG4gICAgICogQHBhcmFtIHtudW1iZXJ9IFtpbmRleFBvc2l0aW9uPW51bGxdIEluZGV4IHRvIGluc2VydCB0aGUgY29sdW1uIGF0LiBJZiBudWxsLCBhcHBlbmRzIHRvIHRoZSBlbmQuXG4gICAgICovXG4gICAgYWRkQ29sdW1uKGNvbHVtbiwgaW5kZXhQb3NpdGlvbiA9IG51bGwpIHtcbiAgICAgICAgdGhpcy5jb250ZXh0LmNvbHVtbk1hbmFnZXIuYWRkQ29sdW1uKGNvbHVtbiwgaW5kZXhQb3NpdGlvbik7XG4gICAgfVxuICAgIC8qKlxuICAgICAqIEl0ZXJhdGVzIHRob3VnaCBhIGxpc3Qgb2YgbW9kdWxlcyB0byBpbnN0YW50aWF0ZSBhbmQgaW5pdGlhbGl6ZSBzdGFydCB1cCBhbmQvb3IgYnVpbGQgYmVoYXZpb3IuICBTaG91bGQgYmUgY2FsbGVkIGFmdGVyIFxuICAgICAqIGFsbCBtb2R1bGVzIGhhdmUgYmVlbiByZWdpc3RlcmVkIHVzaW5nIHRoZSBgYWRkTW9kdWxlc2AgbWV0aG9kLCBhbmQgb25seSBuZWVkcyB0byBiZSBjYWxsZWQgb25jZS5cbiAgICAgKi9cbiAgICAjaW5pdE1vZHVsZXMgPSBhc3luYyAoKSA9PiB7XG4gICAgICAgIGlmICh0aGlzLiNtb2R1bGVzQ3JlYXRlZClcbiAgICAgICAgICAgIHJldHVybjtcblxuICAgICAgICAvL1ZlcmlmeSBpZiBiYXNlIHJlcXVpcmVkIHJvdyByZWxhdGVkIG1vZHVsZSBoYXMgYmVlbiBhZGRlZCB0byB0aGUgZ3JpZC5cbiAgICAgICAgaWYgKHRoaXMuc2V0dGluZ3MuZW5hYmxlUGFnaW5nICYmICF0aGlzLiNtb2R1bGVUeXBlcy5zb21lKCh4KSA9PiB4Lm1vZHVsZU5hbWUgPT09IFwicGFnZVwiKSkge1xuICAgICAgICAgICAgdGhpcy4jbW9kdWxlVHlwZXMucHVzaChQYWdlck1vZHVsZSk7XG4gICAgICAgIH0gZWxzZSBpZiAoIXRoaXMuI21vZHVsZVR5cGVzLnNvbWUoKHgpID0+IHgubW9kdWxlTmFtZSA9PT0gXCJyb3dcIikpIHtcbiAgICAgICAgICAgICB0aGlzLiNtb2R1bGVUeXBlcy5wdXNoKFJvd01vZHVsZSk7XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLiNtb2R1bGVUeXBlcy5mb3JFYWNoKChtKSA9PiB7XG4gICAgICAgICAgICB0aGlzLmNvbnRleHQubW9kdWxlc1ttLm1vZHVsZU5hbWVdID0gbmV3IG0odGhpcy5jb250ZXh0KTtcbiAgICAgICAgICAgIHRoaXMuY29udGV4dC5tb2R1bGVzW20ubW9kdWxlTmFtZV0uaW5pdGlhbGl6ZSgpO1xuICAgICAgICB9KTtcblxuICAgICAgICB0aGlzLiNtb2R1bGVzQ3JlYXRlZCA9IHRydWU7XG4gICAgICAgIGF3YWl0IHRoaXMuY29udGV4dC5ldmVudHMudHJpZ2dlcihcInBvc3RJbml0TW9kXCIpO1xuICAgIH07XG4gICAgLyoqXG4gICAgICogSW5zdGFudGlhdGVzIHRoZSBjcmVhdGlvbiBvZiB0aGUgZ3JpZC4gIE1ldGhvZCB3aWxsIGNyZWF0ZSB0aGUgZ3JpZCdzIGVsZW1lbnRzLCBydW4gYWxsIHJlZ2lzdGVyZWQgbW9kdWxlcywgZGF0YSBwcm9jZXNzaW5nIFxuICAgICAqIHBpcGVsaW5lcyBhbmQgZXZlbnRzLiAgSWYgZ3JpZCBpcyBiZWluZyBidWlsdCB1c2luZyB0aGUgbW9kdWxhciBhcHByb2FjaCwgYmUgc3VyZSB0byBjYWxsIHRoZSBgYWRkTW9kdWxlc2AgbWV0aG9kIGJlZm9yZSBcbiAgICAgKiBjYWxsaW5nIHRoaXMgb25lIHRvIGVuc3VyZSBhbGwgbW9kdWxlcyBhcmUgcmVnaXN0ZXJlZCBhbmQgaW5pdGlhbGl6ZWQgaW4gdGhlaXIgcHJvcGVyIG9yZGVyLlxuICAgICAqIFxuICAgICAqIE5PVEU6IE1ldGhvZCB3aWxsIGF1dG9tYXRpY2FsbHkgcmVnaXN0ZXIgdGhlIGBQYWdlck1vZHVsZWAgaWYgcGFnaW5nIGlzIGVuYWJsZWQsIG9yIHRoZSBgUm93TW9kdWxlYCBpZiBwYWdpbmcgaXMgbm90IGVuYWJsZWQuXG4gICAgICovXG4gICAgYXN5bmMgaW5pdCgpIHtcbiAgICAgICAgaWYgKCF0aGlzLmlzVmFsaWQpIHtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiTWlzc2luZyByZXF1aXJlZCBjb2x1bW5zIGRlZmluaXRpb24uXCIpO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5jb250ZXh0LmdyaWQuaW5pdGlhbGl6ZUhlYWRlcigpO1xuXG4gICAgICAgIGF3YWl0IHRoaXMuI2luaXRNb2R1bGVzKCk7XG5cbiAgICAgICAgaWYgKCF0aGlzLnNldHRpbmdzLnJlbW90ZVByb2Nlc3NpbmcgJiYgdGhpcy5zZXR0aW5ncy5yZW1vdGVVcmwpIHtcbiAgICAgICAgICAgIC8vbG9jYWwgZGF0YSBzb3VyY2UgcHJvY2Vzc2luZzsgc2V0IHBpcGVsaW5lIGFjdGlvbnMuXG4gICAgICAgICAgICB0aGlzLmNvbnRleHQucGlwZWxpbmUuYWRkU3RlcChcImluaXRcIiwgdGhpcy5jb250ZXh0LnBlcnNpc3RlbmNlLnNldERhdGEpO1xuICAgICAgICB9XG4gICAgICAgIC8vZXhlY3V0ZSBkYXRhIHBpcGVsaW5lIGJlZm9yZSBidWlsZGluZyBlbGVtZW50cy5cbiAgICAgICAgaWYgKHRoaXMuY29udGV4dC5waXBlbGluZS5oYXNQaXBlbGluZShcImluaXRcIikpIHtcbiAgICAgICAgICAgIGF3YWl0IHRoaXMuY29udGV4dC5waXBlbGluZS5leGVjdXRlKFwiaW5pdFwiKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGF3YWl0IHRoaXMuY29udGV4dC5ldmVudHMudHJpZ2dlcihcInJlbmRlclwiKTtcbiAgICB9XG4gICAgLyoqXG4gICAgICogQXBwbHkgZmlsdGVyIGNvbmRpdGlvbiBmb3IgdGFyZ2V0IGNvbHVtbi4gIE1ldGhvZCBwcm92aWRlcyBhIG1lYW5zIHRvIGFwcGx5IGNvbmRpdGlvbiBvdXRzaWRlIG9mIGhlYWRlciBmaWx0ZXIgY29udHJvbHMuXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IGZpZWxkIFRhcmdldCBmaWVsZC5cbiAgICAgKiBAcGFyYW0ge29iamVjdH0gdmFsdWUgRmlsdGVyIHZhbHVlLlxuICAgICAqIEBwYXJhbSB7c3RyaW5nIHwgRnVuY3Rpb259IFt0eXBlPVwiZXF1YWxzXCJdIEZpbHRlciB0eXBlLiAgSWYgYSBmdW5jdGlvbiBpcyBwcm92aWRlZCwgaXQgd2lsbCBiZSB1c2VkIGFzIHRoZSBmaWx0ZXIgY29uZGl0aW9uLlxuICAgICAqIE90aGVyd2lzZSwgdXNlIHRoZSBhc3NvY2lhdGVkIHN0cmluZyB2YWx1ZSB0eXBlIHRvIGRldGVybWluZSB0aGUgZmlsdGVyIGNvbmRpdGlvbi4gIGkuZS4gXCJlcXVhbHNcIiwgXCJjb250YWluc1wiLCBldGMuXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IFtmaWVsZFR5cGU9XCJzdHJpbmdcIl0gRmllbGQgdHlwZS5cbiAgICAgKiBAcGFyYW0ge29iamVjdH0gW2ZpbHRlclBhcmFtcz17fV0gQWRkaXRpb25hbCBmaWx0ZXIgcGFyYW1ldGVycy5cbiAgICAgKi9cbiAgICBzZXRGaWx0ZXIgPSBhc3luYyAoZmllbGQsIHZhbHVlLCB0eXBlID0gXCJlcXVhbHNcIiwgZmllbGRUeXBlID0gXCJzdHJpbmdcIiwgZmlsdGVyUGFyYW1zID0ge30pID0+IHtcbiAgICAgICAgaWYgKHRoaXMuY29udGV4dC5tb2R1bGVzLmZpbHRlcikge1xuICAgICAgICAgICAgdGhpcy5jb250ZXh0Lm1vZHVsZXMuZmlsdGVyLnNldEZpbHRlcihmaWVsZCwgdmFsdWUsIHR5cGUsIGZpZWxkVHlwZSwgZmlsdGVyUGFyYW1zKTtcblxuICAgICAgICAgICAgYXdhaXQgdGhpcy5jb250ZXh0LmV2ZW50cy50cmlnZ2VyKFwicmVuZGVyXCIpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgY29uc29sZS53YXJuKFwiRmlsdGVyIG1vZHVsZSBpcyBub3QgZW5hYmxlZC4gIFNldCBgRGF0YUdyaWQuZGVmYXVsdE9wdGlvbnMuZW5hYmxlRmlsdGVyYCB0byB0cnVlIGluIG9yZGVyIHRvIGVuYWJsZSB0aGlzIGZ1bmN0aW9uLlwiKTtcbiAgICAgICAgfVxuICAgIH07XG4gICAgLyoqXG4gICAgICogUmVtb3ZlIGZpbHRlciBjb25kaXRpb24gZm9yIHRhcmdldCBmaWVsZC5cbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gZmllbGQgVGFyZ2V0IGZpZWxkLlxuICAgICAqL1xuICAgIHJlbW92ZUZpbHRlciA9IGFzeW5jIChmaWVsZCkgPT4ge1xuICAgICAgICBpZiAodGhpcy5jb250ZXh0Lm1vZHVsZXMuZmlsdGVyKSB7XG4gICAgICAgICAgICB0aGlzLmNvbnRleHQubW9kdWxlcy5maWx0ZXIucmVtb3ZlRmlsdGVyKGZpZWxkKTtcblxuICAgICAgICAgICAgYXdhaXQgdGhpcy5jb250ZXh0LmV2ZW50cy50cmlnZ2VyKFwicmVuZGVyXCIpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgY29uc29sZS53YXJuKFwiRmlsdGVyIG1vZHVsZSBpcyBub3QgZW5hYmxlZC4gIFNldCBgRGF0YUdyaWQuZGVmYXVsdE9wdGlvbnMuZW5hYmxlRmlsdGVyYCB0byB0cnVlIGluIG9yZGVyIHRvIGVuYWJsZSB0aGlzIGZ1bmN0aW9uLlwiKTtcbiAgICAgICAgfVxuICAgIH07XG59XG5cbmV4cG9ydCB7IEdyaWRDb3JlIH07IiwiLyoqXG4gKiBQcm92aWRlcyBsb2dpYyB0byBjb252ZXJ0IGdyaWQgZGF0YSBpbnRvIGEgZG93bmxvYWRhYmxlIENTViBmaWxlLlxuICogTW9kdWxlIHdpbGwgcHJvdmlkZSBsaW1pdGVkIGZvcm1hdHRpbmcgb2YgZGF0YS4gIE9ubHkgY29sdW1ucyB3aXRoIGEgZm9ybWF0dGVyIHR5cGUgXG4gKiBvZiBgbW9kdWxlYCBvciBgZnVuY3Rpb25gIHdpbGwgYmUgcHJvY2Vzc2VkLiAgQWxsIG90aGVyIGNvbHVtbnMgd2lsbCBiZSByZXR1cm5lZCBhc1xuICogdGhlaXIgcmF3IGRhdGEgdHlwZS4gIElmIGEgY29sdW1uJ3MgdmFsdWUgY29udGFpbnMgYSBjb21tYSwgdGhlIHZhbHVlIHdpbGwgYmUgZG91YmxlIHF1b3RlZC5cbiAqL1xuY2xhc3MgQ3N2TW9kdWxlIHtcbiAgICAvKipcbiAgICAgKiBBbGxvd3MgZ3JpZCdzIGRhdGEgdG8gYmUgY29udmVydGVkIGludG8gYSBkb3dubG9hZGFibGUgQ1NWIGZpbGUuICBJZiBncmlkIGlzIFxuICAgICAqIHNldCB0byBhIGxvY2FsIGRhdGEgc291cmNlLCB0aGUgZGF0YSBjYWNoZSBpbiB0aGUgcGVyc2lzdGVuY2UgY2xhc3MgaXMgdXNlZC5cbiAgICAgKiBPdGhlcndpc2UsIGNsYXNzIHdpbGwgbWFrZSBhbiBBamF4IGNhbGwgdG8gcmVtb3RlIHRhcmdldCBzZXQgaW4gZGF0YSBsb2FkZXJcbiAgICAgKiBjbGFzcy5cbiAgICAgKiBAcGFyYW0ge0dyaWRDb250ZXh0fSBjb250ZXh0IEdyaWQgY29udGV4dCBjbGFzcy5cbiAgICAgKi9cbiAgICBjb25zdHJ1Y3Rvcihjb250ZXh0KSB7XG4gICAgICAgIHRoaXMuY29udGV4dCA9IGNvbnRleHQ7XG4gICAgICAgIHRoaXMuZGVsaW1pdGVyID0gXCIsXCI7XG4gICAgICAgIHRoaXMuYnV0dG9uID0gY29udGV4dC5zZXR0aW5ncy5jc3ZFeHBvcnRJZDtcbiAgICAgICAgdGhpcy5kYXRhVXJsID0gY29udGV4dC5zZXR0aW5ncy5jc3ZFeHBvcnRSZW1vdGVTb3VyY2U7XG4gICAgfVxuXG4gICAgaW5pdGlhbGl6ZSgpIHtcbiAgICAgICAgY29uc3QgYnRuID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQodGhpcy5idXR0b24pO1xuICAgICAgICBcbiAgICAgICAgYnRuLmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCB0aGlzLmhhbmRsZURvd25sb2FkKTtcbiAgICB9XG5cbiAgICBoYW5kbGVEb3dubG9hZCA9IGFzeW5jICgpID0+IHtcbiAgICAgICAgbGV0IGNzdkRhdGEgPSBbXTtcbiAgICAgICAgY29uc3QgZmlsZU5hbWUgPSBgJHtkb2N1bWVudC50aXRsZX0uY3N2YDtcblxuICAgICAgICBpZiAodGhpcy5kYXRhVXJsKSB7XG4gICAgICAgICAgICBjb25zdCBkYXRhID0gYXdhaXQgdGhpcy5jb250ZXh0LmRhdGFsb2FkZXIucmVxdWVzdERhdGEodGhpcy5kYXRhVXJsKTtcblxuICAgICAgICAgICAgY3N2RGF0YSA9IHRoaXMuYnVpbGRGaWxlQ29udGVudChkYXRhKS5qb2luKFwiXFxyXFxuXCIpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgY3N2RGF0YSA9IHRoaXMuYnVpbGRGaWxlQ29udGVudCh0aGlzLmNvbnRleHQucGVyc2lzdGVuY2UuZGF0YUNhY2hlKS5qb2luKFwiXFxyXFxuXCIpO1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc3QgYmxvYiA9IG5ldyBCbG9iKFtjc3ZEYXRhXSwgeyB0eXBlOiBcInRleHQvY3N2O2NoYXJzZXQ9dXRmLTg7XCIgfSk7XG4gICAgICAgIGNvbnN0IGVsZW1lbnQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiYVwiKTtcblxuICAgICAgICBlbGVtZW50LnNldEF0dHJpYnV0ZShcImhyZWZcIiwgd2luZG93LlVSTC5jcmVhdGVPYmplY3RVUkwoYmxvYikpO1xuICAgICAgICAvL3NldCBmaWxlIHRpdGxlXG4gICAgICAgIGVsZW1lbnQuc2V0QXR0cmlidXRlKFwiZG93bmxvYWRcIiwgZmlsZU5hbWUpO1xuICAgICAgICAvL3RyaWdnZXIgZG93bmxvYWRcbiAgICAgICAgZWxlbWVudC5zdHlsZS5kaXNwbGF5ID0gXCJub25lXCI7XG4gICAgICAgIGRvY3VtZW50LmJvZHkuYXBwZW5kQ2hpbGQoZWxlbWVudCk7XG4gICAgICAgIGVsZW1lbnQuY2xpY2soKTtcbiAgICAgICAgLy9yZW1vdmUgdGVtcG9yYXJ5IGxpbmsgZWxlbWVudFxuICAgICAgICBkb2N1bWVudC5ib2R5LnJlbW92ZUNoaWxkKGVsZW1lbnQpO1xuXG4gICAgICAgIHdpbmRvdy5hbGVydChgRG93bmxvYWRlZCAke2ZpbGVOYW1lfWApO1xuICAgIH07XG4gICAgLyoqXG4gICAgICogUmV0dXJucyBhbiBvYmplY3QgdGhhdCByZXByZXNlbnRzIHRoZSBjb2x1bW5zIGFuZCBoZWFkZXIgbmFtZXMgdGhhdCBzaG91bGQgYmUgdXNlZFxuICAgICAqIHRvIGNyZWF0ZSB0aGUgQ1NWIHJlc3VsdHMuICBXaWxsIGV4Y2x1ZGUgY29sdW1ucyB3aXRoIGEgdHlwZSBvZiBgaWNvbmAuXG4gICAgICogQHBhcmFtIHtPYmplY3R9IGNvbHVtbk1nckNvbHVtbnMgQ29sdW1uIE1hbmFnZXIgQ29sdW1ucyBjb2xsZWN0aW9uLlxuICAgICAqIEByZXR1cm5zIHt7IGhlYWRlcnM6IEFycmF5PHN0cmluZz4sIGNvbHVtbnM6IEFycmF5PENvbHVtbj4gfX1cbiAgICAgKi9cbiAgICBpZGVudGlmeUNvbHVtbnMoY29sdW1uTWdyQ29sdW1ucykge1xuICAgICAgICBjb25zdCBoZWFkZXJzID0gW107XG4gICAgICAgIGNvbnN0IGNvbHVtbnMgPSBbXTtcblxuICAgICAgICBmb3IgKGNvbnN0IGNvbHVtbiBvZiBjb2x1bW5NZ3JDb2x1bW5zKSB7XG4gICAgICAgICAgICBpZiAoY29sdW1uLnR5cGUgPT09IFwiaWNvblwiKSBjb250aW51ZTtcblxuICAgICAgICAgICAgaGVhZGVycy5wdXNoKGNvbHVtbi5sYWJlbCk7XG4gICAgICAgICAgICBjb2x1bW5zLnB1c2goY29sdW1uKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiB7IGhlYWRlcnM6IGhlYWRlcnMsIGNvbHVtbnM6IGNvbHVtbnMgfTsgXG4gICAgfVxuICAgIC8qKlxuICAgICAqIENvbnZlcnRzIGdyaWQgZGF0YSBpbiBEYXRhUGVyc2lzdGVuY2UgY2xhc3MgaW50byBhIHNpbmdsZSBkaW1lbnNpb25hbCBhcnJheSBvZlxuICAgICAqIHN0cmluZyBkZWxpbWl0ZWQgdmFsdWVzIHRoYXQgcmVwcmVzZW50cyBhIHJvdyBvZiBkYXRhIGluIGEgY3N2IGZpbGUuIFxuICAgICAqIEBwYXJhbSB7QXJyYXk8T2JqZWN0Pn0gZGF0YXNldCBkYXRhIHNldCB0byBidWlsZCBjc3Ygcm93cy5cbiAgICAgKiBAcmV0dXJucyB7QXJyYXk8c3RyaW5nPn1cbiAgICAgKi9cbiAgICBidWlsZEZpbGVDb250ZW50KGRhdGFzZXQpIHtcbiAgICAgICAgY29uc3QgZmlsZUNvbnRlbnRzID0gW107XG4gICAgICAgIGNvbnN0IGNvbHVtbnMgPSB0aGlzLmlkZW50aWZ5Q29sdW1ucyh0aGlzLmNvbnRleHQuY29sdW1uTWFuYWdlci5jb2x1bW5zKTtcbiAgICAgICAgLy9jcmVhdGUgZGVsaW1pdGVkIGhlYWRlci5cbiAgICAgICAgZmlsZUNvbnRlbnRzLnB1c2goY29sdW1ucy5oZWFkZXJzLmpvaW4odGhpcy5kZWxpbWl0ZXIpKTtcbiAgICAgICAgLy9jcmVhdGUgcm93IGRhdGFcbiAgICAgICAgZm9yIChjb25zdCByb3dEYXRhIG9mIGRhdGFzZXQpIHtcbiAgICAgICAgICAgIGNvbnN0IHJlc3VsdCA9IGNvbHVtbnMuY29sdW1ucy5tYXAoKGMpID0+IHRoaXMuZm9ybWF0VmFsdWUoYywgcm93RGF0YSkpO1xuXG4gICAgICAgICAgICBmaWxlQ29udGVudHMucHVzaChyZXN1bHQuam9pbih0aGlzLmRlbGltaXRlcikpO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIGZpbGVDb250ZW50cztcbiAgICB9XG4gICAgLyoqXG4gICAgICogUmV0dXJucyBhIGZvcm1hdHRlZCBzdHJpbmcgYmFzZWQgb24gdGhlIENvbHVtbidzIGZvcm1hdHRlciBzZXR0aW5nLlxuICAgICAqIFdpbGwgZG91YmxlIHF1b3RlIHN0cmluZyBpZiBjb21tYSBjaGFyYWN0ZXIgaXMgZm91bmQgaW4gdmFsdWUuXG4gICAgICogQHBhcmFtIHtDb2x1bW59IGNvbHVtbiBjb2x1bW4gbW9kZWwuXG4gICAgICogQHBhcmFtIHtPYmplY3R9IHJvd0RhdGEgcm93IGRhdGEuXG4gICAgICogQHJldHVybnMge3N0cmluZ31cbiAgICAgKi9cbiAgICBmb3JtYXRWYWx1ZShjb2x1bW4sIHJvd0RhdGEpIHtcbiAgICAgICAgbGV0IHZhbHVlID0gU3RyaW5nKHJvd0RhdGFbY29sdW1uLmZpZWxkXSk7XG4gICAgICAgIC8vYXBwbHkgbGltaXRlZCBmb3JtYXR0aW5nOyBjc3YgcmVzdWx0cyBzaG91bGQgYmUgJ3JhdycgZGF0YS5cbiAgICAgICAgaWYgKGNvbHVtbi5mb3JtYXR0ZXIpIHtcbiAgICAgICAgICAgIGlmICh0eXBlb2YgY29sdW1uLmZvcm1hdHRlciA9PT0gXCJmdW5jdGlvblwiKSB7XG4gICAgICAgICAgICAgICAgdmFsdWUgPSBTdHJpbmcoY29sdW1uLmZvcm1hdHRlcihyb3dEYXRhLCBjb2x1bW4uZm9ybWF0dGVyUGFyYW1zKSk7XG4gICAgICAgICAgICB9IGVsc2UgaWYgKGNvbHVtbi5mb3JtYXR0ZXIgPT09IFwibW9kdWxlXCIpIHtcbiAgICAgICAgICAgICAgICB2YWx1ZSA9IFN0cmluZyh0aGlzLmNvbnRleHQubW9kdWxlc1tjb2x1bW4uZm9ybWF0dGVyUGFyYW1zLm5hbWVdLmFwcGx5KHJvd0RhdGEsIGNvbHVtbiwgXCJjc3ZcIikpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIC8vY2hlY2sgZm9yIHN0cmluZ3MgdGhhdCBtYXkgbmVlZCB0byBiZSBxdW90ZWQuXG4gICAgICAgIGlmICh2YWx1ZS5pbmNsdWRlcyhcIixcIikpIHtcbiAgICAgICAgICAgIHZhbHVlID0gYFwiJHt2YWx1ZX1cImA7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gdmFsdWU7XG4gICAgfVxufVxuXG5Dc3ZNb2R1bGUubW9kdWxlTmFtZSA9IFwiY3N2XCI7XG5cbmV4cG9ydCB7IENzdk1vZHVsZSB9OyIsIi8qKlxuICogQ2xhc3MgdGhhdCBkZWZpbmVzIGEgc2luZ2xlIGZpbHRlciBjb25kaXRpb24gZm9yIGEgY29sdW1uLlxuICovXG5jbGFzcyBGaWx0ZXJUYXJnZXQge1xuICAgIC8qKlxuICAgICAqIENyZWF0ZXMgZmlsdGVyIHRhcmdldCBvYmplY3QgdGhhdCBkZWZpbmVzIGEgc2luZ2xlIGZpbHRlciBjb25kaXRpb24uICBFeHBlY3RzIGFuIG9iamVjdCB3aXRoIHRoZSBmb2xsb3dpbmcgcHJvcGVydGllczpcbiAgICAgKiAqIGB2YWx1ZWA6IFRoZSB2YWx1ZSB0byBmaWx0ZXIgYWdhaW5zdC4gIEV4cGVjdHMgdGhhdCB2YWx1ZSBtYXRjaGVzIHRoZSB0eXBlIG9mIHRoZSBmaWVsZCBiZWluZyBmaWx0ZXJlZC4gIFNob3VsZCBiZSBudWxsIGlmIFxuICAgICAqIHZhbHVlIHR5cGUgY2Fubm90IGJlIGNvbnZlcnRlZCB0byB0aGUgZmllbGQgdHlwZS5cbiAgICAgKiAqIGBmaWVsZGA6IFRoZSBmaWVsZCBuYW1lIG9mIHRoZSBjb2x1bW4gYmVpbmcgZmlsdGVyZWQuICBUaGlzIGlzIHVzZWQgdG8gaWRlbnRpZnkgdGhlIGNvbHVtbiBpbiB0aGUgZGF0YSBzZXQuXG4gICAgICogKiBgZmllbGRUeXBlYDogVGhlIHR5cGUgb2YgZmllbGQgYmVpbmcgZmlsdGVyZWQgKGUuZy4sIFwic3RyaW5nXCIsIFwibnVtYmVyXCIsIFwiZGF0ZVwiLCBcIm9iamVjdFwiKS4gIFRoaXMgaXMgdXNlZCB0byBkZXRlcm1pbmUgaG93IHRvIGNvbXBhcmUgdGhlIHZhbHVlLlxuICAgICAqICogYGZpbHRlclR5cGVgOiBUaGUgdHlwZSBvZiBmaWx0ZXIgdG8gYXBwbHkgKGUuZy4sIFwiZXF1YWxzXCIsIFwibGlrZVwiLCBcIjxcIiwgXCI8PVwiLCBcIj5cIiwgXCI+PVwiLCBcIiE9XCIsIFwiYmV0d2VlblwiLCBcImluXCIpLlxuICAgICAqIEBwYXJhbSB7eyB2YWx1ZTogKHN0cmluZyB8IG51bWJlciB8IERhdGUgfCBPYmplY3QgfCBudWxsKSwgZmllbGQ6IHN0cmluZywgZmllbGRUeXBlOiBzdHJpbmcsIGZpbHRlclR5cGU6IHN0cmluZyB9fSB0YXJnZXQgXG4gICAgICovXG4gICAgY29uc3RydWN0b3IodGFyZ2V0KSB7XG4gICAgICAgIHRoaXMudmFsdWUgPSB0YXJnZXQudmFsdWU7XG4gICAgICAgIHRoaXMuZmllbGQgPSB0YXJnZXQuZmllbGQ7XG4gICAgICAgIHRoaXMuZmllbGRUeXBlID0gdGFyZ2V0LmZpZWxkVHlwZSB8fCBcInN0cmluZ1wiOyAvLyBEZWZhdWx0IHRvIHN0cmluZyBpZiBub3QgcHJvdmlkZWRcbiAgICAgICAgdGhpcy5maWx0ZXJUeXBlID0gdGFyZ2V0LmZpbHRlclR5cGU7XG4gICAgICAgIHRoaXMuZmlsdGVycyA9IHRoaXMuI2luaXQoKTtcbiAgICB9XG5cbiAgICAjaW5pdCgpIHtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIC8vZXF1YWwgdG9cbiAgICAgICAgICAgIFwiZXF1YWxzXCI6IGZ1bmN0aW9uKGZpbHRlclZhbCwgcm93VmFsKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGZpbHRlclZhbCA9PT0gcm93VmFsO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIC8vbGlrZVxuICAgICAgICAgICAgXCJsaWtlXCI6IGZ1bmN0aW9uKGZpbHRlclZhbCwgcm93VmFsKSB7XG4gICAgICAgICAgICAgICAgaWYgKHJvd1ZhbCA9PT0gdW5kZWZpbmVkIHx8IHJvd1ZhbCA9PT0gbnVsbCB8fCByb3dWYWwgPT09IFwiXCIpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgICAgICAgICAgcmV0dXJuIFN0cmluZyhyb3dWYWwpLnRvTG93ZXJDYXNlKCkuaW5kZXhPZihmaWx0ZXJWYWwudG9Mb3dlckNhc2UoKSkgPiAtMTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAvL2xlc3MgdGhhblxuICAgICAgICAgICAgXCI8XCI6IGZ1bmN0aW9uKGZpbHRlclZhbCwgcm93VmFsKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGZpbHRlclZhbCA8IHJvd1ZhbDtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAvL2xlc3MgdGhhbiBvciBlcXVhbCB0b1xuICAgICAgICAgICAgXCI8PVwiOiBmdW5jdGlvbihmaWx0ZXJWYWwsIHJvd1ZhbCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBmaWx0ZXJWYWwgPD0gcm93VmFsO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIC8vZ3JlYXRlciB0aGFuXG4gICAgICAgICAgICBcIj5cIjogZnVuY3Rpb24oZmlsdGVyVmFsLCByb3dWYWwpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gZmlsdGVyVmFsID4gcm93VmFsO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIC8vZ3JlYXRlciB0aGFuIG9yIGVxdWFsIHRvXG4gICAgICAgICAgICBcIj49XCI6IGZ1bmN0aW9uKGZpbHRlclZhbCwgcm93VmFsKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGZpbHRlclZhbCA+PSByb3dWYWw7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgLy9ub3QgZXF1YWwgdG9cbiAgICAgICAgICAgIFwiIT1cIjogZnVuY3Rpb24oZmlsdGVyVmFsLCByb3dWYWwpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcm93VmFsICE9PSBmaWx0ZXJWYWw7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgLy8gYmV0d2Vlbi4gIGV4cGVjdHMgZmlsdGVyVmFsIHRvIGJlIGFuIGFycmF5IG9mOiBbIHtzdGFydCB2YWx1ZX0sIHsgZW5kIHZhbHVlIH0gXSBcbiAgICAgICAgICAgIFwiYmV0d2VlblwiOiBmdW5jdGlvbihmaWx0ZXJWYWwsIHJvd1ZhbCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByb3dWYWwgPj0gZmlsdGVyVmFsWzBdICYmIHJvd1ZhbCA8PSBmaWx0ZXJWYWxbMV07XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgLy9pbiBhcnJheS5cbiAgICAgICAgICAgIFwiaW5cIjogZnVuY3Rpb24oZmlsdGVyVmFsLCByb3dWYWwpIHtcbiAgICAgICAgICAgICAgICBpZiAoQXJyYXkuaXNBcnJheShmaWx0ZXJWYWwpKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBmaWx0ZXJWYWwubGVuZ3RoID8gZmlsdGVyVmFsLmluZGV4T2Yocm93VmFsKSA+IC0xIDogdHJ1ZTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLndhcm4oXCJGaWx0ZXIgRXJyb3IgLSBmaWx0ZXIgdmFsdWUgaXMgbm90IGFuIGFycmF5OlwiLCBmaWx0ZXJWYWwpO1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuICAgIH1cbiAgICAvKipcbiAgICAgKiBFeGVjdXRlcyBhbiBpbnRlcm5hbCBmdW5jdGlvbiB0byBpbmRpY2F0ZSBpZiB0aGUgY3VycmVudCByb3cgdmFsdWVzIG1hdGNoZXMgdGhlIGZpbHRlciBjcml0ZXJpYSdzIHZhbHVlLiAgXG4gICAgICogQHBhcmFtIHtPYmplY3R9IHJvd1ZhbCBSb3cgY29sdW1uIHZhbHVlLiAgRXhwZWN0cyBhIHZhbHVlIHRoYXQgbWF0Y2hlcyB0aGUgdHlwZSBpZGVudGlmaWVkIGJ5IHRoZSBjb2x1bW4uXG4gICAgICogQHBhcmFtIHtPYmplY3Q8QXJyYXk+fSByb3cgQ3VycmVudCBkYXRhIHNldCByb3cuXG4gICAgICogQHJldHVybnMge2Jvb2xlYW59IFJldHVybnMgdHJ1ZSBpZiByb3cgdmFsdWUgbWF0Y2hlcyBmaWx0ZXIgdmFsdWUuICBPdGhlcndpc2UsIGZhbHNlIGluZGljYXRpbmcgbm8gbWF0Y2guXG4gICAgICovXG4gICAgZXhlY3V0ZShyb3dWYWwsIHJvdykge1xuICAgICAgICByZXR1cm4gdGhpcy5maWx0ZXJzW3RoaXMuZmlsdGVyVHlwZV0odGhpcy52YWx1ZSwgcm93VmFsKTtcbiAgICB9XG59XG5cbmV4cG9ydCB7IEZpbHRlclRhcmdldCB9OyIsImltcG9ydCB7IERhdGVIZWxwZXIgfSBmcm9tIFwiLi4vLi4vLi4vY29tcG9uZW50cy9oZWxwZXJzL2RhdGVIZWxwZXIuanNcIjtcbi8qKlxuICogQ2xhc3MgdGhhdCBkZWZpbmVzIGEgc2luZ2xlIGZpbHRlciBjb25kaXRpb24gZm9yIGEgZGF0ZSBjb2x1bW4uXG4gKi9cbmNsYXNzIEZpbHRlckRhdGUge1xuICAgIC8qKlxuICAgICAqIENyZWF0ZXMgZmlsdGVyIHRhcmdldCBvYmplY3QgdGhhdCBkZWZpbmVzIGEgc2luZ2xlIGZpbHRlciBjb25kaXRpb24gZm9yIGEgZGF0ZSBkYXRhIHR5cGUuICBFeHBlY3RzIGFuIG9iamVjdCB3aXRoIHRoZSBmb2xsb3dpbmcgcHJvcGVydGllczpcbiAgICAgKiAqIGB2YWx1ZWA6IFRoZSB2YWx1ZSB0byBmaWx0ZXIgYWdhaW5zdC4gIEV4cGVjdHMgdGhhdCB2YWx1ZSBtYXRjaGVzIHRoZSB0eXBlIG9mIHRoZSBmaWVsZCBiZWluZyBmaWx0ZXJlZC4gIFNob3VsZCBiZSBudWxsIGlmIFxuICAgICAqIHZhbHVlIHR5cGUgY2Fubm90IGJlIGNvbnZlcnRlZCB0byB0aGUgZmllbGQgdHlwZS5cbiAgICAgKiAqIGBmaWVsZGA6IFRoZSBmaWVsZCBuYW1lIG9mIHRoZSBjb2x1bW4gYmVpbmcgZmlsdGVyZWQuICBUaGlzIGlzIHVzZWQgdG8gaWRlbnRpZnkgdGhlIGNvbHVtbiBpbiB0aGUgZGF0YSBzZXQuXG4gICAgICogKiBgZmlsdGVyVHlwZWA6IFRoZSB0eXBlIG9mIGZpbHRlciB0byBhcHBseSAoZS5nLiwgXCJlcXVhbHNcIiwgXCJsaWtlXCIsIFwiPFwiLCBcIjw9XCIsIFwiPlwiLCBcIj49XCIsIFwiIT1cIiwgXCJiZXR3ZWVuXCIsIFwiaW5cIikuXG4gICAgICogQHBhcmFtIHt7IHZhbHVlOiAoRGF0ZSB8IEFycmF5PERhdGU+KSwgZmllbGQ6IHN0cmluZywgZmlsdGVyVHlwZTogc3RyaW5nIH19IHRhcmdldCBcbiAgICAgKi9cbiAgICBjb25zdHJ1Y3Rvcih0YXJnZXQpIHtcbiAgICAgICAgdGhpcy52YWx1ZSA9IHRhcmdldC52YWx1ZTtcbiAgICAgICAgdGhpcy5maWVsZCA9IHRhcmdldC5maWVsZDtcbiAgICAgICAgdGhpcy5maWVsZFR5cGUgPSBcImRhdGVcIjtcbiAgICAgICAgdGhpcy5maWx0ZXJUeXBlID0gdGFyZ2V0LmZpbHRlclR5cGU7XG4gICAgICAgIHRoaXMuZmlsdGVycyA9IHRoaXMuI2luaXQoKTtcbiAgICB9XG4gICAgLyoqXG4gICAgICogUmV0dXJucyBhIG5ldyBkYXRlIG9iamVjdCBmb3IgZWFjaCBkYXRlIHBhc3NlZCBpbiwgc2V0dGluZyB0aGUgdGltZSB0byBtaWRuaWdodC4gIFRoaXMgaXMgdXNlZCB0byBlbnN1cmUgdGhhdCB0aGUgZGF0ZSBvYmplY3RzIGFyZSBub3QgbW9kaWZpZWRcbiAgICAgKiB3aGVuIGNvbXBhcmluZyBkYXRlcyBpbiB0aGUgZmlsdGVyIGZ1bmN0aW9ucywgYW5kIHRvIGVuc3VyZSB0aGF0IHRoZSB0aW1lIHBvcnRpb24gb2YgdGhlIGRhdGUgZG9lcyBub3QgYWZmZWN0IHRoZSBjb21wYXJpc29uLlxuICAgICAqIEBwYXJhbSB7RGF0ZX0gZGF0ZTEgXG4gICAgICogQHBhcmFtIHtEYXRlfSBkYXRlMiBcbiAgICAgKiBAcmV0dXJucyB7QXJyYXk8RGF0ZT59IFJldHVybnMgYW4gYXJyYXkgb2YgdHdvIGRhdGUgb2JqZWN0cywgZWFjaCBzZXQgdG8gbWlkbmlnaHQgb2YgdGhlIHJlc3BlY3RpdmUgZGF0ZSBwYXNzZWQgaW4uXG4gICAgICovXG4gICAgY2xvbmVEYXRlcyA9IChkYXRlMSwgZGF0ZTIpID0+IHsgXG4gICAgICAgIGNvbnN0IGQxID0gbmV3IERhdGUoZGF0ZTEpO1xuICAgICAgICBjb25zdCBkMiA9IG5ldyBEYXRlKGRhdGUyKTtcblxuICAgICAgICBkMS5zZXRIb3VycygwLCAwLCAwLCAwKTtcbiAgICAgICAgZDIuc2V0SG91cnMoMCwgMCwgMCwgMCk7XG4gICAgICAgIFxuICAgICAgICByZXR1cm4gW2QxLCBkMl07XG4gICAgfTtcblxuICAgICNpbml0KCkgeyBcbiAgICAgICAgcmV0dXJuIHsgXG4gICAgICAgICAgICBcImVxdWFsc1wiOiBmdW5jdGlvbihmaWx0ZXJWYWwsIHJvd1ZhbCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBmaWx0ZXJWYWwuZ2V0RnVsbFllYXIoKSA9PT0gcm93VmFsLmdldEZ1bGxZZWFyKCkgJiYgZmlsdGVyVmFsLmdldE1vbnRoKCkgPT09IHJvd1ZhbC5nZXRNb250aCgpICYmIGZpbHRlclZhbC5nZXREYXRlKCkgPT09IHJvd1ZhbC5nZXREYXRlKCk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgLy9sZXNzIHRoYW5cbiAgICAgICAgICAgIFwiPFwiOiAoZmlsdGVyVmFsLCByb3dWYWwpID0+IHtcbiAgICAgICAgICAgICAgICBjb25zdCBkYXRlcyA9IHRoaXMuY2xvbmVEYXRlcyhmaWx0ZXJWYWwsIHJvd1ZhbCk7XG4gXG4gICAgICAgICAgICAgICAgcmV0dXJuIGRhdGVzWzBdLmdldFRpbWUoKSA8IGRhdGVzWzFdLmdldFRpbWUoKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAvL2xlc3MgdGhhbiBvciBlcXVhbCB0b1xuICAgICAgICAgICAgXCI8PVwiOiAoZmlsdGVyVmFsLCByb3dWYWwpID0+IHtcbiAgICAgICAgICAgICAgICBjb25zdCBkYXRlcyA9IHRoaXMuY2xvbmVEYXRlcyhmaWx0ZXJWYWwsIHJvd1ZhbCk7XG5cbiAgICAgICAgICAgICAgICByZXR1cm4gZGF0ZXNbMF0uZ2V0VGltZSgpIDwgZGF0ZXNbMV0uZ2V0VGltZSgpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIC8vZ3JlYXRlciB0aGFuXG4gICAgICAgICAgICBcIj5cIjogKGZpbHRlclZhbCwgcm93VmFsKSA9PiB7XG4gICAgICAgICAgICAgICAgY29uc3QgZGF0ZXMgPSB0aGlzLmNsb25lRGF0ZXMoZmlsdGVyVmFsLCByb3dWYWwpO1xuXG4gICAgICAgICAgICAgICAgcmV0dXJuIGRhdGVzWzBdLmdldFRpbWUoKSA+IGRhdGVzWzFdLmdldFRpbWUoKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAvL2dyZWF0ZXIgdGhhbiBvciBlcXVhbCB0b1xuICAgICAgICAgICAgXCI+PVwiOiAoZmlsdGVyVmFsLCByb3dWYWwpID0+IHtcbiAgICAgICAgICAgICAgICBjb25zdCBkYXRlcyA9IHRoaXMuY2xvbmVEYXRlcyhmaWx0ZXJWYWwsIHJvd1ZhbCk7XG5cbiAgICAgICAgICAgICAgICByZXR1cm4gZGF0ZXNbMF0uZ2V0VGltZSgpID49IGRhdGVzWzFdLmdldFRpbWUoKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAvL25vdCBlcXVhbCB0b1xuICAgICAgICAgICAgXCIhPVwiOiBmdW5jdGlvbihmaWx0ZXJWYWwsIHJvd1ZhbCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBmaWx0ZXJWYWwuZ2V0RnVsbFllYXIoKSAhPT0gcm93VmFsLmdldEZ1bGxZZWFyKCkgJiYgZmlsdGVyVmFsLmdldE1vbnRoKCkgIT09IHJvd1ZhbC5nZXRNb250aCgpICYmIGZpbHRlclZhbC5nZXREYXRlKCkgIT09IHJvd1ZhbC5nZXREYXRlKCk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgLy8gYmV0d2Vlbi4gIGV4cGVjdHMgZmlsdGVyVmFsIHRvIGJlIGFuIGFycmF5IG9mOiBbIHtzdGFydCB2YWx1ZX0sIHsgZW5kIHZhbHVlIH0gXSBcbiAgICAgICAgICAgIFwiYmV0d2VlblwiOiAoZmlsdGVyVmFsLCByb3dWYWwpICA9PiB7XG4gICAgICAgICAgICAgICAgY29uc3QgZmlsdGVyRGF0ZXMgPSB0aGlzLmNsb25lRGF0ZXMoZmlsdGVyVmFsWzBdLCBmaWx0ZXJWYWxbMV0pO1xuICAgICAgICAgICAgICAgIGNvbnN0IHJvd0RhdGVzID0gdGhpcy5jbG9uZURhdGVzKHJvd1ZhbCwgcm93VmFsKTtcblxuICAgICAgICAgICAgICAgIHJldHVybiByb3dEYXRlc1swXSA+PSBmaWx0ZXJEYXRlc1swXSAmJiByb3dEYXRlc1swXSA8PSBmaWx0ZXJEYXRlc1sxXTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcbiAgICB9XG4gICAgLyoqXG4gICAgICogRXhlY3V0ZXMgYW4gaW50ZXJuYWwgZnVuY3Rpb24gdG8gaW5kaWNhdGUgaWYgdGhlIGN1cnJlbnQgcm93IHZhbHVlIG1hdGNoZXMgdGhlIGZpbHRlciBjcml0ZXJpYSdzIHZhbHVlLiAgXG4gICAgICogQHBhcmFtIHtEYXRlfSByb3dWYWwgUm93IGNvbHVtbiB2YWx1ZS4gIEV4cGVjdHMgYSBEYXRlIG9iamVjdC5cbiAgICAgKiBAcGFyYW0ge09iamVjdDxBcnJheT59IHJvdyBDdXJyZW50IGRhdGEgc2V0IHJvdy5cbiAgICAgKiBAcmV0dXJucyB7Ym9vbGVhbn0gUmV0dXJucyB0cnVlIGlmIHJvdyB2YWx1ZSBtYXRjaGVzIGZpbHRlciB2YWx1ZS4gIE90aGVyd2lzZSwgZmFsc2UgaW5kaWNhdGluZyBubyBtYXRjaC5cbiAgICAgKi9cbiAgICBleGVjdXRlKHJvd1ZhbCwgcm93KSB7XG4gICAgICAgIGlmIChyb3dWYWwgPT09IG51bGwgfHwgIURhdGVIZWxwZXIuaXNEYXRlKHJvd1ZhbCkpIHtcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTsgLy8gSWYgcm93VmFsIGlzIG51bGwgb3Igbm90IGEgZGF0ZSwgcmV0dXJuIGZhbHNlLlxuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHRoaXMuZmlsdGVyc1t0aGlzLmZpbHRlclR5cGVdKHRoaXMudmFsdWUsIHJvd1ZhbCk7XG4gICAgfVxufVxuXG5leHBvcnQgeyBGaWx0ZXJEYXRlIH07IiwiLyoqXG4gKiBSZXByZXNlbnRzIGEgY29uY3JldGUgaW1wbGVtZW50YXRpb24gb2YgYSBmaWx0ZXIgdGhhdCB1c2VzIGEgdXNlciBzdXBwbGllZCBmdW5jdGlvbi5cbiAqL1xuY2xhc3MgRmlsdGVyRnVuY3Rpb24ge1xuICAgIC8qKlxuICAgICAqIENyZWF0ZXMgYSBmaWx0ZXIgZnVuY3Rpb24gaW5zdGFuY2UuICBFeHBlY3RzIGFuIG9iamVjdCB3aXRoIHRoZSBmb2xsb3dpbmcgcHJvcGVydGllczpcbiAgICAgKiAqIGB2YWx1ZWA6IFRoZSB2YWx1ZSB0byBmaWx0ZXIgYWdhaW5zdC4gIERvZXMgbm90IG5lZWQgdG8gbWF0Y2ggdGhlIHR5cGUgb2YgdGhlIGZpZWxkIGJlaW5nIGZpbHRlcmVkLlxuICAgICAqICogYGZpZWxkYDogVGhlIGZpZWxkIG5hbWUgb2YgdGhlIGNvbHVtbiBiZWluZyBmaWx0ZXJlZC4gIFRoaXMgaXMgdXNlZCB0byBpZGVudGlmeSB0aGUgY29sdW1uIGluIHRoZSBkYXRhIHNldC5cbiAgICAgKiAqIGBmaWx0ZXJUeXBlYDogVGhlIGZ1bmN0aW9uIHRvIHVzZSBmb3IgZmlsdGVyaW5nLlxuICAgICAqICogYHBhcmFtc2A6IE9wdGlvbmFsIHBhcmFtZXRlcnMgdG8gcGFzcyB0byB0aGUgZmlsdGVyIGZ1bmN0aW9uLlxuICAgICAqIEBwYXJhbSB7eyB2YWx1ZTogT2JqZWN0LCBmaWVsZDogc3RyaW5nLCBmaWx0ZXJUeXBlOiBGdW5jdGlvbiwgcGFyYW1zOiBPYmplY3QgfX0gdGFyZ2V0IFxuICAgICAqL1xuICAgIGNvbnN0cnVjdG9yKHRhcmdldCkge1xuICAgICAgICB0aGlzLnZhbHVlID0gdGFyZ2V0LnZhbHVlO1xuICAgICAgICB0aGlzLmZpZWxkID0gdGFyZ2V0LmZpZWxkO1xuICAgICAgICB0aGlzLmZpbHRlckZ1bmN0aW9uID0gdGFyZ2V0LmZpbHRlclR5cGU7XG4gICAgICAgIHRoaXMucGFyYW1zID0gdGFyZ2V0LnBhcmFtcyA/PyB7fTtcbiAgICB9XG4gICAgLyoqXG4gICAgICogRXhlY3V0ZXMgYW4gdXNlciBzdXBwbGllZCBmdW5jdGlvbiB0byBpbmRpY2F0ZSBpZiB0aGUgY3VycmVudCByb3cgdmFsdWVzIG1hdGNoZXMgdGhlIGZpbHRlciBjcml0ZXJpYSdzIHZhbHVlLiAgXG4gICAgICogQHBhcmFtIHtPYmplY3R9IHJvd1ZhbCBSb3cgY29sdW1uIHZhbHVlLiAgRXhwZWN0cyBhIHZhbHVlIHRoYXQgbWF0Y2hlcyB0aGUgdHlwZSBpZGVudGlmaWVkIGJ5IHRoZSBjb2x1bW4uXG4gICAgICogQHBhcmFtIHtPYmplY3Q8QXJyYXk+fSByb3cgQ3VycmVudCBkYXRhIHNldCByb3cuXG4gICAgICogQHJldHVybnMge2Jvb2xlYW59IFJldHVybnMgdHJ1ZSBpZiByb3cgdmFsdWUgbWF0Y2hlcyBmaWx0ZXIgdmFsdWUuICBPdGhlcndpc2UsIGZhbHNlIGluZGljYXRpbmcgbm8gbWF0Y2guXG4gICAgICovXG4gICAgZXhlY3V0ZShyb3dWYWwsIHJvdykge1xuICAgICAgICByZXR1cm4gdGhpcy5maWx0ZXJGdW5jdGlvbih0aGlzLnZhbHVlLCByb3dWYWwsIHJvdywgdGhpcy5wYXJhbXMpO1xuICAgIH1cbn1cblxuZXhwb3J0IHsgRmlsdGVyRnVuY3Rpb24gfTsiLCJjbGFzcyBFbGVtZW50SGVscGVyIHtcbiAgICAvKipcbiAgICAgKiBDcmVhdGVzIGFuIEhUTUwgZWxlbWVudCB3aXRoIHRoZSBzcGVjaWZpZWQgdGFnIGFuZCBwcm9wZXJ0aWVzLlxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSB0YWcgVGhlIHRhZyBuYW1lIG9mIHRoZSBlbGVtZW50IHRvIGNyZWF0ZS5cbiAgICAgKiBAcGFyYW0ge09iamVjdH0gW3Byb3BlcnRpZXM9e31dIEFuIG9iamVjdCBjb250YWluaW5nIHByb3BlcnRpZXMgdG8gYXNzaWduIHRvIHRoZSBlbGVtZW50LlxuICAgICAqIEBwYXJhbSB7T2JqZWN0fSBbZGF0YXNldD17fV0gQW4gb2JqZWN0IGNvbnRhaW5pbmcgZGF0YXNldCBhdHRyaWJ1dGVzIHRvIGFzc2lnbiB0byB0aGUgZWxlbWVudC5cbiAgICAgKiBAcmV0dXJucyB7SFRNTEVsZW1lbnR9IFRoZSBjcmVhdGVkIEhUTUwgZWxlbWVudC5cbiAgICAgKi9cbiAgICBzdGF0aWMgY3JlYXRlKHRhZywgcHJvcGVydGllcyA9IHt9LCBkYXRhc2V0ID0ge30pIHtcbiAgICAgICAgY29uc3QgZWxlbWVudCA9IE9iamVjdC5hc3NpZ24oZG9jdW1lbnQuY3JlYXRlRWxlbWVudCh0YWcpLCBwcm9wZXJ0aWVzKTtcblxuICAgICAgICBpZiAoZGF0YXNldCkgeyBcbiAgICAgICAgICAgIE9iamVjdC5hc3NpZ24oZWxlbWVudC5kYXRhc2V0LCBkYXRhc2V0KTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBlbGVtZW50O1xuICAgIH1cbiAgICAvKipcbiAgICAgKiBDcmVhdGVzIGEgYGRpdmAgZWxlbWVudCB3aXRoIHRoZSBzcGVjaWZpZWQgcHJvcGVydGllcyBhbmQgZGF0YXNldC5cbiAgICAgKiBAcGFyYW0ge09iamVjdH0gW3Byb3BlcnRpZXM9e31dIEFuIG9iamVjdCBjb250YWluaW5nIHByb3BlcnRpZXMgdG8gYXNzaWduIHRvIHRoZSBlbGVtZW50LlxuICAgICAqIEBwYXJhbSB7T2JqZWN0fSBbZGF0YXNldD17fV0gQW4gb2JqZWN0IGNvbnRhaW5pbmcgZGF0YXNldCBhdHRyaWJ1dGVzIHRvIGFzc2lnbiB0byB0aGUgZWxlbWVudC5cbiAgICAgKiBAcmV0dXJucyB7SFRNTERpdkVsZW1lbnR9IFRoZSBjcmVhdGVkIEhUTUwgZWxlbWVudC5cbiAgICAgKi9cbiAgICBzdGF0aWMgZGl2KHByb3BlcnRpZXMgPSB7fSwgZGF0YXNldCA9IHt9KSB7XG4gICAgICAgIHJldHVybiB0aGlzLmNyZWF0ZShcImRpdlwiLCBwcm9wZXJ0aWVzLCBkYXRhc2V0KTtcbiAgICB9XG4gICAgLyoqXG4gICAgICogQ3JlYXRlcyBhIGBpbnB1dGAgZWxlbWVudCB3aXRoIHRoZSBzcGVjaWZpZWQgcHJvcGVydGllcyBhbmQgZGF0YXNldC5cbiAgICAgKiBAcGFyYW0ge09iamVjdH0gW3Byb3BlcnRpZXM9e31dIEFuIG9iamVjdCBjb250YWluaW5nIHByb3BlcnRpZXMgdG8gYXNzaWduIHRvIHRoZSBlbGVtZW50LlxuICAgICAqIEBwYXJhbSB7T2JqZWN0fSBbZGF0YXNldD17fV0gQW4gb2JqZWN0IGNvbnRhaW5pbmcgZGF0YXNldCBhdHRyaWJ1dGVzIHRvIGFzc2lnbiB0byB0aGUgZWxlbWVudC5cbiAgICAgKiBAcmV0dXJucyB7SFRNTElucHV0RWxlbWVudH0gVGhlIGNyZWF0ZWQgSFRNTCBlbGVtZW50LlxuICAgICAqL1xuICAgIHN0YXRpYyBpbnB1dChwcm9wZXJ0aWVzID0ge30sIGRhdGFzZXQgPSB7fSkge1xuICAgICAgICByZXR1cm4gdGhpcy5jcmVhdGUoXCJpbnB1dFwiLCBwcm9wZXJ0aWVzLCBkYXRhc2V0KTtcbiAgICB9XG4gICAgLyoqXG4gICAgICogQ3JlYXRlcyBhIGBzcGFuYCBlbGVtZW50IHdpdGggdGhlIHNwZWNpZmllZCBwcm9wZXJ0aWVzIGFuZCBkYXRhc2V0LlxuICAgICAqIEBwYXJhbSB7T2JqZWN0fSBbcHJvcGVydGllcz17fV0gQW4gb2JqZWN0IGNvbnRhaW5pbmcgcHJvcGVydGllcyB0byBhc3NpZ24gdG8gdGhlIGVsZW1lbnQuXG4gICAgICogQHBhcmFtIHtPYmplY3R9IFtkYXRhc2V0PXt9XSBBbiBvYmplY3QgY29udGFpbmluZyBkYXRhc2V0IGF0dHJpYnV0ZXMgdG8gYXNzaWduIHRvIHRoZSBlbGVtZW50LlxuICAgICAqIEByZXR1cm5zIHtIVE1MU3BhbkVsZW1lbnR9IFRoZSBjcmVhdGVkIEhUTUwgZWxlbWVudC5cbiAgICAgKi9cbiAgICBzdGF0aWMgc3Bhbihwcm9wZXJ0aWVzID0ge30sIGRhdGFzZXQgPSB7fSkge1xuICAgICAgICByZXR1cm4gdGhpcy5jcmVhdGUoXCJzcGFuXCIsIHByb3BlcnRpZXMsIGRhdGFzZXQpO1xuICAgIH1cbn1cblxuZXhwb3J0IHsgRWxlbWVudEhlbHBlciB9OyIsImltcG9ydCB7IENzc0hlbHBlciB9IGZyb20gXCIuLi8uLi8uLi9jb21wb25lbnRzL2hlbHBlcnMvY3NzSGVscGVyLmpzXCI7XG5pbXBvcnQgeyBFbGVtZW50SGVscGVyIH0gZnJvbSBcIi4uLy4uLy4uL2NvbXBvbmVudHMvaGVscGVycy9lbGVtZW50SGVscGVyLmpzXCI7XG4vKipcbiAqIENyZWF0ZSBmaWx0ZXIgb2JqZWN0IHRoYXQgcmVwcmVzZW50cyBhIGVsZW1lbnQgdG8gZmlsdGVyIGJldHdlZW4gdHdvIHZhbHVlcy4gIENyZWF0ZXMgYSBkcm9wZG93biB3aXRoIGEgdHdvIGlucHV0IGJveGVzIFxuICogdG8gZW50ZXIgc3RhcnQgYW5kIGVuZCB2YWx1ZXMuXG4gKi9cbmNsYXNzIEVsZW1lbnRCZXR3ZWVuIHtcbiAgICAvKipcbiAgICAgKiBDcmVhdGUgZmlsdGVyIG9iamVjdCB0aGF0IHJlcHJlc2VudHMgYSBiZXR3ZWVuIGVsZW1lbnQuXG4gICAgICogQHBhcmFtIHtDb2x1bW59IGNvbHVtbiBDb2x1bW4gY2xhc3Mgb2JqZWN0LlxuICAgICAqIEBwYXJhbSB7R3JpZENvbnRleHR9IGNvbnRleHQgR3JpZCBjb250ZXh0IG9iamVjdC5cbiAgICAgKi9cbiAgICBjb25zdHJ1Y3Rvcihjb2x1bW4sIGNvbnRleHQpIHtcbiAgICAgICAgdGhpcy5jb250ZXh0ID0gY29udGV4dDtcbiAgICAgICAgdGhpcy5lbGVtZW50ID0gRWxlbWVudEhlbHBlci5kaXYoeyBuYW1lOiBjb2x1bW4uZmllbGQsIGNsYXNzTmFtZTogQ3NzSGVscGVyLm11bHRpU2VsZWN0LnBhcmVudENsYXNzIH0pO1xuICAgICAgICB0aGlzLmhlYWRlciA9IEVsZW1lbnRIZWxwZXIuZGl2KHsgY2xhc3NOYW1lOiBDc3NIZWxwZXIubXVsdGlTZWxlY3QuaGVhZGVyIH0pO1xuICAgICAgICB0aGlzLm9wdGlvbnNDb250YWluZXIgPSBFbGVtZW50SGVscGVyLmRpdih7IGNsYXNzTmFtZTogQ3NzSGVscGVyLm11bHRpU2VsZWN0Lm9wdGlvbnMgfSk7XG4gICAgICAgIHRoaXMuZmllbGQgPSBjb2x1bW4uZmllbGQ7XG4gICAgICAgIHRoaXMuZmllbGRUeXBlID0gY29sdW1uLnR5cGU7ICAvL2ZpZWxkIHZhbHVlIHR5cGUuXG4gICAgICAgIHRoaXMuZmlsdGVyVHlwZSA9IFwiYmV0d2VlblwiOyAgLy9jb25kaXRpb24gdHlwZS5cblxuICAgICAgICB0aGlzLmVsZW1lbnQuaWQgPSBgJHt0aGlzLmNvbnRleHQuc2V0dGluZ3MuYmFzZUlkTmFtZX1fJHt0aGlzLmZpZWxkfWA7XG4gICAgICAgIHRoaXMuZWxlbWVudC5hcHBlbmQodGhpcy5oZWFkZXIsIHRoaXMub3B0aW9uc0NvbnRhaW5lcik7XG4gICAgICAgIHRoaXMuaGVhZGVyLmlkID0gYGhlYWRlcl8ke3RoaXMuY29udGV4dC5zZXR0aW5ncy5iYXNlSWROYW1lfV8ke3RoaXMuZmllbGR9YDtcbiAgICAgICAgdGhpcy5vcHRpb25zQ29udGFpbmVyLnN0eWxlLm1pbldpZHRoID0gXCIxODVweFwiO1xuXG4gICAgICAgIHRoaXMuI3RlbXBsYXRlQmV0d2VlbigpO1xuICAgICAgICB0aGlzLmhlYWRlci5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgdGhpcy5oYW5kbGVDbGljayk7XG4gICAgfVxuXG4gICAgI3RlbXBsYXRlQmV0d2VlbigpIHtcbiAgICAgICAgdGhpcy5lbGVtZW50U3RhcnQgPSBFbGVtZW50SGVscGVyLmlucHV0KHsgY2xhc3NOYW1lOiBDc3NIZWxwZXIuaW5wdXQsIGlkOiBgc3RhcnRfJHt0aGlzLmNvbnRleHQuc2V0dGluZ3MuYmFzZUlkTmFtZX1fJHt0aGlzLmZpZWxkfWAgfSk7XG5cbiAgICAgICAgdGhpcy5lbGVtZW50RW5kID0gRWxlbWVudEhlbHBlci5pbnB1dCh7IGNsYXNzTmFtZTogQ3NzSGVscGVyLmlucHV0LCBpZDogYGVuZF8ke3RoaXMuY29udGV4dC5zZXR0aW5ncy5iYXNlSWROYW1lfV8ke3RoaXMuZmllbGR9YCB9KTtcbiAgICAgICAgdGhpcy5lbGVtZW50RW5kLnN0eWxlLm1hcmdpbkJvdHRvbSA9IFwiMTBweFwiO1xuXG4gICAgICAgIGNvbnN0IHN0YXJ0ID0gRWxlbWVudEhlbHBlci5zcGFuKHsgaW5uZXJUZXh0OiBcIlN0YXJ0XCIsIGNsYXNzTmFtZTogQ3NzSGVscGVyLmJldHdlZW5MYWJlbCB9KTtcbiAgICAgICAgY29uc3QgZW5kID0gIEVsZW1lbnRIZWxwZXIuc3Bhbih7IGlubmVyVGV4dDogXCJFbmRcIiwgY2xhc3NOYW1lOiBDc3NIZWxwZXIuYmV0d2VlbkxhYmVsIH0pO1xuIFxuICAgICAgICBjb25zdCBidG5BcHBseSA9IEVsZW1lbnRIZWxwZXIuY3JlYXRlKFwiYnV0dG9uXCIsIHsgaW5uZXJUZXh0OiBcIkFwcGx5XCIsIGNsYXNzTmFtZTogQ3NzSGVscGVyLmJldHdlZW5CdXR0b24gfSk7XG4gICAgICAgIGJ0bkFwcGx5LnN0eWxlLm1hcmdpblJpZ2h0ID0gXCIxMHB4XCI7XG4gICAgICAgIGJ0bkFwcGx5LmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCB0aGlzLmhhbmRsZXJDbGljayk7XG5cbiAgICAgICAgY29uc3QgYnRuQ2xlYXIgPSBFbGVtZW50SGVscGVyLmNyZWF0ZShcImJ1dHRvblwiLCB7IGlubmVyVGV4dDogXCJDbGVhclwiLCBjbGFzc05hbWU6IENzc0hlbHBlci5iZXR3ZWVuQnV0dG9uIH0pO1xuICAgICAgICBidG5DbGVhci5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgdGhpcy5oYW5kbGVCdXR0b25DbGVhcik7XG5cbiAgICAgICAgdGhpcy5vcHRpb25zQ29udGFpbmVyLmFwcGVuZChzdGFydCwgdGhpcy5lbGVtZW50U3RhcnQsIGVuZCwgdGhpcy5lbGVtZW50RW5kLCBidG5BcHBseSwgYnRuQ2xlYXIpO1xuICAgIH1cblxuICAgIGhhbmRsZUJ1dHRvbkNsZWFyID0gKCkgPT4ge1xuICAgICAgICB0aGlzLmVsZW1lbnRTdGFydC52YWx1ZSA9IFwiXCI7XG4gICAgICAgIHRoaXMuZWxlbWVudEVuZC52YWx1ZSA9IFwiXCI7XG5cbiAgICAgICAgaWYgKHRoaXMuY291bnRMYWJlbCAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICB0aGlzLmNvdW50TGFiZWwucmVtb3ZlKCk7XG4gICAgICAgICAgICB0aGlzLmNvdW50TGFiZWwgPSB1bmRlZmluZWQ7XG4gICAgICAgIH1cbiAgICB9O1xuXG4gICAgY3JlYXRlQ291bnRMYWJlbCA9ICgpID0+IHtcbiAgICAgICAgLy91cGRhdGUgY291bnQgbGFiZWwuXG4gICAgICAgIGlmICh0aGlzLmNvdW50TGFiZWwgPT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgdGhpcy5jb3VudExhYmVsID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcInNwYW5cIik7XG4gICAgICAgICAgICB0aGlzLmNvdW50TGFiZWwuY2xhc3NOYW1lID0gQ3NzSGVscGVyLm11bHRpU2VsZWN0LmhlYWRlck9wdGlvbjtcbiAgICAgICAgICAgIHRoaXMuaGVhZGVyLmFwcGVuZCh0aGlzLmNvdW50TGFiZWwpO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHRoaXMuZWxlbWVudFN0YXJ0LnZhbHVlICE9PSBcIlwiICYmIHRoaXMuZWxlbWVudEVuZC52YWx1ZSAhPT0gXCJcIikge1xuICAgICAgICAgICAgdGhpcy5jb3VudExhYmVsLmlubmVyVGV4dCA9IGAke3RoaXMuZWxlbWVudFN0YXJ0LnZhbHVlfSB0byAke3RoaXMuZWxlbWVudEVuZC52YWx1ZX1gO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdGhpcy5jb3VudExhYmVsLnJlbW92ZSgpO1xuICAgICAgICAgICAgdGhpcy5jb3VudExhYmVsID0gdW5kZWZpbmVkO1xuICAgICAgICB9XG4gICAgfTtcblxuICAgIGhhbmRsZUNsaWNrID0gYXN5bmMgKCkgPT4ge1xuICAgICAgICBjb25zdCBzdGF0dXMgPSB0aGlzLmhlYWRlci5jbGFzc0xpc3QudG9nZ2xlKENzc0hlbHBlci5tdWx0aVNlbGVjdC5oZWFkZXJBY3RpdmUpO1xuXG4gICAgICAgIGlmICghc3RhdHVzKSB7XG4gICAgICAgICAgICAvL0Nsb3NlIHdpbmRvdyBhbmQgYXBwbHkgZmlsdGVyIHZhbHVlLlxuICAgICAgICAgICAgdGhpcy5jcmVhdGVDb3VudExhYmVsKCk7XG4gICAgICAgICAgICBhd2FpdCB0aGlzLmNvbnRleHQuZXZlbnRzLnRyaWdnZXIoXCJyZW5kZXJcIik7XG4gICAgICAgICAgICBkb2N1bWVudC5yZW1vdmVFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgdGhpcy5oYW5kbGVEb2N1bWVudCk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBkb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgdGhpcy5oYW5kbGVEb2N1bWVudCk7XG4gICAgICAgIH1cbiAgICB9O1xuICAgIC8qKlxuICAgICAqIEhhbmRsZXIgZXZlbnQgdG8gY2xvc2UgZHJvcGRvd24gd2hlbiB1c2VyIGNsaWNrcyBvdXRzaWRlIHRoZSBtdWx0aS1zZWxlY3QgY29udHJvbC4gIEV2ZW50IGlzIHJlbW92ZWQgd2hlbiBtdWx0aS1zZWxlY3QgaXMgXG4gICAgICogbm90IGFjdGl2ZSBzbyB0aGF0IGl0J3Mgbm90IGZpcmluZyBvbiByZWR1bmRhbnQgZXZlbnRzLlxuICAgICAqIEBwYXJhbSB7T2JqZWN0fSBlIE9iamVjdCB0aGF0IHRyaWdnZXJlZCBldmVudC5cbiAgICAgKi9cbiAgICBoYW5kbGVEb2N1bWVudCA9IGFzeW5jIChlKSA9PiB7XG4gICAgICAgIGlmICghZS50YXJnZXQuY2xvc2VzdChgLiR7Q3NzSGVscGVyLmlucHV0fWApICYmICFlLnRhcmdldC5jbG9zZXN0KGAjJHt0aGlzLmhlYWRlci5pZH1gKSkge1xuICAgICAgICAgICAgdGhpcy5oZWFkZXIuY2xhc3NMaXN0LnJlbW92ZShDc3NIZWxwZXIubXVsdGlTZWxlY3QuaGVhZGVyQWN0aXZlKTtcblxuICAgICAgICAgICAgYXdhaXQgdGhpcy5jb250ZXh0LmV2ZW50cy50cmlnZ2VyKFwicmVuZGVyXCIpO1xuXG4gICAgICAgICAgICBkb2N1bWVudC5yZW1vdmVFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgdGhpcy5oYW5kbGVEb2N1bWVudCk7XG4gICAgICAgIH1cbiAgICB9O1xuICAgIC8qKlxuICAgICAqIFJldHVybnMgYW4gYXJyYXkgb2YgdGhlIHN0YXJ0IGFuZCBlbmQgdmFsdWVzIGZyb20gaW5wdXQgc291cmNlLiAgSWYgZWl0aGVyIGlucHV0IHNvdXJjZSBpcyBlbXB0eSwgYW4gZW1wdHkgc3RyaW5nIHdpbGwgYmUgcmV0dXJuZWQuXG4gICAgICogQHJldHVybnMge0FycmF5IHwgc3RyaW5nfSBBcnJheSBvZiBzdGFydCBhbmQgZW5kIHZhbHVlcyBvciBlbXB0eSBzdHJpbmcuXG4gICAgICovXG4gICAgZ2V0IHZhbHVlKCkge1xuICAgICAgICBpZiAodGhpcy5lbGVtZW50U3RhcnQudmFsdWUgPT09IFwiXCIgfHwgdGhpcy5lbGVtZW50RW5kLnZhbHVlID09PSBcIlwiKSByZXR1cm4gXCJcIjtcblxuICAgICAgICByZXR1cm4gW3RoaXMuZWxlbWVudFN0YXJ0LnZhbHVlLCB0aGlzLmVsZW1lbnRFbmQudmFsdWVdO1xuICAgIH1cbn1cblxuZXhwb3J0IHsgRWxlbWVudEJldHdlZW4gfTsiLCIvKipcbiAqIFJlcHJlc2VudHMgYSBjb2x1bW5zIGZpbHRlciBjb250cm9sLiAgQ3JlYXRlcyBhIGBIVE1MSW5wdXRFbGVtZW50YCB0aGF0IGlzIGFkZGVkIHRvIHRoZSBoZWFkZXIgcm93IG9mIFxuICogdGhlIGdyaWQgdG8gZmlsdGVyIGRhdGEgc3BlY2lmaWMgdG8gaXRzIGRlZmluZWQgY29sdW1uLiBcbiAqL1xuY2xhc3MgRWxlbWVudElucHV0IHtcbiAgICAvKipcbiAgICAgKiBDcmVhdGUgZmlsdGVyIG9iamVjdCB0aGF0IHJlcHJlc2VudHMgYSBgSFRNTFNlbGVjdEVsZW1lbnRgIGVsZW1lbnQgaW4gdGhlIHRhYmxlJ3MgaGVhZGVyIHJvdy5cbiAgICAgKiBAcGFyYW0ge0NvbHVtbn0gY29sdW1uIENvbHVtbiBjbGFzcyBvYmplY3QuXG4gICAgICogQHBhcmFtIHtHcmlkQ29udGV4dH0gY29udGV4dCBHcmlkIGNvbnRleHQuXG4gICAgKi9cbiAgICBjb25zdHJ1Y3Rvcihjb2x1bW4sIGNvbnRleHQpIHtcbiAgICAgICAgdGhpcy5lbGVtZW50ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImlucHV0XCIpO1xuICAgICAgICB0aGlzLmNvbnRleHQgPSBjb250ZXh0O1xuICAgICAgICB0aGlzLmZpZWxkID0gY29sdW1uLmZpZWxkO1xuICAgICAgICB0aGlzLmZpZWxkVHlwZSA9IGNvbHVtbi50eXBlOyAgLy9maWVsZCB2YWx1ZSB0eXBlLlxuICAgICAgICB0aGlzLmZpbHRlclR5cGUgPSBjb2x1bW4uZmlsdGVyVHlwZTsgIC8vY29uZGl0aW9uIHR5cGUuXG4gICAgICAgIHRoaXMuZmlsdGVySXNGdW5jdGlvbiA9ICh0eXBlb2YgY29sdW1uPy5maWx0ZXJUeXBlID09PSBcImZ1bmN0aW9uXCIpO1xuICAgICAgICB0aGlzLmZpbHRlclBhcmFtcyA9IGNvbHVtbi5maWx0ZXJQYXJhbXM7XG4gICAgICAgIHRoaXMuZWxlbWVudC5uYW1lID0gdGhpcy5maWVsZDtcbiAgICAgICAgdGhpcy5lbGVtZW50LmlkID0gdGhpcy5maWVsZDtcbiAgICAgICAgdGhpcy5lbGVtZW50LmFkZEV2ZW50TGlzdGVuZXIoXCJjaGFuZ2VcIiwgYXN5bmMgKCkgPT4gYXdhaXQgdGhpcy5jb250ZXh0LmV2ZW50cy50cmlnZ2VyKFwicmVuZGVyXCIpKTtcblxuICAgICAgICBpZiAoY29sdW1uLmZpbHRlckNzcykge1xuICAgICAgICAgICAgdGhpcy5lbGVtZW50LmNsYXNzTmFtZSA9IGNvbHVtbi5maWx0ZXJDc3M7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoIXRoaXMuY29udGV4dC5zZXR0aW5ncy5yZW1vdGVQcm9jZXNzaW5nICYmIGNvbHVtbi5maWx0ZXJSZWFsVGltZSkge1xuICAgICAgICAgICAgdGhpcy5yZWFsVGltZVRpbWVvdXQgPSAodHlwZW9mIHRoaXMuZmlsdGVyUmVhbFRpbWUgPT09IFwibnVtYmVyXCIpIFxuICAgICAgICAgICAgICAgID8gdGhpcy5maWx0ZXJSZWFsVGltZSBcbiAgICAgICAgICAgICAgICA6IDUwMDtcblxuICAgICAgICAgICAgdGhpcy5lbGVtZW50LmFkZEV2ZW50TGlzdGVuZXIoXCJrZXl1cFwiLCB0aGlzLmhhbmRsZUxpdmVGaWx0ZXIpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgaGFuZGxlTGl2ZUZpbHRlciA9IGFzeW5jICgpID0+IHtcbiAgICAgICAgc2V0VGltZW91dChhc3luYyAoKSA9PiBhd2FpdCB0aGlzLmNvbnRleHQuZXZlbnRzLnRyaWdnZXIoXCJyZW5kZXJcIiksIHRoaXMucmVhbFRpbWVUaW1lb3V0KTtcbiAgICB9O1xuICAgIC8qKlxuICAgICAqIFJldHVybnMgdGhlIHZhbHVlIG9mIHRoZSBpbnB1dCBlbGVtZW50LiAgV2lsbCByZXR1cm4gYSBzdHJpbmcgdmFsdWUuXG4gICAgICogQHJldHVybnMge3N0cmluZ31cbiAgICAgKi9cbiAgICBnZXQgdmFsdWUoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmVsZW1lbnQudmFsdWU7XG4gICAgfVxufVxuXG5leHBvcnQgeyBFbGVtZW50SW5wdXQgfTsiLCJpbXBvcnQgeyBDc3NIZWxwZXIgfSBmcm9tIFwiLi4vLi4vLi4vY29tcG9uZW50cy9oZWxwZXJzL2Nzc0hlbHBlci5qc1wiO1xuaW1wb3J0IHsgRWxlbWVudEhlbHBlciB9IGZyb20gXCIuLi8uLi8uLi9jb21wb25lbnRzL2hlbHBlcnMvZWxlbWVudEhlbHBlci5qc1wiO1xuLyoqXG4gKiBDcmVhdGUgZmlsdGVyIG9iamVjdCB0aGF0IHJlcHJlc2VudHMgYSBtdWx0aS1zZWxlY3QgZWxlbWVudC4gIENyZWF0ZXMgYSBkcm9wZG93biB3aXRoIGEgbGlzdCBvZiBvcHRpb25zIHRoYXQgY2FuIGJlIFxuICogc2VsZWN0ZWQgb3IgZGVzZWxlY3RlZC4gIElmIGBmaWx0ZXJWYWx1ZXNSZW1vdGVTb3VyY2VgIGlzIGRlZmluZWQsIHRoZSBzZWxlY3Qgb3B0aW9ucyB3aWxsIGJlIHBvcHVsYXRlZCBieSB0aGUgZGF0YSByZXR1cm5lZCBcbiAqIGZyb20gdGhlIHJlbW90ZSBzb3VyY2UgYnkgcmVnaXN0ZXJpbmcgdG8gIHRoZSBncmlkIHBpcGVsaW5lJ3MgYGluaXRgIGFuZCBgcmVmcmVzaGAgZXZlbnRzLlxuICovXG5jbGFzcyBFbGVtZW50TXVsdGlTZWxlY3Qge1xuICAgIC8qKlxuICAgICAqIENyZWF0ZSBmaWx0ZXIgb2JqZWN0IHRoYXQgcmVwcmVzZW50cyBhIG11bHRpLXNlbGVjdCBlbGVtZW50LlxuICAgICAqIEBwYXJhbSB7Q29sdW1ufSBjb2x1bW4gQ29sdW1uIGNsYXNzIG9iamVjdC5cbiAgICAgKiBAcGFyYW0ge0dyaWRDb250ZXh0fSBjb250ZXh0IEdyaWQgY29udGV4dCBvYmplY3QuXG4gICAgICovXG4gICAgY29uc3RydWN0b3IoY29sdW1uLCBjb250ZXh0KSB7XG4gICAgICAgIHRoaXMuY29udGV4dCA9IGNvbnRleHQ7XG4gICAgICAgIHRoaXMuZWxlbWVudCA9IEVsZW1lbnRIZWxwZXIuZGl2KHsgbmFtZTogY29sdW1uLmZpZWxkLCBjbGFzc05hbWU6IENzc0hlbHBlci5tdWx0aVNlbGVjdC5wYXJlbnRDbGFzcyB9KTtcbiAgICAgICAgdGhpcy5oZWFkZXIgPSBFbGVtZW50SGVscGVyLmRpdih7IGNsYXNzTmFtZTogQ3NzSGVscGVyLm11bHRpU2VsZWN0LmhlYWRlciB9KTtcbiAgICAgICAgdGhpcy5vcHRpb25zQ29udGFpbmVyID0gRWxlbWVudEhlbHBlci5kaXYoeyBjbGFzc05hbWU6IENzc0hlbHBlci5tdWx0aVNlbGVjdC5vcHRpb25zIH0pO1xuICAgICAgICB0aGlzLmZpZWxkID0gY29sdW1uLmZpZWxkO1xuICAgICAgICB0aGlzLmZpZWxkVHlwZSA9IGNvbHVtbi50eXBlOyAgLy9maWVsZCB2YWx1ZSB0eXBlLlxuICAgICAgICB0aGlzLmZpbHRlclR5cGUgPSBcImluXCI7ICAvL2NvbmRpdGlvbiB0eXBlLlxuICAgICAgICB0aGlzLmZpbHRlcklzRnVuY3Rpb24gPSAodHlwZW9mIGNvbHVtbj8uZmlsdGVyVHlwZSA9PT0gXCJmdW5jdGlvblwiKTtcbiAgICAgICAgdGhpcy5maWx0ZXJQYXJhbXMgPSBjb2x1bW4uZmlsdGVyUGFyYW1zO1xuICAgICAgICB0aGlzLmxpc3RBbGwgPSBmYWxzZTtcbiAgICAgICAgdGhpcy5zZWxlY3RlZFZhbHVlcyA9IFtdO1xuXG4gICAgICAgIGlmICh0eXBlb2YgY29sdW1uLmZpbHRlck11bHRpU2VsZWN0ID09PSBcIm9iamVjdFwiKSB7XG4gICAgICAgICAgICB0aGlzLmxpc3RBbGwgPSBjb2x1bW4uZmlsdGVyTXVsdGlTZWxlY3QubGlzdEFsbDtcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMuaGVhZGVyLmlkID0gYGhlYWRlcl8ke3RoaXMuY29udGV4dC5zZXR0aW5ncy5iYXNlSWROYW1lfV8ke3RoaXMuZmllbGR9YDtcbiAgICAgICAgdGhpcy5lbGVtZW50LmlkID0gYCR7dGhpcy5jb250ZXh0LnNldHRpbmdzLmJhc2VJZE5hbWV9XyR7dGhpcy5maWVsZH1gO1xuICAgICAgICB0aGlzLmVsZW1lbnQuYXBwZW5kKHRoaXMuaGVhZGVyLCB0aGlzLm9wdGlvbnNDb250YWluZXIpO1xuXG4gICAgICAgIGlmIChjb2x1bW4uZmlsdGVyVmFsdWVzUmVtb3RlU291cmNlKSB7XG4gICAgICAgICAgICAvL3NldCB1cCBwaXBlbGluZSB0byByZXRyaWV2ZSBvcHRpb24gZGF0YSB3aGVuIGluaXQgcGlwZWxpbmUgaXMgY2FsbGVkLlxuICAgICAgICAgICAgdGhpcy5jb250ZXh0LnBpcGVsaW5lLmFkZFN0ZXAoXCJpbml0XCIsIHRoaXMudGVtcGxhdGVDb250YWluZXIsIGNvbHVtbi5maWx0ZXJWYWx1ZXNSZW1vdGVTb3VyY2UpO1xuICAgICAgICAgICAgdGhpcy5jb250ZXh0LnBpcGVsaW5lLmFkZFN0ZXAoXCJyZWZyZXNoXCIsIHRoaXMucmVmcmVzaFNlbGVjdE9wdGlvbnMsIGNvbHVtbi5maWx0ZXJWYWx1ZXNSZW1vdGVTb3VyY2UpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgLy91c2UgdXNlciBzdXBwbGllZCB2YWx1ZXMgdG8gY3JlYXRlIHNlbGVjdCBvcHRpb25zLlxuICAgICAgICAgICAgY29uc3QgZGF0YSA9IEFycmF5LmlzQXJyYXkoY29sdW1uLmZpbHRlclZhbHVlcykgXG4gICAgICAgICAgICAgICAgPyBjb2x1bW4uZmlsdGVyVmFsdWVzXG4gICAgICAgICAgICAgICAgOiBPYmplY3QuZW50cmllcyhjb2x1bW4uZmlsdGVyVmFsdWVzKS5tYXAoKFtrZXksIHZhbHVlXSkgPT4gKHsgdmFsdWU6IGtleSwgdGV4dDogdmFsdWV9KSk7XG5cbiAgICAgICAgICAgIHRoaXMudGVtcGxhdGVDb250YWluZXIoZGF0YSk7XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLmhlYWRlci5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgdGhpcy5oYW5kbGVDbGljayk7XG4gICAgfVxuXG4gICAgaGFuZGxlQ2xpY2sgPSBhc3luYyAoKSA9PiB7XG4gICAgICAgIGNvbnN0IHN0YXR1cyA9IHRoaXMuaGVhZGVyLmNsYXNzTGlzdC50b2dnbGUoQ3NzSGVscGVyLm11bHRpU2VsZWN0LmhlYWRlckFjdGl2ZSk7XG5cbiAgICAgICAgaWYgKCFzdGF0dXMpIHtcbiAgICAgICAgICAgIGF3YWl0IHRoaXMuY29udGV4dC5ldmVudHMudHJpZ2dlcihcInJlbmRlclwiKTtcbiAgICAgICAgICAgIGRvY3VtZW50LnJlbW92ZUV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCB0aGlzLmhhbmRsZURvY3VtZW50KTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCB0aGlzLmhhbmRsZURvY3VtZW50KTtcbiAgICAgICAgfVxuICAgIH07XG4gICAgLyoqXG4gICAgICogSGFuZGxlciBldmVudCB0byBjbG9zZSBkcm9wZG93biB3aGVuIHVzZXIgY2xpY2tzIG91dHNpZGUgdGhlIG11bHRpLXNlbGVjdCBjb250cm9sLiAgRXZlbnQgaXMgcmVtb3ZlZCB3aGVuIG11bHRpLXNlbGVjdCBcbiAgICAgKiBpcyBub3QgYWN0aXZlIHNvIHRoYXQgaXQncyBub3QgZmlyaW5nIG9uIHJlZHVuZGFudCBldmVudHMuXG4gICAgICogQHBhcmFtIHtPYmplY3R9IGUgT2JqZWN0IHRoYXQgdHJpZ2dlcmVkIGV2ZW50LlxuICAgICAqL1xuICAgIGhhbmRsZURvY3VtZW50ID0gYXN5bmMgKGUpID0+IHtcbiAgICAgICAgaWYgKCFlLnRhcmdldC5jbG9zZXN0KFwiLlwiICsgQ3NzSGVscGVyLm11bHRpU2VsZWN0Lm9wdGlvbikgJiYgIWUudGFyZ2V0LmNsb3Nlc3QoYCMke3RoaXMuaGVhZGVyLmlkfWApKSB7XG4gICAgICAgICAgICB0aGlzLmhlYWRlci5jbGFzc0xpc3QucmVtb3ZlKENzc0hlbHBlci5tdWx0aVNlbGVjdC5oZWFkZXJBY3RpdmUpO1xuXG4gICAgICAgICAgICBhd2FpdCB0aGlzLmNvbnRleHQuZXZlbnRzLnRyaWdnZXIoXCJyZW5kZXJcIik7XG5cbiAgICAgICAgICAgIGRvY3VtZW50LnJlbW92ZUV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCB0aGlzLmhhbmRsZURvY3VtZW50KTtcbiAgICAgICAgfVxuICAgIH07XG4gICAgLyoqXG4gICAgICogQ3JlYXRlcyBhIGNvdW50IGxhYmVsIHRoYXQgZGlzcGxheXMgdGhlIG51bWJlciBvZiBzZWxlY3RlZCBpdGVtcyBpbiB0aGUgbXVsdGktc2VsZWN0IGNvbnRyb2wuXG4gICAgICovXG4gICAgY3JlYXRlQ291bnRMYWJlbCA9ICgpID0+IHtcbiAgICAgICAgLy91cGRhdGUgY291bnQgbGFiZWwuXG4gICAgICAgIGlmICh0aGlzLmNvdW50TGFiZWwgPT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgdGhpcy5jb3VudExhYmVsID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcInNwYW5cIik7XG4gICAgICAgICAgICB0aGlzLmNvdW50TGFiZWwuY2xhc3NOYW1lID0gQ3NzSGVscGVyLm11bHRpU2VsZWN0LmhlYWRlck9wdGlvbjtcbiAgICAgICAgICAgIHRoaXMuaGVhZGVyLmFwcGVuZCh0aGlzLmNvdW50TGFiZWwpO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHRoaXMuc2VsZWN0ZWRWYWx1ZXMubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgdGhpcy5jb3VudExhYmVsLmlubmVyVGV4dCA9IGAke3RoaXMuc2VsZWN0ZWRWYWx1ZXMubGVuZ3RofSBzZWxlY3RlZGA7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB0aGlzLmNvdW50TGFiZWwucmVtb3ZlKCk7XG4gICAgICAgICAgICB0aGlzLmNvdW50TGFiZWwgPSB1bmRlZmluZWQ7XG4gICAgICAgIH1cbiAgICB9O1xuICAgIC8qKlxuICAgICAqIEhhbmRsZSBjbGljayBldmVudCBmb3IgZWFjaCBvcHRpb24gaW4gdGhlIG11bHRpLXNlbGVjdCBjb250cm9sLiAgVG9nZ2xlcyB0aGUgc2VsZWN0ZWQgc3RhdGUgb2YgdGhlIG9wdGlvbiBhbmQgdXBkYXRlcyB0aGUgXG4gICAgICogaGVhZGVyIGlmIGBsaXN0QWxsYCBpcyBgdHJ1ZWAuXG4gICAgICogQHBhcmFtIHtPYmplY3R9IG8gT2JqZWN0IHRoYXQgdHJpZ2dlcmVkIHRoZSBldmVudC5cbiAgICAgKi9cbiAgICBoYW5kbGVPcHRpb24gPSAobykgPT4ge1xuICAgICAgICBpZiAoIW8uY3VycmVudFRhcmdldC5jbGFzc0xpc3QuY29udGFpbnMoQ3NzSGVscGVyLm11bHRpU2VsZWN0LnNlbGVjdGVkKSkge1xuICAgICAgICAgICAgLy9zZWxlY3QgaXRlbS5cbiAgICAgICAgICAgIG8uY3VycmVudFRhcmdldC5jbGFzc0xpc3QuYWRkKENzc0hlbHBlci5tdWx0aVNlbGVjdC5zZWxlY3RlZCk7XG4gICAgICAgICAgICBvLmN1cnJlbnRUYXJnZXQuZGF0YXNldC5zZWxlY3RlZCA9IFwidHJ1ZVwiO1xuICAgICAgICAgICAgXG4gICAgICAgICAgICB0aGlzLnNlbGVjdGVkVmFsdWVzLnB1c2goby5jdXJyZW50VGFyZ2V0LmRhdGFzZXQudmFsdWUpO1xuXG4gICAgICAgICAgICBpZiAodGhpcy5saXN0QWxsKSB7XG4gICAgICAgICAgICAgICAgY29uc3Qgc3BhbiA9IEVsZW1lbnRIZWxwZXIuc3Bhbih7IGNsYXNzTmFtZTogQ3NzSGVscGVyLm11bHRpU2VsZWN0LmhlYWRlck9wdGlvbiwgaW5uZXJUZXh0OiBvLmN1cnJlbnRUYXJnZXQuZGF0YXNldC52YWx1ZSB9LCB7IHZhbHVlOiBvLmN1cnJlbnRUYXJnZXQuZGF0YXNldC52YWx1ZSB9KTtcbiAgICAgICAgICAgICAgICB0aGlzLmhlYWRlci5hcHBlbmQoc3Bhbik7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAvL2Rlc2VsZWN0IGl0ZW0uXG4gICAgICAgICAgICBvLmN1cnJlbnRUYXJnZXQuY2xhc3NMaXN0LnJlbW92ZShDc3NIZWxwZXIubXVsdGlTZWxlY3Quc2VsZWN0ZWQpO1xuICAgICAgICAgICAgby5jdXJyZW50VGFyZ2V0LmRhdGFzZXQuc2VsZWN0ZWQgPSBcImZhbHNlXCI7XG5cbiAgICAgICAgICAgIHRoaXMuc2VsZWN0ZWRWYWx1ZXMgPSB0aGlzLnNlbGVjdGVkVmFsdWVzLmZpbHRlcihmID0+IGYgIT09IG8uY3VycmVudFRhcmdldC5kYXRhc2V0LnZhbHVlKTtcblxuICAgICAgICAgICAgaWYgKHRoaXMubGlzdEFsbCkge1xuICAgICAgICAgICAgICAgIGNvbnN0IGl0ZW0gPSB0aGlzLmhlYWRlci5xdWVyeVNlbGVjdG9yKGBbZGF0YS12YWx1ZT0nJHtvLmN1cnJlbnRUYXJnZXQuZGF0YXNldC52YWx1ZX0nXWApO1xuXG4gICAgICAgICAgICAgICAgaWYgKGl0ZW0gIT09IG51bGwpIHtcbiAgICAgICAgICAgICAgICAgICAgaXRlbS5yZW1vdmUoKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBpZiAodGhpcy5saXN0QWxsID09PSBmYWxzZSkge1xuICAgICAgICAgICAgdGhpcy5jcmVhdGVDb3VudExhYmVsKCk7XG4gICAgICAgIH1cbiAgICB9O1xuICAgIC8qKlxuICAgICAqIEhlbHBlciBmdW5jdGlvbiB0byBjcmVhdGUgYW4gb3B0aW9uIGVsZW1lbnQgZm9yIHRoZSBtdWx0aS1zZWxlY3QgY29udHJvbC5cbiAgICAgKiBAcGFyYW0ge09iamVjdH0gaXRlbSBrZXkvdmFsdWUgcGFpciBvYmplY3QgdGhhdCBjb250YWlucyB0aGUgdmFsdWUgYW5kIHRleHQgZm9yIHRoZSBvcHRpb24uXG4gICAgICogQHJldHVybnMge0hUTUxEaXZFbGVtZW50fSBSZXR1cm5zIGEgZGl2IGVsZW1lbnQgdGhhdCByZXByZXNlbnRzIHRoZSBvcHRpb24gaW4gdGhlIG11bHRpLXNlbGVjdCBjb250cm9sLlxuICAgICAqL1xuICAgIGNyZWF0ZU9wdGlvbihpdGVtKSB7IFxuICAgICAgICBjb25zdCBvcHRpb24gPSBFbGVtZW50SGVscGVyLmRpdih7IGNsYXNzTmFtZTogQ3NzSGVscGVyLm11bHRpU2VsZWN0Lm9wdGlvbiB9LCB7IHZhbHVlOiBpdGVtLnZhbHVlLCBzZWxlY3RlZDogXCJmYWxzZVwiIH0pO1xuICAgICAgICBjb25zdCByYWRpbyA9IEVsZW1lbnRIZWxwZXIuc3Bhbih7IGNsYXNzTmFtZTogQ3NzSGVscGVyLm11bHRpU2VsZWN0Lm9wdGlvblJhZGlvIH0pO1xuICAgICAgICBjb25zdCB0ZXh0ID0gRWxlbWVudEhlbHBlci5zcGFuKHsgY2xhc3NOYW1lOiBDc3NIZWxwZXIubXVsdGlTZWxlY3Qub3B0aW9uVGV4dCwgaW5uZXJIVE1MOiBpdGVtLnRleHQgfSk7XG5cbiAgICAgICAgb3B0aW9uLmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCB0aGlzLmhhbmRsZU9wdGlvbik7XG4gICAgICAgIG9wdGlvbi5hcHBlbmQocmFkaW8sIHRleHQpO1xuXG4gICAgICAgIHJldHVybiBvcHRpb247XG4gICAgfVxuXG4gICAgdGVtcGxhdGVDb250YWluZXIgPSAoZGF0YSkgPT4ge1xuICAgICAgICBmb3IgKGNvbnN0IGl0ZW0gb2YgZGF0YSkge1xuICAgICAgICAgICAgY29uc3Qgb3B0aW9uID0gdGhpcy5jcmVhdGVPcHRpb24oaXRlbSk7XG4gICAgICAgICAgICB0aGlzLm9wdGlvbnNDb250YWluZXIuYXBwZW5kKG9wdGlvbik7XG4gICAgICAgIH1cbiAgICB9O1xuICAgIC8qKlxuICAgICAqIENhbGxlZCB3aGVuIHRoZSBncmlkIHBpcGVsaW5lJ3MgYHJlZnJlc2hgIGV2ZW50IGlzIHRyaWdnZXJlZC4gIEl0IGNsZWFycyB0aGUgY3VycmVudCBvcHRpb25zIGFuZFxuICAgICAqIHJlY3JlYXRlcyB0aGVtIGJhc2VkIG9uIHRoZSBkYXRhIHByb3ZpZGVkLiAgSXQgYWxzbyB1cGRhdGVzIHRoZSBzZWxlY3RlZCB2YWx1ZXMgYmFzZWQgb24gdGhlIGN1cnJlbnQgc3RhdGUgb2YgdGhlIG9wdGlvbnMuXG4gICAgICogQHBhcmFtIHtBcnJheX0gZGF0YSBBcnJheSBvZiBvYmplY3RzIHRoYXQgcmVwcmVzZW50IHRoZSBvcHRpb25zIHRvIGJlIGRpc3BsYXllZCBpbiB0aGUgbXVsdGktc2VsZWN0IGNvbnRyb2wuXG4gICAgICovXG4gICAgcmVmcmVzaFNlbGVjdE9wdGlvbnMgPSAoZGF0YSkgPT4ge1xuICAgICAgICB0aGlzLm9wdGlvbnNDb250YWluZXIucmVwbGFjZUNoaWxkcmVuKCk7XG4gICAgICAgIHRoaXMuaGVhZGVyLnJlcGxhY2VDaGlsZHJlbigpO1xuICAgICAgICB0aGlzLmNvdW50TGFiZWwgPSB1bmRlZmluZWQ7ICAvL3NldCB0byB1bmRlZmluZWQgc28gaXQgY2FuIGJlIHJlY3JlYXRlZCBsYXRlci5cbiAgICAgICAgY29uc3QgbmV3U2VsZWN0ZWQgPSBbXTtcblxuICAgICAgICBmb3IgKGNvbnN0IGl0ZW0gb2YgZGF0YSkge1xuICAgICAgICAgICAgY29uc3Qgb3B0aW9uID0gdGhpcy5jcmVhdGVPcHRpb24oaXRlbSk7XG4gICAgICAgICAgICAvL2NoZWNrIGlmIGl0ZW0gaXMgc2VsZWN0ZWQuXG4gICAgICAgICAgICBpZiAodGhpcy5zZWxlY3RlZFZhbHVlcy5pbmNsdWRlcyhpdGVtLnZhbHVlKSkge1xuICAgICAgICAgICAgICAgIC8vc2VsZWN0IGl0ZW0uXG4gICAgICAgICAgICAgICAgb3B0aW9uLmNsYXNzTGlzdC5hZGQoQ3NzSGVscGVyLm11bHRpU2VsZWN0LnNlbGVjdGVkKTtcbiAgICAgICAgICAgICAgICBvcHRpb24uZGF0YXNldC5zZWxlY3RlZCA9IFwidHJ1ZVwiO1xuICAgICAgICAgICAgICAgIG5ld1NlbGVjdGVkLnB1c2goaXRlbS52YWx1ZSk7XG5cbiAgICAgICAgICAgICAgICBpZiAodGhpcy5saXN0QWxsKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHNwYW4gPSBFbGVtZW50SGVscGVyLnNwYW4oeyBjbGFzc05hbWU6IENzc0hlbHBlci5tdWx0aVNlbGVjdC5oZWFkZXJPcHRpb24sIGlubmVyVGV4dDogaXRlbS52YWx1ZSB9LCB7IHZhbHVlOiBpdGVtLnZhbHVlIH0pO1xuICAgICAgICAgICAgICAgICAgICB0aGlzLmhlYWRlci5hcHBlbmQoc3Bhbik7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICB0aGlzLm9wdGlvbnNDb250YWluZXIuYXBwZW5kKG9wdGlvbik7XG4gICAgICAgIH1cbiAgICAgICAgLy9zZXQgbmV3IHNlbGVjdGVkIHZhbHVlcyBhcyBpdGVtcyBtYXkgaGF2ZSBiZWVuIHJlbW92ZWQgb24gcmVmcmVzaC5cbiAgICAgICAgdGhpcy5zZWxlY3RlZFZhbHVlcyA9IG5ld1NlbGVjdGVkO1xuXG4gICAgICAgIGlmICh0aGlzLmxpc3RBbGwgPT09IGZhbHNlKSB7XG4gICAgICAgICAgICB0aGlzLmNyZWF0ZUNvdW50TGFiZWwoKTtcbiAgICAgICAgfVxuICAgIH07XG5cbiAgICBnZXQgdmFsdWUoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLnNlbGVjdGVkVmFsdWVzO1xuICAgIH1cbn1cblxuZXhwb3J0IHsgRWxlbWVudE11bHRpU2VsZWN0IH07IiwiaW1wb3J0IHsgRWxlbWVudEhlbHBlciB9IGZyb20gXCIuLi8uLi8uLi9jb21wb25lbnRzL2hlbHBlcnMvZWxlbWVudEhlbHBlci5qc1wiO1xuLyoqXG4gKiBSZXByZXNlbnRzIGEgY29sdW1ucyBmaWx0ZXIgY29udHJvbC4gIENyZWF0ZXMgYSBgSFRNTFNlbGVjdEVsZW1lbnRgIHRoYXQgaXMgYWRkZWQgdG8gdGhlIGhlYWRlciByb3cgb2YgdGhlIGdyaWQgdG8gZmlsdGVyIGRhdGEgXG4gKiBzcGVjaWZpYyB0byBpdHMgZGVmaW5lZCBjb2x1bW4uICBJZiBgZmlsdGVyVmFsdWVzUmVtb3RlU291cmNlYCBpcyBkZWZpbmVkLCB0aGUgc2VsZWN0IG9wdGlvbnMgd2lsbCBiZSBwb3B1bGF0ZWQgYnkgdGhlIGRhdGEgcmV0dXJuZWQgXG4gKiBmcm9tIHRoZSByZW1vdGUgc291cmNlIGJ5IHJlZ2lzdGVyaW5nIHRvIHRoZSBncmlkIHBpcGVsaW5lJ3MgYGluaXRgIGFuZCBgcmVmcmVzaGAgZXZlbnRzLlxuICovXG5jbGFzcyBFbGVtZW50U2VsZWN0IHtcbiAgICAvKipcbiAgICAgKiBDcmVhdGUgZmlsdGVyIG9iamVjdCB0aGF0IHJlcHJlc2VudHMgYSBgSFRNTFNlbGVjdEVsZW1lbnRgIGVsZW1lbnQgaW4gdGhlIHRhYmxlJ3MgaGVhZGVyIHJvdy5cbiAgICAgKiBAcGFyYW0ge0NvbHVtbn0gY29sdW1uIENvbHVtbiBjbGFzcyBvYmplY3QuXG4gICAgICogQHBhcmFtIHtHcmlkQ29udGV4dH0gY29udGV4dCBHcmlkIGNvbnRleHQuIFxuICAgICAqL1xuICAgIGNvbnN0cnVjdG9yKGNvbHVtbiwgY29udGV4dCkge1xuICAgICAgICB0aGlzLmVsZW1lbnQgPSBFbGVtZW50SGVscGVyLmNyZWF0ZShcInNlbGVjdFwiLCB7IG5hbWU6IGNvbHVtbi5maWVsZCB9KTtcbiAgICAgICAgdGhpcy5maWVsZCA9IGNvbHVtbi5maWVsZDtcbiAgICAgICAgdGhpcy5maWVsZFR5cGUgPSBjb2x1bW4udHlwZTsgIC8vZmllbGQgdmFsdWUgdHlwZS5cbiAgICAgICAgdGhpcy5maWx0ZXJUeXBlID0gY29sdW1uLmZpbHRlclR5cGU7ICAvL2NvbmRpdGlvbiB0eXBlLlxuICAgICAgICB0aGlzLmZpbHRlcklzRnVuY3Rpb24gPSAodHlwZW9mIGNvbHVtbj8uZmlsdGVyVHlwZSA9PT0gXCJmdW5jdGlvblwiKTtcbiAgICAgICAgdGhpcy5maWx0ZXJQYXJhbXMgPSBjb2x1bW4uZmlsdGVyUGFyYW1zO1xuICAgICAgICB0aGlzLnBpcGVsaW5lID0gY29udGV4dC5waXBlbGluZTtcbiAgICAgICAgdGhpcy5jb250ZXh0ID0gY29udGV4dDtcblxuICAgICAgICB0aGlzLmVsZW1lbnQuaWQgPSBgJHtjb2x1bW4uc2V0dGluZ3MuYmFzZUlkTmFtZX1fJHt0aGlzLmZpZWxkfWA7XG4gICAgICAgIHRoaXMuZWxlbWVudC5hZGRFdmVudExpc3RlbmVyKFwiY2hhbmdlXCIsIGFzeW5jICgpID0+IGF3YWl0IHRoaXMuY29udGV4dC5ldmVudHMudHJpZ2dlcihcInJlbmRlclwiKSk7XG5cbiAgICAgICAgaWYgKGNvbHVtbi5maWx0ZXJDc3MpIHtcbiAgICAgICAgICAgIHRoaXMuZWxlbWVudC5jbGFzc05hbWUgPSBjb2x1bW4uZmlsdGVyQ3NzO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKGNvbHVtbi5maWx0ZXJWYWx1ZXNSZW1vdGVTb3VyY2UpIHtcbiAgICAgICAgICAgIC8vc2V0IHVwIHBpcGVsaW5lIHRvIHJldHJpZXZlIG9wdGlvbiBkYXRhIHdoZW4gaW5pdCBwaXBlbGluZSBpcyBjYWxsZWQuXG4gICAgICAgICAgICB0aGlzLnBpcGVsaW5lLmFkZFN0ZXAoXCJpbml0XCIsIHRoaXMuY3JlYXRlU2VsZWN0T3B0aW9ucywgY29sdW1uLmZpbHRlclZhbHVlc1JlbW90ZVNvdXJjZSk7XG4gICAgICAgICAgICB0aGlzLnBpcGVsaW5lLmFkZFN0ZXAoXCJyZWZyZXNoXCIsIHRoaXMucmVmcmVzaFNlbGVjdE9wdGlvbnMsIGNvbHVtbi5maWx0ZXJWYWx1ZXNSZW1vdGVTb3VyY2UpO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9IFxuICAgICAgICAvL3VzZSB1c2VyIHN1cHBsaWVkIHZhbHVlcyB0byBjcmVhdGUgc2VsZWN0IG9wdGlvbnMuXG4gICAgICAgIGNvbnN0IG9wdHMgPSBBcnJheS5pc0FycmF5KGNvbHVtbi5maWx0ZXJWYWx1ZXMpIFxuICAgICAgICAgICAgPyBjb2x1bW4uZmlsdGVyVmFsdWVzXG4gICAgICAgICAgICA6IE9iamVjdC5lbnRyaWVzKGNvbHVtbi5maWx0ZXJWYWx1ZXMpLm1hcCgoW2tleSwgdmFsdWVdKSA9PiAoeyB2YWx1ZToga2V5LCB0ZXh0OiB2YWx1ZX0pKTtcblxuICAgICAgICB0aGlzLmNyZWF0ZVNlbGVjdE9wdGlvbnMob3B0cyk7XG4gICAgfVxuICAgIC8qKlxuICAgICAqIEJ1aWxkcyBvcHRpb24gZWxlbWVudHMgZm9yIGNsYXNzJ3MgYHNlbGVjdGAgaW5wdXQuICBFeHBlY3RzIGFuIGFycmF5IG9mIG9iamVjdHMgd2l0aCBrZXkvdmFsdWUgcGFpcnMgb2Y6XG4gICAgICogICogYHZhbHVlYDogb3B0aW9uIHZhbHVlLiAgc2hvdWxkIGJlIGEgcHJpbWFyeSBrZXkgdHlwZSB2YWx1ZSB3aXRoIG5vIGJsYW5rIHNwYWNlcy5cbiAgICAgKiAgKiBgdGV4dGA6IG9wdGlvbiB0ZXh0IHZhbHVlXG4gICAgICogQHBhcmFtIHtBcnJheTxvYmplY3Q+fSBkYXRhIGtleS92YWx1ZSBhcnJheSBvZiB2YWx1ZXMuXG4gICAgICovXG4gICAgY3JlYXRlU2VsZWN0T3B0aW9ucyA9IChkYXRhKSA9PiB7XG4gICAgICAgIGNvbnN0IGZpcnN0ID0gRWxlbWVudEhlbHBlci5jcmVhdGUoXCJvcHRpb25cIiwgeyB2YWx1ZTogXCJcIiwgdGV4dDogXCJTZWxlY3QgYWxsXCIgfSk7XG5cbiAgICAgICAgdGhpcy5lbGVtZW50LmFwcGVuZChmaXJzdCk7XG5cbiAgICAgICAgZm9yIChjb25zdCBpdGVtIG9mIGRhdGEpIHtcbiAgICAgICAgICAgIGNvbnN0IG9wdGlvbiA9IEVsZW1lbnRIZWxwZXIuY3JlYXRlKFwib3B0aW9uXCIsIHsgdmFsdWU6IGl0ZW0udmFsdWUsIHRleHQ6IGl0ZW0udGV4dCB9KTtcblxuICAgICAgICAgICAgdGhpcy5lbGVtZW50LmFwcGVuZChvcHRpb24pO1xuICAgICAgICB9XG4gICAgfTtcbiAgICAvKipcbiAgICAgKiBSZXBsYWNlcy91cGRhdGVzIG9wdGlvbiBlbGVtZW50cyBmb3IgY2xhc3MncyBgc2VsZWN0YCBpbnB1dC4gIFdpbGwgcGVyc2lzdCB0aGUgY3VycmVudCBzZWxlY3QgdmFsdWUsIGlmIGFueS4gIFxuICAgICAqIEV4cGVjdHMgYW4gYXJyYXkgb2Ygb2JqZWN0cyB3aXRoIGtleS92YWx1ZSBwYWlycyBvZjpcbiAgICAgKiAgKiBgdmFsdWVgOiBPcHRpb24gdmFsdWUuICBTaG91bGQgYmUgYSBwcmltYXJ5IGtleSB0eXBlIHZhbHVlIHdpdGggbm8gYmxhbmsgc3BhY2VzLlxuICAgICAqICAqIGB0ZXh0YDogT3B0aW9uIHRleHQuXG4gICAgICogQHBhcmFtIHtBcnJheTxvYmplY3Q+fSBkYXRhIGtleS92YWx1ZSBhcnJheSBvZiB2YWx1ZXMuXG4gICAgICovXG4gICAgcmVmcmVzaFNlbGVjdE9wdGlvbnMgPSAoZGF0YSkgPT4ge1xuICAgICAgICBjb25zdCBzZWxlY3RlZFZhbHVlID0gdGhpcy5lbGVtZW50LnZhbHVlO1xuXG4gICAgICAgIHRoaXMuZWxlbWVudC5yZXBsYWNlQ2hpbGRyZW4oKTtcbiAgICAgICAgdGhpcy5jcmVhdGVTZWxlY3RPcHRpb25zKGRhdGEpO1xuICAgICAgICB0aGlzLmVsZW1lbnQudmFsdWUgPSBzZWxlY3RlZFZhbHVlO1xuICAgIH07XG5cbiAgICBnZXQgdmFsdWUoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmVsZW1lbnQudmFsdWU7XG4gICAgfVxufVxuXG5leHBvcnQgeyBFbGVtZW50U2VsZWN0IH07IiwiaW1wb3J0IHsgRGF0ZUhlbHBlciB9IGZyb20gXCIuLi8uLi9jb21wb25lbnRzL2hlbHBlcnMvZGF0ZUhlbHBlci5qc1wiO1xuaW1wb3J0IHsgRmlsdGVyVGFyZ2V0IH0gZnJvbSBcIi4vdHlwZXMvZmlsdGVyVGFyZ2V0LmpzXCI7XG5pbXBvcnQgeyBGaWx0ZXJEYXRlIH0gZnJvbSBcIi4vdHlwZXMvZmlsdGVyRGF0ZS5qc1wiO1xuaW1wb3J0IHsgRmlsdGVyRnVuY3Rpb24gfSBmcm9tIFwiLi90eXBlcy9maWx0ZXJGdW5jdGlvbi5qc1wiO1xuaW1wb3J0IHsgRWxlbWVudEJldHdlZW4gfSBmcm9tIFwiLi9lbGVtZW50cy9lbGVtZW50QmV0d2Vlbi5qc1wiO1xuaW1wb3J0IHsgRWxlbWVudElucHV0IH0gZnJvbSBcIi4vZWxlbWVudHMvZWxlbWVudElucHV0LmpzXCI7XG5pbXBvcnQgeyBFbGVtZW50TXVsdGlTZWxlY3QgfSBmcm9tIFwiLi9lbGVtZW50cy9lbGVtZW50TXVsdGlTZWxlY3QuanNcIjtcbmltcG9ydCB7IEVsZW1lbnRTZWxlY3QgfSBmcm9tIFwiLi9lbGVtZW50cy9lbGVtZW50U2VsZWN0LmpzXCI7XG4vKipcbiAqIFByb3ZpZGVzIGEgbWVhbnMgdG8gZmlsdGVyIGRhdGEgaW4gdGhlIGdyaWQuICBUaGlzIG1vZHVsZSBjcmVhdGVzIGhlYWRlciBmaWx0ZXIgY29udHJvbHMgZm9yIGVhY2ggY29sdW1uIHRoYXQgaGFzIFxuICogYSBgaGFzRmlsdGVyYCBhdHRyaWJ1dGUgc2V0IHRvIGB0cnVlYC5cbiAqIFxuICogQ2xhc3Mgc3Vic2NyaWJlcyB0byB0aGUgYHJlbmRlcmAgZXZlbnQgdG8gdXBkYXRlIHRoZSBmaWx0ZXIgY29udHJvbCB3aGVuIHRoZSBncmlkIGlzIHJlbmRlcmVkLiAgSXQgYWxzbyBjYWxscyB0aGUgY2hhaW4gXG4gKiBldmVudCBgcmVtb3RlUGFyYW1zYCB0byBjb21waWxlIGEgbGlzdCBvZiBwYXJhbWV0ZXJzIHRvIGJlIHBhc3NlZCB0byB0aGUgcmVtb3RlIGRhdGEgc291cmNlIHdoZW4gdXNpbmcgcmVtb3RlIHByb2Nlc3NpbmcuXG4gKi9cbmNsYXNzIEZpbHRlck1vZHVsZSB7XG4gICAgLyoqXG4gICAgICogQ3JlYXRlcyBhIG5ldyBmaWx0ZXIgbW9kdWxlIG9iamVjdC5cbiAgICAgKiBAcGFyYW0ge0dyaWRDb250ZXh0fSBjb250ZXh0IEdyaWQgY29udGV4dC5cbiAgICAgKi9cbiAgICBjb25zdHJ1Y3Rvcihjb250ZXh0KSB7XG4gICAgICAgIHRoaXMuY29udGV4dCA9IGNvbnRleHQ7XG4gICAgICAgIHRoaXMuaGVhZGVyRmlsdGVycyA9IFtdO1xuICAgICAgICB0aGlzLmdyaWRGaWx0ZXJzID0gW107XG4gICAgfVxuXG4gICAgaW5pdGlhbGl6ZSgpIHtcbiAgICAgICAgaWYgKHRoaXMuY29udGV4dC5zZXR0aW5ncy5yZW1vdGVQcm9jZXNzaW5nKSB7XG4gICAgICAgICAgICB0aGlzLmNvbnRleHQuZXZlbnRzLnN1YnNjcmliZShcInJlbW90ZVBhcmFtc1wiLCB0aGlzLnJlbW90ZVBhcmFtcywgdHJ1ZSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB0aGlzLmNvbnRleHQuZXZlbnRzLnN1YnNjcmliZShcInJlbmRlclwiLCB0aGlzLnJlbmRlckxvY2FsLCBmYWxzZSwgOCk7XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLl9pbml0KCk7XG4gICAgfVxuICAgIC8qKlxuICAgICAqIENyZWF0ZSBgSGVhZGVyRmlsdGVyYCBDbGFzcyBmb3IgZ3JpZCBjb2x1bW5zIHdpdGggYSBgaGFzRmlsdGVyYCBhdHRyaWJ1dGUgb2YgYHRydWVgLlxuICAgICAqL1xuICAgIF9pbml0KCkge1xuICAgICAgICBmb3IgKGNvbnN0IGNvbCBvZiB0aGlzLmNvbnRleHQuY29sdW1uTWFuYWdlci5jb2x1bW5zKSB7XG4gICAgICAgICAgICBpZiAoIWNvbC5oYXNGaWx0ZXIpIGNvbnRpbnVlO1xuXG4gICAgICAgICAgICBpZiAoY29sLmZpbHRlckVsZW1lbnQgPT09IFwibXVsdGlcIikge1xuICAgICAgICAgICAgICAgIGNvbC5oZWFkZXJGaWx0ZXIgPSBuZXcgRWxlbWVudE11bHRpU2VsZWN0KGNvbCwgdGhpcy5jb250ZXh0KTtcbiAgICAgICAgICAgIH0gZWxzZSBpZiAoY29sLmZpbHRlckVsZW1lbnQgPT09IFwiYmV0d2VlblwiKSB7XG4gICAgICAgICAgICAgICAgY29sLmhlYWRlckZpbHRlciA9IG5ldyBFbGVtZW50QmV0d2Vlbihjb2wsIHRoaXMuY29udGV4dCk7XG4gICAgICAgICAgICB9IGVsc2UgaWYgKGNvbC5maWx0ZXJFbGVtZW50ID09PSBcInNlbGVjdFwiKSB7XG4gICAgICAgICAgICAgICAgY29sLmhlYWRlckZpbHRlciA9IG5ldyBFbGVtZW50U2VsZWN0KGNvbCwgdGhpcy5jb250ZXh0KTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgY29sLmhlYWRlckZpbHRlciA9IG5ldyBFbGVtZW50SW5wdXQoY29sLCB0aGlzLmNvbnRleHQpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBjb2wuaGVhZGVyQ2VsbC5lbGVtZW50LmFwcGVuZENoaWxkKGNvbC5oZWFkZXJGaWx0ZXIuZWxlbWVudCk7XG4gICAgICAgICAgICB0aGlzLmhlYWRlckZpbHRlcnMucHVzaChjb2wuaGVhZGVyRmlsdGVyKTtcbiAgICAgICAgfVxuICAgIH1cbiAgICAvKipcbiAgICAgKiBDb21waWxlcyBoZWFkZXIgYW5kIGdyaWQgZmlsdGVyIHZhbHVlcyBpbnRvIGEgc2luZ2xlIG9iamVjdCBvZiBrZXkvdmFsdWUgcGFpcnMgdGhhdCBjYW4gYmUgdXNlZCB0byBzZW5kIHRvIHRoZSByZW1vdGUgZGF0YSBzb3VyY2UuXG4gICAgICogQHBhcmFtIHtPYmplY3R9IHBhcmFtcyBPYmplY3Qgb2Yga2V5L3ZhbHVlIHBhaXJzIHRvIGJlIHNlbnQgdG8gdGhlIHJlbW90ZSBkYXRhIHNvdXJjZS5cbiAgICAgKiBAcmV0dXJucyB7T2JqZWN0fSBSZXR1cm5zIHRoZSBtb2RpZmllZCBwYXJhbXMgb2JqZWN0IHdpdGggZmlsdGVyIHZhbHVlcyBhZGRlZC5cbiAgICAgKi9cbiAgICByZW1vdGVQYXJhbXMgPSAocGFyYW1zKSA9PiB7XG4gICAgICAgIHRoaXMuaGVhZGVyRmlsdGVycy5mb3JFYWNoKChmKSA9PiB7XG4gICAgICAgICAgICBpZiAoZi52YWx1ZSAhPT0gXCJcIikge1xuICAgICAgICAgICAgICAgIHBhcmFtc1tmLmZpZWxkXSA9IGYudmFsdWU7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuXG4gICAgICAgIGlmICh0aGlzLmdyaWRGaWx0ZXJzLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgIGZvciAoY29uc3QgaXRlbSBvZiB0aGlzLmdyaWRGaWx0ZXJzKSB7XG4gICAgICAgICAgICAgICAgcGFyYW1zW2l0ZW0uZmllbGRdID0gaXRlbS52YWx1ZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBwYXJhbXM7XG4gICAgfTtcbiAgICAvKipcbiAgICAgKiBDb252ZXJ0IHZhbHVlIHR5cGUgdG8gY29sdW1uIHR5cGUuICBJZiB2YWx1ZSBjYW5ub3QgYmUgY29udmVydGVkLCBgbnVsbGAgaXMgcmV0dXJuZWQuXG4gICAgICogQHBhcmFtIHtvYmplY3QgfCBzdHJpbmcgfCBudW1iZXJ9IHZhbHVlIFJhdyBmaWx0ZXIgdmFsdWUuXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IHR5cGUgRmllbGQgdHlwZS5cbiAgICAgKiBAcmV0dXJucyB7bnVtYmVyIHwgRGF0ZSB8IHN0cmluZyB8IG51bGwgfCBPYmplY3R9IGlucHV0IHZhbHVlIG9yIGBudWxsYCBpZiBlbXB0eS5cbiAgICAgKi9cbiAgICBjb252ZXJ0VG9UeXBlKHZhbHVlLCB0eXBlKSB7XG4gICAgICAgIGlmICh2YWx1ZSA9PT0gXCJcIiB8fCB2YWx1ZSA9PT0gbnVsbCkgcmV0dXJuIHZhbHVlO1xuXG4gICAgICAgIGlmIChBcnJheS5pc0FycmF5KHZhbHVlKSkge1xuICAgICAgICAgICAgaWYgKHR5cGUgPT09IFwiZGF0ZVwiIHx8IHR5cGUgPT09IFwiZGF0ZXRpbWVcIikgIHsgXG4gICAgICAgICAgICAgICAgY29uc3QgcmVzdWx0ID0gdmFsdWUubWFwKCh2KSA9PiBEYXRlSGVscGVyLnBhcnNlRGF0ZSh2KSk7IFxuXG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc3VsdC5pbmNsdWRlcyhcIlwiKSA/IG51bGwgOiByZXN1bHQ7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmICh0eXBlID09PSBcIm51bWJlclwiKSB7XG4gICAgICAgICAgICAgICAgY29uc3QgdmFsdWUxID0gdGhpcy5jb252ZXJ0VG9UeXBlKHZhbHVlWzBdLCB0eXBlKTtcbiAgICAgICAgICAgICAgICBjb25zdCB2YWx1ZTIgPSB0aGlzLmNvbnZlcnRUb1R5cGUodmFsdWVbMV0sIHR5cGUpOyAgXG5cbiAgICAgICAgICAgICAgICByZXR1cm4gdmFsdWUxID09PSBudWxsIHx8IHZhbHVlMiA9PT0gbnVsbCA/IG51bGwgOiBbdmFsdWUxLCB2YWx1ZTJdO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICByZXR1cm4gdmFsdWU7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAodHlwZSA9PT0gXCJudW1iZXJcIikge1xuICAgICAgICAgICAgdmFsdWUgPSBOdW1iZXIodmFsdWUpO1xuICAgICAgICAgICAgcmV0dXJuIE51bWJlci5pc05hTih2YWx1ZSkgPyBudWxsIDogdmFsdWU7XG4gICAgICAgIH0gXG4gICAgICAgIFxuICAgICAgICBpZiAodHlwZSA9PT0gXCJkYXRlXCIgfHwgdHlwZSA9PT0gXCJkYXRldGltZVwiKSB7XG4gICAgICAgICAgICB2YWx1ZSA9IERhdGVIZWxwZXIucGFyc2VEYXRlT25seSh2YWx1ZSk7XG4gICAgICAgICAgICByZXR1cm4gdmFsdWUgPT09IFwiXCIgPyBudWxsIDogdmFsdWU7XG4gICAgICAgIH0gXG4gICAgICAgIC8vYXNzdW1pbmcgaXQncyBhIHN0cmluZyB2YWx1ZSBvciBPYmplY3QgYXQgdGhpcyBwb2ludC5cbiAgICAgICAgcmV0dXJuIHZhbHVlO1xuICAgIH1cbiAgICAvKipcbiAgICAgKiBXcmFwcyB0aGUgZmlsdGVyIGlucHV0IHZhbHVlIGluIGEgYEZpbHRlclRhcmdldGAgb2JqZWN0LCB3aGljaCBkZWZpbmVzIGEgc2luZ2xlIGZpbHRlciBjb25kaXRpb24gZm9yIGEgY29sdW1uLlxuICAgICAqIEBwYXJhbSB7c3RyaW5nIHwgRGF0ZSB8IG51bWJlciB8IE9iamVjdH0gdmFsdWUgRmlsdGVyIHZhbHVlIHRvIGFwcGx5IHRvIHRoZSBjb2x1bW4uXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IGZpZWxkIFRoZSBmaWVsZCBuYW1lIG9mIHRoZSBjb2x1bW4gYmVpbmcgZmlsdGVyZWQuIFRoaXMgaXMgdXNlZCB0byBpZGVudGlmeSB0aGUgY29sdW1uIGluIHRoZSBkYXRhIHNldC5cbiAgICAgKiBAcGFyYW0ge3N0cmluZyB8IEZ1bmN0aW9ufSBmaWx0ZXJUeXBlIFRoZSB0eXBlIG9mIGZpbHRlciB0byBhcHBseSAoZS5nLiwgXCJlcXVhbHNcIiwgXCJsaWtlXCIsIFwiPFwiLCBcIjw9XCIsIFwiPlwiLCBcIj49XCIsIFwiIT1cIiwgXCJiZXR3ZWVuXCIsIFwiaW5cIikuXG4gICAgICogQ2FuIGFsc28gYmUgYSBmdW5jdGlvbi5cbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gZmllbGRUeXBlIFRoZSB0eXBlIG9mIGZpZWxkIGJlaW5nIGZpbHRlcmVkIChlLmcuLCBcInN0cmluZ1wiLCBcIm51bWJlclwiLCBcImRhdGVcIiwgXCJvYmplY3RcIikuXG4gICAgICogQHBhcmFtIHtib29sZWFufSBmaWx0ZXJJc0Z1bmN0aW9uIEluZGljYXRlcyBpZiB0aGUgZmlsdGVyIHR5cGUgaXMgYSBmdW5jdGlvbi5cbiAgICAgKiBAcGFyYW0ge09iamVjdH0gZmlsdGVyUGFyYW1zIE9wdGlvbmFsIHBhcmFtZXRlcnMgdG8gcGFzcyB0byB0aGUgZmlsdGVyIGZ1bmN0aW9uLlxuICAgICAqIEByZXR1cm5zIHtGaWx0ZXJUYXJnZXQgfCBGaWx0ZXJEYXRlIHwgRmlsdGVyRnVuY3Rpb24gfCBudWxsfSBSZXR1cm5zIGEgZmlsdGVyIHRhcmdldCBvYmplY3QgdGhhdCBkZWZpbmVzIGEgc2luZ2xlIGZpbHRlciBjb25kaXRpb24gZm9yIGEgY29sdW1uLCBcbiAgICAgKiBvciBudWxsIGlmIHRoZSB2YWx1ZSBjYW5ub3QgYmUgY29udmVydGVkIHRvIHRoZSBmaWVsZCB0eXBlLiBcbiAgICAgKi9cbiAgICBjcmVhdGVGaWx0ZXJUYXJnZXQodmFsdWUsIGZpZWxkLCBmaWx0ZXJUeXBlLCBmaWVsZFR5cGUsIGZpbHRlcklzRnVuY3Rpb24sIGZpbHRlclBhcmFtcykgeyBcbiAgICAgICAgaWYgKGZpbHRlcklzRnVuY3Rpb24pIHsgXG4gICAgICAgICAgICByZXR1cm4gbmV3IEZpbHRlckZ1bmN0aW9uKHsgdmFsdWU6IHZhbHVlLCBmaWVsZDogZmllbGQsIGZpbHRlclR5cGU6IGZpbHRlclR5cGUsIHBhcmFtczogZmlsdGVyUGFyYW1zIH0pO1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc3QgY29udmVydGVkVmFsdWUgPSB0aGlzLmNvbnZlcnRUb1R5cGUodmFsdWUsIGZpZWxkVHlwZSk7XG5cbiAgICAgICAgaWYgKGNvbnZlcnRlZFZhbHVlID09PSBudWxsKSByZXR1cm4gbnVsbDtcblxuICAgICAgICBpZiAoZmllbGRUeXBlID09PSBcImRhdGVcIiB8fCBmaWVsZFR5cGUgPT09IFwiZGF0ZXRpbWVcIikge1xuICAgICAgICAgICAgcmV0dXJuIG5ldyBGaWx0ZXJEYXRlKHsgdmFsdWU6IGNvbnZlcnRlZFZhbHVlLCBmaWVsZDogZmllbGQsIGZpbHRlclR5cGU6IGZpbHRlclR5cGUgfSk7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gbmV3IEZpbHRlclRhcmdldCh7IHZhbHVlOiBjb252ZXJ0ZWRWYWx1ZSwgZmllbGQ6IGZpZWxkLCBmaWVsZFR5cGU6IGZpZWxkVHlwZSwgZmlsdGVyVHlwZTogZmlsdGVyVHlwZSB9KTtcbiAgICB9XG4gICAgLyoqXG4gICAgICogQ29tcGlsZXMgYW4gYXJyYXkgb2YgZmlsdGVyIHR5cGUgb2JqZWN0cyB0aGF0IGNvbnRhaW4gYSBmaWx0ZXIgdmFsdWUgdGhhdCBtYXRjaGVzIGl0cyBjb2x1bW4gdHlwZS4gIENvbHVtbiB0eXBlIG1hdGNoaW5nIFxuICAgICAqIGlzIG5lY2Vzc2FyeSB3aGVuIHByb2Nlc3NpbmcgZGF0YSBsb2NhbGx5LCBzbyB0aGF0IGZpbHRlciB2YWx1ZSBtYXRjaGVzIGFzc29jaWF0ZWQgcm93IHR5cGUgdmFsdWUgZm9yIGNvbXBhcmlzb24uXG4gICAgICogQHJldHVybnMge0FycmF5fSBhcnJheSBvZiBmaWx0ZXIgdHlwZSBvYmplY3RzIHdpdGggdmFsaWQgdmFsdWUuXG4gICAgICovXG4gICAgY29tcGlsZUZpbHRlcnMoKSB7XG4gICAgICAgIGxldCByZXN1bHRzID0gW107XG5cbiAgICAgICAgZm9yIChjb25zdCBpdGVtIG9mIHRoaXMuaGVhZGVyRmlsdGVycykge1xuICAgICAgICAgICAgaWYgKGl0ZW0udmFsdWUgPT09IFwiXCIpIGNvbnRpbnVlO1xuXG4gICAgICAgICAgICBjb25zdCBmaWx0ZXIgPSB0aGlzLmNyZWF0ZUZpbHRlclRhcmdldChpdGVtLnZhbHVlLCBpdGVtLmZpZWxkLCBpdGVtLmZpbHRlclR5cGUsIGl0ZW0uZmllbGRUeXBlLCBpdGVtLmZpbHRlcklzRnVuY3Rpb24sIGl0ZW0/LmZpbHRlclBhcmFtcyk7XG5cbiAgICAgICAgICAgIGlmIChmaWx0ZXIgIT09IG51bGwpIHtcbiAgICAgICAgICAgICAgICByZXN1bHRzLnB1c2goZmlsdGVyKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIGlmICh0aGlzLmdyaWRGaWx0ZXJzLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgIHJlc3VsdHMgPSByZXN1bHRzLmNvbmNhdCh0aGlzLmdyaWRGaWx0ZXJzKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiByZXN1bHRzO1xuICAgIH1cbiAgICAvKipcbiAgICAgKiBVc2UgdGFyZ2V0IGZpbHRlcnMgdG8gY3JlYXRlIGEgbmV3IGRhdGEgc2V0IGluIHRoZSBwZXJzaXN0ZW5jZSBkYXRhIHByb3ZpZGVyLlxuICAgICAqIEBwYXJhbSB7QXJyYXk8RmlsdGVyVGFyZ2V0Pn0gdGFyZ2V0cyBBcnJheSBvZiBGaWx0ZXJUYXJnZXQgb2JqZWN0cy5cbiAgICAgKi9cbiAgICBhcHBseUZpbHRlcnModGFyZ2V0cykge1xuICAgICAgICB0aGlzLmNvbnRleHQucGVyc2lzdGVuY2UuZGF0YSA9IFtdO1xuICAgICAgICB0aGlzLmNvbnRleHQucGVyc2lzdGVuY2UuZGF0YUNhY2hlLmZvckVhY2goKHJvdykgPT4ge1xuICAgICAgICAgICAgbGV0IG1hdGNoID0gdHJ1ZTtcblxuICAgICAgICAgICAgZm9yIChsZXQgaXRlbSBvZiB0YXJnZXRzKSB7XG4gICAgICAgICAgICAgICAgY29uc3Qgcm93VmFsID0gdGhpcy5jb252ZXJ0VG9UeXBlKHJvd1tpdGVtLmZpZWxkXSwgaXRlbS5maWVsZFR5cGUpO1xuICAgICAgICAgICAgICAgIGNvbnN0IHJlc3VsdCA9IGl0ZW0uZXhlY3V0ZShyb3dWYWwsIHJvdyk7XG5cbiAgICAgICAgICAgICAgICBpZiAoIXJlc3VsdCkge1xuICAgICAgICAgICAgICAgICAgICBtYXRjaCA9IGZhbHNlO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKG1hdGNoKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5jb250ZXh0LnBlcnNpc3RlbmNlLmRhdGEucHVzaChyb3cpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICB9XG4gICAgLyoqXG4gICAgICogUmVuZGVycyB0aGUgbG9jYWwgZGF0YSBzZXQgYnkgYXBwbHlpbmcgdGhlIGNvbXBpbGVkIGZpbHRlcnMgdG8gdGhlIHBlcnNpc3RlbmNlIGRhdGEgcHJvdmlkZXIuXG4gICAgICovXG4gICAgcmVuZGVyTG9jYWwgPSAoKSA9PiB7XG4gICAgICAgIGNvbnN0IHRhcmdldHMgPSB0aGlzLmNvbXBpbGVGaWx0ZXJzKCk7XG5cbiAgICAgICAgaWYgKE9iamVjdC5rZXlzKHRhcmdldHMpLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgIHRoaXMuYXBwbHlGaWx0ZXJzKHRhcmdldHMpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdGhpcy5jb250ZXh0LnBlcnNpc3RlbmNlLnJlc3RvcmVEYXRhKCk7XG4gICAgICAgIH1cbiAgICB9O1xuICAgIC8qKlxuICAgICAqIFByb3ZpZGVzIGEgbWVhbnMgdG8gYXBwbHkgYSBjb25kaXRpb24gb3V0c2lkZSB0aGUgaGVhZGVyIGZpbHRlciBjb250cm9scy4gIFdpbGwgYWRkIGNvbmRpdGlvblxuICAgICAqIHRvIGdyaWQncyBgZ3JpZEZpbHRlcnNgIGNvbGxlY3Rpb24sIGFuZCByYWlzZSBgcmVuZGVyYCBldmVudCB0byBmaWx0ZXIgZGF0YSBzZXQuXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IGZpZWxkIGZpZWxkIG5hbWUuXG4gICAgICogQHBhcmFtIHtvYmplY3R9IHZhbHVlIHZhbHVlLlxuICAgICAqIEBwYXJhbSB7c3RyaW5nIHwgRnVuY3Rpb259IHR5cGUgY29uZGl0aW9uIHR5cGUuXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IFtmaWVsZFR5cGU9XCJzdHJpbmdcIl0gZmllbGQgdHlwZS5cbiAgICAgKiBAcGFyYW0ge29iamVjdH0gW2ZpbHRlclBhcmFtcz17fV0gYWRkaXRpb25hbCBmaWx0ZXIgcGFyYW1ldGVycy5cbiAgICAgKi9cbiAgICBzZXRGaWx0ZXIoZmllbGQsIHZhbHVlLCB0eXBlID0gXCJlcXVhbHNcIiwgZmllbGRUeXBlID0gXCJzdHJpbmdcIiwgZmlsdGVyUGFyYW1zID0ge30pIHtcbiAgICAgICAgY29uc3QgY29udmVydGVkVmFsdWUgPSB0aGlzLmNvbnZlcnRUb1R5cGUodmFsdWUsIGZpZWxkVHlwZSk7XG5cbiAgICAgICAgaWYgKHRoaXMuZ3JpZEZpbHRlcnMubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgY29uc3QgaW5kZXggPSB0aGlzLmdyaWRGaWx0ZXJzLmZpbmRJbmRleCgoaSkgPT4gaS5maWVsZCA9PT0gZmllbGQpO1xuICAgICAgICAgICAgLy9JZiBmaWVsZCBhbHJlYWR5IGV4aXN0cywganVzdCB1cGRhdGUgdGhlIHZhbHVlLlxuICAgICAgICAgICAgaWYgKGluZGV4ID4gLTEpIHtcbiAgICAgICAgICAgICAgICB0aGlzLmdyaWRGaWx0ZXJzW2luZGV4XS52YWx1ZSA9IGNvbnZlcnRlZFZhbHVlO1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IGZpbHRlciA9IHRoaXMuY3JlYXRlRmlsdGVyVGFyZ2V0KGNvbnZlcnRlZFZhbHVlLCBmaWVsZCwgdHlwZSwgZmllbGRUeXBlLCAodHlwZW9mIHR5cGUgPT09IFwiZnVuY3Rpb25cIiksIGZpbHRlclBhcmFtcyk7XG4gICAgICAgIHRoaXMuZ3JpZEZpbHRlcnMucHVzaChmaWx0ZXIpO1xuICAgIH1cbiAgICAvKipcbiAgICAgKiBSZW1vdmVzIGZpbHRlciBjb25kaXRpb24gZnJvbSBncmlkJ3MgYGdyaWRGaWx0ZXJzYCBjb2xsZWN0aW9uLlxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBmaWVsZCBmaWVsZCBuYW1lLlxuICAgICAqL1xuICAgIHJlbW92ZUZpbHRlcihmaWVsZCkge1xuICAgICAgICB0aGlzLmdyaWRGaWx0ZXJzID0gdGhpcy5ncmlkRmlsdGVycy5maWx0ZXIoZiA9PiBmLmZpZWxkICE9PSBmaWVsZCk7XG4gICAgfVxufVxuXG5GaWx0ZXJNb2R1bGUubW9kdWxlTmFtZSA9IFwiZmlsdGVyXCI7XG5cbmV4cG9ydCB7IEZpbHRlck1vZHVsZSB9OyIsIi8qKlxuICogV2lsbCByZS1sb2FkIHRoZSBncmlkJ3MgZGF0YSBmcm9tIGl0cyB0YXJnZXQgc291cmNlIChsb2NhbCBvciByZW1vdGUpLlxuICovXG5jbGFzcyBSZWZyZXNoTW9kdWxlIHtcbiAgICAvKipcbiAgICAgKiBXaWxsIGFwcGx5IGV2ZW50IHRvIHRhcmdldCBidXR0b24gdGhhdCwgd2hlbiBjbGlja2VkLCB3aWxsIHJlLWxvYWQgdGhlIFxuICAgICAqIGdyaWQncyBkYXRhIGZyb20gaXRzIHRhcmdldCBzb3VyY2UgKGxvY2FsIG9yIHJlbW90ZSkuXG4gICAgICogQHBhcmFtIHtHcmlkQ29udGV4dH0gY29udGV4dCBHcmlkIGNvbnRleHQgY2xhc3MuXG4gICAgICovXG4gICAgY29uc3RydWN0b3IoY29udGV4dCkge1xuICAgICAgICB0aGlzLmNvbnRleHQgPSBjb250ZXh0O1xuICAgIH1cblxuICAgIGluaXRpYWxpemUoKSB7XG4gICAgICAgIGlmICghdGhpcy5jb250ZXh0LnNldHRpbmdzLnJlbW90ZVByb2Nlc3NpbmcgJiYgdGhpcy5jb250ZXh0LnNldHRpbmdzLnJlbW90ZVVybCkge1xuICAgICAgICAgICAgdGhpcy5jb250ZXh0LnBpcGVsaW5lLmFkZFN0ZXAoXCJyZWZyZXNoXCIsIHRoaXMuY29udGV4dC5wZXJzaXN0ZW5jZS5zZXREYXRhKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IGJ0biA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKHRoaXMuY29udGV4dC5zZXR0aW5ncy5yZWZyZXNoYWJsZUlkKTtcbiAgICAgICAgXG4gICAgICAgIGJ0bi5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgdGhpcy5oYW5kbGVSZWZyZXNoKTtcbiAgICB9XG5cbiAgICBoYW5kbGVSZWZyZXNoID0gYXN5bmMgKCkgPT4ge1xuICAgICAgICBpZiAodGhpcy5jb250ZXh0LnBpcGVsaW5lLmhhc1BpcGVsaW5lKFwicmVmcmVzaFwiKSkge1xuICAgICAgICAgICAgYXdhaXQgdGhpcy5jb250ZXh0LnBpcGVsaW5lLmV4ZWN1dGUoXCJyZWZyZXNoXCIpO1xuICAgICAgICB9XG5cbiAgICAgICAgYXdhaXQgdGhpcy5jb250ZXh0LmV2ZW50cy50cmlnZ2VyKFwicmVuZGVyXCIpO1xuICAgIH07XG59XG5cblJlZnJlc2hNb2R1bGUubW9kdWxlTmFtZSA9IFwicmVmcmVzaFwiO1xuXG5leHBvcnQgeyBSZWZyZXNoTW9kdWxlIH07IiwiLyoqXG4gKiBVcGRhdGVzIHRhcmdldCBsYWJlbCB3aXRoIGEgY291bnQgb2Ygcm93cyBpbiBncmlkLlxuICovXG5jbGFzcyBSb3dDb3VudE1vZHVsZSB7XG4gICAgLyoqXG4gICAgICogVXBkYXRlcyB0YXJnZXQgbGFiZWwgc3VwcGxpZWQgaW4gc2V0dGluZ3Mgd2l0aCBhIGNvdW50IG9mIHJvd3MgaW4gZ3JpZC5cbiAgICAgKiBAcGFyYW0ge0dyaWRDb250ZXh0fSBjb250ZXh0IEdyaWQgY29udGV4dCBjbGFzcy5cbiAgICAgKi9cbiAgICBjb25zdHJ1Y3Rvcihjb250ZXh0KSB7XG4gICAgICAgIHRoaXMuY29udGV4dCA9IGNvbnRleHQ7XG4gICAgICAgIHRoaXMuZWxlbWVudCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKGNvbnRleHQuc2V0dGluZ3Mucm93Q291bnRJZCk7XG4gICAgfVxuXG4gICAgaW5pdGlhbGl6ZSgpIHtcbiAgICAgICAgdGhpcy5jb250ZXh0LmV2ZW50cy5zdWJzY3JpYmUoXCJyZW5kZXJcIiwgdGhpcy5oYW5kbGVDb3VudCwgZmFsc2UsIDIwKTtcbiAgICB9XG5cbiAgICBoYW5kbGVDb3VudCA9ICgpID0+IHtcbiAgICAgICAgdGhpcy5lbGVtZW50LmlubmVyVGV4dCA9IHRoaXMuY29udGV4dC5ncmlkLnJvd0NvdW50O1xuICAgIH07XG59XG5cblJvd0NvdW50TW9kdWxlLm1vZHVsZU5hbWUgPSBcInJvd2NvdW50XCI7XG5cbmV4cG9ydCB7IFJvd0NvdW50TW9kdWxlIH07IiwiLyoqXG4gKiBDbGFzcyB0byBtYW5hZ2Ugc29ydGluZyBmdW5jdGlvbmFsaXR5IGluIGEgZ3JpZCBjb250ZXh0LiAgRm9yIHJlbW90ZSBwcm9jZXNzaW5nLCB3aWxsIHN1YnNjcmliZSB0byB0aGUgYHJlbW90ZVBhcmFtc2AgZXZlbnQuXG4gKiBGb3IgbG9jYWwgcHJvY2Vzc2luZywgd2lsbCBzdWJzY3JpYmUgdG8gdGhlIGByZW5kZXJgIGV2ZW50LlxuICogXG4gKiBDbGFzcyB3aWxsIHRyaWdnZXIgdGhlIGByZW5kZXJgIGV2ZW50IGFmdGVyIHNvcnRpbmcgaXMgYXBwbGllZCwgYWxsb3dpbmcgdGhlIGdyaWQgdG8gcmUtcmVuZGVyIHdpdGggdGhlIHNvcnRlZCBkYXRhLlxuICovXG5jbGFzcyBTb3J0TW9kdWxlIHtcbiAgICAvKipcbiAgICAgKiBDcmVhdGVzIGEgbmV3IFNvcnRNb2R1bGUgb2JqZWN0LlxuICAgICAqIEBwYXJhbSB7R3JpZENvbnRleHR9IGNvbnRleHQgXG4gICAgICovXG4gICAgY29uc3RydWN0b3IoY29udGV4dCkge1xuICAgICAgICB0aGlzLmNvbnRleHQgPSBjb250ZXh0O1xuICAgICAgICB0aGlzLmhlYWRlckNlbGxzID0gW107XG4gICAgICAgIHRoaXMuY3VycmVudFNvcnRDb2x1bW4gPSBcIlwiO1xuICAgICAgICB0aGlzLmN1cnJlbnREaXJlY3Rpb24gPSBcIlwiO1xuICAgICAgICB0aGlzLmN1cnJlbnRUeXBlID0gXCJcIjtcbiAgICB9XG5cbiAgICBpbml0aWFsaXplKCkge1xuICAgICAgICBpZiAodGhpcy5jb250ZXh0LnNldHRpbmdzLnJlbW90ZVByb2Nlc3NpbmcpIHtcbiAgICAgICAgICAgIHRoaXMuY3VycmVudFNvcnRDb2x1bW4gPSB0aGlzLmNvbnRleHQuc2V0dGluZ3MucmVtb3RlU29ydERlZmF1bHRDb2x1bW47XG4gICAgICAgICAgICB0aGlzLmN1cnJlbnREaXJlY3Rpb24gPSB0aGlzLmNvbnRleHQuc2V0dGluZ3MucmVtb3RlU29ydERlZmF1bHREaXJlY3Rpb247XG4gICAgICAgICAgICB0aGlzLmNvbnRleHQuZXZlbnRzLnN1YnNjcmliZShcInJlbW90ZVBhcmFtc1wiLCB0aGlzLnJlbW90ZVBhcmFtcywgdHJ1ZSk7XG4gICAgICAgICAgICB0aGlzLl9pbml0KHRoaXMuaGFuZGxlUmVtb3RlKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHRoaXMuY29udGV4dC5ldmVudHMuc3Vic2NyaWJlKFwicmVuZGVyXCIsIHRoaXMucmVuZGVyTG9jYWwsIGZhbHNlLCA5KTtcbiAgICAgICAgICAgIC8vdGhpcy5zb3J0ZXJzID0geyBudW1iZXI6IHNvcnROdW1iZXIsIHN0cmluZzogc29ydFN0cmluZywgZGF0ZTogc29ydERhdGUsIGRhdGV0aW1lOiBzb3J0RGF0ZSB9O1xuICAgICAgICAgICAgdGhpcy5zb3J0ZXJzID0gdGhpcy4jc2V0TG9jYWxGaWx0ZXJzKCk7XG4gICAgICAgICAgICB0aGlzLl9pbml0KHRoaXMuaGFuZGxlTG9jYWwpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgX2luaXQoY2FsbGJhY2spIHtcbiAgICAgICAgLy9iaW5kIGxpc3RlbmVyIGZvciBub24taWNvbiBjb2x1bW5zOyBhZGQgY3NzIHNvcnQgdGFnLlxuICAgICAgICBmb3IgKGNvbnN0IGNvbCBvZiB0aGlzLmNvbnRleHQuY29sdW1uTWFuYWdlci5jb2x1bW5zKSB7XG4gICAgICAgICAgICBpZiAoY29sLnR5cGUgIT09IFwiaWNvblwiKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5oZWFkZXJDZWxscy5wdXNoKGNvbC5oZWFkZXJDZWxsKTtcbiAgICAgICAgICAgICAgICBjb2wuaGVhZGVyQ2VsbC5zcGFuLmNsYXNzTGlzdC5hZGQoXCJzb3J0XCIpO1xuICAgICAgICAgICAgICAgIGNvbC5oZWFkZXJDZWxsLnNwYW4uYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsIGNhbGxiYWNrKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cblxuICAgICNzZXRMb2NhbEZpbHRlcnMoKSB7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICBkYXRlOiAoYSwgYiwgZGlyZWN0aW9uKSA9PiB7XG4gICAgICAgICAgICAgICAgbGV0IGNvbXBhcmlzb24gPSAwO1xuICAgICAgICAgICAgICAgIGxldCBkYXRlQSA9IG5ldyBEYXRlKGEpO1xuICAgICAgICAgICAgICAgIGxldCBkYXRlQiA9IG5ldyBEYXRlKGIpO1xuXG4gICAgICAgICAgICAgICAgaWYgKE51bWJlci5pc05hTihkYXRlQS52YWx1ZU9mKCkpKSB7XG4gICAgICAgICAgICAgICAgICAgIGRhdGVBID0gbnVsbDtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICBpZiAoTnVtYmVyLmlzTmFOKGRhdGVCLnZhbHVlT2YoKSkpIHtcbiAgICAgICAgICAgICAgICAgICAgZGF0ZUIgPSBudWxsO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAvL2hhbmRsZSBlbXB0eSB2YWx1ZXMuXG4gICAgICAgICAgICAgICAgaWYgKCFkYXRlQSkge1xuICAgICAgICAgICAgICAgICAgICBjb21wYXJpc29uID0gIWRhdGVCID8gMCA6IC0xO1xuICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAoIWRhdGVCKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbXBhcmlzb24gPSAxO1xuICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAoZGF0ZUEgPiBkYXRlQikgeyAgICBcbiAgICAgICAgICAgICAgICAgICAgY29tcGFyaXNvbiA9IDE7XG4gICAgICAgICAgICAgICAgfSBlbHNlIGlmIChkYXRlQSA8IGRhdGVCKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbXBhcmlzb24gPSAtMTtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICByZXR1cm4gZGlyZWN0aW9uID09PSBcImRlc2NcIiA/IChjb21wYXJpc29uICogLTEpIDogY29tcGFyaXNvbjtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBudW1iZXI6IChhLCBiLCBkaXJlY3Rpb24pID0+IHtcbiAgICAgICAgICAgICAgICBsZXQgY29tcGFyaXNvbiA9IDA7XG5cbiAgICAgICAgICAgICAgICBpZiAoYSA+IGIpIHtcbiAgICAgICAgICAgICAgICAgICAgY29tcGFyaXNvbiA9IDE7XG4gICAgICAgICAgICAgICAgfSBlbHNlIGlmIChhIDwgYikge1xuICAgICAgICAgICAgICAgICAgICBjb21wYXJpc29uID0gLTE7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgcmV0dXJuIGRpcmVjdGlvbiA9PT0gXCJkZXNjXCIgPyAoY29tcGFyaXNvbiAqIC0xKSA6IGNvbXBhcmlzb247XG4gICAgICAgICAgICB9LCBcbiAgICAgICAgICAgIHN0cmluZzogKGEsIGIsIGRpcmVjdGlvbikgPT4ge1xuICAgICAgICAgICAgICAgIGxldCBjb21wYXJpc29uID0gMDtcbiAgICAgICAgICAgICAgICAvL2hhbmRsZSBlbXB0eSB2YWx1ZXMuXG4gICAgICAgICAgICAgICAgaWYgKCFhKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbXBhcmlzb24gPSAhYiA/IDAgOiAtMTtcbiAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKCFiKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbXBhcmlzb24gPSAxO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHZhckEgPSBhLnRvVXBwZXJDYXNlKCk7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHZhckIgPSBiLnRvVXBwZXJDYXNlKCk7XG4gICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgICAgIGlmICh2YXJBID4gdmFyQikge1xuICAgICAgICAgICAgICAgICAgICAgICAgY29tcGFyaXNvbiA9IDE7XG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAodmFyQSA8IHZhckIpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbXBhcmlzb24gPSAtMTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIHJldHVybiBkaXJlY3Rpb24gPT09IFwiZGVzY1wiID8gKGNvbXBhcmlzb24gKiAtMSkgOiBjb21wYXJpc29uO1xuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuICAgIH1cblxuICAgIHJlbW90ZVBhcmFtcyA9IChwYXJhbXMpID0+IHtcbiAgICAgICAgcGFyYW1zLnNvcnQgPSB0aGlzLmN1cnJlbnRTb3J0Q29sdW1uO1xuICAgICAgICBwYXJhbXMuZGlyZWN0aW9uID0gdGhpcy5jdXJyZW50RGlyZWN0aW9uO1xuXG4gICAgICAgIHJldHVybiBwYXJhbXM7XG4gICAgfTtcblxuICAgIGhhbmRsZVJlbW90ZSA9IGFzeW5jIChjKSA9PiB7XG4gICAgICAgIHRoaXMuY3VycmVudFNvcnRDb2x1bW4gPSBjLmN1cnJlbnRUYXJnZXQuY29udGV4dC5uYW1lO1xuICAgICAgICB0aGlzLmN1cnJlbnREaXJlY3Rpb24gPSBjLmN1cnJlbnRUYXJnZXQuY29udGV4dC5kaXJlY3Rpb25OZXh0LnZhbHVlT2YoKTtcbiAgICAgICAgdGhpcy5jdXJyZW50VHlwZSA9IGMuY3VycmVudFRhcmdldC5jb250ZXh0LnR5cGU7XG5cbiAgICAgICAgaWYgKCFjLmN1cnJlbnRUYXJnZXQuY29udGV4dC5pc0N1cnJlbnRTb3J0KSB7XG4gICAgICAgICAgICB0aGlzLnJlc2V0U29ydCgpO1xuICAgICAgICB9XG5cbiAgICAgICAgYy5jdXJyZW50VGFyZ2V0LmNvbnRleHQuc2V0U29ydEZsYWcoKTtcblxuICAgICAgICBhd2FpdCB0aGlzLmNvbnRleHQuZXZlbnRzLnRyaWdnZXIoXCJyZW5kZXJcIik7XG4gICAgfTtcblxuICAgIHJlc2V0U29ydCgpIHtcbiAgICAgICAgY29uc3QgY2VsbCA9IHRoaXMuaGVhZGVyQ2VsbHMuZmluZChlID0+IGUuaXNDdXJyZW50U29ydCk7XG5cbiAgICAgICAgaWYgKGNlbGwgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgY2VsbC5yZW1vdmVTb3J0RmxhZygpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgcmVuZGVyTG9jYWwgPSAoKSA9PiB7XG4gICAgICAgIGlmICghdGhpcy5jdXJyZW50U29ydENvbHVtbikgcmV0dXJuO1xuXG4gICAgICAgIHRoaXMuY29udGV4dC5wZXJzaXN0ZW5jZS5kYXRhLnNvcnQoKGEsIGIpID0+IHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLnNvcnRlcnNbdGhpcy5jdXJyZW50VHlwZV0oYVt0aGlzLmN1cnJlbnRTb3J0Q29sdW1uXSwgYlt0aGlzLmN1cnJlbnRTb3J0Q29sdW1uXSwgdGhpcy5jdXJyZW50RGlyZWN0aW9uKTtcbiAgICAgICAgfSk7XG4gICAgfTtcblxuICAgIGhhbmRsZUxvY2FsID0gYXN5bmMgKGMpID0+IHtcbiAgICAgICAgdGhpcy5jdXJyZW50U29ydENvbHVtbiA9IGMuY3VycmVudFRhcmdldC5jb250ZXh0Lm5hbWU7XG4gICAgICAgIHRoaXMuY3VycmVudERpcmVjdGlvbiA9IGMuY3VycmVudFRhcmdldC5jb250ZXh0LmRpcmVjdGlvbk5leHQudmFsdWVPZigpO1xuICAgICAgICB0aGlzLmN1cnJlbnRUeXBlID0gYy5jdXJyZW50VGFyZ2V0LmNvbnRleHQudHlwZTtcblxuICAgICAgICBpZiAoIWMuY3VycmVudFRhcmdldC5jb250ZXh0LmlzQ3VycmVudFNvcnQpIHtcbiAgICAgICAgICAgIHRoaXMucmVzZXRTb3J0KCk7XG4gICAgICAgIH1cblxuICAgICAgICBjLmN1cnJlbnRUYXJnZXQuY29udGV4dC5zZXRTb3J0RmxhZygpO1xuXG4gICAgICAgIGF3YWl0IHRoaXMuY29udGV4dC5ldmVudHMudHJpZ2dlcihcInJlbmRlclwiKTtcbiAgICB9O1xufVxuXG5Tb3J0TW9kdWxlLm1vZHVsZU5hbWUgPSBcInNvcnRcIjtcblxuZXhwb3J0IHsgU29ydE1vZHVsZSB9OyIsImltcG9ydCB7IEdyaWRDb3JlIH0gZnJvbSBcIi4vY29yZS9ncmlkQ29yZS5qc1wiO1xuaW1wb3J0IHsgQ3N2TW9kdWxlIH0gZnJvbSBcIi4vbW9kdWxlcy9kb3dubG9hZC9jc3ZNb2R1bGUuanNcIjtcbmltcG9ydCB7IEZpbHRlck1vZHVsZSB9IGZyb20gXCIuL21vZHVsZXMvZmlsdGVyL2ZpbHRlck1vZHVsZS5qc1wiO1xuaW1wb3J0IHsgUmVmcmVzaE1vZHVsZSB9IGZyb20gXCIuL21vZHVsZXMvcmVmcmVzaC9yZWZyZXNoTW9kdWxlLmpzXCI7XG5pbXBvcnQgeyBSb3dDb3VudE1vZHVsZSB9IGZyb20gXCIuL21vZHVsZXMvcm93L3Jvd0NvdW50TW9kdWxlLmpzXCI7XG5pbXBvcnQgeyBTb3J0TW9kdWxlIH0gZnJvbSBcIi4vbW9kdWxlcy9zb3J0L3NvcnRNb2R1bGUuanNcIjtcblxuY2xhc3MgRGF0YUdyaWQgZXh0ZW5kcyBHcmlkQ29yZSB7XG4gICAgY29uc3RydWN0b3IoY29udGFpbmVyLCBzZXR0aW5ncykge1xuICAgICAgICBzdXBlcihjb250YWluZXIsIHNldHRpbmdzKTtcblxuICAgICAgICBpZiAoRGF0YUdyaWQuZGVmYXVsdE9wdGlvbnMuZW5hYmxlRmlsdGVyKSB7XG4gICAgICAgICAgICB0aGlzLmFkZE1vZHVsZXMoRmlsdGVyTW9kdWxlKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChEYXRhR3JpZC5kZWZhdWx0T3B0aW9ucy5lbmFibGVTb3J0KSB7XG4gICAgICAgICAgICB0aGlzLmFkZE1vZHVsZXMoU29ydE1vZHVsZSk7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAodGhpcy5zZXR0aW5ncy5yb3dDb3VudElkKSB7XG4gICAgICAgICAgICB0aGlzLmFkZE1vZHVsZXMoUm93Q291bnRNb2R1bGUpO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHRoaXMuc2V0dGluZ3MucmVmcmVzaGFibGVJZCkge1xuICAgICAgICAgICAgdGhpcy5hZGRNb2R1bGVzKFJlZnJlc2hNb2R1bGUpO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHRoaXMuc2V0dGluZ3MuY3N2RXhwb3J0SWQpIHtcbiAgICAgICAgICAgIHRoaXMuYWRkTW9kdWxlcyhDc3ZNb2R1bGUpO1xuICAgICAgICB9XG4gICAgfVxufVxuXG5EYXRhR3JpZC5kZWZhdWx0T3B0aW9ucyA9IHtcbiAgICBlbmFibGVTb3J0OiB0cnVlLFxuICAgIGVuYWJsZUZpbHRlcjogdHJ1ZVxufTtcblxuZXhwb3J0IHsgRGF0YUdyaWQgfTsiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUFDQTtBQUNBO0FBQ0EsTUFBTSxVQUFVLENBQUM7QUFDakI7QUFDQTtBQUNBO0FBQ0E7QUFDQSxJQUFJLFdBQVcsQ0FBQyxNQUFNLEVBQUU7QUFDeEIsUUFBUSxJQUFJLENBQUMsTUFBTSxHQUFHLE1BQU07QUFDNUIsUUFBUSxJQUFJLENBQUMsUUFBUSxHQUFHLE1BQU0sQ0FBQyxRQUFRO0FBQ3ZDLFFBQVEsSUFBSSxDQUFDLE9BQU8sR0FBRyxRQUFRLENBQUMsYUFBYSxDQUFDLElBQUksQ0FBQztBQUNuRCxRQUFRLElBQUksQ0FBQyxJQUFJLEdBQUcsUUFBUSxDQUFDLGFBQWEsQ0FBQyxNQUFNLENBQUM7QUFDbEQsUUFBUSxJQUFJLENBQUMsSUFBSSxHQUFHLE1BQU0sQ0FBQyxLQUFLO0FBQ2hDLFFBQVEsSUFBSSxDQUFDLFNBQVMsR0FBRyxNQUFNO0FBQy9CLFFBQVEsSUFBSSxDQUFDLGFBQWEsR0FBRyxNQUFNO0FBQ25DLFFBQVEsSUFBSSxDQUFDLElBQUksR0FBRyxNQUFNLENBQUMsSUFBSTs7QUFFL0IsUUFBUSxJQUFJLE1BQU0sQ0FBQyxTQUFTLEVBQUU7QUFDOUIsWUFBWSxJQUFJLENBQUMsT0FBTyxDQUFDLFNBQVMsQ0FBQyxHQUFHLENBQUMsTUFBTSxDQUFDLFNBQVMsQ0FBQztBQUN4RCxRQUFROztBQUVSLFFBQVEsSUFBSSxJQUFJLENBQUMsUUFBUSxDQUFDLGdCQUFnQixFQUFFO0FBQzVDLFlBQVksSUFBSSxDQUFDLE9BQU8sQ0FBQyxTQUFTLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsZ0JBQWdCLENBQUM7QUFDdEUsUUFBUTs7QUFFUixRQUFRLElBQUksTUFBTSxDQUFDLFVBQVUsRUFBRTtBQUMvQixZQUFZLElBQUksQ0FBQyxPQUFPLENBQUMsU0FBUyxD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
