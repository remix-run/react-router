import * as React from "react";
import * as TestRenderer from "react-test-renderer";
import type { PathMatch } from "react-router";
import { MemoryRouter, Routes, Route, useMatch } from "react-router";

function ShowMatch({ pattern }: { pattern: string }) {
  return <pre>{JSON.stringify(useMatch(pattern), null, 2)}</pre>;
}

describe("useMatch", () => {
  describe("when the path matches the current URL", () => {
    it("returns the match", () => {
      let renderer: TestRenderer.ReactTestRenderer;
      TestRenderer.act(() => {
        renderer = TestRenderer.create(
          <MemoryRouter initialEntries={["/home"]}>
            <Routes>
              <Route path="/" element={<ShowMatch pattern="home" />}>
                <Route path="/home" element={<h1>Home</h1>} />
              </Route>
            </Routes>
          </MemoryRouter>
        );
      });

      expect(renderer.toJSON()).toMatchInlineSnapshot(`
        <pre>
          {
          "params": {},
          "pathname": "/home",
          "pathnameBase": "/home",
          "pattern": {
            "path": "home",
            "caseSensitive": false,
            "end": true
          }
        }
        </pre>
      `);
    });
  });

  describe("when the current URL ends with a slash", () => {
    it("returns the match.pathname with the trailing slash", () => {
      let renderer: TestRenderer.ReactTestRenderer;
      TestRenderer.act(() => {
        renderer = TestRenderer.create(
          <MemoryRouter initialEntries={["/home/"]}>
            <Routes>
              <Route path="/" element={<ShowMatch pattern="home" />}>
                <Route path="/home" element={<h1>Home</h1>} />
              </Route>
            </Routes>
          </MemoryRouter>
        );
      });

      expect(renderer.toJSON()).toMatchInlineSnapshot(`
        <pre>
          {
          "params": {},
          "pathname": "/home/",
          "pathnameBase": "/home",
          "pattern": {
            "path": "home",
            "caseSensitive": false,
            "end": true
          }
        }
        </pre>
      `);
    });
  });

  describe("when the path does not match the current URL", () => {
    it("returns null", () => {
      let renderer: TestRenderer.ReactTestRenderer;
      TestRenderer.act(() => {
        renderer = TestRenderer.create(
          <MemoryRouter initialEntries={["/home"]}>
            <Routes>
              <Route path="/" element={<ShowMatch pattern="about" />}>
                <Route path="/home" element={<h1>Home</h1>} />
              </Route>
            </Routes>
          </MemoryRouter>
        );
      });

      expect(renderer.toJSON()).toMatchInlineSnapshot(`
        <pre>
          null
        </pre>
      `);
    });
  });

  describe("when re-rendered with the same URL", () => {
    it("returns the memoized match", () => {
      let path = "/home";
      let match: PathMatch<string>;
      let firstMatch: PathMatch<string>;

      function HomePage() {
        match = useMatch(path);

        if (!firstMatch) {
          firstMatch = match;
        }

        return null;
      }

      let renderer: TestRenderer.ReactTestRenderer;
      TestRenderer.act(() => {
        renderer = TestRenderer.create(
          <MemoryRouter initialEntries={[path]}>
            <Routes>
              <Route path={path} element={<HomePage />} />
            </Routes>
          </MemoryRouter>
        );
      });

      TestRenderer.act(() => {
        renderer.update(
          <MemoryRouter initialEntries={[path]}>
            <Routes>
              <Route path={path} element={<HomePage />} />
            </Routes>
          </MemoryRouter>
        );
      });

      expect(match).toBe(firstMatch);
    });
  });
});
