Fix `SingleFetchNoResultError` thrown when a fetcher revalidates against a splat route during lazy route discovery

Track discovery per fetcher load so revalidation waits for the current load's discovery, even when the fetcher key is reused, while still restarting interrupted loaders after discovery completes.
