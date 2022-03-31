import inquirer from "inquirer";

import { transformOptions } from "./transform-options";

export type Answers = {
  projectDir: string;
  transform: string;
};

type QuestionsArgs = {
  input: { projectDir: string; transform: string };
  showHelp: () => void;
};
export const questions = async ({
  input,
  showHelp,
}: QuestionsArgs): Promise<Answers> => {
  let { transform } = await inquirer
    .prompt<Pick<Answers, "transform">>([
      {
        type: "list",
        name: "transform",
        message: "Which transform would you like to apply?",
        when: !input.transform,
        pageSize: transformOptions.length,
        choices: transformOptions,
      },
    ])
    .catch((error) => {
      if (error.isTtyError) {
        showHelp();

        return {
          files: ".",
          transform: "",
        };
      }

      throw error;
    });

  return {
    projectDir: input.projectDir || process.env.REMIX_ROOT || process.cwd(),
    transform: input.transform || transform,
  };
};
