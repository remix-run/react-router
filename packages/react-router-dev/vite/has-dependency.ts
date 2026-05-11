export function hasDependency({
  name,
  rootDirectory,
}: {
  name: string;
  rootDirectory: string;
}) {
  try {
    return Boolean(require.resolve(name, { paths: [rootDirectory] }));
  } catch (
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    e
  ) {
    return false;
  }
}
