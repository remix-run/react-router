import React from "react";
import ReactDOM from "react-dom";
import PropTypes from "prop-types";

import MemoryRouter from "../MemoryRouter";
import RouterContext from "../RouterContext";

describe("A <MemoryRouter>", () => {
  const node = document.createElement("div");

  afterEach(() => {
    ReactDOM.unmountComponentAtNode(node);
  });

  describe("with a history prop", () => {
    it("logs a warning", () => {
      spyOn(console, "error");

      const history = {};
      ReactDOM.render(<MemoryRouter history={history} />, node);

      expect(console.error).toHaveBeenCalledWith(
        expect.stringContaining("<MemoryRouter> ignores the history prop")
      );
    });
  });

  describe("context", () => {
    let context;
    class ContextChecker extends React.Component {
      render() {
        return (
          <RouterContext.Consumer>
            {value => {
              context = value;
              return null;
            }}
          </RouterContext.Consumer>
        );
      }
    }

    afterEach(() => {
      context = undefined;
    });

    it("has a history property", () => {
      ReactDOM.render(
        <MemoryRouter>
          <ContextChecker />
        </MemoryRouter>,
        node
      );

      expect(typeof context.history).toBe("object");
    });
  });

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

    it("has a history property", () => {
      ReactDOM.render(
        <MemoryRouter>
          <LegacyContextChecker />
        </MemoryRouter>,
        node
      );

      expect(typeof context.history).toBe("object");
    });
  });
});
