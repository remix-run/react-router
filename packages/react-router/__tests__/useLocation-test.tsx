import * as React from "react";
import * as TestRenderer from "react-test-renderer";
import {
  MemoryRouter,
  Routes,
  Route,
  useLocation,
  createScopedMemoryRouterEnvironment,
} from "react-router";

const {
  MemoryRouter: NestableMemoryRouter,
  Routes: NestedRoutes,
  Route: NestedRoute,
  useLocation: useNestedLocation,
} = createScopedMemoryRouterEnvironment();

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
        </MemoryRouter>
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
        </MemoryRouter>
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
        </MemoryRouter>
      );
    });

    expect(renderer.toJSON()).toMatchInlineSnapshot(`
      <pre>
        {"pathname":"/example","search":"","hash":"","state":{"my":"state"},"key":"my-key"}
      </pre>
    `);
  });

  it("returns the current location object of NestedMemoryRouter", () => {
    function ShowNestedPath() {
      let { pathname, search, hash } = useNestedLocation();
      return <pre>{JSON.stringify({ pathname, search, hash })}</pre>;
    }

    function NestedMemoryRouter() {
      return (
        <NestableMemoryRouter
          initialEntries={["/nested?the=nested-search#the-nested-hash"]}
        >
          <NestedRoutes>
            <NestedRoute path="/nested" element={<ShowNestedPath />} />
          </NestedRoutes>
        </NestableMemoryRouter>
      );
    }

    let renderer: TestRenderer.ReactTestRenderer;
    TestRenderer.act(() => {
      renderer = TestRenderer.create(
        <MemoryRouter initialEntries={["/home?the=search#the-hash"]}>
          <Routes>
            <Route path="/home" element={<NestedMemoryRouter />} />
          </Routes>
        </MemoryRouter>
      );
    });

    expect(renderer.toJSON()).toMatchInlineSnapshot(`
      <pre>
        {"pathname":"/nested","search":"?the=nested-search","hash":"#the-nested-hash"}
      </pre>
    `);
  });
});
