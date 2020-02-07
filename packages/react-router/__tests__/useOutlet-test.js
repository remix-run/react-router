import React from 'react';
import { create as createTestRenderer } from 'react-test-renderer';
import { MemoryRouter as Router, Routes, Route, useOutlet } from 'react-router';

describe('useOutlet', () => {
  describe('when there is no child route', () => {
    it('returns null', () => {
      function Home() {
        return useOutlet();
      }

      let renderer = createTestRenderer(
        <Router initialEntries={['/home']}>
          <Routes>
            <Route path="/home" element={<Home />} />
          </Routes>
        </Router>
      );

      expect(renderer.toJSON()).toBeNull();
    });
  });

  describe('when there is a child route', () => {
    it('returns an element', () => {
      function Users() {
        return useOutlet();
      }

      function Profile() {
        return <p>Profile</p>;
      }

      let renderer = createTestRenderer(
        <Router initialEntries={['/users/profile']}>
          <Routes>
            <Route path="users" element={<Users />}>
              <Route path="profile" element={<Profile />} />
            </Route>
          </Routes>
        </Router>
      );

      expect(renderer.toJSON()).toMatchSnapshot();
    });
  });
});
