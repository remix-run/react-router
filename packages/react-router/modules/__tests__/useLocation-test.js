import React, { version as REACT_VERSION } from "react";
import ReactDOM from "react-dom";
import { createMemoryHistory as createHistory } from "history";
import { useLocation, Route, MemoryRouter, Router } from "react-router";

import renderStrict from "./utils/renderStrict";
import compareVersions from "./utils/compareVersions";

function noop() {}

describe("useParams()", () => {
  const node = document.createElement("div");

  afterEach(() => {
    ReactDOM.unmountComponentAtNode(node);
  });

  describe("with React version 16.8.0 or later", () => {
    if (compareVersions("16.8.0", REACT_VERSION) === 1) {
      it.skip("returns the current parameters", noop);

      describe("without a <Router>", () => {
        it.skip("throws an error", noop);
      });

      describe("the `location` return value", () => {
        it.skip("returns the current location", noop);
      });

      describe("the `navigate` return value", () => {
        it.skip("returns a function", noop);
        it.skip("uses the passed path", noop);

        describe("without 2nd argument / with 2nd argument is { replace: false }", () => {
          it.skip("uses history.push()", noop);
        });

        describe("with 2nd argument is { replace: true }", () => {
          it.skip("uses history.replace()", noop);
        });
      });

      return;
    }

    describe("without a <Router>", () => {
      it("throws an error", () => {
        jest.spyOn(console, "error").mockImplementation(() => {});

        function TestComponent() {
          useLocation();
        }

        expect(() => {
          renderStrict(<TestComponent />, node);
        }).toThrow(/You should not use useRouter\(\) outside a <Router>/);
      });
    });

    describe("the `location` return value", () => {
      it("returns the current location", () => {
        function TestComponent(args) {
          const { location: locationFromRoute } = args;
          const { location: locationFromHook } = useLocation();
          expect(locationFromHook).toBe(locationFromRoute);
          return null;
        }

        renderStrict(
          <MemoryRouter initialEntries={["/cupcakes"]}>
            <Route path="/cupcakes" component={TestComponent} />
          </MemoryRouter>,
          node
        );
      });
    });

    describe("the `navigate` return value", () => {
      it("returns a function", () => {
        function TestComponent() {
          const { navigate } = useLocation();
          expect(typeof navigate).toBe("function");
          return null;
        }

        renderStrict(
          <MemoryRouter initialEntries={["/cupcakes"]}>
            <Route path="/cupcakes" component={TestComponent} />
          </MemoryRouter>,
          node
        );
      });

      it("uses the passed path", () => {
        const history = createHistory({
          initialEntries: ["/cupcakes"]
        });

        history.push = jest.spyOn(history, "push");

        function TestComponent() {
          const { navigate } = useLocation();
          navigate("/foobar");
          return null;
        }

        renderStrict(
          <Router history={history}>
            <Route path="/cupcakes" component={TestComponent} />
          </Router>,
          node
        );

        expect(history.push).toHaveBeenCalledTimes(1);
        expect(history.push).toHaveBeenCalledWith("/foobar");
      });

      describe("without 2nd argument / with 2nd argument is { replace: false }", () => {
        it("uses history.push()", () => {
          const history = createHistory({
            initialEntries: ["/cupcakes"]
          });

          history.push = jest.spyOn(history, "push");
          history.replace = jest.spyOn(history, "replace");

          function TestComponent() {
            const { navigate } = useLocation();
            navigate("/foobar", { replace: false });
            return null;
          }

          renderStrict(
            <Router history={history}>
              <Route path="/cupcakes" component={TestComponent} />
            </Router>,
            node
          );

          expect(history.push).toHaveBeenCalledTimes(1);
          expect(history.push).toHaveBeenCalledWith("/foobar");
          expect(history.replace).toHaveBeenCalledTimes(0);
        });
      });

      describe("with 2nd argument is { replace: true }", () => {
        it("uses history.replace()", () => {
          const history = createHistory({
            initialEntries: ["/cupcakes"]
          });

          history.push = jest.spyOn(history, "push");
          history.replace = jest.spyOn(history, "replace");

          function TestComponent() {
            const { navigate } = useLocation();
            navigate("/foobar", { replace: true });
            return null;
          }

          renderStrict(
            <Router history={history}>
              <Route path="/cupcakes" component={TestComponent} />
            </Router>,
            node
          );

          expect(history.replace).toHaveBeenCalledTimes(1);
          expect(history.replace).toHaveBeenCalledWith("/foobar");
          expect(history.push).toHaveBeenCalledTimes(0);
        });
      });
    });
  });
});
