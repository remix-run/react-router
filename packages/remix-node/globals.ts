import {
  ReadableStream as NodeReadableStream,
  WritableStream as NodeWritableStream,
} from "@remix-run/web-stream";
import { AbortController as NodeAbortController } from "abort-controller";

import { atob, btoa } from "./base64";
import {
  Blob as NodeBlob,
  File as NodeFile,
  FormData as NodeFormData,
  Headers as NodeHeaders,
  Request as NodeRequest,
  Response as NodeResponse,
  fetch as nodeFetch,
} from "./fetch";

declare global {
  namespace NodeJS {
    interface ProcessEnv {
      NODE_ENV: "development" | "production" | "test";
    }

    interface Global {
      atob: typeof atob;
      btoa: typeof btoa;

      Blob: typeof Blob;
      File: typeof File;

      Headers: typeof Headers;
      Request: typeof Request;
      Response: typeof Response;
      fetch: typeof fetch;
      FormData: typeof FormData;

      ReadableStream: typeof ReadableStream;
      WritableStream: typeof WritableStream;

      AbortController: typeof AbortController;
    }
  }
}

export function installGlobals() {
  global.atob = atob;
  global.btoa = btoa;

  global.Blob = NodeBlob;
  global.File = NodeFile;

  global.Headers = NodeHeaders as typeof Headers;
  global.Request = NodeRequest as typeof Request;
  global.Response = NodeResponse as unknown as typeof Response;
  global.fetch = nodeFetch as typeof fetch;
  global.FormData = NodeFormData;

  global.ReadableStream = NodeReadableStream;
  global.WritableStream = NodeWritableStream;

  global.AbortController = global.AbortController || NodeAbortController;
}
