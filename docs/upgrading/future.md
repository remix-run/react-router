---
title: Future Changes
order: 1
---

# Future Changes

We try our best to keep major version upgrades simple and boring through the use of opt-in APIs and [Future Flags][api-development-strategy]. Future flags are used to gate breaking changes that don't otherwise have a good call-site opt-in strategy. By adopting all opt-in APIs and future flags, you should be able to upgrade to the next major version of React Router with minimal changes.

We plan to ship new major versions roughly once a year as described in our [Open Governance Model][governance], so this guide will continue to track future changes you can adopt ahead of the next major release. v9 is currently estimated for mid-2027 when Node 22 reaches EOL.

We highly recommend you make a commit after each step and ship it instead of doing everything all at once. Most flags can be adopted in any order, with exceptions noted below.

<docs-info>This is an evolving document that will be updated throughout the duration of v8</docs-info>

## Minimum Versions

[MODES: framework, data, declarative]

<br/>
<br/>

React Router v9 will require the following minimum versions (as of now). You can prepare for the upgrade by updating them while still on v8:

- `node@24+`

## Update to latest v8.x

Before adopting any future flags or call-site opt-in changes, you should update to the latest minor version of v8.x to make sure you have access to the latest flags. You may see a number of deprecation warnings as you upgrade, which we'll cover below.

👉 Update to latest v8

```sh
npm install react-router@8 @react-router/{dev,node,etc.}@8
```

## Future Flags

_No future flags yet_

## Other Planned Breaking Changes

_No known planned breaking changes yet_

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

[api-development-strategy]: ../community/api-development-strategy
[governance]: https://github.com/remix-run/react-router/blob/main/GOVERNANCE.md#design-goals
[unstable]: ../community/api-development-strategy#unstable-flags
