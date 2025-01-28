import { createStaticHandler } from "react-router";
import { act, fireEvent, render } from "@testing-library/react";
import * as React from "react";

import {
  createMemoryRouter,
  Link,
  NavLink,
  Outlet,
  RouterProvider,
} from "../../../index";
import { HydratedRouter } from "../../../lib/dom-export/hydrated-router";
import { FrameworkContext } from "../../../lib/dom/ssr/components";
import invariant from "../../../lib/dom/ssr/invariant";
import { ServerRouter } from "../../../lib/dom/ssr/server";
import "@testing-library/jest-dom/extend-expect";

const setIntentEvents = ["focus", "mouseEnter", "touchStart"] as const;
type PrefetchEventHandlerProps = {
  [Property in `on${Capitalize<(typeof setIntentEvents)[number]>}`]?: Function;
};

function itPrefetchesPageLinks<
  Props extends { to: any; prefetch?: any } & PrefetchEventHandlerProps
>(Component: React.ComponentType<Props>) {
  describe('prefetch="intent"', () => {
    let context = {
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
      future: {},
    };

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
          </FrameworkContext.Provider>
        );

        fireEvent[event](container.firstChild);
        act(() => {
          jest.runAllTimers();
        });

        let dataHref = container
          .querySelector('link[rel="prefetch"][as="fetch"]')
          ?.getAttribute("href");
        expect(dataHref).toBe("/idk.data");
        let moduleHref = container
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
          </FrameworkContext.Provider>
        );

        fireEvent[event](container.firstChild);
        act(() => {
          jest.runAllTimers();
        });

        expect(container.querySelector("link[rel=prefetch]")).toBeTruthy();
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
      new Request("http://localhost/")
    );

    invariant(
      !(staticHandlerContext instanceof Response),
      "Expected a context"
    );

    let context = {
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
      staticHandlerContext,
      future: {},
    };

    jest.spyOn(console, "warn").mockImplementation(() => {});
    jest.spyOn(console, "error");

    let { container } = render(
      <ServerRouter context={context} url="http://localhost/" />
    );

    expect(console.warn).toHaveBeenCalledWith(
      'Matched leaf route at location "/" does not have an element or Component. This means it will render an <Outlet /> with a null value by default resulting in an "empty" page.'
    );
    expect(console.error).not.toHaveBeenCalled();
    expect(container.innerHTML).toMatch("<h1>Root</h1>");
  });
});

describe("<HydratedRouter>", () => {
  it("handles empty default export objects from the compiler", async () => {
    window.__reactRouterContext = {
      url: "/",
      future: {},
    };
    window.__reactRouterRouteModules = {
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
    };
    window.__reactRouterManifest = {
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
    };
    window.__reactRouterContext!.stream = new ReadableStream({
      start(controller) {
        window.__reactRouterContext!.streamController = controller;
      },
    }).pipeThrough(new TextEncoderStream());
    window.__reactRouterContext!.streamController.enqueue(
      // ts-expect-error
      '[{"1":2,"6":4,"7":4},"loaderData",{"3":4,"5":4},"root",null,"empty","actionData","errors"]\n'
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
