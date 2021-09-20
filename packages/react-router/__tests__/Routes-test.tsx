import * as React from "react";
import { create as createTestRenderer } from "react-test-renderer";
import { MemoryRouter as Router, Routes, Route } from "react-router";

describe("A <Routes>", () => {
  it("renders the first route that matches the URL", () => {
    let renderer = createTestRenderer(
      <Router initialEntries={["/"]}>
        <Routes>
          <Route path="/" element={<h1>Home</h1>} />
        </Routes>
      </Router>
    );

    expect(renderer.toJSON()).toMatchInlineSnapshot(`
      <h1>
        Home
      </h1>
    `);
  });

  it("does not render a 2nd route that also matches the URL", () => {
    let renderer = createTestRenderer(
      <Router initialEntries={["/home"]}>
        <Routes>
          <Route path="home" element={<h1>Home</h1>} />
          <Route path="home" element={<h1>Dashboard</h1>} />
        </Routes>
      </Router>
    );

    expect(renderer.toJSON()).toMatchInlineSnapshot(`
      <h1>
        Home
      </h1>
    `);
  });

  it("renders with non-element children", () => {
    let renderer = createTestRenderer(
      <Router initialEntries={["/"]}>
        <Routes>
          <Route path="/" element={<h1>Home</h1>} />
          {false}
          {undefined}
        </Routes>
      </Router>
    );

    expect(renderer.toJSON()).toMatchInlineSnapshot(`
      <h1>
        Home
      </h1>
    `);
  });

  it("renders with React.Fragment children", () => {
    let renderer = createTestRenderer(
      <Router initialEntries={["/admin"]}>
        <Routes>
          <Route path="/" element={<h1>Home</h1>} />
          <React.Fragment>
            <Route path="admin" element={<h1>Admin</h1>} />
          </React.Fragment>
        </Routes>
      </Router>
    );

    expect(renderer.toJSON()).toMatchInlineSnapshot(`
      <h1>
        Admin
      </h1>
    `);
  });
});
