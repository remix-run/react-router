import * as React from "react";
import { act, create as createTestRenderer } from "react-test-renderer";
import {
  MemoryRouter as Router,
  Routes,
  Route,
  NavLink
} from "react-router-dom";

describe("NavLink", () => {
  describe("when it does not match", () => {
    it("does not apply its activeClassName to the underlying <a>", () => {
      function Home() {
        return (
          <div>
            <NavLink to="somewhere-else" activeClassName="active">
              Somewhere else
            </NavLink>
          </div>
        );
      }

      let renderer;
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

    it("does not apply its activeStyle to the underlying <a>", () => {
      function Home() {
        return (
          <div>
            <NavLink
              to="somewhere-else"
              activeStyle={{ textTransform: "uppercase" }}
            >
              Somewhere else
            </NavLink>
          </div>
        );
      }

      let renderer;
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
      expect(anchor.props.style).not.toMatchObject({
        textTransform: "uppercase"
      });
    });
  });

  describe("when it matches to the end", () => {
    it("applies its activeClassName to the underlying <a>", () => {
      function Home() {
        return (
          <div>
            <NavLink to="." activeClassName="active">
              Home
            </NavLink>
          </div>
        );
      }

      let renderer;
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
      expect(anchor.props.className).toMatch("active");
    });

    it("applies its activeStyle to the underlying <a>", () => {
      function Home() {
        return (
          <div>
            <NavLink to="." activeStyle={{ textTransform: "uppercase" }}>
              Home
            </NavLink>
          </div>
        );
      }

      let renderer;
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
      it("applies its activeClassName to the underlying <a>", () => {
        function Home() {
          return (
            <div>
              <NavLink to="." activeClassName="active">
                Home
              </NavLink>
            </div>
          );
        }

        function Child() {
          return <div>Child</div>;
        }

        let renderer;
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

      it("applies its activeStyle to the underlying <a>", () => {
        function Home() {
          return (
            <div>
              <NavLink to="." activeStyle={{ textTransform: "uppercase" }}>
                Home
              </NavLink>
            </div>
          );
        }

        function Child() {
          return <div>Child</div>;
        }

        let renderer;
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
        expect(anchor.props.style).toMatchObject({
          textTransform: "uppercase"
        });
      });
    });

    describe("when end=true", () => {
      it("does not apply its activeClassName to the underlying <a>", () => {
        function Home() {
          return (
            <div>
              <NavLink to="." end={true} activeClassName="active">
                Home
              </NavLink>
            </div>
          );
        }

        function Child() {
          return <div>Child</div>;
        }

        let renderer;
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

      it("does not apply its activeStyle to the underlying <a>", () => {
        function Home() {
          return (
            <div>
              <NavLink
                to="."
                end={true}
                activeStyle={{ textTransform: "uppercase" }}
              >
                Home
              </NavLink>
            </div>
          );
        }

        function Child() {
          return <div>Child</div>;
        }

        let renderer;
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
        expect(anchor.props.style).not.toMatchObject({
          textTransform: "uppercase"
        });
      });
    });
  });

  describe("when it matches without matching case", () => {
    describe("by default", () => {
      it("applies its activeClassName to the underlying <a>", () => {
        function Home() {
          return (
            <div>
              <NavLink to="." activeClassName="active">
                Home
              </NavLink>
            </div>
          );
        }

        let renderer;
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

      it("applies its activeStyle to the underlying <a>", () => {
        function Home() {
          return (
            <div>
              <NavLink to="." activeStyle={{ textTransform: "uppercase" }}>
                Home
              </NavLink>
            </div>
          );
        }

        let renderer;
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
        expect(anchor.props.style).toMatchObject({
          textTransform: "uppercase"
        });
      });
    });

    describe("when caseSensitive=true", () => {
      it("does not apply its activeClassName to the underlying <a>", () => {
        function Home() {
          return (
            <div>
              <NavLink to="/home" caseSensitive={true} activeClassName="active">
                Home
              </NavLink>
            </div>
          );
        }

        let renderer;
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

      it("does not apply its activeStyle to the underlying <a>", () => {
        function Home() {
          return (
            <div>
              <NavLink
                to="/home"
                caseSensitive={true}
                activeStyle={{ textTransform: "uppercase" }}
              >
                Home
              </NavLink>
            </div>
          );
        }

        let renderer;
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
        expect(anchor.props.style).not.toMatchObject({
          textTransform: "uppercase"
        });
      });
    });
  });
});

describe("NavLink under a Routes with a basename", () => {
  describe("when it does not match", () => {
    it("does not apply its activeClassName to the underlying <a>", () => {
      function Home() {
        return (
          <div>
            <NavLink to="somewhere-else" activeClassName="active">
              Somewhere else
            </NavLink>
          </div>
        );
      }

      let renderer;
      act(() => {
        renderer = createTestRenderer(
          <Router initialEntries={["/app/home"]}>
            <Routes basename="app">
              <Route path="home" element={<Home />} />
            </Routes>
          </Router>
        );
      });

      let anchor = renderer.root.findByType("a");

      expect(anchor).not.toBeNull();
      expect(anchor.props.className).not.toMatch("active");
    });

    it("does not apply its activeStyle to the underlying <a>", () => {
      function Home() {
        return (
          <div>
            <NavLink
              to="somewhere-else"
              activeStyle={{ textTransform: "uppercase" }}
            >
              Somewhere else
            </NavLink>
          </div>
        );
      }

      let renderer;
      act(() => {
        renderer = createTestRenderer(
          <Router initialEntries={["/app/home"]}>
            <Routes basename="app">
              <Route path="home" element={<Home />} />
            </Routes>
          </Router>
        );
      });

      let anchor = renderer.root.findByType("a");

      expect(anchor).not.toBeNull();
      expect(anchor.props.style).not.toMatchObject({
        textTransform: "uppercase"
      });
    });
  });

  describe("when it matches", () => {
    it("applies its activeClassName to the underlying <a>", () => {
      function Home() {
        return (
          <div>
            <NavLink to="." activeClassName="active">
              Home
            </NavLink>
          </div>
        );
      }

      let renderer;
      act(() => {
        renderer = createTestRenderer(
          <Router initialEntries={["/app/home"]}>
            <Routes basename="app">
              <Route path="home" element={<Home />} />
            </Routes>
          </Router>
        );
      });

      let anchor = renderer.root.findByType("a");

      expect(anchor).not.toBeNull();
      expect(anchor.props.className).toMatch("active");
    });

    it("applies its activeStyle to the underlying <a>", () => {
      function Home() {
        return (
          <div>
            <NavLink to="." activeStyle={{ textTransform: "uppercase" }}>
              Home
            </NavLink>
          </div>
        );
      }

      let renderer;
      act(() => {
        renderer = createTestRenderer(
          <Router initialEntries={["/app/home"]}>
            <Routes basename="app">
              <Route path="home" element={<Home />} />
            </Routes>
          </Router>
        );
      });

      let anchor = renderer.root.findByType("a");

      expect(anchor).not.toBeNull();
      expect(anchor.props.style).toMatchObject({ textTransform: "uppercase" });
    });
  });
});
