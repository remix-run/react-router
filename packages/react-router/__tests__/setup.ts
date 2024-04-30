// https://reactjs.org/blog/2022/03/08/react-18-upgrade-guide.html#configuring-your-testing-environment
globalThis.IS_REACT_ACT_ENVIRONMENT = true;

if (!globalThis.fetch) {
  const { TextDecoder, TextEncoder } = require("node:util");
  globalThis.TextDecoder = TextDecoder;
  globalThis.TextEncoder = TextEncoder;

  const { ReadableStream, WritableStream } = require("node:stream/web");
  globalThis.ReadableStream = ReadableStream;
  globalThis.WritableStream = WritableStream;

  const { fetch, FormData, Request, Response, Headers } = require("undici");

  globalThis.fetch = fetch;
  globalThis.Request = Request;
  globalThis.Response = Response;
  globalThis.Headers = Headers;

  globalThis.FormData = globalThis.FormData || FormData;
}

if (!globalThis.AbortController) {
  const { AbortController } = require("abort-controller");
  globalThis.AbortController = AbortController;
}

if (!globalThis.TextEncoder || !globalThis.TextDecoder) {
  const { TextDecoder, TextEncoder } = require("node:util");
  globalThis.TextEncoder = TextEncoder;
  globalThis.TextDecoder = TextDecoder;
}
