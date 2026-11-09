# Sequential navigation blockers

Date: 2026-11-09

Status: proposed implementation; formal adoption remains subject to governance

## Context

Independent editors need to own their dirty-state predicates and confirmation UI. The singleton assumption in [the original useBlocker decision](./0001-use-blocker.md) cannot protect an earlier dirty registration when a later clean registration suppresses it. Existing applications can aggregate conditions into one blocker, but that couples otherwise independent components.

Multiple registrations use the existing `useBlocker` hook by default as an additive minor feature. It applies to client components using Data, Framework, RSC Data, or RSC Framework routers. Each new navigation requires fresh consent, unmounted registrations stop applying, and obsolete callbacks are ignored; these also correct single-blocker lifecycle bugs.

## Contract

One router-owned intent coordinates sequential consent in registration order. Predicates remain synchronous. Each `proceed()` approves only its registration for that intent; the selected `reset()` cancels the entire intent. The existing three-state public union remains: intermediate approving hooks become unblocked, and the final approving hook becomes proceeding. Approvals remain private and cover subsequent edits. Approved hooks have no revocation handle.

At handoff, evaluate current live, unapproved predicates, including newly mounted guards and previously false predicates. Updating a predicate preserves its position. Real remounts have fresh ownership. Removing the selected registration advances through the remaining guards and can resume the intent; removing an approved registration does not cancel another guard's confirmation. Defer removal handoff until effect cleanup/reconnection settles. A selected mounted guard becoming clean still requires an explicit response.

A newer explicit navigation replaces pending consent and discards prior approvals. Guard callbacks capture intent, registration, and selection ownership so stale responses are no-ops. This is distinct from an older accepted navigation's transport ownership: it may still commit while a newer request is blocked, invalidating consent based on the previous source. Uninterrupted revalidation preserves consent.

## History ownership

Keep consent, accepted data navigation, and issued browser traversal separate. All guards share one POP source restoration and one accepted replay. Once a `history.go()` is issued, its physical event must be observed even if logical consent is superseded. A superseding programmatic request during replay restores the committed source before writing history. Ready older commits are serialized before queued requests normalize against that source. Accepting replay invalidates older transport work before dispatch.

Unknown external history and rapid native traversal cannot be reliably correlated: browser history exposes no operation identifier. The coordinator never issues `go(0)` as compensation. Custom discovery cancellation uses the same traversal serialization.

## Boundaries

This feature adds no reason metadata, waiting state, async predicate, priority, global bypass, or cross-router coordination API. Direct server-function calls and fetcher work are not guarded mutations. Native unload protection remains independent. The user-facing contract is documented in [the multiple blockers guide](../docs/how-to/multiple-navigation-blockers.md).
