---
title: Upgrading from Remix
hidden: true
---

# Upgrading from Remix

<docs-warning>This guide is still in development as is not accurate</docs-warning>

After the final React Router v7 release, we will go back to Remix to add future flags to any changed APIs.

If you want to attempt the rocky migration now, the following table will be helpful:

| Remix v2 Package        |     | React Router v7 Package    |
| ----------------------- | --- | -------------------------- |
| `@remix-run/react`      | ➡️  | `react-router`             |
| `@remix-run/dev`        | ➡️  | `@react-router/dev`        |
| `@remix-run/node`       | ➡️  | `@react-router/node`       |
| `@remix-run/cloudflare` | ➡️  | `@react-router/cloudflare` |

Also note that nearly all modules your app needs come from `react-router` now instead of `@remix-run/node` and `@remix-run/cloudflare`, so try to import from there first.

```diff
-import { redirect } from "@react-router/node";
+import { redirect } from "react-router";
```
