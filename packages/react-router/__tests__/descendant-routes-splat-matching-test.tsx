import * as React from "react";
import * as TestRenderer from "react-test-renderer";
import {
  MemoryRouter,
  Outlet,
  Routes,
  Route,
  useParams,
  createRoutesFromElements,
  useRoutes,
} from "react-router";
import type { InitialEntry } from "@remix-run/router";

describe("Descendant <Routes> splat matching", () => {
  describe("when the parent route path ends with /*", () => {
    it("works", () => {
      function ReactCourses() {
        return (
          <div>
            <h1>React</h1>
            <Routes>
              <Route
                path="react-fundamentals"
                element={<h1>React Fundamentals</h1>}
              />
            </Routes>
          </div>
        );
      }

      function Courses() {
        return (
          <div>
            <h1>Courses</h1>
            <Outlet />
          </div>
        );
      }

      let renderer: TestRenderer.ReactTestRenderer;
      TestRenderer.act(() => {
        renderer = TestRenderer.create(
          <MemoryRouter initialEntries={["/courses/react/react-fundamentals"]}>
            <Routes>
              <Route path="courses" element={<Courses />}>
                <Route path="react/*" element={<ReactCourses />} />
              </Route>
            </Routes>
          </MemoryRouter>
        );
      });

      expect(renderer.toJSON()).toMatchInlineSnapshot(`
        <div>
          <h1>
            Courses
          </h1>
          <div>
            <h1>
              React
            </h1>
            <h1>
              React Fundamentals
            </h1>
          </div>
        </div>
      `);
    });

    describe("<Routes>/useRoutes absolute config", () => {
      it("<Routes> treats descendant route leading-slash paths as relative by default", () => {
        let renderer: TestRenderer.ReactTestRenderer;
        TestRenderer.act(() => {
          renderer = TestRenderer.create(
            <MemoryRouter initialEntries={["/auth/login"]}>
              <Routes>
                <Route path="/auth/*" element={<Auth />} />
              </Routes>
            </MemoryRouter>
          );
        });

        function Auth() {
          return (
            <Routes>
              <Route path="/auth/login" element={<h2>Auth Login</h2>} />
              <Route path="*" element={<h2>Not Found</h2>} />
            </Routes>
          );
        }

        expect(renderer.toJSON()).toMatchInlineSnapshot(`
          <h2>
            Not Found
          </h2>
        `);

        let renderer2: TestRenderer.ReactTestRenderer;
        TestRenderer.act(() => {
          renderer2 = TestRenderer.create(
            <MemoryRouter initialEntries={["/auth/auth/login"]}>
              <Routes>
                <Route path="/auth/*" element={<Auth />} />
              </Routes>
            </MemoryRouter>
          );
        });

        expect(renderer2.toJSON()).toMatchInlineSnapshot(`
          <h2>
            Auth Login
          </h2>
        `);
      });

      it("<Routes> treats descendant route leading-slash paths as absolute when specified", () => {
        let renderer: TestRenderer.ReactTestRenderer;
        TestRenderer.act(() => {
          renderer = TestRenderer.create(
            <MemoryRouter initialEntries={["/auth/login"]}>
              <Routes>
                <Route path="/auth/*" element={<Auth />} />
              </Routes>
            </MemoryRouter>
          );
        });

        function Auth() {
          return (
            <Routes absolute>
              <Route path="/auth/login" element={<h2>Auth Login</h2>} />
              <Route path="*" element={<h2>Not Found</h2>} />
            </Routes>
          );
        }

        expect(renderer.toJSON()).toMatchInlineSnapshot(`
          <h2>
            Auth Login
          </h2>
        `);
      });

      it("useRoutes() treats descendant route leading-slash paths as relative by default", () => {
        let renderer: TestRenderer.ReactTestRenderer;
        TestRenderer.act(() => {
          renderer = TestRenderer.create(
            <MemoryRouter initialEntries={["/auth/login"]}>
              <Routes>
                <Route path="/auth/*" element={<Auth />} />
              </Routes>
            </MemoryRouter>
          );
        });

        function Auth() {
          let childRoutes = createRoutesFromElements(
            <>
              <Route path="/auth/login" element={<h2>Auth Login</h2>} />
              <Route path="*" element={<h2>Not Found</h2>} />
            </>
          );

          return useRoutes(childRoutes);
        }

        expect(renderer.toJSON()).toMatchInlineSnapshot(`
          <h2>
            Not Found
          </h2>
        `);

        let renderer2: TestRenderer.ReactTestRenderer;
        TestRenderer.act(() => {
          renderer2 = TestRenderer.create(
            <MemoryRouter initialEntries={["/auth/auth/login"]}>
              <Routes>
                <Route path="/auth/*" element={<Auth />} />
              </Routes>
            </MemoryRouter>
          );
        });

        expect(renderer2.toJSON()).toMatchInlineSnapshot(`
          <h2>
            Auth Login
          </h2>
        `);
      });

      it("useRoutes() treats descendant route leading-slash paths as absolute when specified", () => {
        let renderer: TestRenderer.ReactTestRenderer;
        TestRenderer.act(() => {
          renderer = TestRenderer.create(
            <MemoryRouter initialEntries={["/auth/login"]}>
              <Routes>
                <Route path="/auth/*" element={<Auth />} />
              </Routes>
            </MemoryRouter>
          );
        });

        function Auth() {
          let childRoutes = createRoutesFromElements(
            <>
              <Route path="/auth/login" element={<h2>Auth Login</h2>} />
              <Route path="*" element={<h2>Not Found</h2>} />
            </>
          );
          return useRoutes(childRoutes, null, true);
        }

        expect(renderer.toJSON()).toMatchInlineSnapshot(`
          <h2>
            Auth Login
          </h2>
        `);
      });
    });

    describe("works with paths beginning with special characters", () => {
      function PrintParams() {
        return <p>The params are{JSON.stringify(useParams())}</p>;
      }
      function ReactCourses() {
        return (
          <div>
            <h1>React</h1>
            <Routes>
              <Route
                path=":splat"
                element={
                  <div>
                    <h1>React Fundamentals</h1>
                    <PrintParams />
                  </div>
                }
              />
            </Routes>
          </div>
        );
      }

      function Courses() {
        return (
          <div>
            <h1>Courses</h1>
            <Outlet />
          </div>
        );
      }

      function renderNestedSplatRoute(initialEntries: InitialEntry[]) {
        let renderer: TestRenderer.ReactTestRenderer;
        TestRenderer.act(() => {
          renderer = TestRenderer.create(
            <MemoryRouter initialEntries={initialEntries}>
              <Routes>
                <Route path="courses" element={<Courses />}>
                  <Route path="react/*" element={<ReactCourses />} />
                </Route>
              </Routes>
            </MemoryRouter>
          );
        });
        return renderer;
      }

      it("allows `-` to appear at the beginning", () => {
        let renderer = renderNestedSplatRoute([
          "/courses/react/-react-fundamentals",
        ]);
        expect(renderer.toJSON()).toMatchInlineSnapshot(`
          <div>
            <h1>
              Courses
            </h1>
            <div>
              <h1>
                React
              </h1>
              <div>
                <h1>
                  React Fundamentals
                </h1>
                <p>
                  The params are
                  {"*":"-react-fundamentals","splat":"-react-fundamentals"}
                </p>
              </div>
            </div>
          </div>
        `);
      });

      it("allows `.` to appear at the beginning", () => {
        let renderer = renderNestedSplatRoute([
          "/courses/react/.react-fundamentals",
        ]);
        expect(renderer.toJSON()).toMatchInlineSnapshot(`
          <div>
            <h1>
              Courses
            </h1>
            <div>
              <h1>
                React
              </h1>
              <div>
                <h1>
                  React Fundamentals
                </h1>
                <p>
                  The params are
                  {"*":".react-fundamentals","splat":".react-fundamentals"}
                </p>
              </div>
            </div>
          </div>
        `);
      });

      it("allows `~` to appear at the beginning", () => {
        let renderer = renderNestedSplatRoute([
          "/courses/react/~react-fundamentals",
        ]);
        expect(renderer.toJSON()).toMatchInlineSnapshot(`
          <div>
            <h1>
              Courses
            </h1>
            <div>
              <h1>
                React
              </h1>
              <div>
                <h1>
                  React Fundamentals
                </h1>
                <p>
                  The params are
                  {"*":"~react-fundamentals","splat":"~react-fundamentals"}
                </p>
              </div>
            </div>
          </div>
        `);
      });

      it("allows `@` to appear at the beginning", () => {
        let renderer = renderNestedSplatRoute([
          "/courses/react/@react-fundamentals",
        ]);
        expect(renderer.toJSON()).toMatchInlineSnapshot(`
          <div>
            <h1>
              Courses
            </h1>
            <div>
              <h1>
                React
              </h1>
              <div>
                <h1>
                  React Fundamentals
                </h1>
                <p>
                  The params are
                  {"*":"@react-fundamentals","splat":"@react-fundamentals"}
                </p>
              </div>
            </div>
          </div>
        `);
      });

      it("allows url-encoded entities to appear at the beginning", () => {
        let renderer = renderNestedSplatRoute([
          "/courses/react/%20react-fundamentals",
        ]);
        expect(renderer.toJSON()).toMatchInlineSnapshot(`
          <div>
            <h1>
              Courses
            </h1>
            <div>
              <h1>
                React
              </h1>
              <div>
                <h1>
                  React Fundamentals
                </h1>
                <p>
                  The params are
                  {"*":" react-fundamentals","splat":" react-fundamentals"}
                </p>
              </div>
            </div>
          </div>
        `);
      });
    });
  });
});
