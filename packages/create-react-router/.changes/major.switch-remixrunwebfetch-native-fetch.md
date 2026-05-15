Switch from `@remix-run/web-fetch` to native `fetch` internally.

- This removes the underlying `HTTPS_PROXY` support that `node-fetch` and subsequently `@remix-run/web-fetch` supported
