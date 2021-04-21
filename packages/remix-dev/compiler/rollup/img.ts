import * as path from "path";
import cacache from "cacache";
import type { Plugin } from "rollup";
import sharp from "sharp";
import prettyBytes from "pretty-bytes";
import prettyMs from "pretty-ms";

import invariant from "../../invariant";
import { BuildTarget } from "../../build";
import { addHash, getFileHash, getHash } from "../crypto";
import type { RemixConfig } from "./remixConfig";
import { getRemixConfig } from "./remixConfig";

// Don't use the sharp cache, we use Rollup's built-in cache so we don't process
// images between restarts of the dev server. Also, through some experimenting,
// the sharp cache seems to be based on filenames, not the content of the file,
// so replacing an image with a new one by the same name didn't work.
sharp.cache(false);

const transparent1x1gif =
  "data:image/gif;base64,R0lGODlhAQABAIAAAAUEBAAAACwAAAAAAQABAAACAkQBADs=";

const imageFormats = ["avif", "jpeg", "png", "webp"];

export default function imgPlugin({ target }: { target: string }): Plugin {
  let config: RemixConfig;

  return {
    name: "img",

    async buildStart({ plugins }) {
      config = await getRemixConfig(plugins);
    },

    async resolveId(id, importer) {
      if (!id.startsWith("img:")) return null;

      let { baseId, search } = parseId(id.slice(4));

      let resolved = await this.resolve(baseId, importer, { skipSelf: true });

      return resolved && `\0img:${resolved.id}${search}`;
    },

    async load(id) {
      if (!id.startsWith("\0img:")) return;

      let { baseId: file, search } = parseId(id.slice(5));
      let params = new URLSearchParams(search);
      let hash = (await getFileHash(file)).slice(0, 8);

      this.addWatchFile(file);

      let assets = await getImageAssets(
        config.appDirectory,
        file,
        hash,
        params
      );

      if (target === BuildTarget.Browser) {
        for (let asset of assets) {
          let { fileName, hash } = asset;

          let source: string | Uint8Array;
          try {
            let cached = await cacache.get(config.cacheDirectory, hash);
            source = cached.data;
          } catch (error) {
            if (error.code !== "ENOENT") throw error;
            source = await generateImageAssetSource(file, asset);
            await cacache.put(config.cacheDirectory, hash, source);
          }

          this.emitFile({ type: "asset", fileName, source });
        }
      }

      let placeholder =
        params.get("placeholder") != null
          ? await generateImagePlaceholder(file, hash, config.cacheDirectory)
          : transparent1x1gif;

      let images = assets.map(asset => ({
        src: config.publicPath + asset.fileName,
        width: asset.width,
        height: asset.height,
        format: asset.transform.format
      }));

      return `
        export let images = ${JSON.stringify(images, null, 2)};
        let primaryImage = images[images.length - 1];
        let srcset = images.map(image => image.src + " " + image.width + "w").join(",");
        let placeholder = ${JSON.stringify(placeholder)};
        let mod = { ...primaryImage, srcset, placeholder };
        export default mod;
      `;
    }
  };
}

function parseId(id: string): { baseId: string; search: string } {
  let searchIndex = id.indexOf("?");
  return searchIndex === -1
    ? { baseId: id, search: "" }
    : {
        baseId: id.slice(0, searchIndex),
        search: id.slice(searchIndex)
      };
}

interface ImageTransform {
  width?: number;
  height?: number;
  quality?: number;
  format: string;
}

function getImageTransforms(
  params: URLSearchParams,
  defaultFormat: string
): ImageTransform[] {
  let width = params.get("width");
  let height = params.get("height");
  let quality = params.get("quality");
  let format = params.get("format") || defaultFormat;

  if (format === "jpg") {
    format = "jpeg";
  } else if (!imageFormats.includes(format)) {
    throw new Error(`Invalid image format: ${format}`);
  }

  let transform = {
    width: width ? parseInt(width, 10) : undefined,
    height: height ? parseInt(height, 10) : undefined,
    quality: quality ? parseInt(quality, 10) : undefined,
    format
  };

  let srcset = params.get("srcset");

  return srcset
    ? srcset.split(",").map(width => ({
        ...transform,
        width: parseInt(width, 10)
      }))
    : [transform];
}

interface ImageAsset {
  fileName: string;
  hash: string;
  width: number;
  height: number;
  transform: ImageTransform;
}

async function getImageAssets(
  dir: string,
  file: string,
  sourceHash: string,
  params: URLSearchParams
): Promise<ImageAsset[]> {
  let defaultFormat = path.extname(file).slice(1);
  let transforms = getImageTransforms(params, defaultFormat);

  return Promise.all(
    transforms.map(async transform => {
      let width: number;
      let height: number;

      if (transform.width && transform.height) {
        width = transform.width;
        height = transform.height;
      } else {
        let meta = await sharp(file).metadata();

        invariant(
          typeof meta.width === "number" && typeof meta.height === "number",
          `Cannot get image metadata: ${file}`
        );

        if (transform.width) {
          width = transform.width;
          height = Math.round(transform.width / (meta.width / meta.height));
        } else if (transform.height) {
          width = Math.round(transform.height / (meta.height / meta.width));
          height = transform.height;
        } else {
          width = meta.width;
          height = meta.height;
        }
      }

      let hash = getHash(
        sourceHash +
          transform.width +
          transform.height +
          transform.quality +
          transform.format
      ).slice(0, 8);
      let fileName = addHash(
        addHash(path.relative(dir, file), `${width}x${height}`),
        hash
      );

      return { fileName, hash, width, height, transform };
    })
  );
}

async function generateImageAssetSource(
  file: string,
  asset: ImageAsset
): Promise<Buffer> {
  let start = Date.now();
  let image = sharp(file);

  if (asset.width || asset.height) {
    image.resize({ width: asset.width, height: asset.height });
  }

  // image.jpeg(), image.png(), etc.
  // @ts-ignore
  image[asset.transform.format]({ quality: asset.transform.quality });

  let buffer = await image.toBuffer();

  console.log(
    'Built image "%s", %s, %s',
    asset.fileName,
    prettyBytes(buffer.byteLength),
    prettyMs(Date.now() - start)
  );

  return buffer;
}

async function generateImagePlaceholder(
  file: string,
  hash: string,
  cacheDir: string
): Promise<string> {
  let cacheKey = `placeholder-${hash}`;

  let buffer: Buffer;
  try {
    let cached = await cacache.get(cacheDir, cacheKey);
    buffer = cached.data;
  } catch (error) {
    if (error.code !== "ENOENT") throw error;

    let start = Date.now();
    let image = sharp(file).resize({ width: 50 }).jpeg({ quality: 25 });
    buffer = await image.toBuffer();

    console.log(
      'Built placeholder image for "%s", %s, %s',
      path.basename(file),
      prettyBytes(buffer.byteLength),
      prettyMs(Date.now() - start)
    );

    await cacache.put(cacheDir, cacheKey, buffer);
  }

  return `data:image/jpeg;base64,${buffer.toString("base64")}`;
}
