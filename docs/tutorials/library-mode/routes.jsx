import React from 'react';
import { createBrowserRouter } from 'react-router-dom';
import Layout from './components/Layout';

const Home = React.lazy(() => import('./pages/Home'));
const About = React.lazy(() => import('./pages/About'));
const UserProfile = React.lazy(() => import('./pages/UserProfile'));

export const router = createBrowserRouter([
  {
    path: '/',
    Component: Layout,
    children: [
      { path: '/', Component: Home },
      { path: '/about', Component: About },
      { path: '/user/profile', Component: UserProfile },
    ],
  },
]);
