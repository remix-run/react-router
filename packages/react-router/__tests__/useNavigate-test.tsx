import * as React from "react";
import * as TestRenderer from "react-test-renderer";
import {
  MemoryRouter,
  Routes,
  Route,
  useNavigate,
  useLocation
} from "react-router";

describe("useNavigate", () => {
  it("transitions to the new location", () => {
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
        return <p>location.state: {JSON.stringify(useLocation().state)}</p>;
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

  describe("update function", () => {
    it("transitions to the location derived from the current one", () => {
      function Home() {
        let navigate = useNavigate();
        let { search } = useLocation();
        let clickable = !new URLSearchParams(search).get("x");

        let handleClick = React.useCallback(() => {
          navigate(({ search }) => `${search}&x=y`);
        }, [navigate]);

        return (
          <>
            <p>The current search is: {search}</p>
            {clickable && <button onClick={handleClick}>click me</button>}
          </>
        );
      }

      let renderer: TestRenderer.ReactTestRenderer;
      TestRenderer.act(() => {
        renderer = TestRenderer.create(
          <MemoryRouter initialEntries={["/home?a=b"]}>
            <Routes>
              <Route path="home" element={<Home />} />
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
          The current search is: 
          ?a=b&x=y
        </p>
      `);
    });
  });
});
