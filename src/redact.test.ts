import { describe, it, expect } from "vitest";
import {
  isSensitiveKey,
  redactValue,
  redactEnvMap,
  redactStages,
} from "./redact";

describe("isSensitiveKey", () => {
  it("detects password keys", () => {
    expect(isSensitiveKey("DB_PASSWORD")).toBe(true);
    expect(isSensitiveKey("password")).toBe(true);
  });

  it("detects token keys", () => {
    expect(isSensitiveKey("ACCESS_TOKEN")).toBe(true);
    expect(isSensitiveKey("API_KEY")).toBe(true);
  });

  it("does not flag non-sensitive keys", () => {
    expect(isSensitiveKey("APP_ENV")).toBe(false);
    expect(isSensitiveKey("PORT")).toBe(false);
    expect(isSensitiveKey("LOG_LEVEL")).toBe(false);
  });

  it("respects custom patterns", () => {
    expect(isSensitiveKey("MY_CUSTOM", [/custom/i])).toBe(true);
    expect(isSensitiveKey("DB_PASSWORD", [/custom/i])).toBe(false);
  });
});

describe("redactValue", () => {
  it("returns default replacement", () => {
    expect(redactValue("supersecret")).toBe("***");
  });

  it("uses custom replacement", () => {
    expect(redactValue("supersecret", "[HIDDEN]")).toBe("[HIDDEN]");
  });

  it("shows length when requested", () => {
    expect(redactValue("supersecret", "***", true)).toBe("***(11)");
  });
});

describe("redactEnvMap", () => {
  const env = {
    APP_ENV: "production",
    DB_PASSWORD: "hunter2",
    ACCESS_TOKEN: "tok_abc123",
    PORT: "3000",
  };

  it("redacts sensitive keys and preserves others", () => {
    const result = redactEnvMap(env);
    expect(result.APP_ENV).toBe("production");
    expect(result.PORT).toBe("3000");
    expect(result.DB_PASSWORD).toBe("***");
    expect(result.ACCESS_TOKEN).toBe("***");
  });

  it("shows length with showLength option", () => {
    const result = redactEnvMap(env, { showLength: true });
    expect(result.DB_PASSWORD).toBe("***(7)");
  });
});

describe("redactStages", () => {
  it("redacts all stages", () => {
    const stages = {
      dev: { APP_ENV: "dev", SECRET_KEY: "dev-secret" },
      prod: { APP_ENV: "prod", SECRET_KEY: "prod-secret" },
    };
    const result = redactStages(stages);
    expect(result.dev.APP_ENV).toBe("dev");
    expect(result.dev.SECRET_KEY).toBe("***");
    expect(result.prod.APP_ENV).toBe("prod");
    expect(result.prod.SECRET_KEY).toBe("***");
  });
});
