
//#region lib/types/serializes-to.d.ts
/**
 * A brand that can be applied to a type to indicate that it will serialize
 * to a specific type when transported to the client from a loader.
 * Only use this if you have additional serialization/deserialization logic
 * in your application.
 */
type unstable_SerializesTo<T> = {
  unstable__ReactRouter_SerializesTo: [T];
};
//#endregion
export { unstable_SerializesTo };