import React from "react";
import ReactDOM from "react-dom";

import { BrowserRouter, HashRouter } from "react-router-dom";

if (React.StrictMode) {
  describe("in <StrictMode>", () => {
    const node = document.createElement("div");

    afterEach(() => {
      ReactDOM.unmountComponentAtNode(node);
    });

    describe("a <BrowserRouter>", () => {
      it("does not trigger any warnings", () => {
        spyOn(console, "error");

        ReactDOM.render(
          <React.StrictMode>
            <BrowserRouter />
          </React.StrictMode>,
          node
        );

        expect(console.error).not.toHaveBeenCalled();
      });
    });

    describe("a <HashRouter>", () => {
      it("does not trigger any warnings", () => {
        spyOn(console, "error");

        ReactDOM.render(
          <React.StrictMode>
            <HashRouter />
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
