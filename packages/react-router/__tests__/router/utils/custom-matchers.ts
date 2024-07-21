interface CustomMatchers<R = jest.Expect> {
  URL(url: string);
  trackedPromise(data?: any, error?: any, aborted?: boolean): R;
  deferredData(
    done: boolean,
    status?: number,
    headers?: Record<string, string>
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
export function urlMatch(received, url) {
  return {
    message: () => `expected URL ${received.toString()} to equal URL ${url}`,
    pass: received instanceof URL && received.toString() === url,
  };
}
