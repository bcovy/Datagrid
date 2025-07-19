import { Table } from "../../src/components/table/table.js";
import { Fixtures } from "../fixtures/fixtures.js";

describe("Table", function () {
    let feature;
    const columns = Fixtures.columns();

    beforeEach(function() {
        const context = Fixtures.getContext(columns, "", Fixtures.data());

        feature = new Table(context);
    });

    it("renderRows sets row count from data set and creates element rows", function () {
        feature.renderRows(Fixtures.data());

        const actual = feature.tbody.querySelectorAll("tr");

        expect(feature.rowCount).toBe(6);
        expect(actual.length).toBe(6);
    });

    it("renderRows sets row count from input and creates element rows", function () {
        feature.renderRows(Fixtures.data(), 7);

        const actual = feature.tbody.querySelectorAll("tr");

        expect(feature.rowCount).toBe(7);
        expect(actual.length).toBe(6);
    });

    it("renderRows does not render rows when data set is empty", function () {
        feature.renderRows(null, 7);

        const actual = feature.tbody.querySelectorAll("tr");

        expect(feature.rowCount).toBe(0);
        expect(actual.length).toBe(0);
    });
});