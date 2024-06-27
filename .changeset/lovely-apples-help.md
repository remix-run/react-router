---
"@remix-run/router": patch
---

Trigger a new `router.routes` identity/reflow during fog of war route patching

- This also adds a new batched API for `router.patchRoutes` so you can perform multiple patches but only a single reflow at the end:

  ```js
  // Apply one patch and reflow
  router.patchRoutes(parentId, children);

  // Apply multiples patches and a single reflow
  router.patchRoutes((patch) => {
    patch(parentId, children);
    patch(parentId2, children2);
    patch(parentId3, children3);
  });
  ```
