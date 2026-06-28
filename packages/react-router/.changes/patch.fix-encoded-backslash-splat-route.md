Fix Internal Server Error when visiting a path with an encoded backslash (`%5C`) on a splat route

When `matchRoutes` decoded a path like `/%5C` to `/\`, the decoded backslash was subsequently passed to `encodeLocation` which uses `new URL()` internally. Because the `URL` constructor rejects bare backslashes as invalid URL characters, this caused a `TypeError: Invalid URL` server error. The fix pre-encodes backslashes to `%5C` before passing the decoded pathname to `encodeLocation`, consistent with the existing pre-encoding of `%`, `?`, and `#`.

Because this re-encoding happens in `useRoutesImpl` before the matches reach the route context, relative links rendered on such a route (including `NavLink`, which resolves its `to` against the current match and then calls `encodeLocation`) no longer throw either.

Navigating relative to such a route (e.g. clicking a `<Link to=".">`) hit the same problem from the other direction: the router resolves `.` against the active matches, whose pathnames are already decoded, and the resulting backslash reached `new URL()` inside the browser history's `encodeLocation`. That path now re-encodes the backslash as well, so relative navigations on an encoded-backslash route work instead of erroring.
