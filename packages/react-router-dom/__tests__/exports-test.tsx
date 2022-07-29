import * as ReactRouter from "react-router";
import * as ReactRouterDOM from "react-router-dom";

describe("react-router-dom", () => {
  for (let key in ReactRouter) {
    // react-router-dom wraps the createScopedMemoryRouterEnvironment function from react-router
    // to add additional dom-related hooks / components.
    if (key === "createScopedMemoryRouterEnvironment") {
      continue;
    }

    it(`re-exports ${key} from react-router`, () => {
      expect(ReactRouterDOM[key]).toBe(ReactRouter[key]);
    });
  }
});
