using CalculatorApp;

Console.WriteLine("C# Calculator");
Console.WriteLine("Enter an expression like '3 + 4', or 'exit' to quit.");

while (true)
{
    Console.Write("> ");
    var input = Console.ReadLine();

    if (input is null || input.Trim().Equals("exit", StringComparison.OrdinalIgnoreCase))
    {
        break;
    }

    if (string.IsNullOrWhiteSpace(input))
    {
        continue;
    }

    var parts = input.Trim().Split(' ', StringSplitOptions.RemoveEmptyEntries);

    if (parts.Length != 3 ||
        !double.TryParse(parts[0], out var left) ||
        !double.TryParse(parts[2], out var right) ||
        parts[1].Length != 1)
    {
        Console.WriteLine("Invalid input. Expected format: <number> <operator> <number>, e.g. '3 + 4'.");
        continue;
    }

    try
    {
        var result = Calculator.Evaluate(left, parts[1][0], right);
        Console.WriteLine($"= {result}");
    }
    catch (Exception ex) when (ex is DivideByZeroException or ArgumentException)
    {
        Console.WriteLine($"Error: {ex.Message}");
    }
}

Console.WriteLine("Goodbye!");
