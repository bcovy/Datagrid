namespace DataGridApi.Infrastructure;

public static class DropDownData
{
    private static readonly IEnumerable<SelectOptions> _city;
    private static readonly IEnumerable<SelectOptions> _states;

    static DropDownData()
    {
        _city = [
            new SelectOptions("westminster", "westminster"),
            new SelectOptions("mesa", "mesa"),
            new SelectOptions("vegas", "vegas"),
            new SelectOptions("irvine", "irvine"),
            new SelectOptions("lagunas", "lagunas")
        ];

        _states = [
            new SelectOptions("ca", "ca"),
            new SelectOptions("az", "az"),
            new SelectOptions("nv", "nv"),
            new SelectOptions("or", "or"),
            new SelectOptions("mi", "mi"),
            new SelectOptions("wa", "wa")
        ];
    }

    public static IEnumerable<SelectOptions> City => _city;

    public static IEnumerable<SelectOptions> States => _states;
}
