---
title: Pre-Rendering
---

# Pre-Rendering

Pre-rendering allows you to render pages at build time instead of on a runtime server to speed up page loads for static content.

In some cases, you'll serve these pages _alongside_ a runtime SSR server. If you wish to pre-render pages and deploy them _without_ a runtime SSR server, please see the [Pre-rendering with `ssr:false`](#pre-rendering-without-a-runtime-ssr-server) section below.

## Pre-rendering alongside a runtime SSR server

### Configuration

Add the `prerender` option to your config, there are three signatures:

```ts filename=react-router.config.ts lines=[7-09,11-12,14-20]
import type { Config } from "@react-router/dev/config";

export default {
  // Can be omitted - defaults to true
  ssr: true,

  // all static route paths
  // (no dynamic segments like "/post/:slug")
  prerender: true,

  // any url
  prerender: ["/", "/blog", "/blog/popular-post"],

  // async function for dependencies like a CMS
  async pre-render({ getStaticPaths }) {
    let posts = await fakeGetPostsFromCMS();
    return ["/", "/blog"].concat(
      posts.map((post) => post.href)
    );
  },
} satisfies Config;
```

### Data Loading and Pre-rendering

There is no extra application API for pre-rendering. Pre-rendering uses the same route loaders as server rendering:

```tsx
export async function loader({ request, params }) {
  let post = await getPost(params.slug);
  return post;
}

export function Post({ loaderData }) {
  return <div>{loaderData.title}</div>;
}
```

Instead of a request coming to your route on a deployed server, the build creates a `new Request()` and runs it through your app just like a server would.

When server rendering, requests to paths that have not been pre-rendered will be server rendered as usual.

### Static File Output

The rendered result will be written out to your `build/client` directory. You'll notice two files for each path:

- `[url].html` HTML file for initial document requests
- `[url].data` file for client side navigation browser requests

The output of your build will indicate what files were pre-rendered:

```sh
> react-router build
vite v5.2.11 building for production...
...
vite v5.2.11 building SSR bundle for production...
...
Prerender: Generated build/client/index.html
Prerender: Generated build/client/blog.data
Prerender: Generated build/client/blog/index.html
Prerender: Generated build/client/blog/my-first-post.data
Prerender: Generated build/client/blog/my-first-post/index.html
...
```

During development, pre-rendering doesn't save the rendered results to the public directory, this only happens for `react-router build`.

## Pre-rendering without a runtime SSR server

The above examples assume you are deploying a runtime server, but are pre-rendering some static pages in order to serve them faster and avoid hitting the server.

To disable runtime SSR, you can set the `ssr:false` config flag:

```ts filename=react-router.config.ts
import type { Config } from "@react-router/dev/config";

export default {
  ssr: false, // disable runtime server rendering
  prerender: true, // pre-render static routes
} satisfies Config;
```

If you specify `ssr:false` without a `prerender` config, React Router refers to that as [SPA Mode](./spa). In SPA Mode, we render a single HTML file that is capable of hydrating for _any_ of your application paths. It can do this because it only renders the `root` route into the HTML file and then determines which child routes to load based on the browser URL during hydration. This means you can use a `loader` on the root route, but not on any other routes because we don't know which routes to load until hydration in the browser.

If you want to pre-render paths with `ssr:false`, those matched routes _can_ have loaders because we'll pre-render all of the matched routes for those paths, not just the root. You cannot include `actions` or `headers` functions in any routes when `ssr:false` is set because there will be no runtime server to run them on.

### Pre-rendering with a SPA Fallback

If you want `ssr:false` but don't want to pre-render _all_ of your routes - that's fine too! You may have some paths where you need the performance/SEO benefits of pre-rendering, but other pages where a SPA would be fine.

You can do this using the combination of config options as well - just limit your `prerender` config to the paths that you want to pre-render and React Router will also output a "SPA Fallback" HTML file that can be served to hydrate any other paths (using the same approach as [SPA Mode](./spa)).

This will be written to one of the following paths:

- `build/client/index.html` - If the `/` path is not pre-rendered
- `build/client/__spa-fallback.html` - If the `/` path is pre-rendered

```ts filename=react-router.config.ts
import type { Config } from "@react-router/dev/config";

export default {
  ssr: false,

  // SPA fallback will be written to build/client/index.html
  prerender: ["/about-us"],

  // SPA fallback will be written to build/client/__spa-fallback.html
  prerender: ["/", "/about-us"],
} satisfies Config;
```

You can configure your deployment server to serve this file for any path that otherwise would 404. Here's an example of how you can do this with the [`sirv-cli`](https://www.npmjs.com/package/sirv-cli#user-content-single-page-applications) tool:

```sh
# If you did not pre-render the `/` route
sirv-cli build/client --single index.html

# If you pre-rendered the `/` route
sirv-cli build/client --single __spa-fallback.html
```
