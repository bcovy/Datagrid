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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGF0YWdyaWQuanMiLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NyYy9jb21wb25lbnRzL2NlbGwvaGVhZGVyQ2VsbC5qcyIsIi4uLy4uLy4uL3NyYy9jb21wb25lbnRzL2NvbHVtbi9jb2x1bW4uanMiLCIuLi8uLi8uLi9zcmMvY29tcG9uZW50cy9jb2x1bW4vY29sdW1uTWFuYWdlci5qcyIsIi4uLy4uLy4uL3NyYy9jb21wb25lbnRzL2RhdGEvZGF0YVBpcGVsaW5lLmpzIiwiLi4vLi4vLi4vc3JjL2NvbXBvbmVudHMvZGF0YS9kYXRhTG9hZGVyLmpzIiwiLi4vLi4vLi4vc3JjL2NvbXBvbmVudHMvZGF0YS9kYXRhUGVyc2lzdGVuY2UuanMiLCIuLi8uLi8uLi9zcmMvY29tcG9uZW50cy9ldmVudHMvZ3JpZEV2ZW50cy5qcyIsIi4uLy4uLy4uL3NyYy9jb21wb25lbnRzL2hlbHBlcnMvZGF0ZUhlbHBlci5qcyIsIi4uLy4uLy4uL3NyYy9jb21wb25lbnRzL2NlbGwvZm9ybWF0dGVycy9kYXRldGltZS5qcyIsIi4uLy4uLy4uL3NyYy9jb21wb25lbnRzL2NlbGwvZm9ybWF0dGVycy9saW5rLmpzIiwiLi4vLi4vLi4vc3JjL2NvbXBvbmVudHMvY2VsbC9mb3JtYXR0ZXJzL251bWVyaWMuanMiLCIuLi8uLi8uLi9zcmMvY29tcG9uZW50cy9jZWxsL2Zvcm1hdHRlcnMvc3Rhci5qcyIsIi4uLy4uLy4uL3NyYy9jb21wb25lbnRzL2hlbHBlcnMvY3NzSGVscGVyLmpzIiwiLi4vLi4vLi4vc3JjL2NvbXBvbmVudHMvY2VsbC9jZWxsLmpzIiwiLi4vLi4vLi4vc3JjL2NvbXBvbmVudHMvdGFibGUvdGFibGUuanMiLCIuLi8uLi8uLi9zcmMvY29tcG9uZW50cy9jb250ZXh0L2dyaWRDb250ZXh0LmpzIiwiLi4vLi4vLi4vc3JjL3NldHRpbmdzL3NldHRpbmdzRGVmYXVsdC5qcyIsIi4uLy4uLy4uL3NyYy9zZXR0aW5ncy9tZXJnZU9wdGlvbnMuanMiLCIuLi8uLi8uLi9zcmMvc2V0dGluZ3Mvc2V0dGluZ3NHcmlkLmpzIiwiLi4vLi4vLi4vc3JjL21vZHVsZXMvcm93L3Jvd01vZHVsZS5qcyIsIi4uLy4uLy4uL3NyYy9tb2R1bGVzL3BhZ2VyL3BhZ2VyQnV0dG9ucy5qcyIsIi4uLy4uLy4uL3NyYy9tb2R1bGVzL3BhZ2VyL3BhZ2VyTW9kdWxlLmpzIiwiLi4vLi4vLi4vc3JjL2NvcmUvZ3JpZENvcmUuanMiLCIuLi8uLi8uLi9zcmMvbW9kdWxlcy9kb3dubG9hZC9jc3ZNb2R1bGUuanMiLCIuLi8uLi8uLi9zcmMvbW9kdWxlcy9maWx0ZXIvdHlwZXMvZmlsdGVyVGFyZ2V0LmpzIiwiLi4vLi4vLi4vc3JjL21vZHVsZXMvZmlsdGVyL3R5cGVzL2ZpbHRlckRhdGUuanMiLCIuLi8uLi8uLi9zcmMvbW9kdWxlcy9maWx0ZXIvdHlwZXMvZmlsdGVyRnVuY3Rpb24uanMiLCIuLi8uLi8uLi9zcmMvY29tcG9uZW50cy9oZWxwZXJzL2VsZW1lbnRIZWxwZXIuanMiLCIuLi8uLi8uLi9zcmMvbW9kdWxlcy9maWx0ZXIvZWxlbWVudHMvZWxlbWVudEJldHdlZW4uanMiLCIuLi8uLi8uLi9zcmMvbW9kdWxlcy9maWx0ZXIvZWxlbWVudHMvZWxlbWVudElucHV0LmpzIiwiLi4vLi4vLi4vc3JjL21vZHVsZXMvZmlsdGVyL2VsZW1lbnRzL2VsZW1lbnRNdWx0aVNlbGVjdC5qcyIsIi4uLy4uLy4uL3NyYy9tb2R1bGVzL2ZpbHRlci9lbGVtZW50cy9lbGVtZW50U2VsZWN0LmpzIiwiLi4vLi4vLi4vc3JjL21vZHVsZXMvZmlsdGVyL2ZpbHRlck1vZHVsZS5qcyIsIi4uLy4uLy4uL3NyYy9tb2R1bGVzL3JlZnJlc2gvcmVmcmVzaE1vZHVsZS5qcyIsIi4uLy4uLy4uL3NyYy9tb2R1bGVzL3Jvdy9yb3dDb3VudE1vZHVsZS5qcyIsIi4uLy4uLy4uL3NyYy9tb2R1bGVzL3NvcnQvc29ydE1vZHVsZS5qcyIsIi4uLy4uLy4uL3NyYy9kYXRhZ3JpZC5qcyJdLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIERlZmluZXMgYSBzaW5nbGUgaGVhZGVyIGNlbGwgJ3RoJyBlbGVtZW50LlxuICovXG5jbGFzcyBIZWFkZXJDZWxsIHtcbiAgICAvKipcbiAgICAgKiBDcmVhdGUgaGVhZGVyIG9iamVjdCB0aGF0IHJlcHJlc2VudHMgdGhlIGB0aGAgdGFibGUgaGVhZGVyIGVsZW1lbnQuICBDbGFzcyB3aWxsIHBlcnNpc3QgY29sdW1uIHNvcnQgYW5kIG9yZGVyIHVzZXIgaW5wdXQuXG4gICAgICogQHBhcmFtIHtDb2x1bW59IGNvbHVtbiBjb2x1bW4gb2JqZWN0LlxuICAgICAqL1xuICAgIGNvbnN0cnVjdG9yKGNvbHVtbikge1xuICAgICAgICB0aGlzLmNvbHVtbiA9IGNvbHVtbjtcbiAgICAgICAgdGhpcy5zZXR0aW5ncyA9IGNvbHVtbi5zZXR0aW5ncztcbiAgICAgICAgdGhpcy5lbGVtZW50ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcInRoXCIpO1xuICAgICAgICB0aGlzLnNwYW4gPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwic3BhblwiKTtcbiAgICAgICAgdGhpcy5uYW1lID0gY29sdW1uLmZpZWxkO1xuICAgICAgICB0aGlzLmRpcmVjdGlvbiA9IFwiZGVzY1wiO1xuICAgICAgICB0aGlzLmRpcmVjdGlvbk5leHQgPSBcImRlc2NcIjtcbiAgICAgICAgdGhpcy50eXBlID0gY29sdW1uLnR5cGU7XG5cbiAgICAgICAgaWYgKGNvbHVtbi5oZWFkZXJDc3MpIHtcbiAgICAgICAgICAgIHRoaXMuZWxlbWVudC5jbGFzc0xpc3QuYWRkKGNvbHVtbi5oZWFkZXJDc3MpO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHRoaXMuc2V0dGluZ3MudGFibGVIZWFkZXJUaENzcykge1xuICAgICAgICAgICAgdGhpcy5lbGVtZW50LmNsYXNzTGlzdC5hZGQodGhpcy5zZXR0aW5ncy50YWJsZUhlYWRlclRoQ3NzKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChjb2x1bW4uY29sdW1uU2l6ZSkge1xuICAgICAgICAgICAgdGhpcy5lbGVtZW50LmNsYXNzTGlzdC5hZGQoY29sdW1uLmNvbHVtblNpemUpO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKGNvbHVtbi53aWR0aCkge1xuICAgICAgICAgICAgdGhpcy5lbGVtZW50LnN0eWxlLndpZHRoID0gY29sdW1uLndpZHRoO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKGNvbHVtbi5oZWFkZXJGaWx0ZXJFbXB0eSkge1xuICAgICAgICAgICAgdGhpcy5zcGFuLmNsYXNzTGlzdC5hZGQoY29sdW1uLmhlYWRlckZpbHRlckVtcHR5KTtcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMuZWxlbWVudC5hcHBlbmRDaGlsZCh0aGlzLnNwYW4pO1xuICAgICAgICB0aGlzLmVsZW1lbnQuY29udGV4dCA9IHRoaXM7XG4gICAgICAgIHRoaXMuc3Bhbi5pbm5lclRleHQgPSBjb2x1bW4ubGFiZWw7XG4gICAgICAgIHRoaXMuc3Bhbi5jb250ZXh0ID0gdGhpcztcbiAgICB9XG4gICAgLyoqXG4gICAgICogU2V0IHRoZSBzb3J0IGZsYWcgZm9yIHRoZSBoZWFkZXIgY2VsbC5cbiAgICAgKi9cbiAgICBzZXRTb3J0RmxhZygpIHtcbiAgICAgICAgaWYgKHRoaXMuaWNvbiA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICB0aGlzLmljb24gPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiaVwiKTtcbiAgICAgICAgICAgIHRoaXMuc3Bhbi5hcHBlbmQodGhpcy5pY29uKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICh0aGlzLmRpcmVjdGlvbk5leHQgPT09IFwiZGVzY1wiKSB7XG4gICAgICAgICAgICB0aGlzLmljb24uY2xhc3NMaXN0ID0gdGhpcy5zZXR0aW5ncy50YWJsZUNzc1NvcnREZXNjO1xuICAgICAgICAgICAgdGhpcy5kaXJlY3Rpb24gPSBcImRlc2NcIjtcbiAgICAgICAgICAgIHRoaXMuZGlyZWN0aW9uTmV4dCA9IFwiYXNjXCI7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB0aGlzLmljb24uY2xhc3NMaXN0ID0gdGhpcy5zZXR0aW5ncy50YWJsZUNzc1NvcnRBc2M7XG4gICAgICAgICAgICB0aGlzLmRpcmVjdGlvbiA9IFwiYXNjXCI7XG4gICAgICAgICAgICB0aGlzLmRpcmVjdGlvbk5leHQgPSBcImRlc2NcIjtcbiAgICAgICAgfVxuICAgIH1cbiAgICAvKipcbiAgICAgKiBSZW1vdmUgdGhlIHNvcnQgZmxhZyBmb3IgdGhlIGhlYWRlciBjZWxsLlxuICAgICAqL1xuICAgIHJlbW92ZVNvcnRGbGFnKCkge1xuICAgICAgICB0aGlzLmRpcmVjdGlvbiA9IFwiZGVzY1wiO1xuICAgICAgICB0aGlzLmRpcmVjdGlvbk5leHQgPSBcImRlc2NcIjtcbiAgICAgICAgdGhpcy5pY29uID0gdGhpcy5pY29uLnJlbW92ZSgpO1xuICAgIH1cblxuICAgIGdldCBpc0N1cnJlbnRTb3J0KCkge1xuICAgICAgICByZXR1cm4gdGhpcy5pY29uICE9PSB1bmRlZmluZWQ7XG4gICAgfVxufVxuXG5leHBvcnQgeyBIZWFkZXJDZWxsIH07IiwiLyoqXG4gKiBEZWZpbmVzIGEgc2luZ2xlIGNvbHVtbiBmb3IgdGhlIGdyaWQuICBUcmFuc2Zvcm1zIHVzZXIncyBjb2x1bW4gZGVmaW5pdGlvbiBpbnRvIENsYXNzIHByb3BlcnRpZXMuXG4gKiBAY2xhc3NcbiAqL1xuY2xhc3MgQ29sdW1uIHtcbiAgICAvKipcbiAgICAgKiBDcmVhdGUgY29sdW1uIG9iamVjdCB3aGljaCB0cmFuc2Zvcm1zIHVzZXIncyBjb2x1bW4gZGVmaW5pdGlvbiBpbnRvIENsYXNzIHByb3BlcnRpZXMuXG4gICAgICogQHBhcmFtIHtPYmplY3R9IGNvbHVtbiBVc2VyJ3MgY29sdW1uIGRlZmluaXRpb24vc2V0dGluZ3MuXG4gICAgICogQHBhcmFtIHtTZXR0aW5nc0dyaWR9IHNldHRpbmdzIGdyaWQgc2V0dGluZ3MuXG4gICAgICogQHBhcmFtIHtudW1iZXJ9IGluZGV4IGNvbHVtbiBpbmRleCBudW1iZXIuXG4gICAgICovXG4gICAgY29uc3RydWN0b3IoY29sdW1uLCBzZXR0aW5ncywgaW5kZXggPSAwKSB7XG4gICAgICAgIHRoaXMuc2V0dGluZ3MgPSBzZXR0aW5ncztcbiAgICAgICAgdGhpcy5pbmRleCA9IGluZGV4O1xuXG4gICAgICAgIGlmIChjb2x1bW4uZmllbGQgPT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgdGhpcy5maWVsZCA9IGBjb2x1bW4ke2luZGV4fWA7ICAvL2Fzc29jaWF0ZWQgZGF0YSBmaWVsZCBuYW1lLlxuICAgICAgICAgICAgdGhpcy50eXBlID0gXCJpY29uXCI7ICAvL2ljb24gdHlwZS5cbiAgICAgICAgICAgIHRoaXMubGFiZWwgPSBcIlwiO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdGhpcy5maWVsZCA9IGNvbHVtbi5maWVsZDsgIC8vYXNzb2NpYXRlZCBkYXRhIGZpZWxkIG5hbWUuXG4gICAgICAgICAgICB0aGlzLnR5cGUgPSBjb2x1bW4udHlwZSA/IGNvbHVtbi50eXBlIDogXCJzdHJpbmdcIjsgIC8vdmFsdWUgdHlwZS5cbiAgICAgICAgICAgIHRoaXMubGFiZWwgPSBjb2x1bW4ubGFiZWwgXG4gICAgICAgICAgICAgICAgPyBjb2x1bW4ubGFiZWwgXG4gICAgICAgICAgICAgICAgOiBjb2x1bW4uZmllbGRbMF0udG9VcHBlckNhc2UoKSArIGNvbHVtbi5maWVsZC5zbGljZSgxKTsgIC8vY29sdW1uIHRpdGxlLlxuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5mb3JtYXR0ZXIgPSBjb2x1bW4uZm9ybWF0dGVyOyAgLy9mb3JtYXR0ZXIgdHlwZSBvciBmdW5jdGlvbi5cbiAgICAgICAgdGhpcy5mb3JtYXR0ZXJQYXJhbXMgPSBjb2x1bW4uZm9ybWF0dGVyUGFyYW1zO1xuICAgICAgICB0aGlzLmhlYWRlckNzcyA9IGNvbHVtbi5oZWFkZXJDc3M7XG4gICAgICAgIHRoaXMuY29sdW1uU2l6ZSA9IGNvbHVtbj8uY29sdW1uU2l6ZSA/IGBkYXRhZ3JpZHMtY29sLSR7Y29sdW1uLmNvbHVtblNpemV9YCA6IFwiXCI7XG4gICAgICAgIHRoaXMud2lkdGggPSBjb2x1bW4/LndpZHRoID8/IHVuZGVmaW5lZDtcbiAgICAgICAgdGhpcy5oYXNGaWx0ZXIgPSB0aGlzLnR5cGUgIT09IFwiaWNvblwiICYmIGNvbHVtbi5maWx0ZXJUeXBlID8gdHJ1ZSA6IGZhbHNlO1xuICAgICAgICB0aGlzLmhlYWRlckNlbGwgPSB1bmRlZmluZWQ7ICAvL0hlYWRlckNlbGwgY2xhc3MuXG4gICAgICAgIHRoaXMuaGVhZGVyRmlsdGVyID0gdW5kZWZpbmVkOyAgLy9IZWFkZXJGaWx0ZXIgY2xhc3MuXG5cbiAgICAgICAgaWYgKHRoaXMuaGFzRmlsdGVyKSB7XG4gICAgICAgICAgICB0aGlzLiNpbml0aWFsaXplRmlsdGVyKGNvbHVtbiwgc2V0dGluZ3MpO1xuICAgICAgICB9IGVsc2UgaWYgKGNvbHVtbj8uaGVhZGVyRmlsdGVyRW1wdHkpIHtcbiAgICAgICAgICAgIHRoaXMuaGVhZGVyRmlsdGVyRW1wdHkgPSAodHlwZW9mIGNvbHVtbi5oZWFkZXJGaWx0ZXJFbXB0eSA9PT0gXCJzdHJpbmdcIikgXG4gICAgICAgICAgICAgICAgPyBjb2x1bW4uaGVhZGVyRmlsdGVyRW1wdHkgOiBcImRhdGFncmlkcy1uby1oZWFkZXJcIjtcbiAgICAgICAgfVxuICAgICAgICAvL1Rvb2x0aXAgc2V0dGluZy5cbiAgICAgICAgaWYgKGNvbHVtbi50b29sdGlwRmllbGQpIHtcbiAgICAgICAgICAgIHRoaXMudG9vbHRpcEZpZWxkID0gY29sdW1uLnRvb2x0aXBGaWVsZDtcbiAgICAgICAgICAgIHRoaXMudG9vbHRpcExheW91dCA9IGNvbHVtbj8udG9vbHRpcExheW91dCA9PT0gXCJyaWdodFwiID8gXCJkYXRhZ3JpZHMtdG9vbHRpcC1yaWdodFwiIDogXCJkYXRhZ3JpZHMtdG9vbHRpcC1sZWZ0XCI7XG4gICAgICAgIH1cbiAgICB9XG4gICAgLyoqXG4gICAgICogSW5pdGlhbGl6ZXMgZmlsdGVyIHByb3BlcnRpZXMuXG4gICAgICogQHBhcmFtIHtPYmplY3R9IGNvbHVtbiBcbiAgICAgKiBAcGFyYW0ge1NldHRpbmdzfSBzZXR0aW5ncyBcbiAgICAgKi9cbiAgICAjaW5pdGlhbGl6ZUZpbHRlcihjb2x1bW4sIHNldHRpbmdzKSB7XG4gICAgICAgIHRoaXMuZmlsdGVyRWxlbWVudCA9IGNvbHVtbi5maWx0ZXJUeXBlID09PSBcImJldHdlZW5cIiA/IFwiYmV0d2VlblwiIDogXCJpbnB1dFwiO1xuICAgICAgICB0aGlzLmZpbHRlclR5cGUgPSBjb2x1bW4uZmlsdGVyVHlwZTsgIC8vZmlsdGVyIHR5cGUgZGVzY3JpcHRvciwgc3VjaCBhczogZXF1YWxzLCBsaWtlLCA8LCBldGM7IGNhbiBhbHNvIGJlIGEgZnVuY3Rpb24uXG4gICAgICAgIHRoaXMuZmlsdGVyUGFyYW1zID0gY29sdW1uLmZpbHRlclBhcmFtcztcbiAgICAgICAgdGhpcy5maWx0ZXJDc3MgPSBjb2x1bW4/LmZpbHRlckNzcyA/PyBzZXR0aW5ncy50YWJsZUZpbHRlckNzcztcbiAgICAgICAgdGhpcy5maWx0ZXJSZWFsVGltZSA9IGNvbHVtbj8uZmlsdGVyUmVhbFRpbWUgPz8gZmFsc2U7XG5cbiAgICAgICAgaWYgKGNvbHVtbi5maWx0ZXJWYWx1ZXMpIHtcbiAgICAgICAgICAgIHRoaXMuZmlsdGVyVmFsdWVzID0gY29sdW1uLmZpbHRlclZhbHVlczsgIC8vc2VsZWN0IG9wdGlvbiBmaWx0ZXIgdmFsdWUuXG4gICAgICAgICAgICB0aGlzLmZpbHRlclZhbHVlc1JlbW90ZVNvdXJjZSA9IHR5cGVvZiBjb2x1bW4uZmlsdGVyVmFsdWVzID09PSBcInN0cmluZ1wiID8gY29sdW1uLmZpbHRlclZhbHVlcyA6IHVuZGVmaW5lZDsgIC8vc2VsZWN0IG9wdGlvbiBmaWx0ZXIgdmFsdWUgYWpheCBzb3VyY2UuXG4gICAgICAgICAgICB0aGlzLmZpbHRlckVsZW1lbnQgPSBjb2x1bW4uZmlsdGVyTXVsdGlTZWxlY3QgPyBcIm11bHRpXCIgOlwic2VsZWN0XCI7XG4gICAgICAgICAgICB0aGlzLmZpbHRlck11bHRpU2VsZWN0ID0gY29sdW1uLmZpbHRlck11bHRpU2VsZWN0O1xuICAgICAgICB9XG4gICAgfVxufVxuXG5leHBvcnQgeyBDb2x1bW4gfTsiLCJpbXBvcnQgeyBIZWFkZXJDZWxsIH0gZnJvbSBcIi4uL2NlbGwvaGVhZGVyQ2VsbC5qc1wiO1xuaW1wb3J0IHsgQ29sdW1uIH0gZnJvbSBcIi4vY29sdW1uLmpzXCI7XG4vKipcbiAqIENyZWF0ZXMgYW5kIG1hbmFnZXMgdGhlIGNvbHVtbnMgZm9yIHRoZSBncmlkLiAgV2lsbCBjcmVhdGUgYSBgQ29sdW1uYCBvYmplY3QgZm9yIGVhY2ggY29sdW1uIGRlZmluaXRpb24gcHJvdmlkZWQgYnkgdGhlIHVzZXIuXG4gKi9cbmNsYXNzIENvbHVtbk1hbmFnZXIge1xuICAgICNjb2x1bW5zO1xuICAgICNpbmRleENvdW50ZXIgPSAwO1xuICAgIC8qKlxuICAgICAqIFRyYW5zZm9ybXMgdXNlcidzIGNvbHVtbiBkZWZpbml0aW9ucyBpbnRvIGNvbmNyZXRlIGBDb2x1bW5gIGNsYXNzIG9iamVjdHMuICBXaWxsIGFsc28gY3JlYXRlIGBIZWFkZXJDZWxsYCBvYmplY3RzIFxuICAgICAqIGZvciBlYWNoIGNvbHVtbi5cbiAgICAgKiBAcGFyYW0ge0FycmF5PE9iamVjdD59IGNvbHVtbnMgQ29sdW1uIGRlZmluaXRpb25zIGZyb20gdXNlci5cbiAgICAgKiBAcGFyYW0ge1NldHRpbmdzR3JpZH0gc2V0dGluZ3MgR3JpZCBzZXR0aW5ncy5cbiAgICAgKi9cbiAgICBjb25zdHJ1Y3Rvcihjb2x1bW5zLCBzZXR0aW5ncykge1xuICAgICAgICB0aGlzLiNjb2x1bW5zID0gW107XG4gICAgICAgIHRoaXMuc2V0dGluZ3MgPSBzZXR0aW5ncztcbiAgICAgICAgdGhpcy50YWJsZUV2ZW5Db2x1bW5XaWR0aHMgPSBzZXR0aW5ncy50YWJsZUV2ZW5Db2x1bW5XaWR0aHM7XG4gICAgICAgIHRoaXMuaGFzSGVhZGVyRmlsdGVycyA9IGZhbHNlO1xuXG4gICAgICAgIGZvciAoY29uc3QgYyBvZiBjb2x1bW5zKSB7XG4gICAgICAgICAgICBjb25zdCBjb2wgPSBuZXcgQ29sdW1uKGMsIHNldHRpbmdzLCB0aGlzLiNpbmRleENvdW50ZXIpO1xuICAgICAgICAgIFxuICAgICAgICAgICAgY29sLmhlYWRlckNlbGwgPSBuZXcgSGVhZGVyQ2VsbChjb2wpO1xuXG4gICAgICAgICAgICB0aGlzLiNjb2x1bW5zLnB1c2goY29sKTtcbiAgICAgICAgICAgIHRoaXMuI2luZGV4Q291bnRlcisrO1xuICAgICAgICB9XG4gICAgICAgIC8vIENoZWNrIGlmIGFueSBjb2x1bW4gaGFzIGEgZmlsdGVyIGRlZmluZWRcbiAgICAgICAgaWYgKHRoaXMuI2NvbHVtbnMuc29tZSgoYykgPT4gYy5oYXNGaWx0ZXIpKSB7XG4gICAgICAgICAgICB0aGlzLmhhc0hlYWRlckZpbHRlcnMgPSB0cnVlO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHNldHRpbmdzLnRhYmxlRXZlbkNvbHVtbldpZHRocykge1xuICAgICAgICAgICAgdGhpcy4jc2V0RXZlbkNvbHVtbldpZHRocygpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgI3NldEV2ZW5Db2x1bW5XaWR0aHMoKSB7IFxuICAgICAgICBjb25zdCBjb3VudCA9ICh0aGlzLiNpbmRleENvdW50ZXIgKyAxKTtcbiAgICAgICAgY29uc3Qgd2lkdGggPSAxMDAgLyBjb3VudDtcblxuICAgICAgICB0aGlzLiNjb2x1bW5zLmZvckVhY2goKGgpID0+IGguaGVhZGVyQ2VsbC5lbGVtZW50LnN0eWxlLndpZHRoID0gYCR7d2lkdGh9JWApO1xuICAgIH1cbiAgICAvKipcbiAgICAgKiBHZXQgYXJyYXkgb2YgYENvbHVtbmAgb2JqZWN0cy5cbiAgICAgKiBAcmV0dXJucyB7QXJyYXk8Q29sdW1uPn0gYXJyYXkgb2YgYENvbHVtbmAgb2JqZWN0cy5cbiAgICAgKi9cbiAgICBnZXQgY29sdW1ucygpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuI2NvbHVtbnM7XG4gICAgfVxuICAgIC8qKlxuICAgICAqIEFkZHMgYSBuZXcgY29sdW1uIHRvIHRoZSBjb2x1bW5zIGNvbGxlY3Rpb24uXG4gICAgICogQHBhcmFtIHtPYmplY3R9IGNvbHVtbiBDb2x1bW4gZGVmaW5pdGlvbiBvYmplY3QuXG4gICAgICogQHBhcmFtIHtudW1iZXJ9IFtpbmRleD1udWxsXSBJbmRleCB0byBpbnNlcnQgdGhlIGNvbHVtbiBhdC4gSWYgbnVsbCwgYXBwZW5kcyB0byB0aGUgZW5kLlxuICAgICAqL1xuICAgIGFkZENvbHVtbihjb2x1bW4sIGluZGV4ID0gbnVsbCkgeyBcbiAgICAgICAgY29uc3QgY29sID0gbmV3IENvbHVtbihjb2x1bW4sIHRoaXMuc2V0dGluZ3MsIHRoaXMuI2luZGV4Q291bnRlcik7XG4gICAgICAgIGNvbC5oZWFkZXJDZWxsID0gbmV3IEhlYWRlckNlbGwoY29sKTtcblxuICAgICAgICBpZiAoaW5kZXggIT09IG51bGwgJiYgaW5kZXggPj0gMCAmJiBpbmRleCA8IHRoaXMuI2NvbHVtbnMubGVuZ3RoKSB7XG4gICAgICAgICAgICB0aGlzLiNjb2x1bW5zLnNwbGljZShpbmRleCwgMCwgY29sKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHRoaXMuI2NvbHVtbnMucHVzaChjb2wpO1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy4jaW5kZXhDb3VudGVyKys7XG5cbiAgICAgICAgaWYgKHRoaXMudGFibGVFdmVuQ29sdW1uV2lkdGhzKSB7XG4gICAgICAgICAgICB0aGlzLiNzZXRFdmVuQ29sdW1uV2lkdGhzKCk7XG4gICAgICAgIH1cbiAgICB9XG59XG5cbmV4cG9ydCB7IENvbHVtbk1hbmFnZXIgfTsiLCIvKipcbiAqIENsYXNzIHRvIGJ1aWxkIGEgZGF0YS1wcm9jZXNzaW5nIHBpcGVsaW5lIHRoYXQgaW52b2tlcyBhbiBhc3luYyBmdW5jdGlvbiB0byByZXRyaWV2ZSBkYXRhIGZyb20gYSByZW1vdGUgc291cmNlLCBcbiAqIGFuZCBwYXNzIHRoZSByZXN1bHRzIHRvIGFuIGFzc29jaWF0ZWQgaGFuZGxlciBmdW5jdGlvbi4gIFdpbGwgZXhlY3V0ZSBzdGVwcyBpbiB0aGUgb3JkZXIgdGhleSBhcmUgYWRkZWQgdG8gdGhlIGNsYXNzLlxuICogXG4gKiBUaGUgbWFpbiBwdXJwb3NlIG9mIHRoaXMgY2xhc3MgaXMgdG8gcmV0cmlldmUgcmVtb3RlIGRhdGEgZm9yIHNlbGVjdCBpbnB1dCBjb250cm9scywgYnV0IGNhbiBiZSB1c2VkIGZvciBhbnkgaGFuZGxpbmcgXG4gKiBvZiByZW1vdGUgZGF0YSByZXRyaWV2YWwgYW5kIHByb2Nlc3NpbmcuXG4gKi9cbmNsYXNzIERhdGFQaXBlbGluZSB7XG4gICAgI3BpcGVsaW5lcztcbiAgICAvKipcbiAgICAgKiBDcmVhdGVzIGRhdGEtcHJvY2Vzc2luZyBwaXBlbGluZSBjbGFzcy4gIFdpbGwgaW50ZXJuYWxseSBidWlsZCBhIGtleS92YWx1ZSBwYWlyIG9mIGV2ZW50cyBhbmQgYXNzb2NpYXRlZFxuICAgICAqIGNhbGxiYWNrIGZ1bmN0aW9ucy4gIFZhbHVlIHdpbGwgYmUgYW4gYXJyYXkgdG8gYWNjb21tb2RhdGUgbXVsdGlwbGUgY2FsbGJhY2tzIGFzc2lnbmVkIHRvIHRoZSBzYW1lIGV2ZW50IFxuICAgICAqIGtleSBuYW1lLlxuICAgICAqIEBwYXJhbSB7U2V0dGluZ3NHcmlkfSBzZXR0aW5ncyBcbiAgICAgKi9cbiAgICBjb25zdHJ1Y3RvcihzZXR0aW5ncykge1xuICAgICAgICB0aGlzLiNwaXBlbGluZXMgPSB7fTsgXG4gICAgICAgIHRoaXMuYWpheFVybCA9IHNldHRpbmdzLmFqYXhVcmw7XG4gICAgfVxuXG4gICAgY291bnRFdmVudFN0ZXBzKGV2ZW50TmFtZSkge1xuICAgICAgICBpZiAoIXRoaXMuI3BpcGVsaW5lc1tldmVudE5hbWVdKSByZXR1cm4gMDtcblxuICAgICAgICByZXR1cm4gdGhpcy4jcGlwZWxpbmVzW2V2ZW50TmFtZV0ubGVuZ3RoO1xuICAgIH1cbiAgICAvKipcbiAgICAgKiBSZXR1cm5zIGB0cnVlYCBpZiBzdGVwcyBhcmUgcmVnaXN0ZXJlZCBmb3IgdGhlIGFzc29jaWF0ZWQgZXZlbnQgbmFtZSwgb3IgYGZhbHNlYCBpZiBubyBtYXRjaGluZyByZXN1bHRzIGFyZSBmb3VuZC5cbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gZXZlbnROYW1lIEV2ZW50IG5hbWUuXG4gICAgICogQHJldHVybnMge2Jvb2xlYW59IGB0cnVlYCBpZiByZXN1bHRzIGFyZSBmb3VuZCBmb3IgZXZlbnQgbmFtZSwgb3RoZXJ3aXNlIGBmYWxzZWAuXG4gICAgICovXG4gICAgaGFzUGlwZWxpbmUoZXZlbnROYW1lKSB7XG4gICAgICAgIGlmICghdGhpcy4jcGlwZWxpbmVzW2V2ZW50TmFtZV0pIHJldHVybiBmYWxzZTtcblxuICAgICAgICByZXR1cm4gdGhpcy4jcGlwZWxpbmVzW2V2ZW50TmFtZV0ubGVuZ3RoID4gMDtcbiAgICB9XG4gICAgLyoqXG4gICAgICogUmVnaXN0ZXIgYW4gYXN5bmNocm9ub3VzIGNhbGxiYWNrIHN0ZXAgdG8gdGhlIHBpcGVsaW5lLiAgTW9yZSB0aGFuIG9uZSBjYWxsYmFjayBjYW4gYmUgcmVnaXN0ZXJlZCB0byB0aGUgc2FtZSBldmVudCBuYW1lLlxuICAgICAqIFxuICAgICAqIElmIGEgZHVwbGljYXRlL21hdGNoaW5nIGV2ZW50IG5hbWUgYW5kIGNhbGxiYWNrIGZ1bmN0aW9uIGhhcyBhbHJlYWR5IGJlZW4gcmVnaXN0ZXJlZCwgbWV0aG9kIHdpbGwgc2tpcCB0aGUgXG4gICAgICogcmVnaXN0cmF0aW9uIHByb2Nlc3MuXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IGV2ZW50TmFtZSBFdmVudCBuYW1lLlxuICAgICAqIEBwYXJhbSB7RnVuY3Rpb259IGNhbGxiYWNrIEFuIGFzeW5jIGZ1bmN0aW9uLlxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBbdXJsPVwiXCJdIFRhcmdldCB1cmwuICBXaWxsIHVzZSBgYWpheFVybGAgcHJvcGVydHkgZGVmYXVsdCBpZiBhcmd1bWVudCBpcyBlbXB0eS5cbiAgICAgKi9cbiAgICBhZGRTdGVwKGV2ZW50TmFtZSwgY2FsbGJhY2ssIHVybCA9IFwiXCIpIHtcbiAgICAgICAgaWYgKCF0aGlzLiNwaXBlbGluZXNbZXZlbnROYW1lXSkge1xuICAgICAgICAgICAgdGhpcy4jcGlwZWxpbmVzW2V2ZW50TmFtZV0gPSBbXTtcbiAgICAgICAgfSBlbHNlIGlmICh0aGlzLiNwaXBlbGluZXNbZXZlbnROYW1lXS5zb21lKCh4KSA9PiB4LmNhbGxiYWNrID09PSBjYWxsYmFjaykpIHtcbiAgICAgICAgICAgIGNvbnNvbGUud2FybihcIkNhbGxiYWNrIGZ1bmN0aW9uIGFscmVhZHkgZm91bmQgZm9yOiBcIiArIGV2ZW50TmFtZSk7XG4gICAgICAgICAgICByZXR1cm47ICAvLyBJZiBldmVudCBuYW1lIGFuZCBjYWxsYmFjayBhbHJlYWR5IGV4aXN0LCBkb24ndCBhZGQuXG4gICAgICAgIH1cblxuICAgICAgICBpZiAodXJsID09PSBcIlwiKSB7XG4gICAgICAgICAgICB1cmwgPSB0aGlzLmFqYXhVcmw7XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLiNwaXBlbGluZXNbZXZlbnROYW1lXS5wdXNoKHt1cmw6IHVybCwgY2FsbGJhY2s6IGNhbGxiYWNrfSk7XG4gICAgfVxuICAgIC8qKlxuICAgICAqIEV4ZWN1dGVzIHRoZSBIVFRQIHJlcXVlc3QocykgZm9yIHRoZSBnaXZlbiBldmVudCBuYW1lLCBhbmQgcGFzc2VzIHRoZSByZXN1bHRzIHRvIHRoZSBhc3NvY2lhdGVkIGNhbGxiYWNrIGZ1bmN0aW9uLiAgXG4gICAgICogTWV0aG9kIGV4cGVjdHMgcmV0dXJuIHR5cGUgb2YgcmVxdWVzdCB0byBiZSBhIEpTT04gcmVzcG9uc2UuXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IGV2ZW50TmFtZSBcbiAgICAgKi9cbiAgICBhc3luYyBleGVjdXRlKGV2ZW50TmFtZSkge1xuICAgICAgICBmb3IgKGxldCBpdGVtIG9mIHRoaXMuI3BpcGVsaW5lc1tldmVudE5hbWVdKSB7XG4gICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgIGNvbnN0IHJlc3BvbnNlID0gYXdhaXQgZmV0Y2goaXRlbS51cmwsIHsgXG4gICAgICAgICAgICAgICAgICAgIG1ldGhvZDogXCJHRVRcIiwgXG4gICAgICAgICAgICAgICAgICAgIG1vZGU6IFwiY29yc1wiLFxuICAgICAgICAgICAgICAgICAgICBoZWFkZXJzOiB7IEFjY2VwdDogXCJhcHBsaWNhdGlvbi9qc29uXCIgfSBcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICBpZiAocmVzcG9uc2Uub2spIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgZGF0YSA9IGF3YWl0IHJlc3BvbnNlLmpzb24oKTtcblxuICAgICAgICAgICAgICAgICAgICBpdGVtLmNhbGxiYWNrKGRhdGEpO1xuICAgICAgICAgICAgICAgIH0gXG4gICAgICAgICAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgICAgICAgICAgICB3aW5kb3cuYWxlcnQoZXJyLm1lc3NhZ2UpO1xuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKGVyci5tZXNzYWdlKTtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cbn1cblxuZXhwb3J0IHsgRGF0YVBpcGVsaW5lIH07IiwiY2xhc3MgRGF0YUxvYWRlciB7XG4gICAgLyoqXG4gICAgICogQ3JlYXRlIGNsYXNzIHRvIHJldHJpZXZlIGRhdGEgdmlhIGFuIEFqYXggY2FsbC5cbiAgICAgKiBAcGFyYW0ge1NldHRpbmdzR3JpZH0gc2V0dGluZ3MgZ3JpZCBzZXR0aW5ncy5cbiAgICAgKi9cbiAgICBjb25zdHJ1Y3RvcihzZXR0aW5ncykge1xuICAgICAgICB0aGlzLmFqYXhVcmwgPSBzZXR0aW5ncy5hamF4VXJsO1xuICAgIH1cbiAgICAvKioqXG4gICAgICogVXNlcyBpbnB1dCBwYXJhbWV0ZXIncyBrZXkvdmFsdWUgcGFyaXMgdG8gYnVpbGQgYSBmdWxseSBxdWFsaWZpZWQgdXJsIHdpdGggcXVlcnkgc3RyaW5nIHZhbHVlcy5cbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gdXJsIFRhcmdldCB1cmwuXG4gICAgICogQHBhcmFtIHtvYmplY3R9IFtwYXJhbWV0ZXJzPXt9XSBJbnB1dCBwYXJhbWV0ZXJzLlxuICAgICAqIEByZXR1cm5zIHtzdHJpbmd9IEZ1bGx5IHF1YWxpZmllZCB1cmwuXG4gICAgICovXG4gICAgYnVpbGRVcmwodXJsLCBwYXJhbWV0ZXJzID0ge30pIHtcbiAgICAgICAgY29uc3QgcCA9IE9iamVjdC5rZXlzKHBhcmFtZXRlcnMpO1xuICBcbiAgICAgICAgaWYgKHAubGVuZ3RoID09PSAwKSB7XG4gICAgICAgICAgICByZXR1cm4gdXJsO1xuICAgICAgICB9XG5cbiAgICAgICAgbGV0IHJlc3VsdCA9IFtdO1xuXG4gICAgICAgIGZvciAoY29uc3Qga2V5IG9mIHApIHtcbiAgICAgICAgICAgIGlmIChBcnJheS5pc0FycmF5KHBhcmFtZXRlcnNba2V5XSkpIHtcbiAgICAgICAgICAgICAgICBjb25zdCBtdWx0aSA9IHBhcmFtZXRlcnNba2V5XS5tYXAoayA9PiBgJHtrZXl9PSR7ZW5jb2RlVVJJQ29tcG9uZW50KGspfWApO1xuXG4gICAgICAgICAgICAgICAgcmVzdWx0ID0gcmVzdWx0LmNvbmNhdChtdWx0aSk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHJlc3VsdC5wdXNoKGAke2tleX09JHtlbmNvZGVVUklDb21wb25lbnQocGFyYW1ldGVyc1trZXldKX1gKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiB1cmwuaW5kZXhPZihcIj9cIikgIT09IC0xID8gYCR7dXJsfSYke3Jlc3VsdC5qb2luKFwiJlwiKX1gIDogYCR7dXJsfT8ke3Jlc3VsdC5qb2luKFwiJlwiKX1gO1xuICAgIH1cbiAgICAvKipcbiAgICAgKiBNYWtlcyBhbiBBamF4IGNhbGwgdG8gdGFyZ2V0IHJlc291cmNlLCBhbmQgcmV0dXJucyB0aGUgcmVzdWx0cyBhcyBhIEpTT04gYXJyYXkuXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IHVybCB1cmwuXG4gICAgICogQHBhcmFtIHtPYmplY3R9IHBhcmFtZXRlcnMga2V5L3ZhbHVlIHF1ZXJ5IHN0cmluZyBwYWlycy5cbiAgICAgKiBAcmV0dXJucyB7QXJyYXkgfCBPYmplY3R9XG4gICAgICovXG4gICAgYXN5bmMgcmVxdWVzdERhdGEodXJsLCBwYXJhbWV0ZXJzID0ge30pIHtcbiAgICAgICAgbGV0IHJlc3VsdCA9IFtdO1xuICAgICAgICBjb25zdCB0YXJnZXRVcmwgPSB0aGlzLmJ1aWxkVXJsKHVybCwgcGFyYW1ldGVycyk7XG5cbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGNvbnN0IHJlc3BvbnNlID0gYXdhaXQgZmV0Y2godGFyZ2V0VXJsLCB7IFxuICAgICAgICAgICAgICAgIG1ldGhvZDogXCJHRVRcIiwgXG4gICAgICAgICAgICAgICAgbW9kZTogXCJjb3JzXCIsXG4gICAgICAgICAgICAgICAgaGVhZGVyczogeyBBY2NlcHQ6IFwiYXBwbGljYXRpb24vanNvblwiIH0gXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgaWYgKHJlc3BvbnNlLm9rKSB7XG4gICAgICAgICAgICAgICAgcmVzdWx0ID0gYXdhaXQgcmVzcG9uc2UuanNvbigpO1xuICAgICAgICAgICAgfSBcbiAgICAgICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICAgICAgICB3aW5kb3cuYWxlcnQoZXJyLm1lc3NhZ2UpO1xuICAgICAgICAgICAgY29uc29sZS5sb2coZXJyLm1lc3NhZ2UpO1xuICAgICAgICAgICAgcmVzdWx0ID0gW107XG4gICAgICAgIH1cbiAgXG4gICAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgfVxuICAgIC8qKlxuICAgICAqIE1ha2VzIGFuIEFqYXggY2FsbCB0byB0YXJnZXQgcmVzb3VyY2UgaWRlbnRpZmllZCBpbiB0aGUgYGFqYXhVcmxgIFNldHRpbmdzIHByb3BlcnR5LCBhbmQgcmV0dXJucyB0aGUgcmVzdWx0cyBhcyBhIEpTT04gYXJyYXkuXG4gICAgICogQHBhcmFtIHtPYmplY3R9IFtwYXJhbWV0ZXJzPXt9XSBrZXkvdmFsdWUgcXVlcnkgc3RyaW5nIHBhaXJzLlxuICAgICAqIEByZXR1cm5zIHtBcnJheSB8IE9iamVjdH1cbiAgICAgKi9cbiAgICBhc3luYyByZXF1ZXN0R3JpZERhdGEocGFyYW1ldGVycyA9IHt9KSB7XG4gICAgICAgIHJldHVybiB0aGlzLnJlcXVlc3REYXRhKHRoaXMuYWpheFVybCwgcGFyYW1ldGVycyk7XG4gICAgfVxufVxuXG5leHBvcnQgeyBEYXRhTG9hZGVyIH07IiwiLyoqXG4gKiBQcm92aWRlcyBtZXRob2RzIHRvIHN0b3JlIGFuZCBwZXJzaXN0IGRhdGEgZm9yIHRoZSBncmlkLlxuICovXG5jbGFzcyBEYXRhUGVyc2lzdGVuY2Uge1xuICAgIC8qKlxuICAgICAqIENyZWF0ZXMgY2xhc3Mgb2JqZWN0IHRvIHN0b3JlIGFuZCBwZXJzaXN0IGdyaWQgZGF0YS5cbiAgICAgKiBAcGFyYW0ge0FycmF5PE9iamVjdD59IGRhdGEgcm93IGRhdGEuXG4gICAgICovXG4gICAgY29uc3RydWN0b3IoZGF0YSkge1xuICAgICAgICB0aGlzLmRhdGEgPSBkYXRhO1xuICAgICAgICB0aGlzLmRhdGFDYWNoZSA9IGRhdGEubGVuZ3RoID4gMCA/IHN0cnVjdHVyZWRDbG9uZShkYXRhKSA6IFtdO1xuICAgIH1cbiAgICAvKipcbiAgICAgKiBSZXR1cm5zIHRoZSByb3cgZGF0YS5cbiAgICAgKiBAcmV0dXJucyB7bnVtYmVyfSBDb3VudCBvZiByb3dzIGluIHRoZSBkYXRhLlxuICAgICAqL1xuICAgIGdldCByb3dDb3VudCgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuZGF0YS5sZW5ndGg7XG4gICAgfVxuICAgIC8qKlxuICAgICAqIFNhdmVzIHRoZSBkYXRhIHRvIHRoZSBjbGFzcyBvYmplY3QuICBXaWxsIGFsc28gY2FjaGUgYSBjb3B5IG9mIHRoZSBkYXRhIGZvciBsYXRlciByZXN0b3JhdGlvbiBpZiBmaWx0ZXJpbmcgb3Igc29ydGluZyBpcyBhcHBsaWVkLlxuICAgICAqIEBwYXJhbSB7QXJyYXk8b2JqZWN0Pn0gZGF0YSBEYXRhIHNldC5cbiAgICAgKi9cbiAgICBzZXREYXRhID0gKGRhdGEpID0+IHtcbiAgICAgICAgaWYgKCFBcnJheS5pc0FycmF5KGRhdGEpKSB7XG4gICAgICAgICAgICB0aGlzLmRhdGEgPSBbXTtcbiAgICAgICAgICAgIHRoaXMuZGF0YUNhY2hlID0gW107XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLmRhdGEgPSBkYXRhO1xuICAgICAgICB0aGlzLmRhdGFDYWNoZSA9IGRhdGEubGVuZ3RoID4gMCA/IHN0cnVjdHVyZWRDbG9uZShkYXRhKSA6IFtdO1xuICAgIH07XG4gICAgLyoqXG4gICAgICogUmVzZXRzIHRoZSBkYXRhIHRvIHRoZSBvcmlnaW5hbCBzdGF0ZSB3aGVuIHRoZSBjbGFzcyB3YXMgY3JlYXRlZC5cbiAgICAgKi9cbiAgICByZXN0b3JlRGF0YSgpIHtcbiAgICAgICAgdGhpcy5kYXRhID0gc3RydWN0dXJlZENsb25lKHRoaXMuZGF0YUNhY2hlKTtcbiAgICB9XG59XG5cbmV4cG9ydCB7IERhdGFQZXJzaXN0ZW5jZSB9OyIsIi8qKlxuICogQ2xhc3MgdGhhdCBhbGxvd3MgdGhlIHN1YnNjcmlwdGlvbiBhbmQgcHVibGljYXRpb24gb2YgZ3JpZCByZWxhdGVkIGV2ZW50cy5cbiAqIEBjbGFzc1xuICovXG5jbGFzcyBHcmlkRXZlbnRzIHtcbiAgICAjZXZlbnRzO1xuXG4gICAgY29uc3RydWN0b3IoKSB7XG4gICAgICAgIHRoaXMuI2V2ZW50cyA9IHt9O1xuICAgIH1cblxuICAgICNndWFyZChldmVudE5hbWUpIHtcbiAgICAgICAgaWYgKCF0aGlzLiNldmVudHMpIHJldHVybiBmYWxzZTtcblxuICAgICAgICByZXR1cm4gKHRoaXMuI2V2ZW50c1tldmVudE5hbWVdKTtcbiAgICB9XG4gICAgLyoqXG4gICAgICogQWRkcyBhbiBldmVudCB0byBwdWJsaXNoZXIgY29sbGVjdGlvbi5cbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gZXZlbnROYW1lIEV2ZW50IG5hbWUuXG4gICAgICogQHBhcmFtIHtGdW5jdGlvbn0gaGFuZGxlciBDYWxsYmFjayBmdW5jdGlvbi5cbiAgICAgKiBAcGFyYW0ge2Jvb2xlYW59IFtpc0FzeW5jPWZhbHNlXSBUcnVlIGlmIGNhbGxiYWNrIHNob3VsZCBleGVjdXRlIHdpdGggYXdhaXQgb3BlcmF0aW9uLlxuICAgICAqIEBwYXJhbSB7bnVtYmVyfSBbcHJpb3JpdHk9MF0gT3JkZXIgaW4gd2hpY2ggZXZlbnQgc2hvdWxkIGJlIGV4ZWN1dGVkLlxuICAgICAqL1xuICAgIHN1YnNjcmliZShldmVudE5hbWUsIGhhbmRsZXIsIGlzQXN5bmMgPSBmYWxzZSwgcHJpb3JpdHkgPSAwKSB7XG4gICAgICAgIGlmICghdGhpcy4jZXZlbnRzW2V2ZW50TmFtZV0pIHtcbiAgICAgICAgICAgIHRoaXMuI2V2ZW50c1tldmVudE5hbWVdID0gW3sgaGFuZGxlciwgcHJpb3JpdHksIGlzQXN5bmMgfV07XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIHRoaXMuI2V2ZW50c1tldmVudE5hbWVdLnB1c2goeyBoYW5kbGVyLCBwcmlvcml0eSwgaXNBc3luYyB9KTtcbiAgICAgICAgdGhpcy4jZXZlbnRzW2V2ZW50TmFtZV0uc29ydCgoYSwgYikgPT4ge1xuICAgICAgICAgICAgcmV0dXJuIGEucHJpb3JpdHkgLSBiLnByaW9yaXR5O1xuICAgICAgICB9KTtcbiAgICB9XG4gICAgLyoqXG4gICAgICogUmVtb3ZlcyB0aGUgdGFyZ2V0IGV2ZW50IGZyb20gdGhlIHB1YmxpY2F0aW9uIGNoYWluLlxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBldmVudE5hbWUgRXZlbnQgbmFtZS5cbiAgICAgKiBAcGFyYW0ge0Z1bmN0aW9ufSBoYW5kbGVyIEV2ZW50IGhhbmRsZXIuXG4gICAgICovXG4gICAgdW5zdWJzY3JpYmUoZXZlbnROYW1lLCBoYW5kbGVyKSB7XG4gICAgICAgIGlmICghdGhpcy4jZ3VhcmQoZXZlbnROYW1lKSkgcmV0dXJuO1xuXG4gICAgICAgIHRoaXMuI2V2ZW50c1tldmVudE5hbWVdID0gdGhpcy4jZXZlbnRzW2V2ZW50TmFtZV0uZmlsdGVyKGggPT4gaCAhPT0gaGFuZGxlcik7XG4gICAgfVxuICAgIC8qKlxuICAgICAqIFRha2VzIHRoZSByZXN1bHQgb2YgZWFjaCBzdWJzY3JpYmVyJ3MgY2FsbGJhY2sgZnVuY3Rpb24gYW5kIGNoYWlucyB0aGVtIGludG8gb25lIHJlc3VsdC5cbiAgICAgKiBVc2VkIHRvIGNyZWF0ZSBhIGxpc3Qgb2YgcGFyYW1ldGVycyBmcm9tIG11bHRpcGxlIG1vZHVsZXM6IGkuZS4gc29ydCwgZmlsdGVyLCBhbmQgcGFnaW5nIGlucHV0cy5cbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gZXZlbnROYW1lIGV2ZW50IG5hbWVcbiAgICAgKiBAcGFyYW0ge09iamVjdH0gW2luaXRpYWxWYWx1ZT17fV0gaW5pdGlhbCB2YWx1ZVxuICAgICAqIEByZXR1cm5zIHtPYmplY3R9XG4gICAgICovXG4gICAgY2hhaW4oZXZlbnROYW1lLCBpbml0aWFsVmFsdWUgPSB7fSkge1xuICAgICAgICBpZiAoIXRoaXMuI2d1YXJkKGV2ZW50TmFtZSkpIHJldHVybjtcblxuICAgICAgICBsZXQgcmVzdWx0ID0gaW5pdGlhbFZhbHVlO1xuXG4gICAgICAgIHRoaXMuI2V2ZW50c1tldmVudE5hbWVdLmZvckVhY2goKGgpID0+IHtcbiAgICAgICAgICAgIHJlc3VsdCA9IGguaGFuZGxlcihyZXN1bHQpO1xuICAgICAgICB9KTtcblxuICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgIH1cbiAgICAvKipcbiAgICAgKiBUcmlnZ2VyIGNhbGxiYWNrIGZ1bmN0aW9uIGZvciBzdWJzY3JpYmVycyBvZiB0aGUgYGV2ZW50TmFtZWAuXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IGV2ZW50TmFtZSBFdmVudCBuYW1lLlxuICAgICAqIEBwYXJhbSAgey4uLmFueX0gYXJncyBBcmd1bWVudHMuXG4gICAgICovXG4gICAgYXN5bmMgdHJpZ2dlcihldmVudE5hbWUsIC4uLmFyZ3MpIHtcbiAgICAgICAgaWYgKCF0aGlzLiNndWFyZChldmVudE5hbWUpKSByZXR1cm47XG5cbiAgICAgICAgZm9yIChsZXQgaCBvZiB0aGlzLiNldmVudHNbZXZlbnROYW1lXSkge1xuICAgICAgICAgICAgaWYgKGguaXNBc3luYykge1xuICAgICAgICAgICAgICAgIGF3YWl0IGguaGFuZGxlciguLi5hcmdzKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgaC5oYW5kbGVyKC4uLmFyZ3MpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxufVxuXG5leHBvcnQgeyBHcmlkRXZlbnRzIH07IiwiY2xhc3MgRGF0ZUhlbHBlciB7XG4gICAgc3RhdGljIHRpbWVSZUdleCA9IG5ldyBSZWdFeHAoXCJbMC05XTpbMC05XVwiKTtcbiAgICAvKipcbiAgICAgKiBDb252ZXJ0IHN0cmluZyB0byBEYXRlIG9iamVjdCB0eXBlLiAgRXhwZWN0cyBzdHJpbmcgZm9ybWF0IG9mIHllYXItbW9udGgtZGF5LlxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSB2YWx1ZSBTdHJpbmcgZGF0ZSB3aXRoIGZvcm1hdCBvZiB5ZWFyLW1vbnRoLWRheS5cbiAgICAgKiBAcmV0dXJucyB7RGF0ZSB8IHN0cmluZ30gRGF0ZSBpZiBjb252ZXJzaW9uIGlzIHN1Y2Nlc3NmdWwuICBPdGhlcndpc2UsIGVtcHR5IHN0cmluZy5cbiAgICAgKi9cbiAgICBzdGF0aWMgcGFyc2VEYXRlKHZhbHVlKSB7XG4gICAgICAgIC8vQ2hlY2sgaWYgc3RyaW5nIGlzIGRhdGUgb25seSBieSBsb29raW5nIGZvciBtaXNzaW5nIHRpbWUgY29tcG9uZW50LiAgXG4gICAgICAgIC8vSWYgbWlzc2luZywgYWRkIGl0IHNvIGRhdGUgaXMgaW50ZXJwcmV0ZWQgYXMgbG9jYWwgdGltZS5cbiAgICAgICAgaWYgKCF0aGlzLnRpbWVSZUdleC50ZXN0KHZhbHVlKSkge1xuICAgICAgICAgICAgdmFsdWUgPSBgJHt2YWx1ZX1UMDA6MDBgO1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc3QgZGF0ZSA9IG5ldyBEYXRlKHZhbHVlKTtcbiAgICAgICAgXG4gICAgICAgIHJldHVybiAoTnVtYmVyLmlzTmFOKGRhdGUudmFsdWVPZigpKSkgPyBcIlwiIDogZGF0ZTtcbiAgICB9XG4gICAgLyoqXG4gICAgICogQ29udmVydCBzdHJpbmcgdG8gRGF0ZSBvYmplY3QgdHlwZSwgc2V0dGluZyB0aGUgdGltZSBjb21wb25lbnQgdG8gbWlkbmlnaHQuICBFeHBlY3RzIHN0cmluZyBmb3JtYXQgb2YgeWVhci1tb250aC1kYXkuXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IHZhbHVlIFN0cmluZyBkYXRlIHdpdGggZm9ybWF0IG9mIHllYXItbW9udGgtZGF5LlxuICAgICAqIEByZXR1cm5zIHtEYXRlIHwgc3RyaW5nfSBEYXRlIGlmIGNvbnZlcnNpb24gaXMgc3VjY2Vzc2Z1bC4gIE90aGVyd2lzZSwgZW1wdHkgc3RyaW5nLlxuICAgICAqL1xuICAgIHN0YXRpYyBwYXJzZURhdGVPbmx5KHZhbHVlKSB7XG4gICAgICAgIGNvbnN0IGRhdGUgPSB0aGlzLnBhcnNlRGF0ZSh2YWx1ZSk7XG5cbiAgICAgICAgaWYgKGRhdGUgPT09IFwiXCIpIHJldHVybiBcIlwiOyAgLy9JbnZhbGlkIGRhdGUuXG5cbiAgICAgICAgZGF0ZS5zZXRIb3VycygwLCAwLCAwLCAwKTsgLy9TZXQgdGltZSB0byBtaWRuaWdodCB0byByZW1vdmUgdGltZSBjb21wb25lbnQuXG5cbiAgICAgICAgcmV0dXJuIGRhdGU7XG4gICAgfVxuXG4gICAgc3RhdGljIGlzRGF0ZSh2YWx1ZSkgeyBcbiAgICAgICAgcmV0dXJuIE9iamVjdC5wcm90b3R5cGUudG9TdHJpbmcuY2FsbCh2YWx1ZSkgPT09IFwiW29iamVjdCBEYXRlXVwiO1xuXG4gICAgfVxuXG59XG5cbmV4cG9ydCB7IERhdGVIZWxwZXIgfTsiLCJpbXBvcnQgeyBEYXRlSGVscGVyIH0gZnJvbSBcIi4uLy4uL2hlbHBlcnMvZGF0ZUhlbHBlci5qc1wiO1xuLyoqXG4gKiBQcm92aWRlcyBtZXRob2RzIHRvIGZvcm1hdCBkYXRlIGFuZCB0aW1lIHN0cmluZ3MuICBFeHBlY3RzIGRhdGUgc3RyaW5nIGluIGZvcm1hdCBvZiB5ZWFyLW1vbnRoLWRheS5cbiAqL1xuY2xhc3MgRm9ybWF0RGF0ZVRpbWUge1xuICAgIHN0YXRpYyBtb250aHNMb25nID0gW1wiSmFudWFyeVwiLCBcIkZlYnJ1YXJ5XCIsIFwiTWFyY2hcIiwgXCJBcHJpbFwiLCBcIk1heVwiLCBcIkp1bmVcIiwgXCJKdWx5XCIsIFwiQXVndXN0XCIsIFwiU2VwdGVtYmVyXCIsIFwiT2N0b2JlclwiLCBcIk5vdmVtYmVyXCIsIFwiRGVjZW1iZXJcIl07XG4gICAgc3RhdGljIG1vbnRoc1Nob3J0ID0gW1wiSmFuXCIsIFwiRmViXCIsIFwiTWFyXCIsIFwiQXByXCIsIFwiTWF5XCIsIFwiSnVuXCIsIFwiSnVsXCIsIFwiQXVnXCIsIFwiU2VwXCIsIFwiT2N0XCIsIFwiTm92XCIsIFwiRGVjXCJdO1xuXG4gICAgc3RhdGljIGxlYWRpbmdaZXJvKG51bSkge1xuICAgICAgICByZXR1cm4gbnVtIDwgMTAgPyBcIjBcIiArIG51bSA6IG51bTtcbiAgICB9XG4gICAgLyoqXG4gICAgICogUmV0dXJucyBhIGZvcm1hdHRlZCBkYXRlIHRpbWUgc3RyaW5nLiAgRXhwZWN0cyBkYXRlIHN0cmluZyBpbiBmb3JtYXQgb2YgeWVhci1tb250aC1kYXkuICBJZiBgZm9ybWF0dGVyUGFyYW1zYCBpcyBlbXB0eSwgXG4gICAgICogZnVuY3Rpb24gd2lsbCByZXZlcnQgdG8gZGVmYXVsdCB2YWx1ZXMuIEV4cGVjdGVkIHByb3BlcnR5IHZhbHVlcyBpbiBgZm9ybWF0dGVyUGFyYW1zYCBvYmplY3Q6XG4gICAgICogLSBkYXRlRmllbGQ6IGZpZWxkIHRvIGNvbnZlcnQgZGF0ZSB0aW1lLlxuICAgICAqIC0gZm9ybWF0OiBzdHJpbmcgZm9ybWF0IHRlbXBsYXRlLlxuICAgICAqIEBwYXJhbSB7T2JqZWN0fSByb3dEYXRhIFJvdyBkYXRhLlxuICAgICAqIEBwYXJhbSB7Q29sdW1ufSBjb2x1bW4gQ29sdW1uIGNsYXNzIG9iamVjdC5cbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gZGVmYXVsdEZvcm1hdCBEZWZhdWx0IHN0cmluZyBmb3JtYXQ6IE1NL2RkL3l5eXlcbiAgICAgKiBAcGFyYW0ge2Jvb2xlYW59IFthZGRUaW1lPWZhbHNlXSBBcHBseSBkYXRlIHRpbWUgZm9ybWF0dGluZz9cbiAgICAgKiBAcmV0dXJucyB7c3RyaW5nfVxuICAgICAqL1xuICAgIHN0YXRpYyBhcHBseShyb3dEYXRhLCBjb2x1bW4sIGRlZmF1bHRGb3JtYXQgPSBcIk1NL2RkL3l5eXlcIiwgYWRkVGltZSA9IGZhbHNlKSB7XG4gICAgICAgIGxldCByZXN1bHQgPSBjb2x1bW4/LmZvcm1hdHRlclBhcmFtcz8uZm9ybWF0ID8/IGRlZmF1bHRGb3JtYXQ7XG4gICAgICAgIGxldCBmaWVsZCA9IGNvbHVtbj8uZm9ybWF0dGVyUGFyYW1zPy5kYXRlRmllbGQgXG4gICAgICAgICAgICA/IHJvd0RhdGFbY29sdW1uLmZvcm1hdHRlclBhcmFtcy5kYXRlRmllbGRdXG4gICAgICAgICAgICA6IHJvd0RhdGFbY29sdW1uLmZpZWxkXTtcblxuICAgICAgICBpZiAoZmllbGQgPT09IG51bGwpIHtcbiAgICAgICAgICAgIHJldHVybiBcIlwiO1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc3QgZGF0ZSA9IERhdGVIZWxwZXIucGFyc2VEYXRlKGZpZWxkKTtcblxuICAgICAgICBpZiAoZGF0ZSA9PT0gXCJcIikge1xuICAgICAgICAgICAgcmV0dXJuIFwiXCI7XG4gICAgICAgIH1cblxuICAgICAgICBsZXQgZm9ybWF0cyA9IHtcbiAgICAgICAgICAgIGQ6IGRhdGUuZ2V0RGF0ZSgpLFxuICAgICAgICAgICAgZGQ6IHRoaXMubGVhZGluZ1plcm8oZGF0ZS5nZXREYXRlKCkpLFxuXG4gICAgICAgICAgICBNOiBkYXRlLmdldE1vbnRoKCkgKyAxLFxuICAgICAgICAgICAgTU06IHRoaXMubGVhZGluZ1plcm8oZGF0ZS5nZXRNb250aCgpICsgMSksXG4gICAgICAgICAgICBNTU06IHRoaXMubW9udGhzU2hvcnRbZGF0ZS5nZXRNb250aCgpXSxcbiAgICAgICAgICAgIE1NTU06IHRoaXMubW9udGhzTG9uZ1tkYXRlLmdldE1vbnRoKCldLFxuXG4gICAgICAgICAgICB5eTogZGF0ZS5nZXRGdWxsWWVhcigpLnRvU3RyaW5nKCkuc2xpY2UoLTIpLFxuICAgICAgICAgICAgeXl5eTogZGF0ZS5nZXRGdWxsWWVhcigpXG4gICAgICAgIH07XG5cbiAgICAgICAgaWYgKGFkZFRpbWUpIHtcbiAgICAgICAgICAgIGxldCBob3VycyA9IGRhdGUuZ2V0SG91cnMoKTtcbiAgICAgICAgICAgIGxldCBob3VyczEyID0gaG91cnMgJSAxMiA9PT0gMCA/IDEyIDogaG91cnMgJSAxMjtcblxuICAgICAgICAgICAgZm9ybWF0cy5zID0gZGF0ZS5nZXRTZWNvbmRzKCk7XG4gICAgICAgICAgICBmb3JtYXRzLnNzID0gdGhpcy5sZWFkaW5nWmVybyhkYXRlLmdldFNlY29uZHMoKSk7XG4gICAgICAgICAgICBmb3JtYXRzLm0gPSBkYXRlLmdldE1pbnV0ZXMoKTtcbiAgICAgICAgICAgIGZvcm1hdHMubW0gPSB0aGlzLmxlYWRpbmdaZXJvKGRhdGUuZ2V0TWludXRlcygpKTtcbiAgICAgICAgICAgIGZvcm1hdHMuaCA9IGhvdXJzMTI7XG4gICAgICAgICAgICBmb3JtYXRzLmhoID0gIHRoaXMubGVhZGluZ1plcm8oaG91cnMxMik7XG4gICAgICAgICAgICBmb3JtYXRzLkggPSBob3VycztcbiAgICAgICAgICAgIGZvcm1hdHMuSEggPSB0aGlzLmxlYWRpbmdaZXJvKGhvdXJzKTtcbiAgICAgICAgICAgIGZvcm1hdHMuaHAgPSBob3VycyA8IDEyID8gXCJBTVwiIDogXCJQTVwiO1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc3QgdGFyZ2V0cyA9IHJlc3VsdC5zcGxpdCgvXFwvfC18XFxzfDovKTtcblxuICAgICAgICBmb3IgKGxldCBpdGVtIG9mIHRhcmdldHMpIHtcbiAgICAgICAgICAgIHJlc3VsdCA9IHJlc3VsdC5yZXBsYWNlKGl0ZW0sIGZvcm1hdHNbaXRlbV0pO1xuICAgICAgICB9XG4gICAgXG4gICAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgfVxufVxuXG5leHBvcnQgeyBGb3JtYXREYXRlVGltZSB9OyIsIi8qKlxuICogUHJvdmlkZXMgbWV0aG9kIHRvIGZvcm1hdCBhIGxpbmsgYXMgYW4gYW5jaG9yIHRhZyBlbGVtZW50LlxuICovXG5jbGFzcyBGb3JtYXRMaW5rIHtcbiAgICAvKipcbiAgICAgKiBGb3JtYXR0ZXIgdGhhdCBjcmVhdGUgYW4gYW5jaG9yIHRhZyBlbGVtZW50LiBocmVmIGFuZCBvdGhlciBhdHRyaWJ1dGVzIGNhbiBiZSBtb2RpZmllZCB3aXRoIHByb3BlcnRpZXMgaW4gdGhlIFxuICAgICAqICdmb3JtYXR0ZXJQYXJhbXMnIHBhcmFtZXRlci4gIEV4cGVjdGVkIHByb3BlcnR5IHZhbHVlczogXG4gICAgICogLSB1cmxQcmVmaXg6IEJhc2UgdXJsIGFkZHJlc3MuXG4gICAgICogLSByb3V0ZUZpZWxkOiBSb3V0ZSB2YWx1ZS5cbiAgICAgKiAtIHF1ZXJ5RmllbGQ6IEZpZWxkIG5hbWUgZnJvbSBkYXRhc2V0IHRvIGJ1aWxkIHF1ZXJ5IHN0aW5nIGtleS92YWx1ZSBpbnB1dC5cbiAgICAgKiAtIGZpZWxkVGV4dDogVXNlIGZpZWxkIG5hbWUgdG8gc2V0IGlubmVyIHRleHQgdG8gYXNzb2NpYXRlZCBkYXRhc2V0IHZhbHVlLlxuICAgICAqIC0gaW5uZXJUZXh0OiBSYXcgaW5uZXIgdGV4dCB2YWx1ZSBvciBmdW5jdGlvbi4gIElmIGZ1bmN0aW9uIGlzIHByb3ZpZGVkLCBpdCB3aWxsIGJlIGNhbGxlZCB3aXRoIHJvd0RhdGEgYW5kIGZvcm1hdHRlclBhcmFtcyBhcyBwYXJhbWV0ZXJzLlxuICAgICAqIC0gdGFyZ2V0OiBIb3cgdGFyZ2V0IGRvY3VtZW50IHNob3VsZCBiZSBvcGVuZWQuXG4gICAgICogQHBhcmFtIHtPYmplY3R9IHJvd0RhdGEgUm93IGRhdGEuXG4gICAgICogQHBhcmFtIHt7IHVybFByZWZpeDogc3RyaW5nLCBxdWVyeUZpZWxkOiBzdHJpbmcsIGZpZWxkVGV4dDogc3RyaW5nLCBpbm5lclRleHQ6IHN0cmluZyB8IEZ1bmN0aW9uLCB0YXJnZXQ6IHN0cmluZyB9fSBmb3JtYXR0ZXJQYXJhbXMgU2V0dGluZ3MuXG4gICAgICogQHJldHVybiB7SFRNTEFuY2hvckVsZW1lbnR9IGFuY2hvciB0YWcgZWxlbWVudC5cbiAgICAgKiAqL1xuICAgIHN0YXRpYyBhcHBseShyb3dEYXRhLCBmb3JtYXR0ZXJQYXJhbXMpIHtcbiAgICAgICAgY29uc3QgZWwgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiYVwiKTtcblxuICAgICAgICBsZXQgdXJsID0gZm9ybWF0dGVyUGFyYW1zLnVybFByZWZpeDtcbiAgICAgICAgLy9BcHBseSByb3V0ZSB2YWx1ZSBiZWZvcmUgcXVlcnkgc3RyaW5nLlxuICAgICAgICBpZiAoZm9ybWF0dGVyUGFyYW1zLnJvdXRlRmllbGQpIHtcbiAgICAgICAgICAgIHVybCArPSBcIi9cIiArIGVuY29kZVVSSUNvbXBvbmVudChyb3dEYXRhW2Zvcm1hdHRlclBhcmFtcy5yb3V0ZUZpZWxkXSk7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoZm9ybWF0dGVyUGFyYW1zLnF1ZXJ5RmllbGQpIHtcbiAgICAgICAgICAgIGNvbnN0IHFyeVZhbHVlID0gZW5jb2RlVVJJQ29tcG9uZW50KHJvd0RhdGFbZm9ybWF0dGVyUGFyYW1zLnF1ZXJ5RmllbGRdKTtcblxuICAgICAgICAgICAgdXJsID0gYCR7dXJsfT8ke2Zvcm1hdHRlclBhcmFtcy5xdWVyeUZpZWxkfT0ke3FyeVZhbHVlfWA7XG4gICAgICAgIH1cblxuICAgICAgICBlbC5ocmVmID0gdXJsO1xuXG4gICAgICAgIGlmIChmb3JtYXR0ZXJQYXJhbXMuZmllbGRUZXh0KSB7XG4gICAgICAgICAgICBlbC5pbm5lckhUTUwgPSByb3dEYXRhW2Zvcm1hdHRlclBhcmFtcy5maWVsZFRleHRdO1xuICAgICAgICB9IGVsc2UgaWYgKCh0eXBlb2YgZm9ybWF0dGVyUGFyYW1zLmlubmVyVGV4dCA9PT0gXCJmdW5jdGlvblwiKSkge1xuICAgICAgICAgICAgZWwuaW5uZXJIVE1MID0gZm9ybWF0dGVyUGFyYW1zLmlubmVyVGV4dChyb3dEYXRhLCBmb3JtYXR0ZXJQYXJhbXMpO1xuICAgICAgICB9IGVsc2UgaWYgKGZvcm1hdHRlclBhcmFtcy5pbm5lclRleHQpIHtcbiAgICAgICAgICAgIGVsLmlubmVySFRNTCA9IGZvcm1hdHRlclBhcmFtcy5pbm5lclRleHQ7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoZm9ybWF0dGVyUGFyYW1zLnRhcmdldCkge1xuICAgICAgICAgICAgZWwuc2V0QXR0cmlidXRlKFwidGFyZ2V0XCIsIGZvcm1hdHRlclBhcmFtcy50YXJnZXQpO1xuICAgICAgICAgICAgZWwuc2V0QXR0cmlidXRlKFwicmVsXCIsIFwibm9vcGVuZXJcIik7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gZWw7XG4gICAgfVxufVxuXG5leHBvcnQgeyBGb3JtYXRMaW5rIH07IiwiLyoqXG4gKiBQcm92aWRlcyBtZXRob2QgdG8gZm9ybWF0IG51bWVyaWMgdmFsdWVzIGludG8gc3RyaW5ncyB3aXRoIHNwZWNpZmllZCBzdHlsZXMgb2YgZGVjaW1hbCwgY3VycmVuY3ksIG9yIHBlcmNlbnQuXG4gKi9cbmNsYXNzIEZvcm1hdE51bWVyaWMge1xuICAgIHN0YXRpYyB2YWxpZFN0eWxlcyA9IFtcImRlY2ltYWxcIiwgXCJjdXJyZW5jeVwiLCBcInBlcmNlbnRcIl07XG4gICAgLyoqXG4gICAgICogUmV0dXJucyBhIGZvcm1hdHRlZCBudW1lcmljIHN0cmluZy4gIEV4cGVjdGVkIHByb3BlcnR5IHZhbHVlczogXG4gICAgICogLSBwcmVjaXNpb246IHJvdW5kaW5nIHByZWNpc2lvbi5cbiAgICAgKiAtIHN0eWxlOiBmb3JtYXR0aW5nIHN0eWxlIHRvIHVzZS5cbiAgICAgKiBAcGFyYW0ge09iamVjdH0gcm93RGF0YSBSb3cgZGF0YS5cbiAgICAgKiBAcGFyYW0ge0NvbHVtbn0gY29sdW1uIENvbHVtbiBjbGFzcyBvYmplY3QuXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IFtzdHlsZT1cImRlY2ltYWxcIl0gRm9ybWF0dGluZyBzdHlsZSB0byB1c2UuIERlZmF1bHQgaXMgXCJkZWNpbWFsXCIuXG4gICAgICogQHBhcmFtIHtudW1iZXJ9IFtwcmVjaXNpb249Ml0gUm91bmRpbmcgcHJlY2lzaW9uLiBEZWZhdWx0IGlzIDIuXG4gICAgICogQHJldHVybnMge3N0cmluZ31cbiAgICAgKi9cbiAgICBzdGF0aWMgYXBwbHkocm93RGF0YSwgY29sdW1uLCBzdHlsZSA9IFwiZGVjaW1hbFwiLCBwcmVjaXNpb24gPSAyKSB7XG4gICAgICAgIGNvbnN0IGZsb2F0VmFsID0gcm93RGF0YVtjb2x1bW4uZmllbGRdO1xuXG4gICAgICAgIGlmIChpc05hTihmbG9hdFZhbCkpIHJldHVybiBmbG9hdFZhbDtcblxuICAgICAgICBpZiAoIXRoaXMudmFsaWRTdHlsZXMuaW5jbHVkZXMoc3R5bGUpKSB7XG4gICAgICAgICAgICBzdHlsZSA9IFwiZGVjaW1hbFwiO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIG5ldyBJbnRsLk51bWJlckZvcm1hdChcImVuLVVTXCIsIHtcbiAgICAgICAgICAgIHN0eWxlOiBzdHlsZSxcbiAgICAgICAgICAgIG1heGltdW1GcmFjdGlvbkRpZ2l0czogcHJlY2lzaW9uLFxuICAgICAgICAgICAgY3VycmVuY3k6IFwiVVNEXCJcbiAgICAgICAgfSkuZm9ybWF0KGZsb2F0VmFsKTtcbiAgICB9XG59XG5cbmV4cG9ydCB7IEZvcm1hdE51bWVyaWMgfTsiLCJjbGFzcyBGb3JtYXRTdGFyIHtcbiAgICAvKipcbiAgICAgKiBSZXR1cm5zIGFuIGVsZW1lbnQgb2Ygc3RhciByYXRpbmdzIGJhc2VkIG9uIGludGVnZXIgdmFsdWVzLiAgRXhwZWN0ZWQgcHJvcGVydHkgdmFsdWVzOiBcbiAgICAgKiAtIHN0YXJzOiBudW1iZXIgb2Ygc3RhcnMgdG8gZGlzcGxheS5cbiAgICAgKiBAcGFyYW0ge09iamVjdH0gcm93RGF0YSByb3cgZGF0YS5cbiAgICAgKiBAcGFyYW0ge0NvbHVtbn0gY29sdW1uIGNvbHVtbiBjbGFzcyBvYmplY3QuXG4gICAgICogQHJldHVybnMge0hUTUxEaXZFbGVtZW50fVxuICAgICAqL1xuICAgIHN0YXRpYyBhcHBseShyb3dEYXRhLCBjb2x1bW4pIHtcbiAgICAgICAgbGV0IHZhbHVlID0gcm93RGF0YVtjb2x1bW4uZmllbGRdO1xuICAgICAgICBjb25zdCBtYXhTdGFycyA9IGNvbHVtbi5mb3JtYXR0ZXJQYXJhbXM/LnN0YXJzID8gY29sdW1uLmZvcm1hdHRlclBhcmFtcy5zdGFycyA6IDU7XG4gICAgICAgIGNvbnN0IGNvbnRhaW5lciA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJkaXZcIik7XG4gICAgICAgIGNvbnN0IHN0YXJzID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcInNwYW5cIik7XG4gICAgICAgIGNvbnN0IHN0YXIgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50TlMoXCJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2Z1wiLCBcInN2Z1wiKTtcbiAgICAgICAgY29uc3Qgc3RhckFjdGl2ZSA9ICc8cG9seWdvbiBmaWxsPVwiI0ZGRUEwMFwiIHN0cm9rZT1cIiNDMUFCNjBcIiBzdHJva2Utd2lkdGg9XCIzNy42MTUyXCIgc3Ryb2tlLWxpbmVjYXA9XCJyb3VuZFwiIHN0cm9rZS1saW5lam9pbj1cInJvdW5kXCIgc3Ryb2tlLW1pdGVybGltaXQ9XCIxMFwiIHBvaW50cz1cIjI1OS4yMTYsMjkuOTQyIDMzMC4yNywxNzMuOTE5IDQ4OS4xNiwxOTcuMDA3IDM3NC4xODUsMzA5LjA4IDQwMS4zMyw0NjcuMzEgMjU5LjIxNiwzOTIuNjEyIDExNy4xMDQsNDY3LjMxIDE0NC4yNSwzMDkuMDggMjkuMjc0LDE5Ny4wMDcgMTg4LjE2NSwxNzMuOTE5IFwiLz4nO1xuICAgICAgICBjb25zdCBzdGFySW5hY3RpdmUgPSAnPHBvbHlnb24gZmlsbD1cIiNEMkQyRDJcIiBzdHJva2U9XCIjNjg2ODY4XCIgc3Ryb2tlLXdpZHRoPVwiMzcuNjE1MlwiIHN0cm9rZS1saW5lY2FwPVwicm91bmRcIiBzdHJva2UtbGluZWpvaW49XCJyb3VuZFwiIHN0cm9rZS1taXRlcmxpbWl0PVwiMTBcIiBwb2ludHM9XCIyNTkuMjE2LDI5Ljk0MiAzMzAuMjcsMTczLjkxOSA0ODkuMTYsMTk3LjAwNyAzNzQuMTg1LDMwOS4wOCA0MDEuMzMsNDY3LjMxIDI1OS4yMTYsMzkyLjYxMiAxMTcuMTA0LDQ2Ny4zMSAxNDQuMjUsMzA5LjA4IDI5LjI3NCwxOTcuMDA3IDE4OC4xNjUsMTczLjkxOSBcIi8+JztcblxuICAgICAgICAvL3N0eWxlIHN0YXJzIGhvbGRlclxuICAgICAgICBzdGFycy5zdHlsZS52ZXJ0aWNhbEFsaWduID0gXCJtaWRkbGVcIjtcbiAgICAgICAgLy9zdHlsZSBzdGFyXG4gICAgICAgIHN0YXIuc2V0QXR0cmlidXRlKFwid2lkdGhcIiwgXCIxNFwiKTtcbiAgICAgICAgc3Rhci5zZXRBdHRyaWJ1dGUoXCJoZWlnaHRcIiwgXCIxNFwiKTtcbiAgICAgICAgc3Rhci5zZXRBdHRyaWJ1dGUoXCJ2aWV3Qm94XCIsIFwiMCAwIDUxMiA1MTJcIik7XG4gICAgICAgIHN0YXIuc2V0QXR0cmlidXRlKFwieG1sOnNwYWNlXCIsIFwicHJlc2VydmVcIik7XG4gICAgICAgIHN0YXIuc3R5bGUucGFkZGluZyA9IFwiMCAxcHhcIjtcblxuICAgICAgICB2YWx1ZSA9IHZhbHVlICYmICFpc05hTih2YWx1ZSkgPyBwYXJzZUludCh2YWx1ZSkgOiAwO1xuICAgICAgICB2YWx1ZSA9IE1hdGgubWF4KDAsIE1hdGgubWluKHZhbHVlLCBtYXhTdGFycykpO1xuXG4gICAgICAgIGZvcihsZXQgaSA9IDE7IGkgPD0gbWF4U3RhcnM7IGkrKyl7XG4gICAgICAgICAgICBjb25zdCBuZXh0U3RhciA9IHN0YXIuY2xvbmVOb2RlKHRydWUpO1xuXG4gICAgICAgICAgICBuZXh0U3Rhci5pbm5lckhUTUwgPSBpIDw9IHZhbHVlID8gc3RhckFjdGl2ZSA6IHN0YXJJbmFjdGl2ZTtcblxuICAgICAgICAgICAgc3RhcnMuYXBwZW5kQ2hpbGQobmV4dFN0YXIpO1xuICAgICAgICB9XG5cbiAgICAgICAgY29udGFpbmVyLnN0eWxlLndoaXRlU3BhY2UgPSBcIm5vd3JhcFwiO1xuICAgICAgICBjb250YWluZXIuc3R5bGUub3ZlcmZsb3cgPSBcImhpZGRlblwiO1xuICAgICAgICBjb250YWluZXIuc3R5bGUudGV4dE92ZXJmbG93ID0gXCJlbGxpcHNpc1wiO1xuICAgICAgICBjb250YWluZXIuc2V0QXR0cmlidXRlKFwiYXJpYS1sYWJlbFwiLCB2YWx1ZSk7XG4gICAgICAgIGNvbnRhaW5lci5hcHBlbmQoc3RhcnMpO1xuXG4gICAgICAgIHJldHVybiBjb250YWluZXI7XG4gICAgfVxufVxuXG5leHBvcnQgeyBGb3JtYXRTdGFyIH07IiwiZXhwb3J0IGNvbnN0IGNzc0hlbHBlciA9IHtcbiAgICB0b29sdGlwOiBcImRhdGFncmlkcy10b29sdGlwXCIsXG4gICAgbXVsdGlTZWxlY3Q6IHtcbiAgICAgICAgcGFyZW50Q2xhc3M6IFwiZGF0YWdyaWRzLW11bHRpLXNlbGVjdFwiLFxuICAgICAgICBoZWFkZXI6IFwiZGF0YWdyaWRzLW11bHRpLXNlbGVjdC1oZWFkZXJcIixcbiAgICAgICAgaGVhZGVyQWN0aXZlOiBcImRhdGFncmlkcy1tdWx0aS1zZWxlY3QtaGVhZGVyLWFjdGl2ZVwiLFxuICAgICAgICBoZWFkZXJPcHRpb246IFwiZGF0YWdyaWRzLW11bHRpLXNlbGVjdC1oZWFkZXItb3B0aW9uXCIsXG4gICAgICAgIG9wdGlvbnM6IFwiZGF0YWdyaWRzLW11bHRpLXNlbGVjdC1vcHRpb25zXCIsXG4gICAgICAgIG9wdGlvbjogXCJkYXRhZ3JpZHMtbXVsdGktc2VsZWN0LW9wdGlvblwiLFxuICAgICAgICBvcHRpb25UZXh0OiBcImRhdGFncmlkcy1tdWx0aS1zZWxlY3Qtb3B0aW9uLXRleHRcIixcbiAgICAgICAgb3B0aW9uUmFkaW86IFwiZGF0YWdyaWRzLW11bHRpLXNlbGVjdC1vcHRpb24tcmFkaW9cIixcbiAgICAgICAgc2VsZWN0ZWQ6IFwiZGF0YWdyaWRzLW11bHRpLXNlbGVjdC1zZWxlY3RlZFwiXG4gICAgfSxcbiAgICBpbnB1dDogXCJkYXRhZ3JpZHMtaW5wdXRcIixcbiAgICBiZXR3ZWVuQnV0dG9uOiBcImRhdGFncmlkcy1iZXR3ZWVuLWJ1dHRvblwiLFxuICAgIGJldHdlZW5MYWJlbDogXCJkYXRhZ3JpZHMtYmV0d2Vlbi1pbnB1dC1sYWJlbFwiLFxufTsiLCJpbXBvcnQgeyBGb3JtYXREYXRlVGltZSB9IGZyb20gXCIuL2Zvcm1hdHRlcnMvZGF0ZXRpbWUuanNcIjtcbmltcG9ydCB7IEZvcm1hdExpbmsgfSBmcm9tIFwiLi9mb3JtYXR0ZXJzL2xpbmsuanNcIjtcbmltcG9ydCB7IEZvcm1hdE51bWVyaWMgfSBmcm9tIFwiLi9mb3JtYXR0ZXJzL251bWVyaWMuanNcIjtcbmltcG9ydCB7IEZvcm1hdFN0YXIgfSBmcm9tIFwiLi9mb3JtYXR0ZXJzL3N0YXIuanNcIjtcbmltcG9ydCB7IGNzc0hlbHBlciB9IGZyb20gXCIuLi9oZWxwZXJzL2Nzc0hlbHBlci5qc1wiO1xuXG5jbGFzcyBDZWxsIHtcbiAgICAvKipcbiAgICAgKiBDcmVhdGUgY2VsbCBvYmplY3QgdGhhdCByZXByZXNlbnRzIHRoZSBgdGRgIHRhYmxlIGJvZHkgZWxlbWVudC5cbiAgICAgKiBAcGFyYW0ge0FycmF5PG9iamVjdD59IHJvd0RhdGEgUm93IGRhdGEuXG4gICAgICogQHBhcmFtIHtDb2x1bW59IGNvbHVtbiBDb2x1bW4gb2JqZWN0LlxuICAgICAqIEBwYXJhbSB7T2JqZWN0fSBtb2R1bGVzIEdyaWQgbW9kdWxlKHMpIGFkZGVkIGJ5IHVzZXIgZm9yIGN1c3RvbSBmb3JtYXR0aW5nLlxuICAgICAqIEBwYXJhbSB7SFRNTFRhYmxlUm93RWxlbWVudH0gcm93IFRhYmxlIHJvdyBgdHJgIGVsZW1lbnQuXG4gICAgICovXG4gICAgY29uc3RydWN0b3Iocm93RGF0YSwgY29sdW1uLCBtb2R1bGVzLCByb3cpIHtcbiAgICAgICAgdGhpcy5lbGVtZW50ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcInRkXCIpO1xuXG4gICAgICAgIGlmIChjb2x1bW4uZm9ybWF0dGVyKSB7XG4gICAgICAgICAgICB0aGlzLiNpbml0KHJvd0RhdGEsIGNvbHVtbiwgbW9kdWxlcywgcm93KTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHRoaXMuZWxlbWVudC5pbm5lclRleHQgPSByb3dEYXRhW2NvbHVtbi5maWVsZF07XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoY29sdW1uLnRvb2x0aXBGaWVsZCkge1xuICAgICAgICAgICAgdGhpcy4jYXBwbHlUb29sdGlwKHJvd0RhdGFbY29sdW1uLnRvb2x0aXBGaWVsZF0sIGNvbHVtbi50b29sdGlwTGF5b3V0KTtcbiAgICAgICAgfVxuICAgIH1cbiAgICAvKipcbiAgICAgKiBBcHBsaWVzIHRvb2x0aXAgZnVuY3Rpb25hbGl0eSB0byB0aGUgY2VsbC4gIElmIHRoZSBjZWxsJ3MgY29udGVudCBjb250YWlucyB0ZXh0IG9ubHksIGl0IHdpbGwgY3JlYXRlIGEgdG9vbHRpcCBcbiAgICAgKiBgc3BhbmAgZWxlbWVudCBhbmQgYXBwbHkgdGhlIGNvbnRlbnQgdG8gaXQuXG4gICAgICogQHBhcmFtIHtzdHJpbmcgfCBudW1iZXIgfCBEYXRlIHwgbnVsbH0gY29udGVudCBUb29sdGlwIGNvbnRlbnQgdG8gYmUgZGlzcGxheWVkLlxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBsYXlvdXQgQ1NTIGNsYXNzIGZvciB0b29sdGlwIGxheW91dCwgZWl0aGVyIFwiZGF0YWdyaWRzLXRvb2x0aXAtcmlnaHRcIiBvciBcImRhdGFncmlkcy10b29sdGlwLWxlZnRcIi5cbiAgICAgKi9cbiAgICAjYXBwbHlUb29sdGlwKGNvbnRlbnQsIGxheW91dCkge1xuICAgICAgICBpZiAoY29udGVudCA9PT0gbnVsbCB8fCBjb250ZW50ID09PSBcIlwiKSByZXR1cm47XG4gICAgICAgIFxuICAgICAgICBsZXQgdG9vbHRpcEVsZW1lbnQgPSB0aGlzLmVsZW1lbnQuZmlyc3RFbGVtZW50Q2hpbGQ7XG5cbiAgICAgICAgaWYgKHRvb2x0aXBFbGVtZW50ID09PSBudWxsKSB7XG4gICAgICAgICAgICB0b29sdGlwRWxlbWVudCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJzcGFuXCIpO1xuICAgICAgICAgICAgdG9vbHRpcEVsZW1lbnQuaW5uZXJUZXh0ID0gdGhpcy5lbGVtZW50LmlubmVyVGV4dDtcbiAgICAgICAgICAgIHRoaXMuZWxlbWVudC5yZXBsYWNlQ2hpbGRyZW4odG9vbHRpcEVsZW1lbnQpO1xuICAgICAgICB9XG5cbiAgICAgICAgdG9vbHRpcEVsZW1lbnQuZGF0YXNldC50b29sdGlwID0gY29udGVudDtcbiAgICAgICAgdG9vbHRpcEVsZW1lbnQuY2xhc3NMaXN0LmFkZChjc3NIZWxwZXIudG9vbHRpcCwgbGF5b3V0KTtcbiAgICB9XG5cbiAgICAjaW5pdChyb3dEYXRhLCBjb2x1bW4sIG1vZHVsZXMsIHJvdykge1xuICAgICAgICBpZiAodHlwZW9mIGNvbHVtbi5mb3JtYXR0ZXIgPT09IFwiZnVuY3Rpb25cIikge1xuICAgICAgICAgICAgdGhpcy5lbGVtZW50LmFwcGVuZChjb2x1bW4uZm9ybWF0dGVyKHJvd0RhdGEsIGNvbHVtbi5mb3JtYXR0ZXJQYXJhbXMsIHRoaXMuZWxlbWVudCwgcm93KSk7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgXG4gICAgICAgIHN3aXRjaCAoY29sdW1uLmZvcm1hdHRlcikge1xuICAgICAgICAgICAgY2FzZSBcImxpbmtcIjpcbiAgICAgICAgICAgICAgICB0aGlzLmVsZW1lbnQuYXBwZW5kKEZvcm1hdExpbmsuYXBwbHkocm93RGF0YSwgY29sdW1uLmZvcm1hdHRlclBhcmFtcykpO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgY2FzZSBcImRhdGVcIjpcbiAgICAgICAgICAgICAgICB0aGlzLmVsZW1lbnQuaW5uZXJUZXh0ID0gRm9ybWF0RGF0ZVRpbWUuYXBwbHkocm93RGF0YSwgY29sdW1uLCBjb2x1bW4uc2V0dGluZ3MuZGF0ZUZvcm1hdCwgZmFsc2UpO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgY2FzZSBcImRhdGV0aW1lXCI6XG4gICAgICAgICAgICAgICAgdGhpcy5lbGVtZW50LmlubmVyVGV4dCA9IEZvcm1hdERhdGVUaW1lLmFwcGx5KHJvd0RhdGEsIGNvbHVtbiwgY29sdW1uLnNldHRpbmdzLmRhdGVUaW1lRm9ybWF0LCB0cnVlKTtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIGNhc2UgXCJtb25leVwiOlxuICAgICAgICAgICAgICAgIHRoaXMuZWxlbWVudC5pbm5lclRleHQgPSBGb3JtYXROdW1lcmljLmFwcGx5KHJvd0RhdGEsIGNvbHVtbiwgXCJjdXJyZW5jeVwiLCAyKTtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIGNhc2UgXCJudW1lcmljXCI6XG4gICAgICAgICAgICAgICAgdGhpcy5lbGVtZW50LmlubmVyVGV4dCA9IEZvcm1hdE51bWVyaWMuYXBwbHkocm93RGF0YSwgY29sdW1uLCBjb2x1bW4uZm9ybWF0dGVyUGFyYW1zPy5zdHlsZSA/PyBcImRlY2ltYWxcIiwgY29sdW1uLmZvcm1hdHRlclBhcmFtcz8ucHJlY2lzaW9uID8/IDIpO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgY2FzZSBcInN0YXJcIjpcbiAgICAgICAgICAgICAgICB0aGlzLmVsZW1lbnQuYXBwZW5kKEZvcm1hdFN0YXIuYXBwbHkocm93RGF0YSwgY29sdW1uKSk7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICBjYXNlIFwibW9kdWxlXCI6XG4gICAgICAgICAgICAgICAgdGhpcy5lbGVtZW50LmFwcGVuZChtb2R1bGVzW2NvbHVtbi5mb3JtYXR0ZXJQYXJhbXMubmFtZV0uYXBwbHkocm93RGF0YSwgY29sdW1uLCByb3csIHRoaXMuZWxlbWVudCkpO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICAgICAgICB0aGlzLmVsZW1lbnQuaW5uZXJUZXh0ID0gcm93RGF0YVtjb2x1bW4uZmllbGRdO1xuICAgICAgICB9XG4gICAgfVxufVxuXG5leHBvcnQgeyBDZWxsIH07IiwiaW1wb3J0IHsgQ2VsbCB9IGZyb20gXCIuLi9jZWxsL2NlbGwuanNcIjtcbi8qKlxuICogQ2xhc3MgdG8gbWFuYWdlIHRoZSB0YWJsZSBlbGVtZW50IGFuZCBpdHMgcm93cyBhbmQgY2VsbHMuXG4gKi9cbmNsYXNzIFRhYmxlIHtcbiAgICAjcm93Q291bnQ7XG4gICAgLyoqXG4gICAgICogQ3JlYXRlIGBUYWJsZWAgY2xhc3MgdG8gbWFuYWdlIHRoZSB0YWJsZSBlbGVtZW50IGFuZCBpdHMgcm93cyBhbmQgY2VsbHMuXG4gICAgICogQHBhcmFtIHtHcmlkQ29udGV4dH0gY29udGV4dCBHcmlkIGNvbnRleHQuXG4gICAgICovXG4gICAgY29uc3RydWN0b3IoY29udGV4dCkge1xuICAgICAgICB0aGlzLmNvbnRleHQgPSBjb250ZXh0O1xuICAgICAgICB0aGlzLnRhYmxlID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcInRhYmxlXCIpO1xuICAgICAgICB0aGlzLnRoZWFkID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcInRoZWFkXCIpO1xuICAgICAgICB0aGlzLnRib2R5ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcInRib2R5XCIpO1xuICAgICAgICB0aGlzLiNyb3dDb3VudCA9IDA7XG5cbiAgICAgICAgdGhpcy50YWJsZS5pZCA9IGAke2NvbnRleHQuc2V0dGluZ3MuYmFzZUlkTmFtZX1fdGFibGVgO1xuICAgICAgICB0aGlzLnRhYmxlLmFwcGVuZCh0aGlzLnRoZWFkLCB0aGlzLnRib2R5KTtcbiAgICAgICAgdGhpcy50YWJsZS5jbGFzc05hbWUgPSBjb250ZXh0LnNldHRpbmdzLnRhYmxlQ3NzO1xuICAgIH1cbiAgICAvKipcbiAgICAgKiBJbml0aWFsaXplcyB0aGUgdGFibGUgaGVhZGVyIHJvdyBlbGVtZW50IGJ5IGNyZWF0aW5nIGEgcm93IGFuZCBhcHBlbmRpbmcgZWFjaCBjb2x1bW4ncyBoZWFkZXIgY2VsbC5cbiAgICAgKi9cbiAgICBpbml0aWFsaXplSGVhZGVyKCkge1xuICAgICAgICBjb25zdCB0ciA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJ0clwiKTtcblxuICAgICAgICBmb3IgKGNvbnN0IGNvbHVtbiBvZiB0aGlzLmNvbnRleHQuY29sdW1uTWFuYWdlci5jb2x1bW5zKSB7XG4gICAgICAgICAgICB0ci5hcHBlbmRDaGlsZChjb2x1bW4uaGVhZGVyQ2VsbC5lbGVtZW50KTtcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMudGhlYWQuYXBwZW5kQ2hpbGQodHIpO1xuICAgIH1cbiAgICAvKipcbiAgICAgKiBSZW5kZXIgdGFibGUgYm9keSByb3dzLiAgV2lsbCByZW1vdmUgYW55IHByaW9yIHRhYmxlIGJvZHkgcmVzdWx0cyBhbmQgYnVpbGQgbmV3IHJvd3MgYW5kIGNlbGxzLlxuICAgICAqIEBwYXJhbSB7QXJyYXk8T2JqZWN0Pn0gZGF0YXNldCBEYXRhIHNldCB0byBidWlsZCB0YWJsZSByb3dzLlxuICAgICAqIEBwYXJhbSB7bnVtYmVyIHwgbnVsbH0gW3Jvd0NvdW50PW51bGxdIFNldCB0aGUgcm93IGNvdW50IHBhcmFtZXRlciB0byBhIHNwZWNpZmljIHZhbHVlIGlmIFxuICAgICAqIHJlbW90ZSBwcm9jZXNzaW5nIGlzIGJlaW5nIHVzZWQsIG90aGVyd2lzZSB3aWxsIHVzZSB0aGUgbGVuZ3RoIG9mIHRoZSBkYXRhc2V0LlxuICAgICAqL1xuICAgIHJlbmRlclJvd3MoZGF0YXNldCwgcm93Q291bnQgPSBudWxsKSB7XG4gICAgICAgIC8vQ2xlYXIgYm9keSBvZiBwcmV2aW91cyBkYXRhLlxuICAgICAgICB0aGlzLnRib2R5LnJlcGxhY2VDaGlsZHJlbigpO1xuICAgICAgICBcbiAgICAgICAgaWYgKCFBcnJheS5pc0FycmF5KGRhdGFzZXQpKSB7XG4gICAgICAgICAgICB0aGlzLiNyb3dDb3VudCA9IDA7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLiNyb3dDb3VudCA9IHJvd0NvdW50ID8/IGRhdGFzZXQubGVuZ3RoO1xuXG4gICAgICAgIGZvciAoY29uc3QgZGF0YSBvZiBkYXRhc2V0KSB7XG4gICAgICAgICAgICBjb25zdCB0ciA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJ0clwiKTtcblxuICAgICAgICAgICAgZm9yIChsZXQgY29sdW1uIG9mIHRoaXMuY29udGV4dC5jb2x1bW5NYW5hZ2VyLmNvbHVtbnMpIHtcbiAgICAgICAgICAgICAgICBjb25zdCBjZWxsID0gbmV3IENlbGwoZGF0YSwgY29sdW1uLCB0aGlzLmNvbnRleHQubW9kdWxlcywgdHIpO1xuXG4gICAgICAgICAgICAgICAgdHIuYXBwZW5kQ2hpbGQoY2VsbC5lbGVtZW50KTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgdGhpcy50Ym9keS5hcHBlbmRDaGlsZCh0cik7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBnZXQgcm93Q291bnQoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLiNyb3dDb3VudDtcbiAgICB9XG59XG5cbmV4cG9ydCB7IFRhYmxlIH07IiwiaW1wb3J0IHsgQ29sdW1uTWFuYWdlciB9IGZyb20gXCIuLi9jb2x1bW4vY29sdW1uTWFuYWdlci5qc1wiO1xuaW1wb3J0IHsgRGF0YVBpcGVsaW5lIH0gZnJvbSBcIi4uL2RhdGEvZGF0YVBpcGVsaW5lLmpzXCI7XG5pbXBvcnQgeyBEYXRhTG9hZGVyIH0gZnJvbSBcIi4uL2RhdGEvZGF0YUxvYWRlci5qc1wiO1xuaW1wb3J0IHsgRGF0YVBlcnNpc3RlbmNlIH0gZnJvbSBcIi4uL2RhdGEvZGF0YVBlcnNpc3RlbmNlLmpzXCI7XG5pbXBvcnQgeyBHcmlkRXZlbnRzIH0gZnJvbSBcIi4uL2V2ZW50cy9ncmlkRXZlbnRzLmpzXCI7XG5pbXBvcnQgeyBUYWJsZSB9IGZyb20gXCIuLi90YWJsZS90YWJsZS5qc1wiO1xuLyoqXG4gKiBQcm92aWRlcyB0aGUgY29udGV4dCBmb3IgdGhlIGdyaWQsIGluY2x1ZGluZyBzZXR0aW5ncywgZGF0YSwgYW5kIG1vZHVsZXMuICBUaGlzIGNsYXNzIGlzIHJlc3BvbnNpYmxlIGZvciBtYW5hZ2luZyBcbiAqIHRoZSBncmlkJ3MgY29yZSBzdGF0ZSBhbmQgYmVoYXZpb3IuXG4gKi9cbmNsYXNzIEdyaWRDb250ZXh0IHtcbiAgICAvKipcbiAgICAgKiBDcmVhdGUgZ3JpZCBjb250ZXh0LCB3aGljaCByZXByZXNlbnRzIHRoZSBjb3JlIGxvZ2ljIGFuZCBmdW5jdGlvbmFsaXR5IG9mIHRoZSBkYXRhIGdyaWQuXG4gICAgICogQHBhcmFtIHtBcnJheTxvYmplY3Q+fSBjb2x1bW5zIENvbHVtbiBkZWZpbml0aW9uLlxuICAgICAqIEBwYXJhbSB7U2V0dGluZ3NHcmlkfSBzZXR0aW5ncyBHcmlkIHNldHRpbmdzLlxuICAgICAqIEBwYXJhbSB7YW55W119IFtkYXRhPVtdXSBHcmlkIGRhdGEuXG4gICAgICovXG4gICAgY29uc3RydWN0b3IoY29sdW1ucywgc2V0dGluZ3MsIGRhdGEgPSBbXSkge1xuICAgICAgICB0aGlzLnNldHRpbmdzID0gc2V0dGluZ3M7XG4gICAgICAgIHRoaXMuZXZlbnRzID0gbmV3IEdyaWRFdmVudHMoKTtcbiAgICAgICAgdGhpcy5waXBlbGluZSA9IG5ldyBEYXRhUGlwZWxpbmUodGhpcy5zZXR0aW5ncyk7XG4gICAgICAgIHRoaXMuZGF0YWxvYWRlciA9IG5ldyBEYXRhTG9hZGVyKHRoaXMuc2V0dGluZ3MpO1xuICAgICAgICB0aGlzLnBlcnNpc3RlbmNlID0gbmV3IERhdGFQZXJzaXN0ZW5jZShkYXRhKTtcbiAgICAgICAgdGhpcy5jb2x1bW5NYW5hZ2VyID0gbmV3IENvbHVtbk1hbmFnZXIoY29sdW1ucywgdGhpcy5zZXR0aW5ncyk7XG4gICAgICAgIHRoaXMuZ3JpZCA9IG5ldyBUYWJsZSh0aGlzKTtcbiAgICAgICAgdGhpcy5tb2R1bGVzID0ge307XG4gICAgfVxufVxuXG5leHBvcnQgeyBHcmlkQ29udGV4dCB9OyIsImV4cG9ydCBkZWZhdWx0IHtcbiAgICBiYXNlSWROYW1lOiBcImRhdGFncmlkXCIsICAvL2Jhc2UgbmFtZSBmb3IgYWxsIGVsZW1lbnQgSUQncy5cbiAgICBkYXRhOiBbXSwgIC8vcm93IGRhdGEuXG4gICAgY29sdW1uczogW10sICAvL2NvbHVtbiBkZWZpbml0aW9ucy5cbiAgICBlbmFibGVQYWdpbmc6IHRydWUsICAvL2VuYWJsZSBwYWdpbmcgb2YgZGF0YS5cbiAgICBwYWdlclBhZ2VzVG9EaXNwbGF5OiA1LCAgLy9tYXggbnVtYmVyIG9mIHBhZ2VyIGJ1dHRvbnMgdG8gZGlzcGxheS5cbiAgICBwYWdlclJvd3NQZXJQYWdlOiAyNSwgIC8vcm93cyBwZXIgcGFnZS5cbiAgICBkYXRlRm9ybWF0OiBcIk1NL2RkL3l5eXlcIiwgIC8vcm93IGxldmVsIGRhdGUgZm9ybWF0LlxuICAgIGRhdGVUaW1lRm9ybWF0OiBcIk1NL2RkL3l5eXkgSEg6bW06c3NcIiwgLy9yb3cgbGV2ZWwgZGF0ZSBmb3JtYXQuXG4gICAgcmVtb3RlVXJsOiBcIlwiLCAgLy9nZXQgZGF0YSBmcm9tIHVybCBlbmRwb2ludCB2aWEgQWpheC5cbiAgICByZW1vdGVQYXJhbXM6IFwiXCIsICAvL3BhcmFtZXRlcnMgdG8gYmUgcGFzc2VkIG9uIEFqYXggcmVxdWVzdC5cbiAgICByZW1vdGVQcm9jZXNzaW5nOiBmYWxzZSwgIC8vdHJ1dGh5IHNldHMgZ3JpZCB0byBwcm9jZXNzIGZpbHRlci9zb3J0IG9uIHJlbW90ZSBzZXJ2ZXIuXG4gICAgdGFibGVDc3M6IFwiZGF0YWdyaWRzXCIsIFxuICAgIHRhYmxlSGVhZGVyVGhDc3M6IFwiXCIsXG4gICAgcGFnZXJDc3M6IFwiZGF0YWdyaWRzLXBhZ2VyXCIsIFxuICAgIHRhYmxlRmlsdGVyQ3NzOiBcImRhdGFncmlkcy1pbnB1dFwiLCAgLy9jc3MgY2xhc3MgZm9yIGhlYWRlciBmaWx0ZXIgaW5wdXQgZWxlbWVudHMuXG4gICAgdGFibGVFdmVuQ29sdW1uV2lkdGhzOiBmYWxzZSwgIC8vc2hvdWxkIGFsbCBjb2x1bW5zIGJlIGVxdWFsIHdpZHRoP1xuICAgIHRhYmxlQ3NzU29ydEFzYzogXCJkYXRhZ3JpZHMtc29ydC1pY29uIGRhdGFncmlkcy1zb3J0LWFzY1wiLFxuICAgIHRhYmxlQ3NzU29ydERlc2M6IFwiZGF0YWdyaWRzLXNvcnQtaWNvbiBkYXRhZ3JpZHMtc29ydC1kZXNjXCIsXG4gICAgcmVmcmVzaGFibGVJZDogXCJcIiwgIC8vcmVmcmVzaCByZW1vdGUgZGF0YSBzb3VyY2VzIGZvciBncmlkIGFuZC9vciBmaWx0ZXIgdmFsdWVzLlxuICAgIHJvd0NvdW50SWQ6IFwiXCIsXG4gICAgY3N2RXhwb3J0SWQ6IFwiXCIsXG4gICAgY3N2RXhwb3J0UmVtb3RlU291cmNlOiBcIlwiIC8vZ2V0IGV4cG9ydCBkYXRhIGZyb20gdXJsIGVuZHBvaW50IHZpYSBBamF4OyB1c2VmdWwgdG8gZ2V0IG5vbi1wYWdlZCBkYXRhLlxufTsiLCJpbXBvcnQgc2V0dGluZ3NEZWZhdWx0cyBmcm9tIFwiLi9zZXR0aW5nc0RlZmF1bHQuanNcIjtcblxuY2xhc3MgTWVyZ2VPcHRpb25zIHtcbiAgICAvKipcbiAgICAgKiBSZXR1cm5zIGFuIG9iamVjdCBiYXNlZCBvbiB0aGUgbWVyZ2VkIHJlc3VsdHMgb2YgdGhlIGRlZmF1bHQgYW5kIHVzZXIgcHJvdmlkZWQgc2V0dGluZ3MuXG4gICAgICogVXNlciBwcm92aWRlZCBzZXR0aW5ncyB3aWxsIG92ZXJyaWRlIGRlZmF1bHRzLlxuICAgICAqIEBwYXJhbSB7T2JqZWN0fSBzb3VyY2UgdXNlciBzdXBwbGllZCBzZXR0aW5ncy5cbiAgICAgKiBAcmV0dXJucyB7T2JqZWN0fSBzZXR0aW5ncyBtZXJnZWQgZnJvbSBkZWZhdWx0IGFuZCB1c2VyIHZhbHVlcy5cbiAgICAgKi9cbiAgICBzdGF0aWMgbWVyZ2Uoc291cmNlKSB7XG4gICAgICAgIC8vY29weSBkZWZhdWx0IGtleS92YWx1ZSBpdGVtcy5cbiAgICAgICAgbGV0IHJlc3VsdCA9IEpTT04ucGFyc2UoSlNPTi5zdHJpbmdpZnkoc2V0dGluZ3NEZWZhdWx0cykpO1xuXG4gICAgICAgIGlmIChzb3VyY2UgPT09IHVuZGVmaW5lZCB8fCBPYmplY3Qua2V5cyhzb3VyY2UpLmxlbmd0aCA9PT0gMCkge1xuICAgICAgICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgZm9yIChsZXQgW2tleSwgdmFsdWVdIG9mIE9iamVjdC5lbnRyaWVzKHNvdXJjZSkpIHtcbiAgICAgICAgICAgIGxldCB0YXJnZXRUeXBlID0gcmVzdWx0W2tleV0gIT09IHVuZGVmaW5lZCA/IHJlc3VsdFtrZXldLnRvU3RyaW5nKCkgOiB1bmRlZmluZWQ7XG4gICAgICAgICAgICBsZXQgc291cmNlVHlwZSA9IHZhbHVlLnRvU3RyaW5nKCk7XG5cbiAgICAgICAgICAgIGlmICh0YXJnZXRUeXBlICE9PSB1bmRlZmluZWQgJiYgdGFyZ2V0VHlwZSAhPT0gc291cmNlVHlwZSkge1xuICAgICAgICAgICAgICAgIHJlc3VsdFtrZXldID0gdmFsdWU7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgIH1cbn1cblxuZXhwb3J0IHsgTWVyZ2VPcHRpb25zIH07IiwiLyoqXG4gKiBJbXBsZW1lbnRzIHRoZSBwcm9wZXJ0eSBzZXR0aW5ncyBmb3IgdGhlIGdyaWQuXG4gKi9cbmNsYXNzIFNldHRpbmdzR3JpZCB7XG4gICAgLyoqXG4gICAgICogVHJhbnNsYXRlcyBzZXR0aW5ncyBmcm9tIG1lcmdlZCB1c2VyL2RlZmF1bHQgb3B0aW9ucyBpbnRvIGEgZGVmaW5pdGlvbiBvZiBncmlkIHNldHRpbmdzLlxuICAgICAqIEBwYXJhbSB7T2JqZWN0fSBvcHRpb25zIE1lcmdlZCB1c2VyL2RlZmF1bHQgb3B0aW9ucy5cbiAgICAgKi9cbiAgICBjb25zdHJ1Y3RvcihvcHRpb25zKSB7XG4gICAgICAgIHRoaXMuYmFzZUlkTmFtZSA9IG9wdGlvbnMuYmFzZUlkTmFtZTtcbiAgICAgICAgdGhpcy5lbmFibGVQYWdpbmcgPSBvcHRpb25zLmVuYWJsZVBhZ2luZztcbiAgICAgICAgdGhpcy5wYWdlclBhZ2VzVG9EaXNwbGF5ID0gb3B0aW9ucy5wYWdlclBhZ2VzVG9EaXNwbGF5O1xuICAgICAgICB0aGlzLnBhZ2VyUm93c1BlclBhZ2UgPSBvcHRpb25zLnBhZ2VyUm93c1BlclBhZ2U7XG4gICAgICAgIHRoaXMuZGF0ZUZvcm1hdCA9IG9wdGlvbnMuZGF0ZUZvcm1hdDtcbiAgICAgICAgdGhpcy5kYXRlVGltZUZvcm1hdCA9IG9wdGlvbnMuZGF0ZVRpbWVGb3JtYXQ7XG4gICAgICAgIHRoaXMucmVtb3RlVXJsID0gb3B0aW9ucy5yZW1vdGVVcmw7ICBcbiAgICAgICAgdGhpcy5yZW1vdGVQYXJhbXMgPSBvcHRpb25zLnJlbW90ZVBhcmFtcztcbiAgICAgICAgdGhpcy5yZW1vdGVQcm9jZXNzaW5nID0gZmFsc2U7XG4gICAgICAgIFxuICAgICAgICB0aGlzLmFqYXhVcmwgPSAodGhpcy5yZW1vdGVVcmwgJiYgdGhpcy5yZW1vdGVQYXJhbXMpID8gdGhpcy5fYnVpbGRBamF4VXJsKHRoaXMucmVtb3RlVXJsLCB0aGlzLnJlbW90ZVBhcmFtcykgOiB0aGlzLnJlbW90ZVVybDtcblxuICAgICAgICBpZiAodHlwZW9mIG9wdGlvbnMucmVtb3RlUHJvY2Vzc2luZyA9PT0gXCJib29sZWFuXCIgJiYgb3B0aW9ucy5yZW1vdGVQcm9jZXNzaW5nKSB7XG4gICAgICAgICAgICAvLyBSZW1vdGUgcHJvY2Vzc2luZyBzZXQgdG8gYG9uYDsgdXNlIGZpcnN0IGNvbHVtbiB3aXRoIGZpZWxkIGFzIGRlZmF1bHQgc29ydC5cbiAgICAgICAgICAgIGNvbnN0IGZpcnN0ID0gb3B0aW9ucy5jb2x1bW5zLmZpbmQoKGl0ZW0pID0+IGl0ZW0uZmllbGQgIT09IHVuZGVmaW5lZCk7XG5cbiAgICAgICAgICAgIHRoaXMucmVtb3RlUHJvY2Vzc2luZyA9IHRydWU7XG4gICAgICAgICAgICB0aGlzLnJlbW90ZVNvcnREZWZhdWx0Q29sdW1uID0gZmlyc3QuZmllbGQ7XG4gICAgICAgICAgICB0aGlzLnJlbW90ZVNvcnREZWZhdWx0RGlyZWN0aW9uID0gXCJkZXNjXCI7XG4gICAgICAgIH0gZWxzZSBpZiAoT2JqZWN0LmtleXMob3B0aW9ucy5yZW1vdGVQcm9jZXNzaW5nKS5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICAvLyBSZW1vdGUgcHJvY2Vzc2luZyBzZXQgdG8gYG9uYCB1c2luZyBrZXkvdmFsdWUgcGFyYW1ldGVyIGlucHV0cyBmb3IgZGVmYXVsdCBzb3J0IGNvbHVtbi5cbiAgICAgICAgICAgIHRoaXMucmVtb3RlUHJvY2Vzc2luZyA9IHRydWU7XG4gICAgICAgICAgICB0aGlzLnJlbW90ZVNvcnREZWZhdWx0Q29sdW1uID0gb3B0aW9ucy5yZW1vdGVQcm9jZXNzaW5nLmNvbHVtbjtcbiAgICAgICAgICAgIHRoaXMucmVtb3RlU29ydERlZmF1bHREaXJlY3Rpb24gPSBvcHRpb25zLnJlbW90ZVByb2Nlc3NpbmcuZGlyZWN0aW9uID8/IFwiZGVzY1wiO1xuICAgICAgICB9IFxuXG4gICAgICAgIHRoaXMudGFibGVDc3MgPSBvcHRpb25zLnRhYmxlQ3NzO1xuICAgICAgICB0aGlzLnRhYmxlSGVhZGVyVGhDc3MgPSBvcHRpb25zLnRhYmxlSGVhZGVyVGhDc3M7XG4gICAgICAgIHRoaXMucGFnZXJDc3MgPSBvcHRpb25zLnBhZ2VyQ3NzO1xuICAgICAgICB0aGlzLnRhYmxlRmlsdGVyQ3NzID0gb3B0aW9ucy50YWJsZUZpbHRlckNzcztcbiAgICAgICAgdGhpcy50YWJsZUV2ZW5Db2x1bW5XaWR0aHMgPSBvcHRpb25zLnRhYmxlRXZlbkNvbHVtbldpZHRocztcbiAgICAgICAgdGhpcy50YWJsZUNzc1NvcnRBc2MgPSBvcHRpb25zLnRhYmxlQ3NzU29ydEFzYztcbiAgICAgICAgdGhpcy50YWJsZUNzc1NvcnREZXNjID0gb3B0aW9ucy50YWJsZUNzc1NvcnREZXNjO1xuICAgICAgICB0aGlzLnJlZnJlc2hhYmxlSWQgPSBvcHRpb25zLnJlZnJlc2hhYmxlSWQ7XG4gICAgICAgIHRoaXMucm93Q291bnRJZCA9IG9wdGlvbnMucm93Q291bnRJZDtcbiAgICAgICAgdGhpcy5jc3ZFeHBvcnRJZCA9IG9wdGlvbnMuY3N2RXhwb3J0SWQ7XG4gICAgICAgIHRoaXMuY3N2RXhwb3J0UmVtb3RlU291cmNlID0gb3B0aW9ucy5jc3ZFeHBvcnRSZW1vdGVTb3VyY2U7XG4gICAgfVxuICAgIC8qKlxuICAgICAqIENvbXBpbGVzIHRoZSBrZXkvdmFsdWUgcXVlcnkgcGFyYW1ldGVycyBpbnRvIGEgZnVsbHkgcXVhbGlmaWVkIHVybCB3aXRoIHF1ZXJ5IHN0cmluZy5cbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gdXJsIGJhc2UgdXJsLlxuICAgICAqIEBwYXJhbSB7b2JqZWN0fSBwYXJhbXMgcXVlcnkgc3RyaW5nIHBhcmFtZXRlcnMuXG4gICAgICogQHJldHVybnMge3N0cmluZ30gdXJsIHdpdGggcXVlcnkgcGFyYW1ldGVycy5cbiAgICAgKi9cbiAgICBfYnVpbGRBamF4VXJsKHVybCwgcGFyYW1zKSB7XG4gICAgICAgIGNvbnN0IHAgPSBPYmplY3Qua2V5cyhwYXJhbXMpO1xuXG4gICAgICAgIGlmIChwLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgIGNvbnN0IHF1ZXJ5ID0gcC5tYXAoayA9PiBgJHtlbmNvZGVVUklDb21wb25lbnQoayl9PSR7ZW5jb2RlVVJJQ29tcG9uZW50KHBhcmFtc1trXSl9YClcbiAgICAgICAgICAgICAgICAuam9pbihcIiZcIik7XG5cbiAgICAgICAgICAgIHJldHVybiBgJHt1cmx9PyR7cXVlcnl9YDtcbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgcmV0dXJuIHVybDtcbiAgICB9XG59XG5cbmV4cG9ydCB7IFNldHRpbmdzR3JpZCB9OyIsIi8qKlxuICogUmVzcG9uc2libGUgZm9yIHJlbmRlcmluZyB0aGUgZ3JpZHMgcm93cyB1c2luZyBlaXRoZXIgbG9jYWwgb3IgcmVtb3RlIGRhdGEuICBUaGlzIHNob3VsZCBiZSB0aGUgZGVmYXVsdCBtb2R1bGUgdG8gXG4gKiBjcmVhdGUgcm93IGRhdGEgaWYgcGFnaW5nIGlzIG5vdCBlbmFibGVkLiAgU3Vic2NyaWJlcyB0byB0aGUgYHJlbmRlcmAgZXZlbnQgdG8gY3JlYXRlIHRoZSBncmlkJ3Mgcm93cyBhbmQgdGhlIGByZW1vdGVQYXJhbXNgIFxuICogZXZlbnQgZm9yIHJlbW90ZSBwcm9jZXNzaW5nLlxuICogXG4gKiBDbGFzcyB3aWxsIGNhbGwgdGhlICdyZW1vdGVQYXJhbXMnIGV2ZW50IHRvIGNvbmNhdGVuYXRlIHBhcmFtZXRlcnMgZm9yIHJlbW90ZSBkYXRhIHJlcXVlc3RzLlxuICovXG5jbGFzcyBSb3dNb2R1bGUge1xuICAgIC8qKlxuICAgICAqIENyZWF0ZXMgZ3JpZCByb3dzLiAgVGhpcyBzaG91bGQgYmUgdGhlIGRlZmF1bHQgbW9kdWxlIHRvIGNyZWF0ZSByb3cgZGF0YSBpZiBwYWdpbmcgaXMgbm90IGVuYWJsZWQuXG4gICAgICogQHBhcmFtIHtHcmlkQ29udGV4dH0gY29udGV4dCBHcmlkIGNvbnRleHQgY2xhc3MuXG4gICAgICovXG4gICAgY29uc3RydWN0b3IoY29udGV4dCkge1xuICAgICAgICB0aGlzLmNvbnRleHQgPSBjb250ZXh0O1xuICAgIH1cblxuICAgIGluaXRpYWxpemUoKSB7XG4gICAgICAgIGlmICh0aGlzLmNvbnRleHQuc2V0dGluZ3MucmVtb3RlUHJvY2Vzc2luZykge1xuICAgICAgICAgICAgdGhpcy5jb250ZXh0LmV2ZW50cy5zdWJzY3JpYmUoXCJyZW5kZXJcIiwgdGhpcy5yZW5kZXJSZW1vdGUsIHRydWUsIDEwKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHRoaXMuY29udGV4dC5ldmVudHMuc3Vic2NyaWJlKFwicmVuZGVyXCIsIHRoaXMucmVuZGVyTG9jYWwsIGZhbHNlLCAxMCk7XG4gICAgICAgIH1cbiAgICB9XG4gICAgLyoqXG4gICAgICogUmVuZGVycyB0aGUgZ3JpZCByb3dzIHVzaW5nIGxvY2FsIGRhdGEuICBUaGlzIGlzIHRoZSBkZWZhdWx0IG1ldGhvZCB0byByZW5kZXIgcm93cyB3aGVuIHJlbW90ZSBwcm9jZXNzaW5nIGlzIG5vdCBlbmFibGVkLlxuICAgICAqL1xuICAgIHJlbmRlckxvY2FsID0gKCkgPT4ge1xuICAgICAgICB0aGlzLmNvbnRleHQuZ3JpZC5yZW5kZXJSb3dzKHRoaXMuY29udGV4dC5wZXJzaXN0ZW5jZS5kYXRhKTtcbiAgICB9O1xuICAgIC8qKlxuICAgICAqIFJlbmRlcnMgdGhlIGdyaWQgcm93cyB1c2luZyByZW1vdGUgZGF0YS4gIFRoaXMgbWV0aG9kIHdpbGwgY2FsbCB0aGUgYHJlbW90ZVBhcmFtc2AgZXZlbnQgdG8gZ2V0IHRoZSBwYXJhbWV0ZXJzIGZvciB0aGUgcmVtb3RlIHJlcXVlc3QuXG4gICAgICovXG4gICAgcmVuZGVyUmVtb3RlID0gYXN5bmMgKCkgPT4ge1xuICAgICAgICBjb25zdCBwYXJhbXMgPSB0aGlzLmNvbnRleHQuZXZlbnRzLmNoYWluKFwicmVtb3RlUGFyYW1zXCIsIHt9KTtcbiAgICAgICAgY29uc3QgZGF0YSA9IGF3YWl0IHRoaXMuY29udGV4dC5kYXRhbG9hZGVyLnJlcXVlc3RHcmlkRGF0YShwYXJhbXMpO1xuXG4gICAgICAgIHRoaXMuY29udGV4dC5ncmlkLnJlbmRlclJvd3MoZGF0YSk7XG4gICAgfTtcbn1cblxuUm93TW9kdWxlLm1vZHVsZU5hbWUgPSBcInJvd1wiO1xuXG5leHBvcnQgeyBSb3dNb2R1bGUgfTsiLCJjbGFzcyBQYWdlckJ1dHRvbnMge1xuICAgIC8qKlxuICAgICAqIFJldHVybnMgc3RhcnQgYnV0dG9uIGZvciBwYWdlciBlbGVtZW50LlxuICAgICAqIEBwYXJhbSB7bnVtYmVyfSBjdXJyZW50UGFnZSBDdXJyZW50IHBhZ2UuXG4gICAgICogQHBhcmFtIHtGdW5jdGlvbn0gY2FsbGJhY2sgQnV0dG9uIGNsaWNrIGhhbmRsZXIuXG4gICAgICogQHJldHVybnMge0hUTUxMaW5rRWxlbWVudH1cbiAgICAgKi9cbiAgICBzdGF0aWMgc3RhcnQoY3VycmVudFBhZ2UsIGNhbGxiYWNrKSB7XG4gICAgICAgIGNvbnN0IGxpID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImxpXCIpO1xuICAgICAgICBjb25zdCBidG4gPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiYnV0dG9uXCIpO1xuXG4gICAgICAgIGxpLmFwcGVuZChidG4pO1xuICAgICAgICBidG4uaW5uZXJIVE1MID0gXCImbHNhcXVvO1wiO1xuICAgICAgICBidG4uYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsIGNhbGxiYWNrKTtcblxuICAgICAgICBpZiAoY3VycmVudFBhZ2UgPiAxKSB7XG4gICAgICAgICAgICBidG4uZGF0YXNldC5wYWdlID0gXCIxXCI7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBidG4udGFiSW5kZXggPSAtMTtcbiAgICAgICAgICAgIGJ0bi5kaXNhYmxlZCA9IHRydWU7XG4gICAgICAgICAgICBsaS5jbGFzc05hbWUgPSBcImRpc2FibGVkXCI7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gbGk7XG4gICAgfVxuICAgIC8qKlxuICAgICAqIFJldHVybnMgZW5kIGJ1dHRvbiBmb3IgcGFnZXIgZWxlbWVudC5cbiAgICAgKiBAcGFyYW0ge251bWJlcn0gdG90YWxQYWdlcyBsYXN0IHBhZ2UgbnVtYmVyIGluIGdyb3VwIHNldC5cbiAgICAgKiBAcGFyYW0ge251bWJlcn0gY3VycmVudFBhZ2UgY3VycmVudCBwYWdlLlxuICAgICAqIEBwYXJhbSB7RnVuY3Rpb259IGNhbGxiYWNrIGJ1dHRvbiBjbGljayBoYW5kbGVyLlxuICAgICAqIEByZXR1cm5zIHtIVE1MTElFbGVtZW50fVxuICAgICAqL1xuICAgIHN0YXRpYyBlbmQodG90YWxQYWdlcywgY3VycmVudFBhZ2UsIGNhbGxiYWNrKSB7XG4gICAgICAgIGNvbnN0IGxpID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImxpXCIpO1xuICAgICAgICBjb25zdCBidG4gPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiYnV0dG9uXCIpO1xuXG4gICAgICAgIGxpLmFwcGVuZChidG4pO1xuICAgICAgICBidG4uaW5uZXJIVE1MID0gXCImcnNhcXVvO1wiO1xuICAgICAgICBidG4uYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsIGNhbGxiYWNrKTtcblxuICAgICAgICBpZiAoY3VycmVudFBhZ2UgPCB0b3RhbFBhZ2VzKSB7XG4gICAgICAgICAgICBidG4uZGF0YXNldC5wYWdlID0gdG90YWxQYWdlcztcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGJ0bi50YWJJbmRleCA9IC0xO1xuICAgICAgICAgICAgYnRuLmRpc2FibGVkID0gdHJ1ZTtcbiAgICAgICAgICAgIGxpLmNsYXNzTmFtZSA9IFwiZGlzYWJsZWRcIjtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBsaTtcbiAgICB9XG4gICAgLyoqXG4gICAgICogUmV0dXJucyBwYWdlciBidXR0b24gZm9yIGFzc29jaWF0ZWQgcGFnZS5cbiAgICAgKiBAcGFyYW0ge251bWJlcn0gcGFnZSBwYWdlIG51bWJlci5cbiAgICAgKiBAcGFyYW0ge251bWJlcn0gY3VycmVudFBhZ2UgY3VycmVudCBwYWdlLlxuICAgICAqIEBwYXJhbSB7RnVuY3Rpb259IGNhbGxiYWNrIGJ1dHRvbiBjbGljayBoYW5kbGVyLlxuICAgICAqIEByZXR1cm5zIHtIVE1MTElFbGVtZW50fVxuICAgICAqL1xuICAgIHN0YXRpYyBwYWdlTnVtYmVyKHBhZ2UsIGN1cnJlbnRQYWdlLCBjYWxsYmFjaykge1xuICAgICAgICBjb25zdCBsaSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJsaVwiKTtcbiAgICAgICAgY29uc3QgYnRuID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImJ1dHRvblwiKTtcblxuICAgICAgICBsaS5hcHBlbmQoYnRuKTtcbiAgICAgICAgYnRuLmlubmVyVGV4dCA9IHBhZ2U7XG4gICAgICAgIGJ0bi5kYXRhc2V0LnBhZ2UgPSBwYWdlO1xuICAgICAgICBidG4uYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsIGNhbGxiYWNrKTtcblxuICAgICAgICBpZiAocGFnZSA9PT0gY3VycmVudFBhZ2UpIHtcbiAgICAgICAgICAgIGxpLmNsYXNzTmFtZSA9IFwiYWN0aXZlXCI7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gbGk7XG4gICAgfVxufVxuXG5leHBvcnQgeyBQYWdlckJ1dHRvbnMgfTsiLCJpbXBvcnQgeyBQYWdlckJ1dHRvbnMgfSBmcm9tIFwiLi9wYWdlckJ1dHRvbnMuanNcIjtcbi8qKlxuICogRm9ybWF0cyBncmlkJ3Mgcm93cyBhcyBhIHNlcmllcyBvZiBwYWdlcyByYXRoZXIgdGhhdCBhIHNjcm9sbGluZyBsaXN0LiAgSWYgcGFnaW5nIGlzIG5vdCBkZXNpcmVkLCByZWdpc3RlciB0aGUgYFJvd01vZHVsZWAgaW5zdGVhZC5cbiAqIFxuICogQ2xhc3Mgc3Vic2NyaWJlcyB0byB0aGUgYHJlbmRlcmAgZXZlbnQgdG8gdXBkYXRlIHRoZSBwYWdlciBjb250cm9sIHdoZW4gdGhlIGdyaWQgaXMgcmVuZGVyZWQuICBJdCBhbHNvIGNhbGxzIHRoZSBjaGFpbiBldmVudCBcbiAqIGByZW1vdGVQYXJhbXNgIHRvIGNvbXBpbGUgYSBsaXN0IG9mIHBhcmFtZXRlcnMgdG8gYmUgcGFzc2VkIHRvIHRoZSByZW1vdGUgZGF0YSBzb3VyY2Ugd2hlbiB1c2luZyByZW1vdGUgcHJvY2Vzc2luZy5cbiAqL1xuY2xhc3MgUGFnZXJNb2R1bGUge1xuICAgIC8qKlxuICAgICAqIEZvcm1hdHMgZ3JpZCdzIHJvd3MgYXMgYSBzZXJpZXMgb2YgcGFnZXMgcmF0aGVyIHRoYXQgYSBzY3JvbGxpbmcgbGlzdC4gIE1vZHVsZSBjYW4gYmUgdXNlZCB3aXRoIGJvdGggbG9jYWwgYW5kIHJlbW90ZSBkYXRhIHNvdXJjZXMuICBcbiAgICAgKiBAcGFyYW0ge0dyaWRDb250ZXh0fSBjb250ZXh0IEdyaWQgY29udGV4dC5cbiAgICAgKi9cbiAgICBjb25zdHJ1Y3Rvcihjb250ZXh0KSB7XG4gICAgICAgIHRoaXMuY29udGV4dCA9IGNvbnRleHQ7XG4gICAgICAgIHRoaXMudG90YWxSb3dzID0gdGhpcy5jb250ZXh0LnBlcnNpc3RlbmNlLnJvd0NvdW50O1xuICAgICAgICB0aGlzLnBhZ2VzVG9EaXNwbGF5ID0gdGhpcy5jb250ZXh0LnNldHRpbmdzLnBhZ2VyUGFnZXNUb0Rpc3BsYXk7XG4gICAgICAgIHRoaXMucm93c1BlclBhZ2UgPSB0aGlzLmNvbnRleHQuc2V0dGluZ3MucGFnZXJSb3dzUGVyUGFnZTtcbiAgICAgICAgdGhpcy5jdXJyZW50UGFnZSA9IDE7XG4gICAgICAgIC8vY3JlYXRlIGRpdiBjb250YWluZXIgZm9yIHBhZ2VyXG4gICAgICAgIHRoaXMuY29udGFpbmVyID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImRpdlwiKTtcbiAgICAgICAgdGhpcy5lbFBhZ2VyID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcInVsXCIpO1xuXG4gICAgICAgIHRoaXMuY29udGFpbmVyLmlkID0gYCR7dGhpcy5jb250ZXh0LnNldHRpbmdzLmJhc2VJZE5hbWV9X3BhZ2VyYDtcbiAgICAgICAgdGhpcy5jb250YWluZXIuY2xhc3NOYW1lID0gdGhpcy5jb250ZXh0LnNldHRpbmdzLnBhZ2VyQ3NzO1xuICAgICAgICB0aGlzLmNvbnRhaW5lci5hcHBlbmQodGhpcy5lbFBhZ2VyKTtcbiAgICAgICAgdGhpcy5jb250ZXh0LmdyaWQudGFibGUuaW5zZXJ0QWRqYWNlbnRFbGVtZW50KFwiYWZ0ZXJlbmRcIiwgdGhpcy5jb250YWluZXIpO1xuICAgIH1cbiAgICAvKipcbiAgICAgKiBTZXRzIGhhbmRsZXIgZXZlbnRzIGZvciByZW5kZXJpbmcvdXBkYXRpbmcgZ3JpZCBib2R5IHJvd3MgYW5kIHBhZ2VyIGNvbnRyb2wuXG4gICAgICovXG4gICAgaW5pdGlhbGl6ZSgpIHtcbiAgICAgICAgaWYgKHRoaXMuY29udGV4dC5zZXR0aW5ncy5yZW1vdGVQcm9jZXNzaW5nKSB7XG4gICAgICAgICAgICB0aGlzLmNvbnRleHQuZXZlbnRzLnN1YnNjcmliZShcInJlbmRlclwiLCB0aGlzLnJlbmRlclJlbW90ZSwgdHJ1ZSwgMTApO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdGhpcy5jb250ZXh0LmV2ZW50cy5zdWJzY3JpYmUoXCJyZW5kZXJcIiwgdGhpcy5yZW5kZXJMb2NhbCwgZmFsc2UsIDEwKTtcbiAgICAgICAgfVxuICAgIH1cbiAgICAvKipcbiAgICAgKiBSZXR1cm5zIHRoZSB0b3RhbCBudW1iZXIgb2YgcG9zc2libGUgcGFnZXMgYmFzZWQgb24gdGhlIHRvdGFsIHJvd3MsIGFuZCByb3dzIHBlciBwYWdlIHNldHRpbmcuXG4gICAgICogQHJldHVybnMge051bWJlcn1cbiAgICAgKi9cbiAgICB0b3RhbFBhZ2VzKCkge1xuICAgICAgICBjb25zdCB0b3RhbFJvd3MgPSBpc05hTih0aGlzLnRvdGFsUm93cykgPyAxIDogdGhpcy50b3RhbFJvd3M7XG5cbiAgICAgICAgcmV0dXJuIHRoaXMucm93c1BlclBhZ2UgPT09IDAgPyAxIDogTWF0aC5jZWlsKHRvdGFsUm93cyAvIHRoaXMucm93c1BlclBhZ2UpO1xuICAgIH1cbiAgICAvKipcbiAgICAgKiBSZXR1cm5zIGEgdmFsaWRhdGVkIHBhZ2UgbnVtYmVyIGlucHV0IGJ5IG1ha2luZyBzdXJlIHZhbHVlIGlzIG51bWVyaWMsIGFuZCB3aXRoaW4gdGhlIGJvdW5kcyBvZiB0aGUgdG90YWwgcGFnZXMuICBcbiAgICAgKiBBbiBpbnZhbGlkIGlucHV0IHdpbGwgcmV0dXJuIGEgdmFsdWUgb2YgMS5cbiAgICAgKiBAcGFyYW0ge3N0cmluZyB8IG51bWJlcn0gY3VycmVudFBhZ2UgUGFnZSBudW1iZXIgdG8gdmFsaWRhdGUuXG4gICAgICogQHJldHVybnMge051bWJlcn0gUmV0dXJucyBhIHZhbGlkIHBhZ2UgbnVtYmVyIGJldHdlZW4gMSBhbmQgdGhlIHRvdGFsIG51bWJlciBvZiBwYWdlcy4gIElmIHRoZSBpbnB1dCBpcyBpbnZhbGlkLCByZXR1cm5zIDEuXG4gICAgICovXG4gICAgdmFsaWRhdGVQYWdlKGN1cnJlbnRQYWdlKSB7XG4gICAgICAgIGlmICghTnVtYmVyLmlzSW50ZWdlcihjdXJyZW50UGFnZSkpIHtcbiAgICAgICAgICAgIGN1cnJlbnRQYWdlID0gcGFyc2VJbnQoY3VycmVudFBhZ2UpO1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc3QgdG90YWwgPSB0aGlzLnRvdGFsUGFnZXMoKTtcbiAgICAgICAgY29uc3QgcmVzdWx0ID0gdG90YWwgPCBjdXJyZW50UGFnZSA/IHRvdGFsIDogY3VycmVudFBhZ2U7XG5cbiAgICAgICAgcmV0dXJuIHJlc3VsdCA8PSAwID8gMSA6IHJlc3VsdDtcbiAgICB9XG4gICAgLyoqXG4gICAgICogUmV0dXJucyB0aGUgZmlyc3QgcGFnZSBudW1iZXIgdG8gZGlzcGxheSBpbiB0aGUgYnV0dG9uIGNvbnRyb2wgc2V0IGJhc2VkIG9uIHRoZSBwYWdlIG51bWJlciBwb3NpdGlvbiBpbiB0aGUgZGF0YXNldC4gIFxuICAgICAqIFBhZ2UgbnVtYmVycyBvdXRzaWRlIG9mIHRoaXMgcmFuZ2UgYXJlIHJlcHJlc2VudGVkIGJ5IGFuIGFycm93LlxuICAgICAqIEBwYXJhbSB7TnVtYmVyfSBjdXJyZW50UGFnZSBDdXJyZW50IHBhZ2UgbnVtYmVyLlxuICAgICAqIEByZXR1cm5zIHtOdW1iZXJ9XG4gICAgICovXG4gICAgZmlyc3REaXNwbGF5UGFnZShjdXJyZW50UGFnZSkge1xuICAgICAgICBjb25zdCBtaWRkbGUgPSBNYXRoLmZsb29yKHRoaXMucGFnZXNUb0Rpc3BsYXkgLyAyICsgdGhpcy5wYWdlc1RvRGlzcGxheSAlIDIpO1xuXG4gICAgICAgIGlmIChjdXJyZW50UGFnZSA8IG1pZGRsZSkgcmV0dXJuIDE7XG5cbiAgICAgICAgaWYgKHRoaXMudG90YWxQYWdlcygpIDwgKGN1cnJlbnRQYWdlICsgdGhpcy5wYWdlc1RvRGlzcGxheSAtIG1pZGRsZSkpIHtcbiAgICAgICAgICAgIHJldHVybiBNYXRoLm1heCh0aGlzLnRvdGFsUGFnZXMoKSAtIHRoaXMucGFnZXNUb0Rpc3BsYXkgKyAxLCAxKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBjdXJyZW50UGFnZSAtIG1pZGRsZSArIDE7XG4gICAgfVxuICAgIC8qKlxuICAgICAqIENyZWF0ZXMgdGhlIGh0bWwgbGlzdCBpdGVtIGFuZCBidXR0b24gZWxlbWVudHMgZm9yIHRoZSBwYWdlciBjb250YWluZXIncyB1bCBlbGVtZW50LiAgV2lsbCBhbHNvIHNldCB0aGUgXG4gICAgICogYHRoaXMuY3VycmVudFBhZ2VgIHByb3BlcnR5IHRvIHRoZSBjdXJyZW50IHBhZ2UgbnVtYmVyLlxuICAgICAqIEBwYXJhbSB7TnVtYmVyfSBjdXJyZW50UGFnZSBDdXJyZW50IHBhZ2UgbnVtYmVyLiAgQXNzdW1lcyBhIHZhbGlkIHBhZ2UgbnVtYmVyIGlzIHByb3ZpZGVkLlxuICAgICAqIEBwYXJhbSB7RnVuY3Rpb259IGNhbGxiYWNrIEJ1dHRvbiBjbGljayBoYW5kbGVyLlxuICAgICAqL1xuICAgIHJlbmRlcihjdXJyZW50UGFnZSwgY2FsbGJhY2spIHtcbiAgICAgICAgY29uc3QgdG90YWxQYWdlcyA9IHRoaXMudG90YWxQYWdlcygpO1xuICAgICAgICAvLyBDbGVhciB0aGUgcHJpb3IgbGkgZWxlbWVudHMuXG4gICAgICAgIHRoaXMuZWxQYWdlci5yZXBsYWNlQ2hpbGRyZW4oKTtcblxuICAgICAgICBpZiAodG90YWxQYWdlcyA8PSAxKSByZXR1cm47XG4gICAgICAgIFxuICAgICAgICBjb25zdCBmaXJzdERpc3BsYXkgPSB0aGlzLmZpcnN0RGlzcGxheVBhZ2UoY3VycmVudFBhZ2UpO1xuICAgICAgICBjb25zdCBtYXhQYWdlcyA9IGZpcnN0RGlzcGxheSArIHRoaXMucGFnZXNUb0Rpc3BsYXk7XG4gICAgICAgIFxuICAgICAgICB0aGlzLmN1cnJlbnRQYWdlID0gY3VycmVudFBhZ2U7XG4gICAgICAgIHRoaXMuZWxQYWdlci5hcHBlbmRDaGlsZChQYWdlckJ1dHRvbnMuc3RhcnQoY3VycmVudFBhZ2UsIGNhbGxiYWNrKSk7XG5cbiAgICAgICAgZm9yIChsZXQgcGFnZSA9IGZpcnN0RGlzcGxheTsgcGFnZSA8PSB0b3RhbFBhZ2VzICYmIHBhZ2UgPCBtYXhQYWdlczsgcGFnZSsrKSB7XG4gICAgICAgICAgICB0aGlzLmVsUGFnZXIuYXBwZW5kQ2hpbGQoUGFnZXJCdXR0b25zLnBhZ2VOdW1iZXIocGFnZSwgY3VycmVudFBhZ2UsIGNhbGxiYWNrKSk7XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLmVsUGFnZXIuYXBwZW5kQ2hpbGQoUGFnZXJCdXR0b25zLmVuZCh0b3RhbFBhZ2VzLCBjdXJyZW50UGFnZSwgY2FsbGJhY2spKTtcbiAgICB9XG5cbiAgICBoYW5kbGVQYWdpbmcgPSBhc3luYyAoZSkgPT4ge1xuICAgICAgICBjb25zdCB2YWxpZFBhZ2UgPSB7IHBhZ2U6IHRoaXMudmFsaWRhdGVQYWdlKGUuY3VycmVudFRhcmdldC5kYXRhc2V0LnBhZ2UpIH07XG5cbiAgICAgICAgaWYgKHRoaXMuY29udGV4dC5zZXR0aW5ncy5yZW1vdGVQcm9jZXNzaW5nKSB7XG4gICAgICAgICAgICBhd2FpdCB0aGlzLnJlbmRlclJlbW90ZSh2YWxpZFBhZ2UpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdGhpcy5yZW5kZXJMb2NhbCh2YWxpZFBhZ2UpO1xuICAgICAgICB9XG4gICAgfTtcbiAgICAvKipcbiAgICAgKiBIYW5kbGVyIGZvciByZW5kZXJpbmcgcm93cyB1c2luZyBsb2NhbCBkYXRhIHNvdXJjZS4gIFdpbGwgc2xpY2UgdGhlIGRhdGEgYXJyYXkgYmFzZWQgb24gdGhlIGN1cnJlbnQgcGFnZSBhbmQgcm93cyBwZXIgcGFnZSBzZXR0aW5ncyxcbiAgICAgKiB0aGVuIGNhbGwgYHJlbmRlcmAgdG8gdXBkYXRlIHRoZSBwYWdlciBjb250cm9sLiAgT3B0aW9uYWwgYXJndW1lbnQgYHBhcmFtc2AgaXMgYW4gb2JqZWN0IHRoYXQgY2FuIGNvbnRhaW4gdGhlIGZvbGxvd2luZyBwcm9wZXJ0aWVzOlxuICAgICAqICogYHBhZ2VgOlBhZ2UgbnVtYmVyIHRvIHJlbmRlci4gIElmIG5vdCBwcm92aWRlZCwgZGVmYXVsdHMgdG8gMS5cbiAgICAgKiBAcGFyYW0ge3sgcGFnZTogbnVtYmVyIH0gfCBudWxsfSBwYXJhbXMgXG4gICAgICovXG4gICAgcmVuZGVyTG9jYWwgPSAocGFyYW1zID0ge30pID0+IHtcbiAgICAgICAgY29uc3QgcGFnZSA9ICFwYXJhbXMucGFnZSA/IDEgOiB0aGlzLnZhbGlkYXRlUGFnZShwYXJhbXMucGFnZSk7XG4gICAgICAgIGNvbnN0IGJlZ2luID0gKHBhZ2UgLSAxKSAqIHRoaXMucm93c1BlclBhZ2U7XG4gICAgICAgIGNvbnN0IGVuZCA9IGJlZ2luICsgdGhpcy5yb3dzUGVyUGFnZTtcbiAgICAgICAgY29uc3QgZGF0YSA9IHRoaXMuY29udGV4dC5wZXJzaXN0ZW5jZS5kYXRhLnNsaWNlKGJlZ2luLCBlbmQpO1xuXG4gICAgICAgIHRoaXMuY29udGV4dC5ncmlkLnJlbmRlclJvd3MoZGF0YSwgdGhpcy5jb250ZXh0LnBlcnNpc3RlbmNlLnJvd0NvdW50KTtcbiAgICAgICAgdGhpcy50b3RhbFJvd3MgPSB0aGlzLmNvbnRleHQucGVyc2lzdGVuY2Uucm93Q291bnQ7XG4gICAgICAgIHRoaXMucmVuZGVyKHBhZ2UsIHRoaXMuaGFuZGxlUGFnaW5nKTtcbiAgICB9O1xuICAgIC8qKlxuICAgICAqIEhhbmRsZXIgZm9yIHJlbmRlcmluZyByb3dzIHVzaW5nIHJlbW90ZSBkYXRhIHNvdXJjZS4gIFdpbGwgY2FsbCB0aGUgYGRhdGFsb2FkZXJgIHRvIHJlcXVlc3QgZGF0YSBiYXNlZCBvbiB0aGUgcHJvdmlkZWQgcGFyYW1zLFxuICAgICAqIHRoZW4gY2FsbCBgcmVuZGVyYCB0byB1cGRhdGUgdGhlIHBhZ2VyIGNvbnRyb2wuICBPcHRpb25hbCBhcmd1bWVudCBgcGFyYW1zYCBpcyBhbiBvYmplY3QgdGhhdCBjYW4gY29udGFpbiB0aGUgZm9sbG93aW5nIHByb3BlcnRpZXM6XG4gICAgICogKiBgcGFnZWA6IFBhZ2UgbnVtYmVyIHRvIHJlbmRlci4gIElmIG5vdCBwcm92aWRlZCwgZGVmYXVsdHMgdG8gMS5cbiAgICAgKiBAcGFyYW0ge3sgcGFnZTogbnVtYmVyIH0gfCBudWxsfSBwYXJhbXMgXG4gICAgICovXG4gICAgcmVuZGVyUmVtb3RlID0gYXN5bmMgKHBhcmFtcyA9IHt9KSA9PiB7XG4gICAgICAgIGlmICghcGFyYW1zLnBhZ2UpIHBhcmFtcy5wYWdlID0gMTtcbiAgICAgICAgXG4gICAgICAgIHBhcmFtcyA9IHRoaXMuY29udGV4dC5ldmVudHMuY2hhaW4oXCJyZW1vdGVQYXJhbXNcIiwgcGFyYW1zKTtcblxuICAgICAgICBjb25zdCBkYXRhID0gYXdhaXQgdGhpcy5jb250ZXh0LmRhdGFsb2FkZXIucmVxdWVzdEdyaWREYXRhKHBhcmFtcyk7XG4gICAgICAgIGNvbnN0IHJvd0NvdW50ID0gZGF0YS5yb3dDb3VudCA/PyAwO1xuXG4gICAgICAgIHRoaXMuY29udGV4dC5ncmlkLnJlbmRlclJvd3MoZGF0YS5kYXRhLCByb3dDb3VudCk7XG4gICAgICAgIHRoaXMudG90YWxSb3dzID0gcm93Q291bnQ7XG4gICAgICAgIHRoaXMucmVuZGVyKHBhcmFtcy5wYWdlLCB0aGlzLmhhbmRsZVBhZ2luZyk7XG4gICAgfTtcbn1cblxuUGFnZXJNb2R1bGUubW9kdWxlTmFtZSA9IFwicGFnZXJcIjtcblxuZXhwb3J0IHsgUGFnZXJNb2R1bGUgfTsiLCJpbXBvcnQgeyBHcmlkQ29udGV4dCB9IGZyb20gXCIuLi9jb21wb25lbnRzL2NvbnRleHQvZ3JpZENvbnRleHQuanNcIjtcbmltcG9ydCB7IE1lcmdlT3B0aW9ucyB9IGZyb20gXCIuLi9zZXR0aW5ncy9tZXJnZU9wdGlvbnMuanNcIjtcbmltcG9ydCB7IFNldHRpbmdzR3JpZCB9IGZyb20gXCIuLi9zZXR0aW5ncy9zZXR0aW5nc0dyaWQuanNcIjtcbmltcG9ydCB7IFJvd01vZHVsZSB9IGZyb20gXCIuLi9tb2R1bGVzL3Jvdy9yb3dNb2R1bGUuanNcIjtcbmltcG9ydCB7IFBhZ2VyTW9kdWxlIH0gZnJvbSBcIi4uL21vZHVsZXMvcGFnZXIvcGFnZXJNb2R1bGUuanNcIjtcbi8qKlxuICogQ3JlYXRlcyBncmlkJ3MgY29yZSBwcm9wZXJ0aWVzIGFuZCBvYmplY3RzLCBhbmQgYWxsb3dzIGZvciByZWdpc3RyYXRpb24gb2YgbW9kdWxlcyB1c2VkIHRvIGJ1aWxkIGZ1bmN0aW9uYWxpdHkuXG4gKiBVc2UgdGhpcyBjbGFzcyBhcyBhIGJhc2UgY2xhc3MgdG8gY3JlYXRlIGEgZ3JpZCB3aXRoIGN1c3RvbSBtb2R1bGFyIGZ1bmN0aW9uYWxpdHkgdXNpbmcgdGhlIGBleHRlbmRzYCBjbGFzcyByZWZlcmVuY2UuXG4gKi9cbmNsYXNzIEdyaWRDb3JlIHtcbiAgICAjbW9kdWxlVHlwZXM7XG4gICAgI21vZHVsZXNDcmVhdGVkO1xuICAgIC8qKlxuICAgICogQ3JlYXRlcyBncmlkJ3MgY29yZSBwcm9wZXJ0aWVzIGFuZCBvYmplY3RzIGFuZCBpZGVudGlmaWVzIGRpdiBlbGVtZW50IHdoaWNoIGdyaWQgd2lsbCBiZSBidWlsdC4gIEFmdGVyIGluc3RhbnRpYXRpb24sIFxuICAgICogdXNlIHRoZSBgYWRkTW9kdWxlc2AgbWV0aG9kIHRvIHJlZ2lzdGVyIGRlc2lyZWQgbW9kdWxlcyB0byBjb21wbGV0ZSB0aGUgc2V0dXAgcHJvY2Vzcy4gIE1vZHVsZSByZWdpc3RyYXRpb24gaXMga2VwdCBcbiAgICAqIHNlcGFyYXRlIGZyb20gY29uc3RydWN0b3IgdG8gYWxsb3cgY3VzdG9taXphdGlvbiBvZiBtb2R1bGVzIHVzZWQgdG8gYnVpbGQgZ3JpZC5cbiAgICAqIEBwYXJhbSB7c3RyaW5nfSBjb250YWluZXIgZGl2IGVsZW1lbnQgSUQgdG8gYnVpbGQgZ3JpZCBpbi5cbiAgICAqIEBwYXJhbSB7b2JqZWN0fSBzZXR0aW5ncyBVc2VyIHNldHRpbmdzOyBrZXkvdmFsdWUgcGFpcnMuXG4gICAgKi9cbiAgICBjb25zdHJ1Y3Rvcihjb250YWluZXIsIHNldHRpbmdzKSB7XG4gICAgICAgIGNvbnN0IHNvdXJjZSA9IE1lcmdlT3B0aW9ucy5tZXJnZShzZXR0aW5ncyk7XG5cbiAgICAgICAgdGhpcy5zZXR0aW5ncyA9IG5ldyBTZXR0aW5nc0dyaWQoc291cmNlKTtcbiAgICAgICAgdGhpcy5jb250YWluZXIgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChjb250YWluZXIpO1xuICAgICAgICB0aGlzLmVuYWJsZVBhZ2luZyA9IHRoaXMuc2V0dGluZ3MuZW5hYmxlUGFnaW5nO1xuICAgICAgICB0aGlzLmlzVmFsaWQgPSB0cnVlO1xuICAgICAgICB0aGlzLiNtb2R1bGVUeXBlcyA9IFtdO1xuICAgICAgICB0aGlzLiNtb2R1bGVzQ3JlYXRlZCA9IGZhbHNlO1xuICAgICAgICB0aGlzLm1vZHVsZXMgPSB7fTtcblxuICAgICAgICBpZiAoT2JqZWN0LnZhbHVlcyhzb3VyY2UuY29sdW1ucykubGVuZ3RoID09PSAwKSB7XG4gICAgICAgICAgICBjb25zb2xlLmxvZyhcIk1pc3NpbmcgcmVxdWlyZWQgY29sdW1ucyBkZWZpbml0aW9uLlwiKTtcbiAgICAgICAgICAgIHRoaXMuaXNWYWxpZCA9IGZhbHNlO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgY29uc3QgZGF0YSA9IHNvdXJjZS5kYXRhID8/IFtdO1xuICAgICAgICAgICAgdGhpcy4jaW5pdChzb3VyY2UuY29sdW1ucywgZGF0YSk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICAjaW5pdChjb2x1bW5zLCBkYXRhKSB7XG4gICAgICAgIHRoaXMuY29udGV4dCA9IG5ldyBHcmlkQ29udGV4dChjb2x1bW5zLCB0aGlzLnNldHRpbmdzLCBkYXRhKTtcblxuICAgICAgICB0aGlzLmNvbnRhaW5lci5hcHBlbmQodGhpcy5jb250ZXh0LmdyaWQudGFibGUpO1xuICAgIH1cbiAgICAvKipcbiAgICAgKiBSZWdpc3RlciBtb2R1bGVzIHRvIGJlIHVzZWQgaW4gdGhlIGJ1aWxkaW5nIGFuZCBvcGVyYXRpb24gb2YgdGhlIGdyaWQuICBcbiAgICAgKiBcbiAgICAgKiBOT1RFOiBUaGlzIG1ldGhvZCBzaG91bGQgYmUgY2FsbGVkIGJlZm9yZSB0aGUgYGluaXQoKWAgbWV0aG9kLlxuICAgICAqIEBwYXJhbSB7Y2xhc3N9IG1vZHVsZXMgQ2xhc3MgbW9kdWxlKHMpLlxuICAgICAqL1xuICAgIGFkZE1vZHVsZXMoLi4ubW9kdWxlcykge1xuICAgICAgICBtb2R1bGVzLmZvckVhY2goKG0pID0+IHRoaXMuI21vZHVsZVR5cGVzLnB1c2gobSkpO1xuICAgIH1cbiAgICAvKipcbiAgICAgKiBBZGRzIGEgbmV3IGNvbHVtbiB0byB0aGUgZ3JpZC4gIFRoZSBjb2x1bW4gd2lsbCBiZSBhZGRlZCB0byB0aGUgZW5kIG9mIHRoZSBjb2x1bW5zIGNvbGxlY3Rpb24gYnkgZGVmYXVsdCwgYnV0IGNhbiBcbiAgICAgKiBiZSBpbnNlcnRlZCBhdCBhIHNwZWNpZmljIGluZGV4LiAgXG4gICAgICogXG4gICAgICogTk9URTogVGhpcyBtZXRob2Qgc2hvdWxkIGJlIGNhbGxlZCBiZWZvcmUgdGhlIGBpbml0KClgIG1ldGhvZC5cbiAgICAgKiBAcGFyYW0ge09iamVjdH0gY29sdW1uIENvbHVtbiBvYmplY3QgZGVmaW5pdGlvbi5cbiAgICAgKiBAcGFyYW0ge251bWJlcn0gW2luZGV4UG9zaXRpb249bnVsbF0gSW5kZXggdG8gaW5zZXJ0IHRoZSBjb2x1bW4gYXQuIElmIG51bGwsIGFwcGVuZHMgdG8gdGhlIGVuZC5cbiAgICAgKi9cbiAgICBhZGRDb2x1bW4oY29sdW1uLCBpbmRleFBvc2l0aW9uID0gbnVsbCkge1xuICAgICAgICB0aGlzLmNvbnRleHQuY29sdW1uTWFuYWdlci5hZGRDb2x1bW4oY29sdW1uLCBpbmRleFBvc2l0aW9uKTtcbiAgICB9XG4gICAgLyoqXG4gICAgICogSXRlcmF0ZXMgdGhvdWdoIGEgbGlzdCBvZiBtb2R1bGVzIHRvIGluc3RhbnRpYXRlIGFuZCBpbml0aWFsaXplIHN0YXJ0IHVwIGFuZC9vciBidWlsZCBiZWhhdmlvci4gIFNob3VsZCBiZSBjYWxsZWQgYWZ0ZXIgXG4gICAgICogYWxsIG1vZHVsZXMgaGF2ZSBiZWVuIHJlZ2lzdGVyZWQgdXNpbmcgdGhlIGBhZGRNb2R1bGVzYCBtZXRob2QsIGFuZCBvbmx5IG5lZWRzIHRvIGJlIGNhbGxlZCBvbmNlLlxuICAgICAqL1xuICAgICNpbml0TW9kdWxlcyA9IGFzeW5jICgpID0+IHtcbiAgICAgICAgaWYgKHRoaXMuI21vZHVsZXNDcmVhdGVkKVxuICAgICAgICAgICAgcmV0dXJuO1xuXG4gICAgICAgIC8vVmVyaWZ5IGlmIGJhc2UgcmVxdWlyZWQgcm93IHJlbGF0ZWQgbW9kdWxlIGhhcyBiZWVuIGFkZGVkIHRvIHRoZSBncmlkLlxuICAgICAgICBpZiAodGhpcy5zZXR0aW5ncy5lbmFibGVQYWdpbmcgJiYgIXRoaXMuI21vZHVsZVR5cGVzLnNvbWUoKHgpID0+IHgubW9kdWxlTmFtZSA9PT0gXCJwYWdlXCIpKSB7XG4gICAgICAgICAgICB0aGlzLiNtb2R1bGVUeXBlcy5wdXNoKFBhZ2VyTW9kdWxlKTtcbiAgICAgICAgfSBlbHNlIGlmICghdGhpcy4jbW9kdWxlVHlwZXMuc29tZSgoeCkgPT4geC5tb2R1bGVOYW1lID09PSBcInJvd1wiKSkge1xuICAgICAgICAgICAgIHRoaXMuI21vZHVsZVR5cGVzLnB1c2goUm93TW9kdWxlKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMuI21vZHVsZVR5cGVzLmZvckVhY2goKG0pID0+IHtcbiAgICAgICAgICAgIHRoaXMuY29udGV4dC5tb2R1bGVzW20ubW9kdWxlTmFtZV0gPSBuZXcgbSh0aGlzLmNvbnRleHQpO1xuICAgICAgICAgICAgdGhpcy5jb250ZXh0Lm1vZHVsZXNbbS5tb2R1bGVOYW1lXS5pbml0aWFsaXplKCk7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIHRoaXMuI21vZHVsZXNDcmVhdGVkID0gdHJ1ZTtcbiAgICAgICAgYXdhaXQgdGhpcy5jb250ZXh0LmV2ZW50cy50cmlnZ2VyKFwicG9zdEluaXRNb2RcIik7XG4gICAgfTtcbiAgICAvKipcbiAgICAgKiBJbnN0YW50aWF0ZXMgdGhlIGNyZWF0aW9uIG9mIHRoZSBncmlkLiAgTWV0aG9kIHdpbGwgY3JlYXRlIHRoZSBncmlkJ3MgZWxlbWVudHMsIHJ1biBhbGwgcmVnaXN0ZXJlZCBtb2R1bGVzLCBkYXRhIHByb2Nlc3NpbmcgXG4gICAgICogcGlwZWxpbmVzIGFuZCBldmVudHMuICBJZiBncmlkIGlzIGJlaW5nIGJ1aWx0IHVzaW5nIHRoZSBtb2R1bGFyIGFwcHJvYWNoLCBiZSBzdXJlIHRvIGNhbGwgdGhlIGBhZGRNb2R1bGVzYCBtZXRob2QgYmVmb3JlIFxuICAgICAqIGNhbGxpbmcgdGhpcyBvbmUgdG8gZW5zdXJlIGFsbCBtb2R1bGVzIGFyZSByZWdpc3RlcmVkIGFuZCBpbml0aWFsaXplZCBpbiB0aGVpciBwcm9wZXIgb3JkZXIuXG4gICAgICogXG4gICAgICogTk9URTogTWV0aG9kIHdpbGwgYXV0b21hdGljYWxseSByZWdpc3RlciB0aGUgYFBhZ2VyTW9kdWxlYCBpZiBwYWdpbmcgaXMgZW5hYmxlZCwgb3IgdGhlIGBSb3dNb2R1bGVgIGlmIHBhZ2luZyBpcyBub3QgZW5hYmxlZC5cbiAgICAgKi9cbiAgICBhc3luYyBpbml0KCkge1xuICAgICAgICBpZiAoIXRoaXMuaXNWYWxpZCkge1xuICAgICAgICAgICAgY29uc29sZS5sb2coXCJNaXNzaW5nIHJlcXVpcmVkIGNvbHVtbnMgZGVmaW5pdGlvbi5cIik7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLmNvbnRleHQuZ3JpZC5pbml0aWFsaXplSGVhZGVyKCk7XG5cbiAgICAgICAgYXdhaXQgdGhpcy4jaW5pdE1vZHVsZXMoKTtcblxuICAgICAgICBpZiAoIXRoaXMuc2V0dGluZ3MucmVtb3RlUHJvY2Vzc2luZyAmJiB0aGlzLnNldHRpbmdzLnJlbW90ZVVybCkge1xuICAgICAgICAgICAgLy9sb2NhbCBkYXRhIHNvdXJjZSBwcm9jZXNzaW5nOyBzZXQgcGlwZWxpbmUgYWN0aW9ucy5cbiAgICAgICAgICAgIHRoaXMuY29udGV4dC5waXBlbGluZS5hZGRTdGVwKFwiaW5pdFwiLCB0aGlzLmNvbnRleHQucGVyc2lzdGVuY2Uuc2V0RGF0YSk7XG4gICAgICAgIH1cbiAgICAgICAgLy9leGVjdXRlIGRhdGEgcGlwZWxpbmUgYmVmb3JlIGJ1aWxkaW5nIGVsZW1lbnRzLlxuICAgICAgICBpZiAodGhpcy5jb250ZXh0LnBpcGVsaW5lLmhhc1BpcGVsaW5lKFwiaW5pdFwiKSkge1xuICAgICAgICAgICAgYXdhaXQgdGhpcy5jb250ZXh0LnBpcGVsaW5lLmV4ZWN1dGUoXCJpbml0XCIpO1xuICAgICAgICB9XG5cbiAgICAgICAgYXdhaXQgdGhpcy5jb250ZXh0LmV2ZW50cy50cmlnZ2VyKFwicmVuZGVyXCIpO1xuICAgIH1cbiAgICAvKipcbiAgICAgKiBBcHBseSBmaWx0ZXIgY29uZGl0aW9uIGZvciB0YXJnZXQgY29sdW1uLiAgTWV0aG9kIHByb3ZpZGVzIGEgbWVhbnMgdG8gYXBwbHkgY29uZGl0aW9uIG91dHNpZGUgb2YgaGVhZGVyIGZpbHRlciBjb250cm9scy5cbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gZmllbGQgVGFyZ2V0IGZpZWxkLlxuICAgICAqIEBwYXJhbSB7b2JqZWN0fSB2YWx1ZSBGaWx0ZXIgdmFsdWUuXG4gICAgICogQHBhcmFtIHtzdHJpbmcgfCBGdW5jdGlvbn0gW3R5cGU9XCJlcXVhbHNcIl0gRmlsdGVyIHR5cGUuICBJZiBhIGZ1bmN0aW9uIGlzIHByb3ZpZGVkLCBpdCB3aWxsIGJlIHVzZWQgYXMgdGhlIGZpbHRlciBjb25kaXRpb24uXG4gICAgICogT3RoZXJ3aXNlLCB1c2UgdGhlIGFzc29jaWF0ZWQgc3RyaW5nIHZhbHVlIHR5cGUgdG8gZGV0ZXJtaW5lIHRoZSBmaWx0ZXIgY29uZGl0aW9uLiAgaS5lLiBcImVxdWFsc1wiLCBcImNvbnRhaW5zXCIsIGV0Yy5cbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gW2ZpZWxkVHlwZT1cInN0cmluZ1wiXSBGaWVsZCB0eXBlLlxuICAgICAqIEBwYXJhbSB7b2JqZWN0fSBbZmlsdGVyUGFyYW1zPXt9XSBBZGRpdGlvbmFsIGZpbHRlciBwYXJhbWV0ZXJzLlxuICAgICAqL1xuICAgIHNldEZpbHRlciA9IGFzeW5jIChmaWVsZCwgdmFsdWUsIHR5cGUgPSBcImVxdWFsc1wiLCBmaWVsZFR5cGUgPSBcInN0cmluZ1wiLCBmaWx0ZXJQYXJhbXMgPSB7fSkgPT4ge1xuICAgICAgICBpZiAodGhpcy5jb250ZXh0Lm1vZHVsZXMuZmlsdGVyKSB7XG4gICAgICAgICAgICB0aGlzLmNvbnRleHQubW9kdWxlcy5maWx0ZXIuc2V0RmlsdGVyKGZpZWxkLCB2YWx1ZSwgdHlwZSwgZmllbGRUeXBlLCBmaWx0ZXJQYXJhbXMpO1xuXG4gICAgICAgICAgICBhd2FpdCB0aGlzLmNvbnRleHQuZXZlbnRzLnRyaWdnZXIoXCJyZW5kZXJcIik7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBjb25zb2xlLndhcm4oXCJGaWx0ZXIgbW9kdWxlIGlzIG5vdCBlbmFibGVkLiAgU2V0IGBEYXRhR3JpZC5kZWZhdWx0T3B0aW9ucy5lbmFibGVGaWx0ZXJgIHRvIHRydWUgaW4gb3JkZXIgdG8gZW5hYmxlIHRoaXMgZnVuY3Rpb24uXCIpO1xuICAgICAgICB9XG4gICAgfTtcbiAgICAvKipcbiAgICAgKiBSZW1vdmUgZmlsdGVyIGNvbmRpdGlvbiBmb3IgdGFyZ2V0IGZpZWxkLlxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBmaWVsZCBUYXJnZXQgZmllbGQuXG4gICAgICovXG4gICAgcmVtb3ZlRmlsdGVyID0gYXN5bmMgKGZpZWxkKSA9PiB7XG4gICAgICAgIGlmICh0aGlzLmNvbnRleHQubW9kdWxlcy5maWx0ZXIpIHtcbiAgICAgICAgICAgIHRoaXMuY29udGV4dC5tb2R1bGVzLmZpbHRlci5yZW1vdmVGaWx0ZXIoZmllbGQpO1xuXG4gICAgICAgICAgICBhd2FpdCB0aGlzLmNvbnRleHQuZXZlbnRzLnRyaWdnZXIoXCJyZW5kZXJcIik7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBjb25zb2xlLndhcm4oXCJGaWx0ZXIgbW9kdWxlIGlzIG5vdCBlbmFibGVkLiAgU2V0IGBEYXRhR3JpZC5kZWZhdWx0T3B0aW9ucy5lbmFibGVGaWx0ZXJgIHRvIHRydWUgaW4gb3JkZXIgdG8gZW5hYmxlIHRoaXMgZnVuY3Rpb24uXCIpO1xuICAgICAgICB9XG4gICAgfTtcbn1cblxuZXhwb3J0IHsgR3JpZENvcmUgfTsiLCIvKipcbiAqIFByb3ZpZGVzIGxvZ2ljIHRvIGNvbnZlcnQgZ3JpZCBkYXRhIGludG8gYSBkb3dubG9hZGFibGUgQ1NWIGZpbGUuXG4gKiBNb2R1bGUgd2lsbCBwcm92aWRlIGxpbWl0ZWQgZm9ybWF0dGluZyBvZiBkYXRhLiAgT25seSBjb2x1bW5zIHdpdGggYSBmb3JtYXR0ZXIgdHlwZSBcbiAqIG9mIGBtb2R1bGVgIG9yIGBmdW5jdGlvbmAgd2lsbCBiZSBwcm9jZXNzZWQuICBBbGwgb3RoZXIgY29sdW1ucyB3aWxsIGJlIHJldHVybmVkIGFzXG4gKiB0aGVpciByYXcgZGF0YSB0eXBlLiAgSWYgYSBjb2x1bW4ncyB2YWx1ZSBjb250YWlucyBhIGNvbW1hLCB0aGUgdmFsdWUgd2lsbCBiZSBkb3VibGUgcXVvdGVkLlxuICovXG5jbGFzcyBDc3ZNb2R1bGUge1xuICAgIC8qKlxuICAgICAqIEFsbG93cyBncmlkJ3MgZGF0YSB0byBiZSBjb252ZXJ0ZWQgaW50byBhIGRvd25sb2FkYWJsZSBDU1YgZmlsZS4gIElmIGdyaWQgaXMgXG4gICAgICogc2V0IHRvIGEgbG9jYWwgZGF0YSBzb3VyY2UsIHRoZSBkYXRhIGNhY2hlIGluIHRoZSBwZXJzaXN0ZW5jZSBjbGFzcyBpcyB1c2VkLlxuICAgICAqIE90aGVyd2lzZSwgY2xhc3Mgd2lsbCBtYWtlIGFuIEFqYXggY2FsbCB0byByZW1vdGUgdGFyZ2V0IHNldCBpbiBkYXRhIGxvYWRlclxuICAgICAqIGNsYXNzLlxuICAgICAqIEBwYXJhbSB7R3JpZENvbnRleHR9IGNvbnRleHQgR3JpZCBjb250ZXh0IGNsYXNzLlxuICAgICAqL1xuICAgIGNvbnN0cnVjdG9yKGNvbnRleHQpIHtcbiAgICAgICAgdGhpcy5jb250ZXh0ID0gY29udGV4dDtcbiAgICAgICAgdGhpcy5kZWxpbWl0ZXIgPSBcIixcIjtcbiAgICAgICAgdGhpcy5idXR0b24gPSBjb250ZXh0LnNldHRpbmdzLmNzdkV4cG9ydElkO1xuICAgICAgICB0aGlzLmRhdGFVcmwgPSBjb250ZXh0LnNldHRpbmdzLmNzdkV4cG9ydFJlbW90ZVNvdXJjZTtcbiAgICB9XG5cbiAgICBpbml0aWFsaXplKCkge1xuICAgICAgICBjb25zdCBidG4gPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCh0aGlzLmJ1dHRvbik7XG4gICAgICAgIFxuICAgICAgICBidG4uYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsIHRoaXMuaGFuZGxlRG93bmxvYWQpO1xuICAgIH1cblxuICAgIGhhbmRsZURvd25sb2FkID0gYXN5bmMgKCkgPT4ge1xuICAgICAgICBsZXQgY3N2RGF0YSA9IFtdO1xuICAgICAgICBjb25zdCBmaWxlTmFtZSA9IGAke2RvY3VtZW50LnRpdGxlfS5jc3ZgO1xuXG4gICAgICAgIGlmICh0aGlzLmRhdGFVcmwpIHtcbiAgICAgICAgICAgIGNvbnN0IGRhdGEgPSBhd2FpdCB0aGlzLmNvbnRleHQuZGF0YWxvYWRlci5yZXF1ZXN0RGF0YSh0aGlzLmRhdGFVcmwpO1xuXG4gICAgICAgICAgICBjc3ZEYXRhID0gdGhpcy5idWlsZEZpbGVDb250ZW50KGRhdGEpLmpvaW4oXCJcXHJcXG5cIik7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBjc3ZEYXRhID0gdGhpcy5idWlsZEZpbGVDb250ZW50KHRoaXMuY29udGV4dC5wZXJzaXN0ZW5jZS5kYXRhQ2FjaGUpLmpvaW4oXCJcXHJcXG5cIik7XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCBibG9iID0gbmV3IEJsb2IoW2NzdkRhdGFdLCB7IHR5cGU6IFwidGV4dC9jc3Y7Y2hhcnNldD11dGYtODtcIiB9KTtcbiAgICAgICAgY29uc3QgZWxlbWVudCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJhXCIpO1xuXG4gICAgICAgIGVsZW1lbnQuc2V0QXR0cmlidXRlKFwiaHJlZlwiLCB3aW5kb3cuVVJMLmNyZWF0ZU9iamVjdFVSTChibG9iKSk7XG4gICAgICAgIC8vc2V0IGZpbGUgdGl0bGVcbiAgICAgICAgZWxlbWVudC5zZXRBdHRyaWJ1dGUoXCJkb3dubG9hZFwiLCBmaWxlTmFtZSk7XG4gICAgICAgIC8vdHJpZ2dlciBkb3dubG9hZFxuICAgICAgICBlbGVtZW50LnN0eWxlLmRpc3BsYXkgPSBcIm5vbmVcIjtcbiAgICAgICAgZG9jdW1lbnQuYm9keS5hcHBlbmRDaGlsZChlbGVtZW50KTtcbiAgICAgICAgZWxlbWVudC5jbGljaygpO1xuICAgICAgICAvL3JlbW92ZSB0ZW1wb3JhcnkgbGluayBlbGVtZW50XG4gICAgICAgIGRvY3VtZW50LmJvZHkucmVtb3ZlQ2hpbGQoZWxlbWVudCk7XG5cbiAgICAgICAgd2luZG93LmFsZXJ0KGBEb3dubG9hZGVkICR7ZmlsZU5hbWV9YCk7XG4gICAgfTtcbiAgICAvKipcbiAgICAgKiBSZXR1cm5zIGFuIG9iamVjdCB0aGF0IHJlcHJlc2VudHMgdGhlIGNvbHVtbnMgYW5kIGhlYWRlciBuYW1lcyB0aGF0IHNob3VsZCBiZSB1c2VkXG4gICAgICogdG8gY3JlYXRlIHRoZSBDU1YgcmVzdWx0cy4gIFdpbGwgZXhjbHVkZSBjb2x1bW5zIHdpdGggYSB0eXBlIG9mIGBpY29uYC5cbiAgICAgKiBAcGFyYW0ge09iamVjdH0gY29sdW1uTWdyQ29sdW1ucyBDb2x1bW4gTWFuYWdlciBDb2x1bW5zIGNvbGxlY3Rpb24uXG4gICAgICogQHJldHVybnMge3sgaGVhZGVyczogQXJyYXk8c3RyaW5nPiwgY29sdW1uczogQXJyYXk8Q29sdW1uPiB9fVxuICAgICAqL1xuICAgIGlkZW50aWZ5Q29sdW1ucyhjb2x1bW5NZ3JDb2x1bW5zKSB7XG4gICAgICAgIGNvbnN0IGhlYWRlcnMgPSBbXTtcbiAgICAgICAgY29uc3QgY29sdW1ucyA9IFtdO1xuXG4gICAgICAgIGZvciAoY29uc3QgY29sdW1uIG9mIGNvbHVtbk1nckNvbHVtbnMpIHtcbiAgICAgICAgICAgIGlmIChjb2x1bW4udHlwZSA9PT0gXCJpY29uXCIpIGNvbnRpbnVlO1xuXG4gICAgICAgICAgICBoZWFkZXJzLnB1c2goY29sdW1uLmxhYmVsKTtcbiAgICAgICAgICAgIGNvbHVtbnMucHVzaChjb2x1bW4pO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHsgaGVhZGVyczogaGVhZGVycywgY29sdW1uczogY29sdW1ucyB9OyBcbiAgICB9XG4gICAgLyoqXG4gICAgICogQ29udmVydHMgZ3JpZCBkYXRhIGluIERhdGFQZXJzaXN0ZW5jZSBjbGFzcyBpbnRvIGEgc2luZ2xlIGRpbWVuc2lvbmFsIGFycmF5IG9mXG4gICAgICogc3RyaW5nIGRlbGltaXRlZCB2YWx1ZXMgdGhhdCByZXByZXNlbnRzIGEgcm93IG9mIGRhdGEgaW4gYSBjc3YgZmlsZS4gXG4gICAgICogQHBhcmFtIHtBcnJheTxPYmplY3Q+fSBkYXRhc2V0IGRhdGEgc2V0IHRvIGJ1aWxkIGNzdiByb3dzLlxuICAgICAqIEByZXR1cm5zIHtBcnJheTxzdHJpbmc+fVxuICAgICAqL1xuICAgIGJ1aWxkRmlsZUNvbnRlbnQoZGF0YXNldCkge1xuICAgICAgICBjb25zdCBmaWxlQ29udGVudHMgPSBbXTtcbiAgICAgICAgY29uc3QgY29sdW1ucyA9IHRoaXMuaWRlbnRpZnlDb2x1bW5zKHRoaXMuY29udGV4dC5jb2x1bW5NYW5hZ2VyLmNvbHVtbnMpO1xuICAgICAgICAvL2NyZWF0ZSBkZWxpbWl0ZWQgaGVhZGVyLlxuICAgICAgICBmaWxlQ29udGVudHMucHVzaChjb2x1bW5zLmhlYWRlcnMuam9pbih0aGlzLmRlbGltaXRlcikpO1xuICAgICAgICAvL2NyZWF0ZSByb3cgZGF0YVxuICAgICAgICBmb3IgKGNvbnN0IHJvd0RhdGEgb2YgZGF0YXNldCkge1xuICAgICAgICAgICAgY29uc3QgcmVzdWx0ID0gY29sdW1ucy5jb2x1bW5zLm1hcCgoYykgPT4gdGhpcy5mb3JtYXRWYWx1ZShjLCByb3dEYXRhKSk7XG5cbiAgICAgICAgICAgIGZpbGVDb250ZW50cy5wdXNoKHJlc3VsdC5qb2luKHRoaXMuZGVsaW1pdGVyKSk7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gZmlsZUNvbnRlbnRzO1xuICAgIH1cbiAgICAvKipcbiAgICAgKiBSZXR1cm5zIGEgZm9ybWF0dGVkIHN0cmluZyBiYXNlZCBvbiB0aGUgQ29sdW1uJ3MgZm9ybWF0dGVyIHNldHRpbmcuXG4gICAgICogV2lsbCBkb3VibGUgcXVvdGUgc3RyaW5nIGlmIGNvbW1hIGNoYXJhY3RlciBpcyBmb3VuZCBpbiB2YWx1ZS5cbiAgICAgKiBAcGFyYW0ge0NvbHVtbn0gY29sdW1uIGNvbHVtbiBtb2RlbC5cbiAgICAgKiBAcGFyYW0ge09iamVjdH0gcm93RGF0YSByb3cgZGF0YS5cbiAgICAgKiBAcmV0dXJucyB7c3RyaW5nfVxuICAgICAqL1xuICAgIGZvcm1hdFZhbHVlKGNvbHVtbiwgcm93RGF0YSkge1xuICAgICAgICBsZXQgdmFsdWUgPSBTdHJpbmcocm93RGF0YVtjb2x1bW4uZmllbGRdKTtcbiAgICAgICAgLy9hcHBseSBsaW1pdGVkIGZvcm1hdHRpbmc7IGNzdiByZXN1bHRzIHNob3VsZCBiZSAncmF3JyBkYXRhLlxuICAgICAgICBpZiAoY29sdW1uLmZvcm1hdHRlcikge1xuICAgICAgICAgICAgaWYgKHR5cGVvZiBjb2x1bW4uZm9ybWF0dGVyID09PSBcImZ1bmN0aW9uXCIpIHtcbiAgICAgICAgICAgICAgICB2YWx1ZSA9IFN0cmluZyhjb2x1bW4uZm9ybWF0dGVyKHJvd0RhdGEsIGNvbHVtbi5mb3JtYXR0ZXJQYXJhbXMpKTtcbiAgICAgICAgICAgIH0gZWxzZSBpZiAoY29sdW1uLmZvcm1hdHRlciA9PT0gXCJtb2R1bGVcIikge1xuICAgICAgICAgICAgICAgIHZhbHVlID0gU3RyaW5nKHRoaXMuY29udGV4dC5tb2R1bGVzW2NvbHVtbi5mb3JtYXR0ZXJQYXJhbXMubmFtZV0uYXBwbHkocm93RGF0YSwgY29sdW1uLCBcImNzdlwiKSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgLy9jaGVjayBmb3Igc3RyaW5ncyB0aGF0IG1heSBuZWVkIHRvIGJlIHF1b3RlZC5cbiAgICAgICAgaWYgKHZhbHVlLmluY2x1ZGVzKFwiLFwiKSkge1xuICAgICAgICAgICAgdmFsdWUgPSBgXCIke3ZhbHVlfVwiYDtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiB2YWx1ZTtcbiAgICB9XG59XG5cbkNzdk1vZHVsZS5tb2R1bGVOYW1lID0gXCJjc3ZcIjtcblxuZXhwb3J0IHsgQ3N2TW9kdWxlIH07IiwiLyoqXG4gKiBDbGFzcyB0aGF0IGRlZmluZXMgYSBzaW5nbGUgZmlsdGVyIGNvbmRpdGlvbiBmb3IgYSBjb2x1bW4uXG4gKi9cbmNsYXNzIEZpbHRlclRhcmdldCB7XG4gICAgLyoqXG4gICAgICogQ3JlYXRlcyBmaWx0ZXIgdGFyZ2V0IG9iamVjdCB0aGF0IGRlZmluZXMgYSBzaW5nbGUgZmlsdGVyIGNvbmRpdGlvbi4gIEV4cGVjdHMgYW4gb2JqZWN0IHdpdGggdGhlIGZvbGxvd2luZyBwcm9wZXJ0aWVzOlxuICAgICAqICogYHZhbHVlYDogVGhlIHZhbHVlIHRvIGZpbHRlciBhZ2FpbnN0LiAgRXhwZWN0cyB0aGF0IHZhbHVlIG1hdGNoZXMgdGhlIHR5cGUgb2YgdGhlIGZpZWxkIGJlaW5nIGZpbHRlcmVkLiAgU2hvdWxkIGJlIG51bGwgaWYgXG4gICAgICogdmFsdWUgdHlwZSBjYW5ub3QgYmUgY29udmVydGVkIHRvIHRoZSBmaWVsZCB0eXBlLlxuICAgICAqICogYGZpZWxkYDogVGhlIGZpZWxkIG5hbWUgb2YgdGhlIGNvbHVtbiBiZWluZyBmaWx0ZXJlZC4gIFRoaXMgaXMgdXNlZCB0byBpZGVudGlmeSB0aGUgY29sdW1uIGluIHRoZSBkYXRhIHNldC5cbiAgICAgKiAqIGBmaWVsZFR5cGVgOiBUaGUgdHlwZSBvZiBmaWVsZCBiZWluZyBmaWx0ZXJlZCAoZS5nLiwgXCJzdHJpbmdcIiwgXCJudW1iZXJcIiwgXCJkYXRlXCIsIFwib2JqZWN0XCIpLiAgVGhpcyBpcyB1c2VkIHRvIGRldGVybWluZSBob3cgdG8gY29tcGFyZSB0aGUgdmFsdWUuXG4gICAgICogKiBgZmlsdGVyVHlwZWA6IFRoZSB0eXBlIG9mIGZpbHRlciB0byBhcHBseSAoZS5nLiwgXCJlcXVhbHNcIiwgXCJsaWtlXCIsIFwiPFwiLCBcIjw9XCIsIFwiPlwiLCBcIj49XCIsIFwiIT1cIiwgXCJiZXR3ZWVuXCIsIFwiaW5cIikuXG4gICAgICogQHBhcmFtIHt7IHZhbHVlOiAoc3RyaW5nIHwgbnVtYmVyIHwgRGF0ZSB8IE9iamVjdCB8IG51bGwpLCBmaWVsZDogc3RyaW5nLCBmaWVsZFR5cGU6IHN0cmluZywgZmlsdGVyVHlwZTogc3RyaW5nIH19IHRhcmdldCBcbiAgICAgKi9cbiAgICBjb25zdHJ1Y3Rvcih0YXJnZXQpIHtcbiAgICAgICAgdGhpcy52YWx1ZSA9IHRhcmdldC52YWx1ZTtcbiAgICAgICAgdGhpcy5maWVsZCA9IHRhcmdldC5maWVsZDtcbiAgICAgICAgdGhpcy5maWVsZFR5cGUgPSB0YXJnZXQuZmllbGRUeXBlIHx8IFwic3RyaW5nXCI7IC8vIERlZmF1bHQgdG8gc3RyaW5nIGlmIG5vdCBwcm92aWRlZFxuICAgICAgICB0aGlzLmZpbHRlclR5cGUgPSB0YXJnZXQuZmlsdGVyVHlwZTtcbiAgICAgICAgdGhpcy5maWx0ZXJzID0gdGhpcy4jaW5pdCgpO1xuICAgIH1cblxuICAgICNpbml0KCkge1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgLy9lcXVhbCB0b1xuICAgICAgICAgICAgXCJlcXVhbHNcIjogZnVuY3Rpb24oZmlsdGVyVmFsLCByb3dWYWwpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gZmlsdGVyVmFsID09PSByb3dWYWw7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgLy9saWtlXG4gICAgICAgICAgICBcImxpa2VcIjogZnVuY3Rpb24oZmlsdGVyVmFsLCByb3dWYWwpIHtcbiAgICAgICAgICAgICAgICBpZiAocm93VmFsID09PSB1bmRlZmluZWQgfHwgcm93VmFsID09PSBudWxsIHx8IHJvd1ZhbCA9PT0gXCJcIikge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgICAgICAgICByZXR1cm4gU3RyaW5nKHJvd1ZhbCkudG9Mb3dlckNhc2UoKS5pbmRleE9mKGZpbHRlclZhbC50b0xvd2VyQ2FzZSgpKSA+IC0xO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIC8vbGVzcyB0aGFuXG4gICAgICAgICAgICBcIjxcIjogZnVuY3Rpb24oZmlsdGVyVmFsLCByb3dWYWwpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gZmlsdGVyVmFsIDwgcm93VmFsO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIC8vbGVzcyB0aGFuIG9yIGVxdWFsIHRvXG4gICAgICAgICAgICBcIjw9XCI6IGZ1bmN0aW9uKGZpbHRlclZhbCwgcm93VmFsKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGZpbHRlclZhbCA8PSByb3dWYWw7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgLy9ncmVhdGVyIHRoYW5cbiAgICAgICAgICAgIFwiPlwiOiBmdW5jdGlvbihmaWx0ZXJWYWwsIHJvd1ZhbCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBmaWx0ZXJWYWwgPiByb3dWYWw7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgLy9ncmVhdGVyIHRoYW4gb3IgZXF1YWwgdG9cbiAgICAgICAgICAgIFwiPj1cIjogZnVuY3Rpb24oZmlsdGVyVmFsLCByb3dWYWwpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gZmlsdGVyVmFsID49IHJvd1ZhbDtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAvL25vdCBlcXVhbCB0b1xuICAgICAgICAgICAgXCIhPVwiOiBmdW5jdGlvbihmaWx0ZXJWYWwsIHJvd1ZhbCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByb3dWYWwgIT09IGZpbHRlclZhbDtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAvLyBiZXR3ZWVuLiAgZXhwZWN0cyBmaWx0ZXJWYWwgdG8gYmUgYW4gYXJyYXkgb2Y6IFsge3N0YXJ0IHZhbHVlfSwgeyBlbmQgdmFsdWUgfSBdIFxuICAgICAgICAgICAgXCJiZXR3ZWVuXCI6IGZ1bmN0aW9uKGZpbHRlclZhbCwgcm93VmFsKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJvd1ZhbCA+PSBmaWx0ZXJWYWxbMF0gJiYgcm93VmFsIDw9IGZpbHRlclZhbFsxXTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAvL2luIGFycmF5LlxuICAgICAgICAgICAgXCJpblwiOiBmdW5jdGlvbihmaWx0ZXJWYWwsIHJvd1ZhbCkge1xuICAgICAgICAgICAgICAgIGlmIChBcnJheS5pc0FycmF5KGZpbHRlclZhbCkpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGZpbHRlclZhbC5sZW5ndGggPyBmaWx0ZXJWYWwuaW5kZXhPZihyb3dWYWwpID4gLTEgOiB0cnVlO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUud2FybihcIkZpbHRlciBFcnJvciAtIGZpbHRlciB2YWx1ZSBpcyBub3QgYW4gYXJyYXk6XCIsIGZpbHRlclZhbCk7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG4gICAgfVxuICAgIC8qKlxuICAgICAqIEV4ZWN1dGVzIGFuIGludGVybmFsIGZ1bmN0aW9uIHRvIGluZGljYXRlIGlmIHRoZSBjdXJyZW50IHJvdyB2YWx1ZXMgbWF0Y2hlcyB0aGUgZmlsdGVyIGNyaXRlcmlhJ3MgdmFsdWUuICBcbiAgICAgKiBAcGFyYW0ge09iamVjdH0gcm93VmFsIFJvdyBjb2x1bW4gdmFsdWUuICBFeHBlY3RzIGEgdmFsdWUgdGhhdCBtYXRjaGVzIHRoZSB0eXBlIGlkZW50aWZpZWQgYnkgdGhlIGNvbHVtbi5cbiAgICAgKiBAcGFyYW0ge09iamVjdDxBcnJheT59IHJvdyBDdXJyZW50IGRhdGEgc2V0IHJvdy5cbiAgICAgKiBAcmV0dXJucyB7Ym9vbGVhbn0gUmV0dXJucyB0cnVlIGlmIHJvdyB2YWx1ZSBtYXRjaGVzIGZpbHRlciB2YWx1ZS4gIE90aGVyd2lzZSwgZmFsc2UgaW5kaWNhdGluZyBubyBtYXRjaC5cbiAgICAgKi9cbiAgICBleGVjdXRlKHJvd1ZhbCwgcm93KSB7XG4gICAgICAgIHJldHVybiB0aGlzLmZpbHRlcnNbdGhpcy5maWx0ZXJUeXBlXSh0aGlzLnZhbHVlLCByb3dWYWwpO1xuICAgIH1cbn1cblxuZXhwb3J0IHsgRmlsdGVyVGFyZ2V0IH07IiwiaW1wb3J0IHsgRGF0ZUhlbHBlciB9IGZyb20gXCIuLi8uLi8uLi9jb21wb25lbnRzL2hlbHBlcnMvZGF0ZUhlbHBlci5qc1wiO1xuLyoqXG4gKiBDbGFzcyB0aGF0IGRlZmluZXMgYSBzaW5nbGUgZmlsdGVyIGNvbmRpdGlvbiBmb3IgYSBkYXRlIGNvbHVtbi5cbiAqL1xuY2xhc3MgRmlsdGVyRGF0ZSB7XG4gICAgLyoqXG4gICAgICogQ3JlYXRlcyBmaWx0ZXIgdGFyZ2V0IG9iamVjdCB0aGF0IGRlZmluZXMgYSBzaW5nbGUgZmlsdGVyIGNvbmRpdGlvbiBmb3IgYSBkYXRlIGRhdGEgdHlwZS4gIEV4cGVjdHMgYW4gb2JqZWN0IHdpdGggdGhlIGZvbGxvd2luZyBwcm9wZXJ0aWVzOlxuICAgICAqICogYHZhbHVlYDogVGhlIHZhbHVlIHRvIGZpbHRlciBhZ2FpbnN0LiAgRXhwZWN0cyB0aGF0IHZhbHVlIG1hdGNoZXMgdGhlIHR5cGUgb2YgdGhlIGZpZWxkIGJlaW5nIGZpbHRlcmVkLiAgU2hvdWxkIGJlIG51bGwgaWYgXG4gICAgICogdmFsdWUgdHlwZSBjYW5ub3QgYmUgY29udmVydGVkIHRvIHRoZSBmaWVsZCB0eXBlLlxuICAgICAqICogYGZpZWxkYDogVGhlIGZpZWxkIG5hbWUgb2YgdGhlIGNvbHVtbiBiZWluZyBmaWx0ZXJlZC4gIFRoaXMgaXMgdXNlZCB0byBpZGVudGlmeSB0aGUgY29sdW1uIGluIHRoZSBkYXRhIHNldC5cbiAgICAgKiAqIGBmaWx0ZXJUeXBlYDogVGhlIHR5cGUgb2YgZmlsdGVyIHRvIGFwcGx5IChlLmcuLCBcImVxdWFsc1wiLCBcImxpa2VcIiwgXCI8XCIsIFwiPD1cIiwgXCI+XCIsIFwiPj1cIiwgXCIhPVwiLCBcImJldHdlZW5cIiwgXCJpblwiKS5cbiAgICAgKiBAcGFyYW0ge3sgdmFsdWU6IChEYXRlIHwgQXJyYXk8RGF0ZT4pLCBmaWVsZDogc3RyaW5nLCBmaWx0ZXJUeXBlOiBzdHJpbmcgfX0gdGFyZ2V0IFxuICAgICAqL1xuICAgIGNvbnN0cnVjdG9yKHRhcmdldCkge1xuICAgICAgICB0aGlzLnZhbHVlID0gdGFyZ2V0LnZhbHVlO1xuICAgICAgICB0aGlzLmZpZWxkID0gdGFyZ2V0LmZpZWxkO1xuICAgICAgICB0aGlzLmZpZWxkVHlwZSA9IFwiZGF0ZVwiO1xuICAgICAgICB0aGlzLmZpbHRlclR5cGUgPSB0YXJnZXQuZmlsdGVyVHlwZTtcbiAgICAgICAgdGhpcy5maWx0ZXJzID0gdGhpcy4jaW5pdCgpO1xuICAgIH1cbiAgICAvKipcbiAgICAgKiBSZXR1cm5zIGEgbmV3IGRhdGUgb2JqZWN0IGZvciBlYWNoIGRhdGUgcGFzc2VkIGluLCBzZXR0aW5nIHRoZSB0aW1lIHRvIG1pZG5pZ2h0LiAgVGhpcyBpcyB1c2VkIHRvIGVuc3VyZSB0aGF0IHRoZSBkYXRlIG9iamVjdHMgYXJlIG5vdCBtb2RpZmllZFxuICAgICAqIHdoZW4gY29tcGFyaW5nIGRhdGVzIGluIHRoZSBmaWx0ZXIgZnVuY3Rpb25zLCBhbmQgdG8gZW5zdXJlIHRoYXQgdGhlIHRpbWUgcG9ydGlvbiBvZiB0aGUgZGF0ZSBkb2VzIG5vdCBhZmZlY3QgdGhlIGNvbXBhcmlzb24uXG4gICAgICogQHBhcmFtIHtEYXRlfSBkYXRlMSBcbiAgICAgKiBAcGFyYW0ge0RhdGV9IGRhdGUyIFxuICAgICAqIEByZXR1cm5zIHtBcnJheTxEYXRlPn0gUmV0dXJucyBhbiBhcnJheSBvZiB0d28gZGF0ZSBvYmplY3RzLCBlYWNoIHNldCB0byBtaWRuaWdodCBvZiB0aGUgcmVzcGVjdGl2ZSBkYXRlIHBhc3NlZCBpbi5cbiAgICAgKi9cbiAgICBjbG9uZURhdGVzID0gKGRhdGUxLCBkYXRlMikgPT4geyBcbiAgICAgICAgY29uc3QgZDEgPSBuZXcgRGF0ZShkYXRlMSk7XG4gICAgICAgIGNvbnN0IGQyID0gbmV3IERhdGUoZGF0ZTIpO1xuXG4gICAgICAgIGQxLnNldEhvdXJzKDAsIDAsIDAsIDApO1xuICAgICAgICBkMi5zZXRIb3VycygwLCAwLCAwLCAwKTtcbiAgICAgICAgXG4gICAgICAgIHJldHVybiBbZDEsIGQyXTtcbiAgICB9O1xuXG4gICAgI2luaXQoKSB7IFxuICAgICAgICByZXR1cm4geyBcbiAgICAgICAgICAgIFwiZXF1YWxzXCI6IGZ1bmN0aW9uKGZpbHRlclZhbCwgcm93VmFsKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGZpbHRlclZhbC5nZXRGdWxsWWVhcigpID09PSByb3dWYWwuZ2V0RnVsbFllYXIoKSAmJiBmaWx0ZXJWYWwuZ2V0TW9udGgoKSA9PT0gcm93VmFsLmdldE1vbnRoKCkgJiYgZmlsdGVyVmFsLmdldERhdGUoKSA9PT0gcm93VmFsLmdldERhdGUoKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAvL2xlc3MgdGhhblxuICAgICAgICAgICAgXCI8XCI6IChmaWx0ZXJWYWwsIHJvd1ZhbCkgPT4ge1xuICAgICAgICAgICAgICAgIGNvbnN0IGRhdGVzID0gdGhpcy5jbG9uZURhdGVzKGZpbHRlclZhbCwgcm93VmFsKTtcbiBcbiAgICAgICAgICAgICAgICByZXR1cm4gZGF0ZXNbMF0uZ2V0VGltZSgpIDwgZGF0ZXNbMV0uZ2V0VGltZSgpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIC8vbGVzcyB0aGFuIG9yIGVxdWFsIHRvXG4gICAgICAgICAgICBcIjw9XCI6IChmaWx0ZXJWYWwsIHJvd1ZhbCkgPT4ge1xuICAgICAgICAgICAgICAgIGNvbnN0IGRhdGVzID0gdGhpcy5jbG9uZURhdGVzKGZpbHRlclZhbCwgcm93VmFsKTtcblxuICAgICAgICAgICAgICAgIHJldHVybiBkYXRlc1swXS5nZXRUaW1lKCkgPCBkYXRlc1sxXS5nZXRUaW1lKCk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgLy9ncmVhdGVyIHRoYW5cbiAgICAgICAgICAgIFwiPlwiOiAoZmlsdGVyVmFsLCByb3dWYWwpID0+IHtcbiAgICAgICAgICAgICAgICBjb25zdCBkYXRlcyA9IHRoaXMuY2xvbmVEYXRlcyhmaWx0ZXJWYWwsIHJvd1ZhbCk7XG5cbiAgICAgICAgICAgICAgICByZXR1cm4gZGF0ZXNbMF0uZ2V0VGltZSgpID4gZGF0ZXNbMV0uZ2V0VGltZSgpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIC8vZ3JlYXRlciB0aGFuIG9yIGVxdWFsIHRvXG4gICAgICAgICAgICBcIj49XCI6IChmaWx0ZXJWYWwsIHJvd1ZhbCkgPT4ge1xuICAgICAgICAgICAgICAgIGNvbnN0IGRhdGVzID0gdGhpcy5jbG9uZURhdGVzKGZpbHRlclZhbCwgcm93VmFsKTtcblxuICAgICAgICAgICAgICAgIHJldHVybiBkYXRlc1swXS5nZXRUaW1lKCkgPj0gZGF0ZXNbMV0uZ2V0VGltZSgpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIC8vbm90IGVxdWFsIHRvXG4gICAgICAgICAgICBcIiE9XCI6IGZ1bmN0aW9uKGZpbHRlclZhbCwgcm93VmFsKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGZpbHRlclZhbC5nZXRGdWxsWWVhcigpICE9PSByb3dWYWwuZ2V0RnVsbFllYXIoKSAmJiBmaWx0ZXJWYWwuZ2V0TW9udGgoKSAhPT0gcm93VmFsLmdldE1vbnRoKCkgJiYgZmlsdGVyVmFsLmdldERhdGUoKSAhPT0gcm93VmFsLmdldERhdGUoKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAvLyBiZXR3ZWVuLiAgZXhwZWN0cyBmaWx0ZXJWYWwgdG8gYmUgYW4gYXJyYXkgb2Y6IFsge3N0YXJ0IHZhbHVlfSwgeyBlbmQgdmFsdWUgfSBdIFxuICAgICAgICAgICAgXCJiZXR3ZWVuXCI6IChmaWx0ZXJWYWwsIHJvd1ZhbCkgID0+IHtcbiAgICAgICAgICAgICAgICBjb25zdCBmaWx0ZXJEYXRlcyA9IHRoaXMuY2xvbmVEYXRlcyhmaWx0ZXJWYWxbMF0sIGZpbHRlclZhbFsxXSk7XG4gICAgICAgICAgICAgICAgY29uc3Qgcm93RGF0ZXMgPSB0aGlzLmNsb25lRGF0ZXMocm93VmFsLCByb3dWYWwpO1xuXG4gICAgICAgICAgICAgICAgcmV0dXJuIHJvd0RhdGVzWzBdID49IGZpbHRlckRhdGVzWzBdICYmIHJvd0RhdGVzWzBdIDw9IGZpbHRlckRhdGVzWzFdO1xuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuICAgIH1cbiAgICAvKipcbiAgICAgKiBFeGVjdXRlcyBhbiBpbnRlcm5hbCBmdW5jdGlvbiB0byBpbmRpY2F0ZSBpZiB0aGUgY3VycmVudCByb3cgdmFsdWUgbWF0Y2hlcyB0aGUgZmlsdGVyIGNyaXRlcmlhJ3MgdmFsdWUuICBcbiAgICAgKiBAcGFyYW0ge0RhdGV9IHJvd1ZhbCBSb3cgY29sdW1uIHZhbHVlLiAgRXhwZWN0cyBhIERhdGUgb2JqZWN0LlxuICAgICAqIEBwYXJhbSB7T2JqZWN0PEFycmF5Pn0gcm93IEN1cnJlbnQgZGF0YSBzZXQgcm93LlxuICAgICAqIEByZXR1cm5zIHtib29sZWFufSBSZXR1cm5zIHRydWUgaWYgcm93IHZhbHVlIG1hdGNoZXMgZmlsdGVyIHZhbHVlLiAgT3RoZXJ3aXNlLCBmYWxzZSBpbmRpY2F0aW5nIG5vIG1hdGNoLlxuICAgICAqL1xuICAgIGV4ZWN1dGUocm93VmFsLCByb3cpIHtcbiAgICAgICAgaWYgKHJvd1ZhbCA9PT0gbnVsbCB8fCAhRGF0ZUhlbHBlci5pc0RhdGUocm93VmFsKSkge1xuICAgICAgICAgICAgcmV0dXJuIGZhbHNlOyAvLyBJZiByb3dWYWwgaXMgbnVsbCBvciBub3QgYSBkYXRlLCByZXR1cm4gZmFsc2UuXG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gdGhpcy5maWx0ZXJzW3RoaXMuZmlsdGVyVHlwZV0odGhpcy52YWx1ZSwgcm93VmFsKTtcbiAgICB9XG59XG5cbmV4cG9ydCB7IEZpbHRlckRhdGUgfTsiLCIvKipcbiAqIFJlcHJlc2VudHMgYSBjb25jcmV0ZSBpbXBsZW1lbnRhdGlvbiBvZiBhIGZpbHRlciB0aGF0IHVzZXMgYSB1c2VyIHN1cHBsaWVkIGZ1bmN0aW9uLlxuICovXG5jbGFzcyBGaWx0ZXJGdW5jdGlvbiB7XG4gICAgLyoqXG4gICAgICogQ3JlYXRlcyBhIGZpbHRlciBmdW5jdGlvbiBpbnN0YW5jZS4gIEV4cGVjdHMgYW4gb2JqZWN0IHdpdGggdGhlIGZvbGxvd2luZyBwcm9wZXJ0aWVzOlxuICAgICAqICogYHZhbHVlYDogVGhlIHZhbHVlIHRvIGZpbHRlciBhZ2FpbnN0LiAgRG9lcyBub3QgbmVlZCB0byBtYXRjaCB0aGUgdHlwZSBvZiB0aGUgZmllbGQgYmVpbmcgZmlsdGVyZWQuXG4gICAgICogKiBgZmllbGRgOiBUaGUgZmllbGQgbmFtZSBvZiB0aGUgY29sdW1uIGJlaW5nIGZpbHRlcmVkLiAgVGhpcyBpcyB1c2VkIHRvIGlkZW50aWZ5IHRoZSBjb2x1bW4gaW4gdGhlIGRhdGEgc2V0LlxuICAgICAqICogYGZpbHRlclR5cGVgOiBUaGUgZnVuY3Rpb24gdG8gdXNlIGZvciBmaWx0ZXJpbmcuXG4gICAgICogKiBgcGFyYW1zYDogT3B0aW9uYWwgcGFyYW1ldGVycyB0byBwYXNzIHRvIHRoZSBmaWx0ZXIgZnVuY3Rpb24uXG4gICAgICogQHBhcmFtIHt7IHZhbHVlOiBPYmplY3QsIGZpZWxkOiBzdHJpbmcsIGZpbHRlclR5cGU6IEZ1bmN0aW9uLCBwYXJhbXM6IE9iamVjdCB9fSB0YXJnZXQgXG4gICAgICovXG4gICAgY29uc3RydWN0b3IodGFyZ2V0KSB7XG4gICAgICAgIHRoaXMudmFsdWUgPSB0YXJnZXQudmFsdWU7XG4gICAgICAgIHRoaXMuZmllbGQgPSB0YXJnZXQuZmllbGQ7XG4gICAgICAgIHRoaXMuZmlsdGVyRnVuY3Rpb24gPSB0YXJnZXQuZmlsdGVyVHlwZTtcbiAgICAgICAgdGhpcy5wYXJhbXMgPSB0YXJnZXQucGFyYW1zID8/IHt9O1xuICAgIH1cbiAgICAvKipcbiAgICAgKiBFeGVjdXRlcyBhbiB1c2VyIHN1cHBsaWVkIGZ1bmN0aW9uIHRvIGluZGljYXRlIGlmIHRoZSBjdXJyZW50IHJvdyB2YWx1ZXMgbWF0Y2hlcyB0aGUgZmlsdGVyIGNyaXRlcmlhJ3MgdmFsdWUuICBcbiAgICAgKiBAcGFyYW0ge09iamVjdH0gcm93VmFsIFJvdyBjb2x1bW4gdmFsdWUuICBFeHBlY3RzIGEgdmFsdWUgdGhhdCBtYXRjaGVzIHRoZSB0eXBlIGlkZW50aWZpZWQgYnkgdGhlIGNvbHVtbi5cbiAgICAgKiBAcGFyYW0ge09iamVjdDxBcnJheT59IHJvdyBDdXJyZW50IGRhdGEgc2V0IHJvdy5cbiAgICAgKiBAcmV0dXJucyB7Ym9vbGVhbn0gUmV0dXJucyB0cnVlIGlmIHJvdyB2YWx1ZSBtYXRjaGVzIGZpbHRlciB2YWx1ZS4gIE90aGVyd2lzZSwgZmFsc2UgaW5kaWNhdGluZyBubyBtYXRjaC5cbiAgICAgKi9cbiAgICBleGVjdXRlKHJvd1ZhbCwgcm93KSB7XG4gICAgICAgIHJldHVybiB0aGlzLmZpbHRlckZ1bmN0aW9uKHRoaXMudmFsdWUsIHJvd1ZhbCwgcm93LCB0aGlzLnBhcmFtcyk7XG4gICAgfVxufVxuXG5leHBvcnQgeyBGaWx0ZXJGdW5jdGlvbiB9OyIsImNsYXNzIEVsZW1lbnRIZWxwZXIge1xuICAgIC8qKlxuICAgICAqIENyZWF0ZXMgYW4gSFRNTCBlbGVtZW50IHdpdGggdGhlIHNwZWNpZmllZCB0YWcgYW5kIHByb3BlcnRpZXMuXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IHRhZyBUaGUgdGFnIG5hbWUgb2YgdGhlIGVsZW1lbnQgdG8gY3JlYXRlLlxuICAgICAqIEBwYXJhbSB7T2JqZWN0fSBbcHJvcGVydGllcz17fV0gQW4gb2JqZWN0IGNvbnRhaW5pbmcgcHJvcGVydGllcyB0byBhc3NpZ24gdG8gdGhlIGVsZW1lbnQuXG4gICAgICogQHBhcmFtIHtPYmplY3R9IFtkYXRhc2V0PXt9XSBBbiBvYmplY3QgY29udGFpbmluZyBkYXRhc2V0IGF0dHJpYnV0ZXMgdG8gYXNzaWduIHRvIHRoZSBlbGVtZW50LlxuICAgICAqIEByZXR1cm5zIHtIVE1MRWxlbWVudH0gVGhlIGNyZWF0ZWQgSFRNTCBlbGVtZW50LlxuICAgICAqL1xuICAgIHN0YXRpYyBjcmVhdGUodGFnLCBwcm9wZXJ0aWVzID0ge30sIGRhdGFzZXQgPSB7fSkge1xuICAgICAgICBjb25zdCBlbGVtZW50ID0gT2JqZWN0LmFzc2lnbihkb2N1bWVudC5jcmVhdGVFbGVtZW50KHRhZyksIHByb3BlcnRpZXMpO1xuXG4gICAgICAgIGlmIChkYXRhc2V0KSB7IFxuICAgICAgICAgICAgT2JqZWN0LmFzc2lnbihlbGVtZW50LmRhdGFzZXQsIGRhdGFzZXQpO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIGVsZW1lbnQ7XG4gICAgfVxuICAgIC8qKlxuICAgICAqIENyZWF0ZXMgYSBgZGl2YCBlbGVtZW50IHdpdGggdGhlIHNwZWNpZmllZCBwcm9wZXJ0aWVzIGFuZCBkYXRhc2V0LlxuICAgICAqIEBwYXJhbSB7T2JqZWN0fSBbcHJvcGVydGllcz17fV0gQW4gb2JqZWN0IGNvbnRhaW5pbmcgcHJvcGVydGllcyB0byBhc3NpZ24gdG8gdGhlIGVsZW1lbnQuXG4gICAgICogQHBhcmFtIHtPYmplY3R9IFtkYXRhc2V0PXt9XSBBbiBvYmplY3QgY29udGFpbmluZyBkYXRhc2V0IGF0dHJpYnV0ZXMgdG8gYXNzaWduIHRvIHRoZSBlbGVtZW50LlxuICAgICAqIEByZXR1cm5zIHtIVE1MRGl2RWxlbWVudH0gVGhlIGNyZWF0ZWQgSFRNTCBlbGVtZW50LlxuICAgICAqL1xuICAgIHN0YXRpYyBkaXYocHJvcGVydGllcyA9IHt9LCBkYXRhc2V0ID0ge30pIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuY3JlYXRlKFwiZGl2XCIsIHByb3BlcnRpZXMsIGRhdGFzZXQpO1xuICAgIH1cbiAgICAvKipcbiAgICAgKiBDcmVhdGVzIGEgYGlucHV0YCBlbGVtZW50IHdpdGggdGhlIHNwZWNpZmllZCBwcm9wZXJ0aWVzIGFuZCBkYXRhc2V0LlxuICAgICAqIEBwYXJhbSB7T2JqZWN0fSBbcHJvcGVydGllcz17fV0gQW4gb2JqZWN0IGNvbnRhaW5pbmcgcHJvcGVydGllcyB0byBhc3NpZ24gdG8gdGhlIGVsZW1lbnQuXG4gICAgICogQHBhcmFtIHtPYmplY3R9IFtkYXRhc2V0PXt9XSBBbiBvYmplY3QgY29udGFpbmluZyBkYXRhc2V0IGF0dHJpYnV0ZXMgdG8gYXNzaWduIHRvIHRoZSBlbGVtZW50LlxuICAgICAqIEByZXR1cm5zIHtIVE1MSW5wdXRFbGVtZW50fSBUaGUgY3JlYXRlZCBIVE1MIGVsZW1lbnQuXG4gICAgICovXG4gICAgc3RhdGljIGlucHV0KHByb3BlcnRpZXMgPSB7fSwgZGF0YXNldCA9IHt9KSB7XG4gICAgICAgIHJldHVybiB0aGlzLmNyZWF0ZShcImlucHV0XCIsIHByb3BlcnRpZXMsIGRhdGFzZXQpO1xuICAgIH1cbiAgICAvKipcbiAgICAgKiBDcmVhdGVzIGEgYHNwYW5gIGVsZW1lbnQgd2l0aCB0aGUgc3BlY2lmaWVkIHByb3BlcnRpZXMgYW5kIGRhdGFzZXQuXG4gICAgICogQHBhcmFtIHtPYmplY3R9IFtwcm9wZXJ0aWVzPXt9XSBBbiBvYmplY3QgY29udGFpbmluZyBwcm9wZXJ0aWVzIHRvIGFzc2lnbiB0byB0aGUgZWxlbWVudC5cbiAgICAgKiBAcGFyYW0ge09iamVjdH0gW2RhdGFzZXQ9e31dIEFuIG9iamVjdCBjb250YWluaW5nIGRhdGFzZXQgYXR0cmlidXRlcyB0byBhc3NpZ24gdG8gdGhlIGVsZW1lbnQuXG4gICAgICogQHJldHVybnMge0hUTUxTcGFuRWxlbWVudH0gVGhlIGNyZWF0ZWQgSFRNTCBlbGVtZW50LlxuICAgICAqL1xuICAgIHN0YXRpYyBzcGFuKHByb3BlcnRpZXMgPSB7fSwgZGF0YXNldCA9IHt9KSB7XG4gICAgICAgIHJldHVybiB0aGlzLmNyZWF0ZShcInNwYW5cIiwgcHJvcGVydGllcywgZGF0YXNldCk7XG4gICAgfVxufVxuXG5leHBvcnQgeyBFbGVtZW50SGVscGVyIH07IiwiaW1wb3J0IHsgY3NzSGVscGVyIH0gZnJvbSBcIi4uLy4uLy4uL2NvbXBvbmVudHMvaGVscGVycy9jc3NIZWxwZXIuanNcIjtcbmltcG9ydCB7IEVsZW1lbnRIZWxwZXIgfSBmcm9tIFwiLi4vLi4vLi4vY29tcG9uZW50cy9oZWxwZXJzL2VsZW1lbnRIZWxwZXIuanNcIjtcbi8qKlxuICogQ3JlYXRlIGZpbHRlciBvYmplY3QgdGhhdCByZXByZXNlbnRzIGEgZWxlbWVudCB0byBmaWx0ZXIgYmV0d2VlbiB0d28gdmFsdWVzLiAgQ3JlYXRlcyBhIGRyb3Bkb3duIHdpdGggYSB0d28gaW5wdXQgYm94ZXMgXG4gKiB0byBlbnRlciBzdGFydCBhbmQgZW5kIHZhbHVlcy5cbiAqL1xuY2xhc3MgRWxlbWVudEJldHdlZW4ge1xuICAgIC8qKlxuICAgICAqIENyZWF0ZSBmaWx0ZXIgb2JqZWN0IHRoYXQgcmVwcmVzZW50cyBhIGJldHdlZW4gZWxlbWVudC5cbiAgICAgKiBAcGFyYW0ge0NvbHVtbn0gY29sdW1uIENvbHVtbiBjbGFzcyBvYmplY3QuXG4gICAgICogQHBhcmFtIHtHcmlkQ29udGV4dH0gY29udGV4dCBHcmlkIGNvbnRleHQgb2JqZWN0LlxuICAgICAqL1xuICAgIGNvbnN0cnVjdG9yKGNvbHVtbiwgY29udGV4dCkge1xuICAgICAgICB0aGlzLmNvbnRleHQgPSBjb250ZXh0O1xuICAgICAgICB0aGlzLmVsZW1lbnQgPSBFbGVtZW50SGVscGVyLmRpdih7IG5hbWU6IGNvbHVtbi5maWVsZCwgY2xhc3NOYW1lOiBjc3NIZWxwZXIubXVsdGlTZWxlY3QucGFyZW50Q2xhc3MgfSk7XG4gICAgICAgIHRoaXMuaGVhZGVyID0gRWxlbWVudEhlbHBlci5kaXYoeyBjbGFzc05hbWU6IGNzc0hlbHBlci5tdWx0aVNlbGVjdC5oZWFkZXIgfSk7XG4gICAgICAgIHRoaXMub3B0aW9uc0NvbnRhaW5lciA9IEVsZW1lbnRIZWxwZXIuZGl2KHsgY2xhc3NOYW1lOiBjc3NIZWxwZXIubXVsdGlTZWxlY3Qub3B0aW9ucyB9KTtcbiAgICAgICAgdGhpcy5maWVsZCA9IGNvbHVtbi5maWVsZDtcbiAgICAgICAgdGhpcy5maWVsZFR5cGUgPSBjb2x1bW4udHlwZTsgIC8vZmllbGQgdmFsdWUgdHlwZS5cbiAgICAgICAgdGhpcy5maWx0ZXJUeXBlID0gXCJiZXR3ZWVuXCI7ICAvL2NvbmRpdGlvbiB0eXBlLlxuXG4gICAgICAgIHRoaXMuZWxlbWVudC5pZCA9IGAke3RoaXMuY29udGV4dC5zZXR0aW5ncy5iYXNlSWROYW1lfV8ke3RoaXMuZmllbGR9YDtcbiAgICAgICAgdGhpcy5lbGVtZW50LmFwcGVuZCh0aGlzLmhlYWRlciwgdGhpcy5vcHRpb25zQ29udGFpbmVyKTtcbiAgICAgICAgdGhpcy5oZWFkZXIuaWQgPSBgaGVhZGVyXyR7dGhpcy5jb250ZXh0LnNldHRpbmdzLmJhc2VJZE5hbWV9XyR7dGhpcy5maWVsZH1gO1xuICAgICAgICB0aGlzLm9wdGlvbnNDb250YWluZXIuc3R5bGUubWluV2lkdGggPSBcIjE4NXB4XCI7XG5cbiAgICAgICAgdGhpcy4jdGVtcGxhdGVCZXR3ZWVuKCk7XG4gICAgICAgIHRoaXMuaGVhZGVyLmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCB0aGlzLmhhbmRsZUNsaWNrKTtcbiAgICB9XG5cbiAgICAjdGVtcGxhdGVCZXR3ZWVuKCkge1xuICAgICAgICB0aGlzLmVsZW1lbnRTdGFydCA9IEVsZW1lbnRIZWxwZXIuaW5wdXQoeyBjbGFzc05hbWU6IGNzc0hlbHBlci5pbnB1dCwgaWQ6IGBzdGFydF8ke3RoaXMuY29udGV4dC5zZXR0aW5ncy5iYXNlSWROYW1lfV8ke3RoaXMuZmllbGR9YCB9KTtcblxuICAgICAgICB0aGlzLmVsZW1lbnRFbmQgPSBFbGVtZW50SGVscGVyLmlucHV0KHsgY2xhc3NOYW1lOiBjc3NIZWxwZXIuaW5wdXQsIGlkOiBgZW5kXyR7dGhpcy5jb250ZXh0LnNldHRpbmdzLmJhc2VJZE5hbWV9XyR7dGhpcy5maWVsZH1gIH0pO1xuICAgICAgICB0aGlzLmVsZW1lbnRFbmQuc3R5bGUubWFyZ2luQm90dG9tID0gXCIxMHB4XCI7XG5cbiAgICAgICAgY29uc3Qgc3RhcnQgPSBFbGVtZW50SGVscGVyLnNwYW4oeyBpbm5lclRleHQ6IFwiU3RhcnRcIiwgY2xhc3NOYW1lOiBjc3NIZWxwZXIuYmV0d2VlbkxhYmVsIH0pO1xuICAgICAgICBjb25zdCBlbmQgPSAgRWxlbWVudEhlbHBlci5zcGFuKHsgaW5uZXJUZXh0OiBcIkVuZFwiLCBjbGFzc05hbWU6IGNzc0hlbHBlci5iZXR3ZWVuTGFiZWwgfSk7XG4gXG4gICAgICAgIGNvbnN0IGJ0bkFwcGx5ID0gRWxlbWVudEhlbHBlci5jcmVhdGUoXCJidXR0b25cIiwgeyBpbm5lclRleHQ6IFwiQXBwbHlcIiwgY2xhc3NOYW1lOiBjc3NIZWxwZXIuYmV0d2VlbkJ1dHRvbiB9KTtcbiAgICAgICAgYnRuQXBwbHkuc3R5bGUubWFyZ2luUmlnaHQgPSBcIjEwcHhcIjtcbiAgICAgICAgYnRuQXBwbHkuYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsIHRoaXMuaGFuZGxlckNsaWNrKTtcblxuICAgICAgICBjb25zdCBidG5DbGVhciA9IEVsZW1lbnRIZWxwZXIuY3JlYXRlKFwiYnV0dG9uXCIsIHsgaW5uZXJUZXh0OiBcIkNsZWFyXCIsIGNsYXNzTmFtZTogY3NzSGVscGVyLmJldHdlZW5CdXR0b24gfSk7XG4gICAgICAgIGJ0bkNsZWFyLmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCB0aGlzLmhhbmRsZUJ1dHRvbkNsZWFyKTtcblxuICAgICAgICB0aGlzLm9wdGlvbnNDb250YWluZXIuYXBwZW5kKHN0YXJ0LCB0aGlzLmVsZW1lbnRTdGFydCwgZW5kLCB0aGlzLmVsZW1lbnRFbmQsIGJ0bkFwcGx5LCBidG5DbGVhcik7XG4gICAgfVxuXG4gICAgaGFuZGxlQnV0dG9uQ2xlYXIgPSAoKSA9PiB7XG4gICAgICAgIHRoaXMuZWxlbWVudFN0YXJ0LnZhbHVlID0gXCJcIjtcbiAgICAgICAgdGhpcy5lbGVtZW50RW5kLnZhbHVlID0gXCJcIjtcblxuICAgICAgICBpZiAodGhpcy5jb3VudExhYmVsICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgIHRoaXMuY291bnRMYWJlbC5yZW1vdmUoKTtcbiAgICAgICAgICAgIHRoaXMuY291bnRMYWJlbCA9IHVuZGVmaW5lZDtcbiAgICAgICAgfVxuICAgIH07XG5cbiAgICBjcmVhdGVDb3VudExhYmVsID0gKCkgPT4ge1xuICAgICAgICAvL3VwZGF0ZSBjb3VudCBsYWJlbC5cbiAgICAgICAgaWYgKHRoaXMuY291bnRMYWJlbCA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICB0aGlzLmNvdW50TGFiZWwgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwic3BhblwiKTtcbiAgICAgICAgICAgIHRoaXMuY291bnRMYWJlbC5jbGFzc05hbWUgPSBjc3NIZWxwZXIubXVsdGlTZWxlY3QuaGVhZGVyT3B0aW9uO1xuICAgICAgICAgICAgdGhpcy5oZWFkZXIuYXBwZW5kKHRoaXMuY291bnRMYWJlbCk7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAodGhpcy5lbGVtZW50U3RhcnQudmFsdWUgIT09IFwiXCIgJiYgdGhpcy5lbGVtZW50RW5kLnZhbHVlICE9PSBcIlwiKSB7XG4gICAgICAgICAgICB0aGlzLmNvdW50TGFiZWwuaW5uZXJUZXh0ID0gYCR7dGhpcy5lbGVtZW50U3RhcnQudmFsdWV9IHRvICR7dGhpcy5lbGVtZW50RW5kLnZhbHVlfWA7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB0aGlzLmNvdW50TGFiZWwucmVtb3ZlKCk7XG4gICAgICAgICAgICB0aGlzLmNvdW50TGFiZWwgPSB1bmRlZmluZWQ7XG4gICAgICAgIH1cbiAgICB9O1xuXG4gICAgaGFuZGxlQ2xpY2sgPSBhc3luYyAoKSA9PiB7XG4gICAgICAgIGNvbnN0IHN0YXR1cyA9IHRoaXMuaGVhZGVyLmNsYXNzTGlzdC50b2dnbGUoY3NzSGVscGVyLm11bHRpU2VsZWN0LmhlYWRlckFjdGl2ZSk7XG5cbiAgICAgICAgaWYgKCFzdGF0dXMpIHtcbiAgICAgICAgICAgIC8vQ2xvc2Ugd2luZG93IGFuZCBhcHBseSBmaWx0ZXIgdmFsdWUuXG4gICAgICAgICAgICB0aGlzLmNyZWF0ZUNvdW50TGFiZWwoKTtcbiAgICAgICAgICAgIGF3YWl0IHRoaXMuY29udGV4dC5ldmVudHMudHJpZ2dlcihcInJlbmRlclwiKTtcbiAgICAgICAgICAgIGRvY3VtZW50LnJlbW92ZUV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCB0aGlzLmhhbmRsZURvY3VtZW50KTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCB0aGlzLmhhbmRsZURvY3VtZW50KTtcbiAgICAgICAgfVxuICAgIH07XG4gICAgLyoqXG4gICAgICogSGFuZGxlciBldmVudCB0byBjbG9zZSBkcm9wZG93biB3aGVuIHVzZXIgY2xpY2tzIG91dHNpZGUgdGhlIG11bHRpLXNlbGVjdCBjb250cm9sLiAgRXZlbnQgaXMgcmVtb3ZlZCB3aGVuIG11bHRpLXNlbGVjdCBpcyBcbiAgICAgKiBub3QgYWN0aXZlIHNvIHRoYXQgaXQncyBub3QgZmlyaW5nIG9uIHJlZHVuZGFudCBldmVudHMuXG4gICAgICogQHBhcmFtIHtPYmplY3R9IGUgT2JqZWN0IHRoYXQgdHJpZ2dlcmVkIGV2ZW50LlxuICAgICAqL1xuICAgIGhhbmRsZURvY3VtZW50ID0gYXN5bmMgKGUpID0+IHtcbiAgICAgICAgaWYgKCFlLnRhcmdldC5jbG9zZXN0KFwiLmRhdGFncmlkcy1pbnB1dFwiKSAmJiAhZS50YXJnZXQuY2xvc2VzdChgIyR7dGhpcy5oZWFkZXIuaWR9YCkpIHtcbiAgICAgICAgICAgIHRoaXMuaGVhZGVyLmNsYXNzTGlzdC5yZW1vdmUoY3NzSGVscGVyLm11bHRpU2VsZWN0LmhlYWRlckFjdGl2ZSk7XG5cbiAgICAgICAgICAgIGF3YWl0IHRoaXMuY29udGV4dC5ldmVudHMudHJpZ2dlcihcInJlbmRlclwiKTtcblxuICAgICAgICAgICAgZG9jdW1lbnQucmVtb3ZlRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsIHRoaXMuaGFuZGxlRG9jdW1lbnQpO1xuICAgICAgICB9XG4gICAgfTtcbiAgICAvKipcbiAgICAgKiBSZXR1cm5zIGFuIGFycmF5IG9mIHRoZSBzdGFydCBhbmQgZW5kIHZhbHVlcyBmcm9tIGlucHV0IHNvdXJjZS4gIElmIGVpdGhlciBpbnB1dCBzb3VyY2UgaXMgZW1wdHksIGFuIGVtcHR5IHN0cmluZyB3aWxsIGJlIHJldHVybmVkLlxuICAgICAqIEByZXR1cm5zIHtBcnJheSB8IHN0cmluZ30gQXJyYXkgb2Ygc3RhcnQgYW5kIGVuZCB2YWx1ZXMgb3IgZW1wdHkgc3RyaW5nLlxuICAgICAqL1xuICAgIGdldCB2YWx1ZSgpIHtcbiAgICAgICAgaWYgKHRoaXMuZWxlbWVudFN0YXJ0LnZhbHVlID09PSBcIlwiIHx8IHRoaXMuZWxlbWVudEVuZC52YWx1ZSA9PT0gXCJcIikgcmV0dXJuIFwiXCI7XG5cbiAgICAgICAgcmV0dXJuIFt0aGlzLmVsZW1lbnRTdGFydC52YWx1ZSwgdGhpcy5lbGVtZW50RW5kLnZhbHVlXTtcbiAgICB9XG59XG5cbmV4cG9ydCB7IEVsZW1lbnRCZXR3ZWVuIH07IiwiLyoqXG4gKiBSZXByZXNlbnRzIGEgY29sdW1ucyBmaWx0ZXIgY29udHJvbC4gIENyZWF0ZXMgYSBgSFRNTElucHV0RWxlbWVudGAgdGhhdCBpcyBhZGRlZCB0byB0aGUgaGVhZGVyIHJvdyBvZiBcbiAqIHRoZSBncmlkIHRvIGZpbHRlciBkYXRhIHNwZWNpZmljIHRvIGl0cyBkZWZpbmVkIGNvbHVtbi4gXG4gKi9cbmNsYXNzIEVsZW1lbnRJbnB1dCB7XG4gICAgLyoqXG4gICAgICogQ3JlYXRlIGZpbHRlciBvYmplY3QgdGhhdCByZXByZXNlbnRzIGEgYEhUTUxTZWxlY3RFbGVtZW50YCBlbGVtZW50IGluIHRoZSB0YWJsZSdzIGhlYWRlciByb3cuXG4gICAgICogQHBhcmFtIHtDb2x1bW59IGNvbHVtbiBDb2x1bW4gY2xhc3Mgb2JqZWN0LlxuICAgICAqIEBwYXJhbSB7R3JpZENvbnRleHR9IGNvbnRleHQgR3JpZCBjb250ZXh0LlxuICAgICovXG4gICAgY29uc3RydWN0b3IoY29sdW1uLCBjb250ZXh0KSB7XG4gICAgICAgIHRoaXMuZWxlbWVudCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJpbnB1dFwiKTtcbiAgICAgICAgdGhpcy5jb250ZXh0ID0gY29udGV4dDtcbiAgICAgICAgdGhpcy5maWVsZCA9IGNvbHVtbi5maWVsZDtcbiAgICAgICAgdGhpcy5maWVsZFR5cGUgPSBjb2x1bW4udHlwZTsgIC8vZmllbGQgdmFsdWUgdHlwZS5cbiAgICAgICAgdGhpcy5maWx0ZXJUeXBlID0gY29sdW1uLmZpbHRlclR5cGU7ICAvL2NvbmRpdGlvbiB0eXBlLlxuICAgICAgICB0aGlzLmZpbHRlcklzRnVuY3Rpb24gPSAodHlwZW9mIGNvbHVtbj8uZmlsdGVyVHlwZSA9PT0gXCJmdW5jdGlvblwiKTtcbiAgICAgICAgdGhpcy5maWx0ZXJQYXJhbXMgPSBjb2x1bW4uZmlsdGVyUGFyYW1zO1xuICAgICAgICB0aGlzLmVsZW1lbnQubmFtZSA9IHRoaXMuZmllbGQ7XG4gICAgICAgIHRoaXMuZWxlbWVudC5pZCA9IHRoaXMuZmllbGQ7XG4gICAgICAgIHRoaXMuZWxlbWVudC5hZGRFdmVudExpc3RlbmVyKFwiY2hhbmdlXCIsIGFzeW5jICgpID0+IGF3YWl0IHRoaXMuY29udGV4dC5ldmVudHMudHJpZ2dlcihcInJlbmRlclwiKSk7XG5cbiAgICAgICAgaWYgKGNvbHVtbi5maWx0ZXJDc3MpIHtcbiAgICAgICAgICAgIHRoaXMuZWxlbWVudC5jbGFzc05hbWUgPSBjb2x1bW4uZmlsdGVyQ3NzO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKCF0aGlzLmNvbnRleHQuc2V0dGluZ3MucmVtb3RlUHJvY2Vzc2luZyAmJiBjb2x1bW4uZmlsdGVyUmVhbFRpbWUpIHtcbiAgICAgICAgICAgIHRoaXMucmVhbFRpbWVUaW1lb3V0ID0gKHR5cGVvZiB0aGlzLmZpbHRlclJlYWxUaW1lID09PSBcIm51bWJlclwiKSBcbiAgICAgICAgICAgICAgICA/IHRoaXMuZmlsdGVyUmVhbFRpbWUgXG4gICAgICAgICAgICAgICAgOiA1MDA7XG5cbiAgICAgICAgICAgIHRoaXMuZWxlbWVudC5hZGRFdmVudExpc3RlbmVyKFwia2V5dXBcIiwgdGhpcy5oYW5kbGVMaXZlRmlsdGVyKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIGhhbmRsZUxpdmVGaWx0ZXIgPSBhc3luYyAoKSA9PiB7XG4gICAgICAgIHNldFRpbWVvdXQoYXN5bmMgKCkgPT4gYXdhaXQgdGhpcy5jb250ZXh0LmV2ZW50cy50cmlnZ2VyKFwicmVuZGVyXCIpLCB0aGlzLnJlYWxUaW1lVGltZW91dCk7XG4gICAgfTtcbiAgICAvKipcbiAgICAgKiBSZXR1cm5zIHRoZSB2YWx1ZSBvZiB0aGUgaW5wdXQgZWxlbWVudC4gIFdpbGwgcmV0dXJuIGEgc3RyaW5nIHZhbHVlLlxuICAgICAqIEByZXR1cm5zIHtzdHJpbmd9XG4gICAgICovXG4gICAgZ2V0IHZhbHVlKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5lbGVtZW50LnZhbHVlO1xuICAgIH1cbn1cblxuZXhwb3J0IHsgRWxlbWVudElucHV0IH07IiwiaW1wb3J0IHsgY3NzSGVscGVyIH0gZnJvbSBcIi4uLy4uLy4uL2NvbXBvbmVudHMvaGVscGVycy9jc3NIZWxwZXIuanNcIjtcbmltcG9ydCB7IEVsZW1lbnRIZWxwZXIgfSBmcm9tIFwiLi4vLi4vLi4vY29tcG9uZW50cy9oZWxwZXJzL2VsZW1lbnRIZWxwZXIuanNcIjtcbi8qKlxuICogQ3JlYXRlIGZpbHRlciBvYmplY3QgdGhhdCByZXByZXNlbnRzIGEgbXVsdGktc2VsZWN0IGVsZW1lbnQuICBDcmVhdGVzIGEgZHJvcGRvd24gd2l0aCBhIGxpc3Qgb2Ygb3B0aW9ucyB0aGF0IGNhbiBiZSBcbiAqIHNlbGVjdGVkIG9yIGRlc2VsZWN0ZWQuICBJZiBgZmlsdGVyVmFsdWVzUmVtb3RlU291cmNlYCBpcyBkZWZpbmVkLCB0aGUgc2VsZWN0IG9wdGlvbnMgd2lsbCBiZSBwb3B1bGF0ZWQgYnkgdGhlIGRhdGEgcmV0dXJuZWQgXG4gKiBmcm9tIHRoZSByZW1vdGUgc291cmNlIGJ5IHJlZ2lzdGVyaW5nIHRvICB0aGUgZ3JpZCBwaXBlbGluZSdzIGBpbml0YCBhbmQgYHJlZnJlc2hgIGV2ZW50cy5cbiAqL1xuY2xhc3MgRWxlbWVudE11bHRpU2VsZWN0IHtcbiAgICAvKipcbiAgICAgKiBDcmVhdGUgZmlsdGVyIG9iamVjdCB0aGF0IHJlcHJlc2VudHMgYSBtdWx0aS1zZWxlY3QgZWxlbWVudC5cbiAgICAgKiBAcGFyYW0ge0NvbHVtbn0gY29sdW1uIENvbHVtbiBjbGFzcyBvYmplY3QuXG4gICAgICogQHBhcmFtIHtHcmlkQ29udGV4dH0gY29udGV4dCBHcmlkIGNvbnRleHQgb2JqZWN0LlxuICAgICAqL1xuICAgIGNvbnN0cnVjdG9yKGNvbHVtbiwgY29udGV4dCkge1xuICAgICAgICB0aGlzLmNvbnRleHQgPSBjb250ZXh0O1xuICAgICAgICB0aGlzLmVsZW1lbnQgPSBFbGVtZW50SGVscGVyLmRpdih7IG5hbWU6IGNvbHVtbi5maWVsZCwgY2xhc3NOYW1lOiBjc3NIZWxwZXIubXVsdGlTZWxlY3QucGFyZW50Q2xhc3MgfSk7XG4gICAgICAgIHRoaXMuaGVhZGVyID0gRWxlbWVudEhlbHBlci5kaXYoeyBjbGFzc05hbWU6IGNzc0hlbHBlci5tdWx0aVNlbGVjdC5oZWFkZXIgfSk7XG4gICAgICAgIHRoaXMub3B0aW9uc0NvbnRhaW5lciA9IEVsZW1lbnRIZWxwZXIuZGl2KHsgY2xhc3NOYW1lOiBjc3NIZWxwZXIubXVsdGlTZWxlY3Qub3B0aW9ucyB9KTtcbiAgICAgICAgdGhpcy5maWVsZCA9IGNvbHVtbi5maWVsZDtcbiAgICAgICAgdGhpcy5maWVsZFR5cGUgPSBjb2x1bW4udHlwZTsgIC8vZmllbGQgdmFsdWUgdHlwZS5cbiAgICAgICAgdGhpcy5maWx0ZXJUeXBlID0gXCJpblwiOyAgLy9jb25kaXRpb24gdHlwZS5cbiAgICAgICAgdGhpcy5maWx0ZXJJc0Z1bmN0aW9uID0gKHR5cGVvZiBjb2x1bW4/LmZpbHRlclR5cGUgPT09IFwiZnVuY3Rpb25cIik7XG4gICAgICAgIHRoaXMuZmlsdGVyUGFyYW1zID0gY29sdW1uLmZpbHRlclBhcmFtcztcbiAgICAgICAgdGhpcy5saXN0QWxsID0gZmFsc2U7XG4gICAgICAgIHRoaXMuc2VsZWN0ZWRWYWx1ZXMgPSBbXTtcblxuICAgICAgICBpZiAodHlwZW9mIGNvbHVtbi5maWx0ZXJNdWx0aVNlbGVjdCA9PT0gXCJvYmplY3RcIikge1xuICAgICAgICAgICAgdGhpcy5saXN0QWxsID0gY29sdW1uLmZpbHRlck11bHRpU2VsZWN0Lmxpc3RBbGw7XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLmhlYWRlci5pZCA9IGBoZWFkZXJfJHt0aGlzLmNvbnRleHQuc2V0dGluZ3MuYmFzZUlkTmFtZX1fJHt0aGlzLmZpZWxkfWA7XG4gICAgICAgIHRoaXMuZWxlbWVudC5pZCA9IGAke3RoaXMuY29udGV4dC5zZXR0aW5ncy5iYXNlSWROYW1lfV8ke3RoaXMuZmllbGR9YDtcbiAgICAgICAgdGhpcy5lbGVtZW50LmFwcGVuZCh0aGlzLmhlYWRlciwgdGhpcy5vcHRpb25zQ29udGFpbmVyKTtcblxuICAgICAgICBpZiAoY29sdW1uLmZpbHRlclZhbHVlc1JlbW90ZVNvdXJjZSkge1xuICAgICAgICAgICAgLy9zZXQgdXAgcGlwZWxpbmUgdG8gcmV0cmlldmUgb3B0aW9uIGRhdGEgd2hlbiBpbml0IHBpcGVsaW5lIGlzIGNhbGxlZC5cbiAgICAgICAgICAgIHRoaXMuY29udGV4dC5waXBlbGluZS5hZGRTdGVwKFwiaW5pdFwiLCB0aGlzLnRlbXBsYXRlQ29udGFpbmVyLCBjb2x1bW4uZmlsdGVyVmFsdWVzUmVtb3RlU291cmNlKTtcbiAgICAgICAgICAgIHRoaXMuY29udGV4dC5waXBlbGluZS5hZGRTdGVwKFwicmVmcmVzaFwiLCB0aGlzLnJlZnJlc2hTZWxlY3RPcHRpb25zLCBjb2x1bW4uZmlsdGVyVmFsdWVzUmVtb3RlU291cmNlKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIC8vdXNlIHVzZXIgc3VwcGxpZWQgdmFsdWVzIHRvIGNyZWF0ZSBzZWxlY3Qgb3B0aW9ucy5cbiAgICAgICAgICAgIGNvbnN0IGRhdGEgPSBBcnJheS5pc0FycmF5KGNvbHVtbi5maWx0ZXJWYWx1ZXMpIFxuICAgICAgICAgICAgICAgID8gY29sdW1uLmZpbHRlclZhbHVlc1xuICAgICAgICAgICAgICAgIDogT2JqZWN0LmVudHJpZXMoY29sdW1uLmZpbHRlclZhbHVlcykubWFwKChba2V5LCB2YWx1ZV0pID0+ICh7IHZhbHVlOiBrZXksIHRleHQ6IHZhbHVlfSkpO1xuXG4gICAgICAgICAgICB0aGlzLnRlbXBsYXRlQ29udGFpbmVyKGRhdGEpO1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5oZWFkZXIuYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsIHRoaXMuaGFuZGxlQ2xpY2spO1xuICAgIH1cblxuICAgIGhhbmRsZUNsaWNrID0gYXN5bmMgKCkgPT4ge1xuICAgICAgICBjb25zdCBzdGF0dXMgPSB0aGlzLmhlYWRlci5jbGFzc0xpc3QudG9nZ2xlKGNzc0hlbHBlci5tdWx0aVNlbGVjdC5oZWFkZXJBY3RpdmUpO1xuXG4gICAgICAgIGlmICghc3RhdHVzKSB7XG4gICAgICAgICAgICBhd2FpdCB0aGlzLmNvbnRleHQuZXZlbnRzLnRyaWdnZXIoXCJyZW5kZXJcIik7XG4gICAgICAgICAgICBkb2N1bWVudC5yZW1vdmVFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgdGhpcy5oYW5kbGVEb2N1bWVudCk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBkb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgdGhpcy5oYW5kbGVEb2N1bWVudCk7XG4gICAgICAgIH1cbiAgICB9O1xuICAgIC8qKlxuICAgICAqIEhhbmRsZXIgZXZlbnQgdG8gY2xvc2UgZHJvcGRvd24gd2hlbiB1c2VyIGNsaWNrcyBvdXRzaWRlIHRoZSBtdWx0aS1zZWxlY3QgY29udHJvbC4gIEV2ZW50IGlzIHJlbW92ZWQgd2hlbiBtdWx0aS1zZWxlY3QgXG4gICAgICogaXMgbm90IGFjdGl2ZSBzbyB0aGF0IGl0J3Mgbm90IGZpcmluZyBvbiByZWR1bmRhbnQgZXZlbnRzLlxuICAgICAqIEBwYXJhbSB7T2JqZWN0fSBlIE9iamVjdCB0aGF0IHRyaWdnZXJlZCBldmVudC5cbiAgICAgKi9cbiAgICBoYW5kbGVEb2N1bWVudCA9IGFzeW5jIChlKSA9PiB7XG4gICAgICAgIGlmICghZS50YXJnZXQuY2xvc2VzdChcIi5cIiArIGNzc0hlbHBlci5tdWx0aVNlbGVjdC5vcHRpb24pICYmICFlLnRhcmdldC5jbG9zZXN0KGAjJHt0aGlzLmhlYWRlci5pZH1gKSkge1xuICAgICAgICAgICAgdGhpcy5oZWFkZXIuY2xhc3NMaXN0LnJlbW92ZShjc3NIZWxwZXIubXVsdGlTZWxlY3QuaGVhZGVyQWN0aXZlKTtcblxuICAgICAgICAgICAgYXdhaXQgdGhpcy5jb250ZXh0LmV2ZW50cy50cmlnZ2VyKFwicmVuZGVyXCIpO1xuXG4gICAgICAgICAgICBkb2N1bWVudC5yZW1vdmVFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgdGhpcy5oYW5kbGVEb2N1bWVudCk7XG4gICAgICAgIH1cbiAgICB9O1xuICAgIC8qKlxuICAgICAqIENyZWF0ZXMgYSBjb3VudCBsYWJlbCB0aGF0IGRpc3BsYXlzIHRoZSBudW1iZXIgb2Ygc2VsZWN0ZWQgaXRlbXMgaW4gdGhlIG11bHRpLXNlbGVjdCBjb250cm9sLlxuICAgICAqL1xuICAgIGNyZWF0ZUNvdW50TGFiZWwgPSAoKSA9PiB7XG4gICAgICAgIC8vdXBkYXRlIGNvdW50IGxhYmVsLlxuICAgICAgICBpZiAodGhpcy5jb3VudExhYmVsID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgIHRoaXMuY291bnRMYWJlbCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJzcGFuXCIpO1xuICAgICAgICAgICAgdGhpcy5jb3VudExhYmVsLmNsYXNzTmFtZSA9IGNzc0hlbHBlci5tdWx0aVNlbGVjdC5oZWFkZXJPcHRpb247XG4gICAgICAgICAgICB0aGlzLmhlYWRlci5hcHBlbmQodGhpcy5jb3VudExhYmVsKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICh0aGlzLnNlbGVjdGVkVmFsdWVzLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgIHRoaXMuY291bnRMYWJlbC5pbm5lclRleHQgPSBgJHt0aGlzLnNlbGVjdGVkVmFsdWVzLmxlbmd0aH0gc2VsZWN0ZWRgO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdGhpcy5jb3VudExhYmVsLnJlbW92ZSgpO1xuICAgICAgICAgICAgdGhpcy5jb3VudExhYmVsID0gdW5kZWZpbmVkO1xuICAgICAgICB9XG4gICAgfTtcbiAgICAvKipcbiAgICAgKiBIYW5kbGUgY2xpY2sgZXZlbnQgZm9yIGVhY2ggb3B0aW9uIGluIHRoZSBtdWx0aS1zZWxlY3QgY29udHJvbC4gIFRvZ2dsZXMgdGhlIHNlbGVjdGVkIHN0YXRlIG9mIHRoZSBvcHRpb24gYW5kIHVwZGF0ZXMgdGhlIFxuICAgICAqIGhlYWRlciBpZiBgbGlzdEFsbGAgaXMgYHRydWVgLlxuICAgICAqIEBwYXJhbSB7T2JqZWN0fSBvIE9iamVjdCB0aGF0IHRyaWdnZXJlZCB0aGUgZXZlbnQuXG4gICAgICovXG4gICAgaGFuZGxlT3B0aW9uID0gKG8pID0+IHtcbiAgICAgICAgaWYgKCFvLmN1cnJlbnRUYXJnZXQuY2xhc3NMaXN0LmNvbnRhaW5zKGNzc0hlbHBlci5tdWx0aVNlbGVjdC5zZWxlY3RlZCkpIHtcbiAgICAgICAgICAgIC8vc2VsZWN0IGl0ZW0uXG4gICAgICAgICAgICBvLmN1cnJlbnRUYXJnZXQuY2xhc3NMaXN0LmFkZChjc3NIZWxwZXIubXVsdGlTZWxlY3Quc2VsZWN0ZWQpO1xuICAgICAgICAgICAgby5jdXJyZW50VGFyZ2V0LmRhdGFzZXQuc2VsZWN0ZWQgPSBcInRydWVcIjtcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgdGhpcy5zZWxlY3RlZFZhbHVlcy5wdXNoKG8uY3VycmVudFRhcmdldC5kYXRhc2V0LnZhbHVlKTtcblxuICAgICAgICAgICAgaWYgKHRoaXMubGlzdEFsbCkge1xuICAgICAgICAgICAgICAgIGNvbnN0IHNwYW4gPSBFbGVtZW50SGVscGVyLnNwYW4oeyBjbGFzc05hbWU6IGNzc0hlbHBlci5tdWx0aVNlbGVjdC5oZWFkZXJPcHRpb24sIGlubmVyVGV4dDogby5jdXJyZW50VGFyZ2V0LmRhdGFzZXQudmFsdWUgfSwgeyB2YWx1ZTogby5jdXJyZW50VGFyZ2V0LmRhdGFzZXQudmFsdWUgfSk7XG4gICAgICAgICAgICAgICAgdGhpcy5oZWFkZXIuYXBwZW5kKHNwYW4pO1xuICAgICAgICAgICAgfVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgLy9kZXNlbGVjdCBpdGVtLlxuICAgICAgICAgICAgby5jdXJyZW50VGFyZ2V0LmNsYXNzTGlzdC5yZW1vdmUoY3NzSGVscGVyLm11bHRpU2VsZWN0LnNlbGVjdGVkKTtcbiAgICAgICAgICAgIG8uY3VycmVudFRhcmdldC5kYXRhc2V0LnNlbGVjdGVkID0gXCJmYWxzZVwiO1xuXG4gICAgICAgICAgICB0aGlzLnNlbGVjdGVkVmFsdWVzID0gdGhpcy5zZWxlY3RlZFZhbHVlcy5maWx0ZXIoZiA9PiBmICE9PSBvLmN1cnJlbnRUYXJnZXQuZGF0YXNldC52YWx1ZSk7XG5cbiAgICAgICAgICAgIGlmICh0aGlzLmxpc3RBbGwpIHtcbiAgICAgICAgICAgICAgICBjb25zdCBpdGVtID0gdGhpcy5oZWFkZXIucXVlcnlTZWxlY3RvcihgW2RhdGEtdmFsdWU9JyR7by5jdXJyZW50VGFyZ2V0LmRhdGFzZXQudmFsdWV9J11gKTtcblxuICAgICAgICAgICAgICAgIGlmIChpdGVtICE9PSBudWxsKSB7XG4gICAgICAgICAgICAgICAgICAgIGl0ZW0ucmVtb3ZlKCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHRoaXMubGlzdEFsbCA9PT0gZmFsc2UpIHtcbiAgICAgICAgICAgIHRoaXMuY3JlYXRlQ291bnRMYWJlbCgpO1xuICAgICAgICB9XG4gICAgfTtcblxuICAgIHRlbXBsYXRlQ29udGFpbmVyID0gKGRhdGEpID0+IHtcbiAgICAgICAgZm9yIChjb25zdCBpdGVtIG9mIGRhdGEpIHtcbiAgICAgICAgICAgIGNvbnN0IG9wdGlvbiA9IEVsZW1lbnRIZWxwZXIuZGl2KHsgY2xhc3NOYW1lOiBjc3NIZWxwZXIubXVsdGlTZWxlY3Qub3B0aW9uIH0sIHsgdmFsdWU6IGl0ZW0udmFsdWUsIHNlbGVjdGVkOiBcImZhbHNlXCIgfSk7XG4gICAgICAgICAgICBjb25zdCByYWRpbyA9IEVsZW1lbnRIZWxwZXIuc3Bhbih7IGNsYXNzTmFtZTogY3NzSGVscGVyLm11bHRpU2VsZWN0Lm9wdGlvblJhZGlvIH0pO1xuICAgICAgICAgICAgY29uc3QgdGV4dCA9IEVsZW1lbnRIZWxwZXIuc3Bhbih7IGNsYXNzTmFtZTogY3NzSGVscGVyLm11bHRpU2VsZWN0Lm9wdGlvblRleHQsIGlubmVySFRNTDogaXRlbS50ZXh0IH0pO1xuXG4gICAgICAgICAgICBvcHRpb24uYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsIHRoaXMuaGFuZGxlT3B0aW9uKTtcbiAgICAgICAgICAgIG9wdGlvbi5hcHBlbmQocmFkaW8sIHRleHQpO1xuXG4gICAgICAgICAgICB0aGlzLm9wdGlvbnNDb250YWluZXIuYXBwZW5kKG9wdGlvbik7XG4gICAgICAgIH1cbiAgICB9O1xuXG4gICAgcmVmcmVzaFNlbGVjdE9wdGlvbnMgPSAoZGF0YSkgPT4ge1xuICAgICAgICB0aGlzLm9wdGlvbnNDb250YWluZXIucmVwbGFjZUNoaWxkcmVuKCk7XG4gICAgICAgIHRoaXMuaGVhZGVyLnJlcGxhY2VDaGlsZHJlbigpO1xuICAgICAgICB0aGlzLmNvdW50TGFiZWwgPSB1bmRlZmluZWQ7ICAvL3NldCB0byB1bmRlZmluZWQgc28gaXQgY2FuIGJlIHJlY3JlYXRlZCBsYXRlci5cbiAgICAgICAgY29uc3QgbmV3U2VsZWN0ZWQgPSBbXTtcblxuICAgICAgICBmb3IgKGNvbnN0IGl0ZW0gb2YgZGF0YSkge1xuICAgICAgICAgICAgY29uc3Qgb3B0aW9uID0gRWxlbWVudEhlbHBlci5kaXYoeyBjbGFzc05hbWU6IGNzc0hlbHBlci5tdWx0aVNlbGVjdC5vcHRpb24gfSwgeyB2YWx1ZTogaXRlbS52YWx1ZSwgc2VsZWN0ZWQ6IFwiZmFsc2VcIiB9KTtcbiAgICAgICAgICAgIGNvbnN0IHJhZGlvID0gRWxlbWVudEhlbHBlci5zcGFuKHsgY2xhc3NOYW1lOiBjc3NIZWxwZXIubXVsdGlTZWxlY3Qub3B0aW9uUmFkaW8gfSk7XG4gICAgICAgICAgICBjb25zdCB0ZXh0ID0gRWxlbWVudEhlbHBlci5zcGFuKHsgY2xhc3NOYW1lOiBjc3NIZWxwZXIubXVsdGlTZWxlY3Qub3B0aW9uVGV4dCwgaW5uZXJIVE1MOiBpdGVtLnRleHQgfSk7XG5cbiAgICAgICAgICAgIG9wdGlvbi5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgdGhpcy5oYW5kbGVPcHRpb24pO1xuICAgICAgICAgICAgLy9jaGVjayBpZiBpdGVtIGlzIHNlbGVjdGVkLlxuICAgICAgICAgICAgaWYgKHRoaXMuc2VsZWN0ZWRWYWx1ZXMuaW5jbHVkZXMoaXRlbS52YWx1ZSkpIHtcbiAgICAgICAgICAgICAgICAvL3NlbGVjdCBpdGVtLlxuICAgICAgICAgICAgICAgIG9wdGlvbi5jbGFzc0xpc3QuYWRkKGNzc0hlbHBlci5tdWx0aVNlbGVjdC5zZWxlY3RlZCk7XG4gICAgICAgICAgICAgICAgb3B0aW9uLmRhdGFzZXQuc2VsZWN0ZWQgPSBcInRydWVcIjtcbiAgICAgICAgICAgICAgICBuZXdTZWxlY3RlZC5wdXNoKGl0ZW0udmFsdWUpO1xuXG4gICAgICAgICAgICAgICAgaWYgKHRoaXMubGlzdEFsbCkge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBzcGFuID0gRWxlbWVudEhlbHBlci5zcGFuKHsgY2xhc3NOYW1lOiBjc3NIZWxwZXIubXVsdGlTZWxlY3QuaGVhZGVyT3B0aW9uLCBpbm5lclRleHQ6IGl0ZW0udmFsdWUgfSwgeyB2YWx1ZTogaXRlbS52YWx1ZSB9KTtcblxuICAgICAgICAgICAgICAgICAgICB0aGlzLmhlYWRlci5hcHBlbmQoc3Bhbik7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBvcHRpb24uYXBwZW5kKHJhZGlvLCB0ZXh0KTtcblxuICAgICAgICAgICAgdGhpcy5vcHRpb25zQ29udGFpbmVyLmFwcGVuZChvcHRpb24pO1xuICAgICAgICB9XG4gICAgICAgIC8vc2V0IG5ldyBzZWxlY3RlZCB2YWx1ZXMgYXMgaXRlbXMgbWF5IGhhdmUgYmVlbiByZW1vdmVkIG9uIHJlZnJlc2guXG4gICAgICAgIHRoaXMuc2VsZWN0ZWRWYWx1ZXMgPSBuZXdTZWxlY3RlZDtcblxuICAgICAgICBpZiAodGhpcy5saXN0QWxsID09PSBmYWxzZSkge1xuICAgICAgICAgICAgdGhpcy5jcmVhdGVDb3VudExhYmVsKCk7XG4gICAgICAgIH1cbiAgICB9O1xuXG4gICAgZ2V0IHZhbHVlKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5zZWxlY3RlZFZhbHVlcztcbiAgICB9XG59XG5cbmV4cG9ydCB7IEVsZW1lbnRNdWx0aVNlbGVjdCB9OyIsImltcG9ydCB7IEVsZW1lbnRIZWxwZXIgfSBmcm9tIFwiLi4vLi4vLi4vY29tcG9uZW50cy9oZWxwZXJzL2VsZW1lbnRIZWxwZXIuanNcIjtcbi8qKlxuICogUmVwcmVzZW50cyBhIGNvbHVtbnMgZmlsdGVyIGNvbnRyb2wuICBDcmVhdGVzIGEgYEhUTUxTZWxlY3RFbGVtZW50YCB0aGF0IGlzIGFkZGVkIHRvIHRoZSBoZWFkZXIgcm93IG9mIHRoZSBncmlkIHRvIGZpbHRlciBkYXRhIFxuICogc3BlY2lmaWMgdG8gaXRzIGRlZmluZWQgY29sdW1uLiAgSWYgYGZpbHRlclZhbHVlc1JlbW90ZVNvdXJjZWAgaXMgZGVmaW5lZCwgdGhlIHNlbGVjdCBvcHRpb25zIHdpbGwgYmUgcG9wdWxhdGVkIGJ5IHRoZSBkYXRhIHJldHVybmVkIFxuICogZnJvbSB0aGUgcmVtb3RlIHNvdXJjZSBieSByZWdpc3RlcmluZyB0byB0aGUgZ3JpZCBwaXBlbGluZSdzIGBpbml0YCBhbmQgYHJlZnJlc2hgIGV2ZW50cy5cbiAqL1xuY2xhc3MgRWxlbWVudFNlbGVjdCB7XG4gICAgLyoqXG4gICAgICogQ3JlYXRlIGZpbHRlciBvYmplY3QgdGhhdCByZXByZXNlbnRzIGEgYEhUTUxTZWxlY3RFbGVtZW50YCBlbGVtZW50IGluIHRoZSB0YWJsZSdzIGhlYWRlciByb3cuXG4gICAgICogQHBhcmFtIHtDb2x1bW59IGNvbHVtbiBDb2x1bW4gY2xhc3Mgb2JqZWN0LlxuICAgICAqIEBwYXJhbSB7R3JpZENvbnRleHR9IGNvbnRleHQgR3JpZCBjb250ZXh0LiBcbiAgICAgKi9cbiAgICBjb25zdHJ1Y3Rvcihjb2x1bW4sIGNvbnRleHQpIHtcbiAgICAgICAgdGhpcy5lbGVtZW50ID0gRWxlbWVudEhlbHBlci5jcmVhdGUoXCJzZWxlY3RcIiwgeyBuYW1lOiBjb2x1bW4uZmllbGQgfSk7XG4gICAgICAgIHRoaXMuZmllbGQgPSBjb2x1bW4uZmllbGQ7XG4gICAgICAgIHRoaXMuZmllbGRUeXBlID0gY29sdW1uLnR5cGU7ICAvL2ZpZWxkIHZhbHVlIHR5cGUuXG4gICAgICAgIHRoaXMuZmlsdGVyVHlwZSA9IGNvbHVtbi5maWx0ZXJUeXBlOyAgLy9jb25kaXRpb24gdHlwZS5cbiAgICAgICAgdGhpcy5maWx0ZXJJc0Z1bmN0aW9uID0gKHR5cGVvZiBjb2x1bW4/LmZpbHRlclR5cGUgPT09IFwiZnVuY3Rpb25cIik7XG4gICAgICAgIHRoaXMuZmlsdGVyUGFyYW1zID0gY29sdW1uLmZpbHRlclBhcmFtcztcbiAgICAgICAgdGhpcy5waXBlbGluZSA9IGNvbnRleHQucGlwZWxpbmU7XG4gICAgICAgIHRoaXMuY29udGV4dCA9IGNvbnRleHQ7XG5cbiAgICAgICAgdGhpcy5lbGVtZW50LmlkID0gYCR7Y29sdW1uLnNldHRpbmdzLmJhc2VJZE5hbWV9XyR7dGhpcy5maWVsZH1gO1xuICAgICAgICB0aGlzLmVsZW1lbnQuYWRkRXZlbnRMaXN0ZW5lcihcImNoYW5nZVwiLCBhc3luYyAoKSA9PiBhd2FpdCB0aGlzLmNvbnRleHQuZXZlbnRzLnRyaWdnZXIoXCJyZW5kZXJcIikpO1xuXG4gICAgICAgIGlmIChjb2x1bW4uZmlsdGVyQ3NzKSB7XG4gICAgICAgICAgICB0aGlzLmVsZW1lbnQuY2xhc3NOYW1lID0gY29sdW1uLmZpbHRlckNzcztcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChjb2x1bW4uZmlsdGVyVmFsdWVzUmVtb3RlU291cmNlKSB7XG4gICAgICAgICAgICAvL3NldCB1cCBwaXBlbGluZSB0byByZXRyaWV2ZSBvcHRpb24gZGF0YSB3aGVuIGluaXQgcGlwZWxpbmUgaXMgY2FsbGVkLlxuICAgICAgICAgICAgdGhpcy5waXBlbGluZS5hZGRTdGVwKFwiaW5pdFwiLCB0aGlzLmNyZWF0ZVNlbGVjdE9wdGlvbnMsIGNvbHVtbi5maWx0ZXJWYWx1ZXNSZW1vdGVTb3VyY2UpO1xuICAgICAgICAgICAgdGhpcy5waXBlbGluZS5hZGRTdGVwKFwicmVmcmVzaFwiLCB0aGlzLnJlZnJlc2hTZWxlY3RPcHRpb25zLCBjb2x1bW4uZmlsdGVyVmFsdWVzUmVtb3RlU291cmNlKTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfSBcbiAgICAgICAgLy91c2UgdXNlciBzdXBwbGllZCB2YWx1ZXMgdG8gY3JlYXRlIHNlbGVjdCBvcHRpb25zLlxuICAgICAgICBjb25zdCBvcHRzID0gQXJyYXkuaXNBcnJheShjb2x1bW4uZmlsdGVyVmFsdWVzKSBcbiAgICAgICAgICAgID8gY29sdW1uLmZpbHRlclZhbHVlc1xuICAgICAgICAgICAgOiBPYmplY3QuZW50cmllcyhjb2x1bW4uZmlsdGVyVmFsdWVzKS5tYXAoKFtrZXksIHZhbHVlXSkgPT4gKHsgdmFsdWU6IGtleSwgdGV4dDogdmFsdWV9KSk7XG5cbiAgICAgICAgdGhpcy5jcmVhdGVTZWxlY3RPcHRpb25zKG9wdHMpO1xuICAgIH1cbiAgICAvKipcbiAgICAgKiBCdWlsZHMgb3B0aW9uIGVsZW1lbnRzIGZvciBjbGFzcydzIGBzZWxlY3RgIGlucHV0LiAgRXhwZWN0cyBhbiBhcnJheSBvZiBvYmplY3RzIHdpdGgga2V5L3ZhbHVlIHBhaXJzIG9mOlxuICAgICAqICAqIGB2YWx1ZWA6IG9wdGlvbiB2YWx1ZS4gIHNob3VsZCBiZSBhIHByaW1hcnkga2V5IHR5cGUgdmFsdWUgd2l0aCBubyBibGFuayBzcGFjZXMuXG4gICAgICogICogYHRleHRgOiBvcHRpb24gdGV4dCB2YWx1ZVxuICAgICAqIEBwYXJhbSB7QXJyYXk8b2JqZWN0Pn0gZGF0YSBrZXkvdmFsdWUgYXJyYXkgb2YgdmFsdWVzLlxuICAgICAqL1xuICAgIGNyZWF0ZVNlbGVjdE9wdGlvbnMgPSAoZGF0YSkgPT4ge1xuICAgICAgICBjb25zdCBmaXJzdCA9IEVsZW1lbnRIZWxwZXIuY3JlYXRlKFwib3B0aW9uXCIsIHsgdmFsdWU6IFwiXCIsIHRleHQ6IFwiU2VsZWN0IGFsbFwiIH0pO1xuXG4gICAgICAgIHRoaXMuZWxlbWVudC5hcHBlbmQoZmlyc3QpO1xuXG4gICAgICAgIGZvciAoY29uc3QgaXRlbSBvZiBkYXRhKSB7XG4gICAgICAgICAgICBjb25zdCBvcHRpb24gPSBFbGVtZW50SGVscGVyLmNyZWF0ZShcIm9wdGlvblwiLCB7IHZhbHVlOiBpdGVtLnZhbHVlLCB0ZXh0OiBpdGVtLnRleHQgfSk7XG5cbiAgICAgICAgICAgIHRoaXMuZWxlbWVudC5hcHBlbmQob3B0aW9uKTtcbiAgICAgICAgfVxuICAgIH07XG4gICAgLyoqXG4gICAgICogUmVwbGFjZXMvdXBkYXRlcyBvcHRpb24gZWxlbWVudHMgZm9yIGNsYXNzJ3MgYHNlbGVjdGAgaW5wdXQuICBXaWxsIHBlcnNpc3QgdGhlIGN1cnJlbnQgc2VsZWN0IHZhbHVlLCBpZiBhbnkuICBcbiAgICAgKiBFeHBlY3RzIGFuIGFycmF5IG9mIG9iamVjdHMgd2l0aCBrZXkvdmFsdWUgcGFpcnMgb2Y6XG4gICAgICogICogYHZhbHVlYDogT3B0aW9uIHZhbHVlLiAgU2hvdWxkIGJlIGEgcHJpbWFyeSBrZXkgdHlwZSB2YWx1ZSB3aXRoIG5vIGJsYW5rIHNwYWNlcy5cbiAgICAgKiAgKiBgdGV4dGA6IE9wdGlvbiB0ZXh0LlxuICAgICAqIEBwYXJhbSB7QXJyYXk8b2JqZWN0Pn0gZGF0YSBrZXkvdmFsdWUgYXJyYXkgb2YgdmFsdWVzLlxuICAgICAqL1xuICAgIHJlZnJlc2hTZWxlY3RPcHRpb25zID0gKGRhdGEpID0+IHtcbiAgICAgICAgY29uc3Qgc2VsZWN0ZWRWYWx1ZSA9IHRoaXMuZWxlbWVudC52YWx1ZTtcblxuICAgICAgICB0aGlzLmVsZW1lbnQucmVwbGFjZUNoaWxkcmVuKCk7XG4gICAgICAgIHRoaXMuY3JlYXRlU2VsZWN0T3B0aW9ucyhkYXRhKTtcbiAgICAgICAgdGhpcy5lbGVtZW50LnZhbHVlID0gc2VsZWN0ZWRWYWx1ZTtcbiAgICB9O1xuXG4gICAgZ2V0IHZhbHVlKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5lbGVtZW50LnZhbHVlO1xuICAgIH1cbn1cblxuZXhwb3J0IHsgRWxlbWVudFNlbGVjdCB9OyIsImltcG9ydCB7IERhdGVIZWxwZXIgfSBmcm9tIFwiLi4vLi4vY29tcG9uZW50cy9oZWxwZXJzL2RhdGVIZWxwZXIuanNcIjtcbmltcG9ydCB7IEZpbHRlclRhcmdldCB9IGZyb20gXCIuL3R5cGVzL2ZpbHRlclRhcmdldC5qc1wiO1xuaW1wb3J0IHsgRmlsdGVyRGF0ZSB9IGZyb20gXCIuL3R5cGVzL2ZpbHRlckRhdGUuanNcIjtcbmltcG9ydCB7IEZpbHRlckZ1bmN0aW9uIH0gZnJvbSBcIi4vdHlwZXMvZmlsdGVyRnVuY3Rpb24uanNcIjtcbmltcG9ydCB7IEVsZW1lbnRCZXR3ZWVuIH0gZnJvbSBcIi4vZWxlbWVudHMvZWxlbWVudEJldHdlZW4uanNcIjtcbmltcG9ydCB7IEVsZW1lbnRJbnB1dCB9IGZyb20gXCIuL2VsZW1lbnRzL2VsZW1lbnRJbnB1dC5qc1wiO1xuaW1wb3J0IHsgRWxlbWVudE11bHRpU2VsZWN0IH0gZnJvbSBcIi4vZWxlbWVudHMvZWxlbWVudE11bHRpU2VsZWN0LmpzXCI7XG5pbXBvcnQgeyBFbGVtZW50U2VsZWN0IH0gZnJvbSBcIi4vZWxlbWVudHMvZWxlbWVudFNlbGVjdC5qc1wiO1xuLyoqXG4gKiBQcm92aWRlcyBhIG1lYW5zIHRvIGZpbHRlciBkYXRhIGluIHRoZSBncmlkLiAgVGhpcyBtb2R1bGUgY3JlYXRlcyBoZWFkZXIgZmlsdGVyIGNvbnRyb2xzIGZvciBlYWNoIGNvbHVtbiB0aGF0IGhhcyBcbiAqIGEgYGhhc0ZpbHRlcmAgYXR0cmlidXRlIHNldCB0byBgdHJ1ZWAuXG4gKiBcbiAqIENsYXNzIHN1YnNjcmliZXMgdG8gdGhlIGByZW5kZXJgIGV2ZW50IHRvIHVwZGF0ZSB0aGUgZmlsdGVyIGNvbnRyb2wgd2hlbiB0aGUgZ3JpZCBpcyByZW5kZXJlZC4gIEl0IGFsc28gY2FsbHMgdGhlIGNoYWluIFxuICogZXZlbnQgYHJlbW90ZVBhcmFtc2AgdG8gY29tcGlsZSBhIGxpc3Qgb2YgcGFyYW1ldGVycyB0byBiZSBwYXNzZWQgdG8gdGhlIHJlbW90ZSBkYXRhIHNvdXJjZSB3aGVuIHVzaW5nIHJlbW90ZSBwcm9jZXNzaW5nLlxuICovXG5jbGFzcyBGaWx0ZXJNb2R1bGUge1xuICAgIC8qKlxuICAgICAqIENyZWF0ZXMgYSBuZXcgZmlsdGVyIG1vZHVsZSBvYmplY3QuXG4gICAgICogQHBhcmFtIHtHcmlkQ29udGV4dH0gY29udGV4dCBHcmlkIGNvbnRleHQuXG4gICAgICovXG4gICAgY29uc3RydWN0b3IoY29udGV4dCkge1xuICAgICAgICB0aGlzLmNvbnRleHQgPSBjb250ZXh0O1xuICAgICAgICB0aGlzLmhlYWRlckZpbHRlcnMgPSBbXTtcbiAgICAgICAgdGhpcy5ncmlkRmlsdGVycyA9IFtdO1xuICAgIH1cblxuICAgIGluaXRpYWxpemUoKSB7XG4gICAgICAgIGlmICh0aGlzLmNvbnRleHQuc2V0dGluZ3MucmVtb3RlUHJvY2Vzc2luZykge1xuICAgICAgICAgICAgdGhpcy5jb250ZXh0LmV2ZW50cy5zdWJzY3JpYmUoXCJyZW1vdGVQYXJhbXNcIiwgdGhpcy5yZW1vdGVQYXJhbXMsIHRydWUpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdGhpcy5jb250ZXh0LmV2ZW50cy5zdWJzY3JpYmUoXCJyZW5kZXJcIiwgdGhpcy5yZW5kZXJMb2NhbCwgZmFsc2UsIDgpO1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5faW5pdCgpO1xuICAgIH1cbiAgICAvKipcbiAgICAgKiBDcmVhdGUgYEhlYWRlckZpbHRlcmAgQ2xhc3MgZm9yIGdyaWQgY29sdW1ucyB3aXRoIGEgYGhhc0ZpbHRlcmAgYXR0cmlidXRlIG9mIGB0cnVlYC5cbiAgICAgKi9cbiAgICBfaW5pdCgpIHtcbiAgICAgICAgZm9yIChjb25zdCBjb2wgb2YgdGhpcy5jb250ZXh0LmNvbHVtbk1hbmFnZXIuY29sdW1ucykge1xuICAgICAgICAgICAgaWYgKCFjb2wuaGFzRmlsdGVyKSBjb250aW51ZTtcblxuICAgICAgICAgICAgaWYgKGNvbC5maWx0ZXJFbGVtZW50ID09PSBcIm11bHRpXCIpIHtcbiAgICAgICAgICAgICAgICBjb2wuaGVhZGVyRmlsdGVyID0gbmV3IEVsZW1lbnRNdWx0aVNlbGVjdChjb2wsIHRoaXMuY29udGV4dCk7XG4gICAgICAgICAgICB9IGVsc2UgaWYgKGNvbC5maWx0ZXJFbGVtZW50ID09PSBcImJldHdlZW5cIikge1xuICAgICAgICAgICAgICAgIGNvbC5oZWFkZXJGaWx0ZXIgPSBuZXcgRWxlbWVudEJldHdlZW4oY29sLCB0aGlzLmNvbnRleHQpO1xuICAgICAgICAgICAgfSBlbHNlIGlmIChjb2wuZmlsdGVyRWxlbWVudCA9PT0gXCJzZWxlY3RcIikge1xuICAgICAgICAgICAgICAgIGNvbC5oZWFkZXJGaWx0ZXIgPSBuZXcgRWxlbWVudFNlbGVjdChjb2wsIHRoaXMuY29udGV4dCk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGNvbC5oZWFkZXJGaWx0ZXIgPSBuZXcgRWxlbWVudElucHV0KGNvbCwgdGhpcy5jb250ZXh0KTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgY29sLmhlYWRlckNlbGwuZWxlbWVudC5hcHBlbmRDaGlsZChjb2wuaGVhZGVyRmlsdGVyLmVsZW1lbnQpO1xuICAgICAgICAgICAgdGhpcy5oZWFkZXJGaWx0ZXJzLnB1c2goY29sLmhlYWRlckZpbHRlcik7XG4gICAgICAgIH1cbiAgICB9XG4gICAgLyoqXG4gICAgICogQ29tcGlsZXMgaGVhZGVyIGFuZCBncmlkIGZpbHRlciB2YWx1ZXMgaW50byBhIHNpbmdsZSBvYmplY3Qgb2Yga2V5L3ZhbHVlIHBhaXJzIHRoYXQgY2FuIGJlIHVzZWQgdG8gc2VuZCB0byB0aGUgcmVtb3RlIGRhdGEgc291cmNlLlxuICAgICAqIEBwYXJhbSB7T2JqZWN0fSBwYXJhbXMgT2JqZWN0IG9mIGtleS92YWx1ZSBwYWlycyB0byBiZSBzZW50IHRvIHRoZSByZW1vdGUgZGF0YSBzb3VyY2UuXG4gICAgICogQHJldHVybnMge09iamVjdH0gUmV0dXJucyB0aGUgbW9kaWZpZWQgcGFyYW1zIG9iamVjdCB3aXRoIGZpbHRlciB2YWx1ZXMgYWRkZWQuXG4gICAgICovXG4gICAgcmVtb3RlUGFyYW1zID0gKHBhcmFtcykgPT4ge1xuICAgICAgICB0aGlzLmhlYWRlckZpbHRlcnMuZm9yRWFjaCgoZikgPT4ge1xuICAgICAgICAgICAgaWYgKGYudmFsdWUgIT09IFwiXCIpIHtcbiAgICAgICAgICAgICAgICBwYXJhbXNbZi5maWVsZF0gPSBmLnZhbHVlO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcblxuICAgICAgICBpZiAodGhpcy5ncmlkRmlsdGVycy5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICBmb3IgKGNvbnN0IGl0ZW0gb2YgdGhpcy5ncmlkRmlsdGVycykge1xuICAgICAgICAgICAgICAgIHBhcmFtc1tpdGVtLmZpZWxkXSA9IGl0ZW0udmFsdWU7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gcGFyYW1zO1xuICAgIH07XG4gICAgLyoqXG4gICAgICogQ29udmVydCB2YWx1ZSB0eXBlIHRvIGNvbHVtbiB0eXBlLiAgSWYgdmFsdWUgY2Fubm90IGJlIGNvbnZlcnRlZCwgYG51bGxgIGlzIHJldHVybmVkLlxuICAgICAqIEBwYXJhbSB7b2JqZWN0IHwgc3RyaW5nIHwgbnVtYmVyfSB2YWx1ZSBSYXcgZmlsdGVyIHZhbHVlLlxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSB0eXBlIEZpZWxkIHR5cGUuXG4gICAgICogQHJldHVybnMge251bWJlciB8IERhdGUgfCBzdHJpbmcgfCBudWxsIHwgT2JqZWN0fSBpbnB1dCB2YWx1ZSBvciBgbnVsbGAgaWYgZW1wdHkuXG4gICAgICovXG4gICAgY29udmVydFRvVHlwZSh2YWx1ZSwgdHlwZSkge1xuICAgICAgICBpZiAodmFsdWUgPT09IFwiXCIgfHwgdmFsdWUgPT09IG51bGwpIHJldHVybiB2YWx1ZTtcblxuICAgICAgICBpZiAoQXJyYXkuaXNBcnJheSh2YWx1ZSkpIHtcbiAgICAgICAgICAgIGlmICh0eXBlID09PSBcImRhdGVcIiB8fCB0eXBlID09PSBcImRhdGV0aW1lXCIpICB7IFxuICAgICAgICAgICAgICAgIGNvbnN0IHJlc3VsdCA9IHZhbHVlLm1hcCgodikgPT4gRGF0ZUhlbHBlci5wYXJzZURhdGUodikpOyBcblxuICAgICAgICAgICAgICAgIHJldHVybiByZXN1bHQuaW5jbHVkZXMoXCJcIikgPyBudWxsIDogcmVzdWx0O1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpZiAodHlwZSA9PT0gXCJudW1iZXJcIikge1xuICAgICAgICAgICAgICAgIGNvbnN0IHZhbHVlMSA9IHRoaXMuY29udmVydFRvVHlwZSh2YWx1ZVswXSwgdHlwZSk7XG4gICAgICAgICAgICAgICAgY29uc3QgdmFsdWUyID0gdGhpcy5jb252ZXJ0VG9UeXBlKHZhbHVlWzFdLCB0eXBlKTsgIFxuXG4gICAgICAgICAgICAgICAgcmV0dXJuIHZhbHVlMSA9PT0gbnVsbCB8fCB2YWx1ZTIgPT09IG51bGwgPyBudWxsIDogW3ZhbHVlMSwgdmFsdWUyXTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgcmV0dXJuIHZhbHVlO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHR5cGUgPT09IFwibnVtYmVyXCIpIHtcbiAgICAgICAgICAgIHZhbHVlID0gTnVtYmVyKHZhbHVlKTtcbiAgICAgICAgICAgIHJldHVybiBOdW1iZXIuaXNOYU4odmFsdWUpID8gbnVsbCA6IHZhbHVlO1xuICAgICAgICB9IFxuICAgICAgICBcbiAgICAgICAgaWYgKHR5cGUgPT09IFwiZGF0ZVwiIHx8IHR5cGUgPT09IFwiZGF0ZXRpbWVcIikge1xuICAgICAgICAgICAgdmFsdWUgPSBEYXRlSGVscGVyLnBhcnNlRGF0ZU9ubHkodmFsdWUpO1xuICAgICAgICAgICAgcmV0dXJuIHZhbHVlID09PSBcIlwiID8gbnVsbCA6IHZhbHVlO1xuICAgICAgICB9IFxuICAgICAgICAvL2Fzc3VtaW5nIGl0J3MgYSBzdHJpbmcgdmFsdWUgb3IgT2JqZWN0IGF0IHRoaXMgcG9pbnQuXG4gICAgICAgIHJldHVybiB2YWx1ZTtcbiAgICB9XG4gICAgLyoqXG4gICAgICogV3JhcHMgdGhlIGZpbHRlciBpbnB1dCB2YWx1ZSBpbiBhIGBGaWx0ZXJUYXJnZXRgIG9iamVjdCwgd2hpY2ggZGVmaW5lcyBhIHNpbmdsZSBmaWx0ZXIgY29uZGl0aW9uIGZvciBhIGNvbHVtbi5cbiAgICAgKiBAcGFyYW0ge3N0cmluZyB8IERhdGUgfCBudW1iZXIgfCBPYmplY3R9IHZhbHVlIEZpbHRlciB2YWx1ZSB0byBhcHBseSB0byB0aGUgY29sdW1uLlxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBmaWVsZCBUaGUgZmllbGQgbmFtZSBvZiB0aGUgY29sdW1uIGJlaW5nIGZpbHRlcmVkLiBUaGlzIGlzIHVzZWQgdG8gaWRlbnRpZnkgdGhlIGNvbHVtbiBpbiB0aGUgZGF0YSBzZXQuXG4gICAgICogQHBhcmFtIHtzdHJpbmcgfCBGdW5jdGlvbn0gZmlsdGVyVHlwZSBUaGUgdHlwZSBvZiBmaWx0ZXIgdG8gYXBwbHkgKGUuZy4sIFwiZXF1YWxzXCIsIFwibGlrZVwiLCBcIjxcIiwgXCI8PVwiLCBcIj5cIiwgXCI+PVwiLCBcIiE9XCIsIFwiYmV0d2VlblwiLCBcImluXCIpLlxuICAgICAqIENhbiBhbHNvIGJlIGEgZnVuY3Rpb24uXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IGZpZWxkVHlwZSBUaGUgdHlwZSBvZiBmaWVsZCBiZWluZyBmaWx0ZXJlZCAoZS5nLiwgXCJzdHJpbmdcIiwgXCJudW1iZXJcIiwgXCJkYXRlXCIsIFwib2JqZWN0XCIpLlxuICAgICAqIEBwYXJhbSB7Ym9vbGVhbn0gZmlsdGVySXNGdW5jdGlvbiBJbmRpY2F0ZXMgaWYgdGhlIGZpbHRlciB0eXBlIGlzIGEgZnVuY3Rpb24uXG4gICAgICogQHBhcmFtIHtPYmplY3R9IGZpbHRlclBhcmFtcyBPcHRpb25hbCBwYXJhbWV0ZXJzIHRvIHBhc3MgdG8gdGhlIGZpbHRlciBmdW5jdGlvbi5cbiAgICAgKiBAcmV0dXJucyB7RmlsdGVyVGFyZ2V0IHwgRmlsdGVyRGF0ZSB8IEZpbHRlckZ1bmN0aW9uIHwgbnVsbH0gUmV0dXJucyBhIGZpbHRlciB0YXJnZXQgb2JqZWN0IHRoYXQgZGVmaW5lcyBhIHNpbmdsZSBmaWx0ZXIgY29uZGl0aW9uIGZvciBhIGNvbHVtbiwgXG4gICAgICogb3IgbnVsbCBpZiB0aGUgdmFsdWUgY2Fubm90IGJlIGNvbnZlcnRlZCB0byB0aGUgZmllbGQgdHlwZS4gXG4gICAgICovXG4gICAgY3JlYXRlRmlsdGVyVGFyZ2V0KHZhbHVlLCBmaWVsZCwgZmlsdGVyVHlwZSwgZmllbGRUeXBlLCBmaWx0ZXJJc0Z1bmN0aW9uLCBmaWx0ZXJQYXJhbXMpIHsgXG4gICAgICAgIGlmIChmaWx0ZXJJc0Z1bmN0aW9uKSB7IFxuICAgICAgICAgICAgcmV0dXJuIG5ldyBGaWx0ZXJGdW5jdGlvbih7IHZhbHVlOiB2YWx1ZSwgZmllbGQ6IGZpZWxkLCBmaWx0ZXJUeXBlOiBmaWx0ZXJUeXBlLCBwYXJhbXM6IGZpbHRlclBhcmFtcyB9KTtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IGNvbnZlcnRlZFZhbHVlID0gdGhpcy5jb252ZXJ0VG9UeXBlKHZhbHVlLCBmaWVsZFR5cGUpO1xuXG4gICAgICAgIGlmIChjb252ZXJ0ZWRWYWx1ZSA9PT0gbnVsbCkgcmV0dXJuIG51bGw7XG5cbiAgICAgICAgaWYgKGZpZWxkVHlwZSA9PT0gXCJkYXRlXCIgfHwgZmllbGRUeXBlID09PSBcImRhdGV0aW1lXCIpIHtcbiAgICAgICAgICAgIHJldHVybiBuZXcgRmlsdGVyRGF0ZSh7IHZhbHVlOiBjb252ZXJ0ZWRWYWx1ZSwgZmllbGQ6IGZpZWxkLCBmaWx0ZXJUeXBlOiBmaWx0ZXJUeXBlIH0pO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIG5ldyBGaWx0ZXJUYXJnZXQoeyB2YWx1ZTogY29udmVydGVkVmFsdWUsIGZpZWxkOiBmaWVsZCwgZmllbGRUeXBlOiBmaWVsZFR5cGUsIGZpbHRlclR5cGU6IGZpbHRlclR5cGUgfSk7XG4gICAgfVxuICAgIC8qKlxuICAgICAqIENvbXBpbGVzIGFuIGFycmF5IG9mIGZpbHRlciB0eXBlIG9iamVjdHMgdGhhdCBjb250YWluIGEgZmlsdGVyIHZhbHVlIHRoYXQgbWF0Y2hlcyBpdHMgY29sdW1uIHR5cGUuICBDb2x1bW4gdHlwZSBtYXRjaGluZyBcbiAgICAgKiBpcyBuZWNlc3Nhcnkgd2hlbiBwcm9jZXNzaW5nIGRhdGEgbG9jYWxseSwgc28gdGhhdCBmaWx0ZXIgdmFsdWUgbWF0Y2hlcyBhc3NvY2lhdGVkIHJvdyB0eXBlIHZhbHVlIGZvciBjb21wYXJpc29uLlxuICAgICAqIEByZXR1cm5zIHtBcnJheX0gYXJyYXkgb2YgZmlsdGVyIHR5cGUgb2JqZWN0cyB3aXRoIHZhbGlkIHZhbHVlLlxuICAgICAqL1xuICAgIGNvbXBpbGVGaWx0ZXJzKCkge1xuICAgICAgICBsZXQgcmVzdWx0cyA9IFtdO1xuXG4gICAgICAgIGZvciAoY29uc3QgaXRlbSBvZiB0aGlzLmhlYWRlckZpbHRlcnMpIHtcbiAgICAgICAgICAgIGlmIChpdGVtLnZhbHVlID09PSBcIlwiKSBjb250aW51ZTtcblxuICAgICAgICAgICAgY29uc3QgZmlsdGVyID0gdGhpcy5jcmVhdGVGaWx0ZXJUYXJnZXQoaXRlbS52YWx1ZSwgaXRlbS5maWVsZCwgaXRlbS5maWx0ZXJUeXBlLCBpdGVtLmZpZWxkVHlwZSwgaXRlbS5maWx0ZXJJc0Z1bmN0aW9uLCBpdGVtPy5maWx0ZXJQYXJhbXMpO1xuXG4gICAgICAgICAgICBpZiAoZmlsdGVyICE9PSBudWxsKSB7XG4gICAgICAgICAgICAgICAgcmVzdWx0cy5wdXNoKGZpbHRlcik7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBpZiAodGhpcy5ncmlkRmlsdGVycy5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICByZXN1bHRzID0gcmVzdWx0cy5jb25jYXQodGhpcy5ncmlkRmlsdGVycyk7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gcmVzdWx0cztcbiAgICB9XG4gICAgLyoqXG4gICAgICogVXNlIHRhcmdldCBmaWx0ZXJzIHRvIGNyZWF0ZSBhIG5ldyBkYXRhIHNldCBpbiB0aGUgcGVyc2lzdGVuY2UgZGF0YSBwcm92aWRlci5cbiAgICAgKiBAcGFyYW0ge0FycmF5PEZpbHRlclRhcmdldD59IHRhcmdldHMgQXJyYXkgb2YgRmlsdGVyVGFyZ2V0IG9iamVjdHMuXG4gICAgICovXG4gICAgYXBwbHlGaWx0ZXJzKHRhcmdldHMpIHtcbiAgICAgICAgdGhpcy5jb250ZXh0LnBlcnNpc3RlbmNlLmRhdGEgPSBbXTtcbiAgICAgICAgdGhpcy5jb250ZXh0LnBlcnNpc3RlbmNlLmRhdGFDYWNoZS5mb3JFYWNoKChyb3cpID0+IHtcbiAgICAgICAgICAgIGxldCBtYXRjaCA9IHRydWU7XG5cbiAgICAgICAgICAgIGZvciAobGV0IGl0ZW0gb2YgdGFyZ2V0cykge1xuICAgICAgICAgICAgICAgIGNvbnN0IHJvd1ZhbCA9IHRoaXMuY29udmVydFRvVHlwZShyb3dbaXRlbS5maWVsZF0sIGl0ZW0uZmllbGRUeXBlKTtcbiAgICAgICAgICAgICAgICBjb25zdCByZXN1bHQgPSBpdGVtLmV4ZWN1dGUocm93VmFsLCByb3cpO1xuXG4gICAgICAgICAgICAgICAgaWYgKCFyZXN1bHQpIHtcbiAgICAgICAgICAgICAgICAgICAgbWF0Y2ggPSBmYWxzZTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmIChtYXRjaCkge1xuICAgICAgICAgICAgICAgIHRoaXMuY29udGV4dC5wZXJzaXN0ZW5jZS5kYXRhLnB1c2gocm93KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgfVxuICAgIC8qKlxuICAgICAqIFJlbmRlcnMgdGhlIGxvY2FsIGRhdGEgc2V0IGJ5IGFwcGx5aW5nIHRoZSBjb21waWxlZCBmaWx0ZXJzIHRvIHRoZSBwZXJzaXN0ZW5jZSBkYXRhIHByb3ZpZGVyLlxuICAgICAqL1xuICAgIHJlbmRlckxvY2FsID0gKCkgPT4ge1xuICAgICAgICBjb25zdCB0YXJnZXRzID0gdGhpcy5jb21waWxlRmlsdGVycygpO1xuXG4gICAgICAgIGlmIChPYmplY3Qua2V5cyh0YXJnZXRzKS5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICB0aGlzLmFwcGx5RmlsdGVycyh0YXJnZXRzKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHRoaXMuY29udGV4dC5wZXJzaXN0ZW5jZS5yZXN0b3JlRGF0YSgpO1xuICAgICAgICB9XG4gICAgfTtcbiAgICAvKipcbiAgICAgKiBQcm92aWRlcyBhIG1lYW5zIHRvIGFwcGx5IGEgY29uZGl0aW9uIG91dHNpZGUgdGhlIGhlYWRlciBmaWx0ZXIgY29udHJvbHMuICBXaWxsIGFkZCBjb25kaXRpb25cbiAgICAgKiB0byBncmlkJ3MgYGdyaWRGaWx0ZXJzYCBjb2xsZWN0aW9uLCBhbmQgcmFpc2UgYHJlbmRlcmAgZXZlbnQgdG8gZmlsdGVyIGRhdGEgc2V0LlxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBmaWVsZCBmaWVsZCBuYW1lLlxuICAgICAqIEBwYXJhbSB7b2JqZWN0fSB2YWx1ZSB2YWx1ZS5cbiAgICAgKiBAcGFyYW0ge3N0cmluZyB8IEZ1bmN0aW9ufSB0eXBlIGNvbmRpdGlvbiB0eXBlLlxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBbZmllbGRUeXBlPVwic3RyaW5nXCJdIGZpZWxkIHR5cGUuXG4gICAgICogQHBhcmFtIHtvYmplY3R9IFtmaWx0ZXJQYXJhbXM9e31dIGFkZGl0aW9uYWwgZmlsdGVyIHBhcmFtZXRlcnMuXG4gICAgICovXG4gICAgc2V0RmlsdGVyKGZpZWxkLCB2YWx1ZSwgdHlwZSA9IFwiZXF1YWxzXCIsIGZpZWxkVHlwZSA9IFwic3RyaW5nXCIsIGZpbHRlclBhcmFtcyA9IHt9KSB7XG4gICAgICAgIGNvbnN0IGNvbnZlcnRlZFZhbHVlID0gdGhpcy5jb252ZXJ0VG9UeXBlKHZhbHVlLCBmaWVsZFR5cGUpO1xuXG4gICAgICAgIGlmICh0aGlzLmdyaWRGaWx0ZXJzLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgIGNvbnN0IGluZGV4ID0gdGhpcy5ncmlkRmlsdGVycy5maW5kSW5kZXgoKGkpID0+IGkuZmllbGQgPT09IGZpZWxkKTtcbiAgICAgICAgICAgIC8vSWYgZmllbGQgYWxyZWFkeSBleGlzdHMsIGp1c3QgdXBkYXRlIHRoZSB2YWx1ZS5cbiAgICAgICAgICAgIGlmIChpbmRleCA+IC0xKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5ncmlkRmlsdGVyc1tpbmRleF0udmFsdWUgPSBjb252ZXJ0ZWRWYWx1ZTtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCBmaWx0ZXIgPSB0aGlzLmNyZWF0ZUZpbHRlclRhcmdldChjb252ZXJ0ZWRWYWx1ZSwgZmllbGQsIHR5cGUsIGZpZWxkVHlwZSwgKHR5cGVvZiB0eXBlID09PSBcImZ1bmN0aW9uXCIpLCBmaWx0ZXJQYXJhbXMpO1xuICAgICAgICB0aGlzLmdyaWRGaWx0ZXJzLnB1c2goZmlsdGVyKTtcbiAgICB9XG4gICAgLyoqXG4gICAgICogUmVtb3ZlcyBmaWx0ZXIgY29uZGl0aW9uIGZyb20gZ3JpZCdzIGBncmlkRmlsdGVyc2AgY29sbGVjdGlvbi5cbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gZmllbGQgZmllbGQgbmFtZS5cbiAgICAgKi9cbiAgICByZW1vdmVGaWx0ZXIoZmllbGQpIHtcbiAgICAgICAgdGhpcy5ncmlkRmlsdGVycyA9IHRoaXMuZ3JpZEZpbHRlcnMuZmlsdGVyKGYgPT4gZi5maWVsZCAhPT0gZmllbGQpO1xuICAgIH1cbn1cblxuRmlsdGVyTW9kdWxlLm1vZHVsZU5hbWUgPSBcImZpbHRlclwiO1xuXG5leHBvcnQgeyBGaWx0ZXJNb2R1bGUgfTsiLCIvKipcbiAqIFdpbGwgcmUtbG9hZCB0aGUgZ3JpZCdzIGRhdGEgZnJvbSBpdHMgdGFyZ2V0IHNvdXJjZSAobG9jYWwgb3IgcmVtb3RlKS5cbiAqL1xuY2xhc3MgUmVmcmVzaE1vZHVsZSB7XG4gICAgLyoqXG4gICAgICogV2lsbCBhcHBseSBldmVudCB0byB0YXJnZXQgYnV0dG9uIHRoYXQsIHdoZW4gY2xpY2tlZCwgd2lsbCByZS1sb2FkIHRoZSBcbiAgICAgKiBncmlkJ3MgZGF0YSBmcm9tIGl0cyB0YXJnZXQgc291cmNlIChsb2NhbCBvciByZW1vdGUpLlxuICAgICAqIEBwYXJhbSB7R3JpZENvbnRleHR9IGNvbnRleHQgR3JpZCBjb250ZXh0IGNsYXNzLlxuICAgICAqL1xuICAgIGNvbnN0cnVjdG9yKGNvbnRleHQpIHtcbiAgICAgICAgdGhpcy5jb250ZXh0ID0gY29udGV4dDtcbiAgICB9XG5cbiAgICBpbml0aWFsaXplKCkge1xuICAgICAgICBpZiAoIXRoaXMuY29udGV4dC5zZXR0aW5ncy5yZW1vdGVQcm9jZXNzaW5nICYmIHRoaXMuY29udGV4dC5zZXR0aW5ncy5yZW1vdGVVcmwpIHtcbiAgICAgICAgICAgIHRoaXMuY29udGV4dC5waXBlbGluZS5hZGRTdGVwKFwicmVmcmVzaFwiLCB0aGlzLmNvbnRleHQucGVyc2lzdGVuY2Uuc2V0RGF0YSk7XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCBidG4gPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCh0aGlzLmNvbnRleHQuc2V0dGluZ3MucmVmcmVzaGFibGVJZCk7XG4gICAgICAgIFxuICAgICAgICBidG4uYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsIHRoaXMuaGFuZGxlUmVmcmVzaCk7XG4gICAgfVxuXG4gICAgaGFuZGxlUmVmcmVzaCA9IGFzeW5jICgpID0+IHtcbiAgICAgICAgaWYgKHRoaXMuY29udGV4dC5waXBlbGluZS5oYXNQaXBlbGluZShcInJlZnJlc2hcIikpIHtcbiAgICAgICAgICAgIGF3YWl0IHRoaXMuY29udGV4dC5waXBlbGluZS5leGVjdXRlKFwicmVmcmVzaFwiKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGF3YWl0IHRoaXMuY29udGV4dC5ldmVudHMudHJpZ2dlcihcInJlbmRlclwiKTtcbiAgICB9O1xufVxuXG5SZWZyZXNoTW9kdWxlLm1vZHVsZU5hbWUgPSBcInJlZnJlc2hcIjtcblxuZXhwb3J0IHsgUmVmcmVzaE1vZHVsZSB9OyIsIi8qKlxuICogVXBkYXRlcyB0YXJnZXQgbGFiZWwgd2l0aCBhIGNvdW50IG9mIHJvd3MgaW4gZ3JpZC5cbiAqL1xuY2xhc3MgUm93Q291bnRNb2R1bGUge1xuICAgIC8qKlxuICAgICAqIFVwZGF0ZXMgdGFyZ2V0IGxhYmVsIHN1cHBsaWVkIGluIHNldHRpbmdzIHdpdGggYSBjb3VudCBvZiByb3dzIGluIGdyaWQuXG4gICAgICogQHBhcmFtIHtHcmlkQ29udGV4dH0gY29udGV4dCBHcmlkIGNvbnRleHQgY2xhc3MuXG4gICAgICovXG4gICAgY29uc3RydWN0b3IoY29udGV4dCkge1xuICAgICAgICB0aGlzLmNvbnRleHQgPSBjb250ZXh0O1xuICAgICAgICB0aGlzLmVsZW1lbnQgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChjb250ZXh0LnNldHRpbmdzLnJvd0NvdW50SWQpO1xuICAgIH1cblxuICAgIGluaXRpYWxpemUoKSB7XG4gICAgICAgIHRoaXMuY29udGV4dC5ldmVudHMuc3Vic2NyaWJlKFwicmVuZGVyXCIsIHRoaXMuaGFuZGxlQ291bnQsIGZhbHNlLCAyMCk7XG4gICAgfVxuXG4gICAgaGFuZGxlQ291bnQgPSAoKSA9PiB7XG4gICAgICAgIHRoaXMuZWxlbWVudC5pbm5lclRleHQgPSB0aGlzLmNvbnRleHQuZ3JpZC5yb3dDb3VudDtcbiAgICB9O1xufVxuXG5Sb3dDb3VudE1vZHVsZS5tb2R1bGVOYW1lID0gXCJyb3djb3VudFwiO1xuXG5leHBvcnQgeyBSb3dDb3VudE1vZHVsZSB9OyIsIi8qKlxuICogQ2xhc3MgdG8gbWFuYWdlIHNvcnRpbmcgZnVuY3Rpb25hbGl0eSBpbiBhIGdyaWQgY29udGV4dC4gIEZvciByZW1vdGUgcHJvY2Vzc2luZywgd2lsbCBzdWJzY3JpYmUgdG8gdGhlIGByZW1vdGVQYXJhbXNgIGV2ZW50LlxuICogRm9yIGxvY2FsIHByb2Nlc3NpbmcsIHdpbGwgc3Vic2NyaWJlIHRvIHRoZSBgcmVuZGVyYCBldmVudC5cbiAqIFxuICogQ2xhc3Mgd2lsbCB0cmlnZ2VyIHRoZSBgcmVuZGVyYCBldmVudCBhZnRlciBzb3J0aW5nIGlzIGFwcGxpZWQsIGFsbG93aW5nIHRoZSBncmlkIHRvIHJlLXJlbmRlciB3aXRoIHRoZSBzb3J0ZWQgZGF0YS5cbiAqL1xuY2xhc3MgU29ydE1vZHVsZSB7XG4gICAgLyoqXG4gICAgICogQ3JlYXRlcyBhIG5ldyBTb3J0TW9kdWxlIG9iamVjdC5cbiAgICAgKiBAcGFyYW0ge0dyaWRDb250ZXh0fSBjb250ZXh0IFxuICAgICAqL1xuICAgIGNvbnN0cnVjdG9yKGNvbnRleHQpIHtcbiAgICAgICAgdGhpcy5jb250ZXh0ID0gY29udGV4dDtcbiAgICAgICAgdGhpcy5oZWFkZXJDZWxscyA9IFtdO1xuICAgICAgICB0aGlzLmN1cnJlbnRTb3J0Q29sdW1uID0gXCJcIjtcbiAgICAgICAgdGhpcy5jdXJyZW50RGlyZWN0aW9uID0gXCJcIjtcbiAgICAgICAgdGhpcy5jdXJyZW50VHlwZSA9IFwiXCI7XG4gICAgfVxuXG4gICAgaW5pdGlhbGl6ZSgpIHtcbiAgICAgICAgaWYgKHRoaXMuY29udGV4dC5zZXR0aW5ncy5yZW1vdGVQcm9jZXNzaW5nKSB7XG4gICAgICAgICAgICB0aGlzLmN1cnJlbnRTb3J0Q29sdW1uID0gdGhpcy5jb250ZXh0LnNldHRpbmdzLnJlbW90ZVNvcnREZWZhdWx0Q29sdW1uO1xuICAgICAgICAgICAgdGhpcy5jdXJyZW50RGlyZWN0aW9uID0gdGhpcy5jb250ZXh0LnNldHRpbmdzLnJlbW90ZVNvcnREZWZhdWx0RGlyZWN0aW9uO1xuICAgICAgICAgICAgdGhpcy5jb250ZXh0LmV2ZW50cy5zdWJzY3JpYmUoXCJyZW1vdGVQYXJhbXNcIiwgdGhpcy5yZW1vdGVQYXJhbXMsIHRydWUpO1xuICAgICAgICAgICAgdGhpcy5faW5pdCh0aGlzLmhhbmRsZVJlbW90ZSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB0aGlzLmNvbnRleHQuZXZlbnRzLnN1YnNjcmliZShcInJlbmRlclwiLCB0aGlzLnJlbmRlckxvY2FsLCBmYWxzZSwgOSk7XG4gICAgICAgICAgICAvL3RoaXMuc29ydGVycyA9IHsgbnVtYmVyOiBzb3J0TnVtYmVyLCBzdHJpbmc6IHNvcnRTdHJpbmcsIGRhdGU6IHNvcnREYXRlLCBkYXRldGltZTogc29ydERhdGUgfTtcbiAgICAgICAgICAgIHRoaXMuc29ydGVycyA9IHRoaXMuI3NldExvY2FsRmlsdGVycygpO1xuICAgICAgICAgICAgdGhpcy5faW5pdCh0aGlzLmhhbmRsZUxvY2FsKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIF9pbml0KGNhbGxiYWNrKSB7XG4gICAgICAgIC8vYmluZCBsaXN0ZW5lciBmb3Igbm9uLWljb24gY29sdW1uczsgYWRkIGNzcyBzb3J0IHRhZy5cbiAgICAgICAgZm9yIChjb25zdCBjb2wgb2YgdGhpcy5jb250ZXh0LmNvbHVtbk1hbmFnZXIuY29sdW1ucykge1xuICAgICAgICAgICAgaWYgKGNvbC50eXBlICE9PSBcImljb25cIikge1xuICAgICAgICAgICAgICAgIHRoaXMuaGVhZGVyQ2VsbHMucHVzaChjb2wuaGVhZGVyQ2VsbCk7XG4gICAgICAgICAgICAgICAgY29sLmhlYWRlckNlbGwuc3Bhbi5jbGFzc0xpc3QuYWRkKFwic29ydFwiKTtcbiAgICAgICAgICAgICAgICBjb2wuaGVhZGVyQ2VsbC5zcGFuLmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCBjYWxsYmFjayk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICAjc2V0TG9jYWxGaWx0ZXJzKCkge1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgZGF0ZTogKGEsIGIsIGRpcmVjdGlvbikgPT4ge1xuICAgICAgICAgICAgICAgIGxldCBjb21wYXJpc29uID0gMDtcbiAgICAgICAgICAgICAgICBsZXQgZGF0ZUEgPSBuZXcgRGF0ZShhKTtcbiAgICAgICAgICAgICAgICBsZXQgZGF0ZUIgPSBuZXcgRGF0ZShiKTtcblxuICAgICAgICAgICAgICAgIGlmIChOdW1iZXIuaXNOYU4oZGF0ZUEudmFsdWVPZigpKSkge1xuICAgICAgICAgICAgICAgICAgICBkYXRlQSA9IG51bGw7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgaWYgKE51bWJlci5pc05hTihkYXRlQi52YWx1ZU9mKCkpKSB7XG4gICAgICAgICAgICAgICAgICAgIGRhdGVCID0gbnVsbDtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgLy9oYW5kbGUgZW1wdHkgdmFsdWVzLlxuICAgICAgICAgICAgICAgIGlmICghZGF0ZUEpIHtcbiAgICAgICAgICAgICAgICAgICAgY29tcGFyaXNvbiA9ICFkYXRlQiA/IDAgOiAtMTtcbiAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKCFkYXRlQikge1xuICAgICAgICAgICAgICAgICAgICBjb21wYXJpc29uID0gMTtcbiAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKGRhdGVBID4gZGF0ZUIpIHsgICAgXG4gICAgICAgICAgICAgICAgICAgIGNvbXBhcmlzb24gPSAxO1xuICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAoZGF0ZUEgPCBkYXRlQikge1xuICAgICAgICAgICAgICAgICAgICBjb21wYXJpc29uID0gLTE7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgcmV0dXJuIGRpcmVjdGlvbiA9PT0gXCJkZXNjXCIgPyAoY29tcGFyaXNvbiAqIC0xKSA6IGNvbXBhcmlzb247XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgbnVtYmVyOiAoYSwgYiwgZGlyZWN0aW9uKSA9PiB7XG4gICAgICAgICAgICAgICAgbGV0IGNvbXBhcmlzb24gPSAwO1xuXG4gICAgICAgICAgICAgICAgaWYgKGEgPiBiKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbXBhcmlzb24gPSAxO1xuICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAoYSA8IGIpIHtcbiAgICAgICAgICAgICAgICAgICAgY29tcGFyaXNvbiA9IC0xO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIHJldHVybiBkaXJlY3Rpb24gPT09IFwiZGVzY1wiID8gKGNvbXBhcmlzb24gKiAtMSkgOiBjb21wYXJpc29uO1xuICAgICAgICAgICAgfSwgXG4gICAgICAgICAgICBzdHJpbmc6IChhLCBiLCBkaXJlY3Rpb24pID0+IHtcbiAgICAgICAgICAgICAgICBsZXQgY29tcGFyaXNvbiA9IDA7XG4gICAgICAgICAgICAgICAgLy9oYW5kbGUgZW1wdHkgdmFsdWVzLlxuICAgICAgICAgICAgICAgIGlmICghYSkge1xuICAgICAgICAgICAgICAgICAgICBjb21wYXJpc29uID0gIWIgPyAwIDogLTE7XG4gICAgICAgICAgICAgICAgfSBlbHNlIGlmICghYikge1xuICAgICAgICAgICAgICAgICAgICBjb21wYXJpc29uID0gMTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCB2YXJBID0gYS50b1VwcGVyQ2FzZSgpO1xuICAgICAgICAgICAgICAgICAgICBjb25zdCB2YXJCID0gYi50b1VwcGVyQ2FzZSgpO1xuICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgICAgICBpZiAodmFyQSA+IHZhckIpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbXBhcmlzb24gPSAxO1xuICAgICAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKHZhckEgPCB2YXJCKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb21wYXJpc29uID0gLTE7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICByZXR1cm4gZGlyZWN0aW9uID09PSBcImRlc2NcIiA/IChjb21wYXJpc29uICogLTEpIDogY29tcGFyaXNvbjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcbiAgICB9XG5cbiAgICByZW1vdGVQYXJhbXMgPSAocGFyYW1zKSA9PiB7XG4gICAgICAgIHBhcmFtcy5zb3J0ID0gdGhpcy5jdXJyZW50U29ydENvbHVtbjtcbiAgICAgICAgcGFyYW1zLmRpcmVjdGlvbiA9IHRoaXMuY3VycmVudERpcmVjdGlvbjtcblxuICAgICAgICByZXR1cm4gcGFyYW1zO1xuICAgIH07XG5cbiAgICBoYW5kbGVSZW1vdGUgPSBhc3luYyAoYykgPT4ge1xuICAgICAgICB0aGlzLmN1cnJlbnRTb3J0Q29sdW1uID0gYy5jdXJyZW50VGFyZ2V0LmNvbnRleHQubmFtZTtcbiAgICAgICAgdGhpcy5jdXJyZW50RGlyZWN0aW9uID0gYy5jdXJyZW50VGFyZ2V0LmNvbnRleHQuZGlyZWN0aW9uTmV4dC52YWx1ZU9mKCk7XG4gICAgICAgIHRoaXMuY3VycmVudFR5cGUgPSBjLmN1cnJlbnRUYXJnZXQuY29udGV4dC50eXBlO1xuXG4gICAgICAgIGlmICghYy5jdXJyZW50VGFyZ2V0LmNvbnRleHQuaXNDdXJyZW50U29ydCkge1xuICAgICAgICAgICAgdGhpcy5yZXNldFNvcnQoKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGMuY3VycmVudFRhcmdldC5jb250ZXh0LnNldFNvcnRGbGFnKCk7XG5cbiAgICAgICAgYXdhaXQgdGhpcy5jb250ZXh0LmV2ZW50cy50cmlnZ2VyKFwicmVuZGVyXCIpO1xuICAgIH07XG5cbiAgICByZXNldFNvcnQoKSB7XG4gICAgICAgIGNvbnN0IGNlbGwgPSB0aGlzLmhlYWRlckNlbGxzLmZpbmQoZSA9PiBlLmlzQ3VycmVudFNvcnQpO1xuXG4gICAgICAgIGlmIChjZWxsICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgIGNlbGwucmVtb3ZlU29ydEZsYWcoKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHJlbmRlckxvY2FsID0gKCkgPT4ge1xuICAgICAgICBpZiAoIXRoaXMuY3VycmVudFNvcnRDb2x1bW4pIHJldHVybjtcblxuICAgICAgICB0aGlzLmNvbnRleHQucGVyc2lzdGVuY2UuZGF0YS5zb3J0KChhLCBiKSA9PiB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5zb3J0ZXJzW3RoaXMuY3VycmVudFR5cGVdKGFbdGhpcy5jdXJyZW50U29ydENvbHVtbl0sIGJbdGhpcy5jdXJyZW50U29ydENvbHVtbl0sIHRoaXMuY3VycmVudERpcmVjdGlvbik7XG4gICAgICAgIH0pO1xuICAgIH07XG5cbiAgICBoYW5kbGVMb2NhbCA9IGFzeW5jIChjKSA9PiB7XG4gICAgICAgIHRoaXMuY3VycmVudFNvcnRDb2x1bW4gPSBjLmN1cnJlbnRUYXJnZXQuY29udGV4dC5uYW1lO1xuICAgICAgICB0aGlzLmN1cnJlbnREaXJlY3Rpb24gPSBjLmN1cnJlbnRUYXJnZXQuY29udGV4dC5kaXJlY3Rpb25OZXh0LnZhbHVlT2YoKTtcbiAgICAgICAgdGhpcy5jdXJyZW50VHlwZSA9IGMuY3VycmVudFRhcmdldC5jb250ZXh0LnR5cGU7XG5cbiAgICAgICAgaWYgKCFjLmN1cnJlbnRUYXJnZXQuY29udGV4dC5pc0N1cnJlbnRTb3J0KSB7XG4gICAgICAgICAgICB0aGlzLnJlc2V0U29ydCgpO1xuICAgICAgICB9XG5cbiAgICAgICAgYy5jdXJyZW50VGFyZ2V0LmNvbnRleHQuc2V0U29ydEZsYWcoKTtcblxuICAgICAgICBhd2FpdCB0aGlzLmNvbnRleHQuZXZlbnRzLnRyaWdnZXIoXCJyZW5kZXJcIik7XG4gICAgfTtcbn1cblxuU29ydE1vZHVsZS5tb2R1bGVOYW1lID0gXCJzb3J0XCI7XG5cbmV4cG9ydCB7IFNvcnRNb2R1bGUgfTsiLCJpbXBvcnQgeyBHcmlkQ29yZSB9IGZyb20gXCIuL2NvcmUvZ3JpZENvcmUuanNcIjtcbmltcG9ydCB7IENzdk1vZHVsZSB9IGZyb20gXCIuL21vZHVsZXMvZG93bmxvYWQvY3N2TW9kdWxlLmpzXCI7XG5pbXBvcnQgeyBGaWx0ZXJNb2R1bGUgfSBmcm9tIFwiLi9tb2R1bGVzL2ZpbHRlci9maWx0ZXJNb2R1bGUuanNcIjtcbmltcG9ydCB7IFJlZnJlc2hNb2R1bGUgfSBmcm9tIFwiLi9tb2R1bGVzL3JlZnJlc2gvcmVmcmVzaE1vZHVsZS5qc1wiO1xuaW1wb3J0IHsgUm93Q291bnRNb2R1bGUgfSBmcm9tIFwiLi9tb2R1bGVzL3Jvdy9yb3dDb3VudE1vZHVsZS5qc1wiO1xuaW1wb3J0IHsgU29ydE1vZHVsZSB9IGZyb20gXCIuL21vZHVsZXMvc29ydC9zb3J0TW9kdWxlLmpzXCI7XG5cbmNsYXNzIERhdGFHcmlkIGV4dGVuZHMgR3JpZENvcmUge1xuICAgIGNvbnN0cnVjdG9yKGNvbnRhaW5lciwgc2V0dGluZ3MpIHtcbiAgICAgICAgc3VwZXIoY29udGFpbmVyLCBzZXR0aW5ncyk7XG5cbiAgICAgICAgaWYgKERhdGFHcmlkLmRlZmF1bHRPcHRpb25zLmVuYWJsZUZpbHRlcikge1xuICAgICAgICAgICAgdGhpcy5hZGRNb2R1bGVzKEZpbHRlck1vZHVsZSk7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoRGF0YUdyaWQuZGVmYXVsdE9wdGlvbnMuZW5hYmxlU29ydCkge1xuICAgICAgICAgICAgdGhpcy5hZGRNb2R1bGVzKFNvcnRNb2R1bGUpO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHRoaXMuc2V0dGluZ3Mucm93Q291bnRJZCkge1xuICAgICAgICAgICAgdGhpcy5hZGRNb2R1bGVzKFJvd0NvdW50TW9kdWxlKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICh0aGlzLnNldHRpbmdzLnJlZnJlc2hhYmxlSWQpIHtcbiAgICAgICAgICAgIHRoaXMuYWRkTW9kdWxlcyhSZWZyZXNoTW9kdWxlKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICh0aGlzLnNldHRpbmdzLmNzdkV4cG9ydElkKSB7XG4gICAgICAgICAgICB0aGlzLmFkZE1vZHVsZXMoQ3N2TW9kdWxlKTtcbiAgICAgICAgfVxuICAgIH1cbn1cblxuRGF0YUdyaWQuZGVmYXVsdE9wdGlvbnMgPSB7XG4gICAgZW5hYmxlU29ydDogdHJ1ZSxcbiAgICBlbmFibGVGaWx0ZXI6IHRydWVcbn07XG5cbmV4cG9ydCB7IERhdGFHcmlkIH07Il0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FBQ0E7QUFDQTtBQUNBLE1BQU0sVUFBVSxDQUFDO0FBQ2pCO0FBQ0E7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
