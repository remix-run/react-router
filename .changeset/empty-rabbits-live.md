---
"react-router": patch
---

Support for throwing `data()` and Response from server component render phase. Response body is not serialized as async work is not allowed as error encoding phase. If you wish to transmit data to the boundary, throw `data()` instead.
