import React from "react";
import ReactDOM from "react-dom";
import createHistory from "history/createMemoryHistory";

import { MemoryRouter, StaticRouter, Router } from "react-router";

if (React.StrictMode) {
  describe("in <StrictMode>", () => {
    const node = document.createElement("div");

    afterEach(() => {
      ReactDOM.unmountComponentAtNode(node);
    });

    describe("a <MemoryRouter>", () => {
      it("does not trigger any warnings", () => {
        spyOn(console, "error");

        ReactDOM.render(
          <React.StrictMode>
            <MemoryRouter />
          </React.StrictMode>,
          node
        );

        expect(console.error).not.toHaveBeenCalled();
      });
    });

    describe("a <StaticRouter>", () => {
      it("does not trigger any warnings", () => {
        spyOn(console, "error");

        ReactDOM.render(
          <React.StrictMode>
            <StaticRouter />
          </React.StrictMode>,
          node
        );

        expect(console.error).not.toHaveBeenCalled();
      });
    });

    describe("a <Router>", () => {
      it("does not trigger any warnings", () => {
        spyOn(console, "error");

        ReactDOM.render(
          <React.StrictMode>
            <Router history={createHistory()} />
          </React.StrictMode>,
          node
        );

        expect(console.error).not.toHaveBeenCalled();
      });
    });
  });
} else {
  console.log(
    "Skipping <StrictMode> tests because React %s does not support it",
    React.version
  );
}
