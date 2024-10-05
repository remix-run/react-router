import {
  File as NodeFile,
  fetch as nodeFetch,
  FormData as NodeFormData,
  Headers as NodeHeaders,
  Request as NodeRequest,
  Response as NodeResponse,
} from "undici";
import { webcrypto as nodeWebCrypto } from "node:crypto";

declare global {
  namespace NodeJS {
    interface ProcessEnv {
      NODE_ENV: "development" | "production" | "test";
    }

    interface Global {
      File: typeof File;

      Headers: typeof Headers;
      Request: typeof Request;
      Response: typeof Response;
      fetch: typeof fetch;
      FormData: typeof FormData;

      ReadableStream: typeof ReadableStream;
      WritableStream: typeof WritableStream;

      crypto: typeof nodeWebCrypto;
    }
  }

  interface RequestInit {
    duplex?: "half";
  }
}

export function installGlobals() {
  global.File = NodeFile as unknown as typeof File;
  // @ts-ignore - this shows as an error in VSCode but is not an error via TSC so we can't use `ts-expect-error`
  global.Headers = NodeHeaders;
  // @ts-expect-error - overriding globals
  global.Request = NodeRequest;
  // @ts-expect-error - overriding globals
  global.Response = NodeResponse;
  // @ts-expect-error - overriding globals
  global.fetch = nodeFetch;
  // @ts-expect-error - overriding globals
  global.FormData = NodeFormData;

  if (!global.crypto) {
    // @ts-expect-error - overriding globals
    global.crypto = nodeWebCrypto;
  }
}
