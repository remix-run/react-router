import os from "node:os";
import path from "node:path";
import fse from "fs-extra";

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

export default async <Result>(
  fixture: string,
  callback: (projectDir: string) => Promise<Result>
): Promise<Result> => {
  let TEMP_DIR = path.join(
    fse.realpathSync(os.tmpdir()),
    `remix-tests-${Math.random().toString(32).slice(2)}`
  );

  let projectDir = path.join(TEMP_DIR);
  await fse.remove(TEMP_DIR);
  await fse.ensureDir(TEMP_DIR);
  fse.copySync(fixture, projectDir);
  try {
    let result = await callback(projectDir);
    return result;
  } finally {
    // Windows sometimes throws `EBUSY: resource busy or locked, rmdir`
    // errors when attempting to removing the temporary directory.
    // Retrying a couple times seems to get it to succeed.
    // See https://github.com/jprichardson/node-fs-extra/issues?q=EBUSY%3A+resource+busy+or+locked%2C+rmdir
    await retry(async () => await fse.remove(TEMP_DIR), 3, 200);
  }
};
