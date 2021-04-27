export interface ComponentDidCatchEmulator {
  error?: SerializedError;
  loaderBoundaryRouteId: string | null;
  // `null` means the app layout threw before any routes rendered
  renderBoundaryRouteId: string | null;
  trackBoundaries: boolean;
}

export interface SerializedError {
  message: string;
  stack?: string;
}

export function serializeError(error: Error): SerializedError {
  return {
    message: error.message,
    stack:
      error.stack &&
      error.stack.replace(
        /\((.+?)\)/g,
        (_match: string, file: string) => `(file://${file})`
      )
  };
}
