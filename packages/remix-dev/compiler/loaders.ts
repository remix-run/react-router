import * as path from "path";
import type * as esbuild from "esbuild";

export const loaders: { [ext: string]: esbuild.Loader } = {
  ".aac": "file",
  ".avif": "file",
  ".css": "file",
  ".eot": "file",
  ".flac": "file",
  ".gif": "file",
  ".gql": "text",
  ".graphql": "text",
  ".ico": "file",
  ".jpeg": "file",
  ".jpg": "file",
  ".js": "jsx",
  ".jsx": "jsx",
  ".json": "json",
  // We preprocess md and mdx files using XDM and send through
  // the JSX for esbuild to handle
  ".md": "jsx",
  ".mdx": "jsx",
  ".mp3": "file",
  ".mp4": "file",
  ".ogg": "file",
  ".otf": "file",
  ".png": "file",
  ".sql": "text",
  ".svg": "file",
  ".ts": "ts",
  ".tsx": "tsx",
  ".ttf": "file",
  ".wav": "file",
  ".webm": "file",
  ".webmanifest": "file",
  ".webp": "file",
  ".woff": "file",
  ".woff2": "file",
  ".zip": "file",
};

export function getLoaderForFile(file: string): esbuild.Loader {
  let ext = path.extname(file);
  if (ext in loaders) return loaders[ext];
  throw new Error(`Cannot get loader for file ${file}`);
}
