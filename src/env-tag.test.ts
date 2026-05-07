import { tagEnvMap, filterByTag, formatTagSummary } from "./env-tag";

const sampleEnv = {
  DB_PASSWORD: "secret",
  API_KEY: "abc123",
  APP_NAME: "myapp",
  PORT: "3000",
};

const tagMap = {
  DB_PASSWORD: ["secret", "infra"],
  API_KEY: ["secret"],
  APP_NAME: ["app"],
};

describe("tagEnvMap", () => {
  it("should identify tagged and untagged keys", () => {
    const result = tagEnvMap(sampleEnv, tagMap);
    expect(result.tagged.map((t) => t.key)).toEqual(
      expect.arrayContaining(["DB_PASSWORD", "API_KEY", "APP_NAME"])
    );
    expect(result.untagged).toEqual(["PORT"]);
  });

  it("should build tag index correctly", () => {
    const result = tagEnvMap(sampleEnv, tagMap);
    expect(result.tagIndex["secret"]).toEqual(
      expect.arrayContaining(["DB_PASSWORD", "API_KEY"])
    );
    expect(result.tagIndex["app"]).toEqual(["APP_NAME"]);
    expect(result.tagIndex["infra"]).toEqual(["DB_PASSWORD"]);
  });

  it("should return empty tagged list when tagMap is empty", () => {
    const result = tagEnvMap(sampleEnv, {});
    expect(result.tagged).toHaveLength(0);
    expect(result.untagged).toHaveLength(4);
  });
});

describe("filterByTag", () => {
  it("should return only keys matching the given tag", () => {
    const result = filterByTag(sampleEnv, tagMap, "secret");
    expect(Object.keys(result)).toEqual(
      expect.arrayContaining(["DB_PASSWORD", "API_KEY"])
    );
    expect(result["APP_NAME"]).toBeUndefined();
  });

  it("should return empty object when no keys match tag", () => {
    const result = filterByTag(sampleEnv, tagMap, "nonexistent");
    expect(result).toEqual({});
  });
});

describe("formatTagSummary", () => {
  it("should include tagged count and untagged keys", () => {
    const summary = tagEnvMap(sampleEnv, tagMap);
    const output = formatTagSummary(summary);
    expect(output).toContain("Tagged keys: 3");
    expect(output).toContain("PORT");
    expect(output).toContain("Tag index:");
    expect(output).toContain("secret:");
  });
});
