import * as React from "react";
import * as TestRenderer from "react-test-renderer";
import { MemoryRouter, Outlet, Routes, Route } from "react-router";

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
      function ReactCourses() {
        return (
          <div>
            <h1>React</h1>

            <Routes>
              <Route
                path="react-fundamentals"
                element={<h1>React Fundamentals</h1>}
              />
              <Route path="advanced-react" element={<h1>Advanced React</h1>} />
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

      TestRenderer.act(() => {
        TestRenderer.create(
          <MemoryRouter initialEntries={["/courses/react"]}>
            <Routes>
              <Route path="courses" element={<Courses />}>
                <Route path="react" element={<ReactCourses />} />
              </Route>
            </Routes>
          </MemoryRouter>
        );
      });

      expect(consoleWarn).toHaveBeenCalledTimes(1);

      expect(consoleWarn.mock.calls[0][0])
        .toMatch(`You rendered descendant <Routes> (or called \`useRoutes()\`) at "/courses/react" (under <Route path="react">) but the parent route path has no trailing "*". This means if you navigate deeper, the parent won't match anymore and therefore the child routes will never render.

Please change the parent <Route path="react"> to <Route path="react/*">.`);
    });
  });

  describe("when the parent route path does not have a trailing * and is the root", () => {
    it("warns once when you visit the parent route and only shows a hint like *", () => {
      function ReactCourses() {
        return (
          <div>
            <h1>React</h1>

            <Routes>
              <Route
                path="/react-fundamentals"
                element={<h1>React Fundamentals</h1>}
              />
            </Routes>
          </div>
        );
      }

      TestRenderer.act(() => {
        TestRenderer.create(
          <MemoryRouter initialEntries={["/"]}>
            <Routes>
              <Route path="/" element={<ReactCourses />} />
            </Routes>
          </MemoryRouter>
        );
      });

      expect(consoleWarn).toHaveBeenCalledTimes(1);

      expect(consoleWarn.mock.calls[0][0])
        .toMatch(`You rendered descendant <Routes> (or called \`useRoutes()\`) at "/" (under <Route path="/">) but the parent route path has no trailing "*". This means if you navigate deeper, the parent won't match anymore and therefore the child routes will never render.

Please change the parent <Route path="/"> to <Route path="*">.`);
    });
  });

  describe("when the parent route has a trailing *", () => {
    it("does not warn when you visit the parent route", () => {
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

      TestRenderer.act(() => {
        TestRenderer.create(
          <MemoryRouter initialEntries={["/courses/react"]}>
            <Routes>
              <Route path="courses" element={<Courses />}>
                <Route path="react/*" element={<ReactCourses />} />
              </Route>
            </Routes>
          </MemoryRouter>
        );
      });

      expect(consoleWarn).not.toHaveBeenCalled();
    });
  });
});
