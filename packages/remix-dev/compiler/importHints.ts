const importHints = ["css:", "img:", "url:"];

export function isImportHint(id: string): boolean {
  return importHints.some(hint => id.startsWith(hint));
}
