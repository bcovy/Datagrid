import { GridEvents } from "../../src/components/events/gridEvents.js";

describe("GridEvents", function () {
    let feature = null

    beforeEach(function() {
        feature = new GridEvents();
    });

    it("chains the result of callbacks in order for subscriber", function () {
        const chain1 = function(params) { params.chain1 = "hello"; return params; };
        const chain2 = function(params) { params.chain2 = "world"; return params; };

        feature.subscribe("chain", chain2, false, 1);
        feature.subscribe("chain", chain1, false, 0);
        const actual = feature.chain("chain", {});
        
        expect(actual.chain1).toEqual("hello");
        expect(actual.chain2).toEqual("world");
    });

    it("trigger executes callbacks in order for subscriber", function () {
        let actual1 = "";
        let actual2 = "";
        const call1 = () => { actual1 = "hello"; };
        const call2 = () => { actual2 = "world"; };

        feature.subscribe("trigger", call2, false, 1);
        feature.subscribe("trigger", call1, false, 0);
        feature.trigger("trigger", {});
        
        expect(actual1).toEqual("hello");
        expect(actual2).toEqual("world");
    });

    it("trigger executes mixed sync and async events in order", async function () {
        let actual1 = "";
        let actual2 = "";
        let actual3 = "";
        const call1 = () => { actual1 = "hello"; };
        const call2 = async () => { actual2 = await "world"; };
        const call3 = () => { actual3 = "!!!"; };

        feature.subscribe("trigger", call2, true, 1);
        feature.subscribe("trigger", call1, true, 0);
        feature.subscribe("trigger", call3, true, 3);
        await feature.trigger("trigger", {});
        
        expect(actual1).toEqual("hello");
        expect(actual2).toEqual("world");
        expect(actual3).toEqual("!!!");
    });
});