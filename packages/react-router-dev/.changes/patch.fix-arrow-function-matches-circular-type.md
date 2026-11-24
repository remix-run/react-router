Fix a circular type error when arrow function route components access `matches`

- Generate the current route's entry in `Matches` with `loaderData` directly to avoid a circular reference to the route module
