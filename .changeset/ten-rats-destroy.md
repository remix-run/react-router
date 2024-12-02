---
"@react-router/dev": patch
---

Ensure the "development" condition is used by default when running `react-router dev`. This fixes an issue with packages that have a peer dependency on `react-router` where both development and production builds would be loaded at the same time, resulting in runtime errors due to mismatched React contexts.
