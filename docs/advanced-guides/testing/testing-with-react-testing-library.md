# Testing With React Test Library (RTL)

## Getting Setup

This guide assumes you followed the instructions for [Adding React Router via Create React App](../../installation/add-to-a-website.md#create-react-app). If you did not start with Create React App, but still have the same application structure, you can install [React Testing Library](https://testing-library.com/docs/react-testing-library/intro) by following [their installation guide](https://github.com/testing-library/react-testing-library#installation).

## Basic Test

A basic rendering test can be important to esnure that we have everything installed and set up correctly. Fortunately, this is easy to do with RTL.

Since we've wrapped our `App` component in the `Router` in our `index.js` file, we do have to wrap it in each of our isolated component tests, otherwise `history` will be undefined. If the `Router` had been inside of our `App`, then we would not have to wrap it inside of our tests.

A recommended simple test looks like the following:

```jsx
test('renders react router header', () => {
  const { getByText } = render(<Router><App /></Router>);
  const header = getByText('Welcome to React Router!');
  expect(header).toBeInTheDocument();
});
```

This ensures that we can render our `App` component  and that the `h1` we put in during our setup guide is in the document.

## Testing Routes and Redirects

TODO

## Testing Links and Navigation

Testing a link and the subsequent navigation with React Testing Library is as easy as firing a click event on the link itself and asserting on the window's location to test that it worked.

This is accomplished like so:

```jsx
it('goes to about when link clicked', () => {
  const { getByText } = render(<Router><App /></Router>);
  
  const aboutLink = getByText('About');
  act(() => {
    fireEvent.click(aboutLink);
  });

  expect(window.location.pathname).toBe('/about');
});
```

Since our setup guide then replaces the about link with a link back to the home page, we can easily test that we end up back on the home page by triggering a second click, this time on the home link:

```jsx
it('goes to about when link clicked and then back to home when link clicked', () => {
  const { getByText } = render(<Router><App /></Router>);

  const aboutLink = getByText('About');
  act(() => {
    fireEvent.click(aboutLink);
  });
  expect(window.location.pathname).toBe('/about');

  const homeLink = getByText('Home');
  act(() => {
    fireEvent.click(homeLink);
  });
  expect(window.location.pathname).toBe('/');
});
```

This test will initially fail if we run it right after the previous test. This is because the history stack still thinks we are on the about page. To fix this, we can use Jest's `beforeEach` function to replace our history state using: `window.history.replaceState({}, '', '/');`. This makes `react-router` think that we are on the home page when we start each test. Now, all three tests should be passing when ran together.

Below is the full file to help see all of the tests together:

```jsx
import React from 'react';
import { render, fireEvent, cleanup, act } from '@testing-library/react';
import App from './App';
import { BrowserRouter as Router } from "react-router-dom";

beforeEach(() => {
  window.history.replaceState({}, '', '/');
});

afterEach(cleanup);

test('renders react router header', () => {
  const { getByText } = render(<Router><App /></Router>);
  const header = getByText('Welcome to React Router!');
  expect(header).toBeInTheDocument();
});

it('goes to about when link clicked', () => {
  const { getByText } = render(<Router><App /></Router>);
  
  const aboutLink = getByText('About');
  act(() => {
    fireEvent.click(aboutLink);
  });

  expect(window.location.pathname).toBe('/about');
});

it('goes to about when link clicked and then back to home when link clicked', () => {
  const { getByText } = render(<Router><App /></Router>);

  const aboutLink = getByText('About');
  act(() => {
    fireEvent.click(aboutLink);
  });
  expect(window.location.pathname).toBe('/about');

  const homeLink = getByText('Home');
  act(() => {
    fireEvent.click(homeLink);
  });
  expect(window.location.pathname).toBe('/');
});

```
