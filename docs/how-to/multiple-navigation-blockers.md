---
title: Multiple Navigation Blockers
---

# Multiple Navigation Blockers

[MODES: framework, data]

Use `useBlocker` in each component when independent editors need their own dirty-state checks and confirmation UI. The router asks each applicable blocker in registration order, showing one blocked hook at a time. Every remaining blocker must approve before the navigation resumes.

This works in Data and Framework Mode, including their RSC client routers. RSC blockers belong in client components. Declarative Mode does not support `useBlocker`.

## Give each editor its own confirmation

```tsx
"use client";

import { useState } from "react";
import { Link, useBlocker } from "react-router";

function Editor({ name }: { name: string }) {
  const [text, setText] = useState("");
  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) =>
      text !== "" &&
      currentLocation.pathname !== nextLocation.pathname,
  );

  return (
    <section>
      <label>
        {name}
        <textarea
          value={text}
          onChange={(event) => setText(event.target.value)}
        />
      </label>
      {blocker.state === "blocked" && (
        <div>
          <p>Leave with unsaved changes in {name}?</p>
          <button type="button" onClick={blocker.proceed}>
            Allow leaving
          </button>
          <button type="button" onClick={blocker.reset}>
            Stay here
          </button>
        </div>
      )}
    </section>
  );
}

export default function Editors() {
  return (
    <>
      <Editor name="Profile" />
      <Editor name="Notes" />
      <Link to="/dashboard">Dashboard</Link>
    </>
  );
}
```

If Profile and Notes both block, Profile's `proceed()` approves only Profile for this attempt. Profile returns to `unblocked`, and Notes becomes `blocked`. Notes can approve or cancel the whole attempt. Only the final approving hook becomes `proceeding` when navigation resumes. Use `useNavigation` to display loading after navigation starts.

Approval lasts for the current attempt, including further edits made while another confirmation is pending. An approved hook exposes no pending location or cancellation handle. Do not clear local data merely because `proceed()` was called: another component may still cancel. Retained callbacks from an earlier selection are no-ops.

## Changes while confirmation is pending

- A new navigation request replaces the pending attempt and discards all its approvals. Even a new request to the same URL starts fresh.
- At each handoff, the router evaluates the latest predicates of live, unapproved registrations. A previously clean form that becomes dirty, or a newly mounted blocker, gets a turn before navigation resumes.
- Updating a predicate preserves registration order. A real unmount/remount creates a fresh registration and loses its old approval. Registration order does not promise parent-first or child-first route ordering.
- If the selected, mounted editor becomes clean, explicitly call its `proceed()` to continue or `reset()` to stay. A predicate changing to `false` does not decide that for you.
- An unmounted blocker stops applying. Removing the selected blocker advances to the remaining blockers and can resume navigation if none blocks. Removing an already approved blocker leaves another component's confirmation pending. Activity content whose effects are disconnected has no active registration; place protection outside Activity if it must remain active while hidden.

A blocked `navigate()` promise settles when confirmation is requested; it does not wait for every approval or for the eventual loader. Fetcher saves and revalidation can continue while blocked. Uninterrupted revalidation preserves consent. An older accepted navigation may still complete while a newer request is blocked; its commit cancels that pending confirmation because the source page changed.

## Browser history and other departures

Back and Forward through router-owned, nonzero history steps use one source restoration and one accepted replay for the entire attempt. Programmatic requests arriving during restoration or an issued replay wait until the browser traversal is reconciled. Rapid repeated native Back/Forward presses, external history entries, and zero-delta history events cannot be reliably blocked.

The hook protects client navigation. It does not intercept fetcher submissions, direct RSC server-function calls, reloads, document navigation, or browser shutdown. Loader/action redirects continue the accepted operation. A direct RSC server-function redirect calls `navigate()` and creates a fresh blockable request; the server function has already run. Independent fetcher or uninterrupted-revalidation redirects cancel paused consent and follow the existing redirect path without another confirmation.

[`unstable_usePrompt`](../api/hooks/usePrompt) uses the same sequential selection and retains its native-dialog limitations. Use [`useBeforeUnload`](../api/hooks/useBeforeUnload) separately for document departures. Applications wanting one consolidated confirmation can continue aggregating their dirty conditions under a single [`useBlocker`](../api/hooks/useBlocker).
