// Copies the canonical React Router agent skill into dist/ so it ships with the
// create-react-router package without duplicating source files in this package.
//
// This runs before packing/publishing (see `prepack` in package.json).

/* eslint-disable import/no-nodejs-modules -- This package lifecycle script runs in Node. */
import * as fs from "node:fs";
import * as path from "node:path";
import { fileURLToPath } from "node:url";

const PACKAGE_DIR = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);
const SOURCE_SKILL_DIR = path.resolve(
  PACKAGE_DIR,
  "../../.agents/skills/react-router",
);
const TARGET_SKILL_DIR = path.resolve(
  PACKAGE_DIR,
  "dist/agent-skills/react-router",
);
const BUILT_CLI_PATH = path.resolve(PACKAGE_DIR, "dist/cli.js");

if (!fs.existsSync(BUILT_CLI_PATH)) {
  throw new Error(
    "Could not find dist/cli.js. Run `pnpm run --filter create-react-router build` before packing or publishing.",
  );
}

if (!fs.existsSync(path.join(SOURCE_SKILL_DIR, "SKILL.md"))) {
  throw new Error(
    `Could not find React Router agent skill at ${SOURCE_SKILL_DIR}`,
  );
}

fs.rmSync(TARGET_SKILL_DIR, { recursive: true, force: true });
fs.mkdirSync(path.dirname(TARGET_SKILL_DIR), { recursive: true });
fs.cpSync(SOURCE_SKILL_DIR, TARGET_SKILL_DIR, { recursive: true });

let relativeTargetSkillDir = path.relative(PACKAGE_DIR, TARGET_SKILL_DIR);
console.log(`Copied React Router agent skill to ${relativeTargetSkillDir}/`);
