Add the `future.unstable_traverseCache` flag to set client payload fetch cache behavior based on navigation type.

- Back/forward traversals use `cache: "force-cache"` for `.data`/`.rsc` payload requests when enabled.
- Other navigations and fetchers use `cache: "default"` when enabled.
- `true` enables it only in production
- `force` enables it in production and development
