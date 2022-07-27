import * as React from "react";
import { render, prettyDOM } from "@testing-library/react";
import "@testing-library/jest-dom";

import { Route } from "react-router";

// Private API
import {
  createNestableMemoryRouter,
  _resetModuleScope,
} from "../lib/components";

// eslint-disable-next-line jest/no-focused-tests
describe.only("<MemoryRouter>", () => {
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
    const { NestableMemoryRouter, NestableRoutes } =
      createNestableMemoryRouter();

    let { container } = render(
      <NestableMemoryRouter initialEntries={["/"]}>
        <NestableRoutes>
          <Route path="/" element={<h1>Home</h1>} />
        </NestableRoutes>
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
});

function getHtml(container: HTMLElement) {
  return prettyDOM(container, undefined, {
    highlight: false,
  });
}
