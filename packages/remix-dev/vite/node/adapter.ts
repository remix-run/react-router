// @ts-nocheck
// adapted from https://github.com/solidjs/solid-start/blob/ccff60ce75e066f6613daf0272dbb43a196235a4/packages/start/node/fetch.js
import { once } from "events";
import { type IncomingMessage, type ServerResponse } from "http";
import multipart from "parse-multipart-data";
import { splitCookiesString } from "set-cookie-parser";
import { Readable } from "stream";
import { File, FormData, Headers, Request as BaseNodeRequest } from "undici";
import { type ServerBuild, installGlobals } from "@remix-run/node";
import { createRequestHandler as createBaseRequestHandler } from "@remix-run/server-runtime";

installGlobals();

function nodeToWeb(nodeStream) {
  let destroyed = false;
  let listeners = {};

  function start(controller) {
    listeners["data"] = onData;
    listeners["end"] = onData;
    listeners["end"] = onDestroy;
    listeners["close"] = onDestroy;
    listeners["error"] = onDestroy;
    for (let name in listeners) nodeStream.on(name, listeners[name]);

    nodeStream.pause();

    function onData(chunk) {
      if (destroyed) return;
      controller.enqueue(chunk);
      nodeStream.pause();
    }

    function onDestroy(err) {
      if (destroyed) return;
      destroyed = true;

      for (let name in listeners)
        nodeStream.removeListener(name, listeners[name]);

      if (err) controller.error(err);
      else controller.close();
    }
  }

  function pull() {
    if (destroyed) return;
    nodeStream.resume();
  }

  function cancel() {
    destroyed = true;

    for (let name in listeners)
      nodeStream.removeListener(name, listeners[name]);

    nodeStream.push(null);
    nodeStream.pause();
    if (nodeStream.destroy) nodeStream.destroy();
    else if (nodeStream.close) nodeStream.close();
  }

  return new ReadableStream({ start: start, pull: pull, cancel: cancel });
}

function createHeaders(requestHeaders) {
  let headers = new Headers();

  for (let [key, values] of Object.entries(requestHeaders)) {
    if (values) {
      if (Array.isArray(values)) {
        for (let value of values) {
          headers.append(key, value);
        }
      } else {
        headers.set(key, values);
      }
    }
  }

  return headers;
}

class NodeRequest extends BaseNodeRequest {
  constructor(input, init) {
    if (init && init.data && init.data.on) {
      init = {
        duplex: "half",
        ...init,
        body: init.data.headers["content-type"]?.includes("x-www")
          ? init.data
          : nodeToWeb(init.data),
      };
    }

    super(input, init);
  }

  // async json() {
  //   return JSON.parse(await this.text());
  // }

  async buffer() {
    return Buffer.from(await super.arrayBuffer());
  }

  // async text() {
  //   return (await this.buffer()).toString();
  // }

  // @ts-ignore
  async formData() {
    if (
      this.headers.get("content-type") === "application/x-www-form-urlencoded"
    ) {
      return await super.formData();
    } else {
      let data = await this.buffer();
      let input = multipart.parse(
        data,
        this.headers
          .get("content-type")
          .replace("multipart/form-data; boundary=", "")
      );
      let form = new FormData();
      input.forEach(({ name, data, filename, type }) => {
        // file fields have Content-Type set,
        // whereas non-file fields must not
        // https://html.spec.whatwg.org/multipage/form-control-infrastructure.html#multipart-form-data
        let isFile = type !== undefined;
        if (isFile) {
          let value = new File([data], filename, { type });
          form.append(name, value, filename);
        } else {
          let value = data.toString("utf-8");
          form.append(name, value);
        }
      });
      return form;
    }
  }

  // @ts-ignore
  clone() {
    /** @type {BaseNodeRequest & { buffer?: () => Promise<Buffer>; formData?: () => Promise<FormData> }}  */
    let el = super.clone();
    el.buffer = this.buffer.bind(el);
    el.formData = this.formData.bind(el);
    return el;
  }
}

function createRequest(req: IncomingMessage): Request {
  let origin =
    req.headers.origin && "null" !== req.headers.origin
      ? req.headers.origin
      : `http://${req.headers.host}`;
  let url = new URL(req.url, origin);

  let init = {
    method: req.method,
    headers: createHeaders(req.headers),
    // https://developer.mozilla.org/en-US/docs/Web/HTTP/Methods
    data: ["POST", "PUT", "DELETE", "PATCH"].includes(req.method) ? req : null,
  };

  return new NodeRequest(url.href, init);
}

// Adapted from more recent version of `handleNodeResponse`:
// https://github.com/solidjs/solid-start/blob/7398163869b489cce503c167e284891cf51a6613/packages/start/node/fetch.js#L162-L185
async function handleNodeResponse(webRes: Response, res: ServerResponse) {
  res.statusCode = webRes.status;
  res.statusMessage = webRes.statusText;

  let cookiesStrings = [];

  for (let [name, value] of webRes.headers) {
    if (name === "set-cookie") {
      cookiesStrings.push(...splitCookiesString(value));
    } else res.setHeader(name, value);
  }

  if (cookiesStrings.length) {
    res.setHeader("set-cookie", cookiesStrings);
  }

  if (webRes.body) {
    let readable = Readable.from(webRes.body);
    readable.pipe(res);
    await once(readable, "end");
  } else {
    res.end();
  }
}

export let createRequestHandler = (
  build: ServerBuild,
  {
    mode = "production",
  }: {
    mode?: string;
  }
) => {
  let handler = createBaseRequestHandler(build, mode);
  return async (req: IncomingMessage, res: ServerResponse) => {
    let request = createRequest(req);
    let response = await handler(request, {});
    handleNodeResponse(response, res);
  };
};
