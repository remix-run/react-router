export interface Dependency {
  name: string;
  versionSpec: string;
}

export let depsToEntries = (deps?: Record<string, string>): Dependency[] =>
  Object.entries(deps || {}).map(([name, versionSpec]) => ({
    name,
    versionSpec,
  }));

export let depsToObject = (deps: Dependency[]): Record<string, string> => {
  return Object.fromEntries(
    deps.map(({ name, versionSpec }) => [name, versionSpec])
  );
};

export const isRemixPackage = (name: string): boolean =>
  name === "remix" || name.startsWith("@remix-run/");
