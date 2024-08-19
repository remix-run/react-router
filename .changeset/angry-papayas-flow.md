---
"@react-router/dev": major
---

For Remix consumers migrating to React Router, the `vitePlugin` and `cloudflareDevProxyVitePlugin` exports have been renamed and nested under `@react-router/dev/vite` to remove the `vitePlugin` naming convention .

```diff
-import {
-  vitePlugin as remix,
-  cloudflareDevProxyVitePlugin,
-} from "@remix/dev";

+import {
+  reactRouter,
+  cloudflareDevProxy,
+} from "@react-router/dev/vite";
```
