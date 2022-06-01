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
  DataHashRouter,
  Route,
  Outlet,
  useLoaderData,
  useActionData,
  useRouteError,
  useNavigation,
  Form,
  Link,
  useSubmit,
  useFetcher,
  useFetchers,
} from "../index";
import { _resetModuleScope } from "react-router/lib/components";
import { useNavigate } from "react-router/lib/hooks";
import { UNSAFE_DataRouterStateContext } from "react-router";

testDomRouter("<DataBrowserRouter>", DataBrowserRouter, (url) =>
  getWindowImpl(url, false)
);

testDomRouter("<DataHashRouter>", DataHashRouter, (url) =>
  getWindowImpl(url, true)
);

function testDomRouter(name, TestDataRouter, getWindow) {
  describe(name, () => {
    let consoleWarn: jest.SpyInstance;
    let consoleError: jest.SpyInstance;
    beforeEach(() => {
      consoleWarn = jest.spyOn(console, "warn").mockImplementation(() => {});
      consoleError = jest.spyOn(console, "error").mockImplementation(() => {});
    });

    afterEach(() => {
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

    it("renders the first route that matches the URL when wrapped in a 'basename' Route", () => {
      // In data routers there is no basename and you should instead use a root route
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

    it("renders fallbackElement while first data fetch happens", async () => {
      let fooDefer = defer();
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
      let fooDefer = defer();
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

    it("executes route loaders on navigation", async () => {
      let barDefer = defer();

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
        let state = React.useContext(UNSAFE_DataRouterStateContext);
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
      let loaderDefer = defer();
      let actionDefer = defer();

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
      let loaderDefer = defer();
      let actionDefer = defer();

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
      let loaderDefer = defer();
      let actionDefer = defer();

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
        return (
          <>
            <Link to="1">Go to 1</Link>
            <Form action="2" method="post">
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

      fireEvent.click(screen.getByText("Submit Form"));
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
        let dfd1 = defer();
        let dfd2 = defer();
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

        fireEvent.click(screen.getByText("load fetcher"));
        await waitFor(() => screen.getByText(/idle/));
        expect(getHtml(container.querySelector("#output")))
          .toMatchInlineSnapshot(`
          "<p
            id=\\"output\\"
          >
            idle
            {\\"fetchCount\\":1}
          </p>"
        `);

        fireEvent.click(screen.getByText("submit"));
        await waitFor(() => screen.getByText(/idle/));
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
        let fooDefer = defer();
        let barDefer = defer();

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
        let fooDefer = defer();
        let barDefer = defer();

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
