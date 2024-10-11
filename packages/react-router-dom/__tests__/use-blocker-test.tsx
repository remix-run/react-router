import * as React from "react";
import * as ReactDOM from "react-dom/client";
import { act } from "react-dom/test-utils";
import type { Blocker, RouteObject } from "../index";
import {
  createMemoryRouter,
  json,
  Link,
  NavLink,
  Outlet,
  RouterProvider,
  useBlocker,
  useNavigate,
} from "../index";

type Router = ReturnType<typeof createMemoryRouter>;

const LOADER_LATENCY_MS = 200;

async function slowLoader() {
  await sleep(LOADER_LATENCY_MS / 2);
  return json(null);
}

describe("navigation blocking with useBlocker", () => {
  let node: HTMLDivElement;
  let router: Router;
  let blocker: Blocker | null = null;
  let root: ReactDOM.Root;

  beforeEach(() => {
    node = document.createElement("div");
    document.body.appendChild(node);
  });

  afterEach(() => {
    document.body.removeChild(node);
    node = null!;
  });

  it("initializes an 'unblocked' blocker", async () => {
    let initialEntries = ["/"];
    let routes: RouteObject[] = [
      {
        path: "/",
        element: React.createElement(() => {
          let b = useBlocker(false);
          blocker = b;
          return null;
        }),
      },
    ];
    router = createMemoryRouter(routes, { initialEntries });
    act(() => {
      root = ReactDOM.createRoot(node);
      root.render(<RouterProvider router={router} />);
    });
    expect(blocker).toEqual({
      state: "unblocked",
      proceed: undefined,
      reset: undefined,
    });
    act(() => {
      root.unmount();
    });
  });

  it("strips basename from location provided to blocker function", async () => {
    let shouldBlock = jest.fn();
    router = createMemoryRouter(
      [
        {
          Component() {
            useBlocker(shouldBlock);
            return (
              <div>
                <Link to="/about">About</Link>
                <Outlet />
              </div>
            );
          },
          children: [
            {
              path: "/",
              element: <h1>Home</h1>,
            },
            {
              path: "/about",
              element: <h1>About</h1>,
            },
          ],
        },
      ],
      {
        basename: "/base",
        initialEntries: ["/base"],
      }
    );

    act(() => {
      root = ReactDOM.createRoot(node);
      root.render(<RouterProvider router={router} />);
    });

    act(() => click(node.querySelector("a[href='/base/about']")));

    expect(router.state.location.pathname).toBe("/base/about");
    expect(shouldBlock).toHaveBeenCalledWith({
      currentLocation: expect.objectContaining({ pathname: "/" }),
      nextLocation: expect.objectContaining({ pathname: "/about" }),
      historyAction: "PUSH",
    });

    act(() => root.unmount());
  });

  it("handles unstable blocker function identities", async () => {
    let count = 0;
    router = createMemoryRouter([
      {
        element: React.createElement(() => {
          // New function identity on each render
          let b = useBlocker(() => false);
          blocker = b;
          if (++count > 50) {
            throw new Error("useBlocker caused a re-render loop!");
          }
          return (
            <div>
              <Link to="/about">/about</Link>
              <Outlet />
            </div>
          );
        }),
        children: [
          {
            path: "/",
            element: <h1>Home</h1>,
          },
          {
            path: "/about",
            element: <h1>About</h1>,
          },
        ],
      },
    ]);

    act(() => {
      root = ReactDOM.createRoot(node);
      root.render(<RouterProvider router={router} />);
    });

    expect(node.querySelector("h1")?.textContent).toBe("Home");

    act(() => click(node.querySelector("a[href='/about']")));
    expect(node.querySelector("h1")?.textContent).toBe("About");

    act(() => root.unmount());
  });

  it("handles reused blocker in a layout route", async () => {
    router = createMemoryRouter([
      {
        Component() {
          let blocker = useBlocker(true);
          return (
            <div>
              <Link to="/one">/one</Link>
              <Link to="/two">/two</Link>
              <Outlet />
              <p>{blocker.state}</p>
              {blocker.state === "blocked" ? (
                <button onClick={() => blocker.proceed?.()}>Proceed</button>
              ) : null}
            </div>
          );
        },
        children: [
          {
            path: "/",
            element: <h1>Home</h1>,
          },
          {
            path: "/one",
            element: <h1>One</h1>,
          },
          {
            path: "/two",
            element: <h1>Two</h1>,
          },
        ],
      },
    ]);

    act(() => {
      root = ReactDOM.createRoot(node);
      root.render(<RouterProvider router={router} />);
    });

    // Start on /
    expect(node.querySelector("h1")?.textContent).toBe("Home");
    expect(node.querySelector("p")?.textContent).toBe("unblocked");
    expect(node.querySelector("button")).toBeNull();

    // Blocked navigation to /one
    act(() => click(node.querySelector("a[href='/one']")));
    expect(node.querySelector("h1")?.textContent).toBe("Home");
    expect(node.querySelector("p")?.textContent).toBe("blocked");
    expect(node.querySelector("button")?.textContent).toBe("Proceed");

    // Proceed to /one
    act(() => click(node.querySelector("button")));
    expect(node.querySelector("h1")?.textContent).toBe("One");
    expect(node.querySelector("p")?.textContent).toBe("unblocked");
    expect(node.querySelector("button")).toBeNull();

    // Blocked navigation to /two
    act(() => click(node.querySelector("a[href='/two']")));
    expect(node.querySelector("h1")?.textContent).toBe("One");
    expect(node.querySelector("p")?.textContent).toBe("blocked");
    expect(node.querySelector("button")?.textContent).toBe("Proceed");

    // Proceed to /two
    act(() => click(node.querySelector("button")));
    expect(node.querySelector("h1")?.textContent).toBe("Two");
    expect(node.querySelector("p")?.textContent).toBe("unblocked");
    expect(node.querySelector("button")).toBeNull();

    act(() => root.unmount());
  });

  describe("on <Link> navigation", () => {
    describe("blocker returns false", () => {
      beforeEach(() => {
        let initialEntries = ["/"];
        let initialIndex = 0;
        router = createMemoryRouter(
          [
            {
              element: React.createElement(() => {
                let b = useBlocker(false);
                blocker = b;
                return (
                  <div>
                    <NavLink to="/">Home</NavLink>
                    <NavLink to="/about">About</NavLink>
                    <Outlet />
                  </div>
                );
              }),
              children: [
                {
                  path: "/",
                  element: <h1>Home</h1>,
                },
                {
                  path: "/about",
                  element: <h1>About</h1>,
                  loader: slowLoader,
                },
              ],
            },
          ],
          {
            initialEntries,
            initialIndex,
          }
        );
        act(() => {
          root = ReactDOM.createRoot(node);
          root.render(<RouterProvider router={router} />);
        });
      });

      afterEach(() => {
        act(() => root.unmount());
      });

      it("navigates", async () => {
        await act(async () => {
          click(node.querySelector("a[href='/about']"));
          await sleep(LOADER_LATENCY_MS);
        });
        let h1 = node.querySelector("h1");
        expect(h1?.textContent).toBe("About");
      });

      it("gets an 'unblocked' blocker after navigation starts", async () => {
        act(() => {
          click(node.querySelector("a[href='/about']"));
        });
        expect(blocker).toEqual({
          state: "unblocked",
          proceed: undefined,
          reset: undefined,
          location: undefined,
        });
      });

      it("gets an 'unblocked' blocker after navigation completes", async () => {
        await act(async () => {
          click(node.querySelector("a[href='/about']"));
          await sleep(LOADER_LATENCY_MS);
        });
        expect(blocker).toEqual({
          state: "unblocked",
          proceed: undefined,
          reset: undefined,
          location: undefined,
        });
      });
    });

    describe("blocker returns true", () => {
      beforeEach(() => {
        let initialEntries = ["/"];
        let initialIndex = 0;
        router = createMemoryRouter(
          [
            {
              element: React.createElement(() => {
                let b = useBlocker(true);
                blocker = b;
                return (
                  <div>
                    <NavLink to="/">Home</NavLink>
                    <NavLink to="/about">About</NavLink>
                    <Outlet />
                  </div>
                );
              }),
              children: [
                {
                  path: "/",
                  element: <h1>Home</h1>,
                },
                {
                  path: "/about",
                  element: <h1>About</h1>,
                  loader: slowLoader,
                },
              ],
            },
          ],
          {
            initialEntries,
            initialIndex,
          }
        );
        act(() => {
          root = ReactDOM.createRoot(node);
          root.render(<RouterProvider router={router} />);
        });
      });

      afterEach(() => {
        act(() => root.unmount());
      });

      it("does not navigate", async () => {
        await act(async () => {
          click(node.querySelector("a[href='/about']"));
          await sleep(LOADER_LATENCY_MS);
        });
        let h1 = node.querySelector("h1");
        expect(h1?.textContent).not.toBe("About");
      });

      it("gets a 'blocked' blocker after navigation starts", async () => {
        act(() => {
          click(node.querySelector("a[href='/about']"));
        });
        expect(blocker).toEqual({
          state: "blocked",
          proceed: expect.any(Function),
          reset: expect.any(Function),
          location: expect.any(Object),
        });
      });

      it("gets a 'blocked' blocker after navigation promise resolves", async () => {
        await act(async () => {
          click(node.querySelector("a[href='/about']"));
          await sleep(LOADER_LATENCY_MS);
        });
        expect(blocker).toEqual({
          state: "blocked",
          proceed: expect.any(Function),
          reset: expect.any(Function),
          location: expect.any(Object),
        });
      });
    });

    describe("exiting from blocked state", () => {
      beforeEach(() => {
        let initialEntries = ["/"];
        let initialIndex = 0;
        router = createMemoryRouter(
          [
            {
              element: React.createElement(() => {
                let b = useBlocker(true);
                blocker = b;
                return (
                  <div>
                    <NavLink to="/">Home</NavLink>
                    <NavLink to="/about">About</NavLink>
                    {b.state === "blocked" && (
                      <div>
                        <button data-action="proceed" onClick={b.proceed}>
                          Proceed
                        </button>
                        <button data-action="reset" onClick={b.reset}>
                          Reset
                        </button>
                      </div>
                    )}
                    <Outlet />
                  </div>
                );
              }),
              children: [
                {
                  path: "/",
                  element: <h1>Home</h1>,
                },
                {
                  path: "/about",
                  element: <h1>About</h1>,
                  loader: slowLoader,
                },
              ],
            },
          ],
          {
            initialEntries,
            initialIndex,
          }
        );
        act(() => {
          root = ReactDOM.createRoot(node);
          root.render(<RouterProvider router={router} />);
        });
      });

      afterEach(() => {
        act(() => root.unmount());
      });

      it("gets a 'proceeding' blocker after proceeding navigation starts", async () => {
        act(() => {
          click(node.querySelector("a[href='/about']"));
        });
        act(() => {
          click(node.querySelector("[data-action='proceed']"));
        });
        expect(blocker).toEqual({
          state: "proceeding",
          proceed: undefined,
          reset: undefined,
          location: expect.any(Object),
        });
      });

      it("gets an 'unblocked' blocker after proceeding navigation completes", async () => {
        act(() => {
          click(node.querySelector("a[href='/about']"));
        });
        await act(async () => {
          click(node.querySelector("[data-action='proceed']"));
          await sleep(LOADER_LATENCY_MS);
        });
        expect(blocker).toEqual({
          state: "unblocked",
          proceed: undefined,
          reset: undefined,
          location: undefined,
        });
      });

      it("navigates after proceeding navigation completes", async () => {
        act(() => {
          click(node.querySelector("a[href='/about']"));
        });
        await act(async () => {
          click(node.querySelector("[data-action='proceed']"));
          await sleep(LOADER_LATENCY_MS);
        });
        let h1 = node.querySelector("h1");
        expect(h1?.textContent).toBe("About");
      });

      it("gets an 'unblocked' blocker after resetting navigation", async () => {
        act(() => {
          click(node.querySelector("a[href='/about']"));
        });
        act(() => {
          click(node.querySelector("[data-action='reset']"));
        });
        expect(blocker).toEqual({
          state: "unblocked",
          proceed: undefined,
          reset: undefined,
          location: undefined,
        });
      });

      it("stays at current location after resetting", async () => {
        act(() => {
          click(node.querySelector("a[href='/about']"));
        });
        await act(async () => {
          click(node.querySelector("[data-action='reset']"));
          // wait for '/about' loader so we catch failure if navigation proceeds
          await sleep(LOADER_LATENCY_MS);
        });
        let h1 = node.querySelector("h1");
        expect(h1?.textContent).toBe("Home");
      });
    });
  });

  describe("on <Link replace> navigation", () => {
    describe("blocker returns false", () => {
      beforeEach(() => {
        let initialEntries = ["/"];
        let initialIndex = 0;
        router = createMemoryRouter(
          [
            {
              element: React.createElement(() => {
                let b = useBlocker(false);
                blocker = b;
                return (
                  <div>
                    <NavLink to="/" replace>
                      Home
                    </NavLink>
                    <NavLink to="/about" replace>
                      About
                    </NavLink>
                    <Outlet />
                  </div>
                );
              }),
              children: [
                {
                  path: "/",
                  element: <h1>Home</h1>,
                },
                {
                  path: "/about",
                  element: <h1>About</h1>,
                  loader: slowLoader,
                },
              ],
            },
          ],
          {
            initialEntries,
            initialIndex,
          }
        );
        act(() => {
          root = ReactDOM.createRoot(node);
          root.render(<RouterProvider router={router} />);
        });
      });

      afterEach(() => {
        act(() => root.unmount());
      });

      it("navigates", async () => {
        await act(async () => {
          click(node.querySelector("a[href='/about']"));
          await sleep(LOADER_LATENCY_MS);
        });
        let h1 = node.querySelector("h1");
        expect(h1?.textContent).toBe("About");
      });

      it("gets an 'unblocked' blocker after navigation starts", async () => {
        act(() => {
          click(node.querySelector("a[href='/about']"));
        });
        expect(blocker).toEqual({
          state: "unblocked",
          proceed: undefined,
          reset: undefined,
          location: undefined,
        });
      });

      it("gets an 'unblocked' blocker after navigation completes", async () => {
        await act(async () => {
          click(node.querySelector("a[href='/about']"));
          await sleep(LOADER_LATENCY_MS);
        });
        expect(blocker).toEqual({
          state: "unblocked",
          proceed: undefined,
          reset: undefined,
          location: undefined,
        });
      });
    });

    describe("blocker returns true", () => {
      beforeEach(() => {
        let initialEntries = ["/"];
        let initialIndex = 0;
        router = createMemoryRouter(
          [
            {
              element: React.createElement(() => {
                let b = useBlocker(true);
                blocker = b;
                return (
                  <div>
                    <NavLink to="/" replace>
                      Home
                    </NavLink>
                    <NavLink to="/about" replace>
                      About
                    </NavLink>
                    <Outlet />
                  </div>
                );
              }),
              children: [
                {
                  path: "/",
                  element: <h1>Home</h1>,
                },
                {
                  path: "/about",
                  element: <h1>About</h1>,
                  loader: slowLoader,
                },
              ],
            },
          ],
          {
            initialEntries,
            initialIndex,
          }
        );
        act(() => {
          root = ReactDOM.createRoot(node);
          root.render(<RouterProvider router={router} />);
        });
      });

      afterEach(() => {
        act(() => root.unmount());
      });

      it("does not navigate", async () => {
        await act(async () => {
          click(node.querySelector("a[href='/about']"));
          await sleep(LOADER_LATENCY_MS);
        });
        let h1 = node.querySelector("h1");
        expect(h1?.textContent).not.toBe("About");
      });

      it("gets a 'blocked' blocker after navigation starts", async () => {
        act(() => {
          click(node.querySelector("a[href='/about']"));
        });
        expect(blocker).toEqual({
          state: "blocked",
          proceed: expect.any(Function),
          reset: expect.any(Function),
          location: expect.any(Object),
        });
      });

      it("gets a 'blocked' blocker after navigation promise resolves", async () => {
        await act(async () => {
          click(node.querySelector("a[href='/about']"));
          await sleep(LOADER_LATENCY_MS);
        });
        expect(blocker).toEqual({
          state: "blocked",
          proceed: expect.any(Function),
          reset: expect.any(Function),
          location: expect.any(Object),
        });
      });
    });

    describe("exiting from blocked state", () => {
      beforeEach(() => {
        let initialEntries = ["/"];
        let initialIndex = 0;
        router = createMemoryRouter(
          [
            {
              element: React.createElement(() => {
                let b = useBlocker(true);
                blocker = b;
                return (
                  <div>
                    <NavLink to="/" replace>
                      Home
                    </NavLink>
                    <NavLink to="/about" replace>
                      About
                    </NavLink>
                    {b.state === "blocked" && (
                      <div>
                        <button data-action="proceed" onClick={b.proceed}>
                          Proceed
                        </button>
                        <button data-action="reset" onClick={b.reset}>
                          Reset
                        </button>
                      </div>
                    )}
                    <Outlet />
                  </div>
                );
              }),
              children: [
                {
                  path: "/",
                  element: <h1>Home</h1>,
                },
                {
                  path: "/about",
                  element: <h1>About</h1>,
                  loader: slowLoader,
                },
              ],
            },
          ],
          {
            initialEntries,
            initialIndex,
          }
        );
        act(() => {
          root = ReactDOM.createRoot(node);
          root.render(<RouterProvider router={router} />);
        });
      });

      afterEach(() => {
        act(() => root.unmount());
      });

      it("gets a 'proceeding' blocker after proceeding navigation starts", async () => {
        act(() => {
          click(node.querySelector("a[href='/about']"));
        });
        act(() => {
          click(node.querySelector("[data-action='proceed']"));
        });
        expect(blocker).toEqual({
          state: "proceeding",
          proceed: undefined,
          reset: undefined,
          location: expect.any(Object),
        });
      });

      it("gets an 'unblocked' blocker after proceeding navigation completes", async () => {
        act(() => {
          click(node.querySelector("a[href='/about']"));
        });
        await act(async () => {
          click(node.querySelector("[data-action='proceed']"));
          await sleep(LOADER_LATENCY_MS);
        });
        expect(blocker).toEqual({
          state: "unblocked",
          proceed: undefined,
          reset: undefined,
          location: undefined,
        });
      });

      it("navigates after proceeding navigation completes", async () => {
        act(() => {
          click(node.querySelector("a[href='/about']"));
        });
        await act(async () => {
          click(node.querySelector("[data-action='proceed']"));
          await sleep(LOADER_LATENCY_MS);
        });
        let h1 = node.querySelector("h1");
        expect(h1?.textContent).toBe("About");
      });

      it("gets an 'unblocked' blocker after resetting navigation", async () => {
        act(() => {
          click(node.querySelector("a[href='/about']"));
        });
        act(() => {
          click(node.querySelector("[data-action='reset']"));
        });
        expect(blocker).toEqual({
          state: "unblocked",
          proceed: undefined,
          reset: undefined,
          location: undefined,
        });
      });

      it("stays at current location after resetting", async () => {
        act(() => {
          click(node.querySelector("a[href='/about']"));
        });
        await act(async () => {
          click(node.querySelector("[data-action='reset']"));
          // wait for '/about' loader so we catch failure if navigation proceeds
          await sleep(LOADER_LATENCY_MS);
        });
        let h1 = node.querySelector("h1");
        expect(h1?.textContent).toBe("Home");
      });
    });
  });

  describe("on POP navigation", () => {
    describe("blocker returns false", () => {
      beforeEach(() => {
        let initialEntries = ["/", "/about", "/contact"];
        let initialIndex = 2;
        router = createMemoryRouter(
          [
            {
              element: React.createElement(() => {
                let b = useBlocker(false);
                let navigate = useNavigate();
                blocker = b;
                return (
                  <div>
                    <NavLink to="/" replace>
                      Home
                    </NavLink>
                    <NavLink to="/about" replace>
                      About
                    </NavLink>
                    <button data-action="back" onClick={() => navigate(-1)}>
                      Go Back
                    </button>
                    <Outlet />
                  </div>
                );
              }),
              children: [
                {
                  path: "/",
                  element: <h1>Home</h1>,
                },
                {
                  path: "/about",
                  element: <h1>About</h1>,
                  loader: slowLoader,
                },
                {
                  path: "/contact",
                  element: <h1>Contact</h1>,
                },
              ],
            },
          ],
          {
            initialEntries,
            initialIndex,
          }
        );
        act(() => {
          root = ReactDOM.createRoot(node);
          root.render(<RouterProvider router={router} />);
        });
      });

      afterEach(() => {
        act(() => root.unmount());
      });

      it("navigates", async () => {
        await act(async () => {
          click(node.querySelector("[data-action='back']"));
          await sleep(LOADER_LATENCY_MS);
        });
        let h1 = node.querySelector("h1");
        expect(h1?.textContent).toBe("About");
      });

      it("gets an 'unblocked' blocker after navigation starts", async () => {
        act(() => {
          click(node.querySelector("[data-action='back']"));
        });
        expect(blocker).toEqual({
          state: "unblocked",
          proceed: undefined,
          reset: undefined,
          location: undefined,
        });
      });

      it("gets an 'unblocked' blocker after navigation completes", async () => {
        await act(async () => {
          click(node.querySelector("[data-action='back']"));
          await sleep(LOADER_LATENCY_MS);
        });
        expect(blocker).toEqual({
          state: "unblocked",
          proceed: undefined,
          reset: undefined,
          location: undefined,
        });
      });
    });

    describe("blocker returns true", () => {
      beforeEach(() => {
        let initialEntries = ["/", "/about", "/contact"];
        let initialIndex = 2;
        router = createMemoryRouter(
          [
            {
              element: React.createElement(() => {
                let b = useBlocker(true);
                let navigate = useNavigate();
                blocker = b;
                return (
                  <div>
                    <NavLink to="/" replace>
                      Home
                    </NavLink>
                    <NavLink to="/about" replace>
                      About
                    </NavLink>
                    <button data-action="back" onClick={() => navigate(-1)}>
                      Go Back
                    </button>
                    <Outlet />
                  </div>
                );
              }),
              children: [
                {
                  path: "/",
                  element: <h1>Home</h1>,
                },
                {
                  path: "/about",
                  element: <h1>About</h1>,
                  loader: slowLoader,
                },
                {
                  path: "/contact",
                  element: <h1>Contact</h1>,
                },
              ],
            },
          ],
          {
            initialEntries,
            initialIndex,
          }
        );
        act(() => {
          root = ReactDOM.createRoot(node);
          root.render(<RouterProvider router={router} />);
        });
      });

      afterEach(() => {
        act(() => root.unmount());
      });

      it("does not navigate", async () => {
        await act(async () => {
          click(node.querySelector("[data-action='back']"));
          await sleep(LOADER_LATENCY_MS);
        });
        let h1 = node.querySelector("h1");
        expect(h1?.textContent).not.toBe("About");
      });

      it("gets a 'blocked' blocker after navigation starts", async () => {
        act(() => {
          click(node.querySelector("[data-action='back']"));
        });
        expect(blocker).toEqual({
          state: "blocked",
          proceed: expect.any(Function),
          reset: expect.any(Function),
          location: expect.any(Object),
        });
      });

      it("gets a 'blocked' blocker after navigation promise resolves", async () => {
        await act(async () => {
          click(node.querySelector("[data-action='back']"));
          await sleep(LOADER_LATENCY_MS);
        });
        expect(blocker).toEqual({
          state: "blocked",
          proceed: expect.any(Function),
          reset: expect.any(Function),
          location: expect.any(Object),
        });
      });
    });

    describe("exiting from blocked state", () => {
      beforeEach(() => {
        let initialEntries = ["/", "/about", "/contact"];
        let initialIndex = 2;
        router = createMemoryRouter(
          [
            {
              element: React.createElement(() => {
                let b = useBlocker(true);
                let navigate = useNavigate();
                blocker = b;
                return (
                  <div>
                    <NavLink to="/" replace>
                      Home
                    </NavLink>
                    <NavLink to="/about" replace>
                      About
                    </NavLink>
                    <button data-action="back" onClick={() => navigate(-1)}>
                      Go Back
                    </button>
                    {b.state === "blocked" && (
                      <div>
                        <button data-action="proceed" onClick={b.proceed}>
                          Proceed
                        </button>
                        <button data-action="reset" onClick={b.reset}>
                          Reset
                        </button>
                      </div>
                    )}
                    <Outlet />
                  </div>
                );
              }),
              children: [
                {
                  path: "/",
                  element: <h1>Home</h1>,
                },
                {
                  path: "/about",
                  element: <h1>About</h1>,
                  loader: slowLoader,
                },
                {
                  path: "/contact",
                  element: <h1>Contact</h1>,
                },
              ],
            },
          ],
          {
            initialEntries,
            initialIndex,
          }
        );
        act(() => {
          root = ReactDOM.createRoot(node);
          root.render(<RouterProvider router={router} />);
        });
      });

      afterEach(() => {
        act(() => root.unmount());
      });

      it("gets a 'proceeding' blocker after proceeding navigation starts", async () => {
        act(() => {
          click(node.querySelector("[data-action='back']"));
        });
        expect(node.innerHTML).toContain("<h1>Contact</h1>");
        await act(async () => {
          click(node.querySelector("[data-action='proceed']"));
          expect([...router.state.blockers.values()][0]).toEqual({
            state: "proceeding",
            proceed: undefined,
            reset: undefined,
            location: expect.any(Object),
          });
          await sleep(LOADER_LATENCY_MS);
        });
        expect(node.innerHTML).toContain("<h1>About</h1>");
        expect(blocker).toEqual({
          state: "unblocked",
          proceed: undefined,
          reset: undefined,
          location: undefined,
        });
      });

      it("gets an 'unblocked' blocker after proceeding navigation completes", async () => {
        act(() => {
          click(node.querySelector("[data-action='back']"));
        });
        await act(async () => {
          click(node.querySelector("[data-action='proceed']"));
          await sleep(LOADER_LATENCY_MS);
        });
        expect(blocker).toEqual({
          state: "unblocked",
          proceed: undefined,
          reset: undefined,
          location: undefined,
        });
      });

      it("navigates after proceeding navigation completes", async () => {
        act(() => {
          click(node.querySelector("[data-action='back']"));
        });
        await act(async () => {
          click(node.querySelector("[data-action='proceed']"));
          await sleep(LOADER_LATENCY_MS);
        });
        let h1 = node.querySelector("h1");
        expect(h1?.textContent).toBe("About");
      });

      it("gets an 'unblocked' blocker after resetting navigation", async () => {
        act(() => {
          click(node.querySelector("[data-action='back']"));
        });
        act(() => {
          click(node.querySelector("[data-action='reset']"));
        });
        expect(blocker).toEqual({
          state: "unblocked",
          proceed: undefined,
          reset: undefined,
          location: undefined,
        });
      });

      it("stays at current location after resetting", async () => {
        act(() => {
          click(node.querySelector("[data-action='back']"));
        });
        await act(async () => {
          click(node.querySelector("[data-action='reset']"));
          // wait for '/about' loader so we catch failure if navigation proceeds
          await sleep(LOADER_LATENCY_MS);
        });
        let h1 = node.querySelector("h1");
        expect(h1?.textContent).toBe("Contact");
      });
    });
  });
});

function sleep(n: number = 500) {
  return new Promise<void>((r) => setTimeout(r, n));
}

function click(target: EventTarget | null | undefined) {
  target?.dispatchEvent(
    new MouseEvent("click", {
      view: window,
      bubbles: true,
      cancelable: true,
    })
  );
}
