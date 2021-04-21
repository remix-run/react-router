import type { BinaryLike } from "crypto";
import { createHash } from "crypto";
import { createReadStream } from "fs";
import type { OutputBundle } from "rollup";

export function getHash(source: BinaryLike): string {
  return createHash("sha1").update(source).digest("hex");
}

export async function getFileHash(file: string): Promise<string> {
  return new Promise((accept, reject) => {
    let hash = createHash("sha1");
    let stream = createReadStream(file);

    stream
      .on("error", reject)
      .on("data", data => {
        hash.update(data);
      })
      .on("end", () => {
        accept(hash.digest("hex"));
      });
  });
}

export function getBundleHash(bundle: OutputBundle): string {
  let hash = createHash("sha1");

  for (let key of Object.keys(bundle).sort()) {
    let output = bundle[key];
    hash.update(output.type === "asset" ? output.source : output.code);
  }

  return hash.digest("hex");
}

export function addHash(fileName: string, hash: string): string {
  return fileName.replace(/(\.\w+)?$/, `-${hash}$1`);
}
