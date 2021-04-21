import path from "path";
import { promises as fsp } from "fs";
import cacache from "cacache";
import postcss from "postcss";
import type Processor from "postcss/lib/processor";
import type { Plugin } from "rollup";
import prettyBytes from "pretty-bytes";
import prettyMs from "pretty-ms";

import { BuildTarget } from "../../build";
import createUrl from "../createUrl";
import { getHash, addHash } from "../crypto";
import type { RemixConfig } from "./remixConfig";
import { getRemixConfig } from "./remixConfig";

export default function cssPlugin({
  target,
  mode
}: {
  target: string;
  mode: string;
}): Plugin {
  let config: RemixConfig;
  let processor: Processor;

  return {
    name: "css",

    async buildStart({ plugins }) {
      config = await getRemixConfig(plugins);

      if (!processor) {
        let postCssConfig = await getPostCssConfig(config.rootDirectory, mode);
        processor = postcss(postCssConfig.plugins);
      }
    },

    async resolveId(id, importer) {
      if (!id.startsWith("css:")) return null;

      let resolved = await this.resolve(id.slice(4), importer, {
        skipSelf: true
      });

      return resolved && `\0css:${resolved.id}`;
    },

    async load(id) {
      if (!id.startsWith("\0css:")) return;

      let file = id.slice(5);
      let originalSource = await fsp.readFile(file);
      let hash = getHash(originalSource).slice(0, 8);
      let fileName = addHash(
        path.relative(config.appDirectory, file),
        hash
      ).replace(/(\.\w+)?$/, ".css");

      this.addWatchFile(file);

      if (target === BuildTarget.Browser) {
        let source: string | Uint8Array;
        try {
          let cached = await cacache.get(config.cacheDirectory, hash);
          source = cached.data;
        } catch (error) {
          if (error.code !== "ENOENT") throw error;
          source = await generateCssSource(file, originalSource, processor);
          await cacache.put(config.cacheDirectory, hash, source);
        }

        this.emitFile({ type: "asset", fileName, source });
      }

      return `export default ${JSON.stringify(
        createUrl(config.publicPath, fileName)
      )}`;
    }
  };
}

async function generateCssSource(
  file: string,
  content: Buffer,
  processor: Processor
): Promise<string> {
  let start = Date.now();
  let result = await processor.process(content, { from: file });

  console.log(
    'Built CSS for "%s", %s, %s',
    path.basename(file),
    prettyBytes(Buffer.byteLength(result.css)),
    prettyMs(Date.now() - start)
  );

  return result.css;
}

async function getPostCssConfig(appDirectory: string, mode: string) {
  let requirePath = path.resolve(appDirectory, "postcss.config.js");
  try {
    await fsp.access(requirePath);
    return require(requirePath);
  } catch (e) {
    return { plugins: mode ? [] : [] };
  }
}
