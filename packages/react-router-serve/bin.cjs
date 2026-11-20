#!/usr/bin/env node

// If not already set, default `NODE_ENV=production` so React loads the proper
// version in its CJS entry script
process.env.NODE_ENV = process.env.NODE_ENV ?? "production";

void import("./dist/cli.js").catch((error) => {
  if (error) console.error(error);
  process.exit(1);
});
