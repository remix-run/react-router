/**
 * react-router v8.2.0
 *
 * Copyright (c) Remix Software Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE.md file in the root directory of this source tree.
 *
 * @license MIT
 */
import { SUPPORTED_ERROR_TYPES } from "../../lib/router/utils.js";
import { Deferred } from "./utils.js";
//#region vendor/turbo-stream-v2/unflatten.ts
const globalObj = typeof window !== "undefined" ? window : typeof globalThis !== "undefined" ? globalThis : void 0;
function unflatten(parsed) {
	const { hydrated, values } = this;
	if (typeof parsed === "number") return hydrate.call(this, parsed);
	if (!Array.isArray(parsed) || !parsed.length) throw new SyntaxError();
	const startIndex = values.length;
	for (const value of parsed) values.push(value);
	hydrated.length = values.length;
	return hydrate.call(this, startIndex);
}
function hydrate(index) {
	const { hydrated, values, deferred, plugins } = this;
	let result;
	const stack = [[index, (v) => {
		result = v;
	}]];
	let postRun = [];
	while (stack.length > 0) {
		const [index, set] = stack.pop();
		switch (index) {
			case -7:
				set(void 0);
				continue;
			case -5:
				set(null);
				continue;
			case -2:
				set(NaN);
				continue;
			case -6:
				set(Infinity);
				continue;
			case -3:
				set(-Infinity);
				continue;
			case -4:
				set(-0);
				continue;
		}
		if (hydrated[index]) {
			set(hydrated[index]);
			continue;
		}
		const value = values[index];
		if (!value || typeof value !== "object") {
			hydrated[index] = value;
			set(value);
			continue;
		}
		if (Array.isArray(value)) if (typeof value[0] === "string") {
			const [type, b, c] = value;
			switch (type) {
				case "D":
					set(hydrated[index] = new Date(b));
					continue;
				case "U":
					set(hydrated[index] = new URL(b));
					continue;
				case "B":
					set(hydrated[index] = BigInt(b));
					continue;
				case "R":
					set(hydrated[index] = new RegExp(b, c));
					continue;
				case "Y":
					set(hydrated[index] = Symbol.for(b));
					continue;
				case "S":
					const newSet = /* @__PURE__ */ new Set();
					hydrated[index] = newSet;
					for (let i = value.length - 1; i > 0; i--) stack.push([value[i], (v) => {
						newSet.add(v);
					}]);
					set(newSet);
					continue;
				case "M":
					const map = /* @__PURE__ */ new Map();
					hydrated[index] = map;
					for (let i = value.length - 2; i > 0; i -= 2) {
						const r = [];
						stack.push([value[i + 1], (v) => {
							r[1] = v;
						}]);
						stack.push([value[i], (k) => {
							r[0] = k;
						}]);
						postRun.push(() => {
							map.set(r[0], r[1]);
						});
					}
					set(map);
					continue;
				case "N":
					const obj = Object.create(null);
					hydrated[index] = obj;
					for (const key of Object.keys(b).reverse()) {
						const r = [];
						stack.push([b[key], (v) => {
							r[1] = v;
						}]);
						stack.push([Number(key.slice(1)), (k) => {
							r[0] = k;
						}]);
						postRun.push(() => {
							obj[r[0]] = r[1];
						});
					}
					set(obj);
					continue;
				case "P":
					if (hydrated[b]) set(hydrated[index] = hydrated[b]);
					else {
						const d = new Deferred();
						deferred[b] = d;
						set(hydrated[index] = d.promise);
					}
					continue;
				case "E":
					const [, message, errorType] = value;
					let error = errorType && globalObj && SUPPORTED_ERROR_TYPES.includes(errorType) && errorType in globalObj && typeof globalObj[errorType] === "function" ? new globalObj[errorType](message) : new Error(message);
					hydrated[index] = error;
					set(error);
					continue;
				case "Z":
					set(hydrated[index] = hydrated[b]);
					continue;
				default:
					if (Array.isArray(plugins)) {
						const r = [];
						const vals = value.slice(1);
						for (let i = 0; i < vals.length; i++) {
							const v = vals[i];
							stack.push([v, (v) => {
								r[i] = v;
							}]);
						}
						postRun.push(() => {
							for (const plugin of plugins) {
								const result = plugin(value[0], ...r);
								if (result) {
									set(hydrated[index] = result.value);
									return;
								}
							}
							throw new SyntaxError();
						});
						continue;
					}
					throw new SyntaxError();
			}
		} else {
			const array = [];
			hydrated[index] = array;
			for (let i = 0; i < value.length; i++) {
				const n = value[i];
				if (n !== -1) stack.push([n, (v) => {
					array[i] = v;
				}]);
			}
			set(array);
			continue;
		}
		else {
			const object = {};
			hydrated[index] = object;
			for (const key of Object.keys(value).reverse()) {
				const r = [];
				stack.push([value[key], (v) => {
					r[1] = v;
				}]);
				stack.push([Number(key.slice(1)), (k) => {
					r[0] = k;
				}]);
				postRun.push(() => {
					object[r[0]] = r[1];
				});
			}
			set(object);
			continue;
		}
	}
	while (postRun.length > 0) postRun.pop()();
	return result;
}
//#endregion
export { unflatten };
