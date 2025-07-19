import { DataPipeline } from "../../src/components/data/dataPipeline.js";
import { DataPersistence } from "../../src/components/data/dataPersistence.js";
import { Fixtures } from "../fixtures/fixtures.js";

describe("DataPipeline", function() {
    it("addStep should not add a duplicate event and callback", function () {
        const feature = new DataPipeline({ ajaxUrl: "hello" });
        const persistence = new DataPersistence(Fixtures.data());

        feature.addStep("helloWorld", persistence.setData);
        feature.addStep("helloWorld", persistence.setData);
        expect(feature.countEventSteps("helloWorld")).toEqual(1);
    });

    it("addStep adds unique callbacks to the same event", function () {
        const feature = new DataPipeline({ ajaxUrl: "hello" });
        const persistence = new DataPersistence(Fixtures.data());
        const callback2 = function() { return "hello world" };

        feature.addStep("helloWorld", persistence.setData);
        feature.addStep("helloWorld", callback2);

        expect(feature.countEventSteps("helloWorld")).toEqual(2);
    });
});