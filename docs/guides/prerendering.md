---
title: Prerendering
new: true
---

# Prerendering

Without a doubt, one of the most common questions we've received since the launch of Remix v1 is _"how can I SSG my app with Remix?"_

We've long thought (and still believe) that having a runtime server provides the best UX/Performance/SEO/etc. for _most_ apps. We also strongly believe that you own your server architecture, and that it is undeniable that there exist plenty of valid use cases for a statically generated site in the real world (henceforth referred to as a pre-rendered site 😉).

We've taken the easy way out for a while and recommended that you don't _need_ pre-rendering to be a first-class feature of Remix/React Router and you can [do it in userland][michael-tweet]. With the addition of [Client Data][client-data] the things you can do with a userland setup got even more powerful, allowing you to choose a [variety of architectures][remix-ssg].

However, it wasn't until we introduced [Single Fetch][single-fetch] that we unlocked the full power of pre-rendering. Previously, you could hydrate into a SPA but you were limited to using `clientLoader`'s on navigations. With single fetch, you can pre-render your HTML files _and also_ run your `loader` functions at build time and save them to `.data` files that the app can fetch during client side transitions.

This is still something that could be done entirely in userland, but it's be so frequently requested that we decided to provide a built-in API for it.

## Configuration

To enable pre-rendering, add the `prerender` option to your React Router Vite plugin to enable prerendering.

In the simplest use-case, `prerender: true` will prerender all static routes defined in your application (excluding any paths that contain dynamic or splat params):

```ts filename=vite.config.ts
import { reactRouter } from "@react-router/dev/vite";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [
    reactRouter({
      prerender: true,
    }),
  ],
});
```

If you need to prerender paths with dynamic/splat parameters, or you only want to prerender a subset of your static paths, you can provide an array of paths:

```ts filename=vite.config.ts
import { reactRouter } from "@react-router/dev/vite";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [
    reactRouter({
      prerender: ["/", "/blog"],
    }),
  ],
});
```

`prerender` can also be a function, which allows you to dynamically generate the paths -- after fetching blog posts from your CMS for example. This function receives a single argument with a `getStaticPaths` function that you can call to retrieve all static paths defined in your application.

```ts filename=vite.config.ts
import { reactRouter } from "@react-router/dev/vite";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [
    reactRouter({
      async prerender({ getStaticPaths }) {
        let slugs = await getSlugsFromCms();
        return [
          ...getStaticPaths(),
          ...slugs.map((s) => `/blog/${s}`),
        ];
      },
    }),
  ],
});
```

## Development

During development with `react-router dev`, nothing changes when pre-rendering is enabled. You are still running off of a vite dev server to get the DX benefits of HMR/HDR. Pre-rendering is a build-time only step.

## Building

When you enable pre-rendering and run `react-router build`, we will build your server handler and then call it for all of the routes you specified in `prerender`. The resulting HTML will be written out to your `build/client` directory, and if any of those routes have loaders, they'll be called and a Single Fetch `.data` file will be saved to your `build/client` directory.

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

## Deploying/Serving

You have multiple options for deploying a site with pre-rendering enabled.

### Static Deployment

If you pre-render all of the paths in your application, you can deploy your `build/client/` directory to a CDN of your choosing and you've got a fully-static site that hydrates into a SPA, loads pre-rendered server data on navigations and can perform dynamic data loading and mutations via `clientLoader` and `clientAction`.

### Serving via react-router-serve

By default, `react-router-serve` will serve these files via [`express.static`][express-static] and any paths that do not match a static file will fall through to the Remix handler.

This even allows you to run a hybrid setup where _some_ of your routes are pre-rendered and others are dynamically rendered at runtime. For example, you could prerender anything inside `/blog/*` and server-render anything inside `/auth/*`.

### Manual Server Configuration

If you want more control over your server, you can serve these static files just like your assets in your own server - but you probably want to differentiate the caching headers on hashed static assets versus static `.html`/`.data` files.

```js
// Serve hashed static assets such as JS/CSS files with a long-lived Cache-Control header
app.use(
  "/assets",
  express.static("build/client/assets", {
    immutable: true,
    maxAge: "1y",
  })
);

// Serve static HTML and .data requests without Cache-Control
app.use(
  "/",
  express.static("build/client", {
    // Don't redirect directory index.html requests to include a trailing slash
    redirect: false,
    setHeaders: function (res, path) {
      // Add the proper Content-Type for turbo-stream data responses
      if (path.endsWith(".data")) {
        res.set("Content-Type", "text/x-turbo");
      }
    },
  })
);

// Serve remaining unhandled requests via your React Router handler
app.all(
  "*",
  createRequestHandler({
    build: await import("./build/server/index.js"),
  })
);
```

[michael-tweet]: https://twitter.com/mjackson/status/1585795441907494912
[client-data]: https://remix.run/docs/guides/client-data
[remix-ssg]: https://github.com/brophdawg11/remix-ssg
[single-fetch]: https://remix.run/docs/guides/single-fetch
[express-static]: https://expressjs.com/en/4x/api.html#express.static
