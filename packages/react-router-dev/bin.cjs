#!/usr/bin/env node
let { parseArgs } = require("node:util");

const commands = new Set(["build", "dev", "reveal", "routes", "typegen"]);

void (async () => {
  // Minimal replication of our actual parsing in `run.ts`. If not already set,
  // default `NODE_ENV` so React loads the proper version in its CJS entry script.
  // We have to do this before importing `run.ts` since that is what imports
  // `react` (indirectly via `react-router`)
  let { positionals } = parseArgs({
    args: process.argv.slice(2),
    allowPositionals: true,
    strict: false,
  });
  let command = positionals.find((positional) => commands.has(positional));
  if (!command || command === "dev") {
    process.env.NODE_ENV = process.env.NODE_ENV ?? "development";
  } else {
    process.env.NODE_ENV = process.env.NODE_ENV ?? "production";
  }

  await import("./dist/cli/index.js");
})().catch((error) => {
  if (error) console.error(error);
  process.exit(1);
});
