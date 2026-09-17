import { render } from "@testing-library/react";
import * as React from "react";

import { Links, Outlet, createRoutesStub } from "../../../index";
import { getKeyedPrefetchLinks } from "../../../lib/dom/ssr/links";
import type { AssetsManifest } from "../../../lib/dom/ssr/entry";
import type { RouteModules } from "../../../lib/dom/ssr/routeModules";
import type { DataRouteMatch } from "../../../lib/router/utils";

describe("<Links>", () => {
  describe("crossOrigin", () => {
    it("renders stylesheet links with crossOrigin attribute when provided", () => {
      let RoutesStub = createRoutesStub([
        {
          id: "root",
          path: "/",
          links: () => [{ rel: "stylesheet", href: "/assets/styles.css" }],
          Component() {
            return (
              <>
                <Links crossOrigin="anonymous" />
                <Outlet />
              </>
            );
          },
          children: [
            { id: "index", index: true, Component: () => <div>Index</div> },
          ],
        },
      ]);

      let { container } = render(<RoutesStub />);

      let stylesheetLink = container.ownerDocument.querySelector(
        'link[rel="stylesheet"][href="/assets/styles.css"]',
      );
      expect(stylesheetLink).toBeTruthy();
      expect(stylesheetLink?.getAttribute("crossorigin")).toBe("anonymous");
    });

    it("renders stylesheet links without crossOrigin when not provided", () => {
      let RoutesStub = createRoutesStub([
        {
          id: "root",
          path: "/",
          links: () => [{ rel: "stylesheet", href: "/assets/styles.css" }],
          Component() {
            return (
              <>
                <Links />
                <Outlet />
              </>
            );
          },
          children: [
            { id: "index", index: true, Component: () => <div>Index</div> },
          ],
        },
      ]);

      let { container } = render(<RoutesStub />);

      let stylesheetLink = container.ownerDocument.querySelector(
        'link[rel="stylesheet"][href="/assets/styles.css"]',
      );
      expect(stylesheetLink).toBeTruthy();
      expect(stylesheetLink?.hasAttribute("crossorigin")).toBe(false);
    });

    it("link descriptor crossOrigin overrides the component prop", () => {
      let RoutesStub = createRoutesStub([
        {
          id: "root",
          path: "/",
          links: () => [
            {
              rel: "stylesheet",
              href: "/assets/styles.css",
              crossOrigin: "use-credentials",
            },
          ],
          Component() {
            return (
              <>
                <Links crossOrigin="anonymous" />
                <Outlet />
              </>
            );
          },
          children: [
            { id: "index", index: true, Component: () => <div>Index</div> },
          ],
        },
      ]);

      let { container } = render(<RoutesStub />);

      let stylesheetLink = container.ownerDocument.querySelector(
        'link[rel="stylesheet"][href="/assets/styles.css"]',
      );
      expect(stylesheetLink).toBeTruthy();
      expect(stylesheetLink?.getAttribute("crossorigin")).toBe(
        "use-credentials",
      );
    });

    it("link descriptor crossOrigin works without the component prop", () => {
      let RoutesStub = createRoutesStub([
        {
          id: "root",
          path: "/",
          links: () => [
            {
              rel: "stylesheet",
              href: "/assets/styles.css",
              crossOrigin: "anonymous",
            },
          ],
          Component() {
            return (
              <>
                <Links />
                <Outlet />
              </>
            );
          },
          children: [
            { id: "index", index: true, Component: () => <div>Index</div> },
          ],
        },
      ]);

      let { container } = render(<RoutesStub />);

      let stylesheetLink = container.ownerDocument.querySelector(
        'link[rel="stylesheet"][href="/assets/styles.css"]',
      );
      expect(stylesheetLink).toBeTruthy();
      expect(stylesheetLink?.getAttribute("crossorigin")).toBe("anonymous");
    });

    it("link descriptor crossOrigin undefined does not override the component prop", () => {
      let RoutesStub = createRoutesStub([
        {
          id: "root",
          path: "/",
          links: () => [
            {
              rel: "stylesheet",
              href: "/assets/styles.css",
              crossOrigin: undefined,
            },
          ],
          Component() {
            return (
              <>
                <Links crossOrigin="anonymous" />
                <Outlet />
              </>
            );
          },
          children: [
            { id: "index", index: true, Component: () => <div>Index</div> },
          ],
        },
      ]);

      let { container } = render(<RoutesStub />);

      let stylesheetLink = container.ownerDocument.querySelector(
        'link[rel="stylesheet"][href="/assets/styles.css"]',
      );
      expect(stylesheetLink).toBeTruthy();
      expect(stylesheetLink?.getAttribute("crossorigin")).toBe("anonymous");
    });
  });
});

describe("getKeyedPrefetchLinks", () => {
  let matches: DataRouteMatch[];
  let manifest: AssetsManifest;

  beforeEach(() => {
    matches = [
      {
        params: {},
        pathname: "/idk",
        pathnameBase: "/idk",
        route: { id: "idk", path: "idk" },
      },
    ];
    manifest = {
      routes: {
        idk: {
          id: "idk",
          module: "idk.js",
          hasAction: false,
          hasLoader: false,
          hasClientAction: false,
          hasClientLoader: false,
          hasClientMiddleware: false,
          hasErrorBoundary: false,
          clientActionModule: undefined,
          clientLoaderModule: undefined,
          clientMiddlewareModule: undefined,
          hydrateFallbackModule: undefined,
        },
      },
      entry: { imports: [], module: "" },
      url: "",
      version: "",
    };
  });

  it("does not throw when the route module cache has an empty slot", async () => {
    // `idk in routeModules` is true, but the value is undefined — the same
    // shape loadRouteModule returns without falling through to import().
    let routeModules: RouteModules = { idk: undefined };

    await expect(
      getKeyedPrefetchLinks(matches, manifest, routeModules),
    ).resolves.toEqual([]);
  });

  it("returns stylesheet links as prefetch descriptors when the module is loaded", async () => {
    let routeModules: RouteModules = {
      idk: {
        default: () => null,
        links: () => [{ rel: "stylesheet", href: "/foo.css" }],
      },
    };

    await expect(
      getKeyedPrefetchLinks(matches, manifest, routeModules),
    ).resolves.toEqual([
      {
        key: JSON.stringify({
          as: "style",
          href: "/foo.css",
          rel: "prefetch",
        }),
        link: { rel: "prefetch", as: "style", href: "/foo.css" },
      },
    ]);
  });
});
