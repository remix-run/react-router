Prevent stale route discovery during manifest version-mismatch recovery

- Keep concurrent manifest responses pending while a document reload is in progress.
- Report a discovery error when a previous reload failed to resolve a version mismatch instead of loading a stale route or reloading repeatedly.
- Fail pending requests if a document reload does not complete within five seconds or the document is restored from the back-forward cache, allowing subsequent requests to recover.
