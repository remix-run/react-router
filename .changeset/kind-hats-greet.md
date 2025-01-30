---
"react-router": patch
---

Stop erroring on resource routes that return raw strings/objects and instead serialize them as `text/plain` or `application/json` responses

- This only applies when accessed as a resource route without the `.data` extension
- When accessed from a Single Fetch `.data` request, they will still be encoded via `turbo-stream`
