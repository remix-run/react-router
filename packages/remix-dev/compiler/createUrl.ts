import * as path from "path";

export default function createUrl(
  publicPath: string,
  fileName: string
): string {
  return publicPath + fileName.split(path.win32.sep).join("/");
}
