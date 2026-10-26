Preserve pending fetcher mutation revalidation when an older navigation or background reload completes to prevent stale loader data

Keep newer fetcher loads cancellable and preserve them when earlier revalidations finish or abort, preventing older responses from overwriting fresh fetcher data
