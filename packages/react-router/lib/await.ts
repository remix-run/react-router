// Cache the wrapper across Suspense retries and shared consumers. Resolving to a
// settled result lets errorElement handle rejections during server rendering,
// where React error boundaries do not catch errors.
let awaitPromises = new WeakMap<
  Promise<unknown>,
  {
    promise: Promise<PromiseSettledResult<unknown>> & {
      status?: string;
      value?: PromiseSettledResult<unknown>;
    };
    onError?: (error: unknown) => void;
  }
>();

export function getAwaitPromise(
  resolve: Promise<unknown>,
  onError?: (error: unknown) => void,
): Promise<PromiseSettledResult<unknown>> {
  let cached = awaitPromises.get(resolve);
  if (!cached) {
    let wrappedPromise = resolve.then(
      (value) => settle({ status: "fulfilled", value }),
      (reason): PromiseSettledResult<unknown> => {
        cached!.onError?.(reason);
        return settle({ status: "rejected", reason });
      },
    );
    function settle(
      result: PromiseSettledResult<unknown>,
    ): PromiseSettledResult<unknown> {
      // Let use() read the result before a later source-promise callback can
      // trigger a render, without waiting for the wrapper's next microtask.
      // https://react.dev/reference/react/use#how-to-implement-a-promise-cache
      Object.assign(wrappedPromise, { value: result, status: "fulfilled" });
      return result;
    }
    cached = { promise: wrappedPromise, onError };
    awaitPromises.set(resolve, cached);
  } else if (onError && !cached.onError) {
    cached.onError = onError;
    // Priming may have handled the rejection before any Await consumed it.
    // Report it asynchronously, once, when its first consumer subscribes.
    if (
      cached.promise.status === "fulfilled" &&
      cached.promise.value?.status === "rejected"
    ) {
      resolve.catch(onError);
    }
  }
  return cached.promise;
}

export function primeHydrationPromises(
  value: unknown,
  seen = new WeakSet<object>(),
): void {
  if (
    value == null ||
    (typeof value !== "object" && typeof value !== "function") ||
    seen.has(value)
  ) {
    return;
  }
  seen.add(value);
  if (value instanceof Promise) {
    getAwaitPromise(value);
    return;
  }
  if (value instanceof Map || value instanceof Set) {
    for (let child of value.values()) {
      primeHydrationPromises(child, seen);
    }
    if (value instanceof Map) {
      for (let key of value.keys()) {
        primeHydrationPromises(key, seen);
      }
    }
    return;
  }
  for (let child of Object.values(value)) {
    primeHydrationPromises(child, seen);
  }
}
