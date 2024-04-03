import * as React from "react";
import {
  createMemoryRouter,
  RouterProvider,
  Outlet,
  redirect,
} from "react-router";
import { render, screen } from "@testing-library/react";

import { RemixContext, Scripts } from "../../ssr/components";
import { ScrollRestoration } from "../../ssr/scroll-restoration";
import type { RemixContextObject } from "../../ssr/entry";

import "@testing-library/jest-dom/extend-expect";

describe("<ScrollRestoration />", () => {
  let scrollTo = window.scrollTo;
  beforeAll(() => {
    window.scrollTo = (options) => {
      window.scrollY = options.left;
    };
  });

  afterEach(() => {
    jest.resetAllMocks();
  });
  afterAll(() => {
    window.scrollTo = scrollTo;
  });

  let context: RemixContextObject = {
    future: {
      v3_fetcherPersist: false,
      v3_relativeSplatPath: false,
      unstable_singleFetch: false,
    },
    routeModules: { root: { default: () => null } },
    manifest: {
      routes: {
        root: {
          hasLoader: false,
          hasAction: false,
          hasErrorBoundary: false,
          id: "root",
          module: "root.js",
        },
      },
      entry: { imports: [], module: "" },
      url: "",
      version: "",
    },
  };

  it("should render a <script> tag", () => {
    let router = createMemoryRouter([
      {
        id: "root",
        path: "/",
        element: (
          <>
            <Outlet />
            <ScrollRestoration data-testid="scroll-script" />
            <Scripts />
          </>
        ),
      },
    ]);

    render(
      <RemixContext.Provider value={context}>
        <RouterProvider router={router} />
      </RemixContext.Provider>
    );
    let script = screen.getByTestId("scroll-script");
    expect(script instanceof HTMLScriptElement).toBe(true);
  });

  it("should pass props to <script>", () => {
    let router = createMemoryRouter([
      {
        id: "root",
        path: "/",
        element: (
          <>
            <Outlet />
            <ScrollRestoration
              data-testid="scroll-script"
              nonce="hello"
              crossOrigin="anonymous"
            />
            <Scripts />
          </>
        ),
      },
    ]);
    render(
      <RemixContext.Provider value={context}>
        <RouterProvider router={router} />
      </RemixContext.Provider>
    );
    let script = screen.getByTestId("scroll-script");
    expect(script).toHaveAttribute("nonce", "hello");
    expect(script).toHaveAttribute("crossorigin", "anonymous");
  });

  it("should restore scroll position", () => {
    let scrollToMock = jest.spyOn(window, "scrollTo");
    let router = createMemoryRouter([
      {
        id: "root",
        path: "/",
        element: (
          <>
            <Outlet />
            <ScrollRestoration />
            <Scripts />
          </>
        ),
      },
    ]);
    router.state.restoreScrollPosition = 20;
    render(
      <RemixContext.Provider value={context}>
        <RouterProvider router={router} />
      </RemixContext.Provider>
    );

    expect(scrollToMock).toHaveBeenCalledWith(0, 20);
  });

  it("should restore scroll position on navigation", () => {
    let scrollToMock = jest.spyOn(window, "scrollTo");
    let router = createMemoryRouter([
      {
        id: "root",
        path: "/",
        element: (
          <>
            <Outlet />
            <ScrollRestoration />
            <Scripts />
          </>
        ),
      },
    ]);
    render(
      <RemixContext.Provider value={context}>
        <RouterProvider router={router} />
      </RemixContext.Provider>
    );
    // Always called when using <ScrollRestoration />
    expect(scrollToMock).toHaveBeenCalledWith(0, 0);
    // Mock user scroll
    window.scrollTo(0, 20);
    // Mock navigation
    redirect("/otherplace");
    // Mock return to original page where navigation had happened
    expect(scrollToMock).toHaveBeenCalledWith(0, 0);
    // Mock return to original page where navigation had happened
    redirect("/");
    // Ensure that scroll position is restored
    expect(scrollToMock).toHaveBeenCalledWith(0, 20);
  });
});
