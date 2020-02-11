import React from 'react';
import { create as createTestRenderer } from 'react-test-renderer';
import { MemoryRouter as Router, Routes, Route, useMatch, useRouteMatch } from 'react-router';

describe('useRouteMatch', () => {
  describe('when the to value matches the current URL', () => {
    it('returns params and pathname', () => {
      let routeMatch;

      function User() {
        routeMatch = useRouteMatch(':tab');
        return null;
      }

      function Home() {
        return <h1>Home</h1>;
      }

      function Profile() {
        return <h1>Home</h1>;
      }

      function Projects() {
        return <h1>Projects</h1>;
      }

      createTestRenderer(
        <Router initialEntries={['/user/10/profile']}>
          <Routes>
            <Route path="home" element={<Home/>}/>
            <Route path="/user/:id/*" element={<User/>}>
              <Route path="profile" element={<Profile/>}/>
              <Route path="projects" element={<Projects/>}/>
            </Route>
          </Routes>
        </Router>
      );

      expect(routeMatch.params.id).toBe('10');
      expect(routeMatch.params.tab).toBe('profile');
      expect(routeMatch.params['*']).toBe('profile');
      expect(routeMatch.pathname).toBe('/user/10/profile');
    });
  });

  describe('when the to value matches the current URL', () => {
    it('returns params and pathname', () => {
      let routeMatch;

      function User() {
        routeMatch = useRouteMatch(':tab/*');
        return null;
      }

      function Home() {
        return <h1>Home</h1>;
      }

      function Profile() {
        return <h1>Home</h1>;
      }

      function Projects() {
        return <h1>Projects</h1>;
      }

      createTestRenderer(
        <Router initialEntries={['/user/10/profile/details']}>
          <Routes>
            <Route path="home" element={<Home/>}/>
            <Route path="/user/:id/*" element={<User/>}>
              <Route path="profile" element={<Profile/>}/>
              <Route path="projects" element={<Projects/>}/>
            </Route>
          </Routes>
        </Router>
      );

      expect(routeMatch.params.id).toBe('10');
      expect(routeMatch.params.tab).toBe('profile');
      expect(routeMatch.params['*']).toBe('details');
      expect(routeMatch.pathname).toBe('/user/10/profile');
    });
  });

  describe('when the to value does not match the current URL', () => {
    it('returns null', () => {
      let routeMatch;

      function User() {
        routeMatch = useRouteMatch(':tab');
        return null;
      }

      function Home() {
        return <h1>Home</h1>;
      }

      function Profile() {
        return <h1>Home</h1>;
      }

      function Projects() {
        return <h1>Projects</h1>;
      }

      createTestRenderer(
        <Router initialEntries={['/user/10']}>
          <Routes>
            <Route path="home" element={<Home/>}/>
            <Route path="/user/:id/*" element={<User/>}>
              <Route path="profile" element={<Profile/>}/>
              <Route path="projects" element={<Projects/>}/>
            </Route>
          </Routes>
        </Router>
      );


      expect(routeMatch).toBe(null);
    });
  });
});
