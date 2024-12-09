#!/usr/bin/env node
import { parseArgs } from "./parse";

let { input, flags, command } = parseArgs();

// If not already set, default `NODE_ENV` so React loads the proper
// version in it's CJS entry script.  We have to do this before importing `run.ts`
// since that is what imports `react` (indirectly via `react-router`)
if (command === "dev") {
  process.env.NODE_ENV = process.env.NODE_ENV ?? "development";
} else {
  process.env.NODE_ENV = process.env.NODE_ENV ?? "production";
}

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
