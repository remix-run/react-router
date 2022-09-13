import * as React from "react";
import * as TestRenderer from "react-test-renderer";
import { MemoryRouter, Outlet, Routes, Route, useParams } from "react-router";
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
    describe("works with paths beginning with special characters", () => {
      function PrintParams() {
        return <p>The params are {JSON.stringify(useParams())}</p>;
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
