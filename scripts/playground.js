#!/usr/bin/env node

let path = require("node:path");
let fse = require("fs-extra");
let prompts = require("prompts");
let chalk = require("chalk");

copyPlayground();

async function copyPlayground() {
  let playgroundRootDir = path.join(__dirname, "../playground");

  let { templateName, playgroundName } = await prompts([
    {
      type: "select",
      name: "templateName",
      message: "Select a playground to copy",
      choices: fse.readdirSync(playgroundRootDir).map((value) => ({ value })),
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

  if (await fse.pathExists(destDir)) {
    throw new Error(
      `A local playground with the name "${playgroundName}" already exists. Delete it first or use a different name.`
    );
  }
  await fse.copy(srcDir, destDir, {});

  console.log(
    [
      "",
      chalk.green`Created local copy of "${templateName}"`,
      chalk.green`To start playground, run:`,
      "",
      `cd ${relativeDestDir}`,
      "pnpm dev",
    ].join("\n")
  );
}
