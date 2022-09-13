import { JSDOM } from "jsdom";
import * as React from "react";
import * as ReactDOM from "react-dom/client";
import { act } from "react-dom/test-utils";

import type { To } from "react-router-dom";
import {
  BrowserRouter,
  Routes,
  Route,
  Link,
  Outlet,
  useSearchParams,
  useNavigate,
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

  describe("in a <Link> element", () => {
    describe("with a basename that does not contain a trailing slash", () => {
      test("never includes trailing slashes on root links (index route)", () => {
        let window = getWindowImpl("/app");
        act(() => {
          ReactDOM.createRoot(node).render(
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
            </BrowserRouter>
          );
        });

        expect(node.querySelectorAll("a")).toMatchInlineSnapshot(`
          NodeList [
            <a
              href="/app"
            />,
            <a
              href="/app"
            />,
          ]
        `);
      });

      test('never includes trailing slashes on root links (path="")', () => {
        let window = getWindowImpl("/app");
        act(() => {
          ReactDOM.createRoot(node).render(
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
            </BrowserRouter>
          );
        });

        expect(node.querySelectorAll("a")).toMatchInlineSnapshot(`
          NodeList [
            <a
              href="/app"
            />,
            <a
              href="/app"
            />,
          ]
        `);
      });

      test("allows non-root links to control trailing slashes", () => {
        let window = getWindowImpl("/app/parent/child");
        act(() => {
          ReactDOM.createRoot(node).render(
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
                          <Link to="../.." />
                          <Link to="../../" />
                          <Link to="../../parent/child" />
                          <Link to="../../parent/child/" />
                        </>
                      }
                    />
                  </Route>
                </Route>
              </Routes>
            </BrowserRouter>
          );
        });

        expect(node.querySelectorAll("a")).toMatchInlineSnapshot(`
          NodeList [
            <a
              href="/app"
            />,
            <a
              href="/app"
            />,
            <a
              href="/app"
            />,
            <a
              href="/app"
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
              href="/app"
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
          ReactDOM.createRoot(node).render(
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
            </BrowserRouter>
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
          ReactDOM.createRoot(node).render(
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
            </BrowserRouter>
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

      test("allows non-root links to control trailing slashes", () => {
        let window = getWindowImpl("/app/parent/child");
        act(() => {
          ReactDOM.createRoot(node).render(
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
                          <Link to="../.." />
                          <Link to="../../" />
                          <Link to="../../parent/child" />
                          <Link to="../../parent/child/" />
                        </>
                      }
                    />
                  </Route>
                </Route>
              </Routes>
            </BrowserRouter>
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
    describe("with a basename that does not contain a trailing slash", () => {
      test("never includes trailing slashes on root links (/)", () => {
        let window = getWindowImpl("/foo/bar");
        jest.spyOn(window.history, "pushState");
        expect(window.location.href).toBe("https://remix.run/foo/bar");

        act(() => {
          ReactDOM.createRoot(node).render(
            <BrowserRouter basename="/foo" window={window}>
              <Routes>
                <Route index element={<h1>👋</h1>} />
                <Route path="bar" element={<SingleNavigate to="/" />} />
              </Routes>
            </BrowserRouter>
          );
        });
        expect(window.location.href).toBe("https://remix.run/foo");
      });

      test("never includes trailing slashes on root links (../)", () => {
        let window = getWindowImpl("/foo/bar");
        jest.spyOn(window.history, "pushState");
        expect(window.location.href).toBe("https://remix.run/foo/bar");

        act(() => {
          ReactDOM.createRoot(node).render(
            <BrowserRouter basename="/foo" window={window}>
              <Routes>
                <Route index element={<h1>👋</h1>} />
                <Route path="bar" element={<SingleNavigate to="../" />} />
              </Routes>
            </BrowserRouter>
          );
        });
        expect(window.location.href).toBe("https://remix.run/foo");
      });

      test("allows non-root links to leave off trailing slashes", () => {
        let window = getWindowImpl("/foo");
        jest.spyOn(window.history, "pushState");

        expect(window.location.href).toBe("https://remix.run/foo");

        act(() => {
          ReactDOM.createRoot(node).render(
            <BrowserRouter basename="/foo" window={window}>
              <Routes>
                <Route index element={<SingleNavigate to="bar" />} />
                <Route path="bar" element={<h1>👋</h1>} />
              </Routes>
            </BrowserRouter>
          );
        });

        expect(window.location.href).toBe("https://remix.run/foo/bar");
      });

      test("allows non-root links to include trailing slashes", () => {
        let window = getWindowImpl("/foo");
        jest.spyOn(window.history, "pushState");

        expect(window.location.href).toBe("https://remix.run/foo");

        act(() => {
          ReactDOM.createRoot(node).render(
            <BrowserRouter basename="/foo" window={window}>
              <Routes>
                <Route index element={<SingleNavigate to="bar/" />} />
                <Route path="bar" element={<h1>👋</h1>} />
              </Routes>
            </BrowserRouter>
          );
        });

        expect(window.location.href).toBe("https://remix.run/foo/bar/");
      });
    });

    describe("with a basename that contains a trailing slash", () => {
      test("always includes trailing slashes on root links (/)", () => {
        let window = getWindowImpl("/foo/bar");
        jest.spyOn(window.history, "pushState");
        expect(window.location.href).toBe("https://remix.run/foo/bar");

        act(() => {
          ReactDOM.createRoot(node).render(
            <BrowserRouter basename="/foo/" window={window}>
              <Routes>
                <Route index element={<h1>👋</h1>} />
                <Route path="bar" element={<SingleNavigate to="/" />} />
              </Routes>
            </BrowserRouter>
          );
        });
        expect(window.location.href).toBe("https://remix.run/foo/");
      });

      test("always includes trailing slashes on root links (../)", () => {
        let window = getWindowImpl("/foo/bar");
        jest.spyOn(window.history, "pushState");
        expect(window.location.href).toBe("https://remix.run/foo/bar");

        act(() => {
          ReactDOM.createRoot(node).render(
            <BrowserRouter basename="/foo/" window={window}>
              <Routes>
                <Route index element={<h1>👋</h1>} />
                <Route path="bar" element={<SingleNavigate to=".." />} />
              </Routes>
            </BrowserRouter>
          );
        });
        expect(window.location.href).toBe("https://remix.run/foo/");
      });

      test("allows non-root links to leave off trailing slashes", () => {
        let window = getWindowImpl("/foo/");
        jest.spyOn(window.history, "pushState");

        expect(window.location.href).toBe("https://remix.run/foo/");

        act(() => {
          ReactDOM.createRoot(node).render(
            <BrowserRouter basename="/foo/" window={window}>
              <Routes>
                <Route index element={<SingleNavigate to="bar" />} />
                <Route path="bar" element={<h1>👋</h1>} />
              </Routes>
            </BrowserRouter>
          );
        });

        expect(window.location.href).toBe("https://remix.run/foo/bar");
      });

      test("allows non-root links to include trailing slashes", () => {
        let window = getWindowImpl("/foo/");
        jest.spyOn(window.history, "pushState");

        expect(window.location.href).toBe("https://remix.run/foo/");

        act(() => {
          ReactDOM.createRoot(node).render(
            <BrowserRouter basename="/foo/" window={window}>
              <Routes>
                <Route index element={<SingleNavigate to="bar/" />} />
                <Route path="bar" element={<h1>👋</h1>} />
              </Routes>
            </BrowserRouter>
          );
        });

        expect(window.location.href).toBe("https://remix.run/foo/bar/");
      });
    });

    describe("empty string paths", () => {
      it("should not add trailing slashes", () => {
        let window = getWindowImpl("/foo/bar");
        jest.spyOn(window.history, "pushState");

        expect(window.location.href).toBe("https://remix.run/foo/bar");

        act(() => {
          ReactDOM.createRoot(node).render(
            <BrowserRouter basename="/foo" window={window}>
              <Routes>
                <Route index element={<h1>👋</h1>} />
                <Route path="bar" element={<SingleNavigate to="" />} />
              </Routes>
            </BrowserRouter>
          );
        });

        expect(window.location.href).toBe("https://remix.run/foo/bar");
      });

      it("should preserve trailing slash", () => {
        let window = getWindowImpl("/foo/bar/");
        jest.spyOn(window.history, "pushState");

        expect(window.location.href).toBe("https://remix.run/foo/bar/");

        act(() => {
          ReactDOM.createRoot(node).render(
            <BrowserRouter basename="/foo" window={window}>
              <Routes>
                <Route index element={<h1>👋</h1>} />
                <Route path="bar" element={<SingleNavigate to="" />} />
              </Routes>
            </BrowserRouter>
          );
        });

        expect(window.location.href).toBe("https://remix.run/foo/bar/");
      });
    });

    describe("current location '.' paths", () => {
      it("should not add trailing slash", () => {
        let window = getWindowImpl("/foo/bar");
        jest.spyOn(window.history, "pushState");

        expect(window.location.href).toBe("https://remix.run/foo/bar");

        act(() => {
          ReactDOM.createRoot(node).render(
            <BrowserRouter basename="/foo/" window={window}>
              <Routes>
                <Route index element={<h1>👋</h1>} />
                <Route path="bar" element={<SingleNavigate to="." />} />
              </Routes>
            </BrowserRouter>
          );
        });

        expect(window.location.href).toBe("https://remix.run/foo/bar");
      });

      it("should preserve trailing slash", () => {
        let window = getWindowImpl("/foo/bar/");
        jest.spyOn(window.history, "pushState");

        expect(window.location.href).toBe("https://remix.run/foo/bar/");

        act(() => {
          ReactDOM.createRoot(node).render(
            <BrowserRouter basename="/foo/" window={window}>
              <Routes>
                <Route index element={<h1>👋</h1>} />
                <Route path="bar" element={<SingleNavigate to="." />} />
              </Routes>
            </BrowserRouter>
          );
        });

        expect(window.location.href).toBe("https://remix.run/foo/bar/");
      });
    });
  });

  describe("when using setSearchParams", () => {
    it("should not include trailing slash via useSearchParams", () => {
      let window = getWindowImpl("/foo");
      jest.spyOn(window.history, "pushState");

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
        ReactDOM.createRoot(node).render(
          <BrowserRouter basename="/foo" window={window}>
            <Routes>
              <Route index element={<SetSearchParams />} />
            </Routes>
          </BrowserRouter>
        );
      });

      expect(window.location.href).toBe("https://remix.run/foo?key=value");
    });

    it("should include trailing slash via useSearchParams when basename has one", () => {
      let window = getWindowImpl("/foo/");
      jest.spyOn(window.history, "pushState");

      expect(window.location.href).toBe("https://remix.run/foo/");

      function SetSearchParams() {
        let [, setSearchParams] = useSearchParams();
        React.useEffect(
          () => setSearchParams({ key: "value" }),
          [setSearchParams]
        );
        return <h1>👋</h1>;
      }

      act(() => {
        ReactDOM.createRoot(node).render(
          <BrowserRouter basename="/foo/" window={window}>
            <Routes>
              <Route index element={<SetSearchParams />} />
            </Routes>
          </BrowserRouter>
        );
      });

      expect(window.location.href).toBe("https://remix.run/foo/?key=value");
    });
  });
});

function getWindowImpl(initialUrl: string, isHash = false): Window {
  // Need to use our own custom DOM in order to get a working history
  const dom = new JSDOM(`<!DOCTYPE html>`, { url: "https://remix.run/" });
  dom.window.history.replaceState(null, "", (isHash ? "#" : "") + initialUrl);
  return dom.window as unknown as Window;
}

function SingleNavigate({ to }: { to: To }) {
  let navigate = useNavigate();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  React.useEffect(() => navigate(to), [to]);
  return null;
}
