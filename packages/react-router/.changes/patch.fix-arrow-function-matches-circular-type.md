Fix a circular type error when arrow function route components access `matches` from `Route.ComponentProps`

- Use the current route's `loaderData` type directly so TypeScript can resolve `matches` without evaluating the component's own props again
