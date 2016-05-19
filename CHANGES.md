## [v2.4.1]
> May 19, 2016

- **Bugfix:** Don't crash on invalid URI components in params ([#3453])

[v2.4.1]: https://github.com/reactjs/react-router/compare/v2.4.0...v2.4.1
[#3453]: https://github.com/reactjs/react-router/pull/3453


## [v2.4.0]
> April 28, 2016

- **Feature:** Add `withRouter` higher-order component for injecting `props.router` ([#3352])
- **Minor:** Add React as a peer dependency ([#3361])
- **Minor:** Upgrade to Babel 6 ([#3362])
- **Minor:** Add `target` to `propTypes` for `<Link>` ([#3397])

[v2.4.0]: https://github.com/reactjs/react-router/compare/v2.3.0...v2.4.0
[#3352]: https://github.com/reactjs/react-router/pull/3352
[#3361]: https://github.com/reactjs/react-router/pull/3361
[#3362]: https://github.com/reactjs/react-router/pull/3362
[#3397]: https://github.com/reactjs/react-router/pull/3397


## [v2.3.0]
> April 18, 2016

- **Feature:** Add `applyRouterMiddleware` for extending router rendering ([#3327])
- **Feature/Deprecation:** Add `routerShape` and `locationShape` as top-level exported prop types, and deprecate all the old prop types, including the ones that were previously incorrectly removed ([#3349])
- **Minor:** Move ES module build back to `es6/` to avoid breaking people who were importing from `react-router/es6` ([#3334])

[v2.3.0]: https://github.com/reactjs/react-router/compare/v2.2.4...v2.3.0
[#3327]: https://github.com/reactjs/react-router/pull/3327
[#3334]: https://github.com/reactjs/react-router/pull/3334
[#3349]: https://github.com/reactjs/react-router/pull/3349


## [v2.2.4]
> April 15, 2016

- **Noop:** Publish again to npm to work around missing tarball problem

[v2.2.4]: https://github.com/reactjs/react-router/compare/v2.2.3...v2.2.4


## [v2.2.3]
> April 15, 2016

- **Bugfix:** Don't use `Object.assign` in `getComponentsForRoute` ([#3331])
- **Minor:** Speed up checking index path active status ([#3313])

[v2.2.3]: https://github.com/reactjs/react-router/compare/v2.2.2...v2.2.3
[#3331]: https://github.com/reactjs/react-router/pull/3331
[#3313]: https://github.com/reactjs/react-router/pull/3313


## [v2.2.2]
> April 14, 2016

- **Bugfix:** Fix edge cases with continuing matches after pathless routes ([#3308])

[v2.2.2]: https://github.com/reactjs/react-router/compare/v2.2.1...v2.2.2
[#3308]: https://github.com/reactjs/react-router/pull/3308


## [v2.2.1]
> April 14, 2016

- **Bugfix:** Fix `this` in `getComponent` and `getComponents` ([#3306])

[v2.2.1]: https://github.com/reactjs/react-router/compare/v2.2.0...v2.2.1
[#3306]: https://github.com/reactjs/react-router/pull/3306


## [v2.2.0]
> April 13, 2016

- **Feature/Deprecation:** Call `getComponent` and `getComponents` with `nextState`; deprecate accessing `location` directly in favor of `nextState.location` there ([#3298], [Upgrade Guide](/upgrade-guides/v2.2.0.md#getcomponent-getcomponents-signature))
- **Bugfix:** Do not ignore extraneous slashes in matching ([#3285])
- **Bugfix:** Do not unnecessarily set empty `className` on `<Link>` ([#3288])
- **Minor:** Update PropTypes ([#3218])
- **Minor:** Move ES module build from `es6/` to `es/` ([#3295])
- **Minor:** Do not include unused deprecation logic in production builds ([#3296])

[v2.2.0]: https://github.com/reactjs/react-router/compare/v2.1.1...v2.2.0
[#3218]: https://github.com/reactjs/react-router/pull/3218
[#3285]: https://github.com/reactjs/react-router/pull/3285
[#3288]: https://github.com/reactjs/react-router/pull/3288
[#3295]: https://github.com/reactjs/react-router/pull/3295
[#3296]: https://github.com/reactjs/react-router/pull/3296
[#3298]: https://github.com/reactjs/react-router/pull/3298


## [v2.1.1]
> April 11, 2016

- **Bugfix:** Remove unintentionally released code change ([#3280])

[v2.1.1]: https://github.com/reactjs/react-router/compare/v2.1.0...v2.1.1
[#3280]: https://github.com/reactjs/react-router/pull/3280


## [v2.1.0]
> April 11, 2016

- **Feature:** Add support for `onChange` hook on routes ([#3108])
- **Minor:** Include full warning messages in non-minified UMD build ([#3213])
- **Minor:** Speed up path matching ([#3217])

[v2.1.0]: https://github.com/reactjs/react-router/compare/v2.0.1...v2.1.0
[#3108]: https://github.com/reactjs/react-router/pull/3108
[#3213]: https://github.com/reactjs/react-router/pull/3213
[#3217]: https://github.com/reactjs/react-router/pull/3217

## [v2.0.1]
> March 9, 2016

- **Bugfix:** Call transition hooks on child routes of parents whose params
changed but the child's did not. ([#3166])
- **Minor:** Remove support for installing from source ([#3164])

[v2.0.1]: https://github.com/reactjs/react-router/compare/v2.0.0...v2.0.1
[#3164]: https://github.com/reactjs/react-router/pull/3164
[#3166]: https://github.com/reactjs/react-router/pull/3166

## [v2.0.0]
> Feb 10, 2016

- **Bugfix:** Add back basename support in `match` ([#3054])

[v2.0.0]: https://github.com/reactjs/react-router/compare/v2.0.0-rc6...v2.0.0
[#3054]: https://github.com/reactjs/react-router/pull/3054

## [v2.0.0-rc6]
> Feb 5, 2016

- **Breaking:** Removed default top-level `<Router>` export ([#2906])
- **Bugfix:** Use history.createLocation where possible ([#2910])
- **Bugfix:** Fix initial routing state after `match` ([#2965])
- **Minor:** Reduce stack size from matching routes ([#2923])

[v2.0.0-rc6]: https://github.com/reactjs/react-router/compare/v2.0.0-rc5...v2.0.0-rc6
[#2906]: https://github.com/reactjs/react-router/pull/2906
[#2910]: https://github.com/reactjs/react-router/pull/2910
[#2965]: https://github.com/reactjs/react-router/pull/2965
[#2923]: https://github.com/reactjs/react-router/pull/2923

## [v2.0.0-rc5]
> Jan 14, 2016

- **Feature:** Support custom `history` for `match` ([#2813])
- **Feature:** Support location descriptor in `replace` callback in `onEnter` ([#2855])
- **Feature:** Improve support for server rendering async routes ([#2883])

[v2.0.0-rc5]: https://github.com/reactjs/react-router/compare/v2.0.0-rc4...v2.0.0-rc5
[#2813]: https://github.com/reactjs/react-router/pull/2813
[#2855]: https://github.com/reactjs/react-router/pull/2855
[#2883]: https://github.com/reactjs/react-router/pull/2883

## [v2.0.0-rc4]
> Dec 30, 2015

- **Feature:** Added `render` prop to `Router`
- **Feature:** Added singleton `browserHistory` and `hashHistory`
- **Feature:** Added `createMemoryHistory`
- **Deprecation:** Deprecated all mixins
- **Deprecation:** Replaced `context.history` with `context.router`
- **Deprecation:** Deprecated Route Component `props.history`
- **Deprecation:** Deprecated `context.location`

[v2.0.0-rc4]: https://github.com/reactjs/react-router/compare/v1.0.3...v2.0.0-rc4

## [v1.0.3]
> Dec 23, 2015

- Switched back to a caret range for history, now that the warnings have been removed

[v1.0.3]: https://github.com/reactjs/react-router/compare/v1.0.2...v1.0.3

## [v1.0.2]
> Dec 8, 2015

- Pinned peer dependency on History to `1.13.x` to avoid console warnings.

[v1.0.2]: https://github.com/reactjs/react-router/compare/v1.0.1...v1.0.2

## [v1.0.1]
> Dec 5, 2015

- Support IE8 ([#2540])
- Add ES2015 module build ([#2530])

[v1.0.1]: https://github.com/reactjs/react-router/compare/v1.0.0...v1.0.1
[#2530]: https://github.com/reactjs/react-router/pull/2530
[#2540]: https://github.com/reactjs/react-router/pull/2540


## [v1.0.0]
> Nov 9, 2015

Please see `/upgrade-guides/v1.0.0.md`

[v1.0.0]: https://github.com/reactjs/react-router/compare/v0.13.5...v1.0.0
