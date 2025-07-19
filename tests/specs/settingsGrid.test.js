import { SettingsGrid } from "../../src/settings/settingsGrid.js";
import defaults from "../../src/settings/settingsDefault.js";

describe("SettingsGrid", function() {
    let options = null;

    beforeEach(function() {
        options = structuredClone(defaults);
        options.columns = [
            { field: "id", type: "number" },
            { field: "name", label: "Some Name", type: "string" },
            { field: "pcoe", label: "PCOE", type: "date", headerCss: "some-rule" },
            { field: "task", type: "datetime", headerCss: "some-rule" },
            { field: "comments", type: "string" }
        ];
    });

    it("should set remote sort properties using first column with field property", function() {
        options.remoteProcessing = true;
        options.columns = [
            { formatter: "icon", type: "number" },
            { field: "ssn", type: "number" }
        ];

        const feature = new SettingsGrid(options);

        expect(feature.remoteProcessing).toBeTrue();
        expect(feature.remoteSortDefaultColumn).toEqual("ssn");
        expect(feature.remoteSortDefaultDirection).toEqual("desc");
    });

    it("should set remote sort properties using user input", function() {
        options.remoteProcessing = { column: "name", direction: "asc" };

        const feature = new SettingsGrid(options);

        expect(feature.remoteProcessing).toBeTrue();
        expect(feature.remoteSortDefaultColumn).toEqual("name");
        expect(feature.remoteSortDefaultDirection).toEqual("asc");
    });

    it("should set remote processing to false when input is false", function() {
        const feature = new SettingsGrid(options);

        expect(feature.remoteProcessing).toBeFalse();
    });

    it("_buildAjaxUrl creates ajaxUrl without parameters", function() {
        const feature = new SettingsGrid(options);

        const actual = feature._buildAjaxUrl("http://example.com", "");

        expect(actual).toEqual("http://example.com");
    });

    it("_buildAjaxUrl creates ajaxUrl with parameters", function() {
        const feature = new SettingsGrid(options);

        const actual = feature._buildAjaxUrl("http://example.com", { id: 1, address: "street" });

        expect(actual).toEqual("http://example.com?id=1&address=street");
    });
});