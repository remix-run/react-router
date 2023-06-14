---
"react-router-dom": patch
---

When submitting a form from a `submitter` element, prefer the built-in `new FormData(form, submitter)` instead of the previous manual approach in modern browsers (those that support the new `submitter` parameter). For browsers that don't support it, we continue to just append the submit button's entry to the end, and we also add rudimentary support for `type="image"` buttons. If developers want full spec-compliant support for legacy browsers, they can use the `formdata-submitter-polyfill`.
