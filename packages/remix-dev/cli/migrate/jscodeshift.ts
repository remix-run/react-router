import { sync as execaSync } from "execa";

import type { Flags } from "./flags";

const jscodeshiftExecutable = require.resolve(".bin/jscodeshift");

type Options = Record<string, unknown>;
const toFlags = (options: Options = {}) =>
  Object.entries(options)
    .filter(([_key, value]) => Boolean(value))
    .map(
      ([key, value]) =>
        `--${key}${typeof value === "boolean" ? "" : `=${value}`}`
    );

type Args<TransformOptions> = {
  transformPath: string;
  files: string[];
  flags: Flags;
  transformOptions?: TransformOptions;
};
export const run = <TransformOptions>({
  transformPath,
  files,
  flags: { debug, dry, print, runInBand },
  transformOptions,
}: Args<TransformOptions>): boolean => {
  let args = [
    dry ? "--dry" : "",
    print ? "--print" : "",
    runInBand ? "--run-in-band" : "",
    "--fail-on-error",
    "--verbose=2",
    "--ignore-pattern=**/node_modules/**",
    "--ignore-pattern=**/.cache/**",
    "--ignore-pattern=**/build/**",
    "--extensions=tsx,ts,jsx,js",
    "--parser=tsx",
    ...["--transform", transformPath],
    ...files,
    ...toFlags(transformOptions || {}),
  ];

  if (debug) {
    console.log(
      `Executing command: jscodeshift ${args
        .filter((arg) => arg !== "")
        .join(" ")}`
    );
  }

  try {
    let result = execaSync(jscodeshiftExecutable, args, {
      stdio: debug ? "inherit" : "ignore",
      stripFinalNewline: false,
    });
    return result.exitCode === 0;
  } catch (error) {
    return false;
  }
};
