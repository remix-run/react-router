---
title: Pre-Rendering
---

# Pre-Rendering

Pre-rendering allows you to render pages at build time instead of on a server to speed up pages loads for static content.

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

The rendered result will be written out to your `build/client` directory. You'll notice two files for each path: an HTML file for initial document requests `[name].data` files for client side navigation.

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
