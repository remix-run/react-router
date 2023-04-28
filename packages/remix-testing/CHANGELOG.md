# `@remix-run/testing`

## 1.16.0-pre.6

### Patch Changes

- Bump to router [`react-router-dom@6.11.0`](https://github.com/remix-run/react-router/releases/tag/react-router%406.11.0)/[`@remix-run/router@1.6.0`](https://github.com/remix-run/react-router/blob/main/packages/router/CHANGELOG.md#160) ([#6233](https://github.com/remix-run/remix/pull/6233))
- Updated dependencies:
  - `@remix-run/react@1.16.0-pre.6`
  - `@remix-run/node@1.16.0-pre.6`

## 1.16.0-pre.5

### Patch Changes

- Updated dependencies:
  - `@remix-run/node@1.16.0-pre.5`
  - `@remix-run/react@1.16.0-pre.5`

## 1.16.0-pre.4

### Patch Changes

- Bump to React Router `6.11.0-pre.2` ([#6223](https://github.com/remix-run/remix/pull/6223))
- Updated dependencies:
  - `@remix-run/react@1.16.0-pre.4`
  - `@remix-run/node@1.16.0-pre.4`

## 1.16.0-pre.3

### Patch Changes

- Updated dependencies:
  - `@remix-run/node@1.16.0-pre.3`
  - `@remix-run/react@1.16.0-pre.3`

## 1.16.0-pre.2

### Patch Changes

- Updated dependencies:
  - `@remix-run/node@1.16.0-pre.2`
  - `@remix-run/react@1.16.0-pre.2`

## 1.16.0-pre.1

### Patch Changes

- Updated dependencies:
  - `@remix-run/react@1.16.0-pre.1`
  - `@remix-run/node@1.16.0-pre.1`

## 1.16.0-pre.0

### Minor Changes

- Enable support for [CSS Modules](https://github.com/css-modules/css-modules), [Vanilla Extract](http://vanilla-extract.style) and CSS side-effect imports ([#6046](https://github.com/remix-run/remix/pull/6046))

  These CSS bundling features were previously only available via `future.unstable_cssModules`, `future.unstable_vanillaExtract` and `future.unstable_cssSideEffectImports` options in `remix.config.js`, but they have now been stabilized.

  **CSS Bundle Setup**

  In order to use these features, you first need to set up CSS bundling in your project. First install the `@remix-run/css-bundle` package.

  ```sh
  npm i @remix-run/css-bundle
  ```

  Then return the exported `cssBundleHref` as a stylesheet link descriptor from the `links` function at the root of your app.

  ```tsx
  import type { LinksFunction } from "@remix-run/node"; // or cloudflare/deno
  import { cssBundleHref } from "@remix-run/css-bundle";

  export const links: LinksFunction = () => {
    return [
      ...(cssBundleHref ? [{ rel: "stylesheet", href: cssBundleHref }] : []),
      // ...
    ];
  };
  ```

  **CSS Modules**

  To use [CSS Modules](https://github.com/css-modules/css-modules), you can opt in via the `.module.css` file name convention. For example:

  ```css
  .root {
    border: solid 1px;
    background: white;
    color: #454545;
  }
  ```

  ```tsx
  import styles from "./styles.module.css";

  export const Button = React.forwardRef(({ children, ...props }, ref) => {
    return <button {...props} ref={ref} className={styles.root} />;
  });
  Button.displayName = "Button";
  ```

  **Vanilla Extract**

  To use [Vanilla Extract](http://vanilla-extract.style), first install its `css` package as a dev dependency.

  ```sh
  npm install -D @vanilla-extract/css
  ```

  You can then opt in via the `.css.ts`/`.css.js` file name convention. For example:

  ```ts
  import { style } from "@vanilla-extract/css";

  export const root = style({
    border: "solid 1px",
    background: "white",
    color: "#454545",
  });
  ```

  ```tsx
  import * as styles from "./styles.css"; // Note that `.ts` is omitted here

  export const Button = React.forwardRef(({ children, ...props }, ref) => {
    return <button {...props} ref={ref} className={styles.root} />;
  });
  Button.displayName = "Button";
  ```

  **CSS Side-Effect Imports**

  Any CSS files that are imported as side-effects (e.g. `import "./styles.css"`) will be automatically included in the CSS bundle.

  Since JavaScript runtimes don't support importing CSS in this way, you'll also need to add any packages using CSS side-effect imports to the [`serverDependenciesToBundle`](https://remix.run/docs/en/main/file-conventions/remix-config#serverdependenciestobundle) option in your `remix.config.js` file. This ensures that any CSS imports are compiled out of your code before running it on the server. For example, to use [React Spectrum](https://react-spectrum.adobe.com/react-spectrum/index.html):

  ```js filename=remix.config.js
  // remix.config.js
  module.exports = {
    serverDependenciesToBundle: [
      /^@adobe\/react-spectrum/,
      /^@react-spectrum/,
      /^@spectrum-icons/,
    ],
    // ...
  };
  ```

### Patch Changes

- feat(remix-testing): cast types to use Remix type definitions + allow passing context ([#6065](https://github.com/remix-run/remix/pull/6065))
- Updated dependencies:
  - `@remix-run/react@1.16.0-pre.0`
  - `@remix-run/node@1.16.0-pre.0`

## 1.15.0

### Patch Changes

- Bumped React Router dependencies to the latest version. [See the release notes for more details.](https://github.com/remix-run/react-router/releases/tag/react-router%406.10.0) ([`e14699547`](https://github.com/remix-run/remix/commit/e1469954737a2e45636b6aef73dc9ae251fb1b20))
- Updated dependencies:
  - `@remix-run/react@1.15.0`
  - `@remix-run/node@1.15.0`

## 1.14.3

### Patch Changes

- Updated dependencies:
  - `@remix-run/node@1.14.3`
  - `@remix-run/react@1.14.3`

## 1.14.2

### Patch Changes

- Updated dependencies:
  - `@remix-run/node@1.14.2`
  - `@remix-run/react@1.14.2`

## 1.14.1

### Patch Changes

- Updated dependencies:
  - `@remix-run/react@1.14.1`
  - `@remix-run/node@1.14.1`

## 1.14.0

### Patch Changes

- Updated dependencies:
  - `@remix-run/react@1.14.0`
  - `@remix-run/node@1.14.0`
  - `@remix-run/router@1.3.3`
  - `react-router-dom@8.6.2`

## 1.13.0

### Minor Changes

- Add built-in support for PostCSS via the `future.unstable_postcss` feature flag ([#5229](https://github.com/remix-run/remix/pull/5229))
- Add built-in support for Tailwind via the `future.unstable_tailwind` feature flag ([#5229](https://github.com/remix-run/remix/pull/5229))

### Patch Changes

- Bump React Router dependencies to the latest version. [See the release notes for more details.](https://github.com/remix-run/react-router/releases/tag/react-router%406.8.1) ([#5389](https://github.com/remix-run/remix/pull/5389))
- Updated dependencies:
  - `@remix-run/react@1.13.0`
  - `@remix-run/node@1.13.0`

## 1.12.0

### Patch Changes

- Ensure all routes have IDs when using the `createRemixStub` testing helper ([#5128](https://github.com/remix-run/remix/pull/5128))
- Bump React Router dependencies to the latest version. [See the release notes for more details.](https://github.com/remix-run/react-router/releases/tag/react-router%406.8.0) ([#5242](https://github.com/remix-run/remix/pull/5242))
- Updated dependencies:
  - `@remix-run/react@1.12.0`
  - `@remix-run/node@1.12.0`

## 1.11.1

### Patch Changes

- Updated dependencies:
  - `@remix-run/node@1.11.1`
  - `@remix-run/react@1.11.1`

## 1.11.0

### Minor Changes

- Added support for [Vanilla Extract](https://vanilla-extract.style) via the `unstable_vanillaExtract` future flag. **IMPORTANT:** Features marked with `unstable` are … unstable. While we're confident in the use cases they solve, the API and implementation may change without a major version bump. ([#5040](https://github.com/remix-run/remix/pull/5040))
- Add support for CSS side-effect imports via the `unstable_cssSideEffectImports` future flag. **IMPORTANT:** Features marked with `unstable` are … unstable. While we're confident in the use cases they solve, the API and implementation may change without a major version bump. ([#4919](https://github.com/remix-run/remix/pull/4919))
- Add support for CSS Modules via the `unstable_cssModules` future flag. **IMPORTANT:** Features marked with `unstable` are … unstable. While we're confident in the use cases they solve, the API and implementation may change without a major version bump. ([#4852](https://github.com/remix-run/remix/pull/4852))

### Patch Changes

- Introduces the `defer()` API from `@remix-run/router` with support for server-rendering and HTTP streaming. This utility allows you to defer values returned from `loader` functions by returning promises instead of resolved values. This has been refered to as _"sending a promise over the wire"_. ([#4920](https://github.com/remix-run/remix/pull/4920))

  Informational Resources:

  - <https://gist.github.com/jacob-ebey/9bde9546c1aafaa6bc8c242054b1be26>
  - <https://github.com/remix-run/remix/blob/main/decisions/0004-streaming-apis.md>

  Documentation Resources (better docs specific to Remix are in the works):

  - <https://reactrouter.com/en/main/utils/defer>
  - <https://reactrouter.com/en/main/components/await>
  - <https://reactrouter.com/en/main/hooks/use-async-value>
  - <https://reactrouter.com/en/main/hooks/use-async-error>

- Updated dependencies:
  - `@remix-run/react@1.11.0`
  - `@remix-run/node@1.11.0`

## 1.10.1

### Patch Changes

- Updated dependencies:
  - `@remix-run/react@1.10.1`
  - `@remix-run/node@1.10.1`

## 1.10.0

### Patch Changes

- Remove internal `installGlobals` function now that `@remix-run/web-form-data` includes support for passing a `HTMLFormElement` ([#4755](https://github.com/remix-run/remix/pull/4755))
- Use React Router data APIs directly ([#4915](https://github.com/remix-run/remix/pull/4915))
- Updated dependencies:
  - `@remix-run/react@1.10.0`
  - `@remix-run/node@1.10.0`

## 1.9.0

### Patch Changes

- Updated dependencies:
  - `@remix-run/react@1.9.0`
  - `@remix-run/server-runtime@1.9.0`
  - `@remix-run/node@1.9.0`
