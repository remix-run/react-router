# Use `npm` to manage NPM dependencies for Deno projects

Date: 2022-05-10

Status: accepted

## Context

Deno has three ways to manage dependencies:

1. Inlined URL imports: `import {...} from "https://deno.land/x/blah"`
2. [deps.ts](https://deno.land/manual/examples/manage_dependencies)
3. [Import maps](https://deno.land/manual/linking_to_external_code/import_maps)

Additionally, NPM packages can be accessed as Deno modules via [Deno-friendly CDNs](https://deno.land/manual/node/cdns#deno-friendly-cdns) like https://esm.sh.

Remix has some requirements around dependencies:

- Remix treeshakes dependencies that are free of side-effects.
- Remix sets the environment (dev/prod/test) across all code, including dependencies, at runtime via the `NODE_ENV` environment variable.
- Remix depends on some NPM packages that should be specified as peer dependencies (notably, `react` and `react-dom`).

### Treeshaking

To optimize bundle size, Remix [treeshakes](https://esbuild.github.io/api/#tree-shaking) your app's code and dependencies.
This also helps to separate browser code and server code.

Under the hood, the Remix compiler uses [esbuild](https://esbuild.github.io).
Like other bundlers, `esbuild` uses [`sideEffects` in `package.json` to determine when it is safe to eliminate unused imports](https://esbuild.github.io/api/#conditionally-injecting-a-file).

Unfortunately, URL imports do not have a standard mechanism for marking packages as side-effect free.

### Setting dev/prod/test environment

Deno-friendly CDNs set the environment via a query parameter (e.g. `?dev`), not via an environment variable.
That means changing environment requires changing the URL import in the source code.
While you could use multiple import maps (`dev.json`, `prod.json`, etc...) to workaround this, import maps have other limitations:

- standard tooling for managing import maps is not available
- import maps are not composeable, so any dependencies that use import maps must be manually accounted for

### Specifying peer dependencies

Even if import maps were perfected, CDNs compile each dependency in isolation.
That means that specifying peer dependencies becomes tedious and error-prone as the user needs to:

- determine which dependencies themselves depend on `react` (or other similar peer dependency), even if indirectly.
- manually figure out which `react` version works across _all_ of these dependencies
- set that version for `react` as a query parameter in _all_ of the URLs for the identified dependencies

If any dependencies change (added, removed, version change),
the user must repeat all of these steps again.

## Decision

### Use `npm` to manage NPM dependencies for Deno

Do not use Deno-friendly CDNs for NPM dependencies in Remix projects using Deno.

Use `npm` and `node_modules/` to manage NPM dependencies like `react` for Remix projects, even when using Deno with Remix.

Deno module dependencies (e.g. from `https://deno.land`) can still be managed via URL imports.

### Allow URL imports

Remix will preserve any URL imports in the built bundles as external dependencies,
letting your browser runtime and server runtime handle them accordingly.
That means that you may:

- use URL imports for the browser
- use URL imports for the server, if your server runtime supports it

For example, Node will throw errors for URL imports, while Deno will resolve URL imports as normal.

### Do not support import maps

Remix will not yet support import maps.

## Consequences

- URL imports will not be treeshaken.
- Users can specify environment via the `NODE_ENV` environment variable at runtime.
- Users won't have to do error-prone, manual dependency resolution.

### VS Code type hints

Users may configure an import map for the [Deno extension for VS Code](denoland.vscode-deno) to enable type hints for NPM-managed dependencies within their Deno editor:

`.vscode/resolve_npm_imports_in_deno.json`

```json
{
  "// This import map is used solely for the denoland.vscode-deno extension.": "",
  "// Remix does not support import maps.": "",
  "// Dependency management is done through `npm` and `node_modules/` instead.": "",
  "// Deno-only dependencies may be imported via URL imports (without using import maps).": "",

  "imports": {
    "react": "https://esm.sh/react@18.0.0",
    "react-dom": "https://esm.sh/react-dom@18.0.0",
    "react-dom/server": "https://esm.sh/react-dom@18.0.0/server"
  }
}
```

`.vscode/settings.json`

```json
{
  "deno.enable": true,
  "deno.importMap": "./.vscode/resolve_npm_imports_in_deno.json"
}
```
