# integration-tests

## 0.0.0

### Minor Changes

- Unstable Vite support for Node-based Remix apps ([#7590](https://github.com/remix-run/remix/pull/7590))

  - `remix build` 👉 `vite build && vite build --ssr`
  - `remix dev` 👉 `vite dev`

  Other runtimes (e.g. Deno, Cloudflare) not yet supported.
  Custom server (e.g. Express) not yet supported.

  See "Future > Vite" in the Remix Docs for details.
