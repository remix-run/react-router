import * as React from "react";
import * as TestRenderer from "react-test-renderer";
import { MemoryRouter, Routes, Route, useOutlet } from "react-router";

describe("useOutlet", () => {
  describe("when there is no child route", () => {
    it("returns null", () => {
      function Home() {
        return useOutlet();
      }

      let renderer: TestRenderer.ReactTestRenderer;
      TestRenderer.act(() => {
        renderer = TestRenderer.create(
          <MemoryRouter initialEntries={["/home"]}>
            <Routes>
              <Route path="/home" element={<Home />} />
            </Routes>
          </MemoryRouter>
        );
      });

      expect(renderer.toJSON()).toBeNull();
    });
  });

  describe("when there is a child route", () => {
    it("returns an element", () => {
      function Users() {
        return useOutlet();
      }

      let renderer: TestRenderer.ReactTestRenderer;
      TestRenderer.act(() => {
        renderer = TestRenderer.create(
          <MemoryRouter initialEntries={["/users/profile"]}>
            <Routes>
              <Route path="users" element={<Users />}>
                <Route path="profile" element={<h1>Profile</h1>} />
              </Route>
            </Routes>
          </MemoryRouter>
        );
      });

      expect(renderer.toJSON()).toMatchInlineSnapshot(`
        <h1>
          Profile
        </h1>
      `);
    });
  });
});
