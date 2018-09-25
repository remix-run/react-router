import React from "react";
import ReactDOM from "react-dom";
import { createMemoryHistory as createHistory } from "history";

import Router from "../Router";
import RouterContext from "../RouterContext";

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

  describe("context", () => {
    let rootContext;
    function ContextChecker() {
      return (
        <RouterContext.Consumer>
          {context => {
            rootContext = context;
            return null;
          }}
        </RouterContext.Consumer>
      );
    }

    afterEach(() => {
      rootContext = undefined;
    });

    it("puts history on context.history", () => {
      const history = createHistory();

      ReactDOM.render(
        <Router history={history}>
          <ContextChecker />
        </Router>,
        node
      );

      expect(rootContext.history).toBe(history);
    });

    it("sets context.router.route at the root", () => {
      const history = createHistory({
        initialEntries: ["/"]
      });

      ReactDOM.render(
        <Router history={history}>
          <ContextChecker />
        </Router>,
        node
      );

      expect(rootContext.route.match.path).toEqual("/");
      expect(rootContext.route.match.url).toEqual("/");
      expect(rootContext.route.match.params).toEqual({});
      expect(rootContext.route.match.isExact).toEqual(true);
      expect(rootContext.route.location).toEqual(history.location);
    });

    it("updates context.router.route upon navigation", () => {
      const history = createHistory({
        initialEntries: ["/"]
      });

      ReactDOM.render(
        <Router history={history}>
          <ContextChecker />
        </Router>,
        node
      );

      expect(rootContext.route.match.isExact).toBe(true);

      history.push("/new");

      expect(rootContext.route.match.isExact).toBe(false);
    });

    it("does not contain context.router.staticContext by default", () => {
      const history = createHistory({
        initialEntries: ["/"]
      });

      ReactDOM.render(
        <Router history={history}>
          <ContextChecker />
        </Router>,
        node
      );

      expect(rootContext.staticContext).toBe(undefined);
    });
  });
});
