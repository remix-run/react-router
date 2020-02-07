import React from 'react';
import { create as createTestRenderer } from 'react-test-renderer';
import { MemoryRouter as Router, Routes, Route, useMatch } from 'react-router';

describe('useMatch', () => {
  describe('when the to value matches the current URL', () => {
    it('returns true', () => {
      let match;
      function Layout() {
        match = useMatch('home');
        return null;
      }

      function Home() {
        return <h1>Home</h1>;
      }

      createTestRenderer(
        <Router initialEntries={['/home']}>
          <Routes>
            <Route path="/" element={<Layout />}>
              <Route path="/home" element={<Home />} />
            </Route>
          </Routes>
        </Router>
      );

      expect(match).toBe(true);
    });
  });

  describe('when the to value does not match the current URL', () => {
    it('returns false', () => {
      let match;
      function Layout() {
        match = useMatch('about');
        return null;
      }

      function Home() {
        return <h1>Home</h1>;
      }

      function About() {
        return <h1>About</h1>;
      }

      createTestRenderer(
        <Router initialEntries={['/home']}>
          <Routes>
            <Route path="/" element={<Layout />}>
              <Route path="/home" element={<Home />} />
              <Route path="/about" element={<About />} />
            </Route>
          </Routes>
        </Router>
      );

      expect(match).toBe(false);
    });
  });
});
