---
title: Future Changes
order: 1
---

# Future Changes

We try our best to keep major version upgrades simple and boring through the use of opt-in APIs and [Future Flags][api-development-strategy]. Future flags are used to gate breaking changes that don't otherwise have a good call-site opt-in strategy. By adopting all opt-in APIs and future flags, you should be able to upgrade to the next major version of React Router with minimal changes.

We plan to ship new major versions roughly once a year as described in our [Open Governance Model][governance], so this guide will continue to track future changes you can adopt ahead of the next major release (currently estimated for mid-2027 when Node 22 reaches EOL).

We highly recommend you make a commit after each step and ship it instead of doing everything all at once. Most flags can be adopted in any order, with exceptions noted below.

## Minimum Versions

[MODES: framework, data, declarative]

<br/>
<br/>

React Router v8 will require the following minimum versions. You can prepare for the upgrade by updating them while still on v7:

- `node@22.22+`
- `react@19.2.7+`/`react-dom@19.2.7+`

Framework mode will also require:

- `vite@7+` (requires `future.v8_viteEnvironmentApi`)
  - also make sure any custom Vite plugins or config are compatible with Vite 7.

## Update to latest v7.x

Before adopting any future flags or call-site opt-in changes, you should update to the latest minor version of v7.x to make sure you have access to the latest flags. You may see a number of deprecation warnings as you upgrade, which we'll cover below.

👉 Update to latest v7

```sh
npm install react-router@7 @react-router/{dev,node,etc.}@7
```

## Unstable Future Flags (Optional)

We document some [unstable] flags here as a reference for folks contributing to the project via beta testing, but they are not generally recommended for production use and may have breaking changes in patch or minor releases - adopt with caution!

### `future.unstable_optimizeDeps`

[MODES: framework]

<br/>
<br/>

**Background**

This flag lets React Router provide Vite's dependency optimizer with the client entry file and route module files. This can improve dependency optimization in development, but the behavior is still experimental.

👉 **Enable the Flag**

```ts filename=react-router.config.ts
import type { Config } from "@react-router/dev/config";

export default {
  future: {
    unstable_optimizeDeps: true,
  },
} satisfies Config;
```

**Update your Code**

No code changes are required. If you run into dependency optimization issues after enabling this flag, remove the flag and restart the dev server.

### `future.unstable_previewServerPrerendering`

[MODES: framework]

<br/>
<br/>

**Background**

This flag switches prerendering to use Vite's preview-server request flow instead of the current build-time prerendering path so that it works in non-Node environments such as `workerd`. Enabling this flag also enables `future.v8_viteEnvironmentApi`, so you should review the `future.v8_viteEnvironmentApi` guidance above before adopting it.

<docs-info>This ends up only changing the underlying prerender implementation but is not expected to cause any breaking changes. Because it is not expected to break, you do not _have_ to adopt this flag prior to v8 and therefore it wasn't ever converted to a `v8_` flag.</docs-info>

👉 **Enable the Flag**

```ts filename=react-router.config.ts
import type { Config } from "@react-router/dev/config";

export default {
  future: {
    unstable_previewServerPrerendering: true,
  },
} satisfies Config;
```

**Update your Code**

No code changes are required unless your app has a custom Vite configuration that is affected by `future.v8_viteEnvironmentApi`.

[api-development-strategy]: ../community/api-development-strategy
[governance]: https://github.com/remix-run/react-router/blob/main/GOVERNANCE.md#design-goals
[unstable]: ../community/api-development-strategy#unstable-flags
