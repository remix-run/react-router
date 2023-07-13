import childProcess from "child_process";
import os from "os";
import path from "path";
import util from "util";
import fse from "fs-extra";
import semver from "semver";

import { jestTimeout } from "./setupAfterEnv";

let DOWN = "\x1B\x5B\x42";
let ENTER = "\x0D";

let execFile = util.promisify(childProcess.execFile);

const TEMP_DIR = path.join(
  fse.realpathSync(os.tmpdir()),
  `remix-tests-${Math.random().toString(32).slice(2)}`
);

jest.setTimeout(30_000);
beforeAll(async () => {
  await fse.remove(TEMP_DIR);
  await fse.ensureDir(TEMP_DIR);
});

afterAll(async () => {
  await fse.remove(TEMP_DIR);
});

async function execRemix(
  args: Array<string>,
  options: Exclude<Parameters<typeof execFile>[2], null | undefined> = {}
) {
  if (process.platform === "win32") {
    let cp = childProcess.spawnSync(
      "node",
      [
        "--require",
        require.resolve("esbuild-register"),
        "--require",
        path.join(__dirname, "./msw.ts"),
        path.resolve(__dirname, "../cli.ts"),
        ...args,
      ],
      {
        cwd: TEMP_DIR,
        ...options,
        env: {
          ...process.env,
          NO_COLOR: "1",
          ...options.env,
        },
      }
    );

    return {
      stdout: cp.stdout?.toString("utf-8"),
    };
  } else {
    let result = await execFile(
      "node",
      [
        "--require",
        require.resolve("esbuild-register"),
        "--require",
        path.join(__dirname, "./msw.ts"),
        path.resolve(__dirname, "../cli.ts"),
        ...args,
      ],
      {
        cwd: TEMP_DIR,
        ...options,
        env: {
          ...process.env,
          NO_COLOR: "1",
          ...options.env,
        },
      }
    );
    return {
      ...result,
      stdout: result.stdout.replace(TEMP_DIR, "<TEMP_DIR>").trim(),
    };
  }
}

describe("remix CLI", () => {
  describe("the --help flag", () => {
    it("prints help info", async () => {
      let { stdout } = await execRemix(["--help"]);
      expect(stdout.trim()).toMatchInlineSnapshot(`
        "R E M I X

          Usage:
            $ remix create <projectDir> --template <template>
            $ remix init [projectDir]
            $ remix build [projectDir]
            $ remix dev [projectDir]
            $ remix routes [projectDir]
            $ remix watch [projectDir]
            $ remix setup [remixPlatform]
            $ remix codemod <codemod> [projectDir]

          Options:
            --help, -h          Print this help message and exit
            --version, -v       Print the CLI version and exit
            --no-color          Disable ANSI colors in console output
          \`create\` Options:
            --template          The template to use
            --no-install        Skip installing dependencies after creation
            --no-typescript     Convert the template to JavaScript
            --remix-version     The version of Remix to use
          \`build\` Options:
            --sourcemap         Generate source maps for production
          \`dev\` Options:
            --debug             Attach Node.js inspector
            --port, -p          Choose the port from which to run your app

            [v2_dev]
            --command, -c       Command used to run your app server
            --manual            Enable manual mode
            --port              Port for the dev server. Default: any open port
            --tls-key           Path to TLS key (key.pem)
            --tls-cert          Path to TLS certificate (cert.pem)
          \`init\` Options:
            --no-delete         Skip deleting the \`remix.init\` script
          \`routes\` Options:
            --json              Print the routes as JSON
          \`codemod\` Options:
            --dry               Dry run (no changes are made to files)
            --force             Bypass Git safety checks

          Values:
            - projectDir        The Remix project directory
            - template          The project template to use
            - remixPlatform     \`node\` or \`cloudflare\`

          Creating a new project:

            Remix projects are created from templates. A template can be:

            - a file path to a directory of files
            - a file path to a tarball
            - the name of a :username/:repo on GitHub
            - the URL of a tarball

            $ remix create my-app --template /path/to/remix-template
            $ remix create my-app --template /path/to/remix-template.tar.gz
            $ remix create my-app --template remix-run/grunge-stack
            $ remix create my-app --template :username/:repo
            $ remix create my-app --template https://github.com/:username/:repo
            $ remix create my-app --template https://github.com/:username/:repo/tree/:branch
            $ remix create my-app --template https://github.com/:username/:repo/archive/refs/tags/:tag.tar.gz
            $ remix create my-app --template https://example.com/remix-template.tar.gz

            To create a new project from a template in a private GitHub repo,
            pass the \`token\` flag with a personal access token with access to that repo.

          Initialize a project::

            Remix project templates may contain a \`remix.init\` directory
            with a script that initializes the project. This script automatically
            runs during \`remix create\`, but if you ever need to run it manually
            (e.g. to test it out) you can:

            $ remix init

          Build your project:

            $ remix build
            $ remix build --sourcemap
            $ remix build my-app

          Run your project locally in development:

            $ remix dev
            $ remix dev my-app
            $ remix dev --debug

          Start your server separately and watch for changes:

            # custom server start command, for example:
            $ remix watch

            # in a separate tab:
            $ node --inspect --require ./node_modules/dotenv/config --require ./mocks ./build/server.js

          Show all routes in your app:

            $ remix routes
            $ remix routes my-app
            $ remix routes --json

          Reveal the used entry point:

            $ remix reveal entry.client
            $ remix reveal entry.server
            $ remix reveal entry.client --no-typescript
            $ remix reveal entry.server --no-typescript"
      `);
    });
  });

  describe("the --version flag", () => {
    it("prints the current version", async () => {
      let { stdout } = await execRemix(["--version"]);
      expect(!!semver.valid(stdout.trim())).toBe(true);
    });
  });

  describe("create prompts", () => {
    it("allows you to go through the prompts", async () => {
      let projectDir = path.join(TEMP_DIR, "my-app");

      let proc = childProcess.spawn(
        "node",
        [
          "--require",
          require.resolve("esbuild-register"),
          "--require",
          path.join(__dirname, "./msw.ts"),
          path.resolve(__dirname, "../cli.ts"),
          "create",
        ],
        { stdio: [null, null, null] }
      );

      await interactWithShell(proc, [
        { question: /Where.*create.*app/i, type: [projectDir, ENTER] },
        { question: /What type of app/i, answer: /basics/i },
        { question: /Where.*deploy/i, answer: /remix/i },
        { question: /typescript or javascript/i, answer: /typescript/i },
        { question: /install/i, type: ["n", ENTER] },
      ]);
    });

    it("allows you to go through the prompts and convert to JS", async () => {
      let projectDir = path.join(TEMP_DIR, "my-js-app");

      let proc = childProcess.spawn(
        "node",
        [
          "--require",
          require.resolve("esbuild-register"),
          "--require",
          path.join(__dirname, "./msw.ts"),
          path.resolve(__dirname, "../cli.ts"),
          "create",
        ],
        { stdio: [null, null, null] }
      );

      await interactWithShell(proc, [
        { question: /Where.*create.*app/i, type: [projectDir, ENTER] },
        { question: /What type of app/i, answer: /basics/i },
        { question: /Where.*deploy/i, answer: /remix/i },
        { question: /typescript or javascript/i, answer: /javascript/i },
        { question: /install/i, type: ["n", ENTER] },
      ]);

      expect(fse.existsSync(path.join(projectDir, "app/root.tsx"))).toBeFalsy();
      expect(
        fse.existsSync(path.join(projectDir, "app/root.jsx"))
      ).toBeTruthy();
    });
  });
});

function defer() {
  let resolve: (value: unknown) => void, reject: (reason?: any) => void;
  let state: { current: "pending" | "resolved" | "rejected" } = {
    current: "pending",
  };
  let promise = new Promise((res, rej) => {
    resolve = (value: unknown) => {
      state.current = "resolved";
      return res(value);
    };
    reject = (reason?: any) => {
      state.current = "rejected";
      return rej(reason);
    };
  });
  return { promise, resolve: resolve!, reject: reject!, state };
}

async function interactWithShell(
  proc: childProcess.ChildProcessWithoutNullStreams,
  qAndA: Array<
    | { question: RegExp; type: Array<string>; answer?: never }
    | { question: RegExp; answer: RegExp; type?: never }
  >
) {
  proc.stdin.setDefaultEncoding("utf-8");

  let deferred = defer();

  let stepNumber = 0;

  let stdout = "";
  let stderr = "";
  proc.stdout.on("data", (chunk: unknown) => {
    if (chunk instanceof Buffer) {
      chunk = String(chunk);
    }
    if (typeof chunk !== "string") {
      console.error({ stdoutChunk: chunk });
      throw new Error("stdout chunk is not a string");
    }
    stdout += chunk;
    let step = qAndA[stepNumber];
    if (!step) return;
    let { question, answer, type } = step;
    if (question.test(chunk)) {
      if (answer) {
        let currentSelection = chunk
          .split("\n")
          .slice(1)
          .find((l) => l.includes("❯") || l.includes(">"));

        if (currentSelection && answer.test(currentSelection)) {
          proc.stdin.write(ENTER);
          stepNumber += 1;
        } else {
          proc.stdin.write(DOWN);
        }
      } else if (type) {
        for (let command of type) {
          proc.stdin.write(command);
        }
        stepNumber += 1;
      }
    }

    if (stepNumber === qAndA.length) {
      proc.stdin.end();
    }
  });

  proc.stderr.on("data", (chunk: unknown) => {
    if (chunk instanceof Buffer) {
      chunk = String(chunk);
    }
    if (typeof chunk !== "string") {
      console.error({ stderrChunk: chunk });
      throw new Error("stderr chunk is not a string");
    }
    stderr += chunk;
  });

  proc.on("close", (status) => {
    if (status === 0) return deferred.resolve(status);
    else return deferred.reject({ stdout, stderr });
  });

  // this ensures that if we do timeout we at least get as much useful
  // output as possible.
  let timeout = setTimeout(() => {
    if (deferred.state.current === "pending") {
      proc.kill();
      deferred.reject({ status: "timeout", stdout, stderr });
    }
  }, jestTimeout);

  await deferred.promise;
  clearTimeout(timeout);
}
