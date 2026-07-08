Fix `href()` to strip optional markers from optional static path segments, matching `generatePath()`

- `href("/users/:userId/edit?", { userId: "5" })` now returns `/users/5/edit` instead of `/users/5/edit?`
- the trailing `?` previously leaked into the returned path and was parsed as a query string delimiter
