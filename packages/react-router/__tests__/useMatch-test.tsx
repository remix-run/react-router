import * as React from "react";
import { create as createTestRenderer } from "react-test-renderer";
import { MemoryRouter as Router, Routes, Route, useMatch } from "react-router";
import type { PathMatch } from "react-router";

describe("useMatch", () => {
  describe("when the path matches the current URL", () => {
    it("returns the match", () => {
      let match: PathMatch | null = null;
      function Layout() {
        match = useMatch("home");
        return null;
      }

      function Home() {
        return <h1>Home</h1>;
      }

      createTestRenderer(
        <Router initialEntries={["/home"]}>
          <Routes>
            <Route path="/" element={<Layout />}>
              <Route path="/home" element={<Home />} />
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
    it("returns the match.url with no trailing slash", () => {
      let match: PathMatch | null = null;
      function Layout() {
        match = useMatch("home");
        return null;
      }

      function Home() {
        return <h1>Home</h1>;
      }

      createTestRenderer(
        <Router initialEntries={["/home/"]}>
          <Routes>
            <Route path="/" element={<Layout />}>
              <Route path="/home" element={<Home />} />
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

  describe("when the path does not match the current URL", () => {
    it("returns null", () => {
      let match;
      function Layout() {
        match = useMatch("about");
        return null;
      }

      function Home() {
        return <h1>Home</h1>;
      }

      createTestRenderer(
        <Router initialEntries={["/home"]}>
          <Routes>
            <Route path="/" element={<Layout />}>
              <Route path="/home" element={<Home />} />
            </Route>
          </Routes>
        </Router>
      );

      expect(match).toBe(null);
    });
  });
});
