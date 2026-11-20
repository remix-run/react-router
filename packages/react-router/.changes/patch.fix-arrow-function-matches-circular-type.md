Fix circular type error when arrow function route components access `matches`

Accessing `matches` from `Route.ComponentProps` in an arrow function component caused a TypeScript circular type reference error while the equivalent function declaration worked fine.

The issue was that the generated `Matches` tuple included `module: typeof import("./self")` for the current route's entry. TypeScript's `RouteModule` assignability check evaluates `["default"]` — which for arrow functions requires resolving the parameter type annotation, ultimately looping back to `Route.ComponentProps`. Function declarations avoid this because their type is known from the declaration without evaluating parameter types.

The fix changes the type infrastructure to use a `MatchInfoWithLoaderData` alternative for the self-match entry, which carries `loaderData` directly and sidesteps the `RouteModule` check entirely.
