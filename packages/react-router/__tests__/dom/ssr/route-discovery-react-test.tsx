import * as React from "react";
import { act, fireEvent, render, screen } from "@testing-library/react";
import { FrameworkContext } from "../../../lib/dom/ssr/components";
import type { AssetsManifest } from "../../../lib/dom/ssr/entry";
import {
  RouteDiscoveryRuntime,
  useCustomRouteDiscovery,
  useRouteDiscovery,
} from "../../../lib/dom/ssr/route-discovery";
import { createMemoryHistory } from "../../../lib/router/history";
import { createRouter } from "../../../lib/router/router";
import { createDeferred } from "../../router/utils/utils";

function setup(unstable_customRouteDiscovery = true) {
  let manifest: AssetsManifest = {
    version: "a",
    url: "/assets/manifest-a.js",
    entry: { module: "/assets/entry.js", imports: [] },
    routes: {},
  };
  let router = createRouter({
    history: createMemoryHistory(),
    routes: [{ path: "/" }],
  });
  let routeDiscovery = { mode: "lazy" as const, manifestPath: "/__manifest" };
  let manifestLoad = createDeferred<AssetsManifest>();
  let runtime = new RouteDiscoveryRuntime(
    () => router,
    manifest,
    {},
    true,
    routeDiscovery,
    false,
    "/",
    () => manifestLoad.promise,
  );
  function Provider({ children }: { children: React.ReactNode }) {
    let state = useCustomRouteDiscovery(runtime);
    return (
      <FrameworkContext.Provider
        value={{
          manifest,
          routeModules: {},
          future: { unstable_customRouteDiscovery },
          ssr: true,
          isSpaMode: false,
          routeDiscovery,
          routeDiscoveryRuntime: runtime,
          routeDiscoveryState: state,
        }}
      >
        {children}
      </FrameworkContext.Provider>
    );
  }
  return { manifest, manifestLoad, runtime, Provider };
}

test("discovery completion preserves visible content while the next UI suspends", async () => {
  let { manifest, manifestLoad, Provider } = setup();
  let nextUI = createDeferred<{ default: () => React.ReactElement }>();
  let Complete = React.lazy(() => nextUI.promise);
  let loading: Promise<void> | undefined;
  function App() {
    let { state, loadAllRoutes } = useRouteDiscovery();
    return state === "complete" ? (
      <Complete />
    ) : (
      <>
        <p>Current screen</p>
        <button
          onClick={() =>
            React.startTransition(() => {
              loading = loadAllRoutes();
            })
          }
        >
          Load all routes
        </button>
      </>
    );
  }
  render(
    <React.StrictMode>
      <Provider>
        <React.Suspense fallback={<p>Loading UI</p>}>
          <App />
        </React.Suspense>
      </Provider>
    </React.StrictMode>,
  );
  await act(async () => {
    fireEvent.click(screen.getByText("Load all routes"));
    await manifestLoad.resolve(manifest);
    await loading;
  });
  expect(screen.queryByText("Loading UI")).not.toBeInTheDocument();
  expect(screen.getByText("Current screen")).toBeVisible();
  await act(async () => {
    await nextUI.resolve({ default: () => <p>Complete screen</p> });
  });
  expect(screen.getByText("Complete screen")).toBeVisible();
});

test("a later consumer starts with complete state instead of suspending on partial state", async () => {
  let { manifest, manifestLoad, runtime, Provider } = setup();
  let pending = createDeferred();
  function LaterConsumer() {
    let { state } = useRouteDiscovery();
    if (state !== "complete") throw pending.promise;
    return <p>Already complete</p>;
  }
  function App() {
    let [show, setShow] = React.useState(false);
    return (
      <>
        <button onClick={() => setShow(true)}>Show consumer</button>
        <React.Suspense fallback={<p>Waiting for discovery</p>}>
          {show ? <LaterConsumer /> : null}
        </React.Suspense>
      </>
    );
  }
  render(
    <Provider>
      <App />
    </Provider>,
  );
  await act(async () => {
    let loading = runtime.loadAllRoutes();
    await manifestLoad.resolve(manifest);
    await loading;
  });
  await act(async () => {
    fireEvent.click(screen.getByText("Show consumer"));
  });
  expect(screen.queryByText("Waiting for discovery")).not.toBeInTheDocument();
  expect(screen.getByText("Already complete")).toBeVisible();
});

test("the hook requires the custom discovery flag", () => {
  let { Provider } = setup(false);
  let consoleError = jest.spyOn(console, "error").mockImplementation(() => {});
  function App() {
    useRouteDiscovery();
    return null;
  }
  try {
    expect(() =>
      render(
        <Provider>
          <App />
        </Provider>,
      ),
    ).toThrow("future.unstable_customRouteDiscovery");
  } finally {
    consoleError.mockRestore();
  }
});

test("committed callback updates preserve priority and unmounting restores defaults", async () => {
  let { Provider, runtime } = setup();
  let originalFetch = global.fetch;
  global.fetch = jest.fn(
    async () =>
      new Response(null, {
        status: 204,
        headers: { "X-Remix-Reload-Document": "true" },
      }),
  );
  let warn = jest.spyOn(console, "warn").mockImplementation(() => {});
  let calls: string[] = [];
  function App({ value }: { value: string }) {
    useRouteDiscovery({
      onManifestMismatch: () => {
        calls.push(value);
      },
    });
    return null;
  }
  // A no-argument consumer must not suppress built-in recovery.
  function Observer() {
    useRouteDiscovery();
    return null;
  }
  try {
    let rendered = render(
      <React.StrictMode>
        <Provider>
          <App value="first" />
          <Observer />
        </Provider>
      </React.StrictMode>,
    );
    await runtime.discover(["/a"], "eager", null);
    expect(calls).toEqual(["first"]);
    expect(warn).not.toHaveBeenCalled();
    rendered.rerender(
      <React.StrictMode>
        <Provider>
          <App value="updated" />
          <Observer />
        </Provider>
      </React.StrictMode>,
    );
    await runtime.discover(["/a"], "eager", null);
    expect(calls).toEqual(["first", "updated"]);
    rendered.rerender(
      <React.StrictMode>
        <Provider>
          {null}
          <Observer />
        </Provider>
      </React.StrictMode>,
    );
    await runtime.discover(["/a"], "eager", null);
    expect(warn).toHaveBeenCalledTimes(1);
  } finally {
    global.fetch = originalFetch;
    warn.mockRestore();
  }
});
