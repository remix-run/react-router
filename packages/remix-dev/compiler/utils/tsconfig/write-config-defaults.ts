import * as path from "path";
import fse from "fs-extra";
import type { TsConfigJson } from "type-fest";
import prettier from "prettier";
import { loadTsconfig } from "tsconfig-paths/lib/tsconfig-loader";
import JSON5 from "json5";

import * as colors from "../../../colors";

// These are suggested values and will be set when not present in the
// tsconfig.json
let suggestedCompilerOptions: TsConfigJson.CompilerOptions = {
  allowJs: true,
  forceConsistentCasingInFileNames: true,
  lib: ["DOM", "DOM.Iterable", "ES2019"],
  paths: {
    "~/*": ["./app/*"],
  },
  strict: true,
  target: "ES2019",
};

// These values are required and cannot be changed by the user
// Keep this in sync with esbuild
let requiredCompilerOptions: TsConfigJson.CompilerOptions = {
  esModuleInterop: true,
  isolatedModules: true,
  jsx: "react-jsx",
  moduleResolution: "node",
  noEmit: true,
  resolveJsonModule: true,
};

// taken from https://github.com/sindresorhus/ts-extras/blob/781044f0412ec4a4224a1b9abce5ff0eacee3e72/source/object-keys.ts
type ObjectKeys<T extends object> = `${Exclude<keyof T, symbol>}`;
function objectKeys<Type extends object>(value: Type): Array<ObjectKeys<Type>> {
  return Object.keys(value) as Array<ObjectKeys<Type>>;
}

export function writeConfigDefaults(configPath: string) {
  // check files exist
  if (!fse.existsSync(configPath)) return;

  // this will be the *full* tsconfig.json with any extensions deeply merged
  let fullConfig = loadTsconfig(configPath) as TsConfigJson | undefined;
  // this will be the user's actual tsconfig file
  let configContents = fse.readFileSync(configPath, "utf8");

  let config: TsConfigJson | undefined;
  try {
    config = JSON5.parse(configContents);
  } catch (error: unknown) {}

  if (!fullConfig || !config) {
    // how did we get here? we validated a tsconfig existed in the first place
    console.warn(
      "This should never happen, please open an issue with a reproduction https://github.com/remix-run/remix/issues/new"
    );
    return;
  }

  let configType = path.basename(configPath);
  // sanity checks to make sure we can write the compilerOptions
  if (!fullConfig.compilerOptions) fullConfig.compilerOptions = {};
  if (!config.compilerOptions) config.compilerOptions = {};

  let suggestedChanges = [];
  let requiredChanges = [];

  if (!("include" in fullConfig)) {
    config.include = ["remix.env.d.ts", "**/*.ts", "**/*.tsx"];
    suggestedChanges.push(
      colors.blue("include") +
        " was set to " +
        colors.bold(`['remix.env.d.ts', '**/*.ts', '**/*.tsx']`)
    );
  }
  // TODO: check for user's typescript version and only add baseUrl if < 4.1
  if (!("baseUrl" in fullConfig.compilerOptions)) {
    let baseUrl = path.relative(process.cwd(), path.dirname(configPath)) || ".";
    config.compilerOptions.baseUrl = baseUrl;
    requiredChanges.push(
      colors.blue("compilerOptions.baseUrl") +
        " was set to " +
        colors.bold(`'${baseUrl}'`)
    );
  }
  for (let key of objectKeys(suggestedCompilerOptions)) {
    if (!(key in fullConfig.compilerOptions)) {
      config.compilerOptions[key] = suggestedCompilerOptions[key] as any;
      suggestedChanges.push(
        colors.blue("compilerOptions." + key) +
          " was set to " +
          colors.bold(`'${suggestedCompilerOptions[key]}'`)
      );
    }
  }
  for (let key of objectKeys(requiredCompilerOptions)) {
    if (fullConfig.compilerOptions[key] !== requiredCompilerOptions[key]) {
      config.compilerOptions[key] = requiredCompilerOptions[key] as any;
      requiredChanges.push(
        colors.blue("compilerOptions." + key) +
          " was set to " +
          colors.bold(`'${requiredCompilerOptions[key]}'`)
      );
    }
  }
  if (suggestedChanges.length > 0 || requiredChanges.length > 0) {
    fse.writeFileSync(
      configPath,
      prettier.format(JSON.stringify(config, null, 2), {
        parser: "json",
      })
    );
  }
  if (suggestedChanges.length > 0) {
    console.log(
      `The following suggested values were added to your ${colors.blue(
        `"${configType}"`
      )}. These values ${colors.bold(
        "can be changed"
      )} to fit your project's needs:\n`
    );

    suggestedChanges.forEach((change) => console.log(`\t- ${change}`));
    console.log("");
  }

  if (requiredChanges.length > 0) {
    console.log(
      `The following ${colors.bold(
        "mandatory changes"
      )} were made to your ${colors.blue(configType)}:\n`
    );

    requiredChanges.forEach((change) => console.log(`\t- ${change}`));
    console.log("");
  }
}
