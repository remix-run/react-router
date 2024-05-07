---
"react-router": minor
---

- Add support for `prerender` config in the React Router vite plugin, to support existing SSG use-cases

To use "Prerender Mode" you set `ssr:false` in your plugin config, since you intend to prerenderr your HTML files instead of rendering them on a server at runtime, and then tell React Router which paths you would like to prerender via the `prerender` config.

`prerender` can either be an array of string paths, or a function (sync or async) that returns an array of strings so that you can dynamically generate the paths by talking to your CMS, etc.

```ts
export default defineConfig({
  plugins: [
    reactRouter({
      // Single fetch is required for prerendering (which will be the default in v7)
      future: {
        unstable_singleFetch: true,
      },
      ssr: false,
      async prerender() {
        let slugs = await fakeGetSlugsFromCms();
        // PRerender these paths into `.html` files at build time, and `.data`
        // files if they have loaders
        return ["/", "/about", ...slugs.map((slug) => `/product/${slug}`)];
      },
    }),
    tsconfigPaths(),
  ],
});

async function fakeGetSlugsFromCms() {
  await new Promise((r) => setTimeout(r, 1000));
  return ["shirt", "hat"];
}
```
