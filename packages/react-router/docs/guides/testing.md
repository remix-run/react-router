# Testing

React Router relies on React context to work. This affects how you can
test your components that use our components.

## Context

If you try to unit test one of your components that renders a `<Link>` or a `<Route>`, etc. you'll get some errors and warnings about context. While you may be tempted to stub out the router context yourself, we recommend you wrap your unit test in a `<StaticRouter>`, `<MemoryRouter>`, or `<BrowserRouter>` (if browser globals like `window` are available in the test). Check it out:

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

That's all there is to it.

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

> Note
> 
> The example assumes your test includes browser globals. This is the default in [Jest](https://jestjs.io)
> and any other testing environment that includes [JSDOM](https://github.com/jsdom/jsdom).

```jsx
import React from "react";
import { Route, Link, BrowserRouter } from "react-router-dom";
// you can also use a renderer like "@testing-library/react" or "enzyme/mount" here
import { render, unmountComponentAtNode } from "react-dom";
import { act } from 'react-dom/test-utils';

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

// the actual test!
it("navigates home when you click the logo", async => {
  // in a real test a renderer like "@testing-library/react"
  // would take care of setting up the DOM elements
  const root = document.createElement('div')
  document.body.appendChild(root);
  
  // Set initial location
  window.history.pushState({}, '', '/my/initial/route');
  
  // Render app
  render(
    <BrowserRouter>
      <App />
    <BrowserRouter>,
    root
  )
  
  // Interact with page
  act(() => {
    // Find the link (perhaps using the text content)
    const goHomeLink = document.querySelector('#nav-logo-home');
    // Click it
    goHomeLink.dispatchEvent(new MouseEvent("click", { bubbles: true }));
  });
  
  // Assert about new location
  expect(window.location.pathname).toBe('/homepage');
  
  // Check correct page content showed up
  expect(document.body.textContent).toBe('Home')
});
```
