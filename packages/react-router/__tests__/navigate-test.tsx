import * as React from "react";
import * as ReactDOM from "react-dom";
import { act } from "react-dom/test-utils";
import {
  MemoryRouter as Router,
  Routes,
  Route,
  useNavigate,
  useLocation
} from "react-router";

describe("navigate", () => {
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
      function Home() {
        let navigate = useNavigate();

        function handleClick() {
          navigate("/about");
        }

        return (
          <div>
            <h1>Home</h1>
            <button onClick={handleClick}>click me</button>
          </div>
        );
      }

      function About() {
        return <h1>About</h1>;
      }

      act(() => {
        ReactDOM.render(
          <Router initialEntries={["/home"]}>
            <Routes>
              <Route path="home" element={<Home />} />
              <Route path="about" element={<About />} />
            </Routes>
          </Router>,
          node
        );
      });

      expect(node.innerHTML).toMatchInlineSnapshot(
        `"<div><h1>Home</h1><button>click me</button></div>"`
      );

      let button = node.querySelector("button");
      expect(button).not.toBeNull();

      act(() => {
        button?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
      });

      expect(node.innerHTML).toMatchInlineSnapshot(`"<h1>About</h1>"`);
    });
  });

  describe("with a relative href", () => {
    it("navigates to the correct URL", () => {
      function Home() {
        let navigate = useNavigate();

        function handleClick() {
          navigate("../about");
        }

        return (
          <div>
            <h1>Home</h1>
            <button onClick={handleClick}>click me</button>
          </div>
        );
      }

      function About() {
        return <h1>About</h1>;
      }

      act(() => {
        ReactDOM.render(
          <Router initialEntries={["/home"]}>
            <Routes>
              <Route path="home" element={<Home />} />
              <Route path="about" element={<About />} />
            </Routes>
          </Router>,
          node
        );
      });

      expect(node.innerHTML).toMatchInlineSnapshot(
        `"<div><h1>Home</h1><button>click me</button></div>"`
      );

      let button = node.querySelector("button");
      expect(button).not.toBeNull();

      act(() => {
        button?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
      });

      expect(node.innerHTML).toMatchInlineSnapshot(`"<h1>About</h1>"`);
    });
  });

  describe("with a search param", () => {
    it("navigates to the correct URL with params", () => {
      function Home() {
        let navigate = useNavigate();

        function handleClick() {
          navigate({
            pathname: "../about",
            search: new URLSearchParams({ user: "mj" }).toString()
          });
        }

        return (
          <div>
            <h1>Home</h1>
            <button onClick={handleClick}>click me</button>
          </div>
        );
      }

      function About() {
        let user = new URLSearchParams(useLocation().search).get("user");
        return <h1>About {user}</h1>;
      }

      act(() => {
        ReactDOM.render(
          <Router initialEntries={["/home"]}>
            <Routes>
              <Route path="home" element={<Home />} />
              <Route path="about" element={<About />} />
            </Routes>
          </Router>,
          node
        );
      });

      let button = node.querySelector("button");

      act(() => {
        button?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
      });

      expect(node.innerHTML).toMatchInlineSnapshot(`"<h1>About mj</h1>"`);
    });
  });
});
