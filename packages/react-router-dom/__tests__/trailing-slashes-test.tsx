import { JSDOM } from "jsdom";
import * as React from "react";
import * as ReactDOM from "react-dom";
import { act } from "react-dom/test-utils";

import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  Link,
  Outlet,
  useSearchParams,
  useLocation,
} from "react-router-dom";

describe("trailing slashes", () => {
  let node: HTMLDivElement;
  beforeEach(() => {
    node = document.createElement("div");
    document.body.appendChild(node);
  });

  afterEach(() => {
    document.body.removeChild(node);
    node = null!;
  });

  describe("<Link> element", () => {
    describe("with a basename that does not contain a trailing slash", () => {
      test("lets root links control trailing slashes (index route)", () => {
        let window = getWindowImpl("/app");
        act(() => {
          ReactDOM.render(
            <BrowserRouter basename="/app" window={window}>
              <Routes>
                <Route
                  index
                  element={
                    <>
                      <Link to="" />
                      <Link to="/" />
                    </>
                  }
                />
              </Routes>
            </BrowserRouter>,
            node
          );
        });

        expect(node.querySelectorAll("a")).toMatchInlineSnapshot(`
          NodeList [
            <a
              href="/app"
            />,
            <a
              href="/app/"
            />,
          ]
        `);
      });

      test('lets root links control trailing slashes (path="")', () => {
        let window = getWindowImpl("/app");
        act(() => {
          ReactDOM.render(
            <BrowserRouter basename="/app" window={window}>
              <Routes>
                <Route
                  path=""
                  element={
                    <>
                      <Link to="" />
                      <Link to="/" />
                    </>
                  }
                />
              </Routes>
            </BrowserRouter>,
            node
          );
        });

        expect(node.querySelectorAll("a")).toMatchInlineSnapshot(`
          NodeList [
            <a
              href="/app"
            />,
            <a
              href="/app/"
            />,
          ]
        `);
      });

      test("lets nested link control trailing slashes", () => {
        let window = getWindowImpl("/app/parent/child");
        act(() => {
          ReactDOM.render(
            <BrowserRouter basename="/app" window={window}>
              <Routes>
                <Route
                  path="parent"
                  element={
                    <>
                      <Link to=".." />
                      <Link to="../" />
                      <Outlet />
                    </>
                  }
                >
                  <Route
                    path="child"
                    element={
                      <>
                        <Link to="../.." />
                        <Link to="../../" />
                        <Link to="../../parent" />
                        <Link to="../../parent/" />
                        <Outlet />
                      </>
                    }
                  >
                    <Route
                      index
                      element={
                        <>
                          <Link to="../../.." />
                          <Link to="../../../" />
                          <Link to="../../child" />
                          <Link to="../../child/" />
                        </>
                      }
                    />
                  </Route>
                </Route>
              </Routes>
            </BrowserRouter>,
            node
          );
        });

        expect(node.querySelectorAll("a")).toMatchInlineSnapshot(`
          NodeList [
            <a
              href="/app"
            />,
            <a
              href="/app/"
            />,
            <a
              href="/app"
            />,
            <a
              href="/app/"
            />,
            <a
              href="/app/parent"
            />,
            <a
              href="/app/parent/"
            />,
            <a
              href="/app"
            />,
            <a
              href="/app/"
            />,
            <a
              href="/app/parent/child"
            />,
            <a
              href="/app/parent/child/"
            />,
          ]
        `);
      });
    });

    describe("with a basename that contains a trailing slash", () => {
      test("always contains trailing slashes on root links (index route)", () => {
        let window = getWindowImpl("/app/");
        act(() => {
          ReactDOM.render(
            <BrowserRouter basename="/app/" window={window}>
              <Routes>
                <Route
                  index
                  element={
                    <>
                      <Link to="" />
                      <Link to="/" />
                    </>
                  }
                />
              </Routes>
            </BrowserRouter>,
            node
          );
        });

        expect(node.querySelectorAll("a")).toMatchInlineSnapshot(`
          NodeList [
            <a
              href="/app/"
            />,
            <a
              href="/app/"
            />,
          ]
        `);
      });

      test('always contains trailing slashes on root links (path="" route)', () => {
        let window = getWindowImpl("/app/");
        act(() => {
          ReactDOM.render(
            <BrowserRouter basename="/app/" window={window}>
              <Routes>
                <Route
                  path=""
                  element={
                    <>
                      <Link to="" />
                      <Link to="/" />
                    </>
                  }
                />
              </Routes>
            </BrowserRouter>,
            node
          );
        });

        expect(node.querySelectorAll("a")).toMatchInlineSnapshot(`
          NodeList [
            <a
              href="/app/"
            />,
            <a
              href="/app/"
            />,
          ]
        `);
      });

      test("always contains root trailing slashes in nested routes", () => {
        let window = getWindowImpl("/app/parent/child");
        act(() => {
          ReactDOM.render(
            <BrowserRouter basename="/app/" window={window}>
              <Routes>
                <Route
                  path="parent"
                  element={
                    <>
                      <Link to=".." />
                      <Link to="../" />
                      <Outlet />
                    </>
                  }
                >
                  <Route
                    path="child"
                    element={
                      <>
                        <Link to="../.." />
                        <Link to="../../" />
                        <Link to="../../parent" />
                        <Link to="../../parent/" />
                        <Outlet />
                      </>
                    }
                  >
                    <Route
                      index
                      element={
                        <>
                          <Link to="../../.." />
                          <Link to="../../../" />
                          <Link to="../../child" />
                          <Link to="../../child/" />
                        </>
                      }
                    />
                  </Route>
                </Route>
              </Routes>
            </BrowserRouter>,
            node
          );
        });

        expect(node.querySelectorAll("a")).toMatchInlineSnapshot(`
          NodeList [
            <a
              href="/app/"
            />,
            <a
              href="/app/"
            />,
            <a
              href="/app/"
            />,
            <a
              href="/app/"
            />,
            <a
              href="/app/parent"
            />,
            <a
              href="/app/parent/"
            />,
            <a
              href="/app/"
            />,
            <a
              href="/app/"
            />,
            <a
              href="/app/parent/child"
            />,
            <a
              href="/app/parent/child/"
            />,
          ]
        `);
      });
    });
  });

  describe("in a <Navigate> element", () => {
    it("should not include trailing slash on empty string path", () => {
      let window = getWindowImpl("/foo/bar");
      spyOn(window.history, "pushState").and.callThrough();

      expect(window.location.href).toBe("https://remix.run/foo/bar");

      act(() => {
        ReactDOM.render(
          <BrowserRouter basename="/foo" window={window}>
            <Routes>
              <Route index element={<h1>👋</h1>} />
              <Route path="bar" element={<Navigate to="" />} />
            </Routes>
          </BrowserRouter>,
          node
        );
      });

      expect(window.location.href).toBe("https://remix.run/foo");
    });

    it("should not include trailing slash via useSearchParams", () => {
      let window = getWindowImpl("/foo");
      spyOn(window.history, "pushState").and.callThrough();

      expect(window.location.href).toBe("https://remix.run/foo");

      function SetSearchParams() {
        let [, setSearchParams] = useSearchParams();
        React.useEffect(
          () => setSearchParams({ key: "value" }),
          [setSearchParams]
        );
        return <h1>👋</h1>;
      }

      act(() => {
        ReactDOM.render(
          <BrowserRouter basename="/foo" window={window}>
            <Routes>
              <Route index element={<SetSearchParams />} />
            </Routes>
          </BrowserRouter>,
          node
        );
      });

      expect(window.location.href).toBe("https://remix.run/foo?key=value");
    });

    it("should include trailing slash from the Navigate", () => {
      let window = getWindowImpl("/foo/bar");
      spyOn(window.history, "pushState").and.callThrough();

      expect(window.location.href).toBe("https://remix.run/foo/bar");

      act(() => {
        ReactDOM.render(
          <BrowserRouter basename="/foo" window={window}>
            <Routes>
              <Route index element={<h1>👋</h1>} />
              <Route path="bar" element={<Navigate to="/" />} />
            </Routes>
          </BrowserRouter>,
          node
        );
      });

      expect(window.location.href).toBe("https://remix.run/foo/");
    });

    it("should include trailing slash from the basename", () => {
      let window = getWindowImpl("/foo/bar");
      spyOn(window.history, "pushState").and.callThrough();

      expect(window.location.href).toBe("https://remix.run/foo/bar");

      act(() => {
        ReactDOM.render(
          <BrowserRouter basename="/foo/" window={window}>
            <Routes>
              <Route index element={<h1>👋</h1>} />
              <Route path="bar" element={<Navigate to="" />} />
            </Routes>
          </BrowserRouter>,
          node
        );
      });

      expect(window.location.href).toBe("https://remix.run/foo/");
    });

    it("should include trailing slash from both", () => {
      let window = getWindowImpl("/foo/bar");
      spyOn(window.history, "pushState").and.callThrough();

      expect(window.location.href).toBe("https://remix.run/foo/bar");

      act(() => {
        ReactDOM.render(
          <BrowserRouter basename="/foo/" window={window}>
            <Routes>
              <Route index element={<h1>👋</h1>} />
              <Route path="bar" element={<Navigate to="/" />} />
            </Routes>
          </BrowserRouter>,
          node
        );
      });

      expect(window.location.href).toBe("https://remix.run/foo/");
    });
  });
});

function getWindowImpl(initialUrl: string, isHash = false): Window {
  // Need to use our own custom DOM in order to get a working history
  const dom = new JSDOM(`<!DOCTYPE html>`, { url: "https://remix.run/" });
  dom.window.history.replaceState(null, "", (isHash ? "#" : "") + initialUrl);
  return dom.window as unknown as Window;
}
