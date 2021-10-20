import * as ReactRouter from "react-router";
import * as ReactRouterNative from "react-router-native";

describe("react-router-native", () => {
  for (let key in ReactRouter) {
    it(`re-exports ${key} from react-router`, () => {
      expect(ReactRouterNative[key]).toBe(ReactRouter[key]);
    });
  }
});
