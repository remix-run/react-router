Support multiple `useBlocker` hooks with sequential confirmation in registration order

Each hook approves the current navigation independently, and any selected blocker can cancel the whole attempt. Unmounted blockers stop applying, and callbacks from obsolete confirmations are ignored.
