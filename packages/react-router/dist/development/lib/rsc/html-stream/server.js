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
//#region lib/rsc/html-stream/server.ts
const encoder = new TextEncoder();
const trailer = "</body></html>";
function injectRSCPayload(rscStream) {
	let decoder = new TextDecoder();
	let resolveFlightDataPromise;
	let flightDataPromise = new Promise((resolve) => resolveFlightDataPromise = resolve);
	let startedRSC = false;
	let cancelled = false;
	let rscReader = null;
	let buffered = [];
	let timeout = null;
	function flushBufferedChunks(controller) {
		for (let chunk of buffered) {
			let buf = decoder.decode(chunk, { stream: true });
			if (buf.endsWith(trailer)) buf = buf.slice(0, -14);
			controller.enqueue(encoder.encode(buf));
		}
		buffered.length = 0;
		timeout = null;
	}
	return new TransformStream({
		transform(chunk, controller) {
			buffered.push(chunk);
			if (timeout) return;
			timeout = setTimeout(async () => {
				if (cancelled) return;
				flushBufferedChunks(controller);
				if (!startedRSC) {
					startedRSC = true;
					rscReader = rscStream.getReader();
					writeRSCStream(rscReader, controller, () => cancelled).catch((err) => controller.error(err)).then(resolveFlightDataPromise);
				}
			}, 0);
		},
		async flush(controller) {
			await flightDataPromise;
			if (timeout) {
				clearTimeout(timeout);
				flushBufferedChunks(controller);
			}
			controller.enqueue(encoder.encode("</body></html>"));
		},
		async cancel(reason) {
			cancelled = true;
			if (timeout) {
				clearTimeout(timeout);
				timeout = null;
			}
			buffered.length = 0;
			if (rscReader) await rscReader.cancel(reason).catch(() => {});
			else await rscStream.cancel(reason).catch(() => {});
			resolveFlightDataPromise();
		}
	});
}
async function writeRSCStream(reader, controller, isCancelled) {
	let decoder = new TextDecoder("utf-8", { fatal: true });
	try {
		let read;
		while ((read = await reader.read()) && !read.done) {
			if (isCancelled()) return;
			const chunk = read.value;
			try {
				writeChunk(JSON.stringify(decoder.decode(chunk, { stream: true })), controller);
			} catch (e) {
				writeChunk(`Uint8Array.from(atob(${JSON.stringify(btoa(String.fromCodePoint(...chunk)))}), m => m.codePointAt(0))`, controller);
			}
		}
	} finally {
		reader.releaseLock();
	}
	let remaining = decoder.decode();
	if (remaining.length && !isCancelled()) writeChunk(JSON.stringify(remaining), controller);
}
function writeChunk(chunk, controller) {
	controller.enqueue(encoder.encode(`<script>${escapeScript(`(self.__FLIGHT_DATA||=[]).push(${chunk})`)}<\/script>`));
}
function escapeScript(script) {
	return script.replace(/<!--/g, "<\\!--").replace(/<\/(script)/gi, "</\\$1");
}
//#endregion
export { injectRSCPayload };
