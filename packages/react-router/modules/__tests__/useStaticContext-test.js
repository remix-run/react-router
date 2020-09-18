import React from "react";
import ReactDOM from "react-dom";
import { StaticRouter, Route, useStaticContext } from "react-router";

import renderStrict from "./utils/renderStrict.js";

describe("useStaticContext", () => {
  const node = document.createElement("div");

  afterEach(() => {
    ReactDOM.unmountComponentAtNode(node);
  });

  it("returns the static context object", () => {
    let staticContext;

    function HomePage() {
      staticContext = useStaticContext();
      return null;
    }

    renderStrict(
      <StaticRouter location="/home" context={{ foo: "bar" }}>
        <Route path="/home">
          <HomePage />
        </Route>
      </StaticRouter>,
      node
    );

    expect(staticContext).toEqual({ foo: "bar" });
  });
});
