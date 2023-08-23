---
"react-router-dom-v5-compat": patch
"react-router-native": patch
"react-router-dom": patch
"react-router": patch
"@remix-run/router": patch
---

Move the `@private` class export `ErrorResponse` to an `UNSAFE_ErrorResponse` export since it is an implementation detail and there should be no construction of `ErrorResponse` instances in userland. This frees us up to export a `type ErrorResponse` which correlates to an instance of the class via `InstanceType`. Userland code should only ever be using `ErrorResponse` as a type and should be type-narrowing via `isRouteErrorResponse`.
