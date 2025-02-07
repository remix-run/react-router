---
title: Pre-Rendering
---

# Pre-Rendering

Pre-rendering allows you to render pages at build time instead of on a runtime server to speed up page loads for static content.

## Configuration

Add the `prerender` option to your config, there are three signatures:

```ts filename=react-router.config.ts
import type { Config } from "@react-router/dev/config";

export default {
  // all static route paths
  // (no dynamic segments like "/post/:slug")
  prerender: true,

  // any url
  prerender: ["/", "/blog", "/blog/popular-post"],

  // async function for dependencies like a CMS
  async prerender({ getStaticPaths }) {
    let posts = await fakeGetPostsFromCMS();
    return ["/", "/blog"].concat(
      posts.map((post) => post.href)
    );
  },
} satisfies Config;
```

## Data Loading and Pre-rendering

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

## Static File Output

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

## Prerendering with `ssr:false`

The above examples assume you are deploying a runtime server, but are choosing to prerender some static pages in order to serve them faster and avoid hitting the running server.

If you want to prerender without a runtime server, you can do that with the `ssr:false` config flag:

```ts filename=react-router.config.ts
import type { Config } from "@react-router/dev/config";

export default {
  ssr: false, // disable runtime server rendering
  prerender: true, // prerender static routes
} satisfies Config;
```

If you specify `ssr:false` without a `prerender` config, React Router refers to that as [SPA Mode](./spa). In SPA Mode, we render a single HTML file that is capable of hydrating for _any_ of your application paths. It can do this because it only renders the `root` route into the HTML file and then determines which child routes to load based on the browser URL during hydration. Because of this, you can't use loaders on any route other than the root because those routes never execute at build time so the loaders won't ever execute.

If you want to prerender some paths with `ssr:false`, then those matched routes _can_ have loaders because we'll prerender all of the matched routes for those paths, not just the root. Usually, with `prerender:true`, you'll be prerendering all of your application routes into a full SSG setup.

### Prerendering with a SPA Fallback

If you want `ssr:false` but don't want to prerender _all_ of your routes - that's fine too! You may have some paths where you need the performance/SEO benefits of prerendering, but other pages where a SPA would be fine.

You can do this using the combination of config options as well - just limit your `prerender` config to the paths that you want to prerender:

```ts filename=react-router.config.ts
import type { Config } from "@react-router/dev/config";

export default {
  ssr: false,
  // We want to make sure our primary landing pages have good perf/SEO
  prerender: ["/", "/about-us"],
} satisfies Config;
```

When React Router detects this scenario, it will also output a "SPA Fallback" file in `build/client/__spa-fallback.html` file which can be used as the SPA entry point for any paths you chose not to prerender. You can configure your deployment server to serve this file for any path that otherwise would 404.

Here's how you can do this with the [`sirv-cli`](https://www.npmjs.com/package/sirv-cli#user-content-single-page-applications) tool or the [`http-server`](https://www.npmjs.com/package/http-server#catch-all-redirect) tool:

```sh
sirv-cli build/client --single __spa-fallback.html
http-server --proxy http://localhost:8080?
```

If you don't prerender the `/` route, then React Router won;'t bother with a special `__spa-fallback.html` file and will write the SPA Fallback directly to `build/client/index.html`.
