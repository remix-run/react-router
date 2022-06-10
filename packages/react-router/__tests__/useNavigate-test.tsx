import * as React from "react";
import * as TestRenderer from "react-test-renderer";
import {
  MemoryRouter,
  Routes,
  Route,
  useNavigate,
  useLocation,
} from "react-router";
import { joinPaths } from "../lib/router";

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

  describe("when basename is NOT '/' and 'to' is search query only", () => {
    /**
     * This is simulation of using navigate('?param=ParamValue') when Router basename is NOT '/'.
     */
    const routerBasename = "/foo/bar";
    const to = "?param=ParamValue";
    const defaultPathname = '/';

    function SimulateUseNavigate(props) {
      const {
        basename,
        to,
        pathNameCheck = true, // This is swich between using joinPaths or simple basename
      } = props;
      // joinPaths will always add trailing slash to the basename
      // If pathname is the default ('/'), basename value should decide about trailing slash
      const pathBasename = pathNameCheck ? basename : joinPaths([basename, defaultPathname]);

      return (
        <div>
          {pathBasename + to}
        </div>
      );
    }

    it("should not add trailing slash to the basename", () => {
      let renderer: TestRenderer.ReactTestRenderer;
      TestRenderer.act(() => {
        renderer = TestRenderer.create(
          <SimulateUseNavigate basename={routerBasename} to={to} />
        );
      });

      expect(renderer.toJSON()).toMatchInlineSnapshot(`
        <div>
          ${routerBasename + to}
        </div>
      `);
    });

    it("should add trailing slash to the basename", () => {
      let renderer: TestRenderer.ReactTestRenderer;
      TestRenderer.act(() => {
        renderer = TestRenderer.create(
          <SimulateUseNavigate basename={routerBasename} to={to} pathNameCheck={false} />
        );
      });

      expect(renderer.toJSON()).toMatchInlineSnapshot(`
        <div>
          ${routerBasename + '/' + to}
        </div>
      `);
    });
  });
});
