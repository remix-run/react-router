Encode path params in `href`/`generatePath` per RFC 3986 path-segment rules instead of `encodeURIComponent`

- Characters that are valid literally in a path segment (`$ & + , ; = : @` — RFC 3986 `pchar`) are no longer percent-encoded, so values like a semver build `1.0.0+1` interpolate unchanged instead of becoming `1.0.0%2B1`
- Structural/unsafe characters (`/ ? # %`, whitespace, non-ASCII) are still escaped exactly as before
