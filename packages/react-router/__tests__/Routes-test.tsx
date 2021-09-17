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

  describe("when given a basename", () => {
    it("renders the first route that matches the URL", () => {
      let renderer = createTestRenderer(
        <Router initialEntries={["/home"]}>
          <Routes basename="app">
            <Route path="/" element={<h1>App</h1>} />
          </Routes>
          <Routes basename="home">
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

    it("matches regardless of basename casing", () => {
      let renderer = createTestRenderer(
        <Router initialEntries={["/home"]}>
          <Routes basename="APP">
            <Route path="/" element={<h1>App</h1>} />
          </Routes>
          <Routes basename="HoME">
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

    it("matches regardless of URL casing", () => {
      let renderer = createTestRenderer(
        <Router initialEntries={["/hOmE"]}>
          <Routes basename="aPp">
            <Route path="/" element={<h1>App</h1>} />
          </Routes>
          <Routes basename="HoMe">
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
        <Router initialEntries={["/app/home"]}>
          <Routes basename="app">
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
  });
});
