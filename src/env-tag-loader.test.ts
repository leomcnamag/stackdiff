import fs from "fs";
import os from "os";
import path from "path";
import { loadTagMap, saveTagMap, mergeTagMaps } from "./env-tag-loader";

const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "env-tag-loader-"));

afterAll(() => {
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

describe("saveTagMap / loadTagMap", () => {
  it("should save and reload a tag map", () => {
    const filePath = path.join(tmpDir, "tags.json");
    const tagMap = { API_KEY: ["secret"], PORT: ["infra"] };
    saveTagMap(filePath, tagMap);
    const loaded = loadTagMap(filePath);
    expect(loaded).toEqual(tagMap);
  });

  it("should throw on invalid JSON structure", () => {
    const filePath = path.join(tmpDir, "bad-tags.json");
    fs.writeFileSync(filePath, JSON.stringify(["not", "an", "object"]));
    expect(() => loadTagMap(filePath)).toThrow();
  });

  it("should throw when tag value is not a string array", () => {
    const filePath = path.join(tmpDir, "bad-values.json");
    fs.writeFileSync(filePath, JSON.stringify({ KEY: "not-an-array" }));
    expect(() => loadTagMap(filePath)).toThrow();
  });
});

describe("mergeTagMaps", () => {
  it("should merge two tag maps without duplicates", () => {
    const a = { API_KEY: ["secret"], PORT: ["infra"] };
    const b = { API_KEY: ["app"], DB_URL: ["secret", "infra"] };
    const merged = mergeTagMaps(a, b);
    expect(merged["API_KEY"]).toEqual(expect.arrayContaining(["secret", "app"]));
    expect(merged["PORT"]).toEqual(["infra"]);
    expect(merged["DB_URL"]).toEqual(["secret", "infra"]);
  });

  it("should deduplicate tags", () => {
    const a = { KEY: ["secret"] };
    const b = { KEY: ["secret", "app"] };
    const merged = mergeTagMaps(a, b);
    expect(merged["KEY"]).toEqual(["secret", "app"]);
  });

  it("should handle empty maps", () => {
    const merged = mergeTagMaps({}, { KEY: ["app"] });
    expect(merged).toEqual({ KEY: ["app"] });
  });
});
