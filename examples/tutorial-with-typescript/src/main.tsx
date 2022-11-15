import React from 'react';
import ReactDOM from 'react-dom/client';
import { createBrowserRouter, RouteObject, RouterProvider } from 'react-router-dom';

import { ErrorPage } from './pages/Error/Index';
import { Index as Contacts, loader as contactsLoader } from './pages/Contacts/Index';
import { ContactDetails, loader as contactDetailsLoader, action as contactDetailsAction } from './pages/Contacts/contactId';
import { ContactCreate, action as contactCreateAction } from './pages/Contacts/create';
import { ContactEdit, loader as contactEditLoader, action as contactEditAction } from './pages/Contacts/edit';
import { action as contactDeleteAction, errorElement as ContactDeleteErrorElement } from './pages/Contacts/delete';
import { Root } from './pages/root';

import './index.css';

const root = document.getElementById('root');

if (!root) {
  throw new Error('Root element is not defined');
}

const routes: RouteObject[] = [
  {
    path: '/',
    element: <Root />,
    errorElement: <ErrorPage />,
    children: [
      {
        path: '/',
        element: <Contacts />,
        loader: contactsLoader,
        children: [
          {
            path: 'contacts/create',
            element: <ContactCreate />,
            action: contactCreateAction,
          },
          {
            path: 'contacts/:contactId',
            element: <ContactDetails />,
            loader: contactDetailsLoader,
            action: contactDetailsAction,
            children: [
              {
                path: 'delete',
                action: contactDeleteAction,
                errorElement: <ContactDeleteErrorElement />
              }

            ]
          },
          {
            path: 'contacts/:contactId/edit',
            element: <ContactEdit />,
            loader: contactEditLoader,
            action: contactEditAction,
          },
        ]
      },
    ]
  },
];

const router = createBrowserRouter(routes);

ReactDOM.createRoot(root).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>
)
