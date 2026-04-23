import { diffEnvMaps, diffStages } from "./diff";
import { ParseResult } from "./parser";

describe("diffEnvMaps", () => {
  it("detects added keys", () => {
    const base = { A: "1" };
    const target = { A: "1", B: "2" };
    const result = diffEnvMaps(base, target);
    expect(result).toContainEqual({ key: "B", kind: "added", targetValue: "2" });
  });

  it("detects removed keys", () => {
    const base = { A: "1", B: "2" };
    const target = { A: "1" };
    const result = diffEnvMaps(base, target);
    expect(result).toContainEqual({ key: "B", kind: "removed", baseValue: "2" });
  });

  it("detects changed values", () => {
    const base = { A: "old" };
    const target = { A: "new" };
    const result = diffEnvMaps(base, target);
    expect(result).toContainEqual({
      key: "A",
      kind: "changed",
      baseValue: "old",
      targetValue: "new",
    });
  });

  it("marks unchanged keys", () => {
    const base = { A: "same" };
    const target = { A: "same" };
    const result = diffEnvMaps(base, target);
    expect(result).toContainEqual({
      key: "A",
      kind: "unchanged",
      baseValue: "same",
      targetValue: "same",
    });
  });

  it("returns keys in sorted order", () => {
    const base = { Z: "1", A: "2", M: "3" };
    const target = { Z: "1", A: "2", M: "3" };
    const keys = diffEnvMaps(base, target).map((d) => d.key);
    expect(keys).toEqual(["A", "M", "Z"]);
  });
});

describe("diffStages", () => {
  const makeStage = (stage: string, vars: Record<string, string>): ParseResult => ({
    filePath: `.env.${stage}`,
    stage,
    vars,
  });

  it("returns empty array for fewer than 2 stages", () => {
    expect(diffStages([])).toEqual([]);
    expect(diffStages([makeStage("dev", {})])).toEqual([]);
  });

  it("produces one StageDiff for two stages", () => {
    const stages = [
      makeStage("dev", { PORT: "3000" }),
      makeStage("prod", { PORT: "8080" }),
    ];
    const result = diffStages(stages);
    expect(result).toHaveLength(1);
    expect(result[0].base).toBe("dev");
    expect(result[0].target).toBe("prod");
    expect(result[0].diffs[0].kind).toBe("changed");
  });

  it("chains diffs across multiple stages", () => {
    const stages = [
      makeStage("dev", { A: "1" }),
      makeStage("staging", { A: "1", B: "2" }),
      makeStage("prod", { A: "1", B: "2", C: "3" }),
    ];
    const result = diffStages(stages);
    expect(result).toHaveLength(2);
    expect(result[1].base).toBe("staging");
    expect(result[1].target).toBe("prod");
  });
});
