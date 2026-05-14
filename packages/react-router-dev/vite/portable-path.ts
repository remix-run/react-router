export function toPortablePath(filePath: string): string {
  return filePath.replace(/\\/g, "/");
}
