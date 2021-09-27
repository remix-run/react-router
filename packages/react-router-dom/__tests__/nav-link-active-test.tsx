import * as React from "react";
import { act, create as createTestRenderer } from "react-test-renderer";
import {
  MemoryRouter as Router,
  Routes,
  Route,
  NavLink
} from "react-router-dom";
import type { ReactTestRenderer } from "react-test-renderer";

describe("NavLink", () => {
  describe("when it does not match", () => {
    it("does not apply an 'active' className to the underlying <a>", () => {
      function Home() {
        return (
          <div>
            <NavLink to="somewhere-else">Somewhere else</NavLink>
          </div>
        );
      }

      let renderer!: ReactTestRenderer;
      act(() => {
        renderer = createTestRenderer(
          <Router initialEntries={["/home"]}>
            <Routes>
              <Route path="/home" element={<Home />} />
            </Routes>
          </Router>
        );
      });

      let anchor = renderer.root.findByType("a");

      expect(anchor).not.toBeNull();
      expect(anchor.props.className).not.toMatch("active");
    });
  });

  describe("when it matches to the end", () => {
    it("applies the default 'active' className to the underlying <a>", () => {
      function Home() {
        return (
          <div>
            <NavLink to=".">Home</NavLink>
          </div>
        );
      }

      let renderer!: ReactTestRenderer;
      act(() => {
        renderer = createTestRenderer(
          <Router initialEntries={["/home"]}>
            <Routes>
              <Route path="/home" element={<Home />} />
            </Routes>
          </Router>
        );
      });

      let anchor = renderer.root.findByType("a");
      expect(anchor.props.className).toMatch("active");
    });

    it("applies its className correctly when provided as a function", () => {
      function Home() {
        return (
          <div>
            <NavLink
              to="."
              className={({ isActive }) =>
                "nav-link" + (isActive ? " highlighted" : " plain")
              }
            >
              Home
            </NavLink>
          </div>
        );
      }

      let renderer!: ReactTestRenderer;
      act(() => {
        renderer = createTestRenderer(
          <Router initialEntries={["/home"]}>
            <Routes>
              <Route path="/home" element={<Home />} />
            </Routes>
          </Router>
        );
      });

      let anchor = renderer.root.findByType("a");

      expect(anchor).not.toBeNull();
      expect(anchor.props.className.includes("nav-link")).toBe(true);
      expect(anchor.props.className.includes("highlighted")).toBe(true);
      expect(anchor.props.className.includes("plain")).toBe(false);
    });

    it("applies its style correctly when provided as a function", () => {
      function Home() {
        return (
          <div>
            <NavLink
              to="."
              style={({ isActive }) =>
                isActive ? { textTransform: "uppercase" } : {}
              }
            >
              Home
            </NavLink>
          </div>
        );
      }

      let renderer!: ReactTestRenderer;
      act(() => {
        renderer = createTestRenderer(
          <Router initialEntries={["/home"]}>
            <Routes>
              <Route path="/home" element={<Home />} />
            </Routes>
          </Router>
        );
      });

      let anchor = renderer.root.findByType("a");
      expect(anchor).not.toBeNull();
      expect(anchor.props.style).toMatchObject({ textTransform: "uppercase" });
    });
  });

  describe("when it matches just the beginning but not to the end", () => {
    describe("by default", () => {
      it("applies the default 'active' className to the underlying <a>", () => {
        function Home() {
          return (
            <div>
              <NavLink to=".">Home</NavLink>
            </div>
          );
        }

        function Child() {
          return <div>Child</div>;
        }

        let renderer!: ReactTestRenderer;
        act(() => {
          renderer = createTestRenderer(
            <Router initialEntries={["/home/child"]}>
              <Routes>
                <Route path="home" element={<Home />}>
                  <Route path="child" element={<Child />} />
                </Route>
              </Routes>
            </Router>
          );
        });

        let anchor = renderer.root.findByType("a");

        expect(anchor).not.toBeNull();
        expect(anchor.props.className).toMatch("active");
      });
    });

    describe("when end=true", () => {
      it("does not apply the default 'active' className to the underlying <a>", () => {
        function Home() {
          return (
            <div>
              <NavLink to="." end={true}>
                Home
              </NavLink>
            </div>
          );
        }

        function Child() {
          return <div>Child</div>;
        }

        let renderer!: ReactTestRenderer;
        act(() => {
          renderer = createTestRenderer(
            <Router initialEntries={["/home/child"]}>
              <Routes>
                <Route path="home" element={<Home />}>
                  <Route path="child" element={<Child />} />
                </Route>
              </Routes>
            </Router>
          );
        });

        let anchor = renderer.root.findByType("a");

        expect(anchor).not.toBeNull();
        expect(anchor.props.className).not.toMatch("active");
      });
    });
  });

  describe("when it matches without matching case", () => {
    describe("by default", () => {
      it("applies the default 'active' className to the underlying <a>", () => {
        function Home() {
          return (
            <div>
              <NavLink to=".">Home</NavLink>
            </div>
          );
        }

        let renderer!: ReactTestRenderer;
        act(() => {
          renderer = createTestRenderer(
            <Router initialEntries={["/Home"]}>
              <Routes>
                <Route path="home" element={<Home />} />
              </Routes>
            </Router>
          );
        });

        let anchor = renderer.root.findByType("a");

        expect(anchor).not.toBeNull();
        expect(anchor.props.className).toMatch("active");
      });
    });

    describe("when caseSensitive=true", () => {
      it("does not apply the default 'active' className to the underlying <a>", () => {
        function Home() {
          return (
            <div>
              <NavLink to="/home" caseSensitive={true}>
                Home
              </NavLink>
            </div>
          );
        }

        let renderer!: ReactTestRenderer;
        act(() => {
          renderer = createTestRenderer(
            <Router initialEntries={["/Home"]}>
              <Routes>
                <Route path="home" element={<Home />} />
              </Routes>
            </Router>
          );
        });

        let anchor = renderer.root.findByType("a");

        expect(anchor).not.toBeNull();
        expect(anchor.props.className).not.toMatch("active");
      });
    });
  });
});

describe("NavLink under a Routes with a basename", () => {
  describe("when it does not match", () => {
    it("does not apply the default 'active' className to the underlying <a>", () => {
      function Home() {
        return (
          <div>
            <NavLink to="somewhere-else">Somewhere else</NavLink>
          </div>
        );
      }

      let renderer!: ReactTestRenderer;
      act(() => {
        renderer = createTestRenderer(
          <Router basename="/app" initialEntries={["/app/home"]}>
            <Routes>
              <Route path="home" element={<Home />} />
            </Routes>
          </Router>
        );
      });

      let anchor = renderer.root.findByType("a");

      expect(anchor).not.toBeNull();
      expect(anchor.props.className).not.toMatch("active");
    });
  });

  describe("when it matches", () => {
    it("applies the default 'active' className to the underlying <a>", () => {
      function Home() {
        return (
          <div>
            <NavLink to=".">Home</NavLink>
          </div>
        );
      }

      let renderer!: ReactTestRenderer;
      act(() => {
        renderer = createTestRenderer(
          <Router basename="/app" initialEntries={["/app/home"]}>
            <Routes>
              <Route path="home" element={<Home />} />
            </Routes>
          </Router>
        );
      });

      let anchor = renderer.root.findByType("a");

      expect(anchor).not.toBeNull();
      expect(anchor.props.className).toMatch("active");
    });
  });
});
