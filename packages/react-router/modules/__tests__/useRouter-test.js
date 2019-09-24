import React from "react";
import ReactDOM from "react-dom";
import { MemoryRouter, Route, useRouter } from "react-router";

import renderStrict from "./utils/renderStrict.js";

describe("useLocation", () => {
  const node = document.createElement("div");

  afterEach(() => {
    ReactDOM.unmountComponentAtNode(node);
  });

  it("returns the current location, match and history objects", () => {
    let routeComponentProps = {};

    function HomePage() {
      routeComponentProps = useRouter();
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

    expect(typeof routeComponentProps.location).toBe("object");
    expect(routeComponentProps.location).toMatchObject({
      pathname: "/home"
    });
    expect(typeof routeComponentProps.history).toBe("object");
    expect(typeof routeComponentProps.history.push).toBe("function");

    expect(typeof routeComponentProps.match).toBe("object");
    expect(routeComponentProps.match).toMatchObject({
      path: "/home",
      url: "/home",
      isExact: true
    });
  });
});
