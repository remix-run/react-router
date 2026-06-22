/**
 * react-router v8.0.1
 *
 * Copyright (c) Remix Software Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE.md file in the root directory of this source tree.
 *
 * @license MIT
 */
//#region vendor/turbo-stream-v2/flatten.ts
const TIME_LIMIT_MS = 1;
const getNow = () => Date.now();
const yieldToMain = () => new Promise((resolve) => setTimeout(resolve, 0));
async function flatten(input) {
	const { indices } = this;
	const existing = indices.get(input);
	if (existing) return [existing];
	if (input === void 0) return -7;
	if (input === null) return -5;
	if (Number.isNaN(input)) return -2;
	if (input === Number.POSITIVE_INFINITY) return -6;
	if (input === Number.NEGATIVE_INFINITY) return -3;
	if (input === 0 && 1 / input < 0) return -4;
	const index = this.index++;
	indices.set(input, index);
	const stack = [[input, index]];
	await stringify.call(this, stack);
	return index;
}
async function stringify(stack) {
	const { deferred, indices, plugins, postPlugins } = this;
	const str = this.stringified;
	let lastYieldTime = getNow();
	const flattenValue = (value) => {
		const existing = indices.get(value);
		if (existing) return [existing];
		if (value === void 0) return -7;
		if (value === null) return -5;
		if (Number.isNaN(value)) return -2;
		if (value === Number.POSITIVE_INFINITY) return -6;
		if (value === Number.NEGATIVE_INFINITY) return -3;
		if (value === 0 && 1 / value < 0) return -4;
		const index = this.index++;
		indices.set(value, index);
		stack.push([value, index]);
		return index;
	};
	let i = 0;
	while (stack.length > 0) {
		const now = getNow();
		if (++i % 6e3 === 0 && now - lastYieldTime >= TIME_LIMIT_MS) {
			await yieldToMain();
			lastYieldTime = getNow();
		}
		const [input, index] = stack.pop();
		const partsForObj = (obj) => Object.keys(obj).map((k) => `"_${flattenValue(k)}":${flattenValue(obj[k])}`).join(",");
		let error = null;
		switch (typeof input) {
			case "boolean":
			case "number":
			case "string":
				str[index] = JSON.stringify(input);
				break;
			case "bigint":
				str[index] = `["B","${input}"]`;
				break;
			case "symbol": {
				const keyFor = Symbol.keyFor(input);
				if (!keyFor) error = /* @__PURE__ */ new Error("Cannot encode symbol unless created with Symbol.for()");
				else str[index] = `["Y",${JSON.stringify(keyFor)}]`;
				break;
			}
			case "object": {
				if (!input) {
					str[index] = `-5`;
					break;
				}
				const isArray = Array.isArray(input);
				let pluginHandled = false;
				if (!isArray && plugins) for (const plugin of plugins) {
					const pluginResult = plugin(input);
					if (Array.isArray(pluginResult)) {
						pluginHandled = true;
						const [pluginIdentifier, ...rest] = pluginResult;
						str[index] = `[${JSON.stringify(pluginIdentifier)}`;
						if (rest.length > 0) str[index] += `,${rest.map((v) => flattenValue(v)).join(",")}`;
						str[index] += "]";
						break;
					}
				}
				if (!pluginHandled) {
					let result = isArray ? "[" : "{";
					if (isArray) {
						for (let i = 0; i < input.length; i++) result += (i ? "," : "") + (i in input ? flattenValue(input[i]) : -1);
						str[index] = `${result}]`;
					} else if (input instanceof Date) {
						const dateTime = input.getTime();
						str[index] = `["D",${Number.isNaN(dateTime) ? JSON.stringify("invalid") : dateTime}]`;
					} else if (input instanceof URL) str[index] = `["U",${JSON.stringify(input.href)}]`;
					else if (input instanceof RegExp) str[index] = `["R",${JSON.stringify(input.source)},${JSON.stringify(input.flags)}]`;
					else if (input instanceof Set) if (input.size > 0) str[index] = `["S",${[...input].map((val) => flattenValue(val)).join(",")}]`;
					else str[index] = `["S"]`;
					else if (input instanceof Map) if (input.size > 0) str[index] = `["M",${[...input].flatMap(([k, v]) => [flattenValue(k), flattenValue(v)]).join(",")}]`;
					else str[index] = `["M"]`;
					else if (input instanceof Promise) {
						str[index] = `["P",${index}]`;
						deferred[index] = input;
					} else if (input instanceof Error) {
						str[index] = `["E",${JSON.stringify(input.message)}`;
						if (input.name !== "Error") str[index] += `,${JSON.stringify(input.name)}`;
						str[index] += "]";
					} else if (Object.getPrototypeOf(input) === null) str[index] = `["N",{${partsForObj(input)}}]`;
					else if (isPlainObject(input)) str[index] = `{${partsForObj(input)}}`;
					else error = /* @__PURE__ */ new Error("Cannot encode object with prototype");
				}
				break;
			}
			default: {
				const isArray = Array.isArray(input);
				let pluginHandled = false;
				if (!isArray && plugins) for (const plugin of plugins) {
					const pluginResult = plugin(input);
					if (Array.isArray(pluginResult)) {
						pluginHandled = true;
						const [pluginIdentifier, ...rest] = pluginResult;
						str[index] = `[${JSON.stringify(pluginIdentifier)}`;
						if (rest.length > 0) str[index] += `,${rest.map((v) => flattenValue(v)).join(",")}`;
						str[index] += "]";
						break;
					}
				}
				if (!pluginHandled) error = /* @__PURE__ */ new Error("Cannot encode function or unexpected type");
			}
		}
		if (error) {
			let pluginHandled = false;
			if (postPlugins) for (const plugin of postPlugins) {
				const pluginResult = plugin(input);
				if (Array.isArray(pluginResult)) {
					pluginHandled = true;
					const [pluginIdentifier, ...rest] = pluginResult;
					str[index] = `[${JSON.stringify(pluginIdentifier)}`;
					if (rest.length > 0) str[index] += `,${rest.map((v) => flattenValue(v)).join(",")}`;
					str[index] += "]";
					break;
				}
			}
			if (!pluginHandled) throw error;
		}
	}
}
const objectProtoNames = Object.getOwnPropertyNames(Object.prototype).sort().join("\0");
function isPlainObject(thing) {
	const proto = Object.getPrototypeOf(thing);
	return proto === Object.prototype || proto === null || Object.getOwnPropertyNames(proto).sort().join("\0") === objectProtoNames;
}
//#endregion
export { flatten };
