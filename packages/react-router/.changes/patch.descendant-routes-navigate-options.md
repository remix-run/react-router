Forward all `NavigateOptions` from `<RouterProvider>`'s `navigator.push()` and `navigator.replace()` to `router.navigate()`

- Options such as `mask`, `defaultShouldRevalidate`, `flushSync`, and `viewTransition` now reach the router from `<Link>`, `useNavigate()`, and `useSearchParams()` inside descendant `<Routes>` in Data and Framework modes
