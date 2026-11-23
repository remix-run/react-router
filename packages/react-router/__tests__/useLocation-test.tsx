import * as React from "react";
import * as TestRenderer from "react-test-renderer";
import {
  BrowserRouter,
  HashRouter,
  MemoryRouter,
  Routes,
  Route,
  useLocation,
  useNavigate,
} from "react-router";
import getWindow from "./utils/getWindow";

function ShowLocation() {
  let location = useLocation();
  return <pre>{JSON.stringify(location)}</pre>;
}

describe("useLocation", () => {
  it("returns the current location object", () => {
    let renderer: TestRenderer.ReactTestRenderer;
    TestRenderer.act(() => {
      renderer = TestRenderer.create(
        <MemoryRouter initialEntries={["/home?the=search#the-hash"]}>
          <Routes>
            <Route path="/home" element={<ShowLocation />} />
          </Routes>
        </MemoryRouter>,
      );
    });

    expect(renderer.toJSON()).toMatchInlineSnapshot(`
      <pre>
        {"pathname":"/home","search":"?the=search","hash":"#the-hash","state":null,"key":"default"}
      </pre>
    `);
  });

  it("returns the scoped location object when nested in <Routes location>", () => {
    let renderer: TestRenderer.ReactTestRenderer;
    TestRenderer.act(() => {
      renderer = TestRenderer.create(
        <MemoryRouter initialEntries={["/home?the=search#the-hash"]}>
          <App />
        </MemoryRouter>,
      );
    });

    function App() {
      return (
        <div>
          <Routes>
            <Route path="/home" element={<ShowLocation />} />
          </Routes>
          <Routes location="/scoped?scoped=search#scoped-hash">
            <Route path="/scoped" element={<ShowLocation />} />
          </Routes>
        </div>
      );
    }

    expect(renderer.toJSON()).toMatchInlineSnapshot(`
      <div>
        <pre>
          {"pathname":"/home","search":"?the=search","hash":"#the-hash","state":null,"key":"default"}
        </pre>
        <pre>
          {"pathname":"/scoped","search":"?scoped=search","hash":"#scoped-hash","state":null,"key":"default"}
        </pre>
      </div>
    `);
  });

  it("preserves state from initialEntries", () => {
    let renderer: TestRenderer.ReactTestRenderer;
    TestRenderer.act(() => {
      renderer = TestRenderer.create(
        <MemoryRouter
          initialEntries={[
            { pathname: "/example", state: { my: "state" }, key: "my-key" },
          ]}
        >
          <Routes>
            <Route path={"/example"} element={<ShowLocation />} />
          </Routes>
        </MemoryRouter>,
      );
    });

    expect(renderer.toJSON()).toMatchInlineSnapshot(`
      <pre>
        {"pathname":"/example","search":"","hash":"","state":{"my":"state"},"key":"my-key"}
      </pre>
    `);
  });

  it.each([
    ["BrowserRouter", BrowserRouter, false],
    ["HashRouter", HashRouter, true],
  ] as const)(
    "preserves falsy state passed via useNavigate in %s",
    async (_name, RouterComponent, isHash) => {
      let navigate!: ReturnType<typeof useNavigate>;
      let currentLocation!: ReturnType<typeof useLocation>;

      function Capture() {
        navigate = useNavigate();
        currentLocation = useLocation();
        return null;
      }

      TestRenderer.act(() => {
        TestRenderer.create(
          <RouterComponent window={getWindow("/", isHash)}>
            <Routes>
              <Route path="/" element={<Capture />} />
              <Route path="/sub" element={<Capture />} />
            </Routes>
          </RouterComponent>,
        );
      });

      for (let state of [0, false, ""]) {
        let doNavigate = navigate;
        await TestRenderer.act(async () => {
          doNavigate("/sub", { state });
        });
        expect(currentLocation.pathname).toBe("/sub");
        expect(currentLocation.state).toBe(state);
      }
    },
  );
});
