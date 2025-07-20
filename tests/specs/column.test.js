import { Fixtures } from "../fixtures/fixtures.js";
import { Column } from "../../src/components/column/column.js";

describe("Column", function() {
    const settings = Fixtures.getSettings();

    it("init should set hasFilter property to true", function() {
        const columnData = { field: "comments", type: "string", filterType: "equals" };

        const feature = new Column(columnData, settings, 0);

        expect(feature.hasFilter).toBeTrue();
    });

    it("init should set hasFilter property to false when field property is missing", function() {
        const columnData = { type: "string", filterType: "equals" };

        const feature = new Column(columnData, settings, 0);

        expect(feature.hasFilter).toBeFalse();
    });

    it("init should set filter type of multi select", function() {
        const columnData = { field: "comments", type: "string", filterType: "equals", filterValues: { 1: "one", 2: "two" }, filterMultiSelect: true };

        const feature = new Column(columnData, settings, 0);

        expect(feature.filterElement).toEqual("multi");
    });

    it("init should set filter type of select", function() {
        const columnData = { field: "comments", type: "string", filterType: "equals", filterValues: { 1: "one", 2: "two" } };

        const feature = new Column(columnData, settings, 0);

        expect(feature.filterElement).toEqual("select");
        expect(feature.filterValuesRemoteSource).toBeUndefined();
    });

    it("init should set filter type of select with filterValuesRemoteSource string property value", function() {
        const columnData = { field: "comments", type: "string", filterType: "equals", filterValues: "some/url" };

        const feature = new Column(columnData, settings, 0);

        expect(feature.filterElement).toEqual("select");
        expect(feature.filterValuesRemoteSource).toEqual("some/url");
    });

    it("init should set filter type of input", function() {
        const columnData = { field: "comments", type: "string", filterType: "equals" };

        const feature = new Column(columnData, settings, 0);

        expect(feature.filterElement).toEqual("input");
    });

    it("init should set headerFilterEmpty property", function() {
        const column1 = { field: "comments", type: "string", headerFilterEmpty: true };
        const column2 = { field: "hello", headerFilterEmpty: "world" };

        const actual1 = new Column(column1, settings, 0);
        const actual2 = new Column(column2, settings, 1);

        expect(actual1.headerFilterEmpty).toEqual("datagrids-no-header");
        expect(actual2.headerFilterEmpty).toEqual("world");
    });
});