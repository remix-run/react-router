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

  describe("with hash", () => {
    function Home() {
      let navigate = useNavigate();

      function handleClick() {
        navigate("/about");
      }

      return (
        <div>
          <h1>Home</h1>
          <p>location.hash: {useLocation().hash}</p>
          <button onClick={handleClick}>click me</button>
        </div>
      );
    }

    function ShowLocationHash() {
      return <p>location.hash: {useLocation().hash}</p>;
    }

    let renderer: TestRenderer.ReactTestRenderer;

    it("transitions to new location without the hash", () => {
      TestRenderer.act(() => {
        renderer = TestRenderer.create(
          <MemoryRouter initialEntries={["/home#test"]}>
            <Routes>
              <Route path="home" element={<Home />} />
              <Route path="about" element={<ShowLocationHash />} />
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
          location.hash: 
          
        </p>
      `);
    });

    describe("updates the current location search and preserves the hash", () => {
      function StringSearch({ object = false }) {
        let navigate = useNavigate();
        let location = useLocation();

        function handleClick() {
          const search = "?query=search";
          navigate(object ? { search } : search);
        }

        return (
          <div>
            <h1>Home</h1>
            <p>location.search: {location.search}</p>
            <p>location.hash: {location.hash}</p>
            <button onClick={handleClick}>click me</button>
          </div>
        );
      }

      it("behaves correctly when path is a string", () => {
        TestRenderer.act(() => {
          renderer = TestRenderer.create(
            <MemoryRouter initialEntries={["/home#test"]}>
              <Routes>
                <Route path="home" element={<StringSearch />} />
              </Routes>
            </MemoryRouter>
          );
        });

        expect(renderer.toJSON()).toMatchInlineSnapshot(`
          <div>
            <h1>
              Home
            </h1>
            <p>
              location.search: 
              
            </p>
            <p>
              location.hash: 
              #test
            </p>
            <button
              onClick={[Function]}
            >
              click me
            </button>
          </div>
        `);

        let button = renderer.root.findByType("button");

        TestRenderer.act(() => {
          button.props.onClick();
        });

        expect(renderer.toJSON()).toMatchInlineSnapshot(`
          <div>
            <h1>
              Home
            </h1>
            <p>
              location.search: 
              ?query=search
            </p>
            <p>
              location.hash: 
              #test
            </p>
            <button
              onClick={[Function]}
            >
              click me
            </button>
          </div>
        `);
      });

      it("behaves correctly when path is an object", () => {
        TestRenderer.act(() => {
          renderer = TestRenderer.create(
            <MemoryRouter initialEntries={["/home#test"]}>
              <Routes>
                <Route path="home" element={<StringSearch object={true} />} />
              </Routes>
            </MemoryRouter>
          );
        });

        expect(renderer.toJSON()).toMatchInlineSnapshot(`
          <div>
            <h1>
              Home
            </h1>
            <p>
              location.search: 
              
            </p>
            <p>
              location.hash: 
              #test
            </p>
            <button
              onClick={[Function]}
            >
              click me
            </button>
          </div>
        `);

        let button = renderer.root.findByType("button");

        TestRenderer.act(() => {
          button.props.onClick();
        });

        expect(renderer.toJSON()).toMatchInlineSnapshot(`
          <div>
            <h1>
              Home
            </h1>
            <p>
              location.search: 
              ?query=search
            </p>
            <p>
              location.hash: 
              #test
            </p>
            <button
              onClick={[Function]}
            >
              click me
            </button>
          </div>
        `);
      });
    });
  });
});
