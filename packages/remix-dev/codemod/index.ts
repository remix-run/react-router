import * as path from "path";

import { blue, yellow } from "../colors";
import * as git from "./utils/git";
import * as log from "./utils/log";
import { task } from "./utils/task";
import type { Options } from "./codemod";
import replaceRemixMagicImports from "./replace-remix-magic-imports";
import { CodemodError } from "./utils/error";

const codemods = {
  "replace-remix-magic-imports": replaceRemixMagicImports,
} as const;

type CodemodName = keyof typeof codemods;

const isCodemodName = (maybe: string): maybe is CodemodName =>
  Object.keys(codemods).includes(maybe);

const availableCodemodsText = [
  "Available codemods:",
  ...Object.keys(codemods)
    .sort()
    .map((name) => `- ${name}`),
].join("\n");

export default async (
  projectDir: string,
  codemodName: string,
  { dry = false, force = false }: Partial<Options> = {}
) => {
  if (dry) log.info(`${yellow("! Dry mode")}: files will not be overwritten`);
  if (force)
    log.info(`${yellow("! Force mode")}: uncommitted changes may be lost`);

  let gitStatus = await git.status(projectDir);
  if (!dry && !force && gitStatus === "not a git repository") {
    throw new CodemodError(
      `${path.resolve(projectDir)} is not a git repository`,
      "To override this safety check, use the --force flag"
    );
  }
  if (!dry && !force && gitStatus === "dirty") {
    throw new CodemodError(
      `${path.resolve(projectDir)} has uncommitted changes`,
      [
        "Stash or commit your changes before running codemods",
        "To override this safety check, use the --force flag",
      ].join("\n")
    );
  }

  let codemod = await task(
    `Finding codemod: ${blue(codemodName)}`,
    async () => {
      if (!isCodemodName(codemodName)) {
        throw new CodemodError(
          `Unrecognized codemod: ${blue(codemodName)}`,
          availableCodemodsText
        );
      }
      return codemods[codemodName];
    },
    `Found codemod: ${blue(codemodName)}`
  );

  await codemod(projectDir, { dry, force });
};
