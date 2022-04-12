import type { NormalizedImport } from "../normalizeImports";
import type { Adapter, Package, Runtime } from "./packageExports";
import { packageExports } from "./packageExports";

const getFilteredNormalizedImportsForPackage = (
  normalizedImports: NormalizedImport[],
  packageName: Package
) =>
  normalizedImports.filter(
    ({ name }) =>
      packageExports[packageName].type.includes(name) ||
      packageExports[packageName].value.includes(name)
  );

const getRemainingNormalizedImports = (
  normalizedImports: NormalizedImport[],
  filteredNormalizedImports: NormalizedImport[]
) => {
  let filteredNormalizedImportNames = filteredNormalizedImports.map(
    ({ name }) => name
  );

  return normalizedImports.filter(
    ({ name }) => !filteredNormalizedImportNames.includes(name)
  );
};

// export type MappedNormalizedImports = {
//   [adapter: Adapter]: NormalizedImport[] | undefined;
//   [client: Client]: NormalizedImport[];
//   [runtime: Runtime]: NormalizedImport[];
// };
export type MappedNormalizedImports = ReturnType<typeof mapNormalizedImports>;
export type MapNormalizedImportsArgs = {
  adapter?: Adapter;
  normalizedImports: NormalizedImport[];
  runtime: Runtime;
};
export const mapNormalizedImports = ({
  adapter,
  normalizedImports,
  runtime,
}: MapNormalizedImportsArgs) => {
  let filteredAdapterNormalizedImports = adapter
    ? getFilteredNormalizedImportsForPackage(normalizedImports, adapter)
    : [];
  let filteredReactNormalizedImports = getFilteredNormalizedImportsForPackage(
    normalizedImports,
    "react"
  );
  let filteredRuntimeNormalizedImports = getFilteredNormalizedImportsForPackage(
    normalizedImports,
    runtime
  );

  return {
    ...(adapter ? { [adapter]: filteredAdapterNormalizedImports } : {}),
    react: filteredReactNormalizedImports,
    [runtime]: filteredRuntimeNormalizedImports,
    remix: getRemainingNormalizedImports(normalizedImports, [
      ...filteredAdapterNormalizedImports,
      ...filteredReactNormalizedImports,
      ...filteredRuntimeNormalizedImports,
    ]),
  };
};
