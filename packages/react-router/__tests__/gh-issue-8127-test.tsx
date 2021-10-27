import * as React from "react";
import { act, create as createTestRenderer } from "react-test-renderer";
import { MemoryRouter, Routes, Route } from "react-router-dom";

describe("GH Issue #8127", () => {
  it("works", () => {
    let renderer;
    act(() => {
      renderer = createTestRenderer(
        <MemoryRouter initialEntries={["/availability"]}>
          <Routes>
            <Route
              path="*"
              element={
                <Routes>
                  <Route path="*" element={<h1>sub splat</h1>} />
                  <Route path="availability" element={<h1>availability</h1>} />
                </Routes>
              }
            />
          </Routes>
        </MemoryRouter>
      );
    });

    expect(renderer.toJSON()).toMatchInlineSnapshot(`
      <h1>
        availability
      </h1>
    `);
  });
});
