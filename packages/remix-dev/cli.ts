import type { AnyFlags } from "meow";
import meow from "meow";

import * as commands from "./cli/commands";

const helpText = `
Usage
  $ remix build [remixRoot]
  $ remix run [remixRoot]
  $ remix setup [remixPlatform]

Options
  --help              Print this help message and exit
  --version, -v       Print the CLI version and exit

Values
  [remixPlatform]     "node" is currently the only platform

Examples
  $ remix build my-website
  $ remix run my-website
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
  case "dev": // `remix dev` is alias for `remix watch`
  case "watch":
    commands.watch(cli.input[1], process.env.NODE_ENV);
    break;
  case "setup":
    commands.setup(cli.input[1]);
    break;
  case "run":
    if (!process.env.NODE_ENV) process.env.NODE_ENV = "development";
    commands.run(cli.input[1], process.env.NODE_ENV);
    break;
  default:
    // `remix ./my-project` is shorthand for `remix run ./my-project`
    if (!process.env.NODE_ENV) process.env.NODE_ENV = "development";
    commands.run(cli.input[0], process.env.NODE_ENV);
}
