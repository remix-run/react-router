import type { NormalizedImport } from "../normalize-imports";
import type { Adapter, Client, Package, Runtime } from "./package-exports";
import { packageExports } from "./package-exports";

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
  client: Client;
  normalizedImports: NormalizedImport[];
  runtime: Runtime;
};
export const mapNormalizedImports = ({
  adapter,
  client,
  normalizedImports,
  runtime,
}: MapNormalizedImportsArgs) => {
  let filteredAdapterNormalizedImports = adapter
    ? getFilteredNormalizedImportsForPackage(normalizedImports, adapter)
    : [];
  let filteredClientNormalizedImports = getFilteredNormalizedImportsForPackage(
    normalizedImports,
    client
  );
  let filteredRuntimeNormalizedImports = getFilteredNormalizedImportsForPackage(
    normalizedImports,
    runtime
  );

  return {
    ...(adapter ? { [adapter]: filteredAdapterNormalizedImports } : {}),
    [client]: filteredClientNormalizedImports,
    [runtime]: filteredRuntimeNormalizedImports,
    remix: getRemainingNormalizedImports(normalizedImports, [
      ...filteredAdapterNormalizedImports,
      ...filteredClientNormalizedImports,
      ...filteredRuntimeNormalizedImports,
    ]),
  };
};
