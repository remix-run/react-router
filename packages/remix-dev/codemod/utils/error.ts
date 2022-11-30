export class CodemodError extends Error {
  additionalInfo?: string;

  constructor(message: string, additionalInfo?: string) {
    super(message);

    // Show up in console as `CodemodError`, not just `Error`
    this.name = this.constructor.name;

    Error.captureStackTrace(this, this.constructor);

    this.additionalInfo = additionalInfo;
  }
}
