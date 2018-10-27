import React from "react";
import ReactDOM from "react-dom";

import { MemoryRouter } from "react-router";

import renderStrict from "./utils/renderStrict";

describe("A <MemoryRouter>", () => {
  const node = document.createElement("div");

  afterEach(() => {
    ReactDOM.unmountComponentAtNode(node);
  });

  describe("with a history prop", () => {
    it("logs a warning", () => {
      jest.spyOn(console, "error").mockImplementation(() => {});

      const history = {};
      renderStrict(<MemoryRouter history={history} />, node);

      expect(console.error).toHaveBeenCalledWith(
        expect.stringContaining("<MemoryRouter> ignores the history prop")
      );
    });
  });
});
