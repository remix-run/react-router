/**
 * @jest-environment ./__tests__/custom-environment.js
 */

import { JSDOM } from "jsdom";
import * as React from "react";
import {
  act,
  render,
  fireEvent,
  waitFor,
  screen,
  prettyDOM,
} from "@testing-library/react";
import "@testing-library/jest-dom";

import {
  DataBrowserRouter,
  DataHashRouter,
  Form,
  Link,
  Route,
  Outlet,
  useLoaderData,
  useActionData,
  useRouteError,
  useNavigate,
  useNavigation,
  useSubmit,
  useFetcher,
  useFetchers,
  UNSAFE_DataRouterStateContext as DataRouterStateContext,
  defer,
} from "react-router-dom";

// Private API
import { _resetModuleScope } from "../index";

testDomRouter("<DataBrowserRouter>", DataBrowserRouter, (url) =>
  getWindowImpl(url, false)
);

testDomRouter("<DataHashRouter>", DataHashRouter, (url) =>
  getWindowImpl(url, true)
);

function testDomRouter(
  name: string,
  TestDataRouter: typeof DataBrowserRouter,
  getWindow: (initialUrl: string, isHash?: boolean) => Window
) {
  describe(`Router: ${name}`, () => {
    let consoleWarn: jest.SpyInstance;
    let consoleError: jest.SpyInstance;
    beforeEach(() => {
      consoleWarn = jest.spyOn(console, "warn").mockImplementation(() => {});
      consoleError = jest.spyOn(console, "error").mockImplementation(() => {});
    });

    afterEach(() => {
      window.__staticRouterHydrationData = undefined;
      consoleWarn.mockRestore();
      consoleError.mockRestore();
      _resetModuleScope();
    });

    it("renders the first route that matches the URL", () => {
      let { container } = render(
        <TestDataRouter hydrationData={{}}>
          <Route path="/" element={<h1>Home</h1>} />
        </TestDataRouter>
      );

      expect(getHtml(container)).toMatchInlineSnapshot(`
         "<div>
           <h1>
             Home
           </h1>
         </div>"
       `);
    });

    it("renders the first route that matches the URL when wrapped in a root Route", () => {
      let { container } = render(
        <TestDataRouter
          window={getWindow("/my/base/path/thing")}
          hydrationData={{}}
        >
          <Route path="/my/base/path">
            <Route element={<Outlet />}>
              <Route path="thing" element={<h1>Heyooo</h1>} />
            </Route>
          </Route>
        </TestDataRouter>
      );

      expect(getHtml(container)).toMatchInlineSnapshot(`
         "<div>
           <h1>
             Heyooo
           </h1>
         </div>"
       `);
    });

    it("supports a basename prop", () => {
      let { container } = render(
        <TestDataRouter
          basename="/my/base/path"
          window={getWindow("/my/base/path/thing")}
          hydrationData={{}}
        >
          <Route path="thing" element={<h1>Heyooo</h1>} />
        </TestDataRouter>
      );

      expect(getHtml(container)).toMatchInlineSnapshot(`
        "<div>
          <h1>
            Heyooo
          </h1>
        </div>"
      `);
    });

    it("renders with hydration data", async () => {
      let { container } = render(
        <TestDataRouter
          window={getWindow("/child")}
          hydrationData={{
            loaderData: {
              "0": "parent data",
              "0-0": "child data",
            },
            actionData: {
              "0-0": "child action",
            },
          }}
        >
          <Route path="/" element={<Comp />}>
            <Route path="child" element={<Comp />} />
          </Route>
        </TestDataRouter>
      );

      function Comp() {
        let data = useLoaderData();
        let actionData = useActionData();
        let navigation = useNavigation();
        return (
          <div>
            {data}
            {actionData}
            {navigation.state}
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

    it("handles automatic hydration from the window", async () => {
      window.__staticRouterHydrationData = {
        loaderData: {
          "0": "parent data",
          "0-0": "child data",
        },
        actionData: {
          "0-0": "child action",
        },
      };
      let { container } = render(
        <TestDataRouter window={getWindow("/child")}>
          <Route path="/" element={<Comp />}>
            <Route path="child" element={<Comp />} />
          </Route>
        </TestDataRouter>
      );

      function Comp() {
        let data = useLoaderData();
        let actionData = useActionData();
        let navigation = useNavigation();
        return (
          <div>
            {data}
            {actionData}
            {navigation.state}
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
      let { container } = render(
        <TestDataRouter
          window={getWindow("/foo")}
          fallbackElement={<FallbackElement />}
        >
          <Route path="/" element={<Outlet />}>
            <Route
              path="foo"
              loader={() => fooDefer.promise}
              element={<Foo />}
            />
            <Route path="bar" element={<Bar />} />
          </Route>
        </TestDataRouter>
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
      let fooDefer = createDeferred();
      let { container } = render(
        <TestDataRouter
          window={getWindow("/bar")}
          fallbackElement={<FallbackElement />}
        >
          <Route path="/" element={<Outlet />}>
            <Route
              path="foo"
              loader={() => fooDefer.promise}
              element={<Foo />}
            />
            <Route path="bar" element={<Bar />} />
          </Route>
        </TestDataRouter>
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
        <TestDataRouter window={getWindow("/foo")} hydrationData={{}}>
          <Route path="/" element={<Layout />}>
            <Route path="foo" element={<h1>Foo Heading</h1>} />
            <Route path="bar" element={<h1>Bar Heading</h1>} />
          </Route>
        </TestDataRouter>
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

      expect(screen.getByText("Foo Heading")).toBeDefined();
      fireEvent.click(screen.getByText("Link to Bar"));
      await waitFor(() => screen.getByText("Bar Heading"));

      fireEvent.click(screen.getByText("Link to Foo"));
      await waitFor(() => screen.getByText("Foo Heading"));
    });

    it("handles link navigations when using a basename", async () => {
      let testWindow = getWindow("/base/name/foo");
      render(
        <TestDataRouter
          basename="/base/name"
          window={testWindow}
          hydrationData={{}}
        >
          <Route path="/" element={<Layout />}>
            <Route path="foo" element={<h1>Foo Heading</h1>} />
            <Route path="bar" element={<h1>Bar Heading</h1>} />
          </Route>
        </TestDataRouter>
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

      function assertPathname(pathname) {
        if (name === "<DataHashRouter>") {
          // eslint-disable-next-line jest/no-conditional-expect
          expect(testWindow.location.hash).toEqual("#" + pathname);
        } else {
          // eslint-disable-next-line jest/no-conditional-expect
          expect(testWindow.location.pathname).toEqual(pathname);
        }
      }

      assertPathname("/base/name/foo");

      expect(screen.getByText("Foo Heading")).toBeDefined();
      fireEvent.click(screen.getByText("Link to Bar"));
      await waitFor(() => screen.getByText("Bar Heading"));
      assertPathname("/base/name/bar");

      fireEvent.click(screen.getByText("Link to Foo"));
      await waitFor(() => screen.getByText("Foo Heading"));
      assertPathname("/base/name/foo");
    });

    it("executes route loaders on navigation", async () => {
      let barDefer = createDeferred();

      let { container } = render(
        <TestDataRouter window={getWindow("/foo")} hydrationData={{}}>
          <Route path="/" element={<Layout />}>
            <Route path="foo" element={<Foo />} />
            <Route
              path="bar"
              loader={() => barDefer.promise}
              element={<Bar />}
            />
          </Route>
        </TestDataRouter>
      );

      function Layout() {
        let navigation = useNavigation();
        return (
          <div>
            <Link to="/bar">Link to Bar</Link>
            <p>{navigation.state}</p>
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

    it("handles link navigations with resetScroll=false", async () => {
      let { container } = render(
        <TestDataRouter window={getWindow("/foo")} hydrationData={{}}>
          <Route path="/" element={<Layout />}>
            <Route path="foo" element={<h1>Foo Heading</h1>} />
            <Route path="bar" element={<h1>Bar Heading</h1>} />
          </Route>
        </TestDataRouter>
      );

      function Layout() {
        let state = React.useContext(DataRouterStateContext);
        return (
          <div>
            <Link to="/foo" resetScroll={false}>
              Link to Foo
            </Link>
            <Link to="/bar">Link to Bar</Link>
            <p id="resetScrollPosition">{String(state.resetScrollPosition)}</p>
            <Outlet />
          </div>
        );
      }

      fireEvent.click(screen.getByText("Link to Bar"));
      await waitFor(() => screen.getByText("Bar Heading"));
      expect(getHtml(container.querySelector("#resetScrollPosition")))
        .toMatchInlineSnapshot(`
        "<p
          id=\\"resetScrollPosition\\"
        >
          true
        </p>"
      `);

      fireEvent.click(screen.getByText("Link to Foo"));
      await waitFor(() => screen.getByText("Foo Heading"));
      expect(getHtml(container.querySelector("#resetScrollPosition")))
        .toMatchInlineSnapshot(`
        "<p
          id=\\"resetScrollPosition\\"
        >
          false
        </p>"
      `);
    });

    it("executes route actions/loaders on useSubmit navigations", async () => {
      let loaderDefer = createDeferred();
      let actionDefer = createDeferred();

      let { container } = render(
        <TestDataRouter window={getWindow("/")} hydrationData={{}}>
          <Route
            path="/"
            action={() => actionDefer.promise}
            loader={() => loaderDefer.promise}
            element={<Home />}
          />
        </TestDataRouter>
      );

      function Home() {
        let data = useLoaderData();
        let actionData = useActionData();
        let navigation = useNavigation();
        let submit = useSubmit();
        let formRef = React.useRef();
        return (
          <div>
            <form method="post" action="/" ref={formRef}>
              <input name="test" value="value" />
            </form>
            <button onClick={() => submit(formRef.current)}>Submit Form</button>
            <div id="output">
              <p>{navigation.state}</p>
              <p>{data}</p>
              <p>{actionData}</p>
            </div>
            <Outlet />
          </div>
        );
      }

      expect(getHtml(container.querySelector("#output")))
        .toMatchInlineSnapshot(`
        "<div
          id=\\"output\\"
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
      expect(getHtml(container.querySelector("#output")))
        .toMatchInlineSnapshot(`
        "<div
          id=\\"output\\"
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
      expect(getHtml(container.querySelector("#output")))
        .toMatchInlineSnapshot(`
        "<div
          id=\\"output\\"
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
      expect(getHtml(container.querySelector("#output")))
        .toMatchInlineSnapshot(`
        "<div
          id=\\"output\\"
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

    it("executes route loaders on <Form method=get> navigations", async () => {
      let loaderDefer = createDeferred();
      let actionDefer = createDeferred();

      let { container } = render(
        <TestDataRouter window={getWindow("/")} hydrationData={{}}>
          <Route
            path="/"
            action={() => actionDefer.promise}
            loader={async ({ request }) => {
              let resolvedValue = await loaderDefer.promise;
              let urlParam = new URL(
                `https://remix.run${request.url}`
              ).searchParams.get("test");
              return `${resolvedValue}:${urlParam}`;
            }}
            element={<Home />}
          />
        </TestDataRouter>
      );

      function Home() {
        let data = useLoaderData();
        let actionData = useActionData();
        let navigation = useNavigation();
        return (
          <div>
            <Form method="get">
              <input name="test" value="value" />
              <button type="submit">Submit Form</button>
            </Form>
            <div id="output">
              <p>{navigation.state}</p>
              <p>{data}</p>
              <p>{actionData}</p>
            </div>
            <Outlet />
          </div>
        );
      }

      expect(getHtml(container.querySelector("#output")))
        .toMatchInlineSnapshot(`
        "<div
          id=\\"output\\"
        >
          <p>
            idle
          </p>
          <p />
          <p />
        </div>"
      `);

      fireEvent.click(screen.getByText("Submit Form"));
      await waitFor(() => screen.getByText("loading"));
      expect(getHtml(container.querySelector("#output")))
        .toMatchInlineSnapshot(`
        "<div
          id=\\"output\\"
        >
          <p>
            loading
          </p>
          <p />
          <p />
        </div>"
      `);

      loaderDefer.resolve("Loader Data");
      await waitFor(() => screen.getByText("idle"));
      expect(getHtml(container.querySelector("#output")))
        .toMatchInlineSnapshot(`
        "<div
          id=\\"output\\"
        >
          <p>
            idle
          </p>
          <p>
            Loader Data:value
          </p>
          <p />
        </div>"
      `);
    });

    it("executes route actions/loaders on <Form method=post> navigations", async () => {
      let loaderDefer = createDeferred();
      let actionDefer = createDeferred();

      let { container } = render(
        <TestDataRouter window={getWindow("/")} hydrationData={{}}>
          <Route
            path="/"
            action={async ({ request }) => {
              let resolvedValue = await actionDefer.promise;
              let formData = await request.formData();
              return `${resolvedValue}:${formData.get("test")}`;
            }}
            loader={() => loaderDefer.promise}
            element={<Home />}
          />
        </TestDataRouter>
      );

      function Home() {
        let data = useLoaderData();
        let actionData = useActionData();
        let navigation = useNavigation();
        return (
          <div>
            <Form method="post">
              <input name="test" value="value" />
              <button type="submit">Submit Form</button>
            </Form>
            <div id="output">
              <p>{navigation.state}</p>
              <p>{data}</p>
              <p>{actionData}</p>
            </div>
            <Outlet />
          </div>
        );
      }

      expect(getHtml(container.querySelector("#output")))
        .toMatchInlineSnapshot(`
        "<div
          id=\\"output\\"
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
      expect(getHtml(container.querySelector("#output")))
        .toMatchInlineSnapshot(`
        "<div
          id=\\"output\\"
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
      expect(getHtml(container.querySelector("#output")))
        .toMatchInlineSnapshot(`
        "<div
          id=\\"output\\"
        >
          <p>
            loading
          </p>
          <p />
          <p>
            Action Data:value
          </p>
        </div>"
      `);

      loaderDefer.resolve("Loader Data");
      await waitFor(() => screen.getByText("idle"));
      expect(getHtml(container.querySelector("#output")))
        .toMatchInlineSnapshot(`
        "<div
          id=\\"output\\"
        >
          <p>
            idle
          </p>
          <p>
            Loader Data
          </p>
          <p>
            Action Data:value
          </p>
        </div>"
      `);
    });

    it("supports <Form reloadDocument={true}>", async () => {
      let actionSpy = jest.fn();
      render(
        <TestDataRouter window={getWindow("/")} hydrationData={{}}>
          <Route path="/" action={actionSpy} element={<Home />} />
        </TestDataRouter>
      );

      let handlerCalled;
      let defaultPrevented;

      function Home() {
        return (
          <Form
            method="post"
            reloadDocument={true}
            onSubmit={(e) => {
              handlerCalled = true;
              defaultPrevented = e.defaultPrevented;
            }}
          >
            <input name="test" value="value" />
            <button type="submit">Submit Form</button>
          </Form>
        );
      }

      fireEvent.click(screen.getByText("Submit Form"));
      expect(handlerCalled).toBe(true);
      expect(defaultPrevented).toBe(false);
      expect(actionSpy).not.toHaveBeenCalled();
    });

    it('defaults <Form method="get"> to be a PUSH navigation', async () => {
      let { container } = render(
        <TestDataRouter window={getWindow("/")} hydrationData={{}}>
          <Route element={<Layout />}>
            <Route index loader={() => "index"} element={<h1>index</h1>} />
            <Route path="1" loader={() => "1"} element={<h1>Page 1</h1>} />
            <Route path="2" loader={() => "2"} element={<h1>Page 2</h1>} />
          </Route>
        </TestDataRouter>
      );

      function Layout() {
        let navigate = useNavigate();
        return (
          <>
            <Form action="1">
              <input name="test" defaultValue="value" />
              <button type="submit">Submit Form</button>
            </Form>
            <button onClick={() => navigate(-1)}>Go back</button>
            <div className="output">
              <Outlet />
            </div>
          </>
        );
      }

      expect(getHtml(container.querySelector(".output")))
        .toMatchInlineSnapshot(`
        "<div
          class=\\"output\\"
        >
          <h1>
            index
          </h1>
        </div>"
      `);

      fireEvent.click(screen.getByText("Submit Form"));
      await waitFor(() => screen.getByText("Page 1"));
      expect(getHtml(container.querySelector(".output")))
        .toMatchInlineSnapshot(`
        "<div
          class=\\"output\\"
        >
          <h1>
            Page 1
          </h1>
        </div>"
      `);

      fireEvent.click(screen.getByText("Go back"));
      await waitFor(() => screen.getByText("index"));
      expect(getHtml(container.querySelector(".output")))
        .toMatchInlineSnapshot(`
        "<div
          class=\\"output\\"
        >
          <h1>
            index
          </h1>
        </div>"
      `);
    });

    it('defaults <Form method="post"> to be a REPLACE navigation', async () => {
      let { container } = render(
        <TestDataRouter window={getWindow("/")} hydrationData={{}}>
          <Route element={<Layout />}>
            <Route index loader={() => "index"} element={<h1>Index Page</h1>} />
            <Route
              path="form"
              action={() => "action data"}
              element={<FormPage />}
            />
            <Route path="result" element={<h1>Result Page</h1>} />
          </Route>
        </TestDataRouter>
      );

      function Layout() {
        let navigate = useNavigate();
        return (
          <>
            <Link to="form">Go to Form</Link>
            <button onClick={() => navigate(-1)}>Go back</button>
            <div className="output">
              <Outlet />
            </div>
          </>
        );
      }

      function FormPage() {
        let data = useActionData();
        return (
          <Form method="post">
            <p>Form Page</p>
            <p>{data}</p>
            <input name="test" defaultValue="value" />
            <button type="submit">Submit</button>
          </Form>
        );
      }

      let html = () => getHtml(container.querySelector(".output"));

      // Start on index page
      expect(html()).toMatch("Index Page");

      // Navigate to form page
      fireEvent.click(screen.getByText("Go to Form"));
      await waitFor(() => screen.getByText("Form Page"));
      expect(html()).not.toMatch("action result");

      // Submit without redirect does a replace
      fireEvent.click(screen.getByText("Submit"));
      await waitFor(() => screen.getByText("action data"));
      expect(html()).toMatch("Form Page");
      expect(html()).toMatch("action data");

      // Back navigate to index page
      fireEvent.click(screen.getByText("Go back"));
      await waitFor(() => screen.getByText("Index Page"));
    });

    it('Uses a PUSH navigation on <Form method="post"> if it redirects', async () => {
      let { container } = render(
        <TestDataRouter window={getWindow("/")} hydrationData={{}}>
          <Route element={<Layout />}>
            <Route index loader={() => "index"} element={<h1>Index Page</h1>} />
            <Route
              path="form"
              action={() =>
                new Response(null, {
                  status: 302,
                  headers: { Location: "/result" },
                })
              }
              element={<FormPage />}
            />
            <Route path="result" element={<h1>Result Page</h1>} />
          </Route>
        </TestDataRouter>
      );

      function Layout() {
        let navigate = useNavigate();
        return (
          <>
            <Link to="form">Go to Form</Link>
            <button onClick={() => navigate(-1)}>Go back</button>
            <div className="output">
              <Outlet />
            </div>
          </>
        );
      }

      function FormPage() {
        let data = useActionData();
        return (
          <Form method="post">
            <p>Form Page</p>
            <p>{data}</p>
            <input name="test" defaultValue="value" />
            <button type="submit">Submit</button>
          </Form>
        );
      }

      let html = () => getHtml(container.querySelector(".output"));

      // Start on index page
      expect(html()).toMatch("Index Page");

      // Navigate to form page
      fireEvent.click(screen.getByText("Go to Form"));
      await waitFor(() => screen.getByText("Form Page"));

      // Submit with redirect
      fireEvent.click(screen.getByText("Submit"));
      await waitFor(() => screen.getByText("Result Page"));

      // Back navigate to form page
      fireEvent.click(screen.getByText("Go back"));
      await waitFor(() => screen.getByText("Form Page"));
    });

    it('defaults useSubmit({ method: "get" }) to be a PUSH navigation', async () => {
      let { container } = render(
        <TestDataRouter window={getWindow("/")} hydrationData={{}}>
          <Route element={<Layout />}>
            <Route index loader={() => "index"} element={<h1>index</h1>} />
            <Route path="1" loader={() => "1"} element={<h1>Page 1</h1>} />
            <Route path="2" loader={() => "2"} element={<h1>Page 2</h1>} />
          </Route>
        </TestDataRouter>
      );

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

      expect(getHtml(container.querySelector(".output")))
        .toMatchInlineSnapshot(`
        "<div
          class=\\"output\\"
        >
          <h1>
            index
          </h1>
        </div>"
      `);

      fireEvent.click(screen.getByText("Submit"));
      await waitFor(() => screen.getByText("Page 1"));
      expect(getHtml(container.querySelector(".output")))
        .toMatchInlineSnapshot(`
        "<div
          class=\\"output\\"
        >
          <h1>
            Page 1
          </h1>
        </div>"
      `);

      fireEvent.click(screen.getByText("Go back"));
      await waitFor(() => screen.getByText("index"));
      expect(getHtml(container.querySelector(".output")))
        .toMatchInlineSnapshot(`
        "<div
          class=\\"output\\"
        >
          <h1>
            index
          </h1>
        </div>"
      `);
    });

    it('defaults useSubmit({ method: "post" }) to be a REPLACE navigation', async () => {
      let { container } = render(
        <TestDataRouter window={getWindow("/")} hydrationData={{}}>
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
        </TestDataRouter>
      );

      function Layout() {
        let navigate = useNavigate();
        let submit = useSubmit();
        let formData = new FormData();
        formData.append("test", "value");
        return (
          <>
            <Link to="1">Go to 1</Link>
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

      expect(getHtml(container.querySelector(".output")))
        .toMatchInlineSnapshot(`
        "<div
          class=\\"output\\"
        >
          <h1>
            index
          </h1>
        </div>"
      `);

      fireEvent.click(screen.getByText("Go to 1"));
      await waitFor(() => screen.getByText("Page 1"));
      expect(getHtml(container.querySelector(".output")))
        .toMatchInlineSnapshot(`
        "<div
          class=\\"output\\"
        >
          <h1>
            Page 1
          </h1>
        </div>"
      `);

      fireEvent.click(screen.getByText("Submit"));
      await waitFor(() => screen.getByText("Page 2"));
      expect(getHtml(container.querySelector(".output")))
        .toMatchInlineSnapshot(`
        "<div
          class=\\"output\\"
        >
          <h1>
            Page 2
          </h1>
        </div>"
      `);

      fireEvent.click(screen.getByText("Go back"));
      await waitFor(() => screen.getByText("index"));
      expect(getHtml(container.querySelector(".output")))
        .toMatchInlineSnapshot(`
        "<div
          class=\\"output\\"
        >
          <h1>
            index
          </h1>
        </div>"
      `);
    });

    describe("useSubmit/Form FormData", () => {
      it("gathers form data on <Form> submissions", async () => {
        let actionSpy = jest.fn();
        render(
          <TestDataRouter window={getWindow("/")}>
            <Route path="/" action={actionSpy} element={<FormPage />} />
          </TestDataRouter>
        );

        function FormPage() {
          return (
            <Form method="post">
              <input name="a" defaultValue="1" />
              <input name="b" defaultValue="2" />
              <button type="submit">Submit</button>
            </Form>
          );
        }

        fireEvent.click(screen.getByText("Submit"));
        let formData = await actionSpy.mock.calls[0][0].request.formData();
        expect(formData.get("a")).toBe("1");
        expect(formData.get("b")).toBe("2");
      });

      it("gathers form data on submit(form) submissions", async () => {
        let actionSpy = jest.fn();
        render(
          <TestDataRouter window={getWindow("/")}>
            <Route path="/" action={actionSpy} element={<FormPage />} />
          </TestDataRouter>
        );

        function FormPage() {
          let submit = useSubmit();
          let formRef = React.useRef(null);
          return (
            <>
              <Form method="post" ref={formRef}>
                <input name="a" defaultValue="1" />
                <input name="b" defaultValue="2" />
              </Form>
              <button onClick={() => submit(formRef.current)}>Submit</button>
            </>
          );
        }

        fireEvent.click(screen.getByText("Submit"));
        let formData = await actionSpy.mock.calls[0][0].request.formData();
        expect(formData.get("a")).toBe("1");
        expect(formData.get("b")).toBe("2");
      });

      it("gathers form data on submit(button) submissions", async () => {
        let actionSpy = jest.fn();
        render(
          <TestDataRouter window={getWindow("/")}>
            <Route path="/" action={actionSpy} element={<FormPage />} />
          </TestDataRouter>
        );

        function FormPage() {
          let submit = useSubmit();
          return (
            <>
              <Form method="post">
                <input name="a" defaultValue="1" />
                <input name="b" defaultValue="2" />
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    submit(e.currentTarget);
                  }}
                >
                  Submit
                </button>
              </Form>
            </>
          );
        }

        fireEvent.click(screen.getByText("Submit"));
        let formData = await actionSpy.mock.calls[0][0].request.formData();
        expect(formData.get("a")).toBe("1");
        expect(formData.get("b")).toBe("2");
      });

      it("gathers form data on submit(input[type=submit]) submissions", async () => {
        let actionSpy = jest.fn();
        render(
          <TestDataRouter window={getWindow("/")}>
            <Route path="/" action={actionSpy} element={<FormPage />} />
          </TestDataRouter>
        );

        function FormPage() {
          let submit = useSubmit();
          return (
            <>
              <Form method="post">
                <input name="a" defaultValue="1" />
                <input name="b" defaultValue="2" />
                <input
                  type="submit"
                  value="Submit"
                  onClick={(e) => {
                    e.preventDefault();
                    submit(e.currentTarget);
                  }}
                />
              </Form>
            </>
          );
        }

        fireEvent.click(screen.getByText("Submit"));
        let formData = await actionSpy.mock.calls[0][0].request.formData();
        expect(formData.get("a")).toBe("1");
        expect(formData.get("b")).toBe("2");
      });

      it("gathers form data on submit(FormData) submissions", async () => {
        let actionSpy = jest.fn();
        render(
          <TestDataRouter window={getWindow("/")}>
            <Route path="/" action={actionSpy} element={<FormPage />} />
          </TestDataRouter>
        );

        function FormPage() {
          let submit = useSubmit();
          let formData = new FormData();
          formData.set("a", "1");
          formData.set("b", "2");
          return (
            <button onClick={() => submit(formData, { method: "post" })}>
              Submit
            </button>
          );
        }

        fireEvent.click(screen.getByText("Submit"));
        let formData = await actionSpy.mock.calls[0][0].request.formData();
        expect(formData.get("a")).toBe("1");
        expect(formData.get("b")).toBe("2");
      });

      it("gathers form data on submit(object) submissions", async () => {
        let actionSpy = jest.fn();
        render(
          <TestDataRouter window={getWindow("/")}>
            <Route path="/" action={actionSpy} element={<FormPage />} />
          </TestDataRouter>
        );

        function FormPage() {
          let submit = useSubmit();
          return (
            <button
              onClick={() => submit({ a: "1", b: "2" }, { method: "post" })}
            >
              Submit
            </button>
          );
        }

        fireEvent.click(screen.getByText("Submit"));
        let formData = await actionSpy.mock.calls[0][0].request.formData();
        expect(formData.get("a")).toBe("1");
        expect(formData.get("b")).toBe("2");
      });

      it("includes submit button name/value on form submission", async () => {
        let actionSpy = jest.fn();
        render(
          <TestDataRouter window={getWindow("/")}>
            <Route path="/" action={actionSpy} element={<FormPage />} />
          </TestDataRouter>
        );

        function FormPage() {
          return (
            <Form
              method="post"
              onSubmit={(e) => {
                // jsdom doesn't handle submitter so we add it here
                // See https://github.com/jsdom/jsdom/issues/3117
                // @ts-expect-error
                e.nativeEvent.submitter =
                  e.currentTarget.querySelector("button");
              }}
            >
              <input name="a" defaultValue="1" />
              <input name="b" defaultValue="2" />
              <button name="c" value="3" type="submit">
                Submit
              </button>
            </Form>
          );
        }

        fireEvent.click(screen.getByText("Submit"));
        let formData = await actionSpy.mock.calls[0][0].request.formData();
        expect(formData.get("a")).toBe("1");
        expect(formData.get("b")).toBe("2");
        expect(formData.get("c")).toBe("3");
      });

      it("includes submit button name/value on button submission", async () => {
        let actionSpy = jest.fn();
        render(
          <TestDataRouter window={getWindow("/")}>
            <Route path="/" action={actionSpy} element={<FormPage />} />
          </TestDataRouter>
        );

        function FormPage() {
          let submit = useSubmit();
          return (
            <Form
              method="post"
              onSubmit={(e) => {
                // jsdom doesn't handle submitter so we add it here
                // See https://github.com/jsdom/jsdom/issues/3117
                // @ts-expect-error
                e.nativeEvent.submitter =
                  e.currentTarget.querySelector("button");
              }}
            >
              <input name="a" defaultValue="1" />
              <input name="b" defaultValue="2" />
              <button
                name="c"
                value="3"
                onClick={(e) => {
                  e.preventDefault();
                  submit(e.currentTarget);
                }}
              >
                Submit
              </button>
            </Form>
          );
        }

        fireEvent.click(screen.getByText("Submit"));
        let formData = await actionSpy.mock.calls[0][0].request.formData();
        expect(formData.get("a")).toBe("1");
        expect(formData.get("b")).toBe("2");
        expect(formData.get("c")).toBe("3");
      });

      it("appends button name/value and doesn't overwrite inputs with same name (form)", async () => {
        let actionSpy = jest.fn();
        render(
          <TestDataRouter window={getWindow("/")}>
            <Route path="/" action={actionSpy} element={<FormPage />} />
          </TestDataRouter>
        );

        function FormPage() {
          return (
            <Form
              method="post"
              onSubmit={(e) => {
                // jsdom doesn't handle submitter so we add it here
                // See https://github.com/jsdom/jsdom/issues/3117
                // @ts-expect-error
                e.nativeEvent.submitter =
                  e.currentTarget.querySelector("button");
              }}
            >
              <input name="a" defaultValue="1" />
              <input name="b" defaultValue="2" />
              <button name="b" value="3" type="submit">
                Submit
              </button>
            </Form>
          );
        }

        fireEvent.click(screen.getByText("Submit"));
        let formData = await actionSpy.mock.calls[0][0].request.formData();
        expect(formData.get("a")).toBe("1");
        expect(formData.getAll("b")).toEqual(["2", "3"]);
      });

      it("appends button name/value and doesn't overwrite inputs with same name (button)", async () => {
        let actionSpy = jest.fn();
        render(
          <TestDataRouter window={getWindow("/")}>
            <Route path="/" action={actionSpy} element={<FormPage />} />
          </TestDataRouter>
        );

        function FormPage() {
          let submit = useSubmit();
          return (
            <Form
              method="post"
              onSubmit={(e) => {
                // jsdom doesn't handle submitter so we add it here
                // See https://github.com/jsdom/jsdom/issues/3117
                // @ts-expect-error
                e.nativeEvent.submitter =
                  e.currentTarget.querySelector("button");
              }}
            >
              <input name="a" defaultValue="1" />
              <input name="b" defaultValue="2" />
              <button
                name="b"
                value="3"
                onClick={(e) => {
                  e.preventDefault();
                  submit(e.currentTarget);
                }}
              >
                Submit
              </button>
            </Form>
          );
        }

        fireEvent.click(screen.getByText("Submit"));
        let formData = await actionSpy.mock.calls[0][0].request.formData();
        expect(formData.get("a")).toBe("1");
        expect(formData.getAll("b")).toEqual(["2", "3"]);
      });
    });

    describe("useFetcher(s)", () => {
      it("handles fetcher.load and fetcher.submit", async () => {
        let count = 0;
        let { container } = render(
          <TestDataRouter
            window={getWindow("/")}
            hydrationData={{ loaderData: { "0": null } }}
          >
            <Route
              path="/"
              element={<Comp />}
              action={async ({ request }) => {
                let formData = await request.formData();
                count = count + parseInt(String(formData.get("increment")), 10);
                return { count };
              }}
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
          </TestDataRouter>
        );

        function Comp() {
          let fetcher = useFetcher();
          let fd = new FormData();
          fd.append("increment", "10");
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
              <button onClick={() => fetcher.submit(fd, { method: "post" })}>
                submit 10
              </button>
            </>
          );
        }

        expect(getHtml(container.querySelector("#output")))
          .toMatchInlineSnapshot(`
          "<p
            id=\\"output\\"
          >
            idle
          </p>"
        `);

        fireEvent.click(screen.getByText("load 1"));
        expect(getHtml(container.querySelector("#output")))
          .toMatchInlineSnapshot(`
          "<p
            id=\\"output\\"
          >
            loading
          </p>"
        `);

        await waitFor(() => screen.getByText(/idle/));
        expect(getHtml(container.querySelector("#output")))
          .toMatchInlineSnapshot(`
          "<p
            id=\\"output\\"
          >
            idle
            {\\"count\\":1}
          </p>"
        `);

        fireEvent.click(screen.getByText("load 5"));
        expect(getHtml(container.querySelector("#output")))
          .toMatchInlineSnapshot(`
          "<p
            id=\\"output\\"
          >
            loading
            {\\"count\\":1}
          </p>"
        `);

        await waitFor(() => screen.getByText(/idle/));
        expect(getHtml(container.querySelector("#output")))
          .toMatchInlineSnapshot(`
          "<p
            id=\\"output\\"
          >
            idle
            {\\"count\\":6}
          </p>"
        `);

        fireEvent.click(screen.getByText("submit 10"));
        expect(getHtml(container.querySelector("#output")))
          .toMatchInlineSnapshot(`
          "<p
            id=\\"output\\"
          >
            submitting
            {\\"count\\":6}
          </p>"
        `);

        await waitFor(() => screen.getByText(/idle/));
        expect(getHtml(container.querySelector("#output")))
          .toMatchInlineSnapshot(`
          "<p
            id=\\"output\\"
          >
            idle
            {\\"count\\":16}
          </p>"
        `);
      });

      it("handles fetcher.load errors", async () => {
        let { container } = render(
          <TestDataRouter
            window={getWindow("/")}
            hydrationData={{ loaderData: { "0": null } }}
          >
            <Route
              path="/"
              element={<Comp />}
              errorElement={<ErrorElement />}
              loader={async () => {
                throw new Error("Kaboom!");
              }}
            />
          </TestDataRouter>
        );

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
          let error = useRouteError();
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
        let { container } = render(
          <TestDataRouter
            window={getWindow("/")}
            hydrationData={{ loaderData: { "0": null } }}
          >
            <Route
              path="/"
              element={<Comp />}
              errorElement={<ErrorElement />}
              loader={() => defer({ value: dfd.promise })}
            />
          </TestDataRouter>
        );

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
          let error = useRouteError();
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
        let { container } = render(
          <TestDataRouter
            window={getWindow("/")}
            hydrationData={{ loaderData: { "0": null } }}
          >
            <Route
              path="/"
              element={<Comp />}
              errorElement={<ErrorElement />}
              action={async () => {
                throw new Error("Kaboom!");
              }}
            />
          </TestDataRouter>
        );

        function Comp() {
          let fetcher = useFetcher();
          return (
            <>
              <p>
                {fetcher.state}
                {fetcher.data ? JSON.stringify(fetcher.data) : null}
              </p>
              <button
                onClick={() =>
                  fetcher.submit(new FormData(), { method: "post" })
                }
              >
                submit
              </button>
            </>
          );
        }

        function ErrorElement() {
          let error = useRouteError();
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

      it("handles fetcher.Form", async () => {
        let count = 0;
        let { container } = render(
          <TestDataRouter
            window={getWindow("/")}
            hydrationData={{ loaderData: { "0": null } }}
          >
            <Route
              path="/"
              element={<Comp />}
              action={async ({ request }) => {
                let formData = await request.formData();
                count = count + parseInt(String(formData.get("increment")), 10);
                return { count };
              }}
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
          </TestDataRouter>
        );

        // Note: jsdom doesn't properly attach event.submitter for
        // <button type="submit"> clicks, so we have to use an input to drive
        // this.  See https://github.com/jsdom/jsdom/issues/3117
        function Comp() {
          let fetcher = useFetcher();
          return (
            <>
              <p id="output">
                {fetcher.state}
                {fetcher.data ? JSON.stringify(fetcher.data) : null}
              </p>
              <fetcher.Form>
                <input name="increment" value="1" />
                <button type="submit">submit get 1</button>
              </fetcher.Form>
              <fetcher.Form method="post">
                <input name="increment" value="10" />
                <button type="submit">submit post 10</button>
              </fetcher.Form>
            </>
          );
        }

        expect(getHtml(container.querySelector("#output")))
          .toMatchInlineSnapshot(`
          "<p
            id=\\"output\\"
          >
            idle
          </p>"
        `);

        fireEvent.click(screen.getByText("submit get 1"));
        expect(getHtml(container.querySelector("#output")))
          .toMatchInlineSnapshot(`
          "<p
            id=\\"output\\"
          >
            loading
          </p>"
        `);

        await waitFor(() => screen.getByText(/idle/));
        expect(getHtml(container.querySelector("#output")))
          .toMatchInlineSnapshot(`
          "<p
            id=\\"output\\"
          >
            idle
            {\\"count\\":1}
          </p>"
        `);

        fireEvent.click(screen.getByText("submit post 10"));
        expect(getHtml(container.querySelector("#output")))
          .toMatchInlineSnapshot(`
          "<p
            id=\\"output\\"
          >
            submitting
            {\\"count\\":1}
          </p>"
        `);

        await waitFor(() => screen.getByText(/idle/));
        expect(getHtml(container.querySelector("#output")))
          .toMatchInlineSnapshot(`
          "<p
            id=\\"output\\"
          >
            idle
            {\\"count\\":11}
          </p>"
        `);
      });

      it("handles fetcher.Form get errors", async () => {
        let { container } = render(
          <TestDataRouter
            window={getWindow("/")}
            hydrationData={{ loaderData: { "0": null } }}
          >
            <Route
              path="/"
              element={<Comp />}
              errorElement={<ErrorElement />}
              loader={async () => {
                throw new Error("Kaboom!");
              }}
            />
          </TestDataRouter>
        );

        function Comp() {
          let fetcher = useFetcher();
          return (
            <>
              <p id="output">
                {fetcher.state}
                {fetcher.data ? JSON.stringify(fetcher.data) : null}
              </p>
              <fetcher.Form>
                <button type="submit">submit</button>
              </fetcher.Form>
            </>
          );
        }

        function ErrorElement() {
          let error = useRouteError();
          return <p>{error.message}</p>;
        }

        expect(getHtml(container.querySelector("#output")))
          .toMatchInlineSnapshot(`
          "<p
            id=\\"output\\"
          >
            idle
          </p>"
        `);

        fireEvent.click(screen.getByText("submit"));
        expect(getHtml(container.querySelector("#output")))
          .toMatchInlineSnapshot(`
          "<p
            id=\\"output\\"
          >
            loading
          </p>"
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

      it("handles fetcher.Form post errors", async () => {
        let { container } = render(
          <TestDataRouter
            window={getWindow("/")}
            hydrationData={{ loaderData: { "0": null } }}
          >
            <Route
              path="/"
              element={<Comp />}
              errorElement={<ErrorElement />}
              action={async () => {
                throw new Error("Kaboom!");
              }}
            />
          </TestDataRouter>
        );

        function Comp() {
          let fetcher = useFetcher();
          return (
            <>
              <p id="output">
                {fetcher.state}
                {fetcher.data ? JSON.stringify(fetcher.data) : null}
              </p>
              <fetcher.Form method="post">
                <button type="submit">submit</button>
              </fetcher.Form>
            </>
          );
        }

        function ErrorElement() {
          let error = useRouteError();
          return <p>{error.message}</p>;
        }

        expect(getHtml(container.querySelector("#output")))
          .toMatchInlineSnapshot(`
          "<p
            id=\\"output\\"
          >
            idle
          </p>"
        `);

        fireEvent.click(screen.getByText("submit"));
        expect(getHtml(container.querySelector("#output")))
          .toMatchInlineSnapshot(`
          "<p
            id=\\"output\\"
          >
            submitting
          </p>"
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

      it("show all fetchers via useFetchers and cleans up fetchers on unmount", async () => {
        let dfd1 = createDeferred();
        let dfd2 = createDeferred();
        let { container } = render(
          <TestDataRouter
            window={getWindow("/1")}
            hydrationData={{ loaderData: { "0": null, "0-0": null } }}
          >
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
          </TestDataRouter>
        );

        function Parent() {
          let fetchers = useFetchers();
          return (
            <>
              <Link to="/1">Link to 1</Link>
              <Link to="/2">Link to 2</Link>
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
        expect(getHtml(container.querySelector("#output")))
          .toMatchInlineSnapshot(`
          "<div
            id=\\"output\\"
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
        expect(getHtml(container.querySelector("#output")))
          .toMatchInlineSnapshot(`
          "<div
            id=\\"output\\"
          >
            <p>
              [\\"loading\\"]
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
        expect(getHtml(container.querySelector("#output")))
          .toMatchInlineSnapshot(`
          "<div
            id=\\"output\\"
          >
            <p>
              [\\"idle\\"]
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
        expect(getHtml(container.querySelector("#output")))
          .toMatchInlineSnapshot(`
          "<div
            id=\\"output\\"
          >
            <p>
              [\\"idle\\"]
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
        expect(getHtml(container.querySelector("#output")))
          .toMatchInlineSnapshot(`
          "<div
            id=\\"output\\"
          >
            <p>
              [\\"idle\\"]
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
        expect(getHtml(container.querySelector("#output")))
          .toMatchInlineSnapshot(`
          "<div
            id=\\"output\\"
          >
            <p>
              [\\"loading\\"]
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
        expect(getHtml(container.querySelector("#output")))
          .toMatchInlineSnapshot(`
          "<div
            id=\\"output\\"
          >
            <p>
              [\\"idle\\"]
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
        let { container } = render(
          <TestDataRouter
            window={getWindow("/")}
            hydrationData={{ loaderData: { "0": null } }}
          >
            <Route
              path="/"
              element={<Comp />}
              action={async ({ request }) => {
                let formData = await request.formData();
                count = count + parseInt(String(formData.get("increment")), 10);
                return { count };
              }}
              loader={async () => ({ count: ++count })}
            />
            <Route
              path="/fetch"
              loader={async () => ({ fetchCount: ++fetchCount })}
            />
          </TestDataRouter>
        );

        function Comp() {
          let fetcher = useFetcher();
          return (
            <>
              <p id="output">
                {fetcher.state}
                {fetcher.data ? JSON.stringify(fetcher.data) : null}
              </p>
              <button onClick={() => fetcher.load("/fetch")}>
                load fetcher
              </button>
              <Form method="post">
                <button type="submit" name="increment" value="10">
                  submit
                </button>
              </Form>
            </>
          );
        }

        expect(getHtml(container.querySelector("#output")))
          .toMatchInlineSnapshot(`
          "<p
            id=\\"output\\"
          >
            idle
          </p>"
        `);

        await act(async () => {
          fireEvent.click(screen.getByText("load fetcher"));
          await waitFor(() => screen.getByText(/idle/));
        });
        expect(getHtml(container.querySelector("#output")))
          .toMatchInlineSnapshot(`
          "<p
            id=\\"output\\"
          >
            idle
            {\\"fetchCount\\":1}
          </p>"
        `);

        await act(async () => {
          fireEvent.click(screen.getByText("submit"));
          await waitFor(() => screen.getByText(/idle/));
        });
        expect(getHtml(container.querySelector("#output")))
          .toMatchInlineSnapshot(`
          "<p
            id=\\"output\\"
          >
            idle
            {\\"fetchCount\\":2}
          </p>"
        `);
      });

      it("handles fetcher 404 errors at the correct spot in the route hierarchy", async () => {
        let { container } = render(
          <TestDataRouter
            window={getWindow("/child")}
            hydrationData={{ loaderData: { "0": null } }}
          >
            <Route path="/" element={<Outlet />} errorElement={<p>Not I!</p>}>
              <Route
                path="child"
                element={<Comp />}
                errorElement={<ErrorElement />}
              />
            </Route>
          </TestDataRouter>
        );

        function Comp() {
          let fetcher = useFetcher();
          return (
            <button onClick={() => fetcher.load("/not-found")}>load</button>
          );
        }

        function ErrorElement() {
          let { status, statusText } = useRouteError();
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
        let { container } = render(
          <TestDataRouter
            window={getWindow("/child")}
            hydrationData={{ loaderData: { "0": null } }}
          >
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
          </TestDataRouter>
        );

        function Comp() {
          let fetcher = useFetcher();
          return <button onClick={() => fetcher.load("/fetch")}>load</button>;
        }

        function ErrorElement() {
          return <p>contextual error:{useRouteError().message}</p>;
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
        let { container } = render(
          <TestDataRouter
            window={getWindow("/child")}
            hydrationData={{ loaderData: { "0": null } }}
          >
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
          </TestDataRouter>
        );

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
          return <p>contextual error:{useRouteError().message}</p>;
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

      it("handles fetcher.Form errors at the correct spot in the route hierarchy", async () => {
        let { container } = render(
          <TestDataRouter
            window={getWindow("/child")}
            hydrationData={{ loaderData: { "0": null } }}
          >
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
          </TestDataRouter>
        );

        function Comp() {
          let fetcher = useFetcher();
          return (
            <fetcher.Form method="post" action="/fetch">
              <button type="submit" name="key" value="value">
                submit
              </button>
            </fetcher.Form>
          );
        }

        function ErrorElement() {
          return <p>contextual error:{useRouteError().message}</p>;
        }

        expect(getHtml(container)).toMatchInlineSnapshot(`
          "<div>
            <form
              action=\\"/fetch\\"
              method=\\"post\\"
            >
              <button
                name=\\"key\\"
                type=\\"submit\\"
                value=\\"value\\"
              >
                submit
              </button>
            </form>
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
    });

    describe("errors", () => {
      it("renders hydration errors on leaf elements", async () => {
        let { container } = render(
          <TestDataRouter
            window={getWindow("/child")}
            hydrationData={{
              loaderData: {
                "0": "parent data",
              },
              actionData: {
                "0": "parent action",
              },
              errors: {
                "0-0": new Error("Kaboom 💥"),
              },
            }}
          >
            <Route path="/" element={<Comp />}>
              <Route
                path="child"
                element={<Comp />}
                errorElement={<ErrorBoundary />}
              />
            </Route>
          </TestDataRouter>
        );

        function Comp() {
          let data = useLoaderData();
          let actionData = useActionData();
          let navigation = useNavigation();
          return (
            <div>
              {data}
              {actionData}
              {navigation.state}
              <Outlet />
            </div>
          );
        }

        function ErrorBoundary() {
          let error = useRouteError();
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

      it("renders hydration errors on parent elements", async () => {
        let { container } = render(
          <TestDataRouter
            window={getWindow("/child")}
            hydrationData={{
              loaderData: {},
              actionData: null,
              errors: {
                "0": new Error("Kaboom 💥"),
              },
            }}
          >
            <Route path="/" element={<Comp />} errorElement={<ErrorBoundary />}>
              <Route path="child" element={<Comp />} />
            </Route>
          </TestDataRouter>
        );

        function Comp() {
          let data = useLoaderData();
          let actionData = useActionData();
          let navigation = useNavigation();
          return (
            <div>
              {data}
              {actionData}
              {navigation.state}
              <Outlet />
            </div>
          );
        }

        function ErrorBoundary() {
          let error = useRouteError();
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

      it("renders navigation errors on leaf elements", async () => {
        let fooDefer = createDeferred();
        let barDefer = createDeferred();

        let { container } = render(
          <TestDataRouter
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
                errorElement={<FooError />}
              />
              <Route
                path="bar"
                loader={() => barDefer.promise}
                element={<Bar />}
                errorElement={<BarError />}
              />
            </Route>
          </TestDataRouter>
        );

        function Layout() {
          let navigation = useNavigation();
          return (
            <div>
              <Link to="/foo">Link to Foo</Link>
              <Link to="/bar">Link to Bar</Link>
              <p>{navigation.state}</p>
              <Outlet />
            </div>
          );
        }

        function Foo() {
          let data = useLoaderData();
          return <h1>Foo:{data?.message}</h1>;
        }
        function FooError() {
          let error = useRouteError();
          return <p>Foo Error:{error.message}</p>;
        }
        function Bar() {
          let data = useLoaderData();
          return <h1>Bar:{data?.message}</h1>;
        }
        function BarError() {
          let error = useRouteError();
          return <p>Bar Error:{error.message}</p>;
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

        let { container } = render(
          <TestDataRouter
            window={getWindow("/foo")}
            hydrationData={{
              loaderData: {
                "0-0": {
                  message: "hydrated from foo",
                },
              },
            }}
          >
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
          </TestDataRouter>
        );

        function Layout() {
          let navigation = useNavigation();
          return (
            <div>
              <Link to="/foo">Link to Foo</Link>
              <Link to="/bar">Link to Bar</Link>
              <p>{navigation.state}</p>
              <Outlet />
            </div>
          );
        }
        function LayoutError() {
          let error = useRouteError();
          return <p>Layout Error:{error.message}</p>;
        }
        function Foo() {
          let data = useLoaderData();
          return <h1>Foo:{data?.message}</h1>;
        }
        function FooError() {
          let error = useRouteError();
          return <p>Foo Error:{error.message}</p>;
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
    });
  });
}

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

function getWindowImpl(initialUrl: string, isHash = false): Window {
  // Need to use our own custom DOM in order to get a working history
  const dom = new JSDOM(`<!DOCTYPE html>`, { url: "https://remix.run/" });
  dom.window.history.replaceState(null, "", (isHash ? "#" : "") + initialUrl);
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
