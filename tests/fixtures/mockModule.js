class MockModule {
    constructor(context) {
        this.context = context;
        this.counter = 0
    }

    initialize() {
        this.counter = 1;
    }

    apply(rowData, column, row) {
        return "hello world";
    }
}

MockModule.moduleName = "mock1";

export { MockModule };