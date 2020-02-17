# Testing With React Testing Library

`react-testing-library` is a lightweight family of packages that help us test UI components in a manner that resembles the way a user would interact with our applications.

To quote their (very excellent) documentation:

> The more your tests resemble the way your software is used, the more confidence they can give you.

https://testing-library.com/docs/intro

## Getting Setup

To install using **npm**: `npm install -D @testing-library/react`

To install using **yarn**: `yarn add -D @testing-library/react`

## Testing Routes and Redirects

We have a lot of tests that the routes work when the location changes, so you probably don't need to test this stuff. But if you need to test navigation within your app, you can do so like this:

> Example borrowed from`react-testing-library` documentation.

First we define three simple functional components in our main `<App />` component that will serve as our different pages.

```
// app.js
import React from 'react'
import { Link, Route, Switch } from 'react-router-dom'

const About = () => <h1>You are on the about page</h1>
const Home = () => <h1>You are home</h1>
const NoMatch = () => <h1>404 Not Found</h1>

function App() {
return (

<div>
<Link to="/">Home</Link>
<Link to="/about">About</Link>
<Switch>
<Route exact path="/" component={Home} />
<Route path="/about" component={About} />
<Route component={NoMatch} />
</Switch>
</div>
)
}

export default App;
```

This test verifies that the app is rendering in the DOM successfully, that the link to the `<About />` works as expected, and that the `<NoMatch />` component is hit when attempting to navigate to a non-existent route.

```
// app.test.js
import React from 'react'
import { Router } from 'react-router-dom'
import { createMemoryHistory } from 'history'
import { render, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom/extend-expect'
import { LocationDisplay, App } from './app'

test('full app rendering/navigating', () => {
const history = createMemoryHistory()
const { container, getByText } = render(
<Router history={history}>
<App />
</Router>
)
// verify page content for expected route
// often you'd use a data-testid or role query, but this is also possible
expect(container.innerHTML).toMatch('You are home')

fireEvent.click(getByText(/about/i))

// check that the content changed to the new page
expect(container.innerHTML).toMatch('You are on the about page')
})

test('landing on a bad page shows 404 page', () => {
const history = createMemoryHistory()
history.push('/some/bad/route')
const { getByRole } = render(
<Router history={history}>
<App />
</Router>
)
expect(getByRole('heading')).toHaveTextContent('404 Not Found')
})
```

## Testing Links and Navigation

TODO
