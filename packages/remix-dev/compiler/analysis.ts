import fs from "node:fs";
import path from "node:path";
import type { Metafile } from "esbuild";

import type { Context } from "./context";

export let writeMetafile = (
  ctx: Context,
  filename: string,
  metafile: Metafile
) => {
  let buildDir = path.dirname(ctx.config.serverBuildPath);
  if (!fs.existsSync(buildDir)) {
    fs.mkdirSync(buildDir, { recursive: true });
  }
  fs.writeFileSync(path.join(buildDir, filename), JSON.stringify(metafile));
};
