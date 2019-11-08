*Note: This document is still a work in progress! The migration process from
React Router v5 to v6 isn't yet as smooth as we would like it to be. We are
planning on backporting several of v6's new APIs to v5 to make it smoother, and
this guide will keep improving as we continue to gather feedback.*

React Router version 6 introduces several powerful new features, as well as
improved compatibility with the latest versions of React. It also introduces a
few breaking changes from version 5. This document is a comprehensive guide on
how to upgrade your v4/5 app to v6 while hopefully being able to ship as often
as possible as you go.

If you are just getting started with React Router or you'd like to try out v6 in
a new app, please see [the Getting Started guide](getting-started.md).

In general, the process looks like this:

- Upgrade to React v16.8 or greater
- Upgrade to React Router v5.1
  - Use `<Route children>` everywhere
  - Use hooks instead of `withRouter` and "floating" `<Route>`s (that aren't
    part of a `<Switch>`)
- Upgrade to React Router v6
  - Upgrade all `<Switch>` elements to `<Routes>`
    - Update `<Link to>` values
    - Update `<Route path>` patterns
    - Remove `<Route exact>` and `<Route strict>` props
    - Move `<Route sensitive>` to containing `<Routes caseSensitive>`
    - Consolidate your <Route>s into a nested config (optional)
  - Use `navigate` instead of `history`
    - Use `useNavigate` hook instead of `useHistory`
    - Use `<Navigate>` instead of `<Redirect>` (outside of route configs)
      - No need to change `<Redirect>` directly inside `<Routes>`
  - Get `StaticRouter` from `react-router-dom/server`

## Upgrade to React v16.8

React Router v6 makes heavy use of [React
hooks](https://reactjs.org/docs/hooks-intro.html), so you'll need to be on React
16.8 or greater before attempting the upgrade to React Router v6. The good news
is that React Router v5 is compatible with React >= 15, so if you're on v5 (or
v4) you should be able to upgrade React without touching any of your router
code.

Once you've upgraded to React 16.8, you should deploy your app. Then you can
come back later and pick up where you left off.

## Upgrade to React Router v5.1

You should probably also upgrade to React Router v5.1 before attempting the
upgrade to v6. In v5.1, we released an enhancement to the handling of `<Route
children>` elements that will help smooth the transition to v6. Instead of using
`<Route component>` and `<Route render>` props, just use regular element `<Route
children>` everywhere and use hooks to access the router's internal state.

```js
// v4 and v5 before 5.1
function User({ id }) {
  // ...
}

<Switch>
  <Route exact path="/" component={Home} />
  <Route path="/about" component={About} />
  <Route
    path="/users/:userId"
    render={
      ({ match }) => <User id={match.params.userId} />
    }
  />
</Switch>

// v5.1 preferred style
function User() {
  let { id } = useParams();
  // ...
}

<Switch>
  <Route exact path="/"><Home /></Route>
  <Route path="/about"><About /></Route>
  {/* Can also use a named `children` prop */}
  <Route path="/users/:userId" children={<User />} />
</Switch>
```

You can read more about 5.1's hooks API and the rationale behind the move to
regular elements [on our blog](https://reacttraining.com/blog/react-router-v5-1/).

In general, React Router v5.1 (and v6) favors elements over components. When you
use regular React elements you get to pass the props explicitly. This helps with
code readability and maintenance over time. If you were using `<Route render>`
to get a hold of the params, you can just `useParams` inside your route
component instead.

Along with the upgrade to v5.1, you should replace any usage of `withRouter`
with hooks. You should also get rid of any "floating" `<Route>` elements that
are not inside a `<Switch>`. [The blog post about
v5.1](https://reacttraining.com/blog/react-router-v5-1/) explains how in greater
detail.

In summary, to upgrade from v4/5 to v5.1, you should:

- Use `<Route children>` instead of `<Route render>` and/or `<Route component>`
  props
- Use [our hooks API](https://reacttraining.com/react-router/web/api/Hooks) to
  access router state like the current location and params
- Replace all uses of `withRouter` with hooks
- Replace any `<Route>`s that are not inside a `<Switch>` with `useRouteMatch`,
  or wrap them in a `<Switch>`

Again, once your app is upgraded to v5.1 you should test and deploy it, and pick
this guide back up where you left off when you're ready to continue.

## Upgrade all `<Switch>` elements to `<Routes>`

**Heads up:** This is the biggest step in the migration and will probably take
the most time and effort.

For this step, you'll need to install React Router v6.

```
$ yarn add react-router-dom@6
# or, for a native app
$ yarn add react-router-native@6
```

React Router v6 introduces a `Routes` component that is kind of like `Switch`,
but a lot more powerful. The main advantages of `Routes` over `Switch` are:

- All `<Route>`s and `<Link>`s inside a `<Routes>` are relative. This leads to
  leaner and more predictable code in `<Route path>` and `<Link to>`
- Routes are chosen based on the best match instead of being traversed in order.
  This avoids bugs due to unreachable routes because they were defined later
  in your `<Switch>`
- Routes may be nested in one place instead of being spread out in different
  components. In small to medium sized apps, this lets you easily see all your
  routes at once. In large apps, you can still nest routes in bundles that you
  load dynamically via `React.lazy`

In order to use v6, you'll need to convert all your `<Switch>` elements to
`<Routes>`. If you already made the upgrade to v5.1, you're halfway there.

First, let's talk about relative routes and links in v6.

### Relative Routes and Links

In v5, you had to be very explicit about how you wanted to nest your routes and
links. In both cases, if you wanted nested routes and links you had to build the
`<Route path>` and `<Link to>` props from the parent route's `match.url` and
`match.path` properties. Additionally, if you wanted to nest routes, you had to
put them in the child route's component.

```js
// This is a React Router v5 app
import { BrowserRouter, Switch, Route, Link } from 'react-router-dom';

function App() {
  return (
    <BrowserRouter>
      <Switch>
        <Route exact path="/"><Home /></Route>
        <Route path="/users"><Users /></Route>
      </Switch>
    </BrowserRouter>
  );
}

function Users() {
  // In v5, nested routes are rendered by the child component, so
  // you have <Switch> elements all over your app for nested UI.
  // You build nested routes and links using match.url and match.path.
  let match = useRouteMatch();

  return (
    <div>
      <nav>
        <Link to={`${match.url}/me`}>My Profile</Link>
      </nav>

      <Switch>
        <Route path={`${match.path}/me`}><OwnUserProfile /></Route>
        <Route path={`${match.path}/:id`}><UserProfile /></Route>
      </Switch>
    </div>
  );
}
```

This is the same app in v6:

```js
// This is a React Router v6 app
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="users/*" element={<Users />} />
      </Routes>
    </BrowserRouter>
  );
}

function Users() {
  return (
    <div>
      <nav>
        <Link to="me">My Profile</Link>
      </nav>

      <Routes>
        <Route path=":id" element={<UserProfile />} />
        <Route path="me" element={<OwnUserProfile />} />
      </Routes>
    </div>
  );
}
```

A few important things to notice about v6 in this example:

- `<Route path>` and `<Link to>` are relative. This means that they
  automatically build on the parent route's path and URL so you don't have to
  manually interpolate `match.url` or `match.path`
- `<Route exact>` is gone. Instead, routes with descendant routes (defined in
  other components) use a trailing `*` in their path to indicate they match
  deeply
- You may put your routes in whatever order you wish and the router will
  automatically detect the best route for the current URL. This prevents bugs
  due to manually putting routes in the wrong order in a `<Switch>`

You may have also noticed that all `<Route children>` from the v5 app changed to
`<Route element>` in v6. Assuming you followed the upgrade steps to v5.1, this
should be as simple as moving your route element from the child position to a
named `element` prop (TODO: can we provide a codemod here?).

The reason for using the `element` prop in v6 is that `<Route children>` is
reserved for nesting routes. This is one of people's favorite features from v3,
and we're bringing it back in v6. Taking the code in the above example one step
further, we can hoist all `<Route>` elements into a single route config:

```js
// This is a React Router v6 app
import { BrowserRouter, Routes, Route, Link, Outlet } from 'react-router-dom';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="users" element={<Users />}>
          <Route path="me" element={<OwnUserProfile />} />
          <Route path=":id" element={<UserProfile />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

function Users() {
  return (
    <div>
      <nav>
        <Link to="me">My Profile</Link>
      </nav>

      <Outlet />
    </div>
  )
}
```

Notice how `<Route>` elements nest naturally inside a `<Routes>` element. Nested
routes build their path by adding to the parent route's path. We didn't need a
trailing `*` on `<Route path="users">` because when the routes are defined in
one spot the router is able to see all your nested routes.

When using a nested config, routes with `children` should render an `<Outlet>`
in order to render their child routes. This makes it easy to render layouts with
nested UI.

### Note on `<Route path>` patterns

React Router v6 uses a simplified path format. `<Route path>` in v6 supports
only 2 kinds of placeholders: dynamic `:id`-style params and `*` wildcards. A
`*` wildcard may be used only at the end of a path, not in the middle.

All of the following are valid route paths in v6:

```
/groups
/groups/admin
/users/:id
/users/:id/messages
/files/*
/files/:id/*
/files-*
```

The following RegExp-style route paths are **not valid** in v6:

```
/users/:id?
/tweets/:id(\d+)
/files/*/cat.jpg
```

We added the dependency on path-to-regexp in v4 to enable more advanced pattern
matching. In v6 we are using a simpler syntax that allows us to predictably
parse the path for ranking purposes. It also means we can stop depending on
path-to-regexp, which is nice for bundle size.

If you were using any of path-to-regexp's more advanced syntax, you'll have to
remove it and simplify your route paths. If you were using the RegExp syntax to
do URL param validation (e.g. to ensure an id is all numeric characters) please
know that we plan to add some more advanced param validation in v6 at some
point.

If you were using `<Route sensitive>` you should move it to its containing
`<Routes caseSensitive>` prop. Either all routes in a `<Routes>` element are
case-sensitive or they are not.

One other point to notice is that all path matching in v6 ignores the trailing
slash on the URL. **This does not mean that you can't use trailing slashes if
you need to.** You can still link to URLs with trailing slashes and match those
URLs with your routes. It just means that you can't render two different UIs
client-side at e.g. `<Route path="edit">` and `<Route path="edit/">`, so `<Route
strict>` has been removed and has no effect in v6. You can still render two
different UIs at those URLs, but you'll have to do it server-side.

### Note on `<Link to>` values

In v5, a `<Link to>` value that does not begin with `/` is ambiguous; it depends
on what the current URL is. For example, if the current URL is `/users`, a v5
`<Link to="me">` would render a `<a href="/me">`. However, if the current URL
has a trailing slash, like `/users/`, the same `<Link to="me">` would render `<a
href="/users/me">`. This makes it difficult to predict how links will behave, so
in v5 we recommended that you build links from the root URL and not use relative
`<Link to>` values.

React Router v6 fixes this ambiguity. In v6, a `<Link to="me">` will always
render the same `<a href>`, regardless of the current URL.

For example, a `<Link to="me">` that is rendered inside a `<Route path="users">`
will always render a link to `/users/me`, regardless of whether or not the
current URL has a trailing slash. If you'd like to link to `/me` instead, you
can go up one segment of the URL using `..`, like `<Link to="../me">`. The `..`
basically means "remove one segment of the current URL", regardless of whether
it has a trailing slash or not. Of course, you can always `<Link to="/me">` if
you'd like to use an absolute URL instead.

It may help to think about the current URL as if it were a directory path on the
filesystem and `<Link to>` like the `cd` command line utility.

```
// If the current URL is /app/dashboard (with or without
// a trailing slash)
<Link to="stats">               // <a href="/app/dashboard/stats">
<Link to="../stats">            // <a href="/app/stats">
<Link to="../../stats">         // <a href="/stats">
<Link to="../../../stats">      // <a href="/stats">

// If the current directory is /app/dashboard
cd stats                        // pwd is /app/dashboard/stats
cd ../stats                     // pwd is /app/stats
cd ../../stats                  // pwd is /stats
cd ../../../stats               // pwd is /stats
```

### Use navigate instead of history

React Router v6 introduces a new navigation API that is synonymous with `<Link>`
and provides better compatibility with suspense-enabled apps. We include both
imperative and declarative versions of this API depending on your style and
needs.

```js
// This is a React Router v5 app
import { useHistory } from 'react-router-dom';

function App() {
  let history = useHistory();

  function handleClick() {
    history.push('/home')
  }

  return (
    <div>
      <button onClick={handleClick}>go home</button>
    </div>
  );
}
```

In v6, this app should be rewritten to use the `navigate` API. Most of the time
this means changing `useHistory` to `useNavigate` and changing the
`history.push` or `history.replace` callsite.

```js
// This is a React Router v6 app
import { useNavigate } from 'react-router-dom';

function App() {
  let navigate = useNavigate();

  function handleClick() {
    navigate('/home')
  }

  return (
    <div>
      <button onClick={handleClick}>go home</button>
    </div>
  );
}
```

If you need to replace the current location instead of push a new one onto the
history stack, use `navigate(to, { replace: true })`. If you need state, use
`navigate(to, { state })`. You can think of the first arg to `navigate` as your
`<Link to>` and the other arg as the `replace` and `state` props.

If you prefer to use a declarative API for navigation (ala v5's `Redirect`
component), v6 provides a `Navigate` component. Use it like:

```js
import { Navigate } from 'react-router-dom';

function App() {
  return <Navigate to="/home" replace state={state} />
}
```

*Note: You should still use a `<Redirect>` as part of your route config
(inside a `<Routes>`). This change is only necessary for `<Redirect>`s that are
used to navigate in response to user interaction.*

### Server rendering

The `StaticRouter` component has moved into a new bundle:
`react-router-dom/server`.

```js
// change
import { StaticRouter } from 'react-router-dom';
// to
import { StaticRouter } from 'react-router-dom/server';
```

This change was made both to follow more closely the convention established by
the `react-dom` package and to help users understand better what a
`<StaticRouter>` is for and when it should be used (on the server).
