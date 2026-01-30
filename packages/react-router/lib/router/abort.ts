export function isAbortError(error: unknown, signal: AbortSignal) {
  if (signal.aborted) {
    return true;
  }

  const hasDomException = typeof DOMException !== "undefined";
  const signalReason = signal.reason;

  if (
    hasDomException &&
    signalReason instanceof DOMException &&
    signalReason.name === "AbortError"
  ) {
    return true;
  }
  if (signalReason instanceof Error && signalReason.name === "AbortError") {
    return true;
  }

  if (hasDomException && error instanceof DOMException) {
    return error.name === "AbortError";
  }
  if (error instanceof TypeError) {
    // Fallback for browsers that surface aborted fetches as TypeError
    return /failed to fetch|load failed|network request failed|the operation was aborted/i.test(
      error.message,
    );
  }
  if (error instanceof Error) {
    return error.name === "AbortError";
  }
  return false;
}
