import * as React from "react";
import * as TestRenderer from "react-test-renderer";
import {
  DataMemoryRouter as MemoryRouter,
  Route,
  useLoaderData,
} from "../index";
import { Outlet } from "../lib/components";

describe("<DataMemoryRouter>", () => {
  let consoleWarn: jest.SpyInstance;
  let consoleError: jest.SpyInstance;
  beforeEach(() => {
    consoleWarn = jest.spyOn(console, "warn").mockImplementation(() => {});
    consoleError = jest.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    consoleWarn.mockRestore();
    consoleError.mockRestore();
  });

  it("renders the first route that matches the URL", () => {
    let renderer: TestRenderer.ReactTestRenderer;
    TestRenderer.act(() => {
      renderer = TestRenderer.create(
        <MemoryRouter initialEntries={["/"]}>
          <Route path="/" element={<h1>Home</h1>} />
        </MemoryRouter>
      );
    });

    expect(renderer.toJSON()).toMatchInlineSnapshot(`
      <h1>
        Home
      </h1>
    `);
  });

  it("renders with hydration data", () => {
    let renderer: TestRenderer.ReactTestRenderer;

    TestRenderer.act(() => {
      renderer = TestRenderer.create(
        <MemoryRouter
          initialEntries={["/child"]}
          hydrationData={{
            loaderData: {
              "/": "parent data",
              "/child": "child data",
            },
          }}
        >
          <Route path="/" element={<Comp />}>
            <Route path="child" element={<Comp />} />
          </Route>
        </MemoryRouter>
      );
    });

    function Comp() {
      let data = useLoaderData();
      return (
        <div>
          {data}
          <Outlet />
        </div>
      );
    }

    expect(renderer.toJSON()).toMatchInlineSnapshot(`
      <div>
        parent data
        <div>
          child data
        </div>
      </div>
    `);
  });
});
