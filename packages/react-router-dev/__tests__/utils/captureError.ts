class NoErrorThrownError extends Error {}

export default async function captureError(
  erroring: Promise<unknown> | (() => Promise<unknown>)
) {
  try {
    let promise = typeof erroring === "function" ? erroring() : erroring;
    await promise;
    throw new NoErrorThrownError();
  } catch (error: unknown) {
    if (error instanceof NoErrorThrownError) throw error;
    return error;
  }
}
