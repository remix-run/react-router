/**
 * A JSON response. Converts `data` to JSON and sets the `Content-Type` header.
 */
export function json<Data>(data: Data, init: number | ResponseInit = {}): Response {
  let responseInit: any = init;
  if (typeof init === "number") {
    responseInit = { status: init };
  }

  let headers = new Headers(responseInit.headers);
  if (!headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json; charset=utf-8");
  }

  return new Response(JSON.stringify(data), {
    ...responseInit,
    headers
  });
}

/**
 * A redirect response. Sets the status code and the `Location` header.
 * Defaults to "302 Found".
 */
export function redirect(
  url: string,
  init: number | ResponseInit = 302
): Response {
  let responseInit: any = init;
  if (typeof init === "number") {
    responseInit = { status: init };
  } else if (typeof responseInit.status === "undefined") {
    responseInit.status = 302;
  }

  let headers = new Headers(responseInit.headers);
  headers.set("Location", url);

  return new Response(null, {
    ...responseInit,
    headers
  });
}
