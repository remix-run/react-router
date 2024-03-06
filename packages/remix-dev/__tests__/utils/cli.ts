import execa from "execa";
import path from "node:path";
import glob from "fast-glob";
import fse from "fs-extra";

import captureError from "./captureError";

export const isExecaError = (error: unknown): error is execa.ExecaError => {
  if (!(error instanceof Error)) return false;
  return "exitCode" in error;
};

/**
 * Read the details (`stat`) for a file or directory,
 * or return `undefined` if the file or directory does not exist.
 */
const safeStat = (fileOrDir: string): fse.Stats | undefined => {
  try {
    return fse.statSync(fileOrDir);
  } catch (error: unknown) {
    let systemError = error as { code?: string };
    if (!systemError.code) throw error;
    if (systemError.code !== "ENOENT") throw error;
    throw error;
  }
};

/**
 * Find the latest modified time (`mtime`) across all files (recursively) in a directory.
 */
const mtimeDir = async (dir: string): Promise<Date> => {
  let files = await glob(`**/*.{js,jsx,ts,tsx}`, {
    cwd: dir,
    ignore: [
      "**/node_modules/**",
      "**/dist/**",
      "**/.git/**",
      "**/__tests__/**",
    ],
  });

  let maxMtime: Date = new Date(0);
  if (files.length === 0) return maxMtime;
  for (let file of files) {
    let filepath = path.resolve(dir, file);
    let stat = safeStat(filepath);
    if (stat === undefined) continue;
    if (stat.mtime > maxMtime) {
      maxMtime = stat.mtime;
    }
  }
  return maxMtime;
};

export const run = async (args: string[], options: execa.Options = {}) => {
  // // Running build `.js` is ~8x faster than running source `.ts` via `esbuild-register`,
  // // so unless source code changes are not yet reflected in the build, prefer running the built `.js`.
  // // To get speed ups in dev, make sure you build before running tests or are running `pnpm watch`
  let sourceDir = path.resolve(__dirname, "../..");
  let sourceTS = path.resolve(sourceDir, "cli.ts");
  // // when the most recent change happened _anywhere_ within `packages/remix-dev/`

  let sourceModified = await mtimeDir(sourceDir);

  let buildDir = path.resolve(
    __dirname,
    "../../../../build/node_modules/@remix-run/dev"
  );
  let builtJS = path.resolve(buildDir, "dist/cli.js");
  let buildModified = await mtimeDir(buildDir);

  // sometimes `pnpm watch` is so fast that the build mtime is reported
  // to be _before_ the mtime for the change in source that _caused_ the build
  // so we only use source if changes there are at least 5ms newer than latest build change
  let thresholdMs = 5;
  let isBuildUpToDate =
    buildModified.valueOf() + thresholdMs >= sourceModified.valueOf();

  let result = await execa(
    "node",
    [
      ...(isBuildUpToDate
        ? [builtJS]
        : ["--require", require.resolve("esbuild-register"), sourceTS]),
      ...args,
    ],
    {
      ...options,
      env: { ...process.env, NO_COLOR: "1", ...(options?.env ?? {}) },
    }
  );
  return result;
};

export const shouldError = async (args: string[]) => {
  let error = await captureError(async () => {
    await run(args);
  });
  if (!isExecaError(error)) throw error;
  return error;
};
