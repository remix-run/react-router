import * as ReactRouter from "react-router";
import * as ReactRouterNative from "react-router-native";

let nonReExportedKeys = new Set(["UNSAFE_mapRouteProperties"]);

describe("react-router-native", () => {
  for (let key in ReactRouter) {
    if (nonReExportedKeys.has(key)) {
      it(`does not re-export ${key} from react-router`, () => {
        expect(ReactRouterNative[key]).toBe(undefined);
      });
    } else {
      it(`re-exports ${key} from react-router`, () => {
        expect(ReactRouterNative[key]).toBe(ReactRouter[key]);
      });
    }
  }
});
