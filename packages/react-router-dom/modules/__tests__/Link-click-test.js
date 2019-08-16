import React from "react";
import ReactDOM from "react-dom";
import TestUtils from "react-dom/test-utils";
import { Router, Link } from "react-router-dom";
import { createMemoryHistory } from "history";

import renderStrict from "./utils/renderStrict";

describe("<Link> click events", () => {
  const node = document.createElement("div");

  afterEach(() => {
    ReactDOM.unmountComponentAtNode(node);
  });

  const memoryHistory = createMemoryHistory();
  memoryHistory.push = jest.fn();

  beforeEach(() => {
    memoryHistory.push.mockReset();
  });

  it("calls onClick eventhandler and history.push", () => {
    const clickHandler = jest.fn();
    const to = "/the/path?the=query#the-hash";

    renderStrict(
      <Router history={memoryHistory}>
        <Link to={to} onClick={clickHandler}>
          link
        </Link>
      </Router>,
      node
    );

    const a = node.querySelector("a");
    TestUtils.Simulate.click(a, {
      defaultPrevented: false,
      button: 0
    });

    expect(clickHandler).toBeCalledTimes(1);
    expect(memoryHistory.push).toBeCalledTimes(1);
    expect(memoryHistory.push).toBeCalledWith(to);
  });

  it("calls onClick eventhandler and history.push with function `to` prop", () => {
    const memoryHistoryFoo = createMemoryHistory({
      initialEntries: ["/foo"]
    });
    memoryHistoryFoo.push = jest.fn();
    const clickHandler = jest.fn();
    let to = null;
    const toFn = location => {
      to = {
        ...location,
        pathname: "hello",
        search: "world"
      };
      return to;
    };

    renderStrict(
      <Router history={memoryHistoryFoo}>
        <Link to={toFn} onClick={clickHandler}>
          link
        </Link>
      </Router>,
      node
    );

    const a = node.querySelector("a");
    TestUtils.Simulate.click(a, {
      defaultPrevented: false,
      button: 0
    });

    expect(clickHandler).toBeCalledTimes(1);
    expect(memoryHistoryFoo.push).toBeCalledTimes(1);
    expect(memoryHistoryFoo.push).toBeCalledWith(to);
  });

  it("does not call history.push on right click", () => {
    const to = "/the/path?the=query#the-hash";

    renderStrict(
      <Router history={memoryHistory}>
        <Link to={to}>link</Link>
      </Router>,
      node
    );

    const a = node.querySelector("a");
    TestUtils.Simulate.click(a, {
      defaultPrevented: false,
      button: 1
    });

    expect(memoryHistory.push).toBeCalledTimes(0);
  });

  it("does not call history.push on prevented event.", () => {
    const to = "/the/path?the=query#the-hash";

    renderStrict(
      <Router history={memoryHistory}>
        <Link to={to}>link</Link>
      </Router>,
      node
    );

    const a = node.querySelector("a");
    TestUtils.Simulate.click(a, {
      defaultPrevented: true,
      button: 0
    });

    expect(memoryHistory.push).toBeCalledTimes(0);
  });

  it("does not call history.push target not specifying 'self'", () => {
    const to = "/the/path?the=query#the-hash";

    renderStrict(
      <Router history={memoryHistory}>
        <Link to={to} target="_blank">
          link
        </Link>
      </Router>,
      node
    );

    const a = node.querySelector("a");
    TestUtils.Simulate.click(a, {
      defaultPrevented: false,
      button: 0
    });

    expect(memoryHistory.push).toBeCalledTimes(0);
  });

  it("prevents the default event handler if an error occurs", () => {
    const memoryHistory = createMemoryHistory();
    memoryHistory.push = jest.fn();
    const error = new Error();
    const clickHandler = () => {
      throw error;
    };
    const mockPreventDefault = jest.fn();
    const to = "/the/path?the=query#the-hash";

    renderStrict(
      <Router history={memoryHistory}>
        <Link to={to} onClick={clickHandler}>
          link
        </Link>
      </Router>,
      node
    );

    console.error = jest.fn(); // keep console clean. Dunno why the catch doesn't do the job correctly.
    try {
      const a = node.querySelector("a");
      TestUtils.Simulate.click(a, {
        defaultPrevented: false,
        preventDefault: mockPreventDefault,
        button: 1
      });
    } catch (e) {
      expect(e).toBe(error);
    }

    console.error.mockRestore();
    expect(clickHandler).toThrow(error);
    expect(mockPreventDefault).toHaveBeenCalled();
    expect(memoryHistory.push).toBeCalledTimes(0);
  });
});
