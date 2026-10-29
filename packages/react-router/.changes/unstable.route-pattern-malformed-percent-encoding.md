Fix `future.unstable_routePatternMatching` not matching pathnames with a malformed percent-encoding (e.g. `/users/%`), which the default matcher matches as raw text
