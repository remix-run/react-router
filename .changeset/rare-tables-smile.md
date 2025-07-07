---
"@react-router/dev": patch
---

In `cloudflareDevProxy`, fix incorrectly configured `externalConditions` which had enabled `module` condition for externals and broke builds with certain packages, like Emotion.
