import React from "react";
import ReactDOM from "react-dom";
import PropTypes from "prop-types";
import HashRouter from "../HashRouter";

describe("A <HashRouter>", () => {
  it("puts history on context.router", () => {
    let history;
    const ContextChecker = (props, context) => {
      history = context.router.history;
      return null;
    };

    ContextChecker.contextTypes = {
      router: PropTypes.object.isRequired
    };

    const node = document.createElement("div");

    ReactDOM.render(
      <HashRouter>
        <ContextChecker />
      </HashRouter>,
      node
    );

    expect(typeof history).toBe("object");
  });

  it("does not error in StrictMode", () => {
    const node = document.createElement("div");

    spyOn(console, "error");

    ReactDOM.render(
      <React.StrictMode>
        <HashRouter />
      </React.StrictMode>,
      node
    );

    expect(console.error).toHaveBeenCalledTimes(0);
  });

  it("warns when passed a history prop", () => {
    const history = {};
    const node = document.createElement("div");

    spyOn(console, "error");

    ReactDOM.render(<HashRouter history={history} />, node);

    expect(console.error).toHaveBeenCalledTimes(1);
    expect(console.error).toHaveBeenCalledWith(
      expect.stringContaining("<HashRouter> ignores the history prop")
    );
  });
});
