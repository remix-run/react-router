# Testing

React Router relies on React context to work. This affects how you can
test your components that use our components.

## Context

If you try to unit test one of your components that renders a `<Link>` or a `<Route>`, etc. you'll get some errors and warnings about context. While you may be tempted to stub out the router context yourself, we recommend you wrap your unit test in one of the `Router` components: the base `Router` with a `history` prop, or a `<StaticRouter>`, `<MemoryRouter>`, or `<BrowserRouter>` (if `window.history` is available as a global in the test enviroment).

Using `MemoryRouter` or a custom `history` is recommended in order to be able to reset the router between tests.

```jsx
class Sidebar extends Component {
  // ...
  render() {
    return (
      <div>
        <button onClick={this.toggleExpand}>expand</button>
        <ul>
          {users.map(user => (
            <li>
              <Link to={user.path}>{user.name}</Link>
            </li>
          ))}
        </ul>
      </div>
    );
  }
}

// broken
test("it expands when the button is clicked", () => {
  render(<Sidebar />);
  click(theButton);
  expect(theThingToBeOpen);
});

// fixed!
test("it expands when the button is clicked", () => {
  render(
    <MemoryRouter>
      <Sidebar />
    </MemoryRouter>
  );
  click(theButton);
  expect(theThingToBeOpen);
});
```

## Starting at specific routes

`<MemoryRouter>` supports the `initialEntries` and `initialIndex` props,
so you can boot up an app (or any smaller part of an app) at a specific
location.

```jsx
test("current user is active in sidebar", () => {
  render(
    <MemoryRouter initialEntries={["/users/2"]}>
      <Sidebar />
    </MemoryRouter>
  );
  expectUserToBeActive(2);
});
```

## Navigating

We have a lot of tests that the routes work when the location changes, so you probably don't need to test this stuff. But if you need to test navigation within your app, you can do so like this:

```jsx
// app.js (a component file)
import React from "react";
import { Route, Link } from "react-router-dom";

// our Subject, the App, but you can test any sub
// section of your app too
const App = () => (
  <div>
    <Route
      exact
      path="/"
      render={() => (
        <div>
          <h1>Welcome</h1>
        </div>
      )}
    />
    <Route
      path="/dashboard"
      render={() => (
        <div>
          <h1>Dashboard</h1>
          <Link to="/" id="click-me">
            Home
          </Link>
        </div>
      )}
    />
  </div>
);
```

```jsx
// you can also use a renderer like "@testing-library/react" or "enzyme/mount" here
import { render, unmountComponentAtNode } from "react-dom";
import { act } from 'react-dom/test-utils';
import { MemoryRouter } from "react-router-dom";

// app.test.js
it("navigates home when you click the logo", async => {
  // in a real test a renderer like "@testing-library/react"
  // would take care of setting up the DOM elements
  const root = document.createElement('div');
  document.body.appendChild(root);

  // Render app
  render(
    <MemoryRouter initialEntries={['/my/initial/route']}>
      <App />
    <MemoryRouter>,
    root
  );

  // Interact with page
  act(() => {
    // Find the link (perhaps using the text content)
    const goHomeLink = document.querySelector('#nav-logo-home');
    // Click it
    goHomeLink.dispatchEvent(new MouseEvent("click", { bubbles: true }));
  });

  // Check correct page content showed up
  expect(document.body.textContent).toBe('Home');
});
```

## Checking location in tests

You shouldn't have to access the `location` or `history` objects very often in tests, but if you do (such as to validate that new query params are set in the url bar), you can add a route that updates a variable in the test:

```jsx
// app.test.js
test("clicking filter links updates product query params", () => {
  let history, location;
  render(
    <MemoryRouter initialEntries={["/my/initial/route"]}>
      <App />
      <Route
        path="*"
        render={({ history, location }) => {
          history = history;
          location = location;
          return null;
        }}
      />
    </MemoryRouter>,
    node
  );

  act(() => {
    // example: click a <Link> to /products?id=1234
  });

  // assert about url
  expect(location.pathname).toBe("/products");
  const searchParams = new URLSearchParams(location.search);
  expect(searchParams.has("id")).toBe(true);
  expect(searchParams.get("id")).toEqual("1234");
});
```

### Alternatives

1. You can also use `BrowserRouter` if your test environment has the browser globals `window.location` and `window.history` (which is the default in Jest through JSDOM, but you cannot reset the history between tests).
1. Instead of passing a custom route to MemoryRouter, you can use the base `Router` with a `history` prop from the [`history`](https://github.com/ReactTraining/history) package:

```jsx
// app.test.js
import { createMemoryHistory } from "history";
import { Router } from "react-router";

test("redirects to login page", () => {
  const history = createMemoryHistory();
  render(
    <Router history={history}>
      <App signedInUser={null} />
    </Router>,
    node
  );
  expect(history.location.pathname).toBe("/login");
});
```

## React Testing Library

See an example in the official documentation: [Testing React Router with React Testing Library](https://testing-library.com/docs/example-react-router)
