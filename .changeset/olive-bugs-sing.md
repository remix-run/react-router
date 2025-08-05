---
"react-router": patch
---

[UNSTABLE] Update middleware error handling so that the `next` function never throws and instead handles any middleware errors at the proper `ErrorBoundary` and returns the `Response` up through the ancestor `next` function
