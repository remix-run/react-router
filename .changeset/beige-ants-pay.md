---
"@remix-run/router": patch
---

Fix bug where manually keyed fetchers weren't having data properly cleaned up on unmount when using the `v7_fetcherPersist` future flag
