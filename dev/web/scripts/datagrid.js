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
                this.element.append(modules[column.formatterParams.name].apply(rowData, column, row));
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGF0YWdyaWQuanMiLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NyYy9jb21wb25lbnRzL2NlbGwvaGVhZGVyQ2VsbC5qcyIsIi4uLy4uLy4uL3NyYy9jb21wb25lbnRzL2NvbHVtbi9jb2x1bW4uanMiLCIuLi8uLi8uLi9zcmMvY29tcG9uZW50cy9jb2x1bW4vY29sdW1uTWFuYWdlci5qcyIsIi4uLy4uLy4uL3NyYy9jb21wb25lbnRzL2RhdGEvZGF0YVBpcGVsaW5lLmpzIiwiLi4vLi4vLi4vc3JjL2NvbXBvbmVudHMvZGF0YS9kYXRhTG9hZGVyLmpzIiwiLi4vLi4vLi4vc3JjL2NvbXBvbmVudHMvZGF0YS9kYXRhUGVyc2lzdGVuY2UuanMiLCIuLi8uLi8uLi9zcmMvY29tcG9uZW50cy9ldmVudHMvZ3JpZEV2ZW50cy5qcyIsIi4uLy4uLy4uL3NyYy9jb21wb25lbnRzL2hlbHBlcnMvZGF0ZUhlbHBlci5qcyIsIi4uLy4uLy4uL3NyYy9jb21wb25lbnRzL2NlbGwvZm9ybWF0dGVycy9kYXRldGltZS5qcyIsIi4uLy4uLy4uL3NyYy9jb21wb25lbnRzL2NlbGwvZm9ybWF0dGVycy9saW5rLmpzIiwiLi4vLi4vLi4vc3JjL2NvbXBvbmVudHMvY2VsbC9mb3JtYXR0ZXJzL251bWVyaWMuanMiLCIuLi8uLi8uLi9zcmMvY29tcG9uZW50cy9jZWxsL2Zvcm1hdHRlcnMvc3Rhci5qcyIsIi4uLy4uLy4uL3NyYy9jb21wb25lbnRzL2hlbHBlcnMvY3NzSGVscGVyLmpzIiwiLi4vLi4vLi4vc3JjL2NvbXBvbmVudHMvY2VsbC9jZWxsLmpzIiwiLi4vLi4vLi4vc3JjL2NvbXBvbmVudHMvdGFibGUvdGFibGUuanMiLCIuLi8uLi8uLi9zcmMvY29tcG9uZW50cy9jb250ZXh0L2dyaWRDb250ZXh0LmpzIiwiLi4vLi4vLi4vc3JjL3NldHRpbmdzL3NldHRpbmdzRGVmYXVsdC5qcyIsIi4uLy4uLy4uL3NyYy9zZXR0aW5ncy9tZXJnZU9wdGlvbnMuanMiLCIuLi8uLi8uLi9zcmMvc2V0dGluZ3Mvc2V0dGluZ3NHcmlkLmpzIiwiLi4vLi4vLi4vc3JjL21vZHVsZXMvcm93L3Jvd01vZHVsZS5qcyIsIi4uLy4uLy4uL3NyYy9tb2R1bGVzL3BhZ2VyL3BhZ2VyQnV0dG9ucy5qcyIsIi4uLy4uLy4uL3NyYy9tb2R1bGVzL3BhZ2VyL3BhZ2VyTW9kdWxlLmpzIiwiLi4vLi4vLi4vc3JjL2NvcmUvZ3JpZENvcmUuanMiLCIuLi8uLi8uLi9zcmMvbW9kdWxlcy9kb3dubG9hZC9jc3ZNb2R1bGUuanMiLCIuLi8uLi8uLi9zcmMvbW9kdWxlcy9maWx0ZXIvdHlwZXMvZmlsdGVyVGFyZ2V0LmpzIiwiLi4vLi4vLi4vc3JjL21vZHVsZXMvZmlsdGVyL3R5cGVzL2ZpbHRlckRhdGUuanMiLCIuLi8uLi8uLi9zcmMvbW9kdWxlcy9maWx0ZXIvdHlwZXMvZmlsdGVyRnVuY3Rpb24uanMiLCIuLi8uLi8uLi9zcmMvY29tcG9uZW50cy9oZWxwZXJzL2VsZW1lbnRIZWxwZXIuanMiLCIuLi8uLi8uLi9zcmMvbW9kdWxlcy9maWx0ZXIvZWxlbWVudHMvZWxlbWVudEJldHdlZW4uanMiLCIuLi8uLi8uLi9zcmMvbW9kdWxlcy9maWx0ZXIvZWxlbWVudHMvZWxlbWVudElucHV0LmpzIiwiLi4vLi4vLi4vc3JjL21vZHVsZXMvZmlsdGVyL2VsZW1lbnRzL2VsZW1lbnRNdWx0aVNlbGVjdC5qcyIsIi4uLy4uLy4uL3NyYy9tb2R1bGVzL2ZpbHRlci9lbGVtZW50cy9lbGVtZW50U2VsZWN0LmpzIiwiLi4vLi4vLi4vc3JjL21vZHVsZXMvZmlsdGVyL2ZpbHRlck1vZHVsZS5qcyIsIi4uLy4uLy4uL3NyYy9tb2R1bGVzL3JlZnJlc2gvcmVmcmVzaE1vZHVsZS5qcyIsIi4uLy4uLy4uL3NyYy9tb2R1bGVzL3Jvdy9yb3dDb3VudE1vZHVsZS5qcyIsIi4uLy4uLy4uL3NyYy9tb2R1bGVzL3NvcnQvc29ydE1vZHVsZS5qcyIsIi4uLy4uLy4uL3NyYy9kYXRhZ3JpZC5qcyJdLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIERlZmluZXMgYSBzaW5nbGUgaGVhZGVyIGNlbGwgJ3RoJyBlbGVtZW50LlxuICovXG5jbGFzcyBIZWFkZXJDZWxsIHtcbiAgICAvKipcbiAgICAgKiBDcmVhdGUgaGVhZGVyIG9iamVjdCB0aGF0IHJlcHJlc2VudHMgdGhlIGB0aGAgdGFibGUgaGVhZGVyIGVsZW1lbnQuICBDbGFzcyB3aWxsIHBlcnNpc3QgY29sdW1uIHNvcnQgYW5kIG9yZGVyIHVzZXIgaW5wdXQuXG4gICAgICogQHBhcmFtIHtDb2x1bW59IGNvbHVtbiBjb2x1bW4gb2JqZWN0LlxuICAgICAqL1xuICAgIGNvbnN0cnVjdG9yKGNvbHVtbikge1xuICAgICAgICB0aGlzLmNvbHVtbiA9IGNvbHVtbjtcbiAgICAgICAgdGhpcy5zZXR0aW5ncyA9IGNvbHVtbi5zZXR0aW5ncztcbiAgICAgICAgdGhpcy5lbGVtZW50ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcInRoXCIpO1xuICAgICAgICB0aGlzLnNwYW4gPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwic3BhblwiKTtcbiAgICAgICAgdGhpcy5uYW1lID0gY29sdW1uLmZpZWxkO1xuICAgICAgICB0aGlzLmRpcmVjdGlvbiA9IFwiZGVzY1wiO1xuICAgICAgICB0aGlzLmRpcmVjdGlvbk5leHQgPSBcImRlc2NcIjtcbiAgICAgICAgdGhpcy50eXBlID0gY29sdW1uLnR5cGU7XG5cbiAgICAgICAgaWYgKGNvbHVtbi5oZWFkZXJDc3MpIHtcbiAgICAgICAgICAgIHRoaXMuZWxlbWVudC5jbGFzc0xpc3QuYWRkKGNvbHVtbi5oZWFkZXJDc3MpO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHRoaXMuc2V0dGluZ3MudGFibGVIZWFkZXJUaENzcykge1xuICAgICAgICAgICAgdGhpcy5lbGVtZW50LmNsYXNzTGlzdC5hZGQodGhpcy5zZXR0aW5ncy50YWJsZUhlYWRlclRoQ3NzKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChjb2x1bW4uY29sdW1uU2l6ZSkge1xuICAgICAgICAgICAgdGhpcy5lbGVtZW50LmNsYXNzTGlzdC5hZGQoY29sdW1uLmNvbHVtblNpemUpO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKGNvbHVtbi53aWR0aCkge1xuICAgICAgICAgICAgdGhpcy5lbGVtZW50LnN0eWxlLndpZHRoID0gY29sdW1uLndpZHRoO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKGNvbHVtbi5oZWFkZXJGaWx0ZXJFbXB0eSkge1xuICAgICAgICAgICAgdGhpcy5zcGFuLmNsYXNzTGlzdC5hZGQoY29sdW1uLmhlYWRlckZpbHRlckVtcHR5KTtcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMuZWxlbWVudC5hcHBlbmRDaGlsZCh0aGlzLnNwYW4pO1xuICAgICAgICB0aGlzLmVsZW1lbnQuY29udGV4dCA9IHRoaXM7XG4gICAgICAgIHRoaXMuc3Bhbi5pbm5lclRleHQgPSBjb2x1bW4ubGFiZWw7XG4gICAgICAgIHRoaXMuc3Bhbi5jb250ZXh0ID0gdGhpcztcbiAgICB9XG4gICAgLyoqXG4gICAgICogU2V0IHRoZSBzb3J0IGZsYWcgZm9yIHRoZSBoZWFkZXIgY2VsbC5cbiAgICAgKi9cbiAgICBzZXRTb3J0RmxhZygpIHtcbiAgICAgICAgaWYgKHRoaXMuaWNvbiA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICB0aGlzLmljb24gPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiaVwiKTtcbiAgICAgICAgICAgIHRoaXMuc3Bhbi5hcHBlbmQodGhpcy5pY29uKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICh0aGlzLmRpcmVjdGlvbk5leHQgPT09IFwiZGVzY1wiKSB7XG4gICAgICAgICAgICB0aGlzLmljb24uY2xhc3NMaXN0ID0gdGhpcy5zZXR0aW5ncy50YWJsZUNzc1NvcnREZXNjO1xuICAgICAgICAgICAgdGhpcy5kaXJlY3Rpb24gPSBcImRlc2NcIjtcbiAgICAgICAgICAgIHRoaXMuZGlyZWN0aW9uTmV4dCA9IFwiYXNjXCI7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB0aGlzLmljb24uY2xhc3NMaXN0ID0gdGhpcy5zZXR0aW5ncy50YWJsZUNzc1NvcnRBc2M7XG4gICAgICAgICAgICB0aGlzLmRpcmVjdGlvbiA9IFwiYXNjXCI7XG4gICAgICAgICAgICB0aGlzLmRpcmVjdGlvbk5leHQgPSBcImRlc2NcIjtcbiAgICAgICAgfVxuICAgIH1cbiAgICAvKipcbiAgICAgKiBSZW1vdmUgdGhlIHNvcnQgZmxhZyBmb3IgdGhlIGhlYWRlciBjZWxsLlxuICAgICAqL1xuICAgIHJlbW92ZVNvcnRGbGFnKCkge1xuICAgICAgICB0aGlzLmRpcmVjdGlvbiA9IFwiZGVzY1wiO1xuICAgICAgICB0aGlzLmRpcmVjdGlvbk5leHQgPSBcImRlc2NcIjtcbiAgICAgICAgdGhpcy5pY29uID0gdGhpcy5pY29uLnJlbW92ZSgpO1xuICAgIH1cblxuICAgIGdldCBpc0N1cnJlbnRTb3J0KCkge1xuICAgICAgICByZXR1cm4gdGhpcy5pY29uICE9PSB1bmRlZmluZWQ7XG4gICAgfVxufVxuXG5leHBvcnQgeyBIZWFkZXJDZWxsIH07IiwiLyoqXG4gKiBEZWZpbmVzIGEgc2luZ2xlIGNvbHVtbiBmb3IgdGhlIGdyaWQuICBUcmFuc2Zvcm1zIHVzZXIncyBjb2x1bW4gZGVmaW5pdGlvbiBpbnRvIENsYXNzIHByb3BlcnRpZXMuXG4gKiBAY2xhc3NcbiAqL1xuY2xhc3MgQ29sdW1uIHtcbiAgICAvKipcbiAgICAgKiBDcmVhdGUgY29sdW1uIG9iamVjdCB3aGljaCB0cmFuc2Zvcm1zIHVzZXIncyBjb2x1bW4gZGVmaW5pdGlvbiBpbnRvIENsYXNzIHByb3BlcnRpZXMuXG4gICAgICogQHBhcmFtIHtPYmplY3R9IGNvbHVtbiBVc2VyJ3MgY29sdW1uIGRlZmluaXRpb24vc2V0dGluZ3MuXG4gICAgICogQHBhcmFtIHtTZXR0aW5nc0dyaWR9IHNldHRpbmdzIGdyaWQgc2V0dGluZ3MuXG4gICAgICogQHBhcmFtIHtudW1iZXJ9IGluZGV4IGNvbHVtbiBpbmRleCBudW1iZXIuXG4gICAgICovXG4gICAgY29uc3RydWN0b3IoY29sdW1uLCBzZXR0aW5ncywgaW5kZXggPSAwKSB7XG4gICAgICAgIHRoaXMuc2V0dGluZ3MgPSBzZXR0aW5ncztcbiAgICAgICAgdGhpcy5pbmRleCA9IGluZGV4O1xuXG4gICAgICAgIGlmIChjb2x1bW4uZmllbGQgPT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgdGhpcy5maWVsZCA9IGBjb2x1bW4ke2luZGV4fWA7ICAvL2Fzc29jaWF0ZWQgZGF0YSBmaWVsZCBuYW1lLlxuICAgICAgICAgICAgdGhpcy50eXBlID0gXCJpY29uXCI7ICAvL2ljb24gdHlwZS5cbiAgICAgICAgICAgIHRoaXMubGFiZWwgPSBcIlwiO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdGhpcy5maWVsZCA9IGNvbHVtbi5maWVsZDsgIC8vYXNzb2NpYXRlZCBkYXRhIGZpZWxkIG5hbWUuXG4gICAgICAgICAgICB0aGlzLnR5cGUgPSBjb2x1bW4udHlwZSA/IGNvbHVtbi50eXBlIDogXCJzdHJpbmdcIjsgIC8vdmFsdWUgdHlwZS5cbiAgICAgICAgICAgIHRoaXMubGFiZWwgPSBjb2x1bW4ubGFiZWwgXG4gICAgICAgICAgICAgICAgPyBjb2x1bW4ubGFiZWwgXG4gICAgICAgICAgICAgICAgOiBjb2x1bW4uZmllbGRbMF0udG9VcHBlckNhc2UoKSArIGNvbHVtbi5maWVsZC5zbGljZSgxKTsgIC8vY29sdW1uIHRpdGxlLlxuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5mb3JtYXR0ZXIgPSBjb2x1bW4uZm9ybWF0dGVyOyAgLy9mb3JtYXR0ZXIgdHlwZSBvciBmdW5jdGlvbi5cbiAgICAgICAgdGhpcy5mb3JtYXR0ZXJQYXJhbXMgPSBjb2x1bW4uZm9ybWF0dGVyUGFyYW1zO1xuICAgICAgICB0aGlzLmhlYWRlckNzcyA9IGNvbHVtbi5oZWFkZXJDc3M7XG4gICAgICAgIHRoaXMuY29sdW1uU2l6ZSA9IGNvbHVtbj8uY29sdW1uU2l6ZSA/IGBkYXRhZ3JpZHMtY29sLSR7Y29sdW1uLmNvbHVtblNpemV9YCA6IFwiXCI7XG4gICAgICAgIHRoaXMud2lkdGggPSBjb2x1bW4/LndpZHRoID8/IHVuZGVmaW5lZDtcbiAgICAgICAgdGhpcy5oYXNGaWx0ZXIgPSB0aGlzLnR5cGUgIT09IFwiaWNvblwiICYmIGNvbHVtbi5maWx0ZXJUeXBlID8gdHJ1ZSA6IGZhbHNlO1xuICAgICAgICB0aGlzLmhlYWRlckNlbGwgPSB1bmRlZmluZWQ7ICAvL0hlYWRlckNlbGwgY2xhc3MuXG4gICAgICAgIHRoaXMuaGVhZGVyRmlsdGVyID0gdW5kZWZpbmVkOyAgLy9IZWFkZXJGaWx0ZXIgY2xhc3MuXG5cbiAgICAgICAgaWYgKHRoaXMuaGFzRmlsdGVyKSB7XG4gICAgICAgICAgICB0aGlzLiNpbml0aWFsaXplRmlsdGVyKGNvbHVtbiwgc2V0dGluZ3MpO1xuICAgICAgICB9IGVsc2UgaWYgKGNvbHVtbj8uaGVhZGVyRmlsdGVyRW1wdHkpIHtcbiAgICAgICAgICAgIHRoaXMuaGVhZGVyRmlsdGVyRW1wdHkgPSAodHlwZW9mIGNvbHVtbi5oZWFkZXJGaWx0ZXJFbXB0eSA9PT0gXCJzdHJpbmdcIikgXG4gICAgICAgICAgICAgICAgPyBjb2x1bW4uaGVhZGVyRmlsdGVyRW1wdHkgOiBcImRhdGFncmlkcy1uby1oZWFkZXJcIjtcbiAgICAgICAgfVxuICAgICAgICAvL1Rvb2x0aXAgc2V0dGluZy5cbiAgICAgICAgaWYgKGNvbHVtbi50b29sdGlwRmllbGQpIHtcbiAgICAgICAgICAgIHRoaXMudG9vbHRpcEZpZWxkID0gY29sdW1uLnRvb2x0aXBGaWVsZDtcbiAgICAgICAgICAgIHRoaXMudG9vbHRpcExheW91dCA9IGNvbHVtbj8udG9vbHRpcExheW91dCA9PT0gXCJyaWdodFwiID8gXCJkYXRhZ3JpZHMtdG9vbHRpcC1yaWdodFwiIDogXCJkYXRhZ3JpZHMtdG9vbHRpcC1sZWZ0XCI7XG4gICAgICAgIH1cbiAgICB9XG4gICAgLyoqXG4gICAgICogSW5pdGlhbGl6ZXMgZmlsdGVyIHByb3BlcnRpZXMuXG4gICAgICogQHBhcmFtIHtPYmplY3R9IGNvbHVtbiBcbiAgICAgKiBAcGFyYW0ge1NldHRpbmdzfSBzZXR0aW5ncyBcbiAgICAgKi9cbiAgICAjaW5pdGlhbGl6ZUZpbHRlcihjb2x1bW4sIHNldHRpbmdzKSB7XG4gICAgICAgIHRoaXMuZmlsdGVyRWxlbWVudCA9IGNvbHVtbi5maWx0ZXJUeXBlID09PSBcImJldHdlZW5cIiA/IFwiYmV0d2VlblwiIDogXCJpbnB1dFwiO1xuICAgICAgICB0aGlzLmZpbHRlclR5cGUgPSBjb2x1bW4uZmlsdGVyVHlwZTsgIC8vZmlsdGVyIHR5cGUgZGVzY3JpcHRvciwgc3VjaCBhczogZXF1YWxzLCBsaWtlLCA8LCBldGM7IGNhbiBhbHNvIGJlIGEgZnVuY3Rpb24uXG4gICAgICAgIHRoaXMuZmlsdGVyUGFyYW1zID0gY29sdW1uLmZpbHRlclBhcmFtcztcbiAgICAgICAgdGhpcy5maWx0ZXJDc3MgPSBjb2x1bW4/LmZpbHRlckNzcyA/PyBzZXR0aW5ncy50YWJsZUZpbHRlckNzcztcbiAgICAgICAgdGhpcy5maWx0ZXJSZWFsVGltZSA9IGNvbHVtbj8uZmlsdGVyUmVhbFRpbWUgPz8gZmFsc2U7XG5cbiAgICAgICAgaWYgKGNvbHVtbi5maWx0ZXJWYWx1ZXMpIHtcbiAgICAgICAgICAgIHRoaXMuZmlsdGVyVmFsdWVzID0gY29sdW1uLmZpbHRlclZhbHVlczsgIC8vc2VsZWN0IG9wdGlvbiBmaWx0ZXIgdmFsdWUuXG4gICAgICAgICAgICB0aGlzLmZpbHRlclZhbHVlc1JlbW90ZVNvdXJjZSA9IHR5cGVvZiBjb2x1bW4uZmlsdGVyVmFsdWVzID09PSBcInN0cmluZ1wiID8gY29sdW1uLmZpbHRlclZhbHVlcyA6IHVuZGVmaW5lZDsgIC8vc2VsZWN0IG9wdGlvbiBmaWx0ZXIgdmFsdWUgYWpheCBzb3VyY2UuXG4gICAgICAgICAgICB0aGlzLmZpbHRlckVsZW1lbnQgPSBjb2x1bW4uZmlsdGVyTXVsdGlTZWxlY3QgPyBcIm11bHRpXCIgOlwic2VsZWN0XCI7XG4gICAgICAgICAgICB0aGlzLmZpbHRlck11bHRpU2VsZWN0ID0gY29sdW1uLmZpbHRlck11bHRpU2VsZWN0O1xuICAgICAgICB9XG4gICAgfVxufVxuXG5leHBvcnQgeyBDb2x1bW4gfTsiLCJpbXBvcnQgeyBIZWFkZXJDZWxsIH0gZnJvbSBcIi4uL2NlbGwvaGVhZGVyQ2VsbC5qc1wiO1xuaW1wb3J0IHsgQ29sdW1uIH0gZnJvbSBcIi4vY29sdW1uLmpzXCI7XG4vKipcbiAqIENyZWF0ZXMgYW5kIG1hbmFnZXMgdGhlIGNvbHVtbnMgZm9yIHRoZSBncmlkLiAgV2lsbCBjcmVhdGUgYSBgQ29sdW1uYCBvYmplY3QgZm9yIGVhY2ggY29sdW1uIGRlZmluaXRpb24gcHJvdmlkZWQgYnkgdGhlIHVzZXIuXG4gKi9cbmNsYXNzIENvbHVtbk1hbmFnZXIge1xuICAgICNjb2x1bW5zO1xuICAgICNpbmRleENvdW50ZXIgPSAwO1xuICAgIC8qKlxuICAgICAqIFRyYW5zZm9ybXMgdXNlcidzIGNvbHVtbiBkZWZpbml0aW9ucyBpbnRvIGNvbmNyZXRlIGBDb2x1bW5gIGNsYXNzIG9iamVjdHMuICBXaWxsIGFsc28gY3JlYXRlIGBIZWFkZXJDZWxsYCBvYmplY3RzIFxuICAgICAqIGZvciBlYWNoIGNvbHVtbi5cbiAgICAgKiBAcGFyYW0ge0FycmF5PE9iamVjdD59IGNvbHVtbnMgQ29sdW1uIGRlZmluaXRpb25zIGZyb20gdXNlci5cbiAgICAgKiBAcGFyYW0ge1NldHRpbmdzR3JpZH0gc2V0dGluZ3MgR3JpZCBzZXR0aW5ncy5cbiAgICAgKi9cbiAgICBjb25zdHJ1Y3Rvcihjb2x1bW5zLCBzZXR0aW5ncykge1xuICAgICAgICB0aGlzLiNjb2x1bW5zID0gW107XG4gICAgICAgIHRoaXMuc2V0dGluZ3MgPSBzZXR0aW5ncztcbiAgICAgICAgdGhpcy50YWJsZUV2ZW5Db2x1bW5XaWR0aHMgPSBzZXR0aW5ncy50YWJsZUV2ZW5Db2x1bW5XaWR0aHM7XG4gICAgICAgIHRoaXMuaGFzSGVhZGVyRmlsdGVycyA9IGZhbHNlO1xuXG4gICAgICAgIGZvciAoY29uc3QgYyBvZiBjb2x1bW5zKSB7XG4gICAgICAgICAgICBjb25zdCBjb2wgPSBuZXcgQ29sdW1uKGMsIHNldHRpbmdzLCB0aGlzLiNpbmRleENvdW50ZXIpO1xuICAgICAgICAgIFxuICAgICAgICAgICAgY29sLmhlYWRlckNlbGwgPSBuZXcgSGVhZGVyQ2VsbChjb2wpO1xuXG4gICAgICAgICAgICB0aGlzLiNjb2x1bW5zLnB1c2goY29sKTtcbiAgICAgICAgICAgIHRoaXMuI2luZGV4Q291bnRlcisrO1xuICAgICAgICB9XG4gICAgICAgIC8vIENoZWNrIGlmIGFueSBjb2x1bW4gaGFzIGEgZmlsdGVyIGRlZmluZWRcbiAgICAgICAgaWYgKHRoaXMuI2NvbHVtbnMuc29tZSgoYykgPT4gYy5oYXNGaWx0ZXIpKSB7XG4gICAgICAgICAgICB0aGlzLmhhc0hlYWRlckZpbHRlcnMgPSB0cnVlO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHNldHRpbmdzLnRhYmxlRXZlbkNvbHVtbldpZHRocykge1xuICAgICAgICAgICAgdGhpcy4jc2V0RXZlbkNvbHVtbldpZHRocygpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgI3NldEV2ZW5Db2x1bW5XaWR0aHMoKSB7IFxuICAgICAgICBjb25zdCBjb3VudCA9ICh0aGlzLiNpbmRleENvdW50ZXIgKyAxKTtcbiAgICAgICAgY29uc3Qgd2lkdGggPSAxMDAgLyBjb3VudDtcblxuICAgICAgICB0aGlzLiNjb2x1bW5zLmZvckVhY2goKGgpID0+IGguaGVhZGVyQ2VsbC5lbGVtZW50LnN0eWxlLndpZHRoID0gYCR7d2lkdGh9JWApO1xuICAgIH1cbiAgICAvKipcbiAgICAgKiBHZXQgYXJyYXkgb2YgYENvbHVtbmAgb2JqZWN0cy5cbiAgICAgKiBAcmV0dXJucyB7QXJyYXk8Q29sdW1uPn0gYXJyYXkgb2YgYENvbHVtbmAgb2JqZWN0cy5cbiAgICAgKi9cbiAgICBnZXQgY29sdW1ucygpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuI2NvbHVtbnM7XG4gICAgfVxuICAgIC8qKlxuICAgICAqIEFkZHMgYSBuZXcgY29sdW1uIHRvIHRoZSBjb2x1bW5zIGNvbGxlY3Rpb24uXG4gICAgICogQHBhcmFtIHtPYmplY3R9IGNvbHVtbiBDb2x1bW4gZGVmaW5pdGlvbiBvYmplY3QuXG4gICAgICogQHBhcmFtIHtudW1iZXJ9IFtpbmRleD1udWxsXSBJbmRleCB0byBpbnNlcnQgdGhlIGNvbHVtbiBhdC4gSWYgbnVsbCwgYXBwZW5kcyB0byB0aGUgZW5kLlxuICAgICAqL1xuICAgIGFkZENvbHVtbihjb2x1bW4sIGluZGV4ID0gbnVsbCkgeyBcbiAgICAgICAgY29uc3QgY29sID0gbmV3IENvbHVtbihjb2x1bW4sIHRoaXMuc2V0dGluZ3MsIHRoaXMuI2luZGV4Q291bnRlcik7XG4gICAgICAgIGNvbC5oZWFkZXJDZWxsID0gbmV3IEhlYWRlckNlbGwoY29sKTtcblxuICAgICAgICBpZiAoaW5kZXggIT09IG51bGwgJiYgaW5kZXggPj0gMCAmJiBpbmRleCA8IHRoaXMuI2NvbHVtbnMubGVuZ3RoKSB7XG4gICAgICAgICAgICB0aGlzLiNjb2x1bW5zLnNwbGljZShpbmRleCwgMCwgY29sKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHRoaXMuI2NvbHVtbnMucHVzaChjb2wpO1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy4jaW5kZXhDb3VudGVyKys7XG5cbiAgICAgICAgaWYgKHRoaXMudGFibGVFdmVuQ29sdW1uV2lkdGhzKSB7XG4gICAgICAgICAgICB0aGlzLiNzZXRFdmVuQ29sdW1uV2lkdGhzKCk7XG4gICAgICAgIH1cbiAgICB9XG59XG5cbmV4cG9ydCB7IENvbHVtbk1hbmFnZXIgfTsiLCIvKipcbiAqIENsYXNzIHRvIGJ1aWxkIGEgZGF0YS1wcm9jZXNzaW5nIHBpcGVsaW5lIHRoYXQgaW52b2tlcyBhbiBhc3luYyBmdW5jdGlvbiB0byByZXRyaWV2ZSBkYXRhIGZyb20gYSByZW1vdGUgc291cmNlLCBcbiAqIGFuZCBwYXNzIHRoZSByZXN1bHRzIHRvIGFuIGFzc29jaWF0ZWQgaGFuZGxlciBmdW5jdGlvbi4gIFdpbGwgZXhlY3V0ZSBzdGVwcyBpbiB0aGUgb3JkZXIgdGhleSBhcmUgYWRkZWQgdG8gdGhlIGNsYXNzLlxuICogXG4gKiBUaGUgbWFpbiBwdXJwb3NlIG9mIHRoaXMgY2xhc3MgaXMgdG8gcmV0cmlldmUgcmVtb3RlIGRhdGEgZm9yIHNlbGVjdCBpbnB1dCBjb250cm9scywgYnV0IGNhbiBiZSB1c2VkIGZvciBhbnkgaGFuZGxpbmcgXG4gKiBvZiByZW1vdGUgZGF0YSByZXRyaWV2YWwgYW5kIHByb2Nlc3NpbmcuXG4gKi9cbmNsYXNzIERhdGFQaXBlbGluZSB7XG4gICAgI3BpcGVsaW5lcztcbiAgICAvKipcbiAgICAgKiBDcmVhdGVzIGRhdGEtcHJvY2Vzc2luZyBwaXBlbGluZSBjbGFzcy4gIFdpbGwgaW50ZXJuYWxseSBidWlsZCBhIGtleS92YWx1ZSBwYWlyIG9mIGV2ZW50cyBhbmQgYXNzb2NpYXRlZFxuICAgICAqIGNhbGxiYWNrIGZ1bmN0aW9ucy4gIFZhbHVlIHdpbGwgYmUgYW4gYXJyYXkgdG8gYWNjb21tb2RhdGUgbXVsdGlwbGUgY2FsbGJhY2tzIGFzc2lnbmVkIHRvIHRoZSBzYW1lIGV2ZW50IFxuICAgICAqIGtleSBuYW1lLlxuICAgICAqIEBwYXJhbSB7U2V0dGluZ3NHcmlkfSBzZXR0aW5ncyBcbiAgICAgKi9cbiAgICBjb25zdHJ1Y3RvcihzZXR0aW5ncykge1xuICAgICAgICB0aGlzLiNwaXBlbGluZXMgPSB7fTsgXG4gICAgICAgIHRoaXMuYWpheFVybCA9IHNldHRpbmdzLmFqYXhVcmw7XG4gICAgfVxuXG4gICAgY291bnRFdmVudFN0ZXBzKGV2ZW50TmFtZSkge1xuICAgICAgICBpZiAoIXRoaXMuI3BpcGVsaW5lc1tldmVudE5hbWVdKSByZXR1cm4gMDtcblxuICAgICAgICByZXR1cm4gdGhpcy4jcGlwZWxpbmVzW2V2ZW50TmFtZV0ubGVuZ3RoO1xuICAgIH1cbiAgICAvKipcbiAgICAgKiBSZXR1cm5zIGB0cnVlYCBpZiBzdGVwcyBhcmUgcmVnaXN0ZXJlZCBmb3IgdGhlIGFzc29jaWF0ZWQgZXZlbnQgbmFtZSwgb3IgYGZhbHNlYCBpZiBubyBtYXRjaGluZyByZXN1bHRzIGFyZSBmb3VuZC5cbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gZXZlbnROYW1lIEV2ZW50IG5hbWUuXG4gICAgICogQHJldHVybnMge2Jvb2xlYW59IGB0cnVlYCBpZiByZXN1bHRzIGFyZSBmb3VuZCBmb3IgZXZlbnQgbmFtZSwgb3RoZXJ3aXNlIGBmYWxzZWAuXG4gICAgICovXG4gICAgaGFzUGlwZWxpbmUoZXZlbnROYW1lKSB7XG4gICAgICAgIGlmICghdGhpcy4jcGlwZWxpbmVzW2V2ZW50TmFtZV0pIHJldHVybiBmYWxzZTtcblxuICAgICAgICByZXR1cm4gdGhpcy4jcGlwZWxpbmVzW2V2ZW50TmFtZV0ubGVuZ3RoID4gMDtcbiAgICB9XG4gICAgLyoqXG4gICAgICogUmVnaXN0ZXIgYW4gYXN5bmNocm9ub3VzIGNhbGxiYWNrIHN0ZXAgdG8gdGhlIHBpcGVsaW5lLiAgTW9yZSB0aGFuIG9uZSBjYWxsYmFjayBjYW4gYmUgcmVnaXN0ZXJlZCB0byB0aGUgc2FtZSBldmVudCBuYW1lLlxuICAgICAqIFxuICAgICAqIElmIGEgZHVwbGljYXRlL21hdGNoaW5nIGV2ZW50IG5hbWUgYW5kIGNhbGxiYWNrIGZ1bmN0aW9uIGhhcyBhbHJlYWR5IGJlZW4gcmVnaXN0ZXJlZCwgbWV0aG9kIHdpbGwgc2tpcCB0aGUgXG4gICAgICogcmVnaXN0cmF0aW9uIHByb2Nlc3MuXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IGV2ZW50TmFtZSBFdmVudCBuYW1lLlxuICAgICAqIEBwYXJhbSB7RnVuY3Rpb259IGNhbGxiYWNrIEFuIGFzeW5jIGZ1bmN0aW9uLlxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBbdXJsPVwiXCJdIFRhcmdldCB1cmwuICBXaWxsIHVzZSBgYWpheFVybGAgcHJvcGVydHkgZGVmYXVsdCBpZiBhcmd1bWVudCBpcyBlbXB0eS5cbiAgICAgKi9cbiAgICBhZGRTdGVwKGV2ZW50TmFtZSwgY2FsbGJhY2ssIHVybCA9IFwiXCIpIHtcbiAgICAgICAgaWYgKCF0aGlzLiNwaXBlbGluZXNbZXZlbnROYW1lXSkge1xuICAgICAgICAgICAgdGhpcy4jcGlwZWxpbmVzW2V2ZW50TmFtZV0gPSBbXTtcbiAgICAgICAgfSBlbHNlIGlmICh0aGlzLiNwaXBlbGluZXNbZXZlbnROYW1lXS5zb21lKCh4KSA9PiB4LmNhbGxiYWNrID09PSBjYWxsYmFjaykpIHtcbiAgICAgICAgICAgIGNvbnNvbGUud2FybihcIkNhbGxiYWNrIGZ1bmN0aW9uIGFscmVhZHkgZm91bmQgZm9yOiBcIiArIGV2ZW50TmFtZSk7XG4gICAgICAgICAgICByZXR1cm47ICAvLyBJZiBldmVudCBuYW1lIGFuZCBjYWxsYmFjayBhbHJlYWR5IGV4aXN0LCBkb24ndCBhZGQuXG4gICAgICAgIH1cblxuICAgICAgICBpZiAodXJsID09PSBcIlwiKSB7XG4gICAgICAgICAgICB1cmwgPSB0aGlzLmFqYXhVcmw7XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLiNwaXBlbGluZXNbZXZlbnROYW1lXS5wdXNoKHt1cmw6IHVybCwgY2FsbGJhY2s6IGNhbGxiYWNrfSk7XG4gICAgfVxuICAgIC8qKlxuICAgICAqIEV4ZWN1dGVzIHRoZSBIVFRQIHJlcXVlc3QocykgZm9yIHRoZSBnaXZlbiBldmVudCBuYW1lLCBhbmQgcGFzc2VzIHRoZSByZXN1bHRzIHRvIHRoZSBhc3NvY2lhdGVkIGNhbGxiYWNrIGZ1bmN0aW9uLiAgXG4gICAgICogTWV0aG9kIGV4cGVjdHMgcmV0dXJuIHR5cGUgb2YgcmVxdWVzdCB0byBiZSBhIEpTT04gcmVzcG9uc2UuXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IGV2ZW50TmFtZSBcbiAgICAgKi9cbiAgICBhc3luYyBleGVjdXRlKGV2ZW50TmFtZSkge1xuICAgICAgICBmb3IgKGxldCBpdGVtIG9mIHRoaXMuI3BpcGVsaW5lc1tldmVudE5hbWVdKSB7XG4gICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgIGNvbnN0IHJlc3BvbnNlID0gYXdhaXQgZmV0Y2goaXRlbS51cmwsIHsgXG4gICAgICAgICAgICAgICAgICAgIG1ldGhvZDogXCJHRVRcIiwgXG4gICAgICAgICAgICAgICAgICAgIG1vZGU6IFwiY29yc1wiLFxuICAgICAgICAgICAgICAgICAgICBoZWFkZXJzOiB7IEFjY2VwdDogXCJhcHBsaWNhdGlvbi9qc29uXCIgfSBcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICBpZiAocmVzcG9uc2Uub2spIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgZGF0YSA9IGF3YWl0IHJlc3BvbnNlLmpzb24oKTtcblxuICAgICAgICAgICAgICAgICAgICBpdGVtLmNhbGxiYWNrKGRhdGEpO1xuICAgICAgICAgICAgICAgIH0gXG4gICAgICAgICAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgICAgICAgICAgICB3aW5kb3cuYWxlcnQoZXJyLm1lc3NhZ2UpO1xuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKGVyci5tZXNzYWdlKTtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cbn1cblxuZXhwb3J0IHsgRGF0YVBpcGVsaW5lIH07IiwiY2xhc3MgRGF0YUxvYWRlciB7XG4gICAgLyoqXG4gICAgICogQ3JlYXRlIGNsYXNzIHRvIHJldHJpZXZlIGRhdGEgdmlhIGFuIEFqYXggY2FsbC5cbiAgICAgKiBAcGFyYW0ge1NldHRpbmdzR3JpZH0gc2V0dGluZ3MgZ3JpZCBzZXR0aW5ncy5cbiAgICAgKi9cbiAgICBjb25zdHJ1Y3RvcihzZXR0aW5ncykge1xuICAgICAgICB0aGlzLmFqYXhVcmwgPSBzZXR0aW5ncy5hamF4VXJsO1xuICAgIH1cbiAgICAvKioqXG4gICAgICogVXNlcyBpbnB1dCBwYXJhbWV0ZXIncyBrZXkvdmFsdWUgcGFyaXMgdG8gYnVpbGQgYSBmdWxseSBxdWFsaWZpZWQgdXJsIHdpdGggcXVlcnkgc3RyaW5nIHZhbHVlcy5cbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gdXJsIFRhcmdldCB1cmwuXG4gICAgICogQHBhcmFtIHtvYmplY3R9IFtwYXJhbWV0ZXJzPXt9XSBJbnB1dCBwYXJhbWV0ZXJzLlxuICAgICAqIEByZXR1cm5zIHtzdHJpbmd9IEZ1bGx5IHF1YWxpZmllZCB1cmwuXG4gICAgICovXG4gICAgYnVpbGRVcmwodXJsLCBwYXJhbWV0ZXJzID0ge30pIHtcbiAgICAgICAgY29uc3QgcCA9IE9iamVjdC5rZXlzKHBhcmFtZXRlcnMpO1xuICBcbiAgICAgICAgaWYgKHAubGVuZ3RoID09PSAwKSB7XG4gICAgICAgICAgICByZXR1cm4gdXJsO1xuICAgICAgICB9XG5cbiAgICAgICAgbGV0IHJlc3VsdCA9IFtdO1xuXG4gICAgICAgIGZvciAoY29uc3Qga2V5IG9mIHApIHtcbiAgICAgICAgICAgIGlmIChBcnJheS5pc0FycmF5KHBhcmFtZXRlcnNba2V5XSkpIHtcbiAgICAgICAgICAgICAgICBjb25zdCBtdWx0aSA9IHBhcmFtZXRlcnNba2V5XS5tYXAoayA9PiBgJHtrZXl9PSR7ZW5jb2RlVVJJQ29tcG9uZW50KGspfWApO1xuXG4gICAgICAgICAgICAgICAgcmVzdWx0ID0gcmVzdWx0LmNvbmNhdChtdWx0aSk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHJlc3VsdC5wdXNoKGAke2tleX09JHtlbmNvZGVVUklDb21wb25lbnQocGFyYW1ldGVyc1trZXldKX1gKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiB1cmwuaW5kZXhPZihcIj9cIikgIT09IC0xID8gYCR7dXJsfSYke3Jlc3VsdC5qb2luKFwiJlwiKX1gIDogYCR7dXJsfT8ke3Jlc3VsdC5qb2luKFwiJlwiKX1gO1xuICAgIH1cbiAgICAvKipcbiAgICAgKiBNYWtlcyBhbiBBamF4IGNhbGwgdG8gdGFyZ2V0IHJlc291cmNlLCBhbmQgcmV0dXJucyB0aGUgcmVzdWx0cyBhcyBhIEpTT04gYXJyYXkuXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IHVybCB1cmwuXG4gICAgICogQHBhcmFtIHtPYmplY3R9IHBhcmFtZXRlcnMga2V5L3ZhbHVlIHF1ZXJ5IHN0cmluZyBwYWlycy5cbiAgICAgKiBAcmV0dXJucyB7QXJyYXkgfCBPYmplY3R9XG4gICAgICovXG4gICAgYXN5bmMgcmVxdWVzdERhdGEodXJsLCBwYXJhbWV0ZXJzID0ge30pIHtcbiAgICAgICAgbGV0IHJlc3VsdCA9IFtdO1xuICAgICAgICBjb25zdCB0YXJnZXRVcmwgPSB0aGlzLmJ1aWxkVXJsKHVybCwgcGFyYW1ldGVycyk7XG5cbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGNvbnN0IHJlc3BvbnNlID0gYXdhaXQgZmV0Y2godGFyZ2V0VXJsLCB7IFxuICAgICAgICAgICAgICAgIG1ldGhvZDogXCJHRVRcIiwgXG4gICAgICAgICAgICAgICAgbW9kZTogXCJjb3JzXCIsXG4gICAgICAgICAgICAgICAgaGVhZGVyczogeyBBY2NlcHQ6IFwiYXBwbGljYXRpb24vanNvblwiIH0gXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgaWYgKHJlc3BvbnNlLm9rKSB7XG4gICAgICAgICAgICAgICAgcmVzdWx0ID0gYXdhaXQgcmVzcG9uc2UuanNvbigpO1xuICAgICAgICAgICAgfSBcbiAgICAgICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICAgICAgICB3aW5kb3cuYWxlcnQoZXJyLm1lc3NhZ2UpO1xuICAgICAgICAgICAgY29uc29sZS5sb2coZXJyLm1lc3NhZ2UpO1xuICAgICAgICAgICAgcmVzdWx0ID0gW107XG4gICAgICAgIH1cbiAgXG4gICAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgfVxuICAgIC8qKlxuICAgICAqIE1ha2VzIGFuIEFqYXggY2FsbCB0byB0YXJnZXQgcmVzb3VyY2UgaWRlbnRpZmllZCBpbiB0aGUgYGFqYXhVcmxgIFNldHRpbmdzIHByb3BlcnR5LCBhbmQgcmV0dXJucyB0aGUgcmVzdWx0cyBhcyBhIEpTT04gYXJyYXkuXG4gICAgICogQHBhcmFtIHtPYmplY3R9IFtwYXJhbWV0ZXJzPXt9XSBrZXkvdmFsdWUgcXVlcnkgc3RyaW5nIHBhaXJzLlxuICAgICAqIEByZXR1cm5zIHtBcnJheSB8IE9iamVjdH1cbiAgICAgKi9cbiAgICBhc3luYyByZXF1ZXN0R3JpZERhdGEocGFyYW1ldGVycyA9IHt9KSB7XG4gICAgICAgIHJldHVybiB0aGlzLnJlcXVlc3REYXRhKHRoaXMuYWpheFVybCwgcGFyYW1ldGVycyk7XG4gICAgfVxufVxuXG5leHBvcnQgeyBEYXRhTG9hZGVyIH07IiwiLyoqXG4gKiBQcm92aWRlcyBtZXRob2RzIHRvIHN0b3JlIGFuZCBwZXJzaXN0IGRhdGEgZm9yIHRoZSBncmlkLlxuICovXG5jbGFzcyBEYXRhUGVyc2lzdGVuY2Uge1xuICAgIC8qKlxuICAgICAqIENyZWF0ZXMgY2xhc3Mgb2JqZWN0IHRvIHN0b3JlIGFuZCBwZXJzaXN0IGdyaWQgZGF0YS5cbiAgICAgKiBAcGFyYW0ge0FycmF5PE9iamVjdD59IGRhdGEgcm93IGRhdGEuXG4gICAgICovXG4gICAgY29uc3RydWN0b3IoZGF0YSkge1xuICAgICAgICB0aGlzLmRhdGEgPSBkYXRhO1xuICAgICAgICB0aGlzLmRhdGFDYWNoZSA9IGRhdGEubGVuZ3RoID4gMCA/IHN0cnVjdHVyZWRDbG9uZShkYXRhKSA6IFtdO1xuICAgIH1cbiAgICAvKipcbiAgICAgKiBSZXR1cm5zIHRoZSByb3cgZGF0YS5cbiAgICAgKiBAcmV0dXJucyB7bnVtYmVyfSBDb3VudCBvZiByb3dzIGluIHRoZSBkYXRhLlxuICAgICAqL1xuICAgIGdldCByb3dDb3VudCgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuZGF0YS5sZW5ndGg7XG4gICAgfVxuICAgIC8qKlxuICAgICAqIFNhdmVzIHRoZSBkYXRhIHRvIHRoZSBjbGFzcyBvYmplY3QuICBXaWxsIGFsc28gY2FjaGUgYSBjb3B5IG9mIHRoZSBkYXRhIGZvciBsYXRlciByZXN0b3JhdGlvbiBpZiBmaWx0ZXJpbmcgb3Igc29ydGluZyBpcyBhcHBsaWVkLlxuICAgICAqIEBwYXJhbSB7QXJyYXk8b2JqZWN0Pn0gZGF0YSBEYXRhIHNldC5cbiAgICAgKi9cbiAgICBzZXREYXRhID0gKGRhdGEpID0+IHtcbiAgICAgICAgaWYgKCFBcnJheS5pc0FycmF5KGRhdGEpKSB7XG4gICAgICAgICAgICB0aGlzLmRhdGEgPSBbXTtcbiAgICAgICAgICAgIHRoaXMuZGF0YUNhY2hlID0gW107XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLmRhdGEgPSBkYXRhO1xuICAgICAgICB0aGlzLmRhdGFDYWNoZSA9IGRhdGEubGVuZ3RoID4gMCA/IHN0cnVjdHVyZWRDbG9uZShkYXRhKSA6IFtdO1xuICAgIH07XG4gICAgLyoqXG4gICAgICogUmVzZXRzIHRoZSBkYXRhIHRvIHRoZSBvcmlnaW5hbCBzdGF0ZSB3aGVuIHRoZSBjbGFzcyB3YXMgY3JlYXRlZC5cbiAgICAgKi9cbiAgICByZXN0b3JlRGF0YSgpIHtcbiAgICAgICAgdGhpcy5kYXRhID0gc3RydWN0dXJlZENsb25lKHRoaXMuZGF0YUNhY2hlKTtcbiAgICB9XG59XG5cbmV4cG9ydCB7IERhdGFQZXJzaXN0ZW5jZSB9OyIsIi8qKlxuICogQ2xhc3MgdGhhdCBhbGxvd3MgdGhlIHN1YnNjcmlwdGlvbiBhbmQgcHVibGljYXRpb24gb2YgZ3JpZCByZWxhdGVkIGV2ZW50cy5cbiAqIEBjbGFzc1xuICovXG5jbGFzcyBHcmlkRXZlbnRzIHtcbiAgICAjZXZlbnRzO1xuXG4gICAgY29uc3RydWN0b3IoKSB7XG4gICAgICAgIHRoaXMuI2V2ZW50cyA9IHt9O1xuICAgIH1cblxuICAgICNndWFyZChldmVudE5hbWUpIHtcbiAgICAgICAgaWYgKCF0aGlzLiNldmVudHMpIHJldHVybiBmYWxzZTtcblxuICAgICAgICByZXR1cm4gKHRoaXMuI2V2ZW50c1tldmVudE5hbWVdKTtcbiAgICB9XG4gICAgLyoqXG4gICAgICogQWRkcyBhbiBldmVudCB0byBwdWJsaXNoZXIgY29sbGVjdGlvbi5cbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gZXZlbnROYW1lIEV2ZW50IG5hbWUuXG4gICAgICogQHBhcmFtIHtGdW5jdGlvbn0gaGFuZGxlciBDYWxsYmFjayBmdW5jdGlvbi5cbiAgICAgKiBAcGFyYW0ge2Jvb2xlYW59IFtpc0FzeW5jPWZhbHNlXSBUcnVlIGlmIGNhbGxiYWNrIHNob3VsZCBleGVjdXRlIHdpdGggYXdhaXQgb3BlcmF0aW9uLlxuICAgICAqIEBwYXJhbSB7bnVtYmVyfSBbcHJpb3JpdHk9MF0gT3JkZXIgaW4gd2hpY2ggZXZlbnQgc2hvdWxkIGJlIGV4ZWN1dGVkLlxuICAgICAqL1xuICAgIHN1YnNjcmliZShldmVudE5hbWUsIGhhbmRsZXIsIGlzQXN5bmMgPSBmYWxzZSwgcHJpb3JpdHkgPSAwKSB7XG4gICAgICAgIGlmICghdGhpcy4jZXZlbnRzW2V2ZW50TmFtZV0pIHtcbiAgICAgICAgICAgIHRoaXMuI2V2ZW50c1tldmVudE5hbWVdID0gW3sgaGFuZGxlciwgcHJpb3JpdHksIGlzQXN5bmMgfV07XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIHRoaXMuI2V2ZW50c1tldmVudE5hbWVdLnB1c2goeyBoYW5kbGVyLCBwcmlvcml0eSwgaXNBc3luYyB9KTtcbiAgICAgICAgdGhpcy4jZXZlbnRzW2V2ZW50TmFtZV0uc29ydCgoYSwgYikgPT4ge1xuICAgICAgICAgICAgcmV0dXJuIGEucHJpb3JpdHkgLSBiLnByaW9yaXR5O1xuICAgICAgICB9KTtcbiAgICB9XG4gICAgLyoqXG4gICAgICogUmVtb3ZlcyB0aGUgdGFyZ2V0IGV2ZW50IGZyb20gdGhlIHB1YmxpY2F0aW9uIGNoYWluLlxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBldmVudE5hbWUgRXZlbnQgbmFtZS5cbiAgICAgKiBAcGFyYW0ge0Z1bmN0aW9ufSBoYW5kbGVyIEV2ZW50IGhhbmRsZXIuXG4gICAgICovXG4gICAgdW5zdWJzY3JpYmUoZXZlbnROYW1lLCBoYW5kbGVyKSB7XG4gICAgICAgIGlmICghdGhpcy4jZ3VhcmQoZXZlbnROYW1lKSkgcmV0dXJuO1xuXG4gICAgICAgIHRoaXMuI2V2ZW50c1tldmVudE5hbWVdID0gdGhpcy4jZXZlbnRzW2V2ZW50TmFtZV0uZmlsdGVyKGggPT4gaCAhPT0gaGFuZGxlcik7XG4gICAgfVxuICAgIC8qKlxuICAgICAqIFRha2VzIHRoZSByZXN1bHQgb2YgZWFjaCBzdWJzY3JpYmVyJ3MgY2FsbGJhY2sgZnVuY3Rpb24gYW5kIGNoYWlucyB0aGVtIGludG8gb25lIHJlc3VsdC5cbiAgICAgKiBVc2VkIHRvIGNyZWF0ZSBhIGxpc3Qgb2YgcGFyYW1ldGVycyBmcm9tIG11bHRpcGxlIG1vZHVsZXM6IGkuZS4gc29ydCwgZmlsdGVyLCBhbmQgcGFnaW5nIGlucHV0cy5cbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gZXZlbnROYW1lIGV2ZW50IG5hbWVcbiAgICAgKiBAcGFyYW0ge09iamVjdH0gW2luaXRpYWxWYWx1ZT17fV0gaW5pdGlhbCB2YWx1ZVxuICAgICAqIEByZXR1cm5zIHtPYmplY3R9XG4gICAgICovXG4gICAgY2hhaW4oZXZlbnROYW1lLCBpbml0aWFsVmFsdWUgPSB7fSkge1xuICAgICAgICBpZiAoIXRoaXMuI2d1YXJkKGV2ZW50TmFtZSkpIHJldHVybjtcblxuICAgICAgICBsZXQgcmVzdWx0ID0gaW5pdGlhbFZhbHVlO1xuXG4gICAgICAgIHRoaXMuI2V2ZW50c1tldmVudE5hbWVdLmZvckVhY2goKGgpID0+IHtcbiAgICAgICAgICAgIHJlc3VsdCA9IGguaGFuZGxlcihyZXN1bHQpO1xuICAgICAgICB9KTtcblxuICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgIH1cbiAgICAvKipcbiAgICAgKiBUcmlnZ2VyIGNhbGxiYWNrIGZ1bmN0aW9uIGZvciBzdWJzY3JpYmVycyBvZiB0aGUgYGV2ZW50TmFtZWAuXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IGV2ZW50TmFtZSBFdmVudCBuYW1lLlxuICAgICAqIEBwYXJhbSAgey4uLmFueX0gYXJncyBBcmd1bWVudHMuXG4gICAgICovXG4gICAgYXN5bmMgdHJpZ2dlcihldmVudE5hbWUsIC4uLmFyZ3MpIHtcbiAgICAgICAgaWYgKCF0aGlzLiNndWFyZChldmVudE5hbWUpKSByZXR1cm47XG5cbiAgICAgICAgZm9yIChsZXQgaCBvZiB0aGlzLiNldmVudHNbZXZlbnROYW1lXSkge1xuICAgICAgICAgICAgaWYgKGguaXNBc3luYykge1xuICAgICAgICAgICAgICAgIGF3YWl0IGguaGFuZGxlciguLi5hcmdzKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgaC5oYW5kbGVyKC4uLmFyZ3MpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxufVxuXG5leHBvcnQgeyBHcmlkRXZlbnRzIH07IiwiY2xhc3MgRGF0ZUhlbHBlciB7XG4gICAgc3RhdGljIHRpbWVSZUdleCA9IG5ldyBSZWdFeHAoXCJbMC05XTpbMC05XVwiKTtcbiAgICAvKipcbiAgICAgKiBDb252ZXJ0IHN0cmluZyB0byBEYXRlIG9iamVjdCB0eXBlLiAgRXhwZWN0cyBzdHJpbmcgZm9ybWF0IG9mIHllYXItbW9udGgtZGF5LlxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSB2YWx1ZSBTdHJpbmcgZGF0ZSB3aXRoIGZvcm1hdCBvZiB5ZWFyLW1vbnRoLWRheS5cbiAgICAgKiBAcmV0dXJucyB7RGF0ZSB8IHN0cmluZ30gRGF0ZSBpZiBjb252ZXJzaW9uIGlzIHN1Y2Nlc3NmdWwuICBPdGhlcndpc2UsIGVtcHR5IHN0cmluZy5cbiAgICAgKi9cbiAgICBzdGF0aWMgcGFyc2VEYXRlKHZhbHVlKSB7XG4gICAgICAgIC8vQ2hlY2sgaWYgc3RyaW5nIGlzIGRhdGUgb25seSBieSBsb29raW5nIGZvciBtaXNzaW5nIHRpbWUgY29tcG9uZW50LiAgXG4gICAgICAgIC8vSWYgbWlzc2luZywgYWRkIGl0IHNvIGRhdGUgaXMgaW50ZXJwcmV0ZWQgYXMgbG9jYWwgdGltZS5cbiAgICAgICAgaWYgKCF0aGlzLnRpbWVSZUdleC50ZXN0KHZhbHVlKSkge1xuICAgICAgICAgICAgdmFsdWUgPSBgJHt2YWx1ZX1UMDA6MDBgO1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc3QgZGF0ZSA9IG5ldyBEYXRlKHZhbHVlKTtcbiAgICAgICAgXG4gICAgICAgIHJldHVybiAoTnVtYmVyLmlzTmFOKGRhdGUudmFsdWVPZigpKSkgPyBcIlwiIDogZGF0ZTtcbiAgICB9XG4gICAgLyoqXG4gICAgICogQ29udmVydCBzdHJpbmcgdG8gRGF0ZSBvYmplY3QgdHlwZSwgc2V0dGluZyB0aGUgdGltZSBjb21wb25lbnQgdG8gbWlkbmlnaHQuICBFeHBlY3RzIHN0cmluZyBmb3JtYXQgb2YgeWVhci1tb250aC1kYXkuXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IHZhbHVlIFN0cmluZyBkYXRlIHdpdGggZm9ybWF0IG9mIHllYXItbW9udGgtZGF5LlxuICAgICAqIEByZXR1cm5zIHtEYXRlIHwgc3RyaW5nfSBEYXRlIGlmIGNvbnZlcnNpb24gaXMgc3VjY2Vzc2Z1bC4gIE90aGVyd2lzZSwgZW1wdHkgc3RyaW5nLlxuICAgICAqL1xuICAgIHN0YXRpYyBwYXJzZURhdGVPbmx5KHZhbHVlKSB7XG4gICAgICAgIGNvbnN0IGRhdGUgPSB0aGlzLnBhcnNlRGF0ZSh2YWx1ZSk7XG5cbiAgICAgICAgaWYgKGRhdGUgPT09IFwiXCIpIHJldHVybiBcIlwiOyAgLy9JbnZhbGlkIGRhdGUuXG5cbiAgICAgICAgZGF0ZS5zZXRIb3VycygwLCAwLCAwLCAwKTsgLy9TZXQgdGltZSB0byBtaWRuaWdodCB0byByZW1vdmUgdGltZSBjb21wb25lbnQuXG5cbiAgICAgICAgcmV0dXJuIGRhdGU7XG4gICAgfVxuXG4gICAgc3RhdGljIGlzRGF0ZSh2YWx1ZSkgeyBcbiAgICAgICAgcmV0dXJuIE9iamVjdC5wcm90b3R5cGUudG9TdHJpbmcuY2FsbCh2YWx1ZSkgPT09IFwiW29iamVjdCBEYXRlXVwiO1xuXG4gICAgfVxuXG59XG5cbmV4cG9ydCB7IERhdGVIZWxwZXIgfTsiLCJpbXBvcnQgeyBEYXRlSGVscGVyIH0gZnJvbSBcIi4uLy4uL2hlbHBlcnMvZGF0ZUhlbHBlci5qc1wiO1xuLyoqXG4gKiBQcm92aWRlcyBtZXRob2RzIHRvIGZvcm1hdCBkYXRlIGFuZCB0aW1lIHN0cmluZ3MuICBFeHBlY3RzIGRhdGUgc3RyaW5nIGluIGZvcm1hdCBvZiB5ZWFyLW1vbnRoLWRheS5cbiAqL1xuY2xhc3MgRm9ybWF0RGF0ZVRpbWUge1xuICAgIHN0YXRpYyBtb250aHNMb25nID0gW1wiSmFudWFyeVwiLCBcIkZlYnJ1YXJ5XCIsIFwiTWFyY2hcIiwgXCJBcHJpbFwiLCBcIk1heVwiLCBcIkp1bmVcIiwgXCJKdWx5XCIsIFwiQXVndXN0XCIsIFwiU2VwdGVtYmVyXCIsIFwiT2N0b2JlclwiLCBcIk5vdmVtYmVyXCIsIFwiRGVjZW1iZXJcIl07XG4gICAgc3RhdGljIG1vbnRoc1Nob3J0ID0gW1wiSmFuXCIsIFwiRmViXCIsIFwiTWFyXCIsIFwiQXByXCIsIFwiTWF5XCIsIFwiSnVuXCIsIFwiSnVsXCIsIFwiQXVnXCIsIFwiU2VwXCIsIFwiT2N0XCIsIFwiTm92XCIsIFwiRGVjXCJdO1xuXG4gICAgc3RhdGljIGxlYWRpbmdaZXJvKG51bSkge1xuICAgICAgICByZXR1cm4gbnVtIDwgMTAgPyBcIjBcIiArIG51bSA6IG51bTtcbiAgICB9XG4gICAgLyoqXG4gICAgICogUmV0dXJucyBhIGZvcm1hdHRlZCBkYXRlIHRpbWUgc3RyaW5nLiAgRXhwZWN0cyBkYXRlIHN0cmluZyBpbiBmb3JtYXQgb2YgeWVhci1tb250aC1kYXkuICBJZiBgZm9ybWF0dGVyUGFyYW1zYCBpcyBlbXB0eSwgXG4gICAgICogZnVuY3Rpb24gd2lsbCByZXZlcnQgdG8gZGVmYXVsdCB2YWx1ZXMuIEV4cGVjdGVkIHByb3BlcnR5IHZhbHVlcyBpbiBgZm9ybWF0dGVyUGFyYW1zYCBvYmplY3Q6XG4gICAgICogLSBkYXRlRmllbGQ6IGZpZWxkIHRvIGNvbnZlcnQgZGF0ZSB0aW1lLlxuICAgICAqIC0gZm9ybWF0OiBzdHJpbmcgZm9ybWF0IHRlbXBsYXRlLlxuICAgICAqIEBwYXJhbSB7T2JqZWN0fSByb3dEYXRhIFJvdyBkYXRhLlxuICAgICAqIEBwYXJhbSB7Q29sdW1ufSBjb2x1bW4gQ29sdW1uIGNsYXNzIG9iamVjdC5cbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gZGVmYXVsdEZvcm1hdCBEZWZhdWx0IHN0cmluZyBmb3JtYXQ6IE1NL2RkL3l5eXlcbiAgICAgKiBAcGFyYW0ge2Jvb2xlYW59IFthZGRUaW1lPWZhbHNlXSBBcHBseSBkYXRlIHRpbWUgZm9ybWF0dGluZz9cbiAgICAgKiBAcmV0dXJucyB7c3RyaW5nfVxuICAgICAqL1xuICAgIHN0YXRpYyBhcHBseShyb3dEYXRhLCBjb2x1bW4sIGRlZmF1bHRGb3JtYXQgPSBcIk1NL2RkL3l5eXlcIiwgYWRkVGltZSA9IGZhbHNlKSB7XG4gICAgICAgIGxldCByZXN1bHQgPSBjb2x1bW4/LmZvcm1hdHRlclBhcmFtcz8uZm9ybWF0ID8/IGRlZmF1bHRGb3JtYXQ7XG4gICAgICAgIGxldCBmaWVsZCA9IGNvbHVtbj8uZm9ybWF0dGVyUGFyYW1zPy5kYXRlRmllbGQgXG4gICAgICAgICAgICA/IHJvd0RhdGFbY29sdW1uLmZvcm1hdHRlclBhcmFtcy5kYXRlRmllbGRdXG4gICAgICAgICAgICA6IHJvd0RhdGFbY29sdW1uLmZpZWxkXTtcblxuICAgICAgICBpZiAoZmllbGQgPT09IG51bGwpIHtcbiAgICAgICAgICAgIHJldHVybiBcIlwiO1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc3QgZGF0ZSA9IERhdGVIZWxwZXIucGFyc2VEYXRlKGZpZWxkKTtcblxuICAgICAgICBpZiAoZGF0ZSA9PT0gXCJcIikge1xuICAgICAgICAgICAgcmV0dXJuIFwiXCI7XG4gICAgICAgIH1cblxuICAgICAgICBsZXQgZm9ybWF0cyA9IHtcbiAgICAgICAgICAgIGQ6IGRhdGUuZ2V0RGF0ZSgpLFxuICAgICAgICAgICAgZGQ6IHRoaXMubGVhZGluZ1plcm8oZGF0ZS5nZXREYXRlKCkpLFxuXG4gICAgICAgICAgICBNOiBkYXRlLmdldE1vbnRoKCkgKyAxLFxuICAgICAgICAgICAgTU06IHRoaXMubGVhZGluZ1plcm8oZGF0ZS5nZXRNb250aCgpICsgMSksXG4gICAgICAgICAgICBNTU06IHRoaXMubW9udGhzU2hvcnRbZGF0ZS5nZXRNb250aCgpXSxcbiAgICAgICAgICAgIE1NTU06IHRoaXMubW9udGhzTG9uZ1tkYXRlLmdldE1vbnRoKCldLFxuXG4gICAgICAgICAgICB5eTogZGF0ZS5nZXRGdWxsWWVhcigpLnRvU3RyaW5nKCkuc2xpY2UoLTIpLFxuICAgICAgICAgICAgeXl5eTogZGF0ZS5nZXRGdWxsWWVhcigpXG4gICAgICAgIH07XG5cbiAgICAgICAgaWYgKGFkZFRpbWUpIHtcbiAgICAgICAgICAgIGxldCBob3VycyA9IGRhdGUuZ2V0SG91cnMoKTtcbiAgICAgICAgICAgIGxldCBob3VyczEyID0gaG91cnMgJSAxMiA9PT0gMCA/IDEyIDogaG91cnMgJSAxMjtcblxuICAgICAgICAgICAgZm9ybWF0cy5zID0gZGF0ZS5nZXRTZWNvbmRzKCk7XG4gICAgICAgICAgICBmb3JtYXRzLnNzID0gdGhpcy5sZWFkaW5nWmVybyhkYXRlLmdldFNlY29uZHMoKSk7XG4gICAgICAgICAgICBmb3JtYXRzLm0gPSBkYXRlLmdldE1pbnV0ZXMoKTtcbiAgICAgICAgICAgIGZvcm1hdHMubW0gPSB0aGlzLmxlYWRpbmdaZXJvKGRhdGUuZ2V0TWludXRlcygpKTtcbiAgICAgICAgICAgIGZvcm1hdHMuaCA9IGhvdXJzMTI7XG4gICAgICAgICAgICBmb3JtYXRzLmhoID0gIHRoaXMubGVhZGluZ1plcm8oaG91cnMxMik7XG4gICAgICAgICAgICBmb3JtYXRzLkggPSBob3VycztcbiAgICAgICAgICAgIGZvcm1hdHMuSEggPSB0aGlzLmxlYWRpbmdaZXJvKGhvdXJzKTtcbiAgICAgICAgICAgIGZvcm1hdHMuaHAgPSBob3VycyA8IDEyID8gXCJBTVwiIDogXCJQTVwiO1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc3QgdGFyZ2V0cyA9IHJlc3VsdC5zcGxpdCgvXFwvfC18XFxzfDovKTtcblxuICAgICAgICBmb3IgKGxldCBpdGVtIG9mIHRhcmdldHMpIHtcbiAgICAgICAgICAgIHJlc3VsdCA9IHJlc3VsdC5yZXBsYWNlKGl0ZW0sIGZvcm1hdHNbaXRlbV0pO1xuICAgICAgICB9XG4gICAgXG4gICAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgfVxufVxuXG5leHBvcnQgeyBGb3JtYXREYXRlVGltZSB9OyIsIi8qKlxuICogUHJvdmlkZXMgbWV0aG9kIHRvIGZvcm1hdCBhIGxpbmsgYXMgYW4gYW5jaG9yIHRhZyBlbGVtZW50LlxuICovXG5jbGFzcyBGb3JtYXRMaW5rIHtcbiAgICAvKipcbiAgICAgKiBGb3JtYXR0ZXIgdGhhdCBjcmVhdGUgYW4gYW5jaG9yIHRhZyBlbGVtZW50LiBocmVmIGFuZCBvdGhlciBhdHRyaWJ1dGVzIGNhbiBiZSBtb2RpZmllZCB3aXRoIHByb3BlcnRpZXMgaW4gdGhlIFxuICAgICAqICdmb3JtYXR0ZXJQYXJhbXMnIHBhcmFtZXRlci4gIEV4cGVjdGVkIHByb3BlcnR5IHZhbHVlczogXG4gICAgICogLSB1cmxQcmVmaXg6IEJhc2UgdXJsIGFkZHJlc3MuXG4gICAgICogLSByb3V0ZUZpZWxkOiBSb3V0ZSB2YWx1ZS5cbiAgICAgKiAtIHF1ZXJ5RmllbGQ6IEZpZWxkIG5hbWUgZnJvbSBkYXRhc2V0IHRvIGJ1aWxkIHF1ZXJ5IHN0aW5nIGtleS92YWx1ZSBpbnB1dC5cbiAgICAgKiAtIGZpZWxkVGV4dDogVXNlIGZpZWxkIG5hbWUgdG8gc2V0IGlubmVyIHRleHQgdG8gYXNzb2NpYXRlZCBkYXRhc2V0IHZhbHVlLlxuICAgICAqIC0gaW5uZXJUZXh0OiBSYXcgaW5uZXIgdGV4dCB2YWx1ZSBvciBmdW5jdGlvbi4gIElmIGZ1bmN0aW9uIGlzIHByb3ZpZGVkLCBpdCB3aWxsIGJlIGNhbGxlZCB3aXRoIHJvd0RhdGEgYW5kIGZvcm1hdHRlclBhcmFtcyBhcyBwYXJhbWV0ZXJzLlxuICAgICAqIC0gdGFyZ2V0OiBIb3cgdGFyZ2V0IGRvY3VtZW50IHNob3VsZCBiZSBvcGVuZWQuXG4gICAgICogQHBhcmFtIHtPYmplY3R9IHJvd0RhdGEgUm93IGRhdGEuXG4gICAgICogQHBhcmFtIHt7IHVybFByZWZpeDogc3RyaW5nLCBxdWVyeUZpZWxkOiBzdHJpbmcsIGZpZWxkVGV4dDogc3RyaW5nLCBpbm5lclRleHQ6IHN0cmluZyB8IEZ1bmN0aW9uLCB0YXJnZXQ6IHN0cmluZyB9fSBmb3JtYXR0ZXJQYXJhbXMgU2V0dGluZ3MuXG4gICAgICogQHJldHVybiB7SFRNTEFuY2hvckVsZW1lbnR9IGFuY2hvciB0YWcgZWxlbWVudC5cbiAgICAgKiAqL1xuICAgIHN0YXRpYyBhcHBseShyb3dEYXRhLCBmb3JtYXR0ZXJQYXJhbXMpIHtcbiAgICAgICAgY29uc3QgZWwgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiYVwiKTtcblxuICAgICAgICBsZXQgdXJsID0gZm9ybWF0dGVyUGFyYW1zLnVybFByZWZpeDtcbiAgICAgICAgLy9BcHBseSByb3V0ZSB2YWx1ZSBiZWZvcmUgcXVlcnkgc3RyaW5nLlxuICAgICAgICBpZiAoZm9ybWF0dGVyUGFyYW1zLnJvdXRlRmllbGQpIHtcbiAgICAgICAgICAgIHVybCArPSBcIi9cIiArIGVuY29kZVVSSUNvbXBvbmVudChyb3dEYXRhW2Zvcm1hdHRlclBhcmFtcy5yb3V0ZUZpZWxkXSk7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoZm9ybWF0dGVyUGFyYW1zLnF1ZXJ5RmllbGQpIHtcbiAgICAgICAgICAgIGNvbnN0IHFyeVZhbHVlID0gZW5jb2RlVVJJQ29tcG9uZW50KHJvd0RhdGFbZm9ybWF0dGVyUGFyYW1zLnF1ZXJ5RmllbGRdKTtcblxuICAgICAgICAgICAgdXJsID0gYCR7dXJsfT8ke2Zvcm1hdHRlclBhcmFtcy5xdWVyeUZpZWxkfT0ke3FyeVZhbHVlfWA7XG4gICAgICAgIH1cblxuICAgICAgICBlbC5ocmVmID0gdXJsO1xuXG4gICAgICAgIGlmIChmb3JtYXR0ZXJQYXJhbXMuZmllbGRUZXh0KSB7XG4gICAgICAgICAgICBlbC5pbm5lckhUTUwgPSByb3dEYXRhW2Zvcm1hdHRlclBhcmFtcy5maWVsZFRleHRdO1xuICAgICAgICB9IGVsc2UgaWYgKCh0eXBlb2YgZm9ybWF0dGVyUGFyYW1zLmlubmVyVGV4dCA9PT0gXCJmdW5jdGlvblwiKSkge1xuICAgICAgICAgICAgZWwuaW5uZXJIVE1MID0gZm9ybWF0dGVyUGFyYW1zLmlubmVyVGV4dChyb3dEYXRhLCBmb3JtYXR0ZXJQYXJhbXMpO1xuICAgICAgICB9IGVsc2UgaWYgKGZvcm1hdHRlclBhcmFtcy5pbm5lclRleHQpIHtcbiAgICAgICAgICAgIGVsLmlubmVySFRNTCA9IGZvcm1hdHRlclBhcmFtcy5pbm5lclRleHQ7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoZm9ybWF0dGVyUGFyYW1zLnRhcmdldCkge1xuICAgICAgICAgICAgZWwuc2V0QXR0cmlidXRlKFwidGFyZ2V0XCIsIGZvcm1hdHRlclBhcmFtcy50YXJnZXQpO1xuICAgICAgICAgICAgZWwuc2V0QXR0cmlidXRlKFwicmVsXCIsIFwibm9vcGVuZXJcIik7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gZWw7XG4gICAgfVxufVxuXG5leHBvcnQgeyBGb3JtYXRMaW5rIH07IiwiLyoqXG4gKiBQcm92aWRlcyBtZXRob2QgdG8gZm9ybWF0IG51bWVyaWMgdmFsdWVzIGludG8gc3RyaW5ncyB3aXRoIHNwZWNpZmllZCBzdHlsZXMgb2YgZGVjaW1hbCwgY3VycmVuY3ksIG9yIHBlcmNlbnQuXG4gKi9cbmNsYXNzIEZvcm1hdE51bWVyaWMge1xuICAgIHN0YXRpYyB2YWxpZFN0eWxlcyA9IFtcImRlY2ltYWxcIiwgXCJjdXJyZW5jeVwiLCBcInBlcmNlbnRcIl07XG4gICAgLyoqXG4gICAgICogUmV0dXJucyBhIGZvcm1hdHRlZCBudW1lcmljIHN0cmluZy4gIEV4cGVjdGVkIHByb3BlcnR5IHZhbHVlczogXG4gICAgICogLSBwcmVjaXNpb246IHJvdW5kaW5nIHByZWNpc2lvbi5cbiAgICAgKiAtIHN0eWxlOiBmb3JtYXR0aW5nIHN0eWxlIHRvIHVzZS5cbiAgICAgKiBAcGFyYW0ge09iamVjdH0gcm93RGF0YSBSb3cgZGF0YS5cbiAgICAgKiBAcGFyYW0ge0NvbHVtbn0gY29sdW1uIENvbHVtbiBjbGFzcyBvYmplY3QuXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IFtzdHlsZT1cImRlY2ltYWxcIl0gRm9ybWF0dGluZyBzdHlsZSB0byB1c2UuIERlZmF1bHQgaXMgXCJkZWNpbWFsXCIuXG4gICAgICogQHBhcmFtIHtudW1iZXJ9IFtwcmVjaXNpb249Ml0gUm91bmRpbmcgcHJlY2lzaW9uLiBEZWZhdWx0IGlzIDIuXG4gICAgICogQHJldHVybnMge3N0cmluZ31cbiAgICAgKi9cbiAgICBzdGF0aWMgYXBwbHkocm93RGF0YSwgY29sdW1uLCBzdHlsZSA9IFwiZGVjaW1hbFwiLCBwcmVjaXNpb24gPSAyKSB7XG4gICAgICAgIGNvbnN0IGZsb2F0VmFsID0gcm93RGF0YVtjb2x1bW4uZmllbGRdO1xuXG4gICAgICAgIGlmIChpc05hTihmbG9hdFZhbCkpIHJldHVybiBmbG9hdFZhbDtcblxuICAgICAgICBpZiAoIXRoaXMudmFsaWRTdHlsZXMuaW5jbHVkZXMoc3R5bGUpKSB7XG4gICAgICAgICAgICBzdHlsZSA9IFwiZGVjaW1hbFwiO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIG5ldyBJbnRsLk51bWJlckZvcm1hdChcImVuLVVTXCIsIHtcbiAgICAgICAgICAgIHN0eWxlOiBzdHlsZSxcbiAgICAgICAgICAgIG1heGltdW1GcmFjdGlvbkRpZ2l0czogcHJlY2lzaW9uLFxuICAgICAgICAgICAgY3VycmVuY3k6IFwiVVNEXCJcbiAgICAgICAgfSkuZm9ybWF0KGZsb2F0VmFsKTtcbiAgICB9XG59XG5cbmV4cG9ydCB7IEZvcm1hdE51bWVyaWMgfTsiLCJjbGFzcyBGb3JtYXRTdGFyIHtcbiAgICAvKipcbiAgICAgKiBSZXR1cm5zIGFuIGVsZW1lbnQgb2Ygc3RhciByYXRpbmdzIGJhc2VkIG9uIGludGVnZXIgdmFsdWVzLiAgRXhwZWN0ZWQgcHJvcGVydHkgdmFsdWVzOiBcbiAgICAgKiAtIHN0YXJzOiBudW1iZXIgb2Ygc3RhcnMgdG8gZGlzcGxheS5cbiAgICAgKiBAcGFyYW0ge09iamVjdH0gcm93RGF0YSByb3cgZGF0YS5cbiAgICAgKiBAcGFyYW0ge0NvbHVtbn0gY29sdW1uIGNvbHVtbiBjbGFzcyBvYmplY3QuXG4gICAgICogQHJldHVybnMge0hUTUxEaXZFbGVtZW50fVxuICAgICAqL1xuICAgIHN0YXRpYyBhcHBseShyb3dEYXRhLCBjb2x1bW4pIHtcbiAgICAgICAgbGV0IHZhbHVlID0gcm93RGF0YVtjb2x1bW4uZmllbGRdO1xuICAgICAgICBjb25zdCBtYXhTdGFycyA9IGNvbHVtbi5mb3JtYXR0ZXJQYXJhbXM/LnN0YXJzID8gY29sdW1uLmZvcm1hdHRlclBhcmFtcy5zdGFycyA6IDU7XG4gICAgICAgIGNvbnN0IGNvbnRhaW5lciA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJkaXZcIik7XG4gICAgICAgIGNvbnN0IHN0YXJzID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcInNwYW5cIik7XG4gICAgICAgIGNvbnN0IHN0YXIgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50TlMoXCJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2Z1wiLCBcInN2Z1wiKTtcbiAgICAgICAgY29uc3Qgc3RhckFjdGl2ZSA9ICc8cG9seWdvbiBmaWxsPVwiI0ZGRUEwMFwiIHN0cm9rZT1cIiNDMUFCNjBcIiBzdHJva2Utd2lkdGg9XCIzNy42MTUyXCIgc3Ryb2tlLWxpbmVjYXA9XCJyb3VuZFwiIHN0cm9rZS1saW5lam9pbj1cInJvdW5kXCIgc3Ryb2tlLW1pdGVybGltaXQ9XCIxMFwiIHBvaW50cz1cIjI1OS4yMTYsMjkuOTQyIDMzMC4yNywxNzMuOTE5IDQ4OS4xNiwxOTcuMDA3IDM3NC4xODUsMzA5LjA4IDQwMS4zMyw0NjcuMzEgMjU5LjIxNiwzOTIuNjEyIDExNy4xMDQsNDY3LjMxIDE0NC4yNSwzMDkuMDggMjkuMjc0LDE5Ny4wMDcgMTg4LjE2NSwxNzMuOTE5IFwiLz4nO1xuICAgICAgICBjb25zdCBzdGFySW5hY3RpdmUgPSAnPHBvbHlnb24gZmlsbD1cIiNEMkQyRDJcIiBzdHJva2U9XCIjNjg2ODY4XCIgc3Ryb2tlLXdpZHRoPVwiMzcuNjE1MlwiIHN0cm9rZS1saW5lY2FwPVwicm91bmRcIiBzdHJva2UtbGluZWpvaW49XCJyb3VuZFwiIHN0cm9rZS1taXRlcmxpbWl0PVwiMTBcIiBwb2ludHM9XCIyNTkuMjE2LDI5Ljk0MiAzMzAuMjcsMTczLjkxOSA0ODkuMTYsMTk3LjAwNyAzNzQuMTg1LDMwOS4wOCA0MDEuMzMsNDY3LjMxIDI1OS4yMTYsMzkyLjYxMiAxMTcuMTA0LDQ2Ny4zMSAxNDQuMjUsMzA5LjA4IDI5LjI3NCwxOTcuMDA3IDE4OC4xNjUsMTczLjkxOSBcIi8+JztcblxuICAgICAgICAvL3N0eWxlIHN0YXJzIGhvbGRlclxuICAgICAgICBzdGFycy5zdHlsZS52ZXJ0aWNhbEFsaWduID0gXCJtaWRkbGVcIjtcbiAgICAgICAgLy9zdHlsZSBzdGFyXG4gICAgICAgIHN0YXIuc2V0QXR0cmlidXRlKFwid2lkdGhcIiwgXCIxNFwiKTtcbiAgICAgICAgc3Rhci5zZXRBdHRyaWJ1dGUoXCJoZWlnaHRcIiwgXCIxNFwiKTtcbiAgICAgICAgc3Rhci5zZXRBdHRyaWJ1dGUoXCJ2aWV3Qm94XCIsIFwiMCAwIDUxMiA1MTJcIik7XG4gICAgICAgIHN0YXIuc2V0QXR0cmlidXRlKFwieG1sOnNwYWNlXCIsIFwicHJlc2VydmVcIik7XG4gICAgICAgIHN0YXIuc3R5bGUucGFkZGluZyA9IFwiMCAxcHhcIjtcblxuICAgICAgICB2YWx1ZSA9IHZhbHVlICYmICFpc05hTih2YWx1ZSkgPyBwYXJzZUludCh2YWx1ZSkgOiAwO1xuICAgICAgICB2YWx1ZSA9IE1hdGgubWF4KDAsIE1hdGgubWluKHZhbHVlLCBtYXhTdGFycykpO1xuXG4gICAgICAgIGZvcihsZXQgaSA9IDE7IGkgPD0gbWF4U3RhcnM7IGkrKyl7XG4gICAgICAgICAgICBjb25zdCBuZXh0U3RhciA9IHN0YXIuY2xvbmVOb2RlKHRydWUpO1xuXG4gICAgICAgICAgICBuZXh0U3Rhci5pbm5lckhUTUwgPSBpIDw9IHZhbHVlID8gc3RhckFjdGl2ZSA6IHN0YXJJbmFjdGl2ZTtcblxuICAgICAgICAgICAgc3RhcnMuYXBwZW5kQ2hpbGQobmV4dFN0YXIpO1xuICAgICAgICB9XG5cbiAgICAgICAgY29udGFpbmVyLnN0eWxlLndoaXRlU3BhY2UgPSBcIm5vd3JhcFwiO1xuICAgICAgICBjb250YWluZXIuc3R5bGUub3ZlcmZsb3cgPSBcImhpZGRlblwiO1xuICAgICAgICBjb250YWluZXIuc3R5bGUudGV4dE92ZXJmbG93ID0gXCJlbGxpcHNpc1wiO1xuICAgICAgICBjb250YWluZXIuc2V0QXR0cmlidXRlKFwiYXJpYS1sYWJlbFwiLCB2YWx1ZSk7XG4gICAgICAgIGNvbnRhaW5lci5hcHBlbmQoc3RhcnMpO1xuXG4gICAgICAgIHJldHVybiBjb250YWluZXI7XG4gICAgfVxufVxuXG5leHBvcnQgeyBGb3JtYXRTdGFyIH07IiwiZXhwb3J0IGNvbnN0IGNzc0hlbHBlciA9IHtcbiAgICB0b29sdGlwOiBcImRhdGFncmlkcy10b29sdGlwXCIsXG4gICAgbXVsdGlTZWxlY3Q6IHtcbiAgICAgICAgcGFyZW50Q2xhc3M6IFwiZGF0YWdyaWRzLW11bHRpLXNlbGVjdFwiLFxuICAgICAgICBoZWFkZXI6IFwiZGF0YWdyaWRzLW11bHRpLXNlbGVjdC1oZWFkZXJcIixcbiAgICAgICAgaGVhZGVyQWN0aXZlOiBcImRhdGFncmlkcy1tdWx0aS1zZWxlY3QtaGVhZGVyLWFjdGl2ZVwiLFxuICAgICAgICBoZWFkZXJPcHRpb246IFwiZGF0YWdyaWRzLW11bHRpLXNlbGVjdC1oZWFkZXItb3B0aW9uXCIsXG4gICAgICAgIG9wdGlvbnM6IFwiZGF0YWdyaWRzLW11bHRpLXNlbGVjdC1vcHRpb25zXCIsXG4gICAgICAgIG9wdGlvbjogXCJkYXRhZ3JpZHMtbXVsdGktc2VsZWN0LW9wdGlvblwiLFxuICAgICAgICBvcHRpb25UZXh0OiBcImRhdGFncmlkcy1tdWx0aS1zZWxlY3Qtb3B0aW9uLXRleHRcIixcbiAgICAgICAgb3B0aW9uUmFkaW86IFwiZGF0YWdyaWRzLW11bHRpLXNlbGVjdC1vcHRpb24tcmFkaW9cIixcbiAgICAgICAgc2VsZWN0ZWQ6IFwiZGF0YWdyaWRzLW11bHRpLXNlbGVjdC1zZWxlY3RlZFwiXG4gICAgfSxcbiAgICBpbnB1dDogXCJkYXRhZ3JpZHMtaW5wdXRcIixcbiAgICBiZXR3ZWVuQnV0dG9uOiBcImRhdGFncmlkcy1iZXR3ZWVuLWJ1dHRvblwiLFxuICAgIGJldHdlZW5MYWJlbDogXCJkYXRhZ3JpZHMtYmV0d2Vlbi1pbnB1dC1sYWJlbFwiLFxufTsiLCJpbXBvcnQgeyBGb3JtYXREYXRlVGltZSB9IGZyb20gXCIuL2Zvcm1hdHRlcnMvZGF0ZXRpbWUuanNcIjtcbmltcG9ydCB7IEZvcm1hdExpbmsgfSBmcm9tIFwiLi9mb3JtYXR0ZXJzL2xpbmsuanNcIjtcbmltcG9ydCB7IEZvcm1hdE51bWVyaWMgfSBmcm9tIFwiLi9mb3JtYXR0ZXJzL251bWVyaWMuanNcIjtcbmltcG9ydCB7IEZvcm1hdFN0YXIgfSBmcm9tIFwiLi9mb3JtYXR0ZXJzL3N0YXIuanNcIjtcbmltcG9ydCB7IGNzc0hlbHBlciB9IGZyb20gXCIuLi9oZWxwZXJzL2Nzc0hlbHBlci5qc1wiO1xuXG5jbGFzcyBDZWxsIHtcbiAgICAvKipcbiAgICAgKiBDcmVhdGUgY2VsbCBvYmplY3QgdGhhdCByZXByZXNlbnRzIHRoZSBgdGRgIHRhYmxlIGJvZHkgZWxlbWVudC5cbiAgICAgKiBAcGFyYW0ge0FycmF5PG9iamVjdD59IHJvd0RhdGEgUm93IGRhdGEuXG4gICAgICogQHBhcmFtIHtDb2x1bW59IGNvbHVtbiBDb2x1bW4gb2JqZWN0LlxuICAgICAqIEBwYXJhbSB7T2JqZWN0fSBtb2R1bGVzIEdyaWQgbW9kdWxlKHMpIGFkZGVkIGJ5IHVzZXIgZm9yIGN1c3RvbSBmb3JtYXR0aW5nLlxuICAgICAqIEBwYXJhbSB7SFRNTFRhYmxlUm93RWxlbWVudH0gcm93IFRhYmxlIHJvdyBgdHJgIGVsZW1lbnQuXG4gICAgICovXG4gICAgY29uc3RydWN0b3Iocm93RGF0YSwgY29sdW1uLCBtb2R1bGVzLCByb3cpIHtcbiAgICAgICAgdGhpcy5lbGVtZW50ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcInRkXCIpO1xuXG4gICAgICAgIGlmIChjb2x1bW4uZm9ybWF0dGVyKSB7XG4gICAgICAgICAgICB0aGlzLiNpbml0KHJvd0RhdGEsIGNvbHVtbiwgbW9kdWxlcywgcm93KTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHRoaXMuZWxlbWVudC5pbm5lclRleHQgPSByb3dEYXRhW2NvbHVtbi5maWVsZF07XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoY29sdW1uLnRvb2x0aXBGaWVsZCkge1xuICAgICAgICAgICAgdGhpcy4jYXBwbHlUb29sdGlwKHJvd0RhdGFbY29sdW1uLnRvb2x0aXBGaWVsZF0sIGNvbHVtbi50b29sdGlwTGF5b3V0KTtcbiAgICAgICAgfVxuICAgIH1cbiAgICAvKipcbiAgICAgKiBBcHBsaWVzIHRvb2x0aXAgZnVuY3Rpb25hbGl0eSB0byB0aGUgY2VsbC4gIElmIHRoZSBjZWxsJ3MgY29udGVudCBjb250YWlucyB0ZXh0IG9ubHksIGl0IHdpbGwgY3JlYXRlIGEgdG9vbHRpcCBcbiAgICAgKiBgc3BhbmAgZWxlbWVudCBhbmQgYXBwbHkgdGhlIGNvbnRlbnQgdG8gaXQuXG4gICAgICogQHBhcmFtIHtzdHJpbmcgfCBudW1iZXIgfCBEYXRlIHwgbnVsbH0gY29udGVudCBUb29sdGlwIGNvbnRlbnQgdG8gYmUgZGlzcGxheWVkLlxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBsYXlvdXQgQ1NTIGNsYXNzIGZvciB0b29sdGlwIGxheW91dCwgZWl0aGVyIFwiZGF0YWdyaWRzLXRvb2x0aXAtcmlnaHRcIiBvciBcImRhdGFncmlkcy10b29sdGlwLWxlZnRcIi5cbiAgICAgKi9cbiAgICAjYXBwbHlUb29sdGlwKGNvbnRlbnQsIGxheW91dCkge1xuICAgICAgICBpZiAoY29udGVudCA9PT0gbnVsbCB8fCBjb250ZW50ID09PSBcIlwiKSByZXR1cm47XG4gICAgICAgIFxuICAgICAgICBsZXQgdG9vbHRpcEVsZW1lbnQgPSB0aGlzLmVsZW1lbnQuZmlyc3RFbGVtZW50Q2hpbGQ7XG5cbiAgICAgICAgaWYgKHRvb2x0aXBFbGVtZW50ID09PSBudWxsKSB7XG4gICAgICAgICAgICB0b29sdGlwRWxlbWVudCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJzcGFuXCIpO1xuICAgICAgICAgICAgdG9vbHRpcEVsZW1lbnQuaW5uZXJUZXh0ID0gdGhpcy5lbGVtZW50LmlubmVyVGV4dDtcbiAgICAgICAgICAgIHRoaXMuZWxlbWVudC5yZXBsYWNlQ2hpbGRyZW4odG9vbHRpcEVsZW1lbnQpO1xuICAgICAgICB9XG5cbiAgICAgICAgdG9vbHRpcEVsZW1lbnQuZGF0YXNldC50b29sdGlwID0gY29udGVudDtcbiAgICAgICAgdG9vbHRpcEVsZW1lbnQuY2xhc3NMaXN0LmFkZChjc3NIZWxwZXIudG9vbHRpcCwgbGF5b3V0KTtcbiAgICB9XG5cbiAgICAjaW5pdChyb3dEYXRhLCBjb2x1bW4sIG1vZHVsZXMsIHJvdykge1xuICAgICAgICBpZiAodHlwZW9mIGNvbHVtbi5mb3JtYXR0ZXIgPT09IFwiZnVuY3Rpb25cIikge1xuICAgICAgICAgICAgdGhpcy5lbGVtZW50LmFwcGVuZChjb2x1bW4uZm9ybWF0dGVyKHJvd0RhdGEsIGNvbHVtbi5mb3JtYXR0ZXJQYXJhbXMsIHRoaXMuZWxlbWVudCwgcm93KSk7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgXG4gICAgICAgIHN3aXRjaCAoY29sdW1uLmZvcm1hdHRlcikge1xuICAgICAgICAgICAgY2FzZSBcImxpbmtcIjpcbiAgICAgICAgICAgICAgICB0aGlzLmVsZW1lbnQuYXBwZW5kKEZvcm1hdExpbmsuYXBwbHkocm93RGF0YSwgY29sdW1uLmZvcm1hdHRlclBhcmFtcykpO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgY2FzZSBcImRhdGVcIjpcbiAgICAgICAgICAgICAgICB0aGlzLmVsZW1lbnQuaW5uZXJUZXh0ID0gRm9ybWF0RGF0ZVRpbWUuYXBwbHkocm93RGF0YSwgY29sdW1uLCBjb2x1bW4uc2V0dGluZ3MuZGF0ZUZvcm1hdCwgZmFsc2UpO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgY2FzZSBcImRhdGV0aW1lXCI6XG4gICAgICAgICAgICAgICAgdGhpcy5lbGVtZW50LmlubmVyVGV4dCA9IEZvcm1hdERhdGVUaW1lLmFwcGx5KHJvd0RhdGEsIGNvbHVtbiwgY29sdW1uLnNldHRpbmdzLmRhdGVUaW1lRm9ybWF0LCB0cnVlKTtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIGNhc2UgXCJtb25leVwiOlxuICAgICAgICAgICAgICAgIHRoaXMuZWxlbWVudC5pbm5lclRleHQgPSBGb3JtYXROdW1lcmljLmFwcGx5KHJvd0RhdGEsIGNvbHVtbiwgXCJjdXJyZW5jeVwiLCAyKTtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIGNhc2UgXCJudW1lcmljXCI6XG4gICAgICAgICAgICAgICAgdGhpcy5lbGVtZW50LmlubmVyVGV4dCA9IEZvcm1hdE51bWVyaWMuYXBwbHkocm93RGF0YSwgY29sdW1uLCBjb2x1bW4uZm9ybWF0dGVyUGFyYW1zPy5zdHlsZSA/PyBcImRlY2ltYWxcIiwgY29sdW1uLmZvcm1hdHRlclBhcmFtcz8ucHJlY2lzaW9uID8/IDIpO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgY2FzZSBcInN0YXJcIjpcbiAgICAgICAgICAgICAgICB0aGlzLmVsZW1lbnQuYXBwZW5kKEZvcm1hdFN0YXIuYXBwbHkocm93RGF0YSwgY29sdW1uKSk7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICBjYXNlIFwibW9kdWxlXCI6XG4gICAgICAgICAgICAgICAgdGhpcy5lbGVtZW50LmFwcGVuZChtb2R1bGVzW2NvbHVtbi5mb3JtYXR0ZXJQYXJhbXMubmFtZV0uYXBwbHkocm93RGF0YSwgY29sdW1uLCByb3cpKTtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgICAgICAgdGhpcy5lbGVtZW50LmlubmVyVGV4dCA9IHJvd0RhdGFbY29sdW1uLmZpZWxkXTtcbiAgICAgICAgfVxuICAgIH1cbn1cblxuZXhwb3J0IHsgQ2VsbCB9OyIsImltcG9ydCB7IENlbGwgfSBmcm9tIFwiLi4vY2VsbC9jZWxsLmpzXCI7XG4vKipcbiAqIENsYXNzIHRvIG1hbmFnZSB0aGUgdGFibGUgZWxlbWVudCBhbmQgaXRzIHJvd3MgYW5kIGNlbGxzLlxuICovXG5jbGFzcyBUYWJsZSB7XG4gICAgI3Jvd0NvdW50O1xuICAgIC8qKlxuICAgICAqIENyZWF0ZSBgVGFibGVgIGNsYXNzIHRvIG1hbmFnZSB0aGUgdGFibGUgZWxlbWVudCBhbmQgaXRzIHJvd3MgYW5kIGNlbGxzLlxuICAgICAqIEBwYXJhbSB7R3JpZENvbnRleHR9IGNvbnRleHQgR3JpZCBjb250ZXh0LlxuICAgICAqL1xuICAgIGNvbnN0cnVjdG9yKGNvbnRleHQpIHtcbiAgICAgICAgdGhpcy5jb250ZXh0ID0gY29udGV4dDtcbiAgICAgICAgdGhpcy50YWJsZSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJ0YWJsZVwiKTtcbiAgICAgICAgdGhpcy50aGVhZCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJ0aGVhZFwiKTtcbiAgICAgICAgdGhpcy50Ym9keSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJ0Ym9keVwiKTtcbiAgICAgICAgdGhpcy4jcm93Q291bnQgPSAwO1xuXG4gICAgICAgIHRoaXMudGFibGUuaWQgPSBgJHtjb250ZXh0LnNldHRpbmdzLmJhc2VJZE5hbWV9X3RhYmxlYDtcbiAgICAgICAgdGhpcy50YWJsZS5hcHBlbmQodGhpcy50aGVhZCwgdGhpcy50Ym9keSk7XG4gICAgICAgIHRoaXMudGFibGUuY2xhc3NOYW1lID0gY29udGV4dC5zZXR0aW5ncy50YWJsZUNzcztcbiAgICB9XG4gICAgLyoqXG4gICAgICogSW5pdGlhbGl6ZXMgdGhlIHRhYmxlIGhlYWRlciByb3cgZWxlbWVudCBieSBjcmVhdGluZyBhIHJvdyBhbmQgYXBwZW5kaW5nIGVhY2ggY29sdW1uJ3MgaGVhZGVyIGNlbGwuXG4gICAgICovXG4gICAgaW5pdGlhbGl6ZUhlYWRlcigpIHtcbiAgICAgICAgY29uc3QgdHIgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwidHJcIik7XG5cbiAgICAgICAgZm9yIChjb25zdCBjb2x1bW4gb2YgdGhpcy5jb250ZXh0LmNvbHVtbk1hbmFnZXIuY29sdW1ucykge1xuICAgICAgICAgICAgdHIuYXBwZW5kQ2hpbGQoY29sdW1uLmhlYWRlckNlbGwuZWxlbWVudCk7XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLnRoZWFkLmFwcGVuZENoaWxkKHRyKTtcbiAgICB9XG4gICAgLyoqXG4gICAgICogUmVuZGVyIHRhYmxlIGJvZHkgcm93cy4gIFdpbGwgcmVtb3ZlIGFueSBwcmlvciB0YWJsZSBib2R5IHJlc3VsdHMgYW5kIGJ1aWxkIG5ldyByb3dzIGFuZCBjZWxscy5cbiAgICAgKiBAcGFyYW0ge0FycmF5PE9iamVjdD59IGRhdGFzZXQgRGF0YSBzZXQgdG8gYnVpbGQgdGFibGUgcm93cy5cbiAgICAgKiBAcGFyYW0ge251bWJlciB8IG51bGx9IFtyb3dDb3VudD1udWxsXSBTZXQgdGhlIHJvdyBjb3VudCBwYXJhbWV0ZXIgdG8gYSBzcGVjaWZpYyB2YWx1ZSBpZiBcbiAgICAgKiByZW1vdGUgcHJvY2Vzc2luZyBpcyBiZWluZyB1c2VkLCBvdGhlcndpc2Ugd2lsbCB1c2UgdGhlIGxlbmd0aCBvZiB0aGUgZGF0YXNldC5cbiAgICAgKi9cbiAgICByZW5kZXJSb3dzKGRhdGFzZXQsIHJvd0NvdW50ID0gbnVsbCkge1xuICAgICAgICAvL0NsZWFyIGJvZHkgb2YgcHJldmlvdXMgZGF0YS5cbiAgICAgICAgdGhpcy50Ym9keS5yZXBsYWNlQ2hpbGRyZW4oKTtcbiAgICAgICAgXG4gICAgICAgIGlmICghQXJyYXkuaXNBcnJheShkYXRhc2V0KSkge1xuICAgICAgICAgICAgdGhpcy4jcm93Q291bnQgPSAwO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy4jcm93Q291bnQgPSByb3dDb3VudCA/PyBkYXRhc2V0Lmxlbmd0aDtcblxuICAgICAgICBmb3IgKGNvbnN0IGRhdGEgb2YgZGF0YXNldCkge1xuICAgICAgICAgICAgY29uc3QgdHIgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwidHJcIik7XG5cbiAgICAgICAgICAgIGZvciAobGV0IGNvbHVtbiBvZiB0aGlzLmNvbnRleHQuY29sdW1uTWFuYWdlci5jb2x1bW5zKSB7XG4gICAgICAgICAgICAgICAgY29uc3QgY2VsbCA9IG5ldyBDZWxsKGRhdGEsIGNvbHVtbiwgdGhpcy5jb250ZXh0Lm1vZHVsZXMsIHRyKTtcblxuICAgICAgICAgICAgICAgIHRyLmFwcGVuZENoaWxkKGNlbGwuZWxlbWVudCk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHRoaXMudGJvZHkuYXBwZW5kQ2hpbGQodHIpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgZ2V0IHJvd0NvdW50KCkge1xuICAgICAgICByZXR1cm4gdGhpcy4jcm93Q291bnQ7XG4gICAgfVxufVxuXG5leHBvcnQgeyBUYWJsZSB9OyIsImltcG9ydCB7IENvbHVtbk1hbmFnZXIgfSBmcm9tIFwiLi4vY29sdW1uL2NvbHVtbk1hbmFnZXIuanNcIjtcbmltcG9ydCB7IERhdGFQaXBlbGluZSB9IGZyb20gXCIuLi9kYXRhL2RhdGFQaXBlbGluZS5qc1wiO1xuaW1wb3J0IHsgRGF0YUxvYWRlciB9IGZyb20gXCIuLi9kYXRhL2RhdGFMb2FkZXIuanNcIjtcbmltcG9ydCB7IERhdGFQZXJzaXN0ZW5jZSB9IGZyb20gXCIuLi9kYXRhL2RhdGFQZXJzaXN0ZW5jZS5qc1wiO1xuaW1wb3J0IHsgR3JpZEV2ZW50cyB9IGZyb20gXCIuLi9ldmVudHMvZ3JpZEV2ZW50cy5qc1wiO1xuaW1wb3J0IHsgVGFibGUgfSBmcm9tIFwiLi4vdGFibGUvdGFibGUuanNcIjtcbi8qKlxuICogUHJvdmlkZXMgdGhlIGNvbnRleHQgZm9yIHRoZSBncmlkLCBpbmNsdWRpbmcgc2V0dGluZ3MsIGRhdGEsIGFuZCBtb2R1bGVzLiAgVGhpcyBjbGFzcyBpcyByZXNwb25zaWJsZSBmb3IgbWFuYWdpbmcgXG4gKiB0aGUgZ3JpZCdzIGNvcmUgc3RhdGUgYW5kIGJlaGF2aW9yLlxuICovXG5jbGFzcyBHcmlkQ29udGV4dCB7XG4gICAgLyoqXG4gICAgICogQ3JlYXRlIGdyaWQgY29udGV4dCwgd2hpY2ggcmVwcmVzZW50cyB0aGUgY29yZSBsb2dpYyBhbmQgZnVuY3Rpb25hbGl0eSBvZiB0aGUgZGF0YSBncmlkLlxuICAgICAqIEBwYXJhbSB7QXJyYXk8b2JqZWN0Pn0gY29sdW1ucyBDb2x1bW4gZGVmaW5pdGlvbi5cbiAgICAgKiBAcGFyYW0ge1NldHRpbmdzR3JpZH0gc2V0dGluZ3MgR3JpZCBzZXR0aW5ncy5cbiAgICAgKiBAcGFyYW0ge2FueVtdfSBbZGF0YT1bXV0gR3JpZCBkYXRhLlxuICAgICAqL1xuICAgIGNvbnN0cnVjdG9yKGNvbHVtbnMsIHNldHRpbmdzLCBkYXRhID0gW10pIHtcbiAgICAgICAgdGhpcy5zZXR0aW5ncyA9IHNldHRpbmdzO1xuICAgICAgICB0aGlzLmV2ZW50cyA9IG5ldyBHcmlkRXZlbnRzKCk7XG4gICAgICAgIHRoaXMucGlwZWxpbmUgPSBuZXcgRGF0YVBpcGVsaW5lKHRoaXMuc2V0dGluZ3MpO1xuICAgICAgICB0aGlzLmRhdGFsb2FkZXIgPSBuZXcgRGF0YUxvYWRlcih0aGlzLnNldHRpbmdzKTtcbiAgICAgICAgdGhpcy5wZXJzaXN0ZW5jZSA9IG5ldyBEYXRhUGVyc2lzdGVuY2UoZGF0YSk7XG4gICAgICAgIHRoaXMuY29sdW1uTWFuYWdlciA9IG5ldyBDb2x1bW5NYW5hZ2VyKGNvbHVtbnMsIHRoaXMuc2V0dGluZ3MpO1xuICAgICAgICB0aGlzLmdyaWQgPSBuZXcgVGFibGUodGhpcyk7XG4gICAgICAgIHRoaXMubW9kdWxlcyA9IHt9O1xuICAgIH1cbn1cblxuZXhwb3J0IHsgR3JpZENvbnRleHQgfTsiLCJleHBvcnQgZGVmYXVsdCB7XG4gICAgYmFzZUlkTmFtZTogXCJkYXRhZ3JpZFwiLCAgLy9iYXNlIG5hbWUgZm9yIGFsbCBlbGVtZW50IElEJ3MuXG4gICAgZGF0YTogW10sICAvL3JvdyBkYXRhLlxuICAgIGNvbHVtbnM6IFtdLCAgLy9jb2x1bW4gZGVmaW5pdGlvbnMuXG4gICAgZW5hYmxlUGFnaW5nOiB0cnVlLCAgLy9lbmFibGUgcGFnaW5nIG9mIGRhdGEuXG4gICAgcGFnZXJQYWdlc1RvRGlzcGxheTogNSwgIC8vbWF4IG51bWJlciBvZiBwYWdlciBidXR0b25zIHRvIGRpc3BsYXkuXG4gICAgcGFnZXJSb3dzUGVyUGFnZTogMjUsICAvL3Jvd3MgcGVyIHBhZ2UuXG4gICAgZGF0ZUZvcm1hdDogXCJNTS9kZC95eXl5XCIsICAvL3JvdyBsZXZlbCBkYXRlIGZvcm1hdC5cbiAgICBkYXRlVGltZUZvcm1hdDogXCJNTS9kZC95eXl5IEhIOm1tOnNzXCIsIC8vcm93IGxldmVsIGRhdGUgZm9ybWF0LlxuICAgIHJlbW90ZVVybDogXCJcIiwgIC8vZ2V0IGRhdGEgZnJvbSB1cmwgZW5kcG9pbnQgdmlhIEFqYXguXG4gICAgcmVtb3RlUGFyYW1zOiBcIlwiLCAgLy9wYXJhbWV0ZXJzIHRvIGJlIHBhc3NlZCBvbiBBamF4IHJlcXVlc3QuXG4gICAgcmVtb3RlUHJvY2Vzc2luZzogZmFsc2UsICAvL3RydXRoeSBzZXRzIGdyaWQgdG8gcHJvY2VzcyBmaWx0ZXIvc29ydCBvbiByZW1vdGUgc2VydmVyLlxuICAgIHRhYmxlQ3NzOiBcImRhdGFncmlkc1wiLCBcbiAgICB0YWJsZUhlYWRlclRoQ3NzOiBcIlwiLFxuICAgIHBhZ2VyQ3NzOiBcImRhdGFncmlkcy1wYWdlclwiLCBcbiAgICB0YWJsZUZpbHRlckNzczogXCJkYXRhZ3JpZHMtaW5wdXRcIiwgIC8vY3NzIGNsYXNzIGZvciBoZWFkZXIgZmlsdGVyIGlucHV0IGVsZW1lbnRzLlxuICAgIHRhYmxlRXZlbkNvbHVtbldpZHRoczogZmFsc2UsICAvL3Nob3VsZCBhbGwgY29sdW1ucyBiZSBlcXVhbCB3aWR0aD9cbiAgICB0YWJsZUNzc1NvcnRBc2M6IFwiZGF0YWdyaWRzLXNvcnQtaWNvbiBkYXRhZ3JpZHMtc29ydC1hc2NcIixcbiAgICB0YWJsZUNzc1NvcnREZXNjOiBcImRhdGFncmlkcy1zb3J0LWljb24gZGF0YWdyaWRzLXNvcnQtZGVzY1wiLFxuICAgIHJlZnJlc2hhYmxlSWQ6IFwiXCIsICAvL3JlZnJlc2ggcmVtb3RlIGRhdGEgc291cmNlcyBmb3IgZ3JpZCBhbmQvb3IgZmlsdGVyIHZhbHVlcy5cbiAgICByb3dDb3VudElkOiBcIlwiLFxuICAgIGNzdkV4cG9ydElkOiBcIlwiLFxuICAgIGNzdkV4cG9ydFJlbW90ZVNvdXJjZTogXCJcIiAvL2dldCBleHBvcnQgZGF0YSBmcm9tIHVybCBlbmRwb2ludCB2aWEgQWpheDsgdXNlZnVsIHRvIGdldCBub24tcGFnZWQgZGF0YS5cbn07IiwiaW1wb3J0IHNldHRpbmdzRGVmYXVsdHMgZnJvbSBcIi4vc2V0dGluZ3NEZWZhdWx0LmpzXCI7XG5cbmNsYXNzIE1lcmdlT3B0aW9ucyB7XG4gICAgLyoqXG4gICAgICogUmV0dXJucyBhbiBvYmplY3QgYmFzZWQgb24gdGhlIG1lcmdlZCByZXN1bHRzIG9mIHRoZSBkZWZhdWx0IGFuZCB1c2VyIHByb3ZpZGVkIHNldHRpbmdzLlxuICAgICAqIFVzZXIgcHJvdmlkZWQgc2V0dGluZ3Mgd2lsbCBvdmVycmlkZSBkZWZhdWx0cy5cbiAgICAgKiBAcGFyYW0ge09iamVjdH0gc291cmNlIHVzZXIgc3VwcGxpZWQgc2V0dGluZ3MuXG4gICAgICogQHJldHVybnMge09iamVjdH0gc2V0dGluZ3MgbWVyZ2VkIGZyb20gZGVmYXVsdCBhbmQgdXNlciB2YWx1ZXMuXG4gICAgICovXG4gICAgc3RhdGljIG1lcmdlKHNvdXJjZSkge1xuICAgICAgICAvL2NvcHkgZGVmYXVsdCBrZXkvdmFsdWUgaXRlbXMuXG4gICAgICAgIGxldCByZXN1bHQgPSBKU09OLnBhcnNlKEpTT04uc3RyaW5naWZ5KHNldHRpbmdzRGVmYXVsdHMpKTtcblxuICAgICAgICBpZiAoc291cmNlID09PSB1bmRlZmluZWQgfHwgT2JqZWN0LmtleXMoc291cmNlKS5sZW5ndGggPT09IDApIHtcbiAgICAgICAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIGZvciAobGV0IFtrZXksIHZhbHVlXSBvZiBPYmplY3QuZW50cmllcyhzb3VyY2UpKSB7XG4gICAgICAgICAgICBsZXQgdGFyZ2V0VHlwZSA9IHJlc3VsdFtrZXldICE9PSB1bmRlZmluZWQgPyByZXN1bHRba2V5XS50b1N0cmluZygpIDogdW5kZWZpbmVkO1xuICAgICAgICAgICAgbGV0IHNvdXJjZVR5cGUgPSB2YWx1ZS50b1N0cmluZygpO1xuXG4gICAgICAgICAgICBpZiAodGFyZ2V0VHlwZSAhPT0gdW5kZWZpbmVkICYmIHRhcmdldFR5cGUgIT09IHNvdXJjZVR5cGUpIHtcbiAgICAgICAgICAgICAgICByZXN1bHRba2V5XSA9IHZhbHVlO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICB9XG59XG5cbmV4cG9ydCB7IE1lcmdlT3B0aW9ucyB9OyIsIi8qKlxuICogSW1wbGVtZW50cyB0aGUgcHJvcGVydHkgc2V0dGluZ3MgZm9yIHRoZSBncmlkLlxuICovXG5jbGFzcyBTZXR0aW5nc0dyaWQge1xuICAgIC8qKlxuICAgICAqIFRyYW5zbGF0ZXMgc2V0dGluZ3MgZnJvbSBtZXJnZWQgdXNlci9kZWZhdWx0IG9wdGlvbnMgaW50byBhIGRlZmluaXRpb24gb2YgZ3JpZCBzZXR0aW5ncy5cbiAgICAgKiBAcGFyYW0ge09iamVjdH0gb3B0aW9ucyBNZXJnZWQgdXNlci9kZWZhdWx0IG9wdGlvbnMuXG4gICAgICovXG4gICAgY29uc3RydWN0b3Iob3B0aW9ucykge1xuICAgICAgICB0aGlzLmJhc2VJZE5hbWUgPSBvcHRpb25zLmJhc2VJZE5hbWU7XG4gICAgICAgIHRoaXMuZW5hYmxlUGFnaW5nID0gb3B0aW9ucy5lbmFibGVQYWdpbmc7XG4gICAgICAgIHRoaXMucGFnZXJQYWdlc1RvRGlzcGxheSA9IG9wdGlvbnMucGFnZXJQYWdlc1RvRGlzcGxheTtcbiAgICAgICAgdGhpcy5wYWdlclJvd3NQZXJQYWdlID0gb3B0aW9ucy5wYWdlclJvd3NQZXJQYWdlO1xuICAgICAgICB0aGlzLmRhdGVGb3JtYXQgPSBvcHRpb25zLmRhdGVGb3JtYXQ7XG4gICAgICAgIHRoaXMuZGF0ZVRpbWVGb3JtYXQgPSBvcHRpb25zLmRhdGVUaW1lRm9ybWF0O1xuICAgICAgICB0aGlzLnJlbW90ZVVybCA9IG9wdGlvbnMucmVtb3RlVXJsOyAgXG4gICAgICAgIHRoaXMucmVtb3RlUGFyYW1zID0gb3B0aW9ucy5yZW1vdGVQYXJhbXM7XG4gICAgICAgIHRoaXMucmVtb3RlUHJvY2Vzc2luZyA9IGZhbHNlO1xuICAgICAgICBcbiAgICAgICAgdGhpcy5hamF4VXJsID0gKHRoaXMucmVtb3RlVXJsICYmIHRoaXMucmVtb3RlUGFyYW1zKSA/IHRoaXMuX2J1aWxkQWpheFVybCh0aGlzLnJlbW90ZVVybCwgdGhpcy5yZW1vdGVQYXJhbXMpIDogdGhpcy5yZW1vdGVVcmw7XG5cbiAgICAgICAgaWYgKHR5cGVvZiBvcHRpb25zLnJlbW90ZVByb2Nlc3NpbmcgPT09IFwiYm9vbGVhblwiICYmIG9wdGlvbnMucmVtb3RlUHJvY2Vzc2luZykge1xuICAgICAgICAgICAgLy8gUmVtb3RlIHByb2Nlc3Npbmcgc2V0IHRvIGBvbmA7IHVzZSBmaXJzdCBjb2x1bW4gd2l0aCBmaWVsZCBhcyBkZWZhdWx0IHNvcnQuXG4gICAgICAgICAgICBjb25zdCBmaXJzdCA9IG9wdGlvbnMuY29sdW1ucy5maW5kKChpdGVtKSA9PiBpdGVtLmZpZWxkICE9PSB1bmRlZmluZWQpO1xuXG4gICAgICAgICAgICB0aGlzLnJlbW90ZVByb2Nlc3NpbmcgPSB0cnVlO1xuICAgICAgICAgICAgdGhpcy5yZW1vdGVTb3J0RGVmYXVsdENvbHVtbiA9IGZpcnN0LmZpZWxkO1xuICAgICAgICAgICAgdGhpcy5yZW1vdGVTb3J0RGVmYXVsdERpcmVjdGlvbiA9IFwiZGVzY1wiO1xuICAgICAgICB9IGVsc2UgaWYgKE9iamVjdC5rZXlzKG9wdGlvbnMucmVtb3RlUHJvY2Vzc2luZykubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgLy8gUmVtb3RlIHByb2Nlc3Npbmcgc2V0IHRvIGBvbmAgdXNpbmcga2V5L3ZhbHVlIHBhcmFtZXRlciBpbnB1dHMgZm9yIGRlZmF1bHQgc29ydCBjb2x1bW4uXG4gICAgICAgICAgICB0aGlzLnJlbW90ZVByb2Nlc3NpbmcgPSB0cnVlO1xuICAgICAgICAgICAgdGhpcy5yZW1vdGVTb3J0RGVmYXVsdENvbHVtbiA9IG9wdGlvbnMucmVtb3RlUHJvY2Vzc2luZy5jb2x1bW47XG4gICAgICAgICAgICB0aGlzLnJlbW90ZVNvcnREZWZhdWx0RGlyZWN0aW9uID0gb3B0aW9ucy5yZW1vdGVQcm9jZXNzaW5nLmRpcmVjdGlvbiA/PyBcImRlc2NcIjtcbiAgICAgICAgfSBcblxuICAgICAgICB0aGlzLnRhYmxlQ3NzID0gb3B0aW9ucy50YWJsZUNzcztcbiAgICAgICAgdGhpcy50YWJsZUhlYWRlclRoQ3NzID0gb3B0aW9ucy50YWJsZUhlYWRlclRoQ3NzO1xuICAgICAgICB0aGlzLnBhZ2VyQ3NzID0gb3B0aW9ucy5wYWdlckNzcztcbiAgICAgICAgdGhpcy50YWJsZUZpbHRlckNzcyA9IG9wdGlvbnMudGFibGVGaWx0ZXJDc3M7XG4gICAgICAgIHRoaXMudGFibGVFdmVuQ29sdW1uV2lkdGhzID0gb3B0aW9ucy50YWJsZUV2ZW5Db2x1bW5XaWR0aHM7XG4gICAgICAgIHRoaXMudGFibGVDc3NTb3J0QXNjID0gb3B0aW9ucy50YWJsZUNzc1NvcnRBc2M7XG4gICAgICAgIHRoaXMudGFibGVDc3NTb3J0RGVzYyA9IG9wdGlvbnMudGFibGVDc3NTb3J0RGVzYztcbiAgICAgICAgdGhpcy5yZWZyZXNoYWJsZUlkID0gb3B0aW9ucy5yZWZyZXNoYWJsZUlkO1xuICAgICAgICB0aGlzLnJvd0NvdW50SWQgPSBvcHRpb25zLnJvd0NvdW50SWQ7XG4gICAgICAgIHRoaXMuY3N2RXhwb3J0SWQgPSBvcHRpb25zLmNzdkV4cG9ydElkO1xuICAgICAgICB0aGlzLmNzdkV4cG9ydFJlbW90ZVNvdXJjZSA9IG9wdGlvbnMuY3N2RXhwb3J0UmVtb3RlU291cmNlO1xuICAgIH1cbiAgICAvKipcbiAgICAgKiBDb21waWxlcyB0aGUga2V5L3ZhbHVlIHF1ZXJ5IHBhcmFtZXRlcnMgaW50byBhIGZ1bGx5IHF1YWxpZmllZCB1cmwgd2l0aCBxdWVyeSBzdHJpbmcuXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IHVybCBiYXNlIHVybC5cbiAgICAgKiBAcGFyYW0ge29iamVjdH0gcGFyYW1zIHF1ZXJ5IHN0cmluZyBwYXJhbWV0ZXJzLlxuICAgICAqIEByZXR1cm5zIHtzdHJpbmd9IHVybCB3aXRoIHF1ZXJ5IHBhcmFtZXRlcnMuXG4gICAgICovXG4gICAgX2J1aWxkQWpheFVybCh1cmwsIHBhcmFtcykge1xuICAgICAgICBjb25zdCBwID0gT2JqZWN0LmtleXMocGFyYW1zKTtcblxuICAgICAgICBpZiAocC5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICBjb25zdCBxdWVyeSA9IHAubWFwKGsgPT4gYCR7ZW5jb2RlVVJJQ29tcG9uZW50KGspfT0ke2VuY29kZVVSSUNvbXBvbmVudChwYXJhbXNba10pfWApXG4gICAgICAgICAgICAgICAgLmpvaW4oXCImXCIpO1xuXG4gICAgICAgICAgICByZXR1cm4gYCR7dXJsfT8ke3F1ZXJ5fWA7XG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIHJldHVybiB1cmw7XG4gICAgfVxufVxuXG5leHBvcnQgeyBTZXR0aW5nc0dyaWQgfTsiLCIvKipcbiAqIFJlc3BvbnNpYmxlIGZvciByZW5kZXJpbmcgdGhlIGdyaWRzIHJvd3MgdXNpbmcgZWl0aGVyIGxvY2FsIG9yIHJlbW90ZSBkYXRhLiAgVGhpcyBzaG91bGQgYmUgdGhlIGRlZmF1bHQgbW9kdWxlIHRvIFxuICogY3JlYXRlIHJvdyBkYXRhIGlmIHBhZ2luZyBpcyBub3QgZW5hYmxlZC4gIFN1YnNjcmliZXMgdG8gdGhlIGByZW5kZXJgIGV2ZW50IHRvIGNyZWF0ZSB0aGUgZ3JpZCdzIHJvd3MgYW5kIHRoZSBgcmVtb3RlUGFyYW1zYCBcbiAqIGV2ZW50IGZvciByZW1vdGUgcHJvY2Vzc2luZy5cbiAqIFxuICogQ2xhc3Mgd2lsbCBjYWxsIHRoZSAncmVtb3RlUGFyYW1zJyBldmVudCB0byBjb25jYXRlbmF0ZSBwYXJhbWV0ZXJzIGZvciByZW1vdGUgZGF0YSByZXF1ZXN0cy5cbiAqL1xuY2xhc3MgUm93TW9kdWxlIHtcbiAgICAvKipcbiAgICAgKiBDcmVhdGVzIGdyaWQgcm93cy4gIFRoaXMgc2hvdWxkIGJlIHRoZSBkZWZhdWx0IG1vZHVsZSB0byBjcmVhdGUgcm93IGRhdGEgaWYgcGFnaW5nIGlzIG5vdCBlbmFibGVkLlxuICAgICAqIEBwYXJhbSB7R3JpZENvbnRleHR9IGNvbnRleHQgR3JpZCBjb250ZXh0IGNsYXNzLlxuICAgICAqL1xuICAgIGNvbnN0cnVjdG9yKGNvbnRleHQpIHtcbiAgICAgICAgdGhpcy5jb250ZXh0ID0gY29udGV4dDtcbiAgICB9XG5cbiAgICBpbml0aWFsaXplKCkge1xuICAgICAgICBpZiAodGhpcy5jb250ZXh0LnNldHRpbmdzLnJlbW90ZVByb2Nlc3NpbmcpIHtcbiAgICAgICAgICAgIHRoaXMuY29udGV4dC5ldmVudHMuc3Vic2NyaWJlKFwicmVuZGVyXCIsIHRoaXMucmVuZGVyUmVtb3RlLCB0cnVlLCAxMCk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB0aGlzLmNvbnRleHQuZXZlbnRzLnN1YnNjcmliZShcInJlbmRlclwiLCB0aGlzLnJlbmRlckxvY2FsLCBmYWxzZSwgMTApO1xuICAgICAgICB9XG4gICAgfVxuICAgIC8qKlxuICAgICAqIFJlbmRlcnMgdGhlIGdyaWQgcm93cyB1c2luZyBsb2NhbCBkYXRhLiAgVGhpcyBpcyB0aGUgZGVmYXVsdCBtZXRob2QgdG8gcmVuZGVyIHJvd3Mgd2hlbiByZW1vdGUgcHJvY2Vzc2luZyBpcyBub3QgZW5hYmxlZC5cbiAgICAgKi9cbiAgICByZW5kZXJMb2NhbCA9ICgpID0+IHtcbiAgICAgICAgdGhpcy5jb250ZXh0LmdyaWQucmVuZGVyUm93cyh0aGlzLmNvbnRleHQucGVyc2lzdGVuY2UuZGF0YSk7XG4gICAgfTtcbiAgICAvKipcbiAgICAgKiBSZW5kZXJzIHRoZSBncmlkIHJvd3MgdXNpbmcgcmVtb3RlIGRhdGEuICBUaGlzIG1ldGhvZCB3aWxsIGNhbGwgdGhlIGByZW1vdGVQYXJhbXNgIGV2ZW50IHRvIGdldCB0aGUgcGFyYW1ldGVycyBmb3IgdGhlIHJlbW90ZSByZXF1ZXN0LlxuICAgICAqL1xuICAgIHJlbmRlclJlbW90ZSA9IGFzeW5jICgpID0+IHtcbiAgICAgICAgY29uc3QgcGFyYW1zID0gdGhpcy5jb250ZXh0LmV2ZW50cy5jaGFpbihcInJlbW90ZVBhcmFtc1wiLCB7fSk7XG4gICAgICAgIGNvbnN0IGRhdGEgPSBhd2FpdCB0aGlzLmNvbnRleHQuZGF0YWxvYWRlci5yZXF1ZXN0R3JpZERhdGEocGFyYW1zKTtcblxuICAgICAgICB0aGlzLmNvbnRleHQuZ3JpZC5yZW5kZXJSb3dzKGRhdGEpO1xuICAgIH07XG59XG5cblJvd01vZHVsZS5tb2R1bGVOYW1lID0gXCJyb3dcIjtcblxuZXhwb3J0IHsgUm93TW9kdWxlIH07IiwiY2xhc3MgUGFnZXJCdXR0b25zIHtcbiAgICAvKipcbiAgICAgKiBSZXR1cm5zIHN0YXJ0IGJ1dHRvbiBmb3IgcGFnZXIgZWxlbWVudC5cbiAgICAgKiBAcGFyYW0ge251bWJlcn0gY3VycmVudFBhZ2UgQ3VycmVudCBwYWdlLlxuICAgICAqIEBwYXJhbSB7RnVuY3Rpb259IGNhbGxiYWNrIEJ1dHRvbiBjbGljayBoYW5kbGVyLlxuICAgICAqIEByZXR1cm5zIHtIVE1MTGlua0VsZW1lbnR9XG4gICAgICovXG4gICAgc3RhdGljIHN0YXJ0KGN1cnJlbnRQYWdlLCBjYWxsYmFjaykge1xuICAgICAgICBjb25zdCBsaSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJsaVwiKTtcbiAgICAgICAgY29uc3QgYnRuID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImJ1dHRvblwiKTtcblxuICAgICAgICBsaS5hcHBlbmQoYnRuKTtcbiAgICAgICAgYnRuLmlubmVySFRNTCA9IFwiJmxzYXF1bztcIjtcbiAgICAgICAgYnRuLmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCBjYWxsYmFjayk7XG5cbiAgICAgICAgaWYgKGN1cnJlbnRQYWdlID4gMSkge1xuICAgICAgICAgICAgYnRuLmRhdGFzZXQucGFnZSA9IFwiMVwiO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgYnRuLnRhYkluZGV4ID0gLTE7XG4gICAgICAgICAgICBidG4uZGlzYWJsZWQgPSB0cnVlO1xuICAgICAgICAgICAgbGkuY2xhc3NOYW1lID0gXCJkaXNhYmxlZFwiO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIGxpO1xuICAgIH1cbiAgICAvKipcbiAgICAgKiBSZXR1cm5zIGVuZCBidXR0b24gZm9yIHBhZ2VyIGVsZW1lbnQuXG4gICAgICogQHBhcmFtIHtudW1iZXJ9IHRvdGFsUGFnZXMgbGFzdCBwYWdlIG51bWJlciBpbiBncm91cCBzZXQuXG4gICAgICogQHBhcmFtIHtudW1iZXJ9IGN1cnJlbnRQYWdlIGN1cnJlbnQgcGFnZS5cbiAgICAgKiBAcGFyYW0ge0Z1bmN0aW9ufSBjYWxsYmFjayBidXR0b24gY2xpY2sgaGFuZGxlci5cbiAgICAgKiBAcmV0dXJucyB7SFRNTExJRWxlbWVudH1cbiAgICAgKi9cbiAgICBzdGF0aWMgZW5kKHRvdGFsUGFnZXMsIGN1cnJlbnRQYWdlLCBjYWxsYmFjaykge1xuICAgICAgICBjb25zdCBsaSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJsaVwiKTtcbiAgICAgICAgY29uc3QgYnRuID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImJ1dHRvblwiKTtcblxuICAgICAgICBsaS5hcHBlbmQoYnRuKTtcbiAgICAgICAgYnRuLmlubmVySFRNTCA9IFwiJnJzYXF1bztcIjtcbiAgICAgICAgYnRuLmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCBjYWxsYmFjayk7XG5cbiAgICAgICAgaWYgKGN1cnJlbnRQYWdlIDwgdG90YWxQYWdlcykge1xuICAgICAgICAgICAgYnRuLmRhdGFzZXQucGFnZSA9IHRvdGFsUGFnZXM7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBidG4udGFiSW5kZXggPSAtMTtcbiAgICAgICAgICAgIGJ0bi5kaXNhYmxlZCA9IHRydWU7XG4gICAgICAgICAgICBsaS5jbGFzc05hbWUgPSBcImRpc2FibGVkXCI7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gbGk7XG4gICAgfVxuICAgIC8qKlxuICAgICAqIFJldHVybnMgcGFnZXIgYnV0dG9uIGZvciBhc3NvY2lhdGVkIHBhZ2UuXG4gICAgICogQHBhcmFtIHtudW1iZXJ9IHBhZ2UgcGFnZSBudW1iZXIuXG4gICAgICogQHBhcmFtIHtudW1iZXJ9IGN1cnJlbnRQYWdlIGN1cnJlbnQgcGFnZS5cbiAgICAgKiBAcGFyYW0ge0Z1bmN0aW9ufSBjYWxsYmFjayBidXR0b24gY2xpY2sgaGFuZGxlci5cbiAgICAgKiBAcmV0dXJucyB7SFRNTExJRWxlbWVudH1cbiAgICAgKi9cbiAgICBzdGF0aWMgcGFnZU51bWJlcihwYWdlLCBjdXJyZW50UGFnZSwgY2FsbGJhY2spIHtcbiAgICAgICAgY29uc3QgbGkgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwibGlcIik7XG4gICAgICAgIGNvbnN0IGJ0biA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJidXR0b25cIik7XG5cbiAgICAgICAgbGkuYXBwZW5kKGJ0bik7XG4gICAgICAgIGJ0bi5pbm5lclRleHQgPSBwYWdlO1xuICAgICAgICBidG4uZGF0YXNldC5wYWdlID0gcGFnZTtcbiAgICAgICAgYnRuLmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCBjYWxsYmFjayk7XG5cbiAgICAgICAgaWYgKHBhZ2UgPT09IGN1cnJlbnRQYWdlKSB7XG4gICAgICAgICAgICBsaS5jbGFzc05hbWUgPSBcImFjdGl2ZVwiO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIGxpO1xuICAgIH1cbn1cblxuZXhwb3J0IHsgUGFnZXJCdXR0b25zIH07IiwiaW1wb3J0IHsgUGFnZXJCdXR0b25zIH0gZnJvbSBcIi4vcGFnZXJCdXR0b25zLmpzXCI7XG4vKipcbiAqIEZvcm1hdHMgZ3JpZCdzIHJvd3MgYXMgYSBzZXJpZXMgb2YgcGFnZXMgcmF0aGVyIHRoYXQgYSBzY3JvbGxpbmcgbGlzdC4gIElmIHBhZ2luZyBpcyBub3QgZGVzaXJlZCwgcmVnaXN0ZXIgdGhlIGBSb3dNb2R1bGVgIGluc3RlYWQuXG4gKiBcbiAqIENsYXNzIHN1YnNjcmliZXMgdG8gdGhlIGByZW5kZXJgIGV2ZW50IHRvIHVwZGF0ZSB0aGUgcGFnZXIgY29udHJvbCB3aGVuIHRoZSBncmlkIGlzIHJlbmRlcmVkLiAgSXQgYWxzbyBjYWxscyB0aGUgY2hhaW4gZXZlbnQgXG4gKiBgcmVtb3RlUGFyYW1zYCB0byBjb21waWxlIGEgbGlzdCBvZiBwYXJhbWV0ZXJzIHRvIGJlIHBhc3NlZCB0byB0aGUgcmVtb3RlIGRhdGEgc291cmNlIHdoZW4gdXNpbmcgcmVtb3RlIHByb2Nlc3NpbmcuXG4gKi9cbmNsYXNzIFBhZ2VyTW9kdWxlIHtcbiAgICAvKipcbiAgICAgKiBGb3JtYXRzIGdyaWQncyByb3dzIGFzIGEgc2VyaWVzIG9mIHBhZ2VzIHJhdGhlciB0aGF0IGEgc2Nyb2xsaW5nIGxpc3QuICBNb2R1bGUgY2FuIGJlIHVzZWQgd2l0aCBib3RoIGxvY2FsIGFuZCByZW1vdGUgZGF0YSBzb3VyY2VzLiAgXG4gICAgICogQHBhcmFtIHtHcmlkQ29udGV4dH0gY29udGV4dCBHcmlkIGNvbnRleHQuXG4gICAgICovXG4gICAgY29uc3RydWN0b3IoY29udGV4dCkge1xuICAgICAgICB0aGlzLmNvbnRleHQgPSBjb250ZXh0O1xuICAgICAgICB0aGlzLnRvdGFsUm93cyA9IHRoaXMuY29udGV4dC5wZXJzaXN0ZW5jZS5yb3dDb3VudDtcbiAgICAgICAgdGhpcy5wYWdlc1RvRGlzcGxheSA9IHRoaXMuY29udGV4dC5zZXR0aW5ncy5wYWdlclBhZ2VzVG9EaXNwbGF5O1xuICAgICAgICB0aGlzLnJvd3NQZXJQYWdlID0gdGhpcy5jb250ZXh0LnNldHRpbmdzLnBhZ2VyUm93c1BlclBhZ2U7XG4gICAgICAgIHRoaXMuY3VycmVudFBhZ2UgPSAxO1xuICAgICAgICAvL2NyZWF0ZSBkaXYgY29udGFpbmVyIGZvciBwYWdlclxuICAgICAgICB0aGlzLmNvbnRhaW5lciA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJkaXZcIik7XG4gICAgICAgIHRoaXMuZWxQYWdlciA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJ1bFwiKTtcblxuICAgICAgICB0aGlzLmNvbnRhaW5lci5pZCA9IGAke3RoaXMuY29udGV4dC5zZXR0aW5ncy5iYXNlSWROYW1lfV9wYWdlcmA7XG4gICAgICAgIHRoaXMuY29udGFpbmVyLmNsYXNzTmFtZSA9IHRoaXMuY29udGV4dC5zZXR0aW5ncy5wYWdlckNzcztcbiAgICAgICAgdGhpcy5jb250YWluZXIuYXBwZW5kKHRoaXMuZWxQYWdlcik7XG4gICAgICAgIHRoaXMuY29udGV4dC5ncmlkLnRhYmxlLmluc2VydEFkamFjZW50RWxlbWVudChcImFmdGVyZW5kXCIsIHRoaXMuY29udGFpbmVyKTtcbiAgICB9XG4gICAgLyoqXG4gICAgICogU2V0cyBoYW5kbGVyIGV2ZW50cyBmb3IgcmVuZGVyaW5nL3VwZGF0aW5nIGdyaWQgYm9keSByb3dzIGFuZCBwYWdlciBjb250cm9sLlxuICAgICAqL1xuICAgIGluaXRpYWxpemUoKSB7XG4gICAgICAgIGlmICh0aGlzLmNvbnRleHQuc2V0dGluZ3MucmVtb3RlUHJvY2Vzc2luZykge1xuICAgICAgICAgICAgdGhpcy5jb250ZXh0LmV2ZW50cy5zdWJzY3JpYmUoXCJyZW5kZXJcIiwgdGhpcy5yZW5kZXJSZW1vdGUsIHRydWUsIDEwKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHRoaXMuY29udGV4dC5ldmVudHMuc3Vic2NyaWJlKFwicmVuZGVyXCIsIHRoaXMucmVuZGVyTG9jYWwsIGZhbHNlLCAxMCk7XG4gICAgICAgIH1cbiAgICB9XG4gICAgLyoqXG4gICAgICogUmV0dXJucyB0aGUgdG90YWwgbnVtYmVyIG9mIHBvc3NpYmxlIHBhZ2VzIGJhc2VkIG9uIHRoZSB0b3RhbCByb3dzLCBhbmQgcm93cyBwZXIgcGFnZSBzZXR0aW5nLlxuICAgICAqIEByZXR1cm5zIHtOdW1iZXJ9XG4gICAgICovXG4gICAgdG90YWxQYWdlcygpIHtcbiAgICAgICAgY29uc3QgdG90YWxSb3dzID0gaXNOYU4odGhpcy50b3RhbFJvd3MpID8gMSA6IHRoaXMudG90YWxSb3dzO1xuXG4gICAgICAgIHJldHVybiB0aGlzLnJvd3NQZXJQYWdlID09PSAwID8gMSA6IE1hdGguY2VpbCh0b3RhbFJvd3MgLyB0aGlzLnJvd3NQZXJQYWdlKTtcbiAgICB9XG4gICAgLyoqXG4gICAgICogUmV0dXJucyBhIHZhbGlkYXRlZCBwYWdlIG51bWJlciBpbnB1dCBieSBtYWtpbmcgc3VyZSB2YWx1ZSBpcyBudW1lcmljLCBhbmQgd2l0aGluIHRoZSBib3VuZHMgb2YgdGhlIHRvdGFsIHBhZ2VzLiAgXG4gICAgICogQW4gaW52YWxpZCBpbnB1dCB3aWxsIHJldHVybiBhIHZhbHVlIG9mIDEuXG4gICAgICogQHBhcmFtIHtzdHJpbmcgfCBudW1iZXJ9IGN1cnJlbnRQYWdlIFBhZ2UgbnVtYmVyIHRvIHZhbGlkYXRlLlxuICAgICAqIEByZXR1cm5zIHtOdW1iZXJ9IFJldHVybnMgYSB2YWxpZCBwYWdlIG51bWJlciBiZXR3ZWVuIDEgYW5kIHRoZSB0b3RhbCBudW1iZXIgb2YgcGFnZXMuICBJZiB0aGUgaW5wdXQgaXMgaW52YWxpZCwgcmV0dXJucyAxLlxuICAgICAqL1xuICAgIHZhbGlkYXRlUGFnZShjdXJyZW50UGFnZSkge1xuICAgICAgICBpZiAoIU51bWJlci5pc0ludGVnZXIoY3VycmVudFBhZ2UpKSB7XG4gICAgICAgICAgICBjdXJyZW50UGFnZSA9IHBhcnNlSW50KGN1cnJlbnRQYWdlKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IHRvdGFsID0gdGhpcy50b3RhbFBhZ2VzKCk7XG4gICAgICAgIGNvbnN0IHJlc3VsdCA9IHRvdGFsIDwgY3VycmVudFBhZ2UgPyB0b3RhbCA6IGN1cnJlbnRQYWdlO1xuXG4gICAgICAgIHJldHVybiByZXN1bHQgPD0gMCA/IDEgOiByZXN1bHQ7XG4gICAgfVxuICAgIC8qKlxuICAgICAqIFJldHVybnMgdGhlIGZpcnN0IHBhZ2UgbnVtYmVyIHRvIGRpc3BsYXkgaW4gdGhlIGJ1dHRvbiBjb250cm9sIHNldCBiYXNlZCBvbiB0aGUgcGFnZSBudW1iZXIgcG9zaXRpb24gaW4gdGhlIGRhdGFzZXQuICBcbiAgICAgKiBQYWdlIG51bWJlcnMgb3V0c2lkZSBvZiB0aGlzIHJhbmdlIGFyZSByZXByZXNlbnRlZCBieSBhbiBhcnJvdy5cbiAgICAgKiBAcGFyYW0ge051bWJlcn0gY3VycmVudFBhZ2UgQ3VycmVudCBwYWdlIG51bWJlci5cbiAgICAgKiBAcmV0dXJucyB7TnVtYmVyfVxuICAgICAqL1xuICAgIGZpcnN0RGlzcGxheVBhZ2UoY3VycmVudFBhZ2UpIHtcbiAgICAgICAgY29uc3QgbWlkZGxlID0gTWF0aC5mbG9vcih0aGlzLnBhZ2VzVG9EaXNwbGF5IC8gMiArIHRoaXMucGFnZXNUb0Rpc3BsYXkgJSAyKTtcblxuICAgICAgICBpZiAoY3VycmVudFBhZ2UgPCBtaWRkbGUpIHJldHVybiAxO1xuXG4gICAgICAgIGlmICh0aGlzLnRvdGFsUGFnZXMoKSA8IChjdXJyZW50UGFnZSArIHRoaXMucGFnZXNUb0Rpc3BsYXkgLSBtaWRkbGUpKSB7XG4gICAgICAgICAgICByZXR1cm4gTWF0aC5tYXgodGhpcy50b3RhbFBhZ2VzKCkgLSB0aGlzLnBhZ2VzVG9EaXNwbGF5ICsgMSwgMSk7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gY3VycmVudFBhZ2UgLSBtaWRkbGUgKyAxO1xuICAgIH1cbiAgICAvKipcbiAgICAgKiBDcmVhdGVzIHRoZSBodG1sIGxpc3QgaXRlbSBhbmQgYnV0dG9uIGVsZW1lbnRzIGZvciB0aGUgcGFnZXIgY29udGFpbmVyJ3MgdWwgZWxlbWVudC4gIFdpbGwgYWxzbyBzZXQgdGhlIFxuICAgICAqIGB0aGlzLmN1cnJlbnRQYWdlYCBwcm9wZXJ0eSB0byB0aGUgY3VycmVudCBwYWdlIG51bWJlci5cbiAgICAgKiBAcGFyYW0ge051bWJlcn0gY3VycmVudFBhZ2UgQ3VycmVudCBwYWdlIG51bWJlci4gIEFzc3VtZXMgYSB2YWxpZCBwYWdlIG51bWJlciBpcyBwcm92aWRlZC5cbiAgICAgKiBAcGFyYW0ge0Z1bmN0aW9ufSBjYWxsYmFjayBCdXR0b24gY2xpY2sgaGFuZGxlci5cbiAgICAgKi9cbiAgICByZW5kZXIoY3VycmVudFBhZ2UsIGNhbGxiYWNrKSB7XG4gICAgICAgIGNvbnN0IHRvdGFsUGFnZXMgPSB0aGlzLnRvdGFsUGFnZXMoKTtcbiAgICAgICAgLy8gQ2xlYXIgdGhlIHByaW9yIGxpIGVsZW1lbnRzLlxuICAgICAgICB0aGlzLmVsUGFnZXIucmVwbGFjZUNoaWxkcmVuKCk7XG5cbiAgICAgICAgaWYgKHRvdGFsUGFnZXMgPD0gMSkgcmV0dXJuO1xuICAgICAgICBcbiAgICAgICAgY29uc3QgZmlyc3REaXNwbGF5ID0gdGhpcy5maXJzdERpc3BsYXlQYWdlKGN1cnJlbnRQYWdlKTtcbiAgICAgICAgY29uc3QgbWF4UGFnZXMgPSBmaXJzdERpc3BsYXkgKyB0aGlzLnBhZ2VzVG9EaXNwbGF5O1xuICAgICAgICBcbiAgICAgICAgdGhpcy5jdXJyZW50UGFnZSA9IGN1cnJlbnRQYWdlO1xuICAgICAgICB0aGlzLmVsUGFnZXIuYXBwZW5kQ2hpbGQoUGFnZXJCdXR0b25zLnN0YXJ0KGN1cnJlbnRQYWdlLCBjYWxsYmFjaykpO1xuXG4gICAgICAgIGZvciAobGV0IHBhZ2UgPSBmaXJzdERpc3BsYXk7IHBhZ2UgPD0gdG90YWxQYWdlcyAmJiBwYWdlIDwgbWF4UGFnZXM7IHBhZ2UrKykge1xuICAgICAgICAgICAgdGhpcy5lbFBhZ2VyLmFwcGVuZENoaWxkKFBhZ2VyQnV0dG9ucy5wYWdlTnVtYmVyKHBhZ2UsIGN1cnJlbnRQYWdlLCBjYWxsYmFjaykpO1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5lbFBhZ2VyLmFwcGVuZENoaWxkKFBhZ2VyQnV0dG9ucy5lbmQodG90YWxQYWdlcywgY3VycmVudFBhZ2UsIGNhbGxiYWNrKSk7XG4gICAgfVxuXG4gICAgaGFuZGxlUGFnaW5nID0gYXN5bmMgKGUpID0+IHtcbiAgICAgICAgY29uc3QgdmFsaWRQYWdlID0geyBwYWdlOiB0aGlzLnZhbGlkYXRlUGFnZShlLmN1cnJlbnRUYXJnZXQuZGF0YXNldC5wYWdlKSB9O1xuXG4gICAgICAgIGlmICh0aGlzLmNvbnRleHQuc2V0dGluZ3MucmVtb3RlUHJvY2Vzc2luZykge1xuICAgICAgICAgICAgYXdhaXQgdGhpcy5yZW5kZXJSZW1vdGUodmFsaWRQYWdlKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHRoaXMucmVuZGVyTG9jYWwodmFsaWRQYWdlKTtcbiAgICAgICAgfVxuICAgIH07XG4gICAgLyoqXG4gICAgICogSGFuZGxlciBmb3IgcmVuZGVyaW5nIHJvd3MgdXNpbmcgbG9jYWwgZGF0YSBzb3VyY2UuICBXaWxsIHNsaWNlIHRoZSBkYXRhIGFycmF5IGJhc2VkIG9uIHRoZSBjdXJyZW50IHBhZ2UgYW5kIHJvd3MgcGVyIHBhZ2Ugc2V0dGluZ3MsXG4gICAgICogdGhlbiBjYWxsIGByZW5kZXJgIHRvIHVwZGF0ZSB0aGUgcGFnZXIgY29udHJvbC4gIE9wdGlvbmFsIGFyZ3VtZW50IGBwYXJhbXNgIGlzIGFuIG9iamVjdCB0aGF0IGNhbiBjb250YWluIHRoZSBmb2xsb3dpbmcgcHJvcGVydGllczpcbiAgICAgKiAqIGBwYWdlYDpQYWdlIG51bWJlciB0byByZW5kZXIuICBJZiBub3QgcHJvdmlkZWQsIGRlZmF1bHRzIHRvIDEuXG4gICAgICogQHBhcmFtIHt7IHBhZ2U6IG51bWJlciB9IHwgbnVsbH0gcGFyYW1zIFxuICAgICAqL1xuICAgIHJlbmRlckxvY2FsID0gKHBhcmFtcyA9IHt9KSA9PiB7XG4gICAgICAgIGNvbnN0IHBhZ2UgPSAhcGFyYW1zLnBhZ2UgPyAxIDogdGhpcy52YWxpZGF0ZVBhZ2UocGFyYW1zLnBhZ2UpO1xuICAgICAgICBjb25zdCBiZWdpbiA9IChwYWdlIC0gMSkgKiB0aGlzLnJvd3NQZXJQYWdlO1xuICAgICAgICBjb25zdCBlbmQgPSBiZWdpbiArIHRoaXMucm93c1BlclBhZ2U7XG4gICAgICAgIGNvbnN0IGRhdGEgPSB0aGlzLmNvbnRleHQucGVyc2lzdGVuY2UuZGF0YS5zbGljZShiZWdpbiwgZW5kKTtcblxuICAgICAgICB0aGlzLmNvbnRleHQuZ3JpZC5yZW5kZXJSb3dzKGRhdGEsIHRoaXMuY29udGV4dC5wZXJzaXN0ZW5jZS5yb3dDb3VudCk7XG4gICAgICAgIHRoaXMudG90YWxSb3dzID0gdGhpcy5jb250ZXh0LnBlcnNpc3RlbmNlLnJvd0NvdW50O1xuICAgICAgICB0aGlzLnJlbmRlcihwYWdlLCB0aGlzLmhhbmRsZVBhZ2luZyk7XG4gICAgfTtcbiAgICAvKipcbiAgICAgKiBIYW5kbGVyIGZvciByZW5kZXJpbmcgcm93cyB1c2luZyByZW1vdGUgZGF0YSBzb3VyY2UuICBXaWxsIGNhbGwgdGhlIGBkYXRhbG9hZGVyYCB0byByZXF1ZXN0IGRhdGEgYmFzZWQgb24gdGhlIHByb3ZpZGVkIHBhcmFtcyxcbiAgICAgKiB0aGVuIGNhbGwgYHJlbmRlcmAgdG8gdXBkYXRlIHRoZSBwYWdlciBjb250cm9sLiAgT3B0aW9uYWwgYXJndW1lbnQgYHBhcmFtc2AgaXMgYW4gb2JqZWN0IHRoYXQgY2FuIGNvbnRhaW4gdGhlIGZvbGxvd2luZyBwcm9wZXJ0aWVzOlxuICAgICAqICogYHBhZ2VgOiBQYWdlIG51bWJlciB0byByZW5kZXIuICBJZiBub3QgcHJvdmlkZWQsIGRlZmF1bHRzIHRvIDEuXG4gICAgICogQHBhcmFtIHt7IHBhZ2U6IG51bWJlciB9IHwgbnVsbH0gcGFyYW1zIFxuICAgICAqL1xuICAgIHJlbmRlclJlbW90ZSA9IGFzeW5jIChwYXJhbXMgPSB7fSkgPT4ge1xuICAgICAgICBpZiAoIXBhcmFtcy5wYWdlKSBwYXJhbXMucGFnZSA9IDE7XG4gICAgICAgIFxuICAgICAgICBwYXJhbXMgPSB0aGlzLmNvbnRleHQuZXZlbnRzLmNoYWluKFwicmVtb3RlUGFyYW1zXCIsIHBhcmFtcyk7XG5cbiAgICAgICAgY29uc3QgZGF0YSA9IGF3YWl0IHRoaXMuY29udGV4dC5kYXRhbG9hZGVyLnJlcXVlc3RHcmlkRGF0YShwYXJhbXMpO1xuICAgICAgICBjb25zdCByb3dDb3VudCA9IGRhdGEucm93Q291bnQgPz8gMDtcblxuICAgICAgICB0aGlzLmNvbnRleHQuZ3JpZC5yZW5kZXJSb3dzKGRhdGEuZGF0YSwgcm93Q291bnQpO1xuICAgICAgICB0aGlzLnRvdGFsUm93cyA9IHJvd0NvdW50O1xuICAgICAgICB0aGlzLnJlbmRlcihwYXJhbXMucGFnZSwgdGhpcy5oYW5kbGVQYWdpbmcpO1xuICAgIH07XG59XG5cblBhZ2VyTW9kdWxlLm1vZHVsZU5hbWUgPSBcInBhZ2VyXCI7XG5cbmV4cG9ydCB7IFBhZ2VyTW9kdWxlIH07IiwiaW1wb3J0IHsgR3JpZENvbnRleHQgfSBmcm9tIFwiLi4vY29tcG9uZW50cy9jb250ZXh0L2dyaWRDb250ZXh0LmpzXCI7XG5pbXBvcnQgeyBNZXJnZU9wdGlvbnMgfSBmcm9tIFwiLi4vc2V0dGluZ3MvbWVyZ2VPcHRpb25zLmpzXCI7XG5pbXBvcnQgeyBTZXR0aW5nc0dyaWQgfSBmcm9tIFwiLi4vc2V0dGluZ3Mvc2V0dGluZ3NHcmlkLmpzXCI7XG5pbXBvcnQgeyBSb3dNb2R1bGUgfSBmcm9tIFwiLi4vbW9kdWxlcy9yb3cvcm93TW9kdWxlLmpzXCI7XG5pbXBvcnQgeyBQYWdlck1vZHVsZSB9IGZyb20gXCIuLi9tb2R1bGVzL3BhZ2VyL3BhZ2VyTW9kdWxlLmpzXCI7XG4vKipcbiAqIENyZWF0ZXMgZ3JpZCdzIGNvcmUgcHJvcGVydGllcyBhbmQgb2JqZWN0cywgYW5kIGFsbG93cyBmb3IgcmVnaXN0cmF0aW9uIG9mIG1vZHVsZXMgdXNlZCB0byBidWlsZCBmdW5jdGlvbmFsaXR5LlxuICogVXNlIHRoaXMgY2xhc3MgYXMgYSBiYXNlIGNsYXNzIHRvIGNyZWF0ZSBhIGdyaWQgd2l0aCBjdXN0b20gbW9kdWxhciBmdW5jdGlvbmFsaXR5IHVzaW5nIHRoZSBgZXh0ZW5kc2AgY2xhc3MgcmVmZXJlbmNlLlxuICovXG5jbGFzcyBHcmlkQ29yZSB7XG4gICAgI21vZHVsZVR5cGVzO1xuICAgICNtb2R1bGVzQ3JlYXRlZDtcbiAgICAvKipcbiAgICAqIENyZWF0ZXMgZ3JpZCdzIGNvcmUgcHJvcGVydGllcyBhbmQgb2JqZWN0cyBhbmQgaWRlbnRpZmllcyBkaXYgZWxlbWVudCB3aGljaCBncmlkIHdpbGwgYmUgYnVpbHQuICBBZnRlciBpbnN0YW50aWF0aW9uLCBcbiAgICAqIHVzZSB0aGUgYGFkZE1vZHVsZXNgIG1ldGhvZCB0byByZWdpc3RlciBkZXNpcmVkIG1vZHVsZXMgdG8gY29tcGxldGUgdGhlIHNldHVwIHByb2Nlc3MuICBNb2R1bGUgcmVnaXN0cmF0aW9uIGlzIGtlcHQgXG4gICAgKiBzZXBhcmF0ZSBmcm9tIGNvbnN0cnVjdG9yIHRvIGFsbG93IGN1c3RvbWl6YXRpb24gb2YgbW9kdWxlcyB1c2VkIHRvIGJ1aWxkIGdyaWQuXG4gICAgKiBAcGFyYW0ge3N0cmluZ30gY29udGFpbmVyIGRpdiBlbGVtZW50IElEIHRvIGJ1aWxkIGdyaWQgaW4uXG4gICAgKiBAcGFyYW0ge29iamVjdH0gc2V0dGluZ3MgVXNlciBzZXR0aW5nczsga2V5L3ZhbHVlIHBhaXJzLlxuICAgICovXG4gICAgY29uc3RydWN0b3IoY29udGFpbmVyLCBzZXR0aW5ncykge1xuICAgICAgICBjb25zdCBzb3VyY2UgPSBNZXJnZU9wdGlvbnMubWVyZ2Uoc2V0dGluZ3MpO1xuXG4gICAgICAgIHRoaXMuc2V0dGluZ3MgPSBuZXcgU2V0dGluZ3NHcmlkKHNvdXJjZSk7XG4gICAgICAgIHRoaXMuY29udGFpbmVyID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoY29udGFpbmVyKTtcbiAgICAgICAgdGhpcy5lbmFibGVQYWdpbmcgPSB0aGlzLnNldHRpbmdzLmVuYWJsZVBhZ2luZztcbiAgICAgICAgdGhpcy5pc1ZhbGlkID0gdHJ1ZTtcbiAgICAgICAgdGhpcy4jbW9kdWxlVHlwZXMgPSBbXTtcbiAgICAgICAgdGhpcy4jbW9kdWxlc0NyZWF0ZWQgPSBmYWxzZTtcbiAgICAgICAgdGhpcy5tb2R1bGVzID0ge307XG5cbiAgICAgICAgaWYgKE9iamVjdC52YWx1ZXMoc291cmNlLmNvbHVtbnMpLmxlbmd0aCA9PT0gMCkge1xuICAgICAgICAgICAgY29uc29sZS5sb2coXCJNaXNzaW5nIHJlcXVpcmVkIGNvbHVtbnMgZGVmaW5pdGlvbi5cIik7XG4gICAgICAgICAgICB0aGlzLmlzVmFsaWQgPSBmYWxzZTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGNvbnN0IGRhdGEgPSBzb3VyY2UuZGF0YSA/PyBbXTtcbiAgICAgICAgICAgIHRoaXMuI2luaXQoc291cmNlLmNvbHVtbnMsIGRhdGEpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgI2luaXQoY29sdW1ucywgZGF0YSkge1xuICAgICAgICB0aGlzLmNvbnRleHQgPSBuZXcgR3JpZENvbnRleHQoY29sdW1ucywgdGhpcy5zZXR0aW5ncywgZGF0YSk7XG5cbiAgICAgICAgdGhpcy5jb250YWluZXIuYXBwZW5kKHRoaXMuY29udGV4dC5ncmlkLnRhYmxlKTtcbiAgICB9XG4gICAgLyoqXG4gICAgICogUmVnaXN0ZXIgbW9kdWxlcyB0byBiZSB1c2VkIGluIHRoZSBidWlsZGluZyBhbmQgb3BlcmF0aW9uIG9mIHRoZSBncmlkLiAgXG4gICAgICogXG4gICAgICogTk9URTogVGhpcyBtZXRob2Qgc2hvdWxkIGJlIGNhbGxlZCBiZWZvcmUgdGhlIGBpbml0KClgIG1ldGhvZC5cbiAgICAgKiBAcGFyYW0ge2NsYXNzfSBtb2R1bGVzIENsYXNzIG1vZHVsZShzKS5cbiAgICAgKi9cbiAgICBhZGRNb2R1bGVzKC4uLm1vZHVsZXMpIHtcbiAgICAgICAgbW9kdWxlcy5mb3JFYWNoKChtKSA9PiB0aGlzLiNtb2R1bGVUeXBlcy5wdXNoKG0pKTtcbiAgICB9XG4gICAgLyoqXG4gICAgICogQWRkcyBhIG5ldyBjb2x1bW4gdG8gdGhlIGdyaWQuICBUaGUgY29sdW1uIHdpbGwgYmUgYWRkZWQgdG8gdGhlIGVuZCBvZiB0aGUgY29sdW1ucyBjb2xsZWN0aW9uIGJ5IGRlZmF1bHQsIGJ1dCBjYW4gXG4gICAgICogYmUgaW5zZXJ0ZWQgYXQgYSBzcGVjaWZpYyBpbmRleC4gIFxuICAgICAqIFxuICAgICAqIE5PVEU6IFRoaXMgbWV0aG9kIHNob3VsZCBiZSBjYWxsZWQgYmVmb3JlIHRoZSBgaW5pdCgpYCBtZXRob2QuXG4gICAgICogQHBhcmFtIHtPYmplY3R9IGNvbHVtbiBDb2x1bW4gb2JqZWN0IGRlZmluaXRpb24uXG4gICAgICogQHBhcmFtIHtudW1iZXJ9IFtpbmRleFBvc2l0aW9uPW51bGxdIEluZGV4IHRvIGluc2VydCB0aGUgY29sdW1uIGF0LiBJZiBudWxsLCBhcHBlbmRzIHRvIHRoZSBlbmQuXG4gICAgICovXG4gICAgYWRkQ29sdW1uKGNvbHVtbiwgaW5kZXhQb3NpdGlvbiA9IG51bGwpIHtcbiAgICAgICAgdGhpcy5jb250ZXh0LmNvbHVtbk1hbmFnZXIuYWRkQ29sdW1uKGNvbHVtbiwgaW5kZXhQb3NpdGlvbik7XG4gICAgfVxuICAgIC8qKlxuICAgICAqIEl0ZXJhdGVzIHRob3VnaCBhIGxpc3Qgb2YgbW9kdWxlcyB0byBpbnN0YW50aWF0ZSBhbmQgaW5pdGlhbGl6ZSBzdGFydCB1cCBhbmQvb3IgYnVpbGQgYmVoYXZpb3IuICBTaG91bGQgYmUgY2FsbGVkIGFmdGVyIFxuICAgICAqIGFsbCBtb2R1bGVzIGhhdmUgYmVlbiByZWdpc3RlcmVkIHVzaW5nIHRoZSBgYWRkTW9kdWxlc2AgbWV0aG9kLCBhbmQgb25seSBuZWVkcyB0byBiZSBjYWxsZWQgb25jZS5cbiAgICAgKi9cbiAgICAjaW5pdE1vZHVsZXMgPSBhc3luYyAoKSA9PiB7XG4gICAgICAgIGlmICh0aGlzLiNtb2R1bGVzQ3JlYXRlZClcbiAgICAgICAgICAgIHJldHVybjtcblxuICAgICAgICAvL1ZlcmlmeSBpZiBiYXNlIHJlcXVpcmVkIHJvdyByZWxhdGVkIG1vZHVsZSBoYXMgYmVlbiBhZGRlZCB0byB0aGUgZ3JpZC5cbiAgICAgICAgaWYgKHRoaXMuc2V0dGluZ3MuZW5hYmxlUGFnaW5nICYmICF0aGlzLiNtb2R1bGVUeXBlcy5zb21lKCh4KSA9PiB4Lm1vZHVsZU5hbWUgPT09IFwicGFnZVwiKSkge1xuICAgICAgICAgICAgdGhpcy4jbW9kdWxlVHlwZXMucHVzaChQYWdlck1vZHVsZSk7XG4gICAgICAgIH0gZWxzZSBpZiAoIXRoaXMuI21vZHVsZVR5cGVzLnNvbWUoKHgpID0+IHgubW9kdWxlTmFtZSA9PT0gXCJyb3dcIikpIHtcbiAgICAgICAgICAgICB0aGlzLiNtb2R1bGVUeXBlcy5wdXNoKFJvd01vZHVsZSk7XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLiNtb2R1bGVUeXBlcy5mb3JFYWNoKChtKSA9PiB7XG4gICAgICAgICAgICB0aGlzLmNvbnRleHQubW9kdWxlc1ttLm1vZHVsZU5hbWVdID0gbmV3IG0odGhpcy5jb250ZXh0KTtcbiAgICAgICAgICAgIHRoaXMuY29udGV4dC5tb2R1bGVzW20ubW9kdWxlTmFtZV0uaW5pdGlhbGl6ZSgpO1xuICAgICAgICB9KTtcblxuICAgICAgICB0aGlzLiNtb2R1bGVzQ3JlYXRlZCA9IHRydWU7XG4gICAgICAgIGF3YWl0IHRoaXMuY29udGV4dC5ldmVudHMudHJpZ2dlcihcInBvc3RJbml0TW9kXCIpO1xuICAgIH07XG4gICAgLyoqXG4gICAgICogSW5zdGFudGlhdGVzIHRoZSBjcmVhdGlvbiBvZiB0aGUgZ3JpZC4gIE1ldGhvZCB3aWxsIGNyZWF0ZSB0aGUgZ3JpZCdzIGVsZW1lbnRzLCBydW4gYWxsIHJlZ2lzdGVyZWQgbW9kdWxlcywgZGF0YSBwcm9jZXNzaW5nIFxuICAgICAqIHBpcGVsaW5lcyBhbmQgZXZlbnRzLiAgSWYgZ3JpZCBpcyBiZWluZyBidWlsdCB1c2luZyB0aGUgbW9kdWxhciBhcHByb2FjaCwgYmUgc3VyZSB0byBjYWxsIHRoZSBgYWRkTW9kdWxlc2AgbWV0aG9kIGJlZm9yZSBcbiAgICAgKiBjYWxsaW5nIHRoaXMgb25lIHRvIGVuc3VyZSBhbGwgbW9kdWxlcyBhcmUgcmVnaXN0ZXJlZCBhbmQgaW5pdGlhbGl6ZWQgaW4gdGhlaXIgcHJvcGVyIG9yZGVyLlxuICAgICAqIFxuICAgICAqIE5PVEU6IE1ldGhvZCB3aWxsIGF1dG9tYXRpY2FsbHkgcmVnaXN0ZXIgdGhlIGBQYWdlck1vZHVsZWAgaWYgcGFnaW5nIGlzIGVuYWJsZWQsIG9yIHRoZSBgUm93TW9kdWxlYCBpZiBwYWdpbmcgaXMgbm90IGVuYWJsZWQuXG4gICAgICovXG4gICAgYXN5bmMgaW5pdCgpIHtcbiAgICAgICAgaWYgKCF0aGlzLmlzVmFsaWQpIHtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiTWlzc2luZyByZXF1aXJlZCBjb2x1bW5zIGRlZmluaXRpb24uXCIpO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5jb250ZXh0LmdyaWQuaW5pdGlhbGl6ZUhlYWRlcigpO1xuXG4gICAgICAgIGF3YWl0IHRoaXMuI2luaXRNb2R1bGVzKCk7XG5cbiAgICAgICAgaWYgKCF0aGlzLnNldHRpbmdzLnJlbW90ZVByb2Nlc3NpbmcgJiYgdGhpcy5zZXR0aW5ncy5yZW1vdGVVcmwpIHtcbiAgICAgICAgICAgIC8vbG9jYWwgZGF0YSBzb3VyY2UgcHJvY2Vzc2luZzsgc2V0IHBpcGVsaW5lIGFjdGlvbnMuXG4gICAgICAgICAgICB0aGlzLmNvbnRleHQucGlwZWxpbmUuYWRkU3RlcChcImluaXRcIiwgdGhpcy5jb250ZXh0LnBlcnNpc3RlbmNlLnNldERhdGEpO1xuICAgICAgICB9XG4gICAgICAgIC8vZXhlY3V0ZSBkYXRhIHBpcGVsaW5lIGJlZm9yZSBidWlsZGluZyBlbGVtZW50cy5cbiAgICAgICAgaWYgKHRoaXMuY29udGV4dC5waXBlbGluZS5oYXNQaXBlbGluZShcImluaXRcIikpIHtcbiAgICAgICAgICAgIGF3YWl0IHRoaXMuY29udGV4dC5waXBlbGluZS5leGVjdXRlKFwiaW5pdFwiKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGF3YWl0IHRoaXMuY29udGV4dC5ldmVudHMudHJpZ2dlcihcInJlbmRlclwiKTtcbiAgICB9XG4gICAgLyoqXG4gICAgICogQXBwbHkgZmlsdGVyIGNvbmRpdGlvbiBmb3IgdGFyZ2V0IGNvbHVtbi4gIE1ldGhvZCBwcm92aWRlcyBhIG1lYW5zIHRvIGFwcGx5IGNvbmRpdGlvbiBvdXRzaWRlIG9mIGhlYWRlciBmaWx0ZXIgY29udHJvbHMuXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IGZpZWxkIFRhcmdldCBmaWVsZC5cbiAgICAgKiBAcGFyYW0ge29iamVjdH0gdmFsdWUgRmlsdGVyIHZhbHVlLlxuICAgICAqIEBwYXJhbSB7c3RyaW5nIHwgRnVuY3Rpb259IFt0eXBlPVwiZXF1YWxzXCJdIEZpbHRlciB0eXBlLiAgSWYgYSBmdW5jdGlvbiBpcyBwcm92aWRlZCwgaXQgd2lsbCBiZSB1c2VkIGFzIHRoZSBmaWx0ZXIgY29uZGl0aW9uLlxuICAgICAqIE90aGVyd2lzZSwgdXNlIHRoZSBhc3NvY2lhdGVkIHN0cmluZyB2YWx1ZSB0eXBlIHRvIGRldGVybWluZSB0aGUgZmlsdGVyIGNvbmRpdGlvbi4gIGkuZS4gXCJlcXVhbHNcIiwgXCJjb250YWluc1wiLCBldGMuXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IFtmaWVsZFR5cGU9XCJzdHJpbmdcIl0gRmllbGQgdHlwZS5cbiAgICAgKiBAcGFyYW0ge29iamVjdH0gW2ZpbHRlclBhcmFtcz17fV0gQWRkaXRpb25hbCBmaWx0ZXIgcGFyYW1ldGVycy5cbiAgICAgKi9cbiAgICBzZXRGaWx0ZXIgPSBhc3luYyAoZmllbGQsIHZhbHVlLCB0eXBlID0gXCJlcXVhbHNcIiwgZmllbGRUeXBlID0gXCJzdHJpbmdcIiwgZmlsdGVyUGFyYW1zID0ge30pID0+IHtcbiAgICAgICAgaWYgKHRoaXMuY29udGV4dC5tb2R1bGVzLmZpbHRlcikge1xuICAgICAgICAgICAgdGhpcy5jb250ZXh0Lm1vZHVsZXMuZmlsdGVyLnNldEZpbHRlcihmaWVsZCwgdmFsdWUsIHR5cGUsIGZpZWxkVHlwZSwgZmlsdGVyUGFyYW1zKTtcblxuICAgICAgICAgICAgYXdhaXQgdGhpcy5jb250ZXh0LmV2ZW50cy50cmlnZ2VyKFwicmVuZGVyXCIpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgY29uc29sZS53YXJuKFwiRmlsdGVyIG1vZHVsZSBpcyBub3QgZW5hYmxlZC4gIFNldCBgRGF0YUdyaWQuZGVmYXVsdE9wdGlvbnMuZW5hYmxlRmlsdGVyYCB0byB0cnVlIGluIG9yZGVyIHRvIGVuYWJsZSB0aGlzIGZ1bmN0aW9uLlwiKTtcbiAgICAgICAgfVxuICAgIH07XG4gICAgLyoqXG4gICAgICogUmVtb3ZlIGZpbHRlciBjb25kaXRpb24gZm9yIHRhcmdldCBmaWVsZC5cbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gZmllbGQgVGFyZ2V0IGZpZWxkLlxuICAgICAqL1xuICAgIHJlbW92ZUZpbHRlciA9IGFzeW5jIChmaWVsZCkgPT4ge1xuICAgICAgICBpZiAodGhpcy5jb250ZXh0Lm1vZHVsZXMuZmlsdGVyKSB7XG4gICAgICAgICAgICB0aGlzLmNvbnRleHQubW9kdWxlcy5maWx0ZXIucmVtb3ZlRmlsdGVyKGZpZWxkKTtcblxuICAgICAgICAgICAgYXdhaXQgdGhpcy5jb250ZXh0LmV2ZW50cy50cmlnZ2VyKFwicmVuZGVyXCIpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgY29uc29sZS53YXJuKFwiRmlsdGVyIG1vZHVsZSBpcyBub3QgZW5hYmxlZC4gIFNldCBgRGF0YUdyaWQuZGVmYXVsdE9wdGlvbnMuZW5hYmxlRmlsdGVyYCB0byB0cnVlIGluIG9yZGVyIHRvIGVuYWJsZSB0aGlzIGZ1bmN0aW9uLlwiKTtcbiAgICAgICAgfVxuICAgIH07XG59XG5cbmV4cG9ydCB7IEdyaWRDb3JlIH07IiwiLyoqXG4gKiBQcm92aWRlcyBsb2dpYyB0byBjb252ZXJ0IGdyaWQgZGF0YSBpbnRvIGEgZG93bmxvYWRhYmxlIENTViBmaWxlLlxuICogTW9kdWxlIHdpbGwgcHJvdmlkZSBsaW1pdGVkIGZvcm1hdHRpbmcgb2YgZGF0YS4gIE9ubHkgY29sdW1ucyB3aXRoIGEgZm9ybWF0dGVyIHR5cGUgXG4gKiBvZiBgbW9kdWxlYCBvciBgZnVuY3Rpb25gIHdpbGwgYmUgcHJvY2Vzc2VkLiAgQWxsIG90aGVyIGNvbHVtbnMgd2lsbCBiZSByZXR1cm5lZCBhc1xuICogdGhlaXIgcmF3IGRhdGEgdHlwZS4gIElmIGEgY29sdW1uJ3MgdmFsdWUgY29udGFpbnMgYSBjb21tYSwgdGhlIHZhbHVlIHdpbGwgYmUgZG91YmxlIHF1b3RlZC5cbiAqL1xuY2xhc3MgQ3N2TW9kdWxlIHtcbiAgICAvKipcbiAgICAgKiBBbGxvd3MgZ3JpZCdzIGRhdGEgdG8gYmUgY29udmVydGVkIGludG8gYSBkb3dubG9hZGFibGUgQ1NWIGZpbGUuICBJZiBncmlkIGlzIFxuICAgICAqIHNldCB0byBhIGxvY2FsIGRhdGEgc291cmNlLCB0aGUgZGF0YSBjYWNoZSBpbiB0aGUgcGVyc2lzdGVuY2UgY2xhc3MgaXMgdXNlZC5cbiAgICAgKiBPdGhlcndpc2UsIGNsYXNzIHdpbGwgbWFrZSBhbiBBamF4IGNhbGwgdG8gcmVtb3RlIHRhcmdldCBzZXQgaW4gZGF0YSBsb2FkZXJcbiAgICAgKiBjbGFzcy5cbiAgICAgKiBAcGFyYW0ge0dyaWRDb250ZXh0fSBjb250ZXh0IEdyaWQgY29udGV4dCBjbGFzcy5cbiAgICAgKi9cbiAgICBjb25zdHJ1Y3Rvcihjb250ZXh0KSB7XG4gICAgICAgIHRoaXMuY29udGV4dCA9IGNvbnRleHQ7XG4gICAgICAgIHRoaXMuZGVsaW1pdGVyID0gXCIsXCI7XG4gICAgICAgIHRoaXMuYnV0dG9uID0gY29udGV4dC5zZXR0aW5ncy5jc3ZFeHBvcnRJZDtcbiAgICAgICAgdGhpcy5kYXRhVXJsID0gY29udGV4dC5zZXR0aW5ncy5jc3ZFeHBvcnRSZW1vdGVTb3VyY2U7XG4gICAgfVxuXG4gICAgaW5pdGlhbGl6ZSgpIHtcbiAgICAgICAgY29uc3QgYnRuID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQodGhpcy5idXR0b24pO1xuICAgICAgICBcbiAgICAgICAgYnRuLmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCB0aGlzLmhhbmRsZURvd25sb2FkKTtcbiAgICB9XG5cbiAgICBoYW5kbGVEb3dubG9hZCA9IGFzeW5jICgpID0+IHtcbiAgICAgICAgbGV0IGNzdkRhdGEgPSBbXTtcbiAgICAgICAgY29uc3QgZmlsZU5hbWUgPSBgJHtkb2N1bWVudC50aXRsZX0uY3N2YDtcblxuICAgICAgICBpZiAodGhpcy5kYXRhVXJsKSB7XG4gICAgICAgICAgICBjb25zdCBkYXRhID0gYXdhaXQgdGhpcy5jb250ZXh0LmRhdGFsb2FkZXIucmVxdWVzdERhdGEodGhpcy5kYXRhVXJsKTtcblxuICAgICAgICAgICAgY3N2RGF0YSA9IHRoaXMuYnVpbGRGaWxlQ29udGVudChkYXRhKS5qb2luKFwiXFxyXFxuXCIpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgY3N2RGF0YSA9IHRoaXMuYnVpbGRGaWxlQ29udGVudCh0aGlzLmNvbnRleHQucGVyc2lzdGVuY2UuZGF0YUNhY2hlKS5qb2luKFwiXFxyXFxuXCIpO1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc3QgYmxvYiA9IG5ldyBCbG9iKFtjc3ZEYXRhXSwgeyB0eXBlOiBcInRleHQvY3N2O2NoYXJzZXQ9dXRmLTg7XCIgfSk7XG4gICAgICAgIGNvbnN0IGVsZW1lbnQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiYVwiKTtcblxuICAgICAgICBlbGVtZW50LnNldEF0dHJpYnV0ZShcImhyZWZcIiwgd2luZG93LlVSTC5jcmVhdGVPYmplY3RVUkwoYmxvYikpO1xuICAgICAgICAvL3NldCBmaWxlIHRpdGxlXG4gICAgICAgIGVsZW1lbnQuc2V0QXR0cmlidXRlKFwiZG93bmxvYWRcIiwgZmlsZU5hbWUpO1xuICAgICAgICAvL3RyaWdnZXIgZG93bmxvYWRcbiAgICAgICAgZWxlbWVudC5zdHlsZS5kaXNwbGF5ID0gXCJub25lXCI7XG4gICAgICAgIGRvY3VtZW50LmJvZHkuYXBwZW5kQ2hpbGQoZWxlbWVudCk7XG4gICAgICAgIGVsZW1lbnQuY2xpY2soKTtcbiAgICAgICAgLy9yZW1vdmUgdGVtcG9yYXJ5IGxpbmsgZWxlbWVudFxuICAgICAgICBkb2N1bWVudC5ib2R5LnJlbW92ZUNoaWxkKGVsZW1lbnQpO1xuXG4gICAgICAgIHdpbmRvdy5hbGVydChgRG93bmxvYWRlZCAke2ZpbGVOYW1lfWApO1xuICAgIH07XG4gICAgLyoqXG4gICAgICogUmV0dXJucyBhbiBvYmplY3QgdGhhdCByZXByZXNlbnRzIHRoZSBjb2x1bW5zIGFuZCBoZWFkZXIgbmFtZXMgdGhhdCBzaG91bGQgYmUgdXNlZFxuICAgICAqIHRvIGNyZWF0ZSB0aGUgQ1NWIHJlc3VsdHMuICBXaWxsIGV4Y2x1ZGUgY29sdW1ucyB3aXRoIGEgdHlwZSBvZiBgaWNvbmAuXG4gICAgICogQHBhcmFtIHtPYmplY3R9IGNvbHVtbk1nckNvbHVtbnMgQ29sdW1uIE1hbmFnZXIgQ29sdW1ucyBjb2xsZWN0aW9uLlxuICAgICAqIEByZXR1cm5zIHt7IGhlYWRlcnM6IEFycmF5PHN0cmluZz4sIGNvbHVtbnM6IEFycmF5PENvbHVtbj4gfX1cbiAgICAgKi9cbiAgICBpZGVudGlmeUNvbHVtbnMoY29sdW1uTWdyQ29sdW1ucykge1xuICAgICAgICBjb25zdCBoZWFkZXJzID0gW107XG4gICAgICAgIGNvbnN0IGNvbHVtbnMgPSBbXTtcblxuICAgICAgICBmb3IgKGNvbnN0IGNvbHVtbiBvZiBjb2x1bW5NZ3JDb2x1bW5zKSB7XG4gICAgICAgICAgICBpZiAoY29sdW1uLnR5cGUgPT09IFwiaWNvblwiKSBjb250aW51ZTtcblxuICAgICAgICAgICAgaGVhZGVycy5wdXNoKGNvbHVtbi5sYWJlbCk7XG4gICAgICAgICAgICBjb2x1bW5zLnB1c2goY29sdW1uKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiB7IGhlYWRlcnM6IGhlYWRlcnMsIGNvbHVtbnM6IGNvbHVtbnMgfTsgXG4gICAgfVxuICAgIC8qKlxuICAgICAqIENvbnZlcnRzIGdyaWQgZGF0YSBpbiBEYXRhUGVyc2lzdGVuY2UgY2xhc3MgaW50byBhIHNpbmdsZSBkaW1lbnNpb25hbCBhcnJheSBvZlxuICAgICAqIHN0cmluZyBkZWxpbWl0ZWQgdmFsdWVzIHRoYXQgcmVwcmVzZW50cyBhIHJvdyBvZiBkYXRhIGluIGEgY3N2IGZpbGUuIFxuICAgICAqIEBwYXJhbSB7QXJyYXk8T2JqZWN0Pn0gZGF0YXNldCBkYXRhIHNldCB0byBidWlsZCBjc3Ygcm93cy5cbiAgICAgKiBAcmV0dXJucyB7QXJyYXk8c3RyaW5nPn1cbiAgICAgKi9cbiAgICBidWlsZEZpbGVDb250ZW50KGRhdGFzZXQpIHtcbiAgICAgICAgY29uc3QgZmlsZUNvbnRlbnRzID0gW107XG4gICAgICAgIGNvbnN0IGNvbHVtbnMgPSB0aGlzLmlkZW50aWZ5Q29sdW1ucyh0aGlzLmNvbnRleHQuY29sdW1uTWFuYWdlci5jb2x1bW5zKTtcbiAgICAgICAgLy9jcmVhdGUgZGVsaW1pdGVkIGhlYWRlci5cbiAgICAgICAgZmlsZUNvbnRlbnRzLnB1c2goY29sdW1ucy5oZWFkZXJzLmpvaW4odGhpcy5kZWxpbWl0ZXIpKTtcbiAgICAgICAgLy9jcmVhdGUgcm93IGRhdGFcbiAgICAgICAgZm9yIChjb25zdCByb3dEYXRhIG9mIGRhdGFzZXQpIHtcbiAgICAgICAgICAgIGNvbnN0IHJlc3VsdCA9IGNvbHVtbnMuY29sdW1ucy5tYXAoKGMpID0+IHRoaXMuZm9ybWF0VmFsdWUoYywgcm93RGF0YSkpO1xuXG4gICAgICAgICAgICBmaWxlQ29udGVudHMucHVzaChyZXN1bHQuam9pbih0aGlzLmRlbGltaXRlcikpO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIGZpbGVDb250ZW50cztcbiAgICB9XG4gICAgLyoqXG4gICAgICogUmV0dXJucyBhIGZvcm1hdHRlZCBzdHJpbmcgYmFzZWQgb24gdGhlIENvbHVtbidzIGZvcm1hdHRlciBzZXR0aW5nLlxuICAgICAqIFdpbGwgZG91YmxlIHF1b3RlIHN0cmluZyBpZiBjb21tYSBjaGFyYWN0ZXIgaXMgZm91bmQgaW4gdmFsdWUuXG4gICAgICogQHBhcmFtIHtDb2x1bW59IGNvbHVtbiBjb2x1bW4gbW9kZWwuXG4gICAgICogQHBhcmFtIHtPYmplY3R9IHJvd0RhdGEgcm93IGRhdGEuXG4gICAgICogQHJldHVybnMge3N0cmluZ31cbiAgICAgKi9cbiAgICBmb3JtYXRWYWx1ZShjb2x1bW4sIHJvd0RhdGEpIHtcbiAgICAgICAgbGV0IHZhbHVlID0gU3RyaW5nKHJvd0RhdGFbY29sdW1uLmZpZWxkXSk7XG4gICAgICAgIC8vYXBwbHkgbGltaXRlZCBmb3JtYXR0aW5nOyBjc3YgcmVzdWx0cyBzaG91bGQgYmUgJ3JhdycgZGF0YS5cbiAgICAgICAgaWYgKGNvbHVtbi5mb3JtYXR0ZXIpIHtcbiAgICAgICAgICAgIGlmICh0eXBlb2YgY29sdW1uLmZvcm1hdHRlciA9PT0gXCJmdW5jdGlvblwiKSB7XG4gICAgICAgICAgICAgICAgdmFsdWUgPSBTdHJpbmcoY29sdW1uLmZvcm1hdHRlcihyb3dEYXRhLCBjb2x1bW4uZm9ybWF0dGVyUGFyYW1zKSk7XG4gICAgICAgICAgICB9IGVsc2UgaWYgKGNvbHVtbi5mb3JtYXR0ZXIgPT09IFwibW9kdWxlXCIpIHtcbiAgICAgICAgICAgICAgICB2YWx1ZSA9IFN0cmluZyh0aGlzLmNvbnRleHQubW9kdWxlc1tjb2x1bW4uZm9ybWF0dGVyUGFyYW1zLm5hbWVdLmFwcGx5KHJvd0RhdGEsIGNvbHVtbiwgXCJjc3ZcIikpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIC8vY2hlY2sgZm9yIHN0cmluZ3MgdGhhdCBtYXkgbmVlZCB0byBiZSBxdW90ZWQuXG4gICAgICAgIGlmICh2YWx1ZS5pbmNsdWRlcyhcIixcIikpIHtcbiAgICAgICAgICAgIHZhbHVlID0gYFwiJHt2YWx1ZX1cImA7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gdmFsdWU7XG4gICAgfVxufVxuXG5Dc3ZNb2R1bGUubW9kdWxlTmFtZSA9IFwiY3N2XCI7XG5cbmV4cG9ydCB7IENzdk1vZHVsZSB9OyIsIi8qKlxuICogQ2xhc3MgdGhhdCBkZWZpbmVzIGEgc2luZ2xlIGZpbHRlciBjb25kaXRpb24gZm9yIGEgY29sdW1uLlxuICovXG5jbGFzcyBGaWx0ZXJUYXJnZXQge1xuICAgIC8qKlxuICAgICAqIENyZWF0ZXMgZmlsdGVyIHRhcmdldCBvYmplY3QgdGhhdCBkZWZpbmVzIGEgc2luZ2xlIGZpbHRlciBjb25kaXRpb24uICBFeHBlY3RzIGFuIG9iamVjdCB3aXRoIHRoZSBmb2xsb3dpbmcgcHJvcGVydGllczpcbiAgICAgKiAqIGB2YWx1ZWA6IFRoZSB2YWx1ZSB0byBmaWx0ZXIgYWdhaW5zdC4gIEV4cGVjdHMgdGhhdCB2YWx1ZSBtYXRjaGVzIHRoZSB0eXBlIG9mIHRoZSBmaWVsZCBiZWluZyBmaWx0ZXJlZC4gIFNob3VsZCBiZSBudWxsIGlmIFxuICAgICAqIHZhbHVlIHR5cGUgY2Fubm90IGJlIGNvbnZlcnRlZCB0byB0aGUgZmllbGQgdHlwZS5cbiAgICAgKiAqIGBmaWVsZGA6IFRoZSBmaWVsZCBuYW1lIG9mIHRoZSBjb2x1bW4gYmVpbmcgZmlsdGVyZWQuICBUaGlzIGlzIHVzZWQgdG8gaWRlbnRpZnkgdGhlIGNvbHVtbiBpbiB0aGUgZGF0YSBzZXQuXG4gICAgICogKiBgZmllbGRUeXBlYDogVGhlIHR5cGUgb2YgZmllbGQgYmVpbmcgZmlsdGVyZWQgKGUuZy4sIFwic3RyaW5nXCIsIFwibnVtYmVyXCIsIFwiZGF0ZVwiLCBcIm9iamVjdFwiKS4gIFRoaXMgaXMgdXNlZCB0byBkZXRlcm1pbmUgaG93IHRvIGNvbXBhcmUgdGhlIHZhbHVlLlxuICAgICAqICogYGZpbHRlclR5cGVgOiBUaGUgdHlwZSBvZiBmaWx0ZXIgdG8gYXBwbHkgKGUuZy4sIFwiZXF1YWxzXCIsIFwibGlrZVwiLCBcIjxcIiwgXCI8PVwiLCBcIj5cIiwgXCI+PVwiLCBcIiE9XCIsIFwiYmV0d2VlblwiLCBcImluXCIpLlxuICAgICAqIEBwYXJhbSB7eyB2YWx1ZTogKHN0cmluZyB8IG51bWJlciB8IERhdGUgfCBPYmplY3QgfCBudWxsKSwgZmllbGQ6IHN0cmluZywgZmllbGRUeXBlOiBzdHJpbmcsIGZpbHRlclR5cGU6IHN0cmluZyB9fSB0YXJnZXQgXG4gICAgICovXG4gICAgY29uc3RydWN0b3IodGFyZ2V0KSB7XG4gICAgICAgIHRoaXMudmFsdWUgPSB0YXJnZXQudmFsdWU7XG4gICAgICAgIHRoaXMuZmllbGQgPSB0YXJnZXQuZmllbGQ7XG4gICAgICAgIHRoaXMuZmllbGRUeXBlID0gdGFyZ2V0LmZpZWxkVHlwZSB8fCBcInN0cmluZ1wiOyAvLyBEZWZhdWx0IHRvIHN0cmluZyBpZiBub3QgcHJvdmlkZWRcbiAgICAgICAgdGhpcy5maWx0ZXJUeXBlID0gdGFyZ2V0LmZpbHRlclR5cGU7XG4gICAgICAgIHRoaXMuZmlsdGVycyA9IHRoaXMuI2luaXQoKTtcbiAgICB9XG5cbiAgICAjaW5pdCgpIHtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIC8vZXF1YWwgdG9cbiAgICAgICAgICAgIFwiZXF1YWxzXCI6IGZ1bmN0aW9uKGZpbHRlclZhbCwgcm93VmFsKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGZpbHRlclZhbCA9PT0gcm93VmFsO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIC8vbGlrZVxuICAgICAgICAgICAgXCJsaWtlXCI6IGZ1bmN0aW9uKGZpbHRlclZhbCwgcm93VmFsKSB7XG4gICAgICAgICAgICAgICAgaWYgKHJvd1ZhbCA9PT0gdW5kZWZpbmVkIHx8IHJvd1ZhbCA9PT0gbnVsbCB8fCByb3dWYWwgPT09IFwiXCIpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgICAgICAgICAgcmV0dXJuIFN0cmluZyhyb3dWYWwpLnRvTG93ZXJDYXNlKCkuaW5kZXhPZihmaWx0ZXJWYWwudG9Mb3dlckNhc2UoKSkgPiAtMTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAvL2xlc3MgdGhhblxuICAgICAgICAgICAgXCI8XCI6IGZ1bmN0aW9uKGZpbHRlclZhbCwgcm93VmFsKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGZpbHRlclZhbCA8IHJvd1ZhbDtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAvL2xlc3MgdGhhbiBvciBlcXVhbCB0b1xuICAgICAgICAgICAgXCI8PVwiOiBmdW5jdGlvbihmaWx0ZXJWYWwsIHJvd1ZhbCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBmaWx0ZXJWYWwgPD0gcm93VmFsO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIC8vZ3JlYXRlciB0aGFuXG4gICAgICAgICAgICBcIj5cIjogZnVuY3Rpb24oZmlsdGVyVmFsLCByb3dWYWwpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gZmlsdGVyVmFsID4gcm93VmFsO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIC8vZ3JlYXRlciB0aGFuIG9yIGVxdWFsIHRvXG4gICAgICAgICAgICBcIj49XCI6IGZ1bmN0aW9uKGZpbHRlclZhbCwgcm93VmFsKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGZpbHRlclZhbCA+PSByb3dWYWw7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgLy9ub3QgZXF1YWwgdG9cbiAgICAgICAgICAgIFwiIT1cIjogZnVuY3Rpb24oZmlsdGVyVmFsLCByb3dWYWwpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcm93VmFsICE9PSBmaWx0ZXJWYWw7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgLy8gYmV0d2Vlbi4gIGV4cGVjdHMgZmlsdGVyVmFsIHRvIGJlIGFuIGFycmF5IG9mOiBbIHtzdGFydCB2YWx1ZX0sIHsgZW5kIHZhbHVlIH0gXSBcbiAgICAgICAgICAgIFwiYmV0d2VlblwiOiBmdW5jdGlvbihmaWx0ZXJWYWwsIHJvd1ZhbCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByb3dWYWwgPj0gZmlsdGVyVmFsWzBdICYmIHJvd1ZhbCA8PSBmaWx0ZXJWYWxbMV07XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgLy9pbiBhcnJheS5cbiAgICAgICAgICAgIFwiaW5cIjogZnVuY3Rpb24oZmlsdGVyVmFsLCByb3dWYWwpIHtcbiAgICAgICAgICAgICAgICBpZiAoQXJyYXkuaXNBcnJheShmaWx0ZXJWYWwpKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBmaWx0ZXJWYWwubGVuZ3RoID8gZmlsdGVyVmFsLmluZGV4T2Yocm93VmFsKSA+IC0xIDogdHJ1ZTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLndhcm4oXCJGaWx0ZXIgRXJyb3IgLSBmaWx0ZXIgdmFsdWUgaXMgbm90IGFuIGFycmF5OlwiLCBmaWx0ZXJWYWwpO1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuICAgIH1cbiAgICAvKipcbiAgICAgKiBFeGVjdXRlcyBhbiBpbnRlcm5hbCBmdW5jdGlvbiB0byBpbmRpY2F0ZSBpZiB0aGUgY3VycmVudCByb3cgdmFsdWVzIG1hdGNoZXMgdGhlIGZpbHRlciBjcml0ZXJpYSdzIHZhbHVlLiAgXG4gICAgICogQHBhcmFtIHtPYmplY3R9IHJvd1ZhbCBSb3cgY29sdW1uIHZhbHVlLiAgRXhwZWN0cyBhIHZhbHVlIHRoYXQgbWF0Y2hlcyB0aGUgdHlwZSBpZGVudGlmaWVkIGJ5IHRoZSBjb2x1bW4uXG4gICAgICogQHBhcmFtIHtPYmplY3Q8QXJyYXk+fSByb3cgQ3VycmVudCBkYXRhIHNldCByb3cuXG4gICAgICogQHJldHVybnMge2Jvb2xlYW59IFJldHVybnMgdHJ1ZSBpZiByb3cgdmFsdWUgbWF0Y2hlcyBmaWx0ZXIgdmFsdWUuICBPdGhlcndpc2UsIGZhbHNlIGluZGljYXRpbmcgbm8gbWF0Y2guXG4gICAgICovXG4gICAgZXhlY3V0ZShyb3dWYWwsIHJvdykge1xuICAgICAgICByZXR1cm4gdGhpcy5maWx0ZXJzW3RoaXMuZmlsdGVyVHlwZV0odGhpcy52YWx1ZSwgcm93VmFsKTtcbiAgICB9XG59XG5cbmV4cG9ydCB7IEZpbHRlclRhcmdldCB9OyIsImltcG9ydCB7IERhdGVIZWxwZXIgfSBmcm9tIFwiLi4vLi4vLi4vY29tcG9uZW50cy9oZWxwZXJzL2RhdGVIZWxwZXIuanNcIjtcbi8qKlxuICogQ2xhc3MgdGhhdCBkZWZpbmVzIGEgc2luZ2xlIGZpbHRlciBjb25kaXRpb24gZm9yIGEgZGF0ZSBjb2x1bW4uXG4gKi9cbmNsYXNzIEZpbHRlckRhdGUge1xuICAgIC8qKlxuICAgICAqIENyZWF0ZXMgZmlsdGVyIHRhcmdldCBvYmplY3QgdGhhdCBkZWZpbmVzIGEgc2luZ2xlIGZpbHRlciBjb25kaXRpb24gZm9yIGEgZGF0ZSBkYXRhIHR5cGUuICBFeHBlY3RzIGFuIG9iamVjdCB3aXRoIHRoZSBmb2xsb3dpbmcgcHJvcGVydGllczpcbiAgICAgKiAqIGB2YWx1ZWA6IFRoZSB2YWx1ZSB0byBmaWx0ZXIgYWdhaW5zdC4gIEV4cGVjdHMgdGhhdCB2YWx1ZSBtYXRjaGVzIHRoZSB0eXBlIG9mIHRoZSBmaWVsZCBiZWluZyBmaWx0ZXJlZC4gIFNob3VsZCBiZSBudWxsIGlmIFxuICAgICAqIHZhbHVlIHR5cGUgY2Fubm90IGJlIGNvbnZlcnRlZCB0byB0aGUgZmllbGQgdHlwZS5cbiAgICAgKiAqIGBmaWVsZGA6IFRoZSBmaWVsZCBuYW1lIG9mIHRoZSBjb2x1bW4gYmVpbmcgZmlsdGVyZWQuICBUaGlzIGlzIHVzZWQgdG8gaWRlbnRpZnkgdGhlIGNvbHVtbiBpbiB0aGUgZGF0YSBzZXQuXG4gICAgICogKiBgZmlsdGVyVHlwZWA6IFRoZSB0eXBlIG9mIGZpbHRlciB0byBhcHBseSAoZS5nLiwgXCJlcXVhbHNcIiwgXCJsaWtlXCIsIFwiPFwiLCBcIjw9XCIsIFwiPlwiLCBcIj49XCIsIFwiIT1cIiwgXCJiZXR3ZWVuXCIsIFwiaW5cIikuXG4gICAgICogQHBhcmFtIHt7IHZhbHVlOiAoRGF0ZSB8IEFycmF5PERhdGU+KSwgZmllbGQ6IHN0cmluZywgZmlsdGVyVHlwZTogc3RyaW5nIH19IHRhcmdldCBcbiAgICAgKi9cbiAgICBjb25zdHJ1Y3Rvcih0YXJnZXQpIHtcbiAgICAgICAgdGhpcy52YWx1ZSA9IHRhcmdldC52YWx1ZTtcbiAgICAgICAgdGhpcy5maWVsZCA9IHRhcmdldC5maWVsZDtcbiAgICAgICAgdGhpcy5maWVsZFR5cGUgPSBcImRhdGVcIjtcbiAgICAgICAgdGhpcy5maWx0ZXJUeXBlID0gdGFyZ2V0LmZpbHRlclR5cGU7XG4gICAgICAgIHRoaXMuZmlsdGVycyA9IHRoaXMuI2luaXQoKTtcbiAgICB9XG4gICAgLyoqXG4gICAgICogUmV0dXJucyBhIG5ldyBkYXRlIG9iamVjdCBmb3IgZWFjaCBkYXRlIHBhc3NlZCBpbiwgc2V0dGluZyB0aGUgdGltZSB0byBtaWRuaWdodC4gIFRoaXMgaXMgdXNlZCB0byBlbnN1cmUgdGhhdCB0aGUgZGF0ZSBvYmplY3RzIGFyZSBub3QgbW9kaWZpZWRcbiAgICAgKiB3aGVuIGNvbXBhcmluZyBkYXRlcyBpbiB0aGUgZmlsdGVyIGZ1bmN0aW9ucywgYW5kIHRvIGVuc3VyZSB0aGF0IHRoZSB0aW1lIHBvcnRpb24gb2YgdGhlIGRhdGUgZG9lcyBub3QgYWZmZWN0IHRoZSBjb21wYXJpc29uLlxuICAgICAqIEBwYXJhbSB7RGF0ZX0gZGF0ZTEgXG4gICAgICogQHBhcmFtIHtEYXRlfSBkYXRlMiBcbiAgICAgKiBAcmV0dXJucyB7QXJyYXk8RGF0ZT59IFJldHVybnMgYW4gYXJyYXkgb2YgdHdvIGRhdGUgb2JqZWN0cywgZWFjaCBzZXQgdG8gbWlkbmlnaHQgb2YgdGhlIHJlc3BlY3RpdmUgZGF0ZSBwYXNzZWQgaW4uXG4gICAgICovXG4gICAgY2xvbmVEYXRlcyA9IChkYXRlMSwgZGF0ZTIpID0+IHsgXG4gICAgICAgIGNvbnN0IGQxID0gbmV3IERhdGUoZGF0ZTEpO1xuICAgICAgICBjb25zdCBkMiA9IG5ldyBEYXRlKGRhdGUyKTtcblxuICAgICAgICBkMS5zZXRIb3VycygwLCAwLCAwLCAwKTtcbiAgICAgICAgZDIuc2V0SG91cnMoMCwgMCwgMCwgMCk7XG4gICAgICAgIFxuICAgICAgICByZXR1cm4gW2QxLCBkMl07XG4gICAgfTtcblxuICAgICNpbml0KCkgeyBcbiAgICAgICAgcmV0dXJuIHsgXG4gICAgICAgICAgICBcImVxdWFsc1wiOiBmdW5jdGlvbihmaWx0ZXJWYWwsIHJvd1ZhbCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBmaWx0ZXJWYWwuZ2V0RnVsbFllYXIoKSA9PT0gcm93VmFsLmdldEZ1bGxZZWFyKCkgJiYgZmlsdGVyVmFsLmdldE1vbnRoKCkgPT09IHJvd1ZhbC5nZXRNb250aCgpICYmIGZpbHRlclZhbC5nZXREYXRlKCkgPT09IHJvd1ZhbC5nZXREYXRlKCk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgLy9sZXNzIHRoYW5cbiAgICAgICAgICAgIFwiPFwiOiAoZmlsdGVyVmFsLCByb3dWYWwpID0+IHtcbiAgICAgICAgICAgICAgICBjb25zdCBkYXRlcyA9IHRoaXMuY2xvbmVEYXRlcyhmaWx0ZXJWYWwsIHJvd1ZhbCk7XG4gXG4gICAgICAgICAgICAgICAgcmV0dXJuIGRhdGVzWzBdLmdldFRpbWUoKSA8IGRhdGVzWzFdLmdldFRpbWUoKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAvL2xlc3MgdGhhbiBvciBlcXVhbCB0b1xuICAgICAgICAgICAgXCI8PVwiOiAoZmlsdGVyVmFsLCByb3dWYWwpID0+IHtcbiAgICAgICAgICAgICAgICBjb25zdCBkYXRlcyA9IHRoaXMuY2xvbmVEYXRlcyhmaWx0ZXJWYWwsIHJvd1ZhbCk7XG5cbiAgICAgICAgICAgICAgICByZXR1cm4gZGF0ZXNbMF0uZ2V0VGltZSgpIDwgZGF0ZXNbMV0uZ2V0VGltZSgpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIC8vZ3JlYXRlciB0aGFuXG4gICAgICAgICAgICBcIj5cIjogKGZpbHRlclZhbCwgcm93VmFsKSA9PiB7XG4gICAgICAgICAgICAgICAgY29uc3QgZGF0ZXMgPSB0aGlzLmNsb25lRGF0ZXMoZmlsdGVyVmFsLCByb3dWYWwpO1xuXG4gICAgICAgICAgICAgICAgcmV0dXJuIGRhdGVzWzBdLmdldFRpbWUoKSA+IGRhdGVzWzFdLmdldFRpbWUoKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAvL2dyZWF0ZXIgdGhhbiBvciBlcXVhbCB0b1xuICAgICAgICAgICAgXCI+PVwiOiAoZmlsdGVyVmFsLCByb3dWYWwpID0+IHtcbiAgICAgICAgICAgICAgICBjb25zdCBkYXRlcyA9IHRoaXMuY2xvbmVEYXRlcyhmaWx0ZXJWYWwsIHJvd1ZhbCk7XG5cbiAgICAgICAgICAgICAgICByZXR1cm4gZGF0ZXNbMF0uZ2V0VGltZSgpID49IGRhdGVzWzFdLmdldFRpbWUoKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAvL25vdCBlcXVhbCB0b1xuICAgICAgICAgICAgXCIhPVwiOiBmdW5jdGlvbihmaWx0ZXJWYWwsIHJvd1ZhbCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBmaWx0ZXJWYWwuZ2V0RnVsbFllYXIoKSAhPT0gcm93VmFsLmdldEZ1bGxZZWFyKCkgJiYgZmlsdGVyVmFsLmdldE1vbnRoKCkgIT09IHJvd1ZhbC5nZXRNb250aCgpICYmIGZpbHRlclZhbC5nZXREYXRlKCkgIT09IHJvd1ZhbC5nZXREYXRlKCk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgLy8gYmV0d2Vlbi4gIGV4cGVjdHMgZmlsdGVyVmFsIHRvIGJlIGFuIGFycmF5IG9mOiBbIHtzdGFydCB2YWx1ZX0sIHsgZW5kIHZhbHVlIH0gXSBcbiAgICAgICAgICAgIFwiYmV0d2VlblwiOiAoZmlsdGVyVmFsLCByb3dWYWwpICA9PiB7XG4gICAgICAgICAgICAgICAgY29uc3QgZmlsdGVyRGF0ZXMgPSB0aGlzLmNsb25lRGF0ZXMoZmlsdGVyVmFsWzBdLCBmaWx0ZXJWYWxbMV0pO1xuICAgICAgICAgICAgICAgIGNvbnN0IHJvd0RhdGVzID0gdGhpcy5jbG9uZURhdGVzKHJvd1ZhbCwgcm93VmFsKTtcblxuICAgICAgICAgICAgICAgIHJldHVybiByb3dEYXRlc1swXSA+PSBmaWx0ZXJEYXRlc1swXSAmJiByb3dEYXRlc1swXSA8PSBmaWx0ZXJEYXRlc1sxXTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcbiAgICB9XG4gICAgLyoqXG4gICAgICogRXhlY3V0ZXMgYW4gaW50ZXJuYWwgZnVuY3Rpb24gdG8gaW5kaWNhdGUgaWYgdGhlIGN1cnJlbnQgcm93IHZhbHVlIG1hdGNoZXMgdGhlIGZpbHRlciBjcml0ZXJpYSdzIHZhbHVlLiAgXG4gICAgICogQHBhcmFtIHtEYXRlfSByb3dWYWwgUm93IGNvbHVtbiB2YWx1ZS4gIEV4cGVjdHMgYSBEYXRlIG9iamVjdC5cbiAgICAgKiBAcGFyYW0ge09iamVjdDxBcnJheT59IHJvdyBDdXJyZW50IGRhdGEgc2V0IHJvdy5cbiAgICAgKiBAcmV0dXJucyB7Ym9vbGVhbn0gUmV0dXJucyB0cnVlIGlmIHJvdyB2YWx1ZSBtYXRjaGVzIGZpbHRlciB2YWx1ZS4gIE90aGVyd2lzZSwgZmFsc2UgaW5kaWNhdGluZyBubyBtYXRjaC5cbiAgICAgKi9cbiAgICBleGVjdXRlKHJvd1ZhbCwgcm93KSB7XG4gICAgICAgIGlmIChyb3dWYWwgPT09IG51bGwgfHwgIURhdGVIZWxwZXIuaXNEYXRlKHJvd1ZhbCkpIHtcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTsgLy8gSWYgcm93VmFsIGlzIG51bGwgb3Igbm90IGEgZGF0ZSwgcmV0dXJuIGZhbHNlLlxuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHRoaXMuZmlsdGVyc1t0aGlzLmZpbHRlclR5cGVdKHRoaXMudmFsdWUsIHJvd1ZhbCk7XG4gICAgfVxufVxuXG5leHBvcnQgeyBGaWx0ZXJEYXRlIH07IiwiLyoqXG4gKiBSZXByZXNlbnRzIGEgY29uY3JldGUgaW1wbGVtZW50YXRpb24gb2YgYSBmaWx0ZXIgdGhhdCB1c2VzIGEgdXNlciBzdXBwbGllZCBmdW5jdGlvbi5cbiAqL1xuY2xhc3MgRmlsdGVyRnVuY3Rpb24ge1xuICAgIC8qKlxuICAgICAqIENyZWF0ZXMgYSBmaWx0ZXIgZnVuY3Rpb24gaW5zdGFuY2UuICBFeHBlY3RzIGFuIG9iamVjdCB3aXRoIHRoZSBmb2xsb3dpbmcgcHJvcGVydGllczpcbiAgICAgKiAqIGB2YWx1ZWA6IFRoZSB2YWx1ZSB0byBmaWx0ZXIgYWdhaW5zdC4gIERvZXMgbm90IG5lZWQgdG8gbWF0Y2ggdGhlIHR5cGUgb2YgdGhlIGZpZWxkIGJlaW5nIGZpbHRlcmVkLlxuICAgICAqICogYGZpZWxkYDogVGhlIGZpZWxkIG5hbWUgb2YgdGhlIGNvbHVtbiBiZWluZyBmaWx0ZXJlZC4gIFRoaXMgaXMgdXNlZCB0byBpZGVudGlmeSB0aGUgY29sdW1uIGluIHRoZSBkYXRhIHNldC5cbiAgICAgKiAqIGBmaWx0ZXJUeXBlYDogVGhlIGZ1bmN0aW9uIHRvIHVzZSBmb3IgZmlsdGVyaW5nLlxuICAgICAqICogYHBhcmFtc2A6IE9wdGlvbmFsIHBhcmFtZXRlcnMgdG8gcGFzcyB0byB0aGUgZmlsdGVyIGZ1bmN0aW9uLlxuICAgICAqIEBwYXJhbSB7eyB2YWx1ZTogT2JqZWN0LCBmaWVsZDogc3RyaW5nLCBmaWx0ZXJUeXBlOiBGdW5jdGlvbiwgcGFyYW1zOiBPYmplY3QgfX0gdGFyZ2V0IFxuICAgICAqL1xuICAgIGNvbnN0cnVjdG9yKHRhcmdldCkge1xuICAgICAgICB0aGlzLnZhbHVlID0gdGFyZ2V0LnZhbHVlO1xuICAgICAgICB0aGlzLmZpZWxkID0gdGFyZ2V0LmZpZWxkO1xuICAgICAgICB0aGlzLmZpbHRlckZ1bmN0aW9uID0gdGFyZ2V0LmZpbHRlclR5cGU7XG4gICAgICAgIHRoaXMucGFyYW1zID0gdGFyZ2V0LnBhcmFtcyA/PyB7fTtcbiAgICB9XG4gICAgLyoqXG4gICAgICogRXhlY3V0ZXMgYW4gdXNlciBzdXBwbGllZCBmdW5jdGlvbiB0byBpbmRpY2F0ZSBpZiB0aGUgY3VycmVudCByb3cgdmFsdWVzIG1hdGNoZXMgdGhlIGZpbHRlciBjcml0ZXJpYSdzIHZhbHVlLiAgXG4gICAgICogQHBhcmFtIHtPYmplY3R9IHJvd1ZhbCBSb3cgY29sdW1uIHZhbHVlLiAgRXhwZWN0cyBhIHZhbHVlIHRoYXQgbWF0Y2hlcyB0aGUgdHlwZSBpZGVudGlmaWVkIGJ5IHRoZSBjb2x1bW4uXG4gICAgICogQHBhcmFtIHtPYmplY3Q8QXJyYXk+fSByb3cgQ3VycmVudCBkYXRhIHNldCByb3cuXG4gICAgICogQHJldHVybnMge2Jvb2xlYW59IFJldHVybnMgdHJ1ZSBpZiByb3cgdmFsdWUgbWF0Y2hlcyBmaWx0ZXIgdmFsdWUuICBPdGhlcndpc2UsIGZhbHNlIGluZGljYXRpbmcgbm8gbWF0Y2guXG4gICAgICovXG4gICAgZXhlY3V0ZShyb3dWYWwsIHJvdykge1xuICAgICAgICByZXR1cm4gdGhpcy5maWx0ZXJGdW5jdGlvbih0aGlzLnZhbHVlLCByb3dWYWwsIHJvdywgdGhpcy5wYXJhbXMpO1xuICAgIH1cbn1cblxuZXhwb3J0IHsgRmlsdGVyRnVuY3Rpb24gfTsiLCJjbGFzcyBFbGVtZW50SGVscGVyIHtcbiAgICAvKipcbiAgICAgKiBDcmVhdGVzIGFuIEhUTUwgZWxlbWVudCB3aXRoIHRoZSBzcGVjaWZpZWQgdGFnIGFuZCBwcm9wZXJ0aWVzLlxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSB0YWcgVGhlIHRhZyBuYW1lIG9mIHRoZSBlbGVtZW50IHRvIGNyZWF0ZS5cbiAgICAgKiBAcGFyYW0ge09iamVjdH0gW3Byb3BlcnRpZXM9e31dIEFuIG9iamVjdCBjb250YWluaW5nIHByb3BlcnRpZXMgdG8gYXNzaWduIHRvIHRoZSBlbGVtZW50LlxuICAgICAqIEBwYXJhbSB7T2JqZWN0fSBbZGF0YXNldD17fV0gQW4gb2JqZWN0IGNvbnRhaW5pbmcgZGF0YXNldCBhdHRyaWJ1dGVzIHRvIGFzc2lnbiB0byB0aGUgZWxlbWVudC5cbiAgICAgKiBAcmV0dXJucyB7SFRNTEVsZW1lbnR9IFRoZSBjcmVhdGVkIEhUTUwgZWxlbWVudC5cbiAgICAgKi9cbiAgICBzdGF0aWMgY3JlYXRlKHRhZywgcHJvcGVydGllcyA9IHt9LCBkYXRhc2V0ID0ge30pIHtcbiAgICAgICAgY29uc3QgZWxlbWVudCA9IE9iamVjdC5hc3NpZ24oZG9jdW1lbnQuY3JlYXRlRWxlbWVudCh0YWcpLCBwcm9wZXJ0aWVzKTtcblxuICAgICAgICBpZiAoZGF0YXNldCkgeyBcbiAgICAgICAgICAgIE9iamVjdC5hc3NpZ24oZWxlbWVudC5kYXRhc2V0LCBkYXRhc2V0KTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBlbGVtZW50O1xuICAgIH1cbiAgICAvKipcbiAgICAgKiBDcmVhdGVzIGEgYGRpdmAgZWxlbWVudCB3aXRoIHRoZSBzcGVjaWZpZWQgcHJvcGVydGllcyBhbmQgZGF0YXNldC5cbiAgICAgKiBAcGFyYW0ge09iamVjdH0gW3Byb3BlcnRpZXM9e31dIEFuIG9iamVjdCBjb250YWluaW5nIHByb3BlcnRpZXMgdG8gYXNzaWduIHRvIHRoZSBlbGVtZW50LlxuICAgICAqIEBwYXJhbSB7T2JqZWN0fSBbZGF0YXNldD17fV0gQW4gb2JqZWN0IGNvbnRhaW5pbmcgZGF0YXNldCBhdHRyaWJ1dGVzIHRvIGFzc2lnbiB0byB0aGUgZWxlbWVudC5cbiAgICAgKiBAcmV0dXJucyB7SFRNTERpdkVsZW1lbnR9IFRoZSBjcmVhdGVkIEhUTUwgZWxlbWVudC5cbiAgICAgKi9cbiAgICBzdGF0aWMgZGl2KHByb3BlcnRpZXMgPSB7fSwgZGF0YXNldCA9IHt9KSB7XG4gICAgICAgIHJldHVybiB0aGlzLmNyZWF0ZShcImRpdlwiLCBwcm9wZXJ0aWVzLCBkYXRhc2V0KTtcbiAgICB9XG4gICAgLyoqXG4gICAgICogQ3JlYXRlcyBhIGBpbnB1dGAgZWxlbWVudCB3aXRoIHRoZSBzcGVjaWZpZWQgcHJvcGVydGllcyBhbmQgZGF0YXNldC5cbiAgICAgKiBAcGFyYW0ge09iamVjdH0gW3Byb3BlcnRpZXM9e31dIEFuIG9iamVjdCBjb250YWluaW5nIHByb3BlcnRpZXMgdG8gYXNzaWduIHRvIHRoZSBlbGVtZW50LlxuICAgICAqIEBwYXJhbSB7T2JqZWN0fSBbZGF0YXNldD17fV0gQW4gb2JqZWN0IGNvbnRhaW5pbmcgZGF0YXNldCBhdHRyaWJ1dGVzIHRvIGFzc2lnbiB0byB0aGUgZWxlbWVudC5cbiAgICAgKiBAcmV0dXJucyB7SFRNTElucHV0RWxlbWVudH0gVGhlIGNyZWF0ZWQgSFRNTCBlbGVtZW50LlxuICAgICAqL1xuICAgIHN0YXRpYyBpbnB1dChwcm9wZXJ0aWVzID0ge30sIGRhdGFzZXQgPSB7fSkge1xuICAgICAgICByZXR1cm4gdGhpcy5jcmVhdGUoXCJpbnB1dFwiLCBwcm9wZXJ0aWVzLCBkYXRhc2V0KTtcbiAgICB9XG4gICAgLyoqXG4gICAgICogQ3JlYXRlcyBhIGBzcGFuYCBlbGVtZW50IHdpdGggdGhlIHNwZWNpZmllZCBwcm9wZXJ0aWVzIGFuZCBkYXRhc2V0LlxuICAgICAqIEBwYXJhbSB7T2JqZWN0fSBbcHJvcGVydGllcz17fV0gQW4gb2JqZWN0IGNvbnRhaW5pbmcgcHJvcGVydGllcyB0byBhc3NpZ24gdG8gdGhlIGVsZW1lbnQuXG4gICAgICogQHBhcmFtIHtPYmplY3R9IFtkYXRhc2V0PXt9XSBBbiBvYmplY3QgY29udGFpbmluZyBkYXRhc2V0IGF0dHJpYnV0ZXMgdG8gYXNzaWduIHRvIHRoZSBlbGVtZW50LlxuICAgICAqIEByZXR1cm5zIHtIVE1MU3BhbkVsZW1lbnR9IFRoZSBjcmVhdGVkIEhUTUwgZWxlbWVudC5cbiAgICAgKi9cbiAgICBzdGF0aWMgc3Bhbihwcm9wZXJ0aWVzID0ge30sIGRhdGFzZXQgPSB7fSkge1xuICAgICAgICByZXR1cm4gdGhpcy5jcmVhdGUoXCJzcGFuXCIsIHByb3BlcnRpZXMsIGRhdGFzZXQpO1xuICAgIH1cbn1cblxuZXhwb3J0IHsgRWxlbWVudEhlbHBlciB9OyIsImltcG9ydCB7IGNzc0hlbHBlciB9IGZyb20gXCIuLi8uLi8uLi9jb21wb25lbnRzL2hlbHBlcnMvY3NzSGVscGVyLmpzXCI7XG5pbXBvcnQgeyBFbGVtZW50SGVscGVyIH0gZnJvbSBcIi4uLy4uLy4uL2NvbXBvbmVudHMvaGVscGVycy9lbGVtZW50SGVscGVyLmpzXCI7XG4vKipcbiAqIENyZWF0ZSBmaWx0ZXIgb2JqZWN0IHRoYXQgcmVwcmVzZW50cyBhIGVsZW1lbnQgdG8gZmlsdGVyIGJldHdlZW4gdHdvIHZhbHVlcy4gIENyZWF0ZXMgYSBkcm9wZG93biB3aXRoIGEgdHdvIGlucHV0IGJveGVzIFxuICogdG8gZW50ZXIgc3RhcnQgYW5kIGVuZCB2YWx1ZXMuXG4gKi9cbmNsYXNzIEVsZW1lbnRCZXR3ZWVuIHtcbiAgICAvKipcbiAgICAgKiBDcmVhdGUgZmlsdGVyIG9iamVjdCB0aGF0IHJlcHJlc2VudHMgYSBiZXR3ZWVuIGVsZW1lbnQuXG4gICAgICogQHBhcmFtIHtDb2x1bW59IGNvbHVtbiBDb2x1bW4gY2xhc3Mgb2JqZWN0LlxuICAgICAqIEBwYXJhbSB7R3JpZENvbnRleHR9IGNvbnRleHQgR3JpZCBjb250ZXh0IG9iamVjdC5cbiAgICAgKi9cbiAgICBjb25zdHJ1Y3Rvcihjb2x1bW4sIGNvbnRleHQpIHtcbiAgICAgICAgdGhpcy5jb250ZXh0ID0gY29udGV4dDtcbiAgICAgICAgdGhpcy5lbGVtZW50ID0gRWxlbWVudEhlbHBlci5kaXYoeyBuYW1lOiBjb2x1bW4uZmllbGQsIGNsYXNzTmFtZTogY3NzSGVscGVyLm11bHRpU2VsZWN0LnBhcmVudENsYXNzIH0pO1xuICAgICAgICB0aGlzLmhlYWRlciA9IEVsZW1lbnRIZWxwZXIuZGl2KHsgY2xhc3NOYW1lOiBjc3NIZWxwZXIubXVsdGlTZWxlY3QuaGVhZGVyIH0pO1xuICAgICAgICB0aGlzLm9wdGlvbnNDb250YWluZXIgPSBFbGVtZW50SGVscGVyLmRpdih7IGNsYXNzTmFtZTogY3NzSGVscGVyLm11bHRpU2VsZWN0Lm9wdGlvbnMgfSk7XG4gICAgICAgIHRoaXMuZmllbGQgPSBjb2x1bW4uZmllbGQ7XG4gICAgICAgIHRoaXMuZmllbGRUeXBlID0gY29sdW1uLnR5cGU7ICAvL2ZpZWxkIHZhbHVlIHR5cGUuXG4gICAgICAgIHRoaXMuZmlsdGVyVHlwZSA9IFwiYmV0d2VlblwiOyAgLy9jb25kaXRpb24gdHlwZS5cblxuICAgICAgICB0aGlzLmVsZW1lbnQuaWQgPSBgJHt0aGlzLmNvbnRleHQuc2V0dGluZ3MuYmFzZUlkTmFtZX1fJHt0aGlzLmZpZWxkfWA7XG4gICAgICAgIHRoaXMuZWxlbWVudC5hcHBlbmQodGhpcy5oZWFkZXIsIHRoaXMub3B0aW9uc0NvbnRhaW5lcik7XG4gICAgICAgIHRoaXMuaGVhZGVyLmlkID0gYGhlYWRlcl8ke3RoaXMuY29udGV4dC5zZXR0aW5ncy5iYXNlSWROYW1lfV8ke3RoaXMuZmllbGR9YDtcbiAgICAgICAgdGhpcy5vcHRpb25zQ29udGFpbmVyLnN0eWxlLm1pbldpZHRoID0gXCIxODVweFwiO1xuXG4gICAgICAgIHRoaXMuI3RlbXBsYXRlQmV0d2VlbigpO1xuICAgICAgICB0aGlzLmhlYWRlci5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgdGhpcy5oYW5kbGVDbGljayk7XG4gICAgfVxuXG4gICAgI3RlbXBsYXRlQmV0d2VlbigpIHtcbiAgICAgICAgdGhpcy5lbGVtZW50U3RhcnQgPSBFbGVtZW50SGVscGVyLmlucHV0KHsgY2xhc3NOYW1lOiBjc3NIZWxwZXIuaW5wdXQsIGlkOiBgc3RhcnRfJHt0aGlzLmNvbnRleHQuc2V0dGluZ3MuYmFzZUlkTmFtZX1fJHt0aGlzLmZpZWxkfWAgfSk7XG5cbiAgICAgICAgdGhpcy5lbGVtZW50RW5kID0gRWxlbWVudEhlbHBlci5pbnB1dCh7IGNsYXNzTmFtZTogY3NzSGVscGVyLmlucHV0LCBpZDogYGVuZF8ke3RoaXMuY29udGV4dC5zZXR0aW5ncy5iYXNlSWROYW1lfV8ke3RoaXMuZmllbGR9YCB9KTtcbiAgICAgICAgdGhpcy5lbGVtZW50RW5kLnN0eWxlLm1hcmdpbkJvdHRvbSA9IFwiMTBweFwiO1xuXG4gICAgICAgIGNvbnN0IHN0YXJ0ID0gRWxlbWVudEhlbHBlci5zcGFuKHsgaW5uZXJUZXh0OiBcIlN0YXJ0XCIsIGNsYXNzTmFtZTogY3NzSGVscGVyLmJldHdlZW5MYWJlbCB9KTtcbiAgICAgICAgY29uc3QgZW5kID0gIEVsZW1lbnRIZWxwZXIuc3Bhbih7IGlubmVyVGV4dDogXCJFbmRcIiwgY2xhc3NOYW1lOiBjc3NIZWxwZXIuYmV0d2VlbkxhYmVsIH0pO1xuIFxuICAgICAgICBjb25zdCBidG5BcHBseSA9IEVsZW1lbnRIZWxwZXIuY3JlYXRlKFwiYnV0dG9uXCIsIHsgaW5uZXJUZXh0OiBcIkFwcGx5XCIsIGNsYXNzTmFtZTogY3NzSGVscGVyLmJldHdlZW5CdXR0b24gfSk7XG4gICAgICAgIGJ0bkFwcGx5LnN0eWxlLm1hcmdpblJpZ2h0ID0gXCIxMHB4XCI7XG4gICAgICAgIGJ0bkFwcGx5LmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCB0aGlzLmhhbmRsZXJDbGljayk7XG5cbiAgICAgICAgY29uc3QgYnRuQ2xlYXIgPSBFbGVtZW50SGVscGVyLmNyZWF0ZShcImJ1dHRvblwiLCB7IGlubmVyVGV4dDogXCJDbGVhclwiLCBjbGFzc05hbWU6IGNzc0hlbHBlci5iZXR3ZWVuQnV0dG9uIH0pO1xuICAgICAgICBidG5DbGVhci5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgdGhpcy5oYW5kbGVCdXR0b25DbGVhcik7XG5cbiAgICAgICAgdGhpcy5vcHRpb25zQ29udGFpbmVyLmFwcGVuZChzdGFydCwgdGhpcy5lbGVtZW50U3RhcnQsIGVuZCwgdGhpcy5lbGVtZW50RW5kLCBidG5BcHBseSwgYnRuQ2xlYXIpO1xuICAgIH1cblxuICAgIGhhbmRsZUJ1dHRvbkNsZWFyID0gKCkgPT4ge1xuICAgICAgICB0aGlzLmVsZW1lbnRTdGFydC52YWx1ZSA9IFwiXCI7XG4gICAgICAgIHRoaXMuZWxlbWVudEVuZC52YWx1ZSA9IFwiXCI7XG5cbiAgICAgICAgaWYgKHRoaXMuY291bnRMYWJlbCAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICB0aGlzLmNvdW50TGFiZWwucmVtb3ZlKCk7XG4gICAgICAgICAgICB0aGlzLmNvdW50TGFiZWwgPSB1bmRlZmluZWQ7XG4gICAgICAgIH1cbiAgICB9O1xuXG4gICAgY3JlYXRlQ291bnRMYWJlbCA9ICgpID0+IHtcbiAgICAgICAgLy91cGRhdGUgY291bnQgbGFiZWwuXG4gICAgICAgIGlmICh0aGlzLmNvdW50TGFiZWwgPT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgdGhpcy5jb3VudExhYmVsID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcInNwYW5cIik7XG4gICAgICAgICAgICB0aGlzLmNvdW50TGFiZWwuY2xhc3NOYW1lID0gY3NzSGVscGVyLm11bHRpU2VsZWN0LmhlYWRlck9wdGlvbjtcbiAgICAgICAgICAgIHRoaXMuaGVhZGVyLmFwcGVuZCh0aGlzLmNvdW50TGFiZWwpO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHRoaXMuZWxlbWVudFN0YXJ0LnZhbHVlICE9PSBcIlwiICYmIHRoaXMuZWxlbWVudEVuZC52YWx1ZSAhPT0gXCJcIikge1xuICAgICAgICAgICAgdGhpcy5jb3VudExhYmVsLmlubmVyVGV4dCA9IGAke3RoaXMuZWxlbWVudFN0YXJ0LnZhbHVlfSB0byAke3RoaXMuZWxlbWVudEVuZC52YWx1ZX1gO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdGhpcy5jb3VudExhYmVsLnJlbW92ZSgpO1xuICAgICAgICAgICAgdGhpcy5jb3VudExhYmVsID0gdW5kZWZpbmVkO1xuICAgICAgICB9XG4gICAgfTtcblxuICAgIGhhbmRsZUNsaWNrID0gYXN5bmMgKCkgPT4ge1xuICAgICAgICBjb25zdCBzdGF0dXMgPSB0aGlzLmhlYWRlci5jbGFzc0xpc3QudG9nZ2xlKGNzc0hlbHBlci5tdWx0aVNlbGVjdC5oZWFkZXJBY3RpdmUpO1xuXG4gICAgICAgIGlmICghc3RhdHVzKSB7XG4gICAgICAgICAgICAvL0Nsb3NlIHdpbmRvdyBhbmQgYXBwbHkgZmlsdGVyIHZhbHVlLlxuICAgICAgICAgICAgdGhpcy5jcmVhdGVDb3VudExhYmVsKCk7XG4gICAgICAgICAgICBhd2FpdCB0aGlzLmNvbnRleHQuZXZlbnRzLnRyaWdnZXIoXCJyZW5kZXJcIik7XG4gICAgICAgICAgICBkb2N1bWVudC5yZW1vdmVFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgdGhpcy5oYW5kbGVEb2N1bWVudCk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBkb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgdGhpcy5oYW5kbGVEb2N1bWVudCk7XG4gICAgICAgIH1cbiAgICB9O1xuICAgIC8qKlxuICAgICAqIEhhbmRsZXIgZXZlbnQgdG8gY2xvc2UgZHJvcGRvd24gd2hlbiB1c2VyIGNsaWNrcyBvdXRzaWRlIHRoZSBtdWx0aS1zZWxlY3QgY29udHJvbC4gIEV2ZW50IGlzIHJlbW92ZWQgd2hlbiBtdWx0aS1zZWxlY3QgaXMgXG4gICAgICogbm90IGFjdGl2ZSBzbyB0aGF0IGl0J3Mgbm90IGZpcmluZyBvbiByZWR1bmRhbnQgZXZlbnRzLlxuICAgICAqIEBwYXJhbSB7T2JqZWN0fSBlIE9iamVjdCB0aGF0IHRyaWdnZXJlZCBldmVudC5cbiAgICAgKi9cbiAgICBoYW5kbGVEb2N1bWVudCA9IGFzeW5jIChlKSA9PiB7XG4gICAgICAgIGlmICghZS50YXJnZXQuY2xvc2VzdChcIi5kYXRhZ3JpZHMtaW5wdXRcIikgJiYgIWUudGFyZ2V0LmNsb3Nlc3QoYCMke3RoaXMuaGVhZGVyLmlkfWApKSB7XG4gICAgICAgICAgICB0aGlzLmhlYWRlci5jbGFzc0xpc3QucmVtb3ZlKGNzc0hlbHBlci5tdWx0aVNlbGVjdC5oZWFkZXJBY3RpdmUpO1xuXG4gICAgICAgICAgICBhd2FpdCB0aGlzLmNvbnRleHQuZXZlbnRzLnRyaWdnZXIoXCJyZW5kZXJcIik7XG5cbiAgICAgICAgICAgIGRvY3VtZW50LnJlbW92ZUV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCB0aGlzLmhhbmRsZURvY3VtZW50KTtcbiAgICAgICAgfVxuICAgIH07XG4gICAgLyoqXG4gICAgICogUmV0dXJucyBhbiBhcnJheSBvZiB0aGUgc3RhcnQgYW5kIGVuZCB2YWx1ZXMgZnJvbSBpbnB1dCBzb3VyY2UuICBJZiBlaXRoZXIgaW5wdXQgc291cmNlIGlzIGVtcHR5LCBhbiBlbXB0eSBzdHJpbmcgd2lsbCBiZSByZXR1cm5lZC5cbiAgICAgKiBAcmV0dXJucyB7QXJyYXkgfCBzdHJpbmd9IEFycmF5IG9mIHN0YXJ0IGFuZCBlbmQgdmFsdWVzIG9yIGVtcHR5IHN0cmluZy5cbiAgICAgKi9cbiAgICBnZXQgdmFsdWUoKSB7XG4gICAgICAgIGlmICh0aGlzLmVsZW1lbnRTdGFydC52YWx1ZSA9PT0gXCJcIiB8fCB0aGlzLmVsZW1lbnRFbmQudmFsdWUgPT09IFwiXCIpIHJldHVybiBcIlwiO1xuXG4gICAgICAgIHJldHVybiBbdGhpcy5lbGVtZW50U3RhcnQudmFsdWUsIHRoaXMuZWxlbWVudEVuZC52YWx1ZV07XG4gICAgfVxufVxuXG5leHBvcnQgeyBFbGVtZW50QmV0d2VlbiB9OyIsIi8qKlxuICogUmVwcmVzZW50cyBhIGNvbHVtbnMgZmlsdGVyIGNvbnRyb2wuICBDcmVhdGVzIGEgYEhUTUxJbnB1dEVsZW1lbnRgIHRoYXQgaXMgYWRkZWQgdG8gdGhlIGhlYWRlciByb3cgb2YgXG4gKiB0aGUgZ3JpZCB0byBmaWx0ZXIgZGF0YSBzcGVjaWZpYyB0byBpdHMgZGVmaW5lZCBjb2x1bW4uIFxuICovXG5jbGFzcyBFbGVtZW50SW5wdXQge1xuICAgIC8qKlxuICAgICAqIENyZWF0ZSBmaWx0ZXIgb2JqZWN0IHRoYXQgcmVwcmVzZW50cyBhIGBIVE1MU2VsZWN0RWxlbWVudGAgZWxlbWVudCBpbiB0aGUgdGFibGUncyBoZWFkZXIgcm93LlxuICAgICAqIEBwYXJhbSB7Q29sdW1ufSBjb2x1bW4gQ29sdW1uIGNsYXNzIG9iamVjdC5cbiAgICAgKiBAcGFyYW0ge0dyaWRDb250ZXh0fSBjb250ZXh0IEdyaWQgY29udGV4dC5cbiAgICAqL1xuICAgIGNvbnN0cnVjdG9yKGNvbHVtbiwgY29udGV4dCkge1xuICAgICAgICB0aGlzLmVsZW1lbnQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiaW5wdXRcIik7XG4gICAgICAgIHRoaXMuY29udGV4dCA9IGNvbnRleHQ7XG4gICAgICAgIHRoaXMuZmllbGQgPSBjb2x1bW4uZmllbGQ7XG4gICAgICAgIHRoaXMuZmllbGRUeXBlID0gY29sdW1uLnR5cGU7ICAvL2ZpZWxkIHZhbHVlIHR5cGUuXG4gICAgICAgIHRoaXMuZmlsdGVyVHlwZSA9IGNvbHVtbi5maWx0ZXJUeXBlOyAgLy9jb25kaXRpb24gdHlwZS5cbiAgICAgICAgdGhpcy5maWx0ZXJJc0Z1bmN0aW9uID0gKHR5cGVvZiBjb2x1bW4/LmZpbHRlclR5cGUgPT09IFwiZnVuY3Rpb25cIik7XG4gICAgICAgIHRoaXMuZmlsdGVyUGFyYW1zID0gY29sdW1uLmZpbHRlclBhcmFtcztcbiAgICAgICAgdGhpcy5lbGVtZW50Lm5hbWUgPSB0aGlzLmZpZWxkO1xuICAgICAgICB0aGlzLmVsZW1lbnQuaWQgPSB0aGlzLmZpZWxkO1xuICAgICAgICB0aGlzLmVsZW1lbnQuYWRkRXZlbnRMaXN0ZW5lcihcImNoYW5nZVwiLCBhc3luYyAoKSA9PiBhd2FpdCB0aGlzLmNvbnRleHQuZXZlbnRzLnRyaWdnZXIoXCJyZW5kZXJcIikpO1xuXG4gICAgICAgIGlmIChjb2x1bW4uZmlsdGVyQ3NzKSB7XG4gICAgICAgICAgICB0aGlzLmVsZW1lbnQuY2xhc3NOYW1lID0gY29sdW1uLmZpbHRlckNzcztcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICghdGhpcy5jb250ZXh0LnNldHRpbmdzLnJlbW90ZVByb2Nlc3NpbmcgJiYgY29sdW1uLmZpbHRlclJlYWxUaW1lKSB7XG4gICAgICAgICAgICB0aGlzLnJlYWxUaW1lVGltZW91dCA9ICh0eXBlb2YgdGhpcy5maWx0ZXJSZWFsVGltZSA9PT0gXCJudW1iZXJcIikgXG4gICAgICAgICAgICAgICAgPyB0aGlzLmZpbHRlclJlYWxUaW1lIFxuICAgICAgICAgICAgICAgIDogNTAwO1xuXG4gICAgICAgICAgICB0aGlzLmVsZW1lbnQuYWRkRXZlbnRMaXN0ZW5lcihcImtleXVwXCIsIHRoaXMuaGFuZGxlTGl2ZUZpbHRlcik7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBoYW5kbGVMaXZlRmlsdGVyID0gYXN5bmMgKCkgPT4ge1xuICAgICAgICBzZXRUaW1lb3V0KGFzeW5jICgpID0+IGF3YWl0IHRoaXMuY29udGV4dC5ldmVudHMudHJpZ2dlcihcInJlbmRlclwiKSwgdGhpcy5yZWFsVGltZVRpbWVvdXQpO1xuICAgIH07XG4gICAgLyoqXG4gICAgICogUmV0dXJucyB0aGUgdmFsdWUgb2YgdGhlIGlucHV0IGVsZW1lbnQuICBXaWxsIHJldHVybiBhIHN0cmluZyB2YWx1ZS5cbiAgICAgKiBAcmV0dXJucyB7c3RyaW5nfVxuICAgICAqL1xuICAgIGdldCB2YWx1ZSgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuZWxlbWVudC52YWx1ZTtcbiAgICB9XG59XG5cbmV4cG9ydCB7IEVsZW1lbnRJbnB1dCB9OyIsImltcG9ydCB7IGNzc0hlbHBlciB9IGZyb20gXCIuLi8uLi8uLi9jb21wb25lbnRzL2hlbHBlcnMvY3NzSGVscGVyLmpzXCI7XG5pbXBvcnQgeyBFbGVtZW50SGVscGVyIH0gZnJvbSBcIi4uLy4uLy4uL2NvbXBvbmVudHMvaGVscGVycy9lbGVtZW50SGVscGVyLmpzXCI7XG4vKipcbiAqIENyZWF0ZSBmaWx0ZXIgb2JqZWN0IHRoYXQgcmVwcmVzZW50cyBhIG11bHRpLXNlbGVjdCBlbGVtZW50LiAgQ3JlYXRlcyBhIGRyb3Bkb3duIHdpdGggYSBsaXN0IG9mIG9wdGlvbnMgdGhhdCBjYW4gYmUgXG4gKiBzZWxlY3RlZCBvciBkZXNlbGVjdGVkLiAgSWYgYGZpbHRlclZhbHVlc1JlbW90ZVNvdXJjZWAgaXMgZGVmaW5lZCwgdGhlIHNlbGVjdCBvcHRpb25zIHdpbGwgYmUgcG9wdWxhdGVkIGJ5IHRoZSBkYXRhIHJldHVybmVkIFxuICogZnJvbSB0aGUgcmVtb3RlIHNvdXJjZSBieSByZWdpc3RlcmluZyB0byAgdGhlIGdyaWQgcGlwZWxpbmUncyBgaW5pdGAgYW5kIGByZWZyZXNoYCBldmVudHMuXG4gKi9cbmNsYXNzIEVsZW1lbnRNdWx0aVNlbGVjdCB7XG4gICAgLyoqXG4gICAgICogQ3JlYXRlIGZpbHRlciBvYmplY3QgdGhhdCByZXByZXNlbnRzIGEgbXVsdGktc2VsZWN0IGVsZW1lbnQuXG4gICAgICogQHBhcmFtIHtDb2x1bW59IGNvbHVtbiBDb2x1bW4gY2xhc3Mgb2JqZWN0LlxuICAgICAqIEBwYXJhbSB7R3JpZENvbnRleHR9IGNvbnRleHQgR3JpZCBjb250ZXh0IG9iamVjdC5cbiAgICAgKi9cbiAgICBjb25zdHJ1Y3Rvcihjb2x1bW4sIGNvbnRleHQpIHtcbiAgICAgICAgdGhpcy5jb250ZXh0ID0gY29udGV4dDtcbiAgICAgICAgdGhpcy5lbGVtZW50ID0gRWxlbWVudEhlbHBlci5kaXYoeyBuYW1lOiBjb2x1bW4uZmllbGQsIGNsYXNzTmFtZTogY3NzSGVscGVyLm11bHRpU2VsZWN0LnBhcmVudENsYXNzIH0pO1xuICAgICAgICB0aGlzLmhlYWRlciA9IEVsZW1lbnRIZWxwZXIuZGl2KHsgY2xhc3NOYW1lOiBjc3NIZWxwZXIubXVsdGlTZWxlY3QuaGVhZGVyIH0pO1xuICAgICAgICB0aGlzLm9wdGlvbnNDb250YWluZXIgPSBFbGVtZW50SGVscGVyLmRpdih7IGNsYXNzTmFtZTogY3NzSGVscGVyLm11bHRpU2VsZWN0Lm9wdGlvbnMgfSk7XG4gICAgICAgIHRoaXMuZmllbGQgPSBjb2x1bW4uZmllbGQ7XG4gICAgICAgIHRoaXMuZmllbGRUeXBlID0gY29sdW1uLnR5cGU7ICAvL2ZpZWxkIHZhbHVlIHR5cGUuXG4gICAgICAgIHRoaXMuZmlsdGVyVHlwZSA9IFwiaW5cIjsgIC8vY29uZGl0aW9uIHR5cGUuXG4gICAgICAgIHRoaXMuZmlsdGVySXNGdW5jdGlvbiA9ICh0eXBlb2YgY29sdW1uPy5maWx0ZXJUeXBlID09PSBcImZ1bmN0aW9uXCIpO1xuICAgICAgICB0aGlzLmZpbHRlclBhcmFtcyA9IGNvbHVtbi5maWx0ZXJQYXJhbXM7XG4gICAgICAgIHRoaXMubGlzdEFsbCA9IGZhbHNlO1xuICAgICAgICB0aGlzLnNlbGVjdGVkVmFsdWVzID0gW107XG5cbiAgICAgICAgaWYgKHR5cGVvZiBjb2x1bW4uZmlsdGVyTXVsdGlTZWxlY3QgPT09IFwib2JqZWN0XCIpIHtcbiAgICAgICAgICAgIHRoaXMubGlzdEFsbCA9IGNvbHVtbi5maWx0ZXJNdWx0aVNlbGVjdC5saXN0QWxsO1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5oZWFkZXIuaWQgPSBgaGVhZGVyXyR7dGhpcy5jb250ZXh0LnNldHRpbmdzLmJhc2VJZE5hbWV9XyR7dGhpcy5maWVsZH1gO1xuICAgICAgICB0aGlzLmVsZW1lbnQuaWQgPSBgJHt0aGlzLmNvbnRleHQuc2V0dGluZ3MuYmFzZUlkTmFtZX1fJHt0aGlzLmZpZWxkfWA7XG4gICAgICAgIHRoaXMuZWxlbWVudC5hcHBlbmQodGhpcy5oZWFkZXIsIHRoaXMub3B0aW9uc0NvbnRhaW5lcik7XG5cbiAgICAgICAgaWYgKGNvbHVtbi5maWx0ZXJWYWx1ZXNSZW1vdGVTb3VyY2UpIHtcbiAgICAgICAgICAgIC8vc2V0IHVwIHBpcGVsaW5lIHRvIHJldHJpZXZlIG9wdGlvbiBkYXRhIHdoZW4gaW5pdCBwaXBlbGluZSBpcyBjYWxsZWQuXG4gICAgICAgICAgICB0aGlzLmNvbnRleHQucGlwZWxpbmUuYWRkU3RlcChcImluaXRcIiwgdGhpcy50ZW1wbGF0ZUNvbnRhaW5lciwgY29sdW1uLmZpbHRlclZhbHVlc1JlbW90ZVNvdXJjZSk7XG4gICAgICAgICAgICB0aGlzLmNvbnRleHQucGlwZWxpbmUuYWRkU3RlcChcInJlZnJlc2hcIiwgdGhpcy5yZWZyZXNoU2VsZWN0T3B0aW9ucywgY29sdW1uLmZpbHRlclZhbHVlc1JlbW90ZVNvdXJjZSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAvL3VzZSB1c2VyIHN1cHBsaWVkIHZhbHVlcyB0byBjcmVhdGUgc2VsZWN0IG9wdGlvbnMuXG4gICAgICAgICAgICBjb25zdCBkYXRhID0gQXJyYXkuaXNBcnJheShjb2x1bW4uZmlsdGVyVmFsdWVzKSBcbiAgICAgICAgICAgICAgICA/IGNvbHVtbi5maWx0ZXJWYWx1ZXNcbiAgICAgICAgICAgICAgICA6IE9iamVjdC5lbnRyaWVzKGNvbHVtbi5maWx0ZXJWYWx1ZXMpLm1hcCgoW2tleSwgdmFsdWVdKSA9PiAoeyB2YWx1ZToga2V5LCB0ZXh0OiB2YWx1ZX0pKTtcblxuICAgICAgICAgICAgdGhpcy50ZW1wbGF0ZUNvbnRhaW5lcihkYXRhKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMuaGVhZGVyLmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCB0aGlzLmhhbmRsZUNsaWNrKTtcbiAgICB9XG5cbiAgICBoYW5kbGVDbGljayA9IGFzeW5jICgpID0+IHtcbiAgICAgICAgY29uc3Qgc3RhdHVzID0gdGhpcy5oZWFkZXIuY2xhc3NMaXN0LnRvZ2dsZShjc3NIZWxwZXIubXVsdGlTZWxlY3QuaGVhZGVyQWN0aXZlKTtcblxuICAgICAgICBpZiAoIXN0YXR1cykge1xuICAgICAgICAgICAgYXdhaXQgdGhpcy5jb250ZXh0LmV2ZW50cy50cmlnZ2VyKFwicmVuZGVyXCIpO1xuICAgICAgICAgICAgZG9jdW1lbnQucmVtb3ZlRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsIHRoaXMuaGFuZGxlRG9jdW1lbnQpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsIHRoaXMuaGFuZGxlRG9jdW1lbnQpO1xuICAgICAgICB9XG4gICAgfTtcbiAgICAvKipcbiAgICAgKiBIYW5kbGVyIGV2ZW50IHRvIGNsb3NlIGRyb3Bkb3duIHdoZW4gdXNlciBjbGlja3Mgb3V0c2lkZSB0aGUgbXVsdGktc2VsZWN0IGNvbnRyb2wuICBFdmVudCBpcyByZW1vdmVkIHdoZW4gbXVsdGktc2VsZWN0IFxuICAgICAqIGlzIG5vdCBhY3RpdmUgc28gdGhhdCBpdCdzIG5vdCBmaXJpbmcgb24gcmVkdW5kYW50IGV2ZW50cy5cbiAgICAgKiBAcGFyYW0ge09iamVjdH0gZSBPYmplY3QgdGhhdCB0cmlnZ2VyZWQgZXZlbnQuXG4gICAgICovXG4gICAgaGFuZGxlRG9jdW1lbnQgPSBhc3luYyAoZSkgPT4ge1xuICAgICAgICBpZiAoIWUudGFyZ2V0LmNsb3Nlc3QoXCIuXCIgKyBjc3NIZWxwZXIubXVsdGlTZWxlY3Qub3B0aW9uKSAmJiAhZS50YXJnZXQuY2xvc2VzdChgIyR7dGhpcy5oZWFkZXIuaWR9YCkpIHtcbiAgICAgICAgICAgIHRoaXMuaGVhZGVyLmNsYXNzTGlzdC5yZW1vdmUoY3NzSGVscGVyLm11bHRpU2VsZWN0LmhlYWRlckFjdGl2ZSk7XG5cbiAgICAgICAgICAgIGF3YWl0IHRoaXMuY29udGV4dC5ldmVudHMudHJpZ2dlcihcInJlbmRlclwiKTtcblxuICAgICAgICAgICAgZG9jdW1lbnQucmVtb3ZlRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsIHRoaXMuaGFuZGxlRG9jdW1lbnQpO1xuICAgICAgICB9XG4gICAgfTtcbiAgICAvKipcbiAgICAgKiBDcmVhdGVzIGEgY291bnQgbGFiZWwgdGhhdCBkaXNwbGF5cyB0aGUgbnVtYmVyIG9mIHNlbGVjdGVkIGl0ZW1zIGluIHRoZSBtdWx0aS1zZWxlY3QgY29udHJvbC5cbiAgICAgKi9cbiAgICBjcmVhdGVDb3VudExhYmVsID0gKCkgPT4ge1xuICAgICAgICAvL3VwZGF0ZSBjb3VudCBsYWJlbC5cbiAgICAgICAgaWYgKHRoaXMuY291bnRMYWJlbCA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICB0aGlzLmNvdW50TGFiZWwgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwic3BhblwiKTtcbiAgICAgICAgICAgIHRoaXMuY291bnRMYWJlbC5jbGFzc05hbWUgPSBjc3NIZWxwZXIubXVsdGlTZWxlY3QuaGVhZGVyT3B0aW9uO1xuICAgICAgICAgICAgdGhpcy5oZWFkZXIuYXBwZW5kKHRoaXMuY291bnRMYWJlbCk7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAodGhpcy5zZWxlY3RlZFZhbHVlcy5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICB0aGlzLmNvdW50TGFiZWwuaW5uZXJUZXh0ID0gYCR7dGhpcy5zZWxlY3RlZFZhbHVlcy5sZW5ndGh9IHNlbGVjdGVkYDtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHRoaXMuY291bnRMYWJlbC5yZW1vdmUoKTtcbiAgICAgICAgICAgIHRoaXMuY291bnRMYWJlbCA9IHVuZGVmaW5lZDtcbiAgICAgICAgfVxuICAgIH07XG4gICAgLyoqXG4gICAgICogSGFuZGxlIGNsaWNrIGV2ZW50IGZvciBlYWNoIG9wdGlvbiBpbiB0aGUgbXVsdGktc2VsZWN0IGNvbnRyb2wuICBUb2dnbGVzIHRoZSBzZWxlY3RlZCBzdGF0ZSBvZiB0aGUgb3B0aW9uIGFuZCB1cGRhdGVzIHRoZSBcbiAgICAgKiBoZWFkZXIgaWYgYGxpc3RBbGxgIGlzIGB0cnVlYC5cbiAgICAgKiBAcGFyYW0ge09iamVjdH0gbyBPYmplY3QgdGhhdCB0cmlnZ2VyZWQgdGhlIGV2ZW50LlxuICAgICAqL1xuICAgIGhhbmRsZU9wdGlvbiA9IChvKSA9PiB7XG4gICAgICAgIGlmICghby5jdXJyZW50VGFyZ2V0LmNsYXNzTGlzdC5jb250YWlucyhjc3NIZWxwZXIubXVsdGlTZWxlY3Quc2VsZWN0ZWQpKSB7XG4gICAgICAgICAgICAvL3NlbGVjdCBpdGVtLlxuICAgICAgICAgICAgby5jdXJyZW50VGFyZ2V0LmNsYXNzTGlzdC5hZGQoY3NzSGVscGVyLm11bHRpU2VsZWN0LnNlbGVjdGVkKTtcbiAgICAgICAgICAgIG8uY3VycmVudFRhcmdldC5kYXRhc2V0LnNlbGVjdGVkID0gXCJ0cnVlXCI7XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIHRoaXMuc2VsZWN0ZWRWYWx1ZXMucHVzaChvLmN1cnJlbnRUYXJnZXQuZGF0YXNldC52YWx1ZSk7XG5cbiAgICAgICAgICAgIGlmICh0aGlzLmxpc3RBbGwpIHtcbiAgICAgICAgICAgICAgICBjb25zdCBzcGFuID0gRWxlbWVudEhlbHBlci5zcGFuKHsgY2xhc3NOYW1lOiBjc3NIZWxwZXIubXVsdGlTZWxlY3QuaGVhZGVyT3B0aW9uLCBpbm5lclRleHQ6IG8uY3VycmVudFRhcmdldC5kYXRhc2V0LnZhbHVlIH0sIHsgdmFsdWU6IG8uY3VycmVudFRhcmdldC5kYXRhc2V0LnZhbHVlIH0pO1xuICAgICAgICAgICAgICAgIHRoaXMuaGVhZGVyLmFwcGVuZChzcGFuKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIC8vZGVzZWxlY3QgaXRlbS5cbiAgICAgICAgICAgIG8uY3VycmVudFRhcmdldC5jbGFzc0xpc3QucmVtb3ZlKGNzc0hlbHBlci5tdWx0aVNlbGVjdC5zZWxlY3RlZCk7XG4gICAgICAgICAgICBvLmN1cnJlbnRUYXJnZXQuZGF0YXNldC5zZWxlY3RlZCA9IFwiZmFsc2VcIjtcblxuICAgICAgICAgICAgdGhpcy5zZWxlY3RlZFZhbHVlcyA9IHRoaXMuc2VsZWN0ZWRWYWx1ZXMuZmlsdGVyKGYgPT4gZiAhPT0gby5jdXJyZW50VGFyZ2V0LmRhdGFzZXQudmFsdWUpO1xuXG4gICAgICAgICAgICBpZiAodGhpcy5saXN0QWxsKSB7XG4gICAgICAgICAgICAgICAgY29uc3QgaXRlbSA9IHRoaXMuaGVhZGVyLnF1ZXJ5U2VsZWN0b3IoYFtkYXRhLXZhbHVlPScke28uY3VycmVudFRhcmdldC5kYXRhc2V0LnZhbHVlfSddYCk7XG5cbiAgICAgICAgICAgICAgICBpZiAoaXRlbSAhPT0gbnVsbCkge1xuICAgICAgICAgICAgICAgICAgICBpdGVtLnJlbW92ZSgpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIGlmICh0aGlzLmxpc3RBbGwgPT09IGZhbHNlKSB7XG4gICAgICAgICAgICB0aGlzLmNyZWF0ZUNvdW50TGFiZWwoKTtcbiAgICAgICAgfVxuICAgIH07XG5cbiAgICB0ZW1wbGF0ZUNvbnRhaW5lciA9IChkYXRhKSA9PiB7XG4gICAgICAgIGZvciAoY29uc3QgaXRlbSBvZiBkYXRhKSB7XG4gICAgICAgICAgICBjb25zdCBvcHRpb24gPSBFbGVtZW50SGVscGVyLmRpdih7IGNsYXNzTmFtZTogY3NzSGVscGVyLm11bHRpU2VsZWN0Lm9wdGlvbiB9LCB7IHZhbHVlOiBpdGVtLnZhbHVlLCBzZWxlY3RlZDogXCJmYWxzZVwiIH0pO1xuICAgICAgICAgICAgY29uc3QgcmFkaW8gPSBFbGVtZW50SGVscGVyLnNwYW4oeyBjbGFzc05hbWU6IGNzc0hlbHBlci5tdWx0aVNlbGVjdC5vcHRpb25SYWRpbyB9KTtcbiAgICAgICAgICAgIGNvbnN0IHRleHQgPSBFbGVtZW50SGVscGVyLnNwYW4oeyBjbGFzc05hbWU6IGNzc0hlbHBlci5tdWx0aVNlbGVjdC5vcHRpb25UZXh0LCBpbm5lckhUTUw6IGl0ZW0udGV4dCB9KTtcblxuICAgICAgICAgICAgb3B0aW9uLmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCB0aGlzLmhhbmRsZU9wdGlvbik7XG4gICAgICAgICAgICBvcHRpb24uYXBwZW5kKHJhZGlvLCB0ZXh0KTtcblxuICAgICAgICAgICAgdGhpcy5vcHRpb25zQ29udGFpbmVyLmFwcGVuZChvcHRpb24pO1xuICAgICAgICB9XG4gICAgfTtcblxuICAgIHJlZnJlc2hTZWxlY3RPcHRpb25zID0gKGRhdGEpID0+IHtcbiAgICAgICAgdGhpcy5vcHRpb25zQ29udGFpbmVyLnJlcGxhY2VDaGlsZHJlbigpO1xuICAgICAgICB0aGlzLmhlYWRlci5yZXBsYWNlQ2hpbGRyZW4oKTtcbiAgICAgICAgdGhpcy5jb3VudExhYmVsID0gdW5kZWZpbmVkOyAgLy9zZXQgdG8gdW5kZWZpbmVkIHNvIGl0IGNhbiBiZSByZWNyZWF0ZWQgbGF0ZXIuXG4gICAgICAgIGNvbnN0IG5ld1NlbGVjdGVkID0gW107XG5cbiAgICAgICAgZm9yIChjb25zdCBpdGVtIG9mIGRhdGEpIHtcbiAgICAgICAgICAgIGNvbnN0IG9wdGlvbiA9IEVsZW1lbnRIZWxwZXIuZGl2KHsgY2xhc3NOYW1lOiBjc3NIZWxwZXIubXVsdGlTZWxlY3Qub3B0aW9uIH0sIHsgdmFsdWU6IGl0ZW0udmFsdWUsIHNlbGVjdGVkOiBcImZhbHNlXCIgfSk7XG4gICAgICAgICAgICBjb25zdCByYWRpbyA9IEVsZW1lbnRIZWxwZXIuc3Bhbih7IGNsYXNzTmFtZTogY3NzSGVscGVyLm11bHRpU2VsZWN0Lm9wdGlvblJhZGlvIH0pO1xuICAgICAgICAgICAgY29uc3QgdGV4dCA9IEVsZW1lbnRIZWxwZXIuc3Bhbih7IGNsYXNzTmFtZTogY3NzSGVscGVyLm11bHRpU2VsZWN0Lm9wdGlvblRleHQsIGlubmVySFRNTDogaXRlbS50ZXh0IH0pO1xuXG4gICAgICAgICAgICBvcHRpb24uYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsIHRoaXMuaGFuZGxlT3B0aW9uKTtcbiAgICAgICAgICAgIC8vY2hlY2sgaWYgaXRlbSBpcyBzZWxlY3RlZC5cbiAgICAgICAgICAgIGlmICh0aGlzLnNlbGVjdGVkVmFsdWVzLmluY2x1ZGVzKGl0ZW0udmFsdWUpKSB7XG4gICAgICAgICAgICAgICAgLy9zZWxlY3QgaXRlbS5cbiAgICAgICAgICAgICAgICBvcHRpb24uY2xhc3NMaXN0LmFkZChjc3NIZWxwZXIubXVsdGlTZWxlY3Quc2VsZWN0ZWQpO1xuICAgICAgICAgICAgICAgIG9wdGlvbi5kYXRhc2V0LnNlbGVjdGVkID0gXCJ0cnVlXCI7XG4gICAgICAgICAgICAgICAgbmV3U2VsZWN0ZWQucHVzaChpdGVtLnZhbHVlKTtcblxuICAgICAgICAgICAgICAgIGlmICh0aGlzLmxpc3RBbGwpIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc3Qgc3BhbiA9IEVsZW1lbnRIZWxwZXIuc3Bhbih7IGNsYXNzTmFtZTogY3NzSGVscGVyLm11bHRpU2VsZWN0LmhlYWRlck9wdGlvbiwgaW5uZXJUZXh0OiBpdGVtLnZhbHVlIH0sIHsgdmFsdWU6IGl0ZW0udmFsdWUgfSk7XG5cbiAgICAgICAgICAgICAgICAgICAgdGhpcy5oZWFkZXIuYXBwZW5kKHNwYW4pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgb3B0aW9uLmFwcGVuZChyYWRpbywgdGV4dCk7XG5cbiAgICAgICAgICAgIHRoaXMub3B0aW9uc0NvbnRhaW5lci5hcHBlbmQob3B0aW9uKTtcbiAgICAgICAgfVxuICAgICAgICAvL3NldCBuZXcgc2VsZWN0ZWQgdmFsdWVzIGFzIGl0ZW1zIG1heSBoYXZlIGJlZW4gcmVtb3ZlZCBvbiByZWZyZXNoLlxuICAgICAgICB0aGlzLnNlbGVjdGVkVmFsdWVzID0gbmV3U2VsZWN0ZWQ7XG5cbiAgICAgICAgaWYgKHRoaXMubGlzdEFsbCA9PT0gZmFsc2UpIHtcbiAgICAgICAgICAgIHRoaXMuY3JlYXRlQ291bnRMYWJlbCgpO1xuICAgICAgICB9XG4gICAgfTtcblxuICAgIGdldCB2YWx1ZSgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuc2VsZWN0ZWRWYWx1ZXM7XG4gICAgfVxufVxuXG5leHBvcnQgeyBFbGVtZW50TXVsdGlTZWxlY3QgfTsiLCJpbXBvcnQgeyBFbGVtZW50SGVscGVyIH0gZnJvbSBcIi4uLy4uLy4uL2NvbXBvbmVudHMvaGVscGVycy9lbGVtZW50SGVscGVyLmpzXCI7XG4vKipcbiAqIFJlcHJlc2VudHMgYSBjb2x1bW5zIGZpbHRlciBjb250cm9sLiAgQ3JlYXRlcyBhIGBIVE1MU2VsZWN0RWxlbWVudGAgdGhhdCBpcyBhZGRlZCB0byB0aGUgaGVhZGVyIHJvdyBvZiB0aGUgZ3JpZCB0byBmaWx0ZXIgZGF0YSBcbiAqIHNwZWNpZmljIHRvIGl0cyBkZWZpbmVkIGNvbHVtbi4gIElmIGBmaWx0ZXJWYWx1ZXNSZW1vdGVTb3VyY2VgIGlzIGRlZmluZWQsIHRoZSBzZWxlY3Qgb3B0aW9ucyB3aWxsIGJlIHBvcHVsYXRlZCBieSB0aGUgZGF0YSByZXR1cm5lZCBcbiAqIGZyb20gdGhlIHJlbW90ZSBzb3VyY2UgYnkgcmVnaXN0ZXJpbmcgdG8gdGhlIGdyaWQgcGlwZWxpbmUncyBgaW5pdGAgYW5kIGByZWZyZXNoYCBldmVudHMuXG4gKi9cbmNsYXNzIEVsZW1lbnRTZWxlY3Qge1xuICAgIC8qKlxuICAgICAqIENyZWF0ZSBmaWx0ZXIgb2JqZWN0IHRoYXQgcmVwcmVzZW50cyBhIGBIVE1MU2VsZWN0RWxlbWVudGAgZWxlbWVudCBpbiB0aGUgdGFibGUncyBoZWFkZXIgcm93LlxuICAgICAqIEBwYXJhbSB7Q29sdW1ufSBjb2x1bW4gQ29sdW1uIGNsYXNzIG9iamVjdC5cbiAgICAgKiBAcGFyYW0ge0dyaWRDb250ZXh0fSBjb250ZXh0IEdyaWQgY29udGV4dC4gXG4gICAgICovXG4gICAgY29uc3RydWN0b3IoY29sdW1uLCBjb250ZXh0KSB7XG4gICAgICAgIHRoaXMuZWxlbWVudCA9IEVsZW1lbnRIZWxwZXIuY3JlYXRlKFwic2VsZWN0XCIsIHsgbmFtZTogY29sdW1uLmZpZWxkIH0pO1xuICAgICAgICB0aGlzLmZpZWxkID0gY29sdW1uLmZpZWxkO1xuICAgICAgICB0aGlzLmZpZWxkVHlwZSA9IGNvbHVtbi50eXBlOyAgLy9maWVsZCB2YWx1ZSB0eXBlLlxuICAgICAgICB0aGlzLmZpbHRlclR5cGUgPSBjb2x1bW4uZmlsdGVyVHlwZTsgIC8vY29uZGl0aW9uIHR5cGUuXG4gICAgICAgIHRoaXMuZmlsdGVySXNGdW5jdGlvbiA9ICh0eXBlb2YgY29sdW1uPy5maWx0ZXJUeXBlID09PSBcImZ1bmN0aW9uXCIpO1xuICAgICAgICB0aGlzLmZpbHRlclBhcmFtcyA9IGNvbHVtbi5maWx0ZXJQYXJhbXM7XG4gICAgICAgIHRoaXMucGlwZWxpbmUgPSBjb250ZXh0LnBpcGVsaW5lO1xuICAgICAgICB0aGlzLmNvbnRleHQgPSBjb250ZXh0O1xuXG4gICAgICAgIHRoaXMuZWxlbWVudC5pZCA9IGAke2NvbHVtbi5zZXR0aW5ncy5iYXNlSWROYW1lfV8ke3RoaXMuZmllbGR9YDtcbiAgICAgICAgdGhpcy5lbGVtZW50LmFkZEV2ZW50TGlzdGVuZXIoXCJjaGFuZ2VcIiwgYXN5bmMgKCkgPT4gYXdhaXQgdGhpcy5jb250ZXh0LmV2ZW50cy50cmlnZ2VyKFwicmVuZGVyXCIpKTtcblxuICAgICAgICBpZiAoY29sdW1uLmZpbHRlckNzcykge1xuICAgICAgICAgICAgdGhpcy5lbGVtZW50LmNsYXNzTmFtZSA9IGNvbHVtbi5maWx0ZXJDc3M7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoY29sdW1uLmZpbHRlclZhbHVlc1JlbW90ZVNvdXJjZSkge1xuICAgICAgICAgICAgLy9zZXQgdXAgcGlwZWxpbmUgdG8gcmV0cmlldmUgb3B0aW9uIGRhdGEgd2hlbiBpbml0IHBpcGVsaW5lIGlzIGNhbGxlZC5cbiAgICAgICAgICAgIHRoaXMucGlwZWxpbmUuYWRkU3RlcChcImluaXRcIiwgdGhpcy5jcmVhdGVTZWxlY3RPcHRpb25zLCBjb2x1bW4uZmlsdGVyVmFsdWVzUmVtb3RlU291cmNlKTtcbiAgICAgICAgICAgIHRoaXMucGlwZWxpbmUuYWRkU3RlcChcInJlZnJlc2hcIiwgdGhpcy5yZWZyZXNoU2VsZWN0T3B0aW9ucywgY29sdW1uLmZpbHRlclZhbHVlc1JlbW90ZVNvdXJjZSk7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH0gXG4gICAgICAgIC8vdXNlIHVzZXIgc3VwcGxpZWQgdmFsdWVzIHRvIGNyZWF0ZSBzZWxlY3Qgb3B0aW9ucy5cbiAgICAgICAgY29uc3Qgb3B0cyA9IEFycmF5LmlzQXJyYXkoY29sdW1uLmZpbHRlclZhbHVlcykgXG4gICAgICAgICAgICA/IGNvbHVtbi5maWx0ZXJWYWx1ZXNcbiAgICAgICAgICAgIDogT2JqZWN0LmVudHJpZXMoY29sdW1uLmZpbHRlclZhbHVlcykubWFwKChba2V5LCB2YWx1ZV0pID0+ICh7IHZhbHVlOiBrZXksIHRleHQ6IHZhbHVlfSkpO1xuXG4gICAgICAgIHRoaXMuY3JlYXRlU2VsZWN0T3B0aW9ucyhvcHRzKTtcbiAgICB9XG4gICAgLyoqXG4gICAgICogQnVpbGRzIG9wdGlvbiBlbGVtZW50cyBmb3IgY2xhc3MncyBgc2VsZWN0YCBpbnB1dC4gIEV4cGVjdHMgYW4gYXJyYXkgb2Ygb2JqZWN0cyB3aXRoIGtleS92YWx1ZSBwYWlycyBvZjpcbiAgICAgKiAgKiBgdmFsdWVgOiBvcHRpb24gdmFsdWUuICBzaG91bGQgYmUgYSBwcmltYXJ5IGtleSB0eXBlIHZhbHVlIHdpdGggbm8gYmxhbmsgc3BhY2VzLlxuICAgICAqICAqIGB0ZXh0YDogb3B0aW9uIHRleHQgdmFsdWVcbiAgICAgKiBAcGFyYW0ge0FycmF5PG9iamVjdD59IGRhdGEga2V5L3ZhbHVlIGFycmF5IG9mIHZhbHVlcy5cbiAgICAgKi9cbiAgICBjcmVhdGVTZWxlY3RPcHRpb25zID0gKGRhdGEpID0+IHtcbiAgICAgICAgY29uc3QgZmlyc3QgPSBFbGVtZW50SGVscGVyLmNyZWF0ZShcIm9wdGlvblwiLCB7IHZhbHVlOiBcIlwiLCB0ZXh0OiBcIlNlbGVjdCBhbGxcIiB9KTtcblxuICAgICAgICB0aGlzLmVsZW1lbnQuYXBwZW5kKGZpcnN0KTtcblxuICAgICAgICBmb3IgKGNvbnN0IGl0ZW0gb2YgZGF0YSkge1xuICAgICAgICAgICAgY29uc3Qgb3B0aW9uID0gRWxlbWVudEhlbHBlci5jcmVhdGUoXCJvcHRpb25cIiwgeyB2YWx1ZTogaXRlbS52YWx1ZSwgdGV4dDogaXRlbS50ZXh0IH0pO1xuXG4gICAgICAgICAgICB0aGlzLmVsZW1lbnQuYXBwZW5kKG9wdGlvbik7XG4gICAgICAgIH1cbiAgICB9O1xuICAgIC8qKlxuICAgICAqIFJlcGxhY2VzL3VwZGF0ZXMgb3B0aW9uIGVsZW1lbnRzIGZvciBjbGFzcydzIGBzZWxlY3RgIGlucHV0LiAgV2lsbCBwZXJzaXN0IHRoZSBjdXJyZW50IHNlbGVjdCB2YWx1ZSwgaWYgYW55LiAgXG4gICAgICogRXhwZWN0cyBhbiBhcnJheSBvZiBvYmplY3RzIHdpdGgga2V5L3ZhbHVlIHBhaXJzIG9mOlxuICAgICAqICAqIGB2YWx1ZWA6IE9wdGlvbiB2YWx1ZS4gIFNob3VsZCBiZSBhIHByaW1hcnkga2V5IHR5cGUgdmFsdWUgd2l0aCBubyBibGFuayBzcGFjZXMuXG4gICAgICogICogYHRleHRgOiBPcHRpb24gdGV4dC5cbiAgICAgKiBAcGFyYW0ge0FycmF5PG9iamVjdD59IGRhdGEga2V5L3ZhbHVlIGFycmF5IG9mIHZhbHVlcy5cbiAgICAgKi9cbiAgICByZWZyZXNoU2VsZWN0T3B0aW9ucyA9IChkYXRhKSA9PiB7XG4gICAgICAgIGNvbnN0IHNlbGVjdGVkVmFsdWUgPSB0aGlzLmVsZW1lbnQudmFsdWU7XG5cbiAgICAgICAgdGhpcy5lbGVtZW50LnJlcGxhY2VDaGlsZHJlbigpO1xuICAgICAgICB0aGlzLmNyZWF0ZVNlbGVjdE9wdGlvbnMoZGF0YSk7XG4gICAgICAgIHRoaXMuZWxlbWVudC52YWx1ZSA9IHNlbGVjdGVkVmFsdWU7XG4gICAgfTtcblxuICAgIGdldCB2YWx1ZSgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuZWxlbWVudC52YWx1ZTtcbiAgICB9XG59XG5cbmV4cG9ydCB7IEVsZW1lbnRTZWxlY3QgfTsiLCJpbXBvcnQgeyBEYXRlSGVscGVyIH0gZnJvbSBcIi4uLy4uL2NvbXBvbmVudHMvaGVscGVycy9kYXRlSGVscGVyLmpzXCI7XG5pbXBvcnQgeyBGaWx0ZXJUYXJnZXQgfSBmcm9tIFwiLi90eXBlcy9maWx0ZXJUYXJnZXQuanNcIjtcbmltcG9ydCB7IEZpbHRlckRhdGUgfSBmcm9tIFwiLi90eXBlcy9maWx0ZXJEYXRlLmpzXCI7XG5pbXBvcnQgeyBGaWx0ZXJGdW5jdGlvbiB9IGZyb20gXCIuL3R5cGVzL2ZpbHRlckZ1bmN0aW9uLmpzXCI7XG5pbXBvcnQgeyBFbGVtZW50QmV0d2VlbiB9IGZyb20gXCIuL2VsZW1lbnRzL2VsZW1lbnRCZXR3ZWVuLmpzXCI7XG5pbXBvcnQgeyBFbGVtZW50SW5wdXQgfSBmcm9tIFwiLi9lbGVtZW50cy9lbGVtZW50SW5wdXQuanNcIjtcbmltcG9ydCB7IEVsZW1lbnRNdWx0aVNlbGVjdCB9IGZyb20gXCIuL2VsZW1lbnRzL2VsZW1lbnRNdWx0aVNlbGVjdC5qc1wiO1xuaW1wb3J0IHsgRWxlbWVudFNlbGVjdCB9IGZyb20gXCIuL2VsZW1lbnRzL2VsZW1lbnRTZWxlY3QuanNcIjtcbi8qKlxuICogUHJvdmlkZXMgYSBtZWFucyB0byBmaWx0ZXIgZGF0YSBpbiB0aGUgZ3JpZC4gIFRoaXMgbW9kdWxlIGNyZWF0ZXMgaGVhZGVyIGZpbHRlciBjb250cm9scyBmb3IgZWFjaCBjb2x1bW4gdGhhdCBoYXMgXG4gKiBhIGBoYXNGaWx0ZXJgIGF0dHJpYnV0ZSBzZXQgdG8gYHRydWVgLlxuICogXG4gKiBDbGFzcyBzdWJzY3JpYmVzIHRvIHRoZSBgcmVuZGVyYCBldmVudCB0byB1cGRhdGUgdGhlIGZpbHRlciBjb250cm9sIHdoZW4gdGhlIGdyaWQgaXMgcmVuZGVyZWQuICBJdCBhbHNvIGNhbGxzIHRoZSBjaGFpbiBcbiAqIGV2ZW50IGByZW1vdGVQYXJhbXNgIHRvIGNvbXBpbGUgYSBsaXN0IG9mIHBhcmFtZXRlcnMgdG8gYmUgcGFzc2VkIHRvIHRoZSByZW1vdGUgZGF0YSBzb3VyY2Ugd2hlbiB1c2luZyByZW1vdGUgcHJvY2Vzc2luZy5cbiAqL1xuY2xhc3MgRmlsdGVyTW9kdWxlIHtcbiAgICAvKipcbiAgICAgKiBDcmVhdGVzIGEgbmV3IGZpbHRlciBtb2R1bGUgb2JqZWN0LlxuICAgICAqIEBwYXJhbSB7R3JpZENvbnRleHR9IGNvbnRleHQgR3JpZCBjb250ZXh0LlxuICAgICAqL1xuICAgIGNvbnN0cnVjdG9yKGNvbnRleHQpIHtcbiAgICAgICAgdGhpcy5jb250ZXh0ID0gY29udGV4dDtcbiAgICAgICAgdGhpcy5oZWFkZXJGaWx0ZXJzID0gW107XG4gICAgICAgIHRoaXMuZ3JpZEZpbHRlcnMgPSBbXTtcbiAgICB9XG5cbiAgICBpbml0aWFsaXplKCkge1xuICAgICAgICBpZiAodGhpcy5jb250ZXh0LnNldHRpbmdzLnJlbW90ZVByb2Nlc3NpbmcpIHtcbiAgICAgICAgICAgIHRoaXMuY29udGV4dC5ldmVudHMuc3Vic2NyaWJlKFwicmVtb3RlUGFyYW1zXCIsIHRoaXMucmVtb3RlUGFyYW1zLCB0cnVlKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHRoaXMuY29udGV4dC5ldmVudHMuc3Vic2NyaWJlKFwicmVuZGVyXCIsIHRoaXMucmVuZGVyTG9jYWwsIGZhbHNlLCA4KTtcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMuX2luaXQoKTtcbiAgICB9XG4gICAgLyoqXG4gICAgICogQ3JlYXRlIGBIZWFkZXJGaWx0ZXJgIENsYXNzIGZvciBncmlkIGNvbHVtbnMgd2l0aCBhIGBoYXNGaWx0ZXJgIGF0dHJpYnV0ZSBvZiBgdHJ1ZWAuXG4gICAgICovXG4gICAgX2luaXQoKSB7XG4gICAgICAgIGZvciAoY29uc3QgY29sIG9mIHRoaXMuY29udGV4dC5jb2x1bW5NYW5hZ2VyLmNvbHVtbnMpIHtcbiAgICAgICAgICAgIGlmICghY29sLmhhc0ZpbHRlcikgY29udGludWU7XG5cbiAgICAgICAgICAgIGlmIChjb2wuZmlsdGVyRWxlbWVudCA9PT0gXCJtdWx0aVwiKSB7XG4gICAgICAgICAgICAgICAgY29sLmhlYWRlckZpbHRlciA9IG5ldyBFbGVtZW50TXVsdGlTZWxlY3QoY29sLCB0aGlzLmNvbnRleHQpO1xuICAgICAgICAgICAgfSBlbHNlIGlmIChjb2wuZmlsdGVyRWxlbWVudCA9PT0gXCJiZXR3ZWVuXCIpIHtcbiAgICAgICAgICAgICAgICBjb2wuaGVhZGVyRmlsdGVyID0gbmV3IEVsZW1lbnRCZXR3ZWVuKGNvbCwgdGhpcy5jb250ZXh0KTtcbiAgICAgICAgICAgIH0gZWxzZSBpZiAoY29sLmZpbHRlckVsZW1lbnQgPT09IFwic2VsZWN0XCIpIHtcbiAgICAgICAgICAgICAgICBjb2wuaGVhZGVyRmlsdGVyID0gbmV3IEVsZW1lbnRTZWxlY3QoY29sLCB0aGlzLmNvbnRleHQpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBjb2wuaGVhZGVyRmlsdGVyID0gbmV3IEVsZW1lbnRJbnB1dChjb2wsIHRoaXMuY29udGV4dCk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGNvbC5oZWFkZXJDZWxsLmVsZW1lbnQuYXBwZW5kQ2hpbGQoY29sLmhlYWRlckZpbHRlci5lbGVtZW50KTtcbiAgICAgICAgICAgIHRoaXMuaGVhZGVyRmlsdGVycy5wdXNoKGNvbC5oZWFkZXJGaWx0ZXIpO1xuICAgICAgICB9XG4gICAgfVxuICAgIC8qKlxuICAgICAqIENvbXBpbGVzIGhlYWRlciBhbmQgZ3JpZCBmaWx0ZXIgdmFsdWVzIGludG8gYSBzaW5nbGUgb2JqZWN0IG9mIGtleS92YWx1ZSBwYWlycyB0aGF0IGNhbiBiZSB1c2VkIHRvIHNlbmQgdG8gdGhlIHJlbW90ZSBkYXRhIHNvdXJjZS5cbiAgICAgKiBAcGFyYW0ge09iamVjdH0gcGFyYW1zIE9iamVjdCBvZiBrZXkvdmFsdWUgcGFpcnMgdG8gYmUgc2VudCB0byB0aGUgcmVtb3RlIGRhdGEgc291cmNlLlxuICAgICAqIEByZXR1cm5zIHtPYmplY3R9IFJldHVybnMgdGhlIG1vZGlmaWVkIHBhcmFtcyBvYmplY3Qgd2l0aCBmaWx0ZXIgdmFsdWVzIGFkZGVkLlxuICAgICAqL1xuICAgIHJlbW90ZVBhcmFtcyA9IChwYXJhbXMpID0+IHtcbiAgICAgICAgdGhpcy5oZWFkZXJGaWx0ZXJzLmZvckVhY2goKGYpID0+IHtcbiAgICAgICAgICAgIGlmIChmLnZhbHVlICE9PSBcIlwiKSB7XG4gICAgICAgICAgICAgICAgcGFyYW1zW2YuZmllbGRdID0gZi52YWx1ZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG5cbiAgICAgICAgaWYgKHRoaXMuZ3JpZEZpbHRlcnMubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgZm9yIChjb25zdCBpdGVtIG9mIHRoaXMuZ3JpZEZpbHRlcnMpIHtcbiAgICAgICAgICAgICAgICBwYXJhbXNbaXRlbS5maWVsZF0gPSBpdGVtLnZhbHVlO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHBhcmFtcztcbiAgICB9O1xuICAgIC8qKlxuICAgICAqIENvbnZlcnQgdmFsdWUgdHlwZSB0byBjb2x1bW4gdHlwZS4gIElmIHZhbHVlIGNhbm5vdCBiZSBjb252ZXJ0ZWQsIGBudWxsYCBpcyByZXR1cm5lZC5cbiAgICAgKiBAcGFyYW0ge29iamVjdCB8IHN0cmluZyB8IG51bWJlcn0gdmFsdWUgUmF3IGZpbHRlciB2YWx1ZS5cbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gdHlwZSBGaWVsZCB0eXBlLlxuICAgICAqIEByZXR1cm5zIHtudW1iZXIgfCBEYXRlIHwgc3RyaW5nIHwgbnVsbCB8IE9iamVjdH0gaW5wdXQgdmFsdWUgb3IgYG51bGxgIGlmIGVtcHR5LlxuICAgICAqL1xuICAgIGNvbnZlcnRUb1R5cGUodmFsdWUsIHR5cGUpIHtcbiAgICAgICAgaWYgKHZhbHVlID09PSBcIlwiIHx8IHZhbHVlID09PSBudWxsKSByZXR1cm4gdmFsdWU7XG5cbiAgICAgICAgaWYgKEFycmF5LmlzQXJyYXkodmFsdWUpKSB7XG4gICAgICAgICAgICBpZiAodHlwZSA9PT0gXCJkYXRlXCIgfHwgdHlwZSA9PT0gXCJkYXRldGltZVwiKSAgeyBcbiAgICAgICAgICAgICAgICBjb25zdCByZXN1bHQgPSB2YWx1ZS5tYXAoKHYpID0+IERhdGVIZWxwZXIucGFyc2VEYXRlKHYpKTsgXG5cbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzdWx0LmluY2x1ZGVzKFwiXCIpID8gbnVsbCA6IHJlc3VsdDtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKHR5cGUgPT09IFwibnVtYmVyXCIpIHtcbiAgICAgICAgICAgICAgICBjb25zdCB2YWx1ZTEgPSB0aGlzLmNvbnZlcnRUb1R5cGUodmFsdWVbMF0sIHR5cGUpO1xuICAgICAgICAgICAgICAgIGNvbnN0IHZhbHVlMiA9IHRoaXMuY29udmVydFRvVHlwZSh2YWx1ZVsxXSwgdHlwZSk7ICBcblxuICAgICAgICAgICAgICAgIHJldHVybiB2YWx1ZTEgPT09IG51bGwgfHwgdmFsdWUyID09PSBudWxsID8gbnVsbCA6IFt2YWx1ZTEsIHZhbHVlMl07XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHJldHVybiB2YWx1ZTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICh0eXBlID09PSBcIm51bWJlclwiKSB7XG4gICAgICAgICAgICB2YWx1ZSA9IE51bWJlcih2YWx1ZSk7XG4gICAgICAgICAgICByZXR1cm4gTnVtYmVyLmlzTmFOKHZhbHVlKSA/IG51bGwgOiB2YWx1ZTtcbiAgICAgICAgfSBcbiAgICAgICAgXG4gICAgICAgIGlmICh0eXBlID09PSBcImRhdGVcIiB8fCB0eXBlID09PSBcImRhdGV0aW1lXCIpIHtcbiAgICAgICAgICAgIHZhbHVlID0gRGF0ZUhlbHBlci5wYXJzZURhdGVPbmx5KHZhbHVlKTtcbiAgICAgICAgICAgIHJldHVybiB2YWx1ZSA9PT0gXCJcIiA/IG51bGwgOiB2YWx1ZTtcbiAgICAgICAgfSBcbiAgICAgICAgLy9hc3N1bWluZyBpdCdzIGEgc3RyaW5nIHZhbHVlIG9yIE9iamVjdCBhdCB0aGlzIHBvaW50LlxuICAgICAgICByZXR1cm4gdmFsdWU7XG4gICAgfVxuICAgIC8qKlxuICAgICAqIFdyYXBzIHRoZSBmaWx0ZXIgaW5wdXQgdmFsdWUgaW4gYSBgRmlsdGVyVGFyZ2V0YCBvYmplY3QsIHdoaWNoIGRlZmluZXMgYSBzaW5nbGUgZmlsdGVyIGNvbmRpdGlvbiBmb3IgYSBjb2x1bW4uXG4gICAgICogQHBhcmFtIHtzdHJpbmcgfCBEYXRlIHwgbnVtYmVyIHwgT2JqZWN0fSB2YWx1ZSBGaWx0ZXIgdmFsdWUgdG8gYXBwbHkgdG8gdGhlIGNvbHVtbi5cbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gZmllbGQgVGhlIGZpZWxkIG5hbWUgb2YgdGhlIGNvbHVtbiBiZWluZyBmaWx0ZXJlZC4gVGhpcyBpcyB1c2VkIHRvIGlkZW50aWZ5IHRoZSBjb2x1bW4gaW4gdGhlIGRhdGEgc2V0LlxuICAgICAqIEBwYXJhbSB7c3RyaW5nIHwgRnVuY3Rpb259IGZpbHRlclR5cGUgVGhlIHR5cGUgb2YgZmlsdGVyIHRvIGFwcGx5IChlLmcuLCBcImVxdWFsc1wiLCBcImxpa2VcIiwgXCI8XCIsIFwiPD1cIiwgXCI+XCIsIFwiPj1cIiwgXCIhPVwiLCBcImJldHdlZW5cIiwgXCJpblwiKS5cbiAgICAgKiBDYW4gYWxzbyBiZSBhIGZ1bmN0aW9uLlxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBmaWVsZFR5cGUgVGhlIHR5cGUgb2YgZmllbGQgYmVpbmcgZmlsdGVyZWQgKGUuZy4sIFwic3RyaW5nXCIsIFwibnVtYmVyXCIsIFwiZGF0ZVwiLCBcIm9iamVjdFwiKS5cbiAgICAgKiBAcGFyYW0ge2Jvb2xlYW59IGZpbHRlcklzRnVuY3Rpb24gSW5kaWNhdGVzIGlmIHRoZSBmaWx0ZXIgdHlwZSBpcyBhIGZ1bmN0aW9uLlxuICAgICAqIEBwYXJhbSB7T2JqZWN0fSBmaWx0ZXJQYXJhbXMgT3B0aW9uYWwgcGFyYW1ldGVycyB0byBwYXNzIHRvIHRoZSBmaWx0ZXIgZnVuY3Rpb24uXG4gICAgICogQHJldHVybnMge0ZpbHRlclRhcmdldCB8IEZpbHRlckRhdGUgfCBGaWx0ZXJGdW5jdGlvbiB8IG51bGx9IFJldHVybnMgYSBmaWx0ZXIgdGFyZ2V0IG9iamVjdCB0aGF0IGRlZmluZXMgYSBzaW5nbGUgZmlsdGVyIGNvbmRpdGlvbiBmb3IgYSBjb2x1bW4sIFxuICAgICAqIG9yIG51bGwgaWYgdGhlIHZhbHVlIGNhbm5vdCBiZSBjb252ZXJ0ZWQgdG8gdGhlIGZpZWxkIHR5cGUuIFxuICAgICAqL1xuICAgIGNyZWF0ZUZpbHRlclRhcmdldCh2YWx1ZSwgZmllbGQsIGZpbHRlclR5cGUsIGZpZWxkVHlwZSwgZmlsdGVySXNGdW5jdGlvbiwgZmlsdGVyUGFyYW1zKSB7IFxuICAgICAgICBpZiAoZmlsdGVySXNGdW5jdGlvbikgeyBcbiAgICAgICAgICAgIHJldHVybiBuZXcgRmlsdGVyRnVuY3Rpb24oeyB2YWx1ZTogdmFsdWUsIGZpZWxkOiBmaWVsZCwgZmlsdGVyVHlwZTogZmlsdGVyVHlwZSwgcGFyYW1zOiBmaWx0ZXJQYXJhbXMgfSk7XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCBjb252ZXJ0ZWRWYWx1ZSA9IHRoaXMuY29udmVydFRvVHlwZSh2YWx1ZSwgZmllbGRUeXBlKTtcblxuICAgICAgICBpZiAoY29udmVydGVkVmFsdWUgPT09IG51bGwpIHJldHVybiBudWxsO1xuXG4gICAgICAgIGlmIChmaWVsZFR5cGUgPT09IFwiZGF0ZVwiIHx8IGZpZWxkVHlwZSA9PT0gXCJkYXRldGltZVwiKSB7XG4gICAgICAgICAgICByZXR1cm4gbmV3IEZpbHRlckRhdGUoeyB2YWx1ZTogY29udmVydGVkVmFsdWUsIGZpZWxkOiBmaWVsZCwgZmlsdGVyVHlwZTogZmlsdGVyVHlwZSB9KTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBuZXcgRmlsdGVyVGFyZ2V0KHsgdmFsdWU6IGNvbnZlcnRlZFZhbHVlLCBmaWVsZDogZmllbGQsIGZpZWxkVHlwZTogZmllbGRUeXBlLCBmaWx0ZXJUeXBlOiBmaWx0ZXJUeXBlIH0pO1xuICAgIH1cbiAgICAvKipcbiAgICAgKiBDb21waWxlcyBhbiBhcnJheSBvZiBmaWx0ZXIgdHlwZSBvYmplY3RzIHRoYXQgY29udGFpbiBhIGZpbHRlciB2YWx1ZSB0aGF0IG1hdGNoZXMgaXRzIGNvbHVtbiB0eXBlLiAgQ29sdW1uIHR5cGUgbWF0Y2hpbmcgXG4gICAgICogaXMgbmVjZXNzYXJ5IHdoZW4gcHJvY2Vzc2luZyBkYXRhIGxvY2FsbHksIHNvIHRoYXQgZmlsdGVyIHZhbHVlIG1hdGNoZXMgYXNzb2NpYXRlZCByb3cgdHlwZSB2YWx1ZSBmb3IgY29tcGFyaXNvbi5cbiAgICAgKiBAcmV0dXJucyB7QXJyYXl9IGFycmF5IG9mIGZpbHRlciB0eXBlIG9iamVjdHMgd2l0aCB2YWxpZCB2YWx1ZS5cbiAgICAgKi9cbiAgICBjb21waWxlRmlsdGVycygpIHtcbiAgICAgICAgbGV0IHJlc3VsdHMgPSBbXTtcblxuICAgICAgICBmb3IgKGNvbnN0IGl0ZW0gb2YgdGhpcy5oZWFkZXJGaWx0ZXJzKSB7XG4gICAgICAgICAgICBpZiAoaXRlbS52YWx1ZSA9PT0gXCJcIikgY29udGludWU7XG5cbiAgICAgICAgICAgIGNvbnN0IGZpbHRlciA9IHRoaXMuY3JlYXRlRmlsdGVyVGFyZ2V0KGl0ZW0udmFsdWUsIGl0ZW0uZmllbGQsIGl0ZW0uZmlsdGVyVHlwZSwgaXRlbS5maWVsZFR5cGUsIGl0ZW0uZmlsdGVySXNGdW5jdGlvbiwgaXRlbT8uZmlsdGVyUGFyYW1zKTtcblxuICAgICAgICAgICAgaWYgKGZpbHRlciAhPT0gbnVsbCkge1xuICAgICAgICAgICAgICAgIHJlc3VsdHMucHVzaChmaWx0ZXIpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHRoaXMuZ3JpZEZpbHRlcnMubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgcmVzdWx0cyA9IHJlc3VsdHMuY29uY2F0KHRoaXMuZ3JpZEZpbHRlcnMpO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHJlc3VsdHM7XG4gICAgfVxuICAgIC8qKlxuICAgICAqIFVzZSB0YXJnZXQgZmlsdGVycyB0byBjcmVhdGUgYSBuZXcgZGF0YSBzZXQgaW4gdGhlIHBlcnNpc3RlbmNlIGRhdGEgcHJvdmlkZXIuXG4gICAgICogQHBhcmFtIHtBcnJheTxGaWx0ZXJUYXJnZXQ+fSB0YXJnZXRzIEFycmF5IG9mIEZpbHRlclRhcmdldCBvYmplY3RzLlxuICAgICAqL1xuICAgIGFwcGx5RmlsdGVycyh0YXJnZXRzKSB7XG4gICAgICAgIHRoaXMuY29udGV4dC5wZXJzaXN0ZW5jZS5kYXRhID0gW107XG4gICAgICAgIHRoaXMuY29udGV4dC5wZXJzaXN0ZW5jZS5kYXRhQ2FjaGUuZm9yRWFjaCgocm93KSA9PiB7XG4gICAgICAgICAgICBsZXQgbWF0Y2ggPSB0cnVlO1xuXG4gICAgICAgICAgICBmb3IgKGxldCBpdGVtIG9mIHRhcmdldHMpIHtcbiAgICAgICAgICAgICAgICBjb25zdCByb3dWYWwgPSB0aGlzLmNvbnZlcnRUb1R5cGUocm93W2l0ZW0uZmllbGRdLCBpdGVtLmZpZWxkVHlwZSk7XG4gICAgICAgICAgICAgICAgY29uc3QgcmVzdWx0ID0gaXRlbS5leGVjdXRlKHJvd1ZhbCwgcm93KTtcblxuICAgICAgICAgICAgICAgIGlmICghcmVzdWx0KSB7XG4gICAgICAgICAgICAgICAgICAgIG1hdGNoID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpZiAobWF0Y2gpIHtcbiAgICAgICAgICAgICAgICB0aGlzLmNvbnRleHQucGVyc2lzdGVuY2UuZGF0YS5wdXNoKHJvdyk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgIH1cbiAgICAvKipcbiAgICAgKiBSZW5kZXJzIHRoZSBsb2NhbCBkYXRhIHNldCBieSBhcHBseWluZyB0aGUgY29tcGlsZWQgZmlsdGVycyB0byB0aGUgcGVyc2lzdGVuY2UgZGF0YSBwcm92aWRlci5cbiAgICAgKi9cbiAgICByZW5kZXJMb2NhbCA9ICgpID0+IHtcbiAgICAgICAgY29uc3QgdGFyZ2V0cyA9IHRoaXMuY29tcGlsZUZpbHRlcnMoKTtcblxuICAgICAgICBpZiAoT2JqZWN0LmtleXModGFyZ2V0cykubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgdGhpcy5hcHBseUZpbHRlcnModGFyZ2V0cyk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB0aGlzLmNvbnRleHQucGVyc2lzdGVuY2UucmVzdG9yZURhdGEoKTtcbiAgICAgICAgfVxuICAgIH07XG4gICAgLyoqXG4gICAgICogUHJvdmlkZXMgYSBtZWFucyB0byBhcHBseSBhIGNvbmRpdGlvbiBvdXRzaWRlIHRoZSBoZWFkZXIgZmlsdGVyIGNvbnRyb2xzLiAgV2lsbCBhZGQgY29uZGl0aW9uXG4gICAgICogdG8gZ3JpZCdzIGBncmlkRmlsdGVyc2AgY29sbGVjdGlvbiwgYW5kIHJhaXNlIGByZW5kZXJgIGV2ZW50IHRvIGZpbHRlciBkYXRhIHNldC5cbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gZmllbGQgZmllbGQgbmFtZS5cbiAgICAgKiBAcGFyYW0ge29iamVjdH0gdmFsdWUgdmFsdWUuXG4gICAgICogQHBhcmFtIHtzdHJpbmcgfCBGdW5jdGlvbn0gdHlwZSBjb25kaXRpb24gdHlwZS5cbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gW2ZpZWxkVHlwZT1cInN0cmluZ1wiXSBmaWVsZCB0eXBlLlxuICAgICAqIEBwYXJhbSB7b2JqZWN0fSBbZmlsdGVyUGFyYW1zPXt9XSBhZGRpdGlvbmFsIGZpbHRlciBwYXJhbWV0ZXJzLlxuICAgICAqL1xuICAgIHNldEZpbHRlcihmaWVsZCwgdmFsdWUsIHR5cGUgPSBcImVxdWFsc1wiLCBmaWVsZFR5cGUgPSBcInN0cmluZ1wiLCBmaWx0ZXJQYXJhbXMgPSB7fSkge1xuICAgICAgICBjb25zdCBjb252ZXJ0ZWRWYWx1ZSA9IHRoaXMuY29udmVydFRvVHlwZSh2YWx1ZSwgZmllbGRUeXBlKTtcblxuICAgICAgICBpZiAodGhpcy5ncmlkRmlsdGVycy5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICBjb25zdCBpbmRleCA9IHRoaXMuZ3JpZEZpbHRlcnMuZmluZEluZGV4KChpKSA9PiBpLmZpZWxkID09PSBmaWVsZCk7XG4gICAgICAgICAgICAvL0lmIGZpZWxkIGFscmVhZHkgZXhpc3RzLCBqdXN0IHVwZGF0ZSB0aGUgdmFsdWUuXG4gICAgICAgICAgICBpZiAoaW5kZXggPiAtMSkge1xuICAgICAgICAgICAgICAgIHRoaXMuZ3JpZEZpbHRlcnNbaW5kZXhdLnZhbHVlID0gY29udmVydGVkVmFsdWU7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgY29uc3QgZmlsdGVyID0gdGhpcy5jcmVhdGVGaWx0ZXJUYXJnZXQoY29udmVydGVkVmFsdWUsIGZpZWxkLCB0eXBlLCBmaWVsZFR5cGUsICh0eXBlb2YgdHlwZSA9PT0gXCJmdW5jdGlvblwiKSwgZmlsdGVyUGFyYW1zKTtcbiAgICAgICAgdGhpcy5ncmlkRmlsdGVycy5wdXNoKGZpbHRlcik7XG4gICAgfVxuICAgIC8qKlxuICAgICAqIFJlbW92ZXMgZmlsdGVyIGNvbmRpdGlvbiBmcm9tIGdyaWQncyBgZ3JpZEZpbHRlcnNgIGNvbGxlY3Rpb24uXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IGZpZWxkIGZpZWxkIG5hbWUuXG4gICAgICovXG4gICAgcmVtb3ZlRmlsdGVyKGZpZWxkKSB7XG4gICAgICAgIHRoaXMuZ3JpZEZpbHRlcnMgPSB0aGlzLmdyaWRGaWx0ZXJzLmZpbHRlcihmID0+IGYuZmllbGQgIT09IGZpZWxkKTtcbiAgICB9XG59XG5cbkZpbHRlck1vZHVsZS5tb2R1bGVOYW1lID0gXCJmaWx0ZXJcIjtcblxuZXhwb3J0IHsgRmlsdGVyTW9kdWxlIH07IiwiLyoqXG4gKiBXaWxsIHJlLWxvYWQgdGhlIGdyaWQncyBkYXRhIGZyb20gaXRzIHRhcmdldCBzb3VyY2UgKGxvY2FsIG9yIHJlbW90ZSkuXG4gKi9cbmNsYXNzIFJlZnJlc2hNb2R1bGUge1xuICAgIC8qKlxuICAgICAqIFdpbGwgYXBwbHkgZXZlbnQgdG8gdGFyZ2V0IGJ1dHRvbiB0aGF0LCB3aGVuIGNsaWNrZWQsIHdpbGwgcmUtbG9hZCB0aGUgXG4gICAgICogZ3JpZCdzIGRhdGEgZnJvbSBpdHMgdGFyZ2V0IHNvdXJjZSAobG9jYWwgb3IgcmVtb3RlKS5cbiAgICAgKiBAcGFyYW0ge0dyaWRDb250ZXh0fSBjb250ZXh0IEdyaWQgY29udGV4dCBjbGFzcy5cbiAgICAgKi9cbiAgICBjb25zdHJ1Y3Rvcihjb250ZXh0KSB7XG4gICAgICAgIHRoaXMuY29udGV4dCA9IGNvbnRleHQ7XG4gICAgfVxuXG4gICAgaW5pdGlhbGl6ZSgpIHtcbiAgICAgICAgaWYgKCF0aGlzLmNvbnRleHQuc2V0dGluZ3MucmVtb3RlUHJvY2Vzc2luZyAmJiB0aGlzLmNvbnRleHQuc2V0dGluZ3MucmVtb3RlVXJsKSB7XG4gICAgICAgICAgICB0aGlzLmNvbnRleHQucGlwZWxpbmUuYWRkU3RlcChcInJlZnJlc2hcIiwgdGhpcy5jb250ZXh0LnBlcnNpc3RlbmNlLnNldERhdGEpO1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc3QgYnRuID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQodGhpcy5jb250ZXh0LnNldHRpbmdzLnJlZnJlc2hhYmxlSWQpO1xuICAgICAgICBcbiAgICAgICAgYnRuLmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCB0aGlzLmhhbmRsZVJlZnJlc2gpO1xuICAgIH1cblxuICAgIGhhbmRsZVJlZnJlc2ggPSBhc3luYyAoKSA9PiB7XG4gICAgICAgIGlmICh0aGlzLmNvbnRleHQucGlwZWxpbmUuaGFzUGlwZWxpbmUoXCJyZWZyZXNoXCIpKSB7XG4gICAgICAgICAgICBhd2FpdCB0aGlzLmNvbnRleHQucGlwZWxpbmUuZXhlY3V0ZShcInJlZnJlc2hcIik7XG4gICAgICAgIH1cblxuICAgICAgICBhd2FpdCB0aGlzLmNvbnRleHQuZXZlbnRzLnRyaWdnZXIoXCJyZW5kZXJcIik7XG4gICAgfTtcbn1cblxuUmVmcmVzaE1vZHVsZS5tb2R1bGVOYW1lID0gXCJyZWZyZXNoXCI7XG5cbmV4cG9ydCB7IFJlZnJlc2hNb2R1bGUgfTsiLCIvKipcbiAqIFVwZGF0ZXMgdGFyZ2V0IGxhYmVsIHdpdGggYSBjb3VudCBvZiByb3dzIGluIGdyaWQuXG4gKi9cbmNsYXNzIFJvd0NvdW50TW9kdWxlIHtcbiAgICAvKipcbiAgICAgKiBVcGRhdGVzIHRhcmdldCBsYWJlbCBzdXBwbGllZCBpbiBzZXR0aW5ncyB3aXRoIGEgY291bnQgb2Ygcm93cyBpbiBncmlkLlxuICAgICAqIEBwYXJhbSB7R3JpZENvbnRleHR9IGNvbnRleHQgR3JpZCBjb250ZXh0IGNsYXNzLlxuICAgICAqL1xuICAgIGNvbnN0cnVjdG9yKGNvbnRleHQpIHtcbiAgICAgICAgdGhpcy5jb250ZXh0ID0gY29udGV4dDtcbiAgICAgICAgdGhpcy5lbGVtZW50ID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoY29udGV4dC5zZXR0aW5ncy5yb3dDb3VudElkKTtcbiAgICB9XG5cbiAgICBpbml0aWFsaXplKCkge1xuICAgICAgICB0aGlzLmNvbnRleHQuZXZlbnRzLnN1YnNjcmliZShcInJlbmRlclwiLCB0aGlzLmhhbmRsZUNvdW50LCBmYWxzZSwgMjApO1xuICAgIH1cblxuICAgIGhhbmRsZUNvdW50ID0gKCkgPT4ge1xuICAgICAgICB0aGlzLmVsZW1lbnQuaW5uZXJUZXh0ID0gdGhpcy5jb250ZXh0LmdyaWQucm93Q291bnQ7XG4gICAgfTtcbn1cblxuUm93Q291bnRNb2R1bGUubW9kdWxlTmFtZSA9IFwicm93Y291bnRcIjtcblxuZXhwb3J0IHsgUm93Q291bnRNb2R1bGUgfTsiLCIvKipcbiAqIENsYXNzIHRvIG1hbmFnZSBzb3J0aW5nIGZ1bmN0aW9uYWxpdHkgaW4gYSBncmlkIGNvbnRleHQuICBGb3IgcmVtb3RlIHByb2Nlc3NpbmcsIHdpbGwgc3Vic2NyaWJlIHRvIHRoZSBgcmVtb3RlUGFyYW1zYCBldmVudC5cbiAqIEZvciBsb2NhbCBwcm9jZXNzaW5nLCB3aWxsIHN1YnNjcmliZSB0byB0aGUgYHJlbmRlcmAgZXZlbnQuXG4gKiBcbiAqIENsYXNzIHdpbGwgdHJpZ2dlciB0aGUgYHJlbmRlcmAgZXZlbnQgYWZ0ZXIgc29ydGluZyBpcyBhcHBsaWVkLCBhbGxvd2luZyB0aGUgZ3JpZCB0byByZS1yZW5kZXIgd2l0aCB0aGUgc29ydGVkIGRhdGEuXG4gKi9cbmNsYXNzIFNvcnRNb2R1bGUge1xuICAgIC8qKlxuICAgICAqIENyZWF0ZXMgYSBuZXcgU29ydE1vZHVsZSBvYmplY3QuXG4gICAgICogQHBhcmFtIHtHcmlkQ29udGV4dH0gY29udGV4dCBcbiAgICAgKi9cbiAgICBjb25zdHJ1Y3Rvcihjb250ZXh0KSB7XG4gICAgICAgIHRoaXMuY29udGV4dCA9IGNvbnRleHQ7XG4gICAgICAgIHRoaXMuaGVhZGVyQ2VsbHMgPSBbXTtcbiAgICAgICAgdGhpcy5jdXJyZW50U29ydENvbHVtbiA9IFwiXCI7XG4gICAgICAgIHRoaXMuY3VycmVudERpcmVjdGlvbiA9IFwiXCI7XG4gICAgICAgIHRoaXMuY3VycmVudFR5cGUgPSBcIlwiO1xuICAgIH1cblxuICAgIGluaXRpYWxpemUoKSB7XG4gICAgICAgIGlmICh0aGlzLmNvbnRleHQuc2V0dGluZ3MucmVtb3RlUHJvY2Vzc2luZykge1xuICAgICAgICAgICAgdGhpcy5jdXJyZW50U29ydENvbHVtbiA9IHRoaXMuY29udGV4dC5zZXR0aW5ncy5yZW1vdGVTb3J0RGVmYXVsdENvbHVtbjtcbiAgICAgICAgICAgIHRoaXMuY3VycmVudERpcmVjdGlvbiA9IHRoaXMuY29udGV4dC5zZXR0aW5ncy5yZW1vdGVTb3J0RGVmYXVsdERpcmVjdGlvbjtcbiAgICAgICAgICAgIHRoaXMuY29udGV4dC5ldmVudHMuc3Vic2NyaWJlKFwicmVtb3RlUGFyYW1zXCIsIHRoaXMucmVtb3RlUGFyYW1zLCB0cnVlKTtcbiAgICAgICAgICAgIHRoaXMuX2luaXQodGhpcy5oYW5kbGVSZW1vdGUpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdGhpcy5jb250ZXh0LmV2ZW50cy5zdWJzY3JpYmUoXCJyZW5kZXJcIiwgdGhpcy5yZW5kZXJMb2NhbCwgZmFsc2UsIDkpO1xuICAgICAgICAgICAgLy90aGlzLnNvcnRlcnMgPSB7IG51bWJlcjogc29ydE51bWJlciwgc3RyaW5nOiBzb3J0U3RyaW5nLCBkYXRlOiBzb3J0RGF0ZSwgZGF0ZXRpbWU6IHNvcnREYXRlIH07XG4gICAgICAgICAgICB0aGlzLnNvcnRlcnMgPSB0aGlzLiNzZXRMb2NhbEZpbHRlcnMoKTtcbiAgICAgICAgICAgIHRoaXMuX2luaXQodGhpcy5oYW5kbGVMb2NhbCk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBfaW5pdChjYWxsYmFjaykge1xuICAgICAgICAvL2JpbmQgbGlzdGVuZXIgZm9yIG5vbi1pY29uIGNvbHVtbnM7IGFkZCBjc3Mgc29ydCB0YWcuXG4gICAgICAgIGZvciAoY29uc3QgY29sIG9mIHRoaXMuY29udGV4dC5jb2x1bW5NYW5hZ2VyLmNvbHVtbnMpIHtcbiAgICAgICAgICAgIGlmIChjb2wudHlwZSAhPT0gXCJpY29uXCIpIHtcbiAgICAgICAgICAgICAgICB0aGlzLmhlYWRlckNlbGxzLnB1c2goY29sLmhlYWRlckNlbGwpO1xuICAgICAgICAgICAgICAgIGNvbC5oZWFkZXJDZWxsLnNwYW4uY2xhc3NMaXN0LmFkZChcInNvcnRcIik7XG4gICAgICAgICAgICAgICAgY29sLmhlYWRlckNlbGwuc3Bhbi5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgY2FsbGJhY2spO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuXG4gICAgI3NldExvY2FsRmlsdGVycygpIHtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIGRhdGU6IChhLCBiLCBkaXJlY3Rpb24pID0+IHtcbiAgICAgICAgICAgICAgICBsZXQgY29tcGFyaXNvbiA9IDA7XG4gICAgICAgICAgICAgICAgbGV0IGRhdGVBID0gbmV3IERhdGUoYSk7XG4gICAgICAgICAgICAgICAgbGV0IGRhdGVCID0gbmV3IERhdGUoYik7XG5cbiAgICAgICAgICAgICAgICBpZiAoTnVtYmVyLmlzTmFOKGRhdGVBLnZhbHVlT2YoKSkpIHtcbiAgICAgICAgICAgICAgICAgICAgZGF0ZUEgPSBudWxsO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIGlmIChOdW1iZXIuaXNOYU4oZGF0ZUIudmFsdWVPZigpKSkge1xuICAgICAgICAgICAgICAgICAgICBkYXRlQiA9IG51bGw7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIC8vaGFuZGxlIGVtcHR5IHZhbHVlcy5cbiAgICAgICAgICAgICAgICBpZiAoIWRhdGVBKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbXBhcmlzb24gPSAhZGF0ZUIgPyAwIDogLTE7XG4gICAgICAgICAgICAgICAgfSBlbHNlIGlmICghZGF0ZUIpIHtcbiAgICAgICAgICAgICAgICAgICAgY29tcGFyaXNvbiA9IDE7XG4gICAgICAgICAgICAgICAgfSBlbHNlIGlmIChkYXRlQSA+IGRhdGVCKSB7ICAgIFxuICAgICAgICAgICAgICAgICAgICBjb21wYXJpc29uID0gMTtcbiAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKGRhdGVBIDwgZGF0ZUIpIHtcbiAgICAgICAgICAgICAgICAgICAgY29tcGFyaXNvbiA9IC0xO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIHJldHVybiBkaXJlY3Rpb24gPT09IFwiZGVzY1wiID8gKGNvbXBhcmlzb24gKiAtMSkgOiBjb21wYXJpc29uO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIG51bWJlcjogKGEsIGIsIGRpcmVjdGlvbikgPT4ge1xuICAgICAgICAgICAgICAgIGxldCBjb21wYXJpc29uID0gMDtcblxuICAgICAgICAgICAgICAgIGlmIChhID4gYikge1xuICAgICAgICAgICAgICAgICAgICBjb21wYXJpc29uID0gMTtcbiAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKGEgPCBiKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbXBhcmlzb24gPSAtMTtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICByZXR1cm4gZGlyZWN0aW9uID09PSBcImRlc2NcIiA/IChjb21wYXJpc29uICogLTEpIDogY29tcGFyaXNvbjtcbiAgICAgICAgICAgIH0sIFxuICAgICAgICAgICAgc3RyaW5nOiAoYSwgYiwgZGlyZWN0aW9uKSA9PiB7XG4gICAgICAgICAgICAgICAgbGV0IGNvbXBhcmlzb24gPSAwO1xuICAgICAgICAgICAgICAgIC8vaGFuZGxlIGVtcHR5IHZhbHVlcy5cbiAgICAgICAgICAgICAgICBpZiAoIWEpIHtcbiAgICAgICAgICAgICAgICAgICAgY29tcGFyaXNvbiA9ICFiID8gMCA6IC0xO1xuICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAoIWIpIHtcbiAgICAgICAgICAgICAgICAgICAgY29tcGFyaXNvbiA9IDE7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgdmFyQSA9IGEudG9VcHBlckNhc2UoKTtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgdmFyQiA9IGIudG9VcHBlckNhc2UoKTtcbiAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICAgICAgaWYgKHZhckEgPiB2YXJCKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb21wYXJpc29uID0gMTtcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIGlmICh2YXJBIDwgdmFyQikge1xuICAgICAgICAgICAgICAgICAgICAgICAgY29tcGFyaXNvbiA9IC0xO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgcmV0dXJuIGRpcmVjdGlvbiA9PT0gXCJkZXNjXCIgPyAoY29tcGFyaXNvbiAqIC0xKSA6IGNvbXBhcmlzb247XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG4gICAgfVxuXG4gICAgcmVtb3RlUGFyYW1zID0gKHBhcmFtcykgPT4ge1xuICAgICAgICBwYXJhbXMuc29ydCA9IHRoaXMuY3VycmVudFNvcnRDb2x1bW47XG4gICAgICAgIHBhcmFtcy5kaXJlY3Rpb24gPSB0aGlzLmN1cnJlbnREaXJlY3Rpb247XG5cbiAgICAgICAgcmV0dXJuIHBhcmFtcztcbiAgICB9O1xuXG4gICAgaGFuZGxlUmVtb3RlID0gYXN5bmMgKGMpID0+IHtcbiAgICAgICAgdGhpcy5jdXJyZW50U29ydENvbHVtbiA9IGMuY3VycmVudFRhcmdldC5jb250ZXh0Lm5hbWU7XG4gICAgICAgIHRoaXMuY3VycmVudERpcmVjdGlvbiA9IGMuY3VycmVudFRhcmdldC5jb250ZXh0LmRpcmVjdGlvbk5leHQudmFsdWVPZigpO1xuICAgICAgICB0aGlzLmN1cnJlbnRUeXBlID0gYy5jdXJyZW50VGFyZ2V0LmNvbnRleHQudHlwZTtcblxuICAgICAgICBpZiAoIWMuY3VycmVudFRhcmdldC5jb250ZXh0LmlzQ3VycmVudFNvcnQpIHtcbiAgICAgICAgICAgIHRoaXMucmVzZXRTb3J0KCk7XG4gICAgICAgIH1cblxuICAgICAgICBjLmN1cnJlbnRUYXJnZXQuY29udGV4dC5zZXRTb3J0RmxhZygpO1xuXG4gICAgICAgIGF3YWl0IHRoaXMuY29udGV4dC5ldmVudHMudHJpZ2dlcihcInJlbmRlclwiKTtcbiAgICB9O1xuXG4gICAgcmVzZXRTb3J0KCkge1xuICAgICAgICBjb25zdCBjZWxsID0gdGhpcy5oZWFkZXJDZWxscy5maW5kKGUgPT4gZS5pc0N1cnJlbnRTb3J0KTtcblxuICAgICAgICBpZiAoY2VsbCAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICBjZWxsLnJlbW92ZVNvcnRGbGFnKCk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICByZW5kZXJMb2NhbCA9ICgpID0+IHtcbiAgICAgICAgaWYgKCF0aGlzLmN1cnJlbnRTb3J0Q29sdW1uKSByZXR1cm47XG5cbiAgICAgICAgdGhpcy5jb250ZXh0LnBlcnNpc3RlbmNlLmRhdGEuc29ydCgoYSwgYikgPT4ge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuc29ydGVyc1t0aGlzLmN1cnJlbnRUeXBlXShhW3RoaXMuY3VycmVudFNvcnRDb2x1bW5dLCBiW3RoaXMuY3VycmVudFNvcnRDb2x1bW5dLCB0aGlzLmN1cnJlbnREaXJlY3Rpb24pO1xuICAgICAgICB9KTtcbiAgICB9O1xuXG4gICAgaGFuZGxlTG9jYWwgPSBhc3luYyAoYykgPT4ge1xuICAgICAgICB0aGlzLmN1cnJlbnRTb3J0Q29sdW1uID0gYy5jdXJyZW50VGFyZ2V0LmNvbnRleHQubmFtZTtcbiAgICAgICAgdGhpcy5jdXJyZW50RGlyZWN0aW9uID0gYy5jdXJyZW50VGFyZ2V0LmNvbnRleHQuZGlyZWN0aW9uTmV4dC52YWx1ZU9mKCk7XG4gICAgICAgIHRoaXMuY3VycmVudFR5cGUgPSBjLmN1cnJlbnRUYXJnZXQuY29udGV4dC50eXBlO1xuXG4gICAgICAgIGlmICghYy5jdXJyZW50VGFyZ2V0LmNvbnRleHQuaXNDdXJyZW50U29ydCkge1xuICAgICAgICAgICAgdGhpcy5yZXNldFNvcnQoKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGMuY3VycmVudFRhcmdldC5jb250ZXh0LnNldFNvcnRGbGFnKCk7XG5cbiAgICAgICAgYXdhaXQgdGhpcy5jb250ZXh0LmV2ZW50cy50cmlnZ2VyKFwicmVuZGVyXCIpO1xuICAgIH07XG59XG5cblNvcnRNb2R1bGUubW9kdWxlTmFtZSA9IFwic29ydFwiO1xuXG5leHBvcnQgeyBTb3J0TW9kdWxlIH07IiwiaW1wb3J0IHsgR3JpZENvcmUgfSBmcm9tIFwiLi9jb3JlL2dyaWRDb3JlLmpzXCI7XG5pbXBvcnQgeyBDc3ZNb2R1bGUgfSBmcm9tIFwiLi9tb2R1bGVzL2Rvd25sb2FkL2Nzdk1vZHVsZS5qc1wiO1xuaW1wb3J0IHsgRmlsdGVyTW9kdWxlIH0gZnJvbSBcIi4vbW9kdWxlcy9maWx0ZXIvZmlsdGVyTW9kdWxlLmpzXCI7XG5pbXBvcnQgeyBSZWZyZXNoTW9kdWxlIH0gZnJvbSBcIi4vbW9kdWxlcy9yZWZyZXNoL3JlZnJlc2hNb2R1bGUuanNcIjtcbmltcG9ydCB7IFJvd0NvdW50TW9kdWxlIH0gZnJvbSBcIi4vbW9kdWxlcy9yb3cvcm93Q291bnRNb2R1bGUuanNcIjtcbmltcG9ydCB7IFNvcnRNb2R1bGUgfSBmcm9tIFwiLi9tb2R1bGVzL3NvcnQvc29ydE1vZHVsZS5qc1wiO1xuXG5jbGFzcyBEYXRhR3JpZCBleHRlbmRzIEdyaWRDb3JlIHtcbiAgICBjb25zdHJ1Y3Rvcihjb250YWluZXIsIHNldHRpbmdzKSB7XG4gICAgICAgIHN1cGVyKGNvbnRhaW5lciwgc2V0dGluZ3MpO1xuXG4gICAgICAgIGlmIChEYXRhR3JpZC5kZWZhdWx0T3B0aW9ucy5lbmFibGVGaWx0ZXIpIHtcbiAgICAgICAgICAgIHRoaXMuYWRkTW9kdWxlcyhGaWx0ZXJNb2R1bGUpO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKERhdGFHcmlkLmRlZmF1bHRPcHRpb25zLmVuYWJsZVNvcnQpIHtcbiAgICAgICAgICAgIHRoaXMuYWRkTW9kdWxlcyhTb3J0TW9kdWxlKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICh0aGlzLnNldHRpbmdzLnJvd0NvdW50SWQpIHtcbiAgICAgICAgICAgIHRoaXMuYWRkTW9kdWxlcyhSb3dDb3VudE1vZHVsZSk7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAodGhpcy5zZXR0aW5ncy5yZWZyZXNoYWJsZUlkKSB7XG4gICAgICAgICAgICB0aGlzLmFkZE1vZHVsZXMoUmVmcmVzaE1vZHVsZSk7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAodGhpcy5zZXR0aW5ncy5jc3ZFeHBvcnRJZCkge1xuICAgICAgICAgICAgdGhpcy5hZGRNb2R1bGVzKENzdk1vZHVsZSk7XG4gICAgICAgIH1cbiAgICB9XG59XG5cbkRhdGFHcmlkLmRlZmF1bHRPcHRpb25zID0ge1xuICAgIGVuYWJsZVNvcnQ6IHRydWUsXG4gICAgZW5hYmxlRmlsdGVyOiB0cnVlXG59O1xuXG5leHBvcnQgeyBEYXRhR3JpZCB9OyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQUNBO0FBQ0E7QUFDQSxNQUFNLFVBQVUsQ0FBQztBQUNqQjtBQUNBO0FBQ0E7QUFDQTtBQUNB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QUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsY0FBYyxHQUFHLENBQUMsR0FBRyxJQUFJLENBQUMsY0FBYyxHQUFHLENBQUMsQ0FBQzs7QUFFcEYsUUFBUSxJQUFJLFdBQVcsR0FBRyxNQUFNLEVBQUUsT0FBTyxDQUFDOztBQUUxQyxRQUFRLElBQUksSUFBSSxDQUFDLFVBQVUsRUFBRSxJQUFJLFdBQVcsR0FBRyxJQUFJLENBQUMsY0FBYyxHQUFHLE1BQU0sQ0FBQyxFQUFFO0FBQzlFLFlBQVksT0FBTyxJQUFJLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxVQUFVLEVBQUUsR0FBRyxJQUFJLENBQUMsY0FBYyxHQUFHLENBQUMsRUFBRSxDQUFDLENBQUM7QUFDM0UsUUFBUTs7QUFFUixRQUFRLE9BQU8sV0FBVyxHQUFHLE1BQU0sR0FBRyxDQUFDO0FBQ3ZDLElBQUk7QUFDSjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxJQUFJLE1BQU0sQ0FBQyxXQUFXLEVBQUUsUUFBUSxFQUFFO0FBQ2xDLFFBQVEsTUFBTSxVQUFVLEdBQUcsSUFBSSxDQUFDLFVBQVUsRUFBRTtBQUM1QztBQUNBLFFBQVEsSUFBSSxDQUFDLE9BQU8sQ0FBQyxlQUFlLEVBQUU7O0FBRXRDLFFBQVEsSUFBSSxVQUFVLElBQUksQ0FBQyxFQUFFO0FBQzdCO0FBQ0EsUUFBUSxNQUFNLFlBQVksR0FBRyxJQUFJLENBQUMsZ0JBQWdCLENBQUMsV0FBVyxDQUFDO0FBQy9ELFFBQVEsTUFBTSxRQUFRLEdBQUcsWUFBWSxHQUFHLElBQUksQ0FBQyxjQUFjO0FBQzNEO0FBQ0EsUUFBUSxJQUFJLENBQUMsV0FBVyxHQUFHLFdBQVc7QUFDdEMsUUFBUSxJQUFJLENBQUMsT0FBTyxDQUFDLFdBQVcsQ0FBQyxZQUFZLENBQUMsS0FBSyxDQUFDLFdBQVcsRUFBRSxRQUFRLENBQUMsQ0FBQzs7QUFFM0UsUUFBUSxLQUFLLElBQUksSUFBSSxHQUFHLFlBQVksRUFBRSxJQUFJLElBQUksVUFBVSxJQUFJLElBQUksR0FBRyxRQUFRLEVB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
