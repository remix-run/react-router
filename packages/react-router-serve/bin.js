#!/usr/bin/env node

// If not already set, default `NODE_ENV=production` so React loads the proper
// version in it's CJS entry script
process.env.NODE_ENV = process.env.NODE_ENV ?? "production";

require("./dist/cli");
