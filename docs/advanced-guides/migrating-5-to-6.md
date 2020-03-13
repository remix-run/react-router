# Migrating React Router v5 to v6

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
a new app, please see [the Getting Started guide](../installation/getting-started.md).

The examples in this guide will show code samples of how you might have built
something in a v5 app, followed by how you would accomplish the same thing in
v6. There will also be an explanation of why we made this change and how it's
going to improve both your code and the overall user experience of people who
are using your app.

In general, the process looks like this:

- [Upgrade to React v16.8 or greater](#upgrade-to-react-v168)
- [Upgrade to React Router v5.1](#upgrade-to-react-router-v51)
  - Use `<Route children>` everywhere
  - Use hooks instead of `withRouter` and "floating" `<Route>`s (that aren't
    part of a `<Switch>`)
- [Upgrade to React Router v6](#upgrade-to-react-router-v6)
  - [Upgrade all `<Switch>` elements to `<Routes>`](#upgrade-all-switch-elements-to-routes)
    - Update `<Link to>` values
    - Update `<Route path>` patterns
    - Remove `<Route exact>` and `<Route strict>` props
    - Move `<Route sensitive>` to containing `<Routes caseSensitive>`
    - Consolidate your `<Route>`s into a nested config (optional)
  - [Use `navigate` instead of `history`](#use-navigate-instead-of-history)
    - Use `useNavigate` hook instead of `useHistory`
    - Use `<Navigate>` instead of `<Redirect>` (outside of route configs)
      - No need to change `<Redirect>` directly inside `<Routes>`
  - [Use `useRoutes` instead of `react-router-config`](#use-useroutes-instead-of-react-router-config)
  - [Rename `<Link component>` to `<Link as>`](#rename-link-component-to-link-as)
  - [Get `StaticRouter` from `react-router-dom/server`](#get-staticrouter-from-react-router-domserver)

## Upgrade to React v16.8

React Router v6 makes heavy use of [React
hooks](https://reactjs.org/docs/hooks-intro.html), so you'll need to be on React
16.8 or greater before attempting the upgrade to React Router v6. The good news
is that React Router v5 is compatible with React >= 15, so if you're on v5 (or
v4) you should be able to upgrade React without touching any of your router
code.

Once you've upgraded to React 16.8, **you should deploy your app**. Then you can
come back later and pick up where you left off.

## Upgrade to React Router v5.1

It will be easier to make the switch to React Router v6 if you upgrade to v5.1
first. In v5.1, we released an enhancement to the handling of `<Route children>`
elements that will help smooth the transition to v6. Instead of using `<Route
component>` and `<Route render>` props, just use regular element `<Route
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
    path="/users/:id"
    render={
      ({ match }) => <User id={match.params.id} />
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
  <Route path="/users/:id" children={<User />} />
</Switch>
```

You can read more about v5.1's hooks API and the rationale behind the move to
regular elements [on our blog](https://reacttraining.com/blog/react-router-v5-1/).

In general, React Router v5.1 (and v6) favors elements over components (or
"element types"). There are a few reasons for this, but we'll discuss more
further down when we discuss v6's `<Route>` API.

When you use regular React elements you get to pass the props
explicitly. This helps with code readability and maintenance over time. If you
were using `<Route render>` to get a hold of the params, you can just
`useParams` inside your route component instead.

Along with the upgrade to v5.1, you should replace any usage of `withRouter`
with hooks. You should also get rid of any "floating" `<Route>` elements that
are not inside a `<Switch>`. Again, [the blog post about
v5.1](https://reacttraining.com/blog/react-router-v5-1/) explains how to do this
in greater detail.

In summary, to upgrade from v4/5 to v5.1, you should:

- Use `<Route children>` instead of `<Route render>` and/or `<Route component>`
  props
- Use [our hooks API](https://reacttraining.com/react-router/web/api/Hooks) to
  access router state like the current location and params
- Replace all uses of `withRouter` with hooks
- Replace any `<Route>`s that are not inside a `<Switch>` with `useRouteMatch`,
  or wrap them in a `<Switch>`

Again, **once your app is upgraded to v5.1 you should test and deploy it**, and
pick this guide back up when you're ready to continue.

## Upgrade to React Router v6

**Heads up:** This is the biggest step in the migration and will probably take
the most time and effort.

For this step, you'll need to install React Router v6. If you're managing
dependencies via npm:

```
$ npm install react-router@6 react-router-dom@6
# or, for a React Native app
$ npm install react-router@6 react-router-native@6
```

### Upgrade all `<Switch>` elements to `<Routes>`

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
import { BrowserRouter, Switch, Route, Link, useRouteMatch } from 'react-router-dom';

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

### Advantages of `<Route element>`

In the section about upgrading to v5.1, I promised you we'd discuss the
advantages of using regular elements instead of components (or element types)
for rendering. Let's take a quick break from upgrading and talk about that now.

For starters, we see React itself taking the lead here with the `<Suspense
fallback={<Spinner />}>` API. The `fallback` prop takes a React element, not a
component. This lets you easily pass whatever props you want to your `<Spinner>`
from the component that renders it.

Using elements instead of components means we don't have to provide a
`passProps`-style API so you can get the props you need to your elements. For
example, in a component-based API there is no good way to pass props to the
`<Profile>` element that is rendered when `<Route path=":userId"
component={Profile} />` matches. Most React libraries who take this approach end
up with either an API like `<Route component={Profile} passProps={{ animate:
true }} />` or use a render prop or higher-order component.

Also, I'm not sure if you noticed this but in v4 and v5, `Route`'s rendering API
became rather large. It went something like this:

```js
// Ah, this is nice and simple!
<Route path=":userId" component={Profile} />

// But wait, how do I pass custom props to the <Profile> element??
// Hmm, maybe we can use a render prop in those situations?
<Route
  path=":userId"
  render={routeProps => (
    <Profile routeProps={routeProps} animate={true} />
  )}
/>

// Ok, now we have two ways to render something with a route. :/

// But wait, what if we want to render something when a route
// *doesn't* match the URL, like a Not Found page? Maybe we
// can use another render prop with slightly different semantics?
<Route
  path=":userId"
  children={({ match }) => (
    match ? (
      <Profile match={match} animate={true} />
    ) : (
      <NotFound />
    )
  )}
/>

// What if I want to get access to the route match, or I need
// to redirect deeper in the tree?
function DeepComponent(routeStuff) {
  // got routeStuff, phew!
}
export default withRouter(DeepComponent);

// Well hey, now at least we've covered all our use cases!
// ... *facepalm*
```

At least part of the reason for this API sprawl was that React did not provide
any way for us to get the information from the `<Route>` to your route element,
so we had to invent clever ways to get both the route data **and** your own
custom props through to your elements: `component`, render props, `passProps`
higher-order-components ... until **hooks** came along!

Now, the conversation above goes like this:

```js
// Ah, nice and simple API. And it's just like the <Suspense> API!
// Nothing more to learn here.
<Route path=":userId" element={<Profile />} />

// But wait, how do I pass custom props to the <Profile>
// element? Oh ya, it's just an element. Easy.
<Route path=":userId" element={<Profile animate={true} />} />

// Ok, but how do I access the router's data, like the URL params
// or the current location?
function Profile({ animate }) {
  let params = useParams();
  let location = useLocation();
}

// But what about components deep in the tree?
function DeepComponent() {
  // oh right, same as anywhere else
  let navigate = useNavigate();
}

// Aaaaaaaaand we're done here.
```

Another important reason for using the `element` prop in v6 is that `<Route
children>` is reserved for nesting routes. This is one of people's favorite
features from v3 and @reach/router, and we're bringing it back in v6. Taking
the code in the previous example one step further, we can hoist all `<Route>`
elements into a single route config:

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

This step is optional of course, but it's really nice for small to medium sized
apps that don't have thousands of routes.

Notice how `<Route>` elements nest naturally inside a `<Routes>` element. Nested
routes build their path by adding to the parent route's path. We didn't need a
trailing `*` on `<Route path="users">` this time because when the routes are
defined in one spot the router is able to see all your nested routes.

You'll only need the trailing `*` when there is another `<Routes>` somewhere in
that route's descendant tree. In that case, the descendant `<Routes>` will match
on the portion of the pathname that remains (see the previous example for what
this looks like in practice).

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
point. For now, you'll need to move that logic to the component the route
renders, and let it branch it's rendered tree after you parse the params.

If you were using `<Route sensitive>` you should move it to its containing
`<Routes caseSensitive>` prop. Either all routes in a `<Routes>` element are
case-sensitive or they are not.

One other thing to notice is that all path matching in v6 ignores the trailing
slash on the URL. In fact, `<Route strict>` has been removed and has no effect
in v6. **This does not mean that you can't use trailing slashes if you need
to.** Your app can decide to use trailing slashes or not, you just can't
render two different UIs *client-side* at `<Route path="edit">` and
`<Route path="edit/">`. You can still render two different UIs at those URLs,
but you'll have to do it server-side.

### Note on `<Link to>` values

In v5, a `<Link to>` value that does not begin with `/` was ambiguous; it depends
on what the current URL is. For example, if the current URL is `/users`, a v5
`<Link to="me">` would render a `<a href="/me">`. However, if the current URL
has a trailing slash, like `/users/`, the same `<Link to="me">` would render `<a
href="/users/me">`. This makes it difficult to predict how links will behave, so
in v5 we recommended that you build links from the root URL (using `match.url`)
and not use relative `<Link to>` values.

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

// On the command line, if the current directory is /app/dashboard
cd stats                        // pwd is /app/dashboard/stats
cd ../stats                     // pwd is /app/stats
cd ../../stats                  // pwd is /stats
cd ../../../stats               // pwd is /stats
```

**Note**: The decision to ignore trailing slashes while matching and creating relative
paths was not taken lightly by our team. We consulted with a number of
our friends and clients (who are also our friends!) about it. We found that
most of us don't even understand how plain HTML relative links are handled
with the trailing slash. Most people guessed it worked like `cd` on the
command line (it does not). Also, HTML relative links don't have the concept of nested
routes, they only worked on the URL, so we had to blaze our own trail here a bit.
@reach/router set this precendent and it has worked out well for a couple of
years.

## Use useRoutes instead of react-router-config

All of the functionality from v5's `react-router-config` package has moved into
core in v6. If you prefer/need to define your routes as JavaScript objects
instead of using React elements, you're going to love this.

```js
function App() {
  let element = useRoutes([
    // These are the same as the props you provide to <Route>
    { path: '/', element: <Home /> },
    { path: 'dashboard', element: <Dashboard /> },
    { path: 'invoices',
      element: <Invoices />,
      // Nested routes use a children property, which is also
      // the same as <Route>
      children: [
        { path: ':id', element: <Invoice /> },
        { path: 'sent', element: <SentInvoices /> }
      ]
    },
    // Redirects use a redirectTo property to
    { path: 'home', redirectTo: '/' },
    // Not found routes work as you'd expect
    { path: '*', element: <NotFound /> }
  ]);

  // The returned element will render the entire element
  // hierarchy with all the appropriate context it needs
  return element;
}
```

Routes defined in this way follow all of the same semantics as `<Routes>`. In
fact, `<Routes>` is really just a wrapper around `useRoutes`. Crazy, I know.

We encourage you to give both `<Routes>` and `useRoutes` a shot and decide for
yourself which one you prefer to use. Honestly, we like and use them both.

If you had cooked up some of your own logic around data fetching and rendering
server-side, we have a low-level `matchRoutes` function available as well
similar to the one we had in react-router-config.

## Use navigate instead of history

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
  return <Navigate to="/home" replace state={state} />;
}
```

If you're currently using `go`, `goBack` or `goForward` from `useHistory` to
navigate backwards and forwards, you should also replace these with `navigate`
with a numerical argument indicating where to move the pointer in the history
stack. For example, here is some code using v5's `useHistory` hook:

```js
// This is a React Router v5 app
import { useHistory } from 'react-router-dom';

function App() {
  const { go, goBack, goForward } = useHistory();

  return (
    <>
      <button onClick={() => go(-2)}>Go 2 pages back</button>
      <button onClick={goBack}>Go back</button>
      <button onClick={goForward}>Go forward</button>
      <button onClick={() => go(2)}>Go 2 pages forward</button>
    </>
  );
}
```

Here is the equivalent app with v6:

```js
// This is a React Router v6 app
import { useNavigate } from 'react-router-dom';

function App() {
  const navigate = useNavigate();

  return (
    <>
      <button onClick={() => navigate(-2)}>Go 2 pages back</button>
      <button onClick={() => navigate(-1)}>Go back</button>
      <button onClick={() => navigate(1)}>Go forward</button>
      <button onClick={() => navigate(2)}>Go 2 pages forward</button>
    </>
  );
}
```

Again, one of the main reasons we are moving from using the `history` API
directly to the `navigate` API is to provide better compatibility with React
suspense.  React Router v6 uses the `useTransition` hook at the root of your
component hierarchy. This lets us provide a smoother experience when user
interaction needs to interrupt a pending route transition, for example when they
click a link to another route while a previously-clicked link is still loading.
The `navigate` API is aware of the internal pending transition state and will
do a REPLACE instead of a PUSH onto the history stack, so the user doesn't end
up with pages in their history that never actually loaded.

*Note: You should still use a `<Redirect>` as part of your route config
(inside a `<Routes>`). This change is only necessary for `<Redirect>`s that are
used to navigate in response to user interaction.*

Aside from suspense compatibility, `navigate`, like `Link`, supports relative
navigation. For example:

```jsx
// assuming we are at `/stuff`
function SomeForm() {
  let navigate = useNavigate()
  return (
    <form onSubmit={async (event) => {
      let newRecord = await saveDataFromForm(event.target)
      // you can build up the URL yourself
      navigate(`/stuff/${newRecord.id}`)
      // or navigate relative, just like Link
      navigate(`${newRecord.id}`)
    }}>{/* ... */}</form>
  )
}
```

## Rename `<Link component>` to `<Link as>`

This is a simple renaming of a prop to better align with the common practice of
other libraries in the React ecosystem including styled-components and Reach UI.

## Get `StaticRouter` from `react-router-dom/server`

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

## What did we miss?

Despite my best attempts at being thorough (it took me 2 days to write this) I'm
sure I missed something. If you follow this upgrade guide and find it's missing
something, please let us know. We are happy to help you figure out what to do
with your v5 code to be able to upgrade and take advantage of all of the cool
stuff in v6.

If you don't understand the rationale for some of the decisions we've made,
please feel free to reach out directly to [me on
Twitter](https://twitter.com/mjackson) or
[Ryan](https://twitter.com/ryanflorence). Let's talk about it!

Good luck 🤘
