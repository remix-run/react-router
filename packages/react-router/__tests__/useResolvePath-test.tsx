import * as React from "react";
import * as TestRenderer from "react-test-renderer";
import type { Path } from "react-router";
import { MemoryRouter, Routes, Route, useResolvePath } from "react-router";

function ShowResolvedPath({ path }: { path: string | Path }) {
  const resolvePath = useResolvePath();
  return <pre>{JSON.stringify(resolvePath(path))}</pre>;
}

describe("useResolvePath", () => {
  it("path string resolves correctly", () => {
    let renderer: TestRenderer.ReactTestRenderer;
    TestRenderer.act(() => {
      renderer = TestRenderer.create(
        <MemoryRouter initialEntries={["/"]}>
          <Routes>
            <Route
              path="/"
              element={<ShowResolvedPath path="/home?user=mj#welcome" />}
            />
          </Routes>
        </MemoryRouter>
      );
    });

    expect(renderer.toJSON()).toMatchInlineSnapshot(`
      <pre>
        {"pathname":"/home","search":"?user=mj","hash":"#welcome"}
      </pre>
    `);
  });
});
