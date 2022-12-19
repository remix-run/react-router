import type { PackageJson } from "@npmcli/package-json";

import { CodemodError } from "../../utils/error";
import * as Dependencies from "./dependencies";
import * as Postinstall from "./postinstall";
import type { Adapter, Runtime } from "./remix";
import { isAdapter, isRemixPackage } from "./remix";

const autoDetectPostinstallRuntime = (
  packageJson: PackageJson
): Runtime | undefined => {
  let postinstall = packageJson.scripts?.postinstall;
  if (postinstall === undefined) return undefined;

  // match `remix setup <runtime>` in `postinstall` script
  return Postinstall.parseRuntime(postinstall);
};

const adapterToRuntime: Record<Adapter, Runtime> = {
  architect: "node",
  "cloudflare-pages": "cloudflare",
  "cloudflare-workers": "cloudflare",
  express: "node",
  netlify: "node",
  vercel: "node",
};

export const detectRuntime = (
  packageJson: PackageJson,
  adapter?: Adapter
): Runtime => {
  // match `remix setup <runtime>` in `postinstall` script
  let postinstallRuntime = autoDetectPostinstallRuntime(packageJson);
  if (postinstallRuntime) return postinstallRuntime;

  // infer runtime from adapter
  if (adapter) return adapterToRuntime[adapter];

  // @remix-run/serve uses node
  let deps = Dependencies.parse(packageJson.dependencies);
  let remixDeps = deps.filter(({ name }) => isRemixPackage(name));
  if (remixDeps.map(({ name }) => name).includes("@remix-run/serve")) {
    return "node" as const;
  }

  throw new CodemodError("Could not detect your Remix server runtime");
};

export const detectAdapter = (
  packageJson: PackageJson
): Adapter | undefined => {
  // find adapter in package.json dependencies
  let deps = Dependencies.parse(packageJson.dependencies);
  let remixDeps = deps.filter(({ name }) => isRemixPackage(name));
  let adapters = remixDeps
    .map(({ name }) => name.replace(/^@remix-run\//, ""))
    .filter(isAdapter);

  if (adapters.length === 0) return undefined;
  if (adapters.length > 1) {
    throw new CodemodError(
      "Found multiple Remix server adapters your in dependencies",
      adapters.map((adapter) => `- @remix-run/${adapter}`).join("\n")
    );
  }
  return adapters[0];
};
