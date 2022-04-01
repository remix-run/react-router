import { sync as execaSync } from "execa";

const jscodeshiftExecutable = require.resolve(".bin/jscodeshift");

type ExtraOptions = Record<string, unknown>;
const normalizeExtraOptions = (extraOptions: ExtraOptions = {}) =>
  Object.entries(extraOptions)
    .filter(([_key, value]) => Boolean(value))
    .map(
      ([key, value]) =>
        `--${key}${typeof value === "boolean" ? "" : `=${value}`}`
    );

type JSCodeshiftTransformArgs<ExtraOptionsType extends ExtraOptions = {}> = {
  extraOptions?: ExtraOptionsType;
  files: string[];
  flags: { dry?: boolean; print?: boolean; runInBand?: boolean };
  transformPath: string;
};
export const JSCodeshiftTransform = <
  ExtraOptionsType extends ExtraOptions = {}
>({
  extraOptions,
  files,
  flags: { dry, print, runInBand },
  transformPath,
}: JSCodeshiftTransformArgs<ExtraOptionsType>) => {
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
    ...normalizeExtraOptions(extraOptions),
  ];

  console.log(`Executing command: jscodeshift ${args.join(" ")}`);

  let result = execaSync(jscodeshiftExecutable, args, {
    stdio: "inherit",
    stripFinalNewline: false,
  });

  if (result.failed) {
    throw new Error(`jscodeshift exited with code ${result.exitCode}`);
  }
};
