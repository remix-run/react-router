import * as os from "node:os";
import * as path from "node:path";
import fse from "fs-extra";
import stripAnsi from "strip-ansi";

import { run } from "../cli/run";

// this is so we can mock execSync for "npm install" and the like
jest.mock("child_process", () => {
  let cp = jest.requireActual(
    "child_process"
  ) as typeof import("child_process");
  let installDepsCmdPattern = /^(npm|yarn|pnpm) install$/;
  let configGetCmdPattern = /^(npm|yarn|pnpm) config get/;

  return {
    ...cp,
    execSync: jest.fn(
      (command: string, options: Parameters<typeof cp.execSync>[1]) => {
        // this prevents us from having to run the install process
        // and keeps our console output clean
        if (
          installDepsCmdPattern.test(command) ||
          configGetCmdPattern.test(command)
        ) {
          return "sample stdout";
        }
        return cp.execSync(command, options);
      }
    ),
  };
});

const TEMP_DIR = path.join(
  fse.realpathSync(os.tmpdir()),
  `remix-tests-${Math.random().toString(32).slice(2)}`
);

beforeAll(async () => {
  await fse.remove(TEMP_DIR);
  await fse.ensureDir(TEMP_DIR);
});

afterAll(async () => {
  await fse.remove(TEMP_DIR);
});

let output: string;
let originalLog = console.log;
let originalWarn = console.warn;
let originalError = console.error;

beforeEach(async () => {
  output = "";
  function hijackLog(message: unknown = "", ...rest: Array<unknown>) {
    // if you need to debug stuff, then use:
    // console.log('debug:', 'whatever you need to say');
    if (typeof message === "string" && message.startsWith("debug:")) {
      return originalLog(message, ...rest);
    }
    let messageString =
      typeof message === "string" ? message : JSON.stringify(message, null, 2);
    if (rest[0]) {
      throw new Error(
        "Our tests are not set up to handle multiple arguments to console.log."
      );
    }
    output += "\n" + stripAnsi(messageString).replace(TEMP_DIR, "<TEMP_DIR>");
  }
  console.log = hijackLog;
  console.warn = hijackLog;
  console.error = hijackLog;
});

afterEach(() => {
  console.log = originalLog;
  console.warn = originalWarn;
  console.error = originalError;
});

describe("the init command", () => {
  let tempDirs = new Set<string>();
  let originalCwd = process.cwd();

  beforeEach(() => {
    process.chdir(TEMP_DIR);
    jest.clearAllMocks();
  });

  afterEach(async () => {
    process.chdir(originalCwd);
    for (let dir of tempDirs) {
      await fse.remove(dir);
    }
    tempDirs = new Set<string>();
  });

  async function getProjectDir(name: string) {
    let tmpDir = path.join(TEMP_DIR, name);
    tempDirs.add(tmpDir);
    return tmpDir;
  }

  it("runs remix.init script when using `remix init`", async () => {
    let projectDir = await getProjectDir("remix-init-manual");

    fse.copySync(
      path.join(__dirname, "fixtures", "successful-remix-init"),
      projectDir
    );
    process.chdir(path.join(projectDir));
    await run(["init"]);

    expect(output).toBe("");
    expect(fse.existsSync(path.join(projectDir, "test.txt"))).toBeTruthy();
    expect(fse.existsSync(path.join(projectDir, "remix.init"))).toBeFalsy();
  });

  it("It keeps the `remix.init` script when using the `--no-delete` flag", async () => {
    let projectDir = await getProjectDir("remix-init-manual");

    fse.copySync(
      path.join(__dirname, "fixtures", "successful-remix-init"),
      projectDir
    );
    process.chdir(projectDir);
    await run(["init", "--no-delete"]);

    expect(output).toBe("");
    expect(fse.existsSync(path.join(projectDir, "remix.init"))).toBeTruthy();
  });

  it("throws an error when invalid remix.init script when manually ran", async () => {
    let projectDir = await getProjectDir("invalid-remix-init-manual");

    fse.copySync(
      path.join(__dirname, "fixtures", "failing-remix-init"),
      projectDir
    );
    process.chdir(projectDir);
    await expect(run(["init"])).rejects.toThrowError(
      `🚨 Oops, remix.init failed`
    );
    // we should keep remix.init around if the init script fails
    expect(fse.existsSync(path.join(projectDir, "remix.init"))).toBeTruthy();
  });
});

/*
eslint
  @typescript-eslint/consistent-type-imports: "off",
*/
