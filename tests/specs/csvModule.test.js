import { CsvModule } from "../../src/modules/download/csvModule.js";
import { Fixtures } from "../fixtures/fixtures.js";

describe("CsvModule", function() {
    const context = Fixtures.getContext([], "", Fixtures.data());
    const feature = new CsvModule(context);

    it("formatValue applies double quotes when comma is found in string", function () {
        const rowData = { name: "AMIRA, BOYKINS" };
        const column = { field: "name" };

        const actual = feature.formatValue(column, rowData);

        expect(actual).toBe('"AMIRA, BOYKINS"');
    });

    it("formatValue applies columns formatter", function () {
        const rowData = { name: "AMIRA BOYKINS" };
        const column = { field: "name", formatter: function(rowData, params) { return "hello world"; } };

        const actual = feature.formatValue(column, rowData);

        expect(actual).toBe("hello world");
    });

    it("identifyColumns returns object with target columns", function () {
        const actual = feature.identifyColumns(context.columnManager.columns);

        expect(actual.columns.length).toEqual(5);
    });

    it("identifyColumns returns object excluding column types of icon", function () {
        const columns = [
            { field: "id", type: "number" },
            { formatter: "id", type: "number" },
            { field: "name", label: "Some Name", type: "string" },
            { field: "comments", type: "string" }
        ];
        const ctx = Fixtures.getContext(columns, "", Fixtures.data());

        const actual = feature.identifyColumns(ctx.columnManager.columns);

        expect(actual.columns.length).toEqual(3);
    });

    it("buildFileContent creates header row", function () {
        const actual = feature.buildFileContent(context.persistence.dataCache);
        const result = actual[0];

        expect(result).toBe("Id,Some Name,PCOE,Task,Comments");
    });

    it("buildFileContent creates header and data rows", function () {
        const actual = feature.buildFileContent(context.persistence.dataCache);

        expect(actual.length).toBe(7);
    });

    it("buildFileContent handles columns that need to be double quoted", function () {
        const data = [
            { id: 18, name: "AMIRA, BOYKINS", pcoe: "12/22/2002", task: "12/22/2002", comments: "comment 1" },
            { id: 11, name: "DAVID DEVOE", pcoe: "11/23/2002", task: "12/22/2002", comments: "comment 2" },
        ];
        const ctx = Fixtures.getContext([], "", data);
        const sut = new CsvModule(ctx);

        const actual = sut.buildFileContent(data);
        const result1 = actual[1];
        const result2 = actual[2];

        expect(result1).toBe('18,"AMIRA, BOYKINS",12/22/2002,12/22/2002,comment 1');
        expect(result2).toBe("11,DAVID DEVOE,11/23/2002,12/22/2002,comment 2");
    });
});