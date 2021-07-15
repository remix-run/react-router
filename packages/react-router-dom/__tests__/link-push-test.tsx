import * as React from "react";
import * as ReactDOM from "react-dom";
import { act } from "react-dom/test-utils";
import { Router, Routes, Route, Link } from "react-router-dom";
import type { History } from "history";

function createHref({ pathname = "/", search = "", hash = "" }): string {
  return pathname + search + hash;
}

function createMockHistory({ pathname = "/", search = "", hash = "" }) {
  let location: Partial<History["location"]> = { pathname, search, hash };
  return {
    action: "POP",
    location,
    createHref,
    push() {},
    replace() {},
    go() {},
    back() {},
    forward() {},
    listen() {
      return () => {};
    },
    block() {
      return () => {};
    }
  } as History;
}

describe("Link push and replace", () => {
  let node: HTMLDivElement;
  beforeEach(() => {
    node = document.createElement("div");
    document.body.appendChild(node);
  });

  afterEach(() => {
    document.body.removeChild(node);
    node = null;
  });

  describe("to a different pathname, when it is clicked", () => {
    it("performs a push", () => {
      function Home() {
        return (
          <div>
            <h1>Home</h1>
            <Link to="../about">About</Link>
          </div>
        );
      }

      let history = createMockHistory({ pathname: "/home" });
      let spy = jest.spyOn(history, "push");

      act(() => {
        ReactDOM.render(
          <Router
            action={history.action}
            location={history.location}
            navigator={history}
          >
            <Routes>
              <Route path="home" element={<Home />} />
            </Routes>
          </Router>,
          node
        );
      });

      let anchor = node.querySelector("a");
      expect(anchor).not.toBeNull();

      act(() => {
        anchor.dispatchEvent(
          new MouseEvent("click", {
            view: window,
            bubbles: true,
            cancelable: true
          })
        );
      });

      expect(spy).toHaveBeenCalledWith(
        expect.objectContaining({
          pathname: "/about",
          search: "",
          hash: ""
        }),
        undefined
      );
    });
  });

  describe("to a different search string, when it is clicked", () => {
    it("performs a push (with the existing pathname)", () => {
      function Home() {
        return (
          <div>
            <h1>Home</h1>
            <Link to="?name=michael">Michael</Link>
          </div>
        );
      }

      let history = createMockHistory({ pathname: "/home" });
      let spy = jest.spyOn(history, "push");

      act(() => {
        ReactDOM.render(
          <Router
            action={history.action}
            location={history.location}
            navigator={history}
          >
            <Routes>
              <Route path="home" element={<Home />} />
            </Routes>
          </Router>,
          node
        );
      });

      let anchor = node.querySelector("a");
      expect(anchor).not.toBeNull();

      act(() => {
        anchor.dispatchEvent(
          new MouseEvent("click", {
            view: window,
            bubbles: true,
            cancelable: true
          })
        );
      });

      expect(spy).toHaveBeenCalledWith(
        expect.objectContaining({
          pathname: "/home",
          search: "?name=michael",
          hash: ""
        }),
        undefined
      );
    });
  });

  describe("to a different hash, when it is clicked", () => {
    it("performs a push (with the existing pathname)", () => {
      function Home() {
        return (
          <div>
            <h1>Home</h1>
            <Link to="#bio">Bio</Link>
          </div>
        );
      }

      let history = createMockHistory({ pathname: "/home" });
      let spy = jest.spyOn(history, "push");

      act(() => {
        ReactDOM.render(
          <Router
            action={history.action}
            location={history.location}
            navigator={history}
          >
            <Routes>
              <Route path="home" element={<Home />} />
            </Routes>
          </Router>,
          node
        );
      });

      let anchor = node.querySelector("a");
      expect(anchor).not.toBeNull();

      act(() => {
        anchor.dispatchEvent(
          new MouseEvent("click", {
            view: window,
            bubbles: true,
            cancelable: true
          })
        );
      });

      expect(spy).toHaveBeenCalledWith(
        expect.objectContaining({
          pathname: "/home",
          search: "",
          hash: "#bio"
        }),
        undefined
      );
    });
  });

  describe("to the same page, when it is clicked", () => {
    it("performs a replace", () => {
      function Home() {
        return (
          <div>
            <h1>Home</h1>
            <Link to=".">Home</Link>
          </div>
        );
      }

      function About() {
        return <h1>About</h1>;
      }

      let history = createMockHistory({ pathname: "/home" });
      let spy = jest.spyOn(history, "replace");

      act(() => {
        ReactDOM.render(
          <Router
            action={history.action}
            location={history.location}
            navigator={history}
          >
            <Routes>
              <Route path="home" element={<Home />} />
              <Route path="about" element={<About />} />
            </Routes>
          </Router>,
          node
        );
      });

      let anchor = node.querySelector("a");
      expect(anchor).not.toBeNull();

      act(() => {
        anchor.dispatchEvent(
          new MouseEvent("click", {
            view: window,
            bubbles: true,
            cancelable: true
          })
        );
      });

      expect(spy).toHaveBeenCalledWith(
        expect.objectContaining({
          pathname: "/home",
          search: "",
          hash: ""
        }),
        undefined
      );
    });
  });
});
