---
"react-router": minor
---

- Add support for `prerender` config in the React Router vite plugin, to support existing SSG use-cases

You can use the `prerender`config to pre-render your `.html` and `.data` files at build time and then serve them statically at runtime. `prerender` can either be an array of string paths, or a function (sync or async) that returns an array of strings so that you can dynamically generate the paths by talking to your CMS, etc.

```ts
export default defineConfig({
  plugins: [
    reactRouter({
      // Single fetch is required for prerendering (which will be the default in v7)
      future: {
        unstable_singleFetch: true,
      },
      async prerender() {
        let slugs = await fakeGetSlugsFromCms();
        // Prerender these paths into `.html` files at build time, and `.data`
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
