Fix circular type error when arrow function route components access `matches`

Typegen now emits `{ id, loaderData: Info["loaderData"] }` for the current route's entry in the `Matches` tuple instead of `{ id, module: typeof import("./self") }`. This avoids the `RouteModule` assignability check that caused a circular TypeScript type reference when the route's default export was an arrow function component.
