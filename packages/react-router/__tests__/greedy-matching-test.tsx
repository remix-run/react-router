import * as React from "react";
import * as TestRenderer from "react-test-renderer";
import { MemoryRouter, Routes, Route, Outlet } from "react-router-dom";

describe("greedy matching", () => {
  let routes = (
    <Routes>
      <Route path="/" element={<p>Root</p>} />
      <Route
        path="home"
        element={
          <div>
            Home Layout <Outlet />
          </div>
        }
      >
        <Route index element={<p>Home</p>} />
        <Route path="*" element={<p>Home Not Found</p>} />
      </Route>
      <Route path="*" element={<p>Not Found</p>} />
    </Routes>
  );

  it("matches the root route", () => {
    let renderer: TestRenderer.ReactTestRenderer;
    TestRenderer.act(() => {
      renderer = TestRenderer.create(
        <MemoryRouter initialEntries={["/"]} children={routes} />
      );
    });

    expect(renderer.toJSON()).toMatchInlineSnapshot(`
      <p>
        Root
      </p>
    `);
  });

  it("matches the index route", () => {
    let renderer: TestRenderer.ReactTestRenderer;
    TestRenderer.act(() => {
      renderer = TestRenderer.create(
        <MemoryRouter initialEntries={["/home"]} children={routes} />
      );
    });

    expect(renderer.toJSON()).toMatchInlineSnapshot(`
      <div>
        Home Layout 
        <p>
          Home
        </p>
      </div>
    `);
  });

  it('matches the nested "not found" route', () => {
    let renderer: TestRenderer.ReactTestRenderer;
    TestRenderer.act(() => {
      renderer = TestRenderer.create(
        <MemoryRouter initialEntries={["/home/typo"]} children={routes} />
      );
    });

    expect(renderer.toJSON()).toMatchInlineSnapshot(`
      <div>
        Home Layout 
        <p>
          Home Not Found
        </p>
      </div>
    `);
  });

  it('matches the "not found" route', () => {
    let renderer: TestRenderer.ReactTestRenderer;
    TestRenderer.act(() => {
      renderer = TestRenderer.create(
        <MemoryRouter initialEntries={["/hometypo"]} children={routes} />
      );
    });

    expect(renderer.toJSON()).toMatchInlineSnapshot(`
      <p>
        Not Found
      </p>
    `);
  });
});
