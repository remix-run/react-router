import {
  ReadableStream,
  TextDecoderStream,
  TextEncoderStream,
  TransformStream,
  WritableStream,
} from "node:stream/web";
import { TextDecoder, TextEncoder } from "node:util";

// https://reactjs.org/blog/2022/03/08/react-18-upgrade-guide.html#configuring-your-testing-environment
globalThis.IS_REACT_ACT_ENVIRONMENT = true;

if (!globalThis.TextEncoder || !globalThis.TextDecoder) {
  globalThis.TextEncoder = TextEncoder;
  globalThis.TextDecoder = TextDecoder;
}

if (!globalThis.ReadableStream || !globalThis.WritableStream) {
  globalThis.ReadableStream = ReadableStream;
  globalThis.WritableStream = WritableStream;
}

if (!globalThis.fetch) {
  let {
    fetch: undiciFetch,
    FormData: UndiciFormData,
    Headers: UndiciHeaders,
    Request: UndiciRequest,
    Response: UndiciResponse,
  } = await import("undici");

  globalThis.fetch = undiciFetch;
  globalThis.Request = UndiciRequest;
  globalThis.Response = UndiciResponse;
  globalThis.Headers = UndiciHeaders;

  globalThis.FormData = globalThis.FormData || UndiciFormData;
}

if (!globalThis.TextEncoderStream) {
  globalThis.TextEncoderStream = TextEncoderStream;
}

if (!globalThis.TextDecoderStream) {
  globalThis.TextDecoderStream = TextDecoderStream;
}

if (!globalThis.TransformStream) {
  globalThis.TransformStream = TransformStream;
}

const consoleError = console.error;
console.error = (msg, ...args) => {
  if (
    typeof msg === "string" &&
    msg.includes("react-test-renderer is deprecated")
  ) {
    return;
  }
  consoleError.call(console, msg, ...args);
};
