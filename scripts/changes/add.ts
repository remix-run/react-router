/**
 * Interactive script to create a change file
 *
 * Usage:
 *   node scripts/changes/add.ts
 */
import * as fs from "node:fs";
import * as path from "node:path";
import prompts from "prompts";
import { getAllPackageDirNames, getPackagePath } from "../utils/packages.ts";

const bumpTypes = ["patch", "minor", "major", "unstable"] as const;

interface Package {
  dirName: string;
  name: string;
}

console.log("\nCreate a change file\n");

let packages = getPackages();

// Abort cleanly on Ctrl-C
let cancelled = false;
const onCancel = () => {
  cancelled = true;
  return false; // stops prompts from throwing
};

// 1. Select packages
const { selectedPackages } = await prompts(
  {
    type: "multiselect",
    name: "selectedPackages",
    message: "Select packages",
    choices: packages.map((pkg) => ({ title: pkg.name, value: pkg })),
    min: 1,
    hint: "Space to select, arrow keys to navigate, Enter to confirm",
  },
  { onCancel },
);

if (cancelled || !selectedPackages) process.exit(0);

// 2. Select bump type
const { bump } = await prompts(
  {
    type: "select",
    name: "bump",
    message: "Change type",
    choices: bumpTypes.map((t) => ({ title: t, value: t })),
    initial: 0,
  },
  { onCancel },
);

if (cancelled || bump == null) process.exit(0);

// 3. Description
const { description } = await prompts(
  {
    type: "text",
    name: "description",
    message: "Description",
    validate: (v: string) =>
      v.trim().length > 0 ? true : "Description cannot be empty",
  },
  { onCancel },
);

if (cancelled || description == null) process.exit(0);

// 4. Derive slug and write files
let slug = toSlug(description.trim());
let fileName = `${bump}.${slug}.md`;

console.log();
for (let pkg of selectedPackages as Package[]) {
  let changesDir = path.join(getPackagePath(pkg.dirName), ".changes");
  let filePath = path.join(changesDir, fileName);

  if (!fs.existsSync(changesDir)) {
    fs.mkdirSync(changesDir, { recursive: true });
  }

  if (fs.existsSync(filePath)) {
    console.warn(
      `⚠️  File already exists, skipping: packages/${pkg.dirName}/.changes/${fileName}`,
    );
    continue;
  }

  fs.writeFileSync(filePath, description.trim() + "\n", "utf-8");
  console.log(`✅  ${pkg.name}: packages/${pkg.dirName}/.changes/${fileName}`);
}

console.log();

// --- Utils ---

function getPackages(): Package[] {
  return getAllPackageDirNames()
    .map((dirName) => {
      let pkgJsonPath = path.join(getPackagePath(dirName), "package.json");
      if (!fs.existsSync(pkgJsonPath)) return null;
      let { name } = JSON.parse(fs.readFileSync(pkgJsonPath, "utf-8"));
      return { dirName, name } as Package;
    })
    .filter((p): p is Package => p !== null)
    .sort((a, b) => {
      const order = (name: string) => {
        if (name === "react-router") return 0;
        if (name === "react-router-dom") return 1;
        if (name.startsWith("@react-router/")) return 2;
        return 3;
      };
      const oa = order(a.name);
      const ob = order(b.name);
      if (oa !== ob) return oa - ob;
      return a.name.localeCompare(b.name);
    });
}

// Common English stop words that add no meaning to a filename slug
const STOP_WORDS = new Set([
  "a", "an", "the",
  "and", "or", "but", "so", "nor", "yet",
  "in", "on", "at", "by", "for", "to", "of", "from", "with", "into", "onto",
  "about", "as", "via",
  "is", "are", "was", "were", "be", "been", "being",
  "have", "has", "had",
  "do", "does", "did",
  "it", "its", "this", "that", "these", "those",
  "we", "us", "our", "i", "me", "my", "you", "your",
  "he", "him", "his", "she", "her", "they", "them", "their",
  "now", "then", "also", "just",
]);

/**
 * Converts a free-text description into a kebab-case slug of at most 6
 * meaningful words. Stop words and non-alphanumeric characters are stripped.
 */
function toSlug(description: string): string {
  return (
    description
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, "")
      .trim()
      .split(/\s+/)
      .filter((w) => !STOP_WORDS.has(w))
      .slice(0, 6)
      .join("-") || "change"
  );
}
