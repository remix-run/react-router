import inquirer from "inquirer";

import { migrationOptions } from "./migration-options";

export type Answers = {
  projectDir: string;
  migration: string;
};

type QuestionsArgs = {
  input: { projectDir?: string; migration?: string };
  showHelp: () => void;
};
export const questions = async ({
  input,
  showHelp,
}: QuestionsArgs): Promise<Answers> => {
  let { migration } = await inquirer
    .prompt<Pick<Answers, "migration">>([
      {
        type: "list",
        name: "migration",
        message: "Which migration would you like to apply?",
        when: !input.migration,
        pageSize: migrationOptions.length,
        choices: migrationOptions,
      },
    ])
    .catch((error) => {
      if (error.isTtyError) {
        showHelp();

        return {
          files: ".",
          migration: "",
        };
      }

      throw error;
    });

  return {
    projectDir: input.projectDir || process.env.REMIX_ROOT || process.cwd(),
    migration: input.migration || migration,
  };
};
