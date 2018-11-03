import React from "react";
import ReactDOM from "react-dom";
import { MemoryRouter, Route, useRouter } from "react-router";

import renderStrict from "./utils/renderStrict";

describe("useRouter", () => {
  let node = document.createElement("div");

  afterEach(() => {
    ReactDOM.unmountComponentAtNode(node);
  });

  it("provides the <Route> props", () => {
    let router;
    function TestComponent() {
      router = useRouter();
      return null;
    }

    renderStrict(
      <MemoryRouter initialEntries={["/one"]}>
        <Route path="/:id" component={TestComponent} />
      </MemoryRouter>,
      node
    );

    expect(router).toBeDefined();
    expect(router.match.url).toBe("/one");
    expect(router.match.path).toBe("/:id");
    expect(router.match.params).toBeDefined();
    expect(router.match.params.id).toBe("one");
  });
});
