import { basename } from "path";
import glob from "fast-glob";
import { readFileSync, removeSync, renameSync, writeFileSync } from "fs-extra";

import { convertTSFileToJS } from "./convertTSFileToJS";

export const convertTSFilesToJS = (projectDir: string) => {
  let entries = glob.sync("**/*.+(ts|tsx)", {
    cwd: projectDir,
    absolute: true,
    ignore: ["**/node_modules/**"],
  });

  entries.forEach((entry) => {
    if (entry.endsWith(".d.ts")) {
      return removeSync(entry);
    }

    let contents = readFileSync(entry, "utf8");
    let filename = basename(entry);
    let javascript = convertTSFileToJS({
      filename,
      projectDir,
      source: contents,
    });
    writeFileSync(entry, javascript, "utf8");

    renameSync(entry, entry.replace(".ts", ".js"));
  });
};
