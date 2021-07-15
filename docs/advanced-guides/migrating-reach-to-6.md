# Migrating @reach/router to React Router v6

_Note: This document is still a work in progress! Please let us know where it
lacks so we can make the migration as smooth as possible!_

## Introduction

When we set out to build React Router v6, from the perspective of @reach/router users, we had these goals:

- Keep the bundle size low. Turns out we got it smaller than @reach/router
- Keep the best parts of @reach/router (nested routes, and a simplified API via ranked path matching and `navigate`)
- Update the API to be idiomatic with modern react: aka hooks.
- Provide better support for Concurrent Mode and Suspense.
- Stop doing not-good-enough focus management by default.

If we were to make a @reach/router v2, it would look pretty much exactly like React Router v6. So, the next version of @reach/router _is_ React Router v6. In other words, there will be no @reach/router v2, because it would be the same as React Router v6.

A lot of the API is actually identical between @reach/router 1.3 and React Router v6:

- Routes are ranked and matched
- The nested route config is there
- `navigate` has the same signature
- `Link` has the same signature
- All the hooks in 1.3 are identical (or nearly identical)

Most of the changes are just some renames. If you happen to write a codemod, please share it with us and we'll add it to this guide!

## Upgrading Overview

In this guide we'll show you how to upgrade each piece of your routing code. We'll do it incrementally so you can make some changes, ship, and then get back to migrating again when it's convenient. We'll also discuss a little bit about "why" the changes were made, what might look like a simple rename actually has bigger reasons behind it.

### First: Non-breaking Updates

We highly encourage you to do the following updates to your code before migrating to React Router v6. These changes don't have to be done all at once across your app, you can simply update one line, commit, and ship. Doing this will greatly reduce the effort when you get to the breaking changes in React Router v6.

1. Upgrade to React v16.8 or greater
2. Upgrade to @reach/router v1.3
3. Update route components to access data from hooks
4. Add a `<LocationProvider/>` to the top of the app

### Second: Breaking Updates

The following changes need to be done all at once across your app. If it is a significant burden, we have copy/paste wrapper components and hooks in each section that you can import instead of updating all of your application code at once (TODO).

1. Upgrade to React Router v6
2. Update all `<Router>` elements to `<Routes>`
3. Change `<RouteElement default/>` to `<RouteElement path="*" />`
4. Fix `<Redirect />`
5. Implement `<Link getProps />` with hooks
6. update `useMatch`, params are on `match.params`
7. Change `ServerLocation` to `StaticRouter`

## Non-Breaking Updates

### Upgrade to React v16.8

React Router v6 makes heavy use of [React
hooks](https://reactjs.org/docs/hooks-intro.html), so you'll need to be on
React 16.8 or greater before attempting the upgrade to React Router v6.

Once you've upgraded to React 16.8, you should deploy your app. Then you can
come back later and pick up where you left off.

### Upgrade to @reach/router v1.3.3

You should be able to simply install v1.3.3 and then deploy your app.

```
npm install @reach/router@lastest
```

### Update route components to use hooks

You can do this step one route component at a time, commit, and deploy. You don't need to update the entire app at once.

In @reach/router v1.3 we added hooks to access route data in preparation for React Router v6. If you do this first you'll have a lot less to do when you upgrade to React Router v6.

```jsx
// @reach/router v1.2
<Router>
  <User path="users/:userId/grades/:assignmentId" />
</Router>;

function User(props) {
  let {
    // route params were accessed from props
    userId,
    assignmentId,

    // as well as location and navigate
    location,
    navigate
  } = props;

  // ...
}

// @reach/router v1.3 and React Router v6
import { useParams, useLocation, useNavigate } from "@reach/router";

function User() {
  // everything comes from a specific hook now
  let { userId, assignmentId } = useParams();
  let location = useLocation();
  let navigate = useNavigate();
  // ...
}
```

#### Justification

All of this data lives on context already, but accessing it from there was awkward for application code so we dumped it into your props. Hooks made accessing data from context simple so we no longer need to pollute your props with route information.

Not polluting props also helps with TypeScript a bit and also prevents you from wondering where a prop came from when looking at a component. If you're using data from the router, it's completely clear now.

Also, as a page grows, you naturally break it into multiple components and end up "prop drilling" that data all the way down the tree. Now you can access the route data anywhere in the tree. Not only is it more convenient, but it makes creating router-centric composable abstractions possible. If a custom hook needs the location, it can now simply ask for it with `useLocation()` etc..

```
$ npm install react-router@6 react-router-dom@6
```

### Add a LocationProvider

While @reach/router doesn't require a location provider at the top of the application tree, React Router v6 does, so might as well get ready for that now.

```jsx
// before
ReactDOM.render(<App />, el);

// after
import { LocationProvider } from "@reach/router";

ReactDOM.render(
  <LocationProvider>
    <App />
  </LocationProvider>,
  el
);
```

#### Justification:

@reach/router uses a global, default history instance that has side-effects in the module, which prevents the ability to tree-shake the module whether you use the global or not. Additionally, React Router provides other history types (like hash history) that @reach/router doesn't, so it always requires a top-level location provider (in React Router these are `<BrowserRouter/>` and friends).

Also, various modules like `Router`, `Link` and `useLocation` rendered outside of a `<LocationProvider/>` set up their own url listener. It's generally not a problem, but every little bit counts. Putting a `<LocationProvider />` at the top allows the app to have a single url listener.

## Breaking updates

This next group of updates need to be done all at once. Fortunately most of it is just a simple rename.

You can pull a trick though and use both routers at the same time as you migrate, but you should absolutely not ship your app in this state because they are not interoperable. Your links from one won't work for the other. However, it is nice to be able to make a change and refresh the page to see that you did that one step correctly.

### Install React Router v6

```
npm install react-router@next
```

### Update `LocationProvider` to `BrowserRouter`

```jsx
// @reach/router
import { LocationProvider } from "@reach/router";

ReactDOM.render(
  <LocationProvider>
    <App />
  </LocationProvider>,
  el
);

// React Router v6
import { BrowserRouter } from "react-router-dom";

ReactDOM.render(
  <BrowserRouter>
    <App />
  </BrowserRouter>,
  el
);
```

### Update `Router` to `Routes`

You may have more than one, but usually there's just one somewhere near the top of your app. If you have multiple, go ahead and do this for each one.

```jsx
// @reach/router
import { Router } from "@reach/router";

<Router>
  <Home path="/" />
  {/* ... */}
</Router>;

// React Router v6
import { Routes } from "react-router-dom";

<Routes>
  <Home path="/" />
  {/* ... */}
</Routes>;
```

### Update `default` route prop

The `default` prop told @reach/router to use that route if no other routes matched. In React Router v6 you can explain this behavior with a wildcard path.

```jsx
// @reach/router
<Router>
  <Home path="/" />
  <NotFound default />
</Router>

// React Router v6
<Routes>
  <Home path="/" />
  <NotFound path="*" />
</Routes>
```

### `<Redirect/>`, `redirectTo`, `isRedirect`

Whew ... buckle up for this one. And please save your tomatoes for a homemade margherita pizza instead of throwing them at us.

We have removed the ability to redirect from React Router. So this means there is no `<Redirect/>`, `redirectTo`, or `isRedirect`, and no replacement APIs either. Please keep reading 😅

Don't confuse redirects with navigating while the user interacts with your app. Navigating in response to user interactions is still supported. When we talk about redirects, we're talking about redirecting while matching:

```jsx
<Router>
  <Home path="/" />
  <Users path="/events" />
  <Redirect from="/dashboard" to="/events" />
</Router>
```

The way redirects work in @reach/router was a bit of an experiment. It "throws" redirects and catches it with `componentDidCatch`. This was cool because it caused the entire render tree to stop, and then start over with the new location. Discussions with the React team years ago when we first shipped this project led us to give it a shot.

After bumping into issues (like app level `componentDidCatch`'s needing to rethrow the redirect), we've decided not to do that anymore in React Router v6.

But we've gone a step farther and concluded that redirect's are not even the job of React Router. Your dynamic web server or static file server should be handling this and sending an appropriate response status code like 301 or 302.

Having the ability to redirect while matching in React Router at best requires you to configure the redirects in two places (your server and your routes) and at worst encouraged people to only do it in React Router--which doesn't send a status code at all.

We use firebase hosting a lot, so as an example here's how we'd update one of our apps:

```jsx
// @reach/router
<Router>
  <Home path="/" />
  <Users path="/events" />
  <Redirect from="/dashboard" to="/events" />
</Router>
```

```jsx
// React Router v6
// firebase.json config file
{
  // ...
  "hosting": {
    "redirects": [
      {
        "source": "/dashboard",
        "destination": "/events",
        "type": 301
      }
    ]
  }
}
```

This works whether we're server rendering with a serverless function, or if we're using it as a static file server only. All web hosting services provide a way to configure this.

#### What about clicking Links that aren't updated?

If your app has a `<Link to="/events" />` still hanging around and the user
clicks it, the server isn't involved since you're using a client-side router.
You'll need to be more diligent about updating your links 😬.

Alternatively, if you want to allow for out-dated links, _and you realize you need to configure your redirects on both the client and the server_, go ahead and copy paste the `Redirect` component we were about to ship but then deleted.

```jsx
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

function Redirect({ to }) {
  let navigate = useNavigate();
  useEffect(() => {
    navigate(to);
  });
  return null;
}

// usage
<Routes>
  <Home path="/" />
  <Users path="/events" />
  <Redirect path="/dashboard" to="/events" />
</Routes>;
```

#### Justification

We figured by not providing any redirect API at all, people will be more likely to configure them correctly. We've been accidentally encouraging bad practice for years now and would like to stop 🙈.

### `<Link getProps />`

This prop getter was useful for styling links as "active". Deciding if a link is active is kind of subjective. Sometimes you want it to be active if the url matches exactly, sometimes you want it active if it matches partially, and there are even more edge cases involving search params and location state.

```jsx
// @reach/router
function SomeCustomLink() {
  return (
    <Link
      to="/some/where/cool"
      getProps={obj => {
        let { isCurrent, isPartiallyCurrent, href, location } = obj;
        // do what you will
      }}
    />
  );
}

// React Router
import { useLocation, useMatch } from "react-router-dom";

function SomeCustomLink() {
  let to = "/some/where/cool";
  let match = useMatch(to);
  let { isExact } = useMatch(to);
  let location = useLocation();
  return <Link to={to} />;
}
```

Let's look at some less general examples.

```jsx
// A custom nav link that is active when the url matches the link's href exactly

// @reach/router
function ExactNavLink(props) {
  const isActive = ({ isCurrent }) => {
    return isCurrent ? { className: "active" } : {};
  };
  return <Link getProps={isActive} {...props} />;
}

// React Router v6
function ExactNavLink(props) {
  let match = useMatch(props.to);
  return <Link className={match?.isExact ? "active" : ""} {...props} />;
}

// A link that is active when itself or deeper routes are current

// @reach/router
function PartialNavLink(props) {
  const isPartiallyActive = ({ isPartiallyCurrent }) => {
    return isPartiallyCurrent ? { className: "active" } : {};
  };
  return <Link getProps={isPartiallyActive} {...props} />;
}

// React Router v6
function PartialNavLink(props) {
  // add the wild card to match deeper urls
  let match = useMatch(props.to + "/*");
  return <Link className={match ? "active" : ""} {...props} />;
}
```

#### Justification

"Prop getters" are clunky and can almost always be replaced with a hook. This also allows you to use the other hooks, like useLocation, and do even more custom things, like making a link active with a search string:

```jsx
function RecentPostsLink(props) {
  let match = useMatch("/posts");
  let location = useLocation();
  let isActive = match && location.search === "?view=recent";
  return <Link className={isActive ? "active" : ""}>Recent</Link>;
}
```

### `useMatch`

The signature of `useMatch` is slightly different in React Router v6.

```jsx
// @reach/router
let {
  uri,
  path,

  // params are merged into the object with uri and path
  eventId
} = useMatch("/events/:eventId");

// React Router v6
let {
  url,
  path,

  // params get their own key on the match
  params: { eventId }
} = useMatch("/events/:eventId");
```

Also note the change from `uri -> url`.

#### Justification

Just feels cleaner to have the params be seperate from url and path.

Also nobody knows the difference between URL and URI, so we didn't want to start a bunch of pedantic arguments about it. React Router always called it URL, and it's got more production apps, so we used URL instead of URI.

### `<Match />`

There is no `<Match/>` component in React Router v6. It used render props to compose behavior but we've got hooks now.

If you like it, or just don't want to update your code, it's easy to backport:

```jsx
function Match({ path, children }) {
  let match = useMatch(path);
  let location = useLocation();
  let navigate = useNavigate();
  return children({ match, location, navigate });
}
```

#### Justification

Render props are kinda gross (ew!) now that we have hooks.

### `<ServerLocation />`

Really simple rename here:

```jsx
// @reach/router
import { ServerLocation } from "@reach/router";

createServer((req, res) => {
  let markup = ReactDOMServer.renderToString(
    <ServerLocation url={req.url}>
      <App />
    </ServerLocation>
  );
  req.send(markup);
});

// React Router v6
// note the import path from react-router-dom/server!
import { StaticRouter } from "react-router-dom/server";

createServer((req, res) => {
  let markup = ReactDOMServer.renderToString(
    <StaticRouter location={req.url}>
      <App />
    </StaticRouter>
  );
  req.send(markup);
});
```

## Feedback!

Please let us know if this guide helped:

_Open a Pull Request_: Please add any migration we missed that you needed.

_General Feedback_ @reacttraining on twitter, hello@reacttraining.com

Thanks!
