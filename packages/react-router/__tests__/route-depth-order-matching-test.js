import * as React from "react";
import { act, create as createTestRenderer } from "react-test-renderer";
import { MemoryRouter as Router, Outlet, Routes, Route } from "react-router";

describe("nested /", () => {
  it("matches them depth-first", () => {
    let renderer;
    act(() => {
      renderer = createTestRenderer(
        <Router initialEntries={["/"]}>
          <Routes>
            <Route path="/" element={<First />}>
              <Route path="/" element={<Second />}>
                <Route path="/" element={<Third />} />
              </Route>
            </Route>
          </Routes>
        </Router>
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
    let renderer;
    act(() => {
      renderer = createTestRenderer(
        <Router initialEntries={["/home"]}>
          <Routes>
            <Route path="/home" element={<First />} />
            <Route path="/home" element={<Second />} />
          </Routes>
        </Router>
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
