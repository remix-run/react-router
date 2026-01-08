import { render } from "@testing-library/react";
import * as React from "react";

import { Links, Outlet, createRoutesStub } from "../../../index";

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

    it("link descriptor can remove crossOrigin by setting it to null", () => {
      let RoutesStub = createRoutesStub([
        {
          id: "root",
          path: "/",
          links: () => [
            {
              rel: "stylesheet",
              href: "/assets/styles.css",
              crossOrigin: null,
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
      expect(stylesheetLink?.hasAttribute("crossorigin")).toBe(false);
    });
  });
});
