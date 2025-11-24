---
"react-router": patch
---

Fix a Framework Mode bug where the `defaultShouldRevalidate` parameter to `shouldRevalidate` would not be correct after `action` returned a 4xx/5xx response

- If your `shouldRevalidate` function relied on that parameter, you may have seen unintended revalidations
