Skip `deleteData` in `destroySession` when the session has no ID

- Avoid failures when destroying a session without a cookie on storage that rejects an empty key
