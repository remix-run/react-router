import type { RequestInfo, RequestInit, Response } from "node-fetch";
import nodeFetch, { Request as NodeRequest } from "node-fetch";

import { RemixFormData } from "./form-data";

export type {
  HeadersInit,
  RequestInfo,
  RequestInit,
  ResponseInit
} from "node-fetch";
export { Headers, Response } from "node-fetch";

export class Request extends NodeRequest {
  constructor(input: RequestInfo, init?: RequestInit | undefined) {
    super(input, init);
  }

  async formData() {
    let body = await this.clone().text();
    return new RemixFormData(body);
  }
}

/**
 * A `fetch` function for node that matches the web Fetch API. Based on
 * `node-fetch`.
 *
 * @see https://github.com/node-fetch/node-fetch
 * @see https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API
 */
export function fetch(
  input: RequestInfo,
  init?: RequestInit
): Promise<Response> {
  // Default to { compress: false } so responses can be proxied through more
  // easily in loaders. Otherwise the response stream encoding will not match
  // the Content-Encoding response header.
  return nodeFetch(input, { compress: false, ...init });
}
