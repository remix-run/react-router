import * as React from "react";
import * as ReactDOM from "react-dom";
import { create as createTestRenderer } from "react-test-renderer";
import { MemoryRouter as Router, useRoutes } from "react-router";
import { act } from "react-dom/test-utils";
import type { PartialRouteObject } from "react-router";

describe("useRoutes", () => {
  it("returns the matching element from a route config", () => {
    function Home() {
      return <h1>Home</h1>;
    }

    function About() {
      return <h1>About</h1>;
    }

    let routes = [
      { path: "home", element: <Home /> },
      { path: "about", element: <About /> }
    ];

    let renderer = createTestRenderer(
      <Router initialEntries={["/home"]}>
        <RoutesRenderer routes={routes} />
      </Router>
    );

    expect(renderer.toJSON()).toMatchSnapshot();
  });

  it("Uses the `location` prop instead of context location`", () => {
    let node = document.createElement("div");
    document.body.appendChild(node);

    let routes = [
      { path: "one", element: <h1>one</h1> },
      { path: "two", element: <h1>two</h1> }
    ];

    act(() => {
      ReactDOM.render(
        <Router initialEntries={["/one"]}>
          <RoutesRenderer routes={routes} location={{ pathname: "/two" }} />
        </Router>,
        node
      );
    });

    expect(node.innerHTML).toMatch(/two/);

    // cleanup
    document.body.removeChild(node);
  });
});

function RoutesRenderer({
  routes,
  basename,
  location
}: {
  routes: PartialRouteObject[];
  basename?: string;
  location?: Partial<Location> & { pathname: string };
}) {
  return useRoutes(routes, { basename, location });
}
