import React from "react";
import ReactDOM from "react-dom";
import PropTypes from "prop-types";
import { createMemoryHistory as createHistory } from "history";

import { Router, __RouterContext as RouterContext } from "react-router";

import renderStrict from "./utils/renderStrict";

describe("A <Router>", () => {
  const node = document.createElement("div");

  afterEach(() => {
    ReactDOM.unmountComponentAtNode(node);
  });

  describe("context", () => {
    let context;
    function ContextChecker() {
      return (
        <RouterContext.Consumer>
          {value => {
            context = value;
            return null;
          }}
        </RouterContext.Consumer>
      );
    }

    afterEach(() => {
      context = undefined;
    });

    it("has a `history` property", () => {
      const history = createHistory();

      renderStrict(
        <Router history={history}>
          <ContextChecker />
        </Router>,
        node
      );

      expect(context.history).toBe(history);
    });

    it("has a `location` property", () => {
      const history = createHistory();

      renderStrict(
        <Router history={history}>
          <ContextChecker />
        </Router>,
        node
      );

      expect(context.location).toBe(history.location);
    });

    it("has a `match` property", () => {
      const history = createHistory({
        initialEntries: ["/"]
      });

      renderStrict(
        <Router history={history}>
          <ContextChecker />
        </Router>,
        node
      );

      expect(context.match).toMatchObject({
        path: "/",
        url: "/",
        params: {},
        isExact: true
      });
    });

    it("does not have a `staticContext` property", () => {
      const history = createHistory();

      renderStrict(
        <Router history={history}>
          <ContextChecker />
        </Router>,
        node
      );

      expect(context.staticContext).toBe(undefined);
    });
  });

  if (!React.createContext) {
    describe("legacy context", () => {
      let context;
      class LegacyContextChecker extends React.Component {
        static contextTypes = {
          router: PropTypes.object.isRequired
        };

        render() {
          context = this.context.router;
          return null;
        }
      }

      afterEach(() => {
        context = undefined;
      });

      it("has a `history` property that warns when it is accessed", () => {
        spyOn(console, "error");

        const history = createHistory();

        renderStrict(
          <Router history={history}>
            <LegacyContextChecker />
          </Router>,
          node
        );

        expect(context.history).toBe(history);

        expect(console.error).toHaveBeenCalledWith(
          expect.stringMatching(
            "You should not be using this.context.router.history directly"
          )
        );
      });

      it("has a `location` property that warns when it is accessed", () => {
        spyOn(console, "error");

        const history = createHistory();

        renderStrict(
          <Router history={history}>
            <LegacyContextChecker />
          </Router>,
          node
        );

        expect(context.location).toBe(history.location);

        expect(console.error).toHaveBeenCalledWith(
          expect.stringMatching(
            "You should not be using this.context.router.location directly"
          )
        );
      });

      it("has a `match` property that warns when it is accessed", () => {
        spyOn(console, "error");

        const history = createHistory({
          initialEntries: ["/"]
        });

        renderStrict(
          <Router history={history}>
            <LegacyContextChecker />
          </Router>,
          node
        );

        expect(context.match).toMatchObject({
          path: "/",
          url: "/",
          params: {},
          isExact: true
        });

        expect(console.error).toHaveBeenCalledWith(
          expect.stringMatching(
            "You should not be using this.context.router.match directly"
          )
        );
      });

      it("has a `staticContext` property that warns when it is accessed", () => {
        spyOn(console, "error");

        const history = createHistory();

        renderStrict(
          <Router history={history}>
            <LegacyContextChecker />
          </Router>,
          node
        );

        expect(context.staticContext).toBe(undefined);

        expect(console.error).toHaveBeenCalledWith(
          expect.stringMatching(
            "You should not be using this.context.router.staticContext directly"
          )
        );
      });
    });
  }
});
