import * as React from "react";
import { create as createTestRenderer } from "react-test-renderer";
import {
  MemoryRouter as Router,
  Routes,
  Route,
  NavLink,
  Outlet
} from "react-router-dom";

describe("NavLink", () => {
  describe("when it does not match", () => {
    it("does not apply an 'active' className to the underlying <a>", () => {
      let renderer = createTestRenderer(
        <Router initialEntries={["/home"]}>
          <Routes>
            <Route
              path="/home"
              element={<NavLink to="somewhere-else">Somewhere else</NavLink>}
            />
          </Routes>
        </Router>
      );

      let anchor = renderer.root.findByType("a");

      expect(anchor.props.className).not.toMatch("active");
    });
  });

  describe("when it matches to the end", () => {
    it("applies the default 'active' className to the underlying <a>", () => {
      let renderer = createTestRenderer(
        <Router initialEntries={["/home"]}>
          <Routes>
            <Route path="/home" element={<NavLink to=".">Home</NavLink>} />
          </Routes>
        </Router>
      );

      let anchor = renderer.root.findByType("a");

      expect(anchor.props.className).toMatch("active");
    });

    it("applies its className correctly when provided as a function", () => {
      let renderer = createTestRenderer(
        <Router initialEntries={["/home"]}>
          <Routes>
            <Route
              path="/home"
              element={
                <NavLink
                  to="."
                  className={({ isActive }) =>
                    "nav-link" + (isActive ? " highlighted" : " plain")
                  }
                >
                  Home
                </NavLink>
              }
            />
          </Routes>
        </Router>
      );

      let anchor = renderer.root.findByType("a");

      expect(anchor.props.className.includes("nav-link")).toBe(true);
      expect(anchor.props.className.includes("highlighted")).toBe(true);
      expect(anchor.props.className.includes("plain")).toBe(false);
    });

    it("applies its style correctly when provided as a function", () => {
      let renderer = createTestRenderer(
        <Router initialEntries={["/home"]}>
          <Routes>
            <Route
              path="/home"
              element={
                <NavLink
                  to="."
                  style={({ isActive }) =>
                    isActive ? { textTransform: "uppercase" } : {}
                  }
                >
                  Home
                </NavLink>
              }
            />
          </Routes>
        </Router>
      );

      let anchor = renderer.root.findByType("a");

      expect(anchor.props.style).toMatchObject({ textTransform: "uppercase" });
    });
  });

  describe("when it matches just the beginning but not to the end", () => {
    describe("by default", () => {
      it("applies the default 'active' className to the underlying <a>", () => {
        let renderer = createTestRenderer(
          <Router initialEntries={["/home/child"]}>
            <Routes>
              <Route
                path="home"
                element={
                  <div>
                    <NavLink to=".">Home</NavLink>
                    <Outlet />
                  </div>
                }
              >
                <Route path="child" element={<div>Child</div>} />
              </Route>
            </Routes>
          </Router>
        );

        let anchor = renderer.root.findByType("a");

        expect(anchor.props.className).toMatch("active");
      });
    });

    describe("when end=true", () => {
      it("does not apply the default 'active' className to the underlying <a>", () => {
        let renderer = createTestRenderer(
          <Router initialEntries={["/home/child"]}>
            <Routes>
              <Route
                path="home"
                element={
                  <div>
                    <NavLink to="." end={true}>
                      Home
                    </NavLink>
                    <Outlet />
                  </div>
                }
              >
                <Route path="child" element={<div>Child</div>} />
              </Route>
            </Routes>
          </Router>
        );

        let anchor = renderer.root.findByType("a");

        expect(anchor.props.className).not.toMatch("active");
      });
    });
  });

  describe("when it matches without matching case", () => {
    describe("by default", () => {
      it("applies the default 'active' className to the underlying <a>", () => {
        let renderer = createTestRenderer(
          <Router initialEntries={["/Home"]}>
            <Routes>
              <Route path="home" element={<NavLink to=".">Home</NavLink>} />
            </Routes>
          </Router>
        );

        let anchor = renderer.root.findByType("a");

        expect(anchor.props.className).toMatch("active");
      });
    });

    describe("when caseSensitive=true", () => {
      it("does not apply the default 'active' className to the underlying <a>", () => {
        let renderer = createTestRenderer(
          <Router initialEntries={["/Home"]}>
            <Routes>
              <Route
                path="home"
                element={
                  <NavLink to="/home" caseSensitive={true}>
                    Home
                  </NavLink>
                }
              />
            </Routes>
          </Router>
        );

        let anchor = renderer.root.findByType("a");

        expect(anchor.props.className).not.toMatch("active");
      });
    });
  });
});

describe("NavLink under a Routes with a basename", () => {
  describe("when it does not match", () => {
    it("does not apply the default 'active' className to the underlying <a>", () => {
      let renderer = createTestRenderer(
        <Router basename="/app" initialEntries={["/app/home"]}>
          <Routes>
            <Route
              path="home"
              element={<NavLink to="somewhere-else">Somewhere else</NavLink>}
            />
          </Routes>
        </Router>
      );

      let anchor = renderer.root.findByType("a");

      expect(anchor.props.className).not.toMatch("active");
    });
  });

  describe("when it matches", () => {
    it("applies the default 'active' className to the underlying <a>", () => {
      let renderer = createTestRenderer(
        <Router basename="/app" initialEntries={["/app/home"]}>
          <Routes>
            <Route path="home" element={<NavLink to=".">Home</NavLink>} />
          </Routes>
        </Router>
      );

      let anchor = renderer.root.findByType("a");

      expect(anchor.props.className).toMatch("active");
    });
  });
});
