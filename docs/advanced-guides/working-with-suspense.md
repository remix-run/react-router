# Working with Suspense

Starting in React Router version 6 it gets really easy to use `Suspense` for lazy loading components or data (currently not officially supported).

## How to use it

In React Router version 6 we have a new component called `Outlet` that represents a child route in its parent route. Let's look at an example:
```js
import React, { lazy } from "react"
import {
  BrowserRouter,
  Routes,
  Route,
  Outlet
} from "react-router-dom";

const ShowPage = lazy(() => import("users/show.js"));
const EditPage = lazy(() => import("users/edit.js"));
const IndexPage = lazy(() => import("users/index.js"));

// app.js
function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="users" element={<UsersPage />}>
          <Route path=":id" element={<ShowPage />} />
          <Route path=":id/edit" element={<EditPage />} />
          <Route path="" element={<IndexPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

// users.js
function UsersPage() {
  return (
    <>
      <h1>Users</h1>

      <Suspense fallback={<span>Loading ...</span>}>
        <Outlet />
      </Suspense>
    </>
  );
}

```
React Router will lazily load `ShowPage`, `EditPage`, and `IndexPage` when they are requested, and will display them at the position where `Outlet` is placed.

While their files are loaded, a fallback will be displayed until the sub-routes are ready to use.
