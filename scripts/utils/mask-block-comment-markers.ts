/**
 * Neutralize block-comment delimiters that appear inside JavaScript/TypeScript
 * string literals (including nested template literals).
 *
 * `dox` finds comments with a regex that is not string-aware, so a slash-star
 * sequence inside a template string is treated as the start of a block
 * comment. That can swallow subsequent source (and the next real JSDoc) into
 * the wrong API's documentation — see #15558 / #15561.
 *
 * The mask inserts a zero-width space between `/` and `*` (or `*` and `/`) so
 * the contiguous comment delimiter no longer appears, while leaving real block
 * comments untouched.
 */
const ZERO_WIDTH_SPACE = "\u200b";

export function maskBlockCommentMarkersInStrings(source: string): string {
  let out = "";
  let i = 0;
  const n = source.length;

  while (i < n) {
    let c = source[i];

    // Line comment — copy through end of line
    if (c === "/" && source[i + 1] === "/") {
      let end = source.indexOf("\n", i);
      if (end === -1) {
        out += source.slice(i);
        break;
      }
      out += source.slice(i, end);
      i = end;
      continue;
    }

    // Block comment — copy through closing */
    if (c === "/" && source[i + 1] === "*") {
      let end = source.indexOf("*/", i + 2);
      if (end === -1) {
        out += source.slice(i);
        break;
      }
      out += source.slice(i, end + 2);
      i = end + 2;
      continue;
    }

    // String literal
    if (c === "'" || c === '"' || c === "`") {
      let { text, nextIndex } = readAndMaskString(source, i);
      out += text;
      i = nextIndex;
      continue;
    }

    out += c;
    i++;
  }

  return out;
}

function readAndMaskString(
  source: string,
  start: number,
): { text: string; nextIndex: number } {
  let quote = source[start];
  let out = quote;
  let i = start + 1;
  const n = source.length;

  while (i < n) {
    let c = source[i];

    if (c === "\\") {
      out += c + (source[i + 1] ?? "");
      i += 2;
      continue;
    }

    if (quote === "`" && c === "$" && source[i + 1] === "{") {
      out += "${";
      i += 2;
      let depth = 1;
      while (i < n && depth > 0) {
        let ch = source[i];

        if (ch === "/" && source[i + 1] === "/") {
          let end = source.indexOf("\n", i);
          if (end === -1) {
            out += source.slice(i);
            return { text: out, nextIndex: n };
          }
          out += source.slice(i, end);
          i = end;
          continue;
        }

        if (ch === "/" && source[i + 1] === "*") {
          let end = source.indexOf("*/", i + 2);
          if (end === -1) {
            out += source.slice(i);
            return { text: out, nextIndex: n };
          }
          out += source.slice(i, end + 2);
          i = end + 2;
          continue;
        }

        if (ch === "'" || ch === '"' || ch === "`") {
          let nested = readAndMaskString(source, i);
          out += nested.text;
          i = nested.nextIndex;
          continue;
        }

        if (ch === "{") depth++;
        else if (ch === "}") depth--;

        out += ch;
        i++;
      }
      continue;
    }

    if (c === "/" && source[i + 1] === "*") {
      out += "/" + ZERO_WIDTH_SPACE + "*";
      i += 2;
      continue;
    }

    if (c === "*" && source[i + 1] === "/") {
      out += "*" + ZERO_WIDTH_SPACE + "/";
      i += 2;
      continue;
    }

    out += c;
    i++;

    if (c === quote) {
      return { text: out, nextIndex: i };
    }
  }

  return { text: out, nextIndex: n };
}
