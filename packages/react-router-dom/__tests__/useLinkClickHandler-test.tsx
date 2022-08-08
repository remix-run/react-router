import * as React from "react";
import * as ReactDOM from "react-dom/client";
import { act } from "react-dom/test-utils";
import type { LinkProps } from "react-router-dom";
import {
  MemoryRouter,
  Routes,
  Route,
  useHref,
  useLinkClickHandler,
} from "react-router-dom";

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
        </MemoryRouter>
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
        })
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
          </MemoryRouter>
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
          })
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
          </MemoryRouter>
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
          })
        );
      });

      let h1 = node.querySelector("h1");
      expect(h1).not.toBeNull();
      expect(h1?.textContent).toEqual("Home");
    });
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
          </MemoryRouter>
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
          })
        );
      });

      let h1 = node.querySelector("h1");
      expect(h1).not.toBeNull();
      expect(h1?.textContent).toEqual("Home");
    });
  });
});
