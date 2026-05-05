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
  unstable_useRouterState,
} from "react-router";
import type { unstable_RouterState } from "react-router";

import { createDeferred } from "./router/utils/utils";
import MemoryNavigate from "./utils/MemoryNavigate";

describe("unstable_useRouterState", () => {
  it("returns active state for the current location", () => {
    let captured: unstable_RouterState | undefined;
    let router = createMemoryRouter(
      [
        {
          path: "/projects/:id",
          Component() {
            captured = unstable_useRouterState();
            return null;
          },
        },
      ],
      { initialEntries: ["/projects/123?tab=readme"] },
    );
    render(<RouterProvider router={router} />);

    expect(captured?.active.location.pathname).toBe("/projects/123");
    expect(captured?.active.searchParams.get("tab")).toBe("readme");
    expect(captured?.active.params).toEqual({ id: "123" });
    expect(captured?.active.type).toBe("POP");
    expect(captured?.pending).toBeNull();
  });

  it("returns simplified matches with id and pathname only", () => {
    let captured: unstable_RouterState | undefined;
    let router = createMemoryRouter(
      [
        {
          id: "root",
          path: "/",
          element: <Outlet />,
          children: [
            {
              id: "projects",
              path: "projects",
              element: <Outlet />,
              children: [
                {
                  id: "project",
                  path: ":id",
                  Component() {
                    captured = unstable_useRouterState();
                    return null;
                  },
                },
              ],
            },
          ],
        },
      ],
      { initialEntries: ["/projects/42"] },
    );
    render(<RouterProvider router={router} />);

    expect(captured?.active.matches).toEqual([
      { id: "root", pathname: "/" },
      { id: "projects", pathname: "/projects" },
      { id: "project", pathname: "/projects/42" },
    ]);
  });

  it("populates `pending` during in-flight navigations", async () => {
    let barDefer = createDeferred();
    let captured: unstable_RouterState | undefined;

    function Layout() {
      captured = unstable_useRouterState();
      return (
        <div>
          <MemoryNavigate to="/bar/9">Go</MemoryNavigate>
          <Outlet />
        </div>
      );
    }

    let router = createMemoryRouter(
      [
        {
          path: "/",
          element: <Layout />,
          children: [
            { path: "foo", element: <h1>Foo</h1> },
            {
              path: "bar/:id",
              loader: () => barDefer.promise,
              element: <h1>Bar</h1>,
            },
          ],
        },
      ],
      { initialEntries: ["/foo"] },
    );
    render(<RouterProvider router={router} />);

    expect(captured?.active.location.pathname).toBe("/foo");
    expect(captured?.pending).toBeNull();

    fireEvent.click(screen.getByText("Go"));

    expect(captured?.active.location.pathname).toBe("/foo");
    expect(captured?.pending).not.toBeNull();
    expect(captured?.pending?.location.pathname).toBe("/bar/9");
    expect(captured?.pending?.params).toEqual({ id: "9" });
    expect(captured?.pending?.type).toBe("PUSH");

    barDefer.resolve({});
    await waitFor(() =>
      expect(captured?.active.location.pathname).toBe("/bar/9"),
    );
    expect(captured?.pending).toBeNull();
  });

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
