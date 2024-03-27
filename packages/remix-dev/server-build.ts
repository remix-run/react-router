import type { ServerBuild } from "@remix-run/server-runtime";

throw new Error(
  "@remix-run/dev/server-build is not meant to be used directly from node_modules." +
    " It exists to provide type definitions for a virtual module provided" +
    " by the Remix compiler at build time."
);

export const mode: ServerBuild["mode"] = undefined!;
export const assets: ServerBuild["assets"] = undefined!;
export const basename: ServerBuild["basename"] = undefined!;
export const entry: ServerBuild["entry"] = undefined!;
export const routes: ServerBuild["routes"] = undefined!;
export const future: ServerBuild["future"] = undefined!;
export const publicPath: ServerBuild["publicPath"] = undefined!;
// prettier-ignore
export const assetsBuildDirectory: ServerBuild["assetsBuildDirectory"] = undefined!;
export const isSpaMode: ServerBuild["isSpaMode"] = undefined!;
