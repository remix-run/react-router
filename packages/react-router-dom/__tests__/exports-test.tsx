import * as ReactRouter from "react-router";
import * as ReactRouterDOM from "react-router-dom";

describe("react-router-dom", () => {
  for (let key in ReactRouter) {
    it(`re-exports ${key} from react-router`, () => {
      // @ts-ignore
      expect(ReactRouterDOM[key]).toBe(ReactRouter[key]);
    });
  }
});
