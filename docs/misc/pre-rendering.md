---
title: Pre-Rendering
---

# Pre-Rendering

Pre-rendering allows you to render a pages at build time instead of on a server to speed up pages loads for static content.

## Configuration

Add the `prerender` option to your Vite plugin, there are three signatures:

```ts filename=vite.config.ts
import { reactRouter } from "@react-router/dev/vite";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [
    reactRouter({
      // all static route paths
      // (no dynamic segments like "/post/:slug")
      prerender: true,

      // any url
      prerender: ["/", "/blog", "/blog/popular-post"],

      // with async url dependencies like a CMS
      async prerender() {
        let posts = await getPosts();
        return posts.map((post) => post.href);
      },

      // with async and static paths
      async prerender({ getStaticPaths }) {
        let posts = await getPosts();
        let static = getStaticPaths();
        return static.concat(
          posts.map((post) => post.href)
        );
      },
    }),
  ],
});
```

## Data Loading and Pre-rendering

There is no extra application API for pre-rendering. Pre-rendering uses the same route loaders as server rendering to provide data to components:

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

## Static Results

The rendered result will be written out to your `build/client` directory, you'll notice two files for each path: an HTML file for initial document requests from users and `[name].data` files for the data React Router fetches for client side routing.

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

During development with `react-router dev`, pre-rendering doesn't save the rendering results to the public directory, this only happens for `react-router build`.

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
app.use("/", express.static("build/client"));

// Serve remaining unhandled requests via your React Router handler
app.all(
  "*",
  createRequestHandler({
    build: await import("./build/server/index.js"),
  })
);
```

[express-static]: https://expressjs.com/en/4x/api.html#express.static
