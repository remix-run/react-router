/**
 * react-router v8.4.0
 *
 * Copyright (c) Remix Software Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE.md file in the root directory of this source tree.
 *
 * @license MIT
 */
//#region lib/await.ts
let awaitPromises = /* @__PURE__ */ new WeakMap();
function getAwaitPromise(resolve, onError) {
	let cached = awaitPromises.get(resolve);
	if (!cached) {
		let wrappedPromise = Promise.resolve(resolve).then((value) => settle({
			status: "fulfilled",
			value
		}), (reason) => {
			cached.onError?.(reason);
			return settle({
				status: "rejected",
				reason
			});
		});
		function settle(result) {
			Object.assign(wrappedPromise, {
				value: result,
				status: "fulfilled"
			});
			return result;
		}
		cached = {
			promise: wrappedPromise,
			onError
		};
		awaitPromises.set(resolve, cached);
	} else if (onError && !cached.onError) {
		cached.onError = onError;
		if (cached.promise.status === "fulfilled" && cached.promise.value?.status === "rejected") resolve.catch(onError);
	}
	return cached.promise;
}
function primeHydrationPromises(value, seen = /* @__PURE__ */ new WeakSet()) {
	if (value == null || typeof value !== "object" && typeof value !== "function" || seen.has(value)) return;
	seen.add(value);
	if (value instanceof Promise) {
		getAwaitPromise(value);
		return;
	}
	if (value instanceof Map || value instanceof Set) {
		for (let child of value.values()) primeHydrationPromises(child, seen);
		if (value instanceof Map) for (let key of value.keys()) primeHydrationPromises(key, seen);
		return;
	}
	for (let child of Object.values(value)) primeHydrationPromises(child, seen);
}
//#endregion
export { getAwaitPromise, primeHydrationPromises };
