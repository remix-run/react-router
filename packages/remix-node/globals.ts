import {
  File as NodeFile,
  fetch as nodeFetch,
  FormData as NodeFormData,
  Headers as NodeHeaders,
  Request as NodeRequest,
  Response as NodeResponse,
} from "@remix-run/web-fetch";
import {
  ByteLengthQueuingStrategy as NodeByteLengthQueuingStrategy,
  CountQueuingStrategy as NodeCountQueuingStrategy,
  ReadableByteStreamController as NodeReadableByteStreamController,
  ReadableStream as NodeReadableStream,
  ReadableStreamBYOBReader as NodeReadableStreamBYOBReader,
  ReadableStreamBYOBRequest as NodeReadableStreamBYOBRequest,
  ReadableStreamDefaultController as NodeReadableStreamDefaultController,
  ReadableStreamDefaultReader as NodeReadableStreamDefaultReader,
  TransformStream as NodeTransformStream,
  TransformStreamDefaultController as NodeTransformStreamDefaultController,
  WritableStream as NodeWritableStream,
  WritableStreamDefaultController as NodeWritableStreamDefaultController,
  WritableStreamDefaultWriter as NodeWritableStreamDefaultWriter,
} from "@remix-run/web-stream";

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
    }
  }
}

export function installGlobals() {
  global.File = NodeFile;

  global.Headers = NodeHeaders as typeof Headers;
  global.Request = NodeRequest as typeof Request;
  global.Response = NodeResponse as unknown as typeof Response;
  global.fetch = nodeFetch as typeof fetch;
  global.FormData = NodeFormData;

  // Export everything from https://developer.mozilla.org/en-US/docs/Web/API/Streams_API
  global.ByteLengthQueuingStrategy = NodeByteLengthQueuingStrategy;
  global.CountQueuingStrategy = NodeCountQueuingStrategy;
  global.ReadableByteStreamController = NodeReadableByteStreamController;
  global.ReadableStream = NodeReadableStream;
  global.ReadableStreamBYOBReader = NodeReadableStreamBYOBReader;
  global.ReadableStreamBYOBRequest = NodeReadableStreamBYOBRequest;
  global.ReadableStreamDefaultController = NodeReadableStreamDefaultController;
  global.ReadableStreamDefaultReader = NodeReadableStreamDefaultReader;
  global.TransformStream = NodeTransformStream;
  global.TransformStreamDefaultController =
    NodeTransformStreamDefaultController;
  global.WritableStream = NodeWritableStream;
  global.WritableStreamDefaultController = NodeWritableStreamDefaultController;
  global.WritableStreamDefaultWriter = NodeWritableStreamDefaultWriter;
}
