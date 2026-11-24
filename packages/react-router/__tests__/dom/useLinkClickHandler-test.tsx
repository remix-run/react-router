import * as React from "react";
import * as ReactDOM from "react-dom/client";
import { act } from "@testing-library/react";
import type { LinkProps } from "../../index";
import {
  MemoryRouter,
  Routes,
  Route,
  useHref,
  useLinkClickHandler,
} from "../../index";

function CustomLink({ to, replace, state, target, ...rest }: LinkProps) {
  let href = useHref(to);
  let handleClick = useLinkClickHandler(to, { target, replace, state });
  return (
    // eslint-disable-next-line jsx-a11y/anchor-has-content
    <a {...rest} href={href} onClick={handleClick} target={target} />
  );
}

describe("Custom link with useLinkClickHandler", () => {
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
    act(() => {
      ReactDOM.createRoot(node).render(
        <MemoryRouter initialEntries={["/home"]}>
          <Routes>
            <Route
              path="home"
              element={
                <div>
                  <h1>Home</h1>
                  <CustomLink to="../about">About</CustomLink>
                </div>
              }
            />
            <Route path="about" element={<h1>About</h1>} />
          </Routes>
        </MemoryRouter>,
      );
    });

    let anchor = node.querySelector("a");
    expect(anchor).not.toBeNull();

    act(() => {
      anchor?.dispatchEvent(
        new MouseEvent("click", {
          view: window,
          bubbles: true,
          cancelable: true,
        }),
      );
    });

    let h1 = node.querySelector("h1");
    expect(h1).not.toBeNull();
    expect(h1?.textContent).toEqual("About");
  });

  describe("with a right click", () => {
    it("stays on the same page", () => {
      act(() => {
        ReactDOM.createRoot(node).render(
          <MemoryRouter initialEntries={["/home"]}>
            <Routes>
              <Route
                path="home"
                element={
                  <div>
                    <h1>Home</h1>
                    <CustomLink to="../about">About</CustomLink>
                  </div>
                }
              />
              <Route path="about" element={<h1>About</h1>} />
            </Routes>
          </MemoryRouter>,
        );
      });

      let anchor = node.querySelector("a");
      expect(anchor).not.toBeNull();

      act(() => {
        // https://developer.mozilla.org/en-US/docs/Web/API/MouseEvent/button
        let RightMouseButton = 2;
        anchor?.dispatchEvent(
          new MouseEvent("click", {
            view: window,
            bubbles: true,
            cancelable: true,
            button: RightMouseButton,
          }),
        );
      });

      let h1 = node.querySelector("h1");
      expect(h1).not.toBeNull();
      expect(h1?.textContent).toEqual("Home");
    });
  });

  describe("when the link is supposed to open in a new window", () => {
    it("stays on the same page", () => {
      act(() => {
        ReactDOM.createRoot(node).render(
          <MemoryRouter initialEntries={["/home"]}>
            <Routes>
              <Route
                path="home"
                element={
                  <div>
                    <h1>Home</h1>
                    <CustomLink to="../about" target="_blank">
                      About
                    </CustomLink>
                  </div>
                }
              />
              <Route path="about" element={<h1>About</h1>} />
            </Routes>
          </MemoryRouter>,
        );
      });

      let anchor = node.querySelector("a");
      expect(anchor).not.toBeNull();

      act(() => {
        anchor?.dispatchEvent(
          new MouseEvent("click", {
            view: window,
            bubbles: true,
            cancelable: true,
          }),
        );
      });

      let h1 = node.querySelector("h1");
      expect(h1).not.toBeNull();
      expect(h1?.textContent).toEqual("Home");
    });
  });

  describe("when the link has a download attribute", () => {
    it("leaves a click on a child of a named download link to the browser", () => {
      act(() => {
        ReactDOM.createRoot(node).render(
          <MemoryRouter initialEntries={["/home"]}>
            <Routes>
              <Route
                path="home"
                element={
                  <div>
                    <h1>Home</h1>
                    <CustomLink to="../about" download="about.html">
                      <span>About</span>
                    </CustomLink>
                  </div>
                }
              />
              <Route path="about" element={<h1>About</h1>} />
            </Routes>
          </MemoryRouter>,
        );
      });

      let label = node.querySelector("a span");
      expect(label).not.toBeNull();

      let event = new MouseEvent("click", {
        view: window,
        bubbles: true,
        cancelable: true,
      });
      act(() => {
        label?.dispatchEvent(event);
      });

      expect(event.defaultPrevented).toBe(false);
      let h1 = node.querySelector("h1");
      expect(h1).not.toBeNull();
      expect(h1?.textContent).toEqual("Home");
    });
  });

  it("navigates when used on a button with a download attribute", () => {
    function NavigationButton() {
      let handleClick = useLinkClickHandler<HTMLButtonElement>("/about");
      return (
        <button {...{ download: "" }} onClick={handleClick}>
          About
        </button>
      );
    }

    act(() => {
      ReactDOM.createRoot(node).render(
        <MemoryRouter>
          <Routes>
            <Route path="/" element={<NavigationButton />} />
            <Route path="/about" element={<h1>About</h1>} />
          </Routes>
        </MemoryRouter>,
      );
    });

    let button = node.querySelector("button");
    expect(button).toHaveAttribute("download");
    act(() => {
      button?.click();
    });

    expect(node.querySelector("h1")).toHaveTextContent("About");
  });

  it("navigates when a download anchor has no href", () => {
    act(() => {
      ReactDOM.createRoot(node).render(
        <MemoryRouter>
          <Routes>
            <Route
              path="/"
              element={
                <CustomLink to="/about" download>
                  About
                </CustomLink>
              }
            />
            <Route path="/about" element={<h1>About</h1>} />
          </Routes>
        </MemoryRouter>,
      );
    });

    let anchor = node.querySelector("a");
    expect(anchor).toHaveAttribute("download");
    anchor?.removeAttribute("href");
    act(() => {
      anchor?.click();
    });

    expect(node.querySelector("h1")).toHaveTextContent("About");
  });

  describe("when the modifier keys are used", () => {
    it("stays on the same page", () => {
      act(() => {
        ReactDOM.createRoot(node).render(
          <MemoryRouter initialEntries={["/home"]}>
            <Routes>
              <Route
                path="home"
                element={
                  <div>
                    <h1>Home</h1>
                    <CustomLink to="../about">About</CustomLink>
                  </div>
                }
              />
              <Route path="about" element={<h1>About</h1>} />
            </Routes>
          </MemoryRouter>,
        );
      });

      let anchor = node.querySelector("a");
      expect(anchor).not.toBeNull();

      act(() => {
        anchor?.dispatchEvent(
          new MouseEvent("click", {
            view: window,
            bubbles: true,
            cancelable: true,
            // The Ctrl key is pressed
            ctrlKey: true,
          }),
        );
      });

      let h1 = node.querySelector("h1");
      expect(h1).not.toBeNull();
      expect(h1?.textContent).toEqual("Home");
    });
  });
});
