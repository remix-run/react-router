import path from "path";
import fse from "fs-extra";
import glob from "fast-glob";
import * as babel from "@babel/core";
// @ts-expect-error these modules dont have types
import babelPluginSyntaxJSX from "@babel/plugin-syntax-jsx";
// @ts-expect-error these modules dont have types
import babelPresetTypeScript from "@babel/preset-typescript";
import prettier from "prettier";

function convertToJavaScript(
  filename: string,
  source: string,
  projectDir: string
): string {
  let result = babel.transformSync(source, {
    filename,
    presets: [[babelPresetTypeScript, { jsx: "preserve" }]],
    plugins: [babelPluginSyntaxJSX],
    compact: false,
    retainLines: true,
    cwd: projectDir,
  });

  if (!result || !result.code) {
    throw new Error("Could not parse typescript");
  }

  /*
    Babel's `compact` and `retainLines` options are both bad at formatting code.
    Use Prettier for nicer formatting.
  */
  return prettier.format(result.code, { parser: "babel" });
}

export async function convertTemplateToJavaScript(projectDir: string) {
  // 1. Convert all .ts files in the template to .js
  let entries = glob.sync("**/*.+(ts|tsx)", {
    cwd: projectDir,
    absolute: true,
    ignore: ["**/node_modules/**"],
  });
  for (let entry of entries) {
    if (entry.endsWith(".d.ts")) {
      fse.removeSync(entry);
      continue;
    }

    let contents = fse.readFileSync(entry, "utf8");
    let filename = path.basename(entry);
    let javascript = convertToJavaScript(filename, contents, projectDir);

    fse.writeFileSync(entry, javascript, "utf8");
    if (entry.endsWith(".tsx")) {
      fse.renameSync(entry, entry.replace(/\.tsx?$/, ".jsx"));
    } else {
      fse.renameSync(entry, entry.replace(/\.ts?$/, ".js"));
    }
  }

  // 2. Rename the tsconfig.json to jsconfig.json
  if (fse.existsSync(path.join(projectDir, "tsconfig.json"))) {
    fse.renameSync(
      path.join(projectDir, "tsconfig.json"),
      path.join(projectDir, "jsconfig.json")
    );
  }

  // 3. Remove @types/* and typescript from package.json
  let packageJsonPath = path.join(projectDir, "package.json");
  if (!fse.existsSync(packageJsonPath)) {
    throw new Error("Could not find package.json");
  }
  let pkg = JSON.parse(fse.readFileSync(packageJsonPath, "utf8"));
  let devDeps = pkg.devDependencies || {};
  devDeps = Object.fromEntries(
    Object.entries(devDeps).filter(([name]) => {
      return !name.startsWith("@types/") && name !== "typescript";
    })
  );
  pkg.devDependencies = devDeps;
  fse.writeJSONSync(packageJsonPath, pkg, {
    spaces: 2,
  });
}
