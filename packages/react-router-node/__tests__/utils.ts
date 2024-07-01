import prettier from "prettier";

export function prettyHtml(source: string): string {
  return prettier.format(source, { parser: "html" });
}
