import type { AnyFlags } from "meow";
import meow from "meow";

import * as commands from "./cli/commands";

const helpText = `
Usage
  $ remix build [remixRoot]
  $ remix run [remixRoot]

Options
  --help              Print this help message and exit
  --version, -v       Print the CLI version and exit

Examples
  $ remix build my-website
  $ remix run my-website
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

// In 0.17 we only have
// - remix build (build2)
// - remix dev (dev)
// - remix run (run3)
switch (cli.input[0]) {
  // rollup
  case "build": // gone in 0.17
    commands.build(cli.input[1], process.env.NODE_ENV);
    break;
  case "run": // gone in 0.17
    commands.run(cli.input[1]);
    break;

  // esbuild
  case "build2": // becomes `remix build` in 0.17
    commands.build2(cli.input[1], process.env.NODE_ENV);
    break;

  // these three are all the same
  case "watch2": // gone in 0.17
    commands.watch2(cli.input[1], process.env.NODE_ENV);
    break;
  case "run2": // gone in 0.17
    commands.run2(cli.input[1]);
    break;
  case "dev": // stays in 0.17
    commands.watch2(cli.input[1], process.env.NODE_ENV);
    break;

  // built-in app/dev server
  case "run3": // becomes `remix run` in 0.17
    commands.run3(cli.input[1]);
    break;

  default:
    // `remix my-project` is shorthand for `remix run3 my-project`
    commands.run3(cli.input[0]);
}
