import { execSync } from "child_process";
import fse from "fs-extra";
import os from "os";
import path from "path";
import { pathToFileURL } from "url";
import stripAnsi from "strip-ansi";
import inquirer from "inquirer";

import { run } from "../cli/run";
import { server } from "./msw";

beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
afterAll(() => server.close());

const yarnUserAgent = "yarn/1.22.18 npm/? node/v14.17.0 linux x64";
const pnpmUserAgent = "pnpm/6.32.3 npm/? node/v14.17.0 linux x64";

// keep the console clear
jest.mock("ora", () => {
  return jest.fn(() => ({
    start: jest.fn(() => ({
      stop: jest.fn(),
      clear: jest.fn(),
    })),
  }));
});

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

// this is so we can verify the prompts for the users
jest.mock("inquirer", () => {
  let inquirerActual = jest.requireActual("inquirer");
  return {
    ...inquirerActual,
    prompt: jest.fn().mockImplementation(inquirerActual.prompt),
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

  // this also tests sub directories
  it("works for examples in the remix repo", async () => {
    let projectDir = await getProjectDir("example");
    await run([
      "create",
      projectDir,
      "--template",
      "examples/basic",
      "--no-install",
      "--typescript",
    ]);
    expect(output).toMatchInlineSnapshot(`
      "
      💿 That's it! \`cd\` into \\"<TEMP_DIR>/example\\" and check the README for development and deploy instructions!"
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
      "--typescript",
    ]);
    expect(output).toMatchInlineSnapshot(`
      "

      💿 You've opted out of installing dependencies so we won't run the remix.init/index.js script for you just yet. Once you've installed dependencies, you can run it manually with \`npx remix init\`

      💿 That's it! \`cd\` into \\"<TEMP_DIR>/template\\" and check the README for development and deploy instructions!"
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
      "--typescript",
    ]);
    expect(output).toMatchInlineSnapshot(`
      "

      💿 You've opted out of installing dependencies so we won't run the remix.init/index.js script for you just yet. Once you've installed dependencies, you can run it manually with \`npx remix init\`

      💿 That's it! \`cd\` into \\"<TEMP_DIR>/repo\\" and check the README for development and deploy instructions!"
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
      "--typescript",
    ]);
    expect(output).toMatchInlineSnapshot(`
      "

      💿 You've opted out of installing dependencies so we won't run the remix.init/index.js script for you just yet. Once you've installed dependencies, you can run it manually with \`npx remix init\`

      💿 That's it! \`cd\` into \\"<TEMP_DIR>/remote-tarball\\" and check the README for development and deploy instructions!"
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
      "--typescript",
    ]);
    expect(output).toMatchInlineSnapshot(`
      "

      💿 You've opted out of installing dependencies so we won't run the remix.init/index.js script for you just yet. Once you've installed dependencies, you can run it manually with \`npx remix init\`

      💿 That's it! \`cd\` into \\"<TEMP_DIR>/diff-branch\\" and check the README for development and deploy instructions!"
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
      "--typescript",
    ]);
    expect(output).toMatchInlineSnapshot(`
      "
      💿 That's it! \`cd\` into \\"<TEMP_DIR>/local-tarball\\" and check the README for development and deploy instructions!"
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
      "--typescript",
    ]);
    expect(output).toMatchInlineSnapshot(`
      "
      💿 That's it! \`cd\` into \\"<TEMP_DIR>/file-url-tarball\\" and check the README for development and deploy instructions!"
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

      💿 That's it! \`cd\` into \\"<TEMP_DIR>/template-to-js\\" and check the README for development and deploy instructions!"
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
  });

  it("works for a file path to a directory on disk", async () => {
    let projectDir = await getProjectDir("local-directory");
    await run([
      "create",
      projectDir,
      "--template",
      path.join(__dirname, "fixtures/stack"),
      "--no-install",
      "--typescript",
    ]);
    expect(output).toMatchInlineSnapshot(`
      "

      💿 You've opted out of installing dependencies so we won't run the remix.init/index.js script for you just yet. Once you've installed dependencies, you can run it manually with \`npx remix init\`

      💿 That's it! \`cd\` into \\"<TEMP_DIR>/local-directory\\" and check the README for development and deploy instructions!"
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
      "--typescript",
    ]);
    expect(output).toMatchInlineSnapshot(`
      "

      💿 You've opted out of installing dependencies so we won't run the remix.init/index.js script for you just yet. Once you've installed dependencies, you can run it manually with \`npx remix init\`

      💿 That's it! \`cd\` into \\"<TEMP_DIR>/file-url-directory\\" and check the README for development and deploy instructions!"
    `);
    expect(fse.existsSync(path.join(projectDir, "package.json"))).toBeTruthy();
    expect(fse.existsSync(path.join(projectDir, "app/root.tsx"))).toBeTruthy();
  });

  it("prioritizes built-in templates when validating input", async () => {
    let projectDir = await getProjectDir("built-in-template");

    // create a local directory in our cwd with the same name as our chosen
    // template and give it a package.json so we can check it against the one in
    // our template
    let dupedDir = path.join(process.cwd(), "express");
    await fse.mkdir(dupedDir);
    await fse.writeFile(
      path.join(dupedDir, "package.json"),
      '{ "name": "dummy" }'
    );

    await run([
      "create",
      projectDir,
      "--template",
      "express",
      "--install",
      "--typescript",
    ]);

    expect(fse.existsSync(path.join(projectDir, "package.json"))).toBeTruthy();
    let pkgJSON = JSON.parse(
      fse.readFileSync(path.join(projectDir, "package.json"), "utf-8")
    );
    expect(pkgJSON.name).not.toBe("dummy");
  });

  it("runs remix.init script when installing dependencies", async () => {
    let projectDir = await getProjectDir("remix-init-auto");
    await run([
      "create",
      projectDir,
      "--template",
      path.join(__dirname, "fixtures", "successful-remix-init.tar.gz"),
      "--install",
      "--typescript",
    ]);
    expect(output).toMatchInlineSnapshot(`
      "
      💿 Running remix.init script
      💿 That's it! \`cd\` into \\"<TEMP_DIR>/remix-init-auto\\" and check the README for development and deploy instructions!"
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
      "--typescript",
    ]);
    expect(output).toMatchInlineSnapshot(`
      "

      💿 You've opted out of installing dependencies so we won't run the remix.init/index.js script for you just yet. Once you've installed dependencies, you can run it manually with \`npx remix init\`

      💿 That's it! \`cd\` into \\"<TEMP_DIR>/remix-init-manual\\" and check the README for development and deploy instructions!"
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
        "--typescript",
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
      "--typescript",
    ]);

    expect(output).toMatchInlineSnapshot(`
      "

      💿 You've opted out of installing dependencies so we won't run the remix.init/index.js script for you just yet. Once you've installed dependencies, you can run it manually with \`npx remix init\`

      💿 That's it! \`cd\` into \\"<TEMP_DIR>/invalid-remix-init-manual\\" and check the README for development and deploy instructions!"
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

  it("recognizes when Yarn was used to run the command", async () => {
    let originalUserAgent = process.env.npm_user_agent;
    process.env.npm_user_agent = yarnUserAgent;

    let projectDir = await getProjectDir("yarn-create");
    await run([
      "create",
      projectDir,
      "--template",
      path.join(__dirname, "fixtures", "successful-remix-init.tar.gz"),
      "--install",
      "--typescript",
    ]);

    expect(execSync).toBeCalledWith("yarn install", expect.anything());
    process.env.npm_user_agent = originalUserAgent;
  });

  it("recognizes when pnpm was used to run the command", async () => {
    let originalUserAgent = process.env.npm_user_agent;
    process.env.npm_user_agent = pnpmUserAgent;

    let projectDir = await getProjectDir("pnpm-create");
    await run([
      "create",
      projectDir,
      "--template",
      path.join(__dirname, "fixtures", "successful-remix-init.tar.gz"),
      "--install",
      "--typescript",
    ]);

    expect(execSync).toBeCalledWith("pnpm install", expect.anything());
    process.env.npm_user_agent = originalUserAgent;
  });

  it("prompts to run the install command for the preferred package manager", async () => {
    let originalUserAgent = process.env.npm_user_agent;
    process.env.npm_user_agent = pnpmUserAgent;

    let projectDir = await getProjectDir("pnpm-prompt-install");
    let mockPrompt = jest.mocked(inquirer.prompt);
    mockPrompt.mockImplementationOnce(() => {
      return Promise.resolve({
        install: false,
      }) as unknown as ReturnType<typeof inquirer.prompt>;
    });

    await run([
      "create",
      projectDir,
      "--template",
      "grunge-stack",
      "--typescript",
    ]);

    let lastCallArgs = mockPrompt.mock.calls.at(-1)[0];
    expect((lastCallArgs as Array<unknown>).at(-1)).toHaveProperty(
      "message",
      "Do you want me to run `pnpm install`?"
    );
    process.env.npm_user_agent = originalUserAgent;
  });

  it("suggests to run the init command with the preferred package manager", async () => {
    let originalUserAgent = process.env.npm_user_agent;
    process.env.npm_user_agent = pnpmUserAgent;

    let projectDir = await getProjectDir("pnpm-suggest-install");
    let mockPrompt = jest.mocked(inquirer.prompt);
    mockPrompt.mockImplementationOnce(() => {
      return Promise.resolve({
        install: false,
      }) as unknown as ReturnType<typeof inquirer.prompt>;
    });

    await run([
      "create",
      projectDir,
      "--template",
      "grunge-stack",
      "--no-install",
      "--typescript",
    ]);

    expect(output).toContain(
      "💿 You've opted out of installing dependencies so we won't run the remix.init/index.js script for you just yet. Once you've installed dependencies, you can run it manually with `pnpm exec remix init`"
    );
    process.env.npm_user_agent = originalUserAgent;
  });
});

/*
eslint
  @typescript-eslint/consistent-type-imports: "off",
*/
