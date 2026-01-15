---
title: react-router.config.ts
order: 3
---

# react-router.config.ts

[MODES: framework]

## Summary

<docs-info>
This file is optional
</docs-info>

[Reference Documentation ↗](https://api.reactrouter.com/v7/types/_react_router_dev.config.Config.html)

React Router framework configuration file that lets you customize aspects of your React Router application like server-side rendering, directory locations, and build settings.

```tsx filename=react-router.config.ts
import type { Config } from "@react-router/dev/config";

export default {
  appDirectory: "app",
  buildDirectory: "build",
  ssr: true,
  prerender: ["/", "/about"],
} satisfies Config;
```

## Options

### `allowedActionOrigins`

An array of allowed origin hosts for action submissions to UI routes (does not apply to resource routes). Supports micromatch glob patterns (`*` to match one segment, `**` to match multiple).

```tsx filename=react-router.config.ts
export default {
  allowedActionOrigins: [
    "example.com",
    "*.example.com", // sub.example.com
    "**.example.com", // sub.domain.example.com
  ],
} satisfies Config;
```

If you need to set this value at runtime, you can do in by setting the value on the server build in your custom server. For example, when using `express`:

```ts
import express from "express";
import { createRequestHandler } from "@react-router/express";
import type { ServerBuild } from "react-router";

export const app = express();

async function getBuild() {
  let build: ServerBuild = await import(
    "virtual:react-router/server-build"
  );
  return {
    ...build,
    allowedActionOrigins:
      process.env.NODE_ENV === "development"
        ? undefined
        : ["staging.example.com", "www.example.com"],
  };
}

app.use(createRequestHandler({ build: getBuild }));
```

### `appDirectory`

The path to the `app` directory, relative to the root directory. Defaults to `"app"`.

```tsx filename=react-router.config.ts
export default {
  appDirectory: "src",
} satisfies Config;
```

### `basename`

The React Router app basename. Defaults to `"/"`.

```tsx filename=react-router.config.ts
export default {
  basename: "/my-app",
} satisfies Config;
```

### `buildDirectory`

The path to the build directory, relative to the project. Defaults to `"build"`.

```tsx filename=react-router.config.ts
export default {
  buildDirectory: "dist",
} satisfies Config;
```

### `buildEnd`

A function that is called after the full React Router build is complete.

```tsx filename=react-router.config.ts
export default {
  buildEnd: async ({
    buildManifest,
    reactRouterConfig,
    viteConfig,
  }) => {
    // Custom build logic here
    console.log("Build completed!");
  },
} satisfies Config;
```

### `future`

Enabled future flags for opting into upcoming features.

See [Future Flags][future-flags] for more information.

```tsx filename=react-router.config.ts
export default {
  future: {
    // Enable future flags here
  },
} satisfies Config;
```

### `prerender`

An array of URLs to prerender to HTML files at build time. Can also be a function returning an array to dynamically generate URLs.

See [Pre-Rendering][pre-rendering] for more information.

```tsx filename=react-router.config.ts
export default {
  // Static array
  prerender: ["/", "/about", "/contact"],

  // Or dynamic function
  prerender: async ({ getStaticPaths }) => {
    const paths = await getStaticPaths();
    return ["/", ...paths];
  },
} satisfies Config;
```

### `presets`

An array of React Router plugin config presets to ease integration with other platforms and tools.

See [Presets][presets] for more information.

```tsx filename=react-router.config.ts
export default {
  presets: [
    // Add presets here
  ],
} satisfies Config;
```

### `routeDiscovery`

Configure how routes are discovered and loaded by the client. Defaults to `mode: "lazy"` with `manifestPath: "/__manifest"`.

**Options:**

- `mode: "lazy"` - Routes are discovered as the user navigates (default)
  - `manifestPath` - Custom path for manifest requests when using `lazy` mode
- `mode: "initial"` - All routes are included in the initial manifest

```tsx filename=react-router.config.ts
export default {
  // Enable lazy route discovery (default)
  routeDiscovery: {
    mode: "lazy",
    manifestPath: "/__manifest",
  },

  // Use a custom manifest path
  routeDiscovery: {
    mode: "lazy",
    manifestPath: "/custom-manifest",
  },

  // Disable lazy discovery and include all routes initially
  routeDiscovery: { mode: "initial" },
} satisfies Config;
```

See [Lazy Route Discovery][lazy-route-discovery] for more information.

### `serverBuildFile`

The file name of the server build output. This file should end in a `.js` extension and should be deployed to your server. Defaults to `"index.js"`.

```tsx filename=react-router.config.ts
export default {
  serverBuildFile: "server.js",
} satisfies Config;
```

### `serverBundles`

A function for assigning routes to different server bundles. This function should return a server bundle ID which will be used as the bundle's directory name within the server build directory.

See [Server Bundles][server-bundles] for more information.

```tsx filename=react-router.config.ts
export default {
  serverBundles: ({ branch }) => {
    // Return bundle ID based on route branch
    return branch.some((route) => route.id === "admin")
      ? "admin"
      : "main";
  },
} satisfies Config;
```

### `serverModuleFormat`

The output format of the server build. Defaults to `"esm"`.

```tsx filename=react-router.config.ts
export default {
  serverModuleFormat: "cjs", // or "esm"
} satisfies Config;
```

### `ssr`

If `true`, React Router will server render your application.

If `false`, React Router will pre-render your application and save it as an `index.html` file with your assets so your application can be deployed as a SPA without server-rendering. See ["SPA Mode"][spa-mode] for more information.

Defaults to `true`.

```tsx filename=react-router.config.ts
export default {
  ssr: false, // disabled server-side rendering
} satisfies Config;
```

[future-flags]: ../../upgrading/future
[presets]: ../../how-to/presets
[server-bundles]: ../../how-to/server-bundles
[pre-rendering]: ../../how-to/pre-rendering
[spa-mode]: ../../how-to/spa
[lazy-route-discovery]: ../../explanation/lazy-route-discovery
