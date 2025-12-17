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
  useRouteError,
} from "../../index";

import { createFormData, tick } from "../router/utils/utils";
import getHtml from "../utils/getHtml";

describe(`handleError`, () => {
  let consoleError: jest.SpyInstance;

  beforeEach(() => {
    consoleError = jest.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    consoleError.mockRestore();
  });

  it("handles hydration lazy errors", async () => {
    let spy = jest.fn();
    let router = createMemoryRouter([
      {
        path: "/",
        async lazy() {
          await tick();
          throw new Error("lazy error!");
        },
        HydrateFallback: () => <h1>Loading...</h1>,
      },
    ]);

    let { container } = render(
      <RouterProvider router={router} onError={spy} />,
    );
    await waitFor(() => screen.getByText("lazy error!"));

    expect(spy).toHaveBeenCalledWith(new Error("lazy error!"), {
      location: expect.objectContaining({ pathname: "/" }),
      params: {},
      unstable_pattern: "/",
    });
    expect(spy).toHaveBeenCalledTimes(1);
    expect(getHtml(container)).toContain("Unexpected Application Error!");
  });

  it("handles hydration middleware errors", async () => {
    let spy = jest.fn();
    let router = createMemoryRouter([
      {
        path: "/",
        middleware: [
          async () => {
            await tick();
            throw new Error("middleware error!");
          },
        ],
        Component: () => <h1>Home</h1>,
        ErrorBoundary: () => (
          <h1>Error:{(useRouteError() as Error).message}</h1>
        ),
      },
    ]);

    render(<RouterProvider router={router} onError={spy} />);

    await waitFor(() => screen.getByText("Error:middleware error!"));

    expect(spy).toHaveBeenCalledWith(new Error("middleware error!"), {
      location: expect.objectContaining({ pathname: "/" }),
      params: {},
      unstable_pattern: "/",
    });
    expect(spy).toHaveBeenCalledTimes(1);
  });

  it("handles hydration loader errors", async () => {
    let spy = jest.fn();
    let router = createMemoryRouter([
      {
        path: "/",
        async loader() {
          await tick;
          throw new Error("loader error!");
        },
        Component: () => <h1>Home</h1>,
        ErrorBoundary: () => (
          <h1>Error:{(useRouteError() as Error).message}</h1>
        ),
        HydrateFallback: () => <h1>Loading...</h1>,
      },
    ]);

    render(<RouterProvider router={router} onError={spy} />);

    await waitFor(() => screen.getByText("Error:loader error!"));

    expect(spy).toHaveBeenCalledWith(new Error("loader error!"), {
      location: expect.objectContaining({ pathname: "/" }),
      params: {},
      unstable_pattern: "/",
    });
    expect(spy).toHaveBeenCalledTimes(1);
  });

  it("handles navigation lazy errors", async () => {
    let spy = jest.fn();
    let router = createMemoryRouter([
      {
        path: "/",
        Component: () => <h1>Home</h1>,
      },
      {
        id: "page",
        path: "/page",
        async lazy() {
          throw new Error("lazy error!");
        },
        HydrateFallback: () => <h1>Loading...</h1>,
      },
    ]);

    let { container } = render(
      <RouterProvider router={router} onError={spy} />,
    );

    await act(() => router.navigate("/page"));

    expect(spy).toHaveBeenCalledWith(new Error("lazy error!"), {
      location: expect.objectContaining({ pathname: "/page" }),
      params: {},
      unstable_pattern: "/page",
    });
    expect(spy).toHaveBeenCalledTimes(1);
    let html = getHtml(container);
    expect(html).toContain("Unexpected Application Error!");
    expect(html).toContain("lazy error!");
  });

  it("handles navigation middleware errors", async () => {
    let spy = jest.fn();
    let router = createMemoryRouter([
      {
        path: "/",
        Component: () => <h1>Home</h1>,
      },
      {
        path: "/page",
        middleware: [
          () => {
            throw new Error("middleware error!");
          },
        ],
        Component: () => <h1>Page</h1>,
        ErrorBoundary: () => <h1>Error</h1>,
      },
    ]);

    let { container } = render(
      <RouterProvider router={router} onError={spy} />,
    );

    await act(() => router.navigate("/page"));

    expect(spy).toHaveBeenCalledWith(new Error("middleware error!"), {
      location: expect.objectContaining({ pathname: "/page" }),
      params: {},
      unstable_pattern: "/page",
    });
    expect(spy).toHaveBeenCalledTimes(1);
    expect(getHtml(container)).toContain("Error");
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
      <RouterProvider router={router} onError={spy} />,
    );

    await act(() => router.navigate("/page"));

    expect(spy).toHaveBeenCalledWith(new Error("loader error!"), {
      location: expect.objectContaining({ pathname: "/page" }),
      params: {},
      unstable_pattern: "/page",
    });
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
      <RouterProvider router={router} onError={spy} />,
    );

    await act(() =>
      router.navigate("/page", {
        formMethod: "post",
        formData: createFormData({}),
      }),
    );

    expect(spy).toHaveBeenCalledWith(new Error("action error!"), {
      location: expect.objectContaining({ pathname: "/page" }),
      params: {},
      unstable_pattern: "/page",
    });
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
      <RouterProvider router={router} onError={spy} />,
    );

    await act(() => router.fetch("key", "0", "/fetch"));

    expect(spy).toHaveBeenCalledWith(new Error("loader error!"), {
      location: expect.objectContaining({ pathname: "/" }),
      params: {},
      unstable_pattern: "/",
    });
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
      <RouterProvider router={router} onError={spy} />,
    );

    await act(() =>
      router.fetch("key", "0", "/fetch", {
        formMethod: "post",
        formData: createFormData({}),
      }),
    );

    expect(spy).toHaveBeenCalledWith(new Error("action error!"), {
      location: expect.objectContaining({ pathname: "/" }),
      params: {},
      unstable_pattern: "/",
    });
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
      <RouterProvider router={router} onError={spy} />,
    );

    await act(() => router.navigate("/page"));

    expect(spy).toHaveBeenCalledWith(new Error("render error!"), {
      location: expect.objectContaining({ pathname: "/page" }),
      params: {},
      unstable_pattern: "/page",
      errorInfo: expect.objectContaining({
        componentStack: expect.any(String),
      }),
    });
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
      <RouterProvider router={router} onError={spy} />,
    );

    await act(() => router.navigate("/page"));
    await waitFor(() => screen.getByText("Await Error"));

    expect(spy).toHaveBeenCalledWith(new Error("await error!"), {
      location: expect.objectContaining({ pathname: "/page" }),
      params: {},
      unstable_pattern: "/page",
    });
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
      <RouterProvider router={router} onError={spy} />,
    );

    await act(() => router.navigate("/page"));
    await waitFor(() => screen.getByText("Await Error"));

    expect(spy).toHaveBeenCalledWith(new Error("await error!"), {
      location: expect.objectContaining({ pathname: "/page" }),
      params: {},
      unstable_pattern: "/page",
      errorInfo: expect.objectContaining({
        componentStack: expect.any(String),
      }),
    });
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
      <RouterProvider router={router} onError={spy} />,
    );

    await act(() => router.navigate("/page"));
    await waitFor(() => screen.getByText("Route Error"));

    expect(spy).toHaveBeenCalledWith(new Error("await error!"), {
      location: expect.objectContaining({ pathname: "/page" }),
      params: {},
      unstable_pattern: "/page",
    });
    expect(spy).toHaveBeenCalledWith(new Error("errorElement error!"), {
      location: expect.objectContaining({ pathname: "/page" }),
      params: {},
      unstable_pattern: "/page",
      errorInfo: expect.objectContaining({
        componentStack: expect.any(String),
      }),
    });
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
      <RouterProvider router={router} onError={spy} />,
    );

    await act(() => router.navigate("/page"));

    expect(spy).toHaveBeenCalledWith(new Error("loader error!"), {
      location: expect.objectContaining({ pathname: "/page" }),
      params: {},
      unstable_pattern: "/page",
    });
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
      <RouterProvider router={router} onError={spy} />,
    );

    await act(() => router.navigate("/page"));

    expect(spy).toHaveBeenCalledWith(new Error("render error!"), {
      location: expect.objectContaining({ pathname: "/page" }),
      params: {},
      unstable_pattern: "/page",
      errorInfo: expect.objectContaining({
        componentStack: expect.any(String),
      }),
    });
    expect(spy).toHaveBeenCalledTimes(1);
    expect(getHtml(container)).toContain("Error");

    // Doesn't re-call on a fetcher update from a rendered error boundary
    await fireEvent.click(container.querySelector("button")!);
    await waitFor(() => screen.getByText("FETCH"));
    expect(spy.mock.calls.length).toBe(1);
  });
});
