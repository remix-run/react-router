import fs from "node:fs";
import Path from "pathe";

export function isIgnoredByWatcher(
  path: string,
  { root, appDirectory }: { root: string; appDirectory: string },
): boolean {
  let dirname = Path.dirname(path);

  let ignoredByPath =
    !dirname.startsWith(appDirectory) &&
    // Ensure we're only watching files outside of the app directory
    // that are at the root level, not nested in subdirectories
    path !== root && // Watch the root directory itself
    dirname !== root; // Watch files at the root level

  if (ignoredByPath) {
    return true;
  }

  // Filter out non-regular files (sockets, pipes, etc.) that
  // crash `fs.watch()` on macOS with errno -102
  // https://github.com/paulmillr/chokidar/issues/1391
  try {
    let stat = fs.statSync(path, { throwIfNoEntry: false });
    if (stat && !stat.isFile() && !stat.isDirectory()) {
      return true;
    }
  } catch {
    return true;
  }

  return false;
}
