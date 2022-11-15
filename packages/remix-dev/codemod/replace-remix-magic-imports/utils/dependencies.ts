export interface Dependency {
  name: string;
  versionSpec: string;
}

export let parse = (deps?: Record<string, string>): Dependency[] =>
  Object.entries(deps || {}).map(([name, versionSpec]) => ({
    name,
    versionSpec,
  }));

export let unparse = (deps: Dependency[]): Record<string, string> => {
  return Object.fromEntries(
    deps.map(({ name, versionSpec }) => [name, versionSpec])
  );
};
