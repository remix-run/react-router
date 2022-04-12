import fse from "fs-extra";

import type { Flags } from "./flags";
import { migrations } from "./migrations";
import type { Migration } from "./types";
import * as colors from "../../colors";

const parseMigration = (migrationId: string): Migration => {
  let migration = migrations.find(({ id }) => id === migrationId);
  if (migration === undefined) {
    throw Error(`
${colors.error("Invalid migration. Pick one of:")}
${migrations.map((m) => colors.error(`- ${m.id}`)).join("\n")}
    `);
  }
  return migration;
};

const checkProjectDir = (projectDir: string): string => {
  if (!fse.existsSync(projectDir)) {
    throw Error(`Project path does not exist: ${projectDir}`);
  }
  if (!fse.lstatSync(projectDir).isDirectory()) {
    throw Error(`Project path is not a directory: ${projectDir}`);
  }
  return projectDir;
};

export const run = async (input: {
  migrationId: string;
  projectDir: string;
  flags: Flags;
}) => {
  let projectDir = checkProjectDir(input.projectDir);
  let migration = parseMigration(input.migrationId);
  return migration.function({ projectDir, flags: input.flags });
};
