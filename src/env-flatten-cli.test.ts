import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import { parseFlattenArgs, runFlattenCliWithArgs } from "./env-flatten-cli";

function writeTempEnv(content: string): string {
  const file = path.join(os.tmpdir(), `stackdiff-flatten-${Date.now()}-${Math.random().toString(36).slice(2)}.env`);
  fs.writeFileSync(file, content);
  return file;
}

afterEach(() => jest.restoreAllMocks());

describe("parseFlattenArgs", () => {
  it("defaults to flatten mode with __ separator", () => {
    const args = parseFlattenArgs(["a.env", "b.env"]);
    expect(args.mode).toBe("flatten");
    expect(args.separator).toBe("__");
    expect(args.files).toEqual(["a.env", "b.env"]);
  });

  it("parses --expand flag", () => {
    const args = parseFlattenArgs(["--expand", "a.env"]);
    expect(args.mode).toBe("expand");
  });

  it("parses --separator flag", () => {
    const args = parseFlattenArgs(["--separator", "_", "a.env"]);
    expect(args.separator).toBe("_");
  });

  it("parses --output flag", () => {
    const args = parseFlattenArgs(["--output", "out.env", "a.env"]);
    expect(args.output).toBe("out.env");
  });
});

describe("runFlattenCliWithArgs", () => {
  it("exits with error when no files provided", () => {
    const exitSpy = jest.spyOn(process, "exit").mockImplementation(() => { throw new Error("exit"); });
    jest.spyOn(console, "error").mockImplementation(() => {});
    expect(() => runFlattenCliWithArgs({ files: [], mode: "flatten", separator: "__" })).toThrow("exit");
    expect(exitSpy).toHaveBeenCalledWith(1);
  });

  it("flattens multiple env files to stdout", () => {
    const f1 = writeTempEnv("HOST=localhost\nPORT=5432\n");
    const f2 = writeTempEnv("NAME=stackdiff\n");
    const writeSpy = jest.spyOn(process.stdout, "write").mockImplementation(() => true);
    jest.spyOn(console, "error").mockImplementation(() => {});
    runFlattenCliWithArgs({ files: [f1, f2], mode: "flatten", separator: "__" });
    const output = (writeSpy.mock.calls[0][0] as string);
    expect(output).toContain("__HOST=localhost");
    expect(output).toContain("__NAME=stackdiff");
    fs.unlinkSync(f1);
    fs.unlinkSync(f2);
  });

  it("expands a flat env file to stdout as JSON", () => {
    const f = writeTempEnv("DB__HOST=localhost\nDB__PORT=5432\n");
    const writeSpy = jest.spyOn(process.stdout, "write").mockImplementation(() => true);
    runFlattenCliWithArgs({ files: [f], mode: "expand", separator: "__" });
    const output = JSON.parse(writeSpy.mock.calls[0][0] as string);
    expect(output["DB"]["HOST"]).toBe("localhost");
    fs.unlinkSync(f);
  });

  it("writes flatten output to file when --output specified", () => {
    const f = writeTempEnv("KEY=val\n");
    const out = path.join(os.tmpdir(), `stackdiff-flatten-out-${Date.now()}.env`);
    jest.spyOn(console, "error").mockImplementation(() => {});
    runFlattenCliWithArgs({ files: [f], mode: "flatten", separator: "__", output: out });
    const content = fs.readFileSync(out, "utf8");
    expect(content).toContain("KEY=val");
    fs.unlinkSync(f);
    fs.unlinkSync(out);
  });
});
