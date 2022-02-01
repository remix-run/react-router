import fs from "fs/promises";
import path from "path";

export const TMP_DIR = path.join(process.cwd(), ".tmp");

export default async function setup() {
  await fs.rm(TMP_DIR, {
    force: true,
    recursive: true
  });
  await fs.mkdir(TMP_DIR);
}
