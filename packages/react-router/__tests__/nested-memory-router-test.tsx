import * as React from "react";
import { render, prettyDOM } from "@testing-library/react";
import "@testing-library/jest-dom";

import {
  Route,
  Routes,
  createNestableMemoryRouter,
  useNavigate,
  Navigate,
} from "react-router";

// Private API
import { MemoryRouter, _resetModuleScope } from "../lib/components";

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
    const { NestableMemoryRouter } = createNestableMemoryRouter();

    let { container } = render(
      <NestableMemoryRouter initialEntries={["/"]}>
        <Routes>
          <Route path="/" element={<h1>Home</h1>} />
        </Routes>
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
    const { NestableMemoryRouter } = createNestableMemoryRouter();

    function NestedMemoryRouter() {
      return (
        <NestableMemoryRouter initialEntries={["/"]}>
          <Routes>
            <Route path="/" element={<Navigate to="/about" />} />
          </Routes>
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
    const { NestableMemoryRouter, NestableNavigate } =
      createNestableMemoryRouter();

    function NestedMemoryRouter() {
      return (
        <NestableMemoryRouter initialEntries={["/"]}>
          <Routes>
            <Route path="/" element={<NestableNavigate to="/about" />} />
            <Route path="about" element={<h1>Nested About</h1>} />
          </Routes>
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
