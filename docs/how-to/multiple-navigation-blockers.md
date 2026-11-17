---
title: Multiple Navigation Blockers
---

# Multiple Navigation Blockers

[MODES: framework, data]

Use `useBlocker` in each component when independent editors need their own dirty-state checks and confirmation UI. Each navigation request snapshots the registered blockers in registration order. The router visits each registration once, showing one blocked hook at a time. Each blocker that returns `true` must approve before navigation can start.

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
- The queue contains the registrations present when the request starts. Each registration is evaluated once, using its latest predicate when its turn arrives. A queued form can become dirty before its turn and still block.
- A registration already checked while clean is not reconsidered during that attempt. Newly mounted or remounted blockers participate in the next navigation request.
- Updating a predicate preserves registration order. Registration order does not promise parent-first or child-first route ordering.
- If the selected, mounted editor becomes clean, explicitly call its `proceed()` to continue or `reset()` to stay. A predicate changing to `false` does not decide that for you.
- Removing the selected blocker cancels the attempt and discards its approvals. It leaves the user on the current page without asking another blocker or navigating automatically. Removing an approved or queued blocker leaves the selected confirmation alone; removed queued registrations are skipped.
- Activity content whose effects are disconnected has no active registration. Disconnecting the selected blocker cancels its attempt; reconnecting registers it for the next request. Place protection outside Activity if it must remain active while hidden.

Blocking stops the attempted navigation; the remembered destination is available for an explicit `proceed()`. The blocker does not keep a navigation running for its lifetime. If saving removes the selected editor, explicitly navigate after the save. To continue to the originally requested destination, capture `blocker.location` before unmounting and pass it to `navigate()`.

A blocked `navigate()` promise settles when confirmation is requested; it does not wait for every approval or for the eventual loader. Fetcher saves and revalidation can continue while blocked. Uninterrupted revalidation preserves consent. An older accepted navigation may still complete while a newer request is blocked; its commit cancels that pending confirmation because the source page changed.

## Browser history and other departures

Back and Forward through router-owned, nonzero history steps use one source restoration and one accepted replay for the entire attempt. Programmatic requests arriving during restoration or an issued replay wait until the browser traversal is reconciled. Rapid repeated native Back/Forward presses, external history entries, and zero-delta history events cannot be reliably blocked.

The hook protects client navigation. It does not intercept fetcher submissions, direct RSC server-function calls, reloads, document navigation, or browser shutdown. Loader/action redirects continue the accepted operation. A direct RSC server-function redirect calls `navigate()` and creates a fresh blockable request; the server function has already run. Independent fetcher or uninterrupted-revalidation redirects cancel paused consent and follow the existing redirect path without another confirmation.

[`unstable_usePrompt`](../api/hooks/usePrompt) uses the same sequential selection and retains its native-dialog limitations. Use [`useBeforeUnload`](../api/hooks/useBeforeUnload) separately for document departures. Applications wanting one consolidated confirmation can continue aggregating their dirty conditions under a single [`useBlocker`](../api/hooks/useBlocker).
