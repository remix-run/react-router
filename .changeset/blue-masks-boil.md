---
"react-router": patch
---

- Update client-side router to run client `middleware` on initial load even if no loaders exist
- Update `createRoutesStub` to run route middleware
  - You will need to set the `<RoutesStub future={{ v8_middleware: true }} />` flag to enable the proper `context` type
