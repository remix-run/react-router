import { unwrapDefault } from "./babel";

describe("unwrapDefault", () => {
  test("returns the default export from wrapped CommonJS imports", () => {
    function wrappedExport() {}

    expect(unwrapDefault({ default: wrappedExport })).toBe(wrappedExport);
  });

  test("returns the import value when the runtime has already unwrapped it", () => {
    function unwrappedExport() {}

    expect(unwrapDefault(unwrappedExport)).toBe(unwrappedExport);
  });
});
