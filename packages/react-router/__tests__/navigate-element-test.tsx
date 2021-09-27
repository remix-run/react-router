import * as React from "react";
import * as ReactDOM from "react-dom";
import { act } from "react-dom/test-utils";
import { MemoryRouter as Router, Navigate, Routes, Route } from "react-router";

describe("navigate using an element", () => {
  let node: HTMLDivElement;
  beforeEach(() => {
    node = document.createElement("div");
    document.body.appendChild(node);
  });

  afterEach(() => {
    document.body.removeChild(node);
    node = null!;
  });

  describe("with an absolute href", () => {
    it("navigates to the correct URL", () => {
      act(() => {
        ReactDOM.render(
          <Router initialEntries={["/home"]}>
            <Routes>
              <Route path="home" element={<Navigate to="/about" />} />
              <Route path="about" element={<h1>About</h1>} />
            </Routes>
          </Router>,
          node
        );
      });

      expect(node.innerHTML).toMatchInlineSnapshot(`"<h1>About</h1>"`);
    });
  });

  describe("with a relative href", () => {
    it("navigates to the correct URL", () => {
      act(() => {
        ReactDOM.render(
          <Router initialEntries={["/home"]}>
            <Routes>
              <Route path="home" element={<Navigate to="../about" />} />
              <Route path="about" element={<h1>About</h1>} />
            </Routes>
          </Router>,
          node
        );
      });

      expect(node.innerHTML).toMatchInlineSnapshot(`"<h1>About</h1>"`);
    });
  });
});
