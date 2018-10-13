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
      spyOn(console, "error");

      const history = {};
      renderStrict(<HashRouter history={history} />, node);

      expect(console.error).toHaveBeenCalledWith(
        expect.stringContaining("<HashRouter> ignores the history prop")
      );
    });
  });
});
