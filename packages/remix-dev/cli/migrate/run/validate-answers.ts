import { sync as globbySync } from "globby";

import * as colors from "../../colors";
import type { Answers } from "../questions";
import { migrationOptions } from "../migration-options";

const expandFilePathsIfNeeded = (filesBeforeExpansion: string) => {
  let shouldExpandFiles = filesBeforeExpansion.includes("*");

  return shouldExpandFiles
    ? globbySync(filesBeforeExpansion)
    : [filesBeforeExpansion];
};

export const validateAnswers = ({ projectDir, migration }: Answers) => ({
  files: validateProjectDir(projectDir),
  migration: validateMigration(migration),
});

const validateProjectDir = (projectDir: Answers["projectDir"]) => {
  let expandedFiles = expandFilePathsIfNeeded(projectDir);

  if (expandedFiles.length === 0) {
    throw Error(`No files found matching ${projectDir}`);
  }

  return expandedFiles;
};

const validateMigration = (
  migration: Answers["migration"]
): typeof migrationOptions[number]["value"] => {
  if (!migrationOptions.find(({ value }) => value === migration)) {
    throw Error(`
${colors.error("Invalid transform choice, pick one of:")} 
${migrationOptions.map(({ value }) => colors.error(`- ${value}`)).join("\n")}   
    `);
  }

  return migration as typeof migrationOptions[number]["value"];
};
