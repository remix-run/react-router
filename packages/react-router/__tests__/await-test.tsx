import { act, render, screen } from "@testing-library/react";
import * as React from "react";
import { flushSync } from "react-dom";

import {
  Await,
  RouterProvider,
  createMemoryRouter,
  UNSAFE_AwaitContextProvider as AwaitContextProvider,
  useAsyncError,
  useAsyncValue,
} from "../index";
import { createDeferred } from "./router/utils/utils";

async function renderAsync(element: React.ReactElement) {
  let result!: ReturnType<typeof render>;
  await act(async () => {
    result = render(element);
  });
  return result;
}

describe("Await", () => {
  it.each<PromiseSettledResult<unknown>>([
    { status: "fulfilled", value: "Resolved" },
    { status: "fulfilled", value: undefined },
    { status: "rejected", reason: new Error("Rejected") },
    { status: "rejected", reason: undefined },
    { status: "rejected", reason: null },
    { status: "rejected", reason: false },
    { status: "rejected", reason: 0 },
  ])("reads a settled context result: %p", (result) => {
    let receivedValue: unknown;
    let receivedError: unknown;
    function Content() {
      receivedValue = useAsyncValue();
      receivedError = useAsyncError();
      return <p>Content</p>;
    }
    render(
      <AwaitContextProvider value={result}>
        <Content />
      </AwaitContextProvider>,
    );
    expect(screen.getByText("Content")).toBeVisible();
    expect(receivedValue).toBe(
      result.status === "fulfilled" ? result.value : undefined,
    );
    expect(receivedError).toBe(
      result.status === "rejected" ? result.reason : undefined,
    );
  });

  it("returns undefined from async hooks outside Await", () => {
    function Content() {
      expect(useAsyncValue()).toBeUndefined();
      expect(useAsyncError()).toBeUndefined();
      return <p>Content</p>;
    }
    render(<Content />);
    expect(screen.getByText("Content")).toBeVisible();
  });

  it("does not show a fallback when reusing a shared promise from its fulfillment callback", async () => {
    let deferred = createDeferred<string>();
    let showSharedPromise!: () => void;
    function Content() {
      let [resolve, setResolve] = React.useState<string | Promise<string>>(
        "Initial",
      );
      showSharedPromise = () => setResolve(deferred.promise);
      return (
        <>
          <React.Suspense fallback={<p>First loading</p>}>
            <Await resolve={deferred.promise}>
              {(value) => <p>First:{value}</p>}
            </Await>
          </React.Suspense>
          <React.Suspense fallback={<p>Second loading</p>}>
            <Await resolve={resolve}>{(value) => <p>Second:{value}</p>}</Await>
          </React.Suspense>
        </>
      );
    }
    await renderAsync(<Content />);
    expect(screen.getByText("Second:Initial")).toBeVisible();
    let fallbackWasVisible: boolean | undefined;
    let valueWasVisible: boolean | undefined;
    deferred.promise.then(() => {
      flushSync(showSharedPromise);
      fallbackWasVisible = screen.queryByText("Second loading") != null;
      valueWasVisible = screen.queryByText("Second:Resolved") != null;
    });
    await act(() => deferred.resolve("Resolved"));
    expect(screen.getByText("Second:Resolved")).toBeVisible();
    expect(fallbackWasVisible).toBe(false);
    expect(valueWasVisible).toBe(true);
  });

  it("does not show a fallback when reusing a shared promise from its rejection callback", async () => {
    let deferred = createDeferred<string>();
    let error = new Error("Rejected");
    let showSharedPromise!: () => void;
    function ErrorElement({ name }: { name: string }) {
      expect(useAsyncError()).toBe(error);
      return <p>{name}:Rejected</p>;
    }
    function Content() {
      let [resolve, setResolve] = React.useState<string | Promise<string>>(
        "Initial",
      );
      showSharedPromise = () => setResolve(deferred.promise);
      return (
        <>
          <React.Suspense fallback={<p>First loading</p>}>
            <Await
              resolve={deferred.promise}
              errorElement={<ErrorElement name="First" />}
            >
              {(value) => <p>First:{value}</p>}
            </Await>
          </React.Suspense>
          <React.Suspense fallback={<p>Second loading</p>}>
            <Await
              resolve={resolve}
              errorElement={<ErrorElement name="Second" />}
            >
              {(value) => <p>Second:{value}</p>}
            </Await>
          </React.Suspense>
        </>
      );
    }
    await renderAsync(<Content />);
    expect(screen.getByText("Second:Initial")).toBeVisible();
    let fallbackWasVisible: boolean | undefined;
    let errorWasVisible: boolean | undefined;
    deferred.promise.catch(() => {
      flushSync(showSharedPromise);
      fallbackWasVisible = screen.queryByText("Second loading") != null;
      errorWasVisible = screen.queryByText("Second:Rejected") != null;
    });
    await act(() => deferred.reject(error));
    expect(screen.getByText("Second:Rejected")).toBeVisible();
    expect(fallbackWasVisible).toBe(false);
    expect(errorWasVisible).toBe(true);
  });

  it("keeps a render error visible when resolve changes to a pending promise", async () => {
    let consoleError = jest
      .spyOn(console, "error")
      .mockImplementation(() => {});
    let first = createDeferred<string>();
    let second = createDeferred<string>();
    let error = new Error("Render failed");
    function ErrorElement() {
      expect(useAsyncError()).toBe(error);
      expect(useAsyncValue()).toBeUndefined();
      return <p>Render error</p>;
    }
    function Content({ resolve }: { resolve: Promise<string> | string }) {
      return (
        <React.Suspense fallback={<p>Loading</p>}>
          <Await resolve={resolve} errorElement={<ErrorElement />}>
            {(value) => {
              if (value === "Bad") throw error;
              return <p>{value}</p>;
            }}
          </Await>
        </React.Suspense>
      );
    }
    try {
      let { rerender } = await renderAsync(<Content resolve={first.promise} />);
      await act(() => first.resolve("Bad"));
      expect(screen.getByText("Render error")).toBeVisible();
      await act(async () => rerender(<Content resolve={second.promise} />));
      expect(screen.getByText("Render error")).toBeVisible();
      expect(screen.queryByText("Loading")).not.toBeInTheDocument();
      await act(() => second.resolve("Good"));
      expect(screen.getByText("Render error")).toBeVisible();

      // Raw values bypass the existing render error, but do not reset it.
      await act(async () => rerender(<Content resolve="Raw" />));
      expect(screen.getByText("Raw")).toBeVisible();
      await act(async () => rerender(<Content resolve={second.promise} />));
      expect(screen.getByText("Render error")).toBeVisible();
    } finally {
      consoleError.mockRestore();
    }
  });

  it.each([undefined, null, false, 0, "", { then() {} }])(
    "renders a non-Promise value synchronously: %p",
    (value) => {
      let received: unknown;
      render(
        <Await resolve={value}>
          {(data) => {
            received = data;
            return <p>Content</p>;
          }}
        </Await>,
      );
      expect(screen.getByText("Content")).toBeInTheDocument();
      expect(received).toBe(value);
    },
  );

  it("uses a replacement promise when the previous promise is still pending", async () => {
    let first = createDeferred<string>();
    let second = createDeferred<string>();
    function Content({ promise }: { promise: Promise<string> }) {
      return (
        <React.Suspense fallback={<p>Loading</p>}>
          <Await resolve={promise}>{(value) => <p>{value}</p>}</Await>
        </React.Suspense>
      );
    }

    let { rerender } = await renderAsync(<Content promise={first.promise} />);
    expect(screen.getByText("Loading")).toBeInTheDocument();
    await act(async () => {
      rerender(<Content promise={second.promise} />);
    });
    await act(() => second.resolve("Second"));
    expect(screen.getByText("Second")).toBeInTheDocument();
    await act(() => first.resolve("First"));
    expect(screen.queryByText("First")).not.toBeInTheDocument();
    expect(screen.getByText("Second")).toBeInTheDocument();
  });

  it("recovers from a rejected promise when resolve changes", async () => {
    let first = createDeferred<string>();
    let second = createDeferred<string>();
    let error = new Error("First failed");
    function ErrorElement() {
      expect(useAsyncValue()).toBeUndefined();
      expect(useAsyncError()).toBe(error);
      return <p>Error</p>;
    }
    function Content({ promise }: { promise: Promise<string> }) {
      return (
        <React.Suspense fallback={<p>Loading</p>}>
          <Await resolve={promise} errorElement={<ErrorElement />}>
            {(value) => <p>{value}</p>}
          </Await>
        </React.Suspense>
      );
    }

    let { rerender } = await renderAsync(<Content promise={first.promise} />);
    await act(() => first.reject(error));
    expect(screen.getByText("Error")).toBeInTheDocument();
    await act(async () => {
      rerender(<Content promise={second.promise} />);
    });
    await act(() => second.resolve("Second"));
    expect(screen.getByText("Second")).toBeInTheDocument();
    expect(screen.queryByText("Error")).not.toBeInTheDocument();
  });

  it("preserves child state when replacing a fulfilled promise", async () => {
    let first = createDeferred<string>();
    let second = createDeferred<string>();
    function Child() {
      let value = useAsyncValue() as string;
      let [count, setCount] = React.useState(0);
      return (
        <button onClick={() => setCount(count + 1)}>
          {value}:{count}
        </button>
      );
    }
    function Content({ promise }: { promise: Promise<string> }) {
      return (
        <React.Suspense fallback={<p>Loading</p>}>
          <Await resolve={promise}>
            <Child />
          </Await>
        </React.Suspense>
      );
    }

    let { rerender } = await renderAsync(<Content promise={first.promise} />);
    await act(() => first.resolve("First"));
    act(() => screen.getByRole("button").click());
    expect(screen.getByText("First:1")).toBeInTheDocument();
    await act(async () => {
      rerender(<Content promise={second.promise} />);
    });
    await act(() => second.resolve("Second"));
    expect(screen.getByText("Second:1")).toBeInTheDocument();
  });

  it("keeps the context stable when rerendering with the same fulfilled promise", async () => {
    let deferred = createDeferred<string>();
    let renderChild = jest.fn();
    let Child = React.memo(function Child() {
      renderChild();
      return <p>{useAsyncValue() as string}</p>;
    });
    function Content({ label }: { label: string }) {
      return (
        <React.Suspense fallback={<p>Loading</p>}>
          <p>{label}</p>
          <Await resolve={deferred.promise}>
            <Child />
          </Await>
        </React.Suspense>
      );
    }
    let { rerender } = await renderAsync(<Content label="First" />);
    await act(() => deferred.resolve("Value"));
    expect(screen.getByText("Value")).toBeVisible();
    let renderCount = renderChild.mock.calls.length;
    await act(async () => rerender(<Content label="Second" />));
    expect(screen.getByText("Second")).toBeVisible();
    expect(renderChild).toHaveBeenCalledTimes(renderCount);
  });

  it("provides the nearest value to nested Await children", async () => {
    let outer = createDeferred<string>();
    let inner = createDeferred<string>();
    function Value({ name }: { name: string }) {
      expect(useAsyncError()).toBeUndefined();
      return (
        <p>
          {name}:{useAsyncValue() as string}
        </p>
      );
    }
    await renderAsync(
      <React.Suspense fallback={<p>Outer loading</p>}>
        <Await resolve={outer.promise}>
          <Value name="Outer" />
          <React.Suspense fallback={<p>Inner loading</p>}>
            <Await resolve={inner.promise}>
              <Value name="Inner" />
            </Await>
          </React.Suspense>
        </Await>
      </React.Suspense>,
    );
    await act(() => outer.resolve("A"));
    expect(screen.getByText("Outer:A")).toBeInTheDocument();
    expect(screen.getByText("Inner loading")).toBeInTheDocument();
    await act(() => inner.resolve("B"));
    expect(screen.getByText("Outer:A")).toBeInTheDocument();
    expect(screen.getByText("Inner:B")).toBeInTheDocument();
  });

  it("provides the resolved value within render-prop children", async () => {
    let deferred = createDeferred<string>();
    await renderAsync(
      <React.Suspense fallback={<p>Loading</p>}>
        <Await resolve={deferred.promise}>
          {(value) => <p>{String(value === useAsyncValue())}</p>}
        </Await>
      </React.Suspense>,
    );
    await act(() => deferred.resolve("Value"));
    expect(screen.getByText("true")).toBeInTheDocument();
  });

  it("reports a rejection once when a promise has multiple consumers", async () => {
    let deferred = createDeferred<string>();
    let onError = jest.fn();
    let router = createMemoryRouter([
      {
        path: "/",
        element: (
          <>
            <React.Suspense fallback={<p>Loading first</p>}>
              <Await
                resolve={deferred.promise}
                errorElement={<p>First error</p>}
              >
                {(value) => <p>{value}</p>}
              </Await>
            </React.Suspense>
            <React.Suspense fallback={<p>Loading second</p>}>
              <Await
                resolve={deferred.promise}
                errorElement={<p>Second error</p>}
              >
                {(value) => <p>{value}</p>}
              </Await>
            </React.Suspense>
          </>
        ),
      },
    ]);
    await renderAsync(<RouterProvider router={router} onError={onError} />);
    let error = new Error("Shared rejection");
    await act(() => deferred.reject(error));
    expect(screen.getByText("First error")).toBeInTheDocument();
    expect(screen.getByText("Second error")).toBeInTheDocument();
    expect(onError).toHaveBeenCalledTimes(1);
    expect(onError).toHaveBeenCalledWith(error, {
      location: expect.objectContaining({ pathname: "/" }),
      params: {},
      pattern: "/",
    });
  });

  it("uses the current onError callback for a pending promise after mounting", async () => {
    let deferred = createDeferred<string>();
    let firstOnError = jest.fn();
    let secondOnError = jest.fn();
    function Content() {
      let [resolve, setResolve] = React.useState<string | Promise<string>>(
        "Raw",
      );
      return (
        <>
          <button onClick={() => setResolve(deferred.promise)}>Load</button>
          <React.Suspense fallback={<p>Loading</p>}>
            <Await resolve={resolve} errorElement={<p>Error</p>}>
              {(value) => <p>{value}</p>}
            </Await>
          </React.Suspense>
        </>
      );
    }
    let router = createMemoryRouter([{ path: "/", Component: Content }]);
    let { rerender } = await renderAsync(
      <RouterProvider router={router} onError={firstOnError} />,
    );
    await act(async () => screen.getByRole("button").click());
    expect(screen.getByText("Loading")).toBeVisible();
    await act(async () => {
      rerender(<RouterProvider router={router} onError={secondOnError} />);
    });
    let error = new Error("Rejected");
    await act(() => deferred.reject(error));
    expect(screen.getByText("Error")).toBeVisible();
    expect(firstOnError).not.toHaveBeenCalled();
    expect(secondOnError).toHaveBeenCalledTimes(1);
    expect(secondOnError).toHaveBeenCalledWith(error, {
      location: expect.objectContaining({ pathname: "/" }),
      params: {},
      pattern: "/",
    });
  });
});
