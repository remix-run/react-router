import { atob, btoa } from "./base64";
import { sign, unsign } from "./cookieSigning";
import { Headers, Request, Response, fetch } from "./fetch";

declare global {
  namespace NodeJS {
    type GlobalSignFunc = (value: string, secret: string) => Promise<string>;
    type GlobalUnsignFunc = (
      signed: string,
      secret: string
    ) => Promise<string | false>;

    interface Global {
      atob: typeof atob;
      btoa: typeof btoa;
      Headers: typeof Headers;
      Request: typeof Request;
      Response: typeof Response;
      fetch: typeof fetch;

      // TODO: Once node v16 is available on AWS we should remove these globals
      // and provide the webcrypto API instead.
      sign: GlobalSignFunc;
      unsign: GlobalUnsignFunc;
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

  global.sign = sign;
  global.unsign = unsign;
}
