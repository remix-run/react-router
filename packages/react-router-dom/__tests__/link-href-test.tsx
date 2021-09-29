import * as React from "react";
import { create as createTestRenderer } from "react-test-renderer";
import { MemoryRouter as Router, Routes, Route, Link } from "react-router-dom";

describe("<Link> anchor href", () => {
  test("absolute <Link to>", () => {
    let renderer = createTestRenderer(
      <Router initialEntries={["/"]}>
        <Routes>
          <Route path="/" element={<Link to="/about" />} />
        </Routes>
      </Router>
    );

    let anchor = renderer.root.findByType("a");

    expect(anchor.props.href).toEqual("/about");
  });

  test("absolute <Link to> in descendant <Routes>", () => {
    let renderer = createTestRenderer(
      <Router initialEntries={["/auth/login"]}>
        <Routes>
          <Route
            path="auth/*"
            element={
              <Routes>
                <Route
                  path="login"
                  element={<Link to="/auth/forgot-password" />}
                />
              </Routes>
            }
          />
        </Routes>
      </Router>
    );

    let anchor = renderer.root.findByType("a");

    expect(anchor.props.href).toEqual("/auth/forgot-password");
  });

  test('<Link to=".">', () => {
    let renderer = createTestRenderer(
      <Router initialEntries={["/home"]}>
        <Routes>
          <Route path="home" element={<Link to="." />} />
        </Routes>
      </Router>
    );

    let anchor = renderer.root.findByType("a");

    expect(anchor.props.href).toEqual("/home");
  });

  test('<Link to="."> in a splat route', () => {
    let renderer = createTestRenderer(
      <Router initialEntries={["/home/inbox"]}>
        <Routes>
          <Route path="home/*" element={<Link to="." />} />
        </Routes>
      </Router>
    );

    let anchor = renderer.root.findByType("a");

    expect(anchor.props.href).toEqual("/home/inbox");
  });

  test("relative <Link> to a sibling route", () => {
    let renderer = createTestRenderer(
      <Router initialEntries={["/home"]}>
        <Routes>
          <Route path="home" element={<Link to="../about" />} />
        </Routes>
      </Router>
    );

    let anchor = renderer.root.findByType("a");

    expect(anchor.props.href).toEqual("/about");
  });

  test("relative <Link to> with more .. segments than are in the URL", () => {
    let renderer = createTestRenderer(
      <Router initialEntries={["/home"]}>
        <Routes>
          <Route path="home" element={<Link to="../../about" />} />
        </Routes>
      </Router>
    );

    let anchor = renderer.root.findByType("a");

    expect(anchor.props.href).toEqual("/about");
  });

  describe("under a <Router basename>", () => {
    test("absolute <Link to>", () => {
      let renderer = createTestRenderer(
        <Router basename="/app" initialEntries={["/app/home"]}>
          <Routes>
            <Route path="home" element={<Link to="/about" />} />
          </Routes>
        </Router>
      );

      let anchor = renderer.root.findByType("a");

      expect(anchor.props.href).toEqual("/app/about");
    });

    test('<Link to=".">', () => {
      let renderer = createTestRenderer(
        <Router basename="/app" initialEntries={["/app/home"]}>
          <Routes>
            <Route path="home" element={<Link to="." />} />
          </Routes>
        </Router>
      );

      let anchor = renderer.root.findByType("a");

      expect(anchor.props.href).toEqual("/app/home");
    });

    test("relative <Link> to a sibling route", () => {
      let renderer = createTestRenderer(
        <Router basename="/app" initialEntries={["/app/home"]}>
          <Routes>
            <Route path="home" element={<Link to="../about" />} />
          </Routes>
        </Router>
      );

      let anchor = renderer.root.findByType("a");

      expect(anchor.props.href).toEqual("/app/about");
    });

    test("relative <Link to> with more .. segments than are in the URL", () => {
      let renderer = createTestRenderer(
        <Router basename="/app" initialEntries={["/app/home"]}>
          <Routes>
            <Route path="home" element={<Link to="../../about" />} />
          </Routes>
        </Router>
      );

      let anchor = renderer.root.findByType("a");

      expect(anchor.props.href).toEqual("/app/about");
    });
  });
});
