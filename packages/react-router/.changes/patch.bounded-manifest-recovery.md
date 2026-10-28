Retry manifest version-mismatch recovery within a bounded budget before rendering an error boundary

- Share up to three document-navigation attempts over 30 seconds across client versions and document reloads
- Preserve the budget when delayed recovery is superseded by cancellation or a complete route tree
- Preserve error-boundary behavior when automatic recovery is exhausted or fails, without continuing against stale route trees
- Apply the same recovery budget to RSC Framework manifest and payload mismatches
