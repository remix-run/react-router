import * as React from "react";
import { create as createTestRenderer } from "react-test-renderer";
import { MemoryRouter as Router, Routes, Route } from "react-router";

describe("A <Routes>", () => {
  function Home() {
    return <h1>Home</h1>;
  }

  function Admin() {
    return <h1>Admin</h1>;
  }

  it("renders the first route that matches the URL", () => {
    let renderer = createTestRenderer(
      <Router initialEntries={["/"]}>
        <Routes>
          <Route path="/" element={<Home />} />
        </Routes>
      </Router>
    );

    expect(renderer.toJSON()).toMatchSnapshot();
  });

  it("does not render a 2nd route that also matches the URL", () => {
    let renderer = createTestRenderer(
      <Router initialEntries={["/home"]}>
        <Routes>
          <Route path="/home" element={<Home />} />
          <Route path="/home" element={<Admin />} />
        </Routes>
      </Router>
    );

    expect(renderer.toJSON()).toMatchSnapshot();
  });

  it("renders with non-element children", () => {
    let renderer = createTestRenderer(
      <Router initialEntries={["/"]}>
        <Routes>
          <Route path="/" element={<Home />} />
          {false}
          {undefined}
        </Routes>
      </Router>
    );

    expect(renderer.toJSON()).toMatchSnapshot();
  });

  it("renders with React.Fragment children", () => {
    let renderer = createTestRenderer(
      <Router initialEntries={["/admin"]}>
        <Routes>
          <Route path="/" element={<Home />} />
          <React.Fragment>
            <Route path="/admin" element={<Admin />} />
          </React.Fragment>
        </Routes>
      </Router>
    );

    expect(renderer.toJSON()).toMatchSnapshot();
  });

  it('renders route paths prefixed by a basename', () => {
    let renderer = createTestRenderer(
      <Router initialEntries={['/parent']}>
        <Routes basename="/parent">
          <Route path="/" element={<Home />} />
        </Routes>
      </Router>
    );

    expect(renderer.toJSON()).toMatchSnapshot();
  });

  it('renders routes for a different location', () => {
    let location = {
      "pathname": "/home",
    };

    let renderer = createTestRenderer(
      <Router initialEntries={['/']}>
        <Routes location={location}>
          <Route path="/home" element={<Home />} />
        </Routes>
      </Router>
    );

    expect(renderer.toJSON()).toMatchSnapshot();
  });
});
