import * as React from "react";
import * as TestRenderer from "react-test-renderer";
import {
  createMemoryRouter,
  Outlet,
  Route,
  RouterProvider,
  Routes,
  UNSAFE_DataRouterDataContext as DataRouterDataContext,
  UNSAFE_DataRouterStateContext as DataRouterStateContext,
  useFetcher,
  useLoaderData,
  useLocation,
  useMatches,
  useNavigate,
  useNavigation,
} from "react-router";
import { IsDataRouteContext, RouteIdContext } from "../lib/context";
import { createDeferred } from "./router/utils/utils";

describe.each([
  { label: "default transitions", useTransitions: undefined },
  { label: "optimistic transitions", useTransitions: true },
])("data router contexts ($label)", ({ useTransitions }) => {
  it("does not re-render when the route ID remains unchanged", async () => {
    let parentRenders = 0;
    let childRenders = 0;

    function Parent() {
      parentRenders++;
      expect(React.useContext(RouteIdContext)).toBe("parent");
      return <Outlet />;
    }

    function Child() {
      childRenders++;
      expect(React.useContext(RouteIdContext)).toBe("child");
      useLocation();
      return null;
    }

    let router = createMemoryRouter(
      [
        {
          id: "parent",
          path: "/",
          Component: Parent,
          children: [{ id: "child", index: true, Component: Child }],
        },
      ],
      { initialEntries: ["/?value=before"] },
    );

    let renderer: TestRenderer.ReactTestRenderer;
    await TestRenderer.act(async () => {
      renderer = TestRenderer.create(
        <RouterProvider router={router} useTransitions={useTransitions} />,
      );
    });

    expect(parentRenders).toBe(1);
    expect(childRenders).toBe(1);

    await TestRenderer.act(async () => {
      await router.navigate("/?value=after");
    });

    expect(parentRenders).toBe(1);
    expect(childRenders).toBe(2);

    TestRenderer.act(() => renderer.unmount());
    router.dispose();
  });

  it("does not re-render when loader data remains unchanged", async () => {
    let parentRenders = 0;
    let childRenders = 0;
    let loaderCalls = 0;

    function Parent() {
      parentRenders++;
      expect(useLoaderData()).toEqual({ message: "parent data" });
      return (
        <>
          <ContextObserver />
          <Outlet />
        </>
      );
    }

    function ContextObserver() {
      let state = React.useContext(DataRouterStateContext);
      let data = React.useContext(DataRouterDataContext);
      expect(state).not.toHaveProperty("loaderData");
      expect(state).not.toHaveProperty("actionData");
      expect(state).not.toHaveProperty("errors");
      expect(data?.loaderData.parent).toEqual({ message: "parent data" });
      return null;
    }

    function Child() {
      childRenders++;
      useLocation();
      return null;
    }

    let router = createMemoryRouter(
      [
        {
          id: "parent",
          path: "/",
          loader() {
            loaderCalls++;
            return { message: "parent data" };
          },
          shouldRevalidate: () => false,
          HydrateFallback: () => null,
          Component: Parent,
          children: [{ id: "child", index: true, Component: Child }],
        },
      ],
      { initialEntries: ["/?value=before"] },
    );

    let renderer: TestRenderer.ReactTestRenderer;
    await TestRenderer.act(async () => {
      renderer = TestRenderer.create(
        <RouterProvider router={router} useTransitions={useTransitions} />,
      );
    });

    expect(loaderCalls).toBe(1);
    expect(parentRenders).toBe(1);
    expect(childRenders).toBe(1);

    await TestRenderer.act(async () => {
      await router.navigate("/?value=after");
    });

    expect(loaderCalls).toBe(1);
    expect(parentRenders).toBe(1);
    expect(childRenders).toBe(2);

    TestRenderer.act(() => renderer.unmount());
    router.dispose();
  });

  it("does not re-render useFetcher consumers when the route ID remains unchanged", async () => {
    let fetcherRenders = 0;
    let locationRenders = 0;

    function Fetcher() {
      fetcherRenders++;
      useFetcher();
      return null;
    }

    function Location() {
      locationRenders++;
      useLocation();
      return null;
    }

    function Root() {
      return (
        <>
          <Fetcher />
          <Location />
        </>
      );
    }

    let router = createMemoryRouter(
      [{ id: "root", path: "/", Component: Root }],
      { initialEntries: ["/?value=before"] },
    );

    let renderer: TestRenderer.ReactTestRenderer;
    await TestRenderer.act(async () => {
      renderer = TestRenderer.create(
        <RouterProvider router={router} useTransitions={useTransitions} />,
      );
    });

    expect(fetcherRenders).toBe(1);
    expect(locationRenders).toBe(1);

    await TestRenderer.act(async () => {
      await router.navigate("/?value=after");
    });

    expect(fetcherRenders).toBe(1);
    expect(locationRenders).toBe(2);

    TestRenderer.act(() => renderer.unmount());
    router.dispose();
  });

  it("does not re-render useNavigate consumers when the route context changes", async () => {
    let navigateRenders = 0;
    let locationRenders = 0;

    function Navigate() {
      navigateRenders++;
      useNavigate();
      return null;
    }

    function Location() {
      locationRenders++;
      useLocation();
      return null;
    }

    function Root() {
      return (
        <>
          <Navigate />
          <Location />
        </>
      );
    }

    let router = createMemoryRouter(
      [{ id: "root", path: "/", Component: Root }],
      { initialEntries: ["/?value=before"] },
    );

    let renderer: TestRenderer.ReactTestRenderer;
    await TestRenderer.act(async () => {
      renderer = TestRenderer.create(
        <RouterProvider router={router} useTransitions={useTransitions} />,
      );
    });

    expect(navigateRenders).toBe(1);
    expect(locationRenders).toBe(1);

    await TestRenderer.act(async () => {
      await router.navigate("/?value=after");
    });

    expect(navigateRenders).toBe(1);
    expect(locationRenders).toBe(2);

    TestRenderer.act(() => renderer.unmount());
    router.dispose();
  });

  it("preserves route-relative navigation in nested declarative routes", async () => {
    let navigate!: ReturnType<typeof useNavigate>;

    function Child() {
      navigate = useNavigate();
      return null;
    }

    function Root() {
      return (
        <Routes>
          <Route path="parent" element={<Outlet />}>
            <Route path="child" Component={Child} />
          </Route>
        </Routes>
      );
    }

    let router = createMemoryRouter(
      [{ id: "root", path: "app/*", Component: Root }],
      { initialEntries: ["/app/parent/child"] },
    );

    let renderer: TestRenderer.ReactTestRenderer;
    await TestRenderer.act(async () => {
      renderer = TestRenderer.create(
        <RouterProvider router={router} useTransitions={useTransitions} />,
      );
    });

    await TestRenderer.act(async () => {
      await navigate("..");
    });

    expect(router.state.location.pathname).toBe("/app/parent");

    TestRenderer.act(() => renderer.unmount());
    router.dispose();
  });

  it("re-renders when a loader runs and returns the same reference", async () => {
    let loaderData = { message: "loader data" };
    let loaderCalls = 0;
    let renders = 0;

    function Component() {
      renders++;
      expect(useLoaderData()).toBe(loaderData);
      return null;
    }

    let router = createMemoryRouter(
      [
        {
          path: "/",
          loader() {
            loaderCalls++;
            return loaderData;
          },
          HydrateFallback: () => null,
          Component,
        },
      ],
      { initialEntries: ["/?value=before"] },
    );

    let renderer: TestRenderer.ReactTestRenderer;
    await TestRenderer.act(async () => {
      renderer = TestRenderer.create(
        <RouterProvider router={router} useTransitions={useTransitions} />,
      );
    });

    expect(loaderCalls).toBe(1);
    expect(renders).toBe(1);

    await TestRenderer.act(async () => {
      await router.navigate("/?value=after");
    });

    expect(loaderCalls).toBe(2);
    expect(renders).toBe(2);

    TestRenderer.act(() => renderer.unmount());
    router.dispose();
  });

  it("does not re-render useLocation consumers for pending navigation state", async () => {
    let loaderDfd = createDeferred();
    let renders: string[] = [];
    let stateContextRenders = 0;
    let navigationStates: string[] = [];

    let StateContextObserver = React.memo(function StateContextObserver() {
      let state = React.useContext(DataRouterStateContext);
      expect(state).not.toHaveProperty("navigation");
      expect(state).not.toHaveProperty("revalidation");
      stateContextRenders++;
      return null;
    });

    let NavigationObserver = React.memo(function NavigationObserver() {
      navigationStates.push(useNavigation().state);
      return null;
    });

    function Root() {
      renders.push(useLocation().pathname);
      return (
        <>
          <StateContextObserver />
          <NavigationObserver />
          <Outlet />
        </>
      );
    }

    let router = createMemoryRouter(
      [
        {
          path: "/",
          Component: Root,
          children: [
            { index: true, Component: () => null },
            {
              path: "next",
              loader: () => loaderDfd.promise,
              Component: () => null,
            },
          ],
        },
      ],
      { initialEntries: ["/"] },
    );

    let renderer: TestRenderer.ReactTestRenderer;
    await TestRenderer.act(async () => {
      renderer = TestRenderer.create(
        <RouterProvider router={router} useTransitions={useTransitions} />,
      );
    });

    let navigationPromise: Promise<void>;
    await TestRenderer.act(async () => {
      navigationPromise = router.navigate("/next");
    });

    expect(router.state.navigation.state).toBe("loading");
    expect(renders).toEqual(["/"]);
    expect(stateContextRenders).toBe(1);
    expect(navigationStates).toEqual(["idle", "loading"]);

    await TestRenderer.act(async () => {
      loaderDfd.resolve(null);
      await navigationPromise;
    });

    expect(renders).toEqual(["/", "/next"]);
    expect(stateContextRenders).toBe(2);
    expect(navigationStates).toEqual(["idle", "loading", "idle"]);

    TestRenderer.act(() => renderer.unmount());
    router.dispose();
  });

  it("does not re-render useMatches consumers for fetcher state changes", async () => {
    let loaderDfd = createDeferred();
    let matchesRenders = 0;
    let fetcherStates: string[] = [];
    let fetcher!: ReturnType<typeof useFetcher>;

    function Fetcher() {
      fetcher = useFetcher();
      fetcherStates.push(`${fetcher.state}:${fetcher.data}`);
      return null;
    }

    function Matches() {
      matchesRenders++;
      useMatches();
      return <Fetcher />;
    }

    let router = createMemoryRouter(
      [
        { path: "/", Component: Matches },
        {
          path: "/fetch",
          loader: () => loaderDfd.promise,
          Component: () => null,
        },
      ],
      { initialEntries: ["/"] },
    );

    let renderer: TestRenderer.ReactTestRenderer;
    await TestRenderer.act(async () => {
      renderer = TestRenderer.create(
        <RouterProvider router={router} useTransitions={useTransitions} />,
      );
    });

    expect(matchesRenders).toBe(1);
    expect(fetcherStates).toEqual(["idle:undefined"]);

    let fetchPromise: Promise<void>;
    await TestRenderer.act(async () => {
      fetchPromise = fetcher.load("/fetch");
    });

    expect(matchesRenders).toBe(1);
    expect(fetcherStates).toEqual(["idle:undefined", "loading:undefined"]);

    await TestRenderer.act(async () => {
      loaderDfd.resolve("FETCHED");
      await fetchPromise;
    });

    expect(matchesRenders).toBe(1);
    expect(fetcherStates).toEqual([
      "idle:undefined",
      "loading:undefined",
      "idle:FETCHED",
    ]);

    TestRenderer.act(() => renderer.unmount());
    router.dispose();
  });

  it("provides the route ID to error boundaries", () => {
    let consoleError = jest
      .spyOn(console, "error")
      .mockImplementation(() => {});

    function Broken() {
      throw new Error("broken");
    }

    function ErrorBoundary() {
      expect(React.useContext(IsDataRouteContext)).toBe(true);
      expect(React.useContext(RouteIdContext)).toBe("broken");
      return <p>Error boundary</p>;
    }

    let router = createMemoryRouter([
      {
        id: "broken",
        path: "/",
        Component: Broken,
        ErrorBoundary,
      },
    ]);

    let renderer: TestRenderer.ReactTestRenderer;
    TestRenderer.act(() => {
      renderer = TestRenderer.create(
        <RouterProvider router={router} useTransitions={useTransitions} />,
      );
    });

    expect(renderer.toJSON()).toEqual({
      type: "p",
      props: {},
      children: ["Error boundary"],
    });

    TestRenderer.act(() => renderer.unmount());
    router.dispose();
    consoleError.mockRestore();
  });
});
