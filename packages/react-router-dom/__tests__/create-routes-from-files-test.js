import path from 'path';

import React from 'react';
import { act, create as createTestRenderer } from 'react-test-renderer';
import { useRoutes } from 'react-router-dom';
import {
  StaticRouter as Router,
  createRoutesFromFiles
} from 'react-router-dom/server';

const routesDir = path.resolve(__dirname, '__fixtures__/routes');

describe('createRoutesFromFiles', () => {
  it('creates a nested route config', () => {
    let routes = createRoutesFromFiles(routesDir);
    expect(routes).toMatchSnapshot();
  });

  it('is able to render the result', () => {
    let routes = createRoutesFromFiles(routesDir);

    function App() {
      return useRoutes(routes);
    }

    let renderer;
    act(() => {
      renderer = createTestRenderer(
        <Router location="/messages/123">
          <App />
        </Router>
      );
    });

    expect(renderer.toJSON()).toMatchSnapshot();
  });
});
