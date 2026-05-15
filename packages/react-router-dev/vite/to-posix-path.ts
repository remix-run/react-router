export function toPosixPath(path: string): string {
  return path.replace(/\\/g, "/");
}
