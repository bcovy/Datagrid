import { DateHelper } from "../../src/components/helpers/dateHelper.js";

describe("DateHelper", function () {
    it("create date from date only string", function () {
        const actual = DateHelper.parseDate("2002-12-22");

        expect(actual.getMonth()).toBe(11);
        expect(actual.getDate()).toBe(22);
        expect(actual.getFullYear()).toBe(2002);
    });

    it("create date from date time string", function () {
        const actual = DateHelper.parseDate("2002-12-22 13:31:01");

        expect(actual.getHours()).toBe(13);
        expect(actual.getMinutes()).toBe(31);
    });

    it("create date returns empty string when input is invalid", function () {
        const actual = DateHelper.parseDate("hello");

        expect(actual).toBe("");
    });

    it("transforms date only string into local timezone date", function () {
        const actual = DateHelper.parseDate("2024-10-01");

        expect(actual.getMonth()).toBe(9);
        expect(actual.getDate()).toBe(1);
        expect(actual.getFullYear()).toBe(2024);
    });

    it("transforms date only string into local timezone date with midnight time", function () {
        const actual = DateHelper.parseDateOnly("2024-10-01");

        expect(actual.getMonth()).toBe(9);
        expect(actual.getDate()).toBe(1);
        expect(actual.getFullYear()).toBe(2024);
    });

    it("is date identifies correct types", function () {
        const stringFail = DateHelper.isDate("hello");
        const datePass = DateHelper.isDate(new Date());

        expect(stringFail).toBeFalse();
        expect(datePass).toBeTrue();
    });

});