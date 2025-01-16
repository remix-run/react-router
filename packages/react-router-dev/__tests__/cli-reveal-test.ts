import path from "node:path";
import fse from "fs-extra";
import execa from "execa";

function getProjectDir() {
  let projectDir = path.join(
    __dirname,
    ".tmp",
    `reveal-test-${Math.random().toString(32).slice(2)}`
  );
  fse.copySync(path.join(__dirname, "fixtures", "basic"), projectDir);
  return projectDir;
}

async function runCli(cwd: string, args: string[]) {
  return await execa(
    "node",
    [
      "--require",
      require.resolve("esbuild-register"),
      path.resolve(__dirname, "../cli/index.ts"),
      ...args,
    ],
    { cwd }
  );
}

describe("the reveal command", () => {
  it("generates an entry.server.tsx file in the app directory", async () => {
    let projectDir = getProjectDir();

    let entryClientFile = path.join(projectDir, "app", "entry.client.tsx");
    let entryServerFile = path.join(projectDir, "app", "entry.server.tsx");

    expect(fse.existsSync(entryServerFile)).toBeFalsy();
    expect(fse.existsSync(entryClientFile)).toBeFalsy();

    await runCli(projectDir, ["reveal"]);

    expect(fse.existsSync(entryServerFile)).toBeTruthy();
    expect(fse.existsSync(entryClientFile)).toBeTruthy();
  });

  it("generates an entry.server.tsx file in the app directory when specific entries are provided", async () => {
    let projectDir = getProjectDir();

    let entryClientFile = path.join(projectDir, "app", "entry.client.tsx");
    let entryServerFile = path.join(projectDir, "app", "entry.server.tsx");

    expect(fse.existsSync(entryServerFile)).toBeFalsy();
    expect(fse.existsSync(entryClientFile)).toBeFalsy();

    await runCli(projectDir, ["reveal", "entry.server"]);
    expect(fse.existsSync(entryServerFile)).toBeTruthy();
    expect(fse.existsSync(entryClientFile)).toBeFalsy();
    fse.removeSync(entryServerFile);

    await runCli(projectDir, ["reveal", "entry.client"]);
    expect(fse.existsSync(entryClientFile)).toBeTruthy();
    expect(fse.existsSync(entryServerFile)).toBeFalsy();
  });

  it("generates an entry.server.jsx file in the app directory", async () => {
    let projectDir = getProjectDir();

    let entryClientFile = path.join(projectDir, "app", "entry.client.jsx");
    let entryServerFile = path.join(projectDir, "app", "entry.server.jsx");

    expect(fse.existsSync(entryServerFile)).toBeFalsy();
    expect(fse.existsSync(entryClientFile)).toBeFalsy();

    await runCli(projectDir, ["reveal", "--no-typescript"]);

    expect(fse.existsSync(entryServerFile)).toBeTruthy();
    expect(fse.existsSync(entryClientFile)).toBeTruthy();
  });
});
