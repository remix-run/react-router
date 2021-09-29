import * as React from "react";
import { create as createTestRenderer } from "react-test-renderer";
import type { PathMatch } from "react-router";
import { MemoryRouter as Router, Routes, Route, useMatch } from "react-router";

describe("useMatch", () => {
  describe("when the path matches the current URL", () => {
    it("returns the match", () => {
      let match: PathMatch | null = null;
      function Layout() {
        match = useMatch("home");
        return null;
      }

      createTestRenderer(
        <Router initialEntries={["/home"]}>
          <Routes>
            <Route path="/" element={<Layout />}>
              <Route path="/home" element={<h1>Home</h1>} />
            </Route>
          </Routes>
        </Router>
      );

      expect(match).toMatchObject({
        params: {},
        pathname: "/home",
        pattern: { path: "home" }
      });
    });
  });

  describe("when the current URL ends with a slash", () => {
    it("returns the match.pathname with the trailing slash", () => {
      let match = null;
      function Layout() {
        match = useMatch("home");
        return null;
      }

      createTestRenderer(
        <Router initialEntries={["/home/"]}>
          <Routes>
            <Route path="/" element={<Layout />}>
              <Route path="/home" element={<h1>Home</h1>} />
            </Route>
          </Routes>
        </Router>
      );

      expect(match).toMatchObject({
        params: {},
        pathname: "/home/",
        pattern: { path: "home" }
      });
    });
  });

  describe("when the path does not match the current URL", () => {
    it("returns null", () => {
      let match = null;
      function Layout() {
        match = useMatch("about");
        return null;
      }

      createTestRenderer(
        <Router initialEntries={["/home"]}>
          <Routes>
            <Route path="/" element={<Layout />}>
              <Route path="/home" element={<h1>Home</h1>} />
            </Route>
          </Routes>
        </Router>
      );

      expect(match).toBeNull();
    });
  });
});
