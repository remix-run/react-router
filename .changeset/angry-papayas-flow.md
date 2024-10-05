---
"@react-router/dev": major
---

For Remix consumers migrating to React Router, the `vitePlugin` and `cloudflareDevProxyVitePlugin` exports have been renamed and moved.

```diff
-import {
-  vitePlugin as remix,
-  cloudflareDevProxyVitePlugin,
-} from "@remix/dev";

+import { reactRouter } from "@react-router/dev/vite";
+import { cloudflareDevProxy } from "@react-router/dev/vite/cloudflare";
```
