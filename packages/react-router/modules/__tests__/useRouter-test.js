import React, { version as REACT_VERSION } from "react";
import ReactDOM from "react-dom";
import { useRouter, __RouterContext as RouterContext } from "react-router";

import renderStrict from "./utils/renderStrict";
import compareVersions from "./utils/compareVersions";

function noop() {}

describe("useRouter()", () => {
  const node = document.createElement("div");

  afterEach(() => {
    ReactDOM.unmountComponentAtNode(node);
  });

  describe("with React version 16.8.0 or later", () => {
    if (compareVersions("16.8.0", REACT_VERSION) === 1) {
      it.skip("returns the current context value", noop);

      describe("without a <Router>", () => {
        it.skip("throws an error", noop);
      });

      return;
    }

    describe("without a <Router>", () => {
      it("throws an error", () => {
        jest.spyOn(console, "error").mockImplementation(() => {});

        function TestComponent() {
          useRouter();
        }

        expect(() => {
          renderStrict(<TestComponent />, node);
        }).toThrow(/You should not use useRouter\(\) outside a <Router>/);
      });
    });

    it("returns the current context value", () => {
      function TestComponent() {
        const context = useRouter();

        return (
          <RouterContext.Consumer>
            {children => {
              expect(children).toBe(context);
            }}
          </RouterContext.Consumer>
        );
      }

      renderStrict(
        <RouterContext.Provider value={{ foobar: "barbaz" }}>
          <TestComponent />
        </RouterContext.Provider>,
        node
      );
    });
  });
});
