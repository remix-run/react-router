import { act, fireEvent, render, screen } from "@testing-library/react";
import * as React from "react";

import type { DataRouter } from "../../../index";
import {
  Link,
  Outlet,
  UNSAFE_DataRouterContext as DataRouterContext,
  UNSAFE_withComponentProps as withComponentProps,
} from "../../../index";
import { HydratedRouter } from "../../../lib/dom-export/hydrated-router";
import "@testing-library/jest-dom";
import { mockFrameworkContext } from "../../utils/framework";

describe("<HydratedRouter>", () => {
  it("does not re-render the previous route after a navigation completes", async () => {
    let router: DataRouter | undefined;
    let staleHomeRenders = 0;

    function Root() {
      router = React.useContext(DataRouterContext)?.router;
      return <Outlet />;
    }

    function Home() {
      // Count renders of the route being left once the router has already
      // completed the navigation away from it
      if (router && router.state.location.pathname !== "/") {
        staleHomeRenders++;
      }
      return <Link to="/next">Link to next</Link>;
    }

    function Next() {
      return <h1>Next</h1>;
    }

    let routeDefaults = {
      hasLoader: false,
      hasClientLoader: false,
      hasAction: false,
      hasClientAction: false,
      hasClientMiddleware: false,
      hasErrorBoundary: false,
    };
    let context = mockFrameworkContext({
      manifest: {
        routes: {
          root: { ...routeDefaults, id: "root", module: "root.js", path: "" },
          home: {
            ...routeDefaults,
            id: "home",
            module: "home.js",
            index: true,
            parentId: "root",
          },
          next: {
            ...routeDefaults,
            id: "next",
            module: "next.js",
            path: "next",
            parentId: "root",
          },
        },
        entry: { imports: [], module: "" },
        url: "",
        version: "",
      },
      routeModules: {
        root: { default: Root },
        // The Vite plugin wraps route module default exports like this
        home: { default: withComponentProps(Home) },
        next: { default: withComponentProps(Next) },
      },
      routeDiscovery: { mode: "initial" },
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
      '[{"1":2,"6":4,"7":4},"loaderData",{"3":4,"5":4},"root",null,"home","actionData","errors"]\n',
    );
    window.__reactRouterContext!.streamController.close();

    await act(() => {
      render(<HydratedRouter />);
    });
    expect(screen.getByText("Link to next")).toBeInTheDocument();

    await act(async () => {
      fireEvent.click(screen.getByText("Link to next"));
    });

    expect(screen.getByText("Next")).toBeInTheDocument();
    expect(router!.state.location.pathname).toBe("/next");
    expect(staleHomeRenders).toBe(0);
  });
});
