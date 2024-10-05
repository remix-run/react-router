---
"@react-router/serve": patch
---

Update `express.static` configurations to support prerendering

- Assets in the `build/client/assets` folder are served as before, with a 1-year immutable `Cache-Control` header
- Static files outside of assets, such as pre-rendered `.html` and `.data` files are not served with a specific `Cache-Control` header
- `.data` files are served with `Content-Type: text/x-turbo`
  - For some reason, when adding this via `express.static`, it seems to also add a `Cache-Control: public, max-age=0` to `.data` files
