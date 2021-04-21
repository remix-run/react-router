import * as path from "path";

export function createUrl(publicPath: string, file: string): string {
  return publicPath + file.split(path.win32.sep).join("/");
}
