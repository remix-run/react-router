import * as React from "react";
import * as TestRenderer from "react-test-renderer";
import { MemoryRouter, Routes, Route, useLocation } from "react-router";

describe("useLocation", () => {
  it("returns the current location object", () => {
    function Home() {
      let { pathname, search, hash } = useLocation();
      return <pre>{JSON.stringify({ pathname, search, hash })}</pre>;
    }

    let renderer: TestRenderer.ReactTestRenderer;
    TestRenderer.act(() => {
      renderer = TestRenderer.create(
        <MemoryRouter initialEntries={["/home?the=search#the-hash"]}>
          <Routes>
            <Route path="/home" element={<Home />} />
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
