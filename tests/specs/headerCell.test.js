import { HeaderCell } from "../../src/components/cell/headerCell.js";
import { Fixtures } from "../fixtures/fixtures.js";

describe("HeaderCell", function() {
    const settings = Fixtures.getSettings();

    it("init creates th element with child span", function () {
        const feature = new HeaderCell({ field: "id", type: "number", settings: settings });
        
        expect(feature.element.firstChild.nodeName).toBe("SPAN");
    });

    it("setSortFlag set desc sort icon in span title", function () {
        const feature = new HeaderCell({ field: "id", type: "number", settings: settings });
        
        feature.span.context.setSortFlag();

        expect(feature.span.lastChild.nodeName).toBe("I");
        expect(feature.span.lastChild.className).toContain("desc");
    });

    it("setSortFlag set asc sort icon in span title", function () {
        const feature = new HeaderCell({ field: "id", type: "number", settings: settings });
        
        feature.directionNext = "asc"
        feature.span.context.setSortFlag();

        expect(feature.span.lastChild.nodeName).toBe("I");
        expect(feature.span.lastChild.className).toContain("asc");
    });

    it("removeSortFlag resets cell back to default", function () {
        const feature = new HeaderCell({ field: "id", type: "number", settings: settings });
        
        feature.span.context.setSortFlag();
        expect(feature.isCurrentSort).toBeTrue();
        expect(feature.directionNext).toBe("asc");
        feature.span.context.removeSortFlag();

        expect(feature.direction).toBe("desc");
        expect(feature.directionNext).toBe("desc");
        expect(feature.span.context.isCurrentSort).toBeFalse();
    });
});