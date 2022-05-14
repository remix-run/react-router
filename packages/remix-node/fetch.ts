import type { Readable } from "stream";
import {
  fetch as webFetch,
  Headers as WebHeaders,
  Request as WebRequest,
  Response as WebResponse,
} from "@remix-run/web-fetch";
export { FormData } from "@remix-run/web-fetch";
export { File, Blob } from "@remix-run/web-file";

type NodeHeadersInit = ConstructorParameters<typeof WebHeaders>[0];
type NodeResponseInit = NonNullable<
  ConstructorParameters<typeof WebResponse>[1]
>;
type NodeRequestInfo =
  | ConstructorParameters<typeof WebRequest>[0]
  | NodeRequest;
type NodeRequestInit = Omit<
  NonNullable<ConstructorParameters<typeof WebRequest>[1]>,
  "body"
> & {
  body?:
    | NonNullable<ConstructorParameters<typeof WebRequest>[1]>["body"]
    | Readable;
};

export type {
  NodeHeadersInit as HeadersInit,
  NodeRequestInfo as RequestInfo,
  NodeRequestInit as RequestInit,
  NodeResponseInit as ResponseInit,
};

class NodeRequest extends WebRequest {
  constructor(info: NodeRequestInfo, init?: NodeRequestInit) {
    super(info, init as RequestInit);
  }

  public get headers(): WebHeaders {
    return super.headers as WebHeaders;
  }

  public clone(): NodeRequest {
    return super.clone() as NodeRequest;
  }
}

class NodeResponse extends WebResponse {
  public get headers(): WebHeaders {
    return super.headers as WebHeaders;
  }

  public clone(): NodeResponse {
    return super.clone() as NodeResponse;
  }
}

export {
  WebHeaders as Headers,
  NodeRequest as Request,
  NodeResponse as Response,
};

export const fetch: typeof webFetch = (
  info: NodeRequestInfo,
  init?: NodeRequestInit
) => {
  init = {
    // Disable compression handling so people can return the result of a fetch
    // directly in the loader without messing with the Content-Encoding header.
    compress: false,
    ...init,
  };

  return webFetch(info, init as RequestInit);
};
