---
"@react-router/dev": patch
"react-router": patch
---

Generate wide `matches` and `params` types for child routes

At runtime, `matches` includes child route matches and `params` include child route path parameters.
But previously, we only generated types for parent routes and the current route in `matches` and `params`.
To align our generated types more closely to the runtime behavior, we now generate more permissive, wider types when accessing child route information.
