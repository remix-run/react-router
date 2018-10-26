import React from "react";
import ReactDOM from "react-dom";

import { HashRouter } from "react-router-dom";

import renderStrict from "./utils/renderStrict";

describe("A <HashRouter>", () => {
  const node = document.createElement("div");

  afterEach(() => {
    ReactDOM.unmountComponentAtNode(node);
  });

  describe("with a `history` prop", () => {
    it("logs a warning to the console", () => {
      jest.spyOn(console, "error").mockImplementation(() => {});

      const history = {};
      renderStrict(<HashRouter history={history} />, node);

      expect(console.error).toHaveBeenCalledWith(
        expect.stringContaining("<HashRouter> ignores the history prop")
      );
    });
  });
});
