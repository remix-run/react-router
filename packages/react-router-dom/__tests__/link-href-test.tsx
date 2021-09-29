import * as React from "react";
import type { ReactTestRenderer } from "react-test-renderer";
import { act, create as createTestRenderer } from "react-test-renderer";
import {
  MemoryRouter as Router,
  Outlet,
  Routes,
  Route,
  Link
} from "react-router-dom";

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

      expect(anchor.props.href).toEqual("/about");
    });

    it("is correct in nested routes", () => {
      function Login() {
        return (
          <div>
            Login page{" "}
            <Link to="/auth/forgot-password">Go to forgot password</Link>
          </div>
        );
      }

      function ForgotPassword() {
        return (
          <div>
            Forgot password page{" "}
            <Link to="/auth/login">Back to login page</Link>
          </div>
        );
      }

      function AuthRoutes() {
        return (
          <Routes>
            <Route path="login" element={<Login />} />
            <Route path="forgot-password" element={<ForgotPassword />} />
          </Routes>
        );
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

      expect(anchor.props.href).toEqual("/auth/forgot-password");
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
          <Router basename="/app" initialEntries={["/app/home"]}>
            <Routes>
              <Route path="home" element={<Home />} />
            </Routes>
          </Router>
        );
      });

      let anchor = renderer.root.findByType("a");

      expect(anchor.props.href).toEqual("/app/about");
    });
  });
});
