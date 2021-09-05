import React from "react";
import ReactDOM from "react-dom";
import TestUtils from "react-dom/test-utils";
import { Router, useNavigate } from "react-router-dom";
import { createMemoryHistory } from "history";

import renderStrict from "./utils/renderStrict.js";

describe("useNavigate", () => {
  const node = document.createElement("div");
  let memoryHistory, pushSpy, replaceSpy;

  beforeEach(() => {
    memoryHistory = createMemoryHistory();
    pushSpy = jest.spyOn(memoryHistory, "push");
    replaceSpy = jest.spyOn(memoryHistory, "push");
  });

  afterEach(() => {
    ReactDOM.unmountComponentAtNode(node);
    pushSpy.mockRestore();
    replaceSpy.mockRestore();
  });

  it("calls history.push", () => {
    let to = "/the/path?the=query#the-hash";
    function Button() {
      let navigate = useNavigate();
      return <button onClick={() => navigate(to)}>navigate</button>;
    }

    renderStrict(
      <Router history={memoryHistory}>
        <Button />
      </Router>,
      node
    );

    const button = node.querySelector("button");
    TestUtils.Simulate.click(button, {
      defaultPrevented: false,
      button: 0
    });
    expect(pushSpy).toBeCalledTimes(1);
    expect(pushSpy).toBeCalledWith(to);
  });

  it("calls history.replace on duplicate navigation", () => {
    const to = "/duplicate/path?the=query#the-hash";
    function Button() {
      let navigate = useNavigate();
      return <button onClick={() => navigate(to)}>navigate</button>;
    }

    renderStrict(
      <Router history={memoryHistory}>
        <Button />
      </Router>,
      node
    );

    const button = node.querySelector("button");
    TestUtils.Simulate.click(button, {
      defaultPrevented: false,
      button: 0
    });

    TestUtils.Simulate.click(button, {
      defaultPrevented: false,
      button: 0
    });

    expect(pushSpy).toBeCalledTimes(1);
    expect(pushSpy).toBeCalledWith(to);
    expect(replaceSpy).toBeCalledTimes(1);
    expect(replaceSpy).toBeCalledWith(to);
  });

  it("calls history.push with function `to` argument", () => {
    // Make push a no-op so key IDs do not change
    pushSpy.mockImplementation();

    let to = null;
    const toFn = location => {
      to = {
        ...location,
        pathname: "hello",
        search: "world"
      };
      return to;
    };

    function Button() {
      let navigate = useNavigate();
      return <button onClick={() => navigate(toFn)}>navigate</button>;
    }

    renderStrict(
      <Router history={memoryHistory}>
        <Button />
      </Router>,
      node
    );

    const button = node.querySelector("button");
    TestUtils.Simulate.click(button, {
      defaultPrevented: false,
      button: 0
    });

    expect(pushSpy).toBeCalledTimes(1);
    expect(pushSpy).toBeCalledWith(to);
  });
});
