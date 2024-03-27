import arg from "arg";
import semver from "semver";

import * as colors from "../colors";
import * as commands from "./commands";

const helpText = `
${colors.logoBlue("R")} ${colors.logoGreen("E")} ${colors.logoYellow(
  "M"
)} ${colors.logoPink("I")} ${colors.logoRed("X")}

  ${colors.heading("Usage")}:
    $ remix init [${colors.arg("projectDir")}]
    $ remix vite:build [${colors.arg("projectDir")}]
    $ remix vite:dev [${colors.arg("projectDir")}]
    $ remix build [${colors.arg("projectDir")}]
    $ remix dev [${colors.arg("projectDir")}]
    $ remix routes [${colors.arg("projectDir")}]
    $ remix watch [${colors.arg("projectDir")}]

  ${colors.heading("Options")}:
    --help, -h          Print this help message and exit
    --version, -v       Print the CLI version and exit
    --no-color          Disable ANSI colors in console output
  \`vite:build\` Options (Passed through to Vite):
    --assetsInlineLimit Static asset base64 inline threshold in bytes (default: 4096) (number)
    --clearScreen       Allow/disable clear screen when logging (boolean)
    --config, -c        Use specified config file (string)
    --emptyOutDir       Force empty outDir when it's outside of root (boolean)
    --logLevel, -l      Info | warn | error | silent (string)
    --minify            Enable/disable minification, or specify minifier to use (default: "esbuild") (boolean | "terser" | "esbuild")
    --mode, -m          Set env mode (string)
    --profile           Start built-in Node.js inspector
    --sourcemapClient   Output source maps for client build (default: false) (boolean | "inline" | "hidden")
    --sourcemapServer   Output source maps for server build (default: false) (boolean | "inline" | "hidden")
  \`build\` Options:
    --sourcemap         Generate source maps for production
  \`vite:dev\` Options (Passed through to Vite):
    --clearScreen       Allow/disable clear screen when logging (boolean)
    --config, -c        Use specified config file (string)
    --cors              Enable CORS (boolean)
    --force             Force the optimizer to ignore the cache and re-bundle (boolean)
    --host              Specify hostname (string)
    --logLevel, -l      Info | warn | error | silent (string)
    --mode, -m          Set env mode (string)
    --open              Open browser on startup (boolean | string)
    --port              Specify port (number)
    --profile           Start built-in Node.js inspector
    --strictPort        Exit if specified port is already in use (boolean)
  \`dev\` Options:
    --command, -c       Command used to run your app server
    --manual            Enable manual mode
    --port              Port for the dev server. Default: any open port
    --tls-key           Path to TLS key (key.pem)
    --tls-cert          Path to TLS certificate (cert.pem)
  \`init\` Options:
    --no-delete         Skip deleting the \`remix.init\` script
  \`routes\` Options:
    --config, -c        Use specified Vite config file (string)
    --json              Print the routes as JSON
  \`reveal\` Options:
    --config, -c        Use specified Vite config file (string)
    --no-typescript     Generate plain JavaScript files

  ${colors.heading("Values")}:
    - ${colors.arg("projectDir")}        The Remix project directory
    - ${colors.arg("remixPlatform")}     \`node\` or \`cloudflare\`

  ${colors.heading("Initialize a project:")}:

    Remix project templates may contain a \`remix.init\` directory
    with a script that initializes the project. This script automatically
    runs during \`remix create\`, but if you ever need to run it manually
    (e.g. to test it out) you can:

    $ remix init

  ${colors.heading("Build your project (Vite)")}:

    $ remix vite:build

  ${colors.heading("Run your project locally in development (Vite)")}:

    $ remix vite:dev

  ${colors.heading("Build your project (Classic compiler)")}:

    $ remix build
    $ remix build --sourcemap
    $ remix build my-app

  ${colors.heading(
    "Run your project locally in development (Classic compiler)"
  )}:

    $ remix dev
    $ remix dev -c "node ./server.js"

  ${colors.heading(
    "Start your server separately and watch for changes (Classic compiler)"
  )}:

    # custom server start command, for example:
    $ remix watch

    # in a separate tab:
    $ node --inspect --require ./node_modules/dotenv/config --require ./mocks ./build/server.js

  ${colors.heading("Show all routes in your app")}:

    $ remix routes
    $ remix routes my-app
    $ remix routes --json
    $ remix routes --config vite.remix.config.ts

  ${colors.heading("Reveal the used entry point")}:

    $ remix reveal entry.client
    $ remix reveal entry.server
    $ remix reveal entry.client --no-typescript
    $ remix reveal entry.server --no-typescript
    $ remix reveal entry.server --config vite.remix.config.ts
`;

/**
 * Programmatic interface for running the Remix CLI with the given command line
 * arguments.
 */
export async function run(argv: string[] = process.argv.slice(2)) {
  // Check the node version
  let versions = process.versions;
  if (versions && versions.node && semver.major(versions.node) < 18) {
    throw new Error(
      `️🚨 Oops, Node v${versions.node} detected. Remix requires a Node version greater than 18.`
    );
  }

  let isBooleanFlag = (arg: string) => {
    let index = argv.indexOf(arg);
    let nextArg = argv[index + 1];
    return !nextArg || nextArg.startsWith("-");
  };

  let args = arg(
    {
      "--no-delete": Boolean,
      "--dry": Boolean,
      "--force": Boolean,
      "--help": Boolean,
      "-h": "--help",
      "--json": Boolean,
      "--token": String,
      "--typescript": Boolean,
      "--no-typescript": Boolean,
      "--version": Boolean,
      "-v": "--version",

      // dev server
      "--command": String,
      "--manual": Boolean,
      "--port": Number,
      "-p": "--port",
      "--tls-key": String,
      "--tls-cert": String,

      ...(argv[0].startsWith("vite:") ||
      argv[0] === "reveal" ||
      argv[0] === "routes"
        ? // Handle commands that support Vite's --config flag
          {
            "--config": String,
            "-c": "--config",
          }
        : {
            // Handle non Vite config commands
            "-c": "--command",
          }),

      ...(argv[0].startsWith("vite:")
        ? {
            // Vite commands
            // --config, --force and --port are already defined above
            "--assetsInlineLimit": Number,
            "--clearScreen": Boolean,
            "--cors": Boolean,
            "--emptyOutDir": Boolean,
            "--host": isBooleanFlag("--host") ? Boolean : String,
            "--logLevel": String,
            "-l": "--logLevel",
            "--minify": String,
            "--mode": String,
            "-m": "--mode",
            "--open": isBooleanFlag("--open") ? Boolean : String,
            "--strictPort": Boolean,
            "--profile": Boolean,
            "--sourcemapClient": isBooleanFlag("--sourcemapClient")
              ? Boolean
              : String,
            "--sourcemapServer": isBooleanFlag("--sourcemapServer")
              ? Boolean
              : String,
          }
        : {
            // Non Vite commands
            "--sourcemap": Boolean,
          }),
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

  if (flags["tls-key"]) {
    flags.tlsKey = flags["tls-key"];
    delete flags["tls-key"];
  }
  if (flags["tls-cert"]) {
    flags.tlsCert = flags["tls-cert"];
    delete flags["tls-cert"];
  }

  if (args["--no-delete"]) {
    flags.delete = false;
  }
  flags.interactive = flags.interactive ?? require.main === module;
  if (args["--no-typescript"]) {
    flags.typescript = false;
  }

  let command = input[0];

  // Note: Keep each case in this switch statement small.
  switch (command) {
    case "init":
      await commands.init(input[1] || process.env.REMIX_ROOT || process.cwd(), {
        deleteScript: flags.delete,
      });
      break;
    case "routes":
      await commands.routes(input[1], flags);
      break;
    case "build":
      if (!process.env.NODE_ENV) process.env.NODE_ENV = "production";
      await commands.build(input[1], process.env.NODE_ENV, flags.sourcemap);
      break;
    case "vite:build":
      await commands.viteBuild(input[1], flags);
      break;
    case "watch":
      if (!process.env.NODE_ENV) process.env.NODE_ENV = "development";
      await commands.watch(input[1], process.env.NODE_ENV);
      break;
    case "setup":
      commands.setup();
      break;
    case "reveal": {
      // TODO: simplify getting started guide
      await commands.generateEntry(input[1], input[2], flags);
      break;
    }
    case "dev":
      await commands.dev(input[1], flags);
      break;
    case "vite:dev":
      await commands.viteDev(input[1], flags);
      break;
    default:
      // `remix ./my-project` is shorthand for `remix dev ./my-project`
      await commands.dev(input[0], flags);
  }
}
