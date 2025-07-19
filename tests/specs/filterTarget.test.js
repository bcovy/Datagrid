import { FilterTarget } from "../../src/modules/filter/types/filterTarget.js";

describe("FilterTarget", function() {
    it("like condition", function () {
        const feature = new FilterTarget({ value: "llo wor", filterType: "like" });
        
        const match = feature.execute("hello world", null);
        const nomatch = feature.execute("no", null);

        expect(match).toBeTrue();
        expect(nomatch).toBeFalse();
    });

    it("equals numeric condition", function () {
        const feature = new FilterTarget({ value: 12, filterType: "equals" });

        const match = feature.execute(12, null);
        const nomatch = feature.execute(13, null);

        expect(match).toBeTrue();
        expect(nomatch).toBeFalse();
    });

    it("filter value less than row value", function () {
        const feature = new FilterTarget({ value: 12, filterType: "<" });

        const match = feature.execute(13, null);
        const nomatch = feature.execute(11, null);

        expect(match).toBeTrue();
        expect(nomatch).toBeFalse();
    });

    it("filter value less than or equal row value", function () {
        const feature = new FilterTarget({ value: 12, filterType: "<=" });

        const match = feature.execute(12, null);
        const nomatch = feature.execute(11, null);

        expect(match).toBeTrue();
        expect(nomatch).toBeFalse();
    });

    it("filter value greater than row value", function () {
        const feature = new FilterTarget({ value: 12, filterType: ">" });

        const match = feature.execute(11, null);
        const nomatch = feature.execute(13, null);

        expect(match).toBeTrue();
        expect(nomatch).toBeFalse();
    });

    it("filter value greater than or equal to row value", function () {
        const feature = new FilterTarget({ value: 12, filterType: ">=" });

        const match = feature.execute(12, null);
        const nomatch = feature.execute(19, null);

        expect(match).toBeTrue();
        expect(nomatch).toBeFalse();
    });

    it("filter value not equal to row value", function () {
        const feature = new FilterTarget({ value: 12, filterType: "!=" });

        const match = feature.execute(11, null);
        const nomatch = feature.execute(12, null);

        expect(match).toBeTrue();
        expect(nomatch).toBeFalse();
    });

    it("filter in condition numeric", function () {
        const feature = new FilterTarget({ value: [11, 12, 13, 14], filterType: "in" });

        const match = feature.execute(11, null);
        const nomatch = feature.execute(10, null);

        expect(match).toBeTrue();
        expect(nomatch).toBeFalse();
    });

    it("filter between condition numeric", function () {
        const feature = new FilterTarget({ value: [ 2, 10 ], filterType: "between" });

        const match = feature.execute(8, null);
        const nomatch = feature.execute(20, null);

        expect(match).toBeTrue();
        expect(nomatch).toBeFalse();
    });
});