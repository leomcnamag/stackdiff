import {
  renameEnvMap,
  renameStages,
  parseRenameRules,
  formatRenameResult,
} from "./env-rename";

describe("parseRenameRules", () => {
  it("parses valid rules", () => {
    const rules = parseRenameRules(["OLD_KEY:NEW_KEY", "FOO:BAR"]);
    expect(rules).toEqual([
      { from: "OLD_KEY", to: "NEW_KEY" },
      { from: "FOO", to: "BAR" },
    ]);
  });

  it("trims whitespace around colon", () => {
    const rules = parseRenameRules(["OLD : NEW"]);
    expect(rules[0]).toEqual({ from: "OLD", to: "NEW" });
  });

  it("throws on missing colon", () => {
    expect(() => parseRenameRules(["INVALID"])).toThrow(
      /Invalid rename rule/
    );
  });
});

describe("renameEnvMap", () => {
  const env = { DB_HOST: "localhost", DB_PORT: "5432", APP_ENV: "dev" };

  it("renames a key", () => {
    const result = renameEnvMap(env, [{ from: "DB_HOST", to: "DATABASE_HOST" }]);
    expect(result.envMap["DATABASE_HOST"]).toBe("localhost");
    expect(result.envMap["DB_HOST"]).toBeUndefined();
    expect(result.renamed).toEqual({ DB_HOST: "DATABASE_HOST" });
    expect(result.notFound).toEqual([]);
  });

  it("records not-found keys", () => {
    const result = renameEnvMap(env, [{ from: "MISSING", to: "ALSO_MISSING" }]);
    expect(result.notFound).toContain("MISSING");
    expect(result.renamed).toEqual({});
  });

  it("does not mutate the original map", () => {
    const copy = { ...env };
    renameEnvMap(env, [{ from: "DB_HOST", to: "X" }]);
    expect(env).toEqual(copy);
  });

  it("handles multiple rules", () => {
    const result = renameEnvMap(env, [
      { from: "DB_HOST", to: "DATABASE_HOST" },
      { from: "DB_PORT", to: "DATABASE_PORT" },
    ]);
    expect(Object.keys(result.renamed)).toHaveLength(2);
    expect(result.envMap["DATABASE_PORT"]).toBe("5432");
  });
});

describe("renameStages", () => {
  it("applies rules to all stages", () => {
    const stages = {
      dev: { FOO: "1", BAR: "2" },
      prod: { FOO: "3" },
    };
    const results = renameStages(stages, [{ from: "FOO", to: "FOO_NEW" }]);
    expect(results.dev.envMap["FOO_NEW"]).toBe("1");
    expect(results.prod.envMap["FOO_NEW"]).toBe("3");
    expect(results.prod.notFound).toEqual([]);
  });
});

describe("formatRenameResult", () => {
  it("shows renamed keys", () => {
    const result = { renamed: { OLD: "NEW" }, notFound: [], envMap: {} };
    const out = formatRenameResult("dev", result);
    expect(out).toContain("[dev]");
    expect(out).toContain("OLD → NEW");
  });

  it("shows not-found keys", () => {
    const result = { renamed: {}, notFound: ["GHOST"], envMap: {} };
    const out = formatRenameResult("staging", result);
    expect(out).toContain("not found: GHOST");
  });

  it("shows no-changes message when nothing happened", () => {
    const result = { renamed: {}, notFound: [], envMap: {} };
    const out = formatRenameResult("prod", result);
    expect(out).toContain("(no changes)");
  });
});
