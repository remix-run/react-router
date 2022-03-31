import { checkGitStatus } from "../../check-git-status";
import type { transformOptions } from "../transform-options";
import type { Transform, TransformArgs } from "./transforms";
import { updateRemixImports } from "./transforms";
import { validateAnswers } from "./validate-answers";

const transformFunctionByName: Record<
  typeof transformOptions[number]["value"],
  Transform
> = {
  "update-remix-imports": updateRemixImports,
};

type RunArgs = Pick<TransformArgs, "answers" | "flags">;
export const run = async ({ answers, flags }: RunArgs) => {
  let { files, transform } = validateAnswers(answers);

  if (!flags.dry) {
    checkGitStatus({ force: flags.force, projectDir: answers.projectDir });
  }

  let transformFunction = transformFunctionByName[transform];
  return transformFunction({ answers, files, flags });
};
