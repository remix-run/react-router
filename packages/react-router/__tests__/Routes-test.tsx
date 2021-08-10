import * as React from "react";
import * as ReactDOM from "react-dom";
import { create as createTestRenderer } from "react-test-renderer";
import { MemoryRouter as Router, Routes, Route } from "react-router";
import { act } from "react-dom/test-utils";

describe("A <Routes>", () => {
  it("renders the first route that matches the URL", () => {
    function Home() {
      return <h1>Home</h1>;
    }

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
    function Home() {
      return <h1>Home</h1>;
    }

    function Dashboard() {
      return <h1>Dashboard</h1>;
    }

    let renderer = createTestRenderer(
      <Router initialEntries={["/home"]}>
        <Routes>
          <Route path="/home" element={<Home />} />
          <Route path="/home" element={<Dashboard />} />
        </Routes>
      </Router>
    );

    expect(renderer.toJSON()).toMatchSnapshot();
  });

  it("renders with non-element children", () => {
    function Home() {
      return <h1>Home</h1>;
    }

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
    function Home() {
      return <h1>Home</h1>;
    }

    function Admin() {
      return <h1>Admin</h1>;
    }

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

  it("Uses the `location` prop instead of context location`", () => {
    let node = document.createElement("div");
    document.body.appendChild(node);

    act(() => {
      ReactDOM.render(
        <Router initialEntries={["/one"]}>
          <Routes location={{ pathname: "/two" }}>
            <Route path="/one" element={<h1>one</h1>} />
            <Route path="/two" element={<h1>two</h1>} />
          </Routes>
        </Router>,
        node
      );
    });

    expect(node.innerHTML).toMatch(/two/);

    // cleanup
    document.body.removeChild(node);
  });
});
