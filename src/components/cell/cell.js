import { FormatDateTime } from "./formatters/datetime.js";
import { FormatLink } from "./formatters/link.js";
import { FormatNumeric } from "./formatters/numeric.js";
import { FormatStar } from "./formatters/star.js";
import { CssHelper } from "../helpers/cssHelper.js";

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

export { Cell };