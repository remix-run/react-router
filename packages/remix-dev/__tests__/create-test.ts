import { execSync } from "child_process";
import * as os from "os";
import * as path from "path";
import { pathToFileURL } from "url";
import * as fse from "fs-extra";
import inquirer from "inquirer";
import stripAnsi from "strip-ansi";

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
  it("works for examples in the examples repo", async () => {
    let projectDir = await getProjectDir("example");
    await run([
      "create",
      projectDir,
      "--template",
      "examples/basic",
      "--no-install",
      "--typescript",
    ]);
    expect(output.trim()).toBe(
      getSuccessMessage(path.join("<TEMP_DIR>", "example"))
    );
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

    expect(output.trim()).toBe(
      getOptOutOfInstallMessage() +
        "\n\n" +
        getSuccessMessage(path.join("<TEMP_DIR>", "template"))
    );

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
    expect(output.trim()).toBe(
      getOptOutOfInstallMessage() +
        "\n\n" +
        getSuccessMessage(path.join("<TEMP_DIR>", "repo"))
    );
    expect(fse.existsSync(path.join(projectDir, "package.json"))).toBeTruthy();
    expect(fse.existsSync(path.join(projectDir, "app/root.tsx"))).toBeTruthy();
  });

  it("fails for private GitHub username/repo combo without a token", async () => {
    let projectDir = await getProjectDir("repo");
    await expect(() =>
      run([
        "create",
        projectDir,
        "--template",
        "private-org/private-repo",
        "--no-install",
        "--typescript",
      ])
    ).rejects.toMatchInlineSnapshot(
      `[Error: 🚨 The template could not be verified. Please double check that the template is a valid GitHub repository and try again.]`
    );
  });

  it("succeeds for private GitHub username/repo combo with a valid token", async () => {
    let projectDir = await getProjectDir("repo");
    await run([
      "create",
      projectDir,
      "--template",
      "private-org/private-repo",
      "--no-install",
      "--typescript",
      "--token",
      "valid-token",
    ]);
    expect(output.trim()).toBe(
      getOptOutOfInstallMessage() +
        "\n\n" +
        getSuccessMessage(path.join("<TEMP_DIR>", "repo"))
    );
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
    expect(output.trim()).toBe(
      getOptOutOfInstallMessage() +
        "\n\n" +
        getSuccessMessage(path.join("<TEMP_DIR>", "remote-tarball"))
    );
    expect(fse.existsSync(path.join(projectDir, "package.json"))).toBeTruthy();
    expect(fse.existsSync(path.join(projectDir, "app/root.tsx"))).toBeTruthy();
  });

  it("fails for private github release tarballs", async () => {
    let projectDir = await getProjectDir("private-release-tarball");
    await expect(() =>
      run([
        "create",
        projectDir,
        "--template",
        "https://github.com/private-org/private-repo/releases/download/v0.0.1/stack.tar.gz",
        "--no-install",
        "--typescript",
      ])
    ).rejects.toMatchInlineSnapshot(
      `[Error: 🚨 The template file could not be verified. Please double check the URL and try again.]`
    );
  });

  it("succeeds for private github release tarballs when including token", async () => {
    let projectDir = await getProjectDir("private-release-tarball-with-token");
    await run([
      "create",
      projectDir,
      "--template",
      "https://github.com/private-org/private-repo/releases/download/v0.0.1/stack.tar.gz",
      "--no-install",
      "--typescript",
      "--token",
      "valid-token",
    ]);
    expect(output.trim()).toBe(
      getOptOutOfInstallMessage() +
        "\n\n" +
        getSuccessMessage(
          path.join("<TEMP_DIR>", "private-release-tarball-with-token")
        )
    );
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
    expect(output.trim()).toBe(
      getOptOutOfInstallMessage() +
        "\n\n" +
        getSuccessMessage(path.join("<TEMP_DIR>", "diff-branch"))
    );
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
    expect(output.trim()).toBe(
      getSuccessMessage(path.join("<TEMP_DIR>", "local-tarball"))
    );
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
    expect(output.trim()).toBe(
      getSuccessMessage(path.join("<TEMP_DIR>", "file-url-tarball"))
    );
    expect(fse.existsSync(path.join(projectDir, "package.json"))).toBeTruthy();
    expect(fse.existsSync(path.join(projectDir, "app/root.tsx"))).toBeTruthy();
  });

  it("converts a template to JavaScript", async () => {
    let projectDir = await getProjectDir("template-to-js");
    await run([
      "create",
      projectDir,
      "--template",
      "blues-stack",
      "--no-install",
      "--no-typescript",
    ]);
    expect(output.trim()).toContain(
      getOptOutOfInstallMessage() +
        "\n\n" +
        getSuccessMessage(path.join("<TEMP_DIR>", "template-to-js"))
    );
    expect(fse.existsSync(path.join(projectDir, "app/root.tsx"))).toBeFalsy();
    expect(fse.existsSync(path.join(projectDir, "app/root.jsx"))).toBeTruthy();
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
    expect(output.trim()).toBe(
      getOptOutOfInstallMessage() +
        "\n\n" +
        getSuccessMessage(path.join("<TEMP_DIR>", "local-directory"))
    );

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
    expect(output.trim()).toBe(
      getOptOutOfInstallMessage() +
        "\n\n" +
        getSuccessMessage(path.join("<TEMP_DIR>", "file-url-directory"))
    );
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
    expect(output.trim()).toBe(
      "💿 Running remix.init script\n" +
        getSuccessMessage(path.join("<TEMP_DIR>", "remix-init-auto"))
    );
    expect(output).toContain(`💿 Running remix.init script`);
    expect(fse.existsSync(path.join(projectDir, "package.json"))).toBeTruthy();
    expect(fse.existsSync(path.join(projectDir, "app/root.tsx"))).toBeTruthy();
    expect(fse.existsSync(path.join(projectDir, "test.txt"))).toBeTruthy();
    expect(fse.existsSync(path.join(projectDir, "remix.init"))).toBeFalsy();
  });

  it("runs remix.init script when using index.ts", async () => {
    let projectDir = await getProjectDir("remix-init-ts");
    await run([
      "create",
      projectDir,
      "--template",
      path.join(__dirname, "fixtures", "stack-init-ts.tar.gz"),
      "--install",
      "--typescript",
    ]);
    expect(output).toContain(
      `Running init script on ${projectDir.replace(TEMP_DIR, "<TEMP_DIR>")}`
    );
    expect(fse.existsSync(path.join(projectDir, "package.json"))).toBeTruthy();
    expect(fse.existsSync(path.join(projectDir, "app/root.tsx"))).toBeTruthy();
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
    expect(output.trim()).toBe(
      getOptOutOfInstallMessage() +
        "\n\n" +
        getSuccessMessage(path.join("<TEMP_DIR>", "remix-init-manual"))
    );

    output = "";
    process.chdir(projectDir);
    await run(["init"]);

    expect(output).toBe("");
    expect(fse.existsSync(path.join(projectDir, "package.json"))).toBeTruthy();
    expect(fse.existsSync(path.join(projectDir, "app/root.tsx"))).toBeTruthy();
    expect(fse.existsSync(path.join(projectDir, "test.txt"))).toBeTruthy();
    expect(fse.existsSync(path.join(projectDir, "remix.init"))).toBeFalsy();
  });

  it("It keeps the `remix.init` script when using the `--no-delete` flag", async () => {
    let projectDir = await getProjectDir("remix-init-manual");
    await run([
      "create",
      projectDir,
      "--template",
      path.join(__dirname, "fixtures", "successful-remix-init.tar.gz"),
      "--no-install",
      "--typescript",
    ]);
    expect(output.trim()).toBe(
      getOptOutOfInstallMessage() +
        "\n\n" +
        getSuccessMessage(path.join("<TEMP_DIR>", "remix-init-manual"))
    );

    output = "";
    process.chdir(projectDir);
    await run(["init", "--no-delete"]);

    expect(output).toBe("");
    expect(fse.existsSync(path.join(projectDir, "remix.init"))).toBeTruthy();
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
    expect(output.trim()).toBe(
      getOptOutOfInstallMessage() +
        "\n\n" +
        getSuccessMessage(path.join("<TEMP_DIR>", "invalid-remix-init-manual"))
    );

    process.chdir(projectDir);
    await expect(run(["init"])).rejects.toThrowError(
      `🚨 Oops, remix.init failed`
    );
    expect(fse.existsSync(path.join(projectDir, "package.json"))).toBeTruthy();
    expect(fse.existsSync(path.join(projectDir, "app/root.tsx"))).toBeTruthy();
    // we should keep remix.init around if the init script fails
    expect(fse.existsSync(path.join(projectDir, "remix.init"))).toBeTruthy();
  });

  it("recognizes when Yarn was used to run the command", async () => {
    let originalUserAgent = process.env.npm_config_user_agent;
    process.env.npm_config_user_agent = yarnUserAgent;

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
    process.env.npm_config_user_agent = originalUserAgent;
  });

  it("recognizes when pnpm was used to run the command", async () => {
    let originalUserAgent = process.env.npm_config_user_agent;
    process.env.npm_config_user_agent = pnpmUserAgent;

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
    process.env.npm_config_user_agent = originalUserAgent;
  });

  it("prompts to run the install command for the preferred package manager", async () => {
    let originalUserAgent = process.env.npm_config_user_agent;
    process.env.npm_config_user_agent = pnpmUserAgent;

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

    let mockPromptCalls = mockPrompt.mock.calls;
    let lastCallArgs = mockPromptCalls[mockPromptCalls.length - 1][0];
    let lastCallUnknown = lastCallArgs as Array<unknown>;
    expect(lastCallUnknown[lastCallUnknown.length - 1]).toHaveProperty(
      "message",
      "Do you want me to run `pnpm install`?"
    );
    process.env.npm_config_user_agent = originalUserAgent;
  });

  it("suggests to run the init command with the preferred package manager", async () => {
    let originalUserAgent = process.env.npm_config_user_agent;
    process.env.npm_config_user_agent = pnpmUserAgent;

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

    expect(output).toContain(getOptOutOfInstallMessage("pnpm exec remix init"));
    process.env.npm_config_user_agent = originalUserAgent;
  });

  describe("errors", () => {
    it("identifies when a github repo is not accessible (403)", async () => {
      let projectDir = await getProjectDir("repo");
      await expect(async () => {
        try {
          let res = await run([
            "create",
            projectDir,
            "--template",
            "error-username/403",
            "--no-install",
            "--typescript",
          ]);
          return res;
        } catch (error: unknown) {
          throw error;
        }
      }).rejects.toMatchInlineSnapshot(
        `[Error: 🚨 The template could not be verified because you do not have access to the repository. Please double check the access rights of this repo and try again.]`
      );
    });

    it("identifies when a github repo does not exist (404)", async () => {
      let projectDir = await getProjectDir("repo");
      await expect(() =>
        run([
          "create",
          projectDir,
          "--template",
          "error-username/404",
          "--no-install",
          "--typescript",
        ])
      ).rejects.toMatchInlineSnapshot(
        `[Error: 🚨 The template could not be verified. Please double check that the template is a valid GitHub repository and try again.]`
      );
    });

    it("identifies when something unknown goes wrong with the repo request (4xx)", async () => {
      let projectDir = await getProjectDir("repo");
      await expect(() =>
        run([
          "create",
          projectDir,
          "--template",
          "error-username/400",
          "--no-install",
          "--typescript",
        ])
      ).rejects.toMatchInlineSnapshot(
        `[Error: 🚨 The template could not be verified. The server returned a response with a 400 status. Please double check that the template is a valid GitHub repository and try again.]`
      );
    });

    it("identifies when a remote tarball does not exist (404)", async () => {
      let projectDir = await getProjectDir("remote-tarball");
      await expect(() =>
        run([
          "create",
          projectDir,
          "--template",
          "https://example.com/error/404/remix-stack.tar.gz",
          "--no-install",
          "--typescript",
        ])
      ).rejects.toMatchInlineSnapshot(
        `[Error: 🚨 The template file could not be verified. Please double check the URL and try again.]`
      );
    });

    it("identifies when a remote tarball does not exist (4xx)", async () => {
      let projectDir = await getProjectDir("remote-tarball");
      await expect(() =>
        run([
          "create",
          projectDir,
          "--template",
          "https://example.com/error/400/remix-stack.tar.gz",
          "--no-install",
          "--typescript",
        ])
      ).rejects.toMatchInlineSnapshot(
        `[Error: 🚨 The template file could not be verified. The server returned a response with a 400 status. Please double check the URL and try again.]`
      );
    });

    it("allows creating an app in a dir if it's empty", async () => {
      let projectDir = await getProjectDir("other-empty-dir");
      await run([
        "create",
        projectDir,
        "--template",
        "grunge-stack",
        "--no-install",
        "--typescript",
      ]);

      expect(
        fse.existsSync(path.join(projectDir, "package.json"))
      ).toBeTruthy();
    });

    it("doesn't allow creating an app in a dir if it's not empty", async () => {
      let projectDir = await getProjectDir("not-empty-dir");
      fse.mkdirSync(projectDir);
      fse.createFileSync(path.join(projectDir, "some-file.txt"));
      await expect(() =>
        run([
          "create",
          projectDir,
          "--template",
          "grunge-stack",
          "--no-install",
          "--typescript",
        ])
      ).rejects.toMatchInlineSnapshot(
        `[Error: 🚨 The project directory must be empty to create a new project. Please clear the contents of the directory or choose a different path.]`
      );
    });

    it("allows creating an app in the current dir if it's empty", async () => {
      let projectDir = await getProjectDir("empty-dir");
      let cwd = process.cwd();
      fse.mkdirSync(projectDir);
      process.chdir(projectDir);
      await run([
        "create",
        ".",
        "--template",
        "grunge-stack",
        "--no-install",
        "--typescript",
      ]);
      process.chdir(cwd);

      expect(
        fse.existsSync(path.join(projectDir, "package.json"))
      ).toBeTruthy();
    });

    it("doesn't allow creating an app in the current dir if it's not empty", async () => {
      let projectDir = await getProjectDir("not-empty-dir");
      let cwd = process.cwd();
      fse.mkdirSync(projectDir);
      fse.createFileSync(path.join(projectDir, "some-file.txt"));
      process.chdir(projectDir);
      await expect(() =>
        run([
          "create",
          ".",
          "--template",
          "grunge-stack",
          "--no-install",
          "--typescript",
        ])
      ).rejects.toMatchInlineSnapshot(
        `[Error: 🚨 The project directory must be empty to create a new project. Please clear the contents of the directory or choose a different path.]`
      );
      process.chdir(cwd);
    });
  });

  describe("supports proxy usage", () => {
    beforeAll(() => {
      server.close();
    });
    afterAll(() => {
      server.listen({ onUnhandledRequest: "error" });
    });
    it("uses the proxy from env var", async () => {
      let projectDir = await getProjectDir("template");
      let error: Error | undefined;
      let prevProxy = process.env.HTTPS_PROXY;
      try {
        process.env.HTTPS_PROXY = "http://127.0.0.1:33128";
        await run([
          "create",
          projectDir,
          "--template",
          "grunge-stack",
          "--no-install",
          "--typescript",
        ]);
      } catch (err) {
        error = err;
      } finally {
        process.env.HTTPS_PROXY = prevProxy;
      }
      expect(error?.message).toMatch("127.0.0.1:33");
    });
  });
});

function getSuccessMessage(projectDirectory: string) {
  return `💿 That's it! \`cd\` into "${projectDirectory}" and check the README for development and deploy instructions!`;
}

const getOptOutOfInstallMessage = (command = "yarn remix init") =>
  "💿 You've opted out of installing dependencies so we won't run the " +
  path.join("remix.init", "index.js") +
  " script for you just yet. Once you've installed dependencies, you can run " +
  `it manually with \`${command}\``;

/*
eslint
  @typescript-eslint/consistent-type-imports: "off",
*/
