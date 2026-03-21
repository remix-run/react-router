---
"@react-router/dev": patch
"react-router": patch
---

UNSTABLE RSC FRAMEWORK MODE BREAKING CHANGE - Existing route module exports remain unchanged from stable v7 non-RSC mode, but new exports are added for RSC mode. If you want to use RSC features, you will need to update your route modules to export the new annotations.
