#!/usr/bin/env node
import process from "node:process";

import { createReactRouter } from "./index";

process.on("SIGINT", () => process.exit(0));
process.on("SIGTERM", () => process.exit(0));

let argv = process.argv.slice(2).filter((arg) => arg !== "--");

createReactRouter(argv).then(
  () => process.exit(0),
  () => process.exit(1)
);
