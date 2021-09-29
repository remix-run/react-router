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

  describe("with an absolute `to` value", () => {
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

  describe("with a relative `to` value", () => {
    describe("with a search value", () => {
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

    describe("with a search value and no pathname", () => {
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

      it("navigates relative to the current location's pathname", () => {
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

    describe("with a hash value and no pathname", () => {
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

      it("navigates relative to the current location's pathname", () => {
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

    describe("with a pathname", () => {
      it("navigates relative to the route's pathname", () => {
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

    describe("with a pathname, called from a parent route", () => {
      it("navigates relative to the route's pathname", () => {
        function Layout() {
          let navigate = useNavigate();
          function handleClick() {
            navigate("about");
          }
          return (
            <>
              <h1>Title</h1>
              <button onClick={handleClick}>About</button>
              <Outlet />
            </>
          );
        }

        function Home() {
          return <h2>Home</h2>;
        }

        function About() {
          return <h2>About</h2>;
        }

        act(() => {
          ReactDOM.render(
            <Router initialEntries={["/app/home"]}>
              <Routes>
                <Route path="app" element={<Layout />}>
                  <Route path="home" element={<Home />} />
                  <Route path="about" element={<About />} />
                </Route>
              </Routes>
            </Router>,
            node
          );
        });

        expect(node.innerHTML).toMatchInlineSnapshot(
          `"<h1>Title</h1><button>About</button><h2>Home</h2>"`
        );

        let button = node.querySelector("button");
        expect(button).not.toBeNull();

        act(() => {
          button?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
        });

        expect(node.innerHTML).toMatchInlineSnapshot(
          `"<h1>Title</h1><button>About</button><h2>About</h2>"`
        );
      });
    });

    describe("with a pathname, called from a nested route", () => {
      it("navigates relative to the route's pathname", () => {
        function Layout() {
          return (
            <>
              <h1>Title</h1>
              <Outlet />
            </>
          );
        }

        function Home() {
          let navigate = useNavigate();
          function handleClick() {
            navigate("../about");
          }
          return (
            <>
              <h2>Home</h2>
              <button onClick={handleClick}>About</button>
            </>
          );
        }

        function About() {
          return <h2>About</h2>;
        }

        act(() => {
          ReactDOM.render(
            <Router initialEntries={["/app/home"]}>
              <Routes>
                <Route path="app" element={<Layout />}>
                  <Route path="home" element={<Home />} />
                  <Route path="about" element={<About />} />
                </Route>
              </Routes>
            </Router>,
            node
          );
        });

        expect(node.innerHTML).toMatchInlineSnapshot(
          `"<h1>Title</h1><h2>Home</h2><button>About</button>"`
        );

        let button = node.querySelector("button");
        expect(button).not.toBeNull();

        act(() => {
          button?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
        });

        expect(node.innerHTML).toMatchInlineSnapshot(
          `"<h1>Title</h1><h2>About</h2>"`
        );
      });
    });

    describe("when the pathname is '.'", () => {
      it("navigates relative to the route's pathname", () => {
        function Layout() {
          return (
            <>
              <h1>Title</h1>
              <Outlet />
            </>
          );
        }

        function Home() {
          let navigate = useNavigate();
          function handleClick() {
            navigate("./#about");
          }
          return (
            <div>
              <button onClick={handleClick}>About</button>
              <h2 id="#about">About</h2>
            </div>
          );
        }

        function About() {
          return <h2>About</h2>;
        }

        act(() => {
          ReactDOM.render(
            <Router initialEntries={["/home"]}>
              <Routes>
                <Route element={<Layout />}>
                  <Route path="home" element={<Home />} />
                  <Route path="about" element={<About />} />
                </Route>
              </Routes>
            </Router>,
            node
          );
        });

        expect(node.innerHTML).toMatchInlineSnapshot(
          `"<h1>Title</h1><div><button>About</button><h2 id=\\"#about\\">About</h2></div>"`
        );

        let button = node.querySelector("button");
        expect(button).not.toBeNull();

        act(() => {
          button?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
        });

        expect(node.innerHTML).toMatchInlineSnapshot(
          `"<h1>Title</h1><div><button>About</button><h2 id=\\"#about\\">About</h2></div>"`
        );
      });
    });
  });
});
