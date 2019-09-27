# Primary Components

There are three primary categories of components in React Router:

- routers, like `<BrowserRouter>` and `<HashRouter>`
- route matchers, like `<Route>` and `<Switch>`
- and navigation, like `<Link>`, `<NavLink>`, and `<Redirect>`

We also like to think of the navigation components as "route changers".

All of the components that you use in a web application should be imported from `react-router-dom`.

```js
import { BrowserRouter, Route, Link } from "react-router-dom";
```

## Routers

At the core of every React Router application should be a router component. For web projects, `react-router-dom` provides `<BrowserRouter>` and `<HashRouter>` routers. The main difference between the two is the way they store the URL and communicate with your web server.

- A `<BrowserRouter>` uses regular URL paths. These are generally the best-looking URLs, but they require your server to be configured correctly. Specifically, your web server needs to serve the same page at all URLs that are managed client-side by React Router. Create React App supports this out of the box in development, and [comes with instructions](https://create-react-app.dev/docs/deployment#serving-apps-with-client-side-routing) on how to configure your production server as well.
- A `<HashRouter>` stores the current location in [the `hash` portion of the URL](https://developer.mozilla.org/en-US/docs/Web/API/HTMLHyperlinkElementUtils/hash), so the URL looks something like `http://example.com/#/your/page`. Since the hash is never sent to the server, this means that no special server configuration is needed.

To use a router, just make sure it is rendered at the root of your element hierarchy. Typically you'll wrap your top-level `<App>` element in a router, like this:

```jsx
import React from "react";
import ReactDOM from "react-dom";
import { BrowserRouter } from "react-router-dom";

function App() {
  return <h1>Hello React Router</h1>;
}

ReactDOM.render(
  <BrowserRouter>
    <App />
  </BrowserRouter>,
  document.getElementById("root")
);
```

## Route Matchers

There are two route matching components: `Switch` and `Route`. When a `<Switch>` is rendered, it searches through its `children` `<Route>` elements to find one whose `path` matches the current URL. When it finds one, it renders that `<Route>` and ignores all others. This means that you should put `<Route>`s with more specific (typically longer) `path`s **before** less-specific ones.

If no `<Route>` matches, the `<Switch>` renders nothing (`null`).

```jsx
import React from "react";
import ReactDOM from "react-dom";
import { BrowserRouter as Router, Switch, Route } from "react-router-dom";

function App() {
  return (
    <div>
      <Switch>
        {/* If the current URL is /about, this route is rendered
            while the rest are ignored */}
        <Route path="/about">
          <About />
        </Route>

        {/* Note how these two routes are ordered. The more specific
            path="/contact/:id" comes before path="/contact" so that
            route will render when viewing an individual contact */}
        <Route path="/contact/:id">
          <Contact />
        </Route>
        <Route path="/contact">
          <AllContacts />
        </Route>

        {/* If none of the previous routes render anything,
            this route acts as a fallback.

            Important: A route with path="/" will *always* match
            the URL because all URLs begin with a /. So that's
            why we put this one last of all */}
        <Route path="/">
          <Home />
        </Route>
      </Switch>
    </div>
  );
}

ReactDOM.render(
  <Router>
    <App />
  </Router>,
  document.getElementById("root")
);
```

One important thing to note is that a `<Route path>` matches the **beginning** of the URL, not the whole thing. So a `<Route path="/">` will **always** match the URL. Because of this, we typically put this `<Route>` last in our `<Switch>`. Another possible solution is to use `<Route exact path="/">` which **does** match the entire URL.

Note: Although React Router does support rendering `<Route>` elements outside of a `<Switch>`, as of version 5.1 we recommend you use [the `useRouteMatch` hook](#TODO) instead. Additionally, we do not recommend you render a `<Route>` without a `path` and instead suggest you use [a hook](#TODO) to get access to whatever variables you need.

## Navigation (or Route Changers)

React Router provides a `<Link>` component to create links in your application. Wherever you render a `<Link>`, an anchor (`<a>`) will be rendered in your HTML document.

```jsx
<Link to="/">Home</Link>
// <a href="/">Home</a>
```

The `<NavLink>` is a special type of `<Link>` that can style itself as "active" when its `to` prop matches the current location.

```jsx
<NavLink to="/react" activeClassName="hurray">
  React
</NavLink>

// When the URL is /react, this renders:
// <a href="/react" className="hurray">React</a>

// When it's something else:
// <a href="/react">React</a>
```

Any time that you want to force navigation, you can render a `<Redirect>`. When a `<Redirect>` renders, it will navigate using its `to` prop.

```jsx
<Redirect to="/login" />
```
