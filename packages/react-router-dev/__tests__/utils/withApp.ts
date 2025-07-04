import { cpSync, realpathSync } from "node:fs";
import { mkdir, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

const retry = async (
  callback: () => Promise<void>,
  times: number,
  delayMs: number = 0
) => {
  try {
    await callback();
  } catch (error: unknown) {
    if (times === 0) throw error;
    setTimeout(() => retry(callback, times - 1), delayMs);
  }
};

export default async function withApp<Result>(
  fixture: string,
  callback: (projectDir: string) => Promise<Result>
): Promise<Result> {
  let TEMP_DIR = path.join(
    realpathSync(os.tmpdir()),
    `remix-tests-${Math.random().toString(32).slice(2)}`
  );

  let projectDir = path.join(TEMP_DIR);
  await rm(TEMP_DIR, { force: true, recursive: true });
  await mkdir(TEMP_DIR, { recursive: true });
  cpSync(fixture, projectDir, { recursive: true });
  try {
    let result = await callback(projectDir);
    return result;
  } finally {
    // Windows sometimes throws `EBUSY: resource busy or locked, rmdir`
    // errors when attempting to remove the temporary directory.
    // Retrying a couple of times seems to get it to succeed.
    // See https://github.com/jprichardson/node-fs-extra/issues?q=EBUSY%3A+resource+busy+or+locked%2C+rmdir
    await retry(
      async () => await rm(TEMP_DIR, { force: true, recursive: true }),
      3,
      200
    );
  }
}
