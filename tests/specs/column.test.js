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
});