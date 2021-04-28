import * as fs from "fs";
import type { BinaryLike } from "crypto";
import { createHash } from "crypto";

export function getHash(source: BinaryLike): string {
  return createHash("sha256").update(source).digest("hex");
}

export async function getFileHash(file: string): Promise<string> {
  return new Promise((accept, reject) => {
    let hash = createHash("sha256");
    fs.createReadStream(file)
      .on("error", error => reject(error))
      .on("data", data => hash.update(data))
      .on("close", () => {
        accept(hash.digest("hex"));
      });
  });
}
