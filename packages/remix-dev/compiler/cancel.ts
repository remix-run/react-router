export const CANCEL_PREFIX = "remix-compile-cancel";

export class Cancel extends Error {
  constructor(message: string) {
    super(`${CANCEL_PREFIX}: ${message}`);
  }
}
