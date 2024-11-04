// eslint-disable-next-line @typescript-eslint/no-unused-vars
import type * as _ from "../global";

export async function createRequestInit(
  request: Request
): Promise<RequestInit> {
  let init: RequestInit = { signal: request.signal };

  if (request.method !== "GET") {
    init.method = request.method;

    let contentType = request.headers.get("Content-Type");

    // Check between word boundaries instead of startsWith() due to the last
    // paragraph of https://httpwg.org/specs/rfc9110.html#field.content-type
    if (contentType && /\bapplication\/json\b/.test(contentType)) {
      init.headers = { "Content-Type": contentType };
      init.body = JSON.stringify(await request.json());
    } else if (contentType && /\btext\/plain\b/.test(contentType)) {
      init.headers = { "Content-Type": contentType };
      init.body = await request.text();
    } else if (
      contentType &&
      /\bapplication\/x-www-form-urlencoded\b/.test(contentType)
    ) {
      init.body = new URLSearchParams(await request.text());
    } else {
      init.body = await request.formData();
    }
  }

  return init;
}
