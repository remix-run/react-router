// @ts-expect-error `@types/jscodeshift` doesn't have types for this
import { run as jscodeshift } from "jscodeshift/src/Runner";

import type { Flags } from "./flags";

type Options = Record<string, unknown>;
const toCLIOptions = (options: Options = {}) =>
  Object.entries(options)
    .filter(([_key, value]) => Boolean(value))
    .map(
      ([key, value]) =>
        `--${key}${typeof value === "boolean" ? "" : `=${value}`}`
    );

type Args<TransformOptions extends Options = Options> = {
  files: string[];
  flags: Flags;
  transformOptions?: TransformOptions;
  transformPath: string;
};
export const run = async <TransformOptions extends Options = Options>({
  files,
  flags: { debug, dry, print, runInBand },
  transformOptions,
  transformPath,
}: Args<TransformOptions>): Promise<boolean> => {
  let options = {
    babel: true, // without this, `jscodeshift` will not be able to parse TS transforms
    dry,
    extensions: "tsx,ts,jsx,js",
    failOnError: true,
    ignorePattern: ["**/node_modules/**", "**/.cache/**", "**/build/**"],
    parser: "tsx",
    print,
    runInBand,
    verbose: 2,
    ...transformOptions,
  };

  if (debug) {
    console.log(
      `Executing command: jscodeshift ${toCLIOptions(options).join(" ")}`
    );
  }

  try {
    let { error } = await jscodeshift(transformPath, files, options);
    return error === 0;
  } catch (error) {
    return false;
  }
};
