import { join } from "path";
import glob from "fast-glob";

import { readConfig } from "../../../../config";
import * as jscodeshift from "../../jscodeshift";
import type { MigrationFunction } from "../../types";
import { cleanupPackageJson } from "./cleanupPackageJson";
import { convertTSConfigs } from "./convertTSConfigs";
import { convertTSFilesToJS } from "./convertTSFilesToJS";

const TRANSFORM_PATH = join(__dirname, "transform");

export const convertToJavaScript: MigrationFunction = async ({
  flags,
  projectDir,
}) => {
  let config = await readConfig(projectDir);

  // 1. Rename all tsconfig.json files to jsconfig.json
  convertTSConfigs(config.rootDirectory);

  // 2. Remove @types/* & TypeScript dependencies + typecheck script from package.json
  await cleanupPackageJson(config.rootDirectory);

  // 3. Run codemod
  let files = glob.sync("**/*.+(ts|tsx)", {
    absolute: true,
    cwd: config.rootDirectory,
    ignore: [`./${config.appDirectory}/**/*`, "**/node_modules/**"],
  });
  let codemodOk = await jscodeshift.run({
    files,
    flags,
    transformPath: TRANSFORM_PATH,
  });
  if (!codemodOk) {
    console.error("❌ I couldn't update your imports to JS.");
    if (!flags.debug) {
      console.log("👉 Try again with the `--debug` flag to see what failed.");
    }
    process.exit(1);
  }

  // 4. Convert all .ts files to .js
  convertTSFilesToJS(config.rootDirectory);
  console.log("✅ Your JavaScript looks good!");

  console.log("\n🚚 I've successfully migrated your project! 🎉");
};
