# Testing With React Testing Library (RTL)

`react-testing-library` is a lightweight family of packages that help us test UI components in a manner that resembles the way users interact with our applications.

To quote their (very excellent) documentation:

    The more your tests resemble the way your software is used, the more confidence they can give you.

https://testing-library.com/docs/intro

## Getting Setup

This guide assumes you followed the instructions for [Adding React Router via Create React App](../../installation/add-to-a-website.md#create-react-app). If you did not start with Create React App, but still have the same application structure, you can install [React Testing Library](https://testing-library.com/docs/react-testing-library/intro) by following [their installation guide](https://github.com/testing-library/react-testing-library#installation).

## Basic Test

A basic rendering test ensures that we have everything installed and set up correctly. Fortunately, RTL gives us the tools to accomplish this.

Since we've wrapped our `HomePage` (renamed from `App` after following the aforementioned instructions)  component in the `Router` in our `index.js` file, we do have to wrap it around each of our individual component tests, otherwise `history` will be undefined. If the `Router` had been inside of our `App`, then we would not have to wrap it inside of our tests.

A recommended test to ensure basic functionality looks like the following:

```jsx
import React from 'react';
import { render, screen } from '@testing-library/react';
import HomePage from './HomePage';
import { BrowserRouter as Router } from 'react-router-dom';

test('<HomePage /> renders successfully', () => {
  render(<HomePage />, { wrapper: Router });
  const header = screen.getByText('Welcome to React Router!');
  expect(header).toBeInTheDocument();
});
```

This test ensures that the `App` component renders, and that the `h1` we added during the setup guide exists in the document.

## Testing Links and Navigation

`react-router` has a lot of tests verifying that the routes work when the location changes, so you probably don't need to test this stuff.

If you need to test navigation within your app, you can do so by firing a click event on the link itself and asserting that the path changed to the expected value.

This is accomplished like so:

```jsx
import React from 'react';
import { render, fireEvent, screen } from '@testing-library/react';
import HomePage from './HomePage';
import { BrowserRouter as Router } from 'react-router-dom';

it('navigates to /about', () => {
  render(<HomePage />, { wrapper: Router });

  const aboutLink = screen.getByText('About');
  fireEvent.click(aboutLink);

  expect(window.location.pathname).toBe('/about');
});
```

Since our setup guide then replaces the about link with a link back to the home page, we can test navigating back to the home page by triggering another click, this time on the home link:

```jsx
import React from 'react';
import { render, fireEvent, screen } from '@testing-library/react';
import HomePage from './HomePage';
import { BrowserRouter as Router } from 'react-router-dom';

it('navigates to /about and back to /', () => {
  render(<HomePage />, { wrapper: Router });

  const aboutLink = screen.getByText('About');
  fireEvent.click(aboutLink);

  expect(window.location.pathname).toBe('/about');

  const homeLink = screen.getByText('Home');
  fireEvent.click(homeLink);

  expect(window.location.pathname).toBe('/');
});
```

This test will initially fail if it is run immediately after the previous test. This is because the history stack still thinks we are on the about page. To fix this, we can use Jest's `beforeEach` function to replace our history state using: `window.history.replaceState({}, '', '/');`. This makes `react-router` think that we are on the home page when we start each test. Now, all three tests should be passing when run together.

Below is the full file with all of the tests together:

```jsx
import React from 'react';
import { render, fireEvent, screen } from '@testing-library/react';
import HomePage from './HomePage';
import { BrowserRouter as Router } from 'react-router-dom';

beforeEach(() => {
  window.history.replaceState({}, '', '/');
});

test('<HomePage /> renders successfully', () => {
  render(<HomePage />, { wrapper: Router });
  const header = screen.getByText('Welcome to React Router!');
  expect(header).toBeInTheDocument();
});

it('navigates to /about', () => {
  render(<HomePage />, { wrapper: Router });

  const aboutLink = screen.getByText('About');
  fireEvent.click(aboutLink);

  expect(window.location.pathname).toBe('/about');
});

it('navigates to /about and back to /', () => {
  render(<HomePage />, { wrapper: Router });

  const aboutLink = screen.getByText('About');
  fireEvent.click(aboutLink);

  expect(window.location.pathname).toBe('/about');

  const homeLink = screen.getByText('Home');
  fireEvent.click(homeLink);

  expect(window.location.pathname).toBe('/');
});
```

## Testing Routes and Redirects

Let's say that we've built a redirect component that deals with re-routing the user from `/the-old-thing` to `/the-new-thing`

`RedirectHandler.js`
```jsx
import React from 'react'
import {Route, Switch, Redirect} from 'react-router-dom'

const RedirectHandler = props => (
  <Switch>
    <Redirect from="/the-old-thing" to="the-new-thing">
  </Switch>
)

export default RedirectHandler
```

And here we have one method of testing that the redirect is behaving as expected.

`RedirectHandler.test.js`
```jsx
import React from 'react'
import {MemoryRouter, Route} from 'react-router-dom'
import { render, fireEvent, screen } from '@testing-library/react';
import RedirectHandler from './RedirectHandler'

it('redirects /the-old-thing to /the-new-thing', () => {
  render(
    <MemoryRouter initialEntries={["/the-old-thing"]}>
      <Route component={RedirectHandler}>
    </MemoryRouter>
  )

  expect(window.location.pathname).toBe("/the-new-thing")
})

```

This test initializes the `MemoryRouter` with an initial path of `/the-old-thing` and verifies that the `RedirectHandler` correctly changes the path to `/the-new-thing`
