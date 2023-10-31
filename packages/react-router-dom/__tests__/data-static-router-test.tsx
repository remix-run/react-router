/**
 * @jest-environment node
 */

import * as React from "react";
import * as ReactDOMServer from "react-dom/server";
import { json } from "@remix-run/router";
import {
  Form,
  Link,
  Outlet,
  useLoaderData,
  useLocation,
  useMatches,
} from "react-router-dom";
import type { StaticHandlerContext } from "react-router-dom/server";
import {
  createStaticHandler,
  createStaticRouter,
  StaticRouterProvider,
} from "react-router-dom/server";

beforeEach(() => {
  jest.spyOn(console, "warn").mockImplementation(() => {});
  jest.spyOn(console, "error").mockImplementation(() => {});
});

describe("A <StaticRouterProvider>", () => {
  it("renders an initialized router", async () => {
    let hooksData1: {
      location: ReturnType<typeof useLocation>;
      loaderData: ReturnType<typeof useLoaderData>;
      matches: ReturnType<typeof useMatches>;
    };
    let hooksData2: {
      location: ReturnType<typeof useLocation>;
      loaderData: ReturnType<typeof useLoaderData>;
      matches: ReturnType<typeof useMatches>;
    };

    function HooksChecker1() {
      hooksData1 = {
        location: useLocation(),
        loaderData: useLoaderData(),
        matches: useMatches(),
      };
      return <Outlet />;
    }

    function HooksChecker2() {
      hooksData2 = {
        location: useLocation(),
        loaderData: useLoaderData(),
        matches: useMatches(),
      };
      return (
        <>
          <h1>👋</h1>
          <Link to="/the/other/path">Other</Link>
        </>
      );
    }

    let routes = [
      {
        path: "the",
        loader: () => ({
          key1: "value1",
        }),
        element: <HooksChecker1 />,
        handle: "1",
        children: [
          {
            path: "path",
            loader: () => ({
              key2: "value2",
            }),
            element: <HooksChecker2 />,
            handle: "2",
          },
        ],
      },
    ];
    let { query } = createStaticHandler(routes);

    let context = (await query(
      new Request("http://localhost/the/path?the=query#the-hash", {
        signal: new AbortController().signal,
      })
    )) as StaticHandlerContext;

    let html = ReactDOMServer.renderToStaticMarkup(
      <React.StrictMode>
        <StaticRouterProvider
          router={createStaticRouter(routes, context)}
          context={context}
        />
      </React.StrictMode>
    );
    expect(html).toMatch("<h1>👋</h1>");
    expect(html).toMatch('<a href="/the/other/path">');

    // @ts-expect-error
    expect(hooksData1.location).toEqual({
      pathname: "/the/path",
      search: "?the=query",
      hash: "#the-hash",
      state: null,
      key: expect.any(String),
    });
    // @ts-expect-error
    expect(hooksData1.loaderData).toEqual({
      key1: "value1",
    });
    // @ts-expect-error
    expect(hooksData1.matches).toEqual([
      {
        data: {
          key1: "value1",
        },
        handle: "1",
        id: "0",
        params: {},
        pathname: "/the",
      },
      {
        data: {
          key2: "value2",
        },
        handle: "2",
        id: "0-0",
        params: {},
        pathname: "/the/path",
      },
    ]);

    // @ts-expect-error
    expect(hooksData2.location).toEqual({
      pathname: "/the/path",
      search: "?the=query",
      hash: "#the-hash",
      state: null,
      key: expect.any(String),
    });
    // @ts-expect-error
    expect(hooksData2.loaderData).toEqual({
      key2: "value2",
    });
    // @ts-expect-error
    expect(hooksData2.matches).toEqual([
      {
        data: {
          key1: "value1",
        },
        handle: "1",
        id: "0",
        params: {},
        pathname: "/the",
      },
      {
        data: {
          key2: "value2",
        },
        handle: "2",
        id: "0-0",
        params: {},
        pathname: "/the/path",
      },
    ]);
  });

  it("renders an initialized router with lazy routes", async () => {
    let hooksData1: {
      location: ReturnType<typeof useLocation>;
      loaderData: ReturnType<typeof useLoaderData>;
      matches: ReturnType<typeof useMatches>;
    };
    let hooksData2: {
      location: ReturnType<typeof useLocation>;
      loaderData: ReturnType<typeof useLoaderData>;
      matches: ReturnType<typeof useMatches>;
    };

    function HooksChecker1() {
      hooksData1 = {
        location: useLocation(),
        loaderData: useLoaderData(),
        matches: useMatches(),
      };
      return <Outlet />;
    }

    function HooksChecker2() {
      hooksData2 = {
        location: useLocation(),
        loaderData: useLoaderData(),
        matches: useMatches(),
      };
      return (
        <>
          <h1>👋</h1>
          <Link to="/the/other/path">Other</Link>
        </>
      );
    }

    let routes = [
      {
        path: "the",
        lazy: async () => ({
          loader: () => ({
            key1: "value1",
          }),
          element: <HooksChecker1 />,
          handle: "1",
        }),
        children: [
          {
            path: "path",
            lazy: async () => ({
              loader: () => ({
                key2: "value2",
              }),
              element: <HooksChecker2 />,
              handle: "2",
            }),
          },
        ],
      },
    ];
    let { query, dataRoutes } = createStaticHandler(routes);

    let context = (await query(
      new Request("http://localhost/the/path?the=query#the-hash", {
        signal: new AbortController().signal,
      })
    )) as StaticHandlerContext;

    let html = ReactDOMServer.renderToStaticMarkup(
      <React.StrictMode>
        <StaticRouterProvider
          router={createStaticRouter(dataRoutes, context)}
          context={context}
        />
      </React.StrictMode>
    );
    expect(html).toMatch("<h1>👋</h1>");
    expect(html).toMatch('<a href="/the/other/path">');

    // @ts-expect-error
    expect(hooksData1.location).toEqual({
      pathname: "/the/path",
      search: "?the=query",
      hash: "#the-hash",
      state: null,
      key: expect.any(String),
    });
    // @ts-expect-error
    expect(hooksData1.loaderData).toEqual({
      key1: "value1",
    });
    // @ts-expect-error
    expect(hooksData1.matches).toEqual([
      {
        data: {
          key1: "value1",
        },
        handle: "1",
        id: "0",
        params: {},
        pathname: "/the",
      },
      {
        data: {
          key2: "value2",
        },
        handle: "2",
        id: "0-0",
        params: {},
        pathname: "/the/path",
      },
    ]);

    // @ts-expect-error
    expect(hooksData2.location).toEqual({
      pathname: "/the/path",
      search: "?the=query",
      hash: "#the-hash",
      state: null,
      key: expect.any(String),
    });
    // @ts-expect-error
    expect(hooksData2.loaderData).toEqual({
      key2: "value2",
    });
    // @ts-expect-error
    expect(hooksData2.matches).toEqual([
      {
        data: {
          key1: "value1",
        },
        handle: "1",
        id: "0",
        params: {},
        pathname: "/the",
      },
      {
        data: {
          key2: "value2",
        },
        handle: "2",
        id: "0-0",
        params: {},
        pathname: "/the/path",
      },
    ]);
  });

  it("renders an initialized router with a basename", async () => {
    let location: ReturnType<typeof useLocation>;

    function GetLocation() {
      location = useLocation();
      return (
        <>
          <h1>👋</h1>
          <Link to="/the/other/path">Other</Link>
        </>
      );
    }

    let routes = [
      {
        path: "the",
        children: [
          {
            path: "path",
            element: <GetLocation />,
          },
        ],
      },
    ];
    let { query } = createStaticHandler(routes, { basename: "/base" });

    let context = (await query(
      new Request("http://localhost/base/the/path?the=query#the-hash", {
        signal: new AbortController().signal,
      })
    )) as StaticHandlerContext;

    let html = ReactDOMServer.renderToStaticMarkup(
      <React.StrictMode>
        <StaticRouterProvider
          router={createStaticRouter(routes, context)}
          context={context}
        />
      </React.StrictMode>
    );
    expect(html).toMatch("<h1>👋</h1>");
    expect(html).toMatch('<a href="/base/the/other/path">');

    // @ts-expect-error
    expect(location).toEqual({
      pathname: "/the/path",
      search: "?the=query",
      hash: "#the-hash",
      state: null,
      key: expect.any(String),
    });
  });

  it("renders hydration data by default", async () => {
    let routes = [
      {
        // provide unique id here but not below, to ensure we add where needed
        id: "the",
        path: "the",
        loader: () => ({
          key1: "value1",
        }),
        element: <Outlet />,
        children: [
          {
            path: "path",
            loader: () => ({
              key2: "value2",
            }),
            element: <h1>👋</h1>,
          },
        ],
      },
    ];
    let { query } = createStaticHandler(routes);

    let context = (await query(
      new Request("http://localhost/the/path", {
        signal: new AbortController().signal,
      })
    )) as StaticHandlerContext;

    let html = ReactDOMServer.renderToStaticMarkup(
      <React.StrictMode>
        <StaticRouterProvider
          router={createStaticRouter(routes, context)}
          context={context}
        />
      </React.StrictMode>
    );
    expect(html).toMatch("<h1>👋</h1>");

    let expectedJsonString = JSON.stringify(
      JSON.stringify({
        loaderData: {
          the: { key1: "value1" },
          "0-0": { key2: "value2" },
        },
        actionData: null,
        errors: null,
      })
    );
    expect(html).toMatch(
      `<script>window.__staticRouterHydrationData = JSON.parse(${expectedJsonString});</script>`
    );
  });

  it("renders hydration data from lazy routes by default", async () => {
    let routes = [
      {
        // provide unique id here but not below, to ensure we add where needed
        id: "the",
        path: "the",
        lazy: async () => ({
          loader: () => ({
            key1: "value1",
          }),
          element: <Outlet />,
        }),
        children: [
          {
            path: "path",
            lazy: async () => ({
              loader: () => ({
                key2: "value2",
              }),
              element: <h1>👋</h1>,
            }),
          },
        ],
      },
    ];
    let { query, dataRoutes } = createStaticHandler(routes);

    let context = (await query(
      new Request("http://localhost/the/path", {
        signal: new AbortController().signal,
      })
    )) as StaticHandlerContext;

    let html = ReactDOMServer.renderToStaticMarkup(
      <React.StrictMode>
        <StaticRouterProvider
          router={createStaticRouter(dataRoutes, context)}
          context={context}
        />
      </React.StrictMode>
    );
    expect(html).toMatch("<h1>👋</h1>");

    let expectedJsonString = JSON.stringify(
      JSON.stringify({
        loaderData: {
          the: { key1: "value1" },
          "0-0": { key2: "value2" },
        },
        actionData: null,
        errors: null,
      })
    );
    expect(html).toMatch(
      `<script>window.__staticRouterHydrationData = JSON.parse(${expectedJsonString});</script>`
    );
  });

  it("escapes HTML tags in serialized hydration data", async () => {
    let routes = [
      {
        path: "/",
        loader: () => ({
          key: "uh </script> oh",
        }),
        element: <h1>👋</h1>,
      },
    ];
    let { query } = createStaticHandler(routes);

    let context = (await query(
      new Request("http://localhost/", {
        signal: new AbortController().signal,
      })
    )) as StaticHandlerContext;

    let html = ReactDOMServer.renderToStaticMarkup(
      <React.StrictMode>
        <StaticRouterProvider
          router={createStaticRouter(routes, context)}
          context={context}
        />
      </React.StrictMode>
    );
    expect(html).toMatchInlineSnapshot(
      `"<h1>👋</h1><script>window.__staticRouterHydrationData = JSON.parse("{\\"loaderData\\":{\\"0\\":{\\"key\\":\\"uh \\u003c/script\\u003e oh\\"}},\\"actionData\\":null,\\"errors\\":null}");</script>"`
    );
  });

  it("encodes auto-generated <a href> values to avoid hydration errors", async () => {
    let routes = [{ path: "/path/:param", element: <Link to=".">👋</Link> }];
    let { query } = createStaticHandler(routes);

    let context = (await query(
      new Request("http://localhost/path/with space", {
        signal: new AbortController().signal,
      })
    )) as StaticHandlerContext;

    let html = ReactDOMServer.renderToStaticMarkup(
      <React.StrictMode>
        <StaticRouterProvider
          router={createStaticRouter(routes, context)}
          context={context}
        />
      </React.StrictMode>
    );
    expect(html).toContain('<a href="/path/with%20space">👋</a>');
  });

  it("does not encode user-specified <a href> values", async () => {
    let routes = [
      { path: "/", element: <Link to="/path/with space">👋</Link> },
    ];
    let { query } = createStaticHandler(routes);

    let context = (await query(
      new Request("http://localhost/", {
        signal: new AbortController().signal,
      })
    )) as StaticHandlerContext;

    let html = ReactDOMServer.renderToStaticMarkup(
      <React.StrictMode>
        <StaticRouterProvider
          router={createStaticRouter(routes, context)}
          context={context}
        />
      </React.StrictMode>
    );
    expect(html).toContain('<a href="/path/with space">👋</a>');
  });

  it("encodes auto-generated <form action> values to avoid hydration errors (action=undefined)", async () => {
    let routes = [{ path: "/path/:param", element: <Form>👋</Form> }];
    let { query } = createStaticHandler(routes);

    let context = (await query(
      new Request("http://localhost/path/with space", {
        signal: new AbortController().signal,
      })
    )) as StaticHandlerContext;

    let html = ReactDOMServer.renderToStaticMarkup(
      <React.StrictMode>
        <StaticRouterProvider
          router={createStaticRouter(routes, context)}
          context={context}
        />
      </React.StrictMode>
    );
    expect(html).toContain(
      '<form method="get" action="/path/with%20space">👋</form>'
    );
  });

  it('encodes auto-generated <form action> values to avoid hydration errors (action=".")', async () => {
    let routes = [
      { path: "/path/:param", element: <Form action=".">👋</Form> },
    ];
    let { query } = createStaticHandler(routes);

    let context = (await query(
      new Request("http://localhost/path/with space", {
        signal: new AbortController().signal,
      })
    )) as StaticHandlerContext;

    let html = ReactDOMServer.renderToStaticMarkup(
      <React.StrictMode>
        <StaticRouterProvider
          router={createStaticRouter(routes, context)}
          context={context}
        />
      </React.StrictMode>
    );
    expect(html).toContain(
      '<form method="get" action="/path/with%20space">👋</form>'
    );
  });

  it("does not encode user-specified <form action> values", async () => {
    let routes = [
      { path: "/", element: <Form action="/path/with space">👋</Form> },
    ];
    let { query } = createStaticHandler(routes);

    let context = (await query(
      new Request("http://localhost/", {
        signal: new AbortController().signal,
      })
    )) as StaticHandlerContext;

    let html = ReactDOMServer.renderToStaticMarkup(
      <React.StrictMode>
        <StaticRouterProvider
          router={createStaticRouter(routes, context)}
          context={context}
        />
      </React.StrictMode>
    );
    expect(html).toContain(
      '<form method="get" action="/path/with space">👋</form>'
    );
  });

  it("serializes ErrorResponse instances", async () => {
    let routes = [
      {
        path: "/",
        loader: () => {
          throw json(
            { not: "found" },
            { status: 404, statusText: "Not Found" }
          );
        },
      },
    ];
    let { query } = createStaticHandler(routes);

    let context = (await query(
      new Request("http://localhost/", {
        signal: new AbortController().signal,
      })
    )) as StaticHandlerContext;

    let html = ReactDOMServer.renderToStaticMarkup(
      <React.StrictMode>
        <StaticRouterProvider
          router={createStaticRouter(routes, context)}
          context={context}
        />
      </React.StrictMode>
    );

    let expectedJsonString = JSON.stringify(
      JSON.stringify({
        loaderData: {},
        actionData: null,
        errors: {
          "0": {
            status: 404,
            statusText: "Not Found",
            internal: false,
            data: { not: "found" },
            __type: "RouteErrorResponse",
          },
        },
      })
    );
    expect(html).toMatch(
      `<script>window.__staticRouterHydrationData = JSON.parse(${expectedJsonString});</script>`
    );
  });

  it("serializes ErrorResponse instances from lazy routes", async () => {
    let routes = [
      {
        path: "/",
        lazy: async () => ({
          loader: () => {
            throw json(
              { not: "found" },
              { status: 404, statusText: "Not Found" }
            );
          },
        }),
      },
    ];
    let { query, dataRoutes } = createStaticHandler(routes);

    let context = (await query(
      new Request("http://localhost/", {
        signal: new AbortController().signal,
      })
    )) as StaticHandlerContext;

    let html = ReactDOMServer.renderToStaticMarkup(
      <React.StrictMode>
        <StaticRouterProvider
          router={createStaticRouter(dataRoutes, context)}
          context={context}
        />
      </React.StrictMode>
    );

    let expectedJsonString = JSON.stringify(
      JSON.stringify({
        loaderData: {},
        actionData: null,
        errors: {
          "0": {
            status: 404,
            statusText: "Not Found",
            internal: false,
            data: { not: "found" },
            __type: "RouteErrorResponse",
          },
        },
      })
    );
    expect(html).toMatch(
      `<script>window.__staticRouterHydrationData = JSON.parse(${expectedJsonString});</script>`
    );
  });

  it("serializes Error instances", async () => {
    let routes = [
      {
        path: "/",
        loader: () => {
          throw new Error("oh no");
        },
      },
    ];
    let { query } = createStaticHandler(routes);

    let context = (await query(
      new Request("http://localhost/", {
        signal: new AbortController().signal,
      })
    )) as StaticHandlerContext;

    let html = ReactDOMServer.renderToStaticMarkup(
      <React.StrictMode>
        <StaticRouterProvider
          router={createStaticRouter(routes, context)}
          context={context}
        />
      </React.StrictMode>
    );

    // stack is stripped by default from SSR errors
    let expectedJsonString = JSON.stringify(
      JSON.stringify({
        loaderData: {},
        actionData: null,
        errors: {
          "0": {
            message: "oh no",
            __type: "Error",
          },
        },
      })
    );
    expect(html).toMatch(
      `<script>window.__staticRouterHydrationData = JSON.parse(${expectedJsonString});</script>`
    );
  });

  it("serializes Error instances from lazy routes", async () => {
    let routes = [
      {
        path: "/",
        lazy: async () => ({
          loader: () => {
            throw new Error("oh no");
          },
        }),
      },
    ];
    let { query, dataRoutes } = createStaticHandler(routes);

    let context = (await query(
      new Request("http://localhost/", {
        signal: new AbortController().signal,
      })
    )) as StaticHandlerContext;

    let html = ReactDOMServer.renderToStaticMarkup(
      <React.StrictMode>
        <StaticRouterProvider
          router={createStaticRouter(dataRoutes, context)}
          context={context}
        />
      </React.StrictMode>
    );

    // stack is stripped by default from SSR errors
    let expectedJsonString = JSON.stringify(
      JSON.stringify({
        loaderData: {},
        actionData: null,
        errors: {
          "0": {
            message: "oh no",
            __type: "Error",
          },
        },
      })
    );
    expect(html).toMatch(
      `<script>window.__staticRouterHydrationData = JSON.parse(${expectedJsonString});</script>`
    );
  });

  it("serializes Error subclass instances", async () => {
    let routes = [
      {
        path: "/",
        loader: () => {
          throw new ReferenceError("oh no");
        },
      },
    ];
    let { query } = createStaticHandler(routes);

    let context = (await query(
      new Request("http://localhost/", {
        signal: new AbortController().signal,
      })
    )) as StaticHandlerContext;

    let html = ReactDOMServer.renderToStaticMarkup(
      <React.StrictMode>
        <StaticRouterProvider
          router={createStaticRouter(routes, context)}
          context={context}
        />
      </React.StrictMode>
    );

    // stack is stripped by default from SSR errors
    let expectedJsonString = JSON.stringify(
      JSON.stringify({
        loaderData: {},
        actionData: null,
        errors: {
          "0": {
            message: "oh no",
            __type: "Error",
            __subType: "ReferenceError",
          },
        },
      })
    );
    expect(html).toMatch(
      `<script>window.__staticRouterHydrationData = JSON.parse(${expectedJsonString});</script>`
    );
  });

  it("supports a nonce prop", async () => {
    let routes = [
      {
        path: "the",
        element: <Outlet />,
        children: [
          {
            path: "path",
            element: <h1>👋</h1>,
          },
        ],
      },
    ];
    let { query } = createStaticHandler(routes);

    let context = (await query(
      new Request("http://localhost/the/path", {
        signal: new AbortController().signal,
      })
    )) as StaticHandlerContext;

    let html = ReactDOMServer.renderToStaticMarkup(
      <React.StrictMode>
        <StaticRouterProvider
          router={createStaticRouter(routes, context)}
          context={context}
          nonce="nonce-string"
        />
      </React.StrictMode>
    );
    expect(html).toMatch("<h1>👋</h1>");

    let expectedJsonString = JSON.stringify(
      JSON.stringify({
        loaderData: {
          0: null,
          "0-0": null,
        },
        actionData: null,
        errors: null,
      })
    );
    expect(html).toMatch(
      `<script nonce="nonce-string">window.__staticRouterHydrationData = JSON.parse(${expectedJsonString});</script>`
    );
  });

  it("allows disabling of automatic hydration", async () => {
    let routes = [
      {
        path: "the",
        loader: () => ({
          key1: "value1",
        }),
        element: <Outlet />,
        children: [
          {
            path: "path",
            loader: () => ({
              key2: "value2",
            }),
            element: <h1>👋</h1>,
          },
        ],
      },
    ];
    let { query } = createStaticHandler(routes);

    let context = (await query(
      new Request("http://localhost/the/path", {
        signal: new AbortController().signal,
      })
    )) as StaticHandlerContext;

    let html = ReactDOMServer.renderToStaticMarkup(
      <React.StrictMode>
        <StaticRouterProvider
          router={createStaticRouter(routes, context)}
          context={context}
          hydrate={false}
        />
      </React.StrictMode>
    );
    expect(html).toMatch("<h1>👋</h1>");
    expect(html).not.toMatch("<script>");
    expect(html).not.toMatch("window");
    expect(html).not.toMatch("__staticRouterHydrationData");
  });

  it("errors if required props are not passed", async () => {
    let routes = [
      {
        path: "",
        element: <h1>👋</h1>,
      },
    ];
    let { query } = createStaticHandler(routes);

    let context = (await query(
      new Request("http://localhost/", {
        signal: new AbortController().signal,
      })
    )) as StaticHandlerContext;

    expect(() =>
      ReactDOMServer.renderToStaticMarkup(
        <React.StrictMode>
          {/* @ts-expect-error */}
          <StaticRouterProvider context={context} />
        </React.StrictMode>
      )
    ).toThrowErrorMatchingInlineSnapshot(
      `"You must provide \`router\` and \`context\` to <StaticRouterProvider>"`
    );

    expect(() =>
      ReactDOMServer.renderToStaticMarkup(
        <React.StrictMode>
          {/* @ts-expect-error */}
          <StaticRouterProvider router={createStaticRouter(routes, context)} />
        </React.StrictMode>
      )
    ).toThrowErrorMatchingInlineSnapshot(
      `"You must provide \`router\` and \`context\` to <StaticRouterProvider>"`
    );
  });

  it("handles framework agnostic static handler routes", async () => {
    let frameworkAgnosticRoutes = [
      {
        path: "the",
        hasErrorBoundary: true,
        children: [
          {
            path: "path",
            hasErrorBoundary: true,
          },
        ],
      },
    ];
    let { query } = createStaticHandler(frameworkAgnosticRoutes);

    let context = (await query(
      new Request("http://localhost/the/path", {
        signal: new AbortController().signal,
      })
    )) as StaticHandlerContext;

    let frameworkAwareRoutes = [
      {
        path: "the",
        element: <h1>Hi!</h1>,
        errorElement: <h1>Error!</h1>,
        children: [
          {
            path: "path",
            element: <h2>Hi again!</h2>,
            errorElement: <h2>Error again!</h2>,
          },
        ],
      },
    ];

    // This should add route ids + hasErrorBoundary, and also update the
    // context.matches to include the full framework-aware routes
    let router = createStaticRouter(frameworkAwareRoutes, context);

    expect(router.routes).toMatchInlineSnapshot(`
      [
        {
          "children": [
            {
              "children": undefined,
              "element": <h2>
                Hi again!
              </h2>,
              "errorElement": <h2>
                Error again!
              </h2>,
              "hasErrorBoundary": true,
              "id": "0-0",
              "path": "path",
            },
          ],
          "element": <h1>
            Hi!
          </h1>,
          "errorElement": <h1>
            Error!
          </h1>,
          "hasErrorBoundary": true,
          "id": "0",
          "path": "the",
        },
      ]
    `);
    expect(router.state.matches).toMatchInlineSnapshot(`
      [
        {
          "params": {},
          "pathname": "/the",
          "pathnameBase": "/the",
          "route": {
            "children": [
              {
                "children": undefined,
                "element": <h2>
                  Hi again!
                </h2>,
                "errorElement": <h2>
                  Error again!
                </h2>,
                "hasErrorBoundary": true,
                "id": "0-0",
                "path": "path",
              },
            ],
            "element": <h1>
              Hi!
            </h1>,
            "errorElement": <h1>
              Error!
            </h1>,
            "hasErrorBoundary": true,
            "id": "0",
            "path": "the",
          },
        },
        {
          "params": {},
          "pathname": "/the/path",
          "pathnameBase": "/the/path",
          "route": {
            "children": undefined,
            "element": <h2>
              Hi again!
            </h2>,
            "errorElement": <h2>
              Error again!
            </h2>,
            "hasErrorBoundary": true,
            "id": "0-0",
            "path": "path",
          },
        },
      ]
    `);
  });

  it("handles framework agnostic static handler routes (using ErrorBoundary)", async () => {
    let frameworkAgnosticRoutes = [
      {
        path: "the",
        hasErrorBoundary: true,
        children: [
          {
            path: "path",
            hasErrorBoundary: true,
          },
        ],
      },
    ];
    let { query } = createStaticHandler(frameworkAgnosticRoutes);

    let context = (await query(
      new Request("http://localhost/the/path", {
        signal: new AbortController().signal,
      })
    )) as StaticHandlerContext;

    let frameworkAwareRoutes = [
      {
        path: "the",
        element: <h1>Hi!</h1>,
        ErrorBoundary: () => <h1>Error!</h1>,
        children: [
          {
            path: "path",
            element: <h2>Hi again!</h2>,
            ErrorBoundary: () => <h2>Error again!</h2>,
          },
        ],
      },
    ];

    // This should add route ids + hasErrorBoundary, and also update the
    // context.matches to include the full framework-aware routes
    let router = createStaticRouter(frameworkAwareRoutes, context);

    expect(router.routes).toMatchInlineSnapshot(`
      [
        {
          "ErrorBoundary": undefined,
          "children": [
            {
              "ErrorBoundary": undefined,
              "children": undefined,
              "element": <h2>
                Hi again!
              </h2>,
              "errorElement": <ErrorBoundary />,
              "hasErrorBoundary": true,
              "id": "0-0",
              "path": "path",
            },
          ],
          "element": <h1>
            Hi!
          </h1>,
          "errorElement": <ErrorBoundary />,
          "hasErrorBoundary": true,
          "id": "0",
          "path": "the",
        },
      ]
    `);
    expect(router.state.matches).toMatchInlineSnapshot(`
      [
        {
          "params": {},
          "pathname": "/the",
          "pathnameBase": "/the",
          "route": {
            "ErrorBoundary": undefined,
            "children": [
              {
                "ErrorBoundary": undefined,
                "children": undefined,
                "element": <h2>
                  Hi again!
                </h2>,
                "errorElement": <ErrorBoundary />,
                "hasErrorBoundary": true,
                "id": "0-0",
                "path": "path",
              },
            ],
            "element": <h1>
              Hi!
            </h1>,
            "errorElement": <ErrorBoundary />,
            "hasErrorBoundary": true,
            "id": "0",
            "path": "the",
          },
        },
        {
          "params": {},
          "pathname": "/the/path",
          "pathnameBase": "/the/path",
          "route": {
            "ErrorBoundary": undefined,
            "children": undefined,
            "element": <h2>
              Hi again!
            </h2>,
            "errorElement": <ErrorBoundary />,
            "hasErrorBoundary": true,
            "id": "0-0",
            "path": "path",
          },
        },
      ]
    `);
  });

  it("renders absolute links correctly", async () => {
    let routes = [
      {
        path: "/",
        element: (
          <>
            <Link to="/the/path">relative path</Link>
            <Link to="http://localhost/the/path">absolute same-origin url</Link>
            <Link to="https://remix.run">absolute different-origin url</Link>
            <Link to="mailto:foo@baz.com">absolute mailto: url</Link>
          </>
        ),
      },
    ];
    let { query } = createStaticHandler(routes);

    let context = (await query(
      new Request("http://localhost/", {
        signal: new AbortController().signal,
      })
    )) as StaticHandlerContext;

    let html = ReactDOMServer.renderToStaticMarkup(
      <React.StrictMode>
        <StaticRouterProvider
          router={createStaticRouter(routes, context)}
          context={context}
        />
      </React.StrictMode>
    );
    expect(html).toMatch(
      '<a href="/the/path">relative path</a>' +
        '<a href="http://localhost/the/path">absolute same-origin url</a>' +
        '<a href="https://remix.run">absolute different-origin url</a>' +
        '<a href="mailto:foo@baz.com">absolute mailto: url</a>'
    );
  });

  describe("boundary tracking", () => {
    it("tracks the deepest boundary during render", async () => {
      let routes = [
        {
          path: "/",
          element: <Outlet />,
          ErrorBoundary: () => <p>Error</p>,
          children: [
            {
              index: true,
              element: <h1>👋</h1>,
              errorElement: <p>Error</p>,
            },
          ],
        },
      ];

      let context = (await createStaticHandler(routes).query(
        new Request("http://localhost/", {
          signal: new AbortController().signal,
        })
      )) as StaticHandlerContext;

      let html = ReactDOMServer.renderToStaticMarkup(
        <React.StrictMode>
          <StaticRouterProvider
            router={createStaticRouter(routes, context)}
            context={context}
            hydrate={false}
          />
        </React.StrictMode>
      );
      expect(html).toMatchInlineSnapshot(`"<h1>👋</h1>"`);
      expect(context._deepestRenderedBoundaryId).toBe("0-0");
    });

    it("tracks the deepest boundary during render with lazy routes", async () => {
      let routes = [
        {
          path: "/",
          lazy: async () => ({
            element: <Outlet />,
            errorElement: <p>Error</p>,
          }),
          children: [
            {
              index: true,
              lazy: async () => ({
                element: <h1>👋</h1>,
                ErrorBoundary: () => <p>Error</p>,
              }),
            },
          ],
        },
      ];

      let { query, dataRoutes } = createStaticHandler(routes);
      let context = (await query(
        new Request("http://localhost/", {
          signal: new AbortController().signal,
        })
      )) as StaticHandlerContext;

      let html = ReactDOMServer.renderToStaticMarkup(
        <React.StrictMode>
          <StaticRouterProvider
            router={createStaticRouter(dataRoutes, context)}
            context={context}
            hydrate={false}
          />
        </React.StrictMode>
      );
      expect(html).toMatchInlineSnapshot(`"<h1>👋</h1>"`);
      expect(context._deepestRenderedBoundaryId).toBe("0-0");
    });

    it("tracks only boundaries that expose an errorElement", async () => {
      let routes = [
        {
          path: "/",
          element: <Outlet />,
          errorElement: <p>Error</p>,
          children: [
            {
              index: true,
              element: <h1>👋</h1>,
            },
          ],
        },
      ];

      let context = (await createStaticHandler(routes).query(
        new Request("http://localhost/", {
          signal: new AbortController().signal,
        })
      )) as StaticHandlerContext;

      let html = ReactDOMServer.renderToStaticMarkup(
        <React.StrictMode>
          <StaticRouterProvider
            router={createStaticRouter(routes, context)}
            context={context}
            hydrate={false}
          />
        </React.StrictMode>
      );
      expect(html).toMatchInlineSnapshot(`"<h1>👋</h1>"`);
      expect(context._deepestRenderedBoundaryId).toBe("0");
    });

    it("tracks only boundaries that expose an errorElement with lazy routes", async () => {
      let routes = [
        {
          path: "/",
          lazy: async () => ({
            element: <Outlet />,
            errorElement: <p>Error</p>,
          }),
          children: [
            {
              index: true,
              element: <h1>👋</h1>,
            },
          ],
        },
      ];

      let { query, dataRoutes } = createStaticHandler(routes);
      let context = (await query(
        new Request("http://localhost/", {
          signal: new AbortController().signal,
        })
      )) as StaticHandlerContext;

      let html = ReactDOMServer.renderToStaticMarkup(
        <React.StrictMode>
          <StaticRouterProvider
            router={createStaticRouter(dataRoutes, context)}
            context={context}
            hydrate={false}
          />
        </React.StrictMode>
      );
      expect(html).toMatchInlineSnapshot(`"<h1>👋</h1>"`);
      expect(context._deepestRenderedBoundaryId).toBe("0");
    });
  });
});
