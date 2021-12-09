import * as React from "react";
import * as TestRenderer from "react-test-renderer";
import { MemoryRouter, Routes, Route, useHref } from "react-router";

function ShowHref({ to }: { to: string }) {
  return <pre>{useHref(to)}</pre>;
}

describe("useHref", () => {
  describe("to a child route", () => {
    it("returns the correct href", () => {
      let renderer: TestRenderer.ReactTestRenderer;
      TestRenderer.act(() => {
        renderer = TestRenderer.create(
          <MemoryRouter initialEntries={["/courses"]}>
            <Routes>
              <Route
                path="courses"
                element={<ShowHref to="advanced-react" />}
              />
            </Routes>
          </MemoryRouter>
        );
      });

      expect(renderer.toJSON()).toMatchInlineSnapshot(`
        <pre>
          /courses/advanced-react
        </pre>
      `);
    });

    describe("when the URL has a trailing slash", () => {
      it("returns the correct href", () => {
        let renderer: TestRenderer.ReactTestRenderer;
        TestRenderer.act(() => {
          renderer = TestRenderer.create(
            <MemoryRouter initialEntries={["/courses/"]}>
              <Routes>
                <Route
                  path="courses"
                  element={<ShowHref to="advanced-react" />}
                />
              </Routes>
            </MemoryRouter>
          );
        });

        expect(renderer.toJSON()).toMatchInlineSnapshot(`
          <pre>
            /courses/advanced-react
          </pre>
        `);
      });
    });

    describe("when the href has a trailing slash", () => {
      it("returns the correct href", () => {
        let renderer: TestRenderer.ReactTestRenderer;
        TestRenderer.act(() => {
          renderer = TestRenderer.create(
            <MemoryRouter initialEntries={["/courses"]}>
              <Routes>
                <Route
                  path="courses"
                  element={<ShowHref to="advanced-react/" />}
                />
              </Routes>
            </MemoryRouter>
          );
        });

        expect(renderer.toJSON()).toMatchInlineSnapshot(`
          <pre>
            /courses/advanced-react/
          </pre>
        `);
      });
    });
  });

  describe("to a sibling route", () => {
    it("returns the correct href", () => {
      let renderer: TestRenderer.ReactTestRenderer;
      TestRenderer.act(() => {
        renderer = TestRenderer.create(
          <MemoryRouter initialEntries={["/courses"]}>
            <Routes>
              <Route path="courses" element={<ShowHref to="../about" />} />
            </Routes>
          </MemoryRouter>
        );
      });

      expect(renderer.toJSON()).toMatchInlineSnapshot(`
        <pre>
          /about
        </pre>
      `);
    });

    describe("when the URL has a trailing slash", () => {
      it("returns the correct href", () => {
        let renderer: TestRenderer.ReactTestRenderer;
        TestRenderer.act(() => {
          renderer = TestRenderer.create(
            <MemoryRouter initialEntries={["/courses/"]}>
              <Routes>
                <Route path="/courses/" element={<ShowHref to="../about" />} />
              </Routes>
            </MemoryRouter>
          );
        });

        expect(renderer.toJSON()).toMatchInlineSnapshot(`
          <pre>
            /about
          </pre>
        `);
      });
    });

    describe("when the href has a trailing slash", () => {
      it("returns the correct href", () => {
        let renderer: TestRenderer.ReactTestRenderer;
        TestRenderer.act(() => {
          renderer = TestRenderer.create(
            <MemoryRouter initialEntries={["/courses"]}>
              <Routes>
                <Route path="courses" element={<ShowHref to="../about/" />} />
              </Routes>
            </MemoryRouter>
          );
        });

        expect(renderer.toJSON()).toMatchInlineSnapshot(`
          <pre>
            /about/
          </pre>
        `);
      });
    });
  });

  describe("to a parent route", () => {
    it("returns the correct href", () => {
      let renderer: TestRenderer.ReactTestRenderer;
      TestRenderer.act(() => {
        renderer = TestRenderer.create(
          <MemoryRouter initialEntries={["/courses/advanced-react"]}>
            <Routes>
              <Route path="courses">
                <Route path="advanced-react" element={<ShowHref to=".." />} />
              </Route>
            </Routes>
          </MemoryRouter>
        );
      });

      expect(renderer.toJSON()).toMatchInlineSnapshot(`
        <pre>
          /courses
        </pre>
      `);
    });

    describe("when the URL has a trailing slash", () => {
      it("returns the correct href", () => {
        let renderer: TestRenderer.ReactTestRenderer;
        TestRenderer.act(() => {
          renderer = TestRenderer.create(
            <MemoryRouter initialEntries={["/courses/advanced-react/"]}>
              <Routes>
                <Route path="courses">
                  <Route path="advanced-react" element={<ShowHref to=".." />} />
                </Route>
              </Routes>
            </MemoryRouter>
          );
        });

        expect(renderer.toJSON()).toMatchInlineSnapshot(`
          <pre>
            /courses
          </pre>
        `);
      });
    });

    describe("when the href has a trailing slash", () => {
      it("returns the correct href", () => {
        let renderer: TestRenderer.ReactTestRenderer;
        TestRenderer.act(() => {
          renderer = TestRenderer.create(
            <MemoryRouter initialEntries={["/courses/advanced-react"]}>
              <Routes>
                <Route path="courses">
                  <Route
                    path="advanced-react"
                    element={<ShowHref to="../" />}
                  />
                </Route>
              </Routes>
            </MemoryRouter>
          );
        });

        expect(renderer.toJSON()).toMatchInlineSnapshot(`
          <pre>
            /courses/
          </pre>
        `);
      });
    });
  });

  describe("to an absolute route", () => {
    it("returns the correct href", () => {
      let renderer: TestRenderer.ReactTestRenderer;
      TestRenderer.act(() => {
        renderer = TestRenderer.create(
          <MemoryRouter initialEntries={["/courses/advanced-react"]}>
            <Routes>
              <Route
                path="courses/advanced-react"
                element={<ShowHref to="/users" />}
              />
            </Routes>
          </MemoryRouter>
        );
      });

      expect(renderer.toJSON()).toMatchInlineSnapshot(`
        <pre>
          /users
        </pre>
      `);
    });
  });

  describe("with a to value that has more .. segments than are in the URL", () => {
    it("returns the correct href", () => {
      let renderer: TestRenderer.ReactTestRenderer;
      TestRenderer.act(() => {
        renderer = TestRenderer.create(
          <MemoryRouter initialEntries={["/courses/react-fundamentals"]}>
            <Routes>
              <Route path="courses">
                <Route
                  path="react-fundamentals"
                  element={<ShowHref to="../../../courses" />}
                />
              </Route>
            </Routes>
          </MemoryRouter>
        );
      });

      expect(renderer.toJSON()).toMatchInlineSnapshot(`
        <pre>
          /courses
        </pre>
      `);
    });

    describe("and no additional segments", () => {
      it("links to the root /", () => {
        let renderer: TestRenderer.ReactTestRenderer;
        TestRenderer.act(() => {
          renderer = TestRenderer.create(
            <MemoryRouter initialEntries={["/home"]}>
              <Routes>
                <Route path="/home" element={<ShowHref to="../../.." />} />
              </Routes>
            </MemoryRouter>
          );
        });

        expect(renderer.toJSON()).toMatchInlineSnapshot(`
          <pre>
            /
          </pre>
        `);
      });
    });
  });
});
