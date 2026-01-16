---
"react-router": patch
---

Fix matchPath optional params matching without a "/" separator.

- matchPath("/users/:id?", "/usersblah") now returns null.
- matchPath("/test_route/:part?", "/test_route_more") now returns null.
