import "@testing-library/jest-dom";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import * as React from "react";
import {
  MemoryRouter,
  Outlet,
  Route,
  RouterProvider,
  Routes,
  createMemoryRouter,
  createRoutesFromElements,
  unstable_useRouterState,
} from "react-router";
import type { unstable_RouterState } from "react-router";

import { createDeferred } from "./router/utils/utils";
import MemoryNavigate from "./utils/MemoryNavigate";

describe("unstable_useRouterState", () => {
  describe("without a path argument", () => {
    it("returns active state for the current location", () => {
      let captured: unstable_RouterState | undefined;
      let router = createMemoryRouter(
        createRoutesFromElements(
          <Route
            path="/projects/:id"
            element={<Capture onState={(s) => (captured = s)} />}
          />,
        ),
        { initialEntries: ["/projects/123?tab=readme"] },
      );
      render(<RouterProvider router={router} />);

      expect(captured?.active).not.toBeNull();
      expect(captured?.active?.location.pathname).toBe("/projects/123");
      expect(captured?.active?.searchParams.get("tab")).toBe("readme");
      expect(captured?.active?.params).toEqual({ id: "123" });
      expect(captured?.active?.type).toBe("POP");
      expect(captured?.pending).toBeNull();
    });

    it("returns simplified matches with id and pathname only", () => {
      let captured: unstable_RouterState | undefined;
      let router = createMemoryRouter(
        createRoutesFromElements(
          <Route id="root" path="/" element={<Outlet />}>
            <Route
              id="projects"
              path="projects"
              element={<Outlet />}
            >
              <Route
                id="project"
                path=":id"
                element={<Capture onState={(s) => (captured = s)} />}
              />
            </Route>
          </Route>,
        ),
        { initialEntries: ["/projects/42"] },
      );
      render(<RouterProvider router={router} />);

      expect(captured?.active?.matches).toEqual([
        { id: "root", pathname: "/" },
        { id: "projects", pathname: "/projects" },
        { id: "project", pathname: "/projects/42" },
      ]);
    });

    it("populates `pending` during in-flight navigations", async () => {
      let barDefer = createDeferred();
      let captured: unstable_RouterState | undefined;
      let router = createMemoryRouter(
        createRoutesFromElements(
          <Route path="/" element={<Layout />}>
            <Route path="foo" element={<h1>Foo</h1>} />
            <Route
              path="bar/:id"
              loader={() => barDefer.promise}
              element={<h1>Bar</h1>}
            />
          </Route>,
        ),
        { initialEntries: ["/foo"] },
      );
      render(<RouterProvider router={router} />);

      function Layout() {
        captured = unstable_useRouterState();
        return (
          <div>
            <MemoryNavigate to="/bar/9">Go</MemoryNavigate>
            <Outlet />
          </div>
        );
      }

      expect(captured?.active?.location.pathname).toBe("/foo");
      expect(captured?.pending).toBeNull();

      fireEvent.click(screen.getByText("Go"));

      expect(captured?.active?.location.pathname).toBe("/foo");
      expect(captured?.pending).not.toBeNull();
      expect(captured?.pending?.location.pathname).toBe("/bar/9");
      expect(captured?.pending?.params).toEqual({ id: "9" });
      expect(captured?.pending?.type).toBe("PUSH");

      barDefer.resolve({});
      await waitFor(() =>
        expect(captured?.active?.location.pathname).toBe("/bar/9"),
      );
      expect(captured?.pending).toBeNull();
    });
  });

  describe("with a path argument", () => {
    it("returns an active variant when the path matches", () => {
      let captured: unstable_RouterState<"/projects/:id"> | undefined;
      let router = createMemoryRouter(
        createRoutesFromElements(
          <Route
            path="/projects/:id"
            element={
              <Capture
                onState={(s) => {
                  captured =
                    s as unstable_RouterState<"/projects/:id">;
                }}
                path="/projects/:id"
              />
            }
          />,
        ),
        { initialEntries: ["/projects/abc"] },
      );
      render(<RouterProvider router={router} />);

      expect(captured?.active?.params.id).toBe("abc");
    });

    it("returns null for active when the path does not match", () => {
      let captured: unstable_RouterState | undefined;
      let router = createMemoryRouter(
        createRoutesFromElements(
          <Route
            path="/about"
            element={
              <Capture
                onState={(s) => (captured = s)}
                path="/projects/:id"
              />
            }
          />,
        ),
        { initialEntries: ["/about"] },
      );
      render(<RouterProvider router={router} />);

      expect(captured?.active).toBeNull();
      expect(captured?.pending).toBeNull();
    });

    it("populates `pending` only when the pending location matches", async () => {
      let barDefer = createDeferred();
      let captured: unstable_RouterState | undefined;

      let router = createMemoryRouter(
        createRoutesFromElements(
          <Route path="/" element={<Layout />}>
            <Route path="foo" element={<h1>Foo</h1>} />
            <Route
              path="bar/:id"
              loader={() => barDefer.promise}
              element={<h1>Bar</h1>}
            />
          </Route>,
        ),
        { initialEntries: ["/foo"] },
      );
      render(<RouterProvider router={router} />);

      function Layout() {
        captured = unstable_useRouterState("/bar/:id");
        return (
          <div>
            <MemoryNavigate to="/bar/7">Go</MemoryNavigate>
            <Outlet />
          </div>
        );
      }

      expect(captured?.active).toBeNull();
      expect(captured?.pending).toBeNull();

      fireEvent.click(screen.getByText("Go"));

      expect(captured?.active).toBeNull();
      expect(captured?.pending).not.toBeNull();
      expect(captured?.pending?.params).toEqual({ id: "7" });

      barDefer.resolve({});
      await waitFor(() => expect(captured?.active).not.toBeNull());
      expect(captured?.active?.params).toEqual({ id: "7" });
      expect(captured?.pending).toBeNull();
    });

    it("returns null for `pending` when the pending location does not match the path", async () => {
      let fooDefer = createDeferred();
      let captured: unstable_RouterState | undefined;

      let router = createMemoryRouter(
        createRoutesFromElements(
          <Route path="/" element={<Layout />}>
            <Route path="about" element={<h1>About</h1>} />
            <Route
              path="foo"
              loader={() => fooDefer.promise}
              element={<h1>Foo</h1>}
            />
          </Route>,
        ),
        { initialEntries: ["/about"] },
      );
      render(<RouterProvider router={router} />);

      function Layout() {
        captured = unstable_useRouterState("/bar/:id");
        return (
          <div>
            <MemoryNavigate to="/foo">Go</MemoryNavigate>
            <Outlet />
          </div>
        );
      }

      fireEvent.click(screen.getByText("Go"));

      // Pending navigation is active but doesn't match `/bar/:id`
      expect(captured?.active).toBeNull();
      expect(captured?.pending).toBeNull();

      fooDefer.resolve({});
      await waitFor(() => {});
    });
  });

  describe("in declarative mode", () => {
    it("throws when used without a data router", () => {
      function Probe() {
        unstable_useRouterState();
        return null;
      }

      // Silence React's error logging for this expected throw
      let spy = jest.spyOn(console, "error").mockImplementation(() => {});
      expect(() =>
        render(
          <MemoryRouter>
            <Routes>
              <Route path="/" element={<Probe />} />
            </Routes>
          </MemoryRouter>,
        ),
      ).toThrow(/unstable_useRouterState must be used within a data router/);
      spy.mockRestore();
    });
  });
});

function Capture({
  onState,
  path,
}: {
  onState: (state: unstable_RouterState) => void;
  path?: string;
}) {
  let state = path ? unstable_useRouterState(path) : unstable_useRouterState();
  onState(state);
  return null;
}
