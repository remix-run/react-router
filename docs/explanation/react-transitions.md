---
title: React Transitions
unstable: true
---

# React Transitions

[MODES: framework, data, declarative]

<br/>
<br/>

[React 18][react-18] introduced the concept of "transitions" which allow you to differentiate urgent from non-urgent UI updates. To learn more about React Transitions and "concurrent rendering" Please refer to React's official documentation:

- [What is Concurrent React][concurrent]
- [Transitions][transitions]
- [`React.useTransition`][use-transition]
- [`React.startTransition`][start-transition]

[React 19][react-19] enhances the async/concurrent landscape by introducing [Actions][actions] and support for using async functions in Transitions. With the support for async Transitions, a new [`React.useOptimistic`][use-optimistic-blog] [hook][use-optimistic] was also introduced that allows you to surface state updates during a Transition to show users instant feedback.

## Transitions in React Router

The introduction of Transitions in React makes the story of how React Router manages your navigations and router state a bit more complicated. These are powerful APIs but they don't come without some nuance and added complexity. We aim to make React Router work seamlessly with the new React features, but in some cases there may exist some tension between the new React ways to do things and some patterns you are already using in your React Router apps (i.e., pending states, optimistic UI).

To ensure a smooth adoption story, we've introduced changes related to Transitions behind an opt-in `unstable_useTransitions` flag so that you can upgrade in a non-breaking fashion.

### Current Behavior

We first leveraged `React.startTransition` to make React Router more Suspense-friendly in React Router [6.13.0][rr-6-13-0] via the `future.v7_startTransition` flag. In v7, that became the default behavior and all router state updates are currently wrapped in `React.startTransition`.

This default behavior has 2 potential issues that `unstable_useTransitions` is designed to solve:

- There are some valid use cases where you _don't_ want your updates wrapped in `startTransition`
  - One specific issue is that `React.useSyncExternalStore` is incompatible with Transitions ([^1][uses-transition-issue], [^2][uses-transition-tweet]) so if you are using that in your application, you can run into tearing issues when combined with `React.startTransition`
  - React Router has a `flushSync` option on navigations to use [`React.flushSync`][flush-sync] for the state updates instead, but that's not always the proper solution
- React 19 has added a new `startTransition(() => Promise))` API as well as a new `useOptimistic` hook to surface updates during Transitions
  - Without some updates to React Router, `startTransition(() => navigate(path))` doesn't work as you might expect, because we are not using `useOptimistic` internally so router state updates don't surface during the navigation, which breaks hooks like `useNavigation`

To provide a solution to both of the above issues, we're introducing a new `unstable_useTransitions` prop to the router components that will let you opt-out of using `startTransition` for router state updates (solving the first issue), or opt-into a more enhanced usage of `startTransition` + `useOptimistic` (solving the second issue). Because the current behavior is a bit incomplete with the new React 19 APIs, we plan to make the opt-in behavior the default in React Router v8, but we will likely retain the opt-out flag for use cases such as `useSyncExternalStore`.

### Opt-out via `unstable_useTransitions=false`

If your application is not "Transition-friendly" due to the usage of `useSyncExternalStore` (or other reasons), then you can opt-out via the prop:

```tsx
// Framework Mode (entry.client.tsx)
<HydratedRouter unstable_useTransitions={false} />

// Data Mode
<RouterProvider unstable_useTransitions={false} />

// Declarative Mode
<BrowserRouter unstable_useTransitions={false} />
```

This will stop the router from wrapping internal state updates in `startTransition`.

<docs-warning>We do not recommend this as a long-term solution because opting out of Transitions means that your application will not be fully compatible with the modern features of React, including `Suspense`, `use`, `startTransition`, `useOptimistic`, `<ViewTransition>`, etc.</docs-warning>

### Opt-in via `unstable_useTransitions=true`

<docs-info>Opting into this feature in Framework or Data Mode requires that you are using React 19 because it needs access to [`React.useOptimistic`][use-optimistic]</docs-info>

If you want to make your application play nicely with all of the new React 19 features that rely on concurrent mode and Transitions, then you can opt-in via the new prop:

```tsx
// Framework Mode (entry.client.tsx)
<HydratedRouter unstable_useTransitions />

// Data Mode
<RouterProvider unstable_useTransitions />

// Declarative Mode
<BrowserRouter unstable_useTransitions />
```

With this flag enabled:

- All internal state updates are wrapped in `React.startTransition` (current behavior without the flag)
- All `<Link>`/`<Form>` navigations will be wrapped in `React.startTransition`, using the promise returned by `useNavigate`/`useSubmit` so that the Transition lasts for the duration of the navigation
  - `useNavigate`/`useSubmit` do not automatically wrap in `React.startTransition`, so you can opt-out of a Transition-enabled navigation by using those directly
- In Framework/Data modes, a subset of the router state updates during a navigation will be surfaced to the UI via `useOptimistic`
  - State related to the _ongoing_ navigation and all fetcher information will be surfaced:
    - `state.navigation` for `useNavigation()`
    - `state.revalidation` for `useRevalidator()`
    - `state.actionData` for `useActionData()`
    - `state.fetchers` for `useFetcher()` and `useFetchers()`
  - State related to the _current_ location will not be surfaced:
    - `state.location` for `useLocation`
    - `state.matches` for `useMatches()`,
    - `state.loaderData` for `useLoaderData()`
    - `state.errors` for `useRouteError()`
    - etc.

Enabling this flag means that you can now have fully-Transition-enabled navigations that play nicely with any other ongoing Transition-enabled aspects of your application.

The only APIs that are automatically wrapped in an async Transition are `<Link>` and `<Form>`. For everything else, you need to wrap the operation in `startTransition` yourself.

```tsx
// Automatically Transition-enabled
<Link to="/path" />
<Form method="post" action="/path" />

// Manually Transition-enabled
startTransition(() => navigate("/path"));
startTransition(() => submit(data, { method: 'post', action: "/path" }));
startTransition(() => fetcher.load("/path"));
startTransition(() => fetcher.submit(data, { method: "post", action: "/path" }));

// Not Transition-enabled
navigate("/path");
submit(data, { method: 'post', action: "/path" });
fetcher.load("/path");
fetcher.submit(data, { method: "post", action: "/path" });
```

**Important:** You must always `return` or `await` the `navigate` promise inside `startTransition` so that the Transition encompasses the full duration of the navigation. If you forget to `return` or `await` the promise, the Transition will end prematurely and things won't work as expected.

```tsx
// ✅ Returned promise
startTransition(() => navigate("/path"));
startTransition(() => {
  setOptimistic(something);
  return navigate("/path"));
});

// ✅ Awaited promise
startTransition(async () => {
  setOptimistic(something);
  await navigate("/path"));
});

// ❌ Non-returned promise
startTransition(() => {
  setOptimistic(something);
  navigate("/path"));
});

// ❌ Non-Awaited promise
startTransition(async () => {
  setOptimistic(something);
  navigate("/path"));
});
```

#### `popstate` navigations

Due to limitations in React itself, [`popstate`][popstate] navigations cannot be Transition-enabled. Any state updates during a `popstate` event are [automatically][popstate-sync-pr] [flushed][bsky-ricky-popstate] synchronously so that the browser can properly restore scroll position and form data.

However, the browser can only do this if the navigation is instant. If React Router needs to run loaders on a back navigation, the browser will not be able to restore scroll position or form data ([`<ScrollRestoration>`][scroll-restoration] can handle scroll position for you).

It is therefore not recommended to wrap `navigate(n)` navigations in `React.startTransition`
unless you can manage your pending UI with local Transition state (`React.useTransition`).

```tsx
// ❌ This won't work correctly
startTransition(() => navigate(-1));
```

If you _need_ programmatic back-navigations to be Transition-friendly in your app, you can introduce a small hack to prevent React from detecting the event and letting the Transition work as expected. React checks `window.event` to determine if the state updates are part of a `popstate` event, so if you clear that out in your own listener you can trick React into treating it like any other state update:

```tsx
// Add this to the top of your browser entry file
window.addEventListener(
  "popstate",
  () => {
    window.event = null;
  },
  {
    capture: true,
  },
);
```

<docs-warning>Please be aware this is a hack, has not been thoroughly tested, and may not continue to work if React changes their underlying implementation. We did get their [permission][ricky-bsky-event-hack] to mention it though 😉</docs-warning>

[react-18]: https://react.dev/blog/2022/03/29/react-v18
[concurrent]: https://react.dev/blog/2022/03/29/react-v18#what-is-concurrent-react
[transitions]: https://react.dev/blog/2022/03/29/react-v18#new-feature-transitions
[use-transition]: https://react.dev/reference/react/useTransition#reference
[start-transition]: https://react.dev/reference/react/startTransition
[react-19]: https://react.dev/blog/2024/12/05/react-19
[actions]: https://react.dev/blog/2024/12/05/react-19#actions
[use-optimistic-blog]: https://react.dev/blog/2024/12/05/react-19#new-hook-optimistic-updates
[use-optimistic]: https://react.dev/reference/react/useOptimistic
[flush-sync]: https://react.dev/reference/react-dom/flushSync
[dan-issue]: https://github.com/remix-run/remix/issues/5763
[startTransition-pr]: https://github.com/remix-run/react-router/pull/10438
[rr-6-13-0]: https://github.com/remix-run/react-router/blob/main/CHANGELOG.md#v6130
[uses-transition-issue]: https://github.com/facebook/react/issues/26382
[uses-transition-tweet]: https://x.com/rickhanlonii/status/1683636856808775682
[bsky-ricky-popstate]: https://bsky.app/profile/ricky.fm/post/3m5ujj6tuks2e
[popstate-sync-pr]: https://github.com/facebook/react/pull/26025
[scroll-restoration]: ../api/components/ScrollRestoration
[ricky-bsky-event-hack]: https://bsky.app/profile/ricky.fm/post/3m5wgqw3swc26
[popstate]: https://developer.mozilla.org/en-US/docs/Web/API/Window/popstate_event
