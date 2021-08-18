import * as React from "react";
import { act, create as createTestRenderer } from "react-test-renderer";
import {
  MemoryRouter as Router,
  Outlet,
  Routes,
  Route,
  Link,
  useRoutes
} from "react-router-dom";
import type { ReactTestRenderer } from "react-test-renderer";

describe("Link href", () => {
  let node: HTMLDivElement;
  beforeEach(() => {
    node = document.createElement("div");
    document.body.appendChild(node);
  });

  afterEach(() => {
    document.body.removeChild(node);
    node = null!;
  });

  describe("absolute", () => {
    it("is correct", () => {
      function Home() {
        return (
          <div>
            <h1>Home</h1>
            <Link to="/about">About</Link>
          </div>
        );
      }

      let renderer!: ReactTestRenderer;
      act(() => {
        renderer = createTestRenderer(
          <Router initialEntries={["/home"]}>
            <Routes>
              <Route path="home" element={<Home />} />
            </Routes>
          </Router>
        );
      });

      let anchor = renderer.root.findByType("a");

      expect(anchor).not.toBeNull();
      expect(anchor.props.href).toEqual("/about");
    });

    it("is correct in nested routes", () => {
      function Login() {
        return (
          <div>
            Login page{" "}
            <Link to="/auth/forget-password">Go to forgot password</Link>
          </div>
        );
      }

      function ForgetPassword() {
        return (
          <div>
            Forgot password page{" "}
            <Link to="/auth/login">Back to login page</Link>
          </div>
        );
      }

      function AuthRoutes() {
        return useRoutes([
          {
            path: "login",
            element: <Login />
          },
          {
            path: "forget-password",
            element: <ForgetPassword />
          }
        ]);
      }

      let renderer!: ReactTestRenderer;
      act(() => {
        renderer = createTestRenderer(
          <Router initialEntries={["/auth/login"]}>
            <Routes>
              <Route path="auth/*" element={<Outlet />}>
                <Route path="*" element={<AuthRoutes />} />
              </Route>
            </Routes>
          </Router>
        );
      });

      let anchor = renderer.root.findByType("a");
      expect(anchor).not.toBeNull();
      expect(anchor.props.href).toEqual("/auth/forget-password");
    });
  });

  describe("relative self", () => {
    it("is correct", () => {
      function Home() {
        return (
          <div>
            <h1>Home</h1>
            <Link to=".">Home</Link>
          </div>
        );
      }

      let renderer!: ReactTestRenderer;
      act(() => {
        renderer = createTestRenderer(
          <Router initialEntries={["/home"]}>
            <Routes>
              <Route path="home" element={<Home />} />
            </Routes>
          </Router>
        );
      });

      let anchor = renderer.root.findByType("a");

      expect(anchor).not.toBeNull();
      expect(anchor.props.href).toEqual("/home");
    });
  });

  describe("relative sibling", () => {
    it("is correct", () => {
      function Home() {
        return (
          <div>
            <h1>Home</h1>
            <Link to="../about">About</Link>
          </div>
        );
      }

      let renderer!: ReactTestRenderer;
      act(() => {
        renderer = createTestRenderer(
          <Router initialEntries={["/home"]}>
            <Routes>
              <Route path="home" element={<Home />} />
            </Routes>
          </Router>
        );
      });

      let anchor = renderer.root.findByType("a");

      expect(anchor).not.toBeNull();
      expect(anchor.props.href).toEqual("/about");
    });
  });

  describe("relative with more .. segments than are in the URL", () => {
    it("is correct", () => {
      function Home() {
        return (
          <div>
            <h1>Home</h1>
            <Link to="../../about">About</Link>
          </div>
        );
      }

      let renderer!: ReactTestRenderer;
      act(() => {
        renderer = createTestRenderer(
          <Router initialEntries={["/home"]}>
            <Routes>
              <Route path="home" element={<Home />} />
            </Routes>
          </Router>
        );
      });

      let anchor = renderer.root.findByType("a");

      expect(anchor).not.toBeNull();
      expect(anchor.props.href).toEqual("/about");
    });
  });

  describe("basename", () => {
    it("is correct", () => {
      function Home() {
        return (
          <div>
            <h1>Home</h1>
            <Link to="/about">About</Link>
          </div>
        );
      }

      let renderer!: ReactTestRenderer;
      act(() => {
        renderer = createTestRenderer(
          <Router initialEntries={["/app/home"]}>
            <Routes basename="/app">
              <Route path="home" element={<Home />} />
            </Routes>
          </Router>
        );
      });

      let anchor = renderer.root.findByType("a");

      expect(anchor).not.toBeNull();
      // expect(anchor.props.href).toEqual("/app/about");
    });
  });
});
