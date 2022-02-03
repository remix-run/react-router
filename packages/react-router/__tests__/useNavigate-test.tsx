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

  it("produce same navigation results with double-slashed paths with and without basename in Router", () => {
    function changeRoute(el: React.ReactElement) {
      let renderer: TestRenderer.ReactTestRenderer;
      TestRenderer.act(() => {
        renderer = TestRenderer.create(el);
      });

      let button = renderer.root.findByType("button");

      TestRenderer.act(() => {
        button.props.onClick();
      });

      return renderer.toJSON();
    }

    function Home() {
      let navigate = useNavigate();

      function handleClick() {
        navigate("/about//test/");
      }

      return (
        <div>
          <h1>Home</h1>
          <button onClick={handleClick}>click me</button>
        </div>
      );
    }

    const Common = (
      <Routes>
        <Route path="home" element={<Home />} />
        <Route path="about//test/" element={<h1>Double</h1>} />
        <Route path="about/test/" element={<h1>Single</h1>} />
      </Routes>
    );

    const withoutBasename = changeRoute(
      <MemoryRouter initialEntries={["/home"]}>{Common}</MemoryRouter>
    );

    const withBasename = changeRoute(
      <MemoryRouter basename="/hosted" initialEntries={["/hosted/home"]}>
        {Common}
      </MemoryRouter>
    );

    expect(withoutBasename).toEqual(withBasename);
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
});
