import {
  Headers as NodeHeaders,
  Request as NodeRequest,
  Response as NodeResponse,
  fetch as nodeFetch
} from "./fetch";

declare global {
  namespace NodeJS {
    interface Global {
      Headers: typeof NodeHeaders;
      Request: typeof NodeRequest;
      Response: typeof NodeResponse;
      fetch: typeof nodeFetch;
    }
  }
}

export function installGlobals() {
  (global as NodeJS.Global).Headers = NodeHeaders;
  (global as NodeJS.Global).Request = NodeRequest;
  (global as NodeJS.Global).Response = NodeResponse;
  (global as NodeJS.Global).fetch = nodeFetch;
}
