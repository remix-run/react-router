import fetch, { Request, Response, FormData } from "@web-std/fetch";

if (!globalThis.fetch) {
  globalThis.fetch = fetch;
  globalThis.Request = Request;
  // web-std/fetch Response does not currently implement Response.error()
  // @ts-expect-error
  globalThis.Response = Response;
  globalThis.FormData = FormData;
}
