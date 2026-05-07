import path from "node:path";

export function normalizeSlashes(file: string) {
  return file.replaceAll(path.win32.sep, "/");
}
