#!/usr/bin/env node

import { existsSync, readdirSync } from "node:fs";
import { cp } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import prompts from "prompts";
import pc from "picocolors";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

copyPlayground();

async function copyPlayground() {
  let playgroundRootDir = path.join(__dirname, "../playground");

  let { templateName, playgroundName } = await prompts([
    {
      type: "select",
      name: "templateName",
      message: "Select a playground to copy",
      choices: readdirSync(playgroundRootDir).map((value) => ({ value })),
    },
    {
      type: "text",
      name: "playgroundName",
      message: "Enter a name for your playground",
      initial: (templateName) => `${templateName}-${Date.now()}`,
    },
  ]);

  let srcDir = path.join(playgroundRootDir, templateName);
  let destDir = path.join(__dirname, "../playground-local", playgroundName);
  let relativeDestDir = destDir.replace(process.cwd(), ".");

  if (existsSync(destDir)) {
    throw new Error(
      `A local playground with the name "${playgroundName}" already exists. Delete it first or use a different name.`,
    );
  }
  await cp(srcDir, destDir, { recursive: true });

  console.log(
    [
      "",
      pc.green(`Created local copy of "${templateName}"`),
      pc.green(`To start playground, run:`),
      "",
      `cd ${relativeDestDir}`,
      "pnpm dev",
    ].join("\n"),
  );
}
