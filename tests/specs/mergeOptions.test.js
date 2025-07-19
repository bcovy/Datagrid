import options from "../../src/settings/settingsDefault.js";
import { MergeOptions } from "../../src/settings/mergeOptions.js";

describe("MergeOptions", function() {
    it("should not mutate default options", function() {
        let source = { enablePaging: false, pagerPagesToDisplay: 7 };

        const actual = MergeOptions.merge(source);

        expect(options.enablePaging).toEqual(options.enablePaging);
    });

    it("should merge user options with defaults", function() {
        let source = { enablePaging: false, pagerPagesToDisplay: 7 };

        const actual = MergeOptions.merge(source);

        expect(actual.enablePaging).toEqual(source.enablePaging);
        expect(actual.pagerPagesToDisplay).toEqual(source.pagerPagesToDisplay);
    });

    it("should return default when input is empty", function() {
        const actual = MergeOptions.merge({});

        expect(actual.enablePaging).toEqual(options.enablePaging);
        expect(actual.pagerPagesToDisplay).toEqual(options.pagerPagesToDisplay);
    });

    it("should merge key/value pairs value type", function() {
        let source = { remoteParams: { days: "hello", months: "world" } };

        const actual = MergeOptions.merge(source);

        expect(actual.remoteParams.days).toEqual("hello");
        expect(actual.remoteParams.months).toEqual("world");
    });
});