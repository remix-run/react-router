import * as React from "react";
import { create as createTestRenderer } from "react-test-renderer";
import { matchRoutes, MemoryRouter, Routes, Route, Outlet } from "react-router";

describe("index route matching", () => {
  it("throws when the index route has children", () => {
    expect(() => {
      matchRoutes(
        [
          {
            path: "/users",
            children: [
              {
                index: true,
                // This config is not valid because index routes cannot have children
                children: [{ path: "not-valid" }]
              },
              { path: ":id" }
            ]
          }
        ],
        "/users/mj"
      );
    }).toThrow("must not have child routes");
  });

  it("matches path on index route", () => {
    let renderer = createTestRenderer(
      <MemoryRouter initialEntries={["/users"]}>
        <Routes>
          <Route index path="users" element={<h1>Users</h1>} />
        </Routes>
      </MemoryRouter>
    );

    expect(renderer.toJSON()).toMatchInlineSnapshot(`
      <h1>
        Users
      </h1>
    `);
  });

  it("throws when the index route with path has children", () => {
    expect(() => {
      matchRoutes(
        [
          {
            path: "/users",
            index: true,
            children: [
              // This config is not valid because index routes cannot have children
              { path: ":id" }
            ]
          }
        ],
        "/users/mj"
      );
    }).toThrow("must not have child routes");
  });
});
