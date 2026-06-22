/**
 * @react-router/express v8.0.1
 *
 * Copyright (c) Remix Software Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE.md file in the root directory of this source tree.
 *
 * @license MIT
 */
import { createRequestHandler as createRequestHandler$1 } from "react-router";
import { createReadableStreamFromReadable, writeReadableStreamToWritable } from "@react-router/node";
//#region server.ts
/**
* Returns a request handler for Express that serves the response using Remix.
*/
function createRequestHandler({ build, getLoadContext, mode = process.env.NODE_ENV }) {
	let handleRequest = createRequestHandler$1(build, mode);
	return async (req, res, next) => {
		try {
			await sendRemixResponse(res, await handleRequest(createRemixRequest(req, res), await getLoadContext?.(req, res)));
		} catch (error) {
			next(error);
		}
	};
}
function createRemixHeaders(requestHeaders) {
	let headers = new Headers();
	for (let [key, values] of Object.entries(requestHeaders)) if (values) if (Array.isArray(values)) for (let value of values) headers.append(key, value);
	else headers.set(key, values);
	return headers;
}
function createRemixRequest(req, res) {
	let [, hostnamePortStr] = req.app?.enabled("trust proxy") ? req.get("X-Forwarded-Host")?.split(":") ?? [] : [];
	let [, hostPortStr] = req.get("host")?.split(":") ?? [];
	let hostnamePort = Number.parseInt(hostnamePortStr, 10);
	let hostPort = Number.parseInt(hostPortStr, 10);
	let port = Number.isSafeInteger(hostnamePort) ? hostnamePort : Number.isSafeInteger(hostPort) ? hostPort : "";
	let resolvedHost = `${req.hostname.split(/[\\/?#@]/)[0] || "localhost"}${port ? `:${port}` : ""}`;
	let url = new URL(`${req.protocol}://${resolvedHost}${req.originalUrl}`);
	let controller = new AbortController();
	let init = {
		method: req.method,
		headers: createRemixHeaders(req.headers),
		signal: controller.signal
	};
	res.on("finish", () => controller = null);
	res.on("close", () => controller?.abort());
	if (req.method !== "GET" && req.method !== "HEAD") {
		init.body = createReadableStreamFromReadable(req);
		init.duplex = "half";
	}
	return new Request(url.href, init);
}
async function sendRemixResponse(res, nodeResponse) {
	if (isResponseClosed(res)) {
		await nodeResponse.body?.cancel();
		return;
	}
	res.statusMessage = nodeResponse.statusText;
	res.status(nodeResponse.status);
	for (let [key, value] of nodeResponse.headers.entries()) res.append(key, value);
	if (nodeResponse.headers.get("Content-Type")?.match(/text\/event-stream/i)) res.flushHeaders();
	if (nodeResponse.body) try {
		await writeReadableStreamToWritable(nodeResponse.body, res);
	} catch (error) {
		if (isResponseClosed(res)) return;
		throw error;
	}
	else res.end();
}
function isResponseClosed(res) {
	return res.destroyed || res.writableEnded;
}
//#endregion
export { createRequestHandler };
