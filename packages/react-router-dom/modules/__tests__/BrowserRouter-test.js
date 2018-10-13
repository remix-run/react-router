import React from "react";
import ReactDOM from "react-dom";

import { BrowserRouter } from "react-router-dom";

import renderStrict from "./utils/renderStrict";

describe("A <BrowserRouter>", () => {
  const node = document.createElement("div");

  afterEach(() => {
    ReactDOM.unmountComponentAtNode(node);
  });

  describe("with a `history` prop", () => {
    it("logs a warning to the console", () => {
      spyOn(console, "error");

      const history = {};
      renderStrict(<BrowserRouter history={history} />, node);

      expect(console.error).toHaveBeenCalledWith(
        expect.stringContaining("<BrowserRouter> ignores the history prop")
      );
    });
  });
});
