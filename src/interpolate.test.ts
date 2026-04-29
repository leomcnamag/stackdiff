import { describe, it, expect } from "vitest";
import {
  interpolateValue,
  interpolateEnvMap,
  interpolateStages,
} from "./interpolate";

describe("interpolateValue", () => {
  it("returns plain value unchanged", () => {
    expect(interpolateValue("hello", {})).toBe("hello");
  });

  it("resolves ${VAR} syntax", () => {
    expect(interpolateValue("${HOST}:8080", { HOST: "localhost" })).toBe(
      "localhost:8080"
    );
  });

  it("resolves $VAR syntax", () => {
    expect(interpolateValue("$HOST:8080", { HOST: "localhost" })).toBe(
      "localhost:8080"
    );
  });

  it("replaces unresolved references with empty string by default", () => {
    expect(interpolateValue("${MISSING}_suffix", {})).toBe("_suffix");
  });

  it("keeps unresolved references when keepUnresolved=true", () => {
    expect(
      interpolateValue("${MISSING}_suffix", {}, { keepUnresolved: true })
    ).toBe("${MISSING}_suffix");
  });

  it("resolves nested references", () => {
    const env = { BASE: "http://example.com", URL: "${BASE}/api" };
    expect(interpolateValue("${URL}/v1", env)).toBe("http://example.com/api/v1");
  });

  it("stops at maxDepth to prevent infinite loops", () => {
    const env = { A: "${B}", B: "${A}" };
    // Should not throw, just return partially resolved
    const result = interpolateValue("${A}", env, { maxDepth: 3 });
    expect(typeof result).toBe("string");
  });
});

describe("interpolateEnvMap", () => {
  it("resolves all values in a map", () => {
    const env = { HOST: "db.internal", DSN: "postgres://${HOST}/mydb" };
    const result = interpolateEnvMap(env);
    expect(result.DSN).toBe("postgres://db.internal/mydb");
    expect(result.HOST).toBe("db.internal");
  });

  it("does not mutate the original map", () => {
    const env = { A: "${B}", B: "world" };
    interpolateEnvMap(env);
    expect(env.A).toBe("${B}");
  });
});

describe("interpolateStages", () => {
  it("interpolates each stage independently", () => {
    const stages = {
      dev: { HOST: "dev.local", URL: "http://${HOST}" },
      prod: { HOST: "prod.example.com", URL: "https://${HOST}" },
    };
    const result = interpolateStages(stages);
    expect(result.dev.URL).toBe("http://dev.local");
    expect(result.prod.URL).toBe("https://prod.example.com");
  });
});
