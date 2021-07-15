import * as React from "react";
import { act, create as createTestRenderer } from "react-test-renderer";
import { MemoryRouter as Router, Outlet, Routes, Route } from "react-router";
import type { ReactTestRenderer } from "react-test-renderer";

describe("Descendant <Routes> splat matching", () => {
  describe("when the parent route path ends with /*", () => {
    it("works", () => {
      function ReactFundamentals() {
        return <h1>React Fundamentals</h1>;
      }

      function ReactCourses() {
        return (
          <div>
            <h1>React</h1>
            <Routes>
              <Route
                path="react-fundamentals"
                element={<ReactFundamentals />}
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

      let renderer: ReactTestRenderer;
      act(() => {
        renderer = createTestRenderer(
          <Router initialEntries={["/courses/react/react-fundamentals"]}>
            <Routes>
              <Route path="courses" element={<Courses />}>
                <Route path="react/*" element={<ReactCourses />} />
              </Route>
            </Routes>
          </Router>
        );
      });

      expect(renderer.toJSON()).toMatchSnapshot();
    });
  });
});
