/// <reference path="datagrid.js" />
//@ts-check
class Properties {
  static data = [
    { id: 18, name: "Amy", location: "Westminster", pcoe: "2022/12/02", sale: 1002500.358, rating: 1, comments: "Closing update 7/3/25- We are still delayed on closing this asset out- received updated title from Title 365. Several liens are on title and I believe the Sheriff s Distribution is yet to take place. In Philadelphia it is taking 30-60 days after deed recordation for the distribution to process. Buyer to respond on HHA needed for roof Deficiencies. NEED HHA signed to clear to close- Next Steps: follow up on the HHA Owner: Buyer " },
    { id: 11, name: "David", location: "Irvine", pcoe: "2022/01/02", sale: 12500.99, rating: 4, comments: "Closing update 7/3/25- We are still delayed on closing this asset out- received updated title from Title 365. Several liens are on title and I believe the Sheriff s Distribution is yet to take place. In Philadelphia it is taking 30-60 days after deed recordation for the distribution to process. Buyer to respond on HHA needed for roof Deficiencies. NEED HHA signed to clear to close- Next Steps: follow up on the HHA Owner: Buyer " },
    { id: 5, name: "Smith", location: "Station", pcoe: "2022/11/02", sale: 12500.99, rating: 3, comments: "short text" },
    { id: 7, name: "Abc", location: "Westminster", pcoe: "2022/06/13", sale: 12500.99, rating: 5, comments: "short text" },
    { id: 20, name: "Hello", location: "Westminster", pcoe: "2022/02/02", sale: 12500.99, rating: 2, comments: "" },
    { id: 21, name: "world", location: "Irvine", pcoe: "2023/12/02", sale: 12500.99, rating: 2, comments: "short text" },
    { id: 25, name: "Mike", location: "Station", pcoe: "2020/04/02", sale: 12500.99, rating: 3,comments: "short text" },
    { id: 27, name: "Steven", location: "Westminster", pcoe: "2022/12/02", sale: 12500.99, rating: 5, comments: "short text" },
    { id: 38, name: "Sam", location: "Westminster", pcoe: "2022/12/02", sale: 12500.99, rating: 1, comments: "short text" },
    { id: 31, name: "Jo", location: "Irvine", pcoe: "2022/01/02", sale: null, rating: 1, comments: "short text" },
    { id: 35, name: "Dd", location: "Station", pcoe: "2022/11/12", sale: 12500.99, rating: 4, comments: "short text" },
    { id: 37, name: "Xyx", location: "Westminster", pcoe: "2022/06/29", sale: 125.00, rating: 4, comments: "short text" },
    { id: 30, name: "Worlds", location: "Westminster", pcoe: "2022/07/02", sale: 2000.99, rating: 3, comments: "short text" },
    { id: 41, name: "Something", location: "Irvine", pcoe: "2025/12/02", sale: 3000000.756, rating: 2, comments: "short text" },
    { id: 45, name: "Mike", location: "Station", pcoe: "2019/04/02", sale: 525100.99, rating: 1, comments: "short text" },
    { id: 47, name: "Bike", location: "Westminster", pcoe: "2022/18/02", sale: 525100.99, rating: 1, comments: "short text" }
  ];
}

class Basic {
  constructor() {
    this.basic = new DataGrid("grid_basic", {
      data: Properties.data.slice(0, 5),
      enablePaging: false,
      columns: [
        { field: "id", label: "ID", type: "number", columnSize: 1 }, 
        { field: "name", type: "string", columnSize: 3 },
        { field: "pcoe", type: "date", columnSize: 3, formatter: "date" },
        { field: "location", columnSize: 2, formatter: "link", formatterParams: { urlPrefix: "./basicpage.html", fieldText: "location", target: "_blank" } }
        ]
    });

    this.basic.addColumn({ field: "sale", type: "number", columnSize: 3, formatter: "money", tooltipField: "comments" })
  }

  async render() {
    await this.basic.init();
  }
}
 
class All {
  constructor() {
    this.all = new DataGrid("grid_all", {
      data: Properties.data,
      baseIdName: "basic_grid",
      enablePaging: true,
      pagerPagesToDisplay: 3,
      pagerRowsPerPage: 5, 
      csvExportId: "exportCsv",
      columns: [
        { field: "id", label: "ID", type: "number", filterType: "equals" }, 
        { field: "name", type: "string", filterType: "like", filterRealTime: true, tooltipField: "comments", tooltipLayout: "right" },
        { field: "pcoe", type: "date", formatter: "date", formatterParams: { dateField: "pcoe", format: "MM/dd/yyyy"} },
        { 
          field: "location", 
          filterType: "equals", 
          filterValues: { Westminster: "Westminster", Irvine: "Irvine", Station: "Station" }, 
          formatter: "link", 
          formatterParams: { urlPrefix: "./basicpage.html", fieldText: "location", target: "_blank" } 
        }, 
        { field: "sale", type: "number", filterType: "equals", formatter: "numeric", formatterParams: { precision: 2, style: "currency" } }
        ]
    }); 
  }

  async render() {
    this.all.addColumn({ field: "rating", type: "number", filterType: "equals", formatter: "star" });
    await this.all.init();
  }
}

document.addEventListener("DOMContentLoaded", async function () {
  const basic = new Basic();
  const all = new All();

    await basic.render();
    await all.render();
});
