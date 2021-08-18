import * as React from "react";
import * as ReactDOM from "react-dom";
import { act } from "react-dom/test-utils";
import { TransitionGroup, CSSTransition } from "react-transition-group";
import { create as createTestRenderer } from "react-test-renderer";
import {
  AnimatedRoutes,
  MemoryRouter as Router,
  Route,
  NavLink,
  useLocation
} from "react-router-dom";

jest.mock("react-transition-group", () => {
  const FakeTransition = jest.fn(({ children }) => children);
  const FakeCSSTransition = jest.fn(props =>
    props.in ? <FakeTransition>{props.children}</FakeTransition> : null
  );
  return { CSSTransition: FakeCSSTransition, Transition: FakeTransition };
});

describe("An <AnimatedRoutes>", () => {
  let node: HTMLDivElement;
  beforeEach(() => {
    node = document.createElement("div");
    document.body.appendChild(node);
  });

  afterEach(() => {
    jest.useRealTimers();
    document.body.removeChild(node);
    node = null!;
  });

  it("renders the first route that matches the URL", () => {
    function Home() {
      return <h1>Home</h1>;
    }

    function Dashboard() {
      return <h1>Dashboard</h1>;
    }

    let renderer = createTestRenderer(
      <Router initialEntries={["/"]}>
        <AnimatedRoutes>
          <Route path="/" element={<Home />} />
          <Route path="/dashboard" element={<Dashboard />} />
        </AnimatedRoutes>
      </Router>
    );

    let json = renderer.toJSON();
    if (!json || Array.isArray(json)) {
      throw Error("Unexpected JSON from `createTestRenderer`");
    }
    expect(json).toMatchSnapshot();
    expect(json.children?.includes("Home")).toBe(true);
    expect(json.children?.includes("Dashboard")).toBe(false);
  });

  it("works with react-transition-group", () => {
    jest.useFakeTimers();
    let TIMEOUT = 300;

    function Home() {
      return (
        <h1>
          <div>Home</div>
          <nav>
            <NavLink to="/dashboard">Dashboard</NavLink>
          </nav>
        </h1>
      );
    }

    function Dashboard() {
      return (
        <h1>
          <div>Dashboard</div>
          <nav>
            <NavLink to="/">Home</NavLink>
          </nav>
        </h1>
      );
    }

    function App() {
      let location = useLocation();
      return (
        <div>
          <TransitionGroup>
            <h1>Ok</h1>
            <CSSTransition
              key={location.key}
              classNames="fade"
              timeout={TIMEOUT}
            >
              <AnimatedRoutes>
                <Route path="/" element={<Home />} />
                <Route path="/dashboard" element={<Dashboard />} />
              </AnimatedRoutes>
            </CSSTransition>
          </TransitionGroup>
        </div>
      );
    }

    act(() => {
      ReactDOM.render(
        <Router initialEntries={["/"]}>
          <App />
        </Router>,
        node
      );
    });

    let link = node.querySelector("a")!;
    expect(link.innerText).toBe("Dashboard");

    act(() => {
      link.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });

    jest.advanceTimersByTime(TIMEOUT);

    link = node.querySelector("a")!;
    expect(link.innerText).toBe("Home");
  });

  // TODO: React Spring tests
});
