import * as fs from "node:fs";
import type { BinaryLike } from "node:crypto";
import { createHash } from "node:crypto";

export function getHash(source: BinaryLike): string {
  return createHash("sha256").update(source).digest("hex");
}

export async function getFileHash(file: string): Promise<string> {
  return new Promise((accept, reject) => {
    let hash = createHash("sha256");
    fs.createReadStream(file)
      .on("error", (error) => reject(error))
      .on("data", (data) => hash.update(data))
      .on("close", () => {
        accept(hash.digest("hex"));
      });
  });
}
