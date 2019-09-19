import React from "react";
import ReactDOM from "react-dom";
import { MemoryRouter, Route, useHistory } from "react-router";

import renderStrict from "./utils/renderStrict.js";

describe("useHistory", () => {
  const node = document.createElement("div");

  afterEach(() => {
    ReactDOM.unmountComponentAtNode(node);
  });

  it("returns the history object", () => {
    let history;

    function HomePage() {
      history = useHistory();
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

    expect(typeof history).toBe("object");
    expect(typeof history.push).toBe("function");
  });
});
