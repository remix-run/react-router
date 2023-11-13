import * as React from "react";
import {
  RouterProvider,
  createBrowserRouter,
  useNavigate,
  useSubmit,
  useFetcher,
} from "react-router-dom";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { JSDOM } from "jsdom";

describe("flushSync", () => {
  it("wraps useNavigate updates in flushSync when specified", async () => {
    let router = createBrowserRouter(
      [
        {
          path: "/",
          Component() {
            let navigate = useNavigate();
            return (
              <>
                <h1>Home</h1>
                <button onClick={() => navigate("/about")}>Go to /about</button>
              </>
            );
          },
        },
        {
          path: "/about",
          Component() {
            let navigate = useNavigate();
            return (
              <>
                <h1>About</h1>
                <button
                  onClick={() => navigate("/", { unstable_flushSync: true })}
                >
                  Go to /
                </button>
              </>
            );
          },
        },
      ],
      {
        window: getWindowImpl("/"),
      }
    );
    render(
      <RouterProvider router={router} future={{ v7_startTransition: true }} />
    );

    // This isn't the best way to test this but it seems that startTransition is
    // performing sync updates in the test/JSDOM/whatever environment which is
    // not how it behaves in the live DOM :/
    let spy = jest.fn();
    router.subscribe(spy);

    fireEvent.click(screen.getByText("Go to /about"));
    await waitFor(() => screen.getByText("About"));
    expect(spy).toBeCalledTimes(1);
    expect(spy).toHaveBeenLastCalledWith(
      expect.anything(),
      expect.objectContaining({ unstable_flushSync: false })
    );

    fireEvent.click(screen.getByText("Go to /"));
    await waitFor(() => screen.getByText("Home"));
    expect(spy).toHaveBeenLastCalledWith(
      expect.anything(),
      expect.objectContaining({ unstable_flushSync: true })
    );

    expect(spy).toBeCalledTimes(2);

    router.dispose();
  });

  it("wraps useSubmit updates in flushSync when specified", async () => {
    let router = createBrowserRouter(
      [
        {
          path: "/",
          action: () => null,
          Component() {
            let submit = useSubmit();
            return (
              <>
                <h1>Home</h1>
                <button
                  onClick={() =>
                    submit({}, { method: "post", action: "/about" })
                  }
                >
                  Go to /about
                </button>
              </>
            );
          },
        },
        {
          path: "/about",
          action: () => null,
          Component() {
            let submit = useSubmit();
            return (
              <>
                <h1>About</h1>
                <button
                  onClick={() =>
                    submit(
                      {},
                      { method: "post", action: "/", unstable_flushSync: true }
                    )
                  }
                >
                  Go to /
                </button>
              </>
            );
          },
        },
      ],
      {
        window: getWindowImpl("/"),
      }
    );
    render(
      <RouterProvider router={router} future={{ v7_startTransition: true }} />
    );

    // This isn't the best way to test this but it seems that startTransition is
    // performing sync updates in the test/JSDOM/whatever environment which is
    // not how it behaves in the live DOM :/
    let spy = jest.fn();
    router.subscribe(spy);

    fireEvent.click(screen.getByText("Go to /about"));
    await waitFor(() => screen.getByText("About"));
    expect(spy).toBeCalledTimes(2);
    expect(spy.mock.calls[0][1].unstable_flushSync).toBe(false);
    expect(spy.mock.calls[1][1].unstable_flushSync).toBe(false);

    fireEvent.click(screen.getByText("Go to /"));
    await waitFor(() => screen.getByText("Home"));
    expect(spy).toBeCalledTimes(4);
    expect(spy.mock.calls[2][1].unstable_flushSync).toBe(true);
    expect(spy.mock.calls[3][1].unstable_flushSync).toBe(false);

    router.dispose();
  });

  it("wraps fetcher.load updates in flushSync when specified", async () => {
    let router = createBrowserRouter(
      [
        {
          path: "/",
          Component() {
            let fetcher1 = useFetcher();
            let fetcher2 = useFetcher();
            return (
              <>
                <h1>Home</h1>
                <button onClick={() => fetcher1.load("/fetch")}>
                  Load async
                </button>
                <pre>{`async:${fetcher1.data}:${fetcher1.state}`}</pre>
                <button
                  onClick={() =>
                    fetcher2.load("/fetch", { unstable_flushSync: true })
                  }
                >
                  Load sync
                </button>
                <pre>{`sync:${fetcher2.data}:${fetcher2.state}`}</pre>
              </>
            );
          },
        },
        {
          path: "/fetch",
          loader: async () => {
            await new Promise((r) => setTimeout(r, 10));
            return "LOADER";
          },
        },
      ],
      {
        window: getWindowImpl("/"),
      }
    );
    render(
      <RouterProvider router={router} future={{ v7_startTransition: true }} />
    );

    // This isn't the best way to test this but it seems that startTransition is
    // performing sync updates in the test/JSDOM/whatever environment which is
    // not how it behaves in the live DOM :/
    let spy = jest.fn();
    router.subscribe(spy);

    fireEvent.click(screen.getByText("Load async"));
    await waitFor(() => screen.getByText("async:LOADER:idle"));
    expect(spy).toBeCalledTimes(2);
    expect(spy.mock.calls[0][1].unstable_flushSync).toBe(false);
    expect(spy.mock.calls[1][1].unstable_flushSync).toBe(false);

    fireEvent.click(screen.getByText("Load sync"));
    await waitFor(() => screen.getByText("sync:LOADER:idle"));
    expect(spy).toBeCalledTimes(4);
    expect(spy.mock.calls[2][1].unstable_flushSync).toBe(true);
    expect(spy.mock.calls[3][1].unstable_flushSync).toBe(false);

    router.dispose();
  });

  it("wraps fetcher.submit updates in flushSync when specified", async () => {
    let router = createBrowserRouter(
      [
        {
          path: "/",
          action: () => "ACTION",
          Component() {
            let fetcher1 = useFetcher();
            let fetcher2 = useFetcher();
            return (
              <>
                <h1>Home</h1>
                <button
                  onClick={() =>
                    fetcher1.submit({}, { method: "post", action: "/" })
                  }
                >
                  Submit async
                </button>
                <pre>{`async:${fetcher1.data}:${fetcher1.state}`}</pre>
                <button
                  onClick={() =>
                    fetcher2.submit(
                      {},
                      { method: "post", action: "/", unstable_flushSync: true }
                    )
                  }
                >
                  Submit sync
                </button>
                <pre>{`sync:${fetcher2.data}:${fetcher2.state}`}</pre>
              </>
            );
          },
        },
      ],
      {
        window: getWindowImpl("/"),
      }
    );
    render(
      <RouterProvider router={router} future={{ v7_startTransition: true }} />
    );

    // This isn't the best way to test this but it seems that startTransition is
    // performing sync updates in the test/JSDOM/whatever environment which is
    // not how it behaves in the live DOM :/
    let spy = jest.fn();
    router.subscribe(spy);

    fireEvent.click(screen.getByText("Submit async"));
    await waitFor(() => screen.getByText("async:ACTION:idle"));
    expect(spy).toBeCalledTimes(3);
    expect(spy.mock.calls[0][1].unstable_flushSync).toBe(false);
    expect(spy.mock.calls[1][1].unstable_flushSync).toBe(false);
    expect(spy.mock.calls[2][1].unstable_flushSync).toBe(false);

    fireEvent.click(screen.getByText("Submit sync"));
    await waitFor(() => screen.getByText("sync:ACTION:idle"));
    expect(spy).toBeCalledTimes(6);
    expect(spy.mock.calls[3][1].unstable_flushSync).toBe(true);
    expect(spy.mock.calls[4][1].unstable_flushSync).toBe(false);
    expect(spy.mock.calls[5][1].unstable_flushSync).toBe(false);

    router.dispose();
  });
});

function getWindowImpl(initialUrl: string, isHash = false): Window {
  // Need to use our own custom DOM in order to get a working history
  const dom = new JSDOM(`<!DOCTYPE html>`, { url: "http://localhost/" });
  dom.window.history.replaceState(null, "", (isHash ? "#" : "") + initialUrl);
  return dom.window as unknown as Window;
}
