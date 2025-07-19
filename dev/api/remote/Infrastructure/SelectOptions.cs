using System.Text.Json.Serialization;

namespace DataGridApi.Infrastructure;

public record SelectOptions(
    [property: JsonPropertyName("value")] string Value,
    [property: JsonPropertyName("text")] string Text);