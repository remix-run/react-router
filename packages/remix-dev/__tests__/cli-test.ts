import childProcess from "child_process";
import fse from "fs-extra";
import path from "path";
import util from "util";
import { pathToFileURL } from "url";
import semver from "semver";

const execFile =
  process.platform === "win32"
    ? util.promisify(childProcess.exec)
    : util.promisify(childProcess.execFile);

const remix = path.resolve(
  __dirname,
  "../../../build/node_modules/@remix-run/dev/cli.js"
);

const TEMP_DIR = path.join(process.cwd(), ".tmp", "create-remix");

describe("remix cli", () => {
  beforeAll(() => {
    if (!fse.existsSync(remix)) {
      throw new Error(`Cannot run Remix CLI tests w/out building Remix`);
    }
  });
  describe("the --help flag", () => {
    it("prints help info", async () => {
      let { stdout } = await execFile("node", [remix, "--help"], {
        env: {
          ...process.env,
          NO_COLOR: "1",
        },
      });
      expect(stdout).toMatchInlineSnapshot(`
        "
          R E M I X

          Usage:
            $ remix create <projectDir> --template <template>
            $ remix init [projectDir]
            $ remix build [projectDir]
            $ remix dev [projectDir]
            $ remix routes [projectDir]
            $ remix setup [remixPlatform]

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

          Values:
            - projectDir        The Remix project directory
            - template          The project template to use
            - remixPlatform     node or cloudflare

          Creating a new project:

            Remix projects are created from templates. A template can be:

            - a file path to a directory of files
            - a file path to a tarball
            - the name of a repo in the remix-run GitHub org
            - the name of a username/repo on GitHub
            - the URL of a tarball

            $ remix create my-app --template /path/to/remix-template
            $ remix create my-app --template /path/to/remix-template.tar.gz
            $ remix create my-app --template [remix-run/]grunge-stack
            $ remix create my-app --template github-username/repo-name
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
            $ remix routes --json

        "
      `);
    });
  });

  describe("the --version flag", () => {
    it("prints the current version", async () => {
      let { stdout } = await execFile("node", [remix, "--version"]);
      expect(!!semver.valid(stdout.trim())).toBe(true);
    });
  });

  describe("the -v flag", () => {
    it("prints the current version", async () => {
      let { stdout } = await execFile("node", [remix, "-v"]);
      expect(!!semver.valid(stdout.trim())).toBe(true);
    });
  });

  describe("the create command", () => {
    beforeAll(async () => {
      await fse.emptyDir(TEMP_DIR);
    });

    afterAll(() => {
      /**
       * This prevents the console for spitting out a bunch of junk like this for
       * every fixture:
       *
       *    jest-haste-map: Haste module naming collision: remix-app-template-js
       *
       * I found some github issues that says that `modulePathIgnorePatterns` should
       * help, so I added it to our `jest.config.js`, but it doesn't seem to help, so
       * I brute-forced it here.
       */
      async function renamePkgJsonApp(dir: string) {
        let pkgPath = path.join(dir, "package.json");
        let pkg = await fse.readFile(pkgPath);
        let obj = JSON.parse(pkg.toString());
        obj.name = path.basename(dir);
        await fse.writeFile(pkgPath, JSON.stringify(obj, null, 2) + "\n");
      }

      let dirs = fse.readdirSync(TEMP_DIR);
      for (let dir of dirs) {
        renamePkgJsonApp(path.join(TEMP_DIR, dir));
      }
    });

    function getProjectDir(name: string) {
      return path.join(
        TEMP_DIR,
        `${name}-${Math.random().toString(32).slice(2)}`
      );
    }

    // this also tests sub directories
    it("works for examples in the remix repo", async () => {
      let projectDir = getProjectDir("example");
      let { stdout } = await execFile("node", [
        remix,
        "create",
        projectDir,
        "--template",
        "basic",
        "--no-install",
      ]);
      expect(stdout.trim()).toBe(
        `💿 That's it! \`cd\` into "${projectDir}" and check the README for development and deploy instructions!`
      );
      expect(
        fse.existsSync(path.join(projectDir, "package.json"))
      ).toBeTruthy();
      expect(
        fse.existsSync(path.join(projectDir, "app/root.tsx"))
      ).toBeTruthy();
    });

    it("works for templates in the remix org", async () => {
      let projectDir = getProjectDir("template");
      let { stdout } = await execFile("node", [
        remix,
        "create",
        projectDir,
        "--template",
        "grunge-stack",
        "--no-install",
      ]);
      expect(stdout.trim()).toBe(
        `💿 You've opted out of installing dependencies so we won't run the remix.init/index.js script for you just yet. Once you've installed dependencies, you can run it manually with \`npx remix init\`
💿 That's it! \`cd\` into "${projectDir}" and check the README for development and deploy instructions!`
      );
      expect(
        fse.existsSync(path.join(projectDir, "package.json"))
      ).toBeTruthy();
      expect(
        fse.existsSync(path.join(projectDir, "app/root.tsx"))
      ).toBeTruthy();
    });

    it("works for GitHub username/repo combo", async () => {
      let projectDir = getProjectDir("repo");
      let { stdout } = await execFile("node", [
        remix,
        "create",
        projectDir,
        "--template",
        "mcansh/snkrs",
        "--no-install",
      ]);
      expect(stdout.trim()).toBe(
        `💿 That's it! \`cd\` into "${projectDir}" and check the README for development and deploy instructions!`
      );
      expect(
        fse.existsSync(path.join(projectDir, "package.json"))
      ).toBeTruthy();
      expect(
        fse.existsSync(path.join(projectDir, "app/root.tsx"))
      ).toBeTruthy();
    });

    it("works for remote tarballs", async () => {
      let projectDir = getProjectDir("remote-tarball");
      let { stdout } = await execFile("node", [
        remix,
        "create",
        projectDir,
        "--template",
        "https://github.com/remix-run/remix/blob/635dae1d7fcd19c206f45f1d1b9226b9c3b308b0/packages/remix-dev/__tests__/fixtures/arc.tar.gz?raw=true",
        "--no-install",
      ]);
      expect(stdout.trim()).toBe(
        `💿 That's it! \`cd\` into "${projectDir}" and check the README for development and deploy instructions!`
      );
      expect(
        fse.existsSync(path.join(projectDir, "package.json"))
      ).toBeTruthy();
      expect(
        fse.existsSync(path.join(projectDir, "app/root.tsx"))
      ).toBeTruthy();
    });

    it.skip("works for different branches", async () => {
      let projectDir = getProjectDir("diff-branch");
      let { stdout } = await execFile("node", [
        remix,
        "create",
        projectDir,
        "--template",
        "https://github.com/remix-run/remix/tree/dev/templates/arc",
        "--no-install",
      ]);
      expect(stdout.trim()).toBe(
        `💿 That's it! \`cd\` into "${projectDir}" and check the README for development and deploy instructions!`
      );
      expect(
        fse.existsSync(path.join(projectDir, "package.json"))
      ).toBeTruthy();
      expect(
        fse.existsSync(path.join(projectDir, "app/root.tsx"))
      ).toBeTruthy();
    });

    it("works for a path to a tarball on disk", async () => {
      let projectDir = getProjectDir("local-tarball");
      let { stdout } = await execFile("node", [
        remix,
        "create",
        projectDir,
        "--template",
        path.join(__dirname, "fixtures", "arc.tar.gz"),
        "--no-install",
      ]);
      expect(stdout.trim()).toBe(
        `💿 That's it! \`cd\` into "${projectDir}" and check the README for development and deploy instructions!`
      );
      expect(
        fse.existsSync(path.join(projectDir, "package.json"))
      ).toBeTruthy();
      expect(
        fse.existsSync(path.join(projectDir, "app/root.tsx"))
      ).toBeTruthy();
    });

    it("works for a file URL to a tarball on disk", async () => {
      let projectDir = getProjectDir("file-url-tarball");
      let { stdout } = await execFile("node", [
        remix,
        "create",
        projectDir,
        "--template",
        pathToFileURL(
          path.join(__dirname, "fixtures", "arc.tar.gz")
        ).toString(),
        "--no-install",
      ]);
      expect(stdout.trim()).toBe(
        `💿 That's it! \`cd\` into "${projectDir}" and check the README for development and deploy instructions!`
      );
      expect(
        fse.existsSync(path.join(projectDir, "package.json"))
      ).toBeTruthy();
      expect(
        fse.existsSync(path.join(projectDir, "app/root.tsx"))
      ).toBeTruthy();
    });

    it("converts a template to javascript", async () => {
      let projectDir = getProjectDir("template-to-js");
      let { stdout } = await execFile("node", [
        remix,
        "create",
        projectDir,
        "--template",
        "blues-stack",
        "--no-install",
        "--no-typescript",
      ]);
      expect(stdout.trim()).toBe(
        `💿 You've opted out of installing dependencies so we won't run the remix.init/index.js script for you just yet. Once you've installed dependencies, you can run it manually with \`npx remix init\`
💿 That's it! \`cd\` into "${projectDir}" and check the README for development and deploy instructions!`
      );
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
      expect(
        fse.existsSync(path.join(projectDir, "app/session.server.js"))
      ).toBeTruthy();
      let pkgJSON = JSON.parse(
        fse.readFileSync(path.join(projectDir, "package.json"), "utf-8")
      );
      expect(Object.keys(pkgJSON.devDependencies)).not.toContain("typescript");
      expect(Object.keys(pkgJSON.scripts)).not.toContain("typecheck");
    });

    it("works for a file path to a directory on disk", async () => {
      let projectDir = getProjectDir("local-directory");
      let { stdout } = await execFile("node", [
        remix,
        "create",
        projectDir,
        "--template",
        path.join(process.cwd(), "examples/basic"),
        "--no-install",
      ]);
      expect(stdout.trim()).toBe(
        `💿 That's it! \`cd\` into "${projectDir}" and check the README for development and deploy instructions!`
      );
      expect(
        fse.existsSync(path.join(projectDir, "package.json"))
      ).toBeTruthy();
      expect(
        fse.existsSync(path.join(projectDir, "app/root.tsx"))
      ).toBeTruthy();
    });

    it("works for a file URL to a directory on disk", async () => {
      let projectDir = getProjectDir("file-url-directory");
      let { stdout } = await execFile("node", [
        remix,
        "create",
        projectDir,
        "--template",
        pathToFileURL(path.join(process.cwd(), "examples/basic")).toString(),
        "--no-install",
      ]);
      expect(stdout.trim()).toBe(
        `💿 That's it! \`cd\` into "${projectDir}" and check the README for development and deploy instructions!`
      );
      expect(
        fse.existsSync(path.join(projectDir, "package.json"))
      ).toBeTruthy();
      expect(
        fse.existsSync(path.join(projectDir, "app/root.tsx"))
      ).toBeTruthy();
    });

    it("runs remix.init script when installing dependencies", async () => {
      let projectDir = getProjectDir("remix-init-auto");
      let { stdout } = await execFile("node", [
        remix,
        "create",
        projectDir,
        "--template",
        path.join(__dirname, "fixtures", "successful-remix-init.tar.gz"),
        "--install",
      ]);
      expect(stdout.trim()).toContain(
        `💿 That's it! \`cd\` into "${projectDir}" and check the README for development and deploy instructions!`
      );
      expect(stdout.trim()).toContain(`💿 Running remix.init script`);
      expect(
        fse.existsSync(path.join(projectDir, "package.json"))
      ).toBeTruthy();
      expect(
        fse.existsSync(path.join(projectDir, "app/root.tsx"))
      ).toBeTruthy();
      expect(fse.existsSync(path.join(projectDir, "test.txt"))).toBeTruthy();
      expect(fse.existsSync(path.join(projectDir, "remix.init"))).toBeFalsy();
      // deps can take a bit to install
    }, 60_000);

    it("runs remix.init script when using `remix init`", async () => {
      let projectDir = getProjectDir("remix-init-manual");
      let { stdout } = await execFile("node", [
        remix,
        "create",
        projectDir,
        "--template",
        path.join(__dirname, "fixtures", "successful-remix-init.tar.gz"),
        "--no-install",
      ]);
      expect(stdout.trim()).toContain(
        `💿 That's it! \`cd\` into "${projectDir}" and check the README for development and deploy instructions!`
      );

      let initResult = await execFile("node", [remix, "init"], {
        cwd: projectDir,
      });

      expect(initResult.stdout.trim()).toBe("");
      expect(
        fse.existsSync(path.join(projectDir, "package.json"))
      ).toBeTruthy();
      expect(
        fse.existsSync(path.join(projectDir, "app/root.tsx"))
      ).toBeTruthy();
      expect(fse.existsSync(path.join(projectDir, "test.txt"))).toBeTruthy();
      // if you run `remix init` keep around the remix.init directory for future use
      expect(fse.existsSync(path.join(projectDir, "remix.init"))).toBeTruthy();
      // deps can take a bit to install
    }, 60_000);

    it("throws an error when invalid remix.init script when automatically ran", async () => {
      let projectDir = getProjectDir("invalid-remix-init-manual");
      await expect(
        execFile("node", [
          remix,
          "create",
          projectDir,
          "--template",
          path.join(__dirname, "fixtures", "failing-remix-init.tar.gz"),
          "--install",
        ])
      ).rejects.toThrowError(`🚨 Oops, remix.init failed`);

      expect(
        fse.existsSync(path.join(projectDir, "package.json"))
      ).toBeTruthy();
      expect(
        fse.existsSync(path.join(projectDir, "app/root.tsx"))
      ).toBeTruthy();
      // we should keep remix.init around if the init script fails
      expect(fse.existsSync(path.join(projectDir, "remix.init"))).toBeTruthy();
      // deps can take a bit to install
    }, 60_000);

    it("throws an error when invalid remix.init script when manually ran", async () => {
      let projectDir = getProjectDir("invalid-remix-init-manual");
      let { stdout } = await execFile("node", [
        remix,
        "create",
        projectDir,
        "--template",
        path.join(__dirname, "fixtures", "failing-remix-init.tar.gz"),
        "--no-install",
      ]);

      expect(stdout.trim()).toContain(
        `💿 That's it! \`cd\` into "${projectDir}" and check the README for development and deploy instructions!`
      );

      await expect(
        execFile("node", [remix, "init"], {
          cwd: projectDir,
        })
      ).rejects.toThrowError(`🚨 Oops, remix.init failed`);
      expect(
        fse.existsSync(path.join(projectDir, "package.json"))
      ).toBeTruthy();
      expect(
        fse.existsSync(path.join(projectDir, "app/root.tsx"))
      ).toBeTruthy();
      // we should keep remix.init around if the init script fails
      expect(fse.existsSync(path.join(projectDir, "remix.init"))).toBeTruthy();
      // deps can take a bit to install
    }, 60_000);
  });
});
