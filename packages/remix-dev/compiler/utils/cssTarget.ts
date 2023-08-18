// We use this as our CSS target to maximize compatibility during minification.
// This is the minimum set of browsers that Remix supports due to their support
// for ES module scripts: https://caniuse.com/es6-module
import type { BuildOptions } from "esbuild";

export const cssTarget: BuildOptions["target"] = [
  "chrome61",
  "edge16",
  "safari10.1",
  "ios11",
  "firefox60",
  "opera48",
];
