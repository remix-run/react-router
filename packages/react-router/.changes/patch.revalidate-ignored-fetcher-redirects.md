Revalidate loader data when a fetcher action redirect is not followed

- A fetcher action redirect is ignored when a newer navigation started while the action was running, or when the fetcher unmounted before it finished. The action still ran, so loaders now revalidate instead of leaving stale loader data in place, including shared parent loaders when another navigation completed while the action was running. Routes can still opt out via `shouldRevalidate`
- When a fetcher revalidation completes a pending navigation that another fetcher's redirect started, that fetcher now returns to `idle` instead of staying in `loading`
