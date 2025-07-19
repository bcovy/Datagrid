import { FilterDate } from "../../src/modules/filter/types/filterDate.js";

describe("FilterDate", () => { 
    it("equals date condition", function () {
        const date2 = new Date();
        const dateNoMatch = new Date("August 19, 1975 23:15:30");
        const feature = new FilterDate({ value: new Date(), field: "dude", filterType: "equals" });

        const match = feature.execute(date2, null);
        const nomatch = feature.execute(dateNoMatch, null);
        const nullNoMatch = feature.execute(null, null);

        expect(match).toBeTrue();
        expect(nomatch).toBeFalse();
        expect(nullNoMatch).toBeFalse();
    });

    it("less than date condition", function () {
        const date2 = new Date();
        date2.setDate(date2.getDate() + 1); // Set to tomorrow
        const dateNoMatch = new Date("August 19, 1975 23:15:30");
        const feature = new FilterDate({ value: new Date(), field: "dude", filterType: "<" });

        const match = feature.execute(date2, null);
        const nomatch = feature.execute(dateNoMatch, null);
        const nullNoMatch = feature.execute(null, null);

        expect(match).toBeTrue();
        expect(nomatch).toBeFalse();
        expect(nullNoMatch).toBeFalse();
    });

    it("greater than date condition", function () {
        const date2 = new Date();
        date2.setDate(date2.getDate() - 5);
        const dateNoMatch = new Date("August 19, 2045 23:15:30");
        const feature = new FilterDate({ value: new Date(), field: "dude", filterType: ">" });

        const match = feature.execute(date2, null);
        const nomatch = feature.execute(dateNoMatch, null);
        const nullNoMatch = feature.execute(null, null);

        expect(feature.field).toEqual("dude");
        expect(match).toBeTrue();
        expect(nomatch).toBeFalse();
        expect(nullNoMatch).toBeFalse();
    });

    it("filter between condition numeric", function () {
        const date1 = new Date();
        const date2 = new Date();
        date2.setDate(date1.getDate() + 5); 
        const feature = new FilterDate({ value: [ date1, date2 ], field: "dude", filterType: "between" });

        const match = feature.execute(date1, null);
        const nomatch = feature.execute(20, null);

        expect(match).toBeTrue();
        expect(nomatch).toBeFalse();
    });
});