import * as React from "react";
import * as TestRenderer from "react-test-renderer";
import {
  createMemoryRouter,
  Outlet,
  RouterProvider,
  useLocation,
} from "react-router";
import { useRouteId } from "../lib/hooks";

describe("useRouteId", () => {
  it("does not re-render when the route ID remains unchanged", async () => {
    let parentRenders = 0;
    let childRenders = 0;

    function Parent() {
      parentRenders++;
      expect(useRouteId()).toBe("parent");
      return <Outlet />;
    }

    function Child() {
      childRenders++;
      expect(useRouteId()).toBe("child");
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
      renderer = TestRenderer.create(<RouterProvider router={router} />);
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

  it("provides the route ID to error boundaries", () => {
    let consoleError = jest
      .spyOn(console, "error")
      .mockImplementation(() => {});

    function Broken() {
      throw new Error("broken");
    }

    function ErrorBoundary() {
      expect(useRouteId()).toBe("broken");
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
      renderer = TestRenderer.create(<RouterProvider router={router} />);
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
