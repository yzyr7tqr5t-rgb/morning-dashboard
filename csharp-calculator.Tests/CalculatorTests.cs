using CalculatorApp;
using Xunit;

namespace CalculatorApp.Tests;

public class CalculatorTests
{
    [Theory]
    [InlineData(3, '+', 4, 7)]
    [InlineData(3, '-', 4, -1)]
    [InlineData(3, '*', 4, 12)]
    [InlineData(12, '/', 4, 3)]
    public void Evaluate_ReturnsExpectedResult(double left, char op, double right, double expected)
    {
        Assert.Equal(expected, Calculator.Evaluate(left, op, right));
    }

    [Fact]
    public void Evaluate_DivideByZero_Throws()
    {
        Assert.Throws<DivideByZeroException>(() => Calculator.Evaluate(1, '/', 0));
    }

    [Fact]
    public void Evaluate_UnknownOperator_Throws()
    {
        Assert.Throws<ArgumentException>(() => Calculator.Evaluate(1, '%', 2));
    }
}
