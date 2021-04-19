import React from "react";
import ReactDOM from "react-dom";
import { MemoryRouter, Route, useRouteMatch } from "react-router";
import { act, create } from "react-test-renderer";

import renderStrict from "./utils/renderStrict.js";

describe("useRouteMatch", () => {
  const node = document.createElement("div");

  afterEach(() => {
    ReactDOM.unmountComponentAtNode(node);
  });

  it("returns the match object", () => {
    let match;

    function HomePage() {
      match = useRouteMatch();
      return null;
    }

    const path = "/home";

    renderStrict(
      <MemoryRouter initialEntries={[path]}>
        <Route exact path={path} component={HomePage} />
      </MemoryRouter>,
      node
    );

    expect(match).toMatchObject({
      path: "/home",
      url: "/home",
      isExact: true
    });
  });

  it("returns the match object for a path", () => {
    let match;

    function HomePage() {
      match = useRouteMatch("/home");
      return null;
    }

    renderStrict(
      <MemoryRouter initialEntries={["/home"]}>
        <HomePage />
      </MemoryRouter>,
      node
    );

    expect(match).toMatchObject({
      path: "/home",
      url: "/home",
      isExact: true
    });
  });

  it("returns null if a mismatched path is passed", () => {
    let match;

    function HomePage() {
      match = useRouteMatch("/someotherpath");
      return null;
    }

    renderStrict(
      <MemoryRouter initialEntries={["/home"]}>
        <HomePage />
      </MemoryRouter>,
      node
    );

    expect(match).toBeNull();
  });

  it("memoizes the match object for a path", () => {
    let match;
    let firstMatch;

    function HomePage() {
      match = useRouteMatch("/home");

      if (!firstMatch) {
        firstMatch = match;
      }

      return null;
    }

    const path = "/home";
    const renderer = create(
      <MemoryRouter initialEntries={[path]}>
        <Route exact path={path} component={HomePage} />
      </MemoryRouter>
    );

    act(() => {
      renderer.update(
        <MemoryRouter initialEntries={[path]}>
          <Route exact path={path} component={HomePage} />
        </MemoryRouter>
      );
    });

    expect(match).toBe(firstMatch);
  });
});
