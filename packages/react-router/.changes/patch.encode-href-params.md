Fix `href()` to properly stringify and URL-encode param values, matching `generatePath()`

- splat params preserve path separators while encoding each segment individually
