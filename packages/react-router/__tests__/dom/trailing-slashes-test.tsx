import * as React from "react";
import * as ReactDOM from "react-dom/client";
import { act } from "@testing-library/react";

import type { To } from "../../index";
import {
  BrowserRouter,
  Routes,
  Route,
  Link,
  Outlet,
  useSearchParams,
  useNavigate,
} from "../../index";
import getWindow from "../utils/getWindow";

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
        let window = getWindow("/app");
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
            </BrowserRouter>,
          );
        });

        expect(node.querySelectorAll("a")).toMatchInlineSnapshot(`
          NodeList [
            <a
              data-discover="true"
              href="/app"
            />,
            <a
              data-discover="true"
              href="/app"
            />,
          ]
        `);
      });

      test('never includes trailing slashes on root links (path="")', () => {
        let window = getWindow("/app");
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
            </BrowserRouter>,
          );
        });

        expect(node.querySelectorAll("a")).toMatchInlineSnapshot(`
          NodeList [
            <a
              data-discover="true"
              href="/app"
            />,
            <a
              data-discover="true"
              href="/app"
            />,
          ]
        `);
      });

      test("allows non-root links to control trailing slashes", () => {
        let window = getWindow("/app/parent/child");
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
            </BrowserRouter>,
          );
        });

        expect(node.querySelectorAll("a")).toMatchInlineSnapshot(`
          NodeList [
            <a
              data-discover="true"
              href="/app"
            />,
            <a
              data-discover="true"
              href="/app"
            />,
            <a
              data-discover="true"
              href="/app"
            />,
            <a
              data-discover="true"
              href="/app"
            />,
            <a
              data-discover="true"
              href="/app/parent"
            />,
            <a
              data-discover="true"
              href="/app/parent/"
            />,
            <a
              data-discover="true"
              href="/app"
            />,
            <a
              data-discover="true"
              href="/app"
            />,
            <a
              data-discover="true"
              href="/app/parent/child"
            />,
            <a
              data-discover="true"
              href="/app/parent/child/"
            />,
          ]
        `);
      });
    });

    describe("with a basename that contains a trailing slash", () => {
      test("always contains trailing slashes on root links (index route)", () => {
        let window = getWindow("/app/");
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
            </BrowserRouter>,
          );
        });

        expect(node.querySelectorAll("a")).toMatchInlineSnapshot(`
          NodeList [
            <a
              data-discover="true"
              href="/app/"
            />,
            <a
              data-discover="true"
              href="/app/"
            />,
          ]
        `);
      });

      test('always contains trailing slashes on root links (path="" route)', () => {
        let window = getWindow("/app/");
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
            </BrowserRouter>,
          );
        });

        expect(node.querySelectorAll("a")).toMatchInlineSnapshot(`
          NodeList [
            <a
              data-discover="true"
              href="/app/"
            />,
            <a
              data-discover="true"
              href="/app/"
            />,
          ]
        `);
      });

      test("allows non-root links to control trailing slashes", () => {
        let window = getWindow("/app/parent/child");
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
            </BrowserRouter>,
          );
        });

        expect(node.querySelectorAll("a")).toMatchInlineSnapshot(`
          NodeList [
            <a
              data-discover="true"
              href="/app/"
            />,
            <a
              data-discover="true"
              href="/app/"
            />,
            <a
              data-discover="true"
              href="/app/"
            />,
            <a
              data-discover="true"
              href="/app/"
            />,
            <a
              data-discover="true"
              href="/app/parent"
            />,
            <a
              data-discover="true"
              href="/app/parent/"
            />,
            <a
              data-discover="true"
              href="/app/"
            />,
            <a
              data-discover="true"
              href="/app/"
            />,
            <a
              data-discover="true"
              href="/app/parent/child"
            />,
            <a
              data-discover="true"
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
        let window = getWindow("/foo/bar");
        jest.spyOn(window.history, "pushState");
        expect(window.location.href).toBe("http://localhost/foo/bar");

        act(() => {
          ReactDOM.createRoot(node).render(
            <BrowserRouter basename="/foo" window={window}>
              <Routes>
                <Route index element={<h1>👋</h1>} />
                <Route path="bar" element={<SingleNavigate to="/" />} />
              </Routes>
            </BrowserRouter>,
          );
        });
        expect(window.location.href).toBe("http://localhost/foo");
      });

      test("never includes trailing slashes on root links (../)", () => {
        let window = getWindow("/foo/bar");
        jest.spyOn(window.history, "pushState");
        expect(window.location.href).toBe("http://localhost/foo/bar");

        act(() => {
          ReactDOM.createRoot(node).render(
            <BrowserRouter basename="/foo" window={window}>
              <Routes>
                <Route index element={<h1>👋</h1>} />
                <Route path="bar" element={<SingleNavigate to="../" />} />
              </Routes>
            </BrowserRouter>,
          );
        });
        expect(window.location.href).toBe("http://localhost/foo");
      });

      test("allows non-root links to leave off trailing slashes", () => {
        let window = getWindow("/foo");
        jest.spyOn(window.history, "pushState");

        expect(window.location.href).toBe("http://localhost/foo");

        act(() => {
          ReactDOM.createRoot(node).render(
            <BrowserRouter basename="/foo" window={window}>
              <Routes>
                <Route index element={<SingleNavigate to="bar" />} />
                <Route path="bar" element={<h1>👋</h1>} />
              </Routes>
            </BrowserRouter>,
          );
        });

        expect(window.location.href).toBe("http://localhost/foo/bar");
      });

      test("allows non-root links to include trailing slashes", () => {
        let window = getWindow("/foo");
        jest.spyOn(window.history, "pushState");

        expect(window.location.href).toBe("http://localhost/foo");

        act(() => {
          ReactDOM.createRoot(node).render(
            <BrowserRouter basename="/foo" window={window}>
              <Routes>
                <Route index element={<SingleNavigate to="bar/" />} />
                <Route path="bar" element={<h1>👋</h1>} />
              </Routes>
            </BrowserRouter>,
          );
        });

        expect(window.location.href).toBe("http://localhost/foo/bar/");
      });
    });

    describe("with a basename that contains a trailing slash", () => {
      test("always includes trailing slashes on root links (/)", () => {
        let window = getWindow("/foo/bar");
        jest.spyOn(window.history, "pushState");
        expect(window.location.href).toBe("http://localhost/foo/bar");

        act(() => {
          ReactDOM.createRoot(node).render(
            <BrowserRouter basename="/foo/" window={window}>
              <Routes>
                <Route index element={<h1>👋</h1>} />
                <Route path="bar" element={<SingleNavigate to="/" />} />
              </Routes>
            </BrowserRouter>,
          );
        });
        expect(window.location.href).toBe("http://localhost/foo/");
      });

      test("always includes trailing slashes on root links (../)", () => {
        let window = getWindow("/foo/bar");
        jest.spyOn(window.history, "pushState");
        expect(window.location.href).toBe("http://localhost/foo/bar");

        act(() => {
          ReactDOM.createRoot(node).render(
            <BrowserRouter basename="/foo/" window={window}>
              <Routes>
                <Route index element={<h1>👋</h1>} />
                <Route path="bar" element={<SingleNavigate to=".." />} />
              </Routes>
            </BrowserRouter>,
          );
        });
        expect(window.location.href).toBe("http://localhost/foo/");
      });

      test("allows non-root links to leave off trailing slashes", () => {
        let window = getWindow("/foo/");
        jest.spyOn(window.history, "pushState");

        expect(window.location.href).toBe("http://localhost/foo/");

        act(() => {
          ReactDOM.createRoot(node).render(
            <BrowserRouter basename="/foo/" window={window}>
              <Routes>
                <Route index element={<SingleNavigate to="bar" />} />
                <Route path="bar" element={<h1>👋</h1>} />
              </Routes>
            </BrowserRouter>,
          );
        });

        expect(window.location.href).toBe("http://localhost/foo/bar");
      });

      test("allows non-root links to include trailing slashes", () => {
        let window = getWindow("/foo/");
        jest.spyOn(window.history, "pushState");

        expect(window.location.href).toBe("http://localhost/foo/");

        act(() => {
          ReactDOM.createRoot(node).render(
            <BrowserRouter basename="/foo/" window={window}>
              <Routes>
                <Route index element={<SingleNavigate to="bar/" />} />
                <Route path="bar" element={<h1>👋</h1>} />
              </Routes>
            </BrowserRouter>,
          );
        });

        expect(window.location.href).toBe("http://localhost/foo/bar/");
      });
    });

    describe("empty string paths", () => {
      it("should not add trailing slashes", () => {
        let window = getWindow("/foo/bar");
        jest.spyOn(window.history, "pushState");

        expect(window.location.href).toBe("http://localhost/foo/bar");

        act(() => {
          ReactDOM.createRoot(node).render(
            <BrowserRouter basename="/foo" window={window}>
              <Routes>
                <Route index element={<h1>👋</h1>} />
                <Route path="bar" element={<SingleNavigate to="" />} />
              </Routes>
            </BrowserRouter>,
          );
        });

        expect(window.location.href).toBe("http://localhost/foo/bar");
      });

      it("should preserve trailing slash", () => {
        let window = getWindow("/foo/bar/");
        jest.spyOn(window.history, "pushState");

        expect(window.location.href).toBe("http://localhost/foo/bar/");

        act(() => {
          ReactDOM.createRoot(node).render(
            <BrowserRouter basename="/foo" window={window}>
              <Routes>
                <Route index element={<h1>👋</h1>} />
                <Route path="bar" element={<SingleNavigate to="" />} />
              </Routes>
            </BrowserRouter>,
          );
        });

        expect(window.location.href).toBe("http://localhost/foo/bar/");
      });
    });

    describe("current location '.' paths", () => {
      it("should not add trailing slash", () => {
        let window = getWindow("/foo/bar");
        jest.spyOn(window.history, "pushState");

        expect(window.location.href).toBe("http://localhost/foo/bar");

        act(() => {
          ReactDOM.createRoot(node).render(
            <BrowserRouter basename="/foo/" window={window}>
              <Routes>
                <Route index element={<h1>👋</h1>} />
                <Route path="bar" element={<SingleNavigate to="." />} />
              </Routes>
            </BrowserRouter>,
          );
        });

        expect(window.location.href).toBe("http://localhost/foo/bar");
      });

      it("should preserve trailing slash", () => {
        let window = getWindow("/foo/bar/");
        jest.spyOn(window.history, "pushState");

        expect(window.location.href).toBe("http://localhost/foo/bar/");

        act(() => {
          ReactDOM.createRoot(node).render(
            <BrowserRouter basename="/foo/" window={window}>
              <Routes>
                <Route index element={<h1>👋</h1>} />
                <Route path="bar" element={<SingleNavigate to="." />} />
              </Routes>
            </BrowserRouter>,
          );
        });

        expect(window.location.href).toBe("http://localhost/foo/bar/");
      });
    });
  });

  describe("when using setSearchParams", () => {
    it("should not include trailing slash via useSearchParams", () => {
      let window = getWindow("/foo");
      jest.spyOn(window.history, "pushState");

      expect(window.location.href).toBe("http://localhost/foo");

      function SetSearchParams() {
        let [, setSearchParams] = useSearchParams();
        React.useEffect(
          () => setSearchParams({ key: "value" }),
          [setSearchParams],
        );
        return <h1>👋</h1>;
      }

      act(() => {
        ReactDOM.createRoot(node).render(
          <BrowserRouter basename="/foo" window={window}>
            <Routes>
              <Route index element={<SetSearchParams />} />
            </Routes>
          </BrowserRouter>,
        );
      });

      expect(window.location.href).toBe("http://localhost/foo?key=value");
    });

    it("should include trailing slash via useSearchParams when basename has one", () => {
      let window = getWindow("/foo/");
      jest.spyOn(window.history, "pushState");

      expect(window.location.href).toBe("http://localhost/foo/");

      function SetSearchParams() {
        let [, setSearchParams] = useSearchParams();
        React.useEffect(
          () => setSearchParams({ key: "value" }),
          [setSearchParams],
        );
        return <h1>👋</h1>;
      }

      act(() => {
        ReactDOM.createRoot(node).render(
          <BrowserRouter basename="/foo/" window={window}>
            <Routes>
              <Route index element={<SetSearchParams />} />
            </Routes>
          </BrowserRouter>,
        );
      });

      expect(window.location.href).toBe("http://localhost/foo/?key=value");
    });
  });
});

function SingleNavigate({ to }: { to: To }) {
  let navigate = useNavigate();
  React.useEffect(() => {
    navigate(to);
  }, [navigate, to]);
  return null;
}
