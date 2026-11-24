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
      pattern: "/",
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
        HydrateFallback: () => <h1>Loading...</h1>,
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
      pattern: "/",
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
      pattern: "/",
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
      pattern: "/page",
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
      pattern: "/page",
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
      pattern: "/page",
    });
    expect(spy).toHaveBeenCalledTimes(1);
    expect(getHtml(container)).toContain("Error");
  });

  it.each(
    ["navigation", "action", "revalidation", "fetcher"].flatMap((update) =>
      ["none", "early", "late"].map((subscriber) => ({ update, subscriber })),
    ),
  )(
    "reports the $update error completed before RouterProvider first mounts (external subscriber: $subscriber)",
    async ({ update, subscriber }) => {
      let spy = jest.fn();
      let error = new Error("client error!");
      function ErrorBoundary() {
        return <h1>Error:{(useRouteError() as Error).message}</h1>;
      }
      let router = createMemoryRouter(
        [
          {
            id: "home",
            path: "/",
            loader() {
              throw error;
            },
            Component: () => <h1>Home</h1>,
            ErrorBoundary,
          },
          {
            id: "page",
            path: "/page",
            loader() {
              throw error;
            },
            action() {
              throw error;
            },
            Component: () => <h1>Page</h1>,
            ErrorBoundary,
          },
        ],
        { hydrationData: { loaderData: { home: "Home" } } },
      );
      expect(router.state.initialized).toBe(true);
      expect(router.state.errors).toBeNull();

      try {
        if (subscriber === "early") {
          router.subscribe(() => {});
        }

        // These errors happen after initialization but before the provider mounts.
        if (update === "navigation") {
          await router.navigate("/page");
        } else if (update === "action") {
          await router.navigate("/page", {
            formMethod: "post",
            formData: new FormData(),
          });
        } else if (update === "revalidation") {
          await router.revalidate();
        } else {
          await router.fetch("fetcher", "home", "/page");
        }
        let pathname =
          update === "navigation" || update === "action" ? "/page" : "/";
        expect(router.state.errors).toEqual({
          [pathname === "/page" ? "page" : "home"]: error,
        });

        if (subscriber === "late") {
          router.subscribe(() => {});
        }

        let { rerender } = render(
          <React.StrictMode>
            <RouterProvider router={router} onError={spy} />
          </React.StrictMode>,
        );

        expect(screen.getByText("Error:client error!")).toBeDefined();
        expect(spy).toHaveBeenCalledTimes(1);
        expect(spy).toHaveBeenCalledWith(error, {
          location: expect.objectContaining({ pathname }),
          params: {},
          pattern: pathname,
        });

        let nextSpy = jest.fn();
        rerender(
          <React.StrictMode>
            <RouterProvider router={router} onError={nextSpy} />
          </React.StrictMode>,
        );
        expect(spy).toHaveBeenCalledTimes(1);
        expect(nextSpy).not.toHaveBeenCalled();
      } finally {
        router.dispose();
      }
    },
  );

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
      pattern: "/page",
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
      pattern: "/",
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
      pattern: "/",
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
      pattern: "/page",
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
      pattern: "/page",
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
      pattern: "/page",
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
      pattern: "/page",
    });
    expect(spy).toHaveBeenCalledWith(new Error("errorElement error!"), {
      location: expect.objectContaining({ pathname: "/page" }),
      params: {},
      pattern: "/page",
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
      pattern: "/page",
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
      pattern: "/page",
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

  it("handles initial load synchronous loader errors in SPA mode", async () => {
    let spy = jest.fn();
    let router = createMemoryRouter([
      {
        path: "/",
        loader() {
          throw new Error("immediate loader error!");
        },
        Component: () => <h1>Home</h1>,
        HydrateFallback: () => <h1>Loading...</h1>,
        ErrorBoundary: () => (
          <h1>Error:{(useRouteError() as Error).message}</h1>
        ),
      },
    ]);

    render(<RouterProvider router={router} onError={spy} />);

    await waitFor(() => screen.getByText("Error:immediate loader error!"));

    expect(spy).toHaveBeenCalledWith(new Error("immediate loader error!"), {
      location: expect.objectContaining({ pathname: "/" }),
      params: {},
      pattern: "/",
    });
    expect(spy).toHaveBeenCalledTimes(1);
  });

  it("handles initial load synchronous loader errors in SPA mode (delayed render)", async () => {
    let spy = jest.fn();
    let router = createMemoryRouter([
      {
        path: "/",
        loader() {
          throw new Error("immediate loader error!");
        },
        Component: () => <h1>Home</h1>,
        HydrateFallback: () => <h1>Loading...</h1>,
        ErrorBoundary: () => (
          <h1>Error:{(useRouteError() as Error).message}</h1>
        ),
      },
    ]);

    // Make sure the router completely initializes
    await tick();

    render(<RouterProvider router={router} onError={spy} />);

    await waitFor(() => screen.getByText("Error:immediate loader error!"));

    expect(spy).toHaveBeenCalledWith(new Error("immediate loader error!"), {
      location: expect.objectContaining({ pathname: "/" }),
      params: {},
      pattern: "/",
    });
    expect(spy).toHaveBeenCalledTimes(1);
  });

  it.each([false, true])(
    "reports initial errors once in StrictMode when initialization completes before subscription (external subscriber: %s)",
    async (externalSubscriber) => {
      let sleep = (ms: number) =>
        new Promise((resolve) => setTimeout(resolve, ms));
      let suspensePromise = sleep(100);
      let spy = jest.fn();
      let hydrateFallback = jest.fn(() => <h1>Loading...</h1>);
      let router = createMemoryRouter([
        {
          path: "/",
          async loader() {
            await sleep(200);
            throw new Error("initial loader error!");
          },
          Component: () => <h1>Home</h1>,
          HydrateFallback: hydrateFallback,
          ErrorBoundary: () => (
            <h1>Error:{(useRouteError() as Error).message}</h1>
          ),
        },
      ]);
      if (externalSubscriber) {
        router.subscribe(() => {});
      }
      let subscribe = router.subscribe;
      let initializedAtSubscription: boolean[] = [];
      router.subscribe = (subscriber) => {
        initializedAtSubscription.push(router.state.initialized);
        return subscribe(subscriber);
      };

      function App() {
        // @ts-expect-error Needs React 19 types
        React.use(suspensePromise);
        return <RouterProvider router={router} onError={spy} />;
      }

      await act(async () => {
        render(
          <React.StrictMode>
            <React.Suspense fallback="Suspense Fallback">
              <App />
            </React.Suspense>
          </React.StrictMode>,
        );
      });

      await waitFor(() => screen.getByText("Error:initial loader error!"));
      expect(hydrateFallback).toHaveBeenCalled();
      expect(initializedAtSubscription[0]).toBe(true);
      expect(spy).toHaveBeenCalledTimes(1);
      expect(spy).toHaveBeenCalledWith(new Error("initial loader error!"), {
        location: expect.objectContaining({ pathname: "/" }),
        params: {},
        pattern: "/",
      });
    },
  );

  it.each(["early", "late"])(
    "reports initial errors once after delayed mounting in StrictMode (external subscriber: %s)",
    async (externalSubscriber) => {
      let spy = jest.fn();
      let router = createMemoryRouter([
        {
          path: "/",
          loader() {
            throw new Error("immediate loader error!");
          },
          Component: () => <h1>Home</h1>,
          HydrateFallback: () => <h1>Loading...</h1>,
          ErrorBoundary: () => (
            <h1>Error:{(useRouteError() as Error).message}</h1>
          ),
        },
      ]);

      if (externalSubscriber === "early") {
        router.subscribe(() => {});
      }

      // Make sure the router completely initializes before the provider renders.
      await tick();
      expect(router.state.initialized).toBe(true);
      if (externalSubscriber === "late") {
        router.subscribe(() => {});
      }

      let { rerender } = render(
        <React.StrictMode>
          <RouterProvider router={router} onError={spy} />
        </React.StrictMode>,
      );

      await waitFor(() => screen.getByText("Error:immediate loader error!"));

      expect(spy).toHaveBeenCalledWith(new Error("immediate loader error!"), {
        location: expect.objectContaining({ pathname: "/" }),
        params: {},
        pattern: "/",
      });
      expect(spy).toHaveBeenCalledTimes(1);

      // A callback change resubscribes the provider without introducing a new error.
      let nextSpy = jest.fn();
      rerender(
        <React.StrictMode>
          <RouterProvider router={router} onError={nextSpy} />
        </React.StrictMode>,
      );
      expect(spy).toHaveBeenCalledTimes(1);
      expect(nextSpy).not.toHaveBeenCalled();
    },
  );

  it.each(["initialization", "navigation"])(
    "does not replay %s errors when onError is added after mounting",
    async (update) => {
      let spy = jest.fn();
      let router = createMemoryRouter([
        {
          path: "/",
          loader() {
            throw new Error("client error!");
          },
          Component: () => <h1>Home</h1>,
          ErrorBoundary: () => <h1>Error</h1>,
        },
      ]);
      await tick();
      if (update === "navigation") {
        await router.navigate("/?again");
      }

      let { rerender } = render(<RouterProvider router={router} />);
      expect(screen.getByText("Error")).toBeDefined();
      rerender(<RouterProvider router={router} onError={spy} />);
      expect(spy).not.toHaveBeenCalled();
    },
  );

  it("reports a client error matching a hydrated server error before mounting", async () => {
    let spy = jest.fn();
    let error = new Error("shared error!");
    let router = createMemoryRouter(
      [
        {
          id: "home",
          path: "/",
          loader() {
            throw error;
          },
          Component: () => <h1>Home</h1>,
          ErrorBoundary: () => (
            <h1>Error:{(useRouteError() as Error).message}</h1>
          ),
        },
      ],
      {
        hydrationData: {
          loaderData: {},
          errors: { home: error },
        },
      },
    );
    expect(router.state.initialized).toBe(true);
    router.subscribe(() => {});
    await router.revalidate();

    render(
      <React.StrictMode>
        <RouterProvider router={router} onError={spy} />
      </React.StrictMode>,
    );
    expect(screen.getByText("Error:shared error!")).toBeDefined();
    expect(spy.mock.calls.map(([reported]) => reported)).toEqual([error]);
  });

  it("reports initial errors independently to each RouterProvider", async () => {
    let firstSpy = jest.fn();
    let secondSpy = jest.fn();
    let error = new Error("initial error!");
    let router = createMemoryRouter([
      {
        path: "/",
        loader() {
          throw error;
        },
        Component: () => <h1>Home</h1>,
        ErrorBoundary: () => <h1>Error</h1>,
      },
    ]);
    await tick();

    render(
      <React.StrictMode>
        <RouterProvider router={router} onError={firstSpy} />
        <RouterProvider router={router} onError={secondSpy} />
      </React.StrictMode>,
    );

    expect(screen.getAllByText("Error")).toHaveLength(2);
    expect(firstSpy.mock.calls.map(([reported]) => reported)).toEqual([error]);
    expect(secondSpy.mock.calls.map(([reported]) => reported)).toEqual([error]);
  });

  it("does not replay initial errors after a hash-only navigation before mounting", async () => {
    let spy = jest.fn();
    let loader = jest.fn(() => {
      throw new Error("initial error!");
    });
    let router = createMemoryRouter([
      {
        path: "/",
        loader,
        Component: () => <h1>Home</h1>,
        ErrorBoundary: () => <h1>Error</h1>,
      },
    ]);
    await tick();
    let initialErrors = router.state.errors;
    expect(initialErrors).not.toBeNull();

    await router.navigate("/#section");
    expect(router.state.errors).toBe(initialErrors);
    expect(loader).toHaveBeenCalledTimes(1);

    render(<RouterProvider router={router} onError={spy} />);
    expect(screen.getByText("Error")).toBeDefined();
    expect(spy).not.toHaveBeenCalled();
  });

  it("reports a reused initial error again on a later navigation", async () => {
    let spy = jest.fn();
    let error = new Error("reused error!");
    let router = createMemoryRouter([
      {
        path: "/",
        loader() {
          throw error;
        },
        Component: () => <h1>Home</h1>,
        ErrorBoundary: () => <h1>Error</h1>,
      },
    ]);
    await tick();

    render(<RouterProvider router={router} onError={spy} />);
    expect(spy).toHaveBeenCalledTimes(1);
    await act(() => router.navigate("/?again"));
    expect(spy).toHaveBeenCalledTimes(2);
    expect(spy.mock.calls.map(([reported]) => reported)).toEqual([
      error,
      error,
    ]);
  });

  it.each(["navigation", "revalidation", "fetcher"])(
    "does not replay initial errors superseded by a %s before mounting",
    async (update) => {
      let spy = jest.fn();
      let initialError = new Error("initial error!");
      let laterError = new Error("later error!");
      let loader = jest
        .fn()
        .mockRejectedValueOnce(initialError)
        .mockResolvedValue("Home");
      let router = createMemoryRouter([
        {
          id: "home",
          path: "/",
          loader,
          Component: () => <h1>Home</h1>,
          ErrorBoundary: () => (
            <h1>Error:{(useRouteError() as Error).message}</h1>
          ),
        },
        {
          path: "/next",
          loader() {
            throw laterError;
          },
          Component: () => <h1>Next</h1>,
          ErrorBoundary: () => (
            <h1>Error:{(useRouteError() as Error).message}</h1>
          ),
        },
      ]);
      await tick();
      expect(router.state.errors).toEqual({ home: initialError });

      if (update === "navigation") {
        await router.navigate("/next");
      } else if (update === "revalidation") {
        await router.revalidate();
      } else {
        await router.fetch("fetcher", "home", "/next");
      }

      render(<RouterProvider router={router} onError={spy} />);
      expect(
        screen.getByText(
          update === "revalidation" ? "Home" : "Error:later error!",
        ),
      ).toBeDefined();
      expect(spy.mock.calls.map(([error]) => error)).toEqual(
        update === "revalidation" ? [] : [laterError],
      );
    },
  );

  it("does not fire onError for errors from hydrationData", async () => {
    let spy = jest.fn();
    let router = createMemoryRouter(
      [
        {
          path: "/",
          loader() {
            throw new Error("hydration error!");
          },
          Component: () => <h1>Home</h1>,
          ErrorBoundary: () => (
            <h1>Error:{(useRouteError() as Error).message}</h1>
          ),
        },
      ],
      {
        hydrationData: {
          errors: { "0": new Error("hydration error!") },
          loaderData: {},
        },
      },
    );

    render(<RouterProvider router={router} onError={spy} />);

    await waitFor(() => screen.getByText("Error:hydration error!"));

    expect(spy).not.toHaveBeenCalled();
  });

  it("does not fire onError for errors from hydrationData (delayed render)", async () => {
    let spy = jest.fn();
    let router = createMemoryRouter(
      [
        {
          path: "/",
          loader() {
            throw new Error("hydration error!");
          },
          Component: () => <h1>Home</h1>,
          ErrorBoundary: () => (
            <h1>Error:{(useRouteError() as Error).message}</h1>
          ),
        },
      ],
      {
        hydrationData: {
          errors: { "0": new Error("hydration error!") },
          loaderData: {},
        },
      },
    );

    // Make sure the router completely initializes
    await tick();

    render(<RouterProvider router={router} onError={spy} />);

    await waitFor(() => screen.getByText("Error:hydration error!"));

    expect(spy).not.toHaveBeenCalled();
  });

  it.each([
    { clientError: false, delayedRender: false },
    { clientError: false, delayedRender: true },
    { clientError: true, delayedRender: false },
    { clientError: true, delayedRender: true },
  ])(
    "only reports new client errors during partial hydration (client error: $clientError, delayed render: $delayedRender)",
    async ({ clientError, delayedRender }) => {
      let spy = jest.fn();
      let loader = Object.assign(
        jest.fn(async () => {
          if (clientError) {
            // A fresh client error can equal an existing server error, including
            // a primitive at the same boundary. Equality cannot establish origin.
            // eslint-disable-next-line no-throw-literal
            throw "shared error";
          }
          return "client root data";
        }),
        { hydrate: true },
      );
      let router = createMemoryRouter(
        [
          {
            id: "root",
            path: "/",
            loader,
            Component: () => <h1>Home</h1>,
            ErrorBoundary: () => <h1>Error:{useRouteError() as string}</h1>,
            children: [
              {
                index: true,
                loader: () => null,
                Component: () => <h1>Child</h1>,
              },
            ],
          },
        ],
        {
          hydrationData: {
            // The root loaded successfully on the server, but a descendant's
            // error bubbled to its boundary. Force its loader to run again.
            loaderData: { root: "server root data" },
            errors: { root: "shared error" },
          },
        },
      );
      expect(router.state.initialized).toBe(false);
      router.subscribe(() => {});

      if (delayedRender) {
        await tick();
      }
      expect(router.state.initialized).toBe(delayedRender);

      render(
        <React.StrictMode>
          <RouterProvider router={router} onError={spy} />
        </React.StrictMode>,
      );

      await waitFor(() => expect(router.state.initialized).toBe(true));
      expect(screen.getByText("Error:shared error")).toBeDefined();
      expect(loader).toHaveBeenCalledTimes(1);
      let errorInfo = {
        location: expect.objectContaining({ pathname: "/" }),
        params: {},
        pattern: "/",
      };
      expect(spy.mock.calls).toEqual(
        clientError ? [["shared error", errorInfo]] : [],
      );
      expect(router.state.loaderData.root).toBe(
        clientError ? undefined : "client root data",
      );
    },
  );
});
