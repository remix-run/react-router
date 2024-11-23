interface CustomMatchers<R = jest.Expect> {
  URL(url: string);
  trackedPromise(
    data?: any | undefined,
    error?: any | undefined,
    aborted?: boolean | undefined
  ): R;
  deferredData(
    done: boolean,
    status?: number | undefined,
    headers?: Record<string, string> | undefined
  ): R;
}

declare global {
  namespace jest {
    interface Expect extends CustomMatchers {}
    interface Matchers<R> extends CustomMatchers<R> {}
    interface InverseAsymmetricMatchers extends CustomMatchers {}
  }
}

// Custom matcher for asserting against URLs
export function urlMatch(received: URL, url: string) {
  return {
    message: () => `expected URL ${received.toString()} to equal URL ${url}`,
    pass: received instanceof URL && received.toString() === url,
  };
}
