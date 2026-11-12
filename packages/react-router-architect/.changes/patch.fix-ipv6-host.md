Fix the request URL when the `Host` header is an IPv6 address (e.g., `[::1]:3333`), which made `new URL()` throw
