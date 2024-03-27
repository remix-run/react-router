import * as path from "node:path";
import type * as esbuild from "esbuild";
import fse from "fs-extra";

import type { RemixConfig } from "../../config";

export async function write(
  config: RemixConfig,
  outputFiles: esbuild.OutputFile[]
) {
  await fse.ensureDir(path.dirname(config.serverBuildPath));

  for (let file of outputFiles) {
    if ([".js", ".cjs", ".mjs"].some((ext) => file.path.endsWith(ext))) {
      // fix sourceMappingURL to be relative to current path instead of /build
      let filename = file.path.substring(file.path.lastIndexOf(path.sep) + 1);
      let escapedFilename = filename.replace(/([.[\]])/g, "\\$1");
      let pattern = `(//# sourceMappingURL=)(.*)${escapedFilename}`;
      let contents = Buffer.from(file.contents).toString("utf-8");
      contents = contents.replace(new RegExp(pattern), `$1${filename}`);
      await fse.writeFile(file.path, contents);
    } else if (file.path.endsWith(".map")) {
      // Don't write CSS source maps to server build output
      if (file.path.endsWith(".css.map")) {
        break;
      }

      // remove route: prefix from source filenames so breakpoints work
      let contents = Buffer.from(file.contents).toString("utf-8");
      contents = contents.replace(/"route:/gm, '"');
      await fse.writeFile(file.path, contents);
    } else {
      let assetPath = path.join(
        config.assetsBuildDirectory,
        file.path.replace(path.dirname(config.serverBuildPath), "")
      );

      // Don't write CSS bundle from server build to browser assets directory,
      // especially since the file name doesn't contain a content hash
      if (assetPath === path.join(config.assetsBuildDirectory, "index.css")) {
        break;
      }

      await fse.ensureDir(path.dirname(assetPath));
      await fse.writeFile(assetPath, file.contents);
    }
  }
}
