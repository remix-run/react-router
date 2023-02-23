import * as ReactRouter from "react-router";
import * as ReactRouterDOM from "react-router-dom";

let nonReExportedKeys = new Set(["UNSAFE_detectErrorBoundary"]);

describe("react-router-dom", () => {
  for (let key in ReactRouter) {
    if (!nonReExportedKeys.has(key)) {
      it(`re-exports ${key} from react-router`, () => {
        expect(ReactRouterDOM[key]).toBe(ReactRouter[key]);
      });
    } else {
      it(`does not re-export ${key} from react-router`, () => {
        expect(ReactRouterDOM[key]).toBe(undefined);
      });
    }
  }
});
