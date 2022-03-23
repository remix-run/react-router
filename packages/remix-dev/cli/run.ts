import * as path from "path";
import meow from "meow";
import inspector from "inspector";
import inquirer from "inquirer";
// import chalkAnimation from "chalk-animation";

import * as colors from "./colors";
import * as commands from "./commands";

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
  $ remix setup [${colors.arg("remixPlatform")}]

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
\`routes\` Options:
  --json              Print the routes as JSON

${colors.heading("Values")}:
  - ${colors.arg("projectDir")}        The Remix project directory
  - ${colors.arg("template")}          The project template to use
  - ${colors.arg("remixPlatform")}     node or cloudflare

${colors.heading("Creating a new project")}:

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

${colors.heading("Show all routes in your app")}:

  $ remix routes
  $ remix routes my-app
  $ remix routes --json
`;

/**
 * Programmatic interface for running the Remix CLI with the given command line
 * arguments.
 */
export async function run(argv: string[] = process.argv.slice(2)) {
  let { flags, input, showHelp, showVersion } = meow(helpText, {
    argv: argv,
    description: false,
    booleanDefault: undefined,
    flags: {
      debug: { type: "boolean" },
      help: { type: "boolean", alias: "h" },
      install: { type: "boolean" },
      json: { type: "boolean" },
      remixVersion: { type: "string" },
      sourcemap: { type: "boolean" },
      template: { type: "string" },
      typescript: { type: "boolean" },
      version: { type: "boolean", alias: "v" },
    },
  });

  if (flags.help) showHelp();
  if (flags.version) showVersion();
  if (flags.template === "typescript" || flags.template === "ts") {
    flags.template = "remix-ts";
  }

  //   if (!flags.template) {
  //     if (colors.supportsColor && process.env.NODE_ENV !== "test") {
  //       let anim = chalkAnimation.rainbow(
  //         `\nR E M I X - v${remixDevPackageVersion}\n`
  //       );
  //       await new Promise((res) => setTimeout(res, 1500));
  //       anim.stop();
  //     }
  //   }

  // Note: Keep each case in this switch statement small.
  switch (input[0]) {
    case "create":
    // `remix new` is an alias for `remix create`
    case "new": {
      let projectPath =
        input.length > 1
          ? input[1]
          : (
              await inquirer
                .prompt<{ dir: string }>([
                  {
                    type: "input",
                    name: "dir",
                    message: "Where would you like to create your app?",
                    default: "./my-remix-app",
                  },
                ])
                .catch((error) => {
                  if (error.isTtyError) {
                    showHelp();
                    return;
                  }
                  throw error;
                })
            )?.dir;

      if (!projectPath) {
        showHelp();
        return;
      }

      let projectDir = path.resolve(process.cwd(), projectPath);

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
            when() {
              return flags.template === undefined;
            },
            choices: [
              {
                name: "A pre-configured stack ready for production",
                value: "stack",
              },
              {
                name: "Just the basics",
                value: "template",
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
            suffix: "(Learn more about these stacks: https://remix.run/stacks)",
            choices: [
              {
                name: "Blues",
                value: "blues-stack",
              },
              {
                name: "Indie",
                value: "indie-stack",
              },
              {
                name: "Grunge",
                value: "grunge-stack",
              },
            ],
          },
          {
            name: "appTemplate",
            type: "list",
            when(answers) {
              return answers.appType === "template";
            },
            message: `Where do you want to deploy? Choose Remix if you're unsure, it's easy to change deployment targets.`,
            loop: false,
            choices: [
              { name: "Remix App Server", value: "remix" },
              { name: "Express Server", value: "express" },
              { name: "Architect (AWS Lambda)", value: "arc" },
              { name: "Fly.io", value: "fly" },
              { name: "Netlify", value: "netlify" },
              { name: "Vercel", value: "vercel" },
              { name: "Cloudflare Pages", value: "cloudflare-pages" },
              { name: "Cloudflare Workers", value: "cloudflare-workers" },
            ],
          },
          {
            name: "useTypeScript",
            type: "list",
            message: "TypeScript or JavaScript?",
            when(answers) {
              return (
                flags.template === undefined && answers.appType !== "stack"
              );
            },
            choices: [
              { name: "TypeScript", value: true },
              { name: "JavaScript", value: false },
            ],
          },
          {
            name: "install",
            type: "confirm",
            message: "Do you want me to run `npm install`?",
            when() {
              return flags.install === undefined;
            },
            default: true,
          },
        ])
        .catch((error) => {
          if (error.isTtyError) {
            console.warn(
              colors.warning(
                "🚨 Your terminal doesn't support interactivity; using default configuration.\n\n" +
                  "If you'd like to use different settings, try passing them as arguments. Run " +
                  "`npx create-remix@latest --help` to see available options."
              )
            );
            return {
              appTemplate: "remix",
              useTypeScript: true,
              install: true,
            };
          }
          throw error;
        });

      await commands.create({
        appTemplate: flags.template ?? answers.appTemplate,
        projectDir,
        remixVersion: flags.remixVersion,
        installDeps: flags.install ?? answers.install,
        useTypeScript: flags.typescript ?? answers.useTypeScript,
        githubToken: process.env.GITHUB_TOKEN,
      });
      break;
    }
    case "init":
      await commands.init(input[1] || process.env.REMIX_ROOT || process.cwd());
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
    case "dev":
      if (!process.env.NODE_ENV) process.env.NODE_ENV = "development";
      if (flags.debug) inspector.open();
      await commands.dev(input[1], process.env.NODE_ENV);
      break;
    default:
      // `remix ./my-project` is shorthand for `remix dev ./my-project`
      if (!process.env.NODE_ENV) process.env.NODE_ENV = "development";
      await commands.dev(input[0], process.env.NODE_ENV);
  }
}
