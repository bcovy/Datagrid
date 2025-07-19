import { DataLoader } from "../../src/components/data/dataLoader.js";

describe("DataLoader", function() {
    it("buildUrl with no remote parameters returns url with query string", function() {
        const feature = new DataLoader({ ajaxUrl: "http://example.com" });

        const result = feature.buildUrl(feature.ajaxUrl, { state: "ca", id: 1 });

        expect(result).toEqual("http://example.com?state=ca&id=1");
    });

    it("buildUrl with remote parameters returns url with query string", function() {
        const feature = new DataLoader({ 
            ajaxUrl: "http://example.com?id=1&address=street"
        });

        const result = feature.buildUrl(feature.ajaxUrl, { state: "ca" });

        expect(result).toEqual("http://example.com?id=1&address=street&state=ca");
    });

    it("buildUrl with parameters that contains an array type", function() {
        const feature = new DataLoader({ 
            ajaxUrl: "http://example.com"
        });

        const result = feature.buildUrl(feature.ajaxUrl, { state: ["ca", "az"] });

        expect(result).toEqual("http://example.com?state=ca&state=az");
    });

    it("buildUrl with parameters that contains an array and single string", function() {
        const feature = new DataLoader({ 
            ajaxUrl: "http://example.com"
        });

        const result = feature.buildUrl(feature.ajaxUrl, { id: 1, state: ["ca", "az"] });

        expect(result).toEqual("http://example.com?id=1&state=ca&state=az");
    });

    it("buildUrl with no input parameters returns base url", function() {
        const feature = new DataLoader({ ajaxUrl: "http://example.com" });

        const result = feature.buildUrl(feature.ajaxUrl);

        expect(result).toEqual("http://example.com");
    });
});