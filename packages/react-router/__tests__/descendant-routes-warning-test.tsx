import * as React from "react";
import { act, create as createTestRenderer } from "react-test-renderer";
import { MemoryRouter as Router, Outlet, Routes, Route } from "react-router";

describe("Descendant <Routes>", () => {
  let consoleWarn: jest.SpyInstance<void, any>;
  beforeEach(() => {
    consoleWarn = jest.spyOn(console, "warn").mockImplementation();
  });

  afterEach(() => {
    consoleWarn.mockRestore();
  });

  describe("when the parent route path does not have a trailing *", () => {
    it("warns once when you visit the parent route", () => {
      function ReactFundamentals() {
        return <h1>React Fundamentals</h1>;
      }

      function AdvancedReact() {
        return <h1>Advanced React</h1>;
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
            <Routes>
              <Route path="advanced-react" element={<AdvancedReact />} />
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

      act(() => {
        createTestRenderer(
          <Router initialEntries={["/courses/react"]}>
            <Routes>
              <Route path="courses" element={<Courses />}>
                <Route path="react" element={<ReactCourses />} />
              </Route>
            </Routes>
          </Router>
        );
      });

      expect(consoleWarn).toHaveBeenCalledTimes(1);
      expect(consoleWarn).toHaveBeenCalledWith(
        expect.stringContaining("child routes will never render")
      );
    });
  });

  describe("when the parent route has a trailing *", () => {
    it("does not warn when you visit the parent route", () => {
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

      act(() => {
        createTestRenderer(
          <Router initialEntries={["/courses/react"]}>
            <Routes>
              <Route path="courses" element={<Courses />}>
                <Route path="react/*" element={<ReactCourses />} />
              </Route>
            </Routes>
          </Router>
        );
      });

      expect(consoleWarn).not.toHaveBeenCalled();
    });
  });
});
