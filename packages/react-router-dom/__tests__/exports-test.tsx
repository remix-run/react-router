import * as ReactRouter from "react-router";
import * as ReactRouterDOM from "react-router-dom";

let nonReExportedKeys = new Set(["UNSAFE_mapRouteProperties"]);

let exportedButDifferent = new Set(["useFetcher", "useFetchers", "useSubmit"]);

describe("react-router-dom", () => {
  for (let key in ReactRouter) {
    if (nonReExportedKeys.has(key)) {
      it(`does not re-export ${key} from react-router`, () => {
        expect(ReactRouterDOM[key]).toBe(undefined);
      });
    } else if (exportedButDifferent.has(key)) {
      it(`exports ${key} but not from react-router`, () => {
        expect(ReactRouterDOM[key]).not.toBe(ReactRouter[key]);
      });
    } else {
      it(`re-exports ${key} from react-router`, () => {
        expect(ReactRouterDOM[key]).toBe(ReactRouter[key]);
      });
    }
  }
});
