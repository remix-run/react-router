import React from "react";
import ReactDOM from "react-dom";
import { MemoryRouter, useRouteMatch } from "react-router";

import renderStrict from "./utils/renderStrict.js";

describe("useRouteMatch", () => {
  const node = document.createElement("div");

  afterEach(() => {
    ReactDOM.unmountComponentAtNode(node);
  });

  it("returns the match object", () => {
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

    expect(typeof match).toBe("object");
    expect(match).toMatchObject({
      path: "/home",
      url: "/home",
      isExact: true
    });
  });
});
