import { createStaticHandler } from "react-router";
import { act, fireEvent, render } from "@testing-library/react";
import * as React from "react";

import {
  createMemoryRouter,
  Link,
  Links,
  NavLink,
  Outlet,
  RouterProvider,
  Scripts,
} from "../../../index";
import { HydratedRouter } from "../../../lib/dom-export/hydrated-router";
import {
  FrameworkContext,
  usePrefetchBehavior,
} from "../../../lib/dom/ssr/components";
import {
  DataRouterContext,
  DataRouterStateContext,
} from "../../../lib/context";
import invariant from "../../../lib/dom/ssr/invariant";
import { ServerRouter } from "../../../lib/dom/ssr/server";
import "@testing-library/jest-dom";
import { mockEntryContext, mockFrameworkContext } from "../../utils/framework";

const setIntentEvents = ["focus", "mouseEnter", "touchStart"] as const;
type PrefetchEventHandlerProps = {
  [Property in `on${Capitalize<(typeof setIntentEvents)[number]>}`]?: Function;
};

function itPrefetchesPageLinks<
  Props extends { to: any; prefetch?: any } & PrefetchEventHandlerProps,
>(Component: React.ComponentType<Props>) {
  describe('prefetch="intent"', () => {
    let context = mockFrameworkContext({
      routeModules: { idk: { default: () => null } },
      manifest: {
        routes: {
          idk: {
            hasLoader: true,
            hasAction: false,
            hasErrorBoundary: false,
            id: "idk",
            module: "idk.js",
          },
        },
        entry: { imports: [], module: "" },
        url: "",
        version: "",
      },
    });

    beforeEach(() => {
      jest.useFakeTimers();
    });

    setIntentEvents.forEach((event) => {
      it(`prefetches page links on ${event}`, () => {
        let router;

        act(() => {
          router = createMemoryRouter([
            {
              id: "root",
              path: "/",
              element: (
                <Component {...({ to: "idk", prefetch: "intent" } as Props)} />
              ),
            },
            {
              id: "idk",
              path: "idk",
              loader: () => null,
              element: <h1>idk</h1>,
            },
          ]);
        });

        let { container, unmount } = render(
          <FrameworkContext.Provider value={context}>
            <RouterProvider router={router} />
          </FrameworkContext.Provider>,
        );

        fireEvent[event](container.firstChild);
        act(() => {
          jest.runAllTimers();
        });

        let dataHref = container.ownerDocument
          .querySelector('link[rel="prefetch"][as="fetch"]')
          ?.getAttribute("href");
        expect(dataHref).toBe("/idk.data");
        let moduleHref = container.ownerDocument
          .querySelector('link[rel="modulepreload"]')
          ?.getAttribute("href");
        expect(moduleHref).toBe("idk.js");
        unmount();
      });

      it(`prefetches page links and calls explicit handler on ${event}`, () => {
        let router;
        let ranHandler = false;
        let eventHandler = `on${event[0].toUpperCase()}${event.slice(1)}`;
        act(() => {
          router = createMemoryRouter([
            {
              id: "root",
              path: "/",
              element: (
                <Component
                  {...({
                    to: "idk",
                    prefetch: "intent",
                    [eventHandler]: () => {
                      ranHandler = true;
                    },
                  } as any)}
                />
              ),
            },
            {
              id: "idk",
              path: "idk",
              loader: () => true,
              element: <h1>idk</h1>,
            },
          ]);
        });

        let { container, unmount } = render(
          <FrameworkContext.Provider value={context}>
            <RouterProvider router={router} />
          </FrameworkContext.Provider>,
        );

        fireEvent[event](container.firstChild);
        act(() => {
          jest.runAllTimers();
        });

        expect(
          container.ownerDocument.querySelector("link[rel=prefetch]"),
        ).toBeTruthy();
        expect(ranHandler).toBe(true);
        unmount();
      });
    });
  });
}

describe("<Link />", () => {
  itPrefetchesPageLinks(Link);
});

describe("<NavLink />", () => {
  itPrefetchesPageLinks(NavLink);
});

describe("<ServerRouter>", () => {
  it("handles empty default export objects from the compiler", async () => {
    let staticHandlerContext = await createStaticHandler([{ path: "/" }]).query(
      new Request("http://localhost/"),
    );

    invariant(
      !(staticHandlerContext instanceof Response),
      "Expected a context",
    );

    let context = mockEntryContext({
      manifest: {
        routes: {
          root: {
            hasLoader: false,
            hasAction: false,
            hasErrorBoundary: false,
            id: "root",
            module: "root.js",
            path: "/",
          },
          empty: {
            hasLoader: false,
            hasAction: false,
            hasErrorBoundary: false,
            id: "empty",
            module: "empty.js",
            index: true,
            parentId: "root",
          },
        },
        entry: { imports: [], module: "" },
        url: "",
        version: "",
      },
      routeModules: {
        root: {
          default: () => {
            return (
              <>
                <h1>Root</h1>
                <Outlet />
              </>
            );
          },
        },
        empty: { default: {} },
      },
    });

    jest.spyOn(console, "warn").mockImplementation(() => {});
    jest.spyOn(console, "error");

    let { container } = render(
      <ServerRouter context={context} url="http://localhost/" />,
    );

    expect(console.warn).toHaveBeenCalledWith(
      'Matched leaf route at location "/" does not have an element or Component. This means it will render an <Outlet /> with a null value by default resulting in an "empty" page.',
    );
    expect(console.error).not.toHaveBeenCalled();
    expect(container.innerHTML).toMatch("<h1>Root</h1>");
  });
});

describe("<HydratedRouter>", () => {
  it("handles empty default export objects from the compiler", async () => {
    let context = mockFrameworkContext({
      manifest: {
        routes: {
          root: {
            hasLoader: false,
            hasAction: false,
            hasErrorBoundary: false,
            id: "root",
            module: "root.js",
            path: "/",
          },
          empty: {
            hasLoader: false,
            hasAction: false,
            hasErrorBoundary: false,
            id: "empty",
            module: "empty.js",
            index: true,
            parentId: "root",
          },
        },
        entry: { imports: [], module: "" },
        url: "",
        version: "",
      },
      routeModules: {
        root: {
          default: () => {
            return (
              <>
                <h1>Root</h1>
                <Outlet />
              </>
            );
          },
        },
        empty: { default: {} },
      },
    });
    window.__reactRouterContext = context;
    window.__reactRouterRouteModules = context.routeModules;
    window.__reactRouterManifest = context.manifest;
    window.__reactRouterContext!.stream = new ReadableStream({
      start(controller) {
        window.__reactRouterContext!.streamController = controller;
      },
    }).pipeThrough(new TextEncoderStream());
    window.__reactRouterContext!.streamController.enqueue(
      // @ts-expect-error
      '[{"1":2,"6":4,"7":4},"loaderData",{"3":4,"5":4},"root",null,"empty","actionData","errors"]\n',
    );
    window.__reactRouterContext!.streamController.close();

    jest.spyOn(console, "error");
    jest.spyOn(console, "warn").mockImplementation(() => {});

    let container;
    await act(() => {
      container = render(<HydratedRouter />).container;
    });

    expect(console.error).not.toHaveBeenCalled();
    expect(container.innerHTML).toMatch("<h1>Root</h1>");
  });
});

describe("<Links />", () => {
  it("renders critical css with nonce", () => {
    let context = mockFrameworkContext({
      criticalCss: ".critical { color: red; }",
    });

    let { container } = render(
      <DataRouterStateContext.Provider
        value={{ matches: [], errors: null } as any}
      >
        <FrameworkContext.Provider value={context}>
          <Links nonce="test-nonce" />
        </FrameworkContext.Provider>
      </DataRouterStateContext.Provider>,
    );

    let style = container.querySelector("style");
    expect(style).toHaveAttribute("data-react-router-critical-css");
    expect(style).toHaveAttribute("nonce", "test-nonce");
    expect(style).toHaveTextContent(".critical { color: red; }");
  });

  it("renders critical css object with nonce", () => {
    let context = mockFrameworkContext({
      criticalCss: { rel: "stylesheet", href: "/critical.css" },
    });

    let { container } = render(
      <DataRouterStateContext.Provider
        value={{ matches: [], errors: null } as any}
      >
        <FrameworkContext.Provider value={context}>
          <Links nonce="test-nonce" />
        </FrameworkContext.Provider>
      </DataRouterStateContext.Provider>,
    );

    let link = container.querySelector("link[rel='stylesheet']");
    expect(link).toHaveAttribute("data-react-router-critical-css");
    expect(link).toHaveAttribute("href", "/critical.css");
    expect(link).toHaveAttribute("nonce", "test-nonce");
  });

  it("propagates nonce to route links", () => {
    let context = mockFrameworkContext({
      routeModules: {
        root: {
          default: () => null,
          links: () => [{ rel: "stylesheet", href: "/style.css" }],
        },
      },
      manifest: {
        routes: {
          root: {
            id: "root",
            module: "root.js",
            hasLoader: false,
            hasAction: false,
            hasErrorBoundary: false,
            hasClientAction: false,
            hasClientLoader: false,
            hasClientMiddleware: false,
            clientActionModule: undefined,
            clientLoaderModule: undefined,
            clientMiddlewareModule: undefined,
            hydrateFallbackModule: undefined,
          },
        },
        entry: { imports: [], module: "" },
        url: "",
        version: "",
      },
    });

    let { container } = render(
      <DataRouterStateContext.Provider
        value={
          {
            matches: [
              {
                route: { id: "root" },
              },
            ],
          } as any
        }
      >
        <FrameworkContext.Provider value={context}>
          <Links nonce="test-nonce" />
        </FrameworkContext.Provider>
      </DataRouterStateContext.Provider>,
    );

    let link = container.querySelector("link[href='/style.css']");
    expect(link).toHaveAttribute("nonce", "test-nonce");
  });
});

describe("<Scripts />", () => {
  it("propagates nonce to all generated scripts", () => {
    let context = mockFrameworkContext({});

    let { container } = render(
      <DataRouterContext.Provider value={{ router: { routes: [] } } as any}>
        <DataRouterStateContext.Provider value={{ matches: [] } as any}>
          <FrameworkContext.Provider value={context}>
            <Scripts nonce="test-nonce" />
          </FrameworkContext.Provider>
        </DataRouterStateContext.Provider>
      </DataRouterContext.Provider>,
    );

    let scripts = container.querySelectorAll("script");
    expect(scripts.length).toBeGreaterThan(0);
    scripts.forEach((script) => {
      expect(script).toHaveAttribute("nonce", "test-nonce");
    });
  });

  it("respects suppressHydrationWarning and other props", () => {
    let context = mockFrameworkContext({});

    let { container } = render(
      <DataRouterContext.Provider value={{ router: { routes: [] } } as any}>
        <DataRouterStateContext.Provider value={{ matches: [] } as any}>
          <FrameworkContext.Provider value={context}>
            <Scripts crossOrigin="anonymous" />
          </FrameworkContext.Provider>
        </DataRouterStateContext.Provider>
      </DataRouterContext.Provider>,
    );

    // Check context script (first one)
    let scripts = container.querySelectorAll("script");
    // Check modulepreload links for crossOrigin
    let links = container.querySelectorAll("link[rel='modulepreload']");
    links.forEach((link) => {
      expect(link).toHaveAttribute("crossorigin", "anonymous");
    });
  });
});

describe("usePrefetchBehavior", () => {
  function TestComponent({
    prefetch,
  }: {
    prefetch: "intent" | "render" | "none" | "viewport";
  }) {
    let [shouldPrefetch, ref] = usePrefetchBehavior(prefetch, {});
    return (
      <a ref={ref} data-prefetch={shouldPrefetch}>
        Link
      </a>
    );
  }

  it("handles prefetch='render'", () => {
    let context = mockFrameworkContext({});

    // Wrap in FrameworkContext because usePrefetchBehavior checks for it
    let { container } = render(
      <FrameworkContext.Provider value={context}>
        <TestComponent prefetch="render" />
      </FrameworkContext.Provider>,
    );

    expect(container.firstChild).toHaveAttribute("data-prefetch", "true");
  });

  it("handles prefetch='viewport'", () => {
    let context = mockFrameworkContext({});
    let observeCallback: IntersectionObserverCallback;
    let observeMock = jest.fn();
    let disconnectMock = jest.fn();

    window.IntersectionObserver = class {
      constructor(cb: IntersectionObserverCallback) {
        observeCallback = cb;
      }
      observe = observeMock;
      unobserve = jest.fn();
      disconnect = disconnectMock;
      takeRecords = () => [];
      root = null;
      rootMargin = "";
      thresholds = [];
    };

    let { container } = render(
      <FrameworkContext.Provider value={context}>
        <TestComponent prefetch="viewport" />
      </FrameworkContext.Provider>,
    );

    // Initial state
    expect(container.firstChild).toHaveAttribute("data-prefetch", "false");
    expect(observeMock).toHaveBeenCalled();

    // Trigger intersection
    act(() => {
      observeCallback(
        [{ isIntersecting: true } as IntersectionObserverEntry],
        new IntersectionObserver(() => {}),
      );
    });

    expect(container.firstChild).toHaveAttribute("data-prefetch", "true");
  });
});
