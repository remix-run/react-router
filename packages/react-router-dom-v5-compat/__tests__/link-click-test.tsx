/**
 * Just copied over the link click test as a quick smoke test that it's working
 * the same as v6 proper.
 */
import * as React from "react";
import * as ReactDOM from "react-dom/client";
import { act } from "react-dom/test-utils";
import { MemoryRouter, Routes, Route, Link } from "../index";

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
