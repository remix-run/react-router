Add `unstable_useRouterState` hook that unifies access to active and pending router state

- New hook returns `{ active, pending }`, each a variant with `location`, `searchParams`, `params`, `matches` (`{id, pathname}[]`), and `type: NavigationType`
- `active` is always populated; `pending` is non-null only during in-flight navigations
- Adds `matches` and `historyAction` to `state.navigation` so pending navigations can expose their matched routes and navigation type
- Data/Framework/RSC only — throws when used without a data router
- Implements RFC #12358
