import type { Readable } from "stream";
import { PassThrough } from "stream";
import type AbortController from "abort-controller";
import FormStream from "form-data";
import type { RequestInfo, RequestInit, Response } from "node-fetch";
import nodeFetch, { Request as NodeRequest } from "node-fetch";

import { FormData as NodeFormData, isFile } from "./formData";
import type { UploadHandler } from "./formData";
import { internalParseFormData } from "./parseMultipartFormData";

export type { HeadersInit, RequestInfo, ResponseInit } from "node-fetch";
export { Headers, Response } from "node-fetch";

function formDataToStream(formData: NodeFormData): FormStream {
  let formStream = new FormStream();

  function toNodeStream(input: any) {
    // The input is either a Node stream or a web stream, if it has
    //  a `on` method it's a node stream so we can just return it
    if (typeof input?.on === "function") {
      return input;
    }

    let passthrough = new PassThrough();
    let stream = input as ReadableStream<any>;
    let reader = stream.getReader();
    reader
      .read()
      .then(async ({ done, value }) => {
        while (!done) {
          passthrough.push(value);
          ({ done, value } = await reader.read());
        }
        passthrough.push(null);
      })
      .catch(error => {
        passthrough.emit("error", error);
      });

    return passthrough;
  }

  for (let [key, value] of formData.entries()) {
    if (typeof value === "string") {
      formStream.append(key, value);
    } else if (isFile(value)) {
      let stream = toNodeStream(value.stream());
      formStream.append(key, stream, {
        filename: value.name,
        contentType: value.type,
        knownLength: value.size
      });
    } else {
      let file = value as File;
      let stream = toNodeStream(file.stream());
      formStream.append(key, stream, {
        filename: "unknown"
      });
    }
  }

  return formStream;
}

interface RemixRequestInit extends RequestInit {
  abortController?: AbortController;
}

class RemixRequest extends NodeRequest {
  private abortController?: AbortController;

  constructor(input: RequestInfo, init?: RemixRequestInit | undefined) {
    if (init?.body instanceof NodeFormData) {
      init = {
        ...init,
        body: formDataToStream(init.body)
      };
    }

    super(input, init);

    let anyInput = input as any;
    let anyInit = init as any;

    this.abortController =
      anyInput?.abortController || anyInit?.abortController;
  }

  async formData(uploadHandler?: UploadHandler): Promise<FormData> {
    let contentType = this.headers.get("Content-Type");
    if (contentType) {
      return await internalParseFormData(
        contentType,
        this.body as Readable,
        this.abortController,
        uploadHandler
      );
    }

    throw new Error("Invalid MIME type");
  }

  clone() {
    return new RemixRequest(super.clone());
  }
}

export { RemixRequest as Request, RemixRequestInit as RequestInit };

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
  init = { compress: false, ...init };

  if (init?.body instanceof NodeFormData) {
    init = {
      ...init,
      body: formDataToStream(init.body)
    };
  }

  // Default to { compress: false } so responses can be proxied through more
  // easily in loaders. Otherwise the response stream encoding will not match
  // the Content-Encoding response header.
  return nodeFetch(input, init);
}
