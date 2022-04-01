import type { Answers } from "../../questions";

export type TransformArgs = {
  answers: Answers;
  files: string[];
  flags: {
    dry?: boolean;
    force?: boolean;
    print?: boolean;
    runInBand?: boolean;
  };
};
export type Transform = (args: TransformArgs) => void | Promise<void>;
