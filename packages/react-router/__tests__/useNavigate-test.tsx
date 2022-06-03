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

  it("transitions to the new location when called immediately", () => {
    const Home = React.forwardRef(function Home(_props, ref) {
      let navigate = useNavigate();

      React.useImperativeHandle(ref, () => ({
        navigate: () => navigate("/about")
      }))

      return null
    })
    
    let homeRef;

    let renderer: TestRenderer.ReactTestRenderer;
    renderer = TestRenderer.create(
      <MemoryRouter initialEntries={["/home"]}>
        <Routes>
          <Route path="home" element={<Home ref={(ref) => homeRef = ref} />} />
          <Route path="about" element={<h1>About</h1>} />
        </Routes>
      </MemoryRouter>
    );

    TestRenderer.act(() => {
      homeRef.navigate();
    })
    
    expect(renderer.toJSON()).toMatchInlineSnapshot(`
      <h1>
        About
      </h1>
    `);
  });

  it("allows navigation in child useEffects", () => {
    function Child({ onChildRendered }) {

      React.useEffect(() => {
        onChildRendered();
      });

      return null;
    }

    function Parent() {
      let navigate = useNavigate();

      let onChildRendered = React.useCallback(() => navigate("/about"), []);

      return <Child onChildRendered={onChildRendered} />;
    }

    let renderer: TestRenderer.ReactTestRenderer;
    TestRenderer.act(() => {
      renderer = TestRenderer.create(
        <MemoryRouter initialEntries={["/home"]}>
          <Routes>
            <Route path="home" element={<Parent />} />
            <Route path="about" element={<h1>About</h1>} />
          </Routes>
        </MemoryRouter>
      );
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


});
