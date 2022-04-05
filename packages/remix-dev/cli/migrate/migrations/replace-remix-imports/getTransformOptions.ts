import type { PackageJson } from "type-fest";

import type { Options } from "./transform";
import { adapters, runtimes } from "./transform";
import type {
  Adapter,
  Runtime,
} from "./transform/mapNormalizedImports/packageExports";

const getAdapter = ({ dependencies }: PackageJson): Adapter =>
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
    ) as Adapter;

const getRuntime = ({ scripts }: PackageJson): Runtime =>
  (scripts?.postinstall?.replace("remix setup ", "") as Runtime) || "node";

export const getTransformOptions = (packageJson: PackageJson): Options => ({
  adapter: getAdapter(packageJson),
  runtime: getRuntime(packageJson),
});
