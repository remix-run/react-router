import { sync as execaSync } from "execa";

const jscodeshiftExecutable = require.resolve(".bin/jscodeshift");

type Options = Record<string, unknown>;
const toFlags = (options: Options = {}) =>
  Object.entries(options)
    .filter(([_key, value]) => Boolean(value))
    .map(
      ([key, value]) =>
        `--${key}${typeof value === "boolean" ? "" : `=${value}`}`
    );

type Args<TransformOptions extends Options = {}> = {
  transformPath: string;
  files: string[];
  flags: { dry?: boolean; print?: boolean; runInBand?: boolean };
  transformOptions?: TransformOptions;
};
export const run = <TransformOptions extends Options = {}>({
  transformPath,
  files,
  flags: { dry, print, runInBand },
  transformOptions,
}: Args<TransformOptions>) => {
  let args = [
    dry ? "--dry" : "",
    print ? "--print" : "",
    runInBand ? "--run-in-band" : "",
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

  console.log(
    `Executing command: jscodeshift ${args
      .filter((arg) => arg !== "")
      .join(" ")}`
  );

  let result = execaSync(jscodeshiftExecutable, args, {
    stdio: "inherit",
    stripFinalNewline: false,
  });

  if (result.failed) {
    throw new Error(`jscodeshift exited with code ${result.exitCode}`);
  }
};
