import React from "react";
import ReactDOM from "react-dom";
import { createMemoryHistory as createHistory } from "history";

import renderStrict from "./utils/renderStrict";

// resolved by jest
import { Router } from "react-router";

describe("A <Router>", () => {
  const node = document.createElement("div");

  afterEach(() => {
    ReactDOM.unmountComponentAtNode(node);
  });

  describe("with no children", () => {
    it("does not throw an error", () => {
      expect(() => {
        renderStrict(<Router history={createHistory()} />, node);
      }).not.toThrow();
    });
  });

  describe("with one child", () => {
    it("does not throw an error", () => {
      expect(() => {
        renderStrict(
          <Router history={createHistory()}>
            <p>Bar</p>
          </Router>,
          node
        );
      }).not.toThrow();
    });
  });

  describe("with more than one child", () => {
    it("does not throw an error", () => {
      expect(() => {
        renderStrict(
          <Router history={createHistory()}>
            <p>Bubblegum</p>
            <p>Cupcakes</p>
          </Router>,
          node
        );
      }).not.toThrow();
    });
  });
});
