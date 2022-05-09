import React from "react";
import ReactDOM from "react-dom";
import { createMemoryHistory as createHistory } from "history";
import { Router } from "react-router";

import renderStrict from "./utils/renderStrict.js";

describe("A <Router>", () => {
  const node = document.createElement("div");

  afterEach(() => {
    ReactDOM.unmountComponentAtNode(node);
  });

  describe("with no children", () => {
    it("does not throw an error", () => {
      expect(() => {
        renderStrict(<Router history={createHistory()} />, node);
      }).not.toThrow();
    });
  });

  describe("with one child", () => {
    it("does not throw an error", () => {
      expect(() => {
        renderStrict(
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
        renderStrict(
          <Router history={createHistory()}>
            <p>Bubblegum</p>
            <p>Cupcakes</p>
          </Router>,
          node
        );
      }).not.toThrow();
    });
  });

  describe("with react v18 StrictMode semantics", () => {
    function simulateV18StrictModeRender(props, afterRender) {
      // Constructor gets called twice
      let router = new Router(props);
      router = new Router(props);

      // Swap out setState since we're not actually mounting the component
      router.setState = jest.fn();

      // Render is called twice
      router.render();
      router.render();

      if (afterRender) afterRender();

      router.componentDidMount();

      // Effects are invoked twice
      router.componentWillUnmount();
      router.componentDidMount();

      return router;
    }

    it("responds to history changes", () => {
      const history = createHistory();
      const props = { history, children: <p>Foo</p> };

      const router = simulateV18StrictModeRender(props);

      history.push("/foo");

      expect(router.setState).toHaveBeenCalledTimes(1);
      expect(router.setState).toHaveBeenCalledWith({
        location: expect.objectContaining({ pathname: "/foo" })
      });
    });

    it("can handle path changes on child mount", () => {
      const history = createHistory();
      const props = { history, children: <p>Foo</p> };

      const router = simulateV18StrictModeRender(props, () => {
        history.push("/baz");
        history.push("/qux");
        history.push("/foo");
      });

      expect(router.setState).toHaveBeenCalledTimes(1);
      expect(router.setState).toHaveBeenCalledWith({
        location: expect.objectContaining({ pathname: "/foo" })
      });

      history.push("/bar");

      expect(router.setState).toHaveBeenCalledTimes(2);
      expect(router.setState).toHaveBeenCalledWith({
        location: expect.objectContaining({ pathname: "/bar" })
      });
    });
  });
});
