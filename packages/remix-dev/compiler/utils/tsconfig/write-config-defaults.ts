import * as path from "path";
import fse from "fs-extra";
import JSON5 from "json5";
import type { TsConfigJson } from "type-fest";
import prettier from "prettier";

import * as colors from "../../../colors";

// These are suggested values and will be set when not present in the
// tsconfig.json
let suggestedCompilerOptions: TsConfigJson.CompilerOptions = {
  forceConsistentCasingInFileNames: true,
  target: "es2019",
  lib: ["DOM", "DOM.Iterable", "ES2019"] as TsConfigJson.CompilerOptions.Lib[],
  allowJs: true,
  strict: true,
  paths: {
    "~/*": ["./app/*"],
  },
};

// These values are required and cannot be changed by the user
// Keep this in sync with esbuild
let requiredCompilerOptions: TsConfigJson.CompilerOptions = {
  esModuleInterop: true,
  isolatedModules: true,
  jsx: "react-jsx",
  moduleResolution: "node",
  resolveJsonModule: true,
  noEmit: true,
};

// taken from https://github.com/sindresorhus/ts-extras/blob/781044f0412ec4a4224a1b9abce5ff0eacee3e72/source/object-keys.ts
type ObjectKeys<T extends object> = `${Exclude<keyof T, symbol>}`;
function objectKeys<Type extends object>(value: Type): Array<ObjectKeys<Type>> {
  return Object.keys(value) as Array<ObjectKeys<Type>>;
}

export function writeConfigDefaults(configPath: string) {
  let configContents = fse.readFileSync(configPath, "utf-8");
  let config = JSON5.parse(configContents);
  let configType = path.basename(configPath);
  if (!config.compilerOptions) {
    config.compilerOptions = {};
  }
  let suggestedChanges = [];
  let requiredChanges = [];
  if (!("include" in config)) {
    config.include = ["remix.env.d.ts", "**/*.ts", "**/*.tsx"];
    suggestedChanges.push(
      colors.blue("include") +
        " was set to " +
        colors.bold(`['remix.env.d.ts', '**/*.ts', '**/*.tsx']`)
    );
  }
  // TODO: check for user's typescript version and only add baseUrl if < 4.1
  if (!("baseUrl" in config.compilerOptions)) {
    let baseUrl = path.relative(process.cwd(), path.dirname(configPath)) || ".";
    config.compilerOptions.baseUrl = baseUrl;
    requiredChanges.push(
      colors.blue("compilerOptions.baseUrl") +
        " was set to " +
        colors.bold(`'${baseUrl}'`)
    );
  }
  for (let key of objectKeys(suggestedCompilerOptions)) {
    if (!(key in config.compilerOptions)) {
      config.compilerOptions[key] = suggestedCompilerOptions[key] as any;
      suggestedChanges.push(
        colors.blue("compilerOptions." + key) +
          " was set to " +
          colors.bold(`'${suggestedCompilerOptions[key]}'`)
      );
    }
  }
  for (let key of objectKeys(requiredCompilerOptions)) {
    if (config.compilerOptions[key] !== requiredCompilerOptions[key]) {
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
