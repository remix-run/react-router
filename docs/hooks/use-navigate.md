---
title: useNavigate
---

# `useNavigate`

<details>
  <summary>Type declaration</summary>

```tsx
declare function useNavigate(): NavigateFunction;

interface NavigateFunction {
  (to: To, options?: NavigateOptions): void;
  (delta: number): void;
}

interface NavigateOptions {
  replace?: boolean;
  state?: any;
  preventScrollReset?: boolean;
  relative?: RelativeRoutingType;
}

type RelativeRoutingType = "route" | "path";
```

</details>

<docs-warning>It's usually better to use [`redirect`][redirect] in [`loaders`][loaders] and [`actions`][actions] than this hook</docs-warning>

The `useNavigate` hook returns a function that lets you navigate programmatically, for example in an effect:

```tsx
import { useNavigate } from "react-router-dom";

function useLogoutTimer() {
  const userIsInactive = useFakeInactiveUser();
  const navigate = useNavigate();

  useEffect(() => {
    if (userIsInactive) {
      fake.logout();
      navigate("/session-timed-out");
    }
  }, [userIsInactive]);
}
```

The `navigate` function has two signatures:

- Either pass a `To` value (same type as `<Link to>`) with an optional second `options` argument (similar to the props you can pass to [`<Link>`][link]), or
- Pass the delta you want to go in the history stack. For example, `navigate(-1)` is equivalent to hitting the back button

## `options.replace`

Specifying `replace: true` will cause the navigation will replace the current entry in the history stack instead of adding a new one.

## `options.state`

You may include an optional state value in to store in [history state][history-state]

## `options.preventScrollReset`

When using the [`<ScrollRestoration>`][scrollrestoration] component, you can disable resetting the scroll to the top of the page via `options.preventScrollReset`

## `options.relative`

By default, navigation is relative to the route hierarchy (`relative: "route"`), so `..` will go up one `Route` level. Occasionally, you may find that you have matching URL patterns that do not make sense to be nested, and you'd prefer to use relative _path_ routing. You can opt into this behavior with `relative: "path"`:

```jsx
// Contact and EditContact do not share additional UI layout
<Route path="/" element={<Layout />}>
  <Route path="contacts/:id" element={<Contact />} />
  <Route
    path="contacts/:id/edit"
    element={<EditContact />}
  />
</Route>;

function EditContact() {
  // Since Contact is not a parent of EditContact we need to go up one level
  // in the path, instead of one level in the Route hierarchy
  navigate("..", { relative: "path" });
}
```

[link]: ../components/link
[redirect]: ../fetch/redirect
[loaders]: ../route/loader
[actions]: ../route/action
[history-state]: https://developer.mozilla.org/en-US/docs/Web/API/History/state
[scrollrestoration]: ../components/scroll-restoration
