import meow from "meow";

import * as commands from "./cli/commands";

const helpText = `
Usage
  $ remix build [remixRoot]
  $ remix dev [remixRoot]
  $ remix setup [remixPlatform]
  $ remix routes [remixRoot]

Options
  --help              Print this help message and exit
  --version, -v       Print the CLI version and exit

  --json              Print the routes as JSON (remix routes only)
  --sourcemap         Generate source maps (remix build only)

Values
  [remixPlatform]     Can be one of: node, cloudflare-pages, cloudflare-workers, or deno

Examples
  $ remix build my-website
  $ remix dev my-website
  $ remix setup node
  $ remix routes my-website
`;

const cli = meow(helpText, {
  autoHelp: true,
  autoVersion: false,
  description: false,
  flags: {
    version: {
      type: "boolean",
      alias: "v"
    },
    json: {
      type: "boolean"
    },
    sourcemap: {
      type: "boolean"
    }
  }
});

if (cli.flags.version) {
  cli.showVersion();
}

function handleError(error: Error) {
  console.error(error.message);
  process.exit(1);
}

switch (cli.input[0]) {
  case "routes":
    commands
      .routes(cli.input[1], cli.flags.json ? "json" : "jsx")
      .catch(handleError);
    break;
  case "build":
    if (!process.env.NODE_ENV) process.env.NODE_ENV = "production";
    commands
      .build(cli.input[1], process.env.NODE_ENV, cli.flags.sourcemap)
      .catch(handleError);
    break;
  case "watch":
    if (!process.env.NODE_ENV) process.env.NODE_ENV = "development";
    commands.watch(cli.input[1], process.env.NODE_ENV).catch(handleError);
    break;
  case "setup":
    commands.setup(cli.input[1]).catch(handleError);
    break;
  case "dev":
    if (!process.env.NODE_ENV) process.env.NODE_ENV = "development";
    commands.dev(cli.input[1], process.env.NODE_ENV).catch(handleError);
    break;
  default:
    // `remix ./my-project` is shorthand for `remix dev ./my-project`
    if (!process.env.NODE_ENV) process.env.NODE_ENV = "development";
    commands.dev(cli.input[0], process.env.NODE_ENV).catch(handleError);
}
