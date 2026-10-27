Revalidate loader data when a fetcher action redirect is not followed

- Revalidate when an action redirect is ignored because a newer navigation started or the fetcher unmounted while the action was running
- Include shared parent loaders when another navigation completed while the action was running
- Continue to respect `shouldRevalidate`
- Return fetchers to `idle` when a revalidation completes a pending navigation started by another fetcher's redirect
