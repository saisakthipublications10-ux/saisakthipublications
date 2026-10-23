import { describe, expect, it } from "vitest";
import { rupeesStr, toMinor } from "../src/lib/money";

describe("money string conversion", () => {
  it.each([
    ["12.5", 1250],
    ["18", 1800],
    [" 0.09 ", 9],
    ["999999999.99", 99999999999],
  ])("converts %s to minor currency units", (input, expected) => {
    expect(toMinor(input)).toBe(expected);
  });

  it.each(["", "1.234", ".50", "-1", "1000000000"])("rejects invalid input %s", (input) => {
    expect(toMinor(input)).toBeNull();
  });

  it("formats minor units as rupees with two decimal places", () => {
    expect(rupeesStr(1250)).toBe("12.50");
    expect(rupeesStr(9)).toBe("0.09");
  });
});
