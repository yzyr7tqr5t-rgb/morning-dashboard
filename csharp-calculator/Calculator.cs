namespace CalculatorApp;

public static class Calculator
{
    public static double Evaluate(double left, char op, double right)
    {
        return op switch
        {
            '+' => left + right,
            '-' => left - right,
            '*' => left * right,
            '/' => right == 0
                ? throw new DivideByZeroException("Cannot divide by zero.")
                : left / right,
            _ => throw new ArgumentException($"Unsupported operator '{op}'. Use +, -, * or /.")
        };
    }
}
