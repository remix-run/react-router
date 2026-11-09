import * as React from "react";
import * as ReactDOM from "react-dom/client";
import { act } from "@testing-library/react";
import {
  createMemoryRouter,
  Outlet,
  RouterProvider,
  unstable_usePrompt as usePrompt,
} from "../../index";

type Router = ReturnType<typeof createMemoryRouter>;

describe("multiple usePrompt registrations", () => {
  let node: HTMLDivElement;
  let root: ReactDOM.Root;
  let router: Router;
  let confirm: jest.SpyInstance;

  beforeEach(() => {
    jest.useFakeTimers();
    node = document.createElement("div");
    document.body.appendChild(node);
    root = ReactDOM.createRoot(node);
    confirm = jest.spyOn(window, "confirm");
  });

  afterEach(() => {
    act(() => root.unmount());
    router.dispose();
    node.remove();
    confirm.mockRestore();
    jest.useRealTimers();
  });

  function render(Component: React.ComponentType) {
    router = createMemoryRouter([
      {
        Component,
        children: [
          { index: true, element: <h1>Home</h1> },
          { path: "next", element: <h1>Next</h1> },
        ],
      },
    ]);
    act(() => root.render(<RouterProvider router={router} />));
  }

  it("asks sequentially and clears every approval when the second prompt cancels", async () => {
    function Prompt({ name }: { name: string }) {
      usePrompt({ when: true, message: `Leave ${name}?` });
      return null;
    }
    function Layout() {
      return (
        <>
          <Prompt name="A" />
          <Prompt name="B" />
          <Outlet />
        </>
      );
    }
    confirm
      .mockReturnValueOnce(true)
      .mockReturnValueOnce(false)
      .mockReturnValueOnce(true)
      .mockReturnValueOnce(true);
    render(Layout);

    await act(() => router.navigate("/next"));
    expect(confirm).toHaveBeenCalledTimes(1);
    expect(confirm).toHaveBeenNthCalledWith(1, "Leave A?");
    act(() => jest.runOnlyPendingTimers());
    expect(confirm).toHaveBeenNthCalledWith(2, "Leave B?");
    expect(node.querySelector("h1")?.textContent).toBe("Home");
    expect(
      Array.from(router.state.blockers.values()).every(
        (blocker) => blocker.state === "unblocked",
      ),
    ).toBe(true);

    await act(() => router.navigate("/next"));
    expect(confirm).toHaveBeenNthCalledWith(3, "Leave A?");
    act(() => jest.runOnlyPendingTimers());
    expect(confirm).toHaveBeenNthCalledWith(4, "Leave B?");
    act(() => jest.runOnlyPendingTimers());
    expect(node.querySelector("h1")?.textContent).toBe("Next");
  });

  it("cancels when boolean when becomes false before the delayed approval runs", async () => {
    let setWhen: (when: boolean) => void = () => {};
    function Layout() {
      let [when, updateWhen] = React.useState(true);
      setWhen = updateWhen;
      usePrompt({ when, message: "Leave A?" });
      return <Outlet />;
    }
    confirm.mockReturnValue(true);
    render(Layout);

    await act(() => router.navigate("/next"));
    expect(confirm).toHaveBeenCalledTimes(1);
    act(() => setWhen(false));
    act(() => jest.runOnlyPendingTimers());
    expect(node.querySelector("h1")?.textContent).toBe("Home");
    expect(
      Array.from(router.state.blockers.values()).every(
        (blocker) => blocker.state === "unblocked",
      ),
    ).toBe(true);

    await act(() => router.navigate("/next"));
    expect(node.querySelector("h1")?.textContent).toBe("Next");
    expect(confirm).toHaveBeenCalledTimes(1);
  });
});
