/**
 * An augmentable interface users can modify in their app-code to opt into
 * future-flag-specific types
 */
export interface Future {}

// prettier-ignore
export type MiddlewareEnabled =
  Future extends { unstable_middleware: infer T extends boolean; } ? T : false
