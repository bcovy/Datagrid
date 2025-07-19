import { MergeOptions } from "../../src/settings/mergeOptions.js";
import { SettingsGrid } from "../../src/settings/settingsGrid.js";
import { GridContext } from "../../src/components/context/gridContext.js";

class Fixtures {
    static columns(includeFilters = false) {
        if (includeFilters) {
            return [
                { field: "id", type: "number",  filterType: "equals" },
                { field: "name", label: "Some Name", type: "string", filterType: "equals", filterValues: { 1: "one", 2: "two" } },
                { field: "pcoe", label: "PCOE", type: "date", filterType: ">", headerCss: "some-rule" },
                { field: "task", type: "datetime", headerCss: "some-rule" },
                { field: "comments", type: "string", filterType: "like" }
            ];
        }

        return [
            { field: "id", type: "number" },
            { field: "name", label: "Some Name", type: "string" },
            { field: "pcoe", label: "PCOE", type: "date", headerCss: "some-rule" },
            { field: "task", type: "datetime", headerCss: "some-rule" },
            { field: "comments", type: "string" }
        ];
    }

    static getSettings(options = {}) {
        const source = MergeOptions.merge(options);

        return new SettingsGrid(source);
    }

    static data() {
        return [
            { id: 18, name: "Amy", pcoe: "2002-12-22", task: "2002-12-22T8:31:01", comments: "comment 1" },
            { id: 11, name: "David", pcoe: "2002-11-23", task: "2002-12-22T10:31:01", comments: "comment 2" },
            { id: 5, name: "Dolly", pcoe: "2002-12-24", task: "2002-12-22T22:31:01", comments: "hello westminster" },
            { id: 7, name: "Abc", pcoe: "2002-09-25", task: "2002-12-22T4:31:01", comments: "unique string" },
            { id: 8, name: "Dolly", pcoe: "2002-10-25", task: "2002-12-22T4:31:01", comments: "comment 3" },
            { id: 12, name: "Lance Mike", pcoe: "2002-10-25", task: "2002-12-22T4:31:01", comments: "hello DENISE" }
        ];
    }

    static getContext(columns = [], settings = "", data = []) {
        const c = columns.length === 0 ? this.columns() : columns;
        const s = settings ? settings : this.getSettings();

        return new GridContext(c, s, data);
    }
}

export { Fixtures };