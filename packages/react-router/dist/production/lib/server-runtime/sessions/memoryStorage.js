/**
 * react-router v8.1.0
 *
 * Copyright (c) Remix Software Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE.md file in the root directory of this source tree.
 *
 * @license MIT
 */
import { createSessionStorage } from "../sessions.js";
//#region lib/server-runtime/sessions/memoryStorage.ts
/**
* Creates and returns a simple in-memory SessionStorage object, mostly useful
* for testing and as a reference implementation.
*
* Note: This storage does not scale beyond a single process, so it is not
* suitable for most production scenarios.
*/
function createMemorySessionStorage({ cookie } = {}) {
	let map = /* @__PURE__ */ new Map();
	return createSessionStorage({
		cookie,
		async createData(data, expires) {
			let id = Math.random().toString(36).substring(2, 10);
			map.set(id, {
				data,
				expires
			});
			return id;
		},
		async readData(id) {
			if (map.has(id)) {
				let { data, expires } = map.get(id);
				if (!expires || expires > /* @__PURE__ */ new Date()) return data;
				if (expires) map.delete(id);
			}
			return null;
		},
		async updateData(id, data, expires) {
			map.set(id, {
				data,
				expires
			});
		},
		async deleteData(id) {
			map.delete(id);
		}
	});
}
//#endregion
export { createMemorySessionStorage };
