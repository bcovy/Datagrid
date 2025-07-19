import { ColumnManager } from "../column/columnManager.js";
import { DataPipeline } from "../data/dataPipeline.js";
import { DataLoader } from "../data/dataLoader.js";
import { DataPersistence } from "../data/dataPersistence.js";
import { GridEvents } from "../events/gridEvents.js";
import { Table } from "../table/table.js";
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

export { GridContext };