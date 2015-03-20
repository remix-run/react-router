v0.13.0 - Fri, 20 Mar 2015 21:25:35 GMT
---------------------------------------

- [f3a44f1](../../commit/f3a44f1) [fixed] React 0.13 compatibility
- [559c604](../../commit/559c604) [changed] Use empty bracket notation for arrays
- [07b4972](../../commit/07b4972) [fixed] Allow repetition in child paths
- [696a706](../../commit/696a706) [fixed] Use defaultProps of config components
- [61f0a8c](../../commit/61f0a8c) [changed] Deprecate Navigation/State mixins


v0.12.4 - Tue, 24 Feb 2015 21:53:02 GMT
---------------------------------------

- [5768506](../../commit/5768506) [fixed] Build generation


v0.12.3 - Tue, 24 Feb 2015 21:37:49 GMT
---------------------------------------

- [aef0dce](../../commit/aef0dce) [fixed] DefaultRoute/NotFoundRoute name regression


v0.12.2 - Tue, 24 Feb 2015 00:34:16 GMT
---------------------------------------

- [196390f](../../commit/196390f) [fixed] Make <Route name>s global, again


v0.12.1 - Mon, 23 Feb 2015 22:54:19 GMT
---------------------------------------

- [3d8a883](../../commit/3d8a883) [fixed] Ignore extraneous popstate events in WebKit
- [db2607d](../../commit/db2607d) [fixed] Double-encoding of URLs
- [c5a24a5](../../commit/c5a24a5) [added] Route/Match classes
- [ae6fcda](../../commit/ae6fcda) [changed] Rename Scrolling => ScrollHistory
- [f975bdf](../../commit/f975bdf) [fixed] allow a StaticLocation to be passed directly when creating a router
- [7d52d55](../../commit/7d52d55) [changed] TestLocation is a constructor
- [193222e](../../commit/193222e) [added] StaticLocation, for server-side rendering
- [e05e229](../../commit/e05e229) [added] Transition#cancel
- [04ba639](../../commit/04ba639) [added] Link activeStyle property
- [585d8ec](../../commit/585d8ec) [fixed] Use more correct children invariant
- [62c49d2](../../commit/62c49d2) [changed] Change Navigation to return the result of goBack()
- [83c8f59](../../commit/83c8f59) [fixed] Allow special characters in query


v0.12.0 - Tue, 10 Feb 2015 20:12:42 GMT
---------------------------------------

- [cd2087d](../../commit/cd2087d) [added] default handler to routes
- [848361e](../../commit/848361e) [fixed] Clean up mounted route component on unmount so we don't leak references
- [5bcf653](../../commit/5bcf653) [fixed] Double slash in href when parent route has optional trailing slash
- [e280efd](../../commit/e280efd) [changed] Don't restore scroll position on Forward
- [20c2c9b](../../commit/20c2c9b) [fixed] Do not decode + in pathname
- [fe5ec39](../../commit/fe5ec39) [fixed] Double-encoding of query strings
- [df38294](../../commit/df38294) [fixed] Allow comments in JSX config
- [84056ba](../../commit/84056ba) [fixed] Ignore falsy routes
- [4a770e8](../../commit/4a770e8) [fixed] Using TestLocation without DOM
- [2ac2510](../../commit/2ac2510) [added] router.replaceRoutes(children)
- [1f81286](../../commit/1f81286) [fixed] Ignore stale transitions
- [c6ed6fa](../../commit/c6ed6fa) [removed] transition.wait, use callbacks instead
- [75c6206](../../commit/75c6206) [added] router.stop()
- [4e96256](../../commit/4e96256) [fixed] Preserve original query with HashLocation
- [2f19e63](../../commit/2f19e63) [changed] Bump qs dependency version


v0.11.6 - Wed, 17 Dec 2014 19:29:53 GMT
---------------------------------------

- [90cd750](../../commit/90cd750) [fixed] Call all transition hooks on query changes


v0.11.5 - Mon, 15 Dec 2014 22:32:38 GMT
---------------------------------------

- [31e1eb2](../../commit/31e1eb2) [fixed] supportsHistory false negatives on WP 8.1
- [6417285](../../commit/6417285) [fixed] tearing down location listeners
- [457d944](../../commit/457d944) [added] Router.History
- [a07003e](../../commit/a07003e) [fixed] URL hash consistency across browsers
- [c6aa4d3](../../commit/c6aa4d3) [fixed] Now execute willTransition* hooks even if only query part was changed


v0.11.4 - Fri, 28 Nov 2014 16:10:06 GMT
---------------------------------------

- [b9079c9](../../commit/b9079c9) [added] getPathname to Router.State
- [91d4380](../../commit/91d4380) [fixed] Abort pending transition on user navigation
- [5fe6c08](../../commit/5fe6c08) [changed] Don't update scroll if only query has changed


v0.11.3 - Thu, 27 Nov 2014 05:29:48 GMT
---------------------------------------

- [91d4380](../../commit/91d4380) [fixed] Abort pending transition on user navigation
- [5fe6c08](../../commit/5fe6c08) [changed] Don't update scroll if only query has changed


v0.11.2 - Mon, 24 Nov 2014 16:56:52 GMT
---------------------------------------

- [017363d](../../commit/017363d) [fixed] default redirect path to '*'
- [187eb0e](../../commit/187eb0e) [fixed] Added missing require statement
- [5a1ed33](../../commit/5a1ed33) [fixed] Path.decode/encode with query string


v0.11.1 - Sat, 22 Nov 2014 15:00:37 GMT
---------------------------------------

- [b75f648](../../commit/b75f648) [fixed] rendering current handlers before rendering root


v0.11.0 - Sat, 22 Nov 2014 06:03:21 GMT
---------------------------------------

- Everything ... seriously. Please review the [upgrade
  guide](./UPGRADE_GUIDE.md#010x---011x).


v0.10.2 - Fri, 31 Oct 2014 16:23:27 GMT
---------------------------------------

- [940a0d0](../../commit/940a0d0) [changed] use `Object.assign` instead of `copyProperties`
- [f8cb7f9](../../commit/f8cb7f9) [changed] use `Object.assign` instead of `merge`
- [70b442a](../../commit/70b442a) [added] React 0.12 compatibility


v0.10.1 - Fri, 31 Oct 2014 15:46:20 GMT
---------------------------------------

- [70b442a](../../commit/70b442a) [added] React 0.12 compatibility


v0.10.0 - Thu, 30 Oct 2014 05:09:44 GMT
---------------------------------------

- [70b442a](../../commit/70b442a) [added] React 0.12 compatibility


v0.9.5 - Thu, 30 Oct 2014 04:50:09 GMT
--------------------------------------

- [6192285](../../commit/6192285) [added] <Route ignoreScrollBehavior /> to opt out of scroll behavior for itself and descendants


v0.9.4 - Mon, 13 Oct 2014 19:53:10 GMT
--------------------------------------

- [e571c27](../../commit/e571c27) [fixed] Add .active class to `<Link>`s with absolute hrefs
- [ea5a380](../../commit/ea5a380) [fixed] Make sure onChange is fired at synchronous first render
- [dee374f](../../commit/dee374f) [fixed] Listen to path changes caused by initial redirect, fixes #360
- [d47d7dd](../../commit/d47d7dd) [fixed] potential infinite loop during transitions
- [1b1a62b](../../commit/1b1a62b) [added] Server-side rendering
- [c7ca87e](../../commit/c7ca87e) [added] `<Routes onError>`


v0.9.3 - Wed, 08 Oct 2014 14:44:52 GMT
--------------------------------------

- [caf3a2b](../../commit/caf3a2b) [fixed] scrollBehavior='none' on path update


v0.9.2 - Wed, 08 Oct 2014 05:33:30 GMT
--------------------------------------

- [d57f830](../../commit/d57f830) [changed] Public interface for Location objects
- [6723dc5](../../commit/6723dc5) [added] ability to set params/query in Redirect
- [60f9eb4](../../commit/60f9eb4) [fixed] encoded ampersands in query params
- [668773c](../../commit/668773c) [fixed] transitioning to paths with .


v0.9.1 - Mon, 06 Oct 2014 20:55:32 GMT
--------------------------------------

- [76fe696](../../commit/76fe696) [fixed] trailing comma


v0.9.0 - Mon, 06 Oct 2014 19:37:27 GMT
--------------------------------------

- [5aae2a8](../../commit/5aae2a8) [added] onChange event to Routes
- [ba65269](../../commit/ba65269) [removed] AsyncState
- [4d8c7a1](../../commit/4d8c7a1) [removed] `<Routes onTransitionError>`
- [4d8c7a1](../../commit/4d8c7a1) [removed] `<Routes onAbortedTransition>`
- [ed0cf62](../../commit/ed0cf62) [added] Navigation mixin for components that need to modify the URL
- [ed0cf62](../../commit/ed0cf62) [added] CurrentPath mixin for components that need to know the current URL path
- [ed0cf62](../../commit/ed0cf62) [added] getActiveRoutes, getActiveParams, and getActiveQuery methods to ActiveState mixin
- [ed0cf62](../../commit/ed0cf62) [removed] Awkward updateActiveState callback from ActiveState mixin
- [ed0cf62](../../commit/ed0cf62) [removed] Router.PathState (use Router.CurrentPath instead)
- [ed0cf62](../../commit/ed0cf62) [removed] Router.Transitions (use Router.Navigation instead)
- [ed0cf62](../../commit/ed0cf62) [removed] Router.RouteLookup (because it was useless)
- [ed0cf62](../../commit/ed0cf62) [added] `<Routes scrollBehavior="browser">` alias of "imitateBrowser"
- [ed0cf62](../../commit/ed0cf62) [changed] `<Routes fixedPath>` => `<Routes initialPath>` will be useful for SSR


v0.8.0 - Sat, 04 Oct 2014 05:39:02 GMT
--------------------------------------

- [d2aa7cb](../../commit/d2aa7cb) [added] `<Routes location="none">`
- [637c0ac](../../commit/637c0ac) [added] `<Routes fixedPath>`
- [f2bf4bd](../../commit/f2bf4bd) [removed] RouteStore
- [f2bf4bd](../../commit/f2bf4bd) [added] Router.PathState for keeping track of the current URL path
- [f2bf4bd](../../commit/f2bf4bd) [added] Router.RouteLookup for looking up routes
- [f2bf4bd](../../commit/f2bf4bd) [added] Router.Transitions for transitioning to other routes
- [f2bf4bd](../../commit/f2bf4bd) [added] Pluggable scroll behaviors
- [f2bf4bd](../../commit/f2bf4bd) [changed] `<Routes preserveScrollPosition>` => `<Routes scrollBehavior>`
- [f2bf4bd](../../commit/f2bf4bd) [removed] `<Route preserveScrollPosition>`
- [f2bf4bd](../../commit/f2bf4bd) [removed] Router.transitionTo, Router.replaceWith, Router.goBack
- [97dbf2d](../../commit/97dbf2d) [added] transition.wait(promise)
- [3787179](../../commit/3787179) [changed] Transition retry now uses replaceWith.
- [e0b708f](../../commit/e0b708f) [added] Ability to transitionTo absolute URLs
- [c1493b5](../../commit/c1493b5) [changed] #259 support dots in named params
- [a4ce7c8](../../commit/a4ce7c8) [changed] isActive is an instance method
- [a4ce7c8](../../commit/a4ce7c8) [removed] `<Routes onActiveStateChange>`

v0.7.0 - Tue, 02 Sep 2014 16:42:28 GMT
--------------------------------------

- [3796371](../../commit/3796371) [changed] Use Browserify to run specs
- [0e649be](../../commit/0e649be) [changed] Use Browserify to build examples
- [bb7b666](../../commit/bb7b666) [removed] .js files from repo root
- [96122dd](../../commit/96122dd) [fixed] undefined Buffer in query strings


v0.6.1 - Sun, 31 Aug 2014 03:21:20 GMT
--------------------------------------

- [7536d96](../../commit/7536d96) [fixed] warning on links w/o params


v0.6.0 - Fri, 29 Aug 2014 20:58:36 GMT
--------------------------------------

- [2a75f3e](../../commit/2a75f3e) [added] query argument to willTransitionTo
- [b7e21bb](../../commit/b7e21bb) [fixed] Window scrolling
- [5864531](../../commit/5864531) [changed] Default `<Redirect from>` to *
- [1064881](../../commit/1064881) [changed] paths to inherit parents
- [79caf99](../../commit/79caf99) [added] `<DefaultRoute name>`
- [25adcab](../../commit/25adcab) [fixed] Using HashLocation without a preceeding /
- [a63c940](../../commit/a63c940) [added] `<NotFoundRoute>`
- [d5bd656](../../commit/d5bd656) [changed] path matching algorithm
- [6526e70](../../commit/6526e70) [removed] location="disabled"
- [8d2f3ed](../../commit/8d2f3ed) [changed] `<Link/>`s to take params property
- [2a85b74](../../commit/2a85b74) [changed] handler keys to be optional


v0.5.3 - Tue, 26 Aug 2014 03:36:42 GMT
--------------------------------------

- [273625a](../../commit/273625a) [fixed] Active state on `<Link>`s with key prop
- [283d3f6](../../commit/283d3f6) [added] RouteStore#registerChildren
- [a030648](../../commit/a030648) [changed] Relaxed MemoryStore invariant
- [e028768](../../commit/e028768) [added] `<DefaultRoute>` component
- [6878120](../../commit/6878120) [added] onAbortedTransition, onActiveStateChange, onTransitionError Routes props
- [58073ca](../../commit/58073ca) [changed] Transition#cancelReason => abortReason
- [6d1ae95](../../commit/6d1ae95) [fixed] sibling array route configs
- [0e7a182](../../commit/0e7a182) [added] pluggable history implementations closes #166
- [ca96f86](../../commit/ca96f86) [fixed] typo in Link
- [f3dc513](../../commit/f3dc513) [added] onClick handler to `<Link />`
- [b9f92f9](../../commit/b9f92f9) [changed] updated rf-changelog


v0.5.2 - Thu, 07 Aug 2014 18:25:47 GMT
--------------------------------------

- [21f4f57](../../commit/21f4f57) [added] preserveScrollPosition Route/Routes props
- [f3b4de8](../../commit/f3b4de8) [added] support for extra props in Links, fixes #170
- [829a9ec](../../commit/829a9ec) [added] `<Redirect/>` component
- [0a49665](../../commit/0a49665) [added] Router.makeHref
- [2100b8c](../../commit/2100b8c) [changed] handlers receive route name
- [154afba](../../commit/154afba) [changed] location of public modules


v0.5.1 - Mon, 04 Aug 2014 22:16:38 GMT
--------------------------------------

- [08f5a69](../../commit/08f5a69) [fixed] location="history" fallback
- [87b1c2a](../../commit/87b1c2a) [fixed] Navigation to root URL can fail
- [760f021](../../commit/760f021) [fixed] infinite loop in RouteStore.unregisterRoute
- [5fea685](../../commit/5fea685) [added] Router.AsyncState mixin
- [395a590](../../commit/395a590) [changed] fallback to window.location for history
- [2a3582e](../../commit/2a3582e) [changed] make URLStore.push idempotent
- [4c4f87b](../../commit/4c4f87b) [fixed] alt click on Link should count as modified
- [97c02f1](../../commit/97c02f1) [fixed] middle click on `<Link/>`


v0.5.0 - Sat, 26 Jul 2014 22:38:36 GMT
--------------------------------------

- [5af49d4](../../commit/5af49d4) [changed] Split `<Routes>` component from `<Route>`


v0.4.2 - Sat, 26 Jul 2014 18:23:43 GMT
--------------------------------------

- [2fc9976](../../commit/2fc9976) [fixed] eslint cleanup; trailing comma fix for IE
- [b8018b1](../../commit/b8018b1) [added] animation example


v0.4.1 - Thu, 24 Jul 2014 21:35:07 GMT
--------------------------------------

- [8152d67](../../commit/8152d67) [changed] repo location to rackt/react-router
- [0ac4dea](../../commit/0ac4dea) [removed] Dependency on react/lib/emptyFunction


v0.4.0 - Thu, 24 Jul 2014 19:41:04 GMT
--------------------------------------

- [0be4bf7](../../commit/0be4bf7) [changed] npm registry name to react-router :D


v0.3.5 - Wed, 23 Jul 2014 14:52:30 GMT
--------------------------------------

- [0a7298c](../../commit/0a7298c) [removed] browserify.transforms from package.json
- [ebf54ab](../../commit/ebf54ab) [removed] Dependency on react/lib/merge


v0.3.4 - Tue, 22 Jul 2014 21:02:48 GMT
--------------------------------------

- [2598837](../../commit/2598837) [fixed] bower build
- [8c428ff](../../commit/8c428ff) [fixed] dist min build


v0.3.3 - Tue, 22 Jul 2014 20:46:57 GMT
--------------------------------------

- [92b9077](../../commit/92b9077) [changed] file name of dist builds


v0.3.2 - Tue, 22 Jul 2014 19:47:41 GMT
--------------------------------------

- [3a4732e](../../commit/3a4732e) [changed] global export to ReactRouter


v0.3.1 - Tue, 22 Jul 2014 19:40:14 GMT
--------------------------------------

- [baf2257](../../commit/baf2257) [fixed] dist files


v0.3.0 - Tue, 22 Jul 2014 19:34:11 GMT
--------------------------------------

- [e827870](../../commit/e827870) [added] bower support
- [58e7b98](../../commit/58e7b98) [changed] activeRoute -> activeRouteHandler
- [0177cdd](../../commit/0177cdd) [fixed] Pass the correct component instance to willTransitionFrom hooks
- [3b590e0](../../commit/3b590e0) [changed] Upgrade to React 0.11.0
- [51e1be2](../../commit/51e1be2) [fixed] Use peerDeps
- [a8df2f0](../../commit/a8df2f0) [added] Browser builds for version 0.2.1
- [bb066b8](../../commit/bb066b8) [added] Browser build script
- [baf79b6](../../commit/baf79b6) [fixed] Avoid some warnings
- [8d30552](../../commit/8d30552) [changed] README to make use of activeRoute clearer in JSX.
- [991dede](../../commit/991dede) [changed] activeRoute is a function that returns null when no child routes are active.
- [73570ed](../../commit/73570ed) [changed] activeRoute can render with props and children.
- [8562482](../../commit/8562482) [added] ActiveState mixin
- [616f8bf](../../commit/616f8bf) [changed] Preserve forward slashes in URL params
- [6c74c69](../../commit/6c74c69) [changed] Combine URL helpers into URL module


v0.2.1 - Mon, 14 Jul 2014 17:31:21 GMT
--------------------------------------

- [0f86654](../../commit/0f86654) [fixed] checks for class instead of components
- [a3d6e2a](../../commit/a3d6e2a) [changed] Render empty div before transition hooks
- [f474ab1](../../commit/f474ab1) [changed] '.' is no longer a path delimeter
- [f3dcdd7](../../commit/f3dcdd7) [fixed] injectParams invariant should not throw on values that coerce to false.
- [468bf3b](../../commit/468bf3b) [changed] Deprecate Router interface
- [31d1a6e](../../commit/31d1a6e) [added] renderComponentToString()


v0.2.0 - Tue, 24 Jun 2014 04:59:24 GMT
--------------------------------------

- [468bf3b](../../commit/468bf3b) [changed] Deprecate Router interface
- [31d1a6e](../../commit/31d1a6e) [added] renderComponentToString()


v0.1.0 - Thu, 19 Jun 2014 19:11:38 GMT
--------------------------------------


