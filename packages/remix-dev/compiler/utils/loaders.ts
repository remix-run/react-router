import * as path from "node:path";
import type * as esbuild from "esbuild";

export const loaders: { [ext: string]: esbuild.Loader } = {
  ".aac": "file",
  ".avif": "file",
  ".css": "file",
  ".csv": "file",
  ".eot": "file",
  ".fbx": "file",
  ".flac": "file",
  ".gif": "file",
  ".glb": "file",
  ".gltf": "file",
  ".gql": "text",
  ".graphql": "text",
  ".hdr": "file",
  ".ico": "file",
  ".jpeg": "file",
  ".jpg": "file",
  ".js": "jsx",
  ".jsx": "jsx",
  ".json": "json",
  // We preprocess md and mdx files using @mdx-js/mdx and send through
  // the JSX for esbuild to handle
  ".md": "jsx",
  ".mdx": "jsx",
  ".mov": "file",
  ".mp3": "file",
  ".mp4": "file",
  ".node": "copy",
  ".ogg": "file",
  ".otf": "file",
  ".png": "file",
  ".psd": "file",
  ".sql": "text",
  ".svg": "file",
  ".ts": "ts",
  ".tsx": "tsx",
  ".ttf": "file",
  ".wasm": "file",
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
