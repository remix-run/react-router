## [v4.6.0]
> Mar 7, 2017

- Encode/decode URLs
- Added `location.key` to the initial location in memory history
- Added ES modules build in `es` package directory
- Improve `basename` slash handling (source of a common user error, see [#404] and [#432])

[v4.6.0]: https://github.com/ReactTraining/history/compare/v4.5.1...v4.6.0
[#404]: https://github.com/ReactTraining/history/issues/404
[#432]: https://github.com/ReactTraining/history/pull/432

## [v4.5.1]
> Jan 9, 2017

- Fix a bug that allowed a history listener to still be called if it was
  unregistered in another listener

[v4.5.1]: https://github.com/ReactTraining/history/compare/v4.5.0...v4.5.1

## [v4.5.0]
> Dec 14, 2016

- Added `history.createHref(location)` for creating hrefs suitable for use in `<a href>`

[v4.5.0]: https://github.com/ReactTraining/history/compare/v4.4.1...v4.5.0

## [v4.4.1]
> Nov 24, 2016

- Fix the back button on Chrome iOS

[v4.4.1]: https://github.com/ReactTraining/history/compare/v4.4.0...v4.4.1

## [v4.4.0]
> Nov 1, 2016

- Use `value-equal` instead of own `deepEqual` function for checking state equality

[v4.4.0]: https://github.com/ReactTraining/history/compare/v4.3.0...v4.4.0

## [v4.3.0]
> Sep 29, 2016

- Allow relative pathnames in `history.push` and `history.replace` ([#135])

[v4.3.0]: https://github.com/ReactTraining/history/compare/v4.2.1...v4.3.0
[#135]: https://github.com/ReactTraining/history/issues/135

## [v4.2.1]
> Sep 29, 2016

- Fixed `createLocation` defaults when using objects instead of strings

[v4.2.1]: https://github.com/ReactTraining/history/compare/v4.2.0...v4.2.1

## [v4.2.0]
> Sep 15, 2016

- Add `createLocation` to top-level exports
- Better warnings

[v4.2.0]: https://github.com/ReactTraining/history/compare/v4.1.0...v4.2.0

## [v4.1.0]
> Sep 15, 2016

- Automatically use a leading `/` when doing `history.push('')`
- Automatically clean up bad location descriptors

[v4.1.0]: https://github.com/ReactTraining/history/compare/v4.0.0...v4.1.0

## [v4.0.0]
> Sep 10, 2016

- Added back two-arg form of `push` and `replace`

[v4.0.0]: https://github.com/ReactTraining/history/compare/v4.0.0-2...v4.0.0

## [v4.0.0-2]
> Sep 9, 2016

- Added `history.length`, `history.location`, and `history.action` properties
- Added `history.index` and `history.entries` properties in memory history
- Added `location.pathname`, `location.search`, and `location.hash` instead of
  `location.path` since this is work most people will always have to do
- Added `parsePath` and `createPath` helpers to top-level exports
- Removed `history.getCurrentLocation()`

[v4.0.0-2]: https://github.com/ReactTraining/history/compare/v4.0.0-1...v4.0.0-2

## [v4.0.0-1]
> Sep 6, 2016

- Fix blocking POP transitions in browsers where listen() has not yet been called
- Use block(false) to prevent transitions
- Better warnings for PUSH with the same path using hash history

[v4.0.0-1]: https://github.com/ReactTraining/history/compare/v4.0.0-0...v4.0.0-1

## [v4.0.0-0]
> Sep 3, 2016

- Easier top-level `import`s. Use `import createHistory from "history/createBrowserHistory"` instead of `history/lib/createBrowserHistory`.
- Removed the "middleware" API (i.e. all "use" functions).
- Moved path and query parsing out of core. Location objects are now `{ path, state, key }`. Any other parsing can be done outside core.
- Removed the `Actions` module. `location.action` is now just a string. No need to `import` our constants.
- Switched to using `window.history.state` in `createBrowserHistory` instead of `sessionStorage`.
- Removed `location.state` entirely from `createHashHistory` locations.
- Removed support for basename in `createMemoryHistory`.
- Refactored the test suite. Tests are much more flexible and easier to zero in on one that is failing.

[v4.0.0-0]: https://github.com/ReactTraining/history/compare/v3.2.1...v4.0.0-0

## [v3.2.0]
> Sep 1, 2016

- Exposed `canGo` in memory history

[v3.2.0]: https://github.com/ReactTraining/history/compare/v3.1.0...v3.2.0

## [v3.1.0]
> Sep 1, 2016

- Added `hashType` option to hash history for supporting different
  hash URL schemes including "hashbang" and no leading slash
- **Bugfix:** Fix URL restoration on canceled popstate transitions
- Better React Native support

[v3.1.0]: https://github.com/ReactTraining/history/compare/v3.0.0...v3.1.0

## [v3.0.0]
> May 30, 2016

- `location.query` has no prototype
- Warn about protocol-relative URLs ([#243])
- **Bugfix:** Ignore errors when saving hash history state if
  `window.sessionStorage` is undefined ([#295])
- **Bugfix:** Fix replacing hash path in IE served via file protocol ([#126])

[v3.0.0]: https://github.com/ReactTraining/history/compare/v3.0.0-2...v3.0.0
[#243]: https://github.com/ReactTraining/history/issues/243
[#295]: https://github.com/ReactTraining/history/issues/295
[#126]: https://github.com/ReactTraining/history/issues/126

## [v3.0.0-2]
> Apr 19, 2016

- Lower-cased UMD build file name

[v3.0.0-2]: https://github.com/ReactTraining/history/compare/v3.0.0-1...v3.0.0-2

## [v3.0.0-1]
> Apr 19, 2016

- Added `locationsAreEqual` to top-level exports
- **Breakage:** Removed support for `<base href>` as `basename` ([#94])
- Removed dependency on `deep-equal`

[v3.0.0-1]: https://github.com/ReactTraining/history/compare/v3.0.0-0...v3.0.0-1
[#94]: https://github.com/ReactTraining/history/issues/94

## [3.0.0-0]
> Mar 19, 2016

- Added `history.getCurrentLocation()` method
- **Breakage:** `history.listen` no longer calls the callback synchronously once.
  Use `history.getCurrentLocation` instead
- **Breakage:** `location.key` on the initial POP is `null`. Users who relied on
  this key may immediately use `replace` to get it back
- **Breakage:** `location.state` is `undefined` (instead of `null`) if the location
  has no state. This helps us know when we need to access session storage and when
  we can safely ignore it
- **Bugfix:** Hash history now uses a custom query string key/value pair only if
  the location has state. This obsoletes using `{ queryKey: false }` to prevent
  the query string from being used ([#163])
- **Bugfix:** Do not access `window.sessionStorage` unless the location has state.
  This should minimize the # of times we access session storage and allow users to
  opt-out of using it entirely by not using location state

[3.0.0-0]: https://github.com/ReactTraining/history/compare/v2.0.0...v3.0.0-0
[#163]: https://github.com/ReactTraining/history/issues/163

## [v2.0.0]
> Feb 4, 2016

- **Bugfix:** Fix search base logic with an empty query ([#221])
- **Bugfix:** Fail gracefully when Safari 5 security settings prevent access to window.sessionStorage ([#223])

[v2.0.0]: https://github.com/ReactTraining/history/compare/v2.0.0-rc3...v2.0.0
[#221]: https://github.com/ReactTraining/history/issues/221
[#223]: https://github.com/ReactTraining/history/pull/223

## [v2.0.0-rc3]
> Feb 3, 2016

- **Bugfix:** Don't convert same-path `PUSH` to `REPLACE` when `location.state` changes ([#179])
- **Bugfix:** Re-enable browser history on Chrome iOS ([#208])
- **Bugfix:** Properly support location descriptors in `history.createLocation` ([#200])

[v2.0.0-rc3]: https://github.com/ReactTraining/history/compare/v2.0.0-rc2...v2.0.0-rc3
[#179]: https://github.com/ReactTraining/history/pull/179
[#208]: https://github.com/ReactTraining/history/pull/208
[#200]: https://github.com/ReactTraining/history/pull/200

## [v2.0.0-rc2]
> Jan 9, 2016

- Add back deprecation warnings

[v2.0.0-rc2]: https://github.com/ReactTraining/history/compare/v2.0.0-rc1...v2.0.0-rc2

## [v2.0.0-rc1]
> Jan 2, 2016

- **Bugfix:** Don't create empty entries in session storage ([#177])

[v2.0.0-rc1]: https://github.com/ReactTraining/history/compare/v1.17.0...v2.0.0-rc1
[#177]: https://github.com/ReactTraining/history/pull/177

## [v1.17.0]
> Dec 19, 2015

- **Bugfix:** Don't throw in memory history when out of history entries ([#170])
- **Bugfix:** Fix the deprecation warnings on `createPath` and `createHref` ([#189])

[v1.17.0]: https://github.com/ReactTraining/history/compare/v1.16.0...v1.17.0
[#170]: https://github.com/ReactTraining/history/pull/170
[#189]: https://github.com/ReactTraining/history/pull/189

## [v1.16.0]
> Dec 10, 2015

- **Bugfix:** Silence all warnings that were introduced since 1.13 (see [reactjs/react-router#2682])
- Deprecate the `createLocation` method in the top-level exports
- Deprecate the `state` arg to `history.createLocation`

[v1.16.0]: https://github.com/ReactTraining/history/compare/v1.15.0...v1.16.0
[reactjs/react-router#2682]: https://github.com/reactjs/react-router/issues/2682

## [v1.15.0]
> Dec 7, 2015

- Accept location descriptors in `createPath` and `createHref` ([#173])
- Deprecate the `query` arg to `createPath` and `createHref` in favor of using location descriptor objects ([#173])

[v1.15.0]: https://github.com/ReactTraining/history/compare/v1.14.0...v1.15.0
[#173]: https://github.com/ReactTraining/history/pull/173

## [v1.14.0]
> Dec 6, 2015

- Accept objects in `history.push` and `history.replace` ([#141])
- Deprecate `history.pushState` and `history.replaceState` in favor of passing objects to `history.push` and `history.replace` ([#168])
- **Bugfix:** Disable browser history on Chrome iOS ([#146])
- **Bugfix:** Do not convert same-path PUSH to REPLACE if the hash has changed ([#167])
- Add ES2015 module build ([#152])
- Use query-string module instead of qs to save on bytes ([#121])

[v1.14.0]: https://github.com/ReactTraining/history/compare/v1.13.1...v1.14.0
[#121]: https://github.com/ReactTraining/history/issues/121
[#141]: https://github.com/ReactTraining/history/pull/141
[#146]: https://github.com/ReactTraining/history/pull/146
[#152]: https://github.com/ReactTraining/history/pull/152
[#167]: https://github.com/ReactTraining/history/pull/167
[#168]: https://github.com/ReactTraining/history/pull/168

## [v1.13.1]
> Nov 13, 2015

- Fail gracefully when Safari security settings prevent access to window.sessionStorage
- Pushing the currently active path will result in a replace to not create additional browser history entries ([#43])
- Strip the protocol and domain from `<base href>` ([#139])

[v1.13.1]: https://github.com/ReactTraining/history/compare/v1.13.0...v1.13.1
[#43]: https://github.com/ReactTraining/history/pull/43
[#139]: https://github.com/ReactTraining/history/pull/139

## [v1.13.0]
> Oct 28, 2015

- `useBasename` transparently handles trailing slashes ([#108])
- `useBasename` automatically uses the value of `<base href>` when no
  `basename` option is provided ([#94])

[v1.13.0]: https://github.com/ReactTraining/history/compare/v1.12.6...v1.13.0
[#108]: https://github.com/ReactTraining/history/pull/108
[#94]: https://github.com/ReactTraining/history/issues/94

## [v1.12.6]
> Oct 25, 2015

- Add `forceRefresh` option to `createBrowserHistory` that forces
  full page refreshes even when the browser supports pushState ([#95])

[v1.12.6]: https://github.com/ReactTraining/history/compare/v1.12.5...v1.12.6
[#95]: https://github.com/ReactTraining/history/issues/95

## [v1.12.5]
> Oct 11, 2015

- Un-deprecate top-level createLocation method
- Add ability to use `{ pathname, search, hash }` object anywhere
  a path can be used
- Fix `useQueries` handling of hashes ([#93])

[v1.12.5]: https://github.com/ReactTraining/history/compare/v1.12.4...v1.12.5
[#93]: https://github.com/ReactTraining/history/issues/93

## [v1.12.4]
> Oct 9, 2015

- Fix npm postinstall hook on Windows ([#62])

[v1.12.4]: https://github.com/ReactTraining/history/compare/v1.12.3...v1.12.4
[#62]: https://github.com/ReactTraining/history/issues/62

## [v1.12.3]
> Oct 7, 2015

- Fix listenBefore hooks not being called unless a listen hook was also registered ([#71])
- Add a warning when we cannot save state in Safari private mode ([#42])

[v1.12.3]: https://github.com/ReactTraining/history/compare/v1.12.2...v1.12.3
[#71]: https://github.com/ReactTraining/history/issues/71
[#42]: https://github.com/ReactTraining/history/issues/42

## [v1.12.2]
> Oct 6, 2015

- Fix hash support (see [comments in #51][#51-comments])

[v1.12.2]: https://github.com/ReactTraining/history/compare/v1.12.1...v1.12.2
[#51-comments]: https://github.com/ReactTraining/history/pull/51#issuecomment-143189672

## [v1.12.1]
> Oct 5, 2015

- Give `location` objects a `key` by default
- Deprecate `history.setState`

[v1.12.1]: https://github.com/ReactTraining/history/compare/v1.12.0...v1.12.1

## [v1.12.0]
> Oct 4, 2015

- Add `history.createLocation` instance method. This allows history enhancers such as `useQueries` to modify `location` objects when creating them directly
- Deprecate `createLocation` method on top-level exports

[v1.12.0]: https://github.com/ReactTraining/history/compare/v1.11.1...v1.12.0

## [v1.11.1]
> Sep 26, 2015

- Fix `location.basename` when location matches exactly ([#68])
- Allow transitions to be interrupted by another

[v1.11.1]: https://github.com/ReactTraining/history/compare/v1.11.0...v1.11.1
[#68]: https://github.com/ReactTraining/history/issues/68

## [v1.11.0]
> Sep 24, 2015

- Add `useBasename` history enhancer
- Add `history.listenBefore`
- Add `history.listenBeforeUnload` to `useBeforeUnload` history enhancer
- Deprecate (un)registerTransitionHook
- Deprecate (un)registerBeforeUnloadHook
- Fix installing directly from git repo

[v1.11.0]: https://github.com/ReactTraining/history/compare/v1.10.2...v1.11.0
