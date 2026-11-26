Skip revalidation after an action throws `data()` with a 4xx/5xx status, matching actions that throw or return a `Response` and exposing the status as `actionStatus` to `shouldRevalidate`
