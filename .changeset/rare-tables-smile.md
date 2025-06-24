---
"@react-router/dev": patch
---

Fixed an issue with Vite's default server conditions being misapplied to `externalConditions`. This incorrectly enabled `module` condition for externals and broke builds with certain packages, like Emotion.
