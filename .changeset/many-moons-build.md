---
"@react-router/dev": patch
"react-router": patch
---

Rename `future.unstable_trailingSlashAwareDataRequests` -> `future.trailingSlashAware` and update pre-rendering to be more flexible with trailing slashes.

Previously, pre-rendering coerced a trailing slash onto all paths, and always rendered `index.html` files in directory for the path:

| Prerender Path | `.html` file          | `.data` file     |
| -------------- | --------------------- | ---------------- |
| `/`            | `/index.html` ✅      | `/_root.data` ✅ |
| `/path`        | `/path/index.html` ⚠️ | `/path.data` ✅  |
| `/path/`       | `/path/index.html` ✅ | `/path.data` ⚠️  |

With this flag enabled, pre-rendering will determine the output file name according to the presence of a trailing slash on the provided path:

| Prerender Path | `.html` file          | `.data` file      |
| -------------- | --------------------- | ----------------- |
| `/`            | `/index.html` ✅      | `/_.data` ✅      |
| `/path`        | `/path.html` ✅       | `/path.data` ✅   |
| `/path/`       | `/path/index.html` ✅ | `/path/_.data` ✅ |

Currently, the `getStaticPaths()` function available in the `prerender` function signature always returns paths without a trailing slash. We have also introduced a new option to that method allowing you to specify whether you want the static paths to reflect a trailing slash or not:

```ts
// Previously - no trailing slash
getStaticPaths(); // ["/", "/path", ...]

// future.unstable_trailingSlashAware = false (defaults to no trailing slash)
getStaticPaths(); // ["/", "/path", ...]
getStaticPaths({ trailingSlash: false }); // ["/", "/path", ...]
getStaticPaths({ trailingSlash: true }); // ["/", "/path/", ...]
getStaticPaths({ trailingSlash: "both" }); // ["/", "/path", "/path/", ...]

// future.unstable_trailingSlashAware = true ('both' behavior becomes the default)
getStaticPaths(); // ["/", "/path", "/path/", ...]
getStaticPaths({ trailingSlash: false }); // ["/", "/path", ...]
getStaticPaths({ trailingSlash: true }); // ["/", "/path/", ...]
getStaticPaths({ trailingSlash: "both" }); // ["/", "/path", "/path/", ...]
```

It will depend on what you are using to serve your pre-rendered pages, but generally we recommend the `both` behavior because that seems to play nicest across various different ways of serving static HTML files:

- Current:
  - `prerender: ['/', '/page']` and `prerender: ['/', '/page/']`
    - `express.static`
      - SPA `/page` - ✅
      - SSR `/page` - ✅ (via redirect)
      - SPA `/page/` - ✅
      - SSR `/page/` - ✅
    - `npx http-server`
      - SPA `/page` - ✅
      - SSR `/page` - ✅ (via redirect)
      - SPA `/page/` - ✅
      - SSR `/page/` - ✅
    - `npx sirv-cli`
      - SPA `/page` - ✅
      - SSR `/page` - ✅
      - SPA `/page/` - ✅
      - SSR `/page/` - ✅
- New:
  - `prerender: ['/', '/page']` - `getStaticPaths({ trailingSlash: false })`
    - `express.static`
      - SPA `/page` - ✅
      - SSR `/page` - ❌
      - SPA `/page/` - ❌
      - SSR `/page/` - ❌
    - `npx http-server`
      - SPA `/page` - ✅
      - SSR `/page` - ✅
      - SPA `/page/` - ❌
      - SSR `/page/` - ❌
    - `npx sirv-cli`
      - SPA `/page` - ✅
      - SSR `/page` - ✅
      - SPA `/page/` - ✅
      - SSR `/page/` - ❌
  - `prerender: ['/', '/page/']` - `getStaticPaths({ trailingSlash: true })`
    - `express.static`
      - SPA `/page` - ❌
      - SSR `/page` - ✅ (via redirect)
      - SPA `/page/` - ✅
      - SSR `/page/` - ✅
    - `npx http-server`
      - SPA `/page` - ❌
      - SSR `/page` - ✅ (via redirect)
      - SPA `/page/` - ✅
      - SSR `/page/` - ✅
    - `npx sirv-cli`
      - SPA `/page` - ❌
      - SSR `/page` - ✅
      - SPA `/page/` - ✅
      - SSR `/page/` - ✅
  - `prerender: ['/', '/page', '/page/']` - `getStaticPaths({ trailingSlash: 'both' })`
    - `express.static`
      - SPA `/page` - ✅
      - SSR `/page` - ✅ (via redirect)
      - SPA `/page/` - ✅
      - SSR `/page/` - ✅
    - `npx http-server`
      - SPA `/page` - ✅
      - SSR `/page` - ✅ (via redirect)
      - SPA `/page/` - ✅
      - SSR `/page/` - ✅
    - `npx sirv-cli`
      - SPA `/page` - ✅
      - SSR `/page` - ✅
      - SPA `/page/` - ✅
      - SSR `/page/` - ✅
