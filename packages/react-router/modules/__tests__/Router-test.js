import React from "react";
import ReactDOM from "react-dom";
import PropTypes from "prop-types";
import Router from "../Router";
import RouterContext from "../RouterContext";
import { createMemoryHistory as createHistory } from "history";

describe("A <Router>", () => {
  const node = document.createElement("div");

  afterEach(() => {
    ReactDOM.unmountComponentAtNode(node);
  });

  describe("when it has more than one child", () => {
    it("throws an error explaining a Router may have only one child", () => {
      spyOn(console, "error");

      expect(() => {
        ReactDOM.render(
          <Router history={createHistory()}>
            <p>Foo</p>
            <p>Bar</p>
          </Router>,
          node
        );
      }).toThrow(/A <Router> may have only one child element/);
    });
  });

  describe("with exactly one child", () => {
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

  describe("with no children", () => {
    it("does not throw an error", () => {
      expect(() => {
        ReactDOM.render(<Router history={createHistory()} />, node);
      }).not.toThrow();
    });
  });

  describe("context", () => {
    let rootContext;
    const ContextChecker = () => (
      <RouterContext.Consumer>
        {context => {
          rootContext = context;
          return null;
        }}
      </RouterContext.Consumer>
    );

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

      const newLocation = { pathname: "/new" };
      history.push(newLocation);

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
