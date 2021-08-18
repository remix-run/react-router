import crypto from "crypto";

import { atob, btoa } from "./base64";
import { Headers, Request, Response, fetch } from "./fetch";

declare global {
  namespace NodeJS {
    interface Global {
      atob: typeof atob;
      btoa: typeof btoa;
      Headers: typeof Headers;
      Request: typeof Request;
      Response: typeof Response;
      fetch: typeof fetch;
      crypto: Crypto;
    }
  }
}

export function installGlobals() {
  global.atob = atob;
  global.btoa = btoa;

  (global as NodeJS.Global).Headers = Headers;
  (global as NodeJS.Global).Request = Request;
  (global as NodeJS.Global).Response = Response;
  (global as NodeJS.Global).fetch = fetch;

  // TODO: Missing types
  // @ts-expect-error
  global.crypto = crypto.webcrypto;
}
