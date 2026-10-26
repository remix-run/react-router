Preserve pending fetcher mutation revalidation when an older navigation or background reload completes to prevent stale loader data

Keep newer fetcher loads cancellable when earlier revalidations finish so older responses cannot overwrite fresh fetcher data
