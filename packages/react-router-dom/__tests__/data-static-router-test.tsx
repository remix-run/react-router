import {
  unstable_createStaticHandler,
  StaticHandlerContext,
} from "@remix-run/router";
import * as React from "react";
import * as ReactDOMServer from "react-dom/server";
import {
  Outlet,
  useLoaderData,
  useLocation,
  useMatches,
} from "react-router-dom";
import { DataStaticRouter } from "react-router-dom/server";

beforeEach(() => {
  jest.spyOn(console, "warn").mockImplementation(() => {});
});

describe("A <DataStaticRouter>", () => {
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
      return <h1>👋</h1>;
    }

    let { dataRoutes, query } = unstable_createStaticHandler([
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
    ]);

    let context = await query(
      new Request("http:/localhost/the/path?the=query#the-hash", {
        signal: new AbortController().signal,
      })
    );

    let html = ReactDOMServer.renderToStaticMarkup(
      <React.StrictMode>
        <DataStaticRouter
          dataRoutes={dataRoutes}
          context={context as StaticHandlerContext}
        />
      </React.StrictMode>
    );
    expect(html).toMatch("<h1>👋</h1>");

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

  it("renders hydration data by default", async () => {
    let { dataRoutes, query } = unstable_createStaticHandler([
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
    ]);

    let context = await query(
      new Request("http:/localhost/the/path", {
        signal: new AbortController().signal,
      })
    );

    let html = ReactDOMServer.renderToStaticMarkup(
      <React.StrictMode>
        <DataStaticRouter
          dataRoutes={dataRoutes}
          context={context as StaticHandlerContext}
        />
      </React.StrictMode>
    );
    expect(html).toMatch("<h1>👋</h1>");

    let expectedJsonString = JSON.stringify(
      JSON.stringify({
        loaderData: {
          "0": { key1: "value1" },
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

  it("supports a nonce prop", async () => {
    let { dataRoutes, query } = unstable_createStaticHandler([
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
    ]);

    let context = await query(
      new Request("http:/localhost/the/path", {
        signal: new AbortController().signal,
      })
    );

    let html = ReactDOMServer.renderToStaticMarkup(
      <React.StrictMode>
        <DataStaticRouter
          dataRoutes={dataRoutes}
          context={context as StaticHandlerContext}
          nonce="nonce-string"
        />
      </React.StrictMode>
    );
    expect(html).toMatch("<h1>👋</h1>");

    let expectedJsonString = JSON.stringify(
      JSON.stringify({
        loaderData: {},
        actionData: null,
        errors: null,
      })
    );
    expect(html).toMatch(
      `<script nonce="nonce-string">window.__staticRouterHydrationData = JSON.parse(${expectedJsonString});</script>`
    );
  });

  it("allows disabling of automatic hydration", async () => {
    let { dataRoutes, query } = unstable_createStaticHandler([
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
    ]);

    let context = await query(
      new Request("http:/localhost/the/path", {
        signal: new AbortController().signal,
      })
    );

    let html = ReactDOMServer.renderToStaticMarkup(
      <React.StrictMode>
        <DataStaticRouter
          dataRoutes={dataRoutes}
          context={context as StaticHandlerContext}
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
    let { dataRoutes, query } = unstable_createStaticHandler([
      {
        path: "the",
        element: <h1>👋</h1>,
      },
    ]);

    let context = await query(
      new Request("http:/localhost/the/path?the=query#the-hash", {
        signal: new AbortController().signal,
      })
    );

    expect(() =>
      ReactDOMServer.renderToStaticMarkup(
        <React.StrictMode>
          {/* @ts-expect-error */}
          <DataStaticRouter context={context as StaticHandlerContext} />
        </React.StrictMode>
      )
    ).toThrowErrorMatchingInlineSnapshot(
      `"You must provide \`routes\` and \`context\` to <DataStaticRouter>"`
    );

    expect(() =>
      ReactDOMServer.renderToStaticMarkup(
        <React.StrictMode>
          {/* @ts-expect-error */}
          <DataStaticRouter dataRoutes={dataRoutes} />
        </React.StrictMode>
      )
    ).toThrowErrorMatchingInlineSnapshot(
      `"You must provide \`routes\` and \`context\` to <DataStaticRouter>"`
    );
  });
});
