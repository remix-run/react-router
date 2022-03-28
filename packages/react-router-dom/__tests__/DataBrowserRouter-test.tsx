/**
 * @jest-environment ./__tests__/custom-environment.js
 */

import { JSDOM } from "jsdom";
import * as React from "react";
import {
  render,
  fireEvent,
  waitFor,
  screen,
  prettyDOM,
} from "@testing-library/react";
import "@testing-library/jest-dom";

import {
  DataBrowserRouter,
  Route,
  Outlet,
  useLoaderData,
  useActionData,
  useRouteException,
  useTransition,
  Link,
  useSubmit,
} from "../index";

describe("<DataBrowserRouter>", () => {
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

  it("renders the first route that matches the URL", () => {
    let { container } = render(
      <DataBrowserRouter hydrationData={{}}>
        <Route path="/" element={<h1>Home</h1>} />
      </DataBrowserRouter>
    );

    expect(getHtml(container)).toMatchInlineSnapshot(`
       "<div>
         <h1>
           Home
         </h1>
       </div>"
     `);
  });

  it("renders with hydration data", async () => {
    let { container } = render(
      <DataBrowserRouter
        window={getWindow("/child")}
        hydrationData={{
          loaderData: {
            "0": "parent data",
            "0-0": "child data",
          },
          actionData: {
            "0": "parent action",
            "0-0": "child action",
          },
        }}
      >
        <Route path="/" element={<Comp />}>
          <Route path="child" element={<Comp />} />
        </Route>
      </DataBrowserRouter>
    );

    function Comp() {
      let data = useLoaderData();
      let actionData = useActionData();
      let transition = useTransition();
      return (
        <div>
          {data}
          {actionData}
          {transition.state}
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
    let fooDefer = defer();
    let { container } = render(
      <DataBrowserRouter
        window={getWindow("/foo")}
        fallbackElement={<FallbackElement />}
      >
        <Route path="/" element={<Outlet />}>
          <Route path="foo" loader={() => fooDefer.promise} element={<Foo />} />
          <Route path="bar" element={<Bar />} />
        </Route>
      </DataBrowserRouter>
    );

    function FallbackElement() {
      return <p>Loading...</p>;
    }

    function Foo() {
      let data = useLoaderData();
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

  it("does not render fallbackElement if no data fetch is required", async () => {
    let fooDefer = defer();
    let { container } = render(
      <DataBrowserRouter
        window={getWindow("/bar")}
        fallbackElement={<FallbackElement />}
      >
        <Route path="/" element={<Outlet />}>
          <Route path="foo" loader={() => fooDefer.promise} element={<Foo />} />
          <Route path="bar" element={<Bar />} />
        </Route>
      </DataBrowserRouter>
    );

    function FallbackElement() {
      return <p>Loading...</p>;
    }

    function Foo() {
      let data = useLoaderData();
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

  it("handles link navigations", async () => {
    render(
      <DataBrowserRouter window={getWindow("/foo")} hydrationData={{}}>
        <Route path="/" element={<Layout />}>
          <Route path="foo" element={<Foo />} />
          <Route path="bar" element={<Bar />} />
        </Route>
      </DataBrowserRouter>
    );

    function Layout() {
      return (
        <div>
          <Link to="/foo">Link to Foo</Link>
          <Link to="/bar">Link to Bar</Link>
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
    let barDefer = defer();

    let { container } = render(
      <DataBrowserRouter window={getWindow("/foo")} hydrationData={{}}>
        <Route path="/" element={<Layout />}>
          <Route path="foo" element={<Foo />} />
          <Route path="bar" loader={() => barDefer.promise} element={<Bar />} />
        </Route>
      </DataBrowserRouter>
    );

    function Layout() {
      let transition = useTransition();
      return (
        <div>
          <Link to="/bar">Link to Bar</Link>
          <p>{transition.state}</p>
          <Outlet />
        </div>
      );
    }

    function Foo() {
      return <h1>Foo</h1>;
    }
    function Bar() {
      let data = useLoaderData();
      return <h1>{data?.message}</h1>;
    }

    expect(getHtml(container)).toMatchInlineSnapshot(`
      "<div>
        <div>
          <a
            href=\\"/bar\\"
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
            href=\\"/bar\\"
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
            href=\\"/bar\\"
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

  it("executes route actions/loaders on useSubmit navigations", async () => {
    let barDefer = defer();
    let barActionDefer = defer();
    let formData = new FormData();
    formData.append("test", "value");

    let { container } = render(
      <DataBrowserRouter window={getWindow("/foo")} hydrationData={{}}>
        <Route path="/" element={<Layout />}>
          <Route path="foo" element={<Foo />} />
          <Route
            path="bar"
            action={() => barActionDefer.promise}
            loader={() => barDefer.promise}
            element={<Bar />}
          />
        </Route>
      </DataBrowserRouter>
    );

    function Form({
      children,
    }: {
      children: React.ReactElement | React.ReactElement[];
    }) {
      let submit = useSubmit();
      return (
        <form
          method="post"
          action="/bar"
          data-testid="test-form"
          onClick={(e) => submit(e.target as HTMLFormElement)}
          onSubmit={(e) => e.preventDefault()}
          children={children}
        ></form>
      );
    }

    function Layout() {
      let transition = useTransition();
      return (
        <div>
          <Form>
            <input name="test" value="value" />
          </Form>
          <p>{transition.state}</p>
          <Outlet />
        </div>
      );
    }

    function Foo() {
      return <h1>Foo</h1>;
    }
    function Bar() {
      let data = useLoaderData();
      let actionData = useActionData();
      return (
        <h1>
          {data}
          {actionData}
        </h1>
      );
    }

    expect(getHtml(container)).toMatchInlineSnapshot(`
      "<div>
        <div>
          <form
            action=\\"/bar\\"
            data-testid=\\"test-form\\"
            method=\\"post\\"
          >
            <input
              name=\\"test\\"
              value=\\"value\\"
            />
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

    fireEvent.click(screen.getByTestId("test-form"));
    await waitFor(() => screen.getByText("submitting"));
    expect(getHtml(container)).toMatchInlineSnapshot(`
      "<div>
        <div>
          <form
            action=\\"/bar\\"
            data-testid=\\"test-form\\"
            method=\\"post\\"
          >
            <input
              name=\\"test\\"
              value=\\"value\\"
            />
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
          <form
            action=\\"/bar\\"
            data-testid=\\"test-form\\"
            method=\\"post\\"
          >
            <input
              name=\\"test\\"
              value=\\"value\\"
            />
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
          <form
            action=\\"/bar\\"
            data-testid=\\"test-form\\"
            method=\\"post\\"
          >
            <input
              name=\\"test\\"
              value=\\"value\\"
            />
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

  it.todo("executes route actions/loaders on <Form method=get> navigations");

  it.todo("executes route actions/loaders on <Form method=post> navigations");

  describe("exceptions", () => {
    it("renders hydration exceptions on leaf elements", async () => {
      let { container } = render(
        <DataBrowserRouter
          window={getWindow("/child")}
          hydrationData={{
            loaderData: {
              "0": "parent data",
            },
            actionData: {
              "0": "parent action",
            },
            exceptions: {
              "0-0": new Error("Kaboom 💥"),
            },
          }}
        >
          <Route path="/" element={<Comp />}>
            <Route
              path="child"
              element={<Comp />}
              exceptionElement={<ErrorBoundary />}
            />
          </Route>
        </DataBrowserRouter>
      );

      function Comp() {
        let data = useLoaderData();
        let actionData = useActionData();
        let transition = useTransition();
        return (
          <div>
            {data}
            {actionData}
            {transition.state}
            <Outlet />
          </div>
        );
      }

      function ErrorBoundary() {
        let error = useRouteException();
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

    it("renders hydration exceptions on parent elements", async () => {
      let { container } = render(
        <DataBrowserRouter
          window={getWindow("/child")}
          hydrationData={{
            loaderData: {},
            actionData: null,
            exceptions: {
              "0": new Error("Kaboom 💥"),
            },
          }}
        >
          <Route
            path="/"
            element={<Comp />}
            exceptionElement={<ErrorBoundary />}
          >
            <Route path="child" element={<Comp />} />
          </Route>
        </DataBrowserRouter>
      );

      function Comp() {
        let data = useLoaderData();
        let actionData = useActionData();
        let transition = useTransition();
        return (
          <div>
            {data}
            {actionData}
            {transition.state}
            <Outlet />
          </div>
        );
      }

      function ErrorBoundary() {
        let error = useRouteException();
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

    it("renders navigation exceptions on leaf elements", async () => {
      let fooDefer = defer();
      let barDefer = defer();

      let { container } = render(
        <DataBrowserRouter
          window={getWindow("/foo")}
          hydrationData={{
            loaderData: {
              "0-0": {
                message: "hydrated from foo",
              },
            },
          }}
        >
          <Route path="/" element={<Layout />}>
            <Route
              path="foo"
              loader={() => fooDefer.promise}
              element={<Foo />}
              exceptionElement={<FooException />}
            />
            <Route
              path="bar"
              loader={() => barDefer.promise}
              element={<Bar />}
              exceptionElement={<BarException />}
            />
          </Route>
        </DataBrowserRouter>
      );

      function Layout() {
        let transition = useTransition();
        return (
          <div>
            <Link to="/foo">Link to Foo</Link>
            <Link to="/bar">Link to Bar</Link>
            <p>{transition.state}</p>
            <Outlet />
          </div>
        );
      }

      function Foo() {
        let data = useLoaderData();
        return <h1>Foo:{data?.message}</h1>;
      }
      function FooException() {
        let exception = useRouteException();
        return <p>Foo Exception:{exception.message}</p>;
      }
      function Bar() {
        let data = useLoaderData();
        return <h1>Bar:{data?.message}</h1>;
      }
      function BarException() {
        let exception = useRouteException();
        return <p>Bar Exception:{exception.message}</p>;
      }

      expect(getHtml(container)).toMatchInlineSnapshot(`
        "<div>
          <div>
            <a
              href=\\"/foo\\"
            >
              Link to Foo
            </a>
            <a
              href=\\"/bar\\"
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
              href=\\"/foo\\"
            >
              Link to Foo
            </a>
            <a
              href=\\"/bar\\"
            >
              Link to Bar
            </a>
            <p>
              idle
            </p>
            <p>
              Bar Exception:
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
              href=\\"/foo\\"
            >
              Link to Foo
            </a>
            <a
              href=\\"/bar\\"
            >
              Link to Bar
            </a>
            <p>
              idle
            </p>
            <p>
              Foo Exception:
              Kaboom!
            </p>
          </div>
        </div>"
       `);
    });

    it("renders navigation exceptions on parent elements", async () => {
      let fooDefer = defer();
      let barDefer = defer();

      let { container } = render(
        <DataBrowserRouter
          window={getWindow("/foo")}
          hydrationData={{
            loaderData: {
              "0-0": {
                message: "hydrated from foo",
              },
            },
          }}
        >
          <Route
            path="/"
            element={<Layout />}
            exceptionElement={<LayoutException />}
          >
            <Route
              path="foo"
              loader={() => fooDefer.promise}
              element={<Foo />}
              exceptionElement={<FooException />}
            />
            <Route
              path="bar"
              loader={() => barDefer.promise}
              element={<Bar />}
            />
          </Route>
        </DataBrowserRouter>
      );

      function Layout() {
        let transition = useTransition();
        return (
          <div>
            <Link to="/foo">Link to Foo</Link>
            <Link to="/bar">Link to Bar</Link>
            <p>{transition.state}</p>
            <Outlet />
          </div>
        );
      }
      function LayoutException() {
        let exception = useRouteException();
        return <p>Layout Exception:{exception.message}</p>;
      }
      function Foo() {
        let data = useLoaderData();
        return <h1>Foo:{data?.message}</h1>;
      }
      function FooException() {
        let exception = useRouteException();
        return <p>Foo Exception:{exception.message}</p>;
      }
      function Bar() {
        let data = useLoaderData();
        return <h1>Bar:{data?.message}</h1>;
      }

      expect(getHtml(container)).toMatchInlineSnapshot(`
        "<div>
          <div>
            <a
              href=\\"/foo\\"
            >
              Link to Foo
            </a>
            <a
              href=\\"/bar\\"
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
      await waitFor(() => screen.getByText("Layout Exception:Kaboom!"));
      expect(getHtml(container)).toMatchInlineSnapshot(`
        "<div>
          <p>
            Layout Exception:
            Kaboom!
          </p>
        </div>"
      `);
    });
  });
});

function defer() {
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

function getWindow(initialUrl: string): Window {
  // Need to use our own custom DOM in order to get a working history
  const dom = new JSDOM(`<!DOCTYPE html>`, { url: "https://remix.run/" });
  dom.window.history.replaceState(null, "", initialUrl);
  return dom.window as unknown as Window;
}

function getHtml(container: HTMLElement) {
  return prettyDOM(container, null, {
    highlight: false,
    theme: {
      comment: null,
      content: null,
      prop: null,
      tag: null,
      value: null,
    },
  });
}
