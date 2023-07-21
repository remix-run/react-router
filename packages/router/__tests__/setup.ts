import {
  TextEncoder as NodeTextEncoder,
  TextDecoder as NodeTextDecoder,
} from "util";
import { fetch, Request, Response, Headers } from "@remix-run/web-fetch";
import { AbortController as NodeAbortController } from "abort-controller";

if (!globalThis.fetch) {
  // Built-in lib.dom.d.ts expects `fetch(Request | string, ...)` but the web
  // fetch API allows a URL so @remix-run/web-fetch defines
  // `fetch(string | URL | Request, ...)`
  // @ts-expect-error
  globalThis.fetch = fetch;
  // Same as above, lib.dom.d.ts doesn't allow a URL to the Request constructor
  // @ts-expect-error
  globalThis.Request = Request;
  // web-std/fetch Response does not currently implement Response.error()
  // @ts-expect-error
  globalThis.Response = Response;
  globalThis.Headers = Headers;
}

if (!globalThis.AbortController) {
  // @ts-expect-error
  globalThis.AbortController = NodeAbortController;
}

if (!globalThis.TextEncoder || !globalThis.TextDecoder) {
  globalThis.TextEncoder = NodeTextEncoder;
  // @ts-expect-error
  globalThis.TextDecoder = NodeTextDecoder;
}
