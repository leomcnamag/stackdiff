import { flattenEnvGroups, expandEnvMap, formatFlattenResult } from "./env-flatten";

describe("flattenEnvGroups", () => {
  it("flattens groups into prefixed keys", () => {
    const groups = {
      DB: { HOST: "localhost", PORT: "5432" },
      APP: { NAME: "stackdiff", ENV: "test" },
    };
    const result = flattenEnvGroups(groups);
    expect(result.flattened["DB__HOST"]).toBe("localhost");
    expect(result.flattened["DB__PORT"]).toBe("5432");
    expect(result.flattened["APP__NAME"]).toBe("stackdiff");
    expect(result.flattened["APP__ENV"]).toBe("test");
  });

  it("supports custom separator", () => {
    const groups = { SVC: { URL: "http://x" } };
    const result = flattenEnvGroups(groups, "_");
    expect(result.flattened["SVC_URL"]).toBe("http://x");
    expect(result.separator).toBe("_");
  });

  it("returns empty flattened for empty groups", () => {
    const result = flattenEnvGroups({});
    expect(result.flattened).toEqual({});
  });
});

describe("expandEnvMap", () => {
  it("expands prefixed keys into groups", () => {
    const flat = { DB__HOST: "localhost", DB__PORT: "5432", APP__NAME: "sd" };
    const groups = expandEnvMap(flat);
    expect(groups["DB"]["HOST"]).toBe("localhost");
    expect(groups["DB"]["PORT"]).toBe("5432");
    expect(groups["APP"]["NAME"]).toBe("sd");
  });

  it("places unprefixed keys in __root__", () => {
    const flat = { NODE_ENV: "production", DB__HOST: "db" };
    const groups = expandEnvMap(flat);
    expect(groups["__root__"]["NODE_ENV"]).toBe("production");
    expect(groups["DB"]["HOST"]).toBe("db");
  });

  it("handles custom separator", () => {
    const flat = { SVC_URL: "http://x" };
    const groups = expandEnvMap(flat, "_");
    expect(groups["SVC"]["URL"]).toBe("http://x");
  });

  it("returns empty for empty input", () => {
    expect(expandEnvMap({})).toEqual({});
  });
});

describe("formatFlattenResult", () => {
  it("includes group count and total keys", () => {
    const groups = { DB: { HOST: "localhost" }, APP: { NAME: "sd" } };
    const result = flattenEnvGroups(groups);
    const output = formatFlattenResult(result);
    expect(output).toContain("2 group(s)");
    expect(output).toContain("Total keys: 2");
    expect(output).toContain("DB: 1 key(s)");
  });
});
