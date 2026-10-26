import * as React from "react";
import { act, render, screen } from "@testing-library/react";
import { flushSync } from "react-dom";
import { renderToString } from "react-dom/server.node";

import {
  Await,
  RouterProvider,
  createMemoryRouter,
  useAsyncError,
  useAsyncValue,
  UNSAFE_AwaitContextProvider as AwaitContextProvider,
} from "../index";
import type { TrackedPromise } from "../lib/router/utils";
import { getAwaitPromise } from "../lib/await";
import { decodeViaTurboStream } from "../lib/dom/ssr/single-fetch";
import { encode } from "../vendor/turbo-stream-v2/turbo-stream";
import { createDeferred } from "./router/utils/utils";

function promiseProps<T>(prop: "resolve" | "unstable_promise", value: T) {
  return prop === "resolve" ? { resolve: value } : { unstable_promise: value };
}

describe.each(["resolve", "unstable_promise"] as const)("Await %s", (prop) => {
  it.each(["fulfilled", "rejected"])(
    "reads a decoded %s promise on its first render without suspending",
    async (status) => {
      let decoded = await decodeViaTurboStream(
        encode({
          promise:
            status === "fulfilled"
              ? Promise.resolve("Value")
              : Promise.reject(new Error("Rejected")),
        }),
        globalThis,
      );
      await decoded.done;
      let { promise } = decoded.value as { promise: Promise<string> };
      function ErrorElement() {
        expect(useAsyncValue()).toBeUndefined();
        expect(useAsyncError()).toEqual(new Error("Rejected"));
        return <p>Rejected</p>;
      }
      render(
        <React.Suspense fallback={<p>Loading</p>}>
          <Await
            {...promiseProps(prop, promise)}
            errorElement={<ErrorElement />}
          >
            {(value: string) => <p>{value}</p>}
          </Await>
        </React.Suspense>,
      );
      expect(
        screen.getByText(status === "fulfilled" ? "Value" : "Rejected"),
      ).toBeVisible();
      expect(screen.queryByText("Loading")).not.toBeInTheDocument();
      await act(async () => {});
    },
  );

  it("suspends until a pending promise settles and supplies the async hooks", async () => {
    let deferred = createDeferred<string>();
    function Value() {
      expect(useAsyncError()).toBeUndefined();
      return <p>{useAsyncValue() as string}</p>;
    }
    await act(async () => {
      render(
        <React.Suspense fallback={<p>Loading</p>}>
          <Await {...promiseProps(prop, deferred.promise)}>
            <Value />
          </Await>
        </React.Suspense>,
      );
    });
    expect(screen.getByText("Loading")).toBeVisible();
    await act(() => deferred.resolve("Resolved"));
    expect(screen.getByText("Resolved")).toBeVisible();
  });

  it.each([undefined, null, false, 0, ""])(
    "renders raw value %p synchronously",
    (value) => {
      let received: unknown = "unset";
      render(
        <Await {...promiseProps(prop, value)}>
          {(data: unknown) => {
            received = data;
            return <p>Content</p>;
          }}
        </Await>,
      );
      expect(received).toBe(value);
      expect(screen.getByText("Content")).toBeVisible();
    },
  );

  it.each([undefined, null, false, 0, new Error("Rejected")])(
    "reports a rejection once across consumers: %p",
    async (reason) => {
      let deferred = createDeferred<string>();
      let promise = deferred.promise;
      function ErrorElement() {
        expect(useAsyncValue()).toBeUndefined();
        expect(useAsyncError()).toEqual(reason);
        return <p>Error</p>;
      }
      let router = createMemoryRouter([
        {
          path: "/",
          element: (
            <React.Suspense fallback={<p>Loading</p>}>
              <Await
                {...promiseProps(prop, promise)}
                errorElement={<ErrorElement />}
              >
                Success
              </Await>
              <Await
                {...promiseProps(prop, promise)}
                errorElement={<ErrorElement />}
              >
                Success
              </Await>
            </React.Suspense>
          ),
        },
      ]);
      let onError = jest.fn();
      await act(async () => {
        render(<RouterProvider router={router} onError={onError} />);
      });
      await act(() => deferred.reject(reason));
      expect(screen.getAllByText("Error")).toHaveLength(2);
      expect(onError).toHaveBeenCalledTimes(1);
      expect(onError).toHaveBeenCalledWith(
        reason,
        expect.objectContaining({ pattern: "/" }),
      );
    },
  );
});

describe("Await unstable_promise", () => {
  it.each(["pending", "decoded"])(
    "preserves a %s promise rejection when onError throws",
    async (state) => {
      let error = new Error("Loader rejected");
      let reportingError = new Error("Error reporting failed");
      let deferred = createDeferred<string>();
      let source: Promise<unknown> = deferred.promise;
      if (state === "decoded") {
        let decoded = await decodeViaTurboStream(
          encode({ promise: Promise.reject(error) }),
          globalThis,
        );
        await decoded.done;
        source = (decoded.value as { promise: Promise<unknown> }).promise;
      }
      let onError = jest.fn(() => {
        throw reportingError;
      });
      let consoleError = jest
        .spyOn(console, "error")
        .mockImplementation(() => {});
      try {
        let promise = getAwaitPromise(source, onError);
        if (state === "pending") deferred.reject(error);
        await expect(promise).resolves.toEqual({
          status: "rejected",
          reason: error,
        });
        expect(onError).toHaveBeenCalledTimes(1);
        expect(onError).toHaveBeenCalledWith(error);
        expect(consoleError).toHaveBeenCalledTimes(1);
        expect(consoleError).toHaveBeenCalledWith(
          "<Await> caught the following error in onError",
          reportingError,
        );
      } finally {
        consoleError.mockRestore();
      }
    },
  );

  it("keeps errorElement handling the original rejection when onError throws", async () => {
    let deferred = createDeferred<string>();
    let error = new Error("Loader rejected");
    let reportingError = new Error("Error reporting failed");
    let onError = jest.fn().mockImplementationOnce(() => {
      throw reportingError;
    });
    function ErrorElement() {
      expect(useAsyncError()).toBe(error);
      return <p>Await error</p>;
    }
    let router = createMemoryRouter([
      {
        path: "/",
        element: (
          <React.Suspense fallback={<p>Loading</p>}>
            <Await
              unstable_promise={deferred.promise}
              errorElement={<ErrorElement />}
            >
              Success
            </Await>
          </React.Suspense>
        ),
        errorElement: <p>Route error</p>,
      },
    ]);
    let consoleError = jest
      .spyOn(console, "error")
      .mockImplementation(() => {});
    try {
      await act(async () => {
        render(<RouterProvider router={router} onError={onError} />);
      });
      expect(screen.getByText("Loading")).toBeVisible();
      await act(() => deferred.reject(error));
      expect(screen.getByText("Await error")).toBeVisible();
      expect(screen.queryByText("Route error")).not.toBeInTheDocument();
      expect(onError).toHaveBeenCalledTimes(1);
      expect(consoleError).toHaveBeenCalledWith(
        "<Await> caught the following error in onError",
        reportingError,
      );
    } finally {
      consoleError.mockRestore();
    }
  });

  it("accepts frozen promises and promise-like values without mutating them", async () => {
    let frozen = Object.freeze(Promise.resolve("Frozen"));
    let thenable: PromiseLike<string> = {
      then(resolve) {
        resolve!("Thenable");
        return undefined as any;
      },
    };
    await act(async () => {
      render(
        <React.Suspense fallback={<p>Loading</p>}>
          <Await unstable_promise={frozen}>{(value) => <p>{value}</p>}</Await>
          <Await unstable_promise={thenable}>{(value) => <p>{value}</p>}</Await>
        </React.Suspense>,
      );
    });
    expect(screen.getByText("Frozen")).toBeVisible();
    expect(screen.getByText("Thenable")).toBeVisible();
  });

  it("renders rejected promises with errorElement during SSR", async () => {
    let decoded = await decodeViaTurboStream(
      encode({ promise: Promise.reject(new Error("Rejected")) }),
      globalThis,
    );
    await decoded.done;
    let { promise } = decoded.value as { promise: Promise<string> };
    function ErrorElement() {
      expect(useAsyncValue()).toBeUndefined();
      return <p>{(useAsyncError() as Error).message}</p>;
    }
    expect(
      renderToString(
        <Await unstable_promise={promise} errorElement={<ErrorElement />}>
          Success
        </Await>,
      ),
    ).toBe("<p>Rejected</p>");
  });

  it("reads a shared promise synchronously from its settlement callback", async () => {
    let deferred = createDeferred<string>();
    let show!: () => void;
    function Content() {
      let [value, setValue] = React.useState<string | Promise<string>>(
        "Initial",
      );
      show = () => setValue(deferred.promise);
      return (
        <>
          <React.Suspense fallback={<p>First loading</p>}>
            <Await unstable_promise={deferred.promise}>
              {(v) => <p>First:{v}</p>}
            </Await>
          </React.Suspense>
          <React.Suspense fallback={<p>Second loading</p>}>
            <Await unstable_promise={value}>{(v) => <p>Second:{v}</p>}</Await>
          </React.Suspense>
        </>
      );
    }
    await act(async () => {
      render(<Content />);
    });
    let rendered = deferred.promise.then(() => {
      flushSync(show);
      expect(screen.getByText("Second:Resolved")).toBeVisible();
      expect(screen.queryByText("Second loading")).not.toBeInTheDocument();
    });
    await act(() => deferred.resolve("Resolved"));
    await rendered;
  });

  it("uses the current error callback while a promise is pending", async () => {
    let deferred = createDeferred<string>();
    let firstOnError = jest.fn();
    let secondOnError = jest.fn();
    function Content() {
      let [value, setValue] = React.useState<string | Promise<string>>(
        "Initial",
      );
      return (
        <>
          <button onClick={() => setValue(deferred.promise)}>Load</button>
          <React.Suspense fallback={<p>Loading</p>}>
            <Await unstable_promise={value} errorElement={<p>Error</p>}>
              Success
            </Await>
          </React.Suspense>
        </>
      );
    }
    let router = createMemoryRouter([
      {
        path: "/",
        Component: Content,
      },
    ]);
    let rerender!: ReturnType<typeof render>["rerender"];
    await act(async () => {
      ({ rerender } = render(
        <RouterProvider router={router} onError={firstOnError} />,
      ));
    });
    await act(async () => {
      screen.getByRole("button").click();
    });
    expect(screen.getByText("Loading")).toBeVisible();
    await act(async () => {
      rerender(<RouterProvider router={router} onError={secondOnError} />);
    });
    let error = new Error("Rejected");
    await act(() => deferred.reject(error));
    expect(screen.getByText("Error")).toBeVisible();
    expect(firstOnError).not.toHaveBeenCalled();
    expect(secondOnError).toHaveBeenCalledWith(
      error,
      expect.objectContaining({ pattern: "/" }),
    );
  });

  it.each(["resolve", "unstable_promise"] as const)(
    "uses the nearest context when nested in %s",
    async (outer) => {
      function Value({ name }: { name: string }) {
        expect(useAsyncError()).toBeUndefined();
        return (
          <p>
            {name}:{useAsyncValue() as string}
          </p>
        );
      }
      render(
        <Await {...promiseProps(outer, "Outer")}>
          <Value name="Outer" />
          <Await unstable_promise="Inner">
            <Value name="Inner" />
          </Await>
          <Await resolve="Legacy">
            <Value name="Legacy" />
          </Await>
        </Await>,
      );
      expect(screen.getByText("Outer:Outer")).toBeVisible();
      expect(screen.getByText("Inner:Inner")).toBeVisible();
      expect(screen.getByText("Legacy:Legacy")).toBeVisible();
    },
  );

  it.each(["resolve", "unstable_promise"] as const)(
    "%s handles render errors with its documented boundary",
    async (prop) => {
      let consoleError = jest
        .spyOn(console, "error")
        .mockImplementation(() => {});
      function Broken(): React.ReactNode {
        throw new Error("Render failed");
      }
      let router = createMemoryRouter([
        {
          path: "/",
          element: (
            <Await
              {...promiseProps(prop, Promise.resolve("Value"))}
              errorElement={<p>Await error</p>}
            >
              <Broken />
            </Await>
          ),
          errorElement: <p>Route error</p>,
        },
      ]);
      try {
        await act(async () => {
          render(<RouterProvider router={router} />);
        });
        expect(
          screen.getByText(
            prop === "unstable_promise" ? "Route error" : "Await error",
          ),
        ).toBeVisible();
      } finally {
        consoleError.mockRestore();
      }
    },
  );

  it.each([{}, { resolve: undefined, unstable_promise: undefined }])(
    "requires exactly one promise prop: %p",
    (props) => {
      expect(() =>
        renderToString(<Await {...(props as any)}>Content</Await>),
      ).toThrow(
        "<Await> requires exactly one of `resolve` or `unstable_promise`",
      );
    },
  );
});

it("lets React.use read decoded data without committing a fallback", async () => {
  let decoded = await decodeViaTurboStream(
    encode({ promise: Promise.resolve("Value") }),
    globalThis,
  );
  await decoded.done;
  let { promise } = decoded.value as { promise: Promise<string> };
  function Content() {
    return <p>{React.use(promise)}</p>;
  }
  render(
    <React.Suspense fallback={<p>Loading</p>}>
      <Content />
    </React.Suspense>,
  );
  expect(screen.getByText("Value")).toBeVisible();
  expect(screen.queryByText("Loading")).not.toBeInTheDocument();
});

it("preserves the server Await context format used by RSC", () => {
  function Value() {
    expect(useAsyncValue()).toBe("Server value");
    expect(useAsyncError()).toBeUndefined();
    return <p>Content</p>;
  }
  render(
    <AwaitContextProvider
      value={{ _tracked: true, _data: "Server value" } as TrackedPromise}
    >
      <Value />
    </AwaitContextProvider>,
  );
  expect(screen.getByText("Content")).toBeVisible();
});

it("tracks promises introduced by later stream chunks in cyclic collections", async () => {
  let outer = createDeferred<unknown>();
  let shared = createDeferred<string>();
  let late = createDeferred<undefined>();
  let decoded = await decodeViaTurboStream(
    encode({ outer: outer.promise, shared: shared.promise }),
    globalThis,
  );
  let root = decoded.value as { outer: Promise<any>; shared: Promise<string> };
  let nested: any = {
    array: [shared.promise],
    map: new Map([[shared.promise, new Set([late.promise])]]),
  };
  nested.self = nested;
  outer.resolve(nested);
  let data = await root.outer;
  expect(data.self).toBe(data);
  expect(data.array[0]).toBe(root.shared);
  expect([...data.map.keys()][0]).toBe(root.shared);
  let promise = [...data.map.values()][0].values().next()
    .value as Promise<undefined>;
  shared.resolve("Shared");
  late.resolve(undefined);
  await decoded.done;
  function Value() {
    let sharedValue = React.use(root.shared);
    return (
      <Await unstable_promise={promise}>
        {(value) => (
          <p>
            {sharedValue}:{String(value)}
          </p>
        )}
      </Await>
    );
  }
  render(
    <React.Suspense fallback={<p>Loading</p>}>
      <Value />
    </React.Suspense>,
  );
  expect(screen.getByText("Shared:undefined")).toBeVisible();
  expect(screen.queryByText("Loading")).not.toBeInTheDocument();
});

it("keeps adopted promises pending until their actual settlement", async () => {
  let controller!: ReadableStreamDefaultController<Uint8Array>;
  let encoder = new TextEncoder();
  let stream = new ReadableStream<Uint8Array>({
    start(value) {
      controller = value;
    },
  });
  controller.enqueue(encoder.encode('[["P",0]]\n'));
  let decoded = await decodeViaTurboStream(stream, globalThis);
  let promise = decoded.value as React.ReactPromise<string>;
  // A promise can resolve with another promise that is still pending.
  controller.enqueue(encoder.encode('P0:[["P",1]]\n'));
  await act(async () => {});
  expect(promise.status).toBe("pending");
  let seenStatus: unknown;
  promise.then(() => {
    seenStatus = promise.status;
  });
  controller.enqueue(encoder.encode('P1:["Adopted"]\n'));
  controller.close();
  await decoded.done;
  await expect(promise).resolves.toBe("Adopted");
  expect(seenStatus).toBe("fulfilled");
  function Value() {
    return <p>{React.use(promise)}</p>;
  }
  render(<Value />);
  expect(screen.getByText("Adopted")).toBeVisible();
});
