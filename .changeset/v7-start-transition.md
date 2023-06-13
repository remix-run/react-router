---
"react-router": minor
"react-router-dom": minor
---

Move [`React.startTransition`](https://react.dev/reference/react/startTransition) behind a [future flag](https://reactrouter.com/en/main/guides/api-development-strategy) to avoid issues with existing incompatible `Suspense` usages. We recommend folks adopting this flag to be better compatible with React concurrent mode, but if you run into issues you can continue without the use of `startTransition` until v7. Issues usually boils down to creating net-new promises during the render cycle, so if you run into issues you should either lift your promise creation out of the render cycle or put it behind a `useMemo`.

Existing behavior will no longer include `React.startTransition`:

```jsx
<BrowserRouter>
  <Routes>{/*...*/}</Routes>
</BrowserRouter>

<RouterProvider router={router} />
```

If you wish to enable `React.startTransition`, pass the future flag to your component:

```jsx
<BrowserRouter future={{ v7_startTransition: true }}>
  <Routes>{/*...*/}</Routes>
</BrowserRouter>

<RouterProvider router={router} future={{ v7_startTransition: true }}/>
```
