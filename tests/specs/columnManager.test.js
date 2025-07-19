import { ColumnManager } from "../../src/components/column/columnManager.js";
import { Fixtures } from "../fixtures/fixtures.js";

describe("ColumnManager", function() {
    const settings = Fixtures.getSettings();

    it("init creates column objects", function () {
        const feature = new ColumnManager(Fixtures.columns(), settings);

        expect(feature.columns.length).toBe(5);
    });

    it("init creates header columns with even widths", function () {
        const s = Fixtures.getSettings();
        s.tableEvenColumnWidths = true;
        const feature = new ColumnManager(Fixtures.columns(), s);

        const actual = feature.columns[0];

        expect(actual.headerCell.element.style.width).toEqual("16.6667%");
    });

    it("get columns returns results by internal array index order", function () {
        const feature = new ColumnManager(Fixtures.columns(true), settings);
        
        const actual = feature.columns;

        expect(actual[0].field).toEqual("id");
        expect(actual[3].field).toEqual("task");
    });

    it("get columns returns results by internal array index order", function () {
        const feature = new ColumnManager(Fixtures.columns(true), settings);
        
        expect(feature.hasHeaderFilters).toBe(true);
    });

    it("addColumn adds a new column to the end", function () {
        const feature = new ColumnManager(Fixtures.columns(), settings);
        const newCol = { field: "newCol", type: "number",  filterType: "equals"};

        feature.addColumn(newCol);

        expect(feature.columns.length).toBe(6);
        expect(feature.columns[5].field).toBe("newCol");
    });

    it("addColumn adds a new column to the index position", function () {
        const feature = new ColumnManager(Fixtures.columns(), settings);
        const newCol = { field: "newCol", type: "number",  filterType: "equals"};

        feature.addColumn(newCol, 1);

        expect(feature.columns.length).toBe(6);
        expect(feature.columns[1].field).toBe("newCol");
    });
});