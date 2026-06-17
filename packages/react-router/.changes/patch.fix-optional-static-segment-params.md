Fix incorrect dynamic param extraction when optional static segments are present

When a route path contains optional static segments (e.g. `/school?/user/:id`),
`compilePath` was generating capturing groups `(\/school)?` for those segments.
This shifted the capture group indices used to extract dynamic params, causing
`matchPath` to return wrong param values — e.g. `params.id` would be `"/school"`
instead of `"123"`.

Additionally, consecutive optional static segments (e.g. `/one?/two?`) were only
partially handled: only the first optional segment was wrapped in an optional
group, leaving subsequent segments' `?` as unescaped regex quantifiers that made
the last letter of the segment optional in the regex rather than the whole segment.

**Fix:** Change the optional static segment replacement in `compilePath` to use
non-capturing groups `(?:/$1)?` and a lookahead `(?=\/|$|\()` so that:
1. No capture groups are introduced for static segments (fixes param index mapping)
2. Consecutive optional static segments are all correctly processed
3. Optional static segments followed by optional dynamic params are handled correctly
