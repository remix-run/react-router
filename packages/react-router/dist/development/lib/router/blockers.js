/**
 * react-router v8.5.1
 *
 * Copyright (c) Remix Software Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE.md file in the root directory of this source tree.
 *
 * @license MIT
 */
//#region lib/router/blockers.ts
function createBlockerCoordinator({ functions, idle, getBlockers, publish }) {
	let current;
	function clearStates() {
		let blockers = getBlockers();
		if (![...blockers.values()].some((b) => b.state !== "unblocked")) return blockers;
		let next = new Map(blockers);
		next.forEach((_, key) => next.set(key, idle));
		return next;
	}
	function cancel(notify = true) {
		current = void 0;
		if (notify) {
			let blockers = clearStates();
			if (blockers !== getBlockers()) publish(blockers);
		}
	}
	function select(attempt, approvingKey) {
		if (current !== attempt) return false;
		let key;
		while (attempt.remaining.length > 0) {
			let candidate = attempt.remaining.shift();
			if (functions.get(candidate)?.(attempt.args)) {
				key = candidate;
				break;
			}
		}
		if (current !== attempt) return false;
		let blockers = new Map(clearStates());
		attempt.selected = key;
		if (key) {
			let beforeBlock = attempt.beforeBlock;
			attempt.beforeBlock = void 0;
			beforeBlock?.();
			if (current !== attempt) return true;
			let selectedKey = key;
			let isSelected = () => current === attempt && attempt.selected === selectedKey && functions.has(selectedKey);
			blockers.set(selectedKey, {
				state: "blocked",
				location: attempt.args.nextLocation,
				proceed() {
					if (!isSelected()) return;
					if (!select(attempt, selectedKey)) resume(attempt);
				},
				reset() {
					if (isSelected()) cancel();
				}
			});
			publish(blockers);
			return true;
		}
		if (approvingKey && functions.has(approvingKey)) blockers.set(approvingKey, {
			state: "proceeding",
			location: attempt.args.nextLocation,
			proceed: void 0,
			reset: void 0
		});
		if ([...getBlockers().values()].some((b) => b.state !== "unblocked") || approvingKey) publish(blockers);
		return false;
	}
	function resume(attempt) {
		if (current !== attempt) return;
		attempt.resume(() => {
			if (current !== attempt) return false;
			current = void 0;
			return true;
		});
	}
	function block(args, continuation, beforeBlock) {
		cancel(false);
		let attempt = {
			args,
			remaining: [...functions.keys()],
			resume: continuation,
			beforeBlock
		};
		current = attempt;
		if (select(attempt)) return true;
		if (current !== attempt) return true;
		current = void 0;
		return false;
	}
	function deleted(key) {
		let wasSelected = current?.selected === key;
		if (wasSelected) cancel(false);
		else if (current) current.remaining = current.remaining.filter((candidate) => candidate !== key);
		let blockers = new Map(wasSelected ? clearStates() : getBlockers());
		blockers.delete(key);
		publish(blockers);
	}
	return {
		block,
		cancel,
		deleted
	};
}
//#endregion
export { createBlockerCoordinator };
