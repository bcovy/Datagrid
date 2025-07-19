import { FormatNumeric } from "../../src/components/cell/formatters/numeric.js";

describe("Formatters numeric", function () {
    it("formats decimal", function () {
        const actual = FormatNumeric.apply({ id: 7, sales: 1125.125 }, { field: "sales" }, "decimal", 3);

        expect(actual).toBe("1,125.125");
    });

    it("formats currency", function () {
        const actual = FormatNumeric.apply({ id: 7, sales: 1000125.125 }, { field: "sales" }, "currency", 2);

        expect(actual).toBe("$1,000,125.13");
    });

    it("formats decimal using default settings", function () {
        const actual = FormatNumeric.apply({ id: 7, sales: 1125.125 }, { field: "sales" });

        expect(actual).toBe("1,125.13");
    });

    it("uses decimal format when style is invalid", function () {
        const actual = FormatNumeric.apply({ id: 7, sales: 1125.125 }, { field: "sales" }, "hello");

        expect(actual).toBe("1,125.13");
    });
});