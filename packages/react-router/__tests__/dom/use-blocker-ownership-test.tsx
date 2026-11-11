import * as React from "react";
import * as ReactDOM from "react-dom/client";
import { act } from "@testing-library/react";
import type { Blocker } from "../../index";
import {
  createMemoryRouter,
  Outlet,
  RouterProvider,
  useBlocker,
} from "../../index";

type Router = ReturnType<typeof createMemoryRouter>;

describe("useBlocker registration ownership", () => {
  let node: HTMLDivElement;
  let root: ReactDOM.Root;
  let routers: Router[];
  let blocker: Blocker;
  let warnSpy: jest.SpyInstance;

  beforeEach(() => {
    node = document.createElement("div");
    document.body.appendChild(node);
    root = ReactDOM.createRoot(node);
    routers = [];
    warnSpy = jest.spyOn(console, "warn").mockImplementation(() => {});
  });

  afterEach(() => {
    act(() => root.unmount());
    routers.forEach((router) => router.dispose());
    node.remove();
    warnSpy.mockRestore();
  });

  function Guard() {
    blocker = useBlocker(true);
    return <p>{blocker.state}</p>;
  }

  function createTestRouter(Component: React.ComponentType) {
    let router = createMemoryRouter([
      {
        Component,
        children: [
          { index: true, element: <h1>Home</h1> },
          { path: "next", element: <h1>Next</h1> },
          { path: "other", element: <h1>Other</h1> },
        ],
      },
    ]);
    routers.push(router);
    return router;
  }

  it("releases a guard after Activity hide/show and still blocks after reveal", async () => {
    let setMode: (mode: "visible" | "hidden") => void = () => {};
    function Layout() {
      let [mode, updateMode] = React.useState<"visible" | "hidden">("visible");
      setMode = updateMode;
      return (
        <>
          <React.Activity mode={mode}>
            <Guard />
          </React.Activity>
          <Outlet />
        </>
      );
    }
    let router = createTestRouter(Layout);
    act(() =>
      root.render(
        <React.StrictMode>
          <RouterProvider router={router} />
        </React.StrictMode>,
      ),
    );

    act(() => setMode("hidden"));
    act(() => setMode("visible"));
    await act(() => router.navigate("/next"));
    expect(blocker.state).toBe("blocked");
    expect(node.querySelector("h1")?.textContent).toBe("Home");

    act(() => setMode("hidden"));
    await act(() => router.navigate("/other"));
    expect(node.querySelector("h1")?.textContent).toBe("Other");
    expect(warnSpy).not.toHaveBeenCalled();
  });

  it("keeps a recreated router guarded until the component is removed", async () => {
    let setShow: (show: boolean) => void = () => {};
    function Layout() {
      let [show, updateShow] = React.useState(true);
      setShow = updateShow;
      return (
        <>
          {show ? <Guard /> : null}
          <Outlet />
        </>
      );
    }
    let router: Router;
    let replaceRouter: () => void = () => {};
    function App() {
      let [currentRouter, setRouter] = React.useState(() =>
        createTestRouter(Layout),
      );
      router = currentRouter;
      replaceRouter = () => setRouter(createTestRouter(Layout));
      return <RouterProvider router={currentRouter} />;
    }
    act(() => root.render(<App />));
    let previousRouter = router!;

    act(() => replaceRouter());
    await act(() => router.navigate("/next"));
    expect(blocker.state).toBe("blocked");
    expect(node.querySelector("h1")?.textContent).toBe("Home");
    act(() => blocker.reset?.());
    expect(blocker.state).toBe("unblocked");
    expect(previousRouter.state.blockers.size).toBe(0);

    act(() => setShow(false));
    await act(() => router.navigate("/other"));
    expect(node.querySelector("h1")?.textContent).toBe("Other");
    expect(warnSpy).not.toHaveBeenCalled();
  });
});
