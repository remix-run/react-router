---
title: Application-Controlled Route Discovery
unstable: true
---

# Application-Controlled Route Discovery

Date: 2026-10-09

Status: accepted for the opt-in implementation in [PR #15602](https://github.com/remix-run/react-router/pull/15602)

[MODES: framework]

<docs-warning>This records the implementation decisions for an unstable API. It does not establish a stable public contract or a decision to enable the feature by default.</docs-warning>

## Context

Lazy route discovery reduces the route metadata in the initial document, but an
incomplete client route tree can require additional manifest requests during
navigation and fetcher operations. Eager discovery often hides this work for
rendered links and forms; programmatic destinations and new parameter values can
still require a request. A parameter or splat match is not sufficient evidence
that discovery is unnecessary: an undiscovered static route may rank above it.

A client running build A can reach a build B server during a rolling deployment.
The manifest endpoint reports a version mismatch instead of supplying route
metadata from an incompatible build. Existing recovery may reload the document.
This can discard unsaved state, and a reload can reach another A server rather
than resolving the mismatch. After recovery is declined or exhausted, continuing
to match against the unchanged partial tree can select the wrong route.

[RFC #15590](https://github.com/remix-run/react-router/discussions/15590) proposes
giving applications control over this tradeoff. Its earlier configuration-mode
proposal was superseded by a hook: applications should choose when to complete
discovery, how to protect local state, and whether to reload. This record captures
the decisions made while implementing and reviewing that hook, including changes
from the original proposal and intermediate implementations.

Two meanings of “recovery” arose during implementation. **Mismatch recovery**
means completing the running client's route tree or invoking document reload
behavior. **Retained-page revalidation** means starting another loader pass after
canceling a navigation. We support the former and explicitly decided against
automatically doing the latter.

## Decision

### 1. Expose application policy through an unstable Framework Mode hook

Expose `unstable_useRouteDiscovery` with:

```tsx
let { version, state, loadAllRoutes, discoverRoutes } =
  unstable_useRouteDiscovery({
    onBeforeDiscovery: async (event) => {
      // Optionally complete the tree before an incremental request.
    },
    onManifestMismatch: async (event) => {
      // Choose recovery or allow the affected operation to be canceled.
    },
  });
```

`version` identifies the running client build. `state` is `"partial"`,
`"loading"`, or `"complete"`; it describes full-manifest availability, not whether
every requested pathname has already been discovered. Selective discovery does
not transition the runtime to complete.

Both callbacks are awaited. They receive the operation's `source` (`"eager"`,
`"navigation"`, `"fetcher"`, or `"imperative"`), the client `version`,
`loadAllRoutes()`, and `stopPropagation()`. The mismatch callback additionally
receives `reloadUrl` and `defaultBehavior()`.

The hook supports conventional Framework Mode. When initial discovery mode, SPA
Mode, or development already provides the full manifest, it reports `complete`
and discovery operations are successful no-ops. Server rendering has no client
runtime and exposes inert operations. Declarative Mode, Data Mode, and both RSC
modes are outside the public API's scope.

This keeps policy in application code instead of adding configuration modes for
each trigger, such as first discovery, first navigation/fetcher demand, or first
version mismatch. Applications can express those policies with callbacks or call
the imperative operations after authentication, before a workflow, or at an
application-chosen idle point. No timing policy is built into the hook.

### 2. Select the complete implementation with a static future flag

Require the following configuration, defaulting to `false`:

```ts
export default {
  future: { unstable_customRouteDiscovery: true },
};
```

An unstable export alone does not protect applications that never call it. The
initial integration changed eager-discovery timing, subscriptions, and router
cancellation behavior for all applications. We rejected that scope of change.

The flag chooses both eager discovery and navigation/fetcher discovery at router
creation. Flag-off applications keep the existing `useFogOFWarDiscovery` and
patch-on-navigation implementation. `fog-of-war.ts` remains unchanged by this
feature. New core cancellation and fetcher-ownership behavior is gated by the
same flag. Calling the public hook without the flag produces a usage error.

`HydratedRouter` intentionally calls either `useFogOFWarDiscovery` or
`useCustomRouteDiscovery` conditionally. This is a documented exception to the
rules of hooks: the flag and runtime are fixed for the router's lifetime, so the
selected hook sequence never changes on rerender. A separate discovery sibling
component would require corresponding server-rendered structure to preserve
hydration, including `useId` behavior. We removed that indirection and its server
placeholder.

This is a behavioral isolation boundary, not a bundle-exclusion guarantee. A
runtime flag does not ensure that a bundler removes the other implementation.
Build-time selection or equivalent tree-shaking work is deferred.

### 3. Give the hydrated router one discovery runtime

Create one `RouteDiscoveryRuntime` during hydrated-router setup, before router
initialization, store it on `ssrInfo`, and pass it to discovery helpers and hook
consumers through Framework context. It owns the discovery caches, handler
registrations, full-manifest load, and pending custom mismatch handling.

We removed the `WeakMap<AssetsManifest, RouteDiscoveryRuntime>` registry and
lookup helper. Conventional hydrated Framework Mode already has one router and
running manifest. Full loading preserves the manifest's identity, so it does not
require a replacement runtime. A registry added another ownership mechanism
without a supported application use case.

Multiple hook consumers share this runtime. They do not create additional DOM
observers or independent full-manifest loads.

The runtime also receives the hydrated router's initialized custom fetch
implementation, configured API server origin, and API-only mode setting. This
preserves those Framework features when the custom-discovery flag is enabled:
incremental requests use `unstable_fetch` with manifest context, while both
incrementally discovered and fully loaded routes retain API-only server-handler
behavior. The full versioned manifest remains a static asset import outside
custom fetch.

### 4. Keep React state compatible with concurrent rendering

The runtime exposes directly readable `state` and `ready` fields plus a simple
subscription. It does not retain external-store-style immutable snapshots or a
`getSnapshot()` API.

The React subscription lives with the hydrated router and updates React state
inside `React.startTransition`. Framework context distributes that one committed
value to hook consumers. The subscription also checks for changes between render
and subscription, so late-mounting consumers and hydration do not miss completion.

We replaced `useSyncExternalStore` after a regression demonstrated that its
synchronous updates could force already-visible content into a Suspense fallback,
even when the full-load operation was initiated inside a transition. The runtime
still changes immediately for discovery correctness; React can schedule the UI
update as a transition.

The subscription itself remains necessary for two purposes: updating the shared
React state and starting or disconnecting the eager-discovery observer. Observer
updates read the runtime directly and do not force a synchronous React render.

### 5. Wait for the initialized route tree before eager discovery

Mark discovery ready after the initialized route tree commits. This allows a
root application handler to register before the first eager request. Readiness
does not mean every suspended descendant has mounted or that startup work is
finished; it is not an idle-time guarantee.

Keep default recovery available before application hooks can mount. Discovery
needed during initialization must not wait indefinitely for handler registration.

The opt-in eager observer retains the existing link/form discovery model,
debouncing, and `saveData` behavior. Completion clears queued paths and disconnects
the observer. Applications can use `discover="none"` to defer discovery of a
specific navigation until interaction.

### 6. Custom callbacks replace defaults; explicit delegation restores them

Use the same internal registration machinery for the built-in policy and public
hook callbacks. The built-in registration has explicit default priority instead
of depending on React effect ordering. The public hook itself needs Framework
context, so the internal driver shares the registration helper rather than
calling that public wrapper before its provider exists.

Choose handlers separately for each callback:

- With no custom handler for that callback, run its default implementation.
- With custom handlers, run only those handlers.
- A no-argument hook consumer does not override anything.
- Registering only `onBeforeDiscovery` leaves default mismatch recovery active.
- Removing the last custom mismatch handler restores default recovery.

There is no automatic default action after custom handlers, and no
`preventDefault()` API. Merely registering a mismatch handler takes ownership of
recovery, including the choice to keep the current screen. Logging-only handlers
must delegate if they want the usual reload behavior.

`event.defaultBehavior()` explicitly invokes the existing source-specific policy:

| Source     | `reloadUrl`            | Default mismatch behavior                    |
| ---------- | ---------------------- | -------------------------------------------- |
| Eager      | `null`                 | Warn without reloading the current document  |
| Navigation | Navigation destination | Reload the destination                       |
| Fetcher    | Current document URL   | Reload the current document                  |
| Imperative | `null`                 | Return the mismatch result without reloading |

Existing reload-loop protection still applies. Delegation is not a promise that
every mismatch can be resolved by another reload. Repeated calls on the same
event share one promise, and delegation does not invoke other custom handlers or
stop their propagation.

This supports conditional intervention without unregistering the hook:

```tsx
unstable_useRouteDiscovery({
  async onManifestMismatch(event) {
    event.stopPropagation();
    if (hasUnsavedChanges) {
      setShowReloadDialog(true);
      return;
    }
    await event.defaultBehavior();
  },
});
```

It also allows an application to try `event.loadAllRoutes()` and call
`event.defaultBehavior()` in its catch block. Alternatively, the application can
conditionally supply a handler only while it needs an override.

### 7. Compose committed handlers using registration identity

Custom handlers run in reverse registration order, with each awaited before the
next. `stopPropagation()` prevents earlier custom handlers from running. It does
not complete the route tree, cancel an operation by itself, or act as a separate
default-prevention mechanism.

A later-mounted editor can intercept an earlier application's recovery handler
while protecting a draft. Unmounting the editor reveals the earlier policy.
This ordering is registration order, not a promise that the deepest route or
component always runs first.

Each hook instance holds one stable registration object in a ref. A layout effect
updates its callbacks after commit. Rerenders use the newest committed callbacks
without adding duplicates or moving the registration's priority. Abandoned renders
do not change active handlers. We compare registration identity for membership
and cleanup, not callback function identity; consumers do not need `useCallback`
to maintain priority. Removing all callbacks unregisters that instance; adding
handlers again creates a new registration position.

### 8. Load the running build's complete metadata, preserving identity

`loadAllRoutes()` dynamically imports the running client's versioned
`manifest.url`, validates that the loaded version matches, patches missing routes
into the router, and merges route metadata into the existing manifest. It does
not switch the client to the server's current deployment. It does not download
route modules or execute route loaders/actions as part of discovery.

The emitted asset assigns to `window.__reactRouterManifest`. The runtime captures
that value and restores the running manifest object, preserving references and
its SRI map. Merely replacing the global would not update the existing router.
The captured full manifest is retained because module evaluation is cached: a
retry after a version-validation failure must inspect the same loaded asset,
rather than accidentally accepting the restored partial global as a full load.

Concurrent calls share one promise. State moves from `partial` to `loading` to
`complete`; failures return to `partial` and reject. Calls after completion are
successful no-ops. Completion stops further incremental requests, and a
completed full tree takes precedence over incremental responses still in flight,
including mismatch responses.

Applications choosing this strategy must retain versioned manifests and their
referenced assets and keep server routing and loader/action contracts compatible
with supported clients. An A client can still execute B's server code. A version
mismatch establishes difference, not which deployment is newer. Completing A's
tree is not a general solution to incompatible deployments.

### 9. Keep selective discovery bounded and independent of hook location

`discoverRoutes(paths, { signal })` accepts application-root paths such as
`/checkout`, applies the configured basename, and ignores query strings and
hashes. It rejects relative paths and external URLs. Resolution does not depend
on which route called the hook.

Normalize and deduplicate discovery work using the existing path/ancestor model
and cache successful discoveries. Split imperative requests into batches within
the existing manifest URL limit. A single pathname that cannot fit produces a
warning and is skipped, while discoverable paths proceed. Do not mark omitted
paths as discovered or silently load the complete manifest instead.

Skipping work because a combined request is too large must not suppress future
on-demand discovery. However, a single pathname that exceeds the limit by itself
also exceeds the existing navigation/fetcher constraint; this implementation does
not invent a separate transport for that case. We explicitly accepted that limit.

The promise resolves to `{ type: "success" }`, `{ type: "version-mismatch" }`, or
`{ type: "aborted" }`. Success means the discovery operation completed, not that
every input matches a route or that an oversized omitted path was discovered.
Network, response, and unrelated application-handler failures reject. Discovery
does not navigate, execute data handlers, or prefetch route modules/styles.

### 10. Treat full-manifest failures differently from application errors

Consumers must be able to catch `loadAllRoutes()` failures and decide whether to
retry, retain the page, or hard reload. A full-manifest failure must not render a
route error boundary merely because an application awaited it in a callback.

If the promise offered on the event rejects out of a handler, stop the remaining
handler chain and report through `HydratedRouter`'s `onError`, or `console.error`
when no reporter is present. Before discovery, permit incremental discovery to
proceed. During mismatch handling, cancel affected operations if the tree remains
incomplete. If the application catches the failure itself, it owns the response.

Unrelated errors thrown by handlers retain normal discovery error semantics:
navigation/fetcher error handling, eager error reporting, or rejection of the
imperative call. We do not broadly swallow handler failures. In particular,
failing recovery must never authorize matching or submission against an unchanged
partial tree.

### 11. Share custom recovery while preserving each operation's ownership

Concurrent mismatches share one pending custom handler chain, so an application
can present one decision or perform one full load. The shared event's `source`
and `reloadUrl` describe the initiating request. Each participating operation
retains its own destination and abort signal; after handling finishes, surviving
operations proceed only if the tree is complete.

An aborted or superseded caller stops waiting promptly without canceling a shared
full load or handler chain needed by other callers. Rejections remain observed
even if all waiters leave. A later mismatch can start a new chain after the
previous one settles.

Without custom mismatch handlers, default handling remains per operation. Sharing
an eager warning with a simultaneous navigation could otherwise suppress that
navigation's required document reload. This distinction was caught and covered
during implementation review.

Router callers check their abort state after discovery before executing handlers
or modifying pending state. Under the flag, fetcher controllers are registered
before discovery, so reusing a fetcher key can supersede the previous request
before it posts. A stale operation must not cancel or clean up its replacement.
Action-related interruption of active loads is deferred until discovery succeeds,
so a canceled submission does not unnecessarily interrupt independent work.

### 12. Make cancellation a terminal path that preserves the committed screen

Returning normally from `patchRoutesOnNavigation` tells the router to continue
matching. Throwing an ordinary error invokes error handling. Neither expresses
“the application declined recovery; keep the current screen.”

Use an internal `DiscoveryCancelledError` signal, recognized by the opt-in router
path, to distinguish cancellation from failure. A mismatch that settles with an
incomplete tree uses this path. For an imperative caller, the equivalent outcome
is the `version-mismatch` result.

`cancelDiscoveryNavigation` is a second terminal path alongside
`completeNavigation`: completion commits a destination and its data; cancellation
preserves the committed location, matches, and data and settles pending state.
The shape could inform a more general cancellation facility, but this change
does not expose a public API for canceling arbitrary phases of navigation.

A canceled operation does not execute the destination's action/loaders against a
partial fallback match. Later completion does not replay canceled navigations or
submissions. An application can instead await a user decision inside its mismatch
handler and complete discovery before returning, allowing surviving pending
operations to continue. If the handler already returned and canceled the work,
the user or application must initiate a new operation.

### 13. Cancel pending revalidation too; do not run replacement loaders

Cancel pending navigation and its pending revalidation together. Both settle to
idle, the pending `revalidate()` promise resolves, and displayed data remains in
place. Cancellation is a settled outcome, not a guarantee that a refresh ran.

The concrete accepted tradeoff is:

1. The user is on `/a` with loader data and possibly unsaved local state.
2. A submission to `/a` changes server data and redirects to undiscovered `/b`.
3. `/b` discovery reports a mismatch and the custom handler declines recovery.
4. The user remains on `/a` with its existing, potentially stale loader data.
5. A later explicit revalidation or navigation can refresh it.

The mutation already happened and is not rolled back. Cancellation starts no
replacement loader pass on `/a` and does not replay the submission to `/b`.

An intermediate fix revalidated the retained page and restarted interrupted
fetchers. We rejected it after discussing whether revalidation would “latch onto”
the navigation. Revalidation can restart a pending loading navigation; it does
not simply reuse its loader promises. Once discovery cancels that navigation,
refreshing `/a` would require a separate operation, with additional redirect-loop
and recovery-state handling. Uniform cancellation is simpler and gives the
application control over when retained data should refresh.

Cancellation must still clean up fetchers. Settle fetchers waiting for canceled
redirects and loading fetchers whose request has ended or been interrupted,
preserving their existing data. Leave independently active fetcher requests
running. Clear canceled-load restart bookkeeping so a later navigation does not
replay work canceled by this decision. Pending blockers must also become usable
again rather than remaining in a proceeding state.

Adversarial review identified stuck redirecting/interrupted fetchers and the
ambiguous pending-revalidation behavior. Regressions were first reproduced, then
updated to prove this agreed cancellation contract rather than an automatic
retained-page refresh. The review also identified a preset expectation missing
the new flag's `false` default; both supported preset fixtures were updated.

### 14. Restore router-managed POP history within a bounded scope

PUSH/REPLACE navigation can be canceled before committing a new history entry.
A browser Back/Forward traversal has already moved the browser's history position
before discovery finishes. Cancellation must compensate for that movement to keep
the address bar aligned with the retained screen.

Use the same compensating POP approach as navigation blockers for router-managed
history entries. Wait for restoration before declaring cancellation finished,
and queue new navigation/revalidation work until history and pending state are
restored. Otherwise a newly started navigation could race the restoration.

This is not limited to leaving the app. For example, after `/a → /b` and a hard
reload on `/b`, the new partial manifest may not include `/a`; Back can therefore
need discovery. With `/a → /b → external site`, two Back presses can reach the
same situation if returning to `/b` creates a fresh document. A browser back/forward
cache restoration may instead retain the earlier runtime and discovered routes.
The need for discovery depends on available metadata, not simply on the presence
of an external history entry.

Support one pending compensating restoration. Native history events do not
identify which traversal caused a POP, so additional Back/Forward presses during
restoration retain the existing blocker's limitations. They may leave the URL
and rendered route out of sync or traverse to another entry. We reproduced this
in Chromium and accepted documenting the limitation instead of adding repeated
corrective traversals or a general browser-history arbitration system. Preservation
of the current screen is not guaranteed in that overlap case.

## Alternatives considered

| Alternative                                                                                     | Reason not selected                                                                                                                                                        |
| ----------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Add several hybrid `routeDiscovery.mode` values                                                 | A hook expresses those policies and application-specific timing without expanding the configuration vocabulary for each strategy.                                          |
| Modify the existing fog-of-war implementation for every app                                     | An unused unstable hook would still change timing and concurrency behavior; the static future flag gives existing apps a compatibility boundary.                           |
| Always run defaults after custom callbacks, with `preventDefault()`                             | Custom registration should transfer recovery ownership. Explicit `defaultBehavior()` is sufficient for logging, conditional intervention, and fallback reloads.            |
| Make defaults the last ordinary handler                                                         | Priority would depend on registration/effect ordering and mix default suppression with custom propagation. Defaults instead have an explicit fallback role.                |
| Maintain a manifest-to-runtime registry                                                         | Hydrated-router ownership already provides the required single runtime.                                                                                                    |
| Use `useSyncExternalStore` and immutable discovery snapshots                                    | Synchronous React updates could replace visible UI with a Suspense fallback. Direct runtime fields plus a shared transition-aware React state value meet the actual needs. |
| Add a discovery sibling component and server placeholder                                        | The static flag makes conditional internal hooks sufficient without changing the rendered tree structure.                                                                  |
| Reject an entire selective request for one oversized pathname, or load everything automatically | Warn and discover what fits; do not unexpectedly change selective discovery's download cost or global completion state.                                                    |
| Continue with a partial match after mismatch handling returns                                   | It can choose a lower-ranked parameter/splat route or execute the wrong action. Cancellation is distinct from successful discovery.                                        |
| Automatically revalidate the retained page after cancellation                                   | It creates another loader operation and additional recovery/redirect handling. We deliberately accept stale retained data and cancel navigation/revalidation uniformly.    |
| Generalize cancellation and overlapping native history restoration now                          | Supporting arbitrary navigation phases or browser traversals expands the scope beyond discovery checkpoints.                                                               |

## Consequences

Applications can preserve unsaved state, choose document reloads, selectively
prepare routes, or finish discovery at their own chosen time. Full completion
removes subsequent manifest discovery requests while leaving module loading lazy.
These are policy choices, not a claim that full loading is faster for every app.

The opt-in path duplicates some existing eager-discovery and patching logic. That
is intentional during evaluation: compatibility with flag-off applications takes
priority over sharing every helper. Any future consolidation should preserve the
tested boundary and accompany an explicit stabilization decision.

The application accepts responsibility for retained assets and server compatibility,
for retrying canceled work when appropriate, and for refreshing data that may be
stale after cancellation. A custom mismatch handler that only logs and returns
will suppress the default reload and cancel affected navigation/fetcher work.

### Deferred work and cost discussion

We explicitly deferred performance tests and excluded performance claims from
the acceptance criteria. Early implementation discussion estimated roughly
3–5 KB gzipped for the feature, against a measured minimal baseline of about
100–105 KB gzipped of client JavaScript including React and ReactDOM. Those were
planning figures from an earlier implementation and fixture, not a final
flag-on/flag-off bundle comparison or a size guarantee. They should not be used
as a claim about every Framework Mode application.

Tree shaking for flag-off bundles remains deferred. Other non-goals are RSC
support, a general public navigation-cancellation API, arbitrary overlapping
browser traversal recovery, deployment polling or a `checkStaleness` API,
automatic replay of canceled submissions, and a new transport for individually
oversized pathnames.

Related discussion about discovering prefixes/route groups, caching dynamic
namespaces, and rewriting asset URLs at runtime remains separate. The final API
does not promise namespace completeness or add a manifest-transform callback.

### Validation and local testing

The implementation has focused coverage for runtime behavior, React commit and
Suspense behavior, cancellation ownership, and browser history. Compatibility
coverage exercises the existing fog-of-war scenarios with the future flag both
off and on. In particular, the tests protect:

- Shared full loads, version validation, cached asset retries, manifest identity,
  retained/missing assets, and completion during an incremental request.
- Path normalization, batching, skipped oversized paths, cache behavior, and
  imperative result/error semantics.
- Committed callback replacement, registration priority, cleanup, default
  delegation, early hydration, and late-mounting consumers.
- Navigation/fetcher cancellation, submissions that must never execute or replay,
  superseded-operation ownership, blocker cleanup, POP restoration, and subsequent
  navigation.
- Pending revalidation settling without replacement loaders, redirecting or
  interrupted fetchers becoming idle, and independent fetchers continuing.

For manual testing, `playground/route-discovery` uses one production build and a
cookie-controlled Express middleware that returns a synthetic manifest mismatch.
The real versioned manifest asset remains available for `loadAllRoutes()`. The
playground provides cancel/full-load/default choices, a delay for pending-state
tests, and an `/a` mutation redirecting to undiscovered `/b` to expose stale data.
Simulation changes need no new deployment or rebuild. A document reset starts
with a fresh partial manifest; development/HMR supplies a full manifest and
therefore does not exercise these discovery paths.

This validates client mechanics without pretending to model incompatible
server contracts across actual deployments.

### Implementation references

- [Route discovery guide](../docs/how-to/route-discovery.md)
- [Runtime, public hook, and custom eager driver](../packages/react-router/lib/dom/ssr/route-discovery.ts)
- [Hydrated-router ownership and static hook selection](../packages/react-router/lib/dom-export/hydrated-router.tsx)
- [Router cancellation and operation ownership](../packages/react-router/lib/router/router.ts)
- [Runtime unit tests](../packages/react-router/__tests__/dom/ssr/route-discovery-test.ts)
- [React state and registration tests](../packages/react-router/__tests__/dom/ssr/route-discovery-react-test.tsx)
- [Cancellation regression tests](../packages/react-router/__tests__/router/discovery-cancellation-test.ts)
- [Framework browser tests](../integration/route-discovery-test.ts)
- [Legacy discovery compatibility tests](../integration/fog-of-war-test.ts)
- [Manual playground instructions](../playground/route-discovery/README.md)
