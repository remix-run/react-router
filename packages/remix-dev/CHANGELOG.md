# `@remix-run/dev`

## 2.5.1

### Patch Changes

- Add `isSpaMode` to `@remix-run/dev/server-build` virtual module ([#8492](https://github.com/remix-run/remix/pull/8492))
- Automatically prepend `<!DOCTYPE html>` if not present to fix quirks mode warnings for SPA template ([#8495](https://github.com/remix-run/remix/pull/8495))
- Vite: Errors for server-only code point to new docs ([#8488](https://github.com/remix-run/remix/pull/8488))
- Vite: Fix HMR race condition when reading changed file contents ([#8479](https://github.com/remix-run/remix/pull/8479))
- Vite: Tree-shake unused route exports in the client build ([#8468](https://github.com/remix-run/remix/pull/8468))
- Vite: Performance profiling ([#8493](https://github.com/remix-run/remix/pull/8493))
  - Run `remix vite:build --profile` to generate a `.cpuprofile` that can be shared or uploaded to speedscope.app
  - In dev, press `p + enter` to start a new profiling session or stop the current session
  - If you need to profile dev server startup, run `remix vite:dev --profile` to initialize the dev server with a running profiling session
  - For more, see the new docs: Vite > Performance
- Vite: Improve performance of dev server requests by invalidating Remix's virtual modules on relevant file changes rather than on every request ([#8164](https://github.com/remix-run/remix/pull/8164))
- Updated dependencies:
  - `@remix-run/node@2.5.1`
  - `@remix-run/server-runtime@2.5.1`

## 2.5.0

### Minor Changes

- Add unstable support for "SPA Mode" ([#8457](https://github.com/remix-run/remix/pull/8457))

  You can opt into SPA Mode by setting `unstable_ssr: false` in your Remix Vite plugin config:

  ```js
  // vite.config.ts
  import { unstable_vitePlugin as remix } from "@remix-run/dev";
  import { defineConfig } from "vite";

  export default defineConfig({
    plugins: [remix({ unstable_ssr: false })],
  });
  ```

  Development in SPA Mode is just like a normal Remix app, and still uses the Remix dev server for HMR/HDR:

  ```sh
  remix vite:dev
  ```

  Building in SPA Mode will generate an `index.html` file in your client assets directory:

  ```sh
  remix vite:build
  ```

  To run your SPA, you serve your client assets directory via an HTTP server:

  ```sh
  npx http-server build/client
  ```

  For more information, please refer to the [SPA Mode docs](https://remix.run/future/spa-mode).

- Add `unstable_serverBundles` option to Vite plugin to support splitting server code into multiple request handlers. ([#8332](https://github.com/remix-run/remix/pull/8332))

  This is an advanced feature designed for hosting provider integrations. When compiling your app into multiple server bundles, there will need to be a custom routing layer in front of your app directing requests to the correct bundle. This feature is currently unstable and only designed to gather early feedback.

  **Example usage:**

  ```ts
  import { unstable_vitePlugin as remix } from "@remix-run/dev";
  import { defineConfig } from "vite";

  export default defineConfig({
    plugins: [
      remix({
        unstable_serverBundles: ({ branch }) => {
          const isAuthenticatedRoute = branch.some(
            (route) => route.id === "routes/_authenticated"
          );

          return isAuthenticatedRoute ? "authenticated" : "unauthenticated";
        },
      }),
    ],
  });
  ```

### Patch Changes

- Fix issue with `isbot` v4 released on 1/1/2024 ([#8415](https://github.com/remix-run/remix/pull/8415))

  - `remix dev` will now add `"isbot": "^4"` to `package.json` instead of using `latest`
  - Update built-in `entry.server` files to work with both `isbot@3` and `isbot@4` for backwards-compatibility with Remix apps that have pinned `isbot` to v3
  - Templates are updated to use `isbot@4` moving forward via `create-remix`

- Vite: Fix HMR issues when altering exports for non-rendered routes ([#8157](https://github.com/remix-run/remix/pull/8157))

- Vite: Default `NODE_ENV` to `"production"` when running `remix vite:build` command ([#8405](https://github.com/remix-run/remix/pull/8405))

- Vite: Remove Vite plugin config option `serverBuildPath` in favor of separate `serverBuildDirectory` and `serverBuildFile` options ([#8332](https://github.com/remix-run/remix/pull/8332))

- Vite: Loosen strict route exports restriction, reinstating support for non-Remix route exports ([#8420](https://github.com/remix-run/remix/pull/8420))

- Updated dependencies:
  - `@remix-run/server-runtime@2.5.0`
  - `@remix-run/node@2.5.0`

## 2.4.1

### Patch Changes

- Vite: Error messages when `.server` files are referenced by client ([#8267](https://github.com/remix-run/remix/pull/8267))

  - Previously, referencing a `.server` module from client code resulted in an error message like:
    - `The requested module '/app/models/answer.server.ts' does not provide an export named 'isDateType'`
  - This was confusing because `answer.server.ts` _does_ provide the `isDateType` export, but Remix was replacing `.server` modules with empty modules (`export {}`) for the client build
  - Now, Remix explicitly fails at compile time when a `.server` module is referenced from client code and includes dedicated error messages depending on whether the import occurs in a route or a non-route module
  - The error messages also include links to relevant documentation

- Remove `unstable_viteServerBuildModuleId` in favor of manually referencing virtual module name `"virtual:remix/server-build"`. ([#8264](https://github.com/remix-run/remix/pull/8264))

  **This is a breaking change for projects using the unstable Vite plugin with a custom server.**

  This change was made to avoid issues where `@remix-run/dev` could be inadvertently required in your server's production dependencies.

  Instead, you should manually write the virtual module name `"virtual:remix/server-build"` when calling `ssrLoadModule` in development.

  ```diff
  -import { unstable_viteServerBuildModuleId } from "@remix-run/dev";

  // ...

  app.all(
    "*",
    createRequestHandler({
      build: vite
  -      ? () => vite.ssrLoadModule(unstable_viteServerBuildModuleId)
  +      ? () => vite.ssrLoadModule("virtual:remix/server-build")
        : await import("./build/server/index.js"),
    })
  );
  ```

- Vite: Fix errors for non-existent `index.html` importer ([#8353](https://github.com/remix-run/remix/pull/8353))

- Add `vite:dev` and `vite:build` commands to the Remix CLI. ([#8211](https://github.com/remix-run/remix/pull/8211))

  In order to handle upcoming Remix features where your plugin options can impact the number of Vite builds required, you should now run your Vite `dev` and `build` processes via the Remix CLI.

  ```diff
  {
    "scripts": {
  -    "dev": "vite dev",
  -    "build": "vite build && vite build --ssr"
  +    "dev": "remix vite:dev",
  +    "build": "remix vite:build"
    }
  }
  ```

- Vite: Preserve names for exports from `.client` modules ([#8200](https://github.com/remix-run/remix/pull/8200))

  Unlike `.server` modules, the main idea is not to prevent code from leaking into the server build
  since the client build is already public. Rather, the goal is to isolate the SSR render from client-only code.
  Routes need to import code from `.client` modules without compilation failing and then rely on runtime checks
  or otherwise ensure that execution only happens within a client-only context (e.g. event handlers, `useEffect`).

  Replacing `.client` modules with empty modules would cause the build to fail as ESM named imports are statically analyzed.
  So instead, we preserve the named export but replace each exported value with `undefined`.
  That way, the import is valid at build time and standard runtime checks can be used to determine if the
  code is running on the server or client.

- Disable watch mode in Vite child compiler during build ([#8342](https://github.com/remix-run/remix/pull/8342))

- Vite: Show warning when source maps are enabled in production build ([#8222](https://github.com/remix-run/remix/pull/8222))

- Updated dependencies:
  - `@remix-run/server-runtime@2.4.1`
  - `@remix-run/node@2.4.1`

## 2.4.0

### Minor Changes

- Vite: exclude modules within `.server` directories from client build ([#8154](https://github.com/remix-run/remix/pull/8154))

- Add support for `clientLoader`/`clientAction`/`HydrateFallback` route exports ([RFC](https://github.com/remix-run/remix/discussions/7634)) ([#8173](https://github.com/remix-run/remix/pull/8173))

  Remix now supports loaders/actions that run on the client (in addition to, or instead of the loader/action that runs on the server). While we still recommend server loaders/actions for the majority of your data needs in a Remix app - these provide some levers you can pull for more advanced use-cases such as:

  - Leveraging a data source local to the browser (i.e., `localStorage`)
  - Managing a client-side cache of server data (like `IndexedDB`)
  - Bypassing the Remix server in a BFF setup and hitting your API directly from the browser
  - Migrating a React Router SPA to a Remix application

  By default, `clientLoader` will not run on hydration, and will only run on subsequent client side navigations.

  If you wish to run your client loader on hydration, you can set `clientLoader.hydrate=true` to force Remix to execute it on initial page load. Keep in mind that Remix will still SSR your route component so you should ensure that there is no new _required_ data being added by your `clientLoader`.

  If your `clientLoader` needs to run on hydration and adds data you require to render the route component, you can export a `HydrateFallback` component that will render during SSR, and then your route component will not render until the `clientLoader` has executed on hydration.

  `clientAction` is simpler than `clientLoader` because it has no hydration use-cases. `clientAction` will only run on client-side navigations.

  For more information, please refer to the [`clientLoader`](https://remix.run/route/client-loader) and [`clientAction`](https://remix.run/route/client-action) documentation.

- Vite: Strict route exports ([#8171](https://github.com/remix-run/remix/pull/8171))

  With Vite, Remix gets stricter about which exports are allowed from your route modules.
  Previously, the Remix compiler would allow any export from routes.
  While this was convenient, it was also a common source of bugs that were hard to track down because they only surfaced at runtime.

  For more, see <https://remix.run/docs/en/main/future/vite#strict-route-exports>

- Add a new `future.v3_relativeSplatPath` flag to implement a breaking bug fix to relative routing when inside a splat route. For more information, please see the React Router [`6.21.0` Release Notes](https://github.com/remix-run/react-router/blob/release-next/CHANGELOG.md#futurev7_relativesplatpath) and the [`useResolvedPath` docs](https://remix.run/hooks/use-resolved-path#splat-paths). ([#8216](https://github.com/remix-run/remix/pull/8216))

### Patch Changes

- Upgrade Vite peer dependency range to v5 ([#8172](https://github.com/remix-run/remix/pull/8172))

- Support HMR for routes with `handle` export in Vite dev ([#8022](https://github.com/remix-run/remix/pull/8022))

- Fix flash of unstyled content for non-Express custom servers in Vite dev ([#8076](https://github.com/remix-run/remix/pull/8076))

- Bundle CSS imported in client entry file in Vite plugin ([#8143](https://github.com/remix-run/remix/pull/8143))

- Change Vite build output paths to fix a conflict between how Vite and the Remix compiler each manage the `public` directory. ([#8077](https://github.com/remix-run/remix/pull/8077))

  **This is a breaking change for projects using the unstable Vite plugin.**

  The server is now compiled into `build/server` rather than `build`, and the client is now compiled into `build/client` rather than `public`.

  For more information on the changes and guidance on how to migrate your project, refer to the updated [Remix Vite documentation](https://remix.run/docs/en/main/future/vite).

- Remove undocumented `legacyCssImports` option from Vite plugin due to issues with `?url` imports of CSS files not being processed correctly in Vite ([#8096](https://github.com/remix-run/remix/pull/8096))

- Vite: fix access to default `entry.{client,server}.tsx` within pnpm workspace on Windows ([#8057](https://github.com/remix-run/remix/pull/8057))

- Remove `unstable_createViteServer` and `unstable_loadViteServerBuild` which were only minimal wrappers around Vite's `createServer` and `ssrLoadModule` functions when using a custom server. ([#8120](https://github.com/remix-run/remix/pull/8120))

  **This is a breaking change for projects using the unstable Vite plugin with a custom server.**

  Instead, we now provide `unstable_viteServerBuildModuleId` so that custom servers interact with Vite directly rather than via Remix APIs, for example:

  ```diff
  -import {
  -  unstable_createViteServer,
  -  unstable_loadViteServerBuild,
  -} from "@remix-run/dev";
  +import { unstable_viteServerBuildModuleId } from "@remix-run/dev";
  ```

  Creating the Vite server in middleware mode:

  ```diff
  const vite =
    process.env.NODE_ENV === "production"
      ? undefined
  -    : await unstable_createViteServer();
  +    : await import("vite").then(({ createServer }) =>
  +        createServer({
  +          server: {
  +            middlewareMode: true,
  +          },
  +        })
  +      );
  ```

  Loading the Vite server build in the request handler:

  ```diff
  app.all(
    "*",
    createRequestHandler({
      build: vite
  -      ? () => unstable_loadViteServerBuild(vite)
  +      ? () => vite.ssrLoadModule(unstable_viteServerBuildModuleId)
        : await import("./build/server/index.js"),
    })
  );
  ```

- Pass request handler errors to `vite.ssrFixStacktrace` in Vite dev to ensure stack traces correctly map to the original source code ([#8066](https://github.com/remix-run/remix/pull/8066))

- Vite: Preserve names for exports from .client imports ([#8200](https://github.com/remix-run/remix/pull/8200))

  Unlike `.server` modules, the main idea is not to prevent code from leaking into the server build
  since the client build is already public. Rather, the goal is to isolate the SSR render from client-only code.
  Routes need to import code from `.client` modules without compilation failing and then rely on runtime checks
  to determine if the code is running on the server or client.

  Replacing `.client` modules with empty modules would cause the build to fail as ESM named imports are statically analyzed.
  So instead, we preserve the named export but replace each exported value with an empty object.
  That way, the import is valid at build time and the standard runtime checks can be used to determine if then
  code is running on the server or client.

- Add `@remix-run/node` to Vite's `optimizeDeps.include` array ([#8177](https://github.com/remix-run/remix/pull/8177))

- Improve Vite plugin performance ([#8121](https://github.com/remix-run/remix/pull/8121))

  - Parallelize detection of route module exports
  - Disable `server.preTransformRequests` in Vite child compiler since it's only used to process route modules

- Remove automatic global Node polyfill installation from the built-in Vite dev server and instead allow explicit opt-in. ([#8119](https://github.com/remix-run/remix/pull/8119))

  **This is a breaking change for projects using the unstable Vite plugin without a custom server.**

  If you're not using a custom server, you should call `installGlobals` in your Vite config instead.

  ```diff
  import { unstable_vitePlugin as remix } from "@remix-run/dev";
  +import { installGlobals } from "@remix-run/node";
  import { defineConfig } from "vite";

  +installGlobals();

  export default defineConfig({
    plugins: [remix()],
  });
  ```

- Vite: Errors at build-time when client imports .server default export ([#8184](https://github.com/remix-run/remix/pull/8184))

  Remix already stripped .server file code before ensuring that server code never makes it into the client.
  That results in errors when client code tries to import server code, which is exactly what we want!
  But those errors were happening at runtime for default imports.
  A better experience is to have those errors happen at build-time so that you guarantee that your users won't hit them.

- Fix `request instanceof Request` checks when using Vite dev server ([#8062](https://github.com/remix-run/remix/pull/8062))

- Updated dependencies:
  - `@remix-run/server-runtime@2.4.0`
  - `@remix-run/node@2.4.0`

## 2.3.1

### Patch Changes

- Support `nonce` prop on `LiveReload` component in Vite dev ([#8014](https://github.com/remix-run/remix/pull/8014))
- Ensure code-split JS files in the server build's assets directory aren't cleaned up after Vite build ([#8042](https://github.com/remix-run/remix/pull/8042))
- Fix redundant copying of assets from `public` directory in Vite build ([#8039](https://github.com/remix-run/remix/pull/8039))
  - This ensures that static assets aren't duplicated in the server build directory
  - This also fixes an issue where the build would break if `assetsBuildDirectory` was deeply nested within the `public` directory
- Updated dependencies:
  - `@remix-run/node@2.3.1`
  - `@remix-run/server-runtime@2.3.1`

## 2.3.0

### Patch Changes

- Support rendering of `LiveReload` component after `Scripts` in Vite dev ([#7919](https://github.com/remix-run/remix/pull/7919))
- fix(vite): fix "react-refresh/babel" resolution for custom server with pnpm ([#7904](https://github.com/remix-run/remix/pull/7904))
- Support JSX usage in `.jsx` files without manual `React` import in Vite ([#7888](https://github.com/remix-run/remix/pull/7888))
- Support optional rendering of `LiveReload` component in Vite dev ([#7919](https://github.com/remix-run/remix/pull/7919))
- Fix Vite production builds when plugins that have different local state between `development` and `production` modes are present, e.g. `@mdx-js/rollup`. ([#7911](https://github.com/remix-run/remix/pull/7911))
- Cache resolution of Remix Vite plugin options ([#7908](https://github.com/remix-run/remix/pull/7908))
- Support Vite 5 ([#7846](https://github.com/remix-run/remix/pull/7846))
- Allow `process.env.NODE_ENV` values other than `"development"` in Vite dev ([#7980](https://github.com/remix-run/remix/pull/7980))
- Attach CSS from shared chunks to routes in Vite build ([#7952](https://github.com/remix-run/remix/pull/7952))
- fix(vite): Let Vite handle serving files outside of project root via `/@fs` ([#7913](https://github.com/remix-run/remix/pull/7913))
  - This fixes errors when using default client entry or server entry in a pnpm project where those files may be outside of the project root, but within the workspace root.
  - By default, Vite prevents access to files outside the workspace root (when using workspaces) or outside of the project root (when not using workspaces) unless user explicitly opts into it via Vite's `server.fs.allow`.
- Improve performance of LiveReload proxy in Vite dev ([#7883](https://github.com/remix-run/remix/pull/7883))
- fix(vite): deduplicate `@remix-run/react` ([#7926](https://github.com/remix-run/remix/pull/7926))
  - Pre-bundle Remix dependencies to avoid Remix router duplicates.
  - Our remix-react-proxy plugin does not process default client and
  - server entry files since those come from within `node_modules`.
  - That means that before Vite pre-bundles dependencies (e.g. first time dev server is run) mismatching Remix routers cause `Error: You must render this element inside a <Remix> element`.
- Fix React Fast Refresh error on load when using `defer` in Vite dev server ([#7842](https://github.com/remix-run/remix/pull/7842))
- Handle multiple "Set-Cookie" headers in Vite dev server ([#7843](https://github.com/remix-run/remix/pull/7843))
- Fix flash of unstyled content on initial page load in Vite dev when using a custom Express server ([#7937](https://github.com/remix-run/remix/pull/7937))
- Emit assets that were only referenced in the server build into the client assets directory in Vite build ([#7892](https://github.com/remix-run/remix/pull/7892), cherry-picked in [`8cd31d65`](https://github.com/remix-run/remix/commit/8cd31d6543ef4c765220fc64dca9bcc9c61ee9eb))
- Populate `process.env` from `.env` files on the server in Vite dev ([#7958](https://github.com/remix-run/remix/pull/7958))
- Fix `FutureConfig` type ([#7895](https://github.com/remix-run/remix/pull/7895))
- Updated dependencies:
  - `@remix-run/server-runtime@2.3.0`
  - `@remix-run/node@2.3.0`

## 2.2.0

### Minor Changes

- Unstable Vite support for Node-based Remix apps ([#7590](https://github.com/remix-run/remix/pull/7590))
  - `remix build` 👉 `vite build && vite build --ssr`
  - `remix dev` 👉 `vite dev`
  - Other runtimes (e.g. Deno, Cloudflare) not yet supported.
  - See "Future > Vite" in the Remix Docs for details
- Add a new `future.v3_fetcherPersist` flag to change the persistence behavior of fetchers. Instead of being immediately cleaned up when unmounted in the UI, fetchers will persist until they return to an `idle` state ([RFC](https://github.com/remix-run/remix/discussions/7698)) ([#7704](https://github.com/remix-run/remix/pull/7704))
  - For more details, please refer to the [React Router 6.18.0](https://github.com/remix-run/react-router/releases/tag/react-router%406.18.0) release notes

### Patch Changes

- Updated dependencies:
  - `@remix-run/server-runtime@2.2.0`
  - `@remix-run/node@2.2.0`

## 2.1.0

### Patch Changes

- Sourcemap takes into account special chars in output file ([#7574](https://github.com/remix-run/remix/pull/7574))
- Updated dependencies:
  - `@remix-run/server-runtime@2.1.0`

## 2.0.1

### Patch Changes

- Fix types for MDX files when using pnpm ([#7491](https://github.com/remix-run/remix/pull/7491))
- Update `getDependenciesToBundle` to handle ESM packages without main exports ([#7272](https://github.com/remix-run/remix/pull/7272))
  - Note that these packages must expose `package.json` in their `exports` field so that their path can be resolved
- Fix server builds where `serverBuildPath` extension is `.cjs` ([#7180](https://github.com/remix-run/remix/pull/7180))
- Updated dependencies:
  - `@remix-run/server-runtime@2.0.1`

## 2.0.0

### Major Changes

- The `create-remix` CLI has been rewritten to feature a cleaner interface, Git repo initialization and optional `remix.init` script execution. The interactive template prompt and official Remix stack/template shorthands have also been removed so that community/third-party templates are now on a more equal footing. ([#6887](https://github.com/remix-run/remix/pull/6887))
  - The code for `create-remix` has been moved out of the Remix CLI since it's not intended for use within an existing Remix application
  - This means that the `remix create` command is no longer available.
- Enable built-in PostCSS and Tailwind support by default. ([#6909](https://github.com/remix-run/remix/pull/6909))
  - These tools are now automatically used within the Remix compiler if PostCSS and/or Tailwind configuration files are present in your project.
  - If you have a custom PostCSS and/or Tailwind setup outside of Remix, you can disable these features in your `remix.config.js` via the `postcss:false` and/or `tailwind:false` flags
- Drop React 17 support ([#7121](https://github.com/remix-run/remix/pull/7121))
- Require Node >=18.0.0 ([#6939](https://github.com/remix-run/remix/pull/6939))
- Compile server build to Node 18 ([#7292](https://github.com/remix-run/remix/pull/7292))
  - This allows features like top-level `await` to be used within a Remix app
- Remove default Node.js polyfills - you must now opt-into polyfills via the [`serverNodeBuiltinsPolyfill`](https://remix.run/docs/en/2.0.0/start/v2#servernodebuiltinspolyfill) and [`browserNodeBuiltinsPolyfill`](https://remix.run/docs/en/2.0.0/start/v2#browsernodebuiltinspolyfill) configs ([#7269](https://github.com/remix-run/remix/pull/7269))
- Remove `v2_errorBoundary` flag and `CatchBoundary` implementation ([#6906](https://github.com/remix-run/remix/pull/6906))
- Remove `v2_normalizeFormMethod` future flag - all `formMethod` values will be normalized in v2 ([#6875](https://github.com/remix-run/remix/pull/6875))
- Remove `v2_routeConvention` flag - the flat route file convention is now standard ([#6969](https://github.com/remix-run/remix/pull/6969))
- Remove `v2_headers` flag - it is now the default behavior to use the deepest `headers` function in the route tree ([#6979](https://github.com/remix-run/remix/pull/6979))
- The route `meta` API now defaults to the new "V2 Meta" API ([#6958](https://github.com/remix-run/remix/pull/6958))
  - Please refer to the ([docs](https://remix.run/docs/en/2.0.0/route/meta) and [Preparing for V2](https://remix.run/docs/en/2.0.0/start/v2#route-meta) guide for more information.
- Default to `serverModuleFormat: "esm"` and update `remix-serve` to use dynamic import to support ESM and CJS build outputs ([#6949](https://github.com/remix-run/remix/pull/6949))
- Remove `serverBuildTarget` config option ([#6896](https://github.com/remix-run/remix/pull/6896))
- Remove deprecated `REMIX_DEV_HTTP_ORIGIN` env var - use `REMIX_DEV_ORIGIN` instead ([#6963](https://github.com/remix-run/remix/pull/6963))
- Remove `devServerBroadcastDelay` config option ([#7063](https://github.com/remix-run/remix/pull/7063))
- Remove deprecated `devServerPort` option - use `--port` / `dev.port` instead ([#7078](https://github.com/remix-run/remix/pull/7078))
- Remove deprecated `REMIX_DEV_SERVER_WS_PORT` env var - use `remix dev`'s '`--port` / `port` option instead ([#6965](https://github.com/remix-run/remix/pull/6965))
- Stop passing `isTypeScript` to `remix.init` script ([#7099](https://github.com/remix-run/remix/pull/7099))
- Remove `replace-remix-magic-imports` codemod ([#6899](https://github.com/remix-run/remix/pull/6899))
- Remove deprecated `--no-restart`/`restart` cli args/flags - use `--manual`/`manual` instead ([#6962](https://github.com/remix-run/remix/pull/6962))
- Remove deprecated `--scheme`/`scheme` and `--host`/`host` cli args/flags - use `REMIX_DEV_ORIGIN` instead ([#6962](https://github.com/remix-run/remix/pull/6962))
- Promote the `future.v2_dev` flag in `remix.config.js` to a root level `dev` config ([#7002](https://github.com/remix-run/remix/pull/7002))
- Remove `browserBuildDirectory` config option ([#6900](https://github.com/remix-run/remix/pull/6900))
- Remove `serverBuildDirectory` config option (\[#6897]\(<https://github.com/remix-run/remix/pull/-> Remove `codemod` command ([#6918](https://github.com/remix-run/remix/pull/6918))
  6897\))
- Removed support for "magic exports" from the `remix` package. This package can be removed from your `package.json` and you should update all imports to use the source `@remix-run/*` packages: ([#6895](https://github.com/remix-run/remix/pull/6895))

  ```diff
  - import type { ActionArgs } from "remix";
  - import { json, useLoaderData } from "remix";
  + import type { ActionArgs } from "@remix-run/node";
  + import { json } from "@remix-run/node";
  + import { useLoaderData } from "@remix-run/react";
  ```

### Minor Changes

- Warn users about obsolete future flags in `remix.config.js` ([#7048](https://github.com/remix-run/remix/pull/7048))
- Detect built mode via `build.mode` ([#6964](https://github.com/remix-run/remix/pull/6964))
  - Prevents mode mismatch between built Remix server entry and user-land server
  - Additionally, all runtimes (including non-Node runtimes) can use `build.mode` to determine if HMR should be performed
- Support `bun` package manager ([#7074](https://github.com/remix-run/remix/pull/7074))
- The `serverNodeBuiltinsPolyfill` option (along with the newly added `browserNodeBuiltinsPolyfill`) now supports defining global polyfills in addition to module polyfills ([#7269](https://github.com/remix-run/remix/pull/7269))

  - For example, to polyfill Node's `Buffer` global:

    ```js
    module.exports = {
      serverNodeBuiltinsPolyfill: {
        globals: {
          Buffer: true,
        },
        // You'll probably need to polyfill the "buffer" module
        // too since the global polyfill imports this:
        modules: {
          buffer: true,
        },
      },
    };
    ```

### Patch Changes

- Fix importing of PNGs, SVGs, and other assets from packages in `node_modules` ([#6813](https://github.com/remix-run/remix/pull/6813), [#7182](https://github.com/remix-run/remix/pull/7182))

- Decouple the `@remix-run/dev` package from the contents of the `@remix-run/css-bundle` package. ([#6982](https://github.com/remix-run/remix/pull/6982))

  - The contents of the `@remix-run/css-bundle` package are now entirely managed by the Remix compiler
  - Even though it's still recommended that your Remix dependencies all share the same version, this change ensures that there are no runtime errors when upgrading `@remix-run/dev` without upgrading `@remix-run/css-bundle`

- Allow non-development modes for `remix watch` ([#7117](https://github.com/remix-run/remix/pull/7117))

- Stop `remix dev` when `esbuild` is not running ([#7158](https://github.com/remix-run/remix/pull/7158))

- Do not interpret JSX in `.ts` files ([#7306](https://github.com/remix-run/remix/pull/7306))

  - While JSX is supported in `.js` files for compatibility with existing apps and libraries,
    `.ts` files should not contain JSX. By not interpreting `.ts` files as JSX, `.ts` files
    can contain single-argument type generics without needing a comma to disambiguate from JSX:

    ```ts
    // this works in .ts files
    const id = <T>(x: T) => x;
    //          ^ single-argument type generic
    ```

    ```tsx
    // this doesn't work in .tsx files
    const id = <T,>(x: T) => x;
    //          ^ is this a JSX element? or a single-argument type generic?
    ```

    ```tsx
    // this works in .tsx files
    const id = <T,>(x: T) => x;
    //           ^ comma: this is a generic, not a JSX element
    const component = <h1>hello</h1>;
    //                   ^ no comma: this is a JSX element
    ```

- Enhance obsolete flag warning for `future.v2_dev` if it was an object, and prompt users to lift it to the root `dev` config ([#7427](https://github.com/remix-run/remix/pull/7427))

- Allow decorators in app code ([#7176](https://github.com/remix-run/remix/pull/7176))

- Allow JSX in `.js` files during HMR ([#7112](https://github.com/remix-run/remix/pull/7112))

- Kill app server when remix dev terminates ([#7280](https://github.com/remix-run/remix/pull/7280))

- Support dependencies that import polyfill packages for Node built-ins via a trailing slash (e.g. importing the `buffer` package with `var Buffer = require('buffer/').Buffer` as recommended in their README) ([#7198](https://github.com/remix-run/remix/pull/7198))

  - These imports were previously marked as external
  - This meant that they were left as dynamic imports in the client bundle and would throw a runtime error in the browser (e.g. `Dynamic require of "buffer/" is not supported`)

- Surface errors when PostCSS config is invalid ([#7391](https://github.com/remix-run/remix/pull/7391))

- Restart dev server when Remix config changes ([#7269](https://github.com/remix-run/remix/pull/7269))

- Remove outdated ESM import warnings ([#6916](https://github.com/remix-run/remix/pull/6916))

  - Most of the time these warnings were false positives.
  - Instead, we now rely on built-in Node warnings for ESM imports.

- Do not trigger rebuilds when `.DS_Store` changes ([#7172](https://github.com/remix-run/remix/pull/7172))

- Remove warnings for stabilized flags: ([#6905](https://github.com/remix-run/remix/pull/6905))

  - `unstable_cssSideEffectImports`
  - `unstable_cssModules`
  - `unstable_vanillaExtract`

- Allow any mode (`NODE_ENV`) ([#7113](https://github.com/remix-run/remix/pull/7113))

- Replace the deprecated [`xdm`](https://github.com/wooorm/xdm) package with [`@mdx-js/mdx`](https://github.com/mdx-js/mdx) ([#4054](https://github.com/remix-run/remix/pull/4054))

- Write a `version.txt` sentinel file _after_ server build is completely written ([#7299](https://github.com/remix-run/remix/pull/7299))

- Updated dependencies:
  - `@remix-run/server-runtime@2.0.0`

## 1.19.3

### Patch Changes

- Show deprecation warning when using `devServerBroadcastDelay` and `devServerPort` config options ([#7064](https://github.com/remix-run/remix/pull/7064))
- Updated dependencies:
  - `@remix-run/server-runtime@1.19.3`

## 1.19.2

### Patch Changes

- Update `proxy-agent` to resolve npm audit security vulnerability ([#7027](https://github.com/remix-run/remix/pull/7027))
- Updated dependencies:
  - `@remix-run/server-runtime@1.19.2`

## 1.19.1

### Patch Changes

- Add a heartbeat ping to prevent the WebSocket connection from being closed due to inactivity when using a proxy like Cloudflare ([#6904](https://github.com/remix-run/remix/pull/6904), [#6927](https://github.com/remix-run/remix/pull/6927))
- Treeshake out HMR code from production builds ([#6894](https://github.com/remix-run/remix/pull/6894))
- Updated dependencies:
  - `@remix-run/server-runtime@1.19.1`

## 1.19.0

### Minor Changes

- improved networking options for `v2_dev` ([#6724](https://github.com/remix-run/remix/pull/6724))

  deprecate the `--scheme` and `--host` options and replace them with the `REMIX_DEV_ORIGIN` environment variable

- Output esbuild metafiles for bundle analysis ([#6772](https://github.com/remix-run/remix/pull/6772))

  Written to server build directory (`build/` by default):

  - `metafile.css.json`
  - `metafile.js.json` (browser JS)
  - `metafile.server.json` (server JS)

  Metafiles can be uploaded to <https://esbuild.github.io/analyze/> for analysis.

- Add `serverNodeBuiltinsPolyfill` config option. In `remix.config.js` you can now disable polyfills of Node.js built-in modules for non-Node.js server platforms, or opt into a subset of polyfills. ([#6814](https://github.com/remix-run/remix/pull/6814), [#6859](https://github.com/remix-run/remix/pull/6859), [#6877](https://github.com/remix-run/remix/pull/6877))

  ```js
  // Disable all polyfills
  exports.serverNodeBuiltinsPolyfill = { modules: {} };

  // Enable specific polyfills
  exports.serverNodeBuiltinsPolyfill = {
    modules: {
      crypto: true, // Provide a JSPM polyfill
      fs: "empty", // Provide an empty polyfill
    },
  };
  ```

### Patch Changes

- ignore missing react-dom/client for react 17 ([#6725](https://github.com/remix-run/remix/pull/6725))

- Warn if not using `v2_dev` ([#6818](https://github.com/remix-run/remix/pull/6818))

  Also, rename `--no-restart` to `--manual` to match intention and documentation.
  `--no-restart` remains an alias for `--manual` in v1 for backwards compatibility.

- ignore errors when killing already dead processes ([#6773](https://github.com/remix-run/remix/pull/6773))

- Always rewrite css-derived assets during builds ([#6837](https://github.com/remix-run/remix/pull/6837))

- fix sourcemaps for `v2_dev` ([#6762](https://github.com/remix-run/remix/pull/6762))

- Do not clear screen when dev server starts ([#6719](https://github.com/remix-run/remix/pull/6719))

  On some terminal emulators, "clearing" only scrolls the next line to the
  top. on others, it erases the scrollback.

  Instead, let users call `clear` themselves (`clear && remix dev`) if
  they want to clear.

- Updated dependencies:
  - `@remix-run/server-runtime@1.19.0`

## 1.18.1

### Patch Changes

- Ignore missing `react-dom/client` for React 17 ([#6725](https://github.com/remix-run/remix/pull/6725))
- Updated dependencies:
  - `@remix-run/server-runtime@1.18.1`

## 1.18.0

### Minor Changes

- stabilize v2 dev server ([#6615](https://github.com/remix-run/remix/pull/6615))
- improved logging for `remix build` and `remix dev` ([#6596](https://github.com/remix-run/remix/pull/6596))

### Patch Changes

- fix docs links for msw and mkcert ([#6672](https://github.com/remix-run/remix/pull/6672))
- fix `remix dev -c`: kill all descendant processes of specified command when restarting ([#6663](https://github.com/remix-run/remix/pull/6663))
- Add caching to regular stylesheet compilation ([#6638](https://github.com/remix-run/remix/pull/6638))
- Rename `Architect (AWS Lambda)` -> `Architect` in the `create-remix` CLI to avoid confusion for other methods of deploying to AWS (i.e., SST) ([#6484](https://github.com/remix-run/remix/pull/6484))
- Improve CSS bundle build performance by skipping unused Node polyfills ([#6639](https://github.com/remix-run/remix/pull/6639))
- Improve performance of CSS bundle build by skipping compilation of Remix/React packages that are known not to contain CSS imports ([#6654](https://github.com/remix-run/remix/pull/6654))
- Cache CSS side-effect imports transform when using HMR ([#6622](https://github.com/remix-run/remix/pull/6622))
- Fix bug with pathless layout routes beneath nested path segments ([#6649](https://github.com/remix-run/remix/pull/6649))
- Add caching to PostCSS for CSS Modules ([#6604](https://github.com/remix-run/remix/pull/6604))
- Add caching to PostCSS for side-effect imports ([#6554](https://github.com/remix-run/remix/pull/6554))
- cache getRouteModuleExports calls to significantly speed up build and HMR rebuild times ([#6629](https://github.com/remix-run/remix/pull/6629))
- group rebuild logs with surrounding whitespace ([#6607](https://github.com/remix-run/remix/pull/6607))
- instructions for integrating with msw ([#6669](https://github.com/remix-run/remix/pull/6669))
- Update minimum version of `esbuild-plugins-node-modules-polyfill` to 1.0.16 to ensure that the plugin is cached ([#6652](https://github.com/remix-run/remix/pull/6652))
- Updated dependencies:
  - `@remix-run/server-runtime@1.18.0`

## 1.17.1

### Patch Changes

- Replace `esbuild-plugin-polyfill-node` with `esbuild-plugins-node-modules-polyfill` ([#6562](https://github.com/remix-run/remix/pull/6562))
- Lazily generate CSS bundle when import of `@remix-run/css-bundle` is detected ([#6535](https://github.com/remix-run/remix/pull/6535))
- Updated dependencies:
  - `@remix-run/server-runtime@1.17.1`

## 1.17.0

### Minor Changes

- built-in tls support ([#6483](https://github.com/remix-run/remix/pull/6483))

  New options:

  - `--tls-key` / `tlsKey`: TLS key
  - `--tls-cert` / `tlsCert`: TLS Certificate

  If both TLS options are set, `scheme` defaults to `https`

  ## Example

  Install [mkcert](https://github.com/FiloSottile/mkcert) and create a local CA:

  ```sh
  brew install mkcert
  mkcert -install
  ```

  Then make sure you inform `node` about your CA certs:

  ```sh
  export NODE_EXTRA_CA_CERTS="$(mkcert -CAROOT)/rootCA.pem"
  ```

  👆 You'll probably want to put that env var in your scripts or `.bashrc`/`.zshrc`

  Now create `key.pem` and `cert.pem`:

  ```sh
  mkcert -key-file key.pem -cert-file cert.pem localhost
  ```

  See `mkcert` docs for more details.

  Finally, pass in the paths to the key and cert via flags:

  ```sh
  remix dev --tls-key=key.pem --tls-cert=cert.pem
  ```

  or via config:

  ```js
  module.exports = {
    future: {
      unstable_dev: {
        tlsKey: "key.pem",
        tlsCert: "cert.pem",
      },
    },
  };
  ```

  That's all that's needed to set up the Remix Dev Server with TLS.

  🚨 Make sure to update your app server for TLS as well.

  For example, with `express`:

  ```ts
  import fs from "node:fs";
  import https from "node:https";

  import express from "express";

  const app = express();

  // ...code setting up your express app...

  const appServer = https.createServer(
    {
      key: fs.readFileSync("key.pem"),
      cert: fs.readFileSync("cert.pem"),
    },
    app
  );

  appServer.listen(3000, () => {
    console.log("Ready on https://localhost:3000");
  });
  ```

  ## Known limitations

  `remix-serve` does not yet support TLS.
  That means this only works for custom app server using the `-c` flag for now.

- Reuse dev server port for WebSocket (Live Reload,HMR,HDR) ([#6476](https://github.com/remix-run/remix/pull/6476))

  As a result the `webSocketPort`/`--websocket-port` option has been obsoleted.
  Additionally, scheme/host/port options for the dev server have been renamed.

  Available options are:

  | Option     | flag               | config           | default                           |
  | ---------- | ------------------ | ---------------- | --------------------------------- |
  | Command    | `-c` / `--command` | `command`        | `remix-serve <server build path>` |
  | Scheme     | `--scheme`         | `scheme`         | `http`                            |
  | Host       | `--host`           | `host`           | `localhost`                       |
  | Port       | `--port`           | `port`           | Dynamically chosen open port      |
  | No restart | `--no-restart`     | `restart: false` | `restart: true`                   |

  Note that scheme/host/port options are for the _dev server_, not your app server.
  You probably don't need to use scheme/host/port option if you aren't configuring networking (e.g. for Docker or SSL).

### Patch Changes

- Add caching to PostCSS for regular stylesheets ([#6505](https://github.com/remix-run/remix/pull/6505))

- Fix warnings when importing CSS files with `future.unstable_dev` enabled ([#6506](https://github.com/remix-run/remix/pull/6506))

- Fix Tailwind performance issue when `postcss.config.js` contains `plugins: { tailwindcss: {} }` and `remix.config.js` contains both `tailwind: true` and `postcss: true`. ([#6468](https://github.com/remix-run/remix/pull/6468))

  Note that this was _not_ an issue when the plugin function had been explicitly called, i.e. `plugins: [tailwindcss()]`. Remix avoids adding the Tailwind plugin to PostCSS if it's already present but we were failing to detect when the plugin function hadn't been called — either because the plugin function itself had been passed, i.e. `plugins: [require('tailwindcss')]`, or the plugin config object syntax had been used, i.e. `plugins: { tailwindcss: {} }`.

- Faster server export removal for routes when `unstable_dev` is enabled. ([#6455](https://github.com/remix-run/remix/pull/6455))

  Also, only render modulepreloads on SSR.
  Do not render modulepreloads when hydrated.

- Add `HeadersArgs` type to be consistent with loaders/actions/meta and allows for using a `function` declaration in addition to an arrow function expression ([#6247](https://github.com/remix-run/remix/pull/6247))

  ```tsx
  import type { HeadersArgs } from "@remix-run/node"; // or cloudflare/deno

  export function headers({ loaderHeaders }: HeadersArgs) {
    return {
      "x-my-custom-thing": loaderHeaders.get("x-my-custom-thing") || "fallback",
    };
  }
  ```

- better error message when `remix-serve` is not found ([#6477](https://github.com/remix-run/remix/pull/6477))

- restore color for app server output ([#6485](https://github.com/remix-run/remix/pull/6485))

- Fix route ranking bug with pathless layout route next to a sibling index route ([#4421](https://github.com/remix-run/remix/pull/4421))

  - Under the hood this is done by removing the trailing slash from all generated `path` values since the number of slash-delimited segments counts towards route ranking so the trailing slash incorrectly increases the score for routes

- Support sibling pathless layout routes by removing pathless layout routes from the unique route path checks in conventional route generation since they inherently trigger duplicate paths ([#4421](https://github.com/remix-run/remix/pull/4421))

- fix dev server crashes caused by ungraceful hdr error handling ([#6467](https://github.com/remix-run/remix/pull/6467))

- Updated dependencies:
  - `@remix-run/server-runtime@1.17.0`

## 1.16.1

### Patch Changes

- Cross-module `loader` change detection for HDR ([#6299](https://github.com/remix-run/remix/pull/6299))
- Normalize path for dev server `PATH` envvar so that it works cross-platform (e.g. Windows) ([#6310](https://github.com/remix-run/remix/pull/6310))
- Fix CSS imports in JS files that use JSX ([#6309](https://github.com/remix-run/remix/pull/6309))
- Kill app server when dev server exits ([#6395](https://github.com/remix-run/remix/pull/6395))
- Wait until app server is killed before starting a new app server ([#6289](https://github.com/remix-run/remix/pull/6289))
- Ensure CSS bundle changes result in a new manifest hash ([#6374](https://github.com/remix-run/remix/pull/6374))
- Normalize file paths before testing if a changed file is a route entry ([#6293](https://github.com/remix-run/remix/pull/6293))
- Fix race where app server responds with updated manifest version _before_ dev server is listening for it ([#6294](https://github.com/remix-run/remix/pull/6294))
  - dev server now listens for updated versions _before_ writing the server changes, guaranteeing that it is listening before the app server gets a chance to send its 'ready' message
- Only process `.css.ts`/`.css.js` files with Vanilla Extract if `@vanilla-extract/css` is installed ([#6345](https://github.com/remix-run/remix/pull/6345))
- Stop modifying a user's `tsconfig.json` when running using `getConfig` (`remix dev`, `remix routes`, `remix build`, etc) ([#6156](https://github.com/remix-run/remix/pull/6156))
- Cancel previous build when rebuild is kicked off to prevent rebuilds from hanging ([#6295](https://github.com/remix-run/remix/pull/6295))
- Update minimum version of Babel dependencies to avoid errors parsing decorators ([#6390](https://github.com/remix-run/remix/pull/6390))
- Support asset imports when detecting loader changes for HDR ([#6396](https://github.com/remix-run/remix/pull/6396))
- Updated dependencies:
  - `@remix-run/server-runtime@1.16.1`

## 1.16.0

### Minor Changes

- Enable support for [CSS Modules](https://github.com/css-modules/css-modules), [Vanilla Extract](http://vanilla-extract.style) and CSS side-effect imports ([#6046](https://github.com/remix-run/remix/pull/6046))

  These CSS bundling features were previously only available via `future.unstable_cssModules`, `future.unstable_vanillaExtract` and `future.unstable_cssSideEffectImports` options in `remix.config.js`, but they have now been stabilized.

  In order to use these features, check out our guide to [CSS bundling](https://remix.run/docs/en/1.16.0/guides/styling#css-bundling) in your project.

- Stabilize built-in PostCSS support via the new `postcss` option in `remix.config.js`. As a result, the `future.unstable_postcss` option has also been deprecated. ([#5960](https://github.com/remix-run/remix/pull/5960))

  The `postcss` option is `false` by default, but when set to `true` will enable processing of all CSS files using PostCSS if `postcss.config.js` is present.

  If you followed the original PostCSS setup guide for Remix, you may have a folder structure that looks like this, separating your source files from its processed output:

      .
      ├── app
      │   └── styles (processed files)
      │       ├── app.css
      │       └── routes
      │           └── index.css
      └── styles (source files)
          ├── app.css
          └── routes
              └── index.css

  After you've enabled the new `postcss` option, you can delete the processed files from `app/styles` folder and move your source files from `styles` to `app/styles`:

      .
      ├── app
      │   └── styles (source files)
      │       ├── app.css
      │       └── routes
      │           └── index.css

  You should then remove `app/styles` from your `.gitignore` file since it now contains source files rather than processed output.

  You can then update your `package.json` scripts to remove any usage of `postcss` since Remix handles this automatically. For example, if you had followed the original setup guide:

  ```diff
  {
    "scripts": {
  -    "dev:css": "postcss styles --base styles --dir app/styles -w",
  -    "build:css": "postcss styles --base styles --dir app/styles --env production",
  -    "dev": "concurrently \"npm run dev:css\" \"remix dev\""
  +    "dev": "remix dev"
    }
  }
  ```

- Stabilize built-in Tailwind support via the new `tailwind` option in `remix.config.js`. As a result, the `future.unstable_tailwind` option has also been deprecated. ([#5960](https://github.com/remix-run/remix/pull/5960))

  The `tailwind` option is `false` by default, but when set to `true` will enable built-in support for Tailwind functions and directives in your CSS files if `tailwindcss` is installed.

  If you followed the original Tailwind setup guide for Remix and want to make use of this feature, you should first delete the generated `app/tailwind.css`.

  Then, if you have a `styles/tailwind.css` file, you should move it to `app/tailwind.css`.

  ```sh
  rm app/tailwind.css
  mv styles/tailwind.css app/tailwind.css
  ```

  Otherwise, if you don't already have an `app/tailwind.css` file, you should create one with the following contents:

  ```css
  @tailwind base;
  @tailwind components;
  @tailwind utilities;
  ```

  You should then remove `/app/tailwind.css` from your `.gitignore` file since it now contains source code rather than processed output.

  You can then update your `package.json` scripts to remove any usage of `tailwindcss` since Remix handles this automatically. For example, if you had followed the original setup guide:

  ```diff
  {
    // ...
    "scripts": {
  -    "build": "run-s \"build:*\"",
  +    "build": "remix build",
  -    "build:css": "npm run generate:css -- --minify",
  -    "build:remix": "remix build",
  -    "dev": "run-p \"dev:*\"",
  +    "dev": "remix dev",
  -    "dev:css": "npm run generate:css -- --watch",
  -    "dev:remix": "remix dev",
  -    "generate:css": "npx tailwindcss -o ./app/tailwind.css",
      "start": "remix-serve build"
    }
    // ...
  }
  ```

- The Remix dev server spins up your app server as a managed subprocess. ([#6133](https://github.com/remix-run/remix/pull/6133))
  This keeps your development environment as close to production as possible.
  It also means that the Remix dev server is compatible with _any_ app server.

  By default, the dev server will use the Remix App Server, but you opt to use your own app server by specifying the command to run it via the `-c`/`--command` flag:

  ```sh
  remix dev # uses `remix-serve <serve build path>` as the app server
  remix dev -c "node ./server.js" # uses your custom app server at `./server.js`
  ```

  The dev server will:

  - force `NODE_ENV=development` and warn you if it was previously set to something else
  - rebuild your app whenever your Remix app code changes
  - restart your app server whenever rebuilds succeed
  - handle live reload and HMR + Hot Data Revalidation

  ### App server coordination

  In order to manage your app server, the dev server needs to be told what server build is currently being used by your app server.
  This works by having the app server send a "I'm ready!" message with the Remix server build hash as the payload.

  This is handled automatically in Remix App Server and is set up for you via calls to `broadcastDevReady` or `logDevReady` in the official Remix templates.

  If you are not using Remix App Server and your server doesn't call `broadcastDevReady`, you'll need to call it in your app server _after_ it is up and running.
  For example, in an Express server:

  ```js
  // server.js
  // <other imports>
  import { broadcastDevReady } from "@remix-run/node";

  // Path to Remix's server build directory ('build/' by default)
  const BUILD_DIR = path.join(process.cwd(), "build");

  // <code setting up your express server>

  app.listen(3000, () => {
    const build = require(BUILD_DIR);
    console.log("Ready: http://localhost:" + port);

    // in development, call `broadcastDevReady` _after_ your server is up and running
    if (process.env.NODE_ENV === "development") {
      broadcastDevReady(build);
    }
  });
  ```

  ### Options

  Options priority order is: 1. flags, 2. config, 3. defaults.

  | Option         | flag               | config           | default                           |
  | -------------- | ------------------ | ---------------- | --------------------------------- |
  | Command        | `-c` / `--command` | `command`        | `remix-serve <server build path>` |
  | HTTP(S) scheme | `--http-scheme`    | `httpScheme`     | `http`                            |
  | HTTP(S) host   | `--http-host`      | `httpHost`       | `localhost`                       |
  | HTTP(S) port   | `--http-port`      | `httpPort`       | Dynamically chosen open port      |
  | Websocket port | `--websocket-port` | `websocketPort`  | Dynamically chosen open port      |
  | No restart     | `--no-restart`     | `restart: false` | `restart: true`                   |

  🚨 The `--http-*` flags are only used for internal dev server <-> app server communication.
  Your app will run on your app server's normal URL.

  To set `unstable_dev` configuration, replace `unstable_dev: true` with `unstable_dev: { <options> }`.
  For example, to set the HTTP(S) port statically:

  ```js
  // remix.config.js
  module.exports = {
    future: {
      unstable_dev: {
        httpPort: 8001,
      },
    },
  };
  ```

  #### SSL and custom hosts

  You should only need to use the `--http-*` flags and `--websocket-port` flag if you need fine-grain control of what scheme/host/port for the dev server.
  If you are setting up SSL or Docker networking, these are the flags you'll want to use.

  🚨 Remix **will not** set up SSL and custom host for you.
  The `--http-scheme` and `--http-host` flag are for you to tell Remix how you've set things up.
  It is your task to set up SSL certificates and host files if you want those features.

  #### `--no-restart` and `require` cache purging

  If you want to manage server changes yourself, you can use the `--no-restart` flag to tell the dev server to refrain from restarting your app server when builds succeed:

  ```sh
  remix dev -c "node ./server.js" --no-restart
  ```

  For example, you could purge the `require` cache of your app server to keep it running while picking up server changes.
  If you do so, you should watch the server build path (`build/` by default) for changes and only purge the `require` cache when changes are detected.

  🚨 If you use `--no-restart`, it is your responsibility to call `broadcastDevReady` when your app server has picked up server changes.
  For example, with `chokidar`:

  ```js
  // server.dev.js
  const BUILD_PATH = path.resolve(__dirname, "build");

  const watcher = chokidar.watch(BUILD_PATH);

  watcher.on("change", () => {
    // 1. purge require cache
    purgeRequireCache();
    // 2. load updated server build
    const build = require(BUILD_PATH);
    // 3. tell dev server that this app server is now ready
    broadcastDevReady(build);
  });
  ```

### Patch Changes

- Fix absolute paths in CSS `url()` rules when using CSS Modules, Vanilla Extract and CSS side-effect imports ([#5788](https://github.com/remix-run/remix/pull/5788))
- look for @remix-run/serve in `devDependencies` when running remix dev ([#6228](https://github.com/remix-run/remix/pull/6228))
- add warning for v2 "cjs"->"esm" `serverModuleFormat` default change ([#6154](https://github.com/remix-run/remix/pull/6154))
- write mjs server output files ([#6225](https://github.com/remix-run/remix/pull/6225))
- fix(react,dev): dev chunking and refresh race condition ([#6201](https://github.com/remix-run/remix/pull/6201))
- Use correct require context in `bareImports` plugin. ([#6181](https://github.com/remix-run/remix/pull/6181))
- use minimatch for regex instead of glob-to-regexp ([#6017](https://github.com/remix-run/remix/pull/6017))
- add `logDevReady` as replacement for platforms that can't initialize async I/O outside of the request response lifecycle. ([#6204](https://github.com/remix-run/remix/pull/6204))
- Use the "automatic" JSX runtime when processing MDX files. ([#6098](https://github.com/remix-run/remix/pull/6098))
- forcibly kill app server during dev ([#6197](https://github.com/remix-run/remix/pull/6197))
- show first compilation error instead of cancelation errors ([#6202](https://github.com/remix-run/remix/pull/6202))
- Resolve imports from route modules across the graph back to the virtual module created by the v2 routes plugin. This fixes issues where we would duplicate portions of route modules that were imported. ([#6098](https://github.com/remix-run/remix/pull/6098))
- Updated dependencies:
  - `@remix-run/server-runtime@1.16.0`

## 1.15.0

### Minor Changes

- Added deprecation warning for `v2_normalizeFormMethod` ([#5863](https://github.com/remix-run/remix/pull/5863))

- Added a new `future.v2_normalizeFormMethod` flag to normalize the exposed `useNavigation().formMethod` as an uppercase HTTP method to align with the previous `useTransition` behavior as well as the `fetch()` behavior of normalizing to uppercase HTTP methods. ([#5815](https://github.com/remix-run/remix/pull/5815))

  - When `future.v2_normalizeFormMethod === false`,
    - `useNavigation().formMethod` is lowercase
    - `useFetcher().formMethod` is uppercase
  - When `future.v2_normalizeFormMethod === true`:
    - `useNavigation().formMethod` is uppercase
    - `useFetcher().formMethod` is uppercase

- Added deprecation warning for `browserBuildDirectory` in `remix.config` ([#5702](https://github.com/remix-run/remix/pull/5702))

- Added deprecation warning for `CatchBoundary` in favor of `future.v2_errorBoundary` ([#5718](https://github.com/remix-run/remix/pull/5718))

- Added experimental support for Vanilla Extract caching, which can be enabled by setting `future.unstable_vanillaExtract: { cache: true }` in `remix.config`. This is considered experimental due to the use of a brand new Vanilla Extract compiler under the hood. In order to use this feature, you must be using at least `v1.10.0` of `@vanilla-extract/css`. ([#5735](https://github.com/remix-run/remix/pull/5735))

- Added deprecation warning for `serverBuildDirectory` in `remix.config` ([#5704](https://github.com/remix-run/remix/pull/5704))

### Patch Changes

- Fixed issue to ensure changes to CSS inserted via `@remix-run/css-bundle` are picked up during HMR ([#5823](https://github.com/remix-run/remix/pull/5823))
- We now use `path.resolve` when re-exporting `entry.client` ([#5707](https://github.com/remix-run/remix/pull/5707))
- Added support for `.mjs` and `.cjs` extensions when detecting CSS side-effect imports ([#5564](https://github.com/remix-run/remix/pull/5564))
- Fixed resolution issues for pnpm users installing `react-refresh` ([#5637](https://github.com/remix-run/remix/pull/5637))
- Added deprecation warning for `future.v2_meta` ([#5878](https://github.com/remix-run/remix/pull/5878))
- Added optional entry file support for React 17 ([#5681](https://github.com/remix-run/remix/pull/5681))
- Updated dependencies:
  - `@remix-run/server-runtime@1.15.0`

## 1.14.3

### Patch Changes

- dev server is resilient to build failures ([#5795](https://github.com/remix-run/remix/pull/5795))
- Updated dependencies:
  - `@remix-run/server-runtime@1.14.3`

## 1.14.2

### Patch Changes

- remove premature deprecation warnings ([#5790](https://github.com/remix-run/remix/pull/5790))
- Updated dependencies:
  - `@remix-run/server-runtime@1.14.2`

## 1.14.1

### Patch Changes

- Add types for importing `*.ico` files ([#5430](https://github.com/remix-run/remix/pull/5430))
- Allow `moduleResolution: "bundler"` in tsconfig.json ([#5576](https://github.com/remix-run/remix/pull/5576))
- Fix issue with x-route imports creating multiple entries in the module graph ([#5721](https://github.com/remix-run/remix/pull/5721))
- Add `serverBuildTarget` deprecation warning ([#5624](https://github.com/remix-run/remix/pull/5624))
- Updated dependencies:
  - `@remix-run/server-runtime@1.14.1`

## 1.14.0

### Minor Changes

- Hot Module Replacement and Hot Data Revalidation ([#5259](https://github.com/remix-run/remix/pull/5259))
  - Requires `unstable_dev` future flag to be enabled
  - HMR provided through React Refresh
  - Features:
    - HMR for component and style changes
    - HDR when loaders for current route change
  - Known limitations for MVP:
    - Only implemented for React via React Refresh
    - No `import.meta.hot` API exposed yet
    - Revalidates _all_ loaders on route when loader changes are detected
    - Loader changes do not account for imported dependencies changing
- Make `entry.client` and `entry.server` files optional ([#4600](https://github.com/remix-run/remix/pull/4600))
  - we'll use a bundled version of each unless you provide your own

### Patch Changes

- Fixes flat route inconsistencies where `route.{ext}` wasn't always being treated like `index.{ext}` when used in a folder ([#5459](https://github.com/remix-run/remix/pull/5459))

  - Route conflict no longer throw errors and instead display a helpful warning that we're using the first one we found.

    ```log
    ⚠️ Route Path Collision: "/dashboard"

    The following routes all define the same URL, only the first one will be used

    🟢️️ routes/dashboard/route.tsx
    ⭕️️ routes/dashboard.tsx
    ```

    ```log
    ⚠️ Route Path Collision: "/"

    The following routes all define the same URL, only the first one will be used

    🟢️️ routes/_landing._index.tsx
    ⭕️️ routes/_dashboard._index.tsx
    ⭕️ routes/_index.tsx
    ```

- Log errors thrown during initial build in development. ([#5441](https://github.com/remix-run/remix/pull/5441))

- Sync `FutureConfig` interface between packages ([#5398](https://github.com/remix-run/remix/pull/5398))

- Add file loader for importing `.csv` files ([#3920](https://github.com/remix-run/remix/pull/3920))

- Updated dependencies:
  - `@remix-run/server-runtime@1.14.0`

## 1.13.0

### Minor Changes

- We are deprecating `serverBuildTarget` in `remix.config`. See the [release notes for v1.13.0](https://github.com/remix-run/remix/releases/tag/remix%401.13.0) for more information. ([#5354](https://github.com/remix-run/remix/pull/5354))
- Add built-in support for PostCSS via the `future.unstable_postcss` feature flag ([#5229](https://github.com/remix-run/remix/pull/5229))
- Add built-in support for Tailwind via the `future.unstable_tailwind` feature flag ([#5229](https://github.com/remix-run/remix/pull/5229))

### Patch Changes

- Mark Vanilla Extract files as side effects to ensure that files only containing global styles aren't tree-shaken ([#5246](https://github.com/remix-run/remix/pull/5246))
- Support decorators in files using CSS side-effect imports ([#5305](https://github.com/remix-run/remix/pull/5305))
- We made several Flat route fixes and enhancements. See the [release notes for v1.13.0](https://github.com/remix-run/remix/releases/tag/remix%401.13.0) for more information. ([#5228](https://github.com/remix-run/remix/pull/5228))
- Updated dependencies:
  - `@remix-run/server-runtime@1.13.0`

## 1.12.0

### Minor Changes

- Added a new development server available in the Remix config under the `unstable_dev` flag. [See the release notes](https://github.com/remix-run/remix/releases/tag/remix%401.12.0) for a full description. ([#5133](https://github.com/remix-run/remix/pull/5133))

### Patch Changes

- Fixed issues with `v2_routeConvention` on Windows so that new and renamed files are properly included ([#5266](https://github.com/remix-run/remix/pull/5266))
- Server build should not be removed in `remix watch` and `remix dev` ([#5228](https://github.com/remix-run/remix/pull/5228))
- The dev server will now clean up build directories whenever a rebuild starts ([#5223](https://github.com/remix-run/remix/pull/5223))
- Updated dependencies:
  - `@remix-run/server-runtime@1.12.0`

## 1.11.1

### Patch Changes

- Fixed a bug with `v2_routeConvention` that prevented `index` modules from being recognized for route paths ([`195291a3d`](https://github.com/remix-run/remix/commit/195291a3d8c0e098931199bcc26277a45cee0eb9))
- Updated dependencies:
  - `@remix-run/server-runtime@1.11.1`

## 1.11.0

### Minor Changes

- Specify file loader for `.fbx`, `.glb`, `.gltf`, `.hdr`, and `.mov` files ([#5030](https://github.com/remix-run/remix/pull/5030))
- Added support for [Vanilla Extract](https://vanilla-extract.style) via the `unstable_vanillaExtract` future flag. **IMPORTANT:** Features marked with `unstable` are … unstable. While we're confident in the use cases they solve, the API and implementation may change without a major version bump. ([#5040](https://github.com/remix-run/remix/pull/5040))
- Add support for CSS side-effect imports via the `unstable_cssSideEffectImports` future flag. **IMPORTANT:** Features marked with `unstable` are … unstable. While we're confident in the use cases they solve, the API and implementation may change without a major version bump. ([#4919](https://github.com/remix-run/remix/pull/4919))
- Add support for CSS Modules via the `unstable_cssModules` future flag. **IMPORTANT:** Features marked with `unstable` are … unstable. While we're confident in the use cases they solve, the API and implementation may change without a major version bump. ([#4852](https://github.com/remix-run/remix/pull/4852))

### Patch Changes

- Add new "flat" routing conventions. This convention will be the default in v2 but is available now under the `v2_routeConvention` future flag. ([#4880](https://github.com/remix-run/remix/pull/4880))
- Added support for `handle` in MDX frontmatter ([#4865](https://github.com/remix-run/remix/pull/4865))
- Updated dependencies:
  - `@remix-run/server-runtime@1.11.0`

## 1.10.1

### Patch Changes

- Update babel config to transpile down to node 14 ([#5047](https://github.com/remix-run/remix/pull/5047))
- Updated dependencies:
  - `@remix-run/server-runtime@1.10.1`

## 1.10.0

### Patch Changes

- Fixed several issues with TypeScript to JavaScript conversion when running `create-remix` ([#4891](https://github.com/remix-run/remix/pull/4891))
- Resolve asset entry full path to support monorepo import of styles ([#4855](https://github.com/remix-run/remix/pull/4855))
- Updated dependencies:
  - `@remix-run/server-runtime@1.10.0`

## 1.9.0

### Minor Changes

- Allow defining multiple routes for the same route module file ([#3970](https://github.com/remix-run/remix/pull/3970))
- Added support and conventions for optional route segments ([#4706](https://github.com/remix-run/remix/pull/4706))

### Patch Changes

- The Remix compiler now supports new Typescript 4.9 syntax (like the `satisfies` keyword) ([#4754](https://github.com/remix-run/remix/pull/4754))
- Optimize `parentRouteId` lookup in `defineConventionalRoutes`. ([#4800](https://github.com/remix-run/remix/pull/4800))
- Fixed a bug in `.ts` -> `.js` conversion on Windows by using a relative unix-style path ([#4718](https://github.com/remix-run/remix/pull/4718))
- Updated dependencies:
  - `@remix-run/server-runtime@1.9.0`

## 1.8.2

### Patch Changes

- Updated dependencies:
  - `@remix-run/server-runtime@1.8.2`
  - `@remix-run/serve@1.8.2`

## 1.8.1

### Patch Changes

- Added a missing type definition for the Remix config `future` option to the `@remix-run/dev/server-build` virtual module ([#4771](https://github.com/remix-run/remix/pull/4771))
- Updated dependencies:
  - `@remix-run/serve@1.8.1`
  - `@remix-run/server-runtime@1.8.1`

## 1.8.0

### Minor Changes

- Added support for a new route `meta` API to handle arrays of tags instead of an object. For details, check out the [RFC](https://github.com/remix-run/remix/discussions/4462). ([#4610](https://github.com/remix-run/remix/pull/4610))

### Patch Changes

- Importing functions and types from the `remix` package is deprecated, and all exported modules will be removed in the next major release. For more details,[see the release notes for 1.4.0](https://github.com/remix-run/remix/releases/tag/v1.4.0) where these changes were first announced. ([#4661](https://github.com/remix-run/remix/pull/4661))
- Updated dependencies:
  - `@remix-run/server-runtime@1.8.0`
  - `@remix-run/serve@1.8.0`

## 1.7.6

### Patch Changes

- Updated dependencies:
  - `@remix-run/serve@1.7.6`
  - `@remix-run/server-runtime@1.7.6`

### Patch Changes

- Updated dependencies:
  - `@remix-run/serve@1.7.6-pre.0`
  - `@remix-run/server-runtime@1.7.6-pre.0`

## 1.7.5

### Patch Changes

- Updated dependencies:
  - `@remix-run/serve@1.7.5`
  - `@remix-run/server-runtime@1.7.5`

## 1.7.4

### Patch Changes

- Updated dependencies:
  - `@remix-run/server-runtime@1.7.4`
  - `@remix-run/serve@1.7.4`

## 1.7.3

### Patch Changes

- Update `create-remix` to use the new examples repository when using `--template example/<name>` ([#4208](https://github.com/remix-run/remix/pull/4208))
- Add support for setting `moduleResolution` to `node`, `node16` or `nodenext` in `tsconfig.json`. ([#4034](https://github.com/remix-run/remix/pull/4034))
- Add resources imported only by resource routes to `assetsBuildDirectory` ([#3841](https://github.com/remix-run/remix/pull/3841))
- Ensure that any assets referenced in CSS files are hashed and copied to the `assetsBuildDirectory`. ([#4130](https://github.com/remix-run/remix/pull/4130))
- Updated dependencies:
  - `@remix-run/serve@1.7.3`
  - `@remix-run/server-runtime@1.7.3`

## 1.7.2

### Patch Changes

- Updated dependencies:
  - `@remix-run/server-runtime@1.7.2`
  - `@remix-run/serve@1.7.2`

## 1.7.1

### Patch Changes

- Updated dependencies:
  - `@remix-run/server-runtime@1.7.1`
  - `@remix-run/serve@1.7.1`

## 1.7.0

### Minor Changes

- Added support for importing `.gql` and `.graphql` files as plain text ([#3923](https://github.com/remix-run/remix/pull/3923))
- Added support for importing `.zip` and `.avif` files as resource URLs ([#3985](https://github.com/remix-run/remix/pull/3985))

### Patch Changes

- Removed our compiler's React shim in favor of esbuild's new automatic JSX transform ([#3860](https://github.com/remix-run/remix/pull/3860))
- Updated dependencies:
  - `@remix-run/server-runtime@1.7.0`
  - `@remix-run/serve@1.7.0`

## 1.6.8

### Patch Changes

- Added support for `.mjs` and `.cjs` file extensions for `remix.config` ([#3675](https://github.com/remix-run/remix/pull/3675))
- Added support for importing `.sql` files as text content ([#3190](https://github.com/remix-run/remix/pull/3190))
- Updated the compiler to make MDX builds deterministic (and a little faster!) ([#3966](https://github.com/remix-run/remix/pull/3966))
- Updated dependencies:
  - `@remix-run/server-runtime@1.6.8`
  - `@remix-run/serve@1.6.8`

## 1.6.7

### Patch Changes

- Remove logical nullish assignment, which is incompatible with Node v14. ([#3880](https://github.com/remix-run/remix/pull/3880))
- Don't show ESM warnings when consumed via dynamic import. ([#3872](https://github.com/remix-run/remix/pull/3872))
- Updated dependencies:
  - `@remix-run/serve@1.6.7`
  - `@remix-run/server-runtime@1.6.7`

## 1.6.6

### Patch Changes

- Write server build output files so that only assets imported from resource routes are written to disk ([#3817](https://github.com/remix-run/remix/pull/3817))
- Add support for exporting links in `.mdx` files ([#3801](https://github.com/remix-run/remix/pull/3801))
- Ensure that build hashing is deterministic ([#2027](https://github.com/remix-run/remix/pull/2027))
- Fix types for `@remix-run/dev/server-build` virtual module ([#3743](https://github.com/remix-run/remix/pull/3743))
- Updated dependencies:
  - `@remix-run/serve@1.6.6`
  - `@remix-run/server-runtime@1.6.6`

## 1.6.5

### Patch Changes

- Update `serverBareModulesPlugin` warning to use full import path ([#3656](https://github.com/remix-run/remix/pull/3656))
- Fix broken `--port` flag in `create-remix` ([#3694](https://github.com/remix-run/remix/pull/3694))
- Updated dependencies
  - `@remix-run/server-runtime`
  - `@remix-run/serve`
