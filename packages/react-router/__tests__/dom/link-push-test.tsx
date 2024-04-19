import * as React from "react";
import * as TestRenderer from "react-test-renderer";
import {
  MemoryRouter,
  Routes,
  Route,
  Link,
  useNavigationType,
} from "react-router-dom";

function ShowNavigationType() {
  return <p>{useNavigationType()}</p>;
}

describe("Link push and replace", () => {
  describe("to a different pathname, when it is clicked", () => {
    it("performs a push", () => {
      function Home() {
        return (
          <div>
            <h1>Home</h1>
            <Link to="../about">About</Link>
          </div>
        );
      }

      let renderer: TestRenderer.ReactTestRenderer;
      TestRenderer.act(() => {
        renderer = TestRenderer.create(
          <MemoryRouter initialEntries={["/home"]}>
            <Routes>
              <Route path="home" element={<Home />} />
              <Route path="about" element={<ShowNavigationType />} />
            </Routes>
          </MemoryRouter>
        );
      });

      let anchor = renderer.root.findByType("a");

      TestRenderer.act(() => {
        anchor.props.onClick(
          new MouseEvent("click", {
            view: window,
            bubbles: true,
            cancelable: true,
          })
        );
      });

      expect(renderer.toJSON()).toMatchInlineSnapshot(`
        <p>
          PUSH
        </p>
      `);
    });
  });

  describe("to a different search string, when it is clicked", () => {
    it("performs a push with the existing pathname", () => {
      function Home() {
        return (
          <div>
            <h1>Home</h1>
            <Link to="?name=michael">Michael</Link>
            <ShowNavigationType />
          </div>
        );
      }

      let renderer: TestRenderer.ReactTestRenderer;
      TestRenderer.act(() => {
        renderer = TestRenderer.create(
          <MemoryRouter initialEntries={["/home"]}>
            <Routes>
              <Route path="home" element={<Home />} />
            </Routes>
          </MemoryRouter>
        );
      });

      let anchor = renderer.root.findByType("a");

      TestRenderer.act(() => {
        anchor.props.onClick(
          new MouseEvent("click", {
            view: window,
            bubbles: true,
            cancelable: true,
          })
        );
      });

      expect(renderer.toJSON()).toMatchInlineSnapshot(`
        <div>
          <h1>
            Home
          </h1>
          <a
            href="/home?name=michael"
            onClick={[Function]}
          >
            Michael
          </a>
          <p>
            PUSH
          </p>
        </div>
      `);
    });
  });

  describe("to a different hash, when it is clicked", () => {
    it("performs a push with the existing pathname", () => {
      function Home() {
        return (
          <div>
            <h1>Home</h1>
            <Link to="#bio">Bio</Link>
            <ShowNavigationType />
          </div>
        );
      }

      let renderer: TestRenderer.ReactTestRenderer;
      TestRenderer.act(() => {
        renderer = TestRenderer.create(
          <MemoryRouter initialEntries={["/home"]}>
            <Routes>
              <Route path="home" element={<Home />} />
            </Routes>
          </MemoryRouter>
        );
      });

      let anchor = renderer.root.findByType("a");

      TestRenderer.act(() => {
        anchor.props.onClick(
          new MouseEvent("click", {
            view: window,
            bubbles: true,
            cancelable: true,
          })
        );
      });

      expect(renderer.toJSON()).toMatchInlineSnapshot(`
        <div>
          <h1>
            Home
          </h1>
          <a
            href="/home#bio"
            onClick={[Function]}
          >
            Bio
          </a>
          <p>
            PUSH
          </p>
        </div>
      `);
    });
  });

  describe("to the same page, when it is clicked", () => {
    it("performs a replace", () => {
      function Home() {
        return (
          <div>
            <h1>Home</h1>
            <Link to=".">Home</Link>
            <ShowNavigationType />
          </div>
        );
      }

      function About() {
        return <h1>About</h1>;
      }

      let renderer: TestRenderer.ReactTestRenderer;
      TestRenderer.act(() => {
        renderer = TestRenderer.create(
          <MemoryRouter initialEntries={["/home"]}>
            <Routes>
              <Route path="home" element={<Home />} />
              <Route path="about" element={<About />} />
            </Routes>
          </MemoryRouter>
        );
      });

      let anchor = renderer.root.findByType("a");

      TestRenderer.act(() => {
        anchor.props.onClick(
          new MouseEvent("click", {
            view: window,
            bubbles: true,
            cancelable: true,
          })
        );
      });

      expect(renderer.toJSON()).toMatchInlineSnapshot(`
        <div>
          <h1>
            Home
          </h1>
          <a
            href="/home"
            onClick={[Function]}
          >
            Home
          </a>
          <p>
            REPLACE
          </p>
        </div>
      `);
    });
  });

  describe("to the same page with replace={false}, when it is clicked", () => {
    it("performs a push", () => {
      function Home() {
        return (
          <div>
            <h1>Home</h1>
            <Link to="." replace={false}>
              Home
            </Link>
            <ShowNavigationType />
          </div>
        );
      }

      function About() {
        return <h1>About</h1>;
      }

      let renderer: TestRenderer.ReactTestRenderer;
      TestRenderer.act(() => {
        renderer = TestRenderer.create(
          <MemoryRouter initialEntries={["/home"]}>
            <Routes>
              <Route path="home" element={<Home />} />
              <Route path="about" element={<About />} />
            </Routes>
          </MemoryRouter>
        );
      });

      let anchor = renderer.root.findByType("a");

      TestRenderer.act(() => {
        anchor.props.onClick(
          new MouseEvent("click", {
            view: window,
            bubbles: true,
            cancelable: true,
          })
        );
      });

      expect(renderer.toJSON()).toMatchInlineSnapshot(`
        <div>
          <h1>
            Home
          </h1>
          <a
            href="/home"
            onClick={[Function]}
          >
            Home
          </a>
          <p>
            PUSH
          </p>
        </div>
      `);
    });
  });

  describe("to an absolute same-origin/same-basename URL, when it is clicked", () => {
    it("performs a push", () => {
      function Home() {
        return (
          <div>
            <h1>Home</h1>
            <Link to="http://localhost/base/about">About</Link>
          </div>
        );
      }

      let renderer: TestRenderer.ReactTestRenderer;
      TestRenderer.act(() => {
        renderer = TestRenderer.create(
          <MemoryRouter initialEntries={["/base/home"]} basename="/base">
            <Routes>
              <Route path="home" element={<Home />} />
              <Route path="about" element={<ShowNavigationType />} />
            </Routes>
          </MemoryRouter>
        );
      });

      let anchor = renderer.root.findByType("a");

      TestRenderer.act(() => {
        anchor.props.onClick(
          new MouseEvent("click", {
            view: window,
            bubbles: true,
            cancelable: true,
          })
        );
      });

      expect(renderer.toJSON()).toMatchInlineSnapshot(`
        <p>
          PUSH
        </p>
      `);
    });
  });
});
