import {
  applyAliases,
  resolveAliases,
  applyAliasesToStages,
  formatAliasResult,
  AliasMap,
} from "./env-alias";

const sampleEnv = {
  DATABASE_URL: "postgres://localhost/db",
  API_KEY: "secret123",
  PORT: "3000",
};

const aliases: AliasMap = {
  DB_URL: "DATABASE_URL",
  KEY: "API_KEY",
  MISSING_ALIAS: "NONEXISTENT_KEY",
};

describe("applyAliases", () => {
  it("copies canonical values to alias keys", () => {
    const result = applyAliases(sampleEnv, aliases);
    expect(result.aliased["DB_URL"]).toBe("postgres://localhost/db");
    expect(result.aliased["KEY"]).toBe("secret123");
  });

  it("preserves original keys", () => {
    const result = applyAliases(sampleEnv, aliases);
    expect(result.aliased["DATABASE_URL"]).toBe("postgres://localhost/db");
    expect(result.aliased["PORT"]).toBe("3000");
  });

  it("tracks applied and skipped aliases", () => {
    const result = applyAliases(sampleEnv, aliases);
    expect(result.applied).toContain("DB_URL");
    expect(result.applied).toContain("KEY");
    expect(result.skipped).toContain("MISSING_ALIAS");
  });

  it("does not modify original env", () => {
    applyAliases(sampleEnv, aliases);
    expect("DB_URL" in sampleEnv).toBe(false);
  });
});

describe("resolveAliases", () => {
  it("renames alias key to canonical when canonical is absent", () => {
    const env = { DB_URL: "postgres://localhost/db", PORT: "3000" };
    const resolved = resolveAliases(env, { DB_URL: "DATABASE_URL" });
    expect(resolved["DATABASE_URL"]).toBe("postgres://localhost/db");
    expect("DB_URL" in resolved).toBe(false);
  });

  it("removes alias key when canonical already exists", () => {
    const env = { DB_URL: "alias-value", DATABASE_URL: "canonical-value" };
    const resolved = resolveAliases(env, { DB_URL: "DATABASE_URL" });
    expect(resolved["DATABASE_URL"]).toBe("canonical-value");
    expect("DB_URL" in resolved).toBe(false);
  });
});

describe("applyAliasesToStages", () => {
  it("applies aliases to all stages", () => {
    const stages = { dev: sampleEnv, prod: { DATABASE_URL: "prod-db" } };
    const results = applyAliasesToStages(stages, { DB_URL: "DATABASE_URL" });
    expect(results["dev"].aliased["DB_URL"]).toBe("postgres://localhost/db");
    expect(results["prod"].aliased["DB_URL"]).toBe("prod-db");
  });
});

describe("formatAliasResult", () => {
  it("includes stage name when provided", () => {
    const result = applyAliases(sampleEnv, aliases);
    const output = formatAliasResult(result, "dev");
    expect(output).toContain("[dev]");
    expect(output).toContain("Applied");
    expect(output).toContain("Skipped");
  });

  it("works without stage name", () => {
    const result = applyAliases(sampleEnv, aliases);
    const output = formatAliasResult(result);
    expect(output).toContain("Alias result");
    expect(output).not.toContain("[");
  });
});
