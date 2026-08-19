# C# Calculator

A simple console-based calculator written in C#.

## Run

```bash
cd csharp-calculator
dotnet run
```

Enter expressions in the form `<number> <operator> <number>`, e.g.:

```
> 3 + 4
= 7
> 10 / 0
Error: Cannot divide by zero.
> exit
```

Supported operators: `+`, `-`, `*`, `/`.

## Test

```bash
cd csharp-calculator.Tests
dotnet test
```
