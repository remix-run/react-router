import fse from "fs-extra";
import os from "os";
import path from "path";
import { pathToFileURL } from "url";
import stripAnsi from "strip-ansi";

import { run } from "../cli/run";
import { server } from "./msw";

beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
afterAll(() => server.close());

// keep the console clear
jest.mock("ora", () => {
  return jest.fn(() => ({
    start: jest.fn(() => ({
      stop: jest.fn(),
      clear: jest.fn(),
    })),
  }));
});

// this is so we can mock execSync for "npm install"
jest.mock("child_process", () => {
  let cp = jest.requireActual(
    "child_process"
  ) as typeof import("child_process");
  return {
    ...cp,
    execSync(command: string, options: Parameters<typeof cp.execSync>[1]) {
      // this prevents us from having to run the install process
      // and keeps our console output clean
      if (command.startsWith("npm install")) {
        return { stdout: "mocked", stderr: "mocked" };
      }
      return cp.execSync(command, options);
    },
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

describe("the create command", () => {
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

  // this also tests sub directories
  it("works for examples in the remix repo", async () => {
    let projectDir = await getProjectDir("example");
    await run([
      "create",
      projectDir,
      "--template",
      "examples/basic",
      "--no-install",
    ]);
    expect(output).toMatchInlineSnapshot(`
      "
      💿 That's it! \`cd\` into <TEMP_DIR>/example and check the README for development and deploy instructions!"
    `);
    expect(fse.existsSync(path.join(projectDir, "package.json"))).toBeTruthy();
    expect(fse.existsSync(path.join(projectDir, "app/root.tsx"))).toBeTruthy();
  });

  it("works for templates in the remix org", async () => {
    let projectDir = await getProjectDir("template");
    await run([
      "create",
      projectDir,
      "--template",
      "grunge-stack",
      "--no-install",
    ]);
    expect(output).toMatchInlineSnapshot(`
      "

      💿 You've opted out of installing dependencies so we won't run the remix.init/index.js script for you just yet. Once you've installed dependencies, you can run it manually with \`npx remix init\`

      💿 That's it! \`cd\` into <TEMP_DIR>/template and check the README for development and deploy instructions!"
    `);
    expect(fse.existsSync(path.join(projectDir, "package.json"))).toBeTruthy();
    expect(fse.existsSync(path.join(projectDir, "app/root.tsx"))).toBeTruthy();
  });

  it("works for GitHub username/repo combo", async () => {
    let projectDir = await getProjectDir("repo");
    await run([
      "create",
      projectDir,
      "--template",
      "remix-fake-tester-username/remix-fake-tester-repo",
      "--no-install",
    ]);
    expect(output).toMatchInlineSnapshot(`
      "

      💿 You've opted out of installing dependencies so we won't run the remix.init/index.js script for you just yet. Once you've installed dependencies, you can run it manually with \`npx remix init\`

      💿 That's it! \`cd\` into <TEMP_DIR>/repo and check the README for development and deploy instructions!"
    `);
    expect(fse.existsSync(path.join(projectDir, "package.json"))).toBeTruthy();
    expect(fse.existsSync(path.join(projectDir, "app/root.tsx"))).toBeTruthy();
  });

  it("works for remote tarballs", async () => {
    let projectDir = await getProjectDir("remote-tarball");
    await run([
      "create",
      projectDir,
      "--template",
      "https://example.com/remix-stack.tar.gz",
      "--no-install",
    ]);
    expect(output).toMatchInlineSnapshot(`
      "

      💿 You've opted out of installing dependencies so we won't run the remix.init/index.js script for you just yet. Once you've installed dependencies, you can run it manually with \`npx remix init\`

      💿 That's it! \`cd\` into <TEMP_DIR>/remote-tarball and check the README for development and deploy instructions!"
    `);
    expect(fse.existsSync(path.join(projectDir, "package.json"))).toBeTruthy();
    expect(fse.existsSync(path.join(projectDir, "app/root.tsx"))).toBeTruthy();
  });

  it("works for different branches", async () => {
    let projectDir = await getProjectDir("diff-branch");
    await run([
      "create",
      projectDir,
      "--template",
      "https://github.com/fake-remix-tester/nested-dir/tree/dev/stack",
      "--no-install",
    ]);
    expect(output).toMatchInlineSnapshot(`
      "

      💿 You've opted out of installing dependencies so we won't run the remix.init/index.js script for you just yet. Once you've installed dependencies, you can run it manually with \`npx remix init\`

      💿 That's it! \`cd\` into <TEMP_DIR>/diff-branch and check the README for development and deploy instructions!"
    `);
    expect(fse.existsSync(path.join(projectDir, "package.json"))).toBeTruthy();
    expect(fse.existsSync(path.join(projectDir, "app/root.tsx"))).toBeTruthy();
  });

  it("works for a path to a tarball on disk", async () => {
    let projectDir = await getProjectDir("local-tarball");
    await run([
      "create",
      projectDir,
      "--template",
      path.join(__dirname, "fixtures", "arc.tar.gz"),
      "--no-install",
    ]);
    expect(output).toMatchInlineSnapshot(`
      "
      💿 That's it! \`cd\` into <TEMP_DIR>/local-tarball and check the README for development and deploy instructions!"
    `);
    expect(fse.existsSync(path.join(projectDir, "package.json"))).toBeTruthy();
    expect(fse.existsSync(path.join(projectDir, "app/root.tsx"))).toBeTruthy();
  });

  it("works for a file URL to a tarball on disk", async () => {
    let projectDir = await getProjectDir("file-url-tarball");
    await run([
      "create",
      projectDir,
      "--template",
      pathToFileURL(path.join(__dirname, "fixtures", "arc.tar.gz")).toString(),
      "--no-install",
    ]);
    expect(output).toMatchInlineSnapshot(`
      "
      💿 That's it! \`cd\` into <TEMP_DIR>/file-url-tarball and check the README for development and deploy instructions!"
    `);
    expect(fse.existsSync(path.join(projectDir, "package.json"))).toBeTruthy();
    expect(fse.existsSync(path.join(projectDir, "app/root.tsx"))).toBeTruthy();
  });

  it("converts a template to javascript", async () => {
    let projectDir = await getProjectDir("template-to-js");
    await run([
      "create",
      projectDir,
      "--template",
      "blues-stack",
      "--no-install",
      "--no-typescript",
    ]);
    expect(output).toMatchInlineSnapshot(`
      "

      💿 You've opted out of installing dependencies so we won't run the remix.init/index.js script for you just yet. Once you've installed dependencies, you can run it manually with \`npx remix init\`

      💿 That's it! \`cd\` into <TEMP_DIR>/template-to-js and check the README for development and deploy instructions!"
    `);
    expect(fse.existsSync(path.join(projectDir, "package.json"))).toBeTruthy();
    expect(fse.existsSync(path.join(projectDir, "app/root.jsx"))).toBeTruthy();
    expect(fse.existsSync(path.join(projectDir, "app/root.tsx"))).toBeFalsy();
    expect(fse.existsSync(path.join(projectDir, "tsconfig.json"))).toBeFalsy();
    expect(fse.existsSync(path.join(projectDir, "jsconfig.json"))).toBeTruthy();
    expect(fse.existsSync(path.join(projectDir, "app/utils.js"))).toBeTruthy();
    let pkgJSON = JSON.parse(
      fse.readFileSync(path.join(projectDir, "package.json"), "utf-8")
    );
    expect(Object.keys(pkgJSON.devDependencies)).not.toContain("typescript");
    expect(Object.keys(pkgJSON.scripts)).not.toContain("typecheck");
  });

  it("works for a file path to a directory on disk", async () => {
    let projectDir = await getProjectDir("local-directory");
    await run([
      "create",
      projectDir,
      "--template",
      path.join(__dirname, "fixtures/stack"),
      "--no-install",
    ]);
    expect(output).toMatchInlineSnapshot(`
      "

      💿 You've opted out of installing dependencies so we won't run the remix.init/index.js script for you just yet. Once you've installed dependencies, you can run it manually with \`npx remix init\`

      💿 That's it! \`cd\` into <TEMP_DIR>/local-directory and check the README for development and deploy instructions!"
    `);
    expect(fse.existsSync(path.join(projectDir, "package.json"))).toBeTruthy();
    expect(fse.existsSync(path.join(projectDir, "app/root.tsx"))).toBeTruthy();
  });

  it("works for a file URL to a directory on disk", async () => {
    let projectDir = await getProjectDir("file-url-directory");
    await run([
      "create",
      projectDir,
      "--template",
      pathToFileURL(path.join(__dirname, "fixtures/stack")).toString(),
      "--no-install",
    ]);
    expect(output).toMatchInlineSnapshot(`
      "

      💿 You've opted out of installing dependencies so we won't run the remix.init/index.js script for you just yet. Once you've installed dependencies, you can run it manually with \`npx remix init\`

      💿 That's it! \`cd\` into <TEMP_DIR>/file-url-directory and check the README for development and deploy instructions!"
    `);
    expect(fse.existsSync(path.join(projectDir, "package.json"))).toBeTruthy();
    expect(fse.existsSync(path.join(projectDir, "app/root.tsx"))).toBeTruthy();
  });

  it("runs remix.init script when installing dependencies", async () => {
    let projectDir = await getProjectDir("remix-init-auto");
    await run([
      "create",
      projectDir,
      "--template",
      path.join(__dirname, "fixtures", "successful-remix-init.tar.gz"),
      "--install",
    ]);
    expect(output).toMatchInlineSnapshot(`
      "
      💿 Running remix.init script
      💿 That's it! \`cd\` into <TEMP_DIR>/remix-init-auto and check the README for development and deploy instructions!"
    `);
    expect(output).toContain(`💿 Running remix.init script`);
    expect(fse.existsSync(path.join(projectDir, "package.json"))).toBeTruthy();
    expect(fse.existsSync(path.join(projectDir, "app/root.tsx"))).toBeTruthy();
    expect(fse.existsSync(path.join(projectDir, "test.txt"))).toBeTruthy();
    expect(fse.existsSync(path.join(projectDir, "remix.init"))).toBeFalsy();
  });

  it("runs remix.init script when using `remix init`", async () => {
    let projectDir = await getProjectDir("remix-init-manual");
    await run([
      "create",
      projectDir,
      "--template",
      path.join(__dirname, "fixtures", "successful-remix-init.tar.gz"),
      "--no-install",
    ]);
    expect(output).toMatchInlineSnapshot(`
      "

      💿 You've opted out of installing dependencies so we won't run the remix.init/index.js script for you just yet. Once you've installed dependencies, you can run it manually with \`npx remix init\`

      💿 That's it! \`cd\` into <TEMP_DIR>/remix-init-manual and check the README for development and deploy instructions!"
    `);

    output = "";
    process.chdir(projectDir);
    await run(["init"]);

    expect(output).toBe("");
    expect(fse.existsSync(path.join(projectDir, "package.json"))).toBeTruthy();
    expect(fse.existsSync(path.join(projectDir, "app/root.tsx"))).toBeTruthy();
    expect(fse.existsSync(path.join(projectDir, "test.txt"))).toBeTruthy();
    // if you run `remix init` keep around the remix.init directory for future use
    expect(fse.existsSync(path.join(projectDir, "remix.init"))).toBeTruthy();
    // deps can take a bit to install
  });

  it("throws an error when invalid remix.init script when automatically ran", async () => {
    let projectDir = await getProjectDir("invalid-remix-init-manual");
    await expect(
      run([
        "create",
        projectDir,
        "--template",
        path.join(__dirname, "fixtures", "failing-remix-init.tar.gz"),
        "--install",
      ])
    ).rejects.toThrowError(`🚨 Oops, remix.init failed`);

    expect(fse.existsSync(path.join(projectDir, "package.json"))).toBeTruthy();
    expect(fse.existsSync(path.join(projectDir, "app/root.tsx"))).toBeTruthy();
    // we should keep remix.init around if the init script fails
    expect(fse.existsSync(path.join(projectDir, "remix.init"))).toBeTruthy();
    // deps can take a bit to install
  });

  it("throws an error when invalid remix.init script when manually ran", async () => {
    let projectDir = await getProjectDir("invalid-remix-init-manual");
    await run([
      "create",
      projectDir,
      "--template",
      path.join(__dirname, "fixtures", "failing-remix-init.tar.gz"),
      "--no-install",
    ]);

    expect(output).toMatchInlineSnapshot(`
      "

      💿 You've opted out of installing dependencies so we won't run the remix.init/index.js script for you just yet. Once you've installed dependencies, you can run it manually with \`npx remix init\`

      💿 That's it! \`cd\` into <TEMP_DIR>/invalid-remix-init-manual and check the README for development and deploy instructions!"
    `);

    process.chdir(projectDir);
    await expect(run(["init"])).rejects.toThrowError(
      `🚨 Oops, remix.init failed`
    );
    expect(fse.existsSync(path.join(projectDir, "package.json"))).toBeTruthy();
    expect(fse.existsSync(path.join(projectDir, "app/root.tsx"))).toBeTruthy();
    // we should keep remix.init around if the init script fails
    expect(fse.existsSync(path.join(projectDir, "remix.init"))).toBeTruthy();
    // deps can take a bit to install
  });
});

/*
eslint
  @typescript-eslint/consistent-type-imports: "off",
*/
