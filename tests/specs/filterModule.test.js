import { FilterModule } from "../../src/modules/filter/filterModule.js";
import { FilterDate } from "../../src/modules/filter/types/filterDate.js";
import { FilterTarget } from "../../src/modules/filter/types/filterTarget.js";
import { FilterFunction } from "../../src/modules/filter/types/filterFunction.js";
import { Fixtures } from "../fixtures/fixtures.js";

describe("FilterModule", function() { 
    let feature = null;
    const columns = Fixtures.columns(true);

    columns[3].filterType = function(filterVal, rowVal, rowData, filterParams) {
        //task field filter
        const rowTarget = rowData["id"];
        const filter = parseInt(filterVal);

        return filter === rowTarget;
    }

    beforeEach(function() {
        const context = Fixtures.getContext(columns, "", Fixtures.data());

        feature = new FilterModule(context);
        feature.initialize();
    });

    describe("setFilter", function() {
        it("can set and remove grid filter", function () {
            feature.setFilter("id", 1);
    
            expect(feature.gridFilters.length).toEqual(1);
    
            feature.removeFilter("id");
    
            expect(feature.gridFilters.length).toEqual(0);
        });
    
        it("can set and remove two filters", function () {
            feature.setFilter("id", 1);
            feature.setFilter("name", "Some Name");
    
            expect(feature.gridFilters.length).toEqual(2);
    
            feature.removeFilter("id");
            feature.removeFilter("name");
    
            expect(feature.gridFilters.length).toEqual(0);
        });
    
        it("can set function filter type", function () {
            feature.setFilter("id", 1, columns[3].filterType, "number");
    
            expect(feature.gridFilters.length).toEqual(1);
        });
    
        it("should update value if field filter is already present", function () {
            feature.setFilter("id", 11);
    
            expect(feature.gridFilters[0].value).toEqual(11);
    
            feature.setFilter("id", 12);
    
            expect(feature.gridFilters[0].value).toEqual(12);
            expect(feature.gridFilters.length).toEqual(1);
        });
    });

    describe("remoteParams", function() {
        it("returns key/value pair for header input", function () {
            feature.headerFilters[0].element.value = "5";
    
            const actual = feature.remoteParams({});
    
            expect(actual.id).toEqual("5");
        });
    
        it("returns key/value pair for header and grid inputs", function () {
            feature.headerFilters[0].element.value = "5";
            feature.setFilter("name", "Dolly");
    
            const actual = feature.remoteParams({});
       
            expect(actual.id).toEqual("5");
            expect(actual.name).toEqual("Dolly");
        });
    });

    describe("convertToType", function() {
        it("returns type of string", function() {
            const actual = feature.convertToType("someval", "string");
    
            expect(typeof actual).toEqual("string");
        });

        it("returns empty string or null", function() {
            const actualStr = feature.convertToType("", "string");
            const actualNull = feature.convertToType(null, "number");
            const actualEmpty = feature.convertToType("", "number");

            expect(actualStr).toEqual("");
            expect(actualNull).toEqual(null);
            expect(actualEmpty).toEqual("");
        });
    
        it("returns type of number", function() {    
            const actual = feature.convertToType("12", "number");
    
            expect(Number.isInteger(actual)).toBeTrue();
        });
    
        it("returns null when number is invalid", function() {
            const actual = feature.convertToType("hello", "number");
    
            expect(actual).toBeNull();
        });
    
        it("returns type of date", function() {
            const actual = feature.convertToType("2023-07-19", "date");
            const expected = new Date("2023-07-19T00:00");

            expect(actual).toEqual(expected);
        });

        it("date type does not adjust for utc", function() {
            const actual = feature.convertToType("2024-12-01", "date");
            const expected = new Date("2024-12-01T00:00");
 
            expect(actual).toEqual(expected);
        });
    
        it("returns null when date is invalid", function() {
            const actual = feature.convertToType("hello", "date");
    
            expect(actual).toBeNull();
        });

        it("return array of dates", function() {
            const actual = feature.convertToType(["2023-07-19", "2023-07-20"], "date");
            const expected = [
                new Date("2023-07-19T00:00"),
                new Date("2023-07-20T00:00")
            ];

            expect(actual).toEqual(expected);
        });

        it("returns null when date array is invalid", function() { 
            const actual = feature.convertToType(["2023-07-19", "hello"], "date");

            expect(actual).toBeNull();
        });

        it("returns array of numbers", function() {
            const actual = feature.convertToType(["12", "13"], "number");
            const expected = [12, 13];

            expect(actual).toEqual(expected);
        });

        it("returns null when number array is invalid", function() {
            const actual = feature.convertToType(["12", "hello"], "number");

            expect(actual).toBeNull();
        });
    });

    describe("createFilterTarget", function() {
        it("returns FilterFunction when type is function", function() {
            const funcType = function(filterVal, rowVal, rowData, filterParams) { 
                   const rowTarget = rowData["id"];

                    return filterVal === rowTarget;
            };
            const actual = feature.createFilterTarget("hello", funcType, "date", true, {});

            expect(actual instanceof FilterFunction).toBeTrue();
        });

        it("return null when filter value does not match column type", function() {
            const actual = feature.createFilterTarget("hello", "field", "equals", "date");

            expect(actual).toEqual(null);
        });

        it("returns FilterDate when filter value matches column type", function() {
            const actual = feature.createFilterTarget("2023-01-01", "pcoe", "equals", "date");

            expect(actual instanceof FilterDate).toBeTrue();
        });

        it("returns FilterTarget when filter value matches column type", function() {
            const actual = feature.createFilterTarget(12, "equals", "number");

            expect(actual instanceof FilterTarget).toBeTrue();
        });
    });

    describe("applyFilters", function() {
        it("should filter string column with non-matching case", function () {
            feature.headerFilters[0].element.value = "11";
    
            const inputs = feature.compileFilters();
            feature.applyFilters(inputs);
    
            expect(feature.context.persistence.data[0].name).toContain("David");
        });
    
        it("should filter date column", function () {
            feature.headerFilters[2].element.value = "2002-12-01";
    
            const inputs = feature.compileFilters();
            feature.applyFilters(inputs);
  
            expect(feature.context.persistence.data.length).toEqual(4);
        });
    
        it("should filter function type", function () {
            feature.headerFilters[3].element.value = "12";
    
            const inputs = feature.compileFilters();
            feature.applyFilters(inputs);
    
            expect(feature.context.persistence.data.length).toEqual(1);
        });
    
        it("two filter inputs should return targeted row", function () {
            feature.headerFilters[0].element.value = "5";
            feature.headerFilters[1].element.value = "Dolly";
    
            const inputs = feature.compileFilters();
            feature.applyFilters(inputs);
    
            expect(feature.context.persistence.data.length).toEqual(1);
            expect(feature.context.persistence.data[0].name).toEqual("Dolly");
        });

        it("or condition using function on setFilter method", function () {
            const orCondition = (filterVal, rowVal, rowData, filterParams) => {
                const name = String(rowData.name).toLowerCase().indexOf(filterVal.toLowerCase()) > -1;
                const comments = String(rowData.comments).toLowerCase().indexOf(filterVal.toLowerCase()) > -1;

                return name || comments;
            };
            feature.setFilter("name", "Dolly", orCondition);
    
            const inputs = feature.compileFilters();
            feature.applyFilters(inputs);
    
            expect(feature.context.persistence.data.length).toEqual(2);
        });
    
        it("with value from setFilter", function () {
            feature.setFilter("id", 11);
    
            const inputs = feature.compileFilters();
            feature.applyFilters(inputs);
    
            expect(feature.context.persistence.data[0].name).toContain("David");
        });
    
        it("with setFilter and input element", function () {
            feature.setFilter("id", 5);
            feature.headerFilters[1].element.value = "Dolly";
    
            const inputs = feature.compileFilters();
            feature.applyFilters(inputs);
    
            expect(feature.context.persistence.data.length).toEqual(1);
            expect(feature.context.persistence.data[0].name).toEqual("Dolly");
        });
    });
});