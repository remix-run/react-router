Time out stalled Lazy Route Discovery manifest requests instead of hanging the pending navigation or fetcher forever.

`fetch()` has no default timeout, so a `/__manifest` request that never settled (proxy stall, exhausted HTTP/1.1 connection pool, dropped connection) previously pinned a fetcher in a permanent `"submitting"`/`"loading"` state with no error surfaced anywhere. The discovery request now aborts after 10 seconds and the resulting error settles the navigation/fetcher through the normal error-boundary path.
