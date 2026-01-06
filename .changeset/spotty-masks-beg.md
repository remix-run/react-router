---
"@react-router/dev": minor
"react-router": minor
---

Add additional layer of CSRF protection by rejecting submissions to UI routes from external origins. If you need to permit access to specific external origins, you can specify them in the `react-router.config.ts` config `allowedActionOrigins` field.
