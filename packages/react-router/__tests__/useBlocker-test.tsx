import * as React from "react";
import * as TestRenderer from "react-test-renderer";
import {
  useNavigate,
  unstable_useBlocker,
  createMemoryRouter,
  RouterProvider,
} from "react-router";

describe("useBlocker", () => {
  describe("should block navigation", () => {
    it("passing true as argument", () => {
      const ref = React.createRef();
      function Home() {
        const result = unstable_useBlocker(true);
        let navigate = useNavigate();

        // @ts-expect-error
        ref.current = result;

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
      const routes = [
        {
          path: "/home",
          element: <Home />,
        },
        { path: "/about", element: <h1>About</h1> },
      ];

      const router = createMemoryRouter(routes, {
        initialEntries: ["/home"],
        initialIndex: 1,
      });

      let renderer: TestRenderer.ReactTestRenderer;
      TestRenderer.act(() => {
        renderer = TestRenderer.create(<RouterProvider router={router} />);
      });

      // @ts-expect-error
      let button = renderer.root.findByType("button");
      TestRenderer.act(() => button.props.onClick());

      // @ts-expect-error
      expect(renderer.toJSON()).toMatchInlineSnapshot(`
                  <div>
                    <h1>
                      Home
                    </h1>
                    <button
                      onClick={[Function]}
                    >
                      click me
                    </button>
                  </div>
                `);

      expect(ref.current).toMatchObject({
        location: {
          hash: "",
          key: expect.any(String),
          pathname: "/about",
          search: "",
          state: null,
        },
        proceed: expect.any(Function),
        reset: expect.any(Function),
        state: "blocked",
      });
    });

    it("passing a function that returns true", () => {
      const fn = jest.fn().mockReturnValue(true);
      const ref = React.createRef();

      function Home() {
        const result = unstable_useBlocker(fn);
        let navigate = useNavigate();

        // @ts-expect-error
        ref.current = result;

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
      const routes = [
        {
          path: "/home",
          element: <Home />,
        },
        { path: "/about", element: <h1>About</h1> },
      ];

      const router = createMemoryRouter(routes, {
        initialEntries: ["/home"],
        initialIndex: 1,
      });

      let renderer: TestRenderer.ReactTestRenderer;
      TestRenderer.act(() => {
        renderer = TestRenderer.create(<RouterProvider router={router} />);
      });

      // @ts-expect-error
      let button = renderer.root.findByType("button");
      TestRenderer.act(() => button.props.onClick());

      // @ts-expect-error
      expect(renderer.toJSON()).toMatchInlineSnapshot(`
                    <div>
                      <h1>
                        Home
                      </h1>
                      <button
                        onClick={[Function]}
                      >
                        click me
                      </button>
                    </div>
                  `);

      expect(ref.current).toMatchObject({
        location: {
          hash: "",
          key: expect.any(String),
          pathname: "/about",
          search: "",
          state: null,
        },
        proceed: expect.any(Function),
        reset: expect.any(Function),
        state: "blocked",
      });
    });
  });

  describe("should NOT block navigation", () => {
    it("passing false as argument", () => {
      const ref = React.createRef();
      function Home() {
        const result = unstable_useBlocker(false);
        let navigate = useNavigate();

        // @ts-expect-error
        ref.current = result;

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
      const routes = [
        {
          path: "/home",
          element: <Home />,
        },
        { path: "/about", element: <h1>About</h1> },
      ];

      const router = createMemoryRouter(routes, {
        initialEntries: ["/home"],
        initialIndex: 1,
      });

      let renderer: TestRenderer.ReactTestRenderer;
      TestRenderer.act(() => {
        renderer = TestRenderer.create(<RouterProvider router={router} />);
      });

      // @ts-expect-error
      let button = renderer.root.findByType("button");
      TestRenderer.act(() => button.props.onClick());

      // @ts-expect-error
      expect(renderer.toJSON()).toMatchInlineSnapshot(`
        <h1>
          About
        </h1>
      `);

      expect(ref.current).toMatchObject({
        location: undefined,
        proceed: undefined,
        reset: undefined,
        state: "unblocked",
      });
    });

    it("passing a function that returns false", () => {
      const fn = jest.fn().mockReturnValue(false);

      const ref = React.createRef();
      function Home() {
        const result = unstable_useBlocker(fn);
        let navigate = useNavigate();

        // @ts-expect-error
        ref.current = result;
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
      const routes = [
        {
          path: "/home",
          element: <Home />,
        },
        { path: "/about", element: <h1>About</h1> },
      ];

      const router = createMemoryRouter(routes, {
        initialEntries: ["/home"],
        initialIndex: 1,
      });

      let renderer: TestRenderer.ReactTestRenderer;
      TestRenderer.act(() => {
        renderer = TestRenderer.create(<RouterProvider router={router} />);
      });

      // @ts-expect-error
      let button = renderer.root.findByType("button");
      TestRenderer.act(() => button.props.onClick());

      // @ts-expect-error
      expect(renderer.toJSON()).toMatchInlineSnapshot(`
   <h1>
     About
   </h1>
 `);

      expect(ref.current).toMatchObject({
        location: undefined,
        proceed: undefined,
        reset: undefined,
        state: "unblocked",
      });
    });
  });

  describe("should stop blocking after change (update)", () => {
    it("should stop blocking after changing state (boolean)", () => {
      const ref = React.createRef();
      function Home() {
        const [state, setState] = React.useState(true);
        const result = unstable_useBlocker(state);
        let navigate = useNavigate();

        // @ts-expect-error
        ref.current = result;

        function enableBlock() {
          setState(false);
        }

        function handleClick() {
          navigate("/about");
        }

        return (
          <div>
            <h1>Home</h1>
            <button onClick={enableBlock}>enableBlock</button>
            <button onClick={handleClick}>click me</button>
          </div>
        );
      }
      const routes = [
        {
          path: "/home",
          element: <Home />,
        },
        { path: "/about", element: <h1>About</h1> },
      ];

      const router = createMemoryRouter(routes, {
        initialEntries: ["/home"],
        initialIndex: 1,
      });

      let renderer: TestRenderer.ReactTestRenderer;
      TestRenderer.act(() => {
        renderer = TestRenderer.create(<RouterProvider router={router} />);
      });

      // @ts-expect-error
      let button = renderer.root.findAllByType("button")[1];
      TestRenderer.act(() => button.props.onClick());

      // @ts-expect-error
      expect(renderer.toJSON()).toMatchInlineSnapshot(`
        <div>
          <h1>
            Home
          </h1>
          <button
            onClick={[Function]}
          >
            enableBlock
          </button>
          <button
            onClick={[Function]}
          >
            click me
          </button>
        </div>
      `);

      expect(ref.current).toMatchObject({
        location: {
          hash: "",
          key: expect.any(String),
          pathname: "/about",
          search: "",
          state: null,
        },
        proceed: expect.any(Function),
        reset: expect.any(Function),
        state: "blocked",
      });

      // update blocker to stop blocking
      // @ts-expect-error
      let updater = renderer.root.findAllByType("button")[0];
      TestRenderer.act(() => updater.props.onClick());

      // @ts-expect-error
      button = renderer.root.findAllByType("button")[1];
      TestRenderer.act(() => button.props.onClick());

      // @ts-expect-error
      expect(renderer.toJSON()).toMatchInlineSnapshot(`
        <h1>
          About
        </h1>
      `);
    });

    it("should stop blocking after changing state (function)", () => {
      const ref = React.createRef();
      function Home() {
        const [state, setState] = React.useState(true);
        const result = unstable_useBlocker(() => state);
        let navigate = useNavigate();

        // @ts-expect-error
        ref.current = result;

        function enableBlock() {
          setState(false);
        }

        function handleClick() {
          navigate("/about");
        }

        return (
          <div>
            <h1>Home</h1>
            <button onClick={enableBlock}>enableBlock</button>
            <button onClick={handleClick}>click me</button>
          </div>
        );
      }
      const routes = [
        {
          path: "/home",
          element: <Home />,
        },
        { path: "/about", element: <h1>About</h1> },
      ];

      const router = createMemoryRouter(routes, {
        initialEntries: ["/home"],
        initialIndex: 1,
      });

      let renderer: TestRenderer.ReactTestRenderer;
      TestRenderer.act(() => {
        renderer = TestRenderer.create(<RouterProvider router={router} />);
      });

      // @ts-expect-error
      let button = renderer.root.findAllByType("button")[1];
      TestRenderer.act(() => button.props.onClick());

      expect(ref.current).toMatchObject({
        location: {
          hash: "",
          key: expect.any(String),
          pathname: "/about",
          search: "",
          state: null,
        },
        proceed: expect.any(Function),
        reset: expect.any(Function),
        state: "blocked",
      });

      // update blocker to stop blocking
      // @ts-expect-error
      let updater = renderer.root.findAllByType("button")[0];
      TestRenderer.act(() => updater.props.onClick());

      // @ts-expect-error
      button = renderer.root.findAllByType("button")[1];
      TestRenderer.act(() => button.props.onClick());

      // @ts-expect-error
      expect(renderer.toJSON()).toMatchInlineSnapshot(`
          <h1>
            About
          </h1>
        `);
    });
  });
});
