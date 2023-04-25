import NpmCliPackageJson from "@npmcli/package-json";
import glob from "fast-glob";
import fs from "fs";
import { maxBy } from "lodash";
import semver from "semver";

import { blue, cyan, gray } from "../../colors";
import { readConfig } from "../../config";
import { detectPackageManager } from "../../cli/detectPackageManager";
import type { Codemod } from "../codemod";
import { CodemodError } from "../utils/error";
import * as log from "../utils/log";
import { task } from "../utils/task";
import replaceRemixImports from "./transform";
import type { Dependency } from "./utils/dependencies";
import * as Dependencies from "./utils/dependencies";
import { detectAdapter, detectRuntime } from "./utils/detect";
import * as Postinstall from "./utils/postinstall";
import { isRemixPackage } from "./utils/remix";

const code = (message: string) => cyan("`" + message + "`");

const getRemixVersionSpec = (remixDeps: Dependency[]): string => {
  let candidate = maxBy(remixDeps, (dep) => semver.minVersion(dep.versionSpec));
  if (candidate === undefined) {
    throw new CodemodError("Could not find versions for your Remix packages");
  }

  let candidateMin = semver.minVersion(candidate.versionSpec);
  if (candidateMin === null) {
    throw new CodemodError("Could not find versions for your Remix packages");
  }

  if (semver.lt(candidateMin, "1.3.3")) return "^1.3.3";

  return candidate.versionSpec;
};

const codemod: Codemod = async (projectDir, options) => {
  let pkg = await NpmCliPackageJson.load(projectDir);

  let adapter = await task(
    "Detecting Remix server adapter",
    async () => detectAdapter(pkg.content),
    (adapter) =>
      adapter
        ? `Detected Remix server adapter: ${blue(adapter)}`
        : "No Remix server adapter detected"
  );

  let runtime = await task(
    "Detecting Remix server runtime",
    async () => detectRuntime(pkg.content, adapter),
    (runtime) => `Detected Remix server runtime: ${blue(runtime)}`
  );

  await task(
    `Removing magic ${code("remix")} package from dependencies`,
    async () => {
      let deps = Dependencies.parse(pkg.content.dependencies);
      let remixDeps = deps.filter(({ name }) => isRemixPackage(name));
      let otherDeps = deps.filter(({ name }) => !isRemixPackage(name));
      let devDeps = Dependencies.parse(pkg.content.devDependencies);
      let remixDevDeps = devDeps.filter(({ name }) => isRemixPackage(name));
      let otherDevDeps = devDeps.filter(({ name }) => !isRemixPackage(name));

      // detect `@remix-run/serve`
      let remixServeInstalled = remixDeps
        .map(({ name }) => name)
        .includes("@remix-run/serve");

      // determine latest Remix version that is compatible with project
      let remixVersionSpec = getRemixVersionSpec([
        ...remixDeps,
        ...remixDevDeps,
      ]);
      pkg.update({
        dependencies: {
          ...Dependencies.unparse(otherDeps),
          // ensure Remix renderer dependency
          "@remix-run/react": remixVersionSpec,
          // ensure Remix server runtime dependency
          [`@remix-run/${runtime}`]: remixVersionSpec,
          // ensure Remix server adapter dependency, if in use
          ...(adapter ? { [`@remix-run/${adapter}`]: remixVersionSpec } : {}),
          // ensure Remix serve dependency, if in use
          ...(remixServeInstalled
            ? { [`@remix-run/serve`]: remixVersionSpec }
            : {}),
        },
        devDependencies: {
          ...Dependencies.unparse(otherDevDeps),
          ...Dependencies.unparse(
            remixDevDeps.map(({ name }) => ({
              name,
              versionSpec: remixVersionSpec,
            }))
          ),
          // ensure Remix dev dependency
          [`@remix-run/dev`]: remixVersionSpec,
        },
      });
      if (options.dry) return;
      await pkg.save();
    },
    `Removed magic ${code("remix")} package from dependencies`
  );

  await task(
    `Removing ${code("remix setup")} from postinstall script`,
    async () => {
      let postinstall = pkg.content.scripts?.postinstall;
      if (postinstall === undefined) return;
      if (!Postinstall.hasRemixSetup(postinstall)) return;
      if (!Postinstall.isOnlyRemixSetup(postinstall)) {
        throw Error(
          `Could not automatically remove ${code(
            "remix setup"
          )} from postinstall script`
        );
      }

      pkg.update({
        scripts: Object.fromEntries(
          Object.entries(pkg.content.scripts || {}).filter(
            ([script]) => script !== "postinstall"
          )
        ),
      });
      if (options.dry) return;
      await pkg.save();
    },
    `Removed ${code("remix setup")} from postinstall script`
  );

  let replaceRemixMagicImportsText = (soFar: number = 0, total?: number) => {
    let text = `Replacing magic ${code("remix")} imports`;
    if (total === undefined) return text;
    return text + gray(` | ${soFar}/${total} files`);
  };
  await task(
    replaceRemixMagicImportsText(),
    async (spinner) => {
      let transform = replaceRemixImports({ runtime, adapter });

      // get Remix app code file paths
      let config = await readConfig(projectDir);
      let files = glob.sync("**/*.+(js|jsx|ts|tsx)", {
        absolute: true,
        cwd: config.appDirectory,
      });
      spinner.text = replaceRemixMagicImportsText(0, files.length);

      let changes: boolean = false;
      // run the transform on each of those files
      for (let [i, file] of files.entries()) {
        spinner.text = replaceRemixMagicImportsText(i, files.length);
        let code = fs.readFileSync(file, "utf-8");
        let result = transform(code, file);
        if (result === code) continue;
        changes = true;

        if (options.dry) {
          spinner.info(`${file} would be changed`);
          continue;
        }
        fs.writeFileSync(file, result);
      }
      if (options.dry && !changes) spinner.info("No files would be changed");
      return files.length;
    },
    (fileCount) =>
      replaceRemixMagicImportsText(fileCount, fileCount).replace(
        "Replacing",
        "Replaced"
      )
  );

  if (!options.dry) {
    let packageManager = detectPackageManager() ?? "npm";
    log.info(
      `👉 To update your lockfile, run ${code(`${packageManager} install`)}`
    );
  }
};
export default codemod;
