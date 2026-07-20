// Copies a subset of the repo's `docs/` into this package so it ships to npm and
// is available via `react-router/docs/...` package exports for AI coding agents
// and the React Router agent skills.
//
// This runs as part of the package build (see `wireit.build` in package.json).

/* eslint-disable import/no-nodejs-modules -- This package build script runs in Node. */
import * as fs from "node:fs";
import * as path from "node:path";
import { fileURLToPath } from "node:url";

const PACKAGE_DIR = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);
const SOURCE_DOCS_DIR = path.resolve(PACKAGE_DIR, "../../docs");
const TARGET_DOCS_DIR = path.resolve(PACKAGE_DIR, "docs");

const EXCLUDED_TOP_LEVEL_DIRS = new Set(["api", "community", "tutorials"]);
const EXCLUDED_FILES = new Set(["elements.md", "prettier.config.js"]);

function copyDocs(relativeDir = "") {
  let copied = 0;
  let sourceDir = path.join(SOURCE_DOCS_DIR, relativeDir);

  for (let entry of fs.readdirSync(sourceDir, { withFileTypes: true })) {
    let relativePath = relativeDir
      ? `${relativeDir}/${entry.name}`
      : entry.name;

    if (entry.isDirectory()) {
      if (relativeDir === "" && EXCLUDED_TOP_LEVEL_DIRS.has(entry.name)) {
        continue;
      }

      copied += copyDocs(relativePath);
      continue;
    }

    if (EXCLUDED_FILES.has(relativePath)) continue;
    if (!entry.isFile() || !entry.name.endsWith(".md")) continue;

    let source = path.join(SOURCE_DOCS_DIR, relativePath);
    let target = path.join(TARGET_DOCS_DIR, relativePath);

    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.copyFileSync(source, target);
    copied++;
  }

  return copied;
}

if (!fs.existsSync(SOURCE_DOCS_DIR)) {
  throw new Error(`Could not find docs directory at ${SOURCE_DOCS_DIR}`);
}

fs.rmSync(TARGET_DOCS_DIR, { recursive: true, force: true });

let copied = copyDocs();
let relativeTargetDocsDir = path.relative(PACKAGE_DIR, TARGET_DOCS_DIR);

console.log(`Copied ${copied} doc file(s) to ${relativeTargetDocsDir}/`);
