import { ElementSelect } from "../../src/modules/filter/elements/elementSelect.js";
import { Fixtures } from "../fixtures/fixtures.js";

describe("ElementSelect", function() {
    let column = null;

    beforeEach(function() {
        column = { 
            field: "id", 
            type: "string", 
            filterType: "equals", 
            filterCss: "css",
            settings: Fixtures.getSettings()
        };
    });

    it("sets select options from filterValues property of type object", function() {
        column.filterValues = {1: "ca", 2: "az" };
        
        const feature = new ElementSelect(column, Fixtures.getContext());

        expect(feature.element.nodeName).toEqual("SELECT");
        expect(feature.element.options.length).toEqual(3);
        expect(feature.element.options[1].text).toEqual("ca");
        expect(feature.element.options[1].value).toEqual("1");
    });

    it("sets select options and preserves order from filterValues property of type array object", function() {
        column.filterValues = [{ value: 2, text: "az" }, { value: 1, text: "ca" }];
        
        const feature = new ElementSelect(column, Fixtures.getContext());

        expect(feature.element.nodeName).toEqual("SELECT");
        expect(feature.element.options.length).toEqual(3);
        expect(feature.element.options[2].text).toEqual("ca");
        expect(feature.element.options[2].value).toEqual("1");
    });

    it("sets select options from filterValuesRemoteSource property", function() {
        column.filterValuesRemoteSource = "someurl";

        const feature = new ElementSelect(column, Fixtures.getContext());

        expect(feature.element.nodeName).toEqual("SELECT");
    });

    it("createSelectOptions creates option elements from data set", function() {
        column.filterValuesRemoteSource = "someurl";

        const feature = new ElementSelect(column, Fixtures.getContext());
        feature.createSelectOptions([{value: 1, text: "ca" }]);

        expect(feature.element.options.length).toEqual(2);
        expect(feature.element.options[1].text).toEqual("ca");
        expect(feature.element.options[1].value).toEqual("1");
    });

    it("refreshSelectOptions refreshes options with updated data set", function() {
        column.filterValues = {1: "ca", 2: "az" };
        
        const feature = new ElementSelect(column, Fixtures.getContext());
        expect(feature.element.options.length).toEqual(3);
        feature.refreshSelectOptions([{value: 1, text: "ca" }]);

        expect(feature.element.options.length).toEqual(2);
    });

    it("refreshSelectOptions refreshes options and persist selected value", function() {
        column.filterValues = {1: "ca", 2: "az" };
        
        const feature = new ElementSelect(column, Fixtures.getContext());
        feature.element.value = "1";
        feature.refreshSelectOptions([{value: 1, text: "ca" }]);

        expect(feature.element.value).toEqual("1");
    });
});