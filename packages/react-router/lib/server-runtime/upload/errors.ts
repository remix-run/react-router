export class MaxPartSizeExceededError extends Error {
  constructor(public field: string, public maxBytes: number) {
    super(`Field "${field}" exceeded upload size of ${maxBytes} bytes.`);
  }
}
