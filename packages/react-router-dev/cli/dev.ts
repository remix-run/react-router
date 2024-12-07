// This is a standalone script so that we can spin up a separate Node process
// for the dev server ensuring --conditions=development is set by default

import exitHook from "exit-hook";
import type { ViteDevOptions } from "../vite/dev";
import * as profiler from "../vite/profiler";
import { dev as viteDev } from "../vite/dev";

import invariant from "../invariant";

export type DevScriptArgs = {
  root: string;
  viteDevOptions: ViteDevOptions;
};

async function dev(root: string, options: ViteDevOptions = {}) {
  if (options.profile) {
    await profiler.start();
  }
  exitHook(() => profiler.stop(console.info));
  await viteDev(root, options);
}

(async () => {
  let args = JSON.parse(process.argv[2]) as DevScriptArgs;

  // Minimal check to ensure this script is being invoked correctly, otherwise
  // the DevScriptArgs type should handle the rest
  invariant(typeof args === "object", "dev script args must be an object");

  await dev(args.root, args.viteDevOptions);
})();
