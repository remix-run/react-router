---
title: FAQs
order: 4
---

# FAQs

Here are some questions that people commonly have about React Router v6. You might also find what you're looking for in the [examples][examples].

## What happened to withRouter? I need it!

This question usually stems from the fact that you're using React class components, which don't support hooks. In React Router v6, we fully embraced hooks and use them to share all the router's internal state. But that doesn't mean you can't use the router. Assuming you can actually use hooks (you're on React 16.8+), you just need a wrapper.

```js
import {
  useLocation,
  useNavigate,
  useParams,
} from "react-router-dom";

function withRouter(Component) {
  function ComponentWithRouterProp(props) {
    let location = useLocation();
    let navigate = useNavigate();
    let params = useParams();
    return (
      <Component
        {...props}
        router={{ location, navigate, params }}
      />
    );
  }

  return ComponentWithRouterProp;
}
```

## Why does `<Route>` have an `element` prop instead of `render` or `component`?

In React Router v6 we switched from using v5's `<Route component>` and `<Route render>` APIs to `<Route element>`. Why is that?

For starters, we see React itself taking the lead here with the `<Suspense fallback={<Spinner />}>` API. The `fallback` prop takes a React **element**, not a **component**. This lets you easily pass whatever props you want to your `<Spinner>` from the component that renders it.

Using elements instead of components means we don't have to provide a `passProps`-style API, so you can get the props you need to your elements. For example, in a component-based API there is no good way to pass props to the `<Profile>` element that is rendered when `<Route path=":userId" component={Profile} />` matches. Most React libraries who take this approach end up with either an API like `<Route component={Profile} passProps={{ animate: true }} />` or use a render prop or higher-order component.

Also, `Route`'s rendering API in v5 was rather large. As we worked on v4/5, the conversation went something like this:

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

At least part of the reason for this API sprawl was that React did not provide any way for us to get the information from the `<Route>` to your route element, so we had to invent clever ways to get both the route data **and** your own custom props through to your elements: `component`, render props, `passProps` higher-order-components ... until **hooks** came along!

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

Another important reason for using the `element` prop in v6 is that `<Route children>` is reserved for nesting routes. You can read more about this in [the guide about getting started][nested-routes] with v6.

## How do I add a No Match (404) Route in react-router v6?

In v4 we would have just left the path prop off a route. In v5 we would have wrapped our 404 element in a Route and used `path="*"`. In v6 use `path="*"` and pass the 404 element into the new `element` prop instead of wrapping it:

```js
<Route path="*" element={<NoMatch />} />
```

## `<Route>` doesn't render? How do I compose?

In v5 the `<Route>` component was just a normal component that was like an `if` statement that rendered when the URL matched its path. In v6, a `<Route>` element doesn't actually ever render, it's simply there for configuration.

In v5, since routes were just components, `MyRoute` will be rendered when the path is "/my-route".

```tsx filename=v5.js
let App = () => (
  <div>
    <MyRoute />
  </div>
);

let MyRoute = ({ element, ...rest }) => {
  return (
    <Route path="/my-route" children={<p>Hello!</p>} />
  );
};
```

In v6, however, the `<Route>` is only used for its props, so the following code will never render `<p>Hello!</p>` because `<MyRoute>` has no path that `<Routes>` can see:

```tsx bad filename=v6-wrong.js
let App = () => (
  <Routes>
    <MyRoute />
  </Routes>
);

let MyRoute = () => {
  // won't ever render because the path is down here
  return (
    <Route path="/my-route" children={<p>Hello!</p>} />
  );
};
```

You can get the same behavior by:

- Only rendering `<Route>` elements inside of `<Routes>`
- Moving the composition into the `element` prop

```tsx filename=v6.js
let App = () => (
  <div>
    <Routes>
      <Route path="/my-route" element={<MyRoute />} />
    </Routes>
  </div>
);

let MyRoute = () => {
  return <p>Hello!</p>;
};
```

Having a full nested route config available statically in `<Routes>` is going to enable a lot of features in `v6.x`, so we encourage you to put your routes in one top-level config. If you really like the idea of components that match the URL independent of any other components, you can make a component that behaves similarly to the v5 `Route` with this:

```tsx
function MatchPath({ path, Comp }) {
  let match = useMatch(path);
  return match ? <Comp {...match} /> : null;
}

// Will match anywhere w/o needing to be in a `<Routes>`
<MatchPath path="/accounts/:id" Comp={Account} />;
```

## How do I nest routes deep in the tree?

In v5 you could render a `<Route>` or `<Switch>` anywhere you want. You can keep doing the very same thing, but you need to use `<Routes>` (`<Route>` without an 's' will not work). We call these "Descendant `<Routes>`".

It might have looked like this in v5

```tsx filename=v5.js
// somewhere up the tree
<Switch>
  <Route path="/users" component={Users} />
</Switch>;

// and now deeper in the tree
function Users() {
  return (
    <div>
      <h1>Users</h1>
      <Switch>
        <Route path="/users/account" component={Account} />
      </Switch>
    </div>
  );
}
```

In v6 it's almost the same:

- Note the `*` in the ancestor routes to get it to match deeper URLs even though it has no direct children
- You no longer need to know the entire child route path, you can use a relative route now

```tsx filename=v6.js
// somewhere up the tree
<Routes>
  <Route path="/users/*" element={<Users />} />
</Routes>;

// and now deeper in the tree
function Users() {
  return (
    <div>
      <h1>Users</h1>
      <Routes>
        <Route path="account" element={<Account />} />
      </Routes>
    </div>
  );
}
```

If you had a "floating route" in v5 (not wrapped in a `<Switch>`), simply wrap it in a `<Routes>` instead.

```tsx
// v5
<Route path="/contact" component={Contact} />

// v6
<Routes>
  <Route path="contact" element={<Contact />} />
</Routes>
```

## What Happened to Regexp Routes Paths?

Regexp route paths were removed for two reasons:

1. Regular expression paths in routes raised a lot of questions for v6's ranked route matching. How do you rank a regex?

2. We were able to shed an entire dependency (path-to-regexp) and cut the package weight sent to your user's browser significantly. If it were added back, it would represent 1/3 of React Router's page weight!

After looking at a lot of use cases, we found we can still meet them without direct regexp path support, so we made the tradeoff to significantly decrease the bundle size and avoid the open questions around ranking regexp routes.

The majority of regexp routes were only concerned about one URL segment at a time and doing one of two things:

1. Matching multiple static values
2. Validating the param in some way (is a number, not a number, etc.)

**Matching generally static values**

A very common route we've seen is a regex matching multiple language codes:

```tsx filename=v5-lang-route.js
function App() {
  return (
    <Switch>
      <Route path={/(en|es|fr)/} component={Lang} />
    </Switch>
  );
}

function Lang({ params }) {
  let lang = params[0];
  let translations = I81n[lang];
  // ...
}
```

These are all actually just static paths, so in v6 you can make three routes and pass the code directly to the component. If you've got a lot of them, make an array and map it into routes to avoid the repetition.

```tsx filename=v6-lang-route.js
function App() {
  return (
    <Routes>
      <Route path="en" element={<Lang lang="en" />} />
      <Route path="es" element={<Lang lang="es" />} />
      <Route path="fr" element={<Lang lang="fr" />} />
    </Routes>
  );
}

function Lang({ lang }) {
  let translations = I81n[lang];
  // ...
}
```

**Doing some sort of param validation**

Another common case was ensuring that parameters were an integer.

```tsx filename=v5-userId-route.js
function App() {
  return (
    <Switch>
      <Route path={/users\/(\d+)/} component={User} />
    </Switch>
  );
}

function User({ params }) {
  let id = params[0];
  // ...
}
```

In this case you have to do a bit of work yourself with the regex inside the matching component:

```tsx filename=v6-userId-route.js
function App() {
  return (
    <Routes>
      <Route path="/users/:id" element={<ValidateUser />} />
      <Route path="/users/*" element={<NotFound />} />
    </Routes>
  );
}

function ValidateUser() {
  let params = useParams();
  let userId = params.id.match(/\d+/);
  if (!userId) {
    return <NotFound />;
  }
  return <User id={params.userId} />;
}

function User(props) {
  let id = props.id;
  // ...
}
```

In v5 if the regex didn't match then `<Switch>` would keep trying to match the next routes:

```tsx filename=v5-switch.js
function App() {
  return (
    <Switch>
      <Route path={/users\/(\d+)/} component={User} />
      <Route path="/users/new" exact component={NewUser} />
      <Route
        path="/users/inactive"
        exact
        component={InactiveUsers}
      />
      <Route path="/users/*" component={NotFound} />
    </Switch>
  );
}
```

Looking at this example you might be concerned that in the v6 version your other routes won't get rendered at their URLs because the `:userId` route might match first. But, thanks to route ranking, that is not the case. The "new" and "inactive" routes will rank higher and therefore render at their respective URLs:

```tsx filename=v6-ranked.js
function App() {
  return (
    <Routes>
      <Route path="/users/:id" element={<ValidateUser />} />
      <Route path="/users/new" element={<NewUser />} />
      <Route
        path="/users/inactive"
        element={<InactiveUsers />}
      />
    </Routes>
  );
}
```

In fact, the v5 version has all sorts of problems if your routes aren't ordered _just right_. V6 completely eliminates this problem.

**Remix Users**

If you're using [Remix][remix], you can send proper 40x responses to the browser by moving this work into your loader. This also decreases the size of the browser bundles sent to the user because loaders only run on the server.

```tsx filename=remix-useLoaderData.js
import { useLoaderData } from "remix";

export async function loader({ params }) {
  if (!params.id.match(/\d+/)) {
    throw new Response("", { status: 400 });
  }

  let user = await fakeDb.user.find({
    where: { id: params.id },
  });
  if (!user) {
    throw new Response("", { status: 404 });
  }

  return user;
}

function User() {
  let user = useLoaderData();
  // ...
}
```

Instead of rendering your component, remix will render the nearest [catch boundary][remix-catchboundary] instead.

[remix]: https://remix.run
[remix-catchboundary]: https://remix.run/docs/en/v1/api/conventions#catchboundary
[nested-routes]: ./overview#nested-routes
[examples]: https://github.com/remix-run/react-router/tree/dev/examples
