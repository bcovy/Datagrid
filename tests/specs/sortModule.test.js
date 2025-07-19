import { Fixtures } from "../fixtures/fixtures.js";
import { SortModule } from "../../src/modules/sort/sortModule.js";

describe("SortModule", function() {
    let feature = null;
    const columns = Fixtures.columns(true);

    beforeEach(function() {
        const context = Fixtures.getContext(columns, "", Fixtures.data());

        feature = new SortModule(context);
        feature.initialize();
    });

    it("init should contain initialized columns", function () {
        expect(feature.headerCells.length).toEqual(5);
        expect(feature.headerCells[0].span.classList.contains("sort"));
    });

    it("handleLocal should sort numeric column in desc order", function () {
        const target = {
            currentTarget: {
                context: feature.headerCells[0]
            }
        };

        feature.handleLocal(target);

        expect(feature.context.persistence.data[4].id).toBe(7);
    });
});