Deprecate the `createStaticRouter({ branches })` option

`createStaticRouter` now caches route branches internally, so the `branches` option is no longer used and logs a deprecation warning when provided
