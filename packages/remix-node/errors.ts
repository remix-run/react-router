import fs from "fs";
import fsp from "fs/promises";
import path from "path";
import type { NullableMappedPosition } from "source-map";
import { SourceMapConsumer } from "source-map";

const ROOT = process.cwd() + path.sep;
const SOURCE_PATTERN = /(?<at>\s+at.+)\((?<filename>.+):(?<line>\d+):(?<column>\d+)\)/;

export const UNKNOWN_LOCATION_POSITION = "<unknown location>";

export async function formatServerError(error: Error): Promise<Error> {
  error.stack = await formatStackTrace(error);
  return error;
}

export async function formatStackTrace(error: Error) {
  const cache = new Map();
  const lines = error.stack?.split("\n") || [];
  const promises = lines.map(line => mapToSourceFile(cache, line));
  const stack = (await Promise.all(promises)).join("\n") || error.stack;

  return stack;
}

export async function mapToSourceFile(
  cache: Map<string, SourceMapConsumer>,
  stackLine: string
) {
  let match = SOURCE_PATTERN.exec(stackLine);

  if (!match?.groups) {
    // doesn't match pattern but may still have a filename
    return relativeFilename(stackLine);
  }

  let { at, filename } = match.groups;
  let line: number | string = match.groups.line;
  let column: number | string = match.groups.column;
  let mapFilename = `${filename}.map`;
  let smc = cache.get(mapFilename);
  filename = relativeFilename(filename);

  if (!smc) {
    if (await fileExists(mapFilename)) {
      // read source map and setup consumer
      const map = JSON.parse(await fsp.readFile(mapFilename, "utf-8"));
      map.sourceRoot = path.dirname(mapFilename);
      smc = await new SourceMapConsumer(map);
      cache.set(mapFilename, smc);
    }
  }

  if (smc) {
    const pos = getOriginalSourcePosition(
      smc,
      parseInt(line, 10),
      parseInt(column, 10)
    );

    if (pos.source) {
      filename = relativeFilename(pos.source);
      line = pos.line || "?";
      column = pos.column || "?";
      at = `    at \`${getSourceContentForPosition(smc, pos)}\` `;
    }
  }

  return `${at}(${filename}:${line}:${column})`;
}

export function relativeFilename(filename: string) {
  if (filename.includes("route-module:")) {
    filename = filename.substring(filename.indexOf("route-module:"));
  }
  return filename.replace("route-module:", "").replace(ROOT, "./");
}

export function getOriginalSourcePosition(
  smc: SourceMapConsumer,
  line: number,
  column: number
) {
  return smc.originalPositionFor({ line, column });
}

export function getSourceContentForPosition(
  smc: SourceMapConsumer,
  pos: NullableMappedPosition
) {
  let src: string | null = null;
  if (pos?.source && typeof pos.line === "number") {
    src = smc.sourceContentFor(pos.source);
  }

  if (!src) {
    return UNKNOWN_LOCATION_POSITION;
  }

  return src.split("\n")[pos.line! - 1].trim();
}

function fileExists(filename: string) {
  return fsp
    .access(filename, fs.constants.F_OK)
    .then(() => true)
    .catch(() => false);
}
