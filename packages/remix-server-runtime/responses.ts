import {
  defer as routerDefer,
  json as routerJson,
  redirect as routerRedirect,
  redirectDocument as routerRedirectDocument,
  type UNSAFE_DeferredData as DeferredData,
  type TrackedPromise,
} from "@remix-run/router";

import { serializeError } from "./errors";
import type { ServerMode } from "./mode";

declare const typedDeferredDataBrand: unique symbol;

export type TypedDeferredData<Data extends Record<string, unknown>> = Pick<
  DeferredData,
  "init"
> & {
  data: Data;
  readonly [typedDeferredDataBrand]: "TypedDeferredData";
};

export type DeferFunction = <Data extends Record<string, unknown>>(
  data: Data,
  init?: number | ResponseInit
) => TypedDeferredData<Data>;

export type JsonFunction = <Data>(
  data: Data,
  init?: number | ResponseInit
) => TypedResponse<Data>;

// must be a type since this is a subtype of response
// interfaces must conform to the types they extend
export type TypedResponse<T = unknown> = Omit<Response, "json"> & {
  json(): Promise<T>;
};

/**
 * This is a shortcut for creating `application/json` responses. Converts `data`
 * to JSON and sets the `Content-Type` header.
 *
 * @see https://remix.run/utils/json
 */
export const json: JsonFunction = (data, init = {}) => {
  return routerJson(data, init);
};

/**
 * This is a shortcut for creating Remix deferred responses
 *
 * @see https://remix.run/utils/defer
 */
export const defer: DeferFunction = (data, init = {}) => {
  return routerDefer(data, init) as unknown as TypedDeferredData<typeof data>;
};

export type RedirectFunction = (
  url: string,
  init?: number | ResponseInit
) => TypedResponse<never>;

/**
 * A redirect response. Sets the status code and the `Location` header.
 * Defaults to "302 Found".
 *
 * @see https://remix.run/utils/redirect
 */
export const redirect: RedirectFunction = (url, init = 302) => {
  return routerRedirect(url, init) as TypedResponse<never>;
};

/**
 * A redirect response that will force a document reload to the new location.
 * Sets the status code and the `Location` header.
 * Defaults to "302 Found".
 *
 * @see https://remix.run/utils/redirect
 */
export const redirectDocument: RedirectFunction = (url, init = 302) => {
  return routerRedirectDocument(url, init) as TypedResponse<never>;
};

export function isDeferredData(value: any): value is DeferredData {
  let deferred: DeferredData = value;
  return (
    deferred &&
    typeof deferred === "object" &&
    typeof deferred.data === "object" &&
    typeof deferred.subscribe === "function" &&
    typeof deferred.cancel === "function" &&
    typeof deferred.resolveData === "function"
  );
}

export function isResponse(value: any): value is Response {
  return (
    value != null &&
    typeof value.status === "number" &&
    typeof value.statusText === "string" &&
    typeof value.headers === "object" &&
    typeof value.body !== "undefined"
  );
}

const redirectStatusCodes = new Set([301, 302, 303, 307, 308]);
export function isRedirectStatusCode(statusCode: number): boolean {
  return redirectStatusCodes.has(statusCode);
}
export function isRedirectResponse(response: Response): boolean {
  return isRedirectStatusCode(response.status);
}

function isTrackedPromise(value: any): value is TrackedPromise {
  return (
    value != null && typeof value.then === "function" && value._tracked === true
  );
}

// TODO: Figure out why ReadableStream types are borked sooooooo badly
// in this file. Probably related to our TS configurations and configs
// bleeding into each other.
const DEFERRED_VALUE_PLACEHOLDER_PREFIX = "__deferred_promise:";
export function createDeferredReadableStream(
  deferredData: DeferredData,
  signal: AbortSignal,
  serverMode: ServerMode
): any {
  let encoder = new TextEncoder();
  let stream = new ReadableStream({
    async start(controller: any) {
      let criticalData: any = {};

      let preresolvedKeys: string[] = [];
      for (let [key, value] of Object.entries(deferredData.data)) {
        if (isTrackedPromise(value)) {
          criticalData[key] = `${DEFERRED_VALUE_PLACEHOLDER_PREFIX}${key}`;
          if (
            typeof value._data !== "undefined" ||
            typeof value._error !== "undefined"
          ) {
            preresolvedKeys.push(key);
          }
        } else {
          criticalData[key] = value;
        }
      }

      // Send the critical data
      controller.enqueue(encoder.encode(JSON.stringify(criticalData) + "\n\n"));

      for (let preresolvedKey of preresolvedKeys) {
        enqueueTrackedPromise(
          controller,
          encoder,
          preresolvedKey,
          deferredData.data[preresolvedKey] as TrackedPromise,
          serverMode
        );
      }

      let unsubscribe = deferredData.subscribe((aborted, settledKey) => {
        if (settledKey) {
          enqueueTrackedPromise(
            controller,
            encoder,
            settledKey,
            deferredData.data[settledKey] as TrackedPromise,
            serverMode
          );
        }
      });
      await deferredData.resolveData(signal);
      unsubscribe();
      controller.close();
    },
  });

  return stream;
}

function enqueueTrackedPromise(
  controller: any,
  encoder: TextEncoder,
  settledKey: string,
  promise: TrackedPromise,
  serverMode: ServerMode
) {
  if ("_error" in promise) {
    controller.enqueue(
      encoder.encode(
        "error:" +
          JSON.stringify({
            [settledKey]:
              promise._error instanceof Error
                ? serializeError(promise._error, serverMode)
                : promise._error,
          }) +
          "\n\n"
      )
    );
  } else {
    controller.enqueue(
      encoder.encode(
        "data:" +
          JSON.stringify({ [settledKey]: promise._data ?? null }) +
          "\n\n"
      )
    );
  }
}
