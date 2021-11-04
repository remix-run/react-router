import * as React from "react";
import * as TestRenderer from "react-test-renderer";
import { MemoryRouter, Outlet, Routes, Route, useParams } from "react-router";

function ShowParams() {
  return <pre>{JSON.stringify(useParams())}</pre>;
}

describe("useParams", () => {
  describe("when the route isn't matched", () => {
    it("returns an empty object", () => {
      let renderer: TestRenderer.ReactTestRenderer;
      TestRenderer.act(() => {
        renderer = TestRenderer.create(
          <MemoryRouter initialEntries={["/home"]}>
            <ShowParams />
          </MemoryRouter>
        );
      });

      expect(renderer.toJSON()).toMatchInlineSnapshot(`
        <pre>
          {}
        </pre>
      `);
    });
  });

  describe("when the path has no params", () => {
    it("returns an empty object", () => {
      let renderer: TestRenderer.ReactTestRenderer;
      TestRenderer.act(() => {
        renderer = TestRenderer.create(
          <MemoryRouter initialEntries={["/home"]}>
            <Routes>
              <Route path="/home" element={<ShowParams />} />
            </Routes>
          </MemoryRouter>
        );
      });

      expect(renderer.toJSON()).toMatchInlineSnapshot(`
        <pre>
          {}
        </pre>
      `);
    });
  });

  describe("when the path has some params", () => {
    it("returns an object of the URL params", () => {
      let renderer: TestRenderer.ReactTestRenderer;
      TestRenderer.act(() => {
        renderer = TestRenderer.create(
          <MemoryRouter initialEntries={["/blog/react-router"]}>
            <Routes>
              <Route path="/blog/:slug" element={<ShowParams />} />
            </Routes>
          </MemoryRouter>
        );
      });

      expect(renderer.toJSON()).toMatchInlineSnapshot(`
        <pre>
          {"slug":"react-router"}
        </pre>
      `);
    });

    describe("a child route", () => {
      it("returns a combined hash of the parent and child params", () => {
        function UserDashboard() {
          return (
            <div>
              <h1>User Dashboard</h1>
              <Outlet />
            </div>
          );
        }

        let renderer: TestRenderer.ReactTestRenderer;
        TestRenderer.act(() => {
          renderer = TestRenderer.create(
            <MemoryRouter
              initialEntries={["/users/mjackson/courses/react-router"]}
            >
              <Routes>
                <Route path="users/:username" element={<UserDashboard />}>
                  <Route path="courses/:course" element={<ShowParams />} />
                </Route>
              </Routes>
            </MemoryRouter>
          );
        });

        expect(renderer.toJSON()).toMatchInlineSnapshot(`
          <div>
            <h1>
              User Dashboard
            </h1>
            <pre>
              {"username":"mjackson","course":"react-router"}
            </pre>
          </div>
        `);
      });
    });
  });

  describe("when the path has percent-encoded params", () => {
    it("returns an object of the decoded params", () => {
      let renderer: TestRenderer.ReactTestRenderer;
      TestRenderer.act(() => {
        renderer = TestRenderer.create(
          <MemoryRouter initialEntries={["/blog/react%20router"]}>
            <Routes>
              <Route path="/blog/:slug" element={<ShowParams />} />
            </Routes>
          </MemoryRouter>
        );
      });

      expect(renderer.toJSON()).toMatchInlineSnapshot(`
        <pre>
          {"slug":"react router"}
        </pre>
      `);
    });
  });

  describe("when the path has a + character", () => {
    it("returns an object of the decoded params", () => {
      let renderer: TestRenderer.ReactTestRenderer;
      TestRenderer.act(() => {
        renderer = TestRenderer.create(
          <MemoryRouter initialEntries={["/blog/react+router+is%20awesome"]}>
            <Routes>
              <Route path="/blog/:slug" element={<ShowParams />} />
            </Routes>
          </MemoryRouter>
        );
      });

      expect(renderer.toJSON()).toMatchInlineSnapshot(`
        <pre>
          {"slug":"react+router+is awesome"}
        </pre>
      `);
    });
  });

  describe("when the path has a malformed param", () => {
    let consoleWarn: jest.SpyInstance<
      ReturnType<typeof console.warn>,
      Parameters<typeof console.warn>
    >;

    beforeEach(() => {
      consoleWarn = jest.spyOn(console, "warn").mockImplementation(() => {});
    });

    afterEach(() => {
      consoleWarn.mockRestore();
    });

    it("returns the raw value and warns", () => {
      let renderer: TestRenderer.ReactTestRenderer;
      TestRenderer.act(() => {
        renderer = TestRenderer.create(
          <MemoryRouter initialEntries={["/blog/react%2router"]}>
            <Routes>
              <Route path="/blog/:slug" element={<ShowParams />} />
            </Routes>
          </MemoryRouter>
        );
      });

      expect(renderer.toJSON()).toMatchInlineSnapshot(`
        <pre>
          {"slug":"react%2router"}
        </pre>
      `);

      expect(consoleWarn).toHaveBeenCalledWith(
        expect.stringMatching("malformed URL segment")
      );
    });
  });

  describe("when the params match in a child route", () => {
    it("renders params in the parent", () => {
      let renderer: TestRenderer.ReactTestRenderer;
      TestRenderer.act(() => {
        renderer = TestRenderer.create(
          <MemoryRouter initialEntries={["/blog/react-router"]}>
            <Routes>
              <Route path="/blog" element={<ShowParams />}>
                <Route path=":slug" element={null} />
              </Route>
            </Routes>
          </MemoryRouter>
        );
      });

      expect(renderer.toJSON()).toMatchInlineSnapshot(`
        <pre>
          {"slug":"react-router"}
        </pre>
      `);
    });
  });
});
