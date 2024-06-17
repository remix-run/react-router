import * as React from "react";
import * as TestRenderer from "react-test-renderer";
import { MemoryRouter, Routes, Route } from "react-router";

describe("A <Route>", () => {
  it("renders its `element` prop", () => {
    let renderer: TestRenderer.ReactTestRenderer;
    TestRenderer.act(() => {
      renderer = TestRenderer.create(
        <MemoryRouter initialEntries={["/home"]}>
          <Routes>
            <Route path="home" element={<h1>Home</h1>} />
          </Routes>
        </MemoryRouter>
      );
    });

    expect(renderer.toJSON()).toMatchInlineSnapshot(`
      <h1>
        Home
      </h1>
    `);
  });

  it("renders its `Component` prop", () => {
    let renderer: TestRenderer.ReactTestRenderer;
    TestRenderer.act(() => {
      renderer = TestRenderer.create(
        <MemoryRouter initialEntries={["/home"]}>
          <Routes>
            <Route path="home" Component={() => <h1>Home</h1>} />
          </Routes>
        </MemoryRouter>
      );
    });

    expect(renderer.toJSON()).toMatchInlineSnapshot(`
      <h1>
        Home
      </h1>
    `);
  });

  it("renders its child routes when no `element` prop is given", () => {
    let renderer: TestRenderer.ReactTestRenderer;
    TestRenderer.act(() => {
      renderer = TestRenderer.create(
        <MemoryRouter initialEntries={["/app/home"]}>
          <Routes>
            <Route path="app">
              <Route path="home" element={<h1>Home</h1>} />
            </Route>
          </Routes>
        </MemoryRouter>
      );
    });

    expect(renderer.toJSON()).toMatchInlineSnapshot(`
      <h1>
        Home
      </h1>
    `);
  });
});
