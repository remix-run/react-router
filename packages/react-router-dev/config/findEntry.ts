import path from "node:path";
import fse from "fs-extra";

const entryExts = [".js", ".jsx", ".ts", ".tsx"];

export function findEntry(dir: string, basename: string): string | undefined {
  for (let ext of entryExts) {
    let file = path.resolve(dir, basename + ext);
    if (fse.existsSync(file)) return path.relative(dir, file);
  }

  return undefined;
}
