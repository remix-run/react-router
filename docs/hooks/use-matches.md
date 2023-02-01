---
title: useMatches
new: true
---

# `useMatches`

Returns the current route matches on the page. This is most useful for creating abstractions in parent layouts to get access to their child route's data.

```js
import { useMatches } from "react-router-dom";

function SomeComponent() {
  const matches = useMatches();
  // [match1, match2, ...]
}
```

A `match` has the following shape:

```js
{
  // route id
  id,

  // the portion of the URL the route matched
  pathname,

  // the data from the loader
  data,

  // the parsed params from the URL
  params,

  // the <Route handle> with any app specific data
  handle,
};
```

Pairing `<Route handle>` with `useMatches` gets very powerful since you can put whatever you want on a route `handle` and have access to `useMatches` anywhere.

<docs-warning>`useMatches` only works with a data router like [`createBrowserRouter`][createbrowserrouter], since they know the full route tree up front and can provide all of the current matches. Additionally, `useMatches` will not match down into any descendant route trees since the router isn't aware of the descendant routes.</docs-warning>

## Breadcrumbs

The proverbial use case here is adding breadcrumbs to a parent layout that uses data from the child routes.

```jsx filename=app.jsx
<Route element={<Root />}>
  <Route
    path="messages"
    element={<Messages />}
    loader={loadMessages}
    handle={{
      // you can put whatever you want on a route handle
      // here we use "crumb" and return some elements,
      // this is what we'll render in the breadcrumbs
      // for this route
      crumb: () => <Link to="/messages">Messages</Link>,
    }}
  >
    <Route
      path="conversation/:id"
      element={<Thread />}
      loader={loadThread}
      handle={{
        // `crumb` is your own abstraction, we decided
        // to make this one a function so we can pass
        // the data from the loader to it so that our
        // breadcrumb is made up of dynamic content
        crumb: (data) => <span>{data.threadName}</span>,
      }}
    />
  </Route>
</Route>
```

Now we can create a `Breadcrumbs` component that takes advantage of our home-grown `crumb` abstraction with `useMatches` and `handle`.

```tsx filename=components/breadcrumbs.jsx
function Breadcrumbs() {
  let matches = useMatches();
  let crumbs = matches
    // first get rid of any matches that don't have handle and crumb
    .filter((match) => Boolean(match.handle?.crumb))
    // now map them into an array of elements, passing the loader
    // data to each one
    .map((match) => match.handle.crumb(match.data));

  return (
    <ol>
      {crumbs.map((crumb, index) => (
        <li key={index}>{crumb}</li>
      ))}
    </ol>
  );
}
```

Now you can render `<Breadcrumbs/>` anywhere you want, probably in the root component.

[createbrowserrouter]: ../routers/create-browser-router
