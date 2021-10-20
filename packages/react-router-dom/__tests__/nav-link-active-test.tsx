import * as React from "react";
import { create as createTestRenderer } from "react-test-renderer";
import { MemoryRouter, Routes, Route, NavLink, Outlet } from "react-router-dom";

describe("NavLink", () => {
  describe("when it does not match", () => {
    it("does not apply an 'active' className to the underlying <a>", () => {
      let renderer = createTestRenderer(
        <MemoryRouter initialEntries={["/home"]}>
          <Routes>
            <Route
              path="/home"
              element={<NavLink to="somewhere-else">Somewhere else</NavLink>}
            />
          </Routes>
        </MemoryRouter>
      );

      let anchor = renderer.root.findByType("a");

      expect(anchor.props.className).not.toMatch("active");
    });
  });

  describe("when it matches to the end", () => {
    it("applies the default 'active' className to the underlying <a>", () => {
      let renderer = createTestRenderer(
        <MemoryRouter initialEntries={["/home"]}>
          <Routes>
            <Route path="/home" element={<NavLink to=".">Home</NavLink>} />
          </Routes>
        </MemoryRouter>
      );

      let anchor = renderer.root.findByType("a");

      expect(anchor.props.className).toMatch("active");
    });

    it("applies its className correctly when provided as a function", () => {
      let renderer = createTestRenderer(
        <MemoryRouter initialEntries={["/home"]}>
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
        </MemoryRouter>
      );

      let anchor = renderer.root.findByType("a");

      expect(anchor.props.className.includes("nav-link")).toBe(true);
      expect(anchor.props.className.includes("highlighted")).toBe(true);
      expect(anchor.props.className.includes("plain")).toBe(false);
    });

    it("applies its style correctly when provided as a function", () => {
      let renderer = createTestRenderer(
        <MemoryRouter initialEntries={["/home"]}>
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
        </MemoryRouter>
      );

      let anchor = renderer.root.findByType("a");

      expect(anchor.props.style).toMatchObject({ textTransform: "uppercase" });
    });
  });

  describe("when it matches a partial URL segment", () => {
    it("does not apply the 'active' className to the underlying <a>", () => {
      let renderer = createTestRenderer(
        <MemoryRouter initialEntries={["/home/children"]}>
          <Routes>
            <Route
              path="home"
              element={
                <div>
                  <NavLink to="child">Home</NavLink>
                  <Outlet />
                </div>
              }
            >
              <Route path="children" element={<div>Child</div>} />
            </Route>
          </Routes>
        </MemoryRouter>
      );

      let anchor = renderer.root.findByType("a");

      expect(anchor.props.className).not.toMatch("active");
    });
  });

  describe("when it matches just the beginning but not to the end", () => {
    it("applies the default 'active' className to the underlying <a>", () => {
      let renderer = createTestRenderer(
        <MemoryRouter initialEntries={["/home/child"]}>
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
        </MemoryRouter>
      );

      let anchor = renderer.root.findByType("a");

      expect(anchor.props.className).toMatch("active");
    });

    describe("when end=true", () => {
      it("does not apply the default 'active' className to the underlying <a>", () => {
        let renderer = createTestRenderer(
          <MemoryRouter initialEntries={["/home/child"]}>
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
          </MemoryRouter>
        );

        let anchor = renderer.root.findByType("a");

        expect(anchor.props.className).not.toMatch("active");
      });
    });
  });

  describe("when it matches without matching case", () => {
    it("applies the default 'active' className to the underlying <a>", () => {
      let renderer = createTestRenderer(
        <MemoryRouter initialEntries={["/Home"]}>
          <Routes>
            <Route path="home" element={<NavLink to=".">Home</NavLink>} />
          </Routes>
        </MemoryRouter>
      );

      let anchor = renderer.root.findByType("a");

      expect(anchor.props.className).toMatch("active");
    });

    describe("when caseSensitive=true", () => {
      it("does not apply the default 'active' className to the underlying <a>", () => {
        let renderer = createTestRenderer(
          <MemoryRouter initialEntries={["/Home"]}>
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
          </MemoryRouter>
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
        <MemoryRouter basename="/app" initialEntries={["/app/home"]}>
          <Routes>
            <Route
              path="home"
              element={<NavLink to="somewhere-else">Somewhere else</NavLink>}
            />
          </Routes>
        </MemoryRouter>
      );

      let anchor = renderer.root.findByType("a");

      expect(anchor.props.className).not.toMatch("active");
    });
  });

  describe("when it matches", () => {
    it("applies the default 'active' className to the underlying <a>", () => {
      let renderer = createTestRenderer(
        <MemoryRouter basename="/app" initialEntries={["/app/home"]}>
          <Routes>
            <Route path="home" element={<NavLink to=".">Home</NavLink>} />
          </Routes>
        </MemoryRouter>
      );

      let anchor = renderer.root.findByType("a");

      expect(anchor.props.className).toMatch("active");
    });
  });
});
