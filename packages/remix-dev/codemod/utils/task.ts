import ora from "ora";

import * as log from "./log";
import { CodemodError } from "./error";

export class TaskError extends Error {}

export const task = async <Result>(
  start: string,
  callback: (spinner: ora.Ora) => Promise<Result>,
  succeed: string | ((result: Result) => string) = start
): Promise<Result> => {
  let spinner = ora(start).start();
  try {
    let result = await callback(spinner);
    spinner.succeed(typeof succeed === "string" ? succeed : succeed(result));
    return result;
  } catch (error) {
    if (error instanceof CodemodError) {
      spinner.fail(error.message);
      if (error.additionalInfo) log.info(error.additionalInfo);
      throw new TaskError(error.message);
    }
    throw error;
  }
};
