import { describe, it, expect } from "vitest";
import { parseRedactArgs } from "./redact-cli";

describe("parseRedactArgs", () => {
  it("parses file arguments", () => {
    const args = parseRedactArgs([".env.dev", ".env.prod"]);
    expect(args.files).toEqual([".env.dev", ".env.prod"]);
  });

  it("parses --replacement", () => {
    const args = parseRedactArgs([".env.dev", "--replacement", "[REDACTED]"]);
    expect(args.replacement).toBe("[REDACTED]");
  });

  it("parses --show-length flag", () => {
    const args = parseRedactArgs([".env.dev", "--show-length"]);
    expect(args.showLength).toBe(true);
  });

  it("parses multiple --pattern flags", () => {
    const args = parseRedactArgs([
      ".env.dev",
      "--pattern",
      "custom",
      "--pattern",
      "internal",
    ]);
    expect(args.customPatterns).toEqual(["custom", "internal"]);
  });

  it("parses --output json", () => {
    const args = parseRedactArgs([".env.dev", "--output", "json"]);
    expect(args.output).toBe("json");
  });

  it("defaults output to undefined", () => {
    const args = parseRedactArgs([".env.dev"]);
    expect(args.output).toBeUndefined();
  });

  it("ignores unknown flags", () => {
    const args = parseRedactArgs([".env.dev", "--unknown-flag"]);
    expect(args.files).toEqual([".env.dev"]);
  });

  it("handles empty argv", () => {
    const args = parseRedactArgs([]);
    expect(args.files).toEqual([]);
    expect(args.replacement).toBeUndefined();
    expect(args.showLength).toBeUndefined();
  });
});
