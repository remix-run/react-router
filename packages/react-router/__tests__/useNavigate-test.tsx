import * as React from "react";
import * as TestRenderer from "react-test-renderer";
import {
  MemoryRouter,
  Routes,
  Route,
  useNavigate,
  useLocation,
} from "react-router";

describe("useNavigate", () => {
  it("navigates to the new location", () => {
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

    let renderer: TestRenderer.ReactTestRenderer;
    TestRenderer.act(() => {
      renderer = TestRenderer.create(
        <MemoryRouter initialEntries={["/home"]}>
          <Routes>
            <Route path="home" element={<Home />} />
            <Route path="about" element={<h1>About</h1>} />
          </Routes>
        </MemoryRouter>
      );
    });

    let button = renderer.root.findByType("button");

    TestRenderer.act(() => {
      button.props.onClick();
    });

    expect(renderer.toJSON()).toMatchInlineSnapshot(`
      <h1>
        About
      </h1>
    `);
  });

  it("navigates to the new location when no pathname is provided", () => {
    function Home() {
      let location = useLocation();
      let navigate = useNavigate();

      return (
        <>
          <p>{location.pathname + location.search}</p>
          <button onClick={() => navigate("?key=value")}>click me</button>
        </>
      );
    }

    let renderer: TestRenderer.ReactTestRenderer;
    TestRenderer.act(() => {
      renderer = TestRenderer.create(
        <MemoryRouter initialEntries={["/home"]}>
          <Routes>
            <Route path="home" element={<Home />} />
          </Routes>
        </MemoryRouter>
      );
    });

    expect(renderer.toJSON()).toMatchInlineSnapshot(`
      [
        <p>
          /home
        </p>,
        <button
          onClick={[Function]}
        >
          click me
        </button>,
      ]
    `);

    let button = renderer.root.findByType("button");

    TestRenderer.act(() => {
      button.props.onClick();
    });

    expect(renderer.toJSON()).toMatchInlineSnapshot(`
      [
        <p>
          /home?key=value
        </p>,
        <button
          onClick={[Function]}
        >
          click me
        </button>,
      ]
    `);
  });

  it("navigates to the new location when no pathname is provided (with a basename)", () => {
    function Home() {
      let location = useLocation();
      let navigate = useNavigate();

      return (
        <>
          <p>{location.pathname + location.search}</p>
          <button onClick={() => navigate("?key=value")}>click me</button>
        </>
      );
    }

    let renderer: TestRenderer.ReactTestRenderer;
    TestRenderer.act(() => {
      renderer = TestRenderer.create(
        <MemoryRouter basename="/basename" initialEntries={["/basename/home"]}>
          <Routes>
            <Route path="home" element={<Home />} />
          </Routes>
        </MemoryRouter>
      );
    });

    expect(renderer.toJSON()).toMatchInlineSnapshot(`
      [
        <p>
          /home
        </p>,
        <button
          onClick={[Function]}
        >
          click me
        </button>,
      ]
    `);

    let button = renderer.root.findByType("button");

    TestRenderer.act(() => {
      button.props.onClick();
    });

    expect(renderer.toJSON()).toMatchInlineSnapshot(`
      [
        <p>
          /home?key=value
        </p>,
        <button
          onClick={[Function]}
        >
          click me
        </button>,
      ]
    `);
  });

  describe("with state", () => {
    it("adds the state to location.state", () => {
      function Home() {
        let navigate = useNavigate();

        function handleClick() {
          navigate("/about", { state: { from: "home" } });
        }

        return (
          <div>
            <h1>Home</h1>
            <button onClick={handleClick}>click me</button>
          </div>
        );
      }

      function ShowLocationState() {
        return <p>location.state:{JSON.stringify(useLocation().state)}</p>;
      }

      let renderer: TestRenderer.ReactTestRenderer;
      TestRenderer.act(() => {
        renderer = TestRenderer.create(
          <MemoryRouter initialEntries={["/home"]}>
            <Routes>
              <Route path="home" element={<Home />} />
              <Route path="about" element={<ShowLocationState />} />
            </Routes>
          </MemoryRouter>
        );
      });

      let button = renderer.root.findByType("button");

      TestRenderer.act(() => {
        button.props.onClick();
      });

      expect(renderer.toJSON()).toMatchInlineSnapshot(`
        <p>
          location.state:
          {"from":"home"}
        </p>
      `);
    });
  });
});
