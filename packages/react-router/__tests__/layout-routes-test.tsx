import * as React from "react";
import * as TestRenderer from "react-test-renderer";
import { MemoryRouter, Routes, Route, Outlet } from "react-router";

describe("A layout route", () => {
  it("does not match when none of its children do", () => {
    let renderer: TestRenderer.ReactTestRenderer;
    TestRenderer.act(() => {
      renderer = TestRenderer.create(
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
    });

    expect(renderer.toJSON()).toMatchInlineSnapshot(`
      <h1>
        Index
      </h1>
    `);
  });

  it("allows routes starting with `@`", () => {
    let renderer: TestRenderer.ReactTestRenderer;
    TestRenderer.act(() => {
      renderer = TestRenderer.create(
        <MemoryRouter initialEntries={["/@splat"]}>
          <Routes>
            <Route
              element={
                <div>
                  <h1>Layout</h1>
                  <Outlet />
                </div>
              }
            >
              <Route
                path="*"
                element={
                  <div>
                    <h1>Splat</h1>
                  </div>
                }
              />
            </Route>
          </Routes>
        </MemoryRouter>
      );
    });

    expect(renderer.toJSON()).toMatchInlineSnapshot(`
      <div>
        <h1>
          Layout
        </h1>
        <div>
          <h1>
            Splat
          </h1>
        </div>
      </div>
    `);
  });
  describe("matches when a nested splat route begins with a special character", () => {
    it("allows routes starting with `-`", () => {
      let renderer: TestRenderer.ReactTestRenderer;
      TestRenderer.act(() => {
        renderer = TestRenderer.create(
          <MemoryRouter initialEntries={["/-splat"]}>
            <Routes>
              <Route
                element={
                  <div>
                    <h1>Layout</h1>
                    <Outlet />
                  </div>
                }
              >
                <Route
                  path="*"
                  element={
                    <div>
                      <h1>Splat</h1>
                    </div>
                  }
                />
              </Route>
            </Routes>
          </MemoryRouter>
        );
      });

      expect(renderer.toJSON()).toMatchInlineSnapshot(`
        <div>
          <h1>
            Layout
          </h1>
          <div>
            <h1>
              Splat
            </h1>
          </div>
        </div>
      `);
    });
    it("allows routes starting with `~`", () => {
      let renderer: TestRenderer.ReactTestRenderer;
      TestRenderer.act(() => {
        renderer = TestRenderer.create(
          <MemoryRouter initialEntries={["/~splat"]}>
            <Routes>
              <Route
                element={
                  <div>
                    <h1>Layout</h1>
                    <Outlet />
                  </div>
                }
              >
                <Route
                  path="*"
                  element={
                    <div>
                      <h1>Splat</h1>
                    </div>
                  }
                />
              </Route>
            </Routes>
          </MemoryRouter>
        );
      });

      expect(renderer.toJSON()).toMatchInlineSnapshot(`
        <div>
          <h1>
            Layout
          </h1>
          <div>
            <h1>
              Splat
            </h1>
          </div>
        </div>
      `);
    });
    it("allows routes starting with `_`", () => {
      let renderer: TestRenderer.ReactTestRenderer;
      TestRenderer.act(() => {
        renderer = TestRenderer.create(
          <MemoryRouter initialEntries={["/_splat"]}>
            <Routes>
              <Route
                element={
                  <div>
                    <h1>Layout</h1>
                    <Outlet />
                  </div>
                }
              >
                <Route
                  path="*"
                  element={
                    <div>
                      <h1>Splat</h1>
                    </div>
                  }
                />
              </Route>
            </Routes>
          </MemoryRouter>
        );
      });

      expect(renderer.toJSON()).toMatchInlineSnapshot(`
        <div>
          <h1>
            Layout
          </h1>
          <div>
            <h1>
              Splat
            </h1>
          </div>
        </div>
      `);
    });
    it("allows routes starting with `.`", () => {
      let renderer: TestRenderer.ReactTestRenderer;
      TestRenderer.act(() => {
        renderer = TestRenderer.create(
          <MemoryRouter initialEntries={["/.splat"]}>
            <Routes>
              <Route
                element={
                  <div>
                    <h1>Layout</h1>
                    <Outlet />
                  </div>
                }
              >
                <Route
                  path="*"
                  element={
                    <div>
                      <h1>Splat</h1>
                    </div>
                  }
                />
              </Route>
            </Routes>
          </MemoryRouter>
        );
      });

      expect(renderer.toJSON()).toMatchInlineSnapshot(`
        <div>
          <h1>
            Layout
          </h1>
          <div>
            <h1>
              Splat
            </h1>
          </div>
        </div>
      `);
    });
    it("allows routes starting with url-encoded entities", () => {
      let renderer: TestRenderer.ReactTestRenderer;
      TestRenderer.act(() => {
        renderer = TestRenderer.create(
          <MemoryRouter initialEntries={["/%20splat"]}>
            <Routes>
              <Route
                element={
                  <div>
                    <h1>Layout</h1>
                    <Outlet />
                  </div>
                }
              >
                <Route
                  path="*"
                  element={
                    <div>
                      <h1>Splat</h1>
                    </div>
                  }
                />
              </Route>
            </Routes>
          </MemoryRouter>
        );
      });

      expect(renderer.toJSON()).toMatchInlineSnapshot(`
        <div>
          <h1>
            Layout
          </h1>
          <div>
            <h1>
              Splat
            </h1>
          </div>
        </div>
      `);
    });
  });
});
