import * as React from "react";
import { create as createTestRenderer } from "react-test-renderer";
import { MemoryRouter as Router, Outlet, Routes, Route } from "react-router";

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

      let renderer = createTestRenderer(
        <Router initialEntries={["/courses/react/react-fundamentals"]}>
          <Routes>
            <Route path="courses" element={<Courses />}>
              <Route path="react/*" element={<ReactCourses />} />
            </Route>
          </Routes>
        </Router>
      );

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
  });
});
