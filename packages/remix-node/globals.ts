import type {
  InternalSignFunctionDoNotUseMe,
  InternalUnsignFunctionDoNotUseMe
} from "@remix-run/server-runtime/cookieSigning";

import { atob, btoa } from "./base64";
import { sign as remixSign, unsign as remixUnsign } from "./cookieSigning";
import {
  Headers as NodeHeaders,
  Request as NodeRequest,
  Response as NodeResponse,
  fetch as nodeFetch
} from "./fetch";

declare global {
  namespace NodeJS {
    interface Global {
      atob: typeof atob;
      btoa: typeof btoa;

      Headers: typeof Headers;
      Request: typeof Request;
      Response: typeof Response;
      fetch: typeof fetch;

      // TODO: Once node v16 is available on AWS we should remove these globals
      // and provide the webcrypto API instead.
      sign: InternalSignFunctionDoNotUseMe;
      unsign: InternalUnsignFunctionDoNotUseMe;
    }
  }
}

export function installGlobals() {
  global.atob = atob;
  global.btoa = btoa;

  global.Headers = (NodeHeaders as unknown) as typeof Headers;
  global.Request = (NodeRequest as unknown) as typeof Request;
  global.Response = (NodeResponse as unknown) as typeof Response;
  global.fetch = (nodeFetch as unknown) as typeof fetch;

  global.sign = remixSign;
  global.unsign = remixUnsign;
}
