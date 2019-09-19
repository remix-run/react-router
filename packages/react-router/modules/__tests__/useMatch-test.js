import React from "react";
import ReactDOM from "react-dom";
import { MemoryRouter, Route, useMatch } from "react-router";

import renderStrict from "./utils/renderStrict.js";

describe("useMatch", () => {
  const node = document.createElement("div");

  afterEach(() => {
    ReactDOM.unmountComponentAtNode(node);
  });

  it("returns the match object", () => {
    let match;

    function HomePage() {
      match = useMatch();
      return null;
    }

    renderStrict(
      <MemoryRouter initialEntries={["/home"]}>
        <Route path="/home">
          <HomePage />
        </Route>
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
