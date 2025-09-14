import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import * as React from "react";

import {
  Await,
  RouterProvider,
  createMemoryRouter,
  useFetcher,
  useLoaderData,
} from "../../index";

import { createFormData } from "../router/utils/utils";
import getHtml from "../utils/getHtml";

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
    let router = createMemoryRouter([
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
    ]);

    let { container } = render(
      <RouterProvider router={router} unstable_onError={spy} />,
    );

    await act(() => router.navigate("/page"));

    expect(spy).toHaveBeenCalledWith(new Error("loader error!"));
    expect(spy).toHaveBeenCalledTimes(1);
    expect(getHtml(container)).toContain("Error");
  });

  it("handles navigation action errors", async () => {
    let spy = jest.fn();
    let router = createMemoryRouter([
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
    ]);

    let { container } = render(
      <RouterProvider router={router} unstable_onError={spy} />,
    );

    await act(() =>
      router.navigate("/page", {
        formMethod: "post",
        formData: createFormData({}),
      }),
    );

    expect(spy).toHaveBeenCalledWith(new Error("action error!"));
    expect(spy).toHaveBeenCalledTimes(1);
    expect(getHtml(container)).toContain("Error");
  });

  it("handles fetcher loader errors", async () => {
    let spy = jest.fn();
    let router = createMemoryRouter([
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
    ]);

    let { container } = render(
      <RouterProvider router={router} unstable_onError={spy} />,
    );

    await act(() => router.fetch("key", "0", "/fetch"));

    expect(spy).toHaveBeenCalledWith(new Error("loader error!"));
    expect(spy).toHaveBeenCalledTimes(1);
    expect(getHtml(container)).toContain("Error");
  });

  it("handles fetcher action errors", async () => {
    let spy = jest.fn();
    let router = createMemoryRouter([
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
    ]);

    let { container } = render(
      <RouterProvider router={router} unstable_onError={spy} />,
    );

    await act(() =>
      router.fetch("key", "0", "/fetch", {
        formMethod: "post",
        formData: createFormData({}),
      }),
    );

    expect(spy).toHaveBeenCalledWith(new Error("action error!"));
    expect(spy).toHaveBeenCalledTimes(1);
    expect(getHtml(container)).toContain("Error");
  });

  it("handles render errors", async () => {
    let spy = jest.fn();
    let router = createMemoryRouter([
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
    ]);

    let { container } = render(
      <RouterProvider router={router} unstable_onError={spy} />,
    );

    await act(() => router.navigate("/page"));

    expect(spy).toHaveBeenCalledWith(
      new Error("render error!"),
      expect.objectContaining({
        componentStack: expect.any(String),
      }),
    );
    expect(spy).toHaveBeenCalledTimes(1);
    expect(getHtml(container)).toContain("Error");
  });

  it("handles deferred data rejections from <Await>", async () => {
    let spy = jest.fn();
    let router = createMemoryRouter([
      {
        path: "/",
        Component: () => <h1>Home</h1>,
      },
      {
        path: "/page",
        loader() {
          return {
            promise: new Promise((_, r) =>
              setTimeout(() => r(new Error("await error!")), 1),
            ),
          };
        },
        Component() {
          let data = useLoaderData();
          return (
            <Await resolve={data.promise} errorElement={<h1>Await Error</h1>}>
              {() => <p>Should not see me</p>}
            </Await>
          );
        },
      },
    ]);

    let { container } = render(
      <RouterProvider router={router} unstable_onError={spy} />,
    );

    await act(() => router.navigate("/page"));
    await waitFor(() => screen.getByText("Await Error"));

    expect(spy).toHaveBeenCalledWith(new Error("await error!"));
    expect(spy).toHaveBeenCalledTimes(1);
    expect(getHtml(container)).toContain("Await Error");
  });

  it("handles render errors from Await components", async () => {
    let spy = jest.fn();
    let router = createMemoryRouter([
      {
        path: "/",
        Component: () => <h1>Home</h1>,
      },
      {
        path: "/page",
        loader() {
          return {
            promise: new Promise((r) => setTimeout(() => r("data"), 10)),
          };
        },
        Component() {
          let data = useLoaderData();
          return (
            <React.Suspense fallback={<p>Loading...</p>}>
              <Await resolve={data.promise} errorElement={<h1>Await Error</h1>}>
                <RenderAwait />
              </Await>
            </React.Suspense>
          );
        },
      },
    ]);

    function RenderAwait() {
      throw new Error("await error!");
      // eslint-disable-next-line no-unreachable
      return <p>should not see me</p>;
    }

    let { container } = render(
      <RouterProvider router={router} unstable_onError={spy} />,
    );

    await act(() => router.navigate("/page"));
    await waitFor(() => screen.getByText("Await Error"));

    expect(spy).toHaveBeenCalledWith(
      new Error("await error!"),
      expect.objectContaining({
        componentStack: expect.any(String),
      }),
    );
    expect(spy).toHaveBeenCalledTimes(1);
    expect(getHtml(container)).toContain("Await Error");
  });

  it("handles render errors from Await errorElement", async () => {
    let spy = jest.fn();
    let router = createMemoryRouter([
      {
        path: "/",
        Component: () => <h1>Home</h1>,
      },
      {
        path: "/page",
        loader() {
          return {
            promise: new Promise((_, r) =>
              setTimeout(() => r(new Error("await error!")), 10),
            ),
          };
        },
        Component() {
          let data = useLoaderData();
          return (
            <React.Suspense fallback={<p>Loading...</p>}>
              <Await resolve={data.promise} errorElement={<RenderError />}>
                {() => <p>Should not see me</p>}
              </Await>
            </React.Suspense>
          );
        },
        ErrorBoundary: () => <h1>Route Error</h1>,
      },
    ]);

    function RenderError() {
      throw new Error("errorElement error!");
      // eslint-disable-next-line no-unreachable
      return <p>should not see me</p>;
    }

    let { container } = render(
      <RouterProvider router={router} unstable_onError={spy} />,
    );

    await act(() => router.navigate("/page"));
    await waitFor(() => screen.getByText("Route Error"));

    expect(spy).toHaveBeenCalledWith(new Error("await error!"));
    expect(spy).toHaveBeenCalledWith(
      new Error("errorElement error!"),
      expect.objectContaining({
        componentStack: expect.any(String),
      }),
    );
    expect(spy).toHaveBeenCalledTimes(2);
    expect(getHtml(container)).toContain("Route Error");
  });

  it("doesn't double report on state updates during an error boundary from a data error", async () => {
    let spy = jest.fn();
    let router = createMemoryRouter([
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
    ]);

    let { container } = render(
      <RouterProvider router={router} unstable_onError={spy} />,
    );

    await act(() => router.navigate("/page"));

    expect(spy).toHaveBeenCalledWith(new Error("loader error!"));
    expect(spy).toHaveBeenCalledTimes(1);
    expect(getHtml(container)).toContain("Error");

    // Doesn't re-call on a fetcher update from a rendered error boundary
    await fireEvent.click(container.querySelector("button")!);
    await waitFor(() => screen.getByText("FETCH"));
    expect(spy.mock.calls.length).toBe(1);
  });

  it("doesn't double report on state updates during an error boundary from a render error", async () => {
    let spy = jest.fn();
    let router = createMemoryRouter([
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
    ]);

    let { container } = render(
      <RouterProvider router={router} unstable_onError={spy} />,
    );

    await act(() => router.navigate("/page"));

    expect(spy).toHaveBeenCalledWith(
      new Error("render error!"),
      expect.objectContaining({
        componentStack: expect.any(String),
      }),
    );
    expect(spy).toHaveBeenCalledTimes(1);
    expect(getHtml(container)).toContain("Error");

    // Doesn't re-call on a fetcher update from a rendered error boundary
    await fireEvent.click(container.querySelector("button")!);
    await waitFor(() => screen.getByText("FETCH"));
    expect(spy.mock.calls.length).toBe(1);
  });
});
