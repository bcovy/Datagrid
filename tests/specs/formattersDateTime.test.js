import { FormatDateTime } from "../../src/components/cell/formatters/datetime.js";

describe("FormatDateTime", function () {
    const format = "MM/dd/yyyy hh:mm:ss";
    const data = { id: 7, task: "2002/12/22 13:31:01" };
    const column = {
        field: "task", formatter: "datetime", formatterParams: {
                dateField: "task",
                format: "MM/dd/yyyy hh:mm:ss"
            }
        };

    it("returns empty string when input is null", function () {
        const data2 = { id: 7, task: null };
        const actual = FormatDateTime.apply(data2, column, format);

        expect(actual).toBe("");
    });

    it("returns empty string when input is empty", function () {
        const data2 = { id: 7, task: "" };
        const actual = FormatDateTime.apply(data2, column, format);

        expect(actual).toBe("");
    });

    it("formats MM/dd/yyyy with no time", function () {
        column.formatterParams.format = "MM/dd/yyyy";

        const actual = FormatDateTime.apply(data, column, "MM/dd/yyyy", false);

        expect(actual).toBe("12/22/2002");
    });

    it("formats full month name", function () {
        const data2 = { task: "2024-10-01" };
        const column2 = {
            field: "task", formatter: "date", formatterParams: {
                    dateField: "task",
                    format: "MMMM"
                }
            };

        const actual = FormatDateTime.apply(data2, column2, "MM/dd/yyyy", false);

        expect(actual).toBe("October");
    });

    it("formats MM/dd/yyyy HH:mm:ss with time", function () {
        column.formatterParams.format = "MM/dd/yyyy HH:mm:ss";

        const actual = FormatDateTime.apply(data, column, "", true);

        expect(actual).toBe("12/22/2002 13:31:01");
    });

    it("uses defaults when no args are supplied", function () {
        const defaults = { field: "task", formatter: "date" };

        const actual = FormatDateTime.apply(data, defaults, "MM/d/yy");

        expect(actual).toBe("12/22/02");
    });
});