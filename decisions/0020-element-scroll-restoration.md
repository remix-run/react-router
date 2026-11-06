---
title: Element Scroll Restoration
unstable: true
---

# Element Scroll Restoration

Date: 2026-10-26

Status: accepted for the unstable implementation; pending implementation review

[MODES: framework, data]

<docs-warning>This records an unstable implementation. The API may change or be removed without a major release and does not establish a stable public contract.</docs-warning>

## Context

`<ScrollRestoration>` restores the window's scroll position. Applications also
use independently scrolling elements, such as a sidebar beside a main content
pane. Restoring only window scroll does not restore those views, and replacing
window with a single element does not support layouts with several containers.

[RFC #9495](https://github.com/remix-run/react-router/discussions/9495) and the
proofs of concept in [#9573](https://github.com/remix-run/react-router/pull/9573)
and [#10468](https://github.com/remix-run/react-router/pull/10468) explored this
capability. Maintainer feedback calls for
[multiple simultaneous containers](https://github.com/remix-run/react-router/pull/10468#issuecomment-1574227587)
and [capture through the router lifecycle](https://github.com/remix-run/react-router/pull/10468#issuecomment-1578935980).
An effect that watches navigation enter a loading state misses navigations that
complete synchronously without loaders.

The design must also account for two different lifetimes. Container registration
should follow the component that owns the container, while restoration on a full
page load should happen before React hydrates, as window restoration does today.
The API needs a container identity that works in both phases.

## Decision

### 1. Register containers with a selector-only hook

Introduce an additive unstable API:

```ts
declare function unstable_useElementScrollRestoration(selector: string): void;
```

```tsx
import { unstable_useElementScrollRestoration } from "react-router";

function Sidebar() {
  unstable_useElementScrollRestoration("#sidebar");

  return (
    <aside id="sidebar" style={{ overflow: "auto", height: "100vh" }}>
      {/* Sidebar content */}
    </aside>
  );
}
```

The hook manages registration and cleanup with its component. Applications mount
it with the container and supply the usual CSS that makes the element scrollable.
Several hooks can register independent containers alongside window restoration.
Unmounting one must not disable the others or erase historical positions needed
when its container returns.

The hook accepts a CSS selector such as `#sidebar` or `[data-sidebar]` and returns
nothing. It requires no options object, returned props to spread, React ref,
extra DOM marker, or new application provider.

### 2. Use serializable identity to restore before hydration

Persist each selector alongside its saved position. Extend the existing root
`<ScrollRestoration>` inline script to resolve saved selectors against the server
HTML and restore matching elements before hydration. The script must follow its
target containers in the document and can act only on markup available when it
runs. Hook calls do not need to be collected during server rendering.

A React DOM ref is populated when React commits the container. The early script
cannot use that ref before hydration. A ref-only API would therefore delay
restoration until React mounts, potentially producing a visible scroll jump.

Refs are viable for client-only restoration. Supporting them with early SSR
restoration would still require a separate stable identifier or DOM marker. The
selector supplies both persisted identity and DOM lookup in one argument, which
is why it is the initial API.

### 3. Share root configuration while allowing standalone hooks

When `<ScrollRestoration>` is present, all element hooks share its `getKey` and
`storageKey`, including existing basename handling. There are no per-hook key or
storage overrides in the first version.

Without the root component, hooks use `location.key` and the default storage
namespace. This supports standalone hooks in Data Mode and Framework Mode with
`ssr: false`. These hooks manage registered elements; the existing component
continues to own window restoration and `history.scrollRestoration` policy.

Framework Mode with SSR requires the root component for its early restoration
script. Client hooks take over registration after hydration. The intended scope
also includes RSC Data and RSC Framework through client components and their
shared router runtime; those paths require mode-specific verification before
support is claimed. Declarative Mode is outside this API's scope.

The root component commonly follows the containers in JSX. Registration and
configuration must be coordinated after commit so hooks use the root's custom key
on their first restoration attempt. They must not restore with defaults and then
repeat with root configuration. Avoid mutating registration state during render.

### 4. Capture positions through the router and preserve navigation policy

Capture outgoing positions where the router already saves scroll before a
navigation, including synchronous navigations. Restore from the destination
snapshot associated with React's committed location. A later mutable router
state or a loading-state effect is insufficient for these guarantees. Each hook
retains its own committed source location, since different Suspense boundaries
can retain different screens while the router advances. Cleanup captures the
actual departing node before removal, rather than querying a replacement node.

Registered elements follow the existing restoration policy: honor suppression
for applicable submissions and revalidations, restore a saved position when
available, handle a fragment destination, honor `preventScrollReset`, and otherwise
reset to the top. This applies to all registered containers, including sidebars;
their position is not implicitly preserved merely because their component remains
mounted.

Nested containers require coordinated fragment handling. Saved offsets retain
priority, and scrolling one container must not undo saved positions in another
container or window. Standalone element handling must not scroll window as a side
effect. Exact DOM mechanics remain an implementation concern to prove in browser
tests.

### 5. Restore once, without waiting for content growth

Attempt restoration once for each committed navigation or newly mounted
container, subject to the suppression policy above. An early SSR restoration
counts as that element's initial attempt. Hydration must recognize it and leave
the resulting position alone, including any user scroll between the script and
hydration.

If the browser clamps a saved position because the content is too short, that
still counts as the attempt. Images loading, streamed or deferred content,
virtualizer updates, rerenders, and StrictMode effect replay must not trigger
another restoration. Do not add observers, polling, timeouts, or repeated
correction as content grows.

A missing target is skipped without overwriting its saved position. If the hook
stays mounted while an element appears later, there is no automatic retry. A new
container mount may make its own one-time attempt. Applications must coordinate
the hook's lifetime with the container and provide the content available for the
desired restoration.

### 6. Keep the initial implementation additive

Retain existing window behavior, its numeric restoration state, and its persisted
storage format. Introduce separate element state rather than changing scalar
window positions into a union of window and element data. Applications that do
not use the hook must retain their existing behavior.

An unstable export is sufficient only while the implementation preserves that
boundary. No breaking future flag or deprecation is planned. If implementation
requires changing behavior for existing applications, revisit isolation before
shipping. Package the feature with an unstable change file.

## Implementation details

The unstable implementation uses the following internal choices:

- Use `document.querySelector` semantics and document that selectors should
  identify one stable, unique container. Duplicate registrations of the same
  selector share ownership; different selectors for one node are unsupported.
- Persist both axes as `{ x, y }`, preserving zero and fractional offsets. Use a
  versioned element payload under a separate namespace derived from `storageKey`.
  The exact suffix and schema are internal details.
- Keep active registrations and element caches scoped to a router. Preserve
  inactive selectors' historical entries and persist on page exit, including
  when only standalone hooks are mounted.
- Isolate invalid selectors, malformed entries, and storage failures. Never use
  window as a fallback for a missing element or fabricate a zero measurement.
- Record which actual elements received an early script attempt and consume that
  information during hydration, matching the node, actual history entry,
  restoration key, and storage namespace. A replacement node is distinct from the
  node already restored. The handoff mechanism is not a public API.
- Carry the effective key and storage namespace with each committed position
  snapshot, so a new registration cannot apply an older namespace's values.
- Normalize basename handling once at each boundary. `useLocation()` already
  returns an application-relative pathname for SSR and page-exit key calculation;
  router callbacks receive the full pathname. For basename `/base`, a document
  at `/base/base/page` must pass `/base/page` to `getKey`, not `/page`. This also
  corrects the existing root SSR and page-exit calculation for repeated prefixes.

## Alternatives considered

- **React ref or element getter:** Convenient for client-only restoration, but
  unavailable to the early script without another serializable identity. Defer
  this additional targeting API.
- **Declare every selector on the root component:** Makes SSR configuration
  explicit, but separates container ownership from its component's lifetime.
  Persisted selectors let the early script work with the hook-driven API.
- **Return spreadable props with an SSR marker:** Could bridge early DOM lookup
  and React registration, but adds a DOM convention and consumer wiring that
  persisted selectors already provide.
- **Accept an options object initially:** Would provide room for per-container
  keys or storage, but the first version deliberately shares root configuration.
  A selector argument expresses the currently needed input directly.
- **Retry until content is tall enough:** Could improve some delayed-content
  cases, but adds timing policy and can move the view after the user scrolls.
  The chosen contract makes one attempt with the available layout.

## Consequences

Applications can opt individual containers into restoration where those
containers are rendered, including applications that do not use window
restoration. SSR applications retain early restoration through the existing root
component without waiting for refs or adding marker props.

Selectors become persistent identities. Renaming a selector loses access to its
old saved position, and reusing it for an unrelated container can restore the
wrong content. The early script sees persisted selectors before client hooks
register, so current hook registration is not a prerequisite for its DOM lookup.
Stable selector meaning across routes and reloads is therefore part of the
application's responsibility.

One-time restoration intentionally accepts clamping and incomplete initial
content. It does not guarantee recovery of an exact offset after streamed,
deferred, image-dependent, or virtualized layout becomes available. Per-hook
configuration, ref/getter targets, automatic discovery, shadow-root targeting,
and virtualizer integration remain outside the first version.

Implementation must prove capture on synchronous navigation, independent
container cleanup, root configuration ordering, nested fragment behavior, storage
isolation, and the SSR-to-hydration handoff. Browser tests must withhold hydration,
observe the early position, change scroll, release hydration, and verify no second
restoration or content-growth retry. Window-only regressions and the intended
Data, Framework SSR/SPA, and RSC paths require coverage before release.

[Element Scroll Restoration guide](../docs/how-to/element-scroll-restoration.md)
contains application examples.
