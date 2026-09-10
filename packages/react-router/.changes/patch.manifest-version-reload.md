Prevent stale route discovery during manifest version-mismatch recovery

- Keep concurrent manifest responses pending while a document reload is in progress.
- Report a discovery error when a previous reload failed to resolve a version mismatch instead of loading a stale route or reloading repeatedly.
- Resume version checks when a document is restored from the back-forward cache.
