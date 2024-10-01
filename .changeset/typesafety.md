---
"@react-router/dev": minor
"react-router": minor
---

### Typesafety improvements

React Router now generates types for each of your route modules.
You can access those types by importing them from `./+types/<route filename without extension>`.
For example:

```ts
// app/routes/product.tsx
import type * as Route from "./+types/product";

export function loader({ params }: Route.LoaderArgs) {}

export default function Component({ loaderData }: Route.ComponentProps) {}
```

This initial implementation targets type inference for:

- `Params` : Path parameters from your routing config in `routes.ts` including file-based routing
- `LoaderData` : Loader data from `loader` and/or `clientLoader` within your route module
- `ActionData` : Action data from `action` and/or `clientAction` within your route module

These types are then used to create types for route export args and props:

- `LoaderArgs`
- `ClientLoaderArgs`
- `ActionArgs`
- `ClientActionArgs`
- `HydrateFallbackProps`
- `ComponentProps` (for the `default` export)
- `ErrorBoundaryProps`

In the future, we plan to add types for the rest of the route module exports: `meta`, `links`, `headers`, `shouldRevalidate`, etc.
We also plan to generate types for typesafe `Link`s:

```tsx
<Link to="/products/:id" params={{ id: 1 }} />
//        ^^^^^^^^^^^^^          ^^^^^^^^^
// typesafe `to` and `params` based on the available routes in your app
```

#### Setup

React Router will generate types into a `.react-router/` directory at the root of your app.
This directory is fully managed by React Router and is derived based on your route config (`routes.ts`).

👉 ** Add `.react-router/` to `.gitignore` **

```txt
.react-router
```

You should also ensure that generated types for routes are always present before running typechecking,
especially for running typechecking in CI.

👉 ** Add `react-router typegen` to your `typecheck` command in `package.json` **

```json
{
  "scripts": {
    "typecheck": "react-router typegen && tsc"
  }
}
```

To get TypeScript to use those generated types, you'll need to add them to `include` in `tsconfig.json`.
And to be able to import them as if they files next to your route modules, you'll also need to configure `rootDirs`.

👉 ** Configure `tsconfig.json` for generated types **

```json
{
  "include": [".react-router/types/**/*"],
  "compilerOptions": {
    "rootDirs": [".", "./.react-router/types"]
  }
}
```

#### `typegen` command

You can manually generate types with the new `typegen` command:

```sh
react-router typegen
```

However, manual type generation is tedious and types can get out of sync quickly if you ever forget to run `typegen`.
Instead, we recommend that you setup our new TypeScript plugin which will automatically generate fresh types whenever routes change.
That way, you'll always have up-to-date types.

#### TypeScript plugin

To get automatic type generation, you can use our new TypeScript plugin.

👉 ** Add the TypeScript plugin to `tsconfig.json` **

```json
{
  "compilerOptions": {
    "plugins": [{ "name": "@react-router/dev" }]
  }
}
```

We plan to add some other goodies to our TypeScript plugin soon, including:

- Automatic `jsdoc` for route exports that include links to official docs
- Autocomplete for route exports
- Warnings for non-HMR compliant exports

##### VSCode

TypeScript looks for plugins registered in `tsconfig.json` in the local `node_modules/`,
but VSCode ships with its own copy of TypeScript that is installed outside of your project.
For TypeScript plugins to work, you'll need to tell VSCode to use the local workspace version of TypeScript.

👉 ** Ensure that VSCode is using the workspace version of TypeScript **

This should already be set up for you by a `.vscode/settings.json`:

```json
{
  "typescript.tsdk": "node_modules/typescript/lib"
}
```

Alternatively, you can open up any TypeScript file and use <kbd>CMD</kbd>+<kbd>SHIFT</kbd>+<kbd>P</kbd> to find `Select TypeScript Version` and then select `Use Workspace Version`. You may need to quit VSCode and reopen it for this setting to take effect.

##### Troubleshooting

In VSCode, open up any TypeScript file in your project and then use <kbd>CMD</kbd>+<kbd>SHIFT</kbd>+<kbd>P</kbd> to select `Open TS Server log`.
There should be a log for `[react-router] setup` that indicates that the plugin was resolved correctly.
Then look for any errors in the log.
