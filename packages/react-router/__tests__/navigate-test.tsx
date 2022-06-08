import * as React from "react";
import * as TestRenderer from "react-test-renderer";
import { MemoryRouter, Navigate, Routes, Route } from "react-router";
import { Outlet } from "../lib/components";

describe("<Navigate>", () => {
  describe("with an absolute href", () => {
    it("navigates to the correct URL", () => {
      let renderer: TestRenderer.ReactTestRenderer;
      TestRenderer.act(() => {
        renderer = TestRenderer.create(
          <MemoryRouter initialEntries={["/home"]}>
            <Routes>
              <Route path="home" element={<Navigate to="/about" />} />
              <Route path="about" element={<h1>About</h1>} />
            </Routes>
          </MemoryRouter>
        );
      });

      expect(renderer.toJSON()).toMatchInlineSnapshot(`
        <h1>
          About
        </h1>
      `);
    });
  });

  describe("with a relative href", () => {
    it("navigates to the correct URL", () => {
      let renderer: TestRenderer.ReactTestRenderer;
      TestRenderer.act(() => {
        renderer = TestRenderer.create(
          <MemoryRouter initialEntries={["/home"]}>
            <Routes>
              <Route path="home" element={<Navigate to="../about" />} />
              <Route path="about" element={<h1>About</h1>} />
            </Routes>
          </MemoryRouter>
        );
      });

      expect(renderer.toJSON()).toMatchInlineSnapshot(`
        <h1>
          About
        </h1>
      `);
    });

    it("skips a level from an index route", () => {
      let renderer: TestRenderer.ReactTestRenderer;
      TestRenderer.act(() => {
        renderer = TestRenderer.create(
          <MemoryRouter initialEntries={["/home"]}>
            <Routes>
              <Route path="home">
                <Route index element={<Navigate to="../about" />} />
              </Route>
              <Route path="about" element={<h1>About</h1>} />
            </Routes>
          </MemoryRouter>
        );
      });

      expect(renderer.toJSON()).toMatchInlineSnapshot(`
        <h1>
          About
        </h1>
      `);
    });

    it("skips a level from a layout route", () => {
      let renderer: TestRenderer.ReactTestRenderer;
      TestRenderer.act(() => {
        renderer = TestRenderer.create(
          <MemoryRouter initialEntries={["/home"]}>
            <Routes>
              <Route element={<Outlet />}>
                <Route path="home" element={<Navigate to="../about" />} />
              </Route>
              <Route path="about" element={<h1>About</h1>} />
            </Routes>
          </MemoryRouter>
        );
      });

      expect(renderer.toJSON()).toMatchInlineSnapshot(`
        <h1>
          About
        </h1>
      `);
    });
  });
});
