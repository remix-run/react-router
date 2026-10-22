Skip `deleteData` in `destroySession` when the session has no ID, so destroying a session without a cookie no longer fails on storage that rejects an empty key
