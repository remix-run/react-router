import * as React from "react";
import {
  act,
  render,
  fireEvent,
  waitFor,
  screen,
  prettyDOM,
  queryByText,
} from "@testing-library/react";
import "@testing-library/jest-dom";
import type { ErrorResponse, FormMethod } from "@remix-run/router";
import { joinPaths } from "@remix-run/router";
import {
  Await,
  MemoryRouter,
  Route,
  Routes,
  RouterProvider,
  Outlet,
  createMemoryRouter,
  createRoutesFromElements,
  defer,
  redirect,
  useActionData,
  useAsyncError,
  useAsyncValue,
  useLoaderData,
  useLocation,
  useMatches,
  useRouteLoaderData,
  useRouteError,
  useNavigation,
  useRevalidator,
  UNSAFE_DataRouterContext as DataRouterContext,
  useFetcher,
  useFetchers,
  useSubmit,
  useNavigate,
} from "react-router";

describe("createMemoryRouter", () => {
  let consoleWarn: jest.SpyInstance;
  let consoleError: jest.SpyInstance;

  beforeEach(() => {
    consoleWarn = jest.spyOn(console, "warn").mockImplementation(() => {});
    consoleError = jest.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    consoleWarn.mockRestore();
    consoleError.mockRestore();
  });

  it("renders the first route that matches the URL (element)", () => {
    let router = createMemoryRouter(
      createRoutesFromElements(<Route path="/" element={<h1>Home</h1>} />)
    );
    let { container } = render(<RouterProvider router={router} />);

    expect(getHtml(container)).toMatchInlineSnapshot(`
      "<div>
        <h1>
          Home
        </h1>
      </div>"
    `);
  });

  it("renders the first route that matches the URL (Component)", () => {
    let router = createMemoryRouter(
      createRoutesFromElements(
        <Route path="/" Component={() => <h1>Home</h1>} />
      )
    );
    let { container } = render(<RouterProvider router={router} />);

    expect(getHtml(container)).toMatchInlineSnapshot(`
      "<div>
        <h1>
          Home
        </h1>
      </div>"
    `);
  });

  it("supports a `routes` prop instead of <Route /> children", () => {
    let router = createMemoryRouter([
      {
        path: "/",
        element: <h1>Home</h1>,
      },
    ]);
    let { container } = render(<RouterProvider router={router} />);

    expect(getHtml(container)).toMatchInlineSnapshot(`
      "<div>
        <h1>
          Home
        </h1>
      </div>"
    `);
  });

  it("renders the first route that matches the URL when wrapped in a root route", () => {
    let router = createMemoryRouter(
      createRoutesFromElements(
        <Route path="/my/base/path">
          <Route path="thing" element={<h1>Heyooo</h1>} />
        </Route>
      ),
      {
        initialEntries: ["/my/base/path/thing"],
      }
    );
    let { container } = render(<RouterProvider router={router} />);

    expect(getHtml(container)).toMatchInlineSnapshot(`
      "<div>
        <h1>
          Heyooo
        </h1>
      </div>"
    `);
  });

  it("supports a basename prop", () => {
    let router = createMemoryRouter(
      createRoutesFromElements(
        <Route path="thing" element={<h1>Heyooo</h1>} />
      ),
      {
        basename: "/my/base/path",
        initialEntries: ["/my/base/path/thing"],
      }
    );
    let { container } = render(<RouterProvider router={router} />);

    expect(getHtml(container)).toMatchInlineSnapshot(`
      "<div>
        <h1>
          Heyooo
        </h1>
      </div>"
    `);
  });

  it("prepends basename to loader/action redirects", async () => {
    let router = createMemoryRouter(
      createRoutesFromElements(
        <Route path="/" element={<Root />}>
          <Route path="thing" loader={() => redirect("/other")} />
          <Route path="other" element={<h1>Other</h1>} />
        </Route>
      ),
      {
        basename: "/my/base/path",
        initialEntries: ["/my/base/path"],
      }
    );
    let { container } = render(<RouterProvider router={router} />);

    function Root() {
      return (
        <>
          <MemoryNavigate to="/thing">Link to thing</MemoryNavigate>
          <Outlet />
        </>
      );
    }

    expect(getHtml(container)).toMatchInlineSnapshot(`
      "<div>
        <a
          href="/my/base/path/thing"
        >
          Link to thing
        </a>
      </div>"
    `);

    fireEvent.click(screen.getByText("Link to thing"));
    await waitFor(() => screen.getByText("Other"));
    expect(getHtml(container)).toMatchInlineSnapshot(`
      "<div>
        <a
          href="/my/base/path/thing"
        >
          Link to thing
        </a>
        <h1>
          Other
        </h1>
      </div>"
    `);
  });

  it("supports relative routing in loader/action redirects", async () => {
    let router = createMemoryRouter(
      createRoutesFromElements(
        <Route path="/" element={<Root />}>
          <Route path="parent" element={<Parent />}>
            <Route path="child" loader={() => redirect("../other")} />
            <Route path="other" element={<h2>Other</h2>} />
          </Route>
        </Route>
      ),
      {
        basename: "/my/base/path",
        initialEntries: ["/my/base/path"],
      }
    );
    let { container } = render(<RouterProvider router={router} />);

    function Root() {
      return (
        <>
          <MemoryNavigate to="/parent/child">Link to child</MemoryNavigate>
          <Outlet />
        </>
      );
    }

    function Parent() {
      return (
        <>
          <h1>Parent</h1>
          <Outlet />
        </>
      );
    }

    expect(getHtml(container)).toMatchInlineSnapshot(`
      "<div>
        <a
          href="/my/base/path/parent/child"
        >
          Link to child
        </a>
      </div>"
    `);

    fireEvent.click(screen.getByText("Link to child"));
    await waitFor(() => screen.getByText("Parent"));
    expect(getHtml(container)).toMatchInlineSnapshot(`
      "<div>
        <a
          href="/my/base/path/parent/child"
        >
          Link to child
        </a>
        <h1>
          Parent
        </h1>
        <h2>
          Other
        </h2>
      </div>"
    `);
  });

  it("renders with hydration data", async () => {
    let router = createMemoryRouter(
      createRoutesFromElements(
        <Route path="/" element={<Comp />}>
          <Route path="child" element={<Comp />} />
        </Route>
      ),
      {
        initialEntries: ["/child"],
        hydrationData: {
          loaderData: {
            "0": "parent data",
            "0-0": "child data",
          },
          actionData: {
            "0-0": "child action",
          },
        },
      }
    );
    let { container } = render(<RouterProvider router={router} />);

    function Comp() {
      let data = useLoaderData() as { message: string };
      let actionData = useActionData();
      let navigation = useNavigation();
      return (
        <div>
          <>{data}</>
          <>{actionData}</>
          <>{navigation.state}</>
          <Outlet />
        </div>
      );
    }

    expect(getHtml(container)).toMatchInlineSnapshot(`
      "<div>
        <div>
          parent data
          child action
          idle
          <div>
            child data
            child action
            idle
          </div>
        </div>
      </div>"
    `);
  });

  it("renders fallbackElement while first data fetch happens", async () => {
    let fooDefer = createDeferred();
    let router = createMemoryRouter(
      createRoutesFromElements(
        <Route path="/" element={<Outlet />}>
          <Route path="foo" loader={() => fooDefer.promise} element={<Foo />} />
          <Route path="bar" element={<Bar />} />
        </Route>
      ),
      {
        initialEntries: ["/foo"],
      }
    );
    let { container } = render(
      <RouterProvider router={router} fallbackElement={<FallbackElement />} />
    );

    function FallbackElement() {
      return <p>Loading...</p>;
    }

    function Foo() {
      let data = useLoaderData() as { message: string };
      return <h1>Foo:{data?.message}</h1>;
    }

    function Bar() {
      return <h1>Bar Heading</h1>;
    }

    expect(getHtml(container)).toMatchInlineSnapshot(`
      "<div>
        <p>
          Loading...
        </p>
      </div>"
    `);

    fooDefer.resolve({ message: "From Foo Loader" });
    await waitFor(() => screen.getByText("Foo:From Foo Loader"));
    expect(getHtml(container)).toMatchInlineSnapshot(`
      "<div>
        <h1>
          Foo:
          From Foo Loader
        </h1>
      </div>"
    `);
  });

  it("renders a null fallbackElement if none is provided", async () => {
    let fooDefer = createDeferred();
    let router = createMemoryRouter(
      createRoutesFromElements(
        <Route path="/" element={<Outlet />}>
          <Route path="foo" loader={() => fooDefer.promise} element={<Foo />} />
          <Route path="bar" element={<Bar />} />
        </Route>
      ),
      {
        initialEntries: ["/foo"],
      }
    );
    let { container } = render(<RouterProvider router={router} />);

    function Foo() {
      let data = useLoaderData() as { message: string };
      return <h1>Foo:{data?.message}</h1>;
    }

    function Bar() {
      return <h1>Bar Heading</h1>;
    }

    expect(getHtml(container)).toMatchInlineSnapshot(`"<div />"`);

    fooDefer.resolve({ message: "From Foo Loader" });
    await waitFor(() => screen.getByText("Foo:From Foo Loader"));
    expect(getHtml(container)).toMatchInlineSnapshot(`
      "<div>
        <h1>
          Foo:
          From Foo Loader
        </h1>
      </div>"
    `);
  });

  it("does not render fallbackElement if no data fetch is required", async () => {
    let fooDefer = createDeferred();

    let router = createMemoryRouter(
      createRoutesFromElements(
        <Route path="/" element={<Outlet />}>
          <Route path="foo" loader={() => fooDefer.promise} element={<Foo />} />
          <Route path="bar" element={<Bar />} />
        </Route>
      ),
      {
        initialEntries: ["/bar"],
      }
    );
    let { container } = render(
      <RouterProvider router={router} fallbackElement={<FallbackElement />} />
    );

    function FallbackElement() {
      return <p>Loading...</p>;
    }

    function Foo() {
      let data = useLoaderData() as { message: string };
      return <h1>Foo:{data?.message}</h1>;
    }

    function Bar() {
      return <h1>Bar Heading</h1>;
    }

    expect(getHtml(container)).toMatchInlineSnapshot(`
      "<div>
        <h1>
          Bar Heading
        </h1>
      </div>"
    `);
  });

  it("renders fallbackElement within router contexts", async () => {
    let fooDefer = createDeferred();
    let router = createMemoryRouter(
      createRoutesFromElements(
        <Route path="/" element={<Outlet />}>
          <Route path="foo" loader={() => fooDefer.promise} element={<Foo />} />
        </Route>
      ),
      { initialEntries: ["/foo"] }
    );
    let { container } = render(
      <RouterProvider router={router} fallbackElement={<FallbackElement />} />
    );

    function FallbackElement() {
      let location = useLocation();
      return (
        <>
          <p>Loading{location.pathname}</p>
        </>
      );
    }

    function Foo() {
      let data = useLoaderData() as { message: string };
      return <h1>Foo:{data?.message}</h1>;
    }

    expect(getHtml(container)).toMatchInlineSnapshot(`
      "<div>
        <p>
          Loading
          /foo
        </p>
      </div>"
    `);

    fooDefer.resolve({ message: "From Foo Loader" });
    await waitFor(() => screen.getByText("Foo:From Foo Loader"));
    expect(getHtml(container)).toMatchInlineSnapshot(`
      "<div>
        <h1>
          Foo:
          From Foo Loader
        </h1>
      </div>"
    `);
  });

  it("handles link navigations", async () => {
    let router = createMemoryRouter(
      createRoutesFromElements(
        <Route path="/" element={<Layout />}>
          <Route path="foo" element={<Foo />} />
          <Route path="bar" element={<Bar />} />
        </Route>
      ),
      { initialEntries: ["/foo"] }
    );
    render(<RouterProvider router={router} />);

    function Layout() {
      return (
        <div>
          <MemoryNavigate to="/foo">Link to Foo</MemoryNavigate>
          <MemoryNavigate to="/bar">Link to Bar</MemoryNavigate>
          <Outlet />
        </div>
      );
    }

    function Foo() {
      return <h1>Foo Heading</h1>;
    }

    function Bar() {
      return <h1>Bar Heading</h1>;
    }

    expect(screen.getByText("Foo Heading")).toBeDefined();
    fireEvent.click(screen.getByText("Link to Bar"));
    await waitFor(() => screen.getByText("Bar Heading"));

    fireEvent.click(screen.getByText("Link to Foo"));
    await waitFor(() => screen.getByText("Foo Heading"));
  });

  it("executes route loaders on navigation", async () => {
    let barDefer = createDeferred();
    let router = createMemoryRouter(
      createRoutesFromElements(
        <Route path="/" element={<Layout />}>
          <Route path="foo" element={<Foo />} />
          <Route path="bar" loader={() => barDefer.promise} element={<Bar />} />
        </Route>
      ),
      { initialEntries: ["/foo"] }
    );
    let { container } = render(<RouterProvider router={router} />);

    function Layout() {
      let navigation = useNavigation();
      return (
        <div>
          <MemoryNavigate to="/bar">Link to Bar</MemoryNavigate>
          <p>{navigation.state}</p>
          <Outlet />
        </div>
      );
    }

    function Foo() {
      return <h1>Foo</h1>;
    }
    function Bar() {
      let data = useLoaderData() as { message: string };
      return <h1>{data?.message}</h1>;
    }

    expect(getHtml(container)).toMatchInlineSnapshot(`
      "<div>
        <div>
          <a
            href="/bar"
          >
            Link to Bar
          </a>
          <p>
            idle
          </p>
          <h1>
            Foo
          </h1>
        </div>
      </div>"
    `);

    fireEvent.click(screen.getByText("Link to Bar"));
    expect(getHtml(container)).toMatchInlineSnapshot(`
      "<div>
        <div>
          <a
            href="/bar"
          >
            Link to Bar
          </a>
          <p>
            loading
          </p>
          <h1>
            Foo
          </h1>
        </div>
      </div>"
    `);

    barDefer.resolve({ message: "Bar Loader" });
    await waitFor(() => screen.getByText("idle"));
    expect(getHtml(container)).toMatchInlineSnapshot(`
      "<div>
        <div>
          <a
            href="/bar"
          >
            Link to Bar
          </a>
          <p>
            idle
          </p>
          <h1>
            Bar Loader
          </h1>
        </div>
      </div>"
    `);
  });

  it("executes route actions/loaders on submission navigations", async () => {
    let barDefer = createDeferred();
    let barActionDefer = createDeferred();

    let router = createMemoryRouter(
      createRoutesFromElements(
        <Route path="/" element={<Layout />}>
          <Route path="foo" element={<Foo />} />
          <Route
            path="bar"
            action={() => barActionDefer.promise}
            loader={() => barDefer.promise}
            element={<Bar />}
          />
        </Route>
      ),
      { initialEntries: ["/foo"] }
    );
    let { container } = render(<RouterProvider router={router} />);

    function Layout() {
      let navigation = useNavigation();
      return (
        <div>
          <MemoryNavigate
            to="/bar"
            formMethod="post"
            payload={{ key: "value" }}
          >
            Post to Bar
          </MemoryNavigate>
          <p>{navigation.state}</p>
          <Outlet />
        </div>
      );
    }

    function Foo() {
      return <h1>Foo</h1>;
    }
    function Bar() {
      let data = useLoaderData() as { message: string };
      let actionData = useActionData();
      return (
        <h1>
          <>{data}</>
          <>{actionData}</>
        </h1>
      );
    }

    expect(getHtml(container)).toMatchInlineSnapshot(`
      "<div>
        <div>
          <form>
            Post to Bar
          </form>
          <p>
            idle
          </p>
          <h1>
            Foo
          </h1>
        </div>
      </div>"
    `);

    fireEvent.click(screen.getByText("Post to Bar"));
    expect(getHtml(container)).toMatchInlineSnapshot(`
      "<div>
        <div>
          <form>
            Post to Bar
          </form>
          <p>
            submitting
          </p>
          <h1>
            Foo
          </h1>
        </div>
      </div>"
    `);

    barActionDefer.resolve("Bar Action");
    await waitFor(() => screen.getByText("loading"));
    expect(getHtml(container)).toMatchInlineSnapshot(`
      "<div>
        <div>
          <form>
            Post to Bar
          </form>
          <p>
            loading
          </p>
          <h1>
            Foo
          </h1>
        </div>
      </div>"
    `);

    barDefer.resolve("Bar Loader");
    await waitFor(() => screen.getByText("idle"));
    expect(getHtml(container)).toMatchInlineSnapshot(`
      "<div>
        <div>
          <form>
            Post to Bar
          </form>
          <p>
            idle
          </p>
          <h1>
            Bar Loader
            Bar Action
          </h1>
        </div>
      </div>"
    `);
  });

  it("provides useMatches", async () => {
    let spy = jest.fn();

    let router = createMemoryRouter(
      createRoutesFromElements(
        <Route path="/" element={<Layout />}>
          <Route
            path="foo"
            loader={async () => "FOO LOADER"}
            element={<Foo />}
          />
          <Route
            path="bar"
            loader={async () => "BAR LOADER"}
            element={<Bar />}
            handle={{ key: "value" }}
          />
        </Route>
      )
    );
    render(<RouterProvider router={router} />);

    function Layout() {
      spy("Layout", useMatches());
      return (
        <>
          <MemoryNavigate to="/bar">Link to Bar</MemoryNavigate>
          <Outlet />
        </>
      );
    }

    function Foo() {
      spy("Foo", useMatches());
      return <h1>Foo</h1>;
    }

    function Bar() {
      spy("Bar", useMatches());
      return <h1>Bar</h1>;
    }

    expect(spy).toHaveBeenCalledWith("Layout", [
      {
        data: undefined,
        handle: undefined,
        id: "0",
        params: {},
        pathname: "/",
      },
    ]);

    spy.mockClear();
    fireEvent.click(screen.getByText("Link to Bar"));
    expect(spy).toHaveBeenCalledWith("Layout", [
      {
        data: undefined,
        handle: undefined,
        id: "0",
        params: {},
        pathname: "/",
      },
    ]);

    spy.mockClear();
    await waitFor(() => screen.getByText("Bar"));
    expect(spy).toHaveBeenCalledWith("Layout", [
      {
        data: undefined,
        handle: undefined,
        id: "0",
        params: {},
        pathname: "/",
      },
      {
        data: "BAR LOADER",
        handle: {
          key: "value",
        },
        id: "0-1",
        params: {},
        pathname: "/bar",
      },
    ]);
  });

  it("provides useRouteLoaderData", async () => {
    let spy = jest.fn();

    let router = createMemoryRouter(
      createRoutesFromElements(
        <Route id="layout" path="/" element={<Layout />}>
          <Route
            id="foo"
            path="foo"
            loader={async () => "FOO2"}
            element={<h2>Foo</h2>}
          />
          <Route id="bar" path="bar" element={<Outlet />}>
            <Route
              id="child"
              path="child"
              loader={async () => "CHILD"}
              element={<h2>Child</h2>}
            />
          </Route>
        </Route>
      ),
      {
        initialEntries: ["/foo"],
        hydrationData: {
          loaderData: {
            foo: "FOO",
          },
        },
      }
    );
    let { container } = render(<RouterProvider router={router} />);

    function Layout() {
      spy({
        layout: useRouteLoaderData("layout"),
        foo: useRouteLoaderData("foo"),
        bar: useRouteLoaderData("bar"),
        child: useRouteLoaderData("child"),
      });
      return (
        <>
          <MemoryNavigate to="/bar/child">Link to Child</MemoryNavigate>
          <Outlet />
        </>
      );
    }

    expect(spy).toHaveBeenCalledWith({
      layout: undefined,
      foo: "FOO",
      bar: undefined,
      child: undefined,
    });
    expect(getHtml(container)).toMatchInlineSnapshot(`
      "<div>
        <a
          href="/bar/child"
        >
          Link to Child
        </a>
        <h2>
          Foo
        </h2>
      </div>"
    `);

    spy.mockClear();
    fireEvent.click(screen.getByText("Link to Child"));
    await waitFor(() => screen.getByText("Child"));

    expect(getHtml(container)).toMatchInlineSnapshot(`
      "<div>
        <a
          href="/bar/child"
        >
          Link to Child
        </a>
        <h2>
          Child
        </h2>
      </div>"
    `);
    expect(spy).toHaveBeenCalledWith({
      layout: undefined,
      foo: undefined,
      bar: undefined,
      child: "CHILD",
    });
  });

  it("reloads data using useRevalidator", async () => {
    let count = 1;
    let router = createMemoryRouter(
      createRoutesFromElements(
        <Route path="/" element={<Layout />}>
          <Route
            path="foo"
            loader={async () => `count=${++count}`}
            element={<Foo />}
          />
        </Route>
      ),
      {
        initialEntries: ["/foo"],
        hydrationData: {
          loaderData: {
            "0-0": "count=1",
          },
        },
      }
    );
    let { container } = render(<RouterProvider router={router} />);

    function Layout() {
      let navigation = useNavigation();
      let { revalidate, state } = useRevalidator();
      return (
        <div>
          <button onClick={() => revalidate()}>Revalidate</button>
          <p>{navigation.state}</p>
          <p>{state}</p>
          <Outlet />
        </div>
      );
    }

    function Foo() {
      let data = useLoaderData() as string;
      return <p>{data}</p>;
    }

    expect(getHtml(container)).toMatchInlineSnapshot(`
      "<div>
        <div>
          <button>
            Revalidate
          </button>
          <p>
            idle
          </p>
          <p>
            idle
          </p>
          <p>
            count=1
          </p>
        </div>
      </div>"
    `);

    fireEvent.click(screen.getByText("Revalidate"));
    expect(getHtml(container)).toMatchInlineSnapshot(`
      "<div>
        <div>
          <button>
            Revalidate
          </button>
          <p>
            idle
          </p>
          <p>
            loading
          </p>
          <p>
            count=1
          </p>
        </div>
      </div>"
    `);

    await waitFor(() => screen.getByText("count=2"));
    expect(getHtml(container)).toMatchInlineSnapshot(`
      "<div>
        <div>
          <button>
            Revalidate
          </button>
          <p>
            idle
          </p>
          <p>
            idle
          </p>
          <p>
            count=2
          </p>
        </div>
      </div>"
    `);
  });

  it("renders descendent routes inside a data router", () => {
    let router = createMemoryRouter(
      createRoutesFromElements(
        <Route path="/deep">
          <Route path="path/*" element={<Child />} />
        </Route>
      ),
      {
        initialEntries: ["/deep/path/to/descendant/routes"],
      }
    );
    let { container } = render(<RouterProvider router={router} />);

    function GrandChild() {
      return (
        <Routes>
          <Route path="descendant">
            <Route
              path="routes"
              element={<h1>👋 Hello from the other side!</h1>}
            />
          </Route>
        </Routes>
      );
    }

    function Child() {
      return (
        <Routes>
          <Route path="to/*" element={<GrandChild />} />
        </Routes>
      );
    }

    expect(getHtml(container)).toMatchInlineSnapshot(`
      "<div>
        <h1>
          👋 Hello from the other side!
        </h1>
      </div>"
    `);
  });

  it("renders <Routes> alongside a data router ErrorBoundary", () => {
    let router = createMemoryRouter(
      [
        {
          path: "*",
          Component() {
            return (
              <>
                <Outlet />
                <Routes>
                  <Route index element={<h1>Descendant</h1>} />
                </Routes>
              </>
            );
          },
          children: [
            {
              id: "index",
              index: true,
              Component: () => <h1>Child</h1>,
              ErrorBoundary() {
                return <p>{(useRouteError() as Error).message}</p>;
              },
            },
          ],
        },
      ],
      {
        initialEntries: ["/"],
        hydrationData: {
          errors: {
            index: new Error("Broken!"),
          },
        },
      }
    );
    let { container } = render(<RouterProvider router={router} />);

    expect(getHtml(container)).toMatchInlineSnapshot(`
      "<div>
        <p>
          Broken!
        </p>
        <h1>
          Descendant
        </h1>
      </div>"
    `);
  });

  describe("useSubmit", () => {
    it("executes route actions/loaders on useSubmit navigations", async () => {
      let loaderDefer = createDeferred();
      let actionDefer = createDeferred();

      let router = createMemoryRouter(
        createRoutesFromElements(
          <Route
            path="/"
            action={() => actionDefer.promise}
            loader={() => loaderDefer.promise}
            element={<Home />}
          />
        ),
        {
          hydrationData: { loaderData: { "0": null } },
        }
      );
      let { container } = render(<RouterProvider router={router} />);

      function Home() {
        let data = useLoaderData() as string;
        let actionData = useActionData() as string | undefined;
        let navigation = useNavigation();
        let submit = useSubmit();
        return (
          <div>
            <button
              onClick={() => submit({ key: "value" }, { method: "post" })}
            >
              Submit Form
            </button>
            <div id="output">
              <p>{navigation.state}</p>
              <p>{data}</p>
              <p>{actionData}</p>
            </div>
            <Outlet />
          </div>
        );
      }

      expect(getHtml(container.querySelector("#output")!))
        .toMatchInlineSnapshot(`
        "<div
          id="output"
        >
          <p>
            idle
          </p>
          <p />
          <p />
        </div>"
      `);

      fireEvent.click(screen.getByText("Submit Form"));
      await waitFor(() => screen.getByText("submitting"));
      expect(getHtml(container.querySelector("#output")!))
        .toMatchInlineSnapshot(`
        "<div
          id="output"
        >
          <p>
            submitting
          </p>
          <p />
          <p />
        </div>"
      `);

      actionDefer.resolve("Action Data");
      await waitFor(() => screen.getByText("loading"));
      expect(getHtml(container.querySelector("#output")!))
        .toMatchInlineSnapshot(`
        "<div
          id="output"
        >
          <p>
            loading
          </p>
          <p />
          <p>
            Action Data
          </p>
        </div>"
      `);

      loaderDefer.resolve("Loader Data");
      await waitFor(() => screen.getByText("idle"));
      expect(getHtml(container.querySelector("#output")!))
        .toMatchInlineSnapshot(`
        "<div
          id="output"
        >
          <p>
            idle
          </p>
          <p>
            Loader Data
          </p>
          <p>
            Action Data
          </p>
        </div>"
      `);
    });

    it("executes lazy route actions/loaders on useSubmit navigations", async () => {
      let loaderDefer = createDeferred();
      let actionDefer = createDeferred();

      let router = createMemoryRouter(
        createRoutesFromElements(
          <Route path="/" element={<Home />}>
            <Route index element={<h1>Home</h1>} />
            <Route
              path="action"
              lazy={async () => ({
                action: () => actionDefer.promise,
                loader: () => loaderDefer.promise,
                element: <h1>Action</h1>,
              })}
            />
          </Route>
        ),
        {}
      );
      let { container } = render(<RouterProvider router={router} />);

      function Home() {
        let data = useMatches().pop()?.data as string | undefined;
        let actionData = useActionData() as string | undefined;
        let navigation = useNavigation();
        let submit = useSubmit();
        return (
          <div>
            <button
              onClick={() =>
                submit({ key: "value" }, { method: "post", action: "/action" })
              }
            >
              Submit Form
            </button>
            <div id="output">
              <p>{navigation.state}</p>
              <p>{data}</p>
              <p>{actionData}</p>
              <Outlet />
            </div>
          </div>
        );
      }

      await waitFor(() => screen.getByText("idle"));
      expect(getHtml(container.querySelector("#output")!))
        .toMatchInlineSnapshot(`
        "<div
          id="output"
        >
          <p>
            idle
          </p>
          <p />
          <p />
          <h1>
            Home
          </h1>
        </div>"
      `);

      fireEvent.click(screen.getByText("Submit Form"));
      await waitFor(() => screen.getByText("submitting"));
      expect(getHtml(container.querySelector("#output")!))
        .toMatchInlineSnapshot(`
        "<div
          id="output"
        >
          <p>
            submitting
          </p>
          <p />
          <p />
          <h1>
            Home
          </h1>
        </div>"
      `);

      actionDefer.resolve("Action Data");
      await waitFor(() => screen.getByText("loading"));
      expect(getHtml(container.querySelector("#output")!))
        .toMatchInlineSnapshot(`
        "<div
          id="output"
        >
          <p>
            loading
          </p>
          <p />
          <p>
            Action Data
          </p>
          <h1>
            Home
          </h1>
        </div>"
      `);

      loaderDefer.resolve("Loader Data");
      await waitFor(() => screen.getByText("idle"));
      expect(getHtml(container.querySelector("#output")!))
        .toMatchInlineSnapshot(`
        "<div
          id="output"
        >
          <p>
            idle
          </p>
          <p>
            Loader Data
          </p>
          <p>
            Action Data
          </p>
          <h1>
            Action
          </h1>
        </div>"
      `);
    });

    it('defaults useSubmit({ method: "get" }) to be a PUSH navigation', async () => {
      let router = createMemoryRouter(
        createRoutesFromElements(
          <Route element={<Layout />}>
            <Route index loader={() => "index"} element={<h1>index</h1>} />
            <Route path="1" loader={() => "1"} element={<h1>Page 1</h1>} />
            <Route path="2" loader={() => "2"} element={<h1>Page 2</h1>} />
          </Route>
        ),
        {
          hydrationData: {},
        }
      );
      let { container } = render(<RouterProvider router={router} />);

      function Layout() {
        let navigate = useNavigate();
        let submit = useSubmit();
        let formData = new FormData();
        formData.append("test", "value");
        return (
          <>
            <button
              onClick={() => submit(formData, { action: "1", method: "get" })}
            >
              Submit
            </button>
            <button onClick={() => navigate(-1)}>Go back</button>
            <div className="output">
              <Outlet />
            </div>
          </>
        );
      }

      expect(getHtml(container.querySelector(".output")!))
        .toMatchInlineSnapshot(`
        "<div
          class="output"
        >
          <h1>
            index
          </h1>
        </div>"
      `);

      fireEvent.click(screen.getByText("Submit"));
      await waitFor(() => screen.getByText("Page 1"));
      expect(getHtml(container.querySelector(".output")!))
        .toMatchInlineSnapshot(`
        "<div
          class="output"
        >
          <h1>
            Page 1
          </h1>
        </div>"
      `);

      fireEvent.click(screen.getByText("Go back"));
      await waitFor(() => screen.getByText("index"));
      expect(getHtml(container.querySelector(".output")!))
        .toMatchInlineSnapshot(`
        "<div
          class="output"
        >
          <h1>
            index
          </h1>
        </div>"
      `);
    });

    it('defaults useSubmit({ method: "post" }) to a new location to be a PUSH navigation', async () => {
      let router = createMemoryRouter(
        createRoutesFromElements(
          <Route element={<Layout />}>
            <Route index loader={() => "index"} element={<h1>index</h1>} />
            <Route path="1" loader={() => "1"} element={<h1>Page 1</h1>} />
            <Route
              path="2"
              action={() => "action"}
              loader={() => "2"}
              element={<h1>Page 2</h1>}
            />
          </Route>
        ),
        {
          hydrationData: {},
        }
      );
      let { container } = render(<RouterProvider router={router} />);

      function Layout() {
        let navigate = useNavigate();
        let submit = useSubmit();
        let formData = new FormData();
        formData.append("test", "value");
        return (
          <>
            <MemoryNavigate to="1">Go to 1</MemoryNavigate>
            <button
              onClick={() => {
                submit(formData, { action: "2", method: "post" });
              }}
            >
              Submit
            </button>
            <button onClick={() => navigate(-1)}>Go back</button>
            <div className="output">
              <Outlet />
            </div>
          </>
        );
      }

      expect(getHtml(container.querySelector(".output")!))
        .toMatchInlineSnapshot(`
        "<div
          class="output"
        >
          <h1>
            index
          </h1>
        </div>"
      `);

      fireEvent.click(screen.getByText("Go to 1"));
      await waitFor(() => screen.getByText("Page 1"));
      expect(getHtml(container.querySelector(".output")!))
        .toMatchInlineSnapshot(`
        "<div
          class="output"
        >
          <h1>
            Page 1
          </h1>
        </div>"
      `);

      fireEvent.click(screen.getByText("Submit"));
      await waitFor(() => screen.getByText("Page 2"));
      expect(getHtml(container.querySelector(".output")!))
        .toMatchInlineSnapshot(`
        "<div
          class="output"
        >
          <h1>
            Page 2
          </h1>
        </div>"
      `);

      fireEvent.click(screen.getByText("Go back"));
      await waitFor(() => screen.getByText("Page 1"));
      expect(getHtml(container.querySelector(".output")!))
        .toMatchInlineSnapshot(`
        "<div
          class="output"
        >
          <h1>
            Page 1
          </h1>
        </div>"
      `);
    });

    it('defaults useSubmit({ method: "post" }) to the same location to be a REPLACE navigation', async () => {
      let router = createMemoryRouter(
        createRoutesFromElements(
          <Route element={<Layout />}>
            <Route index loader={() => "index"} element={<h1>index</h1>} />
            <Route
              path="1"
              action={() => "action"}
              loader={() => "1"}
              element={<h1>Page 1</h1>}
            />
          </Route>
        ),
        {
          hydrationData: {},
        }
      );
      let { container } = render(<RouterProvider router={router} />);

      function Layout() {
        let navigate = useNavigate();
        let submit = useSubmit();
        let actionData = useActionData() as string | undefined;
        let formData = new FormData();
        formData.append("test", "value");
        return (
          <>
            <MemoryNavigate to="1">Go to 1</MemoryNavigate>
            <button
              onClick={() => {
                submit(formData, { action: "1", method: "post" });
              }}
            >
              Submit
            </button>
            <button onClick={() => navigate(-1)}>Go back</button>
            <div className="output">
              {actionData ? <p>{actionData}</p> : null}
              <Outlet />
            </div>
          </>
        );
      }

      expect(getHtml(container.querySelector(".output")!))
        .toMatchInlineSnapshot(`
        "<div
          class="output"
        >
          <h1>
            index
          </h1>
        </div>"
      `);

      fireEvent.click(screen.getByText("Go to 1"));
      await waitFor(() => screen.getByText("Page 1"));
      expect(getHtml(container.querySelector(".output")!))
        .toMatchInlineSnapshot(`
        "<div
          class="output"
        >
          <h1>
            Page 1
          </h1>
        </div>"
      `);

      fireEvent.click(screen.getByText("Submit"));
      await waitFor(() => screen.getByText("action"));
      expect(getHtml(container.querySelector(".output")!))
        .toMatchInlineSnapshot(`
        "<div
          class="output"
        >
          <p>
            action
          </p>
          <h1>
            Page 1
          </h1>
        </div>"
      `);

      fireEvent.click(screen.getByText("Go back"));
      await waitFor(() => screen.getByText("index"));
      expect(getHtml(container.querySelector(".output")!))
        .toMatchInlineSnapshot(`
        "<div
          class="output"
        >
          <h1>
            index
          </h1>
        </div>"
      `);
    });

    it("allows direct actions to be passed to useSubmit", async () => {
      let router = createMemoryRouter(
        [
          {
            path: "/",
            Component() {
              let actionData = useActionData() as string | undefined;
              let submit = useSubmit();
              return (
                <>
                  <button
                    onClick={() =>
                      submit(new FormData(), {
                        method: "post",
                        action: () => "ACTION",
                      })
                    }
                  >
                    Submit
                  </button>
                  <p>{actionData || "empty"}</p>
                </>
              );
            },
          },
        ],
        {}
      );
      let { container } = render(<RouterProvider router={router} />);

      expect(getHtml(container)).toMatch("empty");

      fireEvent.click(screen.getByText("Submit"));
      await waitFor(() => screen.getByText("ACTION"));
      expect(getHtml(container)).toMatch("ACTION");
    });

    it("does not serialize on submit(object) submissions", async () => {
      let actionSpy = jest.fn();
      let payload = { a: "1", b: "2" };
      let navigation;
      let router = createMemoryRouter([
        {
          path: "/",
          action: actionSpy,
          Component() {
            let submit = useSubmit();
            let n = useNavigation();
            if (n.state === "submitting") {
              navigation = n;
            }
            return (
              <button onClick={() => submit(payload, { method: "post" })}>
                Submit
              </button>
            );
          },
        },
      ]);
      render(<RouterProvider router={router} />);

      fireEvent.click(screen.getByText("Submit"));
      expect(navigation.formData).toBe(undefined);
      expect(navigation.payload).toBe(payload);
      let { request, payload: actionPayload } = actionSpy.mock.calls[0][0];
      expect(request.headers.get("Content-Type")).toBeNull();
      expect(request.body).toBe(null);
      expect(actionPayload).toBe(payload);
    });

    it("serializes formData on submit(object)/encType:application/x-www-form-urlencoded submissions", async () => {
      let actionSpy = jest.fn();
      let payload = { a: "1", b: "2" };
      let navigation;
      let router = createMemoryRouter([
        {
          path: "/",
          action: actionSpy,
          Component() {
            let submit = useSubmit();
            let n = useNavigation();
            if (n.state === "submitting") {
              navigation = n;
            }
            return (
              <button
                onClick={() =>
                  submit(payload, {
                    method: "post",
                    encType: "application/x-www-form-urlencoded",
                  })
                }
              >
                Submit
              </button>
            );
          },
        },
      ]);
      render(<RouterProvider router={router} />);

      fireEvent.click(screen.getByText("Submit"));
      expect(navigation.formData).toBeUndefined();
      expect(navigation.payload).toBe(payload);
      let { request, payload: actionPayload } = actionSpy.mock.calls[0][0];
      expect(request.headers.get("Content-Type")).toMatchInlineSnapshot(
        `"application/x-www-form-urlencoded;charset=UTF-8"`
      );
      let actionFormData = await request.formData();
      expect(actionFormData.get("a")).toBe("1");
      expect(actionFormData.get("b")).toBe("2");
      expect(actionPayload).toBe(payload);
    });

    it("serializes JSON on submit(object)/encType:application/json submissions", async () => {
      let actionSpy = jest.fn();
      let payload = { a: "1", b: "2" };
      let navigation;
      let router = createMemoryRouter([
        {
          path: "/",
          action: actionSpy,
          Component() {
            let submit = useSubmit();
            let n = useNavigation();
            if (n.state === "submitting") {
              navigation = n;
            }
            return (
              <button
                onClick={() =>
                  submit(payload, {
                    method: "post",
                    encType: "application/json",
                  })
                }
              >
                Submit
              </button>
            );
          },
        },
      ]);
      render(<RouterProvider router={router} />);

      fireEvent.click(screen.getByText("Submit"));
      expect(navigation.formData).toBe(undefined);
      expect(navigation.payload).toBe(payload);
      let { request, payload: actionPayload } = actionSpy.mock.calls[0][0];
      expect(request.headers.get("Content-Type")).toBe("application/json");
      expect(await request.json()).toEqual({ a: "1", b: "2" });
      expect(actionPayload).toBe(payload);
    });

    it("serializes text on submit(object)/encType:text/plain submissions", async () => {
      let actionSpy = jest.fn();
      let payload = "look ma, no formData!";
      let navigation;
      let router = createMemoryRouter([
        {
          path: "/",
          action: actionSpy,
          Component() {
            let submit = useSubmit();
            let n = useNavigation();
            if (n.state === "submitting") {
              navigation = n;
            }
            return (
              <button
                onClick={() =>
                  submit(payload, {
                    method: "post",
                    encType: "text/plain",
                  })
                }
              >
                Submit
              </button>
            );
          },
        },
      ]);
      render(<RouterProvider router={router} />);

      fireEvent.click(screen.getByText("Submit"));
      expect(navigation.formData).toBe(undefined);
      expect(navigation.payload).toBe(payload);
      let { request, payload: actionPayload } = actionSpy.mock.calls[0][0];
      expect(request.headers.get("Content-Type")).toBe("text/plain");
      expect(await request.text()).toEqual(payload);
      expect(actionPayload).toBe(payload);
    });
  });

  describe("useFetcher(s)", () => {
    it("handles fetcher.load and fetcher.submit", async () => {
      let count = 0;
      let router = createMemoryRouter(
        createRoutesFromElements(
          <Route
            path="/"
            element={<Comp />}
            action={({ payload }) => ({ count: count + payload.increment })}
            loader={async ({ request }) => {
              // Need to add a domain on here in node unit testing so it's a
              // valid URL. When running in the browser the domain is
              // automatically added in new Request()
              let increment =
                new URL(`https://remix.test${request.url}`).searchParams.get(
                  "increment"
                ) || "1";
              count = count + parseInt(increment, 10);
              return { count };
            }}
          />
        ),
        {
          hydrationData: { loaderData: { "0": null } },
        }
      );
      let { container } = render(<RouterProvider router={router} />);

      function Comp() {
        let fetcher = useFetcher();
        return (
          <>
            <p id="output">
              {fetcher.state}
              {fetcher.data ? JSON.stringify(fetcher.data) : null}
            </p>
            <button onClick={() => fetcher.load("/")}>load 1</button>
            <button onClick={() => fetcher.load("/?increment=5")}>
              load 5
            </button>
            <button
              onClick={() =>
                fetcher.submit(
                  { increment: 10 },
                  {
                    method: "post",
                  }
                )
              }
            >
              submit 10
            </button>
          </>
        );
      }

      expect(getHtml(container.querySelector("#output")!))
        .toMatchInlineSnapshot(`
        "<p
          id="output"
        >
          idle
        </p>"
      `);

      fireEvent.click(screen.getByText("load 1"));
      expect(getHtml(container.querySelector("#output")!))
        .toMatchInlineSnapshot(`
        "<p
          id="output"
        >
          loading
        </p>"
      `);

      await waitFor(() => screen.getByText(/idle/));
      expect(getHtml(container.querySelector("#output")!))
        .toMatchInlineSnapshot(`
        "<p
          id="output"
        >
          idle
          {"count":1}
        </p>"
      `);

      fireEvent.click(screen.getByText("load 5"));
      expect(getHtml(container.querySelector("#output")!))
        .toMatchInlineSnapshot(`
        "<p
          id="output"
        >
          loading
          {"count":1}
        </p>"
      `);

      await waitFor(() => screen.getByText(/idle/));
      expect(getHtml(container.querySelector("#output")!))
        .toMatchInlineSnapshot(`
        "<p
          id="output"
        >
          idle
          {"count":6}
        </p>"
      `);

      fireEvent.click(screen.getByText("submit 10"));
      expect(getHtml(container.querySelector("#output")!))
        .toMatchInlineSnapshot(`
        "<p
          id="output"
        >
          submitting
          {"count":6}
        </p>"
      `);

      await waitFor(() => screen.getByText(/idle/));
      expect(getHtml(container.querySelector("#output")!))
        .toMatchInlineSnapshot(`
        "<p
          id="output"
        >
          idle
          {"count":16}
        </p>"
      `);
    });

    it("handles fetcher ?index params", async () => {
      let router = createMemoryRouter(
        createRoutesFromElements(
          <Route
            path="/parent"
            element={<Outlet />}
            action={() => "PARENT ACTION"}
            loader={() => "PARENT LOADER"}
          >
            <Route
              index
              element={<Index />}
              action={() => "INDEX ACTION"}
              loader={() => "INDEX LOADER"}
            />
          </Route>
        ),
        {
          initialEntries: ["/parent"],
          hydrationData: { loaderData: { parent: null, index: null } },
        }
      );
      let { container } = render(<RouterProvider router={router} />);

      function Index() {
        let fetcher = useFetcher();

        return (
          <>
            <p id="output">{fetcher.data}</p>
            <button onClick={() => fetcher.load("/parent")}>Load parent</button>
            <button onClick={() => fetcher.load("/parent?index")}>
              Load index
            </button>
            <button onClick={() => fetcher.submit({})}>Submit empty</button>
            <button
              onClick={() =>
                fetcher.submit({}, { method: "get", action: "/parent" })
              }
            >
              Submit parent get
            </button>
            <button
              onClick={() =>
                fetcher.submit({}, { method: "get", action: "/parent?index" })
              }
            >
              Submit index get
            </button>
            <button
              onClick={() =>
                fetcher.submit({}, { method: "post", action: "/parent" })
              }
            >
              Submit parent post
            </button>
            <button
              onClick={() =>
                fetcher.submit({}, { method: "post", action: "/parent?index" })
              }
            >
              Submit index post
            </button>
          </>
        );
      }

      async function clickAndAssert(btnText: string, expectedOutput: string) {
        fireEvent.click(screen.getByText(btnText));
        await new Promise((r) => setTimeout(r, 1));
        await waitFor(() => screen.getByText(new RegExp(expectedOutput)));
        expect(getHtml(container.querySelector("#output")!)).toContain(
          expectedOutput
        );
      }

      await clickAndAssert("Load parent", "PARENT LOADER");
      await clickAndAssert("Load index", "INDEX LOADER");
      await clickAndAssert("Submit empty", "INDEX LOADER");
      await clickAndAssert("Submit parent get", "PARENT LOADER");
      await clickAndAssert("Submit index get", "INDEX LOADER");
      await clickAndAssert("Submit parent post", "PARENT ACTION");
      await clickAndAssert("Submit index post", "INDEX ACTION");
    });

    it("handles fetcher.load errors", async () => {
      let router = createMemoryRouter(
        createRoutesFromElements(
          <Route
            path="/"
            element={<Comp />}
            errorElement={<ErrorElement />}
            loader={async () => {
              throw new Error("Kaboom!");
            }}
          />
        ),
        {
          hydrationData: { loaderData: { "0": null } },
        }
      );
      let { container } = render(<RouterProvider router={router} />);

      function Comp() {
        let fetcher = useFetcher();
        return (
          <>
            <p>
              {fetcher.state}
              {fetcher.data ? JSON.stringify(fetcher.data) : null}
            </p>
            <button onClick={() => fetcher.load("/")}>load</button>
          </>
        );
      }

      function ErrorElement() {
        let error = useRouteError() as Error;
        return <p>{error.message}</p>;
      }

      expect(getHtml(container)).toMatchInlineSnapshot(`
          "<div>
            <p>
              idle
            </p>
            <button>
              load
            </button>
          </div>"
        `);

      fireEvent.click(screen.getByText("load"));
      expect(getHtml(container)).toMatchInlineSnapshot(`
          "<div>
            <p>
              loading
            </p>
            <button>
              load
            </button>
          </div>"
        `);

      await waitFor(() => screen.getByText("Kaboom!"));
      expect(getHtml(container)).toMatchInlineSnapshot(`
          "<div>
            <p>
              Kaboom!
            </p>
          </div>"
        `);
    });

    it("handles fetcher.load errors (defer)", async () => {
      let dfd = createDeferred();
      let router = createMemoryRouter(
        createRoutesFromElements(
          <Route
            path="/"
            element={<Comp />}
            errorElement={<ErrorElement />}
            loader={() => defer({ value: dfd.promise })}
          />
        ),
        {
          hydrationData: { loaderData: { "0": null } },
        }
      );
      let { container } = render(<RouterProvider router={router} />);

      function Comp() {
        let fetcher = useFetcher();
        return (
          <>
            <p>
              {fetcher.state}
              {fetcher.data ? JSON.stringify(fetcher.data.value) : null}
            </p>
            <button onClick={() => fetcher.load("/")}>load</button>
          </>
        );
      }

      function ErrorElement() {
        let error = useRouteError() as Error;
        return <p>{error.message}</p>;
      }

      expect(getHtml(container)).toMatchInlineSnapshot(`
          "<div>
            <p>
              idle
            </p>
            <button>
              load
            </button>
          </div>"
        `);

      fireEvent.click(screen.getByText("load"));
      expect(getHtml(container)).toMatchInlineSnapshot(`
          "<div>
            <p>
              loading
            </p>
            <button>
              load
            </button>
          </div>"
        `);

      dfd.reject(new Error("Kaboom!"));
      await waitFor(() => screen.getByText("Kaboom!"));
      expect(getHtml(container)).toMatchInlineSnapshot(`
          "<div>
            <p>
              Kaboom!
            </p>
          </div>"
        `);
    });

    it("handles fetcher.submit errors", async () => {
      let router = createMemoryRouter(
        createRoutesFromElements(
          <Route
            path="/"
            element={<Comp />}
            errorElement={<ErrorElement />}
            action={async () => {
              throw new Error("Kaboom!");
            }}
          />
        ),
        {
          hydrationData: { loaderData: { "0": null } },
        }
      );
      let { container } = render(<RouterProvider router={router} />);

      function Comp() {
        let fetcher = useFetcher();
        return (
          <>
            <p>
              {fetcher.state}
              {fetcher.data ? JSON.stringify(fetcher.data) : null}
            </p>
            <button
              onClick={() => fetcher.submit(new FormData(), { method: "post" })}
            >
              submit
            </button>
          </>
        );
      }

      function ErrorElement() {
        let error = useRouteError() as Error;
        return <p>{error.message}</p>;
      }

      expect(getHtml(container)).toMatchInlineSnapshot(`
          "<div>
            <p>
              idle
            </p>
            <button>
              submit
            </button>
          </div>"
        `);

      fireEvent.click(screen.getByText("submit"));
      expect(getHtml(container)).toMatchInlineSnapshot(`
          "<div>
            <p>
              submitting
            </p>
            <button>
              submit
            </button>
          </div>"
        `);

      await waitFor(() => screen.getByText("Kaboom!"));
      expect(getHtml(container)).toMatchInlineSnapshot(`
          "<div>
            <p>
              Kaboom!
            </p>
          </div>"
        `);
    });

    it("does not serialize fetcher.submit(object) calls", async () => {
      let actionSpy = jest.fn();
      let payload = { key: "value" };
      let router = createMemoryRouter(
        [
          {
            path: "/",
            action: actionSpy,
            Component() {
              let fetcher = useFetcher();
              return (
                <button
                  onClick={() => fetcher.submit(payload, { method: "post" })}
                >
                  Submit
                </button>
              );
            },
          },
        ],
        {}
      );

      render(<RouterProvider router={router} />);
      fireEvent.click(screen.getByText("Submit"));
      expect(actionSpy.mock.calls[0][0].payload).toEqual(payload);
      expect(actionSpy.mock.calls[0][0].request.body).toBe(null);
    });

    it("show all fetchers via useFetchers and cleans up fetchers on unmount", async () => {
      let dfd1 = createDeferred();
      let dfd2 = createDeferred();
      let router = createMemoryRouter(
        createRoutesFromElements(
          <Route path="/" element={<Parent />}>
            <Route
              path="/1"
              loader={async () => await dfd1.promise}
              element={<Comp1 />}
            />
            <Route
              path="/2"
              loader={async () => await dfd2.promise}
              element={<Comp2 />}
            />
          </Route>
        ),
        {
          initialEntries: ["/1"],
          hydrationData: { loaderData: { "0": null, "0-0": null } },
        }
      );
      let { container } = render(<RouterProvider router={router} />);

      function Parent() {
        let fetchers = useFetchers();
        return (
          <>
            <MemoryNavigate to="/1">Link to 1</MemoryNavigate>
            <MemoryNavigate to="/2">Link to 2</MemoryNavigate>
            <div id="output">
              <p>{JSON.stringify(fetchers.map((f) => f.state))}</p>
              <Outlet />
            </div>
          </>
        );
      }

      function Comp1() {
        let fetcher = useFetcher();
        return (
          <>
            <p>
              1{fetcher.state}
              {fetcher.data || "null"}
            </p>
            <button onClick={() => fetcher.load("/1")}>load</button>
          </>
        );
      }

      function Comp2() {
        let fetcher = useFetcher();
        return (
          <>
            <p>
              2{fetcher.state}
              {fetcher.data || "null"}
            </p>
            <button onClick={() => fetcher.load("/2")}>load</button>
          </>
        );
      }

      // Initial state - no useFetchers reflected yet
      expect(getHtml(container.querySelector("#output")!))
        .toMatchInlineSnapshot(`
          "<div
            id="output"
          >
            <p>
              []
            </p>
            <p>
              1
              idle
              null
            </p>
            <button>
              load
            </button>
          </div>"
        `);

      // Activate Comp1 fetcher
      fireEvent.click(screen.getByText("load"));
      expect(getHtml(container.querySelector("#output")!))
        .toMatchInlineSnapshot(`
          "<div
            id="output"
          >
            <p>
              ["loading"]
            </p>
            <p>
              1
              loading
              null
            </p>
            <button>
              load
            </button>
          </div>"
        `);

      // Resolve Comp1 fetcher - UI updates
      dfd1.resolve("data 1");
      await waitFor(() => screen.getByText(/data 1/));
      expect(getHtml(container.querySelector("#output")!))
        .toMatchInlineSnapshot(`
          "<div
            id="output"
          >
            <p>
              ["idle"]
            </p>
            <p>
              1
              idle
              data 1
            </p>
            <button>
              load
            </button>
          </div>"
        `);

      // Link to Comp2 - loaders run
      fireEvent.click(screen.getByText("Link to 2"));
      expect(getHtml(container.querySelector("#output")!))
        .toMatchInlineSnapshot(`
          "<div
            id="output"
          >
            <p>
              ["idle"]
            </p>
            <p>
              1
              idle
              data 1
            </p>
            <button>
              load
            </button>
          </div>"
        `);

      // Resolve Comp2 loader and complete navigation - Comp1 fetcher is still
      // reflected here since deleteFetcher doesn't updateState
      // TODO: Is this expected?
      dfd2.resolve("data 2");
      await waitFor(() => screen.getByText(/2.*idle/));
      expect(getHtml(container.querySelector("#output")!))
        .toMatchInlineSnapshot(`
          "<div
            id="output"
          >
            <p>
              ["idle"]
            </p>
            <p>
              2
              idle
              null
            </p>
            <button>
              load
            </button>
          </div>"
        `);

      // Activate Comp2 fetcher, which now officially kicks out Comp1's
      // fetcher from useFetchers and reflects Comp2's fetcher
      fireEvent.click(screen.getByText("load"));
      expect(getHtml(container.querySelector("#output")!))
        .toMatchInlineSnapshot(`
          "<div
            id="output"
          >
            <p>
              ["loading"]
            </p>
            <p>
              2
              loading
              null
            </p>
            <button>
              load
            </button>
          </div>"
        `);

      // Comp2 loader resolves with the same data, useFetchers reflects idle-done
      await waitFor(() => screen.getByText(/2.*idle/));
      expect(getHtml(container.querySelector("#output")!))
        .toMatchInlineSnapshot(`
          "<div
            id="output"
          >
            <p>
              ["idle"]
            </p>
            <p>
              2
              idle
              data 2
            </p>
            <button>
              load
            </button>
          </div>"
        `);
    });

    it("handles revalidating fetchers", async () => {
      let count = 0;
      let fetchCount = 0;
      let router = createMemoryRouter(
        createRoutesFromElements(
          <>
            <Route
              path="/"
              element={<Comp />}
              action={async ({ payload }) => {
                count += payload.increment;
                return { count };
              }}
              loader={async () => ({ count: ++count })}
            />
            <Route
              path="/fetch"
              loader={async () => ({ fetchCount: ++fetchCount })}
            />
          </>
        ),
        {
          hydrationData: { loaderData: { "0": null } },
        }
      );
      let { container } = render(<RouterProvider router={router} />);

      function Comp() {
        let fetcher = useFetcher();
        let submit = useSubmit();
        return (
          <>
            <p id="output">
              {fetcher.state}
              {fetcher.data ? JSON.stringify(fetcher.data) : null}
            </p>
            <button onClick={() => fetcher.load("/fetch")}>load fetcher</button>
            <button
              onClick={() => {
                submit({ increment: 10 }, { method: "post" });
              }}
            >
              submit
            </button>
          </>
        );
      }

      expect(getHtml(container.querySelector("#output")!))
        .toMatchInlineSnapshot(`
          "<p
            id="output"
          >
            idle
          </p>"
        `);

      await act(async () => {
        fireEvent.click(screen.getByText("load fetcher"));
        await waitFor(() => screen.getByText(/idle/));
      });
      expect(getHtml(container.querySelector("#output")!))
        .toMatchInlineSnapshot(`
          "<p
            id="output"
          >
            idle
            {"fetchCount":1}
          </p>"
        `);

      await act(async () => {
        fireEvent.click(screen.getByText("submit"));
        await waitFor(() => screen.getByText(/idle/));
      });
      expect(getHtml(container.querySelector("#output")!))
        .toMatchInlineSnapshot(`
          "<p
            id="output"
          >
            idle
            {"fetchCount":2}
          </p>"
        `);
    });

    it("handles fetcher 404 errors at the correct spot in the route hierarchy", async () => {
      let router = createMemoryRouter(
        createRoutesFromElements(
          <Route path="/" element={<Outlet />} errorElement={<p>Not I!</p>}>
            <Route
              path="child"
              element={<Comp />}
              errorElement={<ErrorElement />}
            />
          </Route>
        ),
        {
          initialEntries: ["/child"],
          hydrationData: { loaderData: { "0": null } },
        }
      );
      let { container } = render(<RouterProvider router={router} />);

      function Comp() {
        let fetcher = useFetcher();
        return <button onClick={() => fetcher.load("/not-found")}>load</button>;
      }

      function ErrorElement() {
        let { status, statusText } = useRouteError() as ErrorResponse;
        return <p>contextual error:{`${status} ${statusText}`}</p>;
      }

      expect(getHtml(container)).toMatchInlineSnapshot(`
          "<div>
            <button>
              load
            </button>
          </div>"
        `);

      fireEvent.click(screen.getByText("load"));
      await waitFor(() => screen.getByText(/Not Found/));
      expect(getHtml(container)).toMatchInlineSnapshot(`
          "<div>
            <p>
              contextual error:
              404 Not Found
            </p>
          </div>"
        `);
    });

    it("handles fetcher.load errors at the correct spot in the route hierarchy", async () => {
      let router = createMemoryRouter(
        createRoutesFromElements(
          <Route path="/" element={<Outlet />} errorElement={<p>Not I!</p>}>
            <Route
              path="child"
              element={<Comp />}
              errorElement={<ErrorElement />}
            />
            <Route
              path="fetch"
              loader={() => {
                throw new Error("Kaboom!");
              }}
              errorElement={<p>Not I!</p>}
            />
          </Route>
        ),
        {
          initialEntries: ["/child"],
          hydrationData: { loaderData: { "0": null } },
        }
      );
      let { container } = render(<RouterProvider router={router} />);

      function Comp() {
        let fetcher = useFetcher();
        return <button onClick={() => fetcher.load("/fetch")}>load</button>;
      }

      function ErrorElement() {
        let error = useRouteError() as Error;
        return <p>contextual error:{error.message}</p>;
      }

      expect(getHtml(container)).toMatchInlineSnapshot(`
          "<div>
            <button>
              load
            </button>
          </div>"
        `);

      fireEvent.click(screen.getByText("load"));
      await waitFor(() => screen.getByText(/Kaboom!/));
      expect(getHtml(container)).toMatchInlineSnapshot(`
          "<div>
            <p>
              contextual error:
              Kaboom!
            </p>
          </div>"
        `);
    });

    it("handles fetcher.submit errors at the correct spot in the route hierarchy", async () => {
      let router = createMemoryRouter(
        createRoutesFromElements(
          <Route path="/" element={<Outlet />} errorElement={<p>Not I!</p>}>
            <Route
              path="child"
              element={<Comp />}
              errorElement={<ErrorElement />}
            />
            <Route
              path="fetch"
              action={() => {
                throw new Error("Kaboom!");
              }}
              errorElement={<p>Not I!</p>}
            />
          </Route>
        ),
        {
          initialEntries: ["/child"],
          hydrationData: { loaderData: { "0": null } },
        }
      );
      let { container } = render(<RouterProvider router={router} />);

      function Comp() {
        let fetcher = useFetcher();
        return (
          <button
            onClick={() =>
              fetcher.submit(
                { key: "value" },
                { method: "post", action: "/fetch" }
              )
            }
          >
            submit
          </button>
        );
      }

      function ErrorElement() {
        let error = useRouteError() as Error;
        return <p>contextual error:{error.message}</p>;
      }

      expect(getHtml(container)).toMatchInlineSnapshot(`
            "<div>
              <button>
                submit
              </button>
            </div>"
          `);

      fireEvent.click(screen.getByText("submit"));
      await waitFor(() => screen.getByText(/Kaboom!/));
      expect(getHtml(container)).toMatchInlineSnapshot(`
            "<div>
              <p>
                contextual error:
                Kaboom!
              </p>
            </div>"
          `);
    });

    it("useFetcher is stable across across location changes", async () => {
      let router = createMemoryRouter(
        [
          {
            path: "/",
            Component() {
              let [count, setCount] = React.useState(0);
              let location = useLocation();
              let navigate = useNavigate();
              let fetcher = useFetcher();
              let fetcherCount = React.useRef(0);
              React.useEffect(() => {
                fetcherCount.current++;
              }, [fetcher.submit]);
              return (
                <>
                  <button
                    onClick={() => {
                      setCount(count + 1);
                      let random = Math.random().toString();
                      navigate(`${location.pathname}?random=${random}`);
                    }}
                  >
                    Click
                  </button>
                  <p>
                    {`render count:${count}`}
                    {`fetcher count:${fetcherCount.current}`}
                  </p>
                </>
              );
            },
          },
        ],
        {}
      );

      let { container } = render(<RouterProvider router={router} />);

      let html = getHtml(container);
      expect(html).toContain("render count:0");
      expect(html).toContain("fetcher count:0");

      fireEvent.click(screen.getByText("Click"));
      fireEvent.click(screen.getByText("Click"));
      fireEvent.click(screen.getByText("Click"));
      await waitFor(() => screen.getByText(/render count:3/));

      html = getHtml(container);
      expect(html).toContain("render count:3");
      expect(html).toContain("fetcher count:1");
    });

    it("allows direct loaders to be passed to fetcher.load()", async () => {
      let router = createMemoryRouter(
        [
          {
            path: "/",
            Component() {
              let fetcher = useFetcher();
              return (
                <>
                  <button onClick={() => fetcher.load(() => "LOADER")}>
                    Load
                  </button>
                  <p>{fetcher.data || "empty"}</p>
                </>
              );
            },
          },
        ],
        {}
      );
      let { container } = render(<RouterProvider router={router} />);

      expect(getHtml(container)).toMatch("empty");

      fireEvent.click(screen.getByText("Load"));
      await waitFor(() => screen.getByText("LOADER"));
      expect(getHtml(container)).toMatch("LOADER");
    });

    it("allows direct loaders to override the fetch route loader", async () => {
      let router = createMemoryRouter(
        [
          {
            path: "/",
            loader: () => "LOADER ROUTE",
            Component() {
              let fetcher = useFetcher();
              return (
                <>
                  <button onClick={() => fetcher.load(".")}>Load Route</button>
                  <button onClick={() => fetcher.load(() => "LOADER OVERRIDE")}>
                    Load Override
                  </button>
                  <p>{fetcher.data || "empty"}</p>
                </>
              );
            },
          },
        ],
        {
          hydrationData: { loaderData: { "0": null } },
        }
      );
      let { container } = render(<RouterProvider router={router} />);

      expect(getHtml(container)).toMatch("empty");
      fireEvent.click(screen.getByText("Load Route"));
      await waitFor(() => screen.getByText("LOADER ROUTE"));
      expect(getHtml(container)).toMatch("LOADER ROUTE");

      fireEvent.click(screen.getByText("Load Override"));
      await waitFor(() => screen.getByText("LOADER OVERRIDE"));
      expect(getHtml(container)).toMatch("LOADER OVERRIDE");
    });

    it("allows direct actions to be passed to fetcher.submit()", async () => {
      let router = createMemoryRouter(
        [
          {
            path: "/",
            Component() {
              let fetcher = useFetcher();
              return (
                <>
                  <button
                    onClick={() =>
                      fetcher.submit(new FormData(), {
                        method: "post",
                        action: () => "ACTION",
                      })
                    }
                  >
                    Submit
                  </button>
                  <p>{fetcher.data || "empty"}</p>
                </>
              );
            },
          },
        ],
        {}
      );
      let { container } = render(<RouterProvider router={router} />);

      expect(getHtml(container)).toMatch("empty");

      fireEvent.click(screen.getByText("Submit"));
      await waitFor(() => screen.getByText("ACTION"));
      expect(getHtml(container)).toMatch("ACTION");
    });

    it("allows direct actions to override the fetch route action", async () => {
      let router = createMemoryRouter(
        [
          {
            path: "/",
            action: () => "ACTION ROUTE",
            Component() {
              let fetcher = useFetcher();
              return (
                <>
                  <button
                    onClick={() =>
                      fetcher.submit(new FormData(), {
                        method: "post",
                      })
                    }
                  >
                    Submit Route
                  </button>
                  <button
                    onClick={() =>
                      fetcher.submit(new FormData(), {
                        method: "post",
                        action: () => "ACTION OVERRIDE",
                      })
                    }
                  >
                    Submit Override
                  </button>
                  <p>{fetcher.data || "empty"}</p>
                </>
              );
            },
          },
        ],
        {}
      );
      let { container } = render(<RouterProvider router={router} />);

      expect(getHtml(container)).toMatch("empty");
      fireEvent.click(screen.getByText("Submit Route"));
      await waitFor(() => screen.getByText("ACTION ROUTE"));
      expect(getHtml(container)).toMatch("ACTION ROUTE");

      fireEvent.click(screen.getByText("Submit Override"));
      await waitFor(() => screen.getByText("ACTION OVERRIDE"));
      expect(getHtml(container)).toMatch("ACTION OVERRIDE");
    });

    describe("with a basename", () => {
      it("prepends the basename to fetcher.load paths", async () => {
        let router = createMemoryRouter(
          createRoutesFromElements(
            <Route path="/" element={<Comp />}>
              <Route path="fetch" loader={() => "FETCH"} />
            </Route>
          ),
          {
            basename: "/base",
            initialEntries: ["/base"],
          }
        );
        let { container } = render(<RouterProvider router={router} />);

        function Comp() {
          let fetcher = useFetcher();
          return (
            <>
              <p>{`data:${fetcher.data}`}</p>
              <button onClick={() => fetcher.load("/fetch")}>load</button>
            </>
          );
        }

        expect(getHtml(container)).toMatchInlineSnapshot(`
            "<div>
              <p>
                data:undefined
              </p>
              <button>
                load
              </button>
            </div>"
          `);

        fireEvent.click(screen.getByText("load"));
        await waitFor(() => screen.getByText(/FETCH/));
        expect(getHtml(container)).toMatchInlineSnapshot(`
            "<div>
              <p>
                data:FETCH
              </p>
              <button>
                load
              </button>
            </div>"
          `);
      });

      it('prepends the basename to fetcher.submit({ method: "get" }) paths', async () => {
        let router = createMemoryRouter(
          createRoutesFromElements(
            <Route path="/" element={<Comp />}>
              <Route path="fetch" loader={() => "FETCH"} />
            </Route>
          ),
          {
            basename: "/base",
            initialEntries: ["/base"],
          }
        );
        let { container } = render(<RouterProvider router={router} />);

        function Comp() {
          let fetcher = useFetcher();
          return (
            <>
              <p>{`data:${fetcher.data}`}</p>
              <button
                onClick={() =>
                  fetcher.submit({}, { method: "get", action: "/fetch" })
                }
              >
                load
              </button>
            </>
          );
        }

        expect(getHtml(container)).toMatchInlineSnapshot(`
            "<div>
              <p>
                data:undefined
              </p>
              <button>
                load
              </button>
            </div>"
          `);

        fireEvent.click(screen.getByText("load"));
        await waitFor(() => screen.getByText(/FETCH/));
        expect(getHtml(container)).toMatchInlineSnapshot(`
            "<div>
              <p>
                data:FETCH
              </p>
              <button>
                load
              </button>
            </div>"
          `);
      });

      it('prepends the basename to fetcher.submit({ method: "post" }) paths', async () => {
        let router = createMemoryRouter(
          createRoutesFromElements(
            <Route path="/" element={<Comp />}>
              <Route path="fetch" action={() => "FETCH"} />
            </Route>
          ),
          {
            basename: "/base",
            initialEntries: ["/base"],
          }
        );
        let { container } = render(<RouterProvider router={router} />);

        function Comp() {
          let fetcher = useFetcher();
          return (
            <>
              <p>{`data:${fetcher.data}`}</p>
              <button
                onClick={() =>
                  fetcher.submit({}, { method: "post", action: "/fetch" })
                }
              >
                submit
              </button>
            </>
          );
        }

        expect(getHtml(container)).toMatchInlineSnapshot(`
            "<div>
              <p>
                data:undefined
              </p>
              <button>
                submit
              </button>
            </div>"
          `);

        fireEvent.click(screen.getByText("submit"));
        await waitFor(() => screen.getByText(/FETCH/));
        expect(getHtml(container)).toMatchInlineSnapshot(`
            "<div>
              <p>
                data:FETCH
              </p>
              <button>
                submit
              </button>
            </div>"
          `);
      });
    });
  });

  describe("errors", () => {
    it("renders hydration errors on leaf elements using errorElement", async () => {
      let router = createMemoryRouter(
        createRoutesFromElements(
          <Route path="/" element={<Comp />}>
            <Route
              path="child"
              element={<Comp />}
              errorElement={<ErrorBoundary />}
            />
          </Route>
        ),
        {
          initialEntries: ["/child"],
          hydrationData: {
            loaderData: {
              "0": "parent data",
            },
            actionData: {
              "0": "parent action",
            },
            errors: {
              "0-0": new Error("Kaboom 💥"),
            },
          },
        }
      );
      let { container } = render(<RouterProvider router={router} />);

      function Comp() {
        let data = useLoaderData() as { message: string };
        let actionData = useActionData();
        let navigation = useNavigation();
        return (
          <div>
            <>{data}</>
            <>{actionData}</>
            <>{navigation.state}</>
            <Outlet />
          </div>
        );
      }

      function ErrorBoundary() {
        let error = useRouteError() as Error;
        return <p>{error.message}</p>;
      }

      expect(getHtml(container)).toMatchInlineSnapshot(`
        "<div>
          <div>
            parent data
            parent action
            idle
            <p>
              Kaboom 💥
            </p>
          </div>
        </div>"
      `);
    });

    it("renders hydration errors on leaf elements using ErrorBoundary", async () => {
      let router = createMemoryRouter(
        createRoutesFromElements(
          <Route path="/" element={<Comp />}>
            <Route
              path="child"
              element={<Comp />}
              ErrorBoundary={() => <p>{(useRouteError() as Error).message}</p>}
            />
          </Route>
        ),
        {
          initialEntries: ["/child"],
          hydrationData: {
            loaderData: {
              "0": "parent data",
            },
            actionData: {
              "0": "parent action",
            },
            errors: {
              "0-0": new Error("Kaboom 💥"),
            },
          },
        }
      );
      let { container } = render(<RouterProvider router={router} />);

      function Comp() {
        let data = useLoaderData() as { message: string };
        let actionData = useActionData();
        let navigation = useNavigation();
        return (
          <div>
            <>{data}</>
            <>{actionData}</>
            <>{navigation.state}</>
            <Outlet />
          </div>
        );
      }

      expect(getHtml(container)).toMatchInlineSnapshot(`
        "<div>
          <div>
            parent data
            parent action
            idle
            <p>
              Kaboom 💥
            </p>
          </div>
        </div>"
      `);
    });

    it("renders hydration errors on parent elements", async () => {
      let router = createMemoryRouter(
        createRoutesFromElements(
          <Route path="/" element={<Comp />} errorElement={<ErrorBoundary />}>
            <Route path="child" element={<Comp />} />
          </Route>
        ),
        {
          initialEntries: ["/child"],
          hydrationData: {
            loaderData: {},
            actionData: null,
            errors: {
              "0": new Error("Kaboom 💥"),
            },
          },
        }
      );
      let { container } = render(<RouterProvider router={router} />);

      function Comp() {
        let data = useLoaderData() as { message: string };
        let actionData = useActionData();
        let navigation = useNavigation();
        return (
          <div>
            <>{data}</>
            <>{actionData}</>
            <>{navigation.state}</>
            <Outlet />
          </div>
        );
      }

      function ErrorBoundary() {
        let error = useRouteError() as Error;
        return <p>{error.message}</p>;
      }

      expect(getHtml(container)).toMatchInlineSnapshot(`
        "<div>
          <p>
            Kaboom 💥
          </p>
        </div>"
      `);
    });

    it("renders navigation errors on leaf elements using errorElement", async () => {
      let fooDefer = createDeferred();
      let barDefer = createDeferred();

      let router = createMemoryRouter(
        createRoutesFromElements(
          <Route path="/" element={<Layout />}>
            <Route
              path="foo"
              loader={() => fooDefer.promise}
              element={<Foo />}
              errorElement={<FooError />}
            />
            <Route
              path="bar"
              loader={() => barDefer.promise}
              element={<Bar />}
              errorElement={<BarError />}
            />
          </Route>
        ),
        {
          initialEntries: ["/foo"],
          hydrationData: {
            loaderData: {
              "0-0": {
                message: "hydrated from foo",
              },
            },
          },
        }
      );
      let { container } = render(<RouterProvider router={router} />);

      function Layout() {
        let navigation = useNavigation();
        return (
          <div>
            <MemoryNavigate to="/foo">Link to Foo</MemoryNavigate>
            <MemoryNavigate to="/bar">Link to Bar</MemoryNavigate>
            <p>{navigation.state}</p>
            <Outlet />
          </div>
        );
      }

      function Foo() {
        let data = useLoaderData() as { message: string };
        return <h1>Foo:{data?.message}</h1>;
      }
      function FooError() {
        let error = useRouteError() as Error;
        return <p>Foo Error:{error.message}</p>;
      }
      function Bar() {
        let data = useLoaderData() as { message: string };
        return <h1>Bar:{data?.message}</h1>;
      }
      function BarError() {
        let error = useRouteError() as Error;
        return <p>Bar Error:{error.message}</p>;
      }

      expect(getHtml(container)).toMatchInlineSnapshot(`
        "<div>
          <div>
            <a
              href="/foo"
            >
              Link to Foo
            </a>
            <a
              href="/bar"
            >
              Link to Bar
            </a>
            <p>
              idle
            </p>
            <h1>
              Foo:
              hydrated from foo
            </h1>
          </div>
        </div>"
      `);

      fireEvent.click(screen.getByText("Link to Bar"));
      barDefer.reject(new Error("Kaboom!"));
      await waitFor(() => screen.getByText("idle"));
      expect(getHtml(container)).toMatchInlineSnapshot(`
        "<div>
          <div>
            <a
              href="/foo"
            >
              Link to Foo
            </a>
            <a
              href="/bar"
            >
              Link to Bar
            </a>
            <p>
              idle
            </p>
            <p>
              Bar Error:
              Kaboom!
            </p>
          </div>
        </div>"
      `);

      fireEvent.click(screen.getByText("Link to Foo"));
      fooDefer.reject(new Error("Kaboom!"));
      await waitFor(() => screen.getByText("idle"));
      expect(getHtml(container)).toMatchInlineSnapshot(`
        "<div>
          <div>
            <a
              href="/foo"
            >
              Link to Foo
            </a>
            <a
              href="/bar"
            >
              Link to Bar
            </a>
            <p>
              idle
            </p>
            <p>
              Foo Error:
              Kaboom!
            </p>
          </div>
        </div>"
      `);
    });

    it("renders navigation errors on leaf elements using ErrorBoundary", async () => {
      let fooDefer = createDeferred();
      let barDefer = createDeferred();

      let router = createMemoryRouter(
        createRoutesFromElements(
          <Route path="/" element={<Layout />}>
            <Route
              path="foo"
              loader={() => fooDefer.promise}
              element={<Foo />}
              ErrorBoundary={FooError}
            />
            <Route
              path="bar"
              loader={() => barDefer.promise}
              element={<Bar />}
              ErrorBoundary={BarError}
            />
          </Route>
        ),
        {
          initialEntries: ["/foo"],
          hydrationData: {
            loaderData: {
              "0-0": {
                message: "hydrated from foo",
              },
            },
          },
        }
      );
      let { container } = render(<RouterProvider router={router} />);

      function Layout() {
        let navigation = useNavigation();
        return (
          <div>
            <MemoryNavigate to="/foo">Link to Foo</MemoryNavigate>
            <MemoryNavigate to="/bar">Link to Bar</MemoryNavigate>
            <p>{navigation.state}</p>
            <Outlet />
          </div>
        );
      }

      function Foo() {
        let data = useLoaderData() as { message: string };
        return <h1>Foo:{data?.message}</h1>;
      }
      function FooError() {
        let error = useRouteError() as Error;
        return <p>Foo Error:{error.message}</p>;
      }
      function Bar() {
        let data = useLoaderData() as { message: string };
        return <h1>Bar:{data?.message}</h1>;
      }
      function BarError() {
        let error = useRouteError() as Error;
        return <p>Bar Error:{error.message}</p>;
      }

      expect(getHtml(container)).toMatchInlineSnapshot(`
        "<div>
          <div>
            <a
              href="/foo"
            >
              Link to Foo
            </a>
            <a
              href="/bar"
            >
              Link to Bar
            </a>
            <p>
              idle
            </p>
            <h1>
              Foo:
              hydrated from foo
            </h1>
          </div>
        </div>"
      `);

      fireEvent.click(screen.getByText("Link to Bar"));
      barDefer.reject(new Error("Kaboom!"));
      await waitFor(() => screen.getByText("idle"));
      expect(getHtml(container)).toMatchInlineSnapshot(`
        "<div>
          <div>
            <a
              href="/foo"
            >
              Link to Foo
            </a>
            <a
              href="/bar"
            >
              Link to Bar
            </a>
            <p>
              idle
            </p>
            <p>
              Bar Error:
              Kaboom!
            </p>
          </div>
        </div>"
      `);

      fireEvent.click(screen.getByText("Link to Foo"));
      fooDefer.reject(new Error("Kaboom!"));
      await waitFor(() => screen.getByText("idle"));
      expect(getHtml(container)).toMatchInlineSnapshot(`
        "<div>
          <div>
            <a
              href="/foo"
            >
              Link to Foo
            </a>
            <a
              href="/bar"
            >
              Link to Bar
            </a>
            <p>
              idle
            </p>
            <p>
              Foo Error:
              Kaboom!
            </p>
          </div>
        </div>"
      `);
    });

    it("renders navigation errors on parent elements", async () => {
      let fooDefer = createDeferred();
      let barDefer = createDeferred();

      let router = createMemoryRouter(
        createRoutesFromElements(
          <Route path="/" element={<Layout />} errorElement={<LayoutError />}>
            <Route
              path="foo"
              loader={() => fooDefer.promise}
              element={<Foo />}
              errorElement={<FooError />}
            />
            <Route
              path="bar"
              loader={() => barDefer.promise}
              element={<Bar />}
            />
          </Route>
        ),
        {
          initialEntries: ["/foo"],
          hydrationData: {
            loaderData: {
              "0-0": {
                message: "hydrated from foo",
              },
            },
          },
        }
      );
      let { container } = render(<RouterProvider router={router} />);

      function Layout() {
        let navigation = useNavigation();
        return (
          <div>
            <MemoryNavigate to="/foo">Link to Foo</MemoryNavigate>
            <MemoryNavigate to="/bar">Link to Bar</MemoryNavigate>
            <p>{navigation.state}</p>
            <Outlet />
          </div>
        );
      }
      function LayoutError() {
        let error = useRouteError() as Error;
        return <p>Layout Error:{error.message}</p>;
      }
      function Foo() {
        let data = useLoaderData() as { message: string };
        return <h1>Foo:{data?.message}</h1>;
      }
      function FooError() {
        let error = useRouteError() as Error;
        return <p>Foo Error:{error.message}</p>;
      }
      function Bar() {
        let data = useLoaderData() as { message: string };
        return <h1>Bar:{data?.message}</h1>;
      }

      expect(getHtml(container)).toMatchInlineSnapshot(`
        "<div>
          <div>
            <a
              href="/foo"
            >
              Link to Foo
            </a>
            <a
              href="/bar"
            >
              Link to Bar
            </a>
            <p>
              idle
            </p>
            <h1>
              Foo:
              hydrated from foo
            </h1>
          </div>
        </div>"
      `);

      fireEvent.click(screen.getByText("Link to Bar"));
      barDefer.reject(new Error("Kaboom!"));
      await waitFor(() => screen.getByText("Layout Error:Kaboom!"));
      expect(getHtml(container)).toMatchInlineSnapshot(`
        "<div>
          <p>
            Layout Error:
            Kaboom!
          </p>
        </div>"
      `);
    });

    it("renders 404 errors using path='/' error boundary", async () => {
      let router = createMemoryRouter(
        createRoutesFromElements(
          <>
            <Route
              path="/thing"
              element={<h1>Thing 1</h1>}
              errorElement={<p>Not I!</p>}
            />
            <Route
              path="/"
              element={
                <div>
                  <h1>Hello</h1>
                  <Outlet />
                </div>
              }
              errorElement={<Boundary />}
            />
          </>
        ),
        {
          initialEntries: ["/foo"],
          hydrationData: {
            loaderData: {
              "0": {
                message: "hydrated from foo",
              },
            },
          },
        }
      );
      let { container } = render(<RouterProvider router={router} />);

      function Boundary() {
        let error = useRouteError() as ErrorResponse;
        return (
          <p>
            Error:
            <>{error.status}</>
            <>{error.statusText}</>
          </p>
        );
      }

      expect(getHtml(container)).toMatchInlineSnapshot(`
        "<div>
          <p>
            Error:
            404
            Not Found
          </p>
        </div>"
      `);
    });

    it("renders 404 errors using index error boundary", async () => {
      let router = createMemoryRouter(
        createRoutesFromElements(
          <>
            <Route
              path="/thing"
              element={<h1>Thing 1</h1>}
              errorElement={<p>Not I!</p>}
            />
            <Route
              index
              element={
                <div>
                  <h1>Hello</h1>
                  <Outlet />
                </div>
              }
              errorElement={<Boundary />}
            />
          </>
        ),
        {
          initialEntries: ["/foo"],
          hydrationData: {
            loaderData: {
              "0": {
                message: "hydrated from foo",
              },
            },
          },
        }
      );
      let { container } = render(<RouterProvider router={router} />);

      function Boundary() {
        let error = useRouteError() as ErrorResponse;
        return (
          <p>
            Error:
            <>{error.status}</>
            <>{error.statusText}</>
          </p>
        );
      }

      expect(getHtml(container)).toMatchInlineSnapshot(`
        "<div>
          <p>
            Error:
            404
            Not Found
          </p>
        </div>"
      `);
    });

    it("renders 404 errors using fallback boundary if no root layout route exists", async () => {
      let router = createMemoryRouter(
        createRoutesFromElements(
          <>
            <Route
              path="/thing1"
              element={<h1>Thing 1</h1>}
              errorElement={<p>Not I!</p>}
            />
            <Route
              path="/thing2"
              element={<h1>Thing 2</h1>}
              errorElement={<p>Not I!</p>}
            />
          </>
        ),
        {
          initialEntries: ["/foo"],
          hydrationData: {
            loaderData: {
              "0": {
                message: "hydrated from foo",
              },
            },
          },
        }
      );
      let { container } = render(<RouterProvider router={router} />);

      let html = getHtml(container);
      expect(html).toMatch("Unexpected Application Error!");
      expect(html).toMatch("404 Not Found");
      expect(html).toMatch("💿 Hey developer 👋");
      expect(html).not.toMatch(/stack/i);
    });

    it("renders navigation errors with a default if no errorElements are provided", async () => {
      let fooDefer = createDeferred();
      let barDefer = createDeferred();

      let router = createMemoryRouter(
        createRoutesFromElements(
          <Route path="/" element={<Layout />}>
            <Route
              path="foo"
              loader={() => fooDefer.promise}
              element={<Foo />}
            />
            <Route
              path="bar"
              loader={() => barDefer.promise}
              element={<Bar />}
            />
          </Route>
        ),
        {
          initialEntries: ["/foo"],
          hydrationData: {
            loaderData: {
              "0-0": {
                message: "hydrated from foo",
              },
            },
          },
        }
      );
      let { container } = render(<RouterProvider router={router} />);

      function Layout() {
        let navigation = useNavigation();
        return (
          <div>
            <MemoryNavigate to="/foo">Link to Foo</MemoryNavigate>
            <MemoryNavigate to="/bar">Link to Bar</MemoryNavigate>
            <p>{navigation.state}</p>
            <Outlet />
          </div>
        );
      }
      function Foo() {
        let data = useLoaderData() as { message: string };
        return <h1>Foo:{data?.message}</h1>;
      }
      function Bar() {
        let data = useLoaderData() as { message: string };
        return <h1>Bar:{data?.message}</h1>;
      }

      expect(getHtml(container)).toMatchInlineSnapshot(`
        "<div>
          <div>
            <a
              href="/foo"
            >
              Link to Foo
            </a>
            <a
              href="/bar"
            >
              Link to Bar
            </a>
            <p>
              idle
            </p>
            <h1>
              Foo:
              hydrated from foo
            </h1>
          </div>
        </div>"
      `);

      fireEvent.click(screen.getByText("Link to Bar"));
      let error = new Error("Kaboom!");
      error.stack = "FAKE STACK TRACE";
      barDefer.reject(error);
      await waitFor(() => screen.getByText("Kaboom!"));
      let html = getHtml(container);
      expect(html).toMatch("Unexpected Application Error!");
      expect(html).toMatch("Kaboom!");
      expect(html).toMatch("FAKE STACK TRACE");
      expect(html).toMatch("💿 Hey developer 👋");
    });

    // This test ensures that when manual routes are used, we add hasErrorBoundary
    it("renders navigation errors on leaf elements (when using manual route objects)", async () => {
      let barDefer = createDeferred();

      let routes = [
        {
          path: "/",
          element: <Layout />,
          children: [
            {
              path: "foo",
              element: <h1>Foo</h1>,
            },
            {
              path: "bar",
              loader: () => barDefer.promise,
              element: <Bar />,
              errorElement: <BarError />,
            },
          ],
        },
      ];

      let router = createMemoryRouter(routes, { initialEntries: ["/foo"] });
      let { container } = render(<RouterProvider router={router} />);

      function Layout() {
        let navigation = useNavigation();
        return (
          <div>
            <MemoryNavigate to="/bar">Link to Bar</MemoryNavigate>
            <p>{navigation.state}</p>
            <Outlet />
          </div>
        );
      }
      function Bar() {
        let data = useLoaderData() as { message: string };
        return <h1>Bar:{data?.message}</h1>;
      }
      function BarError() {
        let error = useRouteError() as Error;
        return <p>Bar Error:{error.message}</p>;
      }

      expect(getHtml(container)).toMatchInlineSnapshot(`
        "<div>
          <div>
            <a
              href="/bar"
            >
              Link to Bar
            </a>
            <p>
              idle
            </p>
            <h1>
              Foo
            </h1>
          </div>
        </div>"
      `);

      fireEvent.click(screen.getByText("Link to Bar"));
      barDefer.reject(new Error("Kaboom!"));
      await waitFor(() => screen.getByText("Bar Error:Kaboom!"));
      expect(getHtml(container)).toMatchInlineSnapshot(`
        "<div>
          <div>
            <a
              href="/bar"
            >
              Link to Bar
            </a>
            <p>
              idle
            </p>
            <p>
              Bar Error:
              Kaboom!
            </p>
          </div>
        </div>"
      `);
    });

    it("handles render errors in parent errorElement", async () => {
      let router = createMemoryRouter(
        createRoutesFromElements(
          <Route
            path="/"
            element={
              <div>
                <h1>This should not show</h1>
                <Outlet />
              </div>
            }
            errorElement={<ErrorBoundary />}
          >
            <Route path="child" element={<ChildComp />} />
          </Route>
        ),
        { initialEntries: ["/child"] }
      );
      let { container } = render(<RouterProvider router={router} />);

      function ChildComp(): React.ReactElement {
        throw new Error("Kaboom!");
      }

      function ErrorBoundary() {
        let error = useRouteError() as Error;
        return <p>{error.message}</p>;
      }

      expect(getHtml(container)).toMatchInlineSnapshot(`
        "<div>
          <p>
            Kaboom!
          </p>
        </div>"
      `);
    });

    it("handles render errors in child errorElement", async () => {
      let router = createMemoryRouter(
        createRoutesFromElements(
          <Route
            path="/"
            element={
              <div>
                <h1>Parent</h1>
                <Outlet />
              </div>
            }
            errorElement={<p>Don't show this</p>}
          >
            <Route
              path="child"
              element={<ChildComp />}
              errorElement={<ErrorBoundary />}
            />
          </Route>
        ),
        { initialEntries: ["/child"] }
      );
      let { container } = render(<RouterProvider router={router} />);

      function ChildComp(): React.ReactElement {
        throw new Error("Kaboom!");
      }

      function ErrorBoundary() {
        let error = useRouteError() as Error;
        return <p>{error.message}</p>;
      }

      expect(getHtml(container)).toMatchInlineSnapshot(`
        "<div>
          <div>
            <h1>
              Parent
            </h1>
            <p>
              Kaboom!
            </p>
          </div>
        </div>"
      `);
    });

    it("handles render errors in default errorElement", async () => {
      let router = createMemoryRouter(
        createRoutesFromElements(
          <Route
            path="/"
            element={
              <div>
                <h1>Parent</h1>
                <Outlet />
              </div>
            }
          >
            <Route path="child" element={<ChildComp />} />
          </Route>
        ),
        { initialEntries: ["/child"] }
      );
      let { container } = render(<RouterProvider router={router} />);

      function ChildComp(): React.ReactElement {
        let error = new Error("Kaboom!");
        error.stack = "FAKE STACK TRACE";
        throw error;
      }

      let html = getHtml(container);
      expect(html).toMatch("Unexpected Application Error!");
      expect(html).toMatch("Kaboom!");
      expect(html).toMatch("FAKE STACK TRACE");
      expect(html).toMatch("💿 Hey developer 👋");
    });

    it("does not handle render errors for non-data routers", async () => {
      expect(() =>
        render(
          <MemoryRouter initialEntries={["/child"]}>
            <Routes>
              <Route
                path="/"
                element={
                  <div>
                    <h1>Parent</h1>
                    <Outlet />
                  </div>
                }
              >
                <Route path="child" element={<ChildComp />} />
              </Route>
            </Routes>
          </MemoryRouter>
        )
      ).toThrowErrorMatchingInlineSnapshot(`"Kaboom!"`);

      function ChildComp(): React.ReactElement {
        throw new Error("Kaboom!");
      }
    });

    it("handles back button routing away from a child error boundary", async () => {
      let router = createMemoryRouter(
        createRoutesFromElements(
          <Route
            path="/"
            element={<Parent />}
            errorElement={<p>Don't show this</p>}
          >
            <Route
              path="child"
              element={<Child />}
              errorElement={<ErrorBoundary />}
            />
          </Route>
        )
      );

      let { container } = render(
        <div>
          <RouterProvider router={router} />
        </div>
      );

      function Parent() {
        return (
          <>
            <h1>Parent</h1>
            <Outlet />
          </>
        );
      }
      function Child(): React.ReactElement {
        throw new Error("Kaboom!");
      }

      function ErrorBoundary() {
        let error = useRouteError() as Error;
        return <p>{error.message}</p>;
      }

      expect(getHtml(container)).toMatchInlineSnapshot(`
        "<div>
          <div>
            <h1>
              Parent
            </h1>
          </div>
        </div>"
      `);

      router.navigate("/child");
      await waitFor(() => screen.getByText("Kaboom!"));
      expect(getHtml(container)).toMatchInlineSnapshot(`
        "<div>
          <div>
            <h1>
              Parent
            </h1>
            <p>
              Kaboom!
            </p>
          </div>
        </div>"
      `);

      router.navigate(-1);
      await waitFor(() => {
        expect(queryByText(container, "Kaboom!")).not.toBeInTheDocument();
      });
      expect(getHtml(container)).toMatchInlineSnapshot(`
        "<div>
          <div>
            <h1>
              Parent
            </h1>
          </div>
        </div>"
      `);
    });

    it("handles back button routing away from a default error boundary", async () => {
      let router = createMemoryRouter(
        createRoutesFromElements(
          <Route path="/" element={<Parent />}>
            <Route path="child" element={<Child />} />
          </Route>
        )
      );
      let { container } = render(
        <div>
          <RouterProvider router={router} />
        </div>
      );

      function Parent() {
        return (
          <>
            <h1>Parent</h1>
            <Outlet />
          </>
        );
      }

      function Child(): React.ReactElement {
        let error = new Error("Kaboom!");
        error.stack = "FAKE STACK TRACE";
        throw error;
      }

      expect(getHtml(container)).toMatchInlineSnapshot(`
        "<div>
          <div>
            <h1>
              Parent
            </h1>
          </div>
        </div>"
      `);

      router.navigate("/child");
      await waitFor(() => screen.getByText("Kaboom!"));
      let html = getHtml(container);
      expect(html).toMatch("Unexpected Application Error!");
      expect(html).toMatch("Kaboom!");
      expect(html).toMatch("FAKE STACK TRACE");
      expect(html).toMatch("💿 Hey developer 👋");

      router.navigate(-1);
      await waitFor(() => {
        expect(queryByText(container, "Kaboom!")).not.toBeInTheDocument();
      });
      expect(getHtml(container)).toMatchInlineSnapshot(`
        "<div>
          <div>
            <h1>
              Parent
            </h1>
          </div>
        </div>"
      `);
    });

    it("does not allow loaderData usage in self-caught error boundaries", async () => {
      let errorSpy = jest.spyOn(console, "error");

      let router = createMemoryRouter(
        createRoutesFromElements(
          <Route path="/" element={<Layout />}>
            <Route
              path="foo"
              loader={() => Promise.reject(new Error("Kaboom!"))}
              element={<h1>Foo</h1>}
              errorElement={<FooError />}
            />
          </Route>
        )
      );
      let { container } = render(<RouterProvider router={router} />);

      function Layout() {
        let navigation = useNavigation();
        return (
          <div>
            <MemoryNavigate to="/foo">Link to Foo</MemoryNavigate>
            <p>{navigation.state}</p>
            <Outlet />
          </div>
        );
      }

      function FooError() {
        let error = useRouteError() as Error;
        let data = useLoaderData() as { message: string };
        return (
          <>
            <p>
              Foo Data:{data === undefined ? "undefined" : JSON.stringify(data)}
            </p>
            <p>Foo Error:{error.message}</p>
          </>
        );
      }

      expect(getHtml(container)).toMatchInlineSnapshot(`
        "<div>
          <div>
            <a
              href="/foo"
            >
              Link to Foo
            </a>
            <p>
              idle
            </p>
          </div>
        </div>"
      `);

      fireEvent.click(screen.getByText("Link to Foo"));
      await waitFor(() => screen.getByText("Foo Error:Kaboom!"));
      expect(getHtml(container)).toMatchInlineSnapshot(`
        "<div>
          <div>
            <a
              href="/foo"
            >
              Link to Foo
            </a>
            <p>
              idle
            </p>
            <p>
              Foo Data:
              undefined
            </p>
            <p>
              Foo Error:
              Kaboom!
            </p>
          </div>
        </div>"
      `);

      expect(errorSpy).toHaveBeenCalledWith(
        "You cannot `useLoaderData` in an errorElement (routeId: 0-0)"
      );
      errorSpy.mockRestore();
    });

    it("does not allow useLoaderData usage in bubbled error boundaries", async () => {
      let errorSpy = jest.spyOn(console, "error");

      let router = createMemoryRouter(
        createRoutesFromElements(
          <Route
            path="/"
            element={<Layout />}
            loader={() => "ROOT"}
            errorElement={<LayoutError />}
          >
            <Route
              path="foo"
              loader={() => Promise.reject(new Error("Kaboom!"))}
              element={<h1>Foo</h1>}
            />
          </Route>
        ),
        {
          hydrationData: {
            loaderData: {
              "0": "ROOT",
            },
          },
        }
      );
      let { container } = render(<RouterProvider router={router} />);

      function Layout() {
        let navigation = useNavigation();
        return (
          <div>
            <MemoryNavigate to="/foo">Link to Foo</MemoryNavigate>
            <p>{navigation.state}</p>
            <Outlet />
          </div>
        );
      }
      function LayoutError() {
        let data = useLoaderData() as { message: string };
        let error = useRouteError() as Error;
        return (
          <>
            <p>
              Layout Data:
              {data === undefined ? "undefined" : JSON.stringify(data)}
            </p>
            <p>Layout Error:{error.message}</p>
          </>
        );
      }

      expect(getHtml(container)).toMatchInlineSnapshot(`
        "<div>
          <div>
            <a
              href="/foo"
            >
              Link to Foo
            </a>
            <p>
              idle
            </p>
          </div>
        </div>"
      `);

      fireEvent.click(screen.getByText("Link to Foo"));
      await waitFor(() => screen.getByText("Layout Error:Kaboom!"));
      expect(getHtml(container)).toMatchInlineSnapshot(`
        "<div>
          <p>
            Layout Data:
            undefined
          </p>
          <p>
            Layout Error:
            Kaboom!
          </p>
        </div>"
      `);

      expect(errorSpy).toHaveBeenCalledWith(
        "You cannot `useLoaderData` in an errorElement (routeId: 0)"
      );
      errorSpy.mockRestore();
    });

    it("allows a successful useRevalidator to resolve the error boundary (loader + child boundary)", async () => {
      let shouldFail = true;
      let router = createMemoryRouter(
        createRoutesFromElements(
          <Route
            path="/"
            Component={() => (
              <>
                <MemoryNavigate to="child">/child</MemoryNavigate>
                <Outlet />
              </>
            )}
          >
            <Route
              path="child"
              loader={() => {
                if (shouldFail) {
                  shouldFail = false;
                  throw new Error("Broken");
                } else {
                  return "Fixed";
                }
              }}
              Component={() => <p>{("Child:" + useLoaderData()) as string}</p>}
              ErrorBoundary={() => {
                let { revalidate } = useRevalidator();
                return (
                  <>
                    <p>{"Error:" + (useRouteError() as Error).message}</p>
                    <button onClick={() => revalidate()}>Try again</button>
                  </>
                );
              }}
            />
          </Route>
        )
      );

      let { container } = render(
        <div>
          <RouterProvider router={router} />
        </div>
      );

      fireEvent.click(screen.getByText("/child"));
      await waitFor(() => screen.getByText("Error:Broken"));
      expect(getHtml(container)).toMatch("Error:Broken");
      expect(router.state.errors).not.toBe(null);

      fireEvent.click(screen.getByText("Try again"));
      await waitFor(() => {
        expect(queryByText(container, "Child:Fixed")).toBeInTheDocument();
      });
      expect(getHtml(container)).toMatch("Child:Fixed");
      expect(router.state.errors).toBe(null);
    });

    it("allows a successful useRevalidator to resolve the error boundary (loader + parent boundary)", async () => {
      let shouldFail = true;
      let router = createMemoryRouter(
        createRoutesFromElements(
          <Route
            path="/"
            Component={() => (
              <>
                <MemoryNavigate to="child">/child</MemoryNavigate>
                <Outlet />
              </>
            )}
            ErrorBoundary={() => {
              let { revalidate } = useRevalidator();
              return (
                <>
                  <p>{"Error:" + (useRouteError() as Error).message}</p>
                  <button onClick={() => revalidate()}>Try again</button>
                </>
              );
            }}
          >
            <Route
              path="child"
              loader={() => {
                if (shouldFail) {
                  shouldFail = false;
                  throw new Error("Broken");
                } else {
                  return "Fixed";
                }
              }}
              Component={() => <p>{("Child:" + useLoaderData()) as string}</p>}
            />
          </Route>
        )
      );

      let { container } = render(
        <div>
          <RouterProvider router={router} />
        </div>
      );

      fireEvent.click(screen.getByText("/child"));
      await waitFor(() => screen.getByText("Error:Broken"));
      expect(getHtml(container)).toMatch("Error:Broken");
      expect(router.state.errors).not.toBe(null);

      fireEvent.click(screen.getByText("Try again"));
      await waitFor(() => {
        expect(queryByText(container, "Child:Fixed")).toBeInTheDocument();
      });
      expect(getHtml(container)).toMatch("Child:Fixed");
      expect(router.state.errors).toBe(null);
    });
  });

  describe("defer", () => {
    function setupDeferredTest({
      useRenderProp = false,
      hasRouteErrorElement = false,
      hasAwaitErrorElement = false,
      triggerRenderError = false,
      triggerFallbackError = false,
    } = {}) {
      let awaitRenderCount = 0;
      let barDefer = createDeferred();
      let bazDefer = createDeferred();

      let router = createMemoryRouter(
        createRoutesFromElements(
          <Route path="/" element={<Layout />}>
            <Route path="foo" element={<h1>Foo</h1>} />
            <Route
              path="bar"
              loader={() => barDefer.promise}
              element={<Bar />}
              errorElement={hasRouteErrorElement ? <RouteError /> : null}
            />
            <Route
              path="baz"
              loader={() => bazDefer.promise}
              element={<h1>Baz</h1>}
            />
          </Route>
        ),
        { initialEntries: ["/foo"] }
      );
      let { container } = render(<RouterProvider router={router} />);

      function Layout() {
        let navigation = useNavigation();
        return (
          <>
            <MemoryNavigate to="/bar">Link to Bar</MemoryNavigate>
            <MemoryNavigate to="/baz">Link to Baz</MemoryNavigate>
            <div id="content">
              <p>{navigation.state}</p>
              <Outlet />
            </div>
          </>
        );
      }

      function Bar() {
        let data = useLoaderData() as { critical: string };
        return (
          <>
            <p>{data.critical}</p>
            <React.Suspense fallback={<LazyFallback />}>
              <AwaitCounter data={data} />
            </React.Suspense>
          </>
        );
      }

      function AwaitCounter({ data }) {
        awaitRenderCount++;
        return (
          <>
            <Await
              resolve={data.lazy}
              errorElement={hasAwaitErrorElement ? <LazyError /> : null}
            >
              {useRenderProp ? (value) => <p>{value}</p> : <LazyData />}
            </Await>
          </>
        );
      }

      function RouteError() {
        let error = useRouteError() as Error;
        return <p>Route Error:{error.message}</p>;
      }

      function LazyFallback() {
        return triggerFallbackError ? (
          // @ts-expect-error
          <p>{oops.i.did.it}</p>
        ) : (
          <p>Loading...</p>
        );
      }

      function LazyData() {
        let data = useAsyncValue() as string;
        return triggerRenderError ? (
          // @ts-expect-error
          <p>{oops.i.did.it.again}</p>
        ) : (
          <p>{data}</p>
        );
      }

      function LazyError() {
        let data = useAsyncError() as Error;
        return <p>Await Error:{data.message}</p>;
      }

      return {
        container: container.querySelector("#content") as HTMLElement,
        barDefer,
        bazDefer,
        getAwaitRenderCount() {
          return awaitRenderCount;
        },
      };
    }

    it("allows loaders to returned deferred data (child component)", async () => {
      let { barDefer, container } = setupDeferredTest();
      fireEvent.click(screen.getByText("Link to Bar"));
      expect(getHtml(container)).toMatchInlineSnapshot(`
        "<div
          id="content"
        >
          <p>
            loading
          </p>
          <h1>
            Foo
          </h1>
        </div>"
      `);

      let barValueDfd = createDeferred();
      barDefer.resolve(
        defer({
          critical: "CRITICAL",
          lazy: barValueDfd.promise,
        })
      );
      await waitFor(() => screen.getByText("idle"));
      expect(getHtml(container)).toMatchInlineSnapshot(`
        "<div
          id="content"
        >
          <p>
            idle
          </p>
          <p>
            CRITICAL
          </p>
          <p>
            Loading...
          </p>
        </div>"
      `);

      barValueDfd.resolve("LAZY");
      await waitFor(() => screen.getByText("LAZY"));
      expect(getHtml(container)).toMatchInlineSnapshot(`
        "<div
          id="content"
        >
          <p>
            idle
          </p>
          <p>
            CRITICAL
          </p>
          <p>
            LAZY
          </p>
        </div>"
      `);
    });

    it("allows loaders to returned deferred data (render prop)", async () => {
      let { barDefer, container } = setupDeferredTest({ useRenderProp: true });

      fireEvent.click(screen.getByText("Link to Bar"));
      expect(getHtml(container)).toMatchInlineSnapshot(`
        "<div
          id="content"
        >
          <p>
            loading
          </p>
          <h1>
            Foo
          </h1>
        </div>"
      `);

      let barValueDfd = createDeferred();
      barDefer.resolve(
        defer({
          critical: "CRITICAL",
          lazy: barValueDfd.promise,
        })
      );
      await waitFor(() => screen.getByText("idle"));
      expect(getHtml(container)).toMatchInlineSnapshot(`
        "<div
          id="content"
        >
          <p>
            idle
          </p>
          <p>
            CRITICAL
          </p>
          <p>
            Loading...
          </p>
        </div>"
      `);

      barValueDfd.resolve("LAZY");
      await waitFor(() => screen.getByText("LAZY"));
      expect(getHtml(container)).toMatchInlineSnapshot(`
        "<div
          id="content"
        >
          <p>
            idle
          </p>
          <p>
            CRITICAL
          </p>
          <p>
            LAZY
          </p>
        </div>"
      `);
    });

    it("sends data errors to the provided errorElement", async () => {
      let { barDefer, container } = setupDeferredTest({
        hasRouteErrorElement: true,
        hasAwaitErrorElement: true,
      });

      fireEvent.click(screen.getByText("Link to Bar"));
      expect(getHtml(container)).toMatchInlineSnapshot(`
        "<div
          id="content"
        >
          <p>
            loading
          </p>
          <h1>
            Foo
          </h1>
        </div>"
      `);

      let barValueDfd = createDeferred();
      barDefer.resolve(
        defer({
          critical: "CRITICAL",
          lazy: barValueDfd.promise,
        })
      );
      await waitFor(() => screen.getByText("idle"));
      expect(getHtml(container)).toMatchInlineSnapshot(`
        "<div
          id="content"
        >
          <p>
            idle
          </p>
          <p>
            CRITICAL
          </p>
          <p>
            Loading...
          </p>
        </div>"
      `);

      barValueDfd.reject(new Error("Kaboom!"));
      await waitFor(() => screen.getByText(/Kaboom!/));
      expect(getHtml(container)).toMatchInlineSnapshot(`
        "<div
          id="content"
        >
          <p>
            idle
          </p>
          <p>
            CRITICAL
          </p>
          <p>
            Await Error:
            Kaboom!
          </p>
        </div>"
      `);
    });

    it("sends unhandled data errors to the nearest route error boundary", async () => {
      let { barDefer, container } = setupDeferredTest({
        hasRouteErrorElement: true,
        hasAwaitErrorElement: false,
      });

      fireEvent.click(screen.getByText("Link to Bar"));
      expect(getHtml(container)).toMatchInlineSnapshot(`
        "<div
          id="content"
        >
          <p>
            loading
          </p>
          <h1>
            Foo
          </h1>
        </div>"
      `);

      let barValueDfd = createDeferred();
      barDefer.resolve(
        defer({
          critical: "CRITICAL",
          lazy: barValueDfd.promise,
        })
      );
      await waitFor(() => screen.getByText("idle"));
      expect(getHtml(container)).toMatchInlineSnapshot(`
        "<div
          id="content"
        >
          <p>
            idle
          </p>
          <p>
            CRITICAL
          </p>
          <p>
            Loading...
          </p>
        </div>"
      `);

      barValueDfd.reject(new Error("Kaboom!"));
      await waitFor(() => screen.getByText(/Kaboom!/));
      expect(getHtml(container)).toMatchInlineSnapshot(`
        "<div
          id="content"
        >
          <p>
            idle
          </p>
          <p>
            Route Error:
            Kaboom!
          </p>
        </div>"
      `);
    });

    it("sends render errors to the provided errorElement", async () => {
      let { barDefer, container } = setupDeferredTest({
        hasRouteErrorElement: true,
        hasAwaitErrorElement: true,
        triggerRenderError: true,
      });

      fireEvent.click(screen.getByText("Link to Bar"));
      expect(getHtml(container)).toMatchInlineSnapshot(`
        "<div
          id="content"
        >
          <p>
            loading
          </p>
          <h1>
            Foo
          </h1>
        </div>"
      `);

      let barValueDfd = createDeferred();
      barDefer.resolve(
        defer({
          critical: "CRITICAL",
          lazy: barValueDfd.promise,
        })
      );
      await waitFor(() => screen.getByText("idle"));
      expect(getHtml(container)).toMatchInlineSnapshot(`
        "<div
          id="content"
        >
          <p>
            idle
          </p>
          <p>
            CRITICAL
          </p>
          <p>
            Loading...
          </p>
        </div>"
      `);

      barValueDfd.resolve("LAZY");
      await waitFor(() => screen.getByText(/oops is not defined/));
      expect(getHtml(container)).toMatchInlineSnapshot(`
        "<div
          id="content"
        >
          <p>
            idle
          </p>
          <p>
            CRITICAL
          </p>
          <p>
            Await Error:
            oops is not defined
          </p>
        </div>"
      `);
    });

    it("sends unhandled render errors to the nearest route error boundary", async () => {
      let { barDefer, container } = setupDeferredTest({
        hasRouteErrorElement: true,
        hasAwaitErrorElement: false,
        triggerRenderError: true,
      });

      fireEvent.click(screen.getByText("Link to Bar"));
      expect(getHtml(container)).toMatchInlineSnapshot(`
        "<div
          id="content"
        >
          <p>
            loading
          </p>
          <h1>
            Foo
          </h1>
        </div>"
      `);

      let barValueDfd = createDeferred();
      barDefer.resolve(
        defer({
          critical: "CRITICAL",
          lazy: barValueDfd.promise,
        })
      );
      await waitFor(() => screen.getByText("idle"));
      expect(getHtml(container)).toMatchInlineSnapshot(`
        "<div
          id="content"
        >
          <p>
            idle
          </p>
          <p>
            CRITICAL
          </p>
          <p>
            Loading...
          </p>
        </div>"
      `);

      barValueDfd.resolve("LAZY");
      await waitFor(() => screen.getByText(/oops is not defined/));
      expect(getHtml(container)).toMatchInlineSnapshot(`
        "<div
          id="content"
        >
          <p>
            idle
          </p>
          <p>
            Route Error:
            oops is not defined
          </p>
        </div>"
      `);
    });

    it("does not handle fallback render errors in the Deferred errorElement", async () => {
      let { barDefer, container } = setupDeferredTest({
        hasRouteErrorElement: true,
        hasAwaitErrorElement: true,
        triggerRenderError: true,
        triggerFallbackError: true,
      });

      fireEvent.click(screen.getByText("Link to Bar"));
      expect(getHtml(container)).toMatchInlineSnapshot(`
        "<div
          id="content"
        >
          <p>
            loading
          </p>
          <h1>
            Foo
          </h1>
        </div>"
      `);

      let barValueDfd = createDeferred();
      barDefer.resolve(
        defer({
          critical: "CRITICAL",
          lazy: barValueDfd.promise,
        })
      );
      await waitFor(() => screen.getByText("idle"));
      expect(getHtml(container)).toMatchInlineSnapshot(`
        "<div
          id="content"
        >
          <p>
            idle
          </p>
          <p>
            Route Error:
            oops is not defined
          </p>
        </div>"
      `);

      // Resolving doesn't do anything
      barValueDfd.resolve("LAZY");
      await new Promise((r) => setTimeout(r, 1));
      expect(getHtml(container)).toMatchInlineSnapshot(`
        "<div
          id="content"
        >
          <p>
            idle
          </p>
          <p>
            Route Error:
            oops is not defined
          </p>
        </div>"
      `);
    });

    it("freezes the UI for aborted deferreds", async () => {
      let { barDefer, bazDefer, container, getAwaitRenderCount } =
        setupDeferredTest();
      fireEvent.click(screen.getByText("Link to Bar"));
      expect(getHtml(container)).toMatchInlineSnapshot(`
        "<div
          id="content"
        >
          <p>
            loading
          </p>
          <h1>
            Foo
          </h1>
        </div>"
      `);
      expect(getAwaitRenderCount()).toBe(0);

      let barValueDfd = createDeferred();
      barDefer.resolve(
        defer({
          critical: "CRITICAL",
          lazy: barValueDfd.promise,
        })
      );
      await waitFor(() => screen.getByText("idle"));
      expect(getHtml(container)).toMatchInlineSnapshot(`
        "<div
          id="content"
        >
          <p>
            idle
          </p>
          <p>
            CRITICAL
          </p>
          <p>
            Loading...
          </p>
        </div>"
      `);
      expect(getAwaitRenderCount()).toBe(1);

      // Abort the deferred by navigating to /baz
      fireEvent.click(screen.getByText("Link to Baz"));
      await new Promise((r) => setTimeout(r, 50));
      expect(getHtml(container)).toMatchInlineSnapshot(`
        "<div
          id="content"
        >
          <p>
            loading
          </p>
          <p>
            CRITICAL
          </p>
          <p>
            Loading...
          </p>
        </div>"
      `);
      // 2 more renders by now - once for the navigation and once for the
      // promise abort rejection
      expect(getAwaitRenderCount()).toBe(3);

      // complete /baz navigation
      bazDefer.resolve(null);
      await waitFor(() => screen.getByText("Baz"));
      expect(getHtml(container)).toMatchInlineSnapshot(`
        "<div
          id="content"
        >
          <p>
            idle
          </p>
          <h1>
            Baz
          </h1>
        </div>"
      `);

      // Does nothing now
      barValueDfd.resolve("LAZY");
      expect(getHtml(container)).toMatchInlineSnapshot(`
        "<div
          id="content"
        >
          <p>
            idle
          </p>
          <h1>
            Baz
          </h1>
        </div>"
      `);
      expect(getAwaitRenderCount()).toBe(3);
    });

    it("should permit direct access to resolved values", async () => {
      let barDefer = createDeferred();

      let router = createMemoryRouter(
        createRoutesFromElements(
          <>
            <Route
              path="foo"
              element={
                <>
                  <h1>Foo</h1>
                  <MemoryNavigate to="/bar">Link to bar</MemoryNavigate>
                </>
              }
            />
            <Route
              path="bar"
              loader={() => barDefer.promise}
              element={<Bar />}
            />
          </>
        ),
        { initialEntries: ["/foo"] }
      );
      let { container } = render(<RouterProvider router={router} />);

      let count = 0;
      function Bar() {
        let { bar } = useLoaderData() as { bar: Promise<string> };

        React.useEffect(() => {
          bar.then((data) => {
            container.querySelector("#content")!.innerHTML =
              data + " " + ++count;
          });
        }, [bar]);

        return <div id="content">Waiting for data...</div>;
      }

      fireEvent.click(screen.getByText("Link to bar"));
      let barValueDefer = createDeferred();
      await barDefer.resolve({ bar: barValueDefer.promise });
      await waitFor(() => screen.getByText("Waiting for data..."));

      expect(getHtml(container)).toMatchInlineSnapshot(`
        "<div>
          <div
            id="content"
          >
            Waiting for data...
          </div>
        </div>"
      `);

      await barValueDefer.resolve("BAR");

      expect(getHtml(container)).toMatchInlineSnapshot(`
        "<div>
          <div
            id="content"
          >
            BAR 1
          </div>
        </div>"
      `);
    });

    it("can render raw resolved promises with <Await>", async () => {
      let dfd = createDeferred();

      let { container } = render(
        <React.Suspense fallback={<p>Loading...</p>}>
          <Await resolve={dfd.promise}>{(data) => <p>{data}</p>}</Await>
        </React.Suspense>
      );

      expect(getHtml(container)).toMatchInlineSnapshot(`
        "<div>
          <p>
            Loading...
          </p>
        </div>"
      `);

      dfd.resolve("RESOLVED");
      await waitFor(() => screen.getByText("RESOLVED"));
      expect(getHtml(container)).toMatchInlineSnapshot(`
        "<div>
          <p>
            RESOLVED
          </p>
        </div>"
      `);
    });

    it("can render raw rejected promises with <Await>", async () => {
      let dfd = createDeferred();

      let { container } = render(
        <React.Suspense fallback={<p>Loading...</p>}>
          <Await resolve={dfd.promise} errorElement={<ErrorElement />}>
            {(data) => <p>{data}</p>}
          </Await>
        </React.Suspense>
      );

      function ErrorElement() {
        let error = useAsyncError() as Error;
        return <p>Error:{error.message}</p>;
      }

      expect(getHtml(container)).toMatchInlineSnapshot(`
        "<div>
          <p>
            Loading...
          </p>
        </div>"
      `);

      await dfd.reject(new Error("REJECTED"));
      await waitFor(() => screen.getByText("Error:REJECTED"));
      expect(getHtml(container)).toMatchInlineSnapshot(`
        "<div>
          <p>
            Error:
            REJECTED
          </p>
        </div>"
      `);
    });

    it("can render raw values with <Await>", async () => {
      let { container } = render(
        <Await resolve={"VALUE"}>{(data) => <p>{data}</p>}</Await>
      );

      expect(getHtml(container)).toMatchInlineSnapshot(`
        "<div>
          <p>
            VALUE
          </p>
        </div>"
      `);
    });
  });
});

function createDeferred() {
  let resolve: (val?: any) => Promise<void>;
  let reject: (error?: Error) => Promise<void>;
  let promise = new Promise((res, rej) => {
    resolve = async (val: any) => {
      res(val);
      try {
        await promise;
      } catch (e) {}
    };
    reject = async (error?: Error) => {
      rej(error);
      try {
        await promise;
      } catch (e) {}
    };
  });
  return {
    promise,
    //@ts-ignore
    resolve,
    //@ts-ignore
    reject,
  };
}

function getHtml(container: HTMLElement) {
  return prettyDOM(container, undefined, {
    highlight: false,
  });
}

function MemoryNavigate({
  to,
  formMethod,
  formData,
  payload,
  children,
}: {
  to: string;
  formMethod?: FormMethod;
  formData?: FormData;
  payload?: NonNullable<unknown>;
  children: React.ReactNode;
}) {
  let dataRouterContext = React.useContext(DataRouterContext);

  let onClickHandler = React.useCallback(
    async (event: React.MouseEvent) => {
      event.preventDefault();
      if (formMethod) {
        if (formData) {
          dataRouterContext?.router.navigate(to, {
            formMethod,
            formData,
          });
        } else {
          dataRouterContext?.router.navigate(to, {
            formMethod,
            payload,
          });
        }
      } else {
        dataRouterContext?.router.navigate(to);
      }
    },
    [dataRouterContext, to, formMethod, formData, payload]
  );

  // Only prepend the basename to the rendered href, send the non-prefixed `to`
  // value into the router since it will prepend the basename
  let basename = dataRouterContext?.basename;
  let href = to;
  if (basename && basename !== "/") {
    href = to === "/" ? basename : joinPaths([basename, to]);
  }

  return formData || payload ? (
    <form onClick={onClickHandler} children={children} />
  ) : (
    <a href={href} onClick={onClickHandler} children={children} />
  );
}
