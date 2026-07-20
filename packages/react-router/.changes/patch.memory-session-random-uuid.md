Use `crypto.randomUUID()` for `createMemorySessionStorage` session ids

- `createMemorySessionStorage` is only intended for local development and testing - sessions are lost when the server restarts
