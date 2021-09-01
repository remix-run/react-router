import * as React from "react";
import * as ReactDOM from "react-dom";
import { act } from "react-dom/test-utils";
import {
  MemoryRouter as Router,
  Outlet,
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

  describe("with a search param and no pathname", () => {
    function Bakery() {
      let navigate = useNavigate();

      let user = new URLSearchParams(useLocation().search).get("user");
      function handleClick() {
        navigate({
          search: user ? "" : new URLSearchParams({ user: "mj" }).toString()
        });
      }

      return (
        <div>
          <h1>Bakery</h1>
          {user && <p>Welcome {user}</p>}
          <Outlet />
          <button onClick={handleClick}>{user ? "logout" : "login"}</button>
        </div>
      );
    }

    function Muffins() {
      return <h2>Yay, muffins!</h2>;
    }

    function About() {
      let user = new URLSearchParams(useLocation().search).get("user");
      return <h1>About {user}</h1>;
    }

    it("resolves using the current location", () => {
      act(() => {
        ReactDOM.render(
          <Router initialEntries={["/bakery/muffins"]}>
            <Routes>
              <Route path="bakery" element={<Bakery />}>
                <Route path="muffins" element={<Muffins />} />
              </Route>
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

      expect(node.innerHTML).toMatchInlineSnapshot(
        `"<div><h1>Bakery</h1><p>Welcome mj</p><h2>Yay, muffins!</h2><button>logout</button></div>"`
      );
    });
  });

  describe("with a hash param and no pathname", () => {
    function Bakery() {
      let navigate = useNavigate();
      function handleClick() {
        navigate({
          hash: "#about"
        });
      }

      return (
        <div>
          <h1>Bakery</h1>
          <button onClick={handleClick}>About us</button>
          <Outlet />
          <h2 id="about">About us</h2>
          <p>We bake delicious cakes!</p>
        </div>
      );
    }

    function Muffins() {
      return <h2>Yay, muffins!</h2>;
    }

    it("resolves using the current location", () => {
      act(() => {
        ReactDOM.render(
          <Router initialEntries={["/bakery/muffins"]}>
            <Routes>
              <Route path="bakery" element={<Bakery />}>
                <Route path="muffins" element={<Muffins />} />
              </Route>
            </Routes>
          </Router>,
          node
        );
      });

      let button = node.querySelector("button");

      act(() => {
        button?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
      });

      expect(node.innerHTML).toMatchInlineSnapshot(
        `"<div><h1>Bakery</h1><button>About us</button><h2>Yay, muffins!</h2><h2 id=\\"about\\">About us</h2><p>We bake delicious cakes!</p></div>"`
      );
    });
  });
});
