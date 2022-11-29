import { tmpdir } from "os";
import path from "path";
import glob from "fast-glob";
import {
  copySync,
  ensureDirSync,
  readJSONSync,
  realpathSync,
  removeSync,
  readFile,
} from "fs-extra";
import shell from "shelljs";
import stripAnsi from "strip-ansi";
import type { PackageJson, TsConfigJson } from "type-fest";

import { readConfig } from "../../config";
import { convertToJavaScript } from "../../cli/migrate/migrations/convert-to-javascript";

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

const FIXTURE = path.join(__dirname, "fixtures", "indie-stack");
const TEMP_DIR = path.join(
  realpathSync(tmpdir()),
  `remix-tests-${Math.random().toString(32).slice(2)}`
);

jest.setTimeout(30_000);
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

const checkMigrationRanSuccessfully = async (projectDir: string) => {
  let config = await readConfig(projectDir);

  let jsConfigJson: TsConfigJson = readJSONSync(
    path.join(projectDir, "jsconfig.json")
  );
  expect(jsConfigJson.include).not.toContain("remix.env.d.ts");
  expect(jsConfigJson.include).not.toContain("**/*.ts");
  expect(jsConfigJson.include).toContain("**/*.js");
  expect(jsConfigJson.include).not.toContain("**/*.tsx");
  expect(jsConfigJson.include).toContain("**/*.jsx");

  let packageJson: PackageJson = readJSONSync(
    path.join(projectDir, "package.json")
  );
  expect(packageJson.devDependencies).not.toContain("@types/react");
  expect(packageJson.devDependencies).not.toContain("@types/react-dom");
  expect(packageJson.devDependencies).not.toContain("typescript");
  expect(packageJson.scripts).not.toContain("typecheck");

  let relativeAppDirectory = path.relative(
    config.rootDirectory,
    config.appDirectory
  );
  let unixAppDirectory = path.posix.join(
    ...relativeAppDirectory.split(path.delimiter)
  );

  let TSFiles = glob.sync("**/*.@(ts|tsx)", {
    cwd: config.rootDirectory,
    ignore: [`./${unixAppDirectory}/**/*`],
  });
  expect(TSFiles).toHaveLength(0);
  let JSFiles = glob.sync("**/*.@(js|jsx)", {
    absolute: true,
    cwd: config.rootDirectory,
    ignore: [`./${unixAppDirectory}/**/*`],
  });
  let importResult = shell.grep("-l", 'from "', JSFiles);
  expect(importResult.stdout.trim()).toBe("");
  expect(importResult.stderr).toBeNull();
  expect(importResult.code).toBe(0);
  let exportDefaultResult = shell.grep("-l", 'export default "', JSFiles);
  expect(exportDefaultResult.stdout.trim()).toBe("");
  expect(exportDefaultResult.stderr).toBeNull();
  expect(exportDefaultResult.code).toBe(0);

  let rootRouteContent = await readFile(
    path.join(projectDir, "app", "root.jsx"),
    "utf-8"
  );

  expect(rootRouteContent).not.toContain('require("@remix-run/react")');
};

const makeApp = () => {
  let projectDir = path.join(TEMP_DIR, "convert-to-javascript");
  copySync(FIXTURE, projectDir);
  return projectDir;
};

describe("`convert-to-javascript` migration", () => {
  it("runs successfully when ran programmatically", async () => {
    let projectDir = makeApp();

    await convertToJavaScript(projectDir, { force: true });

    await checkMigrationRanSuccessfully(projectDir);

    expect(output).not.toContain("✅ Your JavaScript looks good!");
    expect(output).not.toContain("successfully migrated");
  });
});
