# Type inference

Date: 2024-09-20

Status: accepted

Supersedes [#0003](./0003-infer-types-for-useloaderdata-and-useactiondata-from-loader-and-action-via-generics.md)

## Context

Now that Remix is being merged upstream into React Router, we have an opportunity to revisit our approach to typesafety.

### Type inference

There are three major aspects to typesafety in a framework like React Router:

1. **Type inference from the route config**

   Some types are defined in the route config (`routes.ts`) but need to be inferred within a route module.

   For example, let's look at URL path parameters.
   Remix had no mechanism for inferring path parameters as that information is not present _within_ a route module.
   If a route's URL path was `/products/:id`, you'd have to manually specify `"id"` as a valid path parameter within that route module:

   ```ts
   const params = useParams<"id">();
   params.id;
   ```

   This generic was nothing more than a convenient way to do a type cast.
   You could completely alter the URL path for a route module, typechecking would pass, but then you would get runtime errors.

2. **Type inference within a route**

   Some types are defined within a route module but need to be inferred across route exports.

   For example, loader data is defined by the return type of `loader` but needs to be accessed within the `default` component export:

   ```ts
   export function loader() {
     // define here 👇
     return { planet: "world" };
   }

   export default function Component() {
     // access here 👇
     const data = useLoaderData<typeof loader>();
   }
   ```

   Unlike the `useParams` generic, this isn't just a type cast.
   The `useLoaderData` generic ensures that types account for serialization across the network.
   However, it still requires you to add `typeof loader` every time.

   Not only that, but complex routes get very tricky to type correctly.
   For example, `clientLoader`s don't run during the initial SSR render, but you can force the `clientLoader` data to always be present in your route component if you set `clientLoader.hydrate = true` _and_ provide a `HydrateFallback`.
   Here are a couple cases that trip up most users:

   | `loader` | `clientLoader` | `clientLoader.hydrate` | `HydrateFallback` | Generic for `useLoaderData`            |
   | -------- | -------------- | ---------------------- | ----------------- | -------------------------------------- |
   | ✅       | ❌             | `false`                | ❌                | `typeof loader`                        |
   | ❌       | ✅             | `false`                | ❌                | `typeof clientLoader \| undefined`     |
   | ✅       | ✅             | `false`                | ❌                | `typeof loader \| typeof clientLoader` |
   | ✅       | ✅             | `true`                 | ❌                | `typeof loader \| typeof clientLoader` |
   | ✅       | ✅             | `true`                 | ✅                | `typeof clientLoader`                  |

   The generic for `useLoaderData` starts to feel a lot like doing your taxes: there's only one right answer, Remix knows what it is, but you're going to get quizzed on it anyway.

3. **Type inference across routes**

   Some types are defined in one route module but need to be inferred in another route module.
   This is common when wanting to access loader data of matched routes like when using `useMatches` or `useRouteLoaderData`.

   ```ts
   import type { loader as otherLoader } from "../other-route.ts";
   // hope the other route is also matched 👇 otherwise this will error at runtime
   const otherData = useRouteLoaderData<typeof otherLoader>();
   ```

   Again, its up to you to wire up the generics with correct types.
   In this case you need to know both types defined in the route config (to know which routes are matched) and types defined in other route modules (to know the loader data for those routes).

In practice, Remix's generics work fine most of the time.
But they are mostly boilerplate and can become error-prone as the app scales.
An ideal solution would infer types correctly on your behalf, doing away with tedious generics.

## Goals

- Type inference from the route config (`routes.ts`)
- Type inference within a route
- Type inference across routes
- Same code path for type inference whether using programmatic routing or file-based routing
- Compatibility with standard tooling for treeshaking, HMR, etc.
- Minimal impact on runtime API design

## Decisions

### Route exports API

Keep the route module export API as is.
Route modules should continue to export separate values for `loader`, `clientLoader`, `action`, `ErrorBoundary`, `default` component, etc.
That way standard transforms like treeshaking and React Fast Refresh (HMR) work out-of-the-box.

Additionally, this approach introduces no breaking changes allowing Remix users to upgrade to React Router v7 more easily.

### Pass path params, loader data, and action data as props

Hooks like `useParams`, `useLoaderData`, and `useActionData` are defined once in `react-router` and are meant to be used in _any_ route.
Without any coupling to a specific route, inferring route-specific types becomes impossible and would necessitate user-supplied generics.

Instead, each route export should be provided route-specific args:

```ts
// Imagine that we *somehow* had route-specific types for:
// - LoaderArgs
// - ClientLoaderArgs
// - DefaultProps

export function loader({ params }: LoaderArgs) {}

export function clientLoader({ params, serverLoader }: ClientLoaderArgs) {}

export default function Component({
  params,
  loaderData,
  actionData,
}: DefaultProps) {
  // ...
}
```

We'll keep those hooks around for backwards compatibility, but eventually the aim is to deprecate and remove them.
We can design new, typesafe alternatives for any edge cases.

### Typegen

While React Router will default to programmatic routing, it can easily be configured for file-based routing.
That means that sometimes route URLs will only be represented as file paths.
Unfortunately, TypeScript cannot use the filesystem as part of its type inference nor type checking.
The only tenable way to infer types based on file paths is through code generation.

We _could_ have typegen just for file-based routing, but then we'd need to maintain a separate code path for type inference in programmatic routing.
To keep things simple, React Router treats any value returned by `routes.ts` the same; it will not make assumptions about _how_ those routes were constructed and will run typegen in all cases.

To that end, React Router will generate types for each route module into a special, gitignored `.react-router` directory.
For example:

```txt
- .react-router/
  - types/
    - app/
      - routes/
        - +types.product.ts
- app/
  - routes/
    - product.tsx
```

The path within `.react-router/types` purposefully mirrors the path to the corresponding route module.
By setting things up like this, we can use `tsconfig.json`'s [rootDirs](https://www.typescriptlang.org/tsconfig/#rootDirs) option to let you conveniently import from the typegen file as if it was a sibling:

```ts
// app/routes/product.tsx
import { LoaderArgs, DefaultProps } from "./+types.product";
```

TypeScript will even give you import autocompletion for the typegen file and the `+` prefix helps to distinguish it as a special file.
Big thanks to Svelte Kit for showing us that [`rootDirs` trick](https://svelte.dev/blog/zero-config-type-safety#virtual-files)!

### Watch mode

Typegen solutions often receive criticism due to typegen'd files becoming out of sync during development.
This happens because many typegen solutions require you to then rerun a script to update the typegen'd files.

Instead, we'll provide a `--watch` flag for the `react-router typegen` command to automatically regenerate types as files change.
It's also straightforward to automatically run commands like `react-router typegen --watch` when opening up any modern editors.

In the future, we may also kick off typegen watching as part of running a React Router dev server.

## Rejected solutions

### `defineRoute`

Early on, we considered changing the route module API from many exports to a single `defineRoute` export:

```tsx
export default defineRoute({
  loader() {
    return { planet: "world" };
  },
  Component({ loaderData }) {
    return <h1>Hello, {loaderData.planet}!</h1>;
  },
});
```

That way `defineRoute` could do some TypeScript magic to infer `loaderData` based on `loader` (type inference within a route).
With some more work, we envisioned that `defineRoute` could return utilities like a typesafe `useRouteLoaderData` (type inference across routes).

However, there were still many drawbacks with this design:

1. Type inference across function arguments depends on the ordering of those arguments.
   That means that if you put `Component` before `loader` type inference is busted and you'll get gnarly type errors.

2. Any mechanism expressible solely as code in a route module cannot infer types from the route config (`routes.ts`).
   That means no type inference for things like path params nor for `<Link to="..." />`.

3. Transforms that expect to operate on module exports can no longer access parts of the route.
   For example, bundlers would only see one big export so they would bail out of treeshaking route modules.
   Similarly, React-based HMR via React Fast Refresh looks for React components as exports of a module.
   It would be possible to augment React component detection for HMR to look within a function call like `defineRoute`, but it significantly ups the complexity.

### `defineLoader` and friends

Instead of a single `defineRoute` function as described above, we could have a `define*` function for each route export:

```tsx
import { defineLoader } from "./+types.product";

export const loader = defineLoader(() => {
  return { planet: "world" };
});
```

That would address the most of the drawbacks of the `defineRoute` approach.
However, this adds significant noise to the code.
It also means we're introducing a runtime API that only exists for typesafety.

Additionally, utilities like `defineLoader` are implemented with an `extends` generic that [does not pin point incorrect return statements](https://tsplay.dev/WJP7ZN):

```ts
const defineLoader = <T extends Loader>(loader: T): T => loader;

export const loader = defineLoader(() => {
  //                               ^^^^^^^
  // Argument of type '() => "string" | 1' is not assignable to parameter of type 'Loader'.
  //   Type 'string | number' is not assignable to type 'number'.
  //     Type 'string' is not assignable to type 'number'.(2345)

  if (Math.random() > 0.5) return "string"; // 👈 don't you wish the error was here instead?
  return 1;
});
```

### Zero-effort typesafety

Svelte Kit has a ["zero-effort" type safety approach](https://svelte.dev/blog/zero-config-type-safety) that uses a TypeScript language service plugin to automatically inject types for framework-specific exports.
Initially, this seemed like a good fit for React Router too, but we ran into a couple drawbacks:

1. Tools like `typescript-eslint` that need to statically inspect the types of your TS files without running a language server would not be aware of the injected types.
   There's an open issue for [`typescript-eslint` interop with Svelte Kit](https://github.com/sveltejs/language-tools/issues/2073)

2. Running `tsc` would perform typechecking without any knowledge of our custom language service.
   To fix this, we would need to wrap `tsc` in our own CLI that programmatically calls the TS typechecker.
   For Svelte Kit, this isn't as big of an issue since they already need their own typecheck command for the Svelte language: `svelte-check`.
   But since React Router is pure TypeScript, it would be more natural to invoke `tsc` directly in your `package.json` scripts.

### TypeScript plugin

Originally, we created a basic TypeScript plugin to automatically run typegen in watch mode.
One nice thing about this approach is that it worked across all editors.

However, there were a couple drawbacks:

1. A TypeScript plugin will silently fail to run unless you have installed dependencies prior to opening up the project in your editor.

2. A TypeScript plugin requires your editor to use the local (workspace) version of TypeScript.
   But by default [VSCode won't use the workspace version of TypeScript](https://code.visualstudio.com/docs/typescript/typescript-compiling#_using-the-workspace-version-of-typescript), forcing you to run the `Select TypeScript Version` command every time you open up a new project.
   You can workaround this via the `typescript.tsdk` and `typescript.enablePromptUseWorkspaceTsdk` options in `.vscode/settings.json`, but those only take effect when that _specific_ directory is opened as by VSCode.
   For example, if you added `.vscode/settings.json` to a subfolder of a monorepo those options would be ignored when opening the root of the monorepo with VSCode.

3. Debugging a TypeScript plugin is not straightforward as you need to know to run the `Open TS Server log` command in VSCode and sift through verbose logs.
   Without this knowledge, its hard to know if you've set up typegen correctly.
   And even if you do know this, its tedious to find out what went wrong.

After we decided not to pursue "zero-effort typesafety" (as described above), our TypeScript plugin was already a simple passthrough that kicked off typegen as a side-effect.
This was an additional indication that maybe a TypeScript plugin was not the right place for our typegen.

## Summary

By leaning into automated typegen, we radically simplify React Router's runtime APIs while providing strong type inference across the entire framework.
We can continue to support programmatic routing _and_ file-based routing in `routes.ts` while providing typesafety with the same approach and same code path.
We can design our runtime APIs without introducing bespoke ways to inform TypeScript of the route hierarchy.

The initial implementation will be focused on typesafety for path params, loader data, and action data.
That said, this foundation lets us add type inference for things like `<Link to="..." />` and search params in the future.
