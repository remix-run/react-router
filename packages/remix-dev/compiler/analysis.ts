import fs from "fs-extra";
import path from "node:path";
import type { Metafile } from "esbuild";

import type { Context } from "./context";

export let writeMetafile = (
  ctx: Context,
  filename: string,
  metafile: Metafile
) => {
  let buildDir = path.dirname(ctx.config.serverBuildPath);
  fs.outputFileSync(path.join(buildDir, filename), JSON.stringify(metafile));
};
