import * as path from "node:path";

import { getVite } from "./vite";

export const resolveFileUrl = (
  { rootDirectory }: { rootDirectory: string },
  filePath: string,
  { publicPath }: { publicPath?: string } = {},
) => {
  let vite = getVite();
  let relativePath = path.relative(rootDirectory, filePath);
  let isWithinRoot =
    !relativePath.startsWith("..") && !path.isAbsolute(relativePath);

  if (!isWithinRoot) {
    // Vite will prevent serving files outside of the workspace
    // unless user explicitly opts in with `server.fs.allow`
    // https://vitejs.dev/config/server-options.html#server-fs-allow
    return path.posix.join("/@fs", vite.normalizePath(filePath));
  }

  let url = "/" + vite.normalizePath(relativePath);

  // When the Vite base config (publicPath) matches the start of the
  // root-relative file URL, Vite strips the base prefix during SSR module
  // loading, causing the file to not be found (e.g. basename "/app/" with
  // appDirectory "app/" makes "/app/root.tsx" resolve to "/root.tsx"). Use
  // the /@fs/ absolute path form to bypass Vite's base stripping.
  if (publicPath && publicPath !== "/" && url.startsWith(publicPath)) {
    return path.posix.join("/@fs", vite.normalizePath(filePath));
  }

  return url;
};
