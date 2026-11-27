import * as React from "react";
import { act, fireEvent, render, screen } from "@testing-library/react";
import {
  createMemoryRouter,
  BrowserRouter,
  redirect,
  Outlet,
  RouterProvider,
  useLocation,
  ScrollRestoration,
  unstable_useElementScrollRestoration,
} from "../../index";

const storageKey = "react-router-scroll-positions:elements";
const stored = (positions: unknown) =>
  JSON.stringify({ version: 1, positions });

function Containers({ sidebar = true }: { sidebar?: boolean }) {
  unstable_useElementScrollRestoration("#content");
  return (
    <>
      {sidebar && <Sidebar />}
      <div id="content">
        <Outlet />
      </div>
    </>
  );
}
function Sidebar() {
  unstable_useElementScrollRestoration("#sidebar");
  return <aside id="sidebar">Sidebar</aside>;
}
const element = (id: string) => document.getElementById(id)!;
async function flush() {
  await act(async () => {});
}

beforeEach(() => {
  sessionStorage.clear();
  window.scrollTo = jest.fn();
  delete window.__reactRouterElementScrollRestoration;
});
afterEach(() => jest.restoreAllMocks());

it("restores independent containers on synchronous back/forward navigations without a root", async () => {
  let router = createMemoryRouter([{ path: "*", Component: Containers }], {
    initialEntries: ["/one"],
  });
  render(<RouterProvider router={router} />);
  await flush();
  element("sidebar").scrollTop = 240.5;
  element("content").scrollTop = 800;
  element("content").scrollLeft = 45;
  await act(() => router.navigate("/two"));
  expect(element("sidebar").scrollTop).toBe(0);
  expect(element("content").scrollTop).toBe(0);
  element("content").scrollTop = 300;
  await act(() => router.navigate(-1));
  expect(element("sidebar").scrollTop).toBe(240.5);
  expect(element("content").scrollTop).toBe(800);
  expect(element("content").scrollLeft).toBe(45);
  await act(() => router.navigate(1));
  expect(element("content").scrollTop).toBe(300);
  expect(window.scrollTo).not.toHaveBeenCalled();
  router.dispose();
});

it.each([true, false])(
  "shares custom root key/storage with root first=%s",
  async (rootFirst) => {
    sessionStorage.setItem(
      "custom:elements",
      stored({ "/": { "#content": { x: 15, y: 450 } } }),
    );
    let getKey = jest.fn((location) => location.pathname);
    function App() {
      let root = <ScrollRestoration storageKey="custom" getKey={getKey} />;
      return (
        <>
          {rootFirst && root}
          <Containers />
          {!rootFirst && root}
        </>
      );
    }
    let router = createMemoryRouter([{ path: "*", Component: App }], {
      basename: "/base",
      initialEntries: ["/base"],
    });
    render(<RouterProvider router={router} />);
    await flush();
    expect(element("content").scrollTop).toBe(450);
    expect(element("content").scrollLeft).toBe(15);
    expect(
      getKey.mock.calls.every(
        ([location]) => !location.pathname.startsWith("/base"),
      ),
    ).toBe(true);
    window.dispatchEvent(new Event("pagehide"));
    expect(
      JSON.parse(sessionStorage.getItem("custom:elements")!).positions["/"][
        "#content"
      ],
    ).toEqual({ x: 15, y: 450 });
    expect(sessionStorage.getItem(storageKey)).toBeNull();
    router.dispose();
  },
);

it("preserves scroll when reset is prevented and does not repeat on revalidation or rerender", async () => {
  function App() {
    let [count, setCount] = React.useState(0);
    return (
      <>
        <button onClick={() => setCount(count + 1)}>{count}</button>
        <Containers />
      </>
    );
  }
  let router = createMemoryRouter([{ path: "*", Component: App }]);
  render(<RouterProvider router={router} />);
  await flush();
  element("content").scrollTop = 210;
  await act(() => router.navigate("/two", { preventScrollReset: true }));
  expect(element("content").scrollTop).toBe(210);
  element("content").scrollTop = 320;
  fireEvent.click(screen.getByRole("button"));
  await flush();
  await act(() => router.revalidate());
  expect(element("content").scrollTop).toBe(320);
  router.dispose();
});

it("keeps other hooks active across unmounts and restores a new container mount once", async () => {
  function App() {
    let [visible, setVisible] = React.useState(true);
    return (
      <>
        <button onClick={() => setVisible(!visible)}>Toggle</button>
        <Containers sidebar={visible} />
      </>
    );
  }
  let router = createMemoryRouter([{ path: "*", Component: App }]);
  render(<RouterProvider router={router} />);
  await flush();
  element("sidebar").scrollTop = 110;
  element("content").scrollTop = 220;
  fireEvent.click(screen.getByRole("button"));
  await flush();
  await act(() => router.navigate("/two"));
  await act(() => router.navigate(-1));
  expect(element("content").scrollTop).toBe(220);
  fireEvent.click(screen.getByRole("button"));
  await flush();
  expect(element("sidebar").scrollTop).toBe(110);
  router.dispose();
});

it("skips missing/invalid targets without erasing their saved positions", async () => {
  sessionStorage.setItem(
    storageKey,
    stored({
      default: { "#missing": { x: 0, y: 990 }, "#content": { x: 0, y: 50 } },
    }),
  );
  function App() {
    unstable_useElementScrollRestoration("#missing");
    unstable_useElementScrollRestoration("[");
    return <Containers />;
  }
  let router = createMemoryRouter([{ path: "*", Component: App }]);
  render(<RouterProvider router={router} />);
  await flush();
  expect(element("content").scrollTop).toBe(50);
  await act(() => router.navigate("/two"));
  window.dispatchEvent(new Event("pagehide"));
  expect(
    JSON.parse(sessionStorage.getItem(storageKey)!).positions.default[
      "#missing"
    ],
  ).toEqual({ x: 0, y: 990 });
  router.dispose();
});

it("consumes the SSR receipt for the same node and preserves user scroll through StrictMode replay", async () => {
  sessionStorage.setItem(
    storageKey,
    stored({ default: { "#content": { x: 20, y: 500 } } }),
  );
  let ref = (node: HTMLDivElement | null) => {
    if (node && !window.__reactRouterElementScrollRestoration) {
      node.scrollTop = 275;
      window.__reactRouterElementScrollRestoration = [
        {
          storageKey,
          key: "default",
          locationKey: "default",
          selector: "#content",
          element: node,
        },
      ];
    }
  };
  function App() {
    unstable_useElementScrollRestoration("#content");
    return <div id="content" ref={ref} />;
  }
  let router = createMemoryRouter([{ path: "*", Component: App }]);
  render(
    <React.StrictMode>
      <RouterProvider router={router} />
    </React.StrictMode>,
  );
  await flush();
  expect(element("content").scrollTop).toBe(275);
  expect(window.__reactRouterElementScrollRestoration).toBeUndefined();
  router.dispose();
});

it("restores a replacement node rather than consuming another node's SSR receipt", async () => {
  sessionStorage.setItem(
    storageKey,
    stored({ default: { "#content": { x: 20, y: 500 } } }),
  );
  window.__reactRouterElementScrollRestoration = [
    {
      storageKey,
      key: "default",
      locationKey: "default",
      selector: "#content",
      element: document.createElement("div"),
    },
  ];
  let router = createMemoryRouter([{ path: "*", Component: Containers }]);
  render(<RouterProvider router={router} />);
  await flush();
  expect(element("content").scrollTop).toBe(500);
  router.dispose();
});

it("does not assign old DOM measurements to an uncommitted navigation", async () => {
  let blocked = new Promise(() => {});
  function Page() {
    let location = useLocation();
    if (location.pathname === "/two") throw blocked;
    return <Containers />;
  }
  let router = createMemoryRouter(
    [
      {
        path: "/",
        Component() {
          return (
            <>
              <React.Suspense fallback={<p>Loading</p>}>
                <Outlet />
              </React.Suspense>
              <ScrollRestoration getKey={(location) => location.pathname} />
            </>
          );
        },
        children: [{ path: "*", Component: Page }],
      },
    ],
    { initialEntries: ["/one"] },
  );
  render(<RouterProvider router={router} />);
  await flush();
  element("content").scrollTop = 111;
  await act(() => router.navigate("/two"));
  // React retains /one while /two suspends, even though router.state is /two.
  element("content").scrollTop = 222;
  await act(() => router.navigate("/three"));
  window.dispatchEvent(new Event("pagehide"));
  let positions = JSON.parse(sessionStorage.getItem(storageKey)!).positions;
  expect(positions["/one"]["#content"].y).toBe(222);
  expect(positions["/two"]).toBeUndefined();
  router.dispose();
});

it("does not retry a missing target when it appears under the same mounted hook", async () => {
  sessionStorage.setItem(
    storageKey,
    stored({ default: { "#late": { x: 0, y: 500 } } }),
  );
  function App() {
    unstable_useElementScrollRestoration("#late");
    let [visible, setVisible] = React.useState(false);
    return (
      <>
        <button onClick={() => setVisible(true)}>Show</button>
        {visible && <div id="late" />}
      </>
    );
  }
  let router = createMemoryRouter([{ path: "*", Component: App }]);
  render(<RouterProvider router={router} />);
  await flush();
  fireEvent.click(screen.getByRole("button"));
  await flush();
  expect(element("late").scrollTop).toBe(0);
  router.dispose();
});

it.each(["corrupt", "denied"])(
  "keeps navigation restoration working with %s storage",
  async (failure) => {
    if (failure === "corrupt") sessionStorage.setItem(storageKey, "not JSON");
    if (failure === "denied")
      jest.spyOn(window, "sessionStorage", "get").mockImplementation(() => {
        throw Error("denied");
      });
    let router = createMemoryRouter([{ path: "*", Component: Containers }]);
    render(<RouterProvider router={router} />);
    await flush();
    element("content").scrollTop = 125;
    await act(() => router.navigate("/two"));
    await act(() => router.navigate(-1));
    expect(element("content").scrollTop).toBe(125);
    window.dispatchEvent(new Event("pagehide"));
    router.dispose();
  },
);

it("uses one basename normalization when the route repeats the basename prefix", async () => {
  let seen: string[] = [];
  function App() {
    return (
      <>
        <Containers />
        <ScrollRestoration
          getKey={(location) => {
            seen.push(location.pathname);
            return location.pathname;
          }}
        />
      </>
    );
  }
  let router = createMemoryRouter([{ path: "*", Component: App }], {
    basename: "/base",
    initialEntries: ["/base/base/page"],
  });
  render(<RouterProvider router={router} />);
  await flush();
  element("content").scrollTop = 420;
  await act(() => router.navigate("/base/other"));
  await act(() => router.navigate(-1));
  expect(element("content").scrollTop).toBe(420);
  window.dispatchEvent(new Event("pagehide"));
  expect(
    JSON.parse(sessionStorage.getItem(storageKey)!).positions["/base/page"][
      "#content"
    ].y,
  ).toBe(420);
  router.dispose();
});

it("shares duplicate selector ownership with a basename without repeating SSR restoration", async () => {
  sessionStorage.setItem(
    "shared:elements",
    stored({ "/": { "#content": { x: 0, y: 500 } } }),
  );
  let seeded = false;
  function Duplicate() {
    unstable_useElementScrollRestoration("#content");
    return null;
  }
  function App() {
    let [duplicate, setDuplicate] = React.useState(true);
    unstable_useElementScrollRestoration("#content");
    return (
      <>
        {duplicate && <Duplicate />}
        <button onClick={() => setDuplicate(false)}>Remove duplicate</button>
        <div
          id="content"
          ref={(node) => {
            if (node && !seeded) {
              seeded = true;
              node.scrollTop = 275;
              window.__reactRouterElementScrollRestoration = [
                {
                  storageKey: "shared:elements",
                  key: "/",
                  locationKey: "default",
                  selector: "#content",
                  element: node,
                },
              ];
            }
          }}
        />
        <ScrollRestoration
          storageKey="shared"
          getKey={(location) => location.pathname}
        />
      </>
    );
  }
  let router = createMemoryRouter([{ path: "*", Component: App }], {
    basename: "/base",
    initialEntries: ["/base"],
  });
  render(<RouterProvider router={router} />);
  await flush();
  expect(element("content").scrollTop).toBe(275);
  fireEvent.click(screen.getByRole("button"));
  await flush();
  element("content").scrollTop = 350;
  await act(() => router.navigate("/two"));
  await act(() => router.navigate(-1));
  expect(element("content").scrollTop).toBe(350);
  router.dispose();
});

it("captures a departing container on a local unmount without navigation or pagehide", async () => {
  function App() {
    let [visible, setVisible] = React.useState(true);
    return (
      <>
        <button onClick={() => setVisible(!visible)}>Toggle</button>
        {visible && <Sidebar />}
      </>
    );
  }
  let router = createMemoryRouter([{ path: "*", Component: App }]);
  render(<RouterProvider router={router} />);
  await flush();
  element("sidebar").scrollTop = 345;
  fireEvent.click(screen.getByRole("button"));
  await flush();
  fireEvent.click(screen.getByRole("button"));
  await flush();
  expect(element("sidebar").scrollTop).toBe(345);
  router.dispose();
});

it("does not apply an older namespace's navigation snapshot to a newly mounted container", async () => {
  sessionStorage.setItem(
    "first:elements",
    stored({
      "/two": { "#content": { x: 0, y: 100 }, "#late": { x: 0, y: 500 } },
    }),
  );
  sessionStorage.setItem(
    "second:elements",
    stored({ "/two": { "#late": { x: 0, y: 900 } } }),
  );
  function Late() {
    unstable_useElementScrollRestoration("#late");
    return <div id="late" />;
  }
  function App() {
    let [second, setSecond] = React.useState(false);
    return (
      <>
        <button onClick={() => setSecond(true)}>Change namespace</button>
        <Containers />
        {second && <Late />}
        <ScrollRestoration
          storageKey={second ? "second" : "first"}
          getKey={(location) => location.pathname}
        />
      </>
    );
  }
  let router = createMemoryRouter([{ path: "*", Component: App }]);
  render(<RouterProvider router={router} />);
  await flush();
  await act(() => router.navigate("/two"));
  expect(element("content").scrollTop).toBe(100);
  fireEvent.click(screen.getByRole("button"));
  await flush();
  expect(element("content").scrollTop).toBe(100);
  expect(element("late").scrollTop).toBe(900);
  router.dispose();
});

it("keeps duplicate cleanup in its custom namespace when the root unmounts first", async () => {
  function Duplicate() {
    unstable_useElementScrollRestoration("#content");
    return null;
  }
  function App() {
    return (
      <>
        <ScrollRestoration
          storageKey="custom-cleanup"
          getKey={(location) => location.pathname}
        />
        <Duplicate />
        <Containers />
      </>
    );
  }
  let router = createMemoryRouter([{ path: "*", Component: App }]);
  let view = render(<RouterProvider router={router} />);
  await flush();
  element("content").scrollTop = 375;
  view.unmount();
  await flush();
  expect(sessionStorage.getItem(storageKey)).toBeNull();
  expect(
    JSON.parse(sessionStorage.getItem("custom-cleanup:elements")!).positions[
      "/"
    ]["#content"].y,
  ).toBe(375);
  router.dispose();
});

it("does not measure an already missing node during later hook cleanup", async () => {
  sessionStorage.setItem(
    storageKey,
    stored({ default: { "#missing-later": { x: 0, y: 500 } } }),
  );
  function App() {
    unstable_useElementScrollRestoration("#missing-later");
    let [visible, setVisible] = React.useState(true);
    return (
      <>
        <button onClick={() => setVisible(false)}>Remove target</button>
        {visible && <div id="missing-later" />}
      </>
    );
  }
  let router = createMemoryRouter([{ path: "*", Component: App }]);
  let view = render(<RouterProvider router={router} />);
  await flush();
  let departing = element("missing-later");
  fireEvent.click(screen.getByRole("button"));
  departing.scrollTop = 0;
  view.unmount();
  await flush();
  expect(
    JSON.parse(sessionStorage.getItem(storageKey)!).positions.default[
      "#missing-later"
    ].y,
  ).toBe(500);
  router.dispose();
});

it("isolates active registrations and caches between routers", async () => {
  function One() {
    unstable_useElementScrollRestoration("#one");
    return (
      <>
        <div id="one" />
        <ScrollRestoration storageKey="one" />
      </>
    );
  }
  function Two() {
    unstable_useElementScrollRestoration("#two");
    return (
      <>
        <div id="two" />
        <ScrollRestoration storageKey="two" />
      </>
    );
  }
  let first = createMemoryRouter([{ path: "*", Component: One }]);
  let second = createMemoryRouter([{ path: "*", Component: Two }]);
  render(
    <>
      <RouterProvider router={first} />
      <RouterProvider router={second} />
    </>,
  );
  await flush();
  element("one").scrollTop = 111;
  element("two").scrollTop = 222;
  await act(() => first.navigate("/next"));
  expect(element("two").scrollTop).toBe(222);
  await act(() => first.navigate(-1));
  expect(element("one").scrollTop).toBe(111);
  window.dispatchEvent(new Event("pagehide"));
  expect(
    JSON.parse(sessionStorage.getItem("one:elements")!).positions.default,
  ).toEqual({ "#one": { x: 0, y: 111 } });
  expect(
    JSON.parse(sessionStorage.getItem("two:elements")!).positions.default,
  ).toEqual({ "#two": { x: 0, y: 222 } });
  first.dispose();
  second.dispose();
});

it("requires a data router", () => {
  let error = jest.spyOn(console, "error").mockImplementation(() => {});
  expect(() =>
    render(
      <BrowserRouter>
        <Sidebar />
      </BrowserRouter>,
    ),
  ).toThrow(/must be used within a data router/);
  error.mockRestore();
});

it("preserves element positions for mutation submissions and resets after their redirects", async () => {
  let router = createMemoryRouter([
    {
      path: "*",
      Component: Containers,
      action({ request }) {
        return new URL(request.url).pathname === "/redirect"
          ? redirect("/three")
          : null;
      },
    },
  ]);
  render(<RouterProvider router={router} />);
  await flush();
  element("content").scrollTop = 225;
  await act(() =>
    router.navigate("/two", { formMethod: "post", formData: new FormData() }),
  );
  expect(element("content").scrollTop).toBe(225);
  await act(() =>
    router.navigate("/redirect", {
      formMethod: "post",
      formData: new FormData(),
    }),
  );
  expect(router.state.location.pathname).toBe("/three");
  expect(element("content").scrollTop).toBe(0);
  router.dispose();
});
