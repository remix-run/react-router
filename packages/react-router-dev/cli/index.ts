#!/usr/bin/env node
import { parseArgs } from "./parse";

let { input, flags, command } = parseArgs();

import("./run").then(({ run }) => {
  run(input, flags, command).then(
    () => {
      process.exit(0);
    },
    (error: unknown) => {
      if (error) console.error(error);
      process.exit(1);
    }
  );
});
