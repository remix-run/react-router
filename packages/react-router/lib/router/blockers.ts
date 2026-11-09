import type { Blocker, BlockerFunction } from "./router";
import type { Location, Action } from "./history";

interface BlockerIntent {
  args: Parameters<BlockerFunction>[0];
  approved: Set<string>;
  selected?: string;
  selection: number;
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
  let current: BlockerIntent | undefined;

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

  function select(intent: BlockerIntent, approvingKey?: string): boolean {
    if (current !== intent) return false;
    let key: string | undefined;
    for (let [candidate, fn] of [...functions]) {
      if (!intent.approved.has(candidate) && fn(intent.args)) {
        key = candidate;
        break;
      }
    }
    if (current !== intent) return false;

    let blockers = new Map(clearStates());
    intent.selected = key;
    let selection = ++intent.selection;
    if (key) {
      let beforeBlock = intent.beforeBlock;
      intent.beforeBlock = undefined;
      beforeBlock?.();
      if (current !== intent) return true;
      let selectedKey = key;
      let isSelected = () =>
        current === intent &&
        intent.selected === selectedKey &&
        intent.selection === selection &&
        functions.has(selectedKey);
      blockers.set(selectedKey, {
        state: "blocked",
        location: intent.args.nextLocation,
        proceed() {
          if (!isSelected()) return;
          intent.approved.add(selectedKey);
          if (!select(intent, selectedKey)) resume(intent);
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
        location: intent.args.nextLocation,
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

  function resume(intent: BlockerIntent) {
    if (current !== intent) return;
    intent.resume(() => {
      if (current !== intent) return false;
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
    let intent: BlockerIntent = {
      args,
      approved: new Set(),
      selection: 0,
      resume: continuation,
      beforeBlock,
    };
    current = intent;
    if (select(intent)) return true;
    if (current !== intent) return true;
    // The caller owns the initially unblocked navigation.
    current = undefined;
    return false;
  }

  function deleted(key: string) {
    let intent = current;
    if (!intent) return;
    intent.approved.delete(key);
    if (intent.selected !== key) return;
    intent.selected = undefined;
    ++intent.selection;
    // React may clean up and reconnect effects in the same commit. Wait until
    // their registrations settle before treating removal as permission to leave.
    queueMicrotask(() => {
      if (current === intent && intent.selected === undefined) {
        if (!select(intent)) resume(intent);
      }
    });
  }

  return { block, cancel, deleted };
}
