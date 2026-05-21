#!/usr/bin/env node
void (async () => {
  let { default: arg } = await import("arg");

  // Minimal replication of our actual parsing in `run.ts`. If not already set,
  // default `NODE_ENV` so React loads the proper version in its CJS entry script.
  // We have to do this before importing `run.ts` since that is what imports
  // `react` (indirectly via `react-router`)
  let args = arg({}, { argv: process.argv.slice(2), permissive: true });
  if (args._.length === 0 || args._[0] === "dev") {
    process.env.NODE_ENV = process.env.NODE_ENV ?? "development";
  } else {
    process.env.NODE_ENV = process.env.NODE_ENV ?? "production";
  }

  await import("./dist/cli/index.js");
})().catch((error) => {
  if (error) console.error(error);
  process.exit(1);
});
