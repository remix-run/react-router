import * as React from "react";
import * as ReactDOM from "react-dom/client";
import { act } from "@testing-library/react";
import type { Blocker, RouteObject } from "../../index";
import {
  createMemoryRouter,
  Outlet,
  RouterProvider,
  useBlocker,
} from "../../index";
import { createDeferred } from "../router/utils/utils";

type Router = ReturnType<typeof createMemoryRouter>;

describe("multiple useBlocker registrations", () => {
  let node: HTMLDivElement;
  let root: ReactDOM.Root;
  let routers: Router[];
  let blockers: Record<string, Blocker>;
  let warnSpy: jest.SpyInstance;

  beforeEach(() => {
    node = document.createElement("div");
    document.body.appendChild(node);
    root = ReactDOM.createRoot(node);
    routers = [];
    blockers = {};
    warnSpy = jest.spyOn(console, "warn").mockImplementation(() => {});
  });

  afterEach(() => {
    act(() => root.unmount());
    routers.forEach((router) => router.dispose());
    node.remove();
    warnSpy.mockRestore();
  });

  function Guard({ name }: { name: string }) {
    let blocker = useBlocker(true);
    blockers[name] = blocker;
    return (
      <section aria-label={name}>
        <span>{blocker.state}</span>
        {blocker.state === "blocked" ? (
          <>
            <button onClick={blocker.proceed}>Approve {name}</button>
            <button onClick={blocker.reset}>Cancel {name}</button>
          </>
        ) : null}
      </section>
    );
  }

  function createTestRouter(
    Component: React.ComponentType,
    nextLoader?: RouteObject["loader"],
  ) {
    let router = createMemoryRouter(
      [
        {
          Component,
          children: [
            { index: true, element: <h1>Home</h1> },
            { path: "next", element: <h1>Next</h1>, loader: nextLoader },
            { path: "other", element: <h1>Other</h1> },
          ],
        },
      ],
      { future: { unstable_multipleBlockers: true } },
    );
    routers.push(router);
    return router;
  }

  function render(router: Router, strict = false) {
    act(() =>
      root.render(
        strict ? (
          <React.StrictMode>
            <RouterProvider router={router} />
          </React.StrictMode>
        ) : (
          <RouterProvider router={router} />
        ),
      ),
    );
  }

  function clickButton(text: string) {
    let button = Array.from(node.querySelectorAll("button")).find(
      (button) => button.textContent === text,
    );
    expect(button).toBeDefined();
    button!.click();
  }

  it("hands off independent confirmations and ignores callbacks from an approved form", async () => {
    let nextData = createDeferred();
    let loader = jest.fn(() => nextData.promise);
    function Layout() {
      return (
        <>
          <Guard name="A" />
          <Guard name="B" />
          <Outlet />
        </>
      );
    }
    let router = createTestRouter(Layout, loader);
    render(router);

    await act(() => router.navigate("/next"));
    expect(blockers.A.state).toBe("blocked");
    expect(blockers.B.state).toBe("unblocked");
    let firstSelection = blockers.A;

    act(() => clickButton("Approve A"));
    expect(blockers.A.state).toBe("unblocked");
    expect(blockers.A.location).toBeUndefined();
    expect(blockers.A.reset).toBeUndefined();
    expect(blockers.B.state).toBe("blocked");
    expect(node.querySelectorAll("button")).toHaveLength(2);
    expect(loader).not.toHaveBeenCalled();

    act(() => {
      firstSelection.reset?.();
      firstSelection.proceed?.();
    });
    expect(blockers.B.state).toBe("blocked");
    expect(loader).not.toHaveBeenCalled();

    act(() => clickButton("Approve B"));
    expect(blockers.A.state).toBe("unblocked");
    expect(blockers.B.state).toBe("proceeding");
    expect(loader).toHaveBeenCalledTimes(1);
    await act(async () => {
      nextData.resolve(null);
      await nextData.promise;
    });
    expect(node.querySelector("h1")?.textContent).toBe("Next");
    expect(blockers.B.state).toBe("unblocked");
    expect(warnSpy).not.toHaveBeenCalled();
  });

  it("continues through mounted guards when the selected form is removed", async () => {
    let setShowA: (show: boolean) => void = () => {};
    let setShowB: (show: boolean) => void = () => {};
    function Layout() {
      let [showA, updateShowA] = React.useState(true);
      let [showB, updateShowB] = React.useState(true);
      setShowA = updateShowA;
      setShowB = updateShowB;
      return (
        <>
          {showA ? <Guard name="A" /> : null}
          {showB ? <Guard name="B" /> : null}
          <Outlet />
        </>
      );
    }
    let router = createTestRouter(Layout);
    render(router);

    await act(() => router.navigate("/next"));
    expect(blockers.A.state).toBe("blocked");
    let removedSelection = blockers.A;
    await act(async () => setShowA(false));
    expect(blockers.B.state).toBe("blocked");
    expect(node.querySelector("h1")?.textContent).toBe("Home");

    act(() => {
      removedSelection.reset?.();
      removedSelection.proceed?.();
    });
    expect(blockers.B.state).toBe("blocked");
    await act(async () => setShowB(false));
    expect(node.querySelector("h1")?.textContent).toBe("Next");
  });

  it("requires new consent from a remounted form while another confirmation is pending", async () => {
    let setShowA: (show: boolean) => void = () => {};
    function Layout() {
      let [showA, updateShowA] = React.useState(true);
      setShowA = updateShowA;
      return (
        <>
          {showA ? <Guard name="A" /> : null}
          <Guard name="B" />
          <Outlet />
        </>
      );
    }
    let router = createTestRouter(Layout);
    render(router);

    await act(() => router.navigate("/next"));
    act(() => clickButton("Approve A"));
    expect(blockers.B.state).toBe("blocked");
    await act(async () => setShowA(false));
    expect(blockers.B.state).toBe("blocked");
    await act(async () => setShowA(true));
    expect(blockers.A.state).toBe("unblocked");
    expect(blockers.B.state).toBe("blocked");

    act(() => clickButton("Approve B"));
    expect(blockers.A.state).toBe("blocked");
    expect(blockers.B.state).toBe("unblocked");
    expect(node.querySelector("h1")?.textContent).toBe("Home");
    await act(async () => clickButton("Approve A"));
    expect(node.querySelector("h1")?.textContent).toBe("Next");
  });

  it("does not resume through transient Activity cleanup and fresh registration", async () => {
    let changeMode: () => void = () => {};
    function Layout() {
      let [mode, setMode] = React.useState<"visible" | "hidden">("visible");
      changeMode = () => setMode("hidden");
      React.useEffect(() => {
        if (mode === "hidden") setMode("visible");
      }, [mode]);
      return (
        <>
          <React.Activity mode={mode}>
            <Guard name="A" />
          </React.Activity>
          <Outlet />
        </>
      );
    }
    let router = createTestRouter(Layout);
    render(router, true);

    await act(() => router.navigate("/next"));
    expect(blockers.A.state).toBe("blocked");
    let oldSelection = blockers.A;
    await act(async () => changeMode());
    expect(node.querySelector("h1")?.textContent).toBe("Home");
    expect(blockers.A.state).toBe("blocked");
    act(() => oldSelection.proceed?.());
    expect(node.querySelector("h1")?.textContent).toBe("Home");
    await act(async () => clickButton("Approve A"));
    expect(node.querySelector("h1")?.textContent).toBe("Next");
  });
});
