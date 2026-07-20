import { parseArgs } from "node:util";
import semver from "semver";
import colors from "picocolors";

import * as commands from "./commands";
import packageJson from "@react-router/dev/package.json" with { type: "json" };

const helpText = `
${colors.blueBright("react-router")}

  ${colors.underline("Usage")}:
    $ react-router build [${colors.yellowBright("projectDir")}]
    $ react-router dev [${colors.yellowBright("projectDir")}]
    $ react-router routes [${colors.yellowBright("projectDir")}]

  ${colors.underline("Options")}:
    --help, -h          Print this help message and exit
    --version, -v       Print the CLI version and exit
    --no-color          Disable ANSI colors in console output
  \`build\` Options:
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
  \`dev\` Options:
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
  \`routes\` Options:
    --config, -c        Use specified Vite config file (string)
    --json              Print the routes as JSON
  \`reveal\` Options:
    --config, -c        Use specified Vite config file (string)
    --no-typescript     Generate plain JavaScript files
  \`typegen\` Options:
    --watch             Automatically regenerate types whenever route config (\`routes.ts\`) or route modules change

  ${colors.underline("Build your project")}:

    $ react-router build

  ${colors.underline("Run your project locally in development")}:

    $ react-router dev

  ${colors.underline("Show all routes in your app")}:

    $ react-router routes
    $ react-router routes my-app
    $ react-router routes --json
    $ react-router routes --config vite.react-router.config.ts

  ${colors.underline("Reveal the used entry point")}:

    $ react-router reveal entry.client
    $ react-router reveal entry.server
    $ react-router reveal entry.client --no-typescript
    $ react-router reveal entry.server --no-typescript
    $ react-router reveal entry.server --config vite.react-router.config.ts

  ${colors.underline("Generate types for route modules")}:

   $ react-router typegen
   $ react-router typegen --watch
`;

type ParsedValue = string | boolean | Array<string | boolean> | undefined;

function getBooleanArg(value: ParsedValue) {
  return typeof value === "boolean" ? value : undefined;
}

function getBooleanStringArg(value: ParsedValue) {
  return typeof value === "boolean" || typeof value === "string"
    ? value
    : undefined;
}

function getNumberArg(value: ParsedValue) {
  return typeof value === "string" ? Number(value) : undefined;
}

function getStringArg(value: ParsedValue) {
  return typeof value === "string" ? value : undefined;
}

/**
 * Programmatic interface for running the react-router CLI with the given command line
 * arguments.
 */
export async function run(
  argv: string[] = process.argv.slice(2),
  { isMain = false }: { isMain?: boolean } = {},
) {
  // Check the node version
  let versions = process.versions;
  let MINIMUM_NODE_VERSION = "22.22.0";
  if (
    versions &&
    versions.node &&
    semver.lt(versions.node, MINIMUM_NODE_VERSION)
  ) {
    console.warn(
      `️⚠️ Oops, Node v${versions.node} detected. react-router requires ` +
        `a Node version greater than ${MINIMUM_NODE_VERSION}.`,
    );
  }

  let isBooleanFlag = (arg: string) => {
    let index = argv.indexOf(arg);
    let nextArg = argv[index + 1];
    return !nextArg || nextArg.startsWith("-");
  };

  let { values, positionals } = parseArgs({
    args: argv,
    allowPositionals: true,
    options: {
      assetsInlineLimit: { type: "string" },
      clearScreen: { type: "boolean" },
      config: { type: "string", short: "c" },
      cors: { type: "boolean" },
      emptyOutDir: { type: "boolean" },
      force: { type: "boolean" },
      help: { type: "boolean", short: "h" },
      host: { type: isBooleanFlag("--host") ? "boolean" : "string" },
      json: { type: "boolean" },
      logLevel: { type: "string", short: "l" },
      minify: { type: "string" },
      mode: { type: "string", short: "m" },
      "no-typescript": { type: "boolean" },
      open: { type: isBooleanFlag("--open") ? "boolean" : "string" },
      port: { type: "string", short: "p" },
      profile: { type: "boolean" },
      sourcemapClient: {
        type: isBooleanFlag("--sourcemapClient") ? "boolean" : "string",
      },
      sourcemapServer: {
        type: isBooleanFlag("--sourcemapServer") ? "boolean" : "string",
      },
      strictPort: { type: "boolean" },
      token: { type: "string" },
      typescript: { type: "boolean" },
      version: { type: "boolean", short: "v" },
      watch: { type: "boolean" },
    },
  });

  let input = positionals;

  let flags: any = {
    assetsInlineLimit: getNumberArg(values.assetsInlineLimit),
    clearScreen: getBooleanArg(values.clearScreen),
    config: getStringArg(values.config),
    cors: getBooleanArg(values.cors),
    emptyOutDir: getBooleanArg(values.emptyOutDir),
    force: getBooleanArg(values.force),
    help: getBooleanArg(values.help),
    host: getBooleanStringArg(values.host),
    json: getBooleanArg(values.json),
    logLevel: getStringArg(values.logLevel),
    minify: getStringArg(values.minify),
    mode: getStringArg(values.mode),
    open: getBooleanStringArg(values.open),
    port: getNumberArg(values.port),
    profile: getBooleanArg(values.profile),
    sourcemapClient: getBooleanStringArg(values.sourcemapClient),
    sourcemapServer: getBooleanStringArg(values.sourcemapServer),
    strictPort: getBooleanArg(values.strictPort),
    token: getStringArg(values.token),
    typescript: getBooleanArg(values.typescript),
    version: getBooleanArg(values.version),
    watch: getBooleanArg(values.watch),
  };

  if (flags.help) {
    console.log(helpText);
    return;
  }
  if (flags.version) {
    console.log(packageJson.version);
    return;
  }

  flags.interactive = flags.interactive ?? isMain;
  if (values["no-typescript"]) {
    flags.typescript = false;
  }

  let command = input[0];

  // Note: Keep each case in this switch statement small.
  switch (command) {
    case "routes":
      await commands.routes(input[1], flags);
      break;
    case "build":
      await commands.build(input[1], flags);
      break;
    case "reveal": {
      // TODO: simplify getting started guide
      await commands.generateEntry(input[1], input[2], flags);
      break;
    }
    case "dev":
      await commands.dev(input[1], flags);
      break;
    case "typegen":
      await commands.typegen(input[1], flags);
      break;
    default:
      // `react-router ./my-project` is shorthand for `react-router dev ./my-project`
      await commands.dev(input[0], flags);
  }
}
