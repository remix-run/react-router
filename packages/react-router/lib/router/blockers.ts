import type { Blocker, BlockerFunction } from "./router";
import type { Location, Action } from "./history";

interface BlockerAttempt {
  args: Parameters<BlockerFunction>[0];
  remaining: string[];
  selected?: string;
  resume: (take: () => boolean) => void;
  beforeBlock?: () => void;
}

// Consent belongs to one request. Accepted data navigation and browser traversal
// remain owned by the router, rather than by any individual blocker callback.
export function createBlockerCoordinator({
  functions,
  idle,
  getBlockers,
  publish,
}: {
  functions: Map<string, BlockerFunction>;
  idle: Blocker;
  getBlockers: () => Map<string, Blocker>;
  publish: (blockers: Map<string, Blocker>) => void;
}) {
  let current: BlockerAttempt | undefined;

  function clearStates() {
    let blockers = getBlockers();
    if (![...blockers.values()].some((b) => b.state !== "unblocked")) {
      return blockers;
    }
    let next = new Map(blockers);
    next.forEach((_, key) => next.set(key, idle));
    return next;
  }

  function cancel(notify = true) {
    current = undefined;
    if (notify) {
      let blockers = clearStates();
      if (blockers !== getBlockers()) publish(blockers);
    }
  }

  function select(attempt: BlockerAttempt, approvingKey?: string): boolean {
    if (current !== attempt) return false;
    let key: string | undefined;
    while (attempt.remaining.length > 0) {
      let candidate = attempt.remaining.shift()!;
      let fn = functions.get(candidate);
      if (fn?.(attempt.args)) {
        key = candidate;
        break;
      }
    }
    if (current !== attempt) return false;

    let blockers = new Map(clearStates());
    attempt.selected = key;
    if (key) {
      let beforeBlock = attempt.beforeBlock;
      attempt.beforeBlock = undefined;
      beforeBlock?.();
      if (current !== attempt) return true;
      let selectedKey = key;
      let isSelected = () =>
        current === attempt &&
        attempt.selected === selectedKey &&
        functions.has(selectedKey);
      blockers.set(selectedKey, {
        state: "blocked",
        location: attempt.args.nextLocation,
        proceed() {
          if (!isSelected()) return;
          if (!select(attempt, selectedKey)) resume(attempt);
        },
        reset() {
          if (isSelected()) cancel();
        },
      });
      publish(blockers);
      return true;
    }

    if (approvingKey && functions.has(approvingKey)) {
      blockers.set(approvingKey, {
        state: "proceeding",
        location: attempt.args.nextLocation,
        proceed: undefined,
        reset: undefined,
      });
    }
    // Publish before dispatch: a subscriber may supersede this request.
    if (
      [...getBlockers().values()].some((b) => b.state !== "unblocked") ||
      approvingKey
    ) {
      publish(blockers);
    }
    return false;
  }

  function resume(attempt: BlockerAttempt) {
    if (current !== attempt) return;
    attempt.resume(() => {
      if (current !== attempt) return false;
      current = undefined;
      return true;
    });
  }

  function block(
    args: {
      currentLocation: Location;
      nextLocation: Location;
      historyAction: Action;
    },
    continuation: (take: () => boolean) => void,
    beforeBlock?: () => void,
  ) {
    cancel(false);
    let attempt: BlockerAttempt = {
      args,
      remaining: [...functions.keys()],
      resume: continuation,
      beforeBlock,
    };
    current = attempt;
    if (select(attempt)) return true;
    if (current !== attempt) return true;
    // The caller owns the initially unblocked navigation.
    current = undefined;
    return false;
  }

  function deleted(key: string) {
    let wasSelected = current?.selected === key;
    if (wasSelected) {
      // Removing the confirmation discards the attempt; only proceed retries it.
      cancel(false);
    } else if (current) {
      // A new registration reusing this key belongs to the next attempt.
      current.remaining = current.remaining.filter(
        (candidate) => candidate !== key,
      );
    }
    let blockers = new Map(wasSelected ? clearStates() : getBlockers());
    blockers.delete(key);
    publish(blockers);
  }

  return { block, cancel, deleted };
}
