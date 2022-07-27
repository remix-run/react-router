import * as React from "react";
import * as TestRenderer from "react-test-renderer";
import { MemoryRouter, Routes, Route, useLocation } from "react-router";

// Private API
import { createNestableMemoryRouter } from "../lib/components";

function ShowPath() {
  let { pathname, search, hash } = useLocation();
  return <pre>{JSON.stringify({ pathname, search, hash })}</pre>;
}

describe("useLocation", () => {
  it("returns the current location object", () => {
    let renderer: TestRenderer.ReactTestRenderer;
    TestRenderer.act(() => {
      renderer = TestRenderer.create(
        <MemoryRouter initialEntries={["/home?the=search#the-hash"]}>
          <Routes>
            <Route path="/home" element={<ShowPath />} />
          </Routes>
        </MemoryRouter>
      );
    });

    expect(renderer.toJSON()).toMatchInlineSnapshot(`
      <pre>
        {"pathname":"/home","search":"?the=search","hash":"#the-hash"}
      </pre>
    `);
  });

  it("returns the current location object of NestedMemoryRouter", () => {
    const { NestableMemoryRouter, hooks } = createNestableMemoryRouter();

    function ShowNestedPath() {
      let { pathname, search, hash } = hooks.useLocation();
      return <pre>{JSON.stringify({ pathname, search, hash })}</pre>;
    }

    function NestedMemoryRouter() {
      return (
        <NestableMemoryRouter
          initialEntries={["/nested?the=nested-search#the-nested-hash"]}
        >
          <Routes>
            <Route path="/nested" element={<ShowNestedPath />} />
          </Routes>
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
