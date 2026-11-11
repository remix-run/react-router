# Sequential navigation blockers

Date: 2026-11-09

Status: proposed implementation; formal adoption remains subject to governance

## Context

Independent editors need to own their dirty-state predicates and confirmation UI. The singleton assumption in [the original useBlocker decision](./0001-use-blocker.md) cannot protect an earlier dirty registration when a later clean registration suppresses it. Existing applications can aggregate conditions into one blocker, but that couples otherwise independent components.

Multiple registrations use the existing `useBlocker` hook by default as an additive minor feature. It applies to client components using Data, Framework, RSC Data, or RSC Framework routers. Each new navigation requires fresh consent, unmounted registrations stop applying, and obsolete callbacks are ignored; these also correct single-blocker lifecycle bugs.

## Contract

Blocking stops the attempted navigation and leaves the user on the current page. The destination is retained only for explicit confirmation; a blocker's lifetime does not keep a navigation running. Multiple hooks coordinate one sequence of confirmations before that destination can be attempted.

Each request snapshots the currently registered keys in registration order and consumes that queue once. Predicates remain synchronous and are evaluated using their current functions when their turns arrive. Checked clean registrations are not revisited. Newly mounted or remounted registrations participate in the next request. Updating a predicate preserves its position; removing an unselected queued registration skips it, even if its key is later reused.

Each `proceed()` advances to the next applicable queued registration. The existing three-state public union remains: intermediate approving hooks become unblocked, and the final approving hook becomes proceeding. Passing a registration consumes its turn, so later edits do not reopen it. Approved hooks have no revocation handle.

The selected `reset()` or selected unmount cancels the entire attempt and discards the remaining queue. Selected unmount does not advance to another blocker or retry navigation. Removing an approved or unselected registration leaves another hook's confirmation alone. Effect cleanup/reconnection cancels the selected attempt immediately; fresh ownership participates in the next explicit request. A selected mounted guard becoming clean still requires an explicit response.

A new explicit navigation replaces the pending attempt with a fresh queue. Callbacks verify attempt and selected registration ownership so obsolete responses are no-ops. An older accepted navigation may still commit while a newer request is blocked, invalidating confirmation based on the previous source. Uninterrupted revalidation preserves the current queue and confirmation.

## Simplification choices

A one-pass queue replaces the private approval set and repeated scans over all live predicates. Because each registration can be selected only once in an attempt, callbacks need no selection generation. Selected removal cancels rather than hands off, eliminating the removal microtask and automatic continuation. Registration removal and cancellation publish one blocker-state update so cleanup cannot overwrite a navigation started by a subscriber.

The broader history ordering and accepted-navigation interruption policy remain unchanged. These guarantees are separate from blocker membership and still apply to an already-issued native traversal.

## History ownership

Keep consent, accepted data navigation, and issued browser traversal separate. All guards share one POP source restoration and one accepted replay. Once a `history.go()` is issued, its physical event must be observed even if logical consent is superseded. A superseding programmatic request during replay restores the committed source before writing history. Ready older commits are serialized before queued requests normalize against that source. Accepting replay invalidates older transport work before dispatch.

Unknown external history and rapid native traversal cannot be reliably correlated: browser history exposes no operation identifier. The coordinator never issues `go(0)` as compensation. Custom discovery cancellation uses the same traversal serialization.

## Boundaries

This feature adds no reason metadata, waiting state, async predicate, priority, global bypass, or cross-router coordination API. Direct server-function calls and fetcher work are not guarded mutations. Native unload protection remains independent. The user-facing contract is documented in [the multiple blockers guide](../docs/how-to/multiple-navigation-blockers.md).
