using DataGridApi.Infrastructure;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
// Learn more about configuring OpenAPI at https://aka.ms/aspnet/openapi
builder.Services.AddOpenApi();
builder.Services.AddEndpointsApiExplorer();

var app = builder.Build();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

app.MapGet("/data", () => {
    var results = GridData.Get();

    return Results.Json(results);
});

app.MapGet("/dropcity", () => {
    return Results.Json(DropDownData.City);
});

app.MapGet("/dropstates", () => {
    return Results.Json(DropDownData.States);
});

app.MapGet("/filter", (string sort, string direction, int? propertyID, string? address, string? city, string? state) => {
    var result = GridData.FilterAndSort(sort, direction, propertyID, address, city, state);

    return Results.Json(result);
});

app.MapGet("/filtermi", (string? sort, string? direction, int? propertyID, string? address, string[]? city, string[]? state) =>
{
    var result = GridData.FilterAndSort(sort, direction, propertyID, address, city, state);

    return Results.Json(result);
});

app.MapGet("/filterbetween", (string? sort, string? direction, int[]? propertyID, string? address, string[]? state) => {
    var result = GridData.FilterAndSortBetween(sort, direction, propertyID, address, state);

    return Results.Json(result);
});

app.MapGet("/paging", (string? sort, string? direction, int? page, int? propertyID, string? address, string? city, string? state) => {
    var data = GridData.FilterAndSort(sort, direction, propertyID, address, city, state);
    PagedResult result = new()
    {
        RowCount = data.Count(),
        Data = GridData.PageData(data, page)
    };

    return Results.Json(result);
});

app.Run();
