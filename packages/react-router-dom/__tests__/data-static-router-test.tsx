import { createMemoryRouter } from "@remix-run/router";
import * as React from "react";
import * as ReactDOMServer from "react-dom/server";
import {
  Outlet,
  Route,
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

    let router = createMemoryRouter({
      isSSR: true,
      routes: [
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
      ],
    });

    await router.navigate("/the/path?the=query#the-hash", { replace: true });

    let html = ReactDOMServer.renderToStaticMarkup(
      <React.StrictMode>
        <DataStaticRouter router={router} />
      </React.StrictMode>
    );
    expect(html).toMatchInlineSnapshot(`"<h1>👋</h1>"`);

    expect(hooksData1.location).toEqual({
      pathname: "/the/path",
      search: "?the=query",
      hash: "#the-hash",
      state: null,
      key: expect.any(String),
    });
    expect(hooksData1.loaderData).toEqual({
      key1: "value1",
    });
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

    expect(hooksData2.location).toEqual({
      pathname: "/the/path",
      search: "?the=query",
      hash: "#the-hash",
      state: null,
      key: expect.any(String),
    });
    expect(hooksData2.loaderData).toEqual({
      key2: "value2",
    });
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

  it("errors if the router is not initialized", async () => {
    let router = createMemoryRouter({
      isSSR: true,
      routes: [
        {
          index: true,
          loader: () => ({
            key1: "value1",
          }),
          element: <h1>👋</h1>,
          handle: "1",
        },
      ],
    });

    expect(() =>
      ReactDOMServer.renderToStaticMarkup(
        <React.StrictMode>
          <DataStaticRouter router={router} />
        </React.StrictMode>
      )
    ).toThrowErrorMatchingInlineSnapshot(
      `"You must provide an initialized router to <DataStaticRouter>"`
    );
  });
});
