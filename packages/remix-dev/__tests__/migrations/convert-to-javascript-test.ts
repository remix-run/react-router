import { tmpdir } from "os";
import { join } from "path";
import glob from "fast-glob";
import {
  copySync,
  ensureDirSync,
  readJSONSync,
  realpathSync,
  removeSync,
} from "fs-extra";
import shell from "shelljs";
import stripAnsi from "strip-ansi";
import type { PackageJson, TsConfigJson } from "type-fest";

import { run } from "../../cli/run";
import { readConfig } from "../../config";

let output: string;
const ORIGINAL_IO = {
  log: console.log,
  warn: console.warn,
  error: console.error,
};
const mockLog = (message: unknown = "", ...rest: unknown[]) => {
  // if you need to debug stuff, then use:
  // console.log('debug:', 'whatever you need to say');
  if (typeof message === "string" && message.startsWith("debug:")) {
    return ORIGINAL_IO.log(message, ...rest);
  }
  let messageString =
    typeof message === "string" ? message : JSON.stringify(message, null, 2);
  if (rest[0]) {
    throw new Error(
      "Our tests are not set up to handle multiple arguments to console.log."
    );
  }
  output += "\n" + stripAnsi(messageString);
};

const FIXTURE = join(__dirname, "fixtures", "indie-stack");
const TEMP_DIR = join(
  realpathSync(tmpdir()),
  `remix-tests-${Math.random().toString(32).slice(2)}`
);

beforeEach(() => {
  output = "";
  console.log = mockLog;
  console.warn = mockLog;
  console.error = mockLog;

  removeSync(TEMP_DIR);
  ensureDirSync(TEMP_DIR);
});
afterEach(() => {
  console.log = ORIGINAL_IO.log;
  console.warn = ORIGINAL_IO.warn;
  console.error = ORIGINAL_IO.error;

  removeSync(TEMP_DIR);
});

const makeApp = () => {
  let projectDir = join(TEMP_DIR, "convert-to-javascript");

  copySync(FIXTURE, projectDir);

  return projectDir;
};

const runConvertToJavaScriptMigration = (projectDir: string) =>
  run([
    "migrate",
    "--migration",
    "convert-to-javascript",
    projectDir,
    "--force",
  ]);

describe("`convert-to-javascript` migration", () => {
  it("runs successfully", async () => {
    let projectDir = makeApp();
    let config = await readConfig(projectDir);

    await runConvertToJavaScriptMigration(projectDir);

    let jsConfigJson: TsConfigJson = readJSONSync(
      join(projectDir, "jsconfig.json")
    );
    expect(jsConfigJson.include).not.toContain("remix.env.d.ts");
    expect(jsConfigJson.include).not.toContain("**/*.ts");
    expect(jsConfigJson.include).toContain("**/*.js");
    expect(jsConfigJson.include).not.toContain("**/*.tsx");
    expect(jsConfigJson.include).toContain("**/*.jsx");

    let packageJson: PackageJson = readJSONSync(
      join(projectDir, "package.json")
    );
    expect(packageJson.devDependencies).not.toContain("@types/react");
    expect(packageJson.devDependencies).not.toContain("@types/react-dom");
    expect(packageJson.devDependencies).not.toContain("typescript");
    expect(packageJson.scripts).not.toContain("typecheck");

    expect(output).toContain("✅ Your JavaScript looks good!");

    let TSFiles = glob.sync("**/*.@(ts|tsx)", {
      cwd: config.rootDirectory,
      ignore: [`./${config.appDirectory}/**/*`],
    });
    expect(TSFiles).toHaveLength(0);
    let JSFiles = glob.sync("**/*.@(js|jsx)", {
      absolute: true,
      cwd: config.rootDirectory,
      ignore: [`./${config.appDirectory}/**/*`],
    });
    let result = shell.grep("-l", 'from "', JSFiles);
    expect(result.stdout.trim()).toBe("");
    expect(result.stderr).toBeNull();
    expect(result.code).toBe(0);

    expect(output).toContain("successfully migrated");
  });
});
