import type { AnyFlags } from "meow";
import meow from "meow";

import * as commands from "./cli/commands";

const helpText = `
Usage
  $ remix build [remixRoot]
  $ remix dev [remixRoot]
  $ remix setup [remixPlatform]

Options
  --help              Print this help message and exit
  --version, -v       Print the CLI version and exit

Values
  [remixPlatform]     "node" is currently the only platform

Examples
  $ remix build my-website
  $ remix dev my-website
  $ remix setup node
`;

const flags: AnyFlags = {
  version: {
    type: "boolean",
    alias: "v"
  }
};

const cli = meow(helpText, {
  autoHelp: true,
  autoVersion: false,
  description: false,
  flags
});

if (cli.flags.version) {
  cli.showVersion();
}

switch (cli.input[0]) {
  case "build":
    commands.build(cli.input[1], process.env.NODE_ENV);
    break;
  case "watch":
    commands.watch(cli.input[1], process.env.NODE_ENV);
    break;
  case "setup":
    commands.setup(cli.input[1]);
    break;
  case "dev":
    if (!process.env.NODE_ENV) process.env.NODE_ENV = "development";
    commands.dev(cli.input[1], process.env.NODE_ENV);
    break;
  default:
    // `remix ./my-project` is shorthand for `remix dev ./my-project`
    if (!process.env.NODE_ENV) process.env.NODE_ENV = "development";
    commands.dev(cli.input[0], process.env.NODE_ENV);
}
