type AnnotatedPromise = PromiseLike<unknown> & {
  status?: "pending" | "fulfilled" | "rejected";
  value?: unknown;
  reason?: unknown;
};

export function getPromiseResult(
  promise: AnnotatedPromise,
): PromiseSettledResult<unknown> | undefined {
  if (promise.status === "fulfilled") {
    return { status: "fulfilled", value: promise.value };
  }
  if (promise.status === "rejected") {
    return { status: "rejected", reason: promise.reason };
  }
}

let awaitPromises = new WeakMap<
  PromiseLike<unknown>,
  {
    promise: Promise<PromiseSettledResult<unknown>>;
    onError: (error: unknown) => void;
  }
>();

export function getAwaitPromise(
  source: PromiseLike<unknown>,
  onError: (error: unknown) => void,
): Promise<PromiseSettledResult<unknown>> {
  let cached = awaitPromises.get(source);
  if (!cached) {
    // Flight's ReactPromise.then() returns undefined, so normalize it first.
    // Fulfill with a settled result so errorElement also works during SSR,
    // where React error boundaries cannot catch rejected promises.
    let promise = Promise.resolve(source).then(
      (value) => settle({ status: "fulfilled", value }),
      (reason) => {
        let result = settle({ status: "rejected", reason });
        try {
          cached!.onError(reason);
        } catch (error) {
          // Reporting failures must not replace the original rejection.
          console.error("<Await> caught the following error in onError", error);
        }
        return result;
      },
    );
    cached = { promise, onError };
    awaitPromises.set(source, cached);
  } else {
    cached.onError = onError;
  }
  function settle(result: PromiseSettledResult<unknown>) {
    // Expose the result before another source callback can flushSync a render.
    Object.assign(cached!.promise, { status: "fulfilled", value: result });
    return result;
  }
  // A new wrapper must preserve the source's synchronously available result.
  let result = getPromiseResult(source);
  if (result) settle(result);
  return cached.promise;
}
