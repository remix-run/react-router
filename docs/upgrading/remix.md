---
title: Upgrading from Remix
new: true
---

# Upgrading from Remix

React Router v7 is Remix "v3". So if you're up to date with all future flags in Remix v2, the upgrade to v7 is non-breaking aside from changing imports.

## Future Flags

First update to the latest minor version of Remix v2 and then the console will warn you for any flags that you have not enabled.

```tsx
export interface FutureConfig {
  // TODO: document the future flags
}
```

## Install React Router v7

### Codemod

You can use the following command that will automatically:

- update your Remix dependencies to their corresponding React Router v7 dependencies
- update all imports of those packages in your app to use the new packages

From the root of your project run:

```shellscript nonumber
npx upgrade-remix v7
```

### Manual

If you prefer to do it manually, here's a list of the equivalent packages:

| Remix v2 Package         |     | React Router v7 Package    |
| ------------------------ | --- | -------------------------- |
| `@remix-run/react`       | ➡️  | `react-router-dom`         |
| `@remix-run/dev`         | ➡️  | `@react-router/dev`        |
| `@remix-run/node`        | ➡️  | `@react-router/node`       |
| `@remix-run/cloudflare`  | ➡️  | `@react-router/cloudflare` |
| TODO: get the whole list |

Also note that nearly all modules your app needs can come from `react-router-dom` instead of `@remix-run/node` and `@remix-run/cloudflare`, so try to import from there first.

```diff
-import { redirect } from "@react-router/node";
+import { redirect } from "react-router";
```
