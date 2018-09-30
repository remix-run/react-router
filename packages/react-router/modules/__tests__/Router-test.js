import React from "react";
import ReactDOM from "react-dom";
import { createMemoryHistory as createHistory } from "history";

import Router from "../Router";

describe("A <Router>", () => {
  const node = document.createElement("div");

  afterEach(() => {
    ReactDOM.unmountComponentAtNode(node);
  });

  describe("with no children", () => {
    it("does not throw an error", () => {
      expect(() => {
        ReactDOM.render(<Router history={createHistory()} />, node);
      }).not.toThrow();
    });
  });

  describe("with one child", () => {
    it("does not throw an error", () => {
      expect(() => {
        ReactDOM.render(
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
        ReactDOM.render(
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
