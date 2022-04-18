import path from "path";
import fse from "fs-extra";
import os from "os";
import stripAnsi from "strip-ansi";
import type { PackageJson } from "type-fest";
import { spawnSync } from "child_process";
import { PowerShell } from "node-powershell";

import { run } from "../cli/run";

let output: string;
const ORIGINAL_IO = {
  log: console.log,
  warn: console.warn,
  error: console.error,
};
function mockLog(message: unknown = "", ...rest: Array<unknown>) {
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
}

const FIXTURE = path.join(__dirname, "fixtures/replace-remix-imports");

const TEMP_DIR = path.join(
  fse.realpathSync(os.tmpdir()),
  `remix-tests-${Math.random().toString(32).slice(2)}`
);

beforeEach(async () => {
  output = "";
  console.log = mockLog;
  console.warn = mockLog;
  console.error = mockLog;

  await fse.remove(TEMP_DIR);
  await fse.ensureDir(TEMP_DIR);
});
afterEach(async () => {
  console.log = ORIGINAL_IO.log;
  console.warn = ORIGINAL_IO.warn;
  console.error = ORIGINAL_IO.error;

  await fse.remove(TEMP_DIR);
});

const makeApp = () => {
  let projectDir = path.join(TEMP_DIR, "replace-remix-imports");
  fse.copySync(FIXTURE, projectDir);
  return projectDir;
};

const replaceRemixImports = async (projectDir: string) => {
  await run([
    "migrate",
    "--migration",
    "replace-remix-imports",
    projectDir,
    "--force",
  ]);
};

describe("`replace-remix-imports` migration", () => {
  it("runs successfully", async () => {
    let projectDir = makeApp();
    await replaceRemixImports(projectDir);

    expect(output).toContain("detected `@remix-run/node`");
    expect(output).toContain("detected `@remix-run/serve`");

    expect(output).toContain("detected `1.3.4`");
    expect(output).toContain("✅ Your Remix dependencies look good!");
    let packageJson: PackageJson = fse.readJSONSync(
      path.join(projectDir, "package.json")
    );
    expect(packageJson.dependencies).not.toContain("remix");
    expect(packageJson.devDependencies).not.toContain("remix");
    expect(packageJson.dependencies["@remix-run/react"]).toBe("1.3.4");
    expect(packageJson.dependencies["@remix-run/node"]).toBe("1.3.4");
    expect(packageJson.dependencies["@remix-run/serve"]).toBe("1.3.4");
    expect(packageJson.devDependencies["@remix-run/dev"]).toBe("1.3.4");

    expect(output).toContain(
      "🗑  I'm removing `remix setup` from your `postinstall` script."
    );
    expect(output).toContain("✅ Your `package.json` scripts looks good!");
    expect(packageJson.scripts).not.toContain("postinstall");

    expect(output).toContain("✅ Your Remix imports look good!");
    if (process.platform === "win32") {
      let res = await PowerShell.$`Get-ChildItem ${projectDir} | Select-String 'from "remix"'`;
      let err = res.stderr?.toString("utf-8");
      let out = res.stdout?.toString("utf-8");
      expect(err).toBeFalsy();
      expect(out).toBeFalsy();
    } else {
      let { status } = spawnSync("grep", ["-nri", 'from "remix"', projectDir]);
      // `grep` exits with status code `1` when no matches are found
      expect(status).toBe(1);
    }

    expect(output).toContain("successfully migrated");
    expect(output).toContain("npm install");
  });
});
