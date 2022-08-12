import * as path from "path";
import os from "os";
import arg from "arg";
import inspector from "inspector";
import inquirer from "inquirer";
import semver from "semver";
import fse from "fs-extra";

import * as colors from "../colors";
import * as commands from "./commands";
import { validateNewProjectPath, validateTemplate } from "./create";
import { getPreferredPackageManager } from "./getPreferredPackageManager";

const helpText = `
${colors.logoBlue("R")} ${colors.logoGreen("E")} ${colors.logoYellow(
  "M"
)} ${colors.logoPink("I")} ${colors.logoRed("X")}

  ${colors.heading("Usage")}:
    $ remix create <${colors.arg("projectDir")}> --template <${colors.arg(
  "template"
)}>
    $ remix init [${colors.arg("projectDir")}]
    $ remix build [${colors.arg("projectDir")}]
    $ remix dev [${colors.arg("projectDir")}]
    $ remix routes [${colors.arg("projectDir")}]
    $ remix watch [${colors.arg("projectDir")}]
    $ remix setup [${colors.arg("remixPlatform")}]
    $ remix migrate [-m ${colors.arg("migration")}] [${colors.arg(
  "projectDir"
)}]

  ${colors.heading("Options")}:
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
  \`init\` Options:
    --no-delete         Skip deleting the \`remix.init\` script
  \`routes\` Options:
    --json              Print the routes as JSON
  \`migrate\` Options:
    --debug             Show debugging logs
    --dry               Dry run (no changes are made to files)
    --force             Bypass Git safety checks and forcibly run migration
    --migration, -m     Name of the migration to run

  ${colors.heading("Values")}:
    - ${colors.arg("projectDir")}        The Remix project directory
    - ${colors.arg("template")}          The project template to use
    - ${colors.arg("remixPlatform")}     \`node\` or \`cloudflare\`
    - ${colors.arg(
      "migration"
    )}         One of the choices from https://github.com/remix-run/remix/blob/main/packages/remix-dev/cli/migrate/migrations/index.ts

  ${colors.heading("Creating a new project")}:

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

  ${colors.heading("Initialize a project:")}:

    Remix project templates may contain a \`remix.init\` directory
    with a script that initializes the project. This script automatically
    runs during \`remix create\`, but if you ever need to run it manually
    (e.g. to test it out) you can:

    $ remix init

  ${colors.heading("Build your project")}:

    $ remix build
    $ remix build --sourcemap
    $ remix build my-app

  ${colors.heading("Run your project locally in development")}:

    $ remix dev
    $ remix dev my-app
    $ remix dev --debug

  ${colors.heading("Start your server separately and watch for changes")}:

    # custom server start command, for example:
    $ remix watch

    # in a separate tab:
    $ node --inspect --require ./node_modules/dotenv/config --require ./mocks ./build/server.js

  ${colors.heading("Show all routes in your app")}:

    $ remix routes
    $ remix routes my-app
    $ remix routes --json
`;

const templateChoices = [
  { name: "Remix App Server", value: "remix" },
  { name: "Express Server", value: "express" },
  { name: "Architect (AWS Lambda)", value: "arc" },
  { name: "Fly.io", value: "fly" },
  { name: "Netlify", value: "netlify" },
  { name: "Vercel", value: "vercel" },
  { name: "Cloudflare Pages", value: "cloudflare-pages" },
  { name: "Cloudflare Workers", value: "cloudflare-workers" },
  { name: "Deno", value: "deno" },
];

const npxInterop = {
  npm: "npx",
  yarn: "yarn",
  pnpm: "pnpm exec",
};

async function dev(
  projectDir: string,
  flags: { debug?: boolean; port?: number }
) {
  if (!process.env.NODE_ENV) process.env.NODE_ENV = "development";
  if (flags.debug) inspector.open();
  await commands.dev(projectDir, process.env.NODE_ENV, flags.port);
}

/**
 * Programmatic interface for running the Remix CLI with the given command line
 * arguments.
 */
export async function run(argv: string[] = process.argv.slice(2)) {
  // Check the node version
  let versions = process.versions;
  if (versions && versions.node && semver.major(versions.node) < 14) {
    throw new Error(
      `️🚨 Oops, Node v${versions.node} detected. Remix requires a Node version greater than 14.`
    );
  }

  let args = arg(
    {
      "--debug": Boolean,
      "--no-delete": Boolean,
      "--dry": Boolean,
      "--force": Boolean,
      "--help": Boolean,
      "-h": "--help",
      "--install": Boolean,
      "--no-install": Boolean,
      "--interactive": Boolean,
      "--no-interactive": Boolean,
      "--json": Boolean,
      "--migration": String,
      "-m": "--migration",
      "--port": Number,
      "-p": "--port",
      "--remix-version": String,
      "--sourcemap": Boolean,
      "--template": String,
      "--token": String,
      "--typescript": Boolean,
      "--no-typescript": Boolean,
      "--version": Boolean,
      "-v": "--version",
    },
    {
      argv,
    }
  );

  let input = args._;

  let flags: any = Object.entries(args).reduce((acc, [key, value]) => {
    key = key.replace(/^--/, "");
    acc[key] = value;
    return acc;
  }, {} as any);

  if (flags.help) {
    console.log(helpText);
    return;
  }
  if (flags.version) {
    let version = require("../package.json").version;
    console.log(version);
    return;
  }

  if (args["--no-delete"]) {
    flags.delete = false;
  }
  if (args["--no-install"]) {
    flags.install = false;
  }
  if (args["--no-interactive"]) {
    flags.interactive = false;
  }
  flags.interactive = flags.interactive ?? require.main === module;
  if (args["--no-typescript"]) {
    flags.typescript = false;
  }
  if (flags.template === "typescript" || flags.template === "ts") {
    flags.template = "remix-ts";
  }
  flags.remixVersion = args["--remix-version"];

  let command = input[0];

  // Note: Keep each case in this switch statement small.
  switch (command) {
    case "create":
    // `remix new` is an alias for `remix create`
    case "new": {
      let projectPath = input[1];

      // Flags will validate early and stop the process if invalid flags are
      // provided. Input provided in the interactive CLI is validated by
      // inquirer step-by-step. This not only allows us to catch issues as early
      // as possible, but inquirer will allow users to retry input rather than
      // stop the process.

      let {
        template,
        token: githubToken,
        install,
        typescript,
        remixVersion,
        debug,
      } = flags;

      if (template === "typescript" || template === "ts") {
        template = "remix-ts";
      }

      if (flags.template) {
        await validateTemplate(flags.template, { githubToken });
      }

      if (projectPath) {
        await validateNewProjectPath(projectPath);
      }

      let projectDir = projectPath
        ? path.resolve(process.cwd(), projectPath)
        : await inquirer
            .prompt<{ dir: string }>([
              {
                type: "input",
                name: "dir",
                message: "Where would you like to create your app?",
                default: "./my-remix-app",
                async validate(input) {
                  try {
                    await validateNewProjectPath(String(input));
                    return true;
                  } catch (error) {
                    if (error instanceof Error && error.message) {
                      return error.message;
                    }
                    throw error;
                  }
                },
              },
            ])
            .then(async (input) => {
              let inputDir = input.dir.startsWith("~")
                ? input.dir.replace("~", os.homedir())
                : input.dir;
              if (path.isAbsolute(inputDir)) {
                return inputDir;
              }
              return path.resolve(process.cwd(), inputDir);
            })
            .catch((error) => {
              if (error.isTtyError) {
                console.log(helpText);
                return;
              }
              throw error;
            });

      if (!projectDir) {
        console.log(helpText);
        return;
      }

      let packageManager = getPreferredPackageManager();
      let answers = await inquirer
        .prompt<{
          appType: "template" | "stack";
          appTemplate: string;
          useTypeScript: boolean;
          install: boolean;
        }>([
          {
            name: "appType",
            type: "list",
            message: "What type of app do you want to create?",
            default: "template",
            when() {
              return template === undefined;
            },
            choices: [
              {
                name: "Just the basics",
                value: "template",
              },
              {
                name: "A pre-configured stack ready for production",
                value: "stack",
              },
            ],
          },
          {
            name: "appTemplate",
            type: "list",
            when(answers) {
              return answers.appType === "stack";
            },
            message: "Which Stack do you want? ",
            loop: false,
            suffix:
              "(Learn more about these stacks: 'https://remix.run/stacks')",
            choices: [
              {
                name: "Blues",
                value: "remix-run/blues-stack",
              },
              {
                name: "Indie",
                value: "remix-run/indie-stack",
              },
              {
                name: "Grunge",
                value: "remix-run/grunge-stack",
              },
            ],
          },
          {
            name: "appTemplate",
            type: "list",
            when(answers) {
              return answers.appType === "template";
            },
            message:
              "Where do you want to deploy? Choose Remix App Server if you're unsure; " +
              "it's easy to change deployment targets.",
            loop: false,
            choices: templateChoices,
          },
          {
            name: "useTypeScript",
            type: "list",
            message: "TypeScript or JavaScript?",
            default: true,
            when() {
              return typescript === undefined;
            },
            choices: [
              { name: "TypeScript", value: true },
              { name: "JavaScript", value: false },
            ],
          },
          {
            name: "install",
            type: "confirm",
            message: `Do you want me to run \`${packageManager} install\`?`,
            when() {
              return install === undefined;
            },
            default: true,
          },
        ])
        .catch((error) => {
          if (error.isTtyError) {
            console.warn(
              colors.warning(
                "🚨 Your terminal doesn't support interactivity; using default " +
                  "configuration.\n\n" +
                  "If you'd like to use different settings, try passing them " +
                  `as arguments. Run \`${packageManager} create remix@latest --help\` to see ` +
                  "available options."
              )
            );
            return {
              appType: "template",
              appTemplate: "remix",
              useTypeScript: true,
              install: true,
            };
          }
          throw error;
        });

      let installDeps = install !== false && answers.install !== false;
      let useTypeScript = typescript ?? answers.useTypeScript;

      await commands.create({
        appTemplate: template || answers.appTemplate,
        projectDir,
        remixVersion: remixVersion,
        installDeps,
        useTypeScript,
        githubToken,
        debug,
      });

      let initScriptDir = path.join(projectDir, "remix.init");
      let hasInitScript = await fse.pathExists(initScriptDir);
      if (hasInitScript) {
        if (installDeps) {
          console.log("💿 Running remix.init script");
          await commands.init(projectDir, { deleteScript: true });
        } else {
          console.log();
          console.log(
            colors.warning(
              "💿 You've opted out of installing dependencies so we won't run the " +
                path.join("remix.init", "index.js") +
                " script for you just yet. Once you've installed " +
                `dependencies, you can run it manually with \`${npxInterop[packageManager]} remix init\``
            )
          );
          console.log();
        }
      }

      let relProjectDir = path.relative(process.cwd(), projectDir);
      let projectDirIsCurrentDir = relProjectDir === "";

      if (projectDirIsCurrentDir) {
        console.log(
          `💿 That's it! Check the README for development and deploy instructions!`
        );
      } else {
        console.log(
          `💿 That's it! \`cd\` into "${path.resolve(
            process.cwd(),
            projectDir
          )}" and check the README for development and deploy instructions!`
        );
      }

      break;
    }
    case "init":
      await commands.init(input[1] || process.env.REMIX_ROOT || process.cwd(), {
        deleteScript: flags.delete,
      });
      break;
    case "routes":
      await commands.routes(input[1], flags.json ? "json" : "jsx");
      break;
    case "build":
      if (!process.env.NODE_ENV) process.env.NODE_ENV = "production";
      await commands.build(input[1], process.env.NODE_ENV, flags.sourcemap);
      break;
    case "watch":
      if (!process.env.NODE_ENV) process.env.NODE_ENV = "development";
      await commands.watch(input[1], process.env.NODE_ENV);
      break;
    case "setup":
      await commands.setup(input[1]);
      break;
    case "migrate": {
      let { projectDir, migrationId } = await commands.migrate.resolveInput(
        { migrationId: flags.migration, projectId: input[1] },
        flags
      );
      await commands.migrate.run({ flags, migrationId, projectDir });
      break;
    }
    case "dev":
      await dev(input[1], flags);
      break;
    default:
      // `remix ./my-project` is shorthand for `remix dev ./my-project`
      await dev(input[0], flags);
  }
}
