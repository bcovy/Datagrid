import { PagerModule } from "../../src/modules/pager/pagerModule.js"
import { Fixtures } from "../fixtures/fixtures.js";

describe("PagerModule", function () {
    const columns = Fixtures.columns();

    describe("totalPages", function () {
        const context = Fixtures.getContext(columns, "", Fixtures.data());
        const feature = new PagerModule(context);
        feature.totalRows = 0;
        feature.pagesToDisplay = 5;
        feature.rowsPerPage = 25;

        it("returns default of 1 when rows per page is 0", function () {
            feature.rowsPerPage = 0;

            expect(feature.totalPages()).toBe(1);
        });

        it("returns default of 1 when total rows is not a number", function () {
            feature.totalRows = undefined;
            feature.rowsPerPage = 5;

            expect(feature.totalPages()).toBe(1);
        });

        it("returns 2 when set with 10 rows and 5 rows per page", function () {
            feature.totalRows = 10;
            feature.rowsPerPage = 5;

            expect(feature.totalPages()).toBe(2);
        });

        it("returns 3 when set with 11 rows and 5 rows per page", function () {
            feature.totalRows = 11;
            feature.rowsPerPage = 5;

            expect(feature.totalPages()).toBe(3);
        });

        it("returns 2 when set with 7 rows and 5 rows per page", function () {
            feature.totalRows = 7;
            feature.rowsPerPage = 5;

            expect(feature.totalPages()).toBe(2);
        });
    });

    describe("validatePage", function () {
        const context = Fixtures.getContext(columns, "", Fixtures.data());
        const feature = new PagerModule(context);
        feature.totalRows = 14;
        feature.pagesToDisplay = 3;
        feature.rowsPerPage = 5;

        it("returns numeric value", function () {
            const actual = feature.validatePage("2");

            expect(actual).toBe(2);
        });

        it("returns page total when value is out of bounds", function () {
            const actual = feature.validatePage(8);

            expect(actual).toBe(3);
        });
    });

    describe("firstDisplayPage", function () {
        const context = Fixtures.getContext(columns, "", Fixtures.data());
        const feature = new PagerModule(context);
        feature.totalRows = 5;
        feature.pagesToDisplay = 5;
        feature.rowsPerPage = 1;

        it("returns first page", function () {
            feature.pagesToDisplay = 1;

            expect(feature.firstDisplayPage(1)).toBe(1);
        });

        it("returns second page", function () {
            feature.pagesToDisplay = 1;

            expect(feature.firstDisplayPage(2)).toBe(2);
        });
    });

    describe("render", function () {
        it("builds paging container li elements with correct button count", function () {
            const context = Fixtures.getContext(columns, "", Fixtures.data());
            const feature = new PagerModule(context);
            feature.totalRows = 7;
            feature.pagesToDisplay = 3;
            feature.rowsPerPage = 5;

            feature.render(1, () => true);

            const ul = feature.elPager.querySelectorAll("li");

            expect(ul.length).toBe(4);
        });

        it("removes pager buttons when total row count is 1", function () {
            const context = Fixtures.getContext(columns, "", Fixtures.data());
            const feature = new PagerModule(context);
            feature.totalRows = 1;
            feature.pagesToDisplay = 3;
            feature.rowsPerPage = 5;

            feature.render(1, () => true);

            const ul = feature.elPager.querySelectorAll("li");

            expect(ul.length).toBe(0);
        });
    });
});