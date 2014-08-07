v0.5.2 - Thu, 07 Aug 2014 18:25:47 GMT
--------------------------------------

- [21f4f57](../../commit/21f4f57) [added] preserveScrollPosition Route/Routes props
- [f3b4de8](../../commit/f3b4de8) [added] support for extra props in Links, fixes #170
- [829a9ec](../../commit/829a9ec) [added] <Redirect/> component
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
- [97c02f1](../../commit/97c02f1) [fixed] middle click on <Link/>


v0.5.0 - Sat, 26 Jul 2014 22:38:36 GMT
--------------------------------------

- [5af49d4](../../commit/5af49d4) [changed] Split <Routes> component from <Route>


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


