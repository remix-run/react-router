---
title: React Transitions
unstable: true
---

# React Transitions

[MODES: framework, data, declarative]

<br/>
<br/>

<docs-warning>The `unstable_useTransitions` prop is experimental and subject to breaking changes in
minor/patch releases. Please use with caution and pay **very** close attention
to release notes for relevant changes.</docs-warning>

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
  - One specific issue is that `React.useSyncExternalStore` updates can't be Transitions ([^1][uses-transition-issue], [^2][uses-transition-tweet]). `useSyncExternalStore` forces a sync update, which means fallbacks can be shown in update transitions that would otherwise avoid showing the fallback.
  - React Router has a `flushSync` option on navigations to use [`React.flushSync`][flush-sync] for state updates instead, but that's not always a proper solution
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

There is currently a bug with optimistic states and `popstate`. If you need to read the current route during a back navigation, which cannot complete synchronously (e.g. Suspends on uncached data), you can set the optimistic state before navigating back or defer the optimistic update in a timer or microtask.

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
[rr-6-13-0]: https://github.com/remix-run/react-router/blob/main/CHANGELOG.md#v6130
[uses-transition-issue]: https://github.com/facebook/react/issues/26382
[uses-transition-tweet]: https://x.com/rickhanlonii/status/1683636856808775682
