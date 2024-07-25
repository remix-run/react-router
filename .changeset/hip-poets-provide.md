---
"@remix-run/router": patch
---

Fix internal cleanup of interrupted fetchers to avoid invalid revalidations on navigations

- When a `fetcher.load` is interrupted by an `action` submission, we track it internally and force revalidation once the `action` completes
- We previously only cleared out this internal tracking info on a successful _navigation_ submission
- Therefore, if the `fetcher.load` was interrupted by a `fetcher.submit`, then we wouldn't remove it from this internal tracking info on successful load (incorrectly)
- And then on the next navigation it's presence in the internal tracking would automatically trigger execution of the `fetcher.load` again, ignoring any `shouldRevalidate` logic
- This fix cleans up the internal tracking so it applies to both navigation submission and fetcher submissions
