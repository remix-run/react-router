# RFC #12358 — `useRouterState()` — Decisions

Source: https://github.com/remix-run/react-router/discussions/12358 (roadmap #13073)

## Resolved

1. **Shipping**: `unstable_useRouterState`. No deprecations on existing hooks yet; additive API; no future flag.
2. **Re-render concerns (slorber/hollandThomas)**: Defer. Consume existing contexts as-is. Context split is tracked as a future follow-up.
3. **`transitioning` flag**: **Omit entirely.** React will natively support view transitions; we don't want to add surface we'll later remove.
4. **Mode scope**: Data / Framework / RSC only. Throw in Declarative (no data router).
5. **`type: NavigationType`**: Include on both `active` and `pending` variants.
6. **Path argument**: `PathPattern<Path> | Path` (no relative-path support). Same as `useMatch`.
7. **Typing by path**: Only type `params` via `Params<ParamParseKey<Path>>`. `location`, `searchParams`, `matches` keep their base types.
8. **Setter**: No `setSearchParams`. Read-only hook.
9. **No match**: `active === null` / `pending === null` when the provided path doesn't match (mirrors RFC examples).
10. **`matches` shape**: Simplified — `{ id, pathname }` only for now. We can expand later.
11. **Pending `matches`**: The router already computes pending matches internally — expose them via `router.state.navigation.matches`. Hook reads from there rather than running `matchRoutes` during render.

## Final API

```ts
type RouterStateMatch = {
  id: string;
  pathname: string;
};

type RouterStateVariant<Path extends string = string> = {
  location: Location;
  searchParams: URLSearchParams;
  params: Params<ParamParseKey<Path>>;
  matches: RouterStateMatch[];
  type: NavigationType;
};

type RouterState<Path extends string = string> = {
  active: RouterStateVariant<Path> | null;
  pending: RouterStateVariant<Path> | null;
};

export function unstable_useRouterState(): RouterState;
export function unstable_useRouterState<Path extends string>(
  path: PathPattern<Path> | Path,
): RouterState<Path>;
```

### Behavior

- **Without a path**: `active` is always non-null (the current location). `pending` is non-null whenever `navigation.state !== "idle"`.
- **With a path**: `active` is non-null only when `matchPath(path, location.pathname)` matches. `pending` is non-null only when navigation is in-flight and `matchPath(path, navigation.location.pathname)` matches.
- **Declarative mode**: throws with a clear error message.
