import * as React from "react";
import * as ReactDOM from "react-dom";
import { act } from "react-dom/test-utils";
import { MemoryRouter as Router, Routes, Route } from "react-router";

describe("A <Routes>", () => {
  let node: HTMLDivElement;
  beforeEach(() => {
    node = document.createElement("div");
    document.body.appendChild(node);
  });

  afterEach(() => {
    document.body.removeChild(node);
    node = null!;
  });

  it("renders the first route that matches the URL", () => {
    function Home() {
      return <h1>Home</h1>;
    }

    act(() => {
      ReactDOM.render(
        <Router initialEntries={["/"]}>
          <Routes>
            <Route path="/" element={<Home />} />
          </Routes>
        </Router>,
        node
      );
    });

    expect(node.innerHTML).toMatchInlineSnapshot(`"<h1>Home</h1>"`);
  });

  it("does not render a 2nd route that also matches the URL", () => {
    function Home() {
      return <h1>Home</h1>;
    }

    function Dashboard() {
      return <h1>Dashboard</h1>;
    }

    act(() => {
      ReactDOM.render(
        <Router initialEntries={["/home"]}>
          <Routes>
            <Route path="home" element={<Home />} />
            <Route path="home" element={<Dashboard />} />
          </Routes>
        </Router>,
        node
      );
    });

    expect(node.innerHTML).toMatchInlineSnapshot(`"<h1>Home</h1>"`);
  });

  it("renders with non-element children", () => {
    function Home() {
      return <h1>Home</h1>;
    }

    act(() => {
      ReactDOM.render(
        <Router initialEntries={["/"]}>
          <Routes>
            <Route path="/" element={<Home />} />
            {false}
            {undefined}
          </Routes>
        </Router>,
        node
      );
    });

    expect(node.innerHTML).toMatchInlineSnapshot(`"<h1>Home</h1>"`);
  });

  it("renders with React.Fragment children", () => {
    function Home() {
      return <h1>Home</h1>;
    }

    function Admin() {
      return <h1>Admin</h1>;
    }

    act(() => {
      ReactDOM.render(
        <Router initialEntries={["/admin"]}>
          <Routes>
            <Route path="/" element={<Home />} />
            <React.Fragment>
              <Route path="admin" element={<Admin />} />
            </React.Fragment>
          </Routes>
        </Router>,
        node
      );
    });
    expect(node.innerHTML).toMatchInlineSnapshot(`"<h1>Admin</h1>"`);
  });

  describe("when given a basename", () => {
    it("renders the first route that matches the URL", () => {
      function Home() {
        return <h1>Home</h1>;
      }

      function App() {
        return <h1>App</h1>;
      }

      act(() => {
        ReactDOM.render(
          <Router initialEntries={["/home"]}>
            <Routes basename="app">
              <Route path="/" element={<App />} />
            </Routes>
            <Routes basename="home">
              <Route path="/" element={<Home />} />
            </Routes>
          </Router>,
          node
        );
      });

      expect(node.innerHTML).toMatchInlineSnapshot(`"<h1>Home</h1>"`);
    });

    it("matches regardless of basename casing", () => {
      function Home() {
        return <h1>Home</h1>;
      }

      function App() {
        return <h1>App</h1>;
      }

      act(() => {
        ReactDOM.render(
          <Router initialEntries={["/home"]}>
            <Routes basename="APP">
              <Route path="/" element={<App />} />
            </Routes>
            <Routes basename="HoME">
              <Route path="/" element={<Home />} />
            </Routes>
          </Router>,
          node
        );
      });

      expect(node.innerHTML).toMatchInlineSnapshot(`"<h1>Home</h1>"`);
    });

    it("matches regardless of URL casing", () => {
      function Home() {
        return <h1>Home</h1>;
      }

      function App() {
        return <h1>App</h1>;
      }

      act(() => {
        ReactDOM.render(
          <Router initialEntries={["/hOmE"]}>
            <Routes basename="aPp">
              <Route path="/" element={<App />} />
            </Routes>
            <Routes basename="HoMe">
              <Route path="/" element={<Home />} />
            </Routes>
          </Router>,
          node
        );
      });

      expect(node.innerHTML).toMatchInlineSnapshot(`"<h1>Home</h1>"`);
    });

    it("does not render a 2nd route that also matches the URL", () => {
      function Home() {
        return <h1>Home</h1>;
      }

      function Dashboard() {
        return <h1>Dashboard</h1>;
      }

      act(() => {
        ReactDOM.render(
          <Router initialEntries={["/app/home"]}>
            <Routes basename="app">
              <Route path="home" element={<Home />} />
              <Route path="home" element={<Dashboard />} />
            </Routes>
          </Router>,
          node
        );
      });

      expect(node.innerHTML).toMatchInlineSnapshot(`"<h1>Home</h1>"`);
    });
  });
});
