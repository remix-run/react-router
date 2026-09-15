Deprecate the `createStaticRouter({ branches })` option

- `createStaticRouter` now caches route branches internally, ignores `branches`, and logs a deprecation warning when the option is provided
- The deprecated `EntryContext.branches` property remains available for compatibility but is always an empty array
