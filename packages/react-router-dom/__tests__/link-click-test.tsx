import * as React from "react";
import * as ReactDOM from "react-dom/client";
import { act } from "react-dom/test-utils";
import { MemoryRouter, Routes, Route, Link } from "react-router-dom";

function click(anchor: HTMLAnchorElement, eventInit?: MouseEventInit) {
  let event = new MouseEvent("click", {
    view: window,
    bubbles: true,
    cancelable: true,
    ...eventInit,
  });
  anchor.dispatchEvent(event);
  return event;
}

describe("A <Link> click", () => {
  let node: HTMLDivElement;
  beforeEach(() => {
    node = document.createElement("div");
    document.body.appendChild(node);
  });

  afterEach(() => {
    document.body.removeChild(node);
    node = null!;
  });

  it("navigates to the new page", () => {
    function Home() {
      return (
        <div>
          <h1>Home</h1>
          <Link to="../about">About</Link>
        </div>
      );
    }

    act(() => {
      ReactDOM.createRoot(node).render(
        <MemoryRouter initialEntries={["/home"]}>
          <Routes>
            <Route path="home" element={<Home />} />
            <Route path="about" element={<h1>About</h1>} />
          </Routes>
        </MemoryRouter>
      );
    });

    let anchor = node.querySelector("a");
    expect(anchor).not.toBeNull();

    let event: MouseEvent;
    act(() => {
      event = click(anchor);
    });

    expect(event.defaultPrevented).toBe(true);
    let h1 = node.querySelector("h1");
    expect(h1).not.toBeNull();
    expect(h1?.textContent).toEqual("About");
  });

  it("navigates to the new page when using an absolute URL on the same origin", () => {
    function Home() {
      return (
        <div>
          <h1>Home</h1>
          <Link to="http://localhost/about">About</Link>
        </div>
      );
    }

    act(() => {
      ReactDOM.createRoot(node).render(
        <MemoryRouter initialEntries={["/home"]}>
          <Routes>
            <Route path="home" element={<Home />} />
            <Route path="about" element={<h1>About</h1>} />
          </Routes>
        </MemoryRouter>
      );
    });

    let anchor = node.querySelector("a");
    expect(anchor).not.toBeNull();

    let event: MouseEvent;
    act(() => {
      event = click(anchor);
    });

    expect(event.defaultPrevented).toBe(true);
    let h1 = node.querySelector("h1");
    expect(h1).not.toBeNull();
    expect(h1?.textContent).toEqual("About");
  });

  describe("when an external absolute URL is specified", () => {
    it("does not prevent default", () => {
      function Home() {
        return (
          <div>
            <h1>Home</h1>
            <Link to="https://remix.run">About</Link>
          </div>
        );
      }

      act(() => {
        ReactDOM.createRoot(node).render(
          <MemoryRouter initialEntries={["/home"]}>
            <Routes>
              <Route path="home" element={<Home />} />
              <Route path="about" element={<h1>About</h1>} />
            </Routes>
          </MemoryRouter>
        );
      });

      let anchor = node.querySelector("a");
      expect(anchor).not.toBeNull();

      let event: MouseEvent;
      act(() => {
        event = click(anchor);
      });

      expect(event.defaultPrevented).toBe(false);
    });

    it("calls provided listener", () => {
      let handlerCalled;
      let defaultPrevented;

      function Home() {
        return (
          <div>
            <h1>Home</h1>
            <Link
              to="https://remix.run"
              onClick={(e) => {
                handlerCalled = true;
                defaultPrevented = e.defaultPrevented;
              }}
            >
              About
            </Link>
          </div>
        );
      }

      act(() => {
        ReactDOM.createRoot(node).render(
          <MemoryRouter initialEntries={["/home"]}>
            <Routes>
              <Route path="home" element={<Home />} />
              <Route path="about" element={<h1>About</h1>} />
            </Routes>
          </MemoryRouter>
        );
      });

      act(() => {
        click(node.querySelector("a"));
      });

      expect(handlerCalled).toBe(true);
      expect(defaultPrevented).toBe(false);
    });
  });

  describe("when a same-origin/different-basename absolute URL is specified", () => {
    it("does not prevent default", () => {
      function Home() {
        return (
          <div>
            <h1>Home</h1>
            <Link to="http://localhost/not/base">About</Link>
          </div>
        );
      }

      act(() => {
        ReactDOM.createRoot(node).render(
          <MemoryRouter initialEntries={["/base/home"]} basename="/base">
            <Routes>
              <Route path="home" element={<Home />} />
            </Routes>
          </MemoryRouter>
        );
      });

      let anchor = node.querySelector("a");
      expect(anchor).not.toBeNull();

      let event: MouseEvent;
      act(() => {
        event = click(anchor);
      });

      expect(event.defaultPrevented).toBe(false);
    });

    it("calls provided listener", () => {
      let handlerCalled;
      let defaultPrevented;

      function Home() {
        return (
          <div>
            <h1>Home</h1>
            <Link
              to="http://localhost/not/base"
              onClick={(e) => {
                handlerCalled = true;
                defaultPrevented = e.defaultPrevented;
              }}
            >
              About
            </Link>
          </div>
        );
      }

      act(() => {
        ReactDOM.createRoot(node).render(
          <MemoryRouter initialEntries={["/base/home"]} basename="/base">
            <Routes>
              <Route path="home" element={<Home />} />
            </Routes>
          </MemoryRouter>
        );
      });

      act(() => {
        click(node.querySelector("a"));
      });

      expect(handlerCalled).toBe(true);
      expect(defaultPrevented).toBe(false);
    });
  });

  describe("when reloadDocument is specified", () => {
    it("does not prevent default", () => {
      function Home() {
        return (
          <div>
            <h1>Home</h1>
            <Link reloadDocument to="../about">
              About
            </Link>
          </div>
        );
      }

      act(() => {
        ReactDOM.createRoot(node).render(
          <MemoryRouter initialEntries={["/home"]}>
            <Routes>
              <Route path="home" element={<Home />} />
              <Route path="about" element={<h1>About</h1>} />
            </Routes>
          </MemoryRouter>
        );
      });

      let anchor = node.querySelector("a");
      expect(anchor).not.toBeNull();

      let event: MouseEvent;
      act(() => {
        event = click(anchor);
      });

      expect(event.defaultPrevented).toBe(false);
    });

    it("calls provided listener", () => {
      let handlerCalled;
      let defaultPrevented;

      function Home() {
        return (
          <div>
            <h1>Home</h1>
            <Link
              reloadDocument
              to="../about"
              onClick={(e) => {
                handlerCalled = true;
                defaultPrevented = e.defaultPrevented;
              }}
            >
              About
            </Link>
          </div>
        );
      }

      act(() => {
        ReactDOM.createRoot(node).render(
          <MemoryRouter initialEntries={["/home"]}>
            <Routes>
              <Route path="home" element={<Home />} />
              <Route path="about" element={<h1>About</h1>} />
            </Routes>
          </MemoryRouter>
        );
      });

      act(() => {
        click(node.querySelector("a"));
      });

      expect(handlerCalled).toBe(true);
      expect(defaultPrevented).toBe(false);
    });
  });

  describe("when preventDefault is used on the click handler", () => {
    it("stays on the same page", () => {
      function Home() {
        function handleClick(event: React.MouseEvent<HTMLAnchorElement>) {
          event.preventDefault();
        }

        return (
          <div>
            <h1>Home</h1>
            <Link to="../about" onClick={handleClick}>
              About
            </Link>
          </div>
        );
      }

      act(() => {
        ReactDOM.createRoot(node).render(
          <MemoryRouter initialEntries={["/home"]}>
            <Routes>
              <Route path="home" element={<Home />} />
              <Route path="about" element={<h1>About</h1>} />
            </Routes>
          </MemoryRouter>
        );
      });

      let anchor = node.querySelector("a");
      expect(anchor).not.toBeNull();

      act(() => {
        click(anchor);
      });

      let h1 = node.querySelector("h1");
      expect(h1).not.toBeNull();
      expect(h1?.textContent).toEqual("Home");
    });
  });

  describe("with a right click", () => {
    it("stays on the same page", () => {
      function Home() {
        return (
          <div>
            <h1>Home</h1>
            <Link to="../about">About</Link>
          </div>
        );
      }

      act(() => {
        ReactDOM.createRoot(node).render(
          <MemoryRouter initialEntries={["/home"]}>
            <Routes>
              <Route path="home" element={<Home />} />
              <Route path="about" element={<h1>About</h1>} />
            </Routes>
          </MemoryRouter>
        );
      });

      let anchor = node.querySelector("a");
      expect(anchor).not.toBeNull();

      act(() => {
        // https://developer.mozilla.org/en-US/docs/Web/API/MouseEvent/button
        let RightMouseButton = 2;
        click(anchor, { button: RightMouseButton });
      });

      let h1 = node.querySelector("h1");
      expect(h1).not.toBeNull();
      expect(h1?.textContent).toEqual("Home");
    });
  });

  describe("when the link is supposed to open in a new window", () => {
    it("stays on the same page", () => {
      function Home() {
        return (
          <div>
            <h1>Home</h1>
            <Link to="../about" target="_blank">
              About
            </Link>
          </div>
        );
      }

      act(() => {
        ReactDOM.createRoot(node).render(
          <MemoryRouter initialEntries={["/home"]}>
            <Routes>
              <Route path="home" element={<Home />} />
              <Route path="about" element={<h1>About</h1>} />
            </Routes>
          </MemoryRouter>
        );
      });

      let anchor = node.querySelector("a");
      expect(anchor).not.toBeNull();

      act(() => {
        click(anchor);
      });

      let h1 = node.querySelector("h1");
      expect(h1).not.toBeNull();
      expect(h1?.textContent).toEqual("Home");
    });
  });

  describe("when the modifier keys are used", () => {
    it("stays on the same page", () => {
      function Home() {
        return (
          <div>
            <h1>Home</h1>
            <Link to="../about">About</Link>
          </div>
        );
      }

      act(() => {
        ReactDOM.createRoot(node).render(
          <MemoryRouter initialEntries={["/home"]}>
            <Routes>
              <Route path="home" element={<Home />} />
              <Route path="about" element={<h1>About</h1>} />
            </Routes>
          </MemoryRouter>
        );
      });

      let anchor = node.querySelector("a");
      expect(anchor).not.toBeNull();

      act(() => {
        click(anchor, { ctrlKey: true });
      });

      let h1 = node.querySelector("h1");
      expect(h1).not.toBeNull();
      expect(h1?.textContent).toEqual("Home");
    });
  });
});
