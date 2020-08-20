import * as React from 'react';
import { create as createTestRenderer } from 'react-test-renderer';
import { MemoryRouter as Router, useRoutes } from 'react-router';

describe('useRoutes', () => {
  function Home() {
    return <h1>Home</h1>;
  }

  function About() {
    return <h1>About</h1>;
  }

  it('returns the matching element from a route config', () => {
    function RoutesRenderer({ routes }) {
      return useRoutes(routes);
    }

    let routes = [
      { path: 'home', element: <Home /> },
      { path: 'about', element: <About /> }
    ];

    let renderer = createTestRenderer(
      <Router initialEntries={['/home']}>
        <RoutesRenderer routes={routes} />
      </Router>
    );

    expect(renderer.toJSON()).toMatchSnapshot();
  });

  it('accepts `basename` as optional parameter', () => {
    function RoutesRenderer({ routes }) {
      return useRoutes(routes, {
        basename: '/parent'
      });
    }

    let routes = [
      { path: 'home', element: <Home /> },
      { path: 'about', element: <About /> }
    ];

    let renderer = createTestRenderer(
      <Router initialEntries={['/parent/home']}>
        <RoutesRenderer routes={routes} />
      </Router>
    );

    expect(renderer.toJSON()).toMatchSnapshot();
  });

  it('accepts `location` as optional parameter', () => {
    let location = {
      pathname: '/about'
    };

    function RoutesRenderer({ routes }) {
      return useRoutes(routes, {
        location: location
      });
    }

    let routes = [
      { path: 'home', element: <Home /> },
      { path: 'about', element: <About /> }
    ];

    let renderer = createTestRenderer(
      <Router initialEntries={['/home']}>
        <RoutesRenderer routes={routes} />
      </Router>
    );

    expect(renderer.toJSON()).toMatchSnapshot();
  });
});
