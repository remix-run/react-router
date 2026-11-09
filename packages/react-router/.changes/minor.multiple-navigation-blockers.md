Support multiple `useBlocker` hooks with sequential confirmation in registration order

Each navigation request visits its initial registrations once, using their current predicates when their turns arrive. The selected blocker can cancel the whole attempt with `reset()` or by unmounting. Newly mounted blockers participate in the next request, and callbacks from obsolete confirmations are ignored.
