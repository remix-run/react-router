import { AbortController as NodeAbortController } from "abort-controller";

if (!globalThis.fetch) {
  const { TextDecoder, TextEncoder } = require("node:util");
  global.TextDecoder = global.TextDecoder || TextDecoder;
  global.TextEncoder = global.TextEncoder || TextEncoder;

  const { ReadableStream, WritableStream } = require("node:stream/web");
  global.ReadableStream = ReadableStream;
  global.WritableStream = WritableStream;

  const { fetch, FormData, Request, Response, Headers } = require("undici");

  globalThis.fetch = fetch;
  globalThis.Request = Request;
  globalThis.Response = Response;
  globalThis.Headers = Headers;

  global.FormData = global.FormData || FormData;
}

if (!globalThis.AbortController) {
  // @ts-expect-error
  globalThis.AbortController = NodeAbortController;
}
