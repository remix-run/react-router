import * as React from "react";
import * as ReactDOMServer from "react-dom/server";
import { Route, useLocation } from "react-router-dom";
import { DataStaticRouter } from "react-router-dom/server";
import { Outlet } from "react-router/lib/components";
import { useLoaderData, useMatches } from "react-router/lib/hooks";

beforeEach(() => {
  jest.spyOn(console, "warn").mockImplementation(() => {});
});

describe("A <DataStaticRouter>", () => {
  it("renders with provided hydration data", () => {
    let loaderSpy = jest.fn();

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
      return null;
    }

    ReactDOMServer.renderToStaticMarkup(
      <DataStaticRouter
        location="/the/path?the=query#the-hash"
        data={{
          loaderData: {
            "0": { key1: "value1" },
            "0-0": { key2: "value2" },
          },
        }}
      >
        <Route
          path="the"
          element={<HooksChecker1 />}
          loader={loaderSpy}
          handle="1"
        >
          <Route
            path="path"
            element={<HooksChecker2 />}
            loader={loaderSpy}
            handle="2"
          />
        </Route>
      </DataStaticRouter>
    );

    expect(loaderSpy).not.toHaveBeenCalled();

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

  it("defaults to the root location", () => {
    let loaderSpy = jest.fn();

    let markup = ReactDOMServer.renderToStaticMarkup(
      // @ts-expect-error
      <DataStaticRouter
        data={{
          loaderData: {
            "0": { key1: "value1" },
            "0-0": { key2: "value2" },
          },
        }}
      >
        <Route index element={<h1>index</h1>} loader={loaderSpy} />
        <Route path="the" element={<Outlet />} loader={loaderSpy}>
          <Route path="path" element={<h1>👶</h1>} loader={loaderSpy} />
        </Route>
      </DataStaticRouter>
    );
    expect(markup).toBe("<h1>index</h1>");
  });

  it("throws an error if no data is provided", () => {
    let loaderSpy = jest.fn();

    expect(() =>
      ReactDOMServer.renderToStaticMarkup(
        // @ts-expect-error
        <DataStaticRouter location="/the/path?the=query#the-hash">
          <Route path="the" element={<Outlet />} loader={loaderSpy}>
            <Route path="path" element={<h1>👶</h1>} loader={loaderSpy} />
          </Route>
        </DataStaticRouter>
      )
    ).toThrow("You must provide a complete `data` prop for <DataStaticRouter>");
  });

  it("throws an error if partial data is provided", () => {
    let loaderSpy = jest.fn();

    expect(() =>
      ReactDOMServer.renderToStaticMarkup(
        <DataStaticRouter
          location="/the/path?the=query#the-hash"
          data={{
            loaderData: {
              "0": { key1: "value1" },
              // Missing for child route which contains a loader
            },
          }}
        >
          <Route path="the" element={<Outlet />} loader={loaderSpy}>
            <Route path="path" element={<h1>👶</h1>} loader={loaderSpy} />
          </Route>
        </DataStaticRouter>
      )
    ).toThrow("You must provide a complete `data` prop for <DataStaticRouter>");
  });
});
