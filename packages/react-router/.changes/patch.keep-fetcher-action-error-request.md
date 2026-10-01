Stop aborting a fetcher's completed action request when the action returns an error

- Aborting the finished request errored the unread tail of the single-fetch response body, which surfaced as an unhandled `AbortError` rejection in the browser
