/**
 * @jest-environment node
 */
import * as React from "react";
import * as ReactDOMServer from "react-dom/server";
import type { StaticHandlerContext } from "@remix-run/router";
import { createStaticHandler } from "@remix-run/router";
import { Link, Outlet } from "react-router-dom";
import {
  createStaticRouter,
  StaticRouterProvider,
} from "react-router-dom/server";

beforeEach(() => {
  jest.spyOn(console, "warn").mockImplementation(() => {});
});

describe("A <StaticRouterProvider>", () => {
  it("renders an initialized router with all possible links", async () => {
    function HooksChecker1() {
      return  <>
        <Outlet />
        <Link to="/the/path">the path</Link>
        <Link to="https://remix.run">the absolute url</Link>
        <Link to="mailto:foo@baz.com">the absolute url with a mailto:</Link>
      </>;
    }

    function HooksChecker2() {
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
    expect(html).toMatch('<a href="/the/path">');
    expect(html).toMatch('<a href="https://remix.run">');
    expect(html).toMatch('<a href="mailto:foo@baz.com">');
    expect(html).toMatch('<a href="/the/other/path">');
  });
});
