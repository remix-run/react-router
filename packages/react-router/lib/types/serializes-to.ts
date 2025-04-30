import type { Equal, Expect } from "./utils";

/**
 * A brand that can be applied to a type to indicate that it will serialize
 * to a specific type when transported to the client from a loader.
 * Only use this if you have additional serialization/deserialization logic
 * in your application.
 */
export type unstable_SerializesTo<T> = {
  unstable__ReactRouter_SerializesTo: [T];
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars
type __tests = [
  Expect<
    Equal<
      Record<string, any> extends unstable_SerializesTo<any> ? true : false,
      false
    >
  >
];
