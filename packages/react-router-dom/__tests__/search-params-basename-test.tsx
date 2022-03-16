import * as React from "react";
import * as ReactDOM from "react-dom";
import { act } from "react-dom/test-utils";
import { Routes, Route, Link, useSearchParams, BrowserRouter } from "react-router-dom";


describe("With router basename", () => {
  describe("change query string only when path is equal as basename", () => {
    let node: HTMLDivElement;
    const basePath = "/foo/bar";
    const searchQuery = "?param=ParamValue";

    beforeEach(() => {
      window.history.pushState({}, "", basePath)
      node = document.createElement("div");
      document.body.appendChild(node);
    });

    afterEach(() => {
      document.body.removeChild(node);
      node = null;
    });

    it("using link click", () => {
      function Bar() {
        return <Link to={searchQuery}>go to params</Link>;
      }

      act(() => {
        ReactDOM.render(
          <BrowserRouter basename={basePath}>
            <Routes>
              <Route index element={<Bar />} />
            </Routes>
          </BrowserRouter>,
          node
        );
      });

      let anchor = node.querySelector("a");
      expect(anchor).toBeDefined();

      act(() => {
        anchor.dispatchEvent(
          new MouseEvent("click", {
            view: window,
            bubbles: true,
            cancelable: true,
          })
        );
      });

      expect(window.location.search).toBe(searchQuery);
      expect(window.location.pathname).toBe(basePath);
    });

    it("using setSearchParams from useSearchParams", () => {
      function Bar() {
        const [, setSearchParams] = useSearchParams();

        React.useEffect(() => {
          const newSearchParams = new URLSearchParams(searchQuery);
          setSearchParams(newSearchParams);
        }, [setSearchParams]);

        return null;
      }

      act(() => {
        ReactDOM.render(
          <BrowserRouter basename={basePath}>
            <Routes>
              <Route index element={<Bar />} />
            </Routes>
          </BrowserRouter>,
          node
        );
      });

      expect(window.location.pathname).toBe(basePath);
      expect(window.location.search).toBe(searchQuery);
    });
  });

  describe("change query string only when path is NOT equal as basename", () => {
    let node: HTMLDivElement;
    const basePath = "/foo";
    const visitedPath = "bar";
    const searchQuery = "?param=ParamValue";

    beforeEach(() => {
      window.history.pushState({}, "", basePath + '/' + visitedPath)
      node = document.createElement("div");
      document.body.appendChild(node);
    });

    afterEach(() => {
      document.body.removeChild(node);
      node = null;
    });

    it("using setSearchParams from useSearchParams", () => {
      function Bar() {
        const [, setSearchParams] = useSearchParams();

        React.useEffect(() => {
          const newSearchParams = new URLSearchParams(searchQuery);
          setSearchParams(newSearchParams);
        }, [setSearchParams]);

        return null;
      }

      act(() => {
        ReactDOM.render(
          <BrowserRouter basename={basePath}>
            <Routes>
              <Route path={visitedPath} element={<Bar />} />
            </Routes>
          </BrowserRouter>,
          node
        );
      });

      expect(window.location.pathname).toBe(basePath + '/' + visitedPath);
      expect(window.location.search).toBe(searchQuery);
    });
  });
});
