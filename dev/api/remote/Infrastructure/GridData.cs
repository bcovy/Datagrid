namespace DataGridApi.Infrastructure;

public static class GridData
{
    private static readonly IEnumerable<PropertyData> _data;

    static GridData()
    {
        _data = [
            new PropertyData() { PropertyID = 1, Address = "123 anywhere st", City = "westminster", State = "ca" },
            new PropertyData() { PropertyID = 2, Address = "156 anywhere st", City = "westminster", State = "az" },
            new PropertyData() { PropertyID = 3, Address = "188 anywhere st", City = "mesa", State = "nv" },
            new PropertyData() { PropertyID = 4, Address = "888 anywhere st", City = "vegas", State = "or" },
            new PropertyData() { PropertyID = 5, Address = "666 some st", City = "beach", State = "ca" },
            new PropertyData() { PropertyID = 6, Address = "0154 anywhere st", City = "westminster", State = "mi" },
            new PropertyData() { PropertyID = 7, Address = "15 drive st", City = "westminster", State = "wa" },
            new PropertyData() { PropertyID = 8, Address = "156 anywhere st", City = "laguna beach", State = "wa" },
            new PropertyData() { PropertyID = 9, Address = "156 anywhere st", City = "laguna beach", State = "wa" },
            new PropertyData() { PropertyID = 10, Address = "123 anywhere st", City = "irvine", State = "ca" },
            new PropertyData() { PropertyID = 11, Address = "99 anywhere st", City = "westminster", State = "ca" },
            new PropertyData() { PropertyID = 12, Address = "80 anywhere st", City = "city", State = "wa" },
            new PropertyData() { PropertyID = 13, Address = "13 anywhere st", City = "westminster", State = "ca" },
            new PropertyData() { PropertyID = 14, Address = "3 drive st", City = "lagunas", State = "ca" },
            new PropertyData() { PropertyID = 15, Address = "8 helper st", City = "laguna beach", State = "ca" }
        ];
    }

    public static IEnumerable<PropertyData> Get()
    {
        return _data;
    }

    public static IEnumerable<PropertyData> PageData(IEnumerable<PropertyData> data, int? page)
    {
        page ??= 1; // Default to page 1 if null
        int pageSize = 5;
        
        if (page == 0)
            page = 1;

        return data.Skip(((int)page - 1) * pageSize).Take(pageSize);
    }

    public static IEnumerable<PropertyData> FilterAndSort(string? sort, string? direction, int? propertyID, string? address, string? city, string? state)
    {
        IEnumerable<PropertyData> data = _data;

        if (propertyID != null)
            data = data.Where(x => x.PropertyID == propertyID);

        if (!string.IsNullOrEmpty(address))
            data = data.Where(x => x.Address.Contains(address));

        if (!string.IsNullOrEmpty(city))
            data = data.Where(x => x.City.Contains(city));

        if (!string.IsNullOrEmpty(state))
            data = data.Where(x => x.State == state);

        if (!string.IsNullOrEmpty(sort))
            return SortedData(data, sort, direction);

        return data;
    }

    public static IEnumerable<PropertyData> FilterAndSort(string? sort, string? direction, int? propertyID, string? address, string[]? city, string[]? state)
    {
        IEnumerable<PropertyData> data = _data;

        if (propertyID != null)
            data = data.Where(x => x.PropertyID == propertyID);

        if (!string.IsNullOrEmpty(address))
            data = data.Where(x => x.Address.Contains(address));

        if (city?.Length > 0)
            data = data.Where(x => city.Contains(x.City));

        if (state?.Length > 0)
            data = data.Where(x => state.Contains(x.State));

        if (!string.IsNullOrEmpty(sort))
            return SortedData(data, sort, direction);

        return data;
    }

    public static IEnumerable<PropertyData> FilterAndSortBetween(string? sort, string? direction, int[]? propertyID, string? address, string[]? state)
    {
        IEnumerable<PropertyData> data = _data;

        if (!string.IsNullOrEmpty(address))
            data = data.Where(x => x.Address.Contains(address));

        if (propertyID?.Length > 0)
            data = data.Where(x => x.PropertyID >= propertyID[0] && x.PropertyID <= propertyID[1]);

        if (state?.Length > 0)
            data = data.Where(x => state.Contains(x.State));

        if (!string.IsNullOrEmpty(sort))
            return SortedData(data, sort, direction);

        return data;
    }

    private static IEnumerable<PropertyData> SortedData(IEnumerable<PropertyData> data, string? column, string? direction)
    {
        if (string.IsNullOrEmpty(column) || string.IsNullOrEmpty(direction))
            return data.OrderBy(x => x.PropertyID);

        direction = direction.ToLower();
        column = column.ToLower();

        return column switch
        {
            "propertyid" => direction == "desc" ? data.OrderByDescending(x => x.PropertyID) : data.OrderBy(x => x.PropertyID),
            "address" => direction == "desc" ? data.OrderByDescending(x => x.Address) : data.OrderBy(x => x.Address),
            "city" => direction == "desc" ? data.OrderByDescending(x => x.City) : data.OrderBy(x => x.City),
            "state" => direction == "desc" ? data.OrderByDescending(x => x.State) : data.OrderBy(x => x.State),
            _ => data.OrderBy(x => x.PropertyID),
        };
    }
}
