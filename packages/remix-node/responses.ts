import type { ResponseInit } from "./fetch";
import { Headers, Response } from "./fetch";

/**
 * A JSON response. Converts `data` to JSON and sets the `Content-Type` header.
 */
export function json(data: any, init: number | ResponseInit = {}): Response {
  if (typeof init === "number") {
    init = { status: init };
  }

  let headers = new Headers(init.headers);
  if (!headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json; charset=utf-8");
  }

  return new Response(JSON.stringify(data), { ...init, headers });
}

/**
 * A redirect response. Sets the status code and the `Location` header.
 * Defaults to "302 Found".
 */
export function redirect(
  url: string,
  init: number | ResponseInit = 302
): Response {
  if (typeof init === "number") {
    init = { status: init };
  } else if (typeof init.status === "undefined") {
    init.status = 302;
  }

  let headers = new Headers(init.headers);
  headers.set("Location", url);

  return new Response("", { ...init, headers });
}
