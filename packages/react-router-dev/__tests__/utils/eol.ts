export const normalize = (text: string, normalized = "\n") =>
  text.replace(/\r?\n/g, normalized);
