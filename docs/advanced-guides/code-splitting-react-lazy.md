# Code Splitting with React.lazy

When a user visits a route on your website, they don't want to download the code for other routes at the same time. JavaScript bundlers, like Webpack or Parcel, can automatically split your code into smaller bundles based on the routes in your app. Bundlers look for any time you use the dynamic import (`import("./myModule")`) and use it as a signal that you want to code split that module from the rest of the bundle.

Code splitting has [first-class support in React](https://reactjs.org/docs/code-splitting.html#code-splitting) using the built-in [React.lazy](https://reactjs.org/docs/code-splitting.html#reactlazy) wrapper.

React Router supports lazy-loaded components out of the box.

# With `React.lazy`

Suppose you have a component file that looks like this:

```js
import * as React from 'react';
import { Routes, Route } from 'react-router-dom';

import About from './about';
import Users from './users';
import User from './user';

const App = () => {
  return (
    <Routes>
      <Route path="/about" element={<About />} />
      <Route path="/users" element={<Users />}>
        <Route path="user" element={<User />} />
      </Route>
    </Routes>
  );
};

export default App;
```

If the user were to navigate to `/about`, their browser would download all the code for the `<Users />` and `<User />` components as well. That would decrease the speed of the page load and if your user were on a cellular connection would use up more of their precious data.

To solve this with `React.lazy`, we have to change our imports to be dynamic imports, wrap those imports in `React.lazy`, and add a `React.Suspense` boundary around our routes so React knows what to render while our route is loading.

```js
const About = React.lazy(() => import('./about'));
const Users = React.lazy(() => import('./users'));
const User = React.lazy(() => import('./user'));

const App = () => {
  return (
    <React.Suspense fallback={<h1>Loading All Routes</h1>}>
      <Routes>
        <Route path="/about" element={<About />} />
        <Route path="/users" element={<Users />}>
          <Route path="user" element={<User />} />
        </Route>
      </Routes>
    </React.Suspense>
  );
};
```

Now, if the browser hasn't downloaded the necessary bundle the component, React will show the Suspense fallback. Once the bundle loads, React will re-render and show our component.

This works fine, but isn't ideal. For example, if the user were to visit `/users/1` after already visiting `/users`, the entire app would be replaced with the top-most Suspense fallback. What if we were to wrap the `<User/>` component in its own Suspense boundary? That would make it so the `<Users/>` component would remain mounted while the `<User/>` component loads.

```js
const App = () => {
  return (
    <React.Suspense fallback={<h1>Loading All Routes</h1>}>
      <Routes>
        <Route path="/about" element={<About />} />
        <Route path="/users" element={<Users />}>
          <Route
            path="user"
            element={
              <React.Suspense fallback={<h1>Loading User Route</h1>}>
                <User />
              </React.Suspense>
            }
          />
        </Route>
      </Routes>
    </React.Suspense>
  );
};
```

Alternatively, you can put the Suspense boundary around the `<Outlet>` component in the `<Users />` component to suspend any child routes as they load.

```js
const Users = () => {
  return (
    <div>
      <h1>Users Page</h1>
      <ul>
        <li>
          <Link to="1">User 1</Link>
        </li>
        <li>
          <Link to="2">User 2</Link>
        </li>
        <li>
          <Link to="3">User 3</Link>
        </li>
      </ul>
      <div>
        <React.Suspense fallback={<h2>Loading Child Route</h2>}>
          <Outlet />
        </React.Suspense>
      </div>
    </div>
  );
};
```

Perfect. You can [view this demo in CodeSandbox](https://codesandbox.io/s/react-router-reactlazy-jw2jl).

It is important to remember that `React.lazy` only supports default exported components. If you want to [use named exports](https://reactjs.org/docs/code-splitting.html#named-exports) you have to do a little bit more work.
