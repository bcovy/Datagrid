import { CssHelper } from "../../../components/helpers/cssHelper.js";
import { ElementHelper } from "../../../components/helpers/elementHelper.js";
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

export { ElementMultiSelect };