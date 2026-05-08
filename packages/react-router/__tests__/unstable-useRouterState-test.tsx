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

  it("returns matches with id, pathname, params, and handle (no data fields)", () => {
    let captured: unstable_RouterState | undefined;
    let router = createMemoryRouter(
      [
        {
          id: "root",
          path: "/",
          handle: { breadcrumb: "Home" },
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
                  handle: { breadcrumb: "Project" },
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
      {
        id: "root",
        pathname: "/",
        params: { id: "42" },
        handle: { breadcrumb: "Home" },
      },
      {
        id: "projects",
        pathname: "/projects",
        params: { id: "42" },
        handle: undefined,
      },
      {
        id: "project",
        pathname: "/projects/42",
        params: { id: "42" },
        handle: { breadcrumb: "Project" },
      },
    ]);
    // None of the data-related fields from UIMatch should be present
    captured?.active.matches.forEach((m) => {
      expect(m).not.toHaveProperty("data");
      expect(m).not.toHaveProperty("loaderData");
    });
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

  it("populates submission fields on `pending` during form submissions", async () => {
    let actionDefer = createDeferred();
    let captured: unstable_RouterState | undefined;

    let formData = new FormData();
    formData.append("name", "Ryan");

    function Layout() {
      captured = unstable_useRouterState();
      return (
        <div>
          <MemoryNavigate to="/submit" formMethod="post" formData={formData}>
            <button type="submit">Submit</button>
          </MemoryNavigate>
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
            { index: true, element: <h1>Home</h1> },
            {
              path: "submit",
              action: () => actionDefer.promise,
              element: <h1>Done</h1>,
            },
          ],
        },
      ],
      { initialEntries: ["/"] },
    );
    render(<RouterProvider router={router} />);

    expect(captured?.pending).toBeNull();

    fireEvent.click(screen.getByText("Submit"));

    expect(captured?.pending).not.toBeNull();
    expect(captured?.pending?.state).toBe("submitting");
    expect(captured?.pending?.location.pathname).toBe("/submit");
    expect(captured?.pending?.formMethod).toBe("POST");
    expect(captured?.pending?.formAction).toBe("/submit");
    expect(captured?.pending?.formEncType).toBe(
      "application/x-www-form-urlencoded",
    );
    expect(captured?.pending?.formData?.get("name")).toBe("Ryan");
    expect(captured?.pending?.json).toBeUndefined();
    expect(captured?.pending?.text).toBeUndefined();

    actionDefer.resolve({});
    await waitFor(() => expect(captured?.pending).toBeNull());
  });

  it("leaves submission fields undefined on `pending` during plain navigations", async () => {
    let loaderDefer = createDeferred();
    let captured: unstable_RouterState | undefined;

    function Layout() {
      captured = unstable_useRouterState();
      return (
        <div>
          <MemoryNavigate to="/bar">Go</MemoryNavigate>
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
            { index: true, element: <h1>Home</h1> },
            {
              path: "bar",
              loader: () => loaderDefer.promise,
              element: <h1>Bar</h1>,
            },
          ],
        },
      ],
      { initialEntries: ["/"] },
    );
    render(<RouterProvider router={router} />);

    fireEvent.click(screen.getByText("Go"));

    expect(captured?.pending).not.toBeNull();
    expect(captured?.pending?.state).toBe("loading");
    expect(captured?.pending?.formMethod).toBeUndefined();
    expect(captured?.pending?.formAction).toBeUndefined();
    expect(captured?.pending?.formEncType).toBeUndefined();
    expect(captured?.pending?.formData).toBeUndefined();
    expect(captured?.pending?.json).toBeUndefined();
    expect(captured?.pending?.text).toBeUndefined();

    loaderDefer.resolve({});
    await waitFor(() => expect(captured?.pending).toBeNull());
  });

  it("preserves identity of `active` across pending-only changes (and vice versa)", async () => {
    let barDefer = createDeferred();
    let snapshots: unstable_RouterState[] = [];

    function Layout() {
      snapshots.push(unstable_useRouterState());
      return (
        <div>
          <MemoryNavigate to="/bar">Go</MemoryNavigate>
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
            { index: true, element: <h1>Home</h1> },
            {
              path: "bar",
              loader: () => barDefer.promise,
              element: <h1>Bar</h1>,
            },
          ],
        },
      ],
      { initialEntries: ["/"] },
    );
    render(<RouterProvider router={router} />);

    let initial = snapshots[snapshots.length - 1];

    fireEvent.click(screen.getByText("Go"));

    let mid = snapshots[snapshots.length - 1];
    // `pending` started, but `active` is still on the same location, so its
    // identity should be preserved.
    expect(mid.active).toBe(initial.active);
    expect(mid.pending).not.toBe(initial.pending);

    barDefer.resolve({});
    await waitFor(() =>
      expect(snapshots[snapshots.length - 1].active.location.pathname).toBe(
        "/bar",
      ),
    );

    let final = snapshots[snapshots.length - 1];
    // `active` moved, so it should have a new identity, but `pending` is back
    // to `null` and should match the initial `null` reference.
    expect(final.active).not.toBe(mid.active);
    expect(final.pending).toBe(initial.pending);
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
