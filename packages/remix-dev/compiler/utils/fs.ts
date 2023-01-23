import { promises as fsp } from "fs";
import * as path from "path";

export async function writeFileSafe(
  file: string,
  contents: string
): Promise<string> {
  await fsp.mkdir(path.dirname(file), { recursive: true });
  await fsp.writeFile(file, contents);
  return file;
}
