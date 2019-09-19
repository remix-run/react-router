import React from "react";
import ReactDOM from "react-dom";
import { MemoryRouter, Route, useLocation } from "react-router";

import renderStrict from "./utils/renderStrict.js";

describe("useLocation", () => {
  const node = document.createElement("div");

  afterEach(() => {
    ReactDOM.unmountComponentAtNode(node);
  });

  it("returns the current location object", () => {
    let location;

    function HomePage() {
      location = useLocation();
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

    expect(typeof location).toBe("object");
    expect(location).toMatchObject({
      pathname: "/home"
    });
  });
});
