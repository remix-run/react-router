## Zero-effort Typesafety

Date: 2024-09-20

Status: accepted

## Context

[#0012](./0012-type-inference.md) lays out the foundation for typesafety in React Router.
As a result you can import route-specific types from `+types.<route>.ts` and annotate types for route exports:

```tsx
// app/routes/product.tsx
// URL path: /products/:id

import * as T from "./+types.product-details.ts";

export function loader({ params }: T.loader["args"]) {
  //                     ^? { id: string }
  const user = getUser(params.id);
  return { planet: "world", user };
}

export default function Component({
  loaderData,
}: // ^? { planet: string }
T.Default["args"]): T.Default["return"] {
  return <h1>Hello, {loaderData.planet}!</h1>;
}
```

### The type inference experience

These generated types are straightforward to wire up correctly, but are still boilerplate that would be present in every single route module.
In fact React Router knows what the types for each route export should be, so why do you have to manually annotate these types?

For other APIs you don't own — like third party libraries — you expect types to be provided for you.
That way, you can stick to annotating your own APIs when necessary but let type inference do the heavy lifting everywhere else.
So it feels unnatural to do so for React Router's route export API.
Ideally, you should be able to author routes without type annotations for route exports and TypeScript should be able to infer what they are:

```tsx
// app/routes/product.tsx
// URL path: /products/:id

export function loader({ params }) {
  //                     ^? { id: string }
  const user = getUser(params.id);
  return { planet: "world", user };
}

export default function Component({ loaderData }): {
  //                                ^? { planet: string }
  return <h1>Hello, {loaderData.planet}!</h1>;
}
```

### TypeScript limitations

1. **TypeScript cannot type modules**

   React Router knows which files are route modules and the types for exports from those modules.
   It'd be great if React Router could somehow transfer this knowledge to TypeScript, maybe something like:

   ```tsx
   import * as T from "./+types.product-details.ts";

   // I wish something like this worked, but there's no way to do this
   declare module "app/routes/product-details.tsx" satisfies {
     loader: (args: T.loader["args"]) => unknown
     default: (args: T.Default["args"]) => T.Default["return"]
   }
   ```

   Importantly, we need this imaginary API to use `satisfies` so that we can still infer the actual return types for things like `loader`.

   Unfortunately, TypeScript does not have any mechanism for typing modules.

2. **TypeScript plugin do not affect typechecking**

   TypeScript does have [language service plugins](https://github.com/microsoft/TypeScript/wiki/Writing-a-Language-Service-Plugin),
   but these plugins can only augment the experience in your editor.
   In other words, these plugins do not get used when `tsc` to typecheck your code.

   Relying solely on your editor to report type errors is insufficient as type errors can easily slip through.
   For example, you could edit one file and cause a type error in another file you never opened.
   To ensure this never happens, typechecking needs to be a standalone command runnable by CI.

## Goals

- Automate type annotations for route exports
- Minimize noise in route modules from automatic annotations
- Support in-editor diagnostics _and_ standalone typechecking in CI

## Decisions

### Autotype route exports

Conceptually, you should be able to write route modules without annotating types for route exports.
To accomplish this, React Router will implement a custom TypeScript language service that is a simple pass-through for non-route modules.
For routes, the language service will inject annotations for route exports at the correct locations _before_ the typechecker sees the file contents.

For example, you write this:

```tsx
// app/routes/product.tsx
// URL path: /products/:id

export function loader({ params }) {
  const user = getUser(params.id);
  return { planet: "world", user };
}

export default function Component({ loaderData }): {
  return <h1>Hello, {loaderData.planet}!</h1>;
}
```

And the language service will make sure the typechecker sees this:

```tsx
// app/routes/product.tsx
// URL path: /products/:id

export function loader({ params }: import("./+types.product").loader["args"]) {
  const user = getUser(params.id);
  return { planet: "world", user };
}

export default function Component({
  loaderData,
}: import("./+types.product").Default["args"]): import("./+types.product").Default["return"] {
  return <h1>Hello, {loaderData.planet}!</h1>;
}
```

The language service will be implemented to make minimal changes to the source file when auto-annotating route modules.
It will also translate any references to line/column numbers in the auto-typed code back to the corresponding line/column numbers in the original code
so that all typechecking and LSP features report warnings and errors relative to the source file.

Unlike a TS plugin, a language service is easily testable in isolation via the methods in the LSP spec.

### `typecheck` command

If you run `tsc` to typecheck your code, `tsc` won't know about our custom language service and will complain that route export args are typed as `any` due to missing type annotations.
Instead of invoking `tsc` directly as a CLI, React Router will provide a `typecheck` command that invokes the TypeScript typechecker progammatically with our custom language service.

It's worth noting that `tsc` is the TypeScript _compiler_, not just the typechecker.
Remix and React Router already use Vite to compile and bundle your code.
So delegating typechecking to TypeScript programmatically is less of a departure from `tsc` than using Vite is.

One limitation of the `typecheck` command is that it assumes that typechecking will be run for the app _independently_ of any other packages or apps in a monorepo.
Consequently, this approach does not support monorepos with a shared top-level `tsconfig.json` at the root of the monorepo that uses project references to typecheck across packages in the monorepo.

```txt
root/
  tsconfig.json 👈 if this uses `references`, that's a problem
  packages/
    mylib1/
    mylib2/
  apps/
    myapp1/
    myapp2/
```

Instead, each package of a monorepo should have its own `tsconfig.json` and you should avoid a top-level `tsconfig.json` in monorepos.
If you were relying on project references to get typechecking without needing to run builds for local dependencies, you can instead use [live types via custom `exports` conditions](https://colinhacks.com/essays/live-types-typescript-monorepo).

Note that this only applies to top-level `tsconfig`s in monorepo roots.
You can freely use project references _within_ the app root to split up the config for different environments like in the [Vite + React + TS template](https://vite.new/react-ts) on Stackblitz.

### Fallback to manual type annotations

While we think this makes the default DX much better for most projects, we need a graceful fallback to provide typesafety for edge cases.

This feature builds on top of the route-specific typegen described in [#0012](./0012-type-inference.md), so
those typegen files will still be there if you prefer to manually annotate your route exports.

One reason you might want to do this is if your project uses tools that independently inspect types in your app.
For example, [typescript-eslint](https://typescript-eslint.io/) will think that route export args are typed as `any`.

## Thank you

Credit to Svelte Kit for their [_Zero-effort type safety_ approach](https://svelte.dev/blog/zero-config-type-safety) that heavily influenced the design and implementation of this feature.
Special thanks to [Simon H](https://twitter.com/dummdidumm_) from the Svelte team for answering our questions about it.
