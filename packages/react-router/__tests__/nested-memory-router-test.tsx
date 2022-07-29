import * as React from "react";
import { render, prettyDOM } from "@testing-library/react";
import "@testing-library/jest-dom";

import {
  Route,
  Routes,
  MemoryRouter,
  createScopedMemoryRouterEnvironment,
  Navigate,
} from "react-router";

// Private API
import { _resetModuleScope } from "../lib/components";

const {
  MemoryRouter: NestableMemoryRouter,
  Routes: NestedRoutes,
  Route: NestedRoute,
  Navigate: NestedNavigate,
} = createScopedMemoryRouterEnvironment();

// eslint-disable-next-line jest/no-focused-tests
describe.only("<NestableMemoryRouter>", () => {
  let consoleWarn: jest.SpyInstance;
  let consoleError: jest.SpyInstance;
  beforeEach(() => {
    consoleWarn = jest.spyOn(console, "warn").mockImplementation(() => {});
    consoleError = jest.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    consoleWarn.mockRestore();
    consoleError.mockRestore();
    _resetModuleScope();
  });

  it("renders the first route that matches the URL", () => {
    let { container } = render(
      <NestableMemoryRouter initialEntries={["/"]}>
        <NestedRoutes>
          <NestedRoute path="/" element={<h1>Home</h1>} />
        </NestedRoutes>
      </NestableMemoryRouter>
    );

    expect(getHtml(container)).toMatchInlineSnapshot(`
      "<div>
        <h1>
          Home
        </h1>
      </div>"
    `);
  });

  it("can navigate with a NestableNavigate", () => {
    function NestedMemoryRouter() {
      return (
        <NestableMemoryRouter initialEntries={["/"]}>
          <NestedRoutes>
            <NestedRoute path="/" element={<Navigate to="/about" />} />
          </NestedRoutes>
        </NestableMemoryRouter>
      );
    }

    let { container } = render(
      <MemoryRouter initialEntries={["/"]}>
        <Routes>
          <Route path="/" element={<NestedMemoryRouter />} />
          <Route path="about" element={<h1>About</h1>} />
        </Routes>
      </MemoryRouter>
    );

    expect(getHtml(container)).toMatchInlineSnapshot(`
      "<div>
        <h1>
          About
        </h1>
      </div>"
    `);
  });

  it("can navigate MemoryRouter from NestableMemoryRouter", () => {
    function NestedMemoryRouter() {
      return (
        <NestableMemoryRouter initialEntries={["/"]}>
          <NestedRoutes>
            <NestedRoute path="/" element={<NestedNavigate to="/about" />} />
            <Route path="about" element={<h1>Nested About</h1>} />
          </NestedRoutes>
        </NestableMemoryRouter>
      );
    }

    let { container } = render(
      <MemoryRouter initialEntries={["/"]}>
        <Routes>
          <Route path="/" element={<NestedMemoryRouter />} />
          <Route path="about" element={<h1>About</h1>} />
        </Routes>
      </MemoryRouter>
    );

    expect(getHtml(container)).toMatchInlineSnapshot(`
      "<div>
        <h1>
          Nested About
        </h1>
      </div>"
    `);
  });
});

function getHtml(container: HTMLElement) {
  return prettyDOM(container, undefined, {
    highlight: false,
  });
}
