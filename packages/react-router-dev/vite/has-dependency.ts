export function hasDependency({
  name,
  rootDirectory,
}: {
  name: string;
  rootDirectory: string;
}) {
  try {
    return Boolean(require.resolve(name, { paths: [rootDirectory] }));
  } catch (err) {
    return false;
  }
}
