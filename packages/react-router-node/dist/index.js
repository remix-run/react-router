/**
 * @react-router/node v8.1.0
 *
 * Copyright (c) Remix Software Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE.md file in the root directory of this source tree.
 *
 * @license MIT
 */
import { createRequestListener as createRequestListener$1 } from "@remix-run/node-fetch-server";
import { createRequestHandler, createSessionStorage } from "react-router";
import { promises } from "node:fs";
import * as path from "node:path";
import { Stream } from "node:stream";
//#region server.ts
/**
* Creates a request listener that handles requests using Node's built-in HTTP server.
*
* @param options Options for creating a request listener.
* @returns A request listener that can be used with `http.createServer`.
*/
function createRequestListener(options) {
	let handleRequest = createRequestHandler(options.build, options.mode);
	return createRequestListener$1(async (request, client) => {
		return handleRequest(request, await options.getLoadContext?.(request, client));
	});
}
//#endregion
//#region sessions/fileStorage.ts
/**
* Creates a SessionStorage that stores session data on a filesystem.
*
* The advantage of using this instead of cookie session storage is that
* files may contain much more data than cookies.
*
* @see https://api.reactrouter.com/v7/functions/_react-router_node.createFileSessionStorage
*/
function createFileSessionStorage({ cookie, dir }) {
	return createSessionStorage({
		cookie,
		async createData(data, expires) {
			let content = JSON.stringify({
				data,
				expires
			});
			while (true) {
				let randomBytes = crypto.getRandomValues(new Uint8Array(8));
				let id = Buffer.from(randomBytes).toString("hex");
				try {
					let file = getFile(dir, id);
					if (!file) throw new Error("Error generating session");
					await promises.mkdir(path.dirname(file), { recursive: true });
					await promises.writeFile(file, content, {
						encoding: "utf-8",
						flag: "wx"
					});
					return id;
				} catch (error) {
					if (error.code !== "EEXIST") throw error;
				}
			}
		},
		async readData(id) {
			try {
				let file = getFile(dir, id);
				if (!file) return null;
				let content = JSON.parse(await promises.readFile(file, "utf-8"));
				let data = content.data;
				let expires = typeof content.expires === "string" ? new Date(content.expires) : null;
				if (!expires || expires > /* @__PURE__ */ new Date()) return data;
				if (expires) await promises.unlink(file);
				return null;
			} catch (error) {
				if (error.code !== "ENOENT") throw error;
				return null;
			}
		},
		async updateData(id, data, expires) {
			let content = JSON.stringify({
				data,
				expires
			});
			let file = getFile(dir, id);
			if (!file) return;
			await promises.mkdir(path.dirname(file), { recursive: true });
			await promises.writeFile(file, content, "utf-8");
		},
		async deleteData(id) {
			if (!id) return;
			let file = getFile(dir, id);
			if (!file) return;
			try {
				await promises.unlink(file);
			} catch (error) {
				if (error.code !== "ENOENT") throw error;
			}
		}
	});
}
function getFile(dir, id) {
	if (!/^[0-9a-f]{16}$/i.test(id)) return null;
	return path.join(dir, id.slice(0, 4), id.slice(4));
}
//#endregion
//#region stream.ts
async function writeReadableStreamToWritable(stream, writable) {
	let reader = stream.getReader();
	let flushable = writable;
	let writableError = monitorWritableError(writable);
	try {
		while (true) {
			writableError.throwIfClosed();
			let { done, value } = await writableError.race(reader.read());
			if (done) {
				writable.end();
				break;
			}
			writableError.throwIfClosed();
			let canContinueWriting = writable.write(value);
			if (typeof flushable.flush === "function") flushable.flush();
			if (!canContinueWriting) await waitForDrain(writable, writableError);
		}
	} catch (error) {
		try {
			reader.cancel(error).catch(() => {});
		} catch {}
		writable.destroy(error);
		throw error;
	} finally {
		writableError.cleanup();
		try {
			reader.releaseLock();
		} catch {}
	}
}
function monitorWritableError(writable) {
	let settled = false;
	let writableError;
	let rejectWritableError;
	let writableErrorPromise = new Promise((_, reject) => {
		rejectWritableError = reject;
	});
	writableErrorPromise.catch(() => {});
	function cleanup() {
		writable.off("error", onError);
		writable.off("close", onClose);
	}
	function reject(error) {
		if (settled) return;
		settled = true;
		writableError = error;
		cleanup();
		rejectWritableError(error);
	}
	function onError(error) {
		reject(error);
	}
	function onClose() {
		reject(/* @__PURE__ */ new Error("Writable closed before stream finished"));
	}
	writable.once("error", onError);
	writable.once("close", onClose);
	return {
		cleanup,
		race(promise) {
			return Promise.race([promise, writableErrorPromise]);
		},
		throwIfClosed() {
			if (writableError) throw writableError;
			if (writable.destroyed || writable.writableEnded) throw new Error("Cannot write to a destroyed or ended writable stream");
		}
	};
}
function waitForDrain(writable, writableError) {
	let cleanup = () => {};
	let drainPromise = new Promise((resolve) => {
		function onDrain() {
			cleanup();
			resolve();
		}
		cleanup = function cleanup() {
			writable.off("drain", onDrain);
		};
		writable.once("drain", onDrain);
	});
	return writableError.race(drainPromise).finally(cleanup);
}
async function writeAsyncIterableToWritable(iterable, writable) {
	let writableError = monitorWritableError(writable);
	let iterator = iterable[Symbol.asyncIterator]();
	let completed = false;
	try {
		while (true) {
			writableError.throwIfClosed();
			let { done, value: chunk } = await writableError.race(iterator.next());
			if (done) {
				completed = true;
				break;
			}
			writableError.throwIfClosed();
			if (!writable.write(chunk)) await waitForDrain(writable, writableError);
		}
		writable.end();
	} catch (error) {
		if (!completed) try {
			Promise.resolve(iterator.return?.()).catch(() => {});
		} catch {}
		writable.destroy(error);
		throw error;
	} finally {
		writableError.cleanup();
	}
}
async function readableStreamToString(stream, encoding) {
	let reader = stream.getReader();
	let chunks = [];
	while (true) {
		let { done, value } = await reader.read();
		if (done) break;
		if (value) chunks.push(value);
	}
	return Buffer.concat(chunks).toString(encoding);
}
const createReadableStreamFromReadable = (source) => {
	let pump = new StreamPump(source);
	return new ReadableStream(pump, pump);
};
var StreamPump = class {
	highWaterMark;
	accumulatedSize;
	stream;
	controller;
	constructor(stream) {
		this.highWaterMark = stream.readableHighWaterMark || new Stream.Readable().readableHighWaterMark;
		this.accumulatedSize = 0;
		this.stream = stream;
		this.enqueue = this.enqueue.bind(this);
		this.error = this.error.bind(this);
		this.close = this.close.bind(this);
	}
	size(chunk) {
		return chunk?.byteLength || 0;
	}
	start(controller) {
		this.controller = controller;
		this.stream.on("data", this.enqueue);
		this.stream.once("error", this.error);
		this.stream.once("end", this.close);
		this.stream.once("close", this.close);
	}
	pull() {
		this.resume();
	}
	cancel(reason) {
		if (this.stream.destroy) this.stream.destroy(reason);
		this.stream.off("data", this.enqueue);
		this.stream.off("error", this.error);
		this.stream.off("end", this.close);
		this.stream.off("close", this.close);
	}
	enqueue(chunk) {
		if (this.controller) try {
			let bytes = typeof chunk === "string" ? Buffer.from(chunk) : new Uint8Array(chunk);
			let available = (this.controller.desiredSize || 0) - bytes.byteLength;
			this.controller.enqueue(bytes);
			if (available <= 0) this.pause();
		} catch (e) {
			this.controller.error(/* @__PURE__ */ new Error("Could not create Buffer, chunk must be of type string or an instance of Buffer, ArrayBuffer, or Array or an Array-like Object"));
			this.cancel();
		}
	}
	pause() {
		if (this.stream.pause) this.stream.pause();
	}
	resume() {
		if (this.stream.readable && this.stream.resume) this.stream.resume();
	}
	close() {
		if (this.controller) {
			this.controller.close();
			delete this.controller;
		}
	}
	error(error) {
		if (this.controller) {
			this.controller.error(error);
			delete this.controller;
		}
	}
};
//#endregion
export { createFileSessionStorage, createReadableStreamFromReadable, createRequestListener, readableStreamToString, writeAsyncIterableToWritable, writeReadableStreamToWritable };
