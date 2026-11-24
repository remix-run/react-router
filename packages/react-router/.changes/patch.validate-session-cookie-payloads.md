Treat session cookies with an invalid payload shape as empty sessions

- Pass only nonempty string session IDs to storage adapters
- Accept only non-array objects as data for cookie-backed sessions
