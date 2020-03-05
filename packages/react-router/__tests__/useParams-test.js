import React from 'react';
import { create as createTestRenderer } from 'react-test-renderer';
import {
  MemoryRouter as Router,
  Outlet,
  Routes,
  Route,
  useParams
} from 'react-router';

describe('useParams', () => {
  describe("when the route isn't matched", () => {
    it('returns an empty object', () => {
      let params;
      function Home() {
        params = useParams();
        return null;
      }

      createTestRenderer(
        <Router initialEntries={['/home']}>
          <Home />
        </Router>
      );

      expect(typeof params).toBe('object');
      expect(Object.keys(params)).toHaveLength(0);
    });
  });

  describe('when the path has no params', () => {
    it('returns an empty object', () => {
      let params;
      function Home() {
        params = useParams();
        return null;
      }

      createTestRenderer(
        <Router initialEntries={['/home']}>
          <Routes>
            <Route path="/home" element={<Home />} />
          </Routes>
        </Router>
      );

      expect(typeof params).toBe('object');
      expect(Object.keys(params)).toHaveLength(0);
    });
  });

  describe('when the path has some params', () => {
    it('returns an object of the URL params', () => {
      let params;
      function BlogPost() {
        params = useParams();
        return null;
      }

      createTestRenderer(
        <Router initialEntries={['/blog/react-router']}>
          <Routes>
            <Route path="/blog/:slug" element={<BlogPost />} />
          </Routes>
        </Router>
      );

      expect(typeof params).toBe('object');
      expect(params).toMatchObject({
        slug: 'react-router'
      });
    });

    describe('a child route', () => {
      it('returns a combined hash of the parent and child params', () => {
        let params;

        function Course() {
          params = useParams();
          return null;
        }

        function UserDashboard() {
          return (
            <div>
              <h1>User Dashboard</h1>
              <Outlet />
            </div>
          );
        }

        createTestRenderer(
          <Router initialEntries={['/users/mjackson/courses/react-router']}>
            <Routes>
              <Route path="users/:username" element={<UserDashboard />}>
                <Route path="courses/:course" element={<Course />} />
              </Route>
            </Routes>
          </Router>
        );

        expect(typeof params).toBe('object');
        expect(params).toMatchObject({
          username: 'mjackson',
          course: 'react-router'
        });
      });
    });
  });

  describe('when the path has percent-encoded params', () => {
    it('returns an object of the decoded params', () => {
      let params;
      function BlogPost() {
        params = useParams();
        return null;
      }

      createTestRenderer(
        <Router initialEntries={['/blog/react%20router']}>
          <Routes>
            <Route path="/blog/:slug" element={<BlogPost />} />
          </Routes>
        </Router>
      );

      expect(typeof params).toBe('object');
      expect(params).toMatchObject({
        slug: 'react router'
      });
    });
  });

  describe('when the path has a + character', () => {
    it('returns an object of the decoded params', () => {
      let params;
      function BlogPost() {
        params = useParams();
        return null;
      }

      createTestRenderer(
        <Router initialEntries={['/blog/react+router+is%20awesome']}>
          <Routes>
            <Route path="/blog/:slug" element={<BlogPost />} />
          </Routes>
        </Router>
      );

      expect(typeof params).toBe('object');
      expect(params).toMatchObject({
        slug: 'react router is awesome'
      });
    });
  });

  describe('when the path has a malformed param', () => {
    it('returns the raw value and warns', () => {
      let spy = jest.spyOn(console, 'warn').mockImplementation(() => {});

      let params;
      function BlogPost() {
        params = useParams();
        return null;
      }

      createTestRenderer(
        <Router initialEntries={['/blog/react%2router']}>
          <Routes>
            <Route path="/blog/:slug" element={<BlogPost />} />
          </Routes>
        </Router>
      );

      expect(typeof params).toBe('object');
      expect(params).toMatchObject({
        slug: 'react%2router'
      });

      expect(spy).toHaveBeenCalledWith(
        expect.stringMatching('malformed URL segment')
      );

      spy.mockRestore();
    });
  });
});
