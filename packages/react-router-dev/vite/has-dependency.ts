import { createRequire } from "node:module";

const nodeRequire = createRequire(import.meta.url);

export function hasDependency({
  name,
  rootDirectory,
}: {
  name: string;
  rootDirectory: string;
}) {
  try {
    return Boolean(nodeRequire.resolve(name, { paths: [rootDirectory] }));
  } catch (
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    e
  ) {
    return false;
  }
}
