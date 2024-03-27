// Adapted from:
// - https://github.com/vitejs/vite/blob/9fc5d9cb3a1b9df067e00959faa9da43ae03f776/packages/vite/bin/vite.js
// - https://github.com/vitejs/vite/blob/9fc5d9cb3a1b9df067e00959faa9da43ae03f776/packages/vite/src/node/cli.ts

import fs from "node:fs";
import type { Session } from "node:inspector";
import path from "node:path";
import colors from "picocolors";

declare namespace global {
  let __remix_profile_session: Session | undefined;
}

export const getSession = () => global.__remix_profile_session;

export const start = async (callback?: () => void | Promise<void>) => {
  let inspector = await import("node:inspector").then((r) => r.default);
  let session = (global.__remix_profile_session = new inspector.Session());
  session.connect();
  session.post("Profiler.enable", () => {
    session.post("Profiler.start", callback);
  });
};

let profileCount = 0;

export const stop = (log: (message: string) => void): void | Promise<void> => {
  let session = getSession();
  if (!session) return;
  return new Promise((res, rej) => {
    session!.post("Profiler.stop", (err, { profile }) => {
      if (err) return rej(err);
      let outPath = path.resolve(`./remix-${profileCount++}.cpuprofile`);
      fs.writeFileSync(outPath, JSON.stringify(profile));
      log(
        colors.yellow(
          `CPU profile written to ${colors.white(colors.dim(outPath))}`
        )
      );
      global.__remix_profile_session = undefined;
      res();
    });
  });
};
