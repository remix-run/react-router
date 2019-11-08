import React from 'react';
import { create as createTestRenderer } from 'react-test-renderer';
import {
  Redirect,
  MemoryRouter as Router,
  Route,
  Routes,
  useParams
} from 'react-router';

describe('A <Redirect> in a route config', () => {
  it('redirects to the right location', () => {
    function About() {
      return <h1>About</h1>;
    }

    let renderer = createTestRenderer(
      <Router initialEntries={['/contact-us']}>
        <Routes>
          <Route path="about" element={<About />} />
          <Redirect from="contact-us" to="about" />
        </Routes>
      </Router>
    );

    expect(renderer.toJSON()).toMatchInlineSnapshot(`
      <h1>
        About
      </h1>
    `);
  });

  describe('using a URL param', () => {
    it('redirects to the right location', () => {
      function User() {
        let { id } = useParams();
        return <h1>User {id}</h1>;
      }

      let renderer = createTestRenderer(
        <Router initialEntries={['/profile/michael']}>
          <Routes>
            <Route path="user/:id" element={<User />} />
            <Redirect from="profile/:id" to="user/:id" />
          </Routes>
        </Router>
      );

      expect(renderer.toJSON()).toMatchInlineSnapshot(`
        <h1>
          User 
          michael
        </h1>
      `);
    });
  });
});
