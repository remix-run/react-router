import * as React from 'react';
import { create as createTestRenderer } from 'react-test-renderer';
import {
  MemoryRouter as Router,
  Routes,
  Route,
  Outlet,
  useHref
} from 'react-router';

describe('useHref', () => {
  describe('to a child route', () => {
    it('returns the correct href', () => {
      let href;
      function Courses() {
        href = useHref('advanced-react');
        return <h1>Courses</h1>;
      }

      createTestRenderer(
        <Router initialEntries={['/courses']}>
          <Routes>
            <Route path="courses" element={<Courses />} />
          </Routes>
        </Router>
      );

      expect(href).toBe('/courses/advanced-react');
    });

    describe('when the URL has a trailing slash', () => {
      it('returns the correct href', () => {
        let href;
        function Courses() {
          href = useHref('advanced-react');
          return <h1>Courses</h1>;
        }

        createTestRenderer(
          <Router initialEntries={['/courses/']}>
            <Routes>
              <Route path="courses" element={<Courses />} />
            </Routes>
          </Router>
        );

        expect(href).toBe('/courses/advanced-react');
      });
    });

    describe('when the href has a trailing slash', () => {
      it('returns the correct href', () => {
        let href;
        function Courses() {
          href = useHref('advanced-react/');
          return <h1>Courses</h1>;
        }

        createTestRenderer(
          <Router initialEntries={['/courses']}>
            <Routes>
              <Route path="courses" element={<Courses />} />
            </Routes>
          </Router>
        );

        expect(href).toBe('/courses/advanced-react/');
      });
    });
  });

  describe('to a sibling route', () => {
    it('returns the correct href', () => {
      let href;
      function Courses() {
        href = useHref('../about');
        return <h1>Courses</h1>;
      }

      createTestRenderer(
        <Router initialEntries={['/courses']}>
          <Routes>
            <Route path="courses" element={<Courses />} />
          </Routes>
        </Router>
      );

      expect(href).toBe('/about');
    });

    describe('when the URL has a trailing slash', () => {
      it('returns the correct href', () => {
        let href;
        function Courses() {
          href = useHref('../about');
          return <h1>Courses</h1>;
        }

        createTestRenderer(
          <Router initialEntries={['/courses/']}>
            <Routes>
              <Route path="/courses/" element={<Courses />} />
            </Routes>
          </Router>
        );

        expect(href).toBe('/about');
      });
    });

    describe('when the href has a trailing slash', () => {
      it('returns the correct href', () => {
        let href;
        function Courses() {
          href = useHref('../about/');
          return <h1>Courses</h1>;
        }

        createTestRenderer(
          <Router initialEntries={['/courses']}>
            <Routes>
              <Route path="courses" element={<Courses />} />
            </Routes>
          </Router>
        );

        expect(href).toBe('/about/');
      });
    });
  });

  describe('to a parent route', () => {
    it('returns the correct href', () => {
      let href;
      function AdvancedReact() {
        href = useHref('..');
        return <h1>Advanced React</h1>;
      }

      createTestRenderer(
        <Router initialEntries={['/courses/advanced-react']}>
          <Routes>
            <Route path="courses/advanced-react" element={<AdvancedReact />} />
          </Routes>
        </Router>
      );

      expect(href).toBe('/courses');
    });

    describe('when the URL has a trailing slash', () => {
      it('returns the correct href', () => {
        let href;
        function AdvancedReact() {
          href = useHref('..');
          return <h1>Advanced React</h1>;
        }

        createTestRenderer(
          <Router initialEntries={['/courses/advanced-react/']}>
            <Routes>
              <Route
                path="courses/advanced-react"
                element={<AdvancedReact />}
              />
            </Routes>
          </Router>
        );

        expect(href).toBe('/courses');
      });
    });

    describe('when the href has a trailing slash', () => {
      it('returns the correct href', () => {
        let href;
        function AdvancedReact() {
          href = useHref('../');
          return <h1>Advanced React</h1>;
        }

        createTestRenderer(
          <Router initialEntries={['/courses/advanced-react']}>
            <Routes>
              <Route
                path="courses/advanced-react"
                element={<AdvancedReact />}
              />
            </Routes>
          </Router>
        );

        expect(href).toBe('/courses/');
      });
    });
  });

  describe('with a to value that has more .. segments than are in the URL', () => {
    it('returns the correct href', () => {
      function Courses() {
        return (
          <div>
            <h1>Courses</h1>
            <Outlet />
          </div>
        );
      }

      let href;
      function ReactFundamentals() {
        href = useHref('../../../courses');
        return <p>React Fundamentals</p>;
      }

      createTestRenderer(
        <Router initialEntries={['/courses/react-fundamentals']}>
          <Routes>
            <Route path="courses" element={<Courses />}>
              <Route
                path="react-fundamentals"
                element={<ReactFundamentals />}
              />
            </Route>
          </Routes>
        </Router>
      );

      expect(href).toBe('/courses');
    });

    describe('and no additional segments', () => {
      it('links to the root /', () => {
        let href;
        function Home() {
          href = useHref('../../..');
          return <h1>Home</h1>;
        }

        createTestRenderer(
          <Router initialEntries={['/home']}>
            <Routes>
              <Route path="/home" element={<Home />} />
            </Routes>
          </Router>
        );

        expect(href).toBe('/');
      });
    });
  });
});
