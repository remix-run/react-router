import React, { version as REACT_VERSION } from "react";
import ReactDOM from "react-dom";
import { useParams, Route, MemoryRouter } from "react-router";

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

      return;
    }

    describe("without a <Router>", () => {
      it("throws an error", () => {
        jest.spyOn(console, "error").mockImplementation(() => {});

        function TestComponent() {
          useParams();
        }

        expect(() => {
          renderStrict(<TestComponent />, node);
        }).toThrow(/You should not use useRouter\(\) outside a <Router>/);
      });
    });

    it("returns the current parameters", () => {
      function TestComponent() {
        const { foobar } = useParams();
        expect(foobar).toEqual("barbaz");
        return null;
      }

      renderStrict(
        <MemoryRouter initialEntries={["/cupcakes/barbaz"]}>
          <Route path="/cupcakes/:foobar" component={TestComponent} />
        </MemoryRouter>,
        node
      );
    });
  });
});
