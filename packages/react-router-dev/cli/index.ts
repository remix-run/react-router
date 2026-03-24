#!/usr/bin/env node
import { run } from "./run";

run(undefined, { isMain: true }).then(
  () => {
    process.exit(0);
  },
  (error: unknown) => {
    if (error) console.error(error);
    process.exit(1);
  },
);
