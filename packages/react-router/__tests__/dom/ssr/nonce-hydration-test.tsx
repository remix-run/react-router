import * as React from "react";
import { act } from "@testing-library/react";
import { hydrateRoot } from "react-dom/client";
import { renderToString } from "react-dom/server.node";

import { createMemoryRouter, Links, RouterProvider } from "../../../index";
import { RSCRouterContext } from "../../../lib/context";
import { FrameworkContext } from "../../../lib/dom/ssr/components";
import { RemixRootDefaultErrorBoundary } from "../../../lib/dom/ssr/errorBoundaries";
import { RemixRootDefaultHydrateFallback } from "../../../lib/dom/ssr/fallback";
import {
  ENABLE_DEV_WARNINGS,
  ErrorResponseImpl,
} from "../../../lib/router/utils";
import { mockFrameworkContext } from "../../utils/framework";

let routeError = new ErrorResponseImpl(404, "Not Found", null);

it.each([
  {
    name: "page descriptor data and module links",
    element: <Links />,
    selector: "link",
    targetCount: 2,
    links: () => [{ page: "/other" }],
  },
  {
    name: "RSC page descriptor data link",
    element: <Links />,
    selector: "link",
    rsc: true,
    links: () => [{ page: "/other" }],
  },
  {
    name: "inline critical CSS",
    element: <Links />,
    criticalCss: ".critical { color: red; }",
    selector: "style[data-react-router-critical-css]",
  },
  {
    name: "external critical CSS",
    element: <Links />,
    criticalCss: { href: "/critical.css" },
    selector: 'link[href="/critical.css"]',
  },
  {
    name: "route stylesheet",
    element: <Links />,
    selector: 'link[href="/route.css"]',
    links: () => [{ rel: "stylesheet", href: "/route.css" }],
  },
  {
    name: "default error boundary developer script",
    element: <RemixRootDefaultErrorBoundary error={routeError} />,
    selector: "script",
  },
  {
    name: "default hydrate fallback developer script",
    element: <RemixRootDefaultHydrateFallback />,
    selector: "script",
  },
])(
  "preserves the server nonce without hydration warnings for $name",
  async ({
    element,
    criticalCss,
    selector,
    links,
    rsc = false,
    targetCount = 1,
  }) => {
    // The default error/fallback scripts must actually render in these tests.
    expect(ENABLE_DEV_WARNINGS).toBe(true);
    let context = mockFrameworkContext({
      criticalCss,
      routeModules: {
        root: {
          default: () => null,
          Layout: ({ children }) => <>{children}</>,
          links,
        },
        other: { default: () => null },
      },
    });
    context.manifest.routes.other = {
      ...context.manifest.routes.root,
      id: "other",
      parentId: "root",
      path: "other",
      module: "other.js",
      hasLoader: true,
    };
    let router = createMemoryRouter([
      {
        id: "root",
        path: "/",
        element,
        children: [{ id: "other", path: "other" }],
      },
    ]);
    function getTree(nonce?: string) {
      return (
        <RSCRouterContext.Provider value={rsc}>
          <FrameworkContext.Provider value={{ ...context, nonce }}>
            <RouterProvider router={router} />
          </FrameworkContext.Provider>
        </RSCRouterContext.Provider>
      );
    }

    let consoleError = jest
      .spyOn(console, "error")
      .mockImplementation(() => {});
    let container = document.createElement("div");
    document.body.appendChild(container);
    let root: ReturnType<typeof hydrateRoot> | undefined;

    try {
      container.innerHTML = renderToString(getTree("server-nonce"));
      let targets = Array.from(
        container.querySelectorAll<HTMLElement>(selector),
      );
      expect(targets).toHaveLength(targetCount);
      expect(targets.map((target) => target.nonce)).toEqual(
        Array(targetCount).fill("server-nonce"),
      );
      await act(async () => {
        root = hydrateRoot(container, getTree());
      });

      // The error boundary logs the supplied error on each render.
      expect(
        consoleError.mock.calls.filter(([error]) => error !== routeError),
      ).toEqual([]);
      let hydratedTargets = Array.from(container.querySelectorAll(selector));
      expect(hydratedTargets).toHaveLength(targetCount);
      expect(
        hydratedTargets.every((target, index) => target === targets[index]),
      ).toBe(true);
      expect(targets.map((target) => target.nonce)).toEqual(
        Array(targetCount).fill("server-nonce"),
      );
    } finally {
      await act(async () => root?.unmount());
      container.remove();
      router.dispose();
      consoleError.mockRestore();
    }
  },
);
