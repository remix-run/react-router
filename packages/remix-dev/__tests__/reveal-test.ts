import os from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";
import fse from "fs-extra";
import stripAnsi from "strip-ansi";

import { run } from "../cli/run";

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

describe("the reveal command", () => {
  let tempDirs = new Set<string>();
  let originalCwd = process.cwd();

  beforeEach(() => {
    process.chdir(TEMP_DIR);
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

  let runtimes = ["node", "cloudflare", "deno"] as const;

  for (let runtime of runtimes) {
    it(`generates a "${runtime}" specific entry.server.tsx file in the app directory`, async () => {
      let projectDir = await getProjectDir(`entry.server.${runtime}`);
      await run([
        "create",
        projectDir,
        "--template",
        pathToFileURL(path.join(__dirname, "fixtures", runtime)).toString(),
        "--no-install",
        "--typescript",
      ]);

      let entryClientFile = path.join(projectDir, "app", "entry.client.tsx");
      let entryServerFile = path.join(projectDir, "app", "entry.server.tsx");

      expect(fse.existsSync(entryServerFile)).toBeFalsy();
      expect(fse.existsSync(entryClientFile)).toBeFalsy();

      await run(["reveal", "entry.server", projectDir]);
      await run(["reveal", "entry.client", projectDir]);

      expect(fse.existsSync(entryServerFile)).toBeTruthy();
      expect(fse.existsSync(entryClientFile)).toBeTruthy();
    });

    it(`generates a "${runtime}" specific entry.server.jsx file in the app directory`, async () => {
      let projectDir = await getProjectDir(`entry.server.${runtime}-js`);
      await run([
        "create",
        projectDir,
        "--template",
        pathToFileURL(path.join(__dirname, "fixtures", runtime)).toString(),
        "--no-install",
        "--typescript",
      ]);

      let entryClientFile = path.join(projectDir, "app", "entry.client.jsx");
      let entryServerFile = path.join(projectDir, "app", "entry.server.jsx");

      expect(fse.existsSync(entryServerFile)).toBeFalsy();
      expect(fse.existsSync(entryClientFile)).toBeFalsy();

      await run(["reveal", "entry.server", projectDir, "--no-typescript"]);
      await run(["reveal", "entry.client", projectDir, "--no-typescript"]);

      expect(fse.existsSync(entryServerFile)).toBeTruthy();
      expect(fse.existsSync(entryClientFile)).toBeTruthy();
    });
  }
});
