import type { PackageJson } from "type-fest";

import type { ExtraOptions } from "./jscodeshift-transform";
import { adapters, runtimes } from "./jscodeshift-transform";

const getAdapter = ({ dependencies }: PackageJson): ExtraOptions["adapter"] =>
  Object.keys(dependencies || {})
    .filter(
      (key) =>
        key.startsWith("@remix-run/") &&
        !["react", "serve", "server-runtime", ...runtimes]
          .map((pkgName) => `@remix-run/${pkgName}`)
          .includes(key)
    )
    .map((key) => key.replace("@remix-run/", ""))
    .find((key) =>
      adapters.includes(key as typeof adapters[number])
    ) as ExtraOptions["adapter"];

const getClient = (_packageJson: PackageJson): ExtraOptions["client"] =>
  "react";

const getRuntime = ({ scripts }: PackageJson): ExtraOptions["runtime"] =>
  (scripts?.postinstall?.replace(
    "remix setup ",
    ""
  ) as ExtraOptions["runtime"]) || "node";

export const getJSCodeshiftExtraOptions = (
  packageJson: PackageJson
): ExtraOptions => ({
  adapter: getAdapter(packageJson),
  client: getClient(packageJson),
  runtime: getRuntime(packageJson),
});
