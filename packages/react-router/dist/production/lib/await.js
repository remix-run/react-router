/**
 * react-router v8.5.0
 *
 * Copyright (c) Remix Software Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE.md file in the root directory of this source tree.
 *
 * @license MIT
 */
//#region lib/await.ts
function getPromiseResult(promise) {
	if (promise.status === "fulfilled") return {
		status: "fulfilled",
		value: promise.value
	};
	if (promise.status === "rejected") return {
		status: "rejected",
		reason: promise.reason
	};
}
let awaitPromises = /* @__PURE__ */ new WeakMap();
function getAwaitPromise(source, onError) {
	let cached = awaitPromises.get(source);
	if (!cached) {
		cached = {
			promise: Promise.resolve(source).then((value) => settle({
				status: "fulfilled",
				value
			}), (reason) => {
				let result = settle({
					status: "rejected",
					reason
				});
				try {
					cached.onError(reason);
				} catch (error) {
					console.error("<Await> caught the following error in onError", error);
				}
				return result;
			}),
			onError
		};
		awaitPromises.set(source, cached);
	} else cached.onError = onError;
	function settle(result) {
		Object.assign(cached.promise, {
			status: "fulfilled",
			value: result
		});
		return result;
	}
	let result = getPromiseResult(source);
	if (result) settle(result);
	return cached.promise;
}
//#endregion
export { getAwaitPromise, getPromiseResult };
