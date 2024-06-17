import * as React from "react";
import * as TestRenderer from "react-test-renderer";
import { MemoryRouter, Outlet, Routes, Route } from "react-router";

describe("nested routes with no path", () => {
  it("matches them depth-first", () => {
    let renderer: TestRenderer.ReactTestRenderer;
    TestRenderer.act(() => {
      renderer = TestRenderer.create(
        <MemoryRouter initialEntries={["/"]}>
          <Routes>
            <Route element={<First />}>
              <Route element={<Second />}>
                <Route path="/" element={<Third />} />
              </Route>
            </Route>
          </Routes>
        </MemoryRouter>
      );
    });

    expect(renderer.toJSON()).toMatchInlineSnapshot(`
      <div>
        First 
        <div>
          Second 
          <div>
            Third
          </div>
        </div>
      </div>
    `);
  });

  function First() {
    return (
      <div>
        First <Outlet />
      </div>
    );
  }

  function Second() {
    return (
      <div>
        Second <Outlet />
      </div>
    );
  }

  function Third() {
    return <div>Third</div>;
  }
});

describe("nested /", () => {
  it("matches them depth-first", () => {
    let renderer: TestRenderer.ReactTestRenderer;
    TestRenderer.act(() => {
      renderer = TestRenderer.create(
        <MemoryRouter initialEntries={["/"]}>
          <Routes>
            <Route path="/" element={<First />}>
              <Route path="/" element={<Second />}>
                <Route path="/" element={<Third />} />
              </Route>
            </Route>
          </Routes>
        </MemoryRouter>
      );
    });

    expect(renderer.toJSON()).toMatchInlineSnapshot(`
      <div>
        First 
        <div>
          Second 
          <div>
            Third
          </div>
        </div>
      </div>
    `);
  });

  function First() {
    return (
      <div>
        First <Outlet />
      </div>
    );
  }

  function Second() {
    return (
      <div>
        Second <Outlet />
      </div>
    );
  }

  function Third() {
    return <div>Third</div>;
  }
});

describe("routes with identical paths", () => {
  it("matches them in order", () => {
    let renderer: TestRenderer.ReactTestRenderer;
    TestRenderer.act(() => {
      renderer = TestRenderer.create(
        <MemoryRouter initialEntries={["/home"]}>
          <Routes>
            <Route path="/home" element={<First />} />
            <Route path="/home" element={<Second />} />
          </Routes>
        </MemoryRouter>
      );
    });

    expect(renderer.toJSON()).toMatchInlineSnapshot(`
      <div>
        First
      </div>
    `);
  });

  function First() {
    return <div>First</div>;
  }

  function Second() {
    return <div>Second</div>;
  }
});
