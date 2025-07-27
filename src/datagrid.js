import { GridCore } from "./core/gridCore.js";
import { CsvModule } from "./modules/download/csvModule.js";
import { FilterModule } from "./modules/filter/filterModule.js";
import { RefreshModule } from "./modules/refresh/refreshModule.js";
import { RowCountModule } from "./modules/row/rowCountModule.js";
import { SortModule } from "./modules/sort/sortModule.js";

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

export { DataGrid };