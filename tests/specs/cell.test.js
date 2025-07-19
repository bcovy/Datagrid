import { Cell } from "../../src/components/cell/cell.js";
import { MockModule } from "../fixtures/mockModule.js";

describe("Cell", function() {
    let modules = {}

    it("should use module to format cell text", function () {
        const data = { id: 18, name: "Amy", pcoe: "2002-12-22", task: "2002-12-22T8:31:01", comments: "comment 1" };
        const column = { field: "name", type: "string", formatter: "module", formatterParams: { name: MockModule.moduleName } };
        modules[MockModule.moduleName] = new MockModule({ context: "empty"});
        modules[MockModule.moduleName].initialize();

        const actual = new Cell(data, column, modules, document.createElement("tr"));

        expect(actual.element.innerText).toEqual("hello world");
    });
});