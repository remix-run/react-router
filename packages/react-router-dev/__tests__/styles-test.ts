import { isCssUrlWithoutSideEffects } from "../vite/styles";

describe("isCssUrlWithoutSideEffects", () => {
  it("returns true for query parameters that result in an exported value with no side effects", () => {
    let urls = [
      "my/file.css?inline",
      "my/file.css?inline-css",
      "my/file.css?inline&raw",
      "my/file.css?raw",
      "my/file.css?raw&url",
      "my/file.css?url",
      "my/file.css?url&something=else",
      "my/file.css?something=else&url",
      "my/file.css?url&raw",

      // other parameters mixed in
      "my/file.css?inline&something=else",
      "my/file.css?something=else&inline",
      "my/file.css?inline&raw&something=else",
      "my/file.css?something=else&inline&raw",
      "my/file.css?raw&something=else&url",
      "my/file.css?something=else&raw&url",
      "my/file.css?url&something=else&raw",
      "my/file.css?url&raw&something=else",
      "my/file.css?something=else&url&raw",
    ];

    for (let url of urls) {
      expect(isCssUrlWithoutSideEffects(url)).toBe(true);
    }
  });

  it("returns false for other query parameters or no parameters", () => {
    let urls = [
      "my/file.css",
      "my/file.css?foo",
      "my/file.css?foo=bar",
      "my/file.css?foo&bar",
      "my/file.css?inlinex",
      "my/file.css?rawx",
      "my/file.css?urlx",

      // values other than blank since Vite doesn't match these
      "my/file.css?inline=foo",
      "my/file.css?inline-css=foo",
      "my/file.css?raw=foo",
      "my/file.css?url=foo",

      // explicitly blank values since Vite doesn't match these
      "my/file.css?inline=",
      "my/file.css?inline-css=",
      "my/file.css?raw=",
      "my/file.css?url=",
    ];

    for (let url of urls) {
      expect(isCssUrlWithoutSideEffects(url)).toBe(false);
    }
  });
});
