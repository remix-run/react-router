import childProcess from "child_process";
import fse from "fs-extra";
import os from "os";
import path from "path";
import util from "util";
import semver from "semver";

let DOWN = "\x1B\x5B\x42";
let ENTER = "\x0D";

let execFile =
  process.platform === "win32"
    ? util.promisify(childProcess.exec)
    : util.promisify(childProcess.execFile);

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

async function execRemix(
  args: Array<string>,
  options: Parameters<typeof execFile>[2] = {}
) {
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
            $ remix setup [remixPlatform]
            $ remix migrate [-m migration] [projectDir]

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
          \`routes\` Options:
            --json              Print the routes as JSON
          \`migrate\` Options:
            --dry               Dry run (no changes are made to files)
            --force             Bypass Git safety checks and forcibly run migration
            --migration, -m     Name of the migration to run

          Values:
            - projectDir        The Remix project directory
            - template          The project template to use
            - remixPlatform     \`node\` or \`cloudflare\`
            - migration         One of the choices from https://github.com/remix-run/remix/tree/main/packages/remix-dev/cli/migrate/migration-options

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
            set the \`GITHUB_TOKEN\` environment variable to a personal access
            token with access to that repo.

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

          Show all routes in your app:

            $ remix routes
            $ remix routes my-app
            $ remix routes --json"
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
        { question: /Where.*deploy/i, answer: /express/i },
        { question: /install/i, type: ["n", ENTER] },
        { question: /typescript or javascript/i, answer: /typescript/i },
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
        { question: /Where.*deploy/i, answer: /express/i },
        { question: /install/i, type: ["n", ENTER] },
        { question: /typescript or javascript/i, answer: /javascript/i },
      ]);

      expect(
        fse.existsSync(path.join(projectDir, "package.json"))
      ).toBeTruthy();
      expect(
        fse.existsSync(path.join(projectDir, "app/root.jsx"))
      ).toBeTruthy();
      expect(fse.existsSync(path.join(projectDir, "app/root.tsx"))).toBeFalsy();
      expect(
        fse.existsSync(path.join(projectDir, "tsconfig.json"))
      ).toBeFalsy();
      expect(
        fse.existsSync(path.join(projectDir, "jsconfig.json"))
      ).toBeTruthy();
      let pkgJSON = JSON.parse(
        fse.readFileSync(path.join(projectDir, "package.json"), "utf-8")
      );
      expect(Object.keys(pkgJSON.devDependencies)).not.toContain("typescript");
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
  return { promise, resolve, reject, state };
}

async function interactWithShell(
  proc: childProcess.ChildProcessWithoutNullStreams,
  qAndA: Array<
    | { question: RegExp; type: Array<String>; answer?: never }
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
          .find((l) => l.includes("❯"));

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
      deferred.reject({ status: "timeout", stdout, stderr });
    }
  }, 6_000);

  await deferred.promise;
  clearTimeout(timeout);
}
