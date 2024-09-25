---
title: Route Module
order: 3
---

# Route Module

<docs-warning>
  The types for route modules are still in development, this API is stale and needs to be updated.
</docs-warning>

The files referenced in `routes.ts` are the entry points for all of your routes:

```tsx filename=app/routes.ts
route("teams/:teamId", "./team.tsx");
//           route module ^^^^^^^^
```

A route module is defined with `defineRoute$` as the module's default export:

```tsx filename=app/team.tsx
import { defineRoute$ } from "react-router";

export default defineRoute$({
  params: ["teamId"],

  async loader({ params }) {
    let team = await fetchTeam(params.teamId);
    return { name: team.name };
  },

  Component({ data }) {
    return <h1>{data.name}</h1>;
  },
});
```

These route modules define the majority of React Router's behavior:

- automatic code-splitting
- data loading
- actions
- revalidation
- error boundaries
- etc.

The rest of the getting started guides will cover these features in more detail.

## Static Analysis

The funky $ means that the Vite plugin is going to do some funny business with the source code and needs to be able to statically analyze it. Because of this, not all JavaScript patterns are valid here, for specifics on limitations see [Route Module Limitations](../discussion/route-module-limitations)

## Type Safety

The `params` key provides type safety both inside the module as well as at build time to ensure that the route is configured correctly. For example, if the route uses `:id` but the route module declares `params: ['teamId']`, you'll be notified at build time:

```tsx filename=app/routes.ts
route("teams/:id", "./team.tsx");
```

```tsx filename=app/team.tsx
import { defineRoute$ } from "react-router";

export default defineRoute$({
  params: ["teamId"],
  // build error: 'teamId' does not match 'teams/:id'

  // ...
});
```
