import * as React from "react";
import * as ReactDOM from "react-dom/client";
import { renderToString } from "react-dom/server.node";
import { act } from "@testing-library/react";
import type { Blocker, StaticHandlerContext } from "../../index";
import {
  createMemoryRouter,
  createStaticHandler,
  createStaticRouter,
  Outlet,
  RouterProvider,
  StaticRouterProvider,
  useBlocker,
  useLocation,
  useSearchParams,
} from "../../index";

describe("useBlocker committed predicate", () => {
  it("uses the reused layout's committed predicate for destination mount navigation", async () => {
    let node = document.createElement("div");
    document.body.appendChild(node);
    let root = ReactDOM.createRoot(node);
    let blocker: Blocker;
    let predicateLocations: string[] = [];

    function Layout() {
      let location = useLocation();
      blocker = useBlocker(() => {
        predicateLocations.push(location.pathname);
        return location.pathname === "/source";
      });
      return (
        <>
          <p>{blocker.state}</p>
          {blocker.state === "blocked" ? (
            <button onClick={blocker.proceed}>Leave source</button>
          ) : null}
          <Outlet />
        </>
      );
    }

    function Destination() {
      let [, setSearchParams] = useSearchParams();
      React.useEffect(() => {
        setSearchParams({ mounted: "yes" }, { replace: true });
      }, [setSearchParams]);
      return <h1>Destination</h1>;
    }

    let router = createMemoryRouter(
      [
        {
          Component: Layout,
          children: [
            { path: "source", element: <h1>Source</h1> },
            { path: "destination", Component: Destination },
          ],
        },
      ],
      {
        initialEntries: ["/source"],
      },
    );

    try {
      act(() => root.render(<RouterProvider router={router} />));
      await act(() => router.navigate("/destination"));
      expect(blocker!.state).toBe("blocked");
      expect(node.querySelector("h1")?.textContent).toBe("Source");

      await act(async () => node.querySelector("button")!.click());
      expect(node.querySelector("h1")?.textContent).toBe("Destination");
      expect(router.state.location.search).toBe("?mounted=yes");
      expect(blocker!.state).toBe("unblocked");
      expect(node.querySelector("button")).toBeNull();
      expect(predicateLocations.at(-1)).toBe("/destination");
    } finally {
      act(() => root.unmount());
      router.dispose();
      node.remove();
    }
  });

  it("renders an idle blocker on the server without registering a guard", async () => {
    let blocker: Blocker;
    function Guard() {
      blocker = useBlocker(true);
      return <p>{blocker.state}</p>;
    }
    let routes = [{ path: "/", Component: Guard }];
    let { query } = createStaticHandler(routes);
    let context = (await query(
      new Request("http://localhost/"),
    )) as StaticHandlerContext;
    let router = createStaticRouter(routes, context);
    let register = jest.spyOn(router, "getBlocker");
    let warn = jest.spyOn(console, "warn").mockImplementation(() => {});
    try {
      let html = renderToString(
        <StaticRouterProvider router={router} context={context} />,
      );
      expect(html).toContain("<p>unblocked</p>");
      expect(blocker!).toEqual({
        state: "unblocked",
        location: undefined,
        proceed: undefined,
        reset: undefined,
      });
      expect(register).not.toHaveBeenCalled();
      expect(router.state.blockers.size).toBe(0);
      expect(warn).not.toHaveBeenCalled();
    } finally {
      register.mockRestore();
      warn.mockRestore();
    }
  });
});
