After reading the [layouts](layouts.md) and [not-found](not-found.md) guides, follow this guide to polish up your app with route configuration objects.


Below is the full code in Typescript, complete with nested urls in case you like to have complicated paths in your app. 

Note that in order to have each sub-page render properly, you must specify its url as nesting Route components beyond 2 levels will only point to the parent
component at the 2nd level, which is why the last two urls in the config cannot be created as children of the Route component that will receive 'test' as its path.

```
import React from 'react';
import Layout from './components/Layout';
import {
  BrowserRouter as Router,
  Routes,
  Route,
} from 'react-router-dom';
import NotFound from './components/Router/NotFound';

export interface RouteConfig {
  path: string;
  component: any;
  routes?: RouteConfig[];
}

const routeConfig: RouteConfig[] = [
  {
    path: '/',
    component: <div>Home</div>,
  },
  {
    path: '/invoices',
    component: <div>Invoices</div>,
  },
  {
    path: '/dashboard',
    component: <div>Dashboard</div>,
  },
  {
    path: '/test',
    component: <div>Test</div>,
  },
  {
    path: '/test/nested',
    component: <div>Nested</div>,
  },
  {
    path: '/test/nested/deep',
    component: <div>Deeply Nested</div>,
  },
];

const App: React.FC = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Layout />}>
          {routeConfig.map(route => (
            <Route
              path={route.path}
              element={route.component}
              key={route.path}
            />
          ))}
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </Router>
  );
};

export default App;

```
