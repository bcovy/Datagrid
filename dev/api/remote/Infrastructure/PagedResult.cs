using System.Text.Json.Serialization;

namespace DataGridApi.Infrastructure;

public class PagedResult
{
    [JsonPropertyName("rowCount")]
    public int RowCount { get; set; }
    [JsonPropertyName("data")]
    public IEnumerable<PropertyData> Data { get; set; } = [];
}