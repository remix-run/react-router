import * as ReactRouter from "react-router";
import * as ReactRouterNative from "react-router-native";

describe("react-router-native", () => {
  for (let key in ReactRouter) {
    // react-router-native wraps the createScopedMemoryRouterEnvironment function from react-router
    // to add additional native-related hooks / components.
    if (key === "createScopedMemoryRouterEnvironment") {
      continue;
    }

    it(`re-exports ${key} from react-router`, () => {
      expect(ReactRouterNative[key]).toBe(ReactRouter[key]);
    });
  }
});
