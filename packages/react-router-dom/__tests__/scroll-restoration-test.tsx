import { JSDOM } from "jsdom";
import * as React from "react";
import { render, fireEvent, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import {
  Link,
  Outlet,
  RouterProvider,
  ScrollRestoration,
  createBrowserRouter,
} from "react-router-dom";

import getHtml from "../../react-router/__tests__/utils/getHtml";

describe(`ScrollRestoration`, () => {
  it("restores the scroll position for a page when re-visited", () => {
    const consoleWarnMock = jest
      .spyOn(console, "warn")
      .mockImplementation(() => {});

    let testWindow = getWindowImpl("/base");
    const mockScroll = jest.fn();
    window.scrollTo = mockScroll;

    let router = createBrowserRouter(
      [
        {
          path: "/",
          Component() {
            return (
              <>
                <Outlet />
                <ScrollRestoration
                  getKey={(location) => "test1-" + location.pathname}
                />
              </>
            );
          },
          children: testPages,
        },
      ],
      { basename: "/base", window: testWindow }
    );
    let { container } = render(<RouterProvider router={router} />);

    expect(getHtml(container)).toMatch("On page 1");

    // simulate scrolling
    Object.defineProperty(window, "scrollY", { writable: true, value: 100 });

    // leave page
    window.dispatchEvent(new Event("pagehide"));
    fireEvent.click(screen.getByText("Go to page 2"));
    expect(getHtml(container)).toMatch("On page 2");

    // return to page
    window.dispatchEvent(new Event("pagehide"));
    fireEvent.click(screen.getByText("Go to page 1"));

    expect(getHtml(container)).toMatch("On page 1");

    // check scroll activity
    expect(mockScroll.mock.calls).toEqual([
      [0, 0],
      [0, 0],
      [0, 100], // restored
    ]);

    expect(consoleWarnMock).not.toHaveBeenCalled();
    consoleWarnMock.mockRestore();
  });

  it("removes the basename from the location provided to getKey", () => {
    let getKey = jest.fn(() => "mykey");
    let testWindow = getWindowImpl("/base");
    window.scrollTo = () => {};

    let router = createBrowserRouter(
      [
        {
          path: "/",
          Component() {
            return (
              <>
                <Outlet />
                <ScrollRestoration getKey={getKey} />
              </>
            );
          },
          children: [
            {
              index: true,
              Component() {
                return <Link to="/page">/page</Link>;
              },
            },
            {
              path: "page",
              Component() {
                return <h1>Page</h1>;
              },
            },
          ],
        },
      ],
      { basename: "/base", window: testWindow }
    );
    let { container } = render(<RouterProvider router={router} />);

    expect(getKey.mock.calls.length).toBe(1);
    // @ts-expect-error
    expect(getKey.mock.calls[0][0].pathname).toBe("/"); // restore

    expect(getHtml(container)).toMatch("/page");
    fireEvent.click(screen.getByText("/page"));
    expect(getHtml(container)).toMatch("Page");

    expect(getKey.mock.calls.length).toBe(3);
    // @ts-expect-error
    expect(getKey.mock.calls[1][0].pathname).toBe("/"); // save
    // @ts-expect-error
    expect(getKey.mock.calls[2][0].pathname).toBe("/page"); // restore
  });

  it("fails gracefully if sessionStorage is not available", () => {
    const consoleWarnMock = jest
      .spyOn(console, "warn")
      .mockImplementation(() => {});

    let testWindow = getWindowImpl("/base");
    const mockScroll = jest.fn();
    window.scrollTo = mockScroll;

    jest.spyOn(window, "sessionStorage", "get").mockImplementation(() => {
      throw new Error("denied");
    });

    let router = createBrowserRouter(
      [
        {
          path: "/",
          Component() {
            return (
              <>
                <Outlet />
                <ScrollRestoration
                  getKey={(location) => "test2-" + location.pathname}
                />
              </>
            );
          },
          children: testPages,
        },
      ],
      { basename: "/base", window: testWindow }
    );
    let { container } = render(<RouterProvider router={router} />);

    expect(getHtml(container)).toMatch("On page 1");

    // simulate scrolling
    Object.defineProperty(window, "scrollY", { writable: true, value: 100 });

    // leave page
    window.dispatchEvent(new Event("pagehide"));
    fireEvent.click(screen.getByText("Go to page 2"));
    expect(getHtml(container)).toMatch("On page 2");

    // return to page
    window.dispatchEvent(new Event("pagehide"));
    fireEvent.click(screen.getByText("Go to page 1"));

    expect(getHtml(container)).toMatch("On page 1");

    // check scroll activity
    expect(mockScroll.mock.calls).toEqual([
      [0, 0],
      [0, 0],
      [0, 100], // restored (still possible because the user hasn't left the page)
    ]);

    expect(consoleWarnMock).toHaveBeenCalledWith(
      expect.stringContaining(
        "Failed to save scroll positions in sessionStorage"
      )
    );

    consoleWarnMock.mockRestore();
  });
});

const testPages = [
  {
    index: true,
    Component() {
      return (
        <p>
          On page 1<br />
          <Link to="/page">Go to page 2</Link>
        </p>
      );
    },
  },
  {
    path: "page",
    Component() {
      return (
        <p>
          On page 2<br />
          <Link to="/">Go to page 1</Link>
        </p>
      );
    },
  },
];

function getWindowImpl(initialUrl: string): Window {
  // Need to use our own custom DOM in order to get a working history
  const dom = new JSDOM(`<!DOCTYPE html>`, { url: "http://localhost/" });
  dom.window.history.replaceState(null, "", initialUrl);
  return dom.window as unknown as Window;
}
