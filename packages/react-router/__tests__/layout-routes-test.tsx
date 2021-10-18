import * as React from "react";
import { create as createTestRenderer } from "react-test-renderer";
import { MemoryRouter, Routes, Route, Outlet } from "react-router";

describe("A layout route", () => {
  it("does not match when none of its children do", () => {
    let renderer = createTestRenderer(
      <MemoryRouter initialEntries={["/"]}>
        <Routes>
          <Route
            element={
              <div>
                <h1>Layout</h1>
                <Outlet />
              </div>
            }
          >
            <Route path="/home" element={<h1>Home</h1>} />
          </Route>
          <Route index element={<h1>Index</h1>} />
        </Routes>
      </MemoryRouter>
    );

    expect(renderer.toJSON()).toMatchInlineSnapshot(`
      <h1>
        Index
      </h1>
    `);
  });
});
