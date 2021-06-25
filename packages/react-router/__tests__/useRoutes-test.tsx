import * as React from "react";
import { create as createTestRenderer } from "react-test-renderer";
import { MemoryRouter as Router, useRoutes } from "react-router";

describe("useRoutes", () => {
  it("returns the matching element from a route config", () => {
    function RoutesRenderer({ routes }) {
      return useRoutes(routes);
    }

    function Home() {
      return <h1>Home</h1>;
    }

    function About() {
      return <h1>About</h1>;
    }

    let routes = [
      { path: "home", element: <Home /> },
      { path: "about", element: <About /> },
    ];

    let renderer = createTestRenderer(
      <Router initialEntries={["/home"]}>
        <RoutesRenderer routes={routes} />
      </Router>
    );

    expect(renderer.toJSON()).toMatchSnapshot();
  });
});
