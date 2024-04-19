import * as ReactRouter from "react-router";
import * as ReactRouterDOM from "react-router-dom";

let nonReExportedKeys = new Set([
  "UNSAFE_mapRouteProperties",
  "UNSAFE_useRoutesImpl",
]);

let modifiedExports = new Set(["RouterProvider"]);

describe("react-router-dom", () => {
  for (let key in ReactRouter) {
    if (nonReExportedKeys.has(key)) {
      it(`does not re-export ${key} from react-router`, () => {
        expect(ReactRouterDOM[key]).toBe(undefined);
      });
    } else if (modifiedExports.has(key)) {
      it(`re-exports a different version of ${key}`, () => {
        expect(ReactRouterDOM[key]).toBeDefined();
        expect(ReactRouterDOM[key]).not.toBe(ReactRouter[key]);
      });
    } else {
      it(`re-exports ${key} from react-router`, () => {
        expect(ReactRouterDOM[key]).toBe(ReactRouter[key]);
      });
    }
  }
});
