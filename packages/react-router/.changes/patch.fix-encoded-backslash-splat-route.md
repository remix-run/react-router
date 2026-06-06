Fix Internal Server Error when visiting a path with an encoded backslash (`%5C`) on a splat route

When `matchRoutes` decoded a path like `/%5C` to `/\`, the decoded backslash was subsequently passed to `encodeLocation` which uses `new URL()` internally. Because the `URL` constructor rejects bare backslashes as invalid URL characters, this caused a `TypeError: Invalid URL` server error. The fix pre-encodes backslashes to `%5C` before passing the decoded pathname to `encodeLocation`, consistent with the existing pre-encoding of `%`, `?`, and `#`.
