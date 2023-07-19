import "@testing-library/jest-dom";
import {
  fireEvent,
  queryByText,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import * as React from "react";
import {
  Outlet,
  Route,
  RouterProvider,
  createMemoryRouter,
  createRoutesFromElements,
  useLoaderData,
  useNavigation,
  useRevalidator,
  useRouteError,
} from "react-router";
import MemoryNavigate from "./utils/MemoryNavigate";
import getHtml from "./utils/getHtml";

describe("useRevalidator", () => {
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

  it("is stable across location changes", async () => {
    let count = 0;
    let router = createMemoryRouter([
      {
        path: "/",
        Component() {
          let revalidator = useRevalidator();

          React.useEffect(() => {
            count++;
          }, [revalidator]);
          return (
            <div>
              <MemoryNavigate to="/">Link to Home</MemoryNavigate>{" "}
              <MemoryNavigate to="/foo">Link to Foo</MemoryNavigate>
              <Outlet />
            </div>
          );
        },
        children: [
          {
            index: true,
            Component() {
              return <h1>Home Page</h1>;
            },
          },
          {
            path: "foo",
            Component() {
              return <h1>Foo Page</h1>;
            },
          },
        ],
      },
    ]);

    render(<RouterProvider router={router} />);

    fireEvent.click(screen.getByText("Link to Foo"));
    await waitFor(() => screen.getByText("Foo Page"));

    fireEvent.click(screen.getByText("Link to Home"));
    await waitFor(() => screen.getByText("Home Page"));

    expect(count).toBe(1);
  });
});
