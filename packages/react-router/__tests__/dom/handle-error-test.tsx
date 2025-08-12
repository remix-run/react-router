import { act, fireEvent, render, waitFor } from "@testing-library/react";
import * as React from "react";

import {
  Outlet,
  RouterProvider,
  createMemoryRouter,
  useFetcher,
} from "../../index";

import getHtml from "../utils/getHtml";
import { createFormData } from "../router/utils/utils";

describe(`handleError`, () => {
  let consoleError: jest.SpyInstance;

  beforeEach(() => {
    consoleError = jest.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    consoleError.mockRestore();
  });

  it("handles navigation loader errors", async () => {
    let spy = jest.fn();
    let router = createMemoryRouter(
      [
        {
          path: "/",
          Component: () => <h1>Home</h1>,
        },
        {
          path: "/page",
          loader() {
            throw new Error("loader error!");
          },
          Component: () => <h1>Page</h1>,
          ErrorBoundary: () => <h1>Error</h1>,
        },
      ],
      {
        unstable_handleError: spy,
      },
    );

    let { container } = render(<RouterProvider router={router} />);

    await act(() => router.navigate("/page"));

    expect(spy.mock.calls).toEqual([
      [
        new Error("loader error!"),
        {
          location: expect.objectContaining({ pathname: "/page" }),
          errorInfo: undefined,
        },
      ],
    ]);
    expect(getHtml(container)).toContain("Error");
  });

  it("handles navigation action errors", async () => {
    let spy = jest.fn();
    let router = createMemoryRouter(
      [
        {
          path: "/",
          Component: () => <h1>Home</h1>,
        },
        {
          path: "/page",
          action() {
            throw new Error("action error!");
          },
          Component: () => <h1>Page</h1>,
          ErrorBoundary: () => <h1>Error</h1>,
        },
      ],
      {
        unstable_handleError: spy,
      },
    );

    let { container } = render(<RouterProvider router={router} />);

    await act(() =>
      router.navigate("/page", {
        formMethod: "post",
        formData: createFormData({}),
      }),
    );

    expect(spy.mock.calls).toEqual([
      [
        new Error("action error!"),
        {
          location: expect.objectContaining({ pathname: "/page" }),
          errorInfo: undefined,
        },
      ],
    ]);
    expect(getHtml(container)).toContain("Error");
  });

  it("handles fetcher loader errors", async () => {
    let spy = jest.fn();
    let router = createMemoryRouter(
      [
        {
          path: "/",
          Component: () => <h1>Home</h1>,
        },
        {
          path: "/fetch",
          loader() {
            throw new Error("loader error!");
          },
        },
      ],
      {
        unstable_handleError: spy,
      },
    );

    let { container } = render(<RouterProvider router={router} />);

    await act(() => router.fetch("key", "0", "/fetch"));

    expect(spy.mock.calls).toEqual([
      [
        new Error("loader error!"),
        {
          location: expect.objectContaining({ pathname: "/" }),
          errorInfo: undefined,
        },
      ],
    ]);
    expect(getHtml(container)).toContain("Error");
  });

  it("handles fetcher action errors", async () => {
    let spy = jest.fn();
    let router = createMemoryRouter(
      [
        {
          path: "/",
          Component: () => <h1>Home</h1>,
        },
        {
          path: "/fetch",
          action() {
            throw new Error("action error!");
          },
        },
      ],
      {
        unstable_handleError: spy,
      },
    );

    let { container } = render(<RouterProvider router={router} />);

    await act(() =>
      router.fetch("key", "0", "/fetch", {
        formMethod: "post",
        formData: createFormData({}),
      }),
    );

    expect(spy.mock.calls).toEqual([
      [
        new Error("action error!"),
        {
          location: expect.objectContaining({ pathname: "/" }),
          errorInfo: undefined,
        },
      ],
    ]);
    expect(getHtml(container)).toContain("Error");
  });

  it("handles render errors", async () => {
    let spy = jest.fn();
    let router = createMemoryRouter(
      [
        {
          path: "/",
          Component: () => <h1>Home</h1>,
        },
        {
          path: "/page",
          Component: () => {
            throw new Error("render error!");
          },
          ErrorBoundary: () => <h1>Error</h1>,
        },
      ],
      {
        unstable_handleError: spy,
      },
    );

    let { container } = render(<RouterProvider router={router} />);

    await act(() => router.navigate("/page"));

    expect(spy.mock.calls).toEqual([
      [
        new Error("render error!"),
        {
          location: expect.objectContaining({ pathname: "/page" }),
          errorInfo: expect.objectContaining({
            componentStack: expect.any(String),
          }),
        },
      ],
    ]);
    expect(getHtml(container)).toContain("Error");
  });

  it("doesn't double report on state updates during an error boundary from a data error", async () => {
    let spy = jest.fn();
    let router = createMemoryRouter(
      [
        {
          path: "/",
          Component: () => <h1>Home</h1>,
        },
        {
          path: "/page",
          loader() {
            throw new Error("loader error!");
          },
          Component: () => <h1>Page</h1>,
          ErrorBoundary() {
            let fetcher = useFetcher();
            return (
              <>
                <h1>Error</h1>
                <button onClick={() => fetcher.load("/fetch")}>Fetch</button>
                <p>{fetcher.data}</p>
              </>
            );
          },
        },
        {
          path: "/fetch",
          loader() {
            return "FETCH";
          },
        },
      ],
      {
        unstable_handleError: spy,
      },
    );

    let { container } = render(<RouterProvider router={router} />);

    await act(() => router.navigate("/page"));

    expect(spy.mock.calls).toEqual([
      [
        new Error("loader error!"),
        {
          location: expect.objectContaining({ pathname: "/page" }),
          errorInfo: undefined,
        },
      ],
    ]);
    expect(getHtml(container)).toContain("Error");

    // Doesn't re-call on a fetcher update from a rendered error boundary
    await fireEvent.click(container.querySelector("button")!);
    await waitFor(() => (getHtml(container) as string).includes("FETCH"));
    expect(spy.mock.calls.length).toBe(1);
  });

  it("doesn't double report on state updates during an error boundary from a render error", async () => {
    let spy = jest.fn();
    let router = createMemoryRouter(
      [
        {
          path: "/",
          Component: () => <h1>Home</h1>,
        },
        {
          path: "/page",
          Component: () => {
            throw new Error("render error!");
          },
          ErrorBoundary() {
            let fetcher = useFetcher();
            return (
              <>
                <h1>Error</h1>
                <button onClick={() => fetcher.load("/fetch")}>Fetch</button>
                <p>{fetcher.data}</p>
              </>
            );
          },
        },
        {
          path: "/fetch",
          loader() {
            return "FETCH";
          },
        },
      ],
      {
        unstable_handleError: spy,
      },
    );

    let { container } = render(<RouterProvider router={router} />);

    await act(() => router.navigate("/page"));

    expect(spy.mock.calls).toEqual([
      [
        new Error("render error!"),
        {
          location: expect.objectContaining({ pathname: "/page" }),
          errorInfo: expect.objectContaining({
            componentStack: expect.any(String),
          }),
        },
      ],
    ]);
    expect(getHtml(container)).toContain("Error");

    // Doesn't re-call on a fetcher update from a rendered error boundary
    await fireEvent.click(container.querySelector("button")!);
    await waitFor(() => (getHtml(container) as string).includes("FETCH"));
    expect(spy.mock.calls.length).toBe(1);
  });
});
