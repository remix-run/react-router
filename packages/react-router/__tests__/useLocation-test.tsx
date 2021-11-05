import * as React from "react";
import * as TestRenderer from "react-test-renderer";
import { MemoryRouter, Routes, Route, useLocation } from "react-router";

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
});
