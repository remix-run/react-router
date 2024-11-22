import path from "node:path";

export function normalizeSlashes(file: string) {
  return file.split(path.win32.sep).join("/");
}
